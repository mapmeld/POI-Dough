/*jshint laxcomma:true */

/**
 * Module dependencies.
 */
var auth = require('./auth')
    , express = require('express')
    , mongoose = require('mongoose')
    , mongoose_auth = require('mongoose-auth')
    , mongoStore = require('connect-mongo')(express)
    , routes = require('./routes')
    , middleware = require('./middleware')

    , poimap = require('./poimap')
    , request = require('request')
    , xml = require('node-xml')
    , procedure = require('./procedure')
    , customgeo = require('./customgeo')
    , canvas = require('canvas')
    , crayon = require('./crayoncanvas')
    ;

var HOUR_IN_MILLISECONDS = 3600000;
var session_store;

var init = exports.init = function (config) {
  
  var db_uri = process.env.MONGOLAB_URI || process.env.MONGODB_URI || config.default_db_uri;

  mongoose.connect(db_uri);
  session_store = new mongoStore({url: db_uri});

  var app = express.createServer();

  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { pretty: true });

    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(express.session({secret: 'top secret', store: session_store,
      cookie: {maxAge: HOUR_IN_MILLISECONDS}}));
    app.use(mongoose_auth.middleware());
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);

  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: false}));
  });
  
  // POI Dough Mark 2
  app.get('/editor', function(req,res) {
    poimap.POIMap.findOne({}, function(err, myEditMap){
      if(!err){
        res.render('poieditor', { poimap: myEditMap });
      }
    });
  });
  
  app.get('/openmap', function(req, res) {
    if(req.query["id"]){
      poimap.POIMap.findById(req.query["id"], function(err, myViewMap){
        if(!err){
          res.render('poiview', { poimap: myViewMap });
        }
      });
    }  
  });

  var basemapProviders = {
    "mapquest": {
      url: "http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png",
      credit: "Map data &copy; 2012 OpenStreetMap contributors, Tiles by MapQuest"
    },
    "mapnik": {
      url: "http://tile.openstreetmap.org/{z}/{x}/{y}.png",
      credit: "Map data &copy; 2012 OpenStreetMap contributors"
    },
    "transit": {
      url: "http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png",
      credit: "Map data &copy; 2012 OpenStreetMap contributors, Tiles by Andy Allan"
    },
    "terrain": {
      url: "http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg",
      credit: "Map data &copy; 2012 OpenStreetMap contributors, Tiles by Stamen Design"
    },
    "watercolor": {
      url: "http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg",
      credit: "Map data &copy; 2012 OpenStreetMap contributors, Tiles by Stamen Design"
    },
    "mapbox": {
      url: "http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png",
      credit: "Map data &copy; 2012 OpenStreetMap contributors, Tiles by MapBox"
    }
  };

  app.get('/savemap', function(req,res) {
    if(req.query["id"]){
      poimap.POIMap.findById(req.query["id"], function(err, myEditMap){
        if(!err){
          if(req.query["bld"]){
            myEditMap.buildings = req.query["bld"].split(",");
          }
          if(req.query["prk"]){
            myEditMap.parks = req.query["prk"].split(",");
          }
          if(req.query["tiler"]){
            myEditMap.basemap = basemapProviders[ req.query["tiler"] ].url;
            myEditMap.attribution = basemapProviders[ req.query["tiler"] ].credit;
          }
          if(req.query["ctr"]){
            myEditMap.center = req.query["ctr"].split(',');
          }
          if(req.query["z"]){
            myEditMap.zoom = req.query["z"];
          }
          myEditMap.updated = new Date();
          myEditMap.save(function (err) {
            if (!err){
              console.log('Success!');
              res.redirect('/openmap?id=' + myEditMap._id);
            }
            else{
              console.log('Fail! ' + err);
            }
          });
        }
      });
    }
    else{
      var myNewMap = new poimap.POIMap({
        buildings : req.query["bld"].split(","),
        parks : req.query["prk"].split(","),
        basemap : basemapProviders[ req.query["tiler"] ].url,
        createdby : "POI Dough Test",
        attribution : basemapProviders[ req.query["tiler"] ].credit,
        updated : new Date(),
        center: req.query["ctr"].split(','),
        zoom: req.query["z"]
      });
      myNewMap.save(function (err) {
        if (!err){
          console.log('Success!');
          res.redirect('/openmap?id=' + myNewMap._id);
        }
        else{
          console.log('Fail! ' + err);
          res.send('Did not save');
        }
      });
    }
  });
  
  app.get('/canvrender*', function(req,res){
    var canv = new canvas(300,300);
    var ctx = canv.getContext('2d');
    var toPixel = function(latlng, ctrlat, ctrlng, scale){
      pix_x_offset = canv.width / 2;
      pix_y_offset = canv.height / 2;  
      var pix_x = Math.round( (latlng[1] - ctrlng) * scale + pix_x_offset);
      var pix_y = Math.round( (ctrlat - latlng[0]) * scale + pix_y_offset);
      return [ pix_x, pix_y ];
    };
    var darken = function(hexcolor){
      var rgb = [
        parseInt(hexcolor.substring(1,3), 16),
        parseInt(hexcolor.substring(3,5), 16),
        parseInt(hexcolor.substring(5), 16)
      ];
      rgb[0] = Math.max(0, parseInt(0.75 * rgb[0]) );
      rgb[1] = Math.max(0, parseInt(0.75 * rgb[1]) );
      rgb[2] = Math.max(0, parseInt(0.75 * rgb[2]) );
      if(rgb[0] < 16){
        rgb[0] = "0" + rgb[0].toString(16);
      }
      else{
        rgb[0] = rgb[0].toString(16);
      }
      if(rgb[1] < 16){
        rgb[1] = "0" + rgb[1].toString(16);
      }
      else{
        rgb[1] = rgb[1].toString(16);
      }
      if(rgb[2] < 16){
        rgb[2] = "0" + rgb[2].toString(16);
      }
      else{
        rgb[2] = rgb[2].toString(16);
      }
      hexcolor = "#" + rgb.join("");
      return hexcolor;
    };
    //ctx.font = '30px Arial';
    //ctx.rotate(0.1);
    //ctx.fillText("Hello World!", 50, 100);
    
    // get the id
    // id=167904069_3Dblock = OSM given style 3Dblock
    // id=poi:4fde8bb4ec55530100000005_2Dpark = custom geo given style 2Dpark
    var poi_id = req.query["id"].split("_")[0];
    var effect = req.query["id"].split("_")[1];
    if(effect.indexOf("3D") > -1){
      var drawBuilding = function(building){
        var color = "#ff0000";
        var roofcolor = "#cccccc";
        // determine boundaries, center of all building sections
        var latmax = -1000;
        var latmin = 1000;
        var lngmax = -1000;
        var lngmin = 1000;
        for(var s=0; s<building.sections.length; s++){
          for(var v=0; v<building.sections[s].vertices.length; v++){
            var pt = building.sections[s].vertices[v];
            latmax = Math.max(latmax, pt[0]);
            latmin = Math.min(latmin, pt[0]);
            lngmax = Math.max(lngmax, pt[1]);
            lngmin = Math.min(lngmin, pt[1]);
          }
        }
        var ctrlat = (latmax + latmin) / 2;
        var ctrlng = (lngmax + lngmin) / 2;
        var center = [ctrlat, ctrlng];
        var latspan = latmax - latmin;
        var lngspan = lngmax - lngmin;
        var levelmax = 0;
        if(latspan > lngspan){
  	      canv.height = parseInt( latspan / lngspan * 300 );
  	      canv.width = 300;
        }
        else{
          canv.height = 300;
  	      canv.width = parseInt( lngspan / latspan * 300 );
        }

        for(var s=0; s<building.sections.length; s++){
          // draw the footprint onto the canvas
          // fetch the canvas context and set color styles
          var pix_x_offset = canv.width * 1 / 2;
          var pix_y_offset = canv.height * 1 / 2;
          levelmax = Math.max(levelmax, building.sections[s].levels);
    
          // set scale in pixels per degree
          var scale = Math.min( ( (canv.width * 1 / 2) - building.sections[s].levels * 8) / (lngmax - lngmin) * 2, (canv.height * 1 / 2 - building.sections[s].levels * 35) / (latmax - latmin) * 2);

          // set a levels offset for this building, tuning based on scale
          var factor = 1;
          if(scale < 120000){
            if(scale < 100000){
              factor = 0.5;
            }
            else{
              factor = 0.75;
            }
          }
          var levels_offset = building.sections[s].levels * 35 * factor;
          var levels_offset_x = building.sections[s].levels * 8 * factor;

          // set offset to [ center_pixel_x, center_pixel_y ] from upper left corner
          var offset = [ (latmax - ctrlat) * scale, (ctrlng - lngmin) * scale ];

          // then draw each foot-point, its corresponding ceiling point, and connections
          // start from the northernmost point and work your way south
          var sorted = building.sections[s].vertices.slice(0);
          sorted.sort( function(pt1, pt2){ return pt2[0] - pt1[0] } );

          for(var v=0; v<sorted.length; v++){
            var at_pt = toPixel( sorted[v], ctrlat, ctrlng, scale );
            var last_pt, next_pt;
            // find points which appeared before and after the current one in SERIES, not in NORTH -> SOUTH
            for(var i=0; i<building.sections[s].vertices.length; i++){
              if(building.sections[s].vertices[i][0] == sorted[v][0]){
	    	    if(building.sections[s].vertices[i][1] == sorted[v][1]){
	    	      if(i != 0){
	    	        last_pt = building.sections[s].vertices[i-1];
	    	      }
		          else{
                    last_pt = building.sections[s].vertices[building.sections[s].vertices.length - 1];
		          }
		          last_pt = toPixel( last_pt, ctrlat, ctrlng, scale );
		          if(i != building.sections[s].vertices.length-1){
    		        next_pt = building.sections[s].vertices[i+1];
    		      }
	    	      else{
		            next_pt = building.sections[s].vertices[0];		    
		          }
		          next_pt = toPixel( next_pt, ctrlat, ctrlng, scale );
		          break;
		        }
		      }
	        }

            // set wall colors
            ctx.strokeStyle = "#000";
            ctx.strokeWidth = 1;
      
            // if the wall is at > 45 degree angle, darken the wall color
            wallSlope = ( at_pt[1] - last_pt[1] ) / ( at_pt[0] - last_pt[0] );
            if(Math.abs( wallSlope ) > 1){
              ctx.fillStyle = darken(color);
            }
            else{
              ctx.fillStyle = color;
            }
            
            // draw previous vertex to current vertex
            ctx.moveTo( last_pt[0], last_pt[1] );
            ctx.beginPath();
            ctx.lineTo( last_pt[0] - levels_offset_x, last_pt[1] - levels_offset );
            ctx.lineTo( at_pt[0] - levels_offset_x, at_pt[1] - levels_offset );
            ctx.lineTo( at_pt[0], at_pt[1] );
            ctx.closePath();
            ctx.fill();
      
            // if the wall is at > 45 degree angle, darken the wall color
            wallSlope = ( at_pt[1] - next_pt[1] ) / ( at_pt[0] - next_pt[0] );
            if(Math.abs( wallSlope ) > 1){
              ctx.fillStyle = darken(color);
            }
            else{
              ctx.fillStyle = color;
            }

            // draw the wall from current vertex to next vertex
            ctx.beginPath();
            ctx.moveTo( at_pt[0], at_pt[1] );
            ctx.lineTo( next_pt[0], next_pt[1] );
            ctx.lineTo( next_pt[0] - levels_offset_x, next_pt[1] - levels_offset );
            ctx.lineTo( at_pt[0] - levels_offset_x, at_pt[1] - levels_offset );
            ctx.closePath();

            // send drawing to canvas
            ctx.fill();
            ctx.stroke();
          }
    
          // set roof colors
          ctx.fillStyle = roofcolor;
          ctx.strokeStyle = "#000";
          ctx.strokeWidth = 2;

          // draw a flat roof for 3D Block
          // more complex roofs benefit by having all ceilings filled in event of failed drawing algorithm
          var roof_start = toPixel( building.sections[s].vertices[0], ctrlat, ctrlng, scale );
          ctx.moveTo( roof_start[0] - levels_offset_x, roof_start[1] - levels_offset );
          ctx.beginPath();
	      for(var i=1; i<building.sections[s].vertices.length; i++){
            var roof_pt = toPixel( building.sections[s].vertices[i], ctrlat, ctrlng, scale );
            ctx.lineTo( roof_pt[0] - levels_offset_x, roof_pt[1] - levels_offset );
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        if(req.url.indexOf(".png") == -1){
          // JavaScript call
          res.send('publishAt("' + poi_id + '","' + canv.toDataURL() + '");');
        }
        else{
          // output PNG image
          res.setHeader('Content-Type', 'image/png');
          res.send( canv.toBuffer() );
        }
      };
      if(poi_id.indexOf("poi:") == 0){
        getCustomGeo( poi_id, "build", { send: drawBuilding } );
      }
      else{
        getShape( poi_id, "build", { send: drawBuilding } );
      }
	}
	else if(effect.indexOf("2D") > -1){
      var ptInPoly = function(pt, polyCords){
        var pointX = pt[0];
        var pointY = pt[1];
    	var i, j, c = 0;
   	    for (i = 0, j = polyCords.length - 1; i < polyCords.length; j = i++){
		  if (((polyCords[i][1] > pointY) != (polyCords[j][1] > pointY)) && (pointX < (polyCords[j][0] - polyCords[i][0]) * (pointY - polyCords[i][1]) / (polyCords[j][1] - polyCords[i][1]) + polyCords[i][0])){
			c = !c;
		  }
	    }
	    return c;
      };
      var drawPark = function(park){
        // determine boundaries, center of park
        var latmax = -1000;
        var latmin = 1000;
        var lngmax = -1000;
        var lngmin = 1000;
        for(var v=0; v<park.vertices.length; v++){
          var pt = park.vertices[v];
          latmax = Math.max(latmax, pt[0]);
          latmin = Math.min(latmin, pt[0]);
          lngmax = Math.max(lngmax, pt[1]);
          lngmin = Math.min(lngmin, pt[1]);
        }
        var ctrlat = (latmax + latmin) / 2;
        var ctrlng = (lngmax + lngmin) / 2;
        var center = [ctrlat, ctrlng];
        var levels = 0;
  
        // set scale in pixels per degree
        var scale = Math.min( ( (canv.width * 1 / 2) - levels * 8) / (lngmax - lngmin) * 2, (canv.height * 1 / 2 - levels * 35) / (latmax - latmin) * 2);

        // set a levels offset for this building, tuning based on scale
        var factor = 1;
        if(scale < 120000){
          if(scale < 100000){
            factor = 0.5;
          }
          else{
            factor = 0.75;
          }
        }
        var levels_offset = levels * 35 * factor;
        var levels_offset_x = levels * 8 * factor;

        // set offset to [ center_pixel_x, center_pixel_y ] from upper left corner
        var offset = [ (latmax - ctrlat) * scale, (ctrlng - lngmin) * scale ];
  
        // draw a solid repeating background of the texture
        for(var x=0; x<canv.width; x+=25){
	      for(var y=0; y<canv.height; y+=25){
	        ctx.drawImage(icon, x, y, 25, 25);
	      }
        }

        // create a mask to hide (alpha=0) pixels outside the polygon
        var poly = park.vertices;
        for(var i=0; i<poly.length; i++){
	      var at_pt = poly[i];
	      at_pt = toPixel( at_pt, ctrlat, ctrlng, scale );
	      poly[i] = at_pt;  // [x, y]
        }
        imgData = ctx.getImageData(0, 0, canv.width, canv.height);
        for(var x=0; x<canv.width; x++){
	      for(var y=0; y<canv.height; y++){
	        if(!ptInPoly([x,y], poly)){
		      imgData.data[y*4*canv.width+x*4+3] = 0;
	        }
	      }
        }
        ctx.putImageData(imgData, 0, 0);
        if(req.url.indexOf(".png") == -1){
          // JavaScript call
          res.send('publishAt("' + poi_id + '","' + canv.toDataURL() + '");');
        }
        else{
          // output PNG image
          res.setHeader('Content-Type', 'image/png');
          res.send( canv.toBuffer() );
        }
      };
      var icon = new canvas.Image;
      icon.onload = function(){
        if(poi_id.indexOf("poi:") == 0){
          getCustomGeo( poi_id, "texture", { send: drawPark } );
        }
        else{
          getShape( poi_id, "texture", { send: drawPark } );
        }
      };
      icon.onerror = function(err){
        throw err;
      };
      icon.src = __dirname + "/public/images/treeblot.png";
	}
  });
  
  function getShape(wayid, format, res){
    var osmurl = 'http://www.openstreetmap.org/api/0.6/way/' + wayid + '/full'

    var requestOptions = {
      'uri': osmurl,
      'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
    };
    
    request(requestOptions, function (err, response, body) {
      //res.send(body);
      var isometric = {
        "wayid": wayid,
        "sections": [{
          "vertices": [ ],
          "levels": 1
        }]
      };
      var park = {
        "wayid": wayid,
        "vertices": [ ]
      };
      var latlngs = { };
      var lastObject = null;
      var parser = new xml.SaxParser(function(alerts){
        alerts.onStartElementNS(function(elem, attarray, prefix, uri, namespaces){
          var attrs = { };
          for(var a=0;a<attarray.length;a++){
            attrs[ attarray[a][0] ] = attarray[a][1];
          }
          if(elem == "node"){
            latlngs[ attrs["id"] ] = [ attrs["lat"] * 1, attrs["lon"] * 1 ];
            lastObject = "node";
          }
          else if(elem == "way"){
            lastObject = "way";
          }
          else if(elem == "nd"){
            isometric.sections[0].vertices.push( latlngs[ attrs["ref"] ] );
            park.vertices.push( latlngs[ attrs["ref"] ] );
          }
          else if(elem == "tag"){
            if(lastObject == "way" && attrs["k"] == "name"){
              isometric.name = attrs["v"];
              park.name = attrs["v"];
            }
          }
        });
        alerts.onEndDocument(function(){
          if(format == "build"){
            res.send(isometric);
          }
          else{
            res.send(park);
          }
        });
      });
      parser.parseString(body);
    });
  }
  
  function getCustomGeo(poi_id, format, res){
    poi_id = poi_id.replace("poi:","");
    
    customgeo.CustomGeo.findById(poi_id, function(err, custompoly){
      if(!custompoly.addedToMap){
        // confirm this polygon is used, so it isn't purged
        custompoly.addedToMap = "yes";
        custompoly.save(function(err){});
      }
      var pts = [ ];
      for(var p=0;p<custompoly.latlngs.length;p++){
        pts.push(custompoly.latlngs[p].split(","));
        pts[pts.length-1][0] *= 1.0;
        pts[pts.length-1][1] *= 1.0;
      }
      if(format == "build"){
        // isometrics request
        res.send({
          customgeoid: custompoly._id,
          wayid: custompoly.sourceid,
          sections: [
            {
              vertices: pts,
              levels: 1
            }
          ]
        });
      }
      else{
        // textures or general shape request
        res.send({
          customgeoid: custompoly._id,
          wayid: custompoly.sourceid,
          vertices: pts
        });
      }
    });
  };
  
  app.get('/customgeo', function(req,res) {
    // store custom polygons
    if(req.query["id"]){
      var poi_id = req.query["id"].replace("poi:","");
      // requesting or updating a polygon
      customgeo.CustomGeo.findById(poi_id, function(err, custompoly){
        if(req.query["pts"]){
          // updating this polygon
          custompoly.latlngs = req.query["pts"].split("|");
          custompoly.updated = new Date();
          custompoly.save(function(err){
            res.send( { id: custompoly._id } );
          });
        }
        else{
          // requesting this polygon
          getCustomGeo( poi_id, req.query["form"], res );
        }
      });
    }
    else{
      // store a new polygon, return id
      var shape = new customgeo.CustomGeo({
        latlngs: req.query["pts"].split("|"),
        updated: new Date(),
        sourceid: req.query["wayid"]
      });
      shape.save(function (err){
        res.send({ id: shape._id });
      });
    }
  });
  
  app.get('/osmbbox', function(req,res) {
    var bbox = req.query["bbox"];
    //var osmurl = 'http://poidough.herokuapp.com/osmbbox/' + bbox;
    var osmurl = 'http://api.openstreetmap.org/api/0.6/map?bbox=' + bbox;
    var requestOptions = {
      'uri': osmurl,
      'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
    };
    request(requestOptions, function (err, response, body) {
      //res.send(body);
      var nodesandways = { nodes:[ ], ways: [ ] };
      var lastObject = null;
      var parser = new xml.SaxParser(function(alerts){
        alerts.onStartElementNS(function(elem, attarray, prefix, uri, namespaces){
          var attrs = { };
          for(var a=0;a<attarray.length;a++){
            attrs[ attarray[a][0] ] = attarray[a][1];
          }
          if(elem == "node"){
            nodesandways.nodes.push( { id: attrs["id"], user: attrs["user"] + "-pt", latlng: [ attrs["lat"], attrs["lon"] ], keys: [ ] } );
            lastObject = nodesandways.nodes[ nodesandways.nodes.length-1 ];
          }
          else if(elem == "way"){
            nodesandways.ways.push( { wayid: attrs["id"], user: attrs["user"], line: [ ], keys: [ ] } );
            lastObject = nodesandways.ways[ nodesandways.ways.length-1 ];
          }
          else if((elem == "tag") && ( lastObject )){
            if(lastObject.id){
              // it's a node, and it should be sent to the user
              if(lastObject.user.indexOf("-pt") > -1){
                lastObject.user = lastObject.user.replace("-pt","");
              }
              lastObject.keys.push({ key: [attrs.k, attrs.v] });
            }
            else if(lastObject.wayid){
              // it's a way!
              lastObject.keys.push({ key: [attrs.k, attrs.v] });
            }
          }
          else if((elem == "nd") && ( lastObject ) && ( lastObject.wayid )){
            for(var n=0;n<nodesandways.nodes.length;n++){
              if(nodesandways.nodes[n].id == attrs["ref"]){
                lastObject.line.push( nodesandways.nodes[n].latlng );
                break;
              }
            }
          }
        });
        alerts.onEndDocument(function(){
          for(var n=nodesandways.nodes.length-1;n>=0;n--){
            if(nodesandways.nodes[n].user.lastIndexOf("-pt") == nodesandways.nodes[n].user.length - 3){
              // point without its own tags
              nodesandways.nodes.splice(n,1);
            }
          }
          res.send( nodesandways );
        });
      });
      parser.parseString(body);
    });
  });

  app.get('/isometrics', function(req,res) {
    // '/isometrics?wayid=WAYID'  
    var wayid = req.query["wayid"]
	if(wayid.indexOf("poi:") > -1){
	  // custom geo
	  res.redirect( '/customgeo?form=build&id=' + wayid );
	  return;
	}
	
	getShape( wayid, "build", res);
  });

  app.get('/textures', function(req,res){

	var wayid = req.query["wayid"];
	if(wayid.indexOf("poi:") > -1){
	  // custom geo
	  res.redirect( '/customgeo?id=' + wayid );
	}
	
	getShape( wayid, "texture", res );
  });
  
  app.get('/reloadmap', function(req, res){
    if(req.query["id"]){
      poimap.POIMap.findById(req.query["id"], function(err, mymap){
        res.send({
          buildings: mymap.buildings,
          parks: mymap.parks,
          center: mymap.center,
          zoom: mymap.zoom,
          basemap: mymap.basemap,
          attribution: mymap.attribution
        });
      });
    }
  });

  // Project Kansas: different procedural buildings / art effects
  // using HTML5 Canvas
  app.get('/kansas', function(req, res){
    if(req.query["id"]){
      procedure.Procedure.findById(req.query["id"], function(err, canvProgram){
        res.render('kansasedit', { program: canvProgram });
      });
    }
    else{
      res.render('kansasedit', { program: { name: "" } });
    }
  });

  function replaceAll(src, oldr, newr){
    while(src.indexOf(oldr) > -1){
      src = src.replace(oldr,newr);
    }
    return src;
  }
  
  app.post('/kansassave', function(req, res){
    var fixedVisuals = [ "4fc578ff59e0840100000005", "4fc57dd891b1ab0100000002", "4fc584dfa2239d0100000001", "4ff4e498970fce0100000003" ];
    if(req.body.id && fixedVisuals.indexOf(req.body.id) == -1){
      // search for dangerous DOM access or annoying alerts before storing any code
      var codescan = replaceAll(replaceAll((req.body.code).toLowerCase()," ",""),"\n","");
      if((codescan.indexOf("document") > -1) || (codescan.indexOf("script") > -1) || (codescan.indexOf("eval") > -1) || (codescan.indexOf("parent") > -1) || (codescan.indexOf("$") > -1) || (codescan.indexOf("jquery") > -1) || (codescan.indexOf("alert") > -1)){
        res.redirect('/kansas')
      }

      // acceptable document - update file
      procedure.Procedure.findById(req.body.id, function(err, canvProgram){
        canvProgram.name = req.body.name;
        canvProgram.code = req.body.code;
        canvProgram.save(function (err) {
          if (!err){
            console.log('Success!');
            res.redirect('/kansas?id=' + canvProgram._id);
          }
          else{
            console.log('Fail! ' + err);
            res.send('Did not save');
          }
        });
      });
    }
    else{
      // creating new procedure
      var myProcedure = new procedure.Procedure({
        name: req.body.name,
        code: req.body.code,
        updated: new Date()
      });
      myProcedure.save(function (err) {
        if (!err){
          console.log('Success!');
          res.redirect('/kansas?id=' + myProcedure._id);
        }
        else{
          console.log('Fail! ' + err);
          res.send('Did not save');
        }
      });
    }
  });
  
  // Export KML with image overlays
  app.get('/export_*.kml', function(req,res){
    var poi_id = req.url.substring( req.url.indexOf("export_") + 7, req.url.indexOf(".kml") );
    poimap.POIMap.findById(poi_id, function(err, myViewMap){
      if(!err){
        // output the KML for this POI Map. Image overlays
        res.setHeader('Content-Type', 'application/kml');
        var kmlintro = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">\n<Document>\n	<name>POI Dough API</name>\n	<Folder id="KMLAPI">\n		<name>KML API Download</name>\n';
        var kmldocs = '';
        var kmlend = '	</Folder>\n</Document>\n</kml>';

        //res.send(kmlintro + kmldocs + kmlend);
        var loadNextWay = function(category, b, shape){
          var latmax, latmin, lngmax, lngmin, shape_id;
          if(category == "build"){
            shape_id = myViewMap.buildings[b];
            latmax = shape.sections[0].vertices[0][0];
            latmin = shape.sections[0].vertices[0][0];
            lngmax = shape.sections[0].vertices[0][1];
            lngmin = shape.sections[0].vertices[0][1];            
            for(var pt=1;pt<shape.sections[0].vertices.length;pt++){
              latmax = Math.max(latmax, shape.sections[0].vertices[pt][0]);
              latmin = Math.min(latmin, shape.sections[0].vertices[pt][0]);
              lngmax = Math.max(lngmax, shape.sections[0].vertices[pt][1]);
              lngmin = Math.min(lngmin, shape.sections[0].vertices[pt][1]);
            }
          }
          else{
            shape_id = myViewMap.parks[b].replace('_','_2D');
            latmax = shape.vertices[0][0];
            latmin = shape.vertices[0][0];
            lngmax = shape.vertices[0][1];
            lngmin = shape.vertices[0][1];            
            for(var pt=1;pt<shape.vertices.length;pt++){
              latmax = Math.max(latmax, shape.vertices[pt][0]);
              latmin = Math.min(latmin, shape.vertices[pt][0]);
              lngmax = Math.max(lngmax, shape.vertices[pt][1]);
              lngmin = Math.min(lngmin, shape.vertices[pt][1]);
            }
          }
          kmldocs += '		<GroundOverlay id="' + shape_id + '">\n';
          kmldocs += '			<name>' + shape_id + '</name>\n';
          kmldocs += '			<visibility>1</visibility>\n';
          kmldocs += '			<color>9effffff</color>\n';
          kmldocs += '			<Icon>\n';
          kmldocs += '				<href>http://poimark2.herokuapp.com/canvrender.png?id=' + shape_id + '</href>\n';
          kmldocs += '				<viewBoundScale>0.75</viewBoundScale>\n';
          kmldocs += '			</Icon>\n';
          kmldocs += '			<LatLonBox>\n';
          kmldocs += '				<north>' + latmax + '</north>\n';
          kmldocs += '				<south>' + latmin + '</south>\n';
          kmldocs += '				<east>' + lngmax + '</east>\n';
          kmldocs += '				<west>' + lngmin + '</west>\n';
          kmldocs += '			</LatLonBox>\n';
          kmldocs += '		</GroundOverlay>\n';
          // determine what happens next
          b++;
          if(category == "build" && myViewMap.buildings.length <= b){
            // ran out of buildings
            if(myViewMap.parks.length > 0){
              // shift to parks
              var wayid = myViewMap.parks[0];
              var custom = false;
              if(wayid.indexOf(":") > -1){
                custom = true;
              }
              if(wayid.indexOf("_") > -1){
                wayid = wayid.split("_")[0];
              }
              if(!custom){
                // standard shape
                getShape(wayid, "park", { send: function(data){ loadNextWay("park",0,data); }});
              }
              else{
                // custom geo
                getCustomGeo(wayid, "park", { send: function(data){ loadNextWay("park",0,data); }});
              }
            }
            else{
              // no parks to add
              res.send(kmlintro + kmldocs + kmlend);
            }
          }
          else if(category == "park" && myViewMap.parks.length <= b){
            // ran out of parks
            res.send(kmlintro + kmldocs + kmlend);
          }
          else{
            var wayid;
            if(category == "build"){
              wayid = myViewMap.buildings[b];
            }
            else if(category == "park"){
              wayid = myViewMap.parks[b];
            }
            var custom = false;
            if(wayid.indexOf(":") > -1){
              custom = true;
            }
            if(wayid.indexOf("_") > -1){
              wayid = wayid.split("_")[0];
            }
            if(!custom){
              // standard shape
              getShape(wayid, category, { send: function(d){ loadNextWay(category,b,d); }});
            }
            else{
              // custom geo
              getCustomGeo(wayid, category, { send: function(d){ loadNextWay(category,b,d); }});
            }
          }
        };
        if(myViewMap.buildings.length > 0){
          var wayid = myViewMap.buildings[0];
          var custom = false;
          if(wayid.indexOf(":") > -1){
            custom = true;
          }
          if(wayid.indexOf("_") > -1){
            wayid = wayid.split("_")[0];
          }
          if(!custom){
            // standard shape
            getShape(wayid, "build", { send: function(data){ loadNextWay("build",0,data); }});
          }
          else{
            // custom geo
            getCustomGeo(wayid, "build", { send: function(data){ loadNextWay("build",0,data); }});
          }
        }
        else if(myViewMap.parks.length > 0){
          // no buildings, just parks
          var wayid = myViewMap.parks[0];
          var custom = false;
          if(wayid.indexOf(":") > -1){
            custom = true;
          }
          if(wayid.indexOf("_") > -1){
            wayid = wayid.split("_")[0];
          }
          if(!custom){
            // standard shape
            getShape(wayid, "park", { send: function(data){ loadNextWay("park",0,data); }});
          }
          else{
            // custom geo
            getCustomGeo(wayid, "park", { send: function(data){ loadNextWay("park",0,data); }});
          }
        }
      }
    });
  });
  
  app.get('/crayontile', function(req, res){
    var x = req.query.x * 1;
    var y = req.query.y * 1;
    var z = req.query.z * 1;
    var maxExtent = {
      "left": -180,
      "right": 180,
      "top": 180,
      "bottom": -180
    };
    var b = 0.70312501193 / Math.pow( 2, (z - 1) );
    var tileExtent = {
      "left": b * 256 * x + maxExtent["left"],
      "right": b * 256 * (x+1) + maxExtent["left"],
      "top": b * -256 * y + maxExtent["top"],
      "bottom": b * -256 * (y+1) + maxExtent["top"]
    };
    var bbox = tileExtent["left"].toFixed(6) + "," + tileExtent["bottom"].toFixed(6) + "," + tileExtent["right"].toFixed(6) + "," + tileExtent["top"].toFixed(6);
    var osmurl = 'http://api.openstreetmap.org/api/0.6/map?bbox=' + bbox;
    var requestOptions = {
      'uri': osmurl,
      'User-Agent': 'Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)'
    };
    request(requestOptions, function (err, response, body) {
      //res.send(body);
      var nodesandways = { nodes:[ ], ways: [ ] };
      var lastObject = null;
      var parser = new xml.SaxParser(function(alerts){
        alerts.onStartElementNS(function(elem, attarray, prefix, uri, namespaces){
          var attrs = { };
          for(var a=0;a<attarray.length;a++){
            attrs[ attarray[a][0] ] = attarray[a][1];
          }
          if(elem == "node"){
            nodesandways.nodes.push( { id: attrs["id"], user: attrs["user"] + "-pt", latlng: [ attrs["lat"], attrs["lon"] ], keys: [ ] } );
            lastObject = nodesandways.nodes[ nodesandways.nodes.length-1 ];
          }
          else if(elem == "way"){
            nodesandways.ways.push( { wayid: attrs["id"], user: attrs["user"], line: [ ], keys: [ ] } );
            lastObject = nodesandways.ways[ nodesandways.ways.length-1 ];
          }
          else if((elem == "tag") && ( lastObject )){
            if(lastObject.id){
              // it's a node, and it should be sent to the user
              if(lastObject.user.indexOf("-pt") > -1){
                lastObject.user = lastObject.user.replace("-pt","");
              }
              lastObject.keys.push({ key: [attrs.k, attrs.v] });
            }
            else if(lastObject.wayid){
              // it's a way!
              lastObject.keys.push({ key: [attrs.k, attrs.v] });
            }
          }
          else if((elem == "nd") && ( lastObject ) && ( lastObject.wayid )){
            for(var n=0;n<nodesandways.nodes.length;n++){
              if(nodesandways.nodes[n].id == attrs["ref"]){
                lastObject.line.push( nodesandways.nodes[n].latlng );
                break;
              }
            }
          }
        });
        alerts.onEndDocument(function(){
          for(var n=nodesandways.nodes.length-1;n>=0;n--){
            if(nodesandways.nodes[n].user.lastIndexOf("-pt") == nodesandways.nodes[n].user.length - 3){
              // point without its own tags
              nodesandways.nodes.splice(n,1);
            }
          }
          //res.send( nodesandways );
    var myWays = nodesandways.ways;
    var wayKey = function(way, key){
    	for(var k=0;k<way.keys.length;k++){
    		if(way.keys[k].key[0] == key){
    			return way.keys[k].key[1];
    		}
    	}
    	return null;
    };
    var lltoxy = function(latlng){
		// convert a lat/lng to the canvas's x/y format
		var lat = latlng[0];
		var lng = latlng[1];
		return [ Math.round(1040 * (lng - tileExtent["left"]) / (tileExtent["right"] - tileExtent["left"])), Math.round(500 * (tileExtent["top"] - lat) / (tileExtent["top"] - tileExtent["bottom"])) ];
	};
	var xyify = function(gpsline){
		// convert a whole array of lat/lngs to the canvas's x/y format
		var drawline = [];
		for(var pt=0;pt<gpsline.length;pt++){
			drawline.push(lltoxy(gpsline[pt]));
		}
		return drawline;
	};
	for(var p=0;p<myWays.length;p++){
		// exclude some types of ways
		if(wayKey( myWays[p], "power") == "line"){
			continue;
		}
		if(wayKey( myWays[p], "landuse") == "commercial"){
			continue;
		}
		// shading of different types of shapes
		if(wayKey( myWays[p], "building"){
			// promote building to linectx layer
			drawShape(linectx, xyify(myWays[p].line),"#A52A2A","#A52A2A");
			continue;
		}
		if(wayKey( myWays[p], "amenity") == "parking"){
			drawShape(shapectx, xyify(myWays[p].line),"#444","#444");
			continue;
		}
		if(wayKey( myWays[p], "waterway") && wayKey(myWays[p], "waterway") != "stream" && wayKey( myWays[p], "waterway") != "river"){
			drawShape(shapectx, xyify(myWays[p].line),"#00f","#33f");
			continue;
		}
		if(wayKey( myWays[p], "natural") == "water"){
			drawShape(shapectx, xyify(myWays[p].line),"#00f","#33f");
			continue;
		}
		if(wayKey( myWays[p], "natural") || wayKey( myWays[p], "landuse") == "conservation" || wayKey( myWays[p], "leisure") == "park"){
			drawShape(shapectx, xyify(myWays[p].line),"#050","#050");
			continue;
		}
		if(wayKey( myWays[p], "leisure") == "recreation_ground" || wayKey(myWays[p], "amenity") == "school"){
			drawShape(shapectx, xyify(myWays[p].line),"#6f6","#6f6");
			continue;
		}
		if(wayKey( myWays[p], "landuse") == "farmland" || wayKey( myWays[p], "landuse") == "farm"){
			drawShape(shapectx, xyify(myWays[p].line),"#050","#050");
			continue;
		}
		if(wayKey( myWays[p], "leisure") == "pitch"){
			drawShape(shapectx, xyify(myWays[p].line),"#f5f","#f5f");
			continue;
		}
		if(wayKey( myWays[p], "landuse") == "residential"){
			drawShape(shapectx, xyify(myWays[p].line),"#777","#777");
			continue;
		}
		// continue for all lines
		for(var pt=1;pt<myWays[p].line.length;pt++){
			var firstpt = lltoxy(myWays[p].line[pt-1]);
			var nextpt = lltoxy(myWays[p].line[pt]);
			// draw tracks and cycleways and footways as orange
			if(wayKey( myWays[p], "highway") == "track" || wayKey( myWays[p], "highway") == "cycleway" || wayKey( myWays[p], "highway") == "footway"){
				drawLine(linectx, firstpt[0], firstpt[1], nextpt[0], nextpt[1], "#fa0", "#fa0", null);
			}
			// draw highways in "big"
			else if(wayKey( myWays[p], "highway") == "motorway"){
				drawLine(linectx, firstpt[0], firstpt[1], nextpt[0], nextpt[1], "#f00", "#f33", "big");
			}
			// draw railways in "dashed"
			else if(wayKey( myWays[p], "railway")){
				drawLine(linectx, firstpt[0], firstpt[1], nextpt[0], nextpt[1], "#666", "#999", "dashed");
			}
			// draw streams in blue
			else if(wayKey( myWays[p], "waterway" )){
				drawLine(linectx, firstpt[0], firstpt[1], nextpt[0], nextpt[1], "#00f", "#33f", null);
			}
			// draw barriers / fences / walls as sharp black lines
			else if(wayKey( myWays[p], "barrier" )){
				linectx.strokeStyle = "#000";
				linectx.moveTo(firstpt[0], firstpt[1]);
				linectx.lineTo(nextpt[0], nextpt[1]);
				linectx.stroke();
			}
			// draw everything else in red crayon
			else{
				drawLine(linectx, firstpt[0], firstpt[1], nextpt[0], nextpt[1], "#f00", "#f33", null);
			}
		}
	}


        });
      });
      parser.parseString(body);
    });
  });


  app.get('/', function(req,res) {
    res.render('poihome', { title: "My Title", app_name: "Test App", comments: [ ] });
  });
  
  // Poang Routes

  app.get('/poang', middleware.require_auth_browser, routes.index);
  app.post('/poang/add_comment',middleware.require_auth_browser, routes.add_comment);
  
  // redirect all non-existent URLs to doesnotexist
  app.get('*', function onNonexistentURL(req,res) {
    res.render('doesnotexist',404);
  });

  mongoose_auth.helpExpress(app);

  return app;
};

// Don't run if require()'d
if (!module.parent) {
  var config = require('./config');
  var app = init(config);
  app.listen(process.env.PORT || 3000);
  console.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}
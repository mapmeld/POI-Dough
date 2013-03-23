var map, baseIcon, miniIcon, activeWay, menuPopup;
var tree, corn, watermelon, coffee;
var promoted = { };
var bopon = [ ];
var extraMapLayer;
var pix_x_offset, pix_y_offset;
var serverDraws = false;

$(document).ready(function(){
  if( (gup("serverdraws") == "true") || (!isCanvasSupported()) ){
    serverDraws = true;
  }
  for(var p=0;p<parkids.length;p++){
    var parkid = parkids[p].split("_")[0];
    fetchPark(parkid, p);
  }
  for(var b=0;b<buildids.length;b++){
    var buildid = buildids[b].split("_")[0];
    fetchBuilding(buildid, b);
  }
  init();
});

function fetchBuilding(buildid, index){
  $.getJSON("/isometrics?wayid=" + buildid, function(data){
    buildings.push(data);
    prepBuilding(buildings.length-1);
    if(buildids[index].indexOf("_") > -1){
      buildings[buildings.length-1].effect = buildids[index].split("_")[1];
    }
    writeBuilding(buildings.length-1);
  });
}
function fetchPark(parkid, index){
  $.getJSON("/textures?wayid=" + parkid, function(data){
    parks.push(data);
    prepPark(parks.length-1);
    if(parkids[index].indexOf("_") > -1){
      parks[parks.length-1].texture = parkids[index].split("_")[1];
    }
    writePark(parks.length-1);
  });
}

function init(){
  var baseMapLayer = new L.TileLayer(tileURL, {maxZoom: 18, attribution: attribution});

  map = new L.Map('map');
  cityll = new L.LatLng(start_pos[0], start_pos[1]);
  map.setView(cityll, start_pos[2]).addLayer(baseMapLayer);
  
  menuPopup = new L.Popup();

  miniIcon = L.Icon.extend({
    iconUrl: "/images/marker-icon.png",
    shadowUrl: "/images/marker-shadow.png",
    iconSize: new L.Point(20, 36),
    shadowSize: new L.Point(25, 30),
    iconAnchor: new L.Point(10, 18),
    popupAnchor: new L.Point(0, -12)
  });

  baseIcon = L.Icon.extend({
    iconUrl: "/images/marker-icon.png",
    shadowUrl: "/images/marker-shadow.png",
    iconSize: new L.Point(30, 36),
    shadowSize: new L.Point(42, 30),
    iconAnchor: new L.Point(15, 18),
    popupAnchor: new L.Point(0, -12)
  });
}

tree = new Image();
tree.src = "../images/treeblot.png";
corn = new Image();
corn.src = "../images/corn.png";
coffee = new Image();
coffee.src = "../images/coffee.png";
watermelon = new Image();
watermelon.src = "../images/watermelon.png";

function prepBuilding(b){
  promoted[ getPromotedId(buildings[b]) ] = { effect: "3Dblock" };
  buildings[b].color = "#ff0000";
  buildings[b].roofcolor = "#cccccc";

  // add a highlightable footprint
  var wll = buildings[b].sections[0].vertices.slice(0);
  for(var j=0;j<wll.length;j++){
    wll[j] = new L.LatLng(wll[j][0], wll[j][1]);
  }
  var activePoly = new L.Polygon( wll, { color: "#00f", fillOpacity: 0.3, opacity: 0.65 } );
  highlight_on_hover(activePoly);

  // determine boundaries, center of all building sections
  var latmax = -1000;
  var latmin = 1000;
  var lngmax = -1000;
  var lngmin = 1000;
  for(var s=0; s<buildings[b].sections.length; s++){
    for(var v=0; v<buildings[b].sections[s].vertices.length; v++){
      var pt = buildings[b].sections[s].vertices[v];
      latmax = Math.max(latmax, pt[0]);
      latmin = Math.min(latmin, pt[0]);
      lngmax = Math.max(lngmax, pt[1]);
      lngmin = Math.min(lngmin, pt[1]);
    }
  }
  var ctrlat = (latmax + latmin) / 2;
  var ctrlng = (lngmax + lngmin) / 2;
  buildings[b].center = [ctrlat, ctrlng];
  buildings[b].latmin = latmin;
  buildings[b].latmax = latmax;
  buildings[b].lngmin = lngmin;
  buildings[b].lngmax = lngmax;
}

function prepPark(p){
  promoted[ getPromotedId( parks[p] ) ] = { effect: parks[p].texture || parks[p].effect || "2Dpark") };
  
  // add a highlightable footprint
  var wll = parks[p].vertices.slice(0);
  for(var j=0;j<wll.length;j++){
    wll[j] = new L.LatLng(wll[j][0], wll[j][1]);
  }
  var activePoly = new L.Polygon( wll, { color: "#00f", fillOpacity: 0.3, opacity: 0.65 } );
  highlight_on_hover(activePoly);

  // determine boundaries, center of park
  var latmax = -1000;
  var latmin = 1000;
  var lngmax = -1000;
  var lngmin = 1000;
  for(var v=0; v<parks[p].vertices.length; v++){
    var pt = parks[p].vertices[v];
    latmax = Math.max(latmax, pt[0]);
    latmin = Math.min(latmin, pt[0]);
    lngmax = Math.max(lngmax, pt[1]);
    lngmin = Math.min(lngmin, pt[1]);
  }
  var ctrlat = (latmax + latmin) / 2;
  var ctrlng = (lngmax + lngmin) / 2;
  parks[p].center = [ctrlat, ctrlng];
  parks[p].latmin = latmin;
  parks[p].latmax = latmax;
  parks[p].lngmin = lngmin;
  parks[p].lngmax = lngmax;
}

function darken(hexcolor){
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
}

var serverDrawBuildings = { };
function publishAt(wayid, imgsrc){
  var imageBounds = serverDrawBuildings[ wayid ].bounds;
  var image = new L.ImageOverlay(imgsrc, imageBounds);
  menu_on_click(image, promoted[ wayid ].osmdata);
  map.addLayer(image);
  promoted[wayid].drawnLayer = image;
}

function isCanvasSupported(){
  var elem = document.createElement('canvas');
  var canvasSupport = !!(elem.getContext && elem.getContext('2d'));
  canvasSupport = (canvasSupport && (navigator.userAgent.toLowerCase().indexOf("android") == -1));
  return canvasSupport;
}

function writeBuilding(b){
  // calculate scale, size, latlng<->pixel constants for this drawing
  var ctrlat = buildings[b].center[0];
  var ctrlng = buildings[b].center[1];
  var latmin = buildings[b].latmin;
  var latmax = buildings[b].latmax;
  var lngmin = buildings[b].lngmin;
  var lngmax = buildings[b].lngmax;
  var latspan = latmax - latmin;
  var lngspan = lngmax - lngmin;
  var levelmax = 0;
  for(var s=0;s<buildings[b].sections.length;s++){
    levelmax = Math.max(levelmax, buildings[b].sections[s].levels);
  }

  // if serverdraws (or IE) then server renders this building
  if(!buildings[b].effect){
    buildings[b].effect = promoted[ getPromotedId( buildings[b] ) ].effect;
  }
  if(serverDraws){
    serverDrawBuildings[ buildings[b].wayid ] = {
      id: buildings[b].wayid,
      bounds: new L.LatLngBounds(
      	new L.LatLng(
      		latmin-latspan/6*Math.pow(1.7,levelmax),
      		lngmin-lngspan/6*Math.pow(1.7,levelmax)
      	),
      	new L.LatLng(
      		latmax+latspan/6*Math.pow(1.7,levelmax),
      		lngmax+lngspan/6*Math.pow(1.7,levelmax)
      	)
      )
    };
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "/canvrender?id=" + buildings[b].wayid + "_" + buildings[b].effect;
    document.body.appendChild(s);
    return;
  }

  var canvas = $('#parkCanvas')[0];
  // experimental: adjust size of shape for extra wide or extra tall buildings
  if(latspan > lngspan){
  	canvas.height = parseInt( latspan / lngspan * 300 );
  	canvas.width = 300;
  }
  else{
    canvas.height = 300;
  	canvas.width = parseInt( lngspan / latspan * 300 );
  }

  for(var s=0; s<buildings[b].sections.length; s++){
    // draw the footprint onto the canvas
    // fetch the canvas context and set color styles
    pix_x_offset = canvas.width * 1 / 2;
    pix_y_offset = canvas.height * 1 / 2;
    
    var ctx = canvas.getContext('2d');

    // set scale in pixels per degree
    var scale = Math.min( ( (canvas.width * 1 / 2) - buildings[b].sections[s].levels * 8) / (lngmax - lngmin) * 2, (canvas.height * 1 / 2 - buildings[b].sections[s].levels * 35) / (latmax - latmin) * 2);

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
    var levels_offset = buildings[b].sections[s].levels * 35 * factor;
    var levels_offset_x = buildings[b].sections[s].levels * 8 * factor;

    // set offset to [ center_pixel_x, center_pixel_y ] from upper left corner
    var offset = [ (latmax - ctrlat) * scale, (ctrlng - lngmin) * scale ];

    // then draw each foot-point, its corresponding ceiling point, and connections
    // start from the northernmost point and work your way south
    var sorted = buildings[b].sections[s].vertices.slice(0);
    sorted.sort( function(pt1, pt2){ return pt2[0] - pt1[0] } );

    for(var v=0; v<sorted.length; v++){
      var at_pt = toPixel( sorted[v], ctrlat, ctrlng, scale );
      var last_pt, next_pt;
      // find points which appeared before and after the current one in SERIES, not in NORTH -> SOUTH
	  for(var i=0; i<buildings[b].sections[s].vertices.length; i++){
        if(buildings[b].sections[s].vertices[i][0] == sorted[v][0]){
		  if(buildings[b].sections[s].vertices[i][1] == sorted[v][1]){
		    if(i != 0){
		      last_pt = buildings[b].sections[s].vertices[i-1];
		    }
		    else{
              last_pt = buildings[b].sections[s].vertices[buildings[b].sections[s].vertices.length - 1];
		    }
		    last_pt = toPixel( last_pt, ctrlat, ctrlng, scale );
		    if(i != buildings[b].sections[s].vertices.length-1){
		      next_pt = buildings[b].sections[s].vertices[i+1];
		    }
		    else{
		      next_pt = buildings[b].sections[s].vertices[0];		    
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
         ctx.fillStyle = darken(buildings[b].color);
      }
      else{
         ctx.fillStyle = buildings[b].color;
      }

	  // draw previous vertex to current vertex
      ctx.moveTo( last_pt[0], last_pt[1] );
      ctx.beginPath();
      ctx.lineTo( last_pt[0] - levels_offset_x, last_pt[1] - levels_offset );
      ctx.lineTo( at_pt[0] - levels_offset_x, at_pt[1] - levels_offset );
      ctx.lineTo( at_pt[0], at_pt[1] );
      ctx.closePath();
      ctx.fill();
      //ctx.stroke();
      
      // if the wall is at > 45 degree angle, darken the wall color
      wallSlope = ( at_pt[1] - next_pt[1] ) / ( at_pt[0] - next_pt[0] );
      if(Math.abs( wallSlope ) > 1){
         ctx.fillStyle = darken(buildings[b].color);
      }
      else{
         ctx.fillStyle = buildings[b].color;
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
	ctx.fillStyle = buildings[b].roofcolor;
    ctx.strokeStyle = "#000";
    ctx.strokeWidth = 2;

    // the 3D roof animation
    if(buildings[b].effect == "3Droof"){
      var roofTip = [0, 0];
      for(var i=0; i<buildings[b].sections[s].vertices.length; i++){
	    var at_pt = buildings[b].sections[s].vertices[i];
	    at_pt = toPixel( at_pt, ctrlat, ctrlng, scale );
        roofTip[0] += at_pt[0] - levels_offset_x;
        roofTip[1] += at_pt[1] - levels_offset;
      }
      roofTip[0] = roofTip[0] / (buildings[b].sections[s].vertices.length);
      roofTip[1] = roofTip[1] / (buildings[b].sections[s].vertices.length);
    
      // draw triangles to form a roof
      for(var i=buildings[b].sections[s].vertices.length-1; i>=0; i--){
      //for(var i=0; i<buildings[b].sections[s].vertices.length; i++){
        var last_pt;
        if(i != 0){
          last_pt = buildings[b].sections[s].vertices[i-1];
        }
        else{
          last_pt = buildings[b].sections[s].vertices[buildings[b].sections[s].vertices.length - 1];
        }
	    last_pt = toPixel( last_pt, ctrlat, ctrlng, scale );
	    var next_pt;
	    if(i != buildings[b].sections[s].vertices.length - 1){
		  next_pt = buildings[b].sections[s].vertices[i+1];
	    }
	    else{
		  next_pt = buildings[b].sections[s].vertices[0];		    
	    }
	    next_pt = toPixel( next_pt, ctrlat, ctrlng, scale );
	    var at_pt = buildings[b].sections[s].vertices[i];
	    at_pt = toPixel( at_pt, ctrlat, ctrlng, scale );
	  
	    // calculate whether the current roofTip can be met without crossing lines
	    var crossesLine = false;
	    // calculate a line to the roofTip
	    var roofLine_m = ((at_pt[1] - levels_offset) - roofTip[1]) / ((at_pt[0] - levels_offset_x) - roofTip[0] );
	    var roofLine_i = (at_pt[1] - levels_offset) - (at_pt[0] - levels_offset_x) * roofLine_m;
	    var newroofTip = roofTip;
	    for(var f=0; f<buildings[b].sections[s].vertices.length; f++){
	      // calculate a line from pt(i) to pt(i+1)
	      var wallLine_a = buildings[b].sections[s].vertices[f];
		  wallLine_a = toPixel( wallLine_a, ctrlat, ctrlng, scale );
		  var wallLibe_b;
		  if(f != buildings[b].sections[s].vertices.length - 1){
	        wallLine_b = buildings[b].sections[s].vertices[f+1];
	      }
	      else{
	        wallLine_b = buildings[b].sections[s].vertices[0];	    
	      }
		  wallLine_b = toPixel( wallLine_b, ctrlat, ctrlng, scale );

	      var wallLine_m = (wallLine_a[1] - wallLine_b[1]) / (wallLine_a[0] - wallLine_b[0]);
	      var wallLine_i = (wallLine_a[1] - levels_offset) - ((wallLine_a[0] - levels_offset_x) * wallLine_m);
	    
	      var intersect_x = (roofLine_i - wallLine_i) / (wallLine_m - roofLine_m);
	      if((intersect_x > wallLine_a[0] + 7 && intersect_x < wallLine_b[0] - 7) || (intersect_x < wallLine_a[0] - 7 && intersect_x > wallLine_b[0] + 7)){
	        // intersect falls on the visible part of the wall
	        if((intersect_x > newroofTip[0] + 7 && intersect_x < at_pt[0] - levels_offset_x - 7) || (intersect_x < newroofTip[0] - 7 && intersect_x > at_pt[0] - levels_offset_x + 7)){
	          // intersect would occur before the roof line met the roof
	          // calculate a roofline halfway between the at_pt corner and the intersection point
	          var newroof_x = (at_pt[0] - levels_offset_x) + 0.5 * ( intersect_x - (at_pt[0] - levels_offset_x) );
	          var intersect_y = intersect_x * wallLine_m + wallLine_i;
	          var newroof_y = (at_pt[1] - levels_offset) + 0.5 * ( intersect_y - (at_pt[1] - levels_offset) );
	          newroofTip = [ newroof_x, newroof_y ];
	        }
	      }
	    }
	  
	    // also move roofTip 50% closer if the current roof tip is too far away (100 pixels)
	    if( Math.pow(newroofTip[1] - (at_pt[1] - levels_offset), 2) + Math.pow(newroofTip[0] - (at_pt[0] - levels_offset_x), 2)  > 10000){
	      var newroof_x = (at_pt[0] - levels_offset_x) + 0.5 * ( roofTip[0] - (at_pt[0] - levels_offset_x) );
	      var newroof_y = (at_pt[1] - levels_offset) + 0.5 * ( roofTip[1] - (at_pt[1] - levels_offset) );
	      newroofTip = [ newroof_x, newroof_y ];
	    }
	  
	    // if the roof was moved, connect last point, old roof, and new roof
	    // at_pt would be in line with the other two, so it wouldn't make a triangle
	    if((newroofTip[0] != roofTip[0]) || (newroofTip[1] != roofTip[1])){
	      // don't draw the connecting panel if it's too big
	      var tooBigPanel = false;
	      if( Math.pow(newroofTip[1] - (last_pt[1] - levels_offset), 2) + Math.pow(newroofTip[0] - (last_pt[0] - levels_offset_x), 2)  > 5000){
	        tooBigPanel = true;
  	      }
	      if( Math.pow(newroofTip[1] - roofTip[1], 2) + Math.pow(newroofTip[0] - roofTip[0], 2)  > 5000){
	        tooBigPanel = true;
  	      }
  	      if(!tooBigPanel){
            ctx.moveTo( newroofTip[0], newroofTip[1] );
            ctx.beginPath();
            ctx.lineTo( parseInt(roofTip[0] - 8 * 0.7), parseInt(roofTip[1] - 35 * 0.7 ) );
            ctx.lineTo( last_pt[0] - levels_offset_x, last_pt[1] - levels_offset );
            ctx.lineTo( parseInt(newroofTip[0] - 8 * 0.7), parseInt(newroofTip[1] - 35 * 0.7)  );
            ctx.closePath();
	        roofTip = newroofTip;
	        ctx.fill();
	        ctx.stroke();
	      }
	    }
	    //roofTip = newroofTip;

        var wallSlope = ( at_pt[1] - last_pt[1] ) / ( at_pt[0] - last_pt[0] );
        if(Math.abs( wallSlope ) > 1){
          ctx.fillStyle = darken(buildings[b].roofcolor);
        }
        else{
		  ctx.fillStyle = buildings[b].roofcolor;
        }

	    // draw triangles to form roof including last_pt
        ctx.moveTo( last_pt[0] - levels_offset_x, last_pt[1] - levels_offset );
        ctx.beginPath();
        ctx.lineTo( parseInt(roofTip[0] - 8 * 0.7), parseInt(roofTip[1] - 35 * 0.7 ) );
        ctx.lineTo( at_pt[0] - levels_offset_x, at_pt[1] - levels_offset );
        ctx.lineTo( last_pt[0] - levels_offset_x, last_pt[1] - levels_offset );
        ctx.closePath();
        // send drawing to canvas
        ctx.fill();
        ctx.stroke();
      }
    }
    else{
      // draw a flat roof for 3D Block
      // more complex roofs benefit by having all ceilings filled in event of failed drawing algorithm
      var roof_start = toPixel( buildings[b].sections[s].vertices[0], ctrlat, ctrlng, scale );
      ctx.moveTo( roof_start[0] - levels_offset_x, roof_start[1] - levels_offset );
      ctx.beginPath();
	  for(var i=1; i<buildings[b].sections[s].vertices.length; i++){
        var roof_pt = toPixel( buildings[b].sections[s].vertices[i], ctrlat, ctrlng, scale );
        ctx.lineTo( roof_pt[0] - levels_offset_x, roof_pt[1] - levels_offset );
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  
  // add to map as image overlay
  var imageBounds = new L.LatLngBounds(new L.LatLng(latmin-latspan/6*Math.pow(1.7,levelmax),lngmin-lngspan/6*Math.pow(1.7,levelmax)), new L.LatLng(latmax+latspan/6*Math.pow(1.7,levelmax),lngmax+lngspan/6*Math.pow(1.7,levelmax)));
  var image = new L.ImageOverlay(canvas.toDataURL(), imageBounds);
  menu_on_click(image, promoted[ getPromotedId( buildings[b] ) ].osmdata);
  map.addLayer(image);
  promoted[ getPromotedId( buildings[b] ) ].drawnLayer = image;
}

function getPromotedId(parkorbuild){
  if(parkorbuild.customgeoid){
    if(promoted["poi:" + parkorbuild.customgeoid]){
      return "poi:" + parkorbuild.customgeoid;
    }
    else{
      return parkorbuild.customgeoid;
    }
  }
  else{
    return parkorbuild.wayid;
  }
}

function writePark(p){
  var ctrlat = parks[p].center[0];
  var ctrlng = parks[p].center[1];
  var latmin = parks[p].latmin;
  var latmax = parks[p].latmax;
  var lngmin = parks[p].lngmin;
  var lngmax = parks[p].lngmax;
  var levels = 0;

  // if serverdraws (or IE) then server renders this park
  if(!parks[p].texture){
    parks[p].texture = promoted[ getPromotedId( parks[p] ) ].effect.replace("2D","");
  }
  if(serverDraws){
    serverDrawBuildings[ parks[p].wayid ] = {
      id: parks[p].wayid,
      bounds: new L.LatLngBounds(new L.LatLng(latmin,lngmin), new L.LatLng(latmax,lngmax))
    };
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "/canvrender?id=" + parks[p].wayid + "_" + promoted[ getPromotedId( parks[p] ) ].effect;
    document.body.appendChild(s);
    return;
  }

  var canvas = $('#parkCanvas')[0];
  canvas.width = 300;
  canvas.height = 300;
  var ctx = canvas.getContext('2d');
  
  // set scale in pixels per degree
  var scale = Math.min( ( (canvas.width * 1 / 2) - levels * 8) / (lngmax - lngmin) * 2, (canvas.height * 1 / 2 - levels * 35) / (latmax - latmin) * 2);

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

  // create a mask to hide (alpha=0) pixels outside the polygon
  var poly = parks[p].vertices;
  for(var i=0; i<poly.length; i++){
	var at_pt = poly[i];
	at_pt = toPixel( at_pt, ctrlat, ctrlng, scale );
	poly[i] = at_pt;  // [x, y]
  }
  
  if(promoted[ getPromotedId( parks[p] ) ].effect.indexOf("kansas") > -1){
    // split off to do kansas rendering
    var brush = promoted[ getPromotedId( parks[p] ) ].effect.split(":")[1];
    if(brushes[brush]){
      brushes[brush]( ctx, poly, "#2A2AA5", "#2A2AA5" );
    }
    else{
      $.getJSON("/kansasexport?id=" + brush, function(data){
        brushes[brush] = eval( data.code );
        brushes[brush]( ctx, poly, "#2A2AA5", "#2A2AA5" );
      });
    }
  }
  else{
    // conventional 2D textures  

    // set icon for 2D texturing
    var icon = tree;
    if(parks[p].texture == "corn"){
    	icon = corn;
    }
    else if(parks[p].texture == "coffee"){
    	icon = coffee;  
    }
    else if(parks[p].texture == "watermelon"){
    	icon = watermelon;
    }
  
    // draw a solid repeating background of the texture
    for(var x=0; x<canvas.width; x+=25){
      for(var y=0; y<canvas.height; y+=25){
	    ctx.drawImage(icon, x, y, 25, 25);
	  }
    }
    imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for(var x=0; x<canvas.width; x++){
	  for(var y=0; y<canvas.height; y++){
	    if(!ptInPoly([x,y], poly)){
		  imgData.data[y*4*canvas.width+x*4+3] = 0;
	    }
	  }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  
  // map the texture with an ImageOverlay
  var latspan = latmax - latmin;
  var lngspan = lngmax - lngmin;
  var latspan = Math.max(latspan, lngspan);
  var lngspan = latspan;
  var imageBounds = new L.LatLngBounds(new L.LatLng(latmin,lngmin), new L.LatLng(latmax,lngmax));
  var image = new L.ImageOverlay(canvas.toDataURL(), imageBounds);
  map.addLayer(image);
  promoted[ getPromotedId( parks[p] ) ].drawnLayer = image;
  
  // experimental (currently not working) make clicking on the ImageOverlay open the info window
  menu_on_click(image, promoted[ getPromotedId( parks[p] ) ].osmdata);
}
function ptInPoly(pt, polyCords){
    var pointX = pt[0];
    var pointY = pt[1];
	var i, j, c = 0;
	for (i = 0, j = polyCords.length - 1; i < polyCords.length; j = i++){
		if (((polyCords[i][1] > pointY) != (polyCords[j][1] > pointY)) && (pointX < (polyCords[j][0] - polyCords[i][0]) * (pointY - polyCords[i][1]) / (polyCords[j][1] - polyCords[i][1]) + polyCords[i][0])){
			c = !c;
		}
	}
	return c;
}
function toPixel(latlng, ctrlat, ctrlng, scale){
  pix_x_offset = document.getElementById("parkCanvas").width / 2;
  pix_y_offset = document.getElementById("parkCanvas").height / 2;  
  var pix_x = Math.round( (latlng[1] - ctrlng) * scale + pix_x_offset);
  var pix_y = Math.round( (ctrlat - latlng[0]) * scale + pix_y_offset);
  return [ pix_x, pix_y ];
}
function bounce_on_hover(m, b){
  m.on('mouseover', function(e){
    var boponalready = false;
    for(var j=0; j<bopon.length; j++){
      if(bopon[j] == m._icon){
        return;
      }
    }
    m._icon.style.borderTopWidth = "0px";
    bopon.push(m._icon);
    bop(m._icon, 0);
  });
}
function bop(icon, frame){
  setTimeout(function(){
    if(frame < 10){
      icon.style.borderTopWidth = frame + "px";
    }
    else{
      icon.style.borderTopWidth = (20 - frame) + "px";
    }
    frame++;
    if(frame < 20){
      bop(icon, frame);
    }
    else{
      for(var b=0; b<bopon.length; b++){
        if(bopon[b] == icon){
          bopon.splice(b, 1);
        }
      }
    }
  }, 40);
}
// send a polygon to make it highlight when hovered on
function highlight_on_hover(p){
  p.on("mouseover", function(e){
    p.setStyle( { color: "#f00" } );
  });
  p.on("mouseout", function(e){
    p.setStyle( { color: "#00f" } );
  });
}
// send a clickable layer and a data object to bind the two
function menu_on_click(p, shard){
  p.on("click", function(e){
    activeWay = shard.wayid;
    menuPopup.setLatLng( p.getBounds().getCenter() );
    var header = '<h3>' + (shard.name || shard.designation || shard.wayid) + '</h3>';
    var effectSelect = '<select onchange="setEffect(activeWay,this.value)"><option value="none">None</option><option value="3Droof">3D Roof</option><option value="3Dblock">3D Block</option><option value="2Dpark">Park</option><option value="2Dcoffee">Coffee</option><option value="2Dcorn">Corn</option><option value="2Dwatermelon">Watermelon</option></select>';
    effectSelect = effectSelect.replace('value="' + promoted[activeWay].effect + '"', 'value="' + promoted[activeWay].effect + '" selected="selected"');
    menuPopup.setContent(header + tableOfData(shard) + effectSelect );
    map.openPopup( menuPopup );
  });
}
function setEffect(wayid, settype){
  if(promoted[wayid].effect == settype){
    // ignore if unchanged effect
    return;
  }
  if(promoted[wayid].drawnLayer){
    // remove previously drawn layer if it exists
    map.removeLayer(promoted[wayid].drawnLayer);
    promoted[wayid].drawnLayer = null;
  }
  if(settype != "none"){
    // hide the highlight polygon for all effects
    promoted[wayid].poly.setStyle( { fillOpacity:0, opacity: 0 } );
  }
  else{
    promoted[wayid].poly.setStyle( { fillOpacity:0.3, opacity: 0.65 } );  
  }
  if(settype.indexOf("3D") > -1){
    var b_index = buildings.length;
    if(!promoted[wayid].building){
      // create listing in building index
      buildings.push({
        wayid: wayid,
    	sections: [{
    		vertices: promoted[wayid].osmdata.line.slice(0),
    		levels: 1
    	}],
    	color: "#ff0000",
    	roofcolor: "#cccccc",
    	effect: settype
      });
      prepBuilding(buildings.length-1);
    }
    else{
      // find building in building index, if it already exists
      for(var b=0;b<buildings.length;b++){
        if(buildings[b].wayid == wayid){
          b_index = b;
          break;
        }
      }
    }
    promoted[wayid].building = true;
    writeBuilding(b_index);
  }
  else if(promoted[wayid].effect.indexOf("3D") > -1){
    // remove listing from building index, it has a new effect now
    promoted[wayid].building = false;
    for(var b=0;b<buildings.length;b++){
      if(buildings[b].wayid == wayid){
        buildings.splice(b,1);
        break;
      }
    }
  }
  if( (settype.indexOf("2D") > -1) || (promoted[wayid].effect.indexOf("kansas:") > -1) ){
    var p_index = parks.length;
    if(!promoted[wayid].tiled || promoted[wayid].tiled != settype.replace("2D","")){
      // create a listing in the park index
      parks.push({
        wayid: wayid,
	    vertices: promoted[wayid].osmdata.line.slice(0),
	    effect: promoted[wayid].effect || "park",
	    texture: settype.replace("2D","")
      });
      prepPark(parks.length-1);
    }
    else{
      // find a listing in the park index that matches this way
      for(var b=0;b<parks.length;b++){
        if(parks[b].wayid == wayid){
          p_index = b;
          break;
        }
      }
    }
    promoted[wayid].tiled = true;
    writePark(p_index);
  }
  else if(promoted[wayid].effect.indexOf("2D") > -1){
    // remove listing from park index; its style has changed
    promoted[wayid].tiled = false;
    for(var b=0;b<parks.length;b++){
      if(parks[b].wayid == activeWay){
        parks.splice(b,1);
        break;
      }
    }
  }
  promoted[wayid].effect = settype;
}
function tableOfData(dict){
  // print out relevant OSM key-value pairs in a table styled by Bootstrap
  var table = "<table class='table-condensed table-striped'>";
  for(var k in dict){
    // ignore OSM data values which are not interesting to the viewer
    if(k == "id" || k == "wayid" || k == "name" || k == "lat" || k == "lon" || k == "line" || k == "user"){
      continue;
    }
    table += "<tr><td>" + k + "</td><td>" + dict[k] + "</td></tr>";
  }
  table += "</table>";
  return table;
}

function gup(nm){nm=nm.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");var rxS="[\\?&]"+nm+"=([^&#]*)";var rx=new RegExp(rxS);var rs=rx.exec(window.location.href);if(!rs){return null;}else{return rs[1];}}
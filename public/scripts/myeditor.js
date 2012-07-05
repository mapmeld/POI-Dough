var buildings = [ ];
var parks = [ ];
var extraMapLayer;
var map, baseIcon, miniIcon, activeWay, menuPopup;
var tree, corn, watermelon, coffee;
var promoted = { };
var allowPolygonEditing = true;

function init(){
  var tileURL = "http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png";
  var attribution = "Map data &copy; 2012 OpenStreetMap contributors, Tiles by MapQuest";
  var baseMapLayer = new L.TileLayer(tileURL, {maxZoom: 18, attribution: attribution});

  map = new L.Map('map');
  cityll = new L.LatLng(32.836183, -83.631266);
  map.setView(cityll, 18).addLayer(baseMapLayer);
  
  menuPopup = new L.Popup();

  miniIcon = L.Icon.extend({
    iconUrl: "/images/marker.png",
    shadowUrl: "/images/marker-shadow.png",
    iconSize: new L.Point(20, 36),
    shadowSize: new L.Point(25, 30),
    iconAnchor: new L.Point(10, 18),
    popupAnchor: new L.Point(0, -12)
  });

  baseIcon = L.Icon.extend({
    iconUrl: "/images/marker.png",
    shadowUrl: "/images/marker-shadow.png",
    iconSize: new L.Point(30, 36),
    shadowSize: new L.Point(42, 30),
    iconAnchor: new L.Point(15, 18),
    popupAnchor: new L.Point(0, -12)
  });
  
  /*$("#colorPick").colorPicker();
  $('#colorPick').on("change",
	function(){
	  if(activeWay){
	    changeColor( activeWay )
	  }
	}
  );
  $("#roofPick").colorPicker();
  $('#roofPick').on("change",
	function(){
	  if(activeWay){
	    changeRoofColor( activeWay )
	  }
	}
  );*/
  tree = new Image();
  tree.src = "../images/treeblot.png";
  corn = new Image();
  corn.src = "../images/corn.png";
  coffee = new Image();
  coffee.src = "../images/coffee.png";
  watermelon = new Image();
  watermelon.src = "../images/watermelon.png";
  
  //$('.book').turn();
}

function prepBuilding(b){
  // determine center of whole building, including all sections
  var latmax = -1000;
  var latmin = 1000;
  var lngmax = -1000;
  var lngmin = 1000;
  /*for(var s=0; s<buildings[b].sections.length; s++){
    for(var v=0; v<buildings[b].sections[s].vertices.length; v++){
      var pt = buildings[b].sections[s].vertices[v];
      latmax = Math.max(latmax, pt[0]);
      latmin = Math.min(latmin, pt[0]);
      lngmax = Math.max(lngmax, pt[1]);
      lngmin = Math.min(lngmin, pt[1]);
    }
  }*/
  var vertices = promoted[ buildings[b].wayid ].poly.getLatLngs();
  for(var v=0; v<vertices.length; v++){
    var pt = vertices[v];
    latmax = Math.max(latmax, pt.lat);
    latmin = Math.min(latmin, pt.lat);
    lngmax = Math.max(lngmax, pt.lng);
    lngmin = Math.min(lngmin, pt.lng);
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
  // determine center of park
  var latmax = -1000;
  var latmin = 1000;
  var lngmax = -1000;
  var lngmin = 1000;
  var vertices = promoted[ parks[p].wayid ].poly.getLatLngs();
  for(var v=0; v<vertices.length; v++){
    var pt = vertices[v];
    latmax = Math.max(latmax, pt.lat);
    latmin = Math.min(latmin, pt.lat);
    lngmax = Math.max(lngmax, pt.lng);
    lngmin = Math.min(lngmin, pt.lng);
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

function changeTiles(){
  var tiles = $('#mapTiler').val();
  var nMapLayer;
  if(tiles == "mapquest"){
    var tileURL = "http://otile1.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png";
    var attribution = "Map data &copy; 2012 OpenStreetMap contributors, Tiles by MapQuest";
    nMapLayer = new L.TileLayer(tileURL, {maxZoom: 18, attribution: attribution});
  }
  else if(tiles == "mapnik"){
    var tileURL = 'http://tile.openstreetmap.org/{z}/{x}/{y}.png';
    var attribution = 'Map data &copy; 2012 OpenStreetMap contributors',
    nMapLayer = new L.TileLayer(tileURL, {maxZoom: 18, attribution: attribution});
  }
  else if(tiles == "transit"){
    var tileURL = "http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png";
    var attribution = 'Map data &copy; 2012 OpenStreetMap contributors, Tiles by Andy Allan',
    nMapLayer = new L.TileLayer(tileURL, {maxZoom: 18, attribution: attribution});
  }
  else if(tiles == "terrain"){
    var tileURL = "http://{s}.tile.stamen.com/terrain/{z}/{x}/{y}.jpg";
    var attribution = "Map data &copy; 2012 OpenStreetMap contributors, Tiles by Stamen Design";
    nMapLayer = new L.TileLayer(tileURL, {maxZoom: 18, attribution: attribution});
  }
  else if(tiles == "watercolor"){
    var tileURL = "http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg";
    var attribution = "Map data &copy; 2012 OpenStreetMap contributors, Tiles by Stamen Design";
    nMapLayer = new L.TileLayer(tileURL, {maxZoom: 18, attribution: attribution});
  }
  else if(tiles == "mapbox"){
    var tileURL = "http://{s}.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png";
    var attribution = "Map data &copy; 2012 OpenStreetMap contributors, Tiles by MapBox";
    nMapLayer = new L.TileLayer(tileURL, {maxZoom: 17, attribution: attribution});
  }
  map.addLayer(nMapLayer);
  if(extraMapLayer){
	map.removeLayer(extraMapLayer);
  }
  extraMapLayer = nMapLayer;
}

function writeBuilding(b){
  var canvas = $('#parkCanvas')[0];

  var ctrlat = buildings[b].center[0];
  var ctrlng = buildings[b].center[1];
  var latmin = buildings[b].latmin;
  var latmax = buildings[b].latmax;
  var lngmin = buildings[b].lngmin;
  var lngmax = buildings[b].lngmax;
  var latspan = latmax - latmin;
  var lngspan = lngmax - lngmin;
  var levelmax = 0;

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
    levelmax = Math.max(levelmax, buildings[b].sections[s].levels);
    
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
    var vertices = promoted[ buildings[b].wayid ].poly.getLatLngs();
    if(vertices.length == 0){
      vertices = promoted[ buildings[b].wayid ].poly._originalPoints.slice();
    }
    var sorted = vertices.slice();
    sorted.sort( function(pt1, pt2){ return pt2.lat - pt1.lat } );

    for(var v=0; v<sorted.length; v++){
      var at_pt = toPixel( sorted[v], ctrlat, ctrlng, scale );
      var last_pt, next_pt;
      // find points which appeared before and after the current one in SERIES, not in NORTH -> SOUTH
	  for(var i=0; i< vertices.length; i++){
        if(vertices[i].lat == sorted[v].lat){
		  if(vertices[i].lng == sorted[v].lng){
		    if(i != 0){
		      last_pt = vertices[i-1];
		    }
		    else{
              last_pt = vertices[vertices.length - 1];
		    }
		    last_pt = toPixel( last_pt, ctrlat, ctrlng, scale );
		    if(i != vertices.length-1){
		      next_pt = vertices[i+1];
		    }
		    else{
		      next_pt = vertices[0];		    
		    }
		    next_pt = toPixel( next_pt, ctrlat, ctrlng, scale );
		    break;
		  }
		}
	  }

	  // set wall colors
      ctx.strokeStyle = "#000";
      ctx.strokeWidth = 1;

	  // draw previous vertex to current vertex
      ctx.moveTo( last_pt[0], last_pt[1] );
      ctx.beginPath();
      ctx.lineTo( last_pt[0] - levels_offset_x, last_pt[1] - levels_offset );
      ctx.lineTo( at_pt[0] - levels_offset_x, at_pt[1] - levels_offset );
      ctx.lineTo( at_pt[0], at_pt[1] );
      ctx.closePath();
      ctx.fill();
      //ctx.stroke();
      
    wallSlope = ( at_pt[1] - next_pt[1] ) / ( at_pt[0] - next_pt[0] );
      if(Math.abs( wallSlope ) > 1){
         ctx.fillStyle = darken(buildings[b].color);
      }
      else{
         ctx.fillStyle = buildings[b].color;
      }

      // draw current vertex to next vertex
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

    if(buildings[b].effect == "3Droof"){
      var roofTip = [0, 0];
      for(var i=0; i<vertices.length; i++){
	    var at_pt = vertices[i];
	    at_pt = toPixel( at_pt, ctrlat, ctrlng, scale );
        roofTip[0] += at_pt[0] - levels_offset_x;
        roofTip[1] += at_pt[1] - levels_offset;
      }
      roofTip[0] = roofTip[0] / vertices.length;
      roofTip[1] = roofTip[1] / vertices.length;
    
      // draw triangles to form a roof
      for(var i=vertices.length-1; i>=0; i--){
      //for(var i=0; i<buildings[b].sections[s].vertices.length; i++){
        var last_pt;
        if(i != 0){
          last_pt = vertices[i-1];
        }
        else{
          last_pt = vertices[vertices.length - 1];
        }
	    last_pt = toPixel( last_pt, ctrlat, ctrlng, scale );
	    var next_pt;
	    if(i != vertices.length - 1){
		  next_pt = vertices[i+1];
	    }
	    else{
		  next_pt = vertices[0];		    
	    }
	    next_pt = toPixel( next_pt, ctrlat, ctrlng, scale );
	    var at_pt = vertices[i];
	    at_pt = toPixel( at_pt, ctrlat, ctrlng, scale );
	  
	    // calculate whether the current roofTip can be met without crossing lines
	    var crossesLine = false;
	    // calculate a line to the roofTip
	    var roofLine_m = ((at_pt[1] - levels_offset) - roofTip[1]) / ((at_pt[0] - levels_offset_x) - roofTip[0] );
	    var roofLine_i = (at_pt[1] - levels_offset) - (at_pt[0] - levels_offset_x) * roofLine_m;
	    var newroofTip = roofTip;
	    for(var f=0; f<vertices.length; f++){
	      // calculate a line from pt(i) to pt(i+1)
	      var wallLine_a = vertices[f];
		  wallLine_a = toPixel( wallLine_a, ctrlat, ctrlng, scale );
		  var wallLibe_b;
		  if(f != vertices.length - 1){
	        wallLine_b = vertices[f+1];
	      }
	      else{
	        wallLine_b = vertices[0];	    
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
      // draw a flat roof
      // more complex roofs benefit by having all ceilings filled in event of failed drawing algorithm
      var roof_start = toPixel( vertices[0], ctrlat, ctrlng, scale );
      ctx.moveTo( roof_start[0] - levels_offset_x, roof_start[1] - levels_offset );
      ctx.beginPath();
	  for(var i=1; i<vertices.length; i++){
        var roof_pt = toPixel( vertices[i], ctrlat, ctrlng, scale );
        ctx.lineTo( roof_pt[0] - levels_offset_x, roof_pt[1] - levels_offset );
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
  
  var imageBounds = new L.LatLngBounds(new L.LatLng(latmin-latspan/6*Math.pow(1.7,levelmax),lngmin-lngspan/6*Math.pow(1.7,levelmax)), new L.LatLng(latmax+latspan/6*Math.pow(1.7,levelmax),lngmax+lngspan/6*Math.pow(1.7,levelmax)));
  var image = new L.ImageOverlay(canvas.toDataURL(), imageBounds);
  menu_on_click(image, promoted[ buildings[b].wayid ].osmdata);
  map.addLayer(image);
  promoted[buildings[b].wayid].drawnLayer = image;
}

function writePark(p){
  var canvas = $('#parkCanvas')[0];
  canvas.width = 300;
  canvas.height = 300;
  var ctx = canvas.getContext('2d');

  var ctrlat = parks[p].center[0];
  var ctrlng = parks[p].center[1];
  var latmin = parks[p].latmin;
  var latmax = parks[p].latmax;
  var lngmin = parks[p].lngmin;
  var lngmax = parks[p].lngmax;
  var levels = 0;
  
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
  for(var x=0; x<canvas.width; x+=25){
	for(var y=0; y<canvas.height; y+=25){
	    ctx.drawImage(icon, x, y, 25, 25);
	}
  }

  var poly = promoted[ parks[p].wayid ].poly.getLatLngs().slice();
  if(poly.length == 0){
    poly = promoted[ buildings[b].wayid ].poly._originalPoints.slice();
  }
  for(var i=0; i<poly.length; i++){
	var at_pt = poly[i];
	at_pt = toPixel( at_pt, ctrlat, ctrlng, scale );
	poly[i] = at_pt;  // [x, y]
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
  
  var latspan = latmax - latmin;
  var lngspan = lngmax - lngmin;
  var latspan = Math.max(latspan, lngspan);
  var lngspan = latspan;
  var imageBounds = new L.LatLngBounds(new L.LatLng(latmin,lngmin), new L.LatLng(latmax,lngmax));
  var image = new L.ImageOverlay(canvas.toDataURL(), imageBounds);
  map.addLayer(image);
  promoted[parks[p].wayid].drawnLayer = image;
  menu_on_click(image, promoted[ parks[p].wayid ].osmdata);
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
var pix_x_offset, pix_y_offset;
function toPixel(latlng, ctrlat, ctrlng, scale){
  pix_x_offset = document.getElementById("parkCanvas").width / 2;
  pix_y_offset = document.getElementById("parkCanvas").height / 2;  
  var pix_x = Math.round( (latlng.lng - ctrlng) * scale + pix_x_offset);
  var pix_y = Math.round( (ctrlat - latlng.lat) * scale + pix_y_offset);
  return [ pix_x, pix_y ];
}
function bounce_on_hover(m, b){
  m.on('mouseover', function(e){
    // glow icon?
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
var bopon = [ ];
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
  }, 40)
}

function highlight_on_hover(p){
  p.on("mouseover", function(e){
    p.setStyle( { color: "#f00" } );
  });
  p.on("mouseout", function(e){
    p.setStyle( { color: "#00f" } );
  });
}

function importOSM(){
  $("#importButton").addClass("disabled");
  var ne = map.getBounds().getNorthEast();
  var sw = map.getBounds().getSouthWest();
  $.getJSON('/osmbbox?bbox=' + sw.lng + ',' +  sw.lat + ',' + ne.lng + ',' + ne.lat, processOSM);
}
function llserial(latlngs){
  var llstr = [ ];
  for(var i=0;i<latlngs.length;i++){
    llstr.push(latlngs[i].lat.toFixed(6) + "," + latlngs[i].lng.toFixed(6));
  }
  return llstr.join("|");
}
function toggleEditing(){
  allowPolygonEditing = !allowPolygonEditing;
  if(allowPolygonEditing){
    $("#editWand").html("Freeze Points");
  }
  else{
    $("#editWand").html("Unfreeze Points");
  }
  for(shape in promoted){
    if(promoted[shape] && promoted[shape].poly){
      if(allowPolygonEditing){
        promoted[shape].poly.editing.enable();
      }
      else{
        promoted[shape].poly.editing.disable();
      }
    }
  }
}
function processOSM(data){
  $("#importButton").removeClass("disabled");
  for(var i=0;i<data.nodes.length;i++){
    // show this node as a marker, only if it is notable
    if((hasKey(data.nodes[i],"name")) || (hasKey(data.nodes[i],"amenity")) || (hasKey(data.nodes[i],"natural"))){
      var marker = new L.Marker( new L.LatLng( data.nodes[i].latlng[0], data.nodes[i].latlng[1] ) );
      map.addLayer(marker);
    
      marker.bindPopup( '<h3>' + getName(data.nodes[i]) + '</h3>' + tableOfData(data.nodes[i]) );
      bounce_on_hover(marker, null);
    
      // TODO: add markers to promotion layer
      //promoted[ "node:" + data.nodes[i].id ] = marker;
    }
  }
  for(var i=0;i<data.ways.length;i++){
    if(promoted[ data.ways[i].wayid ]){
      // already loaded this way
      continue;
    }
    if(hasKey(data.ways[i],"highway")){
      //don't promote roads just yet
      continue;
    }
    // this way might be promoted by the user. Convert to Leaflet polygon
    var wll = data.ways[i].line.slice();
    for(var j=0;j<wll.length;j++){
      wll[j] = new L.LatLng(wll[j][0], wll[j][1]);
    }
    var activePoly = new L.Polygon( wll, { color: "#00f", fillOpacity: 0.3, opacity: 0.65 } );

    // if a polygon covers the entire viewport - it may be a zoning or territory item - skip it
    if(activePoly.getBounds().contains( map.getBounds() )){
      continue;
    }
    
    promoted[ data.ways[i].wayid ] = { poly: activePoly, osmdata: data.ways[i], effect: "none" };

    // test editing
    if(allowPolygonEditing){
      activePoly.editing.enable();
    }
    activePoly.on('edit', function() {
      for(shape in promoted){
        if(promoted[shape] && promoted[shape].poly == this){
          if(promoted[shape].customgeoid){
            // update this shape's points
            $.getJSON("/customgeo?id=" + promoted[shape].customgeoid + "&pts=" + llserial(promoted[shape].poly.getLatLngs()), function(resp){ });
          }
          else{
            // make this shape into a custom object
            $.getJSON("/customgeo?wayid=" + shape + "&pts=" + llserial(promoted[shape].poly.getLatLngs()), function(resp){
              promoted[shape].customgeoid = resp.id;
            });
          }
          // make sure edited polygon gets any existing 2D or 3D effect
          if(promoted[shape].effect){
            setEffect(shape, promoted[shape].effect);
          }
          break;
        }
      }
    });

    menu_on_click(activePoly, data.ways[i]);
    highlight_on_hover(activePoly);
    map.addLayer(activePoly, data.ways[i].wayid);
  }
}
function menu_on_click(p, shard){
  p.on("click", function(e){
    activeWay = shard.wayid;
    menuPopup.setLatLng( p.getBounds().getCenter() );
    var header = '<h3>' + (shard.name || shard.designation || shard.wayid) + '</h3>';
    var effectSelect = '<select onchange="setEffect(activeWay,this.value)"><option value="none">None</option><option value="3Droof">3D Roof</option><option value="3Dblock">3D Block</option><option value="2Dpark">Park</option><option value="2Dcoffee">Coffee</option><option value="2Dcorn">Corn</option><option value="2Dwatermelon">Watermelon</option></select>';
    effectSelect = effectSelect.replace('value="' + promoted[activeWay].effect + '"', 'value="' + promoted[activeWay].effect + '" selected="selected"');
    var hideOption = '<br/><a href="#" onclick="hideWay(activeWay)">Hide</a>';
    menuPopup.setContent(header + tableOfData(shard) + effectSelect + hideOption);
    map.openPopup( menuPopup );
  });
}
function hideWay(wayid){
  map.removeLayer(promoted[ wayid ].poly);
  promoted[ wayid ] = null;
  map.closePopup();
}
function setEffect(wayid, settype){
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
    		/* vertices: promoted[wayid].osmdata.line.splice(0), */
    		levels: 1
    	}],
    	color: "#ff0000",
    	roofcolor: "#cccccc",
    	effect: settype
      });
      prepBuilding(b_index);
    }
    else{
      for(var b=0;b<buildings.length;b++){
        if(buildings[b].wayid == wayid){
          b_index = b;
          break;
        }
      }
    }
    promoted[wayid].building = true;
    buildings[b_index].effect = settype;
    prepBuilding(b_index);
    writeBuilding(b_index);
  }
  else if(promoted[wayid].effect.indexOf("3D") > -1){
    // need to remove listing from building index
    promoted[wayid].building = false;
    for(var b=0;b<buildings.length;b++){
      if(buildings[b].wayid == wayid){
        buildings.splice(b,1);
        break;
      }
    }
  }
  if(settype.indexOf("2D") > -1){
    var p_index = parks.length;
    if(!promoted[wayid].tiled || promoted[wayid].tiled != settype.replace("2D","")){
      parks.push({
        wayid: wayid,
	    /* vertices: promoted[wayid].osmdata.line.splice(0), */
	    effect: "park",
	    texture: settype.replace("2D","")
      });
    }
    else{
      for(var p=0;p<parks.length;p++){
        if(parks[p].wayid == wayid){
          p_index = p;
          break;
        }
      }
    }
    promoted[wayid].tiled = true;
    parks[p_index].effect = settype;
    prepPark(p_index);
    writePark(p_index);
  }
  else if(promoted[wayid].effect.indexOf("2D") > -1){
    // need to remove listing from park index
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
function getName(item){
  var attrs = { };
  for(var k=0;k<item.keys.length;k++){
    attrs[ item.keys[k].key[0] ] = item.keys[k].key[1];
  }
  return attrs["name"] || attrs["designation"] || item.id || item.wayid;
}
function hasKey(item, key){
  for(var k=0;k<item.keys.length;k++){
    if(item.keys[k].key[0] == key){
      return true;
    }
  }
  return false;
}
function tableOfData(item){
  var table = "<table class='table-condensed table-striped'>";
  var attrs = { };
  for(var k=0;k<item.keys.length;k++){
    attrs[ item.keys[k].key[0] ] = item.keys[k].key[1];
  }
  for(var k in attrs){
    if(k == "id" || k == "wayid" || k == "name" || k == "lat" || k == "lon" || k == "line" || k == "user"){
      continue;
    }
    table += "<tr><td style='max-width:150px;word-wrap:break-word;'>" + k + "</td><td style='max-width:150px;word-wrap:break-word;'>" + attrs[k] + "</td></tr>";
  }
  table += "</table>";
  return table;
}
function exportPOI(){
  var allbuildings = [];
  for(var b=0;b<buildings.length;b++){
    if(promoted[ buildings[b].wayid ].customgeoid){
      allbuildings.push( "poi:" + promoted[ buildings[b].wayid ].customgeoid + "_" + buildings[b].effect );
    }
    else{
      allbuildings.push( buildings[b].wayid + "_" + buildings[b].effect );
    }
  }
  var allparks = [];
  for(var p=0;p<parks.length;p++){
    if(promoted[ parks[p].wayid ].customgeoid){
      allparks.push( "poi:" + promoted[ parks[p].wayid ].customgeoid + "_" + parks[p].texture );
    }
    else{
      allparks.push( parks[p].wayid + "_" + parks[p].texture );
    }
  }
  var url = "/savemap?bld=" + allbuildings.join(",") + "&prk=" + allparks.join(",") + "&createdby=POI_Dough_Test&tiler=" + $("#mapTiler").val() + "&ctr=" + map.getCenter().lat.toFixed(6) + "," + map.getCenter().lng.toFixed(6) + "&z=" + map.getZoom();
  window.location = url;
}
function gup(nm){nm=nm.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");var rxS="[\\?&]"+nm+"=([^&#]*)";var rx=new RegExp(rxS);var rs=rx.exec(window.location.href);if(!rs){return null;}else{return rs[1];}}

$(document).ready(init);
var ctx;
var shape = [ [ 10, 10 ], [ 150, 275 ], [ 228, 100 ], [ 10, 10 ] ];
function replaceAll(src, oldr, newr){
  while(src.indexOf(oldr) > -1){
    src = src.replace(oldr,newr);
  }
  return src;
}
function testCanvasCode(){
  var codescan = $("codedraft").value;
  codescan = replaceAll(replaceAll(codescan.toLowerCase()," ",""),"\n","");
  if((codescan.indexOf("document") > -1) || (codescan.indexOf("script") > -1) || (codescan.indexOf("eval") > -1) || (codescan.indexOf("parent") > -1) || (codescan.indexOf("$") > -1) || (codescan.indexOf("jquery") > -1) || (codescan.indexOf("alert") > -1)){
    alert("Access to document, script, eval, alert, or parent denied");
    return;
  }
  var code = eval( $("codedraft").value );

  $("parkCanvas").width = $("parkCanvas").width;
  ctx = $("parkCanvas").getContext('2d');
  code( ctx, shape, "#2A2AA5", "#2A2AA5" );
}
function syntaxCheck(){
  switchToCode();
  var codescan = $("codedraft").value;
  codescan = replaceAll(replaceAll(codescan.toLowerCase()," ",""),"\n","");
  if((codescan.indexOf("document") > -1) || (codescan.indexOf("script") > -1) || (codescan.indexOf("eval") > -1) || (codescan.indexOf("parent") > -1) || (codescan.indexOf("$") > -1) || (codescan.indexOf("jquery") > -1) || (codescan.indexOf("alert") > -1)){
    alert("Access to document, script, eval, jQuery, alert, or parent denied");
    return;
  }
  $("codestore").innerHTML = "<pre class='brush:jscript'>" + $("codedraft").value + "</pre>";
  SyntaxHighlighter.highlight();
}
function storeProcedure(){
  $("codeform").submit();
}
function switchToCode(){
  $("codeTab").className = "active";
  $("editTab").className = "";
  $("currentcode").style.display = "block";
  $("editcode").style.display = "none";
}
function switchToEdit(){
  $("codeTab").className = "";
  $("editTab").className = "active";
  $("currentcode").style.display = "none";
  $("editcode").style.display = "block";
}
function simulatePoint(){
  $("pointTab").className = "active";
  $("lineTab").className = "";
  $("polylineTab").className = "";
  $("polygonTab").className = "";
  shape = [ [ 150, 220 ] ];
  testCanvasCode();
}
function simulateLine(){
  $("pointTab").className = "";
  $("lineTab").className = "active";
  $("polylineTab").className = "";
  $("polygonTab").className = "";
  shape = [ [ 15, 28 ], [ 280, 290 ] ];
  testCanvasCode();
}
function simulatePolyline(){
  $("pointTab").className = "";
  $("lineTab").className = "";
  $("polylineTab").className = "active";
  $("polygonTab").className = "";
  shape = [ [ 10, 10 ], [ 150, 275 ], [ 228, 100 ] ];
  testCanvasCode();
}
function simulatePolygon(){
  $("pointTab").className = "";
  $("lineTab").className = "";
  $("polylineTab").className = "";
  $("polygonTab").className = "active";
  shape = [ [ 10, 10 ], [ 150, 275 ], [ 228, 100 ], [ 10, 10 ] ];
  testCanvasCode();
}
function $(id){
  return document.getElementById(id);
}
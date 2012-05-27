var ctx, shape;
function testCanvasCode(){
  shape = [ [ 10, 10 ], [ 15, 30 ], [ 20, 10 ] ];
  document.getElementById("parkCanvas").width = document.getElementById("parkCanvas").width;
  ctx = document.getElementById("parkCanvas").getContext('2d');
  eval( document.getElementById("codedraft").value + " drawSample(ctx);" );
}
function syntaxCheck(){
  switchToCode();
  document.getElementById("codestore").innerHTML = "<pre class='brush:jscript'>" + document.getElementById("codedraft").value + "</pre>";
  SyntaxHighlighter.highlight();
}
function storeProcedure(){
  document.getElementById("codeform").submit();
}
function switchToCode(){
  document.getElementById("codeTab").className = "active";
  document.getElementById("editTab").className = "";
  document.getElementById("currentcode").style.display = "block";
  document.getElementById("editcode").style.display = "none";
}
function switchToEdit(){
  document.getElementById("codeTab").className = "";
  document.getElementById("editTab").className = "active";
  document.getElementById("currentcode").style.display = "none";
  document.getElementById("editcode").style.display = "block";
}
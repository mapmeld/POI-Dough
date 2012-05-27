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
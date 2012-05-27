function syntaxCheck(){
  document.getElementsByClassName("brush:jscript")[0].innerHTML = document.getElementById("codedraft").innerHTML;
  SyntaxHighlighter.all();
}
function syntaxCheck(){
  document.getElementById("codestore").innerHTML = "<pre class='brush:jscript'>" + document.getElementById("codedraft").value + "</pre>";
  SyntaxHighlighter.highlight();
}
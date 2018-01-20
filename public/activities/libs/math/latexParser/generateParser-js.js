// myparser.js
var fs = require("fs");
var path = require("path");
var jison = require("jison");

var grammar = fs.readFileSync("latex-to-js.jison", "utf8");
//var parser = new jison.Parser(bnf);
var parser = (new jison.Generator(grammar)).generate({moduleType: "js", moduleName: "latex2js"});

fs.writeFileSync(path.resolve(__dirname, "latex2js.js"), parser );
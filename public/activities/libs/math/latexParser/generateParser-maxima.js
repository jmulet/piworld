// myparser.js
var fs = require("fs");
var path = require("path");
var jison = require("jison");

var grammar = fs.readFileSync("latex-to-maxima.jison", "utf8");
//var parser = new jison.Parser(bnf);
var parser = (new jison.Generator(grammar)).generate({moduleType: "js", moduleName: "latex2mac"});

fs.writeFileSync(path.resolve(__dirname, "latex2mac.js"), parser );
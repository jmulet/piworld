
var fs = require("fs");
var cheerio = require('cheerio');
 var exec = require('child_process').exec;

var home0 = "/Users/josep/Desktop/"
var home = "/Users/josep/Desktop/Fotos1BAT_files";


function parseFile(src){
    var $ = cheerio.load(src);
    var alumnes = $(".contenidorFotoAlumne");
    alumnes.each(function(i, elem){
        
        var imgElem =  $(this).children("img");
        var expElem = $(this).children(".peuFotoAlumne").last().text();
        var pos = expElem.indexOf(": ");
        var exp = expElem.substring(pos+2).trim();
        var src = imgElem.attr("src").trim().substring(2); 
        
        var username = exp+"b";
        var cmd ="cp '"+home0+"/"+src+"' '"+home+"/"+username+".jpg'";
        console.log(cmd);
        exec(cmd, function(err){
            if(err){
                console.log(err);
            }
        });
        
    });
   
}

fs.readFile(home0+"/Fotos1BAT.html", "utf-8", function(err, src){
    if(!err){
        parseFile(src);
    } else {
        console.log(err);
    }
});


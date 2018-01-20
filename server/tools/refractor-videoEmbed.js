
var fs = require('fs');
var mysql = require('mysql');

//Refractor database
var config = require('./server.config');

var pool = mysql.createPool({
      host     : config.mysql.host || 'localhost',
      port     : config.mysql.port || 3306,
      user     : config.mysql.user || 'root',
      database : config.mysql.database || 'imaths',
      password : config.mysql.password || '',
      multipleStatements: true,
      connectionLimit: 99,
      bigNumberStrings: true
    });
    
var db = require('./mysql-utils')(pool);

db.query("select * from assignments where instructions like '%<youtube-video%'", function(d){
    console.log("Found "+d.result.length+" assignment to be refractored.");
    d.result.forEach(function(row){
        var src = row.instructions;
        src = src.replace(/<youtube-video/gi, "<video-embed").replace(/<\/youtube-video/gi, "</video-embed");
        db.queryBatch("UPDATE assignments SET ? WHERE id="+row.id, {instructions: src}, function(){
            console.log("UPDATED assignment id="+row.id);
        })();
    });

})();
//Refractor file-system

fs.readdir("../public/activities", function(err, files){
   
   files.forEach(function(f){
        
        var file = "../public/activities/"+f+"/theory.html";
        fs.stat(file, function(err, stat){
            if(err){
                console.log(file+ " >> "+err);
                return;
            }
            
            //check of videos
            fs.readFile(file, 'utf8', function(err, src){
               if(err){
                   console.log(file+ " >> "+err);
                   return;
               } 
               if(src.match(/<youtube-video/gi) || src.match(/<\/youtube-video/gi)){
                   console.log(file+ " >> contains youtube-video tag");
                   src = src.replace(/<youtube-video/gi, "<video-embed").replace(/<\/youtube-video/gi, "</video-embed");
                   //Save file
                   fs.writeFile(file, src, 'utf8', function(err){
                       if(err){
                            console.log(file+ " >> "+err);
                            return;
                        } 
                       console.log(file+ " >> Replaced to video-embed. OK");
                   });
               } else {
                   console.log(file+ " >> OK");
               }
            });
            
        });
        
   });    
    
});


var fs = require('fs'); 

 
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
               if(src.match(/app.register/g)){
                   console.log(file+ " >> contains app register ");
                   src = src.replace(/window.app.register/g, "window.piworld.app.register").replace(/window.piworld.piworld.app.register/g, "window.piworld.app.register").replace(/window.piworld.piworld.piworld.app.register/g, "window.piworld.app.register");
                   //Save file
                   fs.writeFile(file, src, 'utf8', function(err){
                       if(err){
                            console.log(file+ " >> "+err);
                            return;
                        } 
                       console.log(file+ " >> Replaced to piworld.app.register. OK");
                   });
               } else {
                   console.log(file+ " >> OK");
               }
            });
            
        });
        
   });    
    
});



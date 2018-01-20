  var wget = require('node-wget'),
    config = require('./server.config'),
    mysql = require('mysql'),
    path = require('path'),
    http = require('http');
   
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
    
global.__publicDir = path.resolve(__dirname, "../public");    
    
var db = require('./mysql-utils')(pool);



function downloadVimeoIcon(vimeoId, idActivity){
    console.log("Downloading from VIMEO "+ vimeoId);
    http.get('http://vimeo.com/api/v2/video/' + vimeoId + '.json', function(res) {
        var body = '';
        
        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){

            var json;
            try{
                json = JSON.parse(body);
            } catch(ex){
                json = {};
            }
            
            var url = json[0].thumbnail_large  || json[0].thumbnail_medium;    
            if(url){
                wget({                         
                        url:  url,
                        dest: __publicDir+'/activities/'+idActivity+"/icon_large.jpg",     
                        timeout: 5000 
                 });
            } else {
                console.log("ERROR !!!!! no big image");
            }
            url = json[0].thumbnail_small;
            if(url){
                wget({                         
                        url:  url,
                        dest: __publicDir+'/activities/'+idActivity+"/icon.jpg",     
                        timeout: 5000 
                 });
            }
        });                   
    });              
}

function downloadYoutubeIcon(ytid, idActivity){
      wget({                         
        url:  'https://i.ytimg.com/vi/'+ytid+'/maxresdefault.jpg',
        dest: __publicDir+'/activities/'+idActivity+"/icon_large.jpg",     
        timeout: 5000 
      }, function(error){
        //If fails, catch medium resolution    
           wget({                         
               url:  'https://i.ytimg.com/vi/'+ytid+'/hqdefault.jpg',
               dest: __publicDir+'/activities/'+idActivity+"/icon_large.jpg",     
               timeout: 5000 
           }, function(error){
                wget({                         
                    url:  'https://i.ytimg.com/vi/'+ytid+'/mqdefault.jpg',
                    dest: __publicDir+'/activities/'+idActivity+"/icon_large.jpg",     
                    timeout: 5000 
                });   
           });   
        });
        
      wget({                         
        url:  'https://i.ytimg.com/vi/'+ytid+'/default.jpg',
        dest: __publicDir+'/activities/'+idActivity+"/icon.jpg",     
        timeout: 5000 
      });
}

function ggbIconUrl(ggbid){
      var str = ggbid.substr(0, ggbid.length-2);
      if(!len % 2){
          str = "0"+str;
      }
      var len = str.length;
      var str1, str2, str3, str4;
      str1 = str2 = str3 = str4 = "00";

      if(len>=2){
          str4 = str.substring(len-2);
      }
      if(len>=4){
          str3 = str.substring(len-4, len-2);
      }
      if(len>=6){
          str2 = str.substring(len-6, len-4);
      }
      if(len>=8){
          str1 = str.substring(len-8, len-6);
      }
      return "https://www.geogebra.org/files/"+str1+"/"+str2+"/"+str3+"/"+str4+"/material-"+ggbid+"-thumb.png";                     
}


function downloadGGBIcon(ggbid, idActivity){  
      wget({                          
        url:   ggbIconUrl(ggbid),
        dest: __publicDir+'/activities/'+idActivity+"/icon.jpg",     
        timeout: 10000                    
      });

      var url = "http://www.geogebra.org/material/download/format/file/id/"+ggbid;
      wget({                          
        url:  url,
        dest: __publicDir+'/activities/'+idActivity+"/"+ggbid+".ggb",      // destination path or path with filenname, default is ./ 
        timeout: 2000       // duration to wait for request fulfillment in milliseconds, default is 2 seconds 
      }); 
}

var sc = function(d){
       
       d.result.forEach(function(row){
           
        if(row.ytid && row.ytid[2]===':'){
            row.tech = row.ytid.substring(0,2);
            row.ytid = row.ytid.substring(3);            
        }
           
         if(row.ytid){              
              //If youtube video then download icon
            if(row.ytid && row.tech==='YT'){
                console.log("Downloading youtube icon for activity "+row.id);
                downloadYoutubeIcon(row.ytid, row.id);
               //Download vimeo icon
            } else if(row.ytid && row.tech==='VM'){
                console.log("Downloading vimeo icon for activity "+row.id);
                downloadVimeoIcon(row.ytid, row.id);
            }
            
   
         } else if(row.ggbid){
             //Download both ggb and icon 
             console.log("Downloading GGB icon for activity "+row.id);
             downloadGGBIcon(row.ggbid, row.id);
         }
       });
       
   };
   
   db.query("SELECT * FROM activities", sc)();
    



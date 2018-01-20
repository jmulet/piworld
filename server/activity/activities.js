module.exports = function(app)
{  

var fs    = require('fs'),
    async = require('async'),
    Brain = require('../misc/brain'),
    exec = require('child_process').exec,
    //JSONH = require('jsonh'),        
    generator = require('../activity/generator.js'),
    formidable = require('formidable'),
    translate = require('node-google-translate-skidz'),
    wget = require('node-wget'),
    http = require('http'),
    Q = require('q'),
    AdminsAndTeachersMdw = require('../AuthorizedMdw').AdminsAndTeachersMdw;
 
    
    require('../util.js');

var bracelets = function(s)
{
    var s2 = s.trim();
    if(!s2.startsWith("{"))
    {
        s2 = "{"+s2;
    }
    if(!s2.endsWith("}"))
    {
        s2 += "}";
    }
    return s2;
};

/**
 * 
 * @param {type} entry
 * @param {type} lang
 * @returns {undefined}This method, is used to translate activity title
 * and description which is sent to client
 * 
 */

var i18n_processor = function(entry, lang){
        var text = entry || "";
        text = text.replace(/\n/g,'\\n');
        var out = text.replace(/{/g,'').replace(/}/g,'').replace(/\"/g,'');
        //Assume JSON
        try{
                var json = JSON.parse(bracelets(text)); 
                if (json[lang])
                {
                    out = json[lang];
                }
                else if (json.en)
                {
                    out = json.en;
                }
                else
                {
                    out = "";
                    for(var i=0; i<app.config.LANGS.length; i++){
                        var l = app.config.LANGS[i];
                        if(json[l]){
                            out = json[l];
                            break;
                        }
                        
                    }; 
                }        
        }
        catch(e)
        {
            //
        }
        return out;  
};

var removeHypen = function(l){
    if(l && l.indexOf("-")>0){
        return l.split("-")[0];
    }
    return l;
}

var i18n_activity = function(entry, lang, req)
{
        lang = removeHypen(lang);
        if(!lang && req)
        {
            lang = req.body.lang || removeHypen(app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY")) || "en";
        }
        
        entry.activity = i18n_processor(entry.activity, lang);
        entry.description = i18n_processor(entry.description, lang);
        
        if(entry.ytid && entry.ytid[2]===':'){
                entry.tech = entry.ytid.substring(0,2);    
                entry.ytid = entry.ytid.substring(3)            
        }
            
        //Find an appropiate icon for the activity
        if(!entry.icon){
              if(entry.ytid && entry.tech==='YT'){                  
                  entry.icon = "https://i.ytimg.com/vi/"+entry.ytid+"/default.jpg";                  
              } else if(entry.ggbid){
                  entry.icon = ggbIconUrl(entry.ggbid);
              } else if(entry.ytid) {                  
                  entry.icon = "activities/"+ (entry.idActivity || entry.id) + "/icon.jpg";                  
              }
        }
        
};

//Keep a copy of this function in app
app.i18n_activity = i18n_activity;
app.i18n_processor = i18n_processor;
app.removeHypen = removeHypen;


var compileActivity = function(id, errcb, okcb){
        var fromDir = __serverDir + "/activities/" + id + "/";
        var toDir = __publicDir + "/activities/" + id + "/";
        fs.unlink(toDir + "QProvider.js", function () {
            fs.unlink(toDir + "QProvider.min.js", function () {
                log = [];
                generator(fromDir, toDir, function () {
                    app.db.query("UPDATE activities SET hasAct=1 WHERE id=" + id)();
                     okcb && okcb();
                }, function () {
                    errcb && errcb();
                }, log);
            });
        });
}
/**
 * List and search activities
 */
var search = function(req, res)
{
    
    var lang = req.body.lang || app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY") || "en";
    
    var p = req.body;
    var slevel = p.slevel || 1;
    
    var searchConditions = "WHERE (a.share>="+slevel+" || (a.share=0 AND a.createdBy='"+p.username+"') )  AND a.idSubject='"+ (p.idSubject || 1)+"'  ";
    var and = "AND";
    
    var simple = p.simple || false;
    
        if(p.course && p.course!== '*')
        {
            searchConditions += and + " a.levels LIKE ('%" + p.course + "%') ";
        }


        //If text contains serveral words separated by space then treat as different search conditions        
        var text = (p.text || '').replace(/  /g,'').trim();
        if (text)
        {
            var searchIN = "CONCAT(a.id, ' ', a.category,' ',a.activity,' ', a.description";
            if(simple){
                searchIN += ",' ',a.createdBy,' ', u.fullname";
            }
            searchIN += ")";
            searchConditions += and + " ( ";
            var array = text.replace(/  /g, '').split(" ");
            var ALSO = "";
            array.forEach(function(s){
                searchConditions += ALSO + searchIN + " LIKE '%" + s + "%'"; 
                ALSO = " AND ";
            });
            searchConditions +=") ";                        
        }
            
    if(!simple)
    {
        
        if(p.course!=='*')
        {
            searchConditions += and+" a.levels LIKE ('%"+p.course+"%') ";
        }
        if(p.category)
        {
            searchConditions += and+" a.category LIKE '%"+p.category+"%' ";
        }
        if((p.title || "").trim().length>0)
        {
            searchConditions += and+" a.activity LIKE '%"+p.title+"%' ";
        }
        if( (p.description || "").trim().length>0)
        {
            searchConditions += and+" a.description LIKE '%"+p.description+"%' ";
        }
        if( (p.author || "").trim().length>0 )
        {
            searchConditions += and+" ( a.createdBy LIKE '%"+p.author+"%' OR u.fullname LIKE '%"+p.author+"%') ";
        }
        if( p.hasVideo )
        {
            searchConditions += and+" ( a.ytid IS NOT NULL ) ";
        }
        if( p.hasGGB )
        {
            searchConditions += and+" ( a.ggbid IS NOT NULL )  ";
        }
        if( p.hasAct )
        {
            searchConditions += and+" ( a.hasAct>0 )  ";
        }
        if( p.hasSim )
        {
            searchConditions += and+" ( a.createjs>0 )  ";
        }
    }
    
    // SQL query to list all attempts associated with an activity/userId
     
    var sql = "SELECT a.*, u.fullname, round(avg(rat.rate)) as rating, round(avg(rat.vrate)) as vrating, count(rat.rate) as votes FROM activities AS a LEFT JOIN users as u ON u.username=a.createdBy LEFT JOIN ratings as rat on rat.idActivity=a.id  "+
        searchConditions+" group by a.id ORDER BY a.createdWhen DESC, a.levels ASC, a.category ASC, a.activity ASC"; 
    
    if(p.offset){
        sql += " LIMIT "+p.offset+", "+p.limit;
    } else if(p.limit){
        sql += " LIMIT "+p.limit;
    }
    
    
    var success = function(d){ 
          d.result.forEach(function(entry){          
                i18n_activity(entry, lang);
                if(!entry.rating)
                {
                    entry.rating = 0;
                }
                found = entry.tfr;
          });
          
          if(p.limit && !p.offset){
                //Need to count the total number of items
                var sql2 = "SELECT count(a.id) as total FROM activities AS a LEFT JOIN users as u ON u.username=a.createdBy "+ searchConditions ; 
                var error2 = function(){
                    res.send({results: d.result}); 
                };
                var success2 = function(d2){
                    res.send({results: d.result, totalItems: d2.result[0].total}); 
                };
                app.db.query(sql2, success2, error2)();
                
          } else {        
                res.send({results: d.result}); 
          }
    };
    
    var error = function(d){ res.send({result: []}); };
    app.db.query(sql, success, error)(); 
};

 

var prepareCreate = function(p){
    var type = p.type || p.activityType;
    if((p.type || p.activityType || "simple").toLowerCase()==='simple')
    {
        type = "A";
    } 
    
    var g = "";
    var comma = "";
    
    p.tech = p.tech || 'YT';
    p.levels = p.levels || "";
    if(typeof(p.levels)==='string'){
        p.levels = p.levels.split(",");
    }
    p.levels.forEach(function(e){ 
        if(e.trim()){
            g += comma+e.trim();
            comma=", ";
        };    
    });
        
    var title = JSON.stringify(p.title);
    var desc = JSON.stringify(p.description);
    
    var categories = "";
    comma = "";
    p.categories = p.categories || p.category || "";
    if(typeof(p.categories)==='string'){
        p.categories = p.categories.split(",");
    }
    
    p.categories.forEach(function(e){
        if(e.trim())
        {
            categories += comma + e.trim(); 
            comma = ", ";
        }
    });
    
    return {levels: g, activity: title, category: categories, activityType: type || 0, share: p.share,
        createdBy: p.author || 'admin', idSubject: p.idSubject || 1, description: desc, icon: p.icon, 
        ytid: p.ytid? (p.tech+':'+p.ytid) : null, ytqu: p.ytqu? 1:0, ggbid: p.ggbid, hasAct: p.hasAct? 1:0};    
};



var generateScriptCode = function(p, code){
    code = code || [];
    code.push("<script id='theory-controller-"+p.id+"'>");
    code.push("     window.pw.app.register.controller('theory"+p.id+"', ['$scope', function($scope){");
    if(p.createjs){
        code.push("     require(['activities/libs/createjs-utils.js'], function(cjsUtil)){");
    }
    code.push("         ");
    if(p.ytqu){
        code.push("       $scope.qs=[");
        if(p.questions){
            var sep = "                    ";
            p.questions.forEach(function(e){
                    var part = "{time: ";
                    if(e.time.indexOf(":")<0){
                        part += e.time+", ";
                    } else {
                        part += "'"+e.time+"', ";
                    }
                    part += "type: '"+e.type+"', formulation: \""+e.formulation+"\", hints: \""+e.hints+"\", ";
                    if(e.type==='input'){
                        part += "answer: \""+e.answer+"\"";
                    } else {
                        part += "format: '"+e.format+"', options: [";
                        var sep2 = "";
                        e.options.forEach(function(o){
                                part += sep2+"{text: \""+o.text+"\", valid: "+(o.valid?'true':'false')+"}";
                                sep2 = ", ";
                        });
                        part += "]";
                    }
                    code.push(sep+part+"}");
                    sep ="\n                    ,  ";
            });
            delete p.questions;
            
        } else {
            code.push("                    {time: '3:20', type: 'input', formulation: \"Calcula 1+1\", answer: \"2\"},");
            code.push("                    {time: 240, type: 'multiple', formulation: \"A vector has...\", options: [{text: \"Flavour\", valid: false}, {text: \"Direction\", valid: true} ]}");
        }
        code.push("                  ];");
    }
   
    if(p.notes){
        code.push("       $scope.notes=[");
            var sep = "                    ";
            p.notes.forEach(function(e){
                    var part = "{time: ";
                    if(e.time.indexOf(":")<0){
                        part += e.time+", ";
                    } else {
                        part += "'"+e.time+"', ";
                    }
                    part += "title: '"+e.title+"}";                    
                    code.push(sep+part+"}");
                    sep ="\n                    ,  ";
            });        
        code.push("                  ];");
    }
    
    //Create a simulation with createjs - shows here the skeleton
    if(p.createjs){
        code.push("");
        code.push("var opts = {");
        code.push("  project          : 'creatine_game',");
        code.push("  width            : 300,");
        code.push("  container        : 'simJS"+p.id+"',");
        code.push("  framerate        : 60,");
        code.push("  showfps          : true,");
        code.push("  background_color : '#faa',");
        code.push("  resources        : {");
        code.push("    base_path : '../../',");
        code.push("   manifest  : []");
        code.push("  }");
        code.push("};");
        code.push("");
        code.push("var game = new tine.Game(opts, {");
        code.push("   boot: function(){");
        code.push("       //Initialize third party libs here!               ");
        code.push("},");
        code.push("   preload: function(){");
        code.push("      game.load.image('logo', 'assets/img/logo.png');");
        code.push("       ");
        code.push("},");
        code.push("create: function(){");
        code.push("");
        code.push("       var MyScene0 = tine._scene({");
        code.push("            initialize: function() {                     ");
        code.push("                this.t = 0;");
        code.push("                this.addChild(game.create.bitmap('logo', {x:200, y:200}));");
        code.push("                this.addChild(game.create.text('Welcome to piWorld!', {x:200, y:500, font: \"40px Arial\", color: \"white\"}));");
        code.push("                this.addChild(game.create.circle(100,'red', {x:100, y:100}));");
        code.push("            },");
        code.push("            update: function() { ");
        code.push("                this.t += game.time.delta;");
        code.push("            }");
        code.push("        });");
        code.push("       ");
        code.push("       var scene0 = new MyScene0();");
        code.push("       var scene1 = new tine.Scene();");
        code.push("       var s2 = game.create.circle(30,'blue',{alpha:0.4});");
        code.push("       ");
        code.push("       s2.addEventListener('click', function(evt){");
        code.push("            game.director.replace('0', new tine.transitions.Scroll( tine.TOP, null, 1000));");
        code.push("       });");
               
        code.push("      scene1.addChild(s2);");
               
        code.push("       game.director.add('0', scene0);");
        code.push("       game.director.add('1', scene1);");
        code.push("       game.director.replace('0');");
        code.push("   },");
        code.push("   update: function(){");
        code.push("       game.director.getCurrentScene().update();");
        code.push("   },");
        code.push("   draw: {");
        code.push("       ");
        code.push("   }           ");
        code.push("});");
        code.push("");
        code.push("var handleResize = function(){");
        code.push("    var c1 = document.getElementById(opts.container);         ");
        code.push("    game.canvas.height = c1.offsetHeight;");
        code.push("    game.canvas.width = c1.offsetWidth;");
        code.push("};");
        code.push("window.addEventListener('resize', handleResize);");
        code.push("handleResize();");        
 
         
        code.push("         //Get rid of listeners and resources");
        code.push("         $scope.$on('$destroy', function(){");
        code.push("             window.removeEventListener('resize', handleResize);");
        code.push("             createjs.Sound.stop();");
        code.push("                                 });");
    }
    code.push("         ");
    if(p.createjs){
        code.push("     });");
    }
    code.push("     }]);");
     
    code.push("</script>");    
    code.push("");
    return code;
};

function getVideoURL(tech, id){
    if(tech==="YT"){
        return "http://youtu.be/"+id;
    } else if(tech==="VM"){
        return "http://vimeo.com/"+id;
    } 
    return id;
}

//Generates the Theory.html file according to the parameters passed during creation.
var generateHTMLCode = function(p){
    var code = [];
    code.push("");
    var isCtrl = p.createjs || p.ytid || p.activityType==='V';
    if(isCtrl){
        generateScriptCode(p, code);
    }
    
    code.push("<div id='theory-container-"+p.id+"' "+(isCtrl? "ng-controller='theory"+p.id+"'>":">") );
    code.push("    ");
    if(p.theory){
        code.push(p.theory);
    }
    if(p.ytid){
        var questions = "";
        var notes = "";
        if(p.ytqu){
            questions = "questions=\"qs\"";        
        }
        if(p.notes){
            notes = "notes=\"notes\"";        
        }
        code.push("     <video-embed video-id=\"'"+p.ytid+"'\" video-url=\"'"+getVideoURL(p.tech, p.ytid)+"'\"  player-vars=\"playerVars\" player-width=\"playerVars.width\"  player-height=\"playerVars.height\" "+questions+" "+notes+"></video-embed>");        
        
        code.push("<!-- <a ng-href=\"activities/"+p.id+"/apunts.pdf\" ng-click=\"registerSFA($event)\" target=\"_blank\"><img src=\"files/download.png\" alt=\"download\"/> Apunts del video en PDF</a> -->");
    }
    if(p.ggbid){
        code.push("     <div geogebra=\""+p.ggbid+"\"></div>");        
    }
    if(p.createjs){
        code.push("<div id='simJS"+p.id+"'></div>");
        //code.push("<button class='btn btn-default glyphicon glyphicon-play' ng-click='sim.isPlaying=true;'>Play</button>");
        //code.push("<button class='btn btn-default glyphicon glyphicon-pause' ng-click='sim.isPlaying=false;'>Pause</button>");
        //code.push("<button class='btn btn-default glyphicon glyphicon-refresh' ng-click='simReset()'>Reset</button>");
        //code.push("FPS: <input type='number' min='1' ng-model='fps' ng-change='changeFPS()'/>");
    }
    code.push("    ");
    code.push("</div>");
    
    return code.join('\n');
};


function downloadVimeoIcon(vimeoId, idActivity){
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
        url:  ggbIconUrl(ggbid),
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

/*
 * Creates a new activity entry in the database
 */
var create = function(req, res)
{
    var p = req.body;
  
    var sql = "INSERT INTO activities SET createdWhen=NOW(), ?";        
    var values = prepareCreate(p);
    
    var success = function(d){
        
        var id = d.result.insertId;
        p.id = id;
        //console.log("created activity id "+id);
            
        
        if(id>0)
        {       
            //Create server directory
            path = __serverDir+"/activities/"+id;
            //console.log("creating server directory structure "+path);
            fs.mkdirSync(path);
            
            
            //Create client directory
            var base = __publicDir+"/activities/";
            var path = base+id;
            //console.log("creating public directory structure "+path);
            fs.mkdirSync(path);
            
            //If icon has been set and no relative path is defined then update to activity home folder
            if(p.icon && p.icon.indexOf("/")<0){
                p.icon = '/activities/'+id+"/"+p.icon;                
                app.db.query("UPDATE activities SET icon='"+p.icon+"' WHERE id="+id)();
            }            
            
            //If youtube video then download icon
            if(p.ytid && p.tech==='YT'){
               downloadYoutubeIcon(p.ytid, p.id);               
            } else if(p.ytid && p.tech==='VM'){                
               //Download vimeo icon
                downloadVimeoIcon(p.ytid, p.id);                
            }
                                    
            //If geogebra download icon and ggb file
            if(p.ggbid){
                downloadGGBIcon(p.ggbid, p.id);
            }
            
            
            if(!p.tmpDirNode)
            {
                //CLIENT: Must copy template directory into generated id
                //console.log("cp -r \""+base+"templates/client/\"*  \""+path+"/\"");
                exec("cp -r \""+base+"/templates/client/*\"  \""+path+"\"", function(error, stdout, stderr){
                    
                            //Edit the theory.html file according to the current configuration
                            //p.ytid, p.ggbid, etc                               
                            var code = p.theory || "<p></p>";
                            if(p.type==='A' || p.type==='V' || p.type=='0'){
                                code = generateHTMLCode(p);
                            } 
                            
                            fs.writeFile( path+"/theory.html", code, function(err) {
                                
                                
                                //SERVER: Must copy template directory into generated id
                                path = __serverDir+"/activities/"+id;              
                                //console.log("cp -r \""+base+"templates/server/*\" \""+path+"/\"");
                                exec("cp -r \""+base+"/templates/server/\"* \""+path+"\"", function(error, stdout, stderr){
                                    
                                    
                                    
                                    //MUST GENERATE A TEMPLATE FOR QProvider JSON
                                    var qprovider = {
                                        activity: {
                                            "author": values.createdBy || "admin",
                                            "levels": values.levels || "*",
                                            "title": {
                                                "en": p.title.en || "",
                                                "ca": p.title.ca || "",
                                                "es": p.title.es || ""
                                            },
                                            "description": {
                                                "en": p.description.en || "",
                                                "ca": p.description.ca || "",
                                                "es": p.description.es || ""
                                            },
                                            "category": values.category || "G",
                                            "type": values.type || 'A'
                                        },
                                        config: {
                                            "shuffleQuestions": true,
                                            "shuffleOptions": true,
                                            "browsable": false,
                                            "timeout": values.type==='Q'? 60 : 0,
                                            "allowerrors": 2,
                                            "canAskTheory": false,
                                            "canAskHelp": false
                                        },
                                        questions: []
                                    };
                                    
                                    var tasks = [];
                                   
                                    if(p.qprovider && p.qprovider.questions){
                                        qprovider.questions = p.qprovider.questions;
                                    }
                                    if(p.qprovider && p.qprovider.config){
                                        for(var key in p.qprovider.config){
                                            qprovider.config[key] = p.qprovider.config[key];
                                        }
                                    }
                                    if(p.serverdata){
                                        tasks.push( function(cb){
                                            fs.writeFile(__serverDir+'/activities/'+p.id+"/server-data.json", JSON.stringify(p.serverdata, null, '\n'), cb);
                                        });
                                    }                                     
                                    tasks.push(function(cb){
                                        fs.writeFile(path + "/QProvider.json", JSON.stringify(qprovider, null, '\t'), "utf8", function(){
                                            if (p.type === 'Q'){
                                                 compileActivity(id, cb, cb);
                                             }
                                             else {
                                                cb();
                                            }
                                        });
                                    });
                                                                        
                                    if(tasks.length){
                                        async.parallel(tasks, function(){
                                            res.send({ok: true, idActivity: id}); 
                                        });
                                    } else {
                                       res.send({ok: true, idActivity: id}); 
                                    }
                                    
                            });
                        });      
                            
                });
                
                
            }
            else 
            {
                //Must copy upload activity directory into generated id
                exec("cp -r "+base+"/"+p.tmpDirNode.file+"/client/* "+path, function(error, stdout, stderr){
                        path = __dirname+"/../activities/"+id;                
                        exec("cp -r "+base+"/"+p.tmpDirNode.file+"/server/* "+path, function(error, stdout, stderr){
                               res.send({ok: true, idActivity: id}); 
                        });
                });
               
            }  
        }
        else
        {
            res.send({ok: false, idActivity: 0}); 
        }
    };
    
    var error = function(d){
        res.send({ok: false, idActivity: 0});
    };
    app.db.queryBatch(sql, values, success, error)();
};


var clone = function(req, res)
{
     var p = req.body;
     var oldId = p.activity.id;
     
     var sql = " INSERT INTO activities  (activities.levels, activities.idSubject, activities.activity, activities.activityType, activities.share, activities.createdBy, activities.createdWhen, activities.description, activities.category, activities.difficulty) SELECT a.levels, a.idSubject, replace(a.activity, ':\"', ':\"(2) ') as activity, a.activityType, a.share, '"+
             p.username+"' as createdBy, NOW() as createdWhen, a.description, a.category,  NULL as difficulty  FROM activities AS a WHERE a.id='"+oldId+"'";
     //var values = prepareCreate(p.activity);
    
     var success = function(d){
        
        var id = d.result.insertId;
               
        //console.log("cloned activity "+oldId+ " to id "+id);
        if(id>0)
        {
            var base = __dirname+"/../../public/activities";
            
            //Must copy public and server directories 
            exec("cp -r "+base+"/"+oldId+" "+base+"/"+id, function(error, stdout, stderr){
                res.send({ok: true, idActivity: id}); 
            });    
            
            base = __dirname+"/../activities";
            exec("cp -r "+base+"/"+oldId+" "+base+"/"+id);
        }
        else
        {
            res.send({ok: false, idActivity: 0}); 
        }
    };
    
    var error = function(d){
        res.send({ok: false, idActivity: 0});
    };
    app.db.query(sql, success, error)();
};

var updateshare = function(req, res)
{
     var p = req.body;
     var sql = "UPDATE activities SET share='"+p.share+"' WHERE id='"+p.id+"'";  
     var success = function(d)
     {
        res.send({ok:true});
     };
     var error = function(d)
     {
        res.send({ok:false});
     };
    
     app.db.query(sql, success, error)();
};

var updaterating = function(req, res)
{
     var p = req.body;
     //console.log(p);
     var f = "";
     var s = ""; 
     if(p.rating)
     {
         f = "rate='"+p.rating+"'";
         s = ",";
     }
     if(p.vrating)
     {
         f += s+"vrate='"+p.vrating+"'";
     }
     if(!f){
         f = "rate=rate";
     }
     var sql = "UPDATE ratings SET "+f+" WHERE idActivity='"+p.idActivity+"' AND idUser='"+p.idUser+"'";  
     var success = function(d)
     {
        if(d.result.affectedRows>0)
        {
            res.send({ok:true});
        }
        else
        {
            sql = "INSERT INTO ratings SET "+f+", idActivity='"+p.idActivity+"', idUser='"+p.idUser+"'"; 
            app.db.query(sql, function(d){res.send({ok: true});}, error)();
        }
     };
     var error = function(d)
     {
        res.send({ok:false});
     };
    
     app.db.query(sql, success, error)();
};

var update = function(req, res)
{
    var p = req.body;
    // SQL query to list all attempts associated with an activity/userId
     
    var sql = "UPDATE activities SET ? WHERE id='"+p.id+"'";        
    var type = p.type;
    if(p.type.toLowerCase()==='simple')
    {
        type = 0;
    } 
    
    //If youtube video then download icon
    if(p.ytid && p.tech==='YT'){
           downloadYoutubeIcon(p.ytid, p.id);               
    } else if(p.ytid && p.tech==='VM'){                
           //Download vimeo icon
            downloadVimeoIcon(p.ytid, p.id);                
    }

    //If geogebra download icon and ggb file
    if(p.ggbid){
            downloadGGBIcon(p.ggbid, p.id);
    }
    
    var g = "";
    var comma = "";
    p.levels.forEach(function(e){ 
        if(e.trim())
        {
            g += comma+e; comma=", ";
        }
    });
    
    var title = JSON.stringify(p.title);
    var desc = JSON.stringify(p.description);
    
    var categories = "";
    comma = "";
    p.categories.forEach(function(e){
        if(e.trim())
        {
            categories += comma+ e; 
            comma = ", ";
        }
    });
    
    var values = {levels: g, activity: title, category: categories, activityType: type || 0, share: p.share || 2, description: desc, icon: p.icon};
    
    
    var success = function(d)
    {      
      var tasks = [];  
      if(p.theory || p.type==='V'){
          tasks.push(function(cb){
               var code = p.theory || "<p></p>";
               if(p.type==='V'){
                    code = generateScriptCode(p).join("\n") + p.theory;
               }                             
               fs.writeFile(__publicDir+'/activities/'+p.id+"/theory.html", code, cb);
           });
      }
      if(p.qprovider && type==='Q'){
          tasks.push(function(cb){
                fs.writeFile(__serverDir+'/activities/'+p.id+"/QProvider.json", JSON.stringify(p.qprovider, null, '\t'), function(){
                    compileActivity(p.id, cb, cb);
                });
            });
      }
      if(p.serverdata){
          tasks.push(function(cb){
              fs.writeFile(__serverDir+'/activities/'+p.id+"/server-data.json", JSON.stringify(p.serverdata, null, '\t'), cb);
          });
      }
      
      if(tasks.length){
          async.series(tasks, function(){
              res.send({ok:true});
          });
      } else {
            res.send({ok:true});
      }
      
    };
    
    var error = function(d)
    {
        res.send({ok:false});
    };
    
    app.db.queryBatch(sql, values, success, error)();
};

var load = function(req, res)
{
    var p = req.body;
    var sql = "SELECT * FROM activities WHERE id='"+p.id+"'";
    var a = {};
    var success = function(d)
    {
        if(d.result.length<=0)
        {
           res.send(a); 
            return;
        }
          a = d.result[0];
          var t = {};
          try{
             
            t = JSON.parse(bracelets(a.activity));
          }catch(ex){
              //console.log(ex);
          };
          a.title = t;
          
          var d = {};
          try {             
            d = JSON.parse(bracelets(a.description));
          }catch(ex){
              //console.log(ex);
          }
          a.description = d;
          
          a.levels = (a.levels || "").trim().split(",").map(function(e){return e.trim();});
          a.categories = (a.category || "").trim().split(",").map(function(e){return e.trim();});
          
     
          a.type = a.activityType; //==0?"Simple":"Composite";
          //console.log(a);
          res.send(a);
       
    };
    
    var error = function(d)
    {
        res.send(a);
    };
    
    app.db.query(sql, success, error)();
    
};

var remove = function(req, res)
{
    var p = req.body;
    var sql = "DELETE FROM activities WHERE id="+p.id;
    
    var success = function(d)
    {
      if(d.result.affectedRows>0)
      {
          var base1 = __dirname+"/../../public/activities/";
          var path1 = base1+p.id;
          
          var base2 = __dirname+"/../activities/";
          var path2 = base2+p.id;
          
          exec("mv "+path1+" "+base1+"/trash", function(error, stdout, stderr){
              if(error)
              {
                  //console.log(error);
                  res.send(false);
                  return;
              }
              
              exec("mv "+path2+" "+base2+"/trash", function(error, stdout, stderr){
               if(error)
                {
                  //console.log(error);
                  res.send(false);
                  return;
                }   
                res.send(true); 
              });
              
          });
      }
      else
      {
          res.send(false);
      }
    };
    
    var error = function(d)
    {
        res.send(false);
    };
    
    app.db.query(sql, success, error)();
    
};

/*
 * Gets information about a given attempt
 * performed in an activity idActivity
 *
 */
var review = function(req, res)
{
    //The response contains two objects attempt info and activity itself info
    //Activity object is composed by a list of questions which contains a list of
    //steps which, in turn, has a list of answers.
    var response = { attempt:{}, activity:[] };
    
     
    var p = req.body;
    var idAttempt = p.idAttempt || 0;
    
    //First retrieve information about this attempt
    var sql0 = "SELECT a.*, date_format(a.attemptStart,'%d-%m-%Y %H:%i') as start, time_to_sec(timediff(a.attemptEnd, a.attemptStart)) as seconds,"+
            " u.id AS idUser, u.fullname, act.activity, act.description FROM attempts AS a INNER "+
            "JOIN logins AS l ON l.id=a.`idLogins` INNER JOIN users AS u ON "+
            "u.`id`=l.`idUser` LEFT JOIN activities as act on act.id=a.idActivity  WHERE a.id=" + idAttempt;

    var error = function(d){ 
        res.send(response); 
    };
    
    var success0 = function(d){        
        var entry = d.result[0] || {};
        var lang = req.body.lang || app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY") || "en";
        //console.log("Reiew lang is "+lang);
        i18n_activity(entry, lang);     
        response.attempt =entry;
    };
    
    var q0 = app.db.query(sql0, success0, error);
    
    // SQL query to list all questions and answers associated to this attempt
    var sql1 = "SELECT * FROM questions WHERE idAttempt="+idAttempt;    
    var success1 = function(d){ 
        //keep a copy of questions data
        d.activity = [];
        
        var worker = function(row, cb){
            var ok3 = function(d3){
                row.answers = d3.result;
                cb();
            };
            app.db.query("SELECT * FROM answers WHERE idQuestion="+row.id, ok3, cb)();
        };
        
      
        d.result.forEach(function(row)
        {
            row.answers = []; //For every question add an object array for allocating answers
            d.activity.push(row);
        });
        
        async.mapSeries(d.result, worker, function(){
            response.activity = d.activity;
            res.send(response);     
        });
    };
    
    var q1 = app.db.query(sql1, success1, error);
    
     
    q0().then(q1);
};

/**
 * Gets information about a certain activity,
 * it also retrieves information about the assignment
 **/
        
var getTheoryData = function (idActivity, lang) {
    var defer = Q.defer();
    var url = __publicDir+"/activities/" + idActivity + "/theory_" + lang + ".html";
    fs.readFile(url, 'utf-8', function(err, data) {
        if(err){
             url = __publicDir+"/activities/" + idActivity + "/theory.html";
             fs.readFile(url, 'utf-8', function(err, data2) {
                  defer.resolve(data2 || "");
             });
        } else {
            defer.resolve(data);
        }                                   
    });
    return defer.promise;
};
              

var obtain = function(req, res){
    var p = req.body;
    var idActivity = p.idActivity;
    var idUser = p.idUser;
    
    var lang = p.lang || app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY") || "en";
    
    //OLD QUERY WHERE visualization used idUSer instead of idLogin
    //var sql = "select a.*, if(v.vscore is null,0, v.vscore) as vscore, if(r.rate is null, 0, r.rate) as rating from activities as a left join visualization as v on (v.idActivity=a.id and v.idUser='"+
    //        idUser+"') left join ratings as r on (r.idActivity=a.id and r.idUser='"+idUser+"')  where a.id='"+idActivity+"'";
    
    
    var sql = "select act.*, if(sum(vscore) is not null, sum(vscore),0) as vscore, if(r.rate is null, 0, r.rate) as rating, if(r.vrate is null, 0, r.vrate) as vrating from activities as act LEFT JOIN visualization as v on act.`id`=v.idActivity "+
              "inner join logins as l on l.id=v.idLogins left join ratings as r on (r.`idUser`='"+idUser+"' and r.`idActivity`=v.`idActivity`) where l.idUser='"+idUser+"' and v.idActivity='"+idActivity+"'";
    
    var output = {};
    
    var success = function(d){
        output = d.result[0] || {};
        
        //internationalize
        i18n_activity(output, lang); 
        
        //Attach the suggested level for this activity/User       
        //output.suggestedLevel = Brain.getBrain(app.db, idUser).getLevel(output.idSubject, output.category);         
    };
    
    var error = function(d){
        res.send(output);
    };
    
    var q1 = app.db.query(sql, success, error);
    
    //Lists comments on this activity date_format(c.when,'%d-%m-%Y %H:%i') as `when`
    var sql2 = "select c.id, c.idUser, c.when as `when`, c.comment, u.fullname, u.schoolId, u.uopts from comments as c inner join users as u on u.id=c.idUser where idActivity='"+idActivity+"' order by c.when asc";
    var success2 = function(d){         
               
         //Parse avatar
         d.result.forEach(function(e){
            var json = {avatar: "0"};
            try{
                json = JSON.parse(e.uopts || '{}');
            } catch(ex){
                //
            };
            e.avatar = json.avatar || "0";
            delete e.uopts;
         });
         
         output.comments = d.result; 
         
         //Update activity counter if p.counter is present
        if(p.counter){
            app.db.query("UPDATE activities SET `counter`=`counter`+1 WHERE id='"+p.idActivity+"'")();
        }
    
        
        //This query is to obtain information about the assignment associated with the activity, just to determine if it is open or closed
        output.assignment = {open: false};         
        //Only query if an idAssignment is passed.
        if(p.idAssignment){
             //CHECK ME PLEASE
             var sql3 = "SELECT asgn.*, max(if(l.idUser is NOT NULL, atm.score, 0)) as maxscore, "+
               " sum(if(l.idUser is NOT NULL, 1, 0)) as doneAttempts, if(maxAttempts=0 OR sum(if(l.idUser is NOT NULL, 1, 0))<maxAttempts,"+
               " if ( (asgn.fromDate IS NULL OR now()>=asgn.fromDate) AND (asgn.toDate IS NULL OR now()<asgn.toDate), 1, 0), 0) as open FROM "+
               " assignments AS asgn LEFT JOIN assignments_users as au ON asgn.id=au.idAssignment LEFT JOIN activities as a ON a.id=asgn.idActivity "+
               " LEFT JOIN attempts as atm on (atm.`idAssignment`=asgn.id ) LEFT JOIN logins as l on (l.id=atm.idLogins AND l.idUser='"+p.idUser+"') "+
               " WHERE (au.idUser='"+p.idUser+"' OR asgn.applyToAll=1) AND asgn.id='"+p.idAssignment+"' GROUP BY asgn.id";
        
             var success3 = function(d){                 
                  if(d.result.length){
                        output.assignment = d.result[0];
                        try {
                            output.assignment.params = JSON.parse(output.assignment.params);  
                        } catch(ex){
                             output.assignment.params = {}; 
                        }
                  }
                                    
                  getTheoryData(idActivity, lang).then(function(data){
                      output.theoryData = data;
                      res.send(output);        
                  });
                  
             };
             
             app.db.query(sql3, success3, error)();    
         }
         else{
               getTheoryData(idActivity, lang).then(function(data){
                      output.theoryData = data;
                      res.send(output);        
              }); 
         }
    };
    
    
     
    var q2 = app.db.query(sql2, success2, error);
    
    q1().then(q2);
};



/* INTER
 * @param {type} req
 * @pa
 * @param {type} req
 * @param {type} res
 * @returns {undefined}ram {type} res
 * @returns {undefined}NALIZATION OF ACTIVITIES
 * Resolve translations map: Look in activities/{idActivity}/i18n/*.json
 *  try to find {lang}.json
 *  if not, try to find en.json
 *  if not, return "{}"
 *  
 *  Resolve theory path: Look in activities/{idActivity}/
 *  try to find theory_{lang}.html
 *  if not, try to find theory.html
 *  if not return "";
 *  
  * @param {type} req
  * @param {type} res
  * @returns {undefined}
 *  
 */
var i18n = function i18n(req, res)
{
   
    var p = req.body;
    var lang = p.lang || app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY") || 'en';
    var path = __dirname+"/../../public/activities/"+p.idActivity+"/";
    
    var response = { theoryPath:"", translations: {} };
    
    
    //Load translations
    var step1 = function(callback){
        
        fs.readFile(path+"i18n/"+lang+".json", 'utf8', function(err, data){
        
        if(err)
        {
            fs.readFile(path+"i18n/en.json", 'utf8', function(err, data){
                 if(err)
                 {
                     callback(null, data);
                     return;
                 }
                 try{
                     response.translations = JSON.parse(data);
                }
                catch(e){
                    //console.log(e);
                }
                callback(null, data);
            });
            return;
        }
        
        try{
            response.translations = JSON.parse(data);
        }
        catch(e){
            //console.log(e);
        }
        callback(null, data);
        
        });
    };
    
    //Search for theory files
    var step2 = function(callback){
        
        fs.readFile(path+"theory_"+lang+".html", 'utf8', function(err, data){
        
        if(err)
        {
            fs.readFile(path+"theory.html", 'utf8', function(err, data){
                 if(err)
                 {
                     callback(null, data);
                     return;
                 }
                 response.theoryPath = "activities/"+p.idActivity+"/theory.html";
                 callback(null, data);
            });
            return;
        }
        
        
        response.theoryPath = "activities/"+p.idActivity+"/theory_"+lang+".html";
        callback(null, data);
        });
    
    };
    
    async.parallel([step2, step1], function(e, d){
            res.send(response);
    });
    
};

/***
 * 
 * @param {type} req
 * @param {type} res
 * @returns {undefined}Evitar comentaris sense text
 * 
 */
var updatecomment = function(req, res)
{
    var p = req.body;
    
    var query = "";
    var obj = {comment: p.comment || ""};
    
    if(p.id)
    {
        if(p.comment && p.comment.trim().length > 0){
            query = "UPDATE comments SET ? WHERE id="+p.id;
        } else {
            query = "DELETE FROM comments WHERE id="+p.id;
        }        
    }
    else
    {
        query = "INSERT INTO comments SET ?"
        obj.idUser = p.idUser || 0;
        obj.idActivity = p.idActivity || 0;
    }
    
    var error = function(d){
        res.send({ok: false, id: p.id});
    };
    
    var success = function(pd){
        if(!pd.id)
        {
            obj.id = pd.result.insertId;
        }
        if(pd.result.affectedRows>0)
        {
//                var d = new Date();
//                var now = ("00" + (d.getMonth() + 1)).slice(-2) + "/" +
//                        ("00" + d.getDate()).slice(-2) + "/" +
//                        d.getFullYear() + " " +
//                        ("00" + d.getHours()).slice(-2) + ":" +
//                        ("00" + d.getMinutes()).slice(-2);
//                
            res.send({ok: true, id: obj.id, when: new Date(), deleted: p.comment.trim().length<=0});
        }
        else            
        {
            res.send({ok: false, id: p.id});
        }        
    };
    
    app.db.queryBatch(query, obj, success, error)(); 
}

var delcomment = function(req, res)
{
    var p = req.body;
    
    var query = "DELETE FROM comments WHERE id='"+p.id+"'";
    
    var error = function(d){
        res.send({ok:false});
    };
    
    var success = function(d){
        if(d.result.affectedRows>0)
        {
            res.send({ok:true});
        }
        else            
        {
            res.send({ok:false});
        }        
    };
    
    app.db.query(query, success, error)(); 
};


var importzip = function(req, res)
{
    var form = new formidable.IncomingForm();
    
    form.parse(req, function (err, fields, files) {
        if(err){
            //console.log(err);
            res.send({});
            return;
        }
        var file = files.file;
        if(!file.name.endsWith('.zip'))
        {
            res.send({});
            return;
        }
        var tempPath = file.path;
        var base = __dirname+"/../../public/activities/";
        var tmpDir = "trash/"+Math.random().toString(36).slice(2);
        exec("unzip "+tempPath+" -d "+base+tmpDir, function(error, stdout, stderr){
            exec("rm -fr "+tempPath); //Deletes uploaded zip file
            if(error){
                //console.log(err);
                res.send({});
                return;
            }
            
            //Reads json file if present -- otherwise use an empty "a"
            var response = {a: {}, tmpDirNode: {isDir:true, file: tmpDir, server: false}};
            
            fs.readFile(base+tmpDir+"/server/QProvider.json", 'utf8', function(err, data){
                if(err){
                    res.send(response);
                    return;
                }
                var json;
                try{
                    json = JSON.parse(data).activity || {};
                } catch(ex){
                    res.send(response);
                    return;
                }
                 
                response.a.title = json.title || {ca:'',es:'',en:''};
                response.a.description = json.description || {ca:'',es:'',en:''};
                response.a.categories = (json.category.split(',') || []).map(function(e){return e.trim();});;
                response.a.levels = (json.levels.split(',') || []).map(function(e){return e.trim();});;
                response.a.type= json.type; //? "Composite" : "Simple",
                response.a.author= json.author || fields.username;
                response.a.share = json.share || 2;
                response.a.id = 0;
                
                res.send(response);  
            });
            
        });
        
    });

};

/**
 * 
 * @param {type} req
 * @param {type} res
 * @returns {undefined}This method returns the level for a given a category and idUser
 */
var brain = function(req, res){    
    var p = req.body;
    
    var level = Brain.getBrain(app.db, p.idUser+"").getLevel(p.idSubject, p.category);
    res.send({suggestedLevel: level});
     
};

// Packs the actity into a zip file and downloads the file
var pack = function(req, res){
    var id = req.params.id;
    
    //Create a temporal dir with structure client/  server/
    var tmpPath = app.config.paths.tmp+"/"+Math.random().toString(36).slice(2)+"/";
    console.log(tmpPath);
    fs.mkdir(tmpPath, function(err){        
         fs.mkdir(tmpPath+"/client", function(err){
             fs.mkdir(tmpPath+"/server", function(err){
                    exec("cp -r "+__publicDir+"/activities/"+id+"/* "+tmpPath+"/client/", function(error, stdout, stderr){
                        exec("cp -r "+__serverDir+"/activities/"+id+"/* "+tmpPath+"/server/", function(error, stdout, stderr){
                            
                                //Falta editar el fitxer QProvider.json perquè correspongui a la informació que hi ha a la base de dades
                            
                                var tgz = app.config.paths.tmp+"/iMaths-activity-"+id+".tgz";
                                var cmd = "tar -czf "+tgz+"  client server";
                                exec(cmd, {cwd: tmpPath}, function(error, stdout, stderr){
                                    
                                    exec("rm -fr "+tmpPath, function(error, stdout, stderr){
                                      //  
                                    });
                                    
                                    res.download(tgz, "/iMaths-activity-"+id+".tgz", function(err){
                                        fs.unlink(tgz); //when download is ready
                                    });
                                    
//                                    try{
//                                        var filename = path.basename(tgz);
//                                        var mimetype = mime.lookup(tgz);
//
//                                        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
//                                        res.setHeader('Content-type', 'application/x-gzip');
//
//                                        var filestream = fs.createReadStream(tgz);
//                                        filestream.pipe(res);    
//                                        res.on( 'end', function(){
//                                          //  fs.unlink(tgz); //when download is ready
//                                        });
//                                    } catch(ex){
//                                        res.send("");
//                                    }
                       
                                    
                                    
                                });
                        });                
                    });                
             });
        });
        
    });
};


//input is a list of {text: 'Prova de traducció a un altre idioma', source: 'ca', target: 'en'}
var traductor = function(req, res){
    var p = req.body;
    if(!p.target.length)
    {
        p.target = [p.target];
    }
    var translations = {};
   
    var doTask = function(e, cb){
   
        translate({text: p.text, source: p.source, target: e}, function(result){                                  
                       translations[e] = result.translation;
                       cb();
        });
                     
    };              
 
        
    //Traslate in parallel
    async.map(p.target, doTask, function(err, results){
       res.send(translations);
    });
    
};


    app.post('/rest/activity/searchActivities', search);    
    app.post('/rest/activity/create', AdminsAndTeachersMdw, create);
    app.post('/rest/activity/clone', AdminsAndTeachersMdw, clone);
    app.post('/rest/activity/update', update);
    app.post('/rest/activity/updateshare', updateshare);
    app.post('/rest/activity/updaterating', updaterating);
    app.post('/rest/activity/load',load);
    app.post('/rest/activity/delete', AdminsAndTeachersMdw, remove);
    app.post('/rest/activity/brain', brain);
    
    app.post('/rest/activity/fetchreview', review);
    app.post('/rest/activity/get', obtain);
    app.post('/rest/activity/i18n', i18n);
       
    app.post('/rest/activity/updatecomment', updatecomment);
    app.post('/rest/activity/delcomment', delcomment);    
     
    app.post('/rest/activity/importzip', AdminsAndTeachersMdw, importzip); 
    app.get('/rest/activity/pack/:id', AdminsAndTeachersMdw, pack); 
   
    app.post('/rest/activity/translate', AdminsAndTeachersMdw, traductor); 
};
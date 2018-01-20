/*
 * File system api
 */
module.exports = function(app){

    var fs = require('fs'),
        winston = require('winston'),
        exec = require('child_process').exec,
        compressor = require('node-minify'),
        generator = require('../activity/generator.js'),
        path = require('path'),
        Cookies = require('cookies'),
        formidable = require('formidable'),
        async = require('async'),
        cheerio = require('cheerio');

    require('../util.js');

    
    var del = function(req, res)
    {
        var log = [];
        var p = req.body;
        
        var server = p.node.server? true: false;
       
        var base = __publicDir+"/activities/";
        if(server && !p.idUser)
        {
            base = __serverDir+"/activities/";
        }
        else if(p.idGroup)
        {
            base = __publicDir+"/files/"+p.idGroup+"/";
        }
        else if(p.idUser)
        {
            if(server){
                base = __serverDir+"/files/users/"+p.idUser+"/";
            } else {
                base = __publicDir+"/files/users/"+p.idUser+"/";
            }
        }
 
        var path =  base + p.node.file; 
        
        if(p.node.dir)
        {             
            exec("rm -rf \""+path+"\"", function (err, out) {
                 if(err)
                 {
                     log.push(err);
                     res.send({ok: false, log: log.join('<br>')});
                     return;
                 }
                 log.push("Deleted: "+path);
                 res.send({ok: true, log: log.join('<br>')});
            });
        }
        else
        {
            fs.unlink(path, function(){
                log.push("Deleted: "+path);
                res.send({ok: true, log: log.join('<br>')});
            });
        }
    };
   
   

    //Async walk
    function walk(base, server, dir, done) {
        
        var l = base.length;
         
        var results = {"file": dir.substring(l), "title": dir.substring(dir.lastIndexOf("/")), "nodes": [], dir: true, collapsed: true, server: server};
     
        fs.readdir(dir, function (err, list) {
            if (err) {
                return done(err);
            }
            var pending = list.length;
            if (!pending) {
                return done(null, results);
            }
            list.forEach(function (f) {
                var file = dir + '/' + f;       //this is the entire file
                var file2 = file.substring(l);  //this is the relative file
            
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        walk(base, server, file, function (err, res) {
                            results.nodes.push(res);
                            if (!--pending) {
                                done(null, results);
                            }
                        });
                    } else {
                        results.nodes.push({"file": file2, "title": f, dir: false, server: server});
                        if (!--pending) {
                            done(null, results);
                        }
                    }
                });
            });
        });
    };


     
    
    //Synchronous walk
     function walkSync(base, server, dir, tree) {
        if(!tree)
        {
            tree = [];
        }
        
        var l = base.length;
        
        var list = fs.readdirSync(dir);
        list.forEach(function(f) {
            var file = dir + '/' + f;
            var stat = fs.statSync(file);
            var file2 = file.substring(l);
            if (stat && stat.isDirectory()) {
                var subtree = [];
                
                //Only store files relative to the public folder
                tree.push({file: file2, title: f, nodes: subtree, dir: true, collapsed: true, server: server});
                walkSync(base, server, file, subtree);
            }
            else {
                tree.push({file: file2, title: f, dir: false, server: server});
            }
        });
        
        return tree;
    };
    
    var dir = function(req, res)
    {
        var p = req.body;
        var server = p.server? true: false;
      
        var base = __publicDir+"/activities/";
        if(server)
        {
            base = __serverDir+"/activities/";
        }
        else if(p.idGroup)
        {
            base = __publicDir+"/files/"+p.idGroup+"/";
            //make sure that this directory actually exists
            try{
                fs.mkdirSync(base);
            } catch(ex){
                //
            }
        }

        
        var path = base+p.path;
        //Make these directories in case they do not exist
        fs.mkdir(path, function(err){             
             //var nodes = [];
             //var root = [{f:"", file:"", nodes: nodes, dir:true}];
             //walkSync(base, server, path, nodes);
             walk(base, server, path, function(err, tree){
                 if(err){
                     winston.error(err);
                     res.send({});
                     return;
                 }
                 tree.root = true;
                 res.send([tree]);
             });
             
        }); 
          
    };
    
    /**
     * Extracts the questions array from the theory html
     * Removes all <script> tags in html
     * @param {type} html
     * @returns {undefined}
     */
    var getQuestionsTheoryHtml = function(html, idActivity){
        
        var ret = {html: html, questions: []};
        
        var $ = cheerio.load(html);
        //Determine which is the variable associated with the questions
        var ytv  = $('video-embed');
        var qs = ytv.attr('questions');
        
        var scripts = $("script"); //[id='theory-controller-"+idActivity+"']
        if(scripts.length){
                if(qs){
                        var controllers = {};		
                        var ctrl = function(name, list){
                                //console.log("called ctrl", name, list);
                                var fn;
                                var args = [];
                                if(Array.isArray(list)){
                                        list.forEach(function(e){
                                                if(typeof(e)==='function'){
                                                        fn = e;
                                                } else if(typeof(e)==='string') {
                                                        if(e==='$scope'){
                                                                args.push($scope);
                                                        } else{
                                                                args.push({});
                                                        }

                                                }
                                        });				
                                } else if(typeof(list)==='function'){
                                        fn = list;
                                        args.push($scope);		
                                }

                                if(fn){
                                        fn.apply(null, args);
                                }


                                controllers[name] = fn;
                        };
                        var register = {controller: ctrl};
                        var app = {register: register};
                        var piworld = {app: app};
                        var window = {piworld: piworld};
                        var $scope = {};


                        try{			
                                var s = scripts.html().replace(/\\n/g,'');
                                try{
                                        eval(s);
                                        if(Object.keys(controllers).length>0){
                                                if($scope[qs] && Array.isArray($scope[qs])){
                                                        ret.questions = $scope[qs];
                                                } 
                                        }
                                } catch(ex){
                                        console.log("A problem while evaluating code");
                                        console.log(ex);
                                }
                                		

                        } catch(ex){
                                console.log(ex);
                        }
                        
                }
        } 
        
       
        ret.scripts = scripts.html();
        scripts.remove();
        ret.src = $.html();
        
        return ret;
    };
    
    var get = function(req, res)
    {
        var p = req.body;
        var server = p.server? true: false;
      
        var base = __publicDir+"/activities/";
        if(server)
        {
            base = __serverDir+"/activities/";
        }
        else if(p.idGroup)
        {
             base = __publicDir+"/files/"+p.idGroup+"/";
        }


        var path =base+p.path;
        var idot = path.lastIndexOf(".");
        
        var getLangPath = function(lang){
             if(!lang || idot<=0){
                 return path;
             }
             
             var path0 = path.substring(0, idot);
             var ext =path.substring(idot+1, path.length);
             return path0+"_"+lang+"."+ext;           
        };
        
        
        var send = function(data, realPath){
            if (p.encrypt) {
                data = app.encrypt(data);
            }
            if (p.parse && realPath.indexOf("theory") >= 0) {
                //parse theory in order to get the questions object
                var ret = getQuestionsTheoryHtml(data, p.idActivity);
                ret.path = realPath;
                res.send(ret);
            } else {              
                res.send({src: data, path: realPath});
            }
        };
        
        
        //Try to get the i18n version of the file 
        //if file is test.json, first it will check if test_lang.json exists; if
        //not check test.json; finally check test_en.json
        
        var pathNow = getLangPath(p.lang || "");
        
        fs.readFile(pathNow, "utf8", function(err, data){
            if(err)
            {
                if(p.lang){
                    pathNow = getLangPath();
                    fs.readFile(pathNow, "utf8", function(err, data){
                          if(err){
                              pathNow = getLangPath("en");  
                              fs.readFile(pathNow, "utf8", function(err, data){
                                    if(err){
                                        res.send({src: "", path: pathNow});
                                    }
                                    else {
                                        send(data, pathNow);
                                    }
                              });
                          }
                          else {
                            send(data, pathNow);
                          }                          
                    });                
                }
                else {
                    res.send({src: "", path: pathNow});                
                }
            }
            else {            
                send(data, pathNow);
            }
                      
        }); 
    };
    
    
    

function removeComments(html){
    return html.replace(/<!--[\s\S]*?-->/g, "");
}

function findTag(html, tag){
    var reTag = new RegExp("<\\s*\\/?\\s*"+tag+"\\s*.*?>", "gi");
    return html.match(reTag);
}

function findTagWithAttr(html, attr){
    var reTag = new RegExp('<\\s*\\w*\\s*'+attr+'\\s*=\\s*"?\\s*([\\w\\s%#\\/\\.;:_-]*)\\s*"?.*?>', "gi");
    return html.match(reTag);
}

function findAttr(tagsrc, attr){
    var reTag = new RegExp(attr+"\=\"(\\s*.*?)\"", "i");
    var tmp = tagsrc.match(reTag);    
    return tmp? tmp[1]: null;
}

function parseHtml(src){
   
    var row = {ytid: null, tech: 'YT', ytqu: 0, ggbid: null, createjs: 0};    
    try {
            var html = removeComments(src);
            html = html.replace(/\n/g, "");

            var yt_tags = findTag(html, "video-embed");
            if (yt_tags) {
                var ytid = findAttr(yt_tags[0], "video-id");
                var url = findAttr(yt_tags[0], "video-url");
                row.ytqu = findAttr(yt_tags[0], "questions") ? 1 : 0;

                if (ytid.trim().indexOf("'") === 0) {
                    ytid = ytid.substr(1, ytid.length - 2);
                    row.ytid = ytid;
                }
                
                if(url){
                    
                    if(url.toLowerCase().indexOf(".mp4")>0){
                        row.tech = "FI";
                    } else if(url.toLowerCase().indexOf("vimeo.com")>=0){
                        row.tech = "VM";
                    }                        
                }
            }

            var ggb_tags = findTagWithAttr(html, "geogebra");
            if (ggb_tags) {
                var tmp = ggb_tags[0].replace(/>/g, "/>");

                row.ggbid = findAttr(tmp, "geogebra");
            }

            //geogebra could also come in form of iframe
            (findTag(html, "iframe") || []).forEach(function (iframe) {
                if (iframe) {
                    var tmp = iframe.replace(/>/g, "/>");
                    //<iframe scrolling="no" src="https://www.geogebra.org/material/iframe/id/2465755/width/2421/height/1155/border/888888/rc/false/ai/false/sdz/true/smb/false/stb/false/stbh/true/ld/false/sri/true/at/auto" class="media-pdf"> </iframe>
                    //                             http://tube.geogebra.org/m/2517411
                    var src = findAttr(tmp, "src");
                    if (src && src.indexOf("geogebra.org") > 0) {
                        var i0 = src.indexOf("/iframe/id/");
                        var offset = 11;
                        if (i0 < 0) {
                            i0 = src.indexOf("geogebra.org/m/");
                            offset = 15;
                        }
                        src = src.substr(i0 + offset);
                        i0 = src.indexOf("/");
                        if (i0 >= 0) {
                            src = src.substr(0, i0);
                        }
                        row.ggbid = src;
                    }
                }
            });

           //Find createjs, creatine, or tine
           row.createjs = html.indexof("createjs")>=0 || html.indexof("creatine")>=0 || html.indexof("tine")>=0;

        } catch (ex) {
            ///  console.log(ex);
        }
     return row;
 }
 
 
 //Put and upload must implement security standard
 //For .js or .html files do not accept posts to rest/
function hasRestCalls(path, src){
    
    if(path.endsWith(".js") || path.endsWith(".htm") || path.endsWith(".html")){
   
        if(src.indexOf("rest/")>=0 && (src.indexOf(".post(")>=0 || src.indexOf(".get(")>=0)){
            return true;
        }        
    }       
    return false;    
}     
     
 var put = function(req, res)
 {
        var log = [];
        var p = req.body;       
        var server = p.server? true: false;
      
        var base = __publicDir+"/activities/";
        if(server && !p.idUser)
        {
            base = __serverDir+"/activities/";
        } 
        else if(p.idGroup)
        {
            base = __publicDir+"/files/"+p.idGroup+"/";
        }
        else if(p.idUser)
        {
            if(server){
                base = __serverDir+"/files/users/"+p.idUser+"/";
            } else {
                base = __publicDir+"/files/users/"+p.idUser+"/";
            }
        }
        
        
        var path = base+p.path;
        var id = p.path.substring(0, p.path.indexOf("/"));
        
        if(hasRestCalls(path.toLowerCase(), (p.src || "").toLowerCase())){
            log.push("The file cannot be saved.");
            log.push("For security reasons post calls are not allowed to the REST service. Please use the factory named Server instead.");
            res.send({ok: false, path: path, log: log.join('<br>')});
            return;
        }
     
        fs.writeFile(path, p.src, function(err){
            if(err)
            {
            	log.push(err);
                res.send({ok: false, path: path, log: log.join('<br>')});
                return;
            }
             
                log.push("Saved: "+path);
                //If QProvider.js (compress it)
                if(path.endsWith('QProvider.js'))
                {                 
                    var minFile = path.substring(0, path.length-2) + 'min.js';
                    
                    fs.unlink(minFile, function(){
                            new compressor.minify({
                                type: 'gcc',
                                fileIn: path,
                                fileOut: minFile,
                                callback: function (err, min) {
                                    if(err)
                                    {
                                        log.push(err);
                                        res.send({ok: false, path: path, log: log.join('<br>')});
                                        return;
                                    }
                                    log.push("Compressed: "+minFile);
                                    app.db.query("UPDATE activities SET hasAct=1 WHERE id="+id)();
                                    res.send({ok: true, path: path, log: log.join('<br>')});
                                }
                            });
                    });
                    
                } 
                //When saving QProvider.json (generate .js and min.js)
                else if(server && path.endsWith('QProvider.json'))
                {
                   
                    var fromDir = __serverDir+"/activities/"+id+"/";
                    var toDir = __publicDir+"/activities/"+id+"/";
                    fs.unlink(toDir+"QProvider.js", function(){
                        fs.unlink(toDir+"QProvider.min.js", function(){
                            generator(fromDir, toDir, function(){
                                app.db.query("UPDATE activities SET hasAct=1 WHERE id="+id)();
                                res.send({ok: true, path: path, log: log.join('<br>')});}, function(){res.send({ok: false, path: path, log: log.join('<br>')});}, log);
                        });
                    });
                    
                }
                //When saving a theory file, check for youtube video ids. And update database schema activities field `ytid`
                else if(!server && path.search(/(.*)theory(.*)html/ig)>=0)
                {
                    var e = parseHtml(p.src);
                    e.hasAct = 0;
                    //seek for Qprovider.json.min
                    var src = __publicDir+"/activities/"+id+"/QProvider.min.js";
                    try{
                        fs.readFileSync(src);                        
                        e.hastAct = 1;
                    } catch(ex){
                        //
                    }
                    //update database                   
                    var ytid = e.ytid? "'"+e.tech+":"+e.ytid+"'" : 'NULL';                   
                    var ggbid = e.ggbid ? "'"+e.ggbid+"'" : 'NULL';
    
                    var sqln = "UPDATE activities SET ytid="+ytid+", ytqu='"+e.ytqu+"', ggbid="+ggbid+", hasAct='"+e.hasAct+"', createjs='"+e.createjs+"' WHERE id="+id;
                    app.db.query(sqln, function(){res.send({ok: true, path: path, log: log.join('<br>')});}, function(){res.send({ok: false, path: path, log: log.join('<br>')});})();
                    
                }
                else {
                    res.send({ok: true, path: path, log: log.join('<br>')});
                }
                
   
             
        }); 
    };
    
    var mkdir = function(req, res)
    {
        var p = req.body;
        var server = p.server? true: false;
      
        var base = __publicDir+"/activities/";
        if(server)
        {
            base = __serverDir+"/activities/";
        } 
        else if(p.idGroup)
        {
             base = __publicDir+"/files/"+p.idGroup+"/";
        }

        var path = base+p.path;
         
        fs.mkdir(path, function(err){
            if(err)
            {
                res.send({ok: false, path: path});
            }
            else{
                res.send({ok: true, path: path});
            }
        }); 
    };
    
    var rename = function(req, res)
    {
        var p = req.body;
        var server = p.server? true: false;
      
        var base = __publicDir+"/activities/";
        if(server && !p.idUser)
        {
            base = __serverDir+"/activities/";
        }
        else if(p.idGroup)
        {
             base = __publicDir+"/files/"+p.idGroup+"/";
        }
        else if(p.idUser)
        {
            if(p.server){
                base = __serverDir+"/files/users/"+p.idUser+"/";
            } else {
                base = __publicDir+"/files/users/"+p.idUser+"/";
            }
        }
        
        //Prevent from modifying extensions
        if(path.extname(p.from.toLowerCase())!==path.extname(p.to.toLowerCase())){
            res.send({ok: false, log: "Modifying file extensions is not allowed."});
            return;
        }

        var cmd = "mv";
        if(p.copy){
            cmd = "cp -r";
        }

        exec(cmd+" \""+base+p.from +"\" \""+base+p.to+"\"", function (err, out) {
                 if(err)
                 {
                     winston.error(err);
                 }
                 res.send({ok: true});
        });
    };
    
    var minify = function(req, res)
    {
        var p = req.body;
        var server = p.server? true: false;
        var file = p.file.trim();
       
        var base = __publicDir+"/activities/";
        if(server)
        {
            base = __serverDir+"/activities/";
        }
        else if(p.idGroup)
        {
             base = __publicDir+"/files/"+p.idGroup+"/";
        }

        
        var cmd;
        var log = [];
        
        if(file.toLowerCase().endsWith('.js')){
        
            var filemin = file.slice(0,-2)+"min.js";
            new compressor.minify({
                    type: 'gcc',
                    fileIn: base + file,
                    fileOut: base + filemin,
                    callback: function (err, min) {
                        if(err)
                        {
                            log.push(err);
                            res.send({ok: false, log: log.join('<br>')});
                            return;
                        }
                        log.push("Compressed: "+base+filemin);
                        res.send({ok: true, log: log.join('<br>')});
                    }
            });
                
        }
        else if(file.toLowerCase().endsWith('.css')){
            
              var filemin = file.slice(0,-3)+"min.css";
              new compressor.minify({
                    type: 'yui-css',
                    fileIn: base + file,
                    fileOut: base + filemin,
                    callback: function (err, min) {
                        if(err)
                        {
                            log.push(err);
                            res.send({ok: false, log: log.join('<br>')});
                            return;
                        }
                        log.push("Compressed: "+base+filemin);
                        res.send({ok: true, log: log.join('<br>')});
                    }
            });
             
        }
         
    };
    
    
    //Modified to support multi-file upload
    var upload = function (req, res)
    {
        var response = [];
        var log = [];
        
        var form = new formidable.IncomingForm();
        form.multiples = true;
        form.uploadDir = app.config.paths.tmp;
        
        form.parse(req, function (err, fields, myfiles) {
            
            if (err) {
                console.log(err);
                res.send(response);
                return;
            }
            
            //console.log(myfiles);
            
            //Make sure files is allways an array
            var files = myfiles.file;
            if(!files){
                files = [];
                for(var key in myfiles){
                    files.push(myfiles[key]);
                }
            }
            
          
               
             var doAsync = function(f, cb){ 
                 
                 
                    var name = f.name;      
                    var tempPath = f.path;
                    var base =  __publicDir + "/activities/";
                    var relPath = fields.path+"/";

                    if (fields.idGroup){
                         base = __publicDir + "/files/"+fields.idGroup+"/";                 
                    }
                    else if(fields.type==="server"){
                         if(fields.idUser){
                            base = __serverDir + "/files/users/"+fields.idUser+"/";                 
                         } else {
                            base = __serverDir + "/activities/";                 
                         }
                    } 
                    else if (fields.type==='libs'){
                         base = __publicDir + "/activities/";                 
                    }
                    else if (fields.type==='avatar'){
                         base = __publicDir + "/assets/img/avatar/";
                         relPath = "custom/";
                         name = fields.idUser+".png";                 
                    } else {
                         if(fields.idUser){
                            base = __publicDir + "/files/users/"+fields.idUser+"/";                 
                            if(fields.type==='U'){
                                base += ".uploads/";
                                relPath = "";
                            }
                        }                         
                    }
                     
                    var proceed = function(){
                        var cmd = "cp " + tempPath + " \"" + base+relPath+name+"\"";
                        console.log(cmd);
                        exec(cmd, function (error, stdout, stderr) {
                        exec("rm -fr " + tempPath); //Deletes uploaded tmp file
                          if (error) {
                            cb(error);
                            return;
                          }
                          response.push({isDir: false, file: base+relPath+name, title: relPath+name, server: fields.server}); 
                          cb();
                      });   
                    };
                    
                   var partial = function(){
                            //First check if the name is a js or html file
                            var name2 = (name || "").toLowerCase();
                            if(name2.endsWith(".js") || name2.endsWith(".htm") || name2.endsWith(".html")){

                             //check if the contents of the file contains illegal information
                             fs.read(tempPath, "utf8", function(err, src){
                                   if(hasRestCalls(name, src)){
                                       log.push("File "+name+" cannot be saved. For security reasons post calls are not allowed to the REST service. Please use the factory named Server instead.");
                                       cb();                                   
                                   } else {
                                       proceed();
                                   }
                             });              
                        } else {
                            proceed();
                        }       
                   };
                 
                 
                   if(fields.idUser){
                         exec('mkdir -p '+base, function(){ 
                                if(fields.type==='U'){
                                    
                                    uploadsSave({idAssignment: fields.idAssignment, idUser: fields.idUser, file: name}, function(idU){
                                        console.log("inserted id: "+idU);
                                        if(idU>0){
                                            name = idU + "-" + name;                                        
                                            partial();
                                        }
                                        else {                                            
                                            cb(); //Do nothing
                                        }
                                    });                                    
                                    
                                } else {
                                    partial();
                                }
                         });
                    } else {
                        partial();
                    }
                 
                };
               
               
               async.map(files, doAsync, function(err, results){
                   res.send({log: log.join("<br>"), response: response});
               });

        });
           
    };
    
    var unzip = function(req, res){
        var p = req.body;       
        var server = p.server? true: false;
      
        var base = __publicDir+"/activities/";
        if(server)
        {
            base = __serverDir+"/activities/";
        }
        else if(p.idGroup)
        {
             base = __publicDir+"/files/"+p.idGroup+"/";
        }
      
        console.log("TODO UNZIP: CHECK BAD CODE IN JS AND HTML FILES!!!!!!!!!!");
              
        //This is the path of the zip file
        var path = base+p.path;
        var toDir = p.toDir || "";
        
        //This is the dir where extract it
        var extractDir = path.substring(0, path.lastIndexOf("/"))+"/"+toDir;
        try {
            fs.mkdirSync(extractDir);
        } catch(ex){
            //
        }
        var cmd = "unzip -o \"" + path + "\" -d \"" + extractDir+"\"";   // -o: override without prompt
        exec(cmd, function (error, stdout, stderr) {
                  if (error) {
                    res.send({ok: false, log: cmd + " (FAILED)"});
                    return;
                  }
                  var response = {ok: true, log: cmd+ " (OK)"}; 
                  res.send(response);
        });        
        
    };
    
    
    var download = function(req, res){
        var id = req.params.id;
        var p = req.params['0'];
        //parse cookie and check if forbidden
        var cookies = new Cookies(req, res);

        var user = cookies.get("imaths_session_id");
        console.log(user);
        
        
        if(!user){            
            res.status(402).send("402 - Forbidden");
            return;
        }
        
        
        
        var tgz;
        if(id>0){
            //relative to activity folder
            tgz = __serverDir+"/activities/"+id+"/"+p;
        } else {
            //relative to serverDir
            tgz = __serverDir+"/"+p;
        }
        
        console.log("Dowloading "+tgz);
        res.download(tgz, path.basename(tgz), function(err){
                //Do something
                console.log("done");
                console.log(err);
                if(err){
                    res.send("404 - File not found");
                }
        });

//        try{
//            var filename = path.basename(tgz);
//            var mimetype = mime.lookup(tgz);
//
//            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
//            res.setHeader('Content-type', mimetype);
//
//            var filestream = fs.createReadStream(tgz);
//            filestream.pipe(res);    
//            res.on( 'end', function(){
//                console.log("File "+tgz+" finish download");
//                //  fs.unlink(tgz); //when download is ready
//            });
//        } catch(ex){ 
//            res.send("");
//        }
    };
    
    
    
    var uploadsList = function(req, res){
        var p = req.body;
        var sql = "SELECT u.fullname, up.* FROM uploads as up INNER JOIN users as u on u.id=up.idUser WHERE up.idAssignment="+p.idAssignment;
        if(p.idUser){
            sql += " AND up.idUser="+p.idUser;
        }
        sql += " ORDER BY u.fullname, up.uploadDate"
        
        var err = function(){
            res.send([]);
        };
        
        var success = function(d){
            res.send(d.result);            
        };
        
        app.db.query(sql, success, err)();
    };
    
    var uploadsDelete = function(req, res){
        var p = req.body;
        
        var sql = "DELETE FROM uploads WHERE id="+p.id;
        var err = function(){
            res.send({ok: false, msg: 'DB entry not deleted.'});
        };
        
        var success = function(d){
            if(d.result.affectedRows>0){
                //Now delete associated file
                var path = __publicDir+"/files/users/"+p.idUser+"/.uploads/"+p.id+"-"+p.file;
                fs.unlink(path, function(err){
                   if(err){
                       console.log(err);
                       res.send({ok: false, msg: 'File could not be deleted.'});
                       return;
                   } 
                   res.send({ok: true});
                });
            } else{
                res.send({ok: false, msg: 'DB entry not deleted.'});
            }
        };
        
        app.db.query(sql, success, err)();
        
    };
    
    
     var uploadsUpdate = function(req, res){
        var p = req.body;
        
        var sql = "UPDATE uploads SET ? WHERE id="+p.id;
        var objs = {score: (p.score || -1), message: (p.message || ""), feedback: (p.feedback || "") };
        var err = function(){
            res.send({ok: false, msg: 'DB entry not deleted.'});
        };
        
        var success = function(d){
            if(d.result.affectedRows>0){
                   res.send({ok: true});                
            }
        };
        
        app.db.queryBatch(sql, objs, success, err)();        
    };
    
    //p = {idUser, upload id and filename}
   function uploadsSave(objs, cb){
        
        var sql = "INSERT INTO uploads SET uploadDate=NOW(), ?";        
        var err  = function(){
            cb(-1);
        };
        
        var success = function(d){
            cb(d.result.insertId);
        };
        
        app.db.queryBatch(sql, objs, success, err)();        
    };
  
    app.post('/rest/fs/delete', del);
    app.post('/rest/fs/dir', dir);
    app.post('/rest/fs/get', get);
    app.post('/rest/fs/put', put);
    app.post('/rest/fs/mkdir', mkdir);
    app.post('/rest/fs/rename', rename);
    app.post('/rest/fs/minify', minify);
    app.post('/rest/fs/upload', upload);    
    app.post('/rest/fs/unzip', unzip);
    
    app.get('/rest/fs/download/:id/(*)', download);
    
    
    app.post('/rest/fs/uploads/list', uploadsList);
    app.post('/rest/fs/uploads/delete', uploadsDelete);
    app.post('/rest/fs/uploads/update', uploadsUpdate);
};
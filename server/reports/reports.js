module.exports = function(app)
{  
    var fs = require('fs');
    var async = require('async');
    var mime = require('mime');
    var uuid = require('node-uuid');
    var spawn = require('child_process').spawn;
    var exec = require('child_process').exec;
    var JSZip = require('node-zip');
    var winston = require('winston');

    var pandocPath = app.config.paths.pandoc;
    
    var rpandoc = function(req, res, tex, workingDir)
    {
        var p = req.body;
        if(!tex)
        {
            tex = p.tex;
        }
        
        var rndName = uuid.v4();
        var rndFile = workingDir+rndName; 
         
        //write a dummy tex file
        fs.writeFileSync(rndFile+".tex", tex);
        winston.log("rpandoc> Saved "+rndFile+".tex");
        
        var options = {cwd: workingDir};
        
        //which type??
        var type = p.type;
        if(type!=='tex')
        {
            var command;
            if(type==='pdf')
            {
                command = ["-f", "latex", rndFile+".tex", "-o", rndFile+".pdf"];
            }
            else{
                command = ["-f", "latex", rndFile+".tex", "-t", type, "-o", rndFile+"."+type];
            }
            
            winston.debug("spawn on "+pandocPath, " "+command+" "+options);
            var ls = spawn(pandocPath, command, options);
            var errors = '';
            ls.stderr.on('data', function (data) {
                errors += data+"; ";
            });
            
            ls.on('close', function (code) {
                winston.debug("spawn closed!");
                if(errors)
                {
                    winston.error(errors);
                }
                //Now we must download such an output file            
                var mimetype = mime.lookup(rndFile);
                res.setHeader('Content-disposition', 'attachment; filename=' + rndFile+"."+type);
                res.setHeader('Content-type', mimetype);

                var filestream = fs.createReadStream(rndFile+"."+type);
                filestream.pipe(res);
                //delete workingDirectory recursively
                 exec('rm -rf '+workingDir, function (err, out) {
                    if(err)
                    {
                        winston.error(err);
                    }
                    winston.debug("PANDOC: Deleted working dir "+workingDir);
                });
            
            });
        }
        else
        {
            //User requires tex file (it could be also required to zip it alongwith png figures!)
            
            //case with figures, send a zipped file with tex and separate figures
            if(req.body.imgs && req.body.imgs.length)
            {
                //Generate a zip file
                var zip = new JSZip();
                zip.file(rndName+".tex", tex);
                //Add figures here
                req.body.imgs.forEach(function(img){
                    var d = fs.readFileSync(app.config.paths.tmp+img.fname+".png", 'binary');
                    zip.file(img.fname+".png", d);
                });
                
                
                var data = zip.generate({base64:false, compression:'DEFLATE'});
                fs.writeFileSync(rndFile+'.zip', data, 'binary');

                var filestream = fs.createReadStream(rndFile+".zip");
                filestream.pipe(res); 

                fs.unlink(rndFile+".tex");
                fs.unlink(rndFile+".zip");
                //delete images as well if generated
                req.body.imgs.forEach(function(img){
                    fs.unlink(app.config.paths.tmp+img.fname+".png"); 
                });
            }
            else
            {
                //Case without figures, simply send the tex file
                var filestream = fs.createReadStream(rndFile+".tex");
                filestream.pipe(res);
                fs.unlink(rndFile+".tex");
            }           
        }
    
    };
    
    function sanitizeLaTeX(str){
        return str.replace(/<katex>/g,'$').replace(/<\/katex>/g,'$');
    }
    
    var sheet = function(req, res)
    {
        var p = req.body;
        
        winston.error(p);
       
         
        var questions = p.questions || [];
        var views = p.views || {};
        var debug = true;
        
        //Prepare document template
        var o = "\\begin{document}\n";
        o += "\\usepackage{fancyhdr}\n";
        o += "\\usepackage{graphicx}\n";
        o += "\\pagestyle{fancy}\n \\cfoot{\\textit{iMaths activity sheet}}\n";
        o += "\\begin{enumerate}\n";
        
        questions.forEach(function(q){
            var v = sanitizeLaTeX(q.headingLaTeX);
            o += "\t\\item  "+v+"\n";
            o += "\t\t\\begin{itemize}\n";
            q.steps.forEach(function(s){
                v = sanitizeLaTeX(s.formulationLaTeX);
                o += "\t\t\t\\item  "+v+"\n";
            });   
            o += "\t\t\\end{itemize}\n";
        });

        o += "\\end{enumerate}\n\n";

        //Solutions:
        o += "Solucions: \n";
        o += "\\begin{enumerate}\n";
        
        questions.forEach(function(q){
            var v = "";
            o += "\t\\item  "+v+"\n";
            o += "\t\t\\begin{itemize}\n";
            q.steps.forEach(function(s){
                v = sanitizeLaTeX(s.answerLaTeX);
                o += "\t\t\t\\item  "+v+"\n";
            });   
            o += "\t\t\\end{itemize}\n";
        });
      
        o += "\\end{enumerate}\n\n";
        o += "\\end{document}";
        
        //Create a working directory in tmp folder
        var workingDir = app.config.paths.tmp + "sheet_"+Math.random().toString(36).slice(2)+"/";
        fs.mkdirSync(workingDir);
        
        //First thing to do is to generate all images in views according to their view type        
        var list = [];        
        for(var idView in views){           
            var outputfile = workingDir + idView + ".png";
            list.push({filename: outputfile, view: views[idView]});
        };
        
        if(list.length)
        {
            async.map(list, function (entry, done) {
                  //var binaryData  =  new Buffer(file.data, 'base64').toString('binary');
                  //fs.writeFile(file.name, binaryData, "binary", done);
                  if(entry.view.type.toLowerCase().startsWith("jsxgraph")){                                           
                      app.write_png(entry.view.cmds.jsxCanvas, entry.view.cmds.jsxBoard, entry.view.cmds.jsxCreate, entry.filename, done);
                  }
                  else{
                      winston.warn("Unsupported png generator for view type "+entry.view.type);
                  }

            }, function (err, data) {
                if(err)
                {
                    winston.error(err);
                }
                rpandoc(req, res, o, workingDir);
            });
 
        }
        else
        {
            rpandoc(req, res, o, workingDir);
        }
                        
       
    };
    
    app.post('/rest/reports/pandoc', rpandoc);    
    app.post('/rest/reports/activitySheet', sheet);    
};

module.exports = function(app){
    
    var katex = require('../../node_modules/katex/dist/katex.js'),
        mathjax = require('mathjax-node'),
           fs = require('fs'),
           exec = require('child_process').exec,
           async = require('async'),
           mime = require('mime'),
           formidable = require('formidable'),
           request = require("request"),
                vm = require('vm');
 
    mathjax.config({
      MathJax: {
        SVG: {scale: 120}
      }
    });
    mathjax.start();

    var katexMacros = {
                "\\Re": "\\mathbb{R}",
                "\\alf": "\\alpha",
                "\\tg": "\\mathrm{tg}\\,",
                "\\arctg": "\\mathrm{arctg}\\,",
                "\\cotg": "\\mathrm{cotg}\\,",
                "\\cosec": "\\mathrm{cosec}\\,"
                //"\\limx": "\\mathop{lim}\\limits_{#1\\to #2}"     //Not yet supported???
            };
  
    //Use MathJax to convert a single latex into a svg image           
    var mathjaxWorker = function(latex, cb){

           mathjax.typeset({     
              math: latex,
              format: "TeX", // "inline-TeX", "MathML"
              svg: true    //  mml:true,
          }, function (data) {
              if(data.errors) {
                cb(data.errors, null);
              } else {
                cb(null, new Buffer(data.svg).toString("base64"));
              }

          });
    };            

    //Mathpix call to convert a jpeg into latex equation: OCR
    var mathpixPost = function(req, res){     

       request({

                url: "https://api.mathpix.com/v3/latex/",
                method: "POST",
                json: true,  
                body: {"url": req.body.url},

                    headers: app.config.mathpix

            }, function (error, response, body){         

                  if(response.body.latex && !req.body.skipSVG){
                      mathjaxWorker(response.body.latex, function(errors, svg){
                          if(!errors)
                          {
                            response.body.svg = svg;
                          }  

                          res.send(response.body); 
                      });

                  } else {
                     res.send(response.body); 
                  }

            });
    };


    //Server-side equation parser: You pass text with many $...$ etc, and it returns
    //only html, ready to be rendered in the client. It only needs katex.css
    //It is synchronomous
    
   var katexParser = function(text, options){
        
        var opts = {
            displayMode: false,
            macros: katexMacros
        };
        options = options || {};
        
        var dollar2 = "";
        if (options.dollar2) {
            dollar2 = "{1,2}";     //allow doble dollar
        }
        var regex = new RegExp("\\$" + dollar2 + "([\\s\\S]*?)\\$" + dollar2, "g");


        var rendered = text.replace(regex, function (match, contents, offset, s) {
            contents = contents || match;
            var converted;
            try {
                converted = katex.renderToString(contents, opts);
            } catch (Ex) {
                console.log("Can't process KATEX: ",contents);
                converted = '<span style="color: red; font-style: italic;">' + contents + '</span>';
            }
            
            if(options.isJSON){
                converted = converted.replace(/"/g, '\\"').replace(/\n/g,"").replace(/\t/g,"").replace(/[^\0-\xFF]/g, ''); 
            }

            return converted;
        });

        opts.displayMode = true;
        var regex = new RegExp("\\\\\\[([\\s\\S]*?)\\\\\\]", "g");


        rendered = rendered.replace(regex, function (match, contents, offset, s) {
            contents = contents || match;
            var converted;
            try {
                converted = katex.renderToString(contents, opts);
            } catch (Ex) {
                console.log("Can't process KATEX: ",contents);
                converted = '<span style="color: red; font-style: italic;">' + contents + '</span>';
            }
            
            if(options.isJSON){
                converted = converted.replace(/"/g, '\\"').replace(/\n/g,"").replace(/\t/g,"").replace(/[^\0-\xFF]/g, ''); 
            }

            return converted;
        });

        
        return rendered;
    };

    
    /*
     * Server-side latex to ... converter
     * It can use KATEX OR MATHJAX
     * input p.html: Text or Array (only in alone mode).
     * returns rendered html
     * p.html: Text to render
     * p.dollar2: Doble dollar is activated if p.dollar2 is present
     * p.alone: An equation or array of equations (without $$). It returns an array
     * p.type: "SVG" if you prefer an image instead of html. Images are returned in svg base64.
     * 
     * Example
     * $E=mc^2$ is an important equation.<br> but \[ a^2=b^2+c^2 \] was discovered <b>first</b> by Pitagoras.
     * renders to html parsing $$ and $$$$ inline and \[\] in display mode
     * 
     * Errors return original code without $ in italic red.
     */
    
    var latex2Post = function(req, res){
        var p = req.body;        
        var html = p.html || p["html[]"] || "";
        var rendered = html;
       
            //p.alone works with an ARRAY of latex's
            if(p.alone){

                rendered = "";
               
                    if(typeof(html)==='string'){
                        html = [html];
                    }

                    if(p.type==='svg'){

                        async.map(html, mathjaxWorker, function(errors, datas){
                             res.send(datas); 
                        });
                        
                    } 
                    else {
                      var datas = [];
                      var opts = {
                          displayMode: false,
                          macros: katexMacros
                      };
        
                      html.forEach(function(ltx){
                          try{
                              datas.push(katex.renderToString(ltx, opts));
                           } catch(Ex){
                              datas.push("<span style='color:red; font-style: italic;'>"+ltx+"</span>");
                           }
                       });

                       res.send(datas); 
                    }
              

            } else {
                
                
              res.send(katexParser(rendered, {dollar2: p.dollar2}));

            }
      
        
    };


    // Gets the json associated with an activity placed in the server and it processes
    // 1st. Evaluates random expressions ready to be used
    // 2nd. Converts all $...$ equations into ready to display html with katex
    // 3rd. Encrypts and sends the data to the client
    var getJSON = function(req, res){
        
        var p = req.body;
        var base = __serverDir+"/activities/";
        var path =base+p.path;
               
        fs.readFile(path, "utf8", function(err, data){
            if(err)
            {
                res.send("");
                return;
            }
            
            
            try{
                var json = JSON.parse(data);
                var newlist = [];
                json.forEach( function(question){
                  
                 var numrepeat = question.repeat || 1;
                 
                 for(var ri=0; ri < numrepeat; ri++){
                       
                   var q = JSON.parse(JSON.stringify(question));
                    
                   //Evaluate everyting in this question based on the scope
                   if(q.scope && q.scope.trim()){
                    
                        
                        var scope = {
                            iran: function(a, b){
                                return Math.floor((b-a)*Math.random())+a;
                            }
                        };
                        var context = new vm.createContext(scope);
                        var script = new vm.Script(q.scope);
                        script.runInContext(context);
                        //Now scope is updated with data in q.scope
                        
                        //Apply to the different fields
                        //Create a script to be evaluated in the scope
                        var code2 = "_formulation_=`"+ (q.formulation || "").replace(/\\/g, "\\\\") +"`;"+
                                    "_subformulation_=`"+ (q.subformulation || "").replace(/\\/g, "\\\\") +"`;"+
                                    "_hints_=`"+ (q.hints || "").replace(/\\/g, "\\\\") +"`;"+                                   
                                    "_feedback_=`"+ (q.feedback || "").replace(/\\/g, "\\\\") +"`;";
                            
                            
                            if(Array.isArray(q.answer)){                                
                                q.answer.forEach(function(a, k){
                                    code2 += "_answer_"+k+"_=`"+ ( a || "").replace(/\\/g, "\\\\") +"`;";
                                });
                            } else {
                                 code2 += "_answer_=`"+ (q.answer || "").replace(/\\/g, "\\\\") +"`;";
                            }
                                    
                       
                       
                       q.options && q.options.forEach(function(o, i){                        
                               
                                code2 += "_opt"+i+"_=`"+(o.text || "").replace(/\\/g, "\\\\")+"`;";
                                if(typeof(o.valid)==="string"){
                                    code2 += "_valid"+i+"_=`"+(o.valid || "").replace(/\\/g, "\\\\")+"`;";
                                } else {
                                    code2 += "_valid"+i+"_="+o.valid+";";
                                }
                        });
                     
                        
                        var script2 = new vm.Script(code2);
                        script2.runInContext(context);
                       
                       
                        //Finally update the json object to the processed values
                        
                        
                        q.formulation = scope._formulation_;
                        q.subformulation = scope._subformulation_;
                        q.hints = scope._hints_;
                        if(Array.isArray(q.answer)){  
                          for(var k=0; k<q.answer.length; k++){
                                q.answer[k] = scope["_answer_"+k+"_"];
                          };
                        } 
                        else {
                           q.answer = scope._answer_;
                        }
                        q.feedback = scope._feedback_;
                        q.options && q.options.forEach(function(o, i){                        
                                q.options[i].text = scope["_opt"+i+"_"]; 
                                q.options[i].valid = scope["_valid"+i+"_"]; 
                        });    
              
              
                   }
                   
                   if(p.kts){
                        //Now transform latex
                        var newvars = ["formulation", "hints", "answer", "feedback"];
                      
                        //Check for latex
                        newvars.forEach(function(nv){
                                var item = q[nv] || "";
                                if(item.indexOf("<katex>")>=0){
                                    item = item.replace(/<katex>/g, "$").replace(/<\/katex>/g, "$");
                                }

                                if(item.indexOf("$")>=0 || item.indexOf("\\[")>=0){  
                                   console.log("from ", item);
                                   item = katexParser(item, {dollar2: true});
                                   console.log("to ", item);
                                }
                                q[nv] = item;
                        });
                        
                         q.options.forEach(function(o, i){                        
                                var item = o.text || "";
                                if(item.indexOf("<katex>")>=0){
                                    item = item.replace(/<katex>/g, "$").replace(/<\/katex>/g, "$");
                                }

                                if(item.indexOf("$")>=0 || item.indexOf("\\[")>=0){  
                                   console.log("from ", item);
                                   item = katexParser(item, {dollar2: true});
                                   console.log("to ", item);
                                }
                                q.options[i].text = item;                      
                        });                        
                    }
                
                    
                    }  
                    
                    newlist.push(q);
                    
                });
                
                data = JSON.stringify(newlist);
            } catch(Ex){
                console.log(Ex);
            }
            
 
            data = app.encrypt(data);       
            res.send(data);
                            
        }); 
        
    };
 
    
    
    var pitexProjects = function(req, res){
        var p = req.body;        
        //check if the directory structure is created
        var home = __serverDir+"/files/users/"+p.idUser+"/pitex/";
        exec('mkdir -p '+home, function(){           
           fs.readdir(home, function(err, files){
               //Obri el llistat de pojectes -- directoris
               res.send(files);
           });                        
        });
    };
//    
//    var pitexDelProject = function(req, res){
//        var p = req.body;        
//        //check if the directory structure is created
//        var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";
//        exec("rm -fr '"+home+"'", function(err, files){
//            //Obri el llistat de pojectes -- directoris
//            res.send({ok: true});
//        });                          
//    };
//    
//    var pitexDelDoc = function(req, res){
//        var p = req.body;        
//        //check if the directory structure is created
//        var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";
//        exec("rm -f '"+p.file+"'", {cwd: home}, function(err, files){
//            //Obri el llistat de pojectes -- directoris
//            res.send({ok: true});
//        });                          
//    };
    
    var pitexCreate = function(req, res){
        var p = req.body;        
        var template = [];
        template.push("\\documentclass[11pt,A4paper,oneside]{article}");
        template.push("\\usepackage{amsbsy, amsfonts, amssymb, amsthm, amsmath, amsxtra}");
        template.push("\\usepackage{array}");
        template.push("\\usepackage{fancyhdr}");
        template.push("\\usepackage{graphicx}");
        template.push("\\usepackage{color}");
        template.push("\\usepackage[utf8]{inputenc}");
        template.push("");
        template.push("% Definicions");
        template.push("\\newcommand{\\titol}[1]{");
        template.push("    \\usefont{OT1}{cmss}{m}{n}");
        template.push("    \\selectfont");
        template.push("    \\flushleft{");
        template.push("   \\Large{");
        template.push("    \\textbf{#1}");
        template.push("    }");
        template.push("    }");
        template.push("   \\usefont{OT1}{cmr}{m}{n}");
        template.push("   \\selectfont");
        template.push("}");
        template.push("");
        template.push("\\newcommand{\\titolbox}[1]{");
        template.push("    \\usefont{OT1}{cmss}{m}{n}");
        template.push("    \\selectfont");
        template.push("    \\flushleft{");
        template.push("   \\fbox{");
        template.push("    \\fboxrule8pt");
        template.push("    \\fcolorbox{lightgray}{lightgray}{");
        template.push("    \\makebox[0.9\\textwidth][l]{");
        template.push("   \\Large{    \\textbf{#1}    }");
        template.push("    }");
        template.push("    }");
        template.push("    }");
        template.push("    }");
        template.push("    \\usefont{OT1}{cmr}{m}{n}");
        template.push("    \\selectfont");
        template.push("}");
        template.push("");
        template.push("\\def\\tan{\\mathrm{tg}\\,}");
        template.push("\\def\\arctan{\\mathrm{arctg}\\,}");
        template.push("\\def\\frac{\\dfrac}");
        template.push("");
        template.push("\\newcommand{\\binomial}[2]{");
        template.push("   \\left(\\!\\!\\!");
        template.push("       \\begin{array}{l}");
        template.push("        #1 \\\\");
        template.push("        #2 \\\\");
        template.push("        \\end{array}\\!\\!\\!");
        template.push("    \\right)");
        template.push("}");
        template.push("\\def\\a{\\alpha}");
        template.push("");
        template.push("\\textwidth=17cm \\oddsidemargin=-0.5cm \\textheight=22.5cm %-0.17");
        template.push("\\topmargin=-1.2cm");
        template.push("");
        template.push("\\renewcommand{\\topfraction}{0.85}       % Improves figure placement !");
        template.push("\\renewcommand{\\textfraction}{0.1}       % Improves figure placement !!");
        template.push("\\renewcommand{\\floatpagefraction}{0.75} % Improves figure placement !!!");
        template.push("");
        template.push("");
        template.push("\\newcommand{\\solve}[1]{\\textcolor{blue}{$\\blacktriangledown${\\em Soluci\\'o:}\\\\#1\\\\$\\blacktriangle$}}  %mostra i formateja les solucions");
        template.push("%\\newcommand{\\solve}[1]{}                       %amaga les solucions");
        template.push("");
        template.push("\\begin{document}");
        template.push("");
        template.push("\\pagenumbering{arabic} \\pagestyle{fancy}");
        template.push("%\\fancypagestyle{plain}");
        template.push("\\fancyhf{} %\\fancyhead[RO]{\\rm\\thepage}");
        template.push("");
        template.push("\\def\\baselinestretch{1.1}");
        template.push("");
        template.push("\\fancyhead[LO]{\\small{\\it{Departament de Matem\\`atiques $\\cdot$ IES Binissalem \\hspace{6 cm} Matemàtiques I} }}");
        template.push("");
        template.push("\\def\\vs{\\vspace{0.25cm}}");
        template.push("");
        template.push("\\include{source}");
        template.push("");
        template.push("\\end{document}");

        var source = [];
        source.push("\\titol{Examen tema 1: Nombres reals} \\hspace{5.75cm} {\\bf 1a Avaluació}");
        source.push("");
        source.push("\\flushleft {\\bf{\\small Nom i Llinatges:}} {\\tiny ..............................................................................................................}");
        source.push("{\\bf{\\small Data:}} {\\tiny .................} {\\bf{\\small Grup:}} {\\tiny .................}");
        source.push("");
        source.push("\\vspace{0.1cm}");
        source.push("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        source.push("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% QUESTIONS");
        source.push("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
        source.push("");
        source.push("\\begin{enumerate}");
        
        source.push("%---------------------------------------------------------------------------------------------------------------------");
        source.push("\\item First question $1+\\frac{2}{3} - \\sqrt{4}$?");
        source.push("");        
        source.push("%---------------------------------------------------------------------------------------------------------------------");
        source.push("\\item Second question $1+1$?");
        source.push("");      
        source.push("\\end{enumerate}");
         
        var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";
        fs.mkdir(home, function(err, files){
            if(err){
                res.send({ok: false});
                return;
            }
            fs.writeFile(home+"template.tex", template.join("\n"), 'utf8', function(err){
                fs.writeFile(home+"source.tex", source.join("\n"), 'utf8', function(err){
                    res.send({ok: (err==null)});
                });
            });
        });
        
    };


    var pitexList = function(req, res){
        var p = req.body;        
        //check if the directory structure is created
        var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";
        fs.readdir(home, function(err, files){
            //Read all files which are latexSources
            var tasks = [];
            var sources = {};
            var images = {};
            files.forEach(function(f){
                if(f.toLowerCase().indexOf('.tex')>=0){
                    //Serve tex as plain text
                    var t = function(cb){
                        fs.readFile(home+f, 'utf8', function(err, data){
                            sources[f] = data;
                            cb();
                        });
                    };
                    tasks.push(t);
                } else if(f.toLowerCase().indexOf('.png')>=0 || f.toLowerCase().indexOf('.jpg')>=0){
                    //Serve base64 images
                    var t = function(cb){
                        fs.readFile(home+f, function(err, bitmap){
                            images[f] = "data:"+mime.lookup(f)+";base64,"+new Buffer(bitmap).toString('base64');
                            cb();
                        });
                    };
                    tasks.push(t);
                } else if(f.toLowerCase().indexOf('.pdf')>=0){
                    images[f] = "assets/img/pdf.png";                    
                } else if(f.toLowerCase().indexOf('.eps')>=0){
                    images[f] = "assets/img/eps.png";                    
                }
            });            
            async.parallel(tasks, function(){                
                res.send({files: files, sources: sources, images: images});
            });
            
        });                          
    };
    
    var pitexSave = function(req, res){
        var p = req.body;
        var home = __serverDir + "/files/users/" + p.idUser + "/pitex/" + p.project + "/";

        var tasks = [];
        var errors = [];
        p.files.forEach(function (f) {
            var t = function (cb) {
                //console.log("Executing save to "+home+f.name);
                fs.writeFile(home + f.name, f.src, 'utf8', function (err) {
                    if (err) {
                        errors.push(f.name);
                    }
                    cb();
                });              
            };
            tasks.push(t);
        });

        async.parallel(tasks, function () {
            res.send({errs: errors});
        });
      
    };
    
    
    var pitexPdf = function(req, res){
      var p = req.body;  
      var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";
      var cmd = app.config.paths.tex+"pdflatex -interaction=nonstopmode -halt-on-error '"+p.file+"'"; 
      //console.log(cmd);
      var i = p.file.lastIndexOf(".");
      var pfile = p.file.substring(0, i);
      //Before compling get rid of aux and output files
      exec("rm -f "+pfile+".pdf *.aux *.log", {cwd: home}, function(err){
      
            exec(cmd, {cwd: home}, function(err){
               fs.readFile(home+pfile+".log", 'utf8', function(err2, data){
                   var pdf = null;
                   fs.stat(home+pfile+".pdf", function(err3, d){
                        res.send({err: err, log: data, pdf: (err3==null)});
                   });
                   
               });
         });      
    });
    };
    
    var downloadPDF = function(req, res){
      var p = req.body;  
      var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";      
      var i = p.file.lastIndexOf(".");
      var pfile = p.file.substring(0, i);
      
       res.setHeader('Content-disposition', 'attachment; filename=' + p.project+".pdf");
       res.setHeader('Content-type', "application/pdf");
       var filestream = fs.createReadStream(home+pfile+".pdf");
       filestream.pipe(res);
      
    };
    
     var pitexPandoc = function(req, res){
      var p = req.body;  
      var i = p.file.lastIndexOf(".");
      var pfile = p.file.substring(0, i)+"."+p.type;
      
      var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";  
      
      var cmd = app.config.paths.pandoc+" -f latex "+p.file+" -t "+p.type+" -o "+pfile;
      
      exec(cmd, {cwd: home}, function(err){
           res.setHeader('Content-disposition', 'attachment; filename=' + pfile);
           res.setHeader('Content-type', mime.lookup(pfile));
           var filestream = fs.createReadStream(home+pfile);
           filestream.pipe(res);                      
       });
            
    };
    
     var pitexZip = function(req, res){
       var p = req.body;        
        
              
       //Create a zip of the directory
       var pfile = p.project.replace(/ /g, '_');
       var output = app.config.paths.tmp+"/"+pfile+".zip";
       var cmd = "zip -r "+output+" '"+p.project+"'";
         exec(cmd, {cwd: __serverDir+"/files/users/"+p.idUser+"/pitex/"}, function(err){
           res.setHeader('Content-disposition', 'attachment; filename=' + pfile+".zip");
           res.setHeader('Content-type', "application/zip");
           var filestream = fs.createReadStream(output);
           filestream.pipe(res);           
           fs.unlink(output);
       });
   
    };
    
       
    var upload = function (req, res)
    {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, p, files) {
            
            if (err) {
                res.send({});
                return;
            }
            var home = __serverDir+"/files/users/"+p.idUser+"/pitex/"+p.project+"/";                
            var file = files.file;
            var name = file.name;            
            var tempPath = file.path;  
             
            var comand = "cp " + tempPath + " '" + home+name+"'";
            exec(comand, function (error, stdout, stderr) {
              
                var done = function(){
                      exec("rm -fr " + tempPath); //Deletes uploaded tmp file
                      if (error) {
                        res.send({});
                        return;
                      }
                      res.send({ok: true});
                };
                
                //When uploading a docx file try to convert it to latex with pandoc
                if(name.toLowerCase().endsWith(".doc") || name.toLowerCase().endsWith(".docx")){
                     var i = name.lastIndexOf(".");
                     var pfile = name.substring(0, i)+".tex";
                     var cmd = app.config.paths.pandoc+" -f opendocument '"+name+"' -t latex -o '"+pfile+"'";
                     exec(cmd, {cwd: home}, function(err){
                            done();
                     });
                     
                } else {
                    done();
                }
                
            });
            
        });
    };  
      
       
    app.post("/rest/activity/getjson", getJSON);
    app.post("/rest/misc/latex2", latex2Post);
    app.post("/rest/misc/mathpix", mathpixPost);
    app.post("/rest/pitex/projects", pitexProjects);
    app.post("/rest/pitex/list", pitexList);
//    app.post("/rest/pitex/del", pitexDelProject);
//    app.post("/rest/pitex/deldoc", pitexDelDoc);
    app.post("/rest/pitex/create", pitexCreate);
    app.post("/rest/pitex/save", pitexSave);
    app.post("/rest/pitex/makepdf", pitexPdf);
    app.post("/rest/pitex/pandoc", pitexPandoc);
    app.post("/rest/pitex/zip", pitexZip);
    app.post("/rest/pitex/getpdf", downloadPDF);
    app.post("/rest/pitex/upload", upload);
    
};
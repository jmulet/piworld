(function () {

    var fs = require("fs"),
    compressor = require("node-minify");
    var winston = require('winston');
    
    var U = require('../util.js');

    function detect_i18n(str)
    {
        if(str.indexOf('i18n')>=0 || str.indexOf("'")===0)
        {
            return str;
        }
        else
        {
           return "\""+str+"\""; 
        }
    };
    
    var utilityFunctions = function(){
        var str = "";        
        return str;
    };
    
    //tab, Generador, question, step, libs
    var resolveCreation = function (t, GEN, q, s, libs)
    {
        var str = "";
        t += "\t";


        str += t + "this.addScore = 1;\n";
        str += t + "var s = this.parentQuestion.scope;\n";
        str += t + "var self = this;\n";
       
        //Mira si defineix hints...
        if(s.tips)
        {
            if(typeof(s.tips)==='string')
            {
                str += t + "this.hint = "+detect_i18n(s.tips)+";\n";                
            }
            else if(s.tips.length)
            {
                //is an array
                str += t + "this.hint = '<h1>'+"+detect_i18n(s.tips)+"+'</h1>';\n";                
            }
        }
        
        if(GEN){
            str += GEN.resolveCreation(t, q, s, libs);
        }
        else
        {
            str += t+"//No code generator has been found for "+s.type+";\n";
        }
        
        return str;
     
    };     
 
    var resolveChecking = function (t, GEN, q, s, libs)
    {
        var str = "";
        t += "\t";
        str += t + "var s = this.parentQuestion.scope;\n";
        str += t + "userinput = userinput || s.userinput;\n";
        str += t + "this.tmpinput = userinput;\n";
        str += t + "var check = {valid: false, feedback: ''};\n";
        
        if(GEN){
            if(GEN.resolveChecking)
            {
                str += GEN.resolveChecking(t, q, s, libs);
            }
            else
            {
                //use default
                str += t + "check.valid = (userinput==this.answer);\n";
                str += t + "defer.resolve(check);\n";
            }
        }
        else
        {
            str += t+"//No code generator has been found for "+s.type+";\n";
        }
        return str;
    };
    
    //Resolves define function for required modules or server side operations
    var resolveDefine = function(t, json)
    {
        var str="\n";
       
        var containsFunction = false;
        var listServerData = [];
        json.questions.forEach(function(q){
            
           
           if(q.type && q.type.startsWith("function"))
           {
               containsFunction = true;
           }
           if(q.serverData)
           {
               var qs = q.serverData;
               if(typeof(qs)==='string')
               {
                   qs = [{var: "serverData", file: qs}];
               } else if(!Array.isArray(qs)){
                   qs = [qs];
               }
                
               listServerData = listServerData.concat(qs);
           }
           q.steps.forEach(function(s){
                if(s.type && s.type.startsWith("function"))
                {
                    containsFunction = true;
                } 
           });
               
        });
        
        var tobeResolved = [];
        if(containsFunction){
             str += t+"client.addCss('assets/libs/angular-jsx-graph/jsxgraph.css');\n";
             tobeResolved.push("jsxGraph: client.loadModule('jsxGraph')");
        }
        
         
        listServerData.forEach(function(e){
            tobeResolved.push(e.var+": server.http.getJSON(this.idActivity, '"+e.file+"')");
        });
        
        if(tobeResolved.length){  
            str  += t+"return {"+tobeResolved.toString()+"};\n";
        }
        
        return str;        
    };
    
    
   //Resolves destruction by removal of css or js
    var resolveDestroy = function(t, json)
    {
        var str="";
       
        var containsFunction = false;
       
        json.questions.forEach(function(q){
            
           
           if(q.type && q.type.startsWith("function"))
           {
               containsFunction = true;
           }
           
           q.steps.forEach(function(s){
                if(s.type && s.type.startsWith("function"))
                {
                    containsFunction = true;
                } 
           });
               
        });
        
        var tobeDestroyed= [];
        if(containsFunction){
             tobeDestroyed.push("client.removeCss('assets/libs/angular-jsx-graph/jsxgraph.css');");             
        }
        
        if(tobeDestroyed.length){  
            str += t+",\n"+t+"onDestroy: function(){\n";
            tobeDestroyed.forEach(function(e){
                str += t+"   "+e+"\n";
            });
            str += t+"}\n";            
        }
        
        return str;        
    };
    
  
    var resolveHTML = function (t, GEN, q, s, libs)
    {
        var str = "";
        t += "\t";
        str += t + "var s = this.parentQuestion.scope;\n";
        str += t + "var userinput = value || s.userinput || this.tmpinput;\n";
        str += t + "var html = \"\";\n";
        
        if(GEN){
            if(GEN.resolveHTML){                
                str += GEN.resolveHTML(t, q, s, libs);
            }
            else {
                //use default
                str += t + "html = ''+userinput;\n";
            }
                
        }
        else
        {
            str += t+"//No code generator has been found for "+s.type+";\n";
        }
        str += t+ "return html;\n";
        return str;
    };
    
   
    var parseFormulation = function(str){
        return str.replace(/#/g, 'this.parentQuestion.');
    };

    var parseParameters = function (str, libs) {

        //User can use # to refer to this.
        str = str.replace(/#/g,'this.');

        libs = libs || [];
        var generadores1 = ["rent1", "rent2", "rfrac"];
        var contains1 = false;

        generadores1.forEach(function (g) {
            if (str.indexOf(g + "(") >= 0)
            {
                contains1 = true;
            }
            var reg = new RegExp(g + "\\(", "g");
            str = str.replace(reg, 'RG1.' + g + '(');
        });

        if (contains1)
        {
            libs.push("RG1"); 
        }


        var generadores2 = ["Ratio"];
        var contains2 = false;

        generadores2.forEach(function (g) {
            if (str.indexOf(g + "(") >= 0)
            {
                contains2 = true;
            }
            var reg = new RegExp(g + "\\(", "g");
            str = str.replace(reg, 'Ratio.' + g + '(');
        });

        if (contains2)
        {
             libs.push("RATIO");
        }

        var generadores3 = ["rpolc", "rpolz", "rpoleqn"];
        var contains3 = false;

        generadores3.forEach(function (g) {
            if (str.indexOf(g + "(") >= 0)
            {
                contains3 = true;
            }
            var reg = new RegExp(g + "\\(", "g");
            str = str.replace(reg, 'RGALG.' + g + '(');
        });

        if (contains3)
        {
            libs.push("RGALG"); 
        }

        return str;

    };
    
    var UTIL = {parseFormulation: parseFormulation, parseParameters: parseParameters};


    var doParameters = function(tbs, p, prefix, dependencies){
        var define = "";
       
        for (var keyp in p) {
            var v = "" + p[keyp];
            if (v.trim().toLowerCase().indexOf("list(") === 0)
            {
                var id = v.indexOf(",");
                var rep = v.substring(5, id);
                var func = v.substring(id + 1, v.lastIndexOf(")")).trim();
                define += tbs + "\t\tthis"+prefix+"." + keyp + " = [];\n";
                define += tbs + "\t\tvar self = this;\n";
                define += tbs + "\t\tvar config = this.config;\n";
                var f = parseParameters(func, dependencies);
                define += tbs + "\t\t" + "for(var i=0; i<" + rep + ";i++){var tmp = " + f + "; while(self"+prefix+
                        "." + keyp + ".indexOf(tmp)>=0){tmp = " + f + ";} self"+prefix+"."+keyp+".push(tmp);};\n";
                //Sort the generate list
                define += tbs + "\t\tthis"+prefix+"." + keyp + ".sort(function(a,b){return a-b;});\n";
            }
            else
            {
                define += tbs + "\t\t" + "this"+prefix+"." + keyp + " = " + parseParameters(v, dependencies) + ";\n";
            }
        }
        return define;
    };

    var generator = function (fromDir, toDir, success_cb, error_cb, log) {

        log = log || [];
        
        var path = fromDir + "QProvider.json";

        fs.readFile(path, 'utf8', function (err, src) {

            if (err)
            {
                winston.error(err);
                if(error_cb){
                    error_cb();
                }
                return;
            }

            var json = {};
            try {
                json = JSON.parse(src);
            }
            catch (ex)
            {
                winston.error(ex);
                if(error_cb){
                    error_cb();
                }
                return;
            }


            var tbs = "\t\t\t";
            var init = tbs + "init: function(){\n";
            tbs += "\t";
            init += tbs + "this._super();\n";
            init += tbs + "var self = this;\n";
            init += tbs + "var brain = this.brain;\n";

            for (var key in json.config) {
                init += tbs + "this.config." + key + " = " + json.config[key] + ";\n";
            }
            
            init += tbs + "this.config.category = \"" + (json.activity? (json.activity.category || 'g') : 'g') + "\";\n";
            
            init += "\t\t\t},\n\n";
 

            var define = "\t\t\tdefine: function(){\n";
            define += "\t\t\t\tvar self = this;\n";
            define += "\t\t\t\tvar i18n = this.i18n;\n";

            var indx = 1;
            tbs = "\t\t\t\t";

            if (!json.questions)
            {
                json.questions = [];
            }

            var dependencies = {
                libs: [],
                push: function(lib){
                    if(this.libs.indexOf(lib)<0){
                        this.libs.push(lib);
                    }
                }
            };
            
            
            json.questions.forEach(function (q) {
                define += tbs + "//-------------------------Question " + indx + "\n";



                define += tbs + "var questions" + indx + " = this.createQuestion({\n";
                define += tbs + "\tinit: function(){\n";
                define += tbs + "\t\tthis._super(self.scope);\n";
                q.title = q.title || '';
                if(q.title.indexOf('i18n')>=0)
                {
                     define += tbs + "\t\tthis.headingHTML = " + q.title + ";\n";
                }
                else
                {
                    define += tbs + "\t\tthis.headingHTML = \"" + q.title + "\";\n";
                }
                
                if(q.category){
                    define += tbs + "\t\tthis.category = \"" + q.category + "\";\n";
                }

                var allowerrors = q.allowerrors;
                if (!allowerrors)
                {
                    allowerrors = json.config.allowerrors;
                }

                if (allowerrors !== null)
                {
                    define += tbs + "\t\tthis.allowerrors = " + allowerrors + ";\n";
                    define += tbs + "\t\tthis._allowerrors = " + allowerrors + ";\n";
                }

                define += tbs + "\t},\n\n";
                define += tbs + "\tupdate: function(){\n";

                
                //These are level-independent parameters
                if (q.parameters) 
                {
                     define += doParameters(tbs, q.parameters, '', dependencies);
                }
                
                //Check if this question is a multiple-choice
                if(q.type==='free.multiplechoice'){
                    define += tbs + "\tthis.expr = self.config.shuffleQuestions? self.database.random() : self.database[0];\n";
                    define += tbs + "\tself.config.shuffleOptions && Array.isArray(this.expr.options) && this.expr.options.shuffle();\n";
                    define += tbs + "\tvar index = self.database.indexOf(this.expr);\n";
                    define += tbs + "\tself.database.splice(index, 1);\n";
                    
                    define += tbs+"\t//Normalize to support old syntax--------------\n";
                    define += tbs+"\tthis.expr.type = this.expr.type || 'multiple';\n";
                    define += tbs+"\tif(this.expr.type==='multiple' && this.expr.answer){\n";
                    define += tbs+"\t\t this.expr.opts = angular.copy(this.expr.options); \n";
                    define += tbs+"\t\t this.expr.options = [];\n";
                    define += tbs+"\t\t if(!Array.isArray(this.expr.answer)){ this.expr.answer = [this.expr.answer]; }\n";
                    define += tbs+"\t\t jQuery.each(this.expr.opts, function(i, e){\n";
                    define += tbs+"\t\t\t  this.expr.options.push({text: e, valid: this.expr.answer.indexOf(e)>=0});\n";
                    define += tbs+"\t\t }); \n";
                    define += tbs+"\t\t delete this.expr.answer;\n";
                    define += tbs+"\t\t delete this.expr.opts;\n";
                    define += tbs+"\t}\n";
                    define += tbs+"\t\n";
                    
                    define += tbs + "\t//Check if scope must be evaluated-------------\n";
                    define += tbs + "\tif(this.expr.scope){\n";
		    define += tbs + "\t   var context = window.evaluator.parse(this.expr.scope);\n";
		    define += tbs + "\t   this.expr.formulation = window.evaluator.parse(this.expr.formulation, context);\n";
		    define += tbs + "\t   if(this.expr.hints){ this.expr.hints = window.evaluator.parse(this.expr.hints, context)}\n";
		    define += tbs + "\t   if(this.expr.answer){ this.expr.answer = window.evaluator.parse(this.expr.answer, context)}\n";
                    define += tbs + "\t   if(this.expr.options){\n";
		    define += tbs + "\t      for(var i=0; i<this.expr.options.length; i++){\n";
		    define += tbs + "\t         this.expr.options[i].text = window.evaluator.parse(this.expr.options[i].text, context);\n";
                    define += tbs + "\t	    }\n";
                    define += tbs + "\t   }\n";
                    define += tbs + "\t}\n";
                    define += tbs + "";
                }
                
                
                //Now we implement level-dependent parameters
                var levels = ['d','0','1','2','3','4'];
                define += tbs + "\t\tthis.ldps = {};\n";
                levels.forEach(function(l){
                    var qps = q['parameters-'+l];
                    if(qps && Object.keys(qps).length){
                        define += tbs + "\t\tthis.ldps.L"+l+" = {};\n";
                    }
                    if (qps){
                        define += doParameters(tbs, q['parameters-'+l], '.ldps.L'+l, dependencies);
                    } 
                    
                });
                define += tbs + "\t\t client.selectLevel(this);\n";

                define += tbs + "\t}\n";
                define += tbs + "\n";
                define += tbs + "\t}, {repeat: " + (q.repeat || 1) + "});\n";

                //End of question
                define += tbs + "\n";


                
                //If json does not define steps then assume single step defined in the question body itself
                if(!q.steps){
                    q.steps = [q];
                }
                
                //Define steps for this question
                var i = 1;
                q.steps.forEach(function (s) {
                    
                    s.type = (s.type || "").trim().toLowerCase();                     
                    //Require module according to type
                    var GEN = null;
                    if(s.type.startsWith("integer") || s.type.startsWith("fraction") || s.type.startsWith("real") || s.type.startsWith("numeric"))
                    {
                        GEN = require('./generator-arithmetics.js')(UTIL);
                    }
                    if(s.type.startsWith("polynomial") || s.type.startsWith("equation") || s.type.startsWith("system") || s.type.startsWith("vector") || s.type.startsWith("matrix"))
                    {
                        GEN = require('./generator-algebra.js')(UTIL);
                    }
                    else if(s.type.startsWith("function"))
                    {
                        GEN = require('./generator-functions.js')(UTIL);
                    }
                    else if(s.type.startsWith("geom2d"))
                    {
                        GEN = require('./generator-geometry2d.js')(UTIL);
                    }
                    else if(s.type.startsWith("geom3d"))
                    {
                        GEN = require('./generator-geometry3d.js')(UTIL);
                    }
                    else if(s.type.startsWith("free"))
                    {
                        GEN = require('./generator-free.js')(UTIL);
                    }
                    
                    if(GEN && GEN[s.type])
                    {
                        define += tbs + "//....STEP" + i + "_" + indx + "\n";
                        define += tbs + "var step" + i + "_" + indx + " = {\n";
                        var tbs1 = tbs + "\t";

                        define += tbs1 + "resolveCreate: function(defer){\n";

                        define += resolveCreation(tbs1, GEN[s.type], q, s, dependencies);

                        define += tbs1 + "},\n";

                        define += tbs1 + "resolveCheck: function(defer, userinput){\n";

                        define += resolveChecking(tbs1, GEN[s.type], q, s, dependencies);

                        define += tbs1 + "},\n";

                        define += tbs1 + "getUserinputHTML: function(value){\n";

                        define += resolveHTML(tbs1, GEN[s.type], q, s, dependencies);

                        define += tbs1 + "}\n";

                        define += tbs + "};\n";
                        i += 1;
                    }
                    else
                    {
                        winston.warn("Can't find code generator for activity type "+s.type);
                    }
                    
                   
                });


                //Create steps for this question
                define += tbs + "questions" + indx + ".forEach(function(q){\n";
                i = 1;
                q.steps.forEach(function (s) {
                    define += tbs + "\tq.createStep(step" + i + "_" + indx + ");\n";
                    i += 1;
                });
                define += tbs + "});\n";

                indx += 1;
            });


            define += "\t\t\t"+resolveDefine(tbs, json)+tbs+"}\n\n";


            var footer = resolveDestroy("\t\t\t", json);
            footer += "\t\t\n\t\t};\n";
            
            footer += "\n\t};\n";
            footer += "\treturn module;\n\});";

            var s = "";
            var lpath = "activities/libs/";
            var importLibs = "";
            var importVars = "";
            var libnames = {RG1: "rgen-arithmetics", RGALG: "rgen-algebra", Ratio: 'ratio', RGFUNC_ELEMENTAL:"rgen-func-elemental",
                            GEOGEBRA: '!geogebra', MATHLEX: '!mathlex'};
                        
                        
            dependencies.libs.forEach(function (l) {
                if(!libnames[l].startsWith('!')){
                    importLibs += s + "\"" + lpath + libnames[l] + ".js\"";
                    importVars += s + l;                
                }
                else
                {
                    importLibs += s + "\""+libnames[l].substring(1)+"\"";
                }
                s = ",";
            });
            
            //Add any other dependency which is set in the json entry libs=['route/to/lib1.js', ['route/to/lib2.js', 'EXPORT2']];            
            if(json.libs && Array.isArray(json.libs)){
                json.libs.forEach(function(e){
                   if(typeof(e)==='string' && importLibs.indexOf(e)<0){
                       importLibs += s + "\""+e+"\"";
                   } 
                   else if(Array.isArray(e) && e.length===2 && importLibs.indexOf(e[0])<0){
                       importLibs += s + "\""+e[0]+"\"";
                       importVars += s + e[1];  
                   } 
                });
            }

            importLibs += s + "\"" + lpath + "imDirectives.min.js\"";

            var header = "//QProvider.js automatically generated from QProvider.json at " + new Date() + "\n";
            header += "//Please, do not manually edit this file since it will be overriden.\n";
            header += "define([" + importLibs + "], function(" + importVars + "){\n";
            header += "\t\"use strict\";\n";
            header += "\tvar module = function(client, server){\n";
            header += utilityFunctions();
            header += "\t\treturn {\n\n";


            var codi = header + init + define + footer;
            //Save it to file
            fs.writeFile(toDir + 'QProvider.js', codi, function (err) {
                if (err) {
                    log.push(err);
                    if(error_cb){
                       error_cb();
                    }
                    return;
                }
                log.push("Generated code: "+toDir+"QProvider.js");
               

                //Now must minify this file --> QProvider.min.js
                new compressor.minify({
                    type: 'gcc',
                    fileIn: toDir + 'QProvider.js',
                    fileOut: toDir + 'QProvider.min.js',
                    callback: function (err, min) {
                        if(err)
                        {
                            log.push(err);
                            winston.error(err);
                            if(error_cb){
                                error_cb();
                            }
                            return;
                        }
                        log.push("Compressed: "+toDir+"QProvider.min.js");
                        
                        if(success_cb){
                            success_cb();
                        }
                    }
                });
               
            });

        });
    };

    module.exports = generator;
}
());



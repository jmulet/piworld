module.exports = function(app)
{  
    var fs = require('fs');
    var uuid = require('node-uuid');
    var PythonShell = require('../shell/python-shell');
    var MaximaShell = require('../shell/maxima-shell');
    var YacasShell = require('../shell/yacas-shell');
    var winston = require('winston');

    var optionsPy = {
      mode: 'text',
      pythonPath: app.config.paths.python,
      pythonOptions: ['-u'],
      scriptPath: app.config.paths.tmp
    };
    
    var optionsMac = {          
      maximaPath : app.config.paths.maxima,
      maximaOptions : ['-q'],  //--quite
      scriptPath: app.config.paths.tmp
    };
    
    var optionsYac = {          
      yacasPath : app.config.paths.yacas,
      yacasOptions : ['-pc'],
      scriptPath: app.config.paths.tmp
    };
 
    //post p.expr
    var sympy = function(req, res)
    {
        var p = req.body;        
        var script = "from sympy import *\n";
        script += "x, y, z = symbols('x y z')\n";
        for(var i in p.cmds)
        {
            script += p.cmds[i]+"\n";
        }
        
        var rnd = uuid.v4();
        var filePath =  optionsPy.scriptPath+"\\"+rnd+".py";
        fs.writeFile(filePath, script, function(err) {
             if(err) {
                winston.error(err);
                return;
             }
             PythonShell.run(rnd+'.py', optionsPy, function (err, results) {
                    if (err)
                        winston.error(err);
                    // results is an array consisting of messages collected during execution 
                    res.send({out: results, err: err});  
                    fs.unlink(filePath);
            });  
        });           
    };
    
    var python = function(req, res)
    {
        var p = req.body;        
        var rnd = uuid.v4();
        var filePath =  optionsPy.scriptPath+"\\"+rnd+".py";
        fs.writeFile(filePath, p.script, function(err) {
             if(err) {
                winston.error(err);
                return;
             }
             PythonShell.run(rnd+'.py', optionsPy, function (err, results) {
                    if (err)
                        winston.error(err);
                    // results is an array consisting of messages collected during execution 
                    res.send({out: results, err: err});  
                    fs.unlink(filePath);
            });  
        });           
    };
    
   
    function fixOverRecursive(list){
        for(var i=0; i<list.length; i++){
            var e = list[i];
            if(typeof(e)==='string' && e==='\\over' && i>0 && i<list.length-1){
                list[i] = '';
                list[i-1] = '\\frac'+list[i-1];                
                delete list[i-2];   //fix {{}} in angular
                delete list[i+2];
            } else if(Array.isArray(e)){
                fixOverRecursive(e);
            }
        }
    }
     
    
    //Fix annoying \over in maxima latex output replacing them with \frac
    function fixOver(str){ 
       if(str.indexOf('\\over')<0){
           return str;
       }
       str = str.replace(/\\/g, '\\\\').replace(/,/g, '@');
       var tmp = "['"+str.replace(/{/g,"',['{").replace(/}/g,"}'],'")+"']";
       
       var parsed;
       try{
           parsed = eval(tmp);
       }catch(ex){
           return str;
       }
       
       fixOverRecursive(parsed);
       
       return parsed.join().replace(/,/g,'').replace(/@/g,',');       
    }
    
    var parseMacOutput = function(results, inline){
        var output = results.join(''); 
        var offset = 2;
       
        if(!inline){                   
            offset = 3;
        }
        var sindx = output.indexOf('(%i'+offset+')');
        output = output.slice(sindx);
        
        var split = output.split('(%');
        if(!inline){
            split.splice(-1, 1);
        }
       
        var pairs = [];

        split.forEach(function (e) {
            if(e.trim()){
            var ipd = e.indexOf(')');
            var command = e.slice(ipd + 1).trim();
            var type = e.slice(0, 1);            
            var num = parseInt(e.slice(1, ipd)) - offset;
            var obj = pairs[num];
            if (!obj)
            {
                obj = {i: '', o: ''};
                pairs[num] = obj;
            }            
                obj[type] = command.trim();
                if (command.indexOf("tex(") >= 0) //type === 'i' && 
                {
                    var k = command.indexOf('$$');
                    obj.i = command.slice(0, k).trim();
                    obj.o = fixOver(command.slice(k + 2).replace('$$', '').trim());
                    //Fix logarithms
                    obj.o = obj.o.replace(/log/g, 'ln');
                }
            }
        });
        return pairs;                    
    };

    //It can be called with the following post parameters
    //script = text with script commands
    //lines  = list of script lines (without ending ;)
    //file   = if present loads this script file.
    var maxima = function(req, res)
    {       
        var p = req.body;        
        var rnd = uuid.v4();
        
        var script = ["display2d:false$"];
        if(p.script)
        {
            script.push(p.script);
        }
        else if(p.lines)
        {
            p.lines.forEach(function(e){
               if(e.indexOf("$")<=0)
               {
                    script.push( e+";"); 
               }
               else
               {
                    script.push( e );
               }
            });
        }
        else if(p.file)
        {
            script.push( fs.readSyc(p.file) );
        }
        
         
        
        if(p.useFile){  //Force writing and interpreting a file
                var filePath = optionsMac.scriptPath+rnd+".mac";
                fs.writeFile(filePath, script.join('\n'), function(err) {
                if(err) {
                   winston.error(err);
                   return;
                }
                MaximaShell.run(rnd+'.mac', optionsMac, function (err, results) {
                    if (err)
                    {
                        winston.error(err);
                    }
                    
                    var pairs = parseMacOutput(results, false);
                      
                    res.send({out: pairs, err: err});  
                    fs.unlink(filePath);
                });  
                
            });
            
        } else {  //Use inline format (default)
                   
            MaximaShell.run('-batch-string='+script.join(' '), optionsMac, function (err, results) {
                    
                    if (err)
                    {
                        winston.error(err);
                    }                    
                    var pairs = parseMacOutput(results, true);
                      
                    res.send({out: pairs, err: err});                
            });
        }
                  
    };
    
    //It can be called with the following post parameters
    //script = text with script commands
    //lines  = list of script lines (without ending ;)
    //file   = if present loads this script file.
    //useFile = true/false uses or not an intermediate file
    var yacas = function(req, res)
    {       
        var p = req.body;        
        var rnd = uuid.v4();
        
        var script = "";
        if(p.script)
        {
            script += p.script;
        }
        else if(p.lines)
        {
            p.lines.forEach(function(e){
               
                    script += e+";\n"; 
               
            });
        }
        else if(p.file)
        {
            script += fs.readSyc(p.file);
        }
        
        var filePath;
        var done = function (err, results) {
                   if (err)
            {
                winston.error(err);
            }
            res.send({err: err, out: results});
            if(filePath){
                 fs.unlink(filePath);
            }
        };
        
        if(p.useFile){  //Force writing and interpreting a file
         
                filePath =  optionsYac.scriptPath+rnd+".yac";
                fs.writeFile(filePath, script, function(err) {
                if(err) {
                   winston.error(err);
                   return;
                }
                YacasShell.run(rnd+'.yac', optionsYac, done);
                
             });
            
        } else {  //Use inline format (default)
            script += "Exit();";
            script = "["+script+"]";
                   
            YacasShell.run('--execute '+script, optionsYac, done);
        }
          
    };
    
    if(app.post){
        app.post('/rest/cas/sympy', sympy);
        app.post('/rest/cas/python', python);
        app.post('/rest/cas/maxima', maxima);
        app.post('/rest/cas/yacas', yacas);
    }
};

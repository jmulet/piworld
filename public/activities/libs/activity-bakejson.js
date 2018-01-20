/* 
 *  Prepare json from server to be injected into activity-quizz 
 *  It interpolates {{}} expressions
 *  It generates equations  $...$ etc... 
 *  
 */

define(["katex"], function(katex){
    
 window.katex = window.katex || katex;
 var pw = window.pw || {}; 
 ///////////////////////////////////////////////////////////////////// vm-iframe
 
 
    var Script = function(context) {        
        this.context= context;
        var iframe = document.createElement('iframe');
        this.iframe = iframe;
        if (!iframe.style) iframe.style = {};
        iframe.style.display = 'none';

        document.body.appendChild(iframe);

        var win = iframe.contentWindow;
         
        Object.defineProperty(win.Array.prototype, 'random', {
            value: function() {
                return this[win.Math.floor(win.Math.random()*this.length)];
            }
        });
                
        win.Array.prototype.shuffle = function() {
              var i = this.length, j, temp;
              if ( i === 0 ) return this;
              while ( --i ) {
                 j = win.Math.floor( win.Math.random() * ( i + 1 ) );
                 temp = this[i];
                 this[i] = this[j];
                 this[j] = temp;
              }
              return this;
        };
        
       
            win.Math.ln = function(a) {
                return win. Math.log(a)/win.Math.LOG10E;
            };
      
       
            win.Math.logb = function(a, b) {
                return win.Math.log(a)/win.Math.log(b || 10);
            };
        
       
            win.Math.root = function(a, n) {
                return win.Math.pow(a, 1.0/n);
            };
        
            win.Math.srandom = function() {
                return win.Math.random().toString(36).slice(2);
            };
       
       
            win.Math.irandom = function(a, b) {
                a = a || 0;
                b = b || 10;
                return win.Math.floor( win.Math.random()*(b-a)) + a;
            };
         
            win.Math.seed = function(seed) {
                this.seed = seed;
                this.random = function(n){
                    n = n || 1;
                    var list = new Array(n);
                    for(var i=0; i<n; i++){
                        this.seed = (this.seed * 9301 + 49297) % 233280;
                        list[i] = this.seed / 233280;
                    }
                    return n>1? list: list[0];
                };
                return this;
            };
            
            win.Math.fact = function(n) {
                if ((typeof n !== 'number') ||  n < 0){ 
                    return false; 
                }
                if (n === 0) {
                    return 1;
                }
                return n * win.Math.fact(n - 1);
            };
            
           win.Math.binomial = function (n, k) {
            if ((typeof n !== 'number') || (typeof k !== 'number') || n < k){ 
                return false; 
            }
            var coeff = 1;
            for (var x = n-k+1; x <= n; x++) {
                coeff *= x;
            }
            for (x = 1; x <= k; x++) {
                coeff /= x;
            }
            return coeff;
        };
        
        this.win = win;
        
        this.win.onbeforeunload = function(){
            iframe.src = "about:blank";
        };
       
        
        this.wEval = win.eval;
        this.wExecScript = win.execScript;

        if (!this.wEval && this.wExecScript) {
            // win.eval() magically appears when this is called in IE:
            this.wExecScript.call(win, 'null');
            this.wEval = win.eval;
        }
        
        var contextKeys = Object.keys(this.context);
        var n = contextKeys.length;
        for(var i=0; i<n; i++){
             var key = contextKeys[i];
             win[key] = context[key];
        }
        
        this.globals = Object.keys(win);
    };

    Script.prototype.runInContext = function (code) {
        //var contextKeys = Object.keys(this.context);
        var res;
        try{       
             res = this.wEval.call(this.win, code);
         } catch(Ex){
             console.log(Ex, code);
         }
        var winKeys = Object.keys(this.win);

        var n = winKeys.length;
        for(var i=0; i<n; i++){
            var key = winKeys[i];
            // Avoid copying circular objects like `top` and `window` by only
            // updating existing context properties or new properties in the `win`
            // that was only introduced after the eval.
            if (this.globals.indexOf(key)<0) {
                this.context[key] = this.win[key];
            }
        };
 
        return res;
    };
    
    
    Script.prototype.destroy = function(){
       document.body.removeChild(this.iframe);
       this.wEval = null;
       this.wExecScript = null;
       this.win = null;
    };
    
    pw.Script = Script;
    
    
    /***
     * Katex Parser
     * @type RegExp|undefined
     */
    
    pw.katexMacros = {
                "\\Re": "\\mathbb{R}",
                "\\alf": "\\alpha",
                "\\tg": "\\mathrm{tg}\\,",
                "\\arctg": "\\mathrm{arctg}\\,",
                "\\cotg": "\\mathrm{cotg}\\,",
                "\\cosec": "\\mathrm{cosec}\\,"
                //"\\limx": "\\mathop{lim}\\limits_{#1\\to #2}"     //Not yet supported???
    };
         
    var regexInline = new RegExp("\\${1,2}([\\s\\S]*?)\\${1,2}", "g");      
    var regexDisplay = new RegExp("\\\\\\[([\\s\\S]*?)\\\\\\]", "g");
    
    
    pw.katexParser = function(text, options){
       
        if(!text){
            return text;
        }
        
        var opts = {
            displayMode: false,
            macros: pw.katexMacros
        };
        options = options || {};
       
        var rendered = text.replace(regexInline, function (match, contents, offset, s) {
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
        
        rendered = rendered.replace(regexDisplay, function (match, contents, offset, s) {
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

    
    
    /**
     * Interpolate literals {{}} within scope
     * @param {type} tpl
     * @returns {undefined}
     */
    
    var regexTemplates = new RegExp("\\{{2}([\\s\\S]*?)\\}{2}", "g");
    
    var Template = function(tpl, script){
         if(!tpl){
             return tpl;
         }
         
         var interpolated = tpl || ""; 
         
         //Evaluate interpolations as well
         var code = "";
         var instances = 0;
         var lastVar = "";
         var tpl2 = interpolated.replace(regexTemplates, function(match, contents){
             var newvar = "__nv_"+Math.random().toString(36).substring(2)+"__";
             code += newvar+"="+contents+"; ";              
             instances += 1;
             lastVar = newvar;
             return "{{"+newvar+"}}";
         });
         
         if(code){
            script.runInContext(code);

            //In case that only one interpolation is obtained and is not of type string --> return the array; object; function; etc... itself
            if(instances===1 && typeof(script.context[lastVar])!=="string"){                                
                return script.context[lastVar];
            }

            interpolated = tpl2.replace(regexTemplates, function(match, contents){
                var subst;
                if(script.context[contents]){
                    subst = script.context[contents]+""; //Make sure it is converted to string (must return a string);
                } else {
                    subst = match;
                }
                return subst;
            });
        }
        
        
        //Replace katex:: Don't do this: otherwise database gets overcrowed
        //interpolated = pw.katexParser(interpolated);
        
        return interpolated;
    };  
   


    pw.Template = Template;
 


pw.BakeJson = function(rawJson, quizzDeps, idUser){
        var backed = new Array(10); //Max 10 levels

        var context = {
            iran: function (a, b) {
                return Math.floor((b - a) * Math.random()) + a;
            },
            Alea: pw.Alea,
            idUser: idUser
        };
        
        if(quizzDeps){
            $.each(Object.keys(quizzDeps), function(i, key){
                context[key] = quizzDeps[key];
            });
        }
        
        var script = new pw.Script(context);            
                 
        var minl = 10;
        var maxl = 0;
        
        $.each(rawJson, function(i, question){

            var numrepeat = question.repeat || 1;
            for (var ri = 0; ri < numrepeat; ri++){

                var q = $.extend(true, {}, question);
                q.level = q.level  || 1;
                if(q.level>10){
                    q.level = 10;
                }
                if(q.level<minl){
                    minl = q.level;
                }
                if(q.level>maxl){
                    maxl = q.level;
                }
                //Evaluate everyting in this question based on the scope
                if (q.scope && q.scope.trim()){                        
                    script.runInContext(q.scope);                  
                }
                
                q.formulation = pw.Template(q.formulation, script);
                q.subformulation = pw.Template(q.subformulation, script);
                q.hints = pw.Template(q.hints, script);
                q.feedback = pw.Template(q.feedback, script);
                
                if(q.validate){                       
                      var id = Math.random().toString(36).slice(2);
                      var bar = "__validate_fn_"+id+"__";
                      script.runInContext(bar+"="+q.validate.replace(/\{\{/g,'').replace(/\}\}/g,''));
                      q.validate = context[bar];
                }
                if(q.check){                   
                      var id = Math.random().toString(36).slice(2);
                      var bar = "__check_fn_"+id+"__";
                      script.runInContext(bar+"="+q.check.replace(/\{\{/g,'').replace(/\}\}/g,''));
                      q.check = context[bar];
                }
                if (Array.isArray(q.answer)){
                    for (var k = 0; k < q.answer.length; k++){
                        if(typeof(q.answer[k])==="string"){
                            q.answer[k] =  pw.Template(q.answer[k], script);
                        }
                    };
                }
                else {
                    q.answer = pw.Template(q.answer, script);
                }

               q.checkOpts = q.checkOpts || {};

                if(q.options){
                     
                    if(typeof(q.options)==="string"){
                        
                        q.options = pw.Template(q.options, script);
                        
                    } else if($.isArray(q.options)) {
                        
                        $.each(q.options, function(i, opt){
                        opt.text = pw.Template(opt.text, script);
                        
                        if(typeof(opt.valid)==="string"){
                            var ret = opt.valid;
//                            if(typeof(ret)==="function"){
//                                ret = ret(script.context);
//                            }
                            var id = Math.random().toString(36).slice(2);
                            var bar = "__valid_"+id+"__";
                            script.runInContext(bar+"="+ret.replace(/\{/g,'').replace(/\}/g,''));
                           
                            opt.valid = context[bar];
                           
                        }
                      });            
                    }
                }
                 
                var array = backed[q.level-1];
                if(!array){
                    array = [];
                    backed[q.level-1] = array;
                }
                array.push(q);
            };
        });  
             
    script.destroy();
 
    var filtered = backed.filter(function(l){return typeof(l)!=="undefined";});
   
    return filtered;
};
   
 
// Transforms jsCode into JSON ready to be used by BakeJSON.
// Basically jsCode must define a global variable called brewed which is a promise from which json is retrieved
pw.BrewJS = function(jsCode){
     var context = {};
     var script = new pw.Script(context);     
     script.runInContext(jsCode);
     script.destroy();
     if(context.brewed && context.brewed.then){
         return context.brewed;
     } else {
         var defer = new $.Deferred();
         defer.resolve([]);
         return defer.promise();
     }     
};


});
 

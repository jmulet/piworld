module.exports = function(UTIL){
  
    var module_types = {};
  
    module_types["function.elemental.type"] = {
        
        resolveCreation: function(t, q, s, libs){
            libs.push("RGFUNC_ELEMENTAL");
            libs.push("MATHLEX");
            //Define all graphics in views array and include anywhere in inputdiv, formulationLaTex, etc. using its id
          
            var str = t+"RGFUNC_ELEMENTAL.random.defaults();\n";
            if(q.parameters.func)
            {
                str += t + "var func = this.parentQuestion.func;\n";
            }
            else
            {
                str += t+ "var func = RGFUNC_ELEMENTAL.random();\n";
            }
            str += t + "var func_cas= func.toJS('x');\n";
            str += t + "this.views['graph0'] = {type:'jsxgraph', cmds:{jsxCreate:\"functiongraph('\"+func_cas+\"')\"}};\n";  
            str += t + "this.parentQuestion.scope.options = [];\n";
            str += t + "this.parentQuestion.scope.userinput = {v:-1};\n";
            str += t + "for(var key in RGFUNC_ELEMENTAL.types){this.parentQuestion.scope.options.push({label: i18n.get(key), id: RGFUNC_ELEMENTAL.types[key]});};\n";            
            str += t + "this.inputdiv=\"<ul class='list-unstyled'><li ng-repeat='option in options'><input type='radio' ng-model='userinput.v' ng-value='option.id'  ng-disabled='done'/>{{option.label}}</li></ul>\";\n";
            
            str += t + "this.formulationLaTeX = \"{view:graph0}\";\n";;
            str += t + "this.formulationHTML = this.formulationLaTeX;\n";            
            str += t + "var tex = 'y='+func.toLaTeX('x');\n";
            str += t + "this.hint += \"L'equació de la gràfica mostrada és <katex>\"+tex+\"</katex>\";\n";
            
            str += t + "this.answer = func.getType();\n";            
            str += t + "this.answerHTML = RGFUNC_ELEMENTAL.getTypeName(func.getType())+' : <katex>'+tex+'</katex>';\n";
            str += t + "this.answerLaTeX = RGFUNC_ELEMENTAL.getTypeName(func.getType())+' : $'+tex+'$';\n";
             str += t + "defer.resolve(this);\n";  
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = t + "check.valid = userinput.v==this.answer;\n";
            str += t+"defer.resolve(check);\n";
            return str;
        },
        resolveHTML: function(t, q, s, libs){
            return t + "html = RGFUNC_ELEMENTAL.getTypeName(userinput.v);\n";   
        }        
    };   
    
    module_types["function.limit"] = {
        
        resolveCreation: function(t, q, s, libs){
            libs.push("RGFUNC_ELEMENTAL");
            libs.push("MATHLEX");
            //Define all graphics in views array and include anywhere in inputdiv, formulationLaTex, etc. using its id
          
            var str = t+"RGFUNC_ELEMENTAL.random.simple();\n";
            if(q.parameters.func)
            {
                str += t + "var func = this.parentQuestion.func;\n";
            }
            else
            {
                str += t+ "var func = RGFUNC_ELEMENTAL.rfunction(['+','-','*','/'], [RGFUNC_ELEMENTAL.random()]);\n";
            }
            
            if(q.parameters.point)
            {
                str += t + "var point = this.parentQuestion.point;\n";
            }
            else
            {
                str += t+ "var point = Math.floor((Math.random()*10))-5;\n";
            }
            
            //str += t + "this.views['graph0'] = {type:'jsxgraph', cmds:{jsxCreate:\"functiongraph('\"+func.toString()+\"')\"}};\n";  
            str += t + "this.parentQuestion.scope.userinput = this.parentQuestion.scope.userinput || {};\n";
            str += t + "this.parentQuestion.scope.userinput.latex = '';\n";
            
            str += t + "this.inputdiv=\"<mathquill ng-model='userinput' ng-disabled='done' tool-bars='SYM,KYB'></mathquill>\";\n";
            str += t + "var tex = client.$filter('mathlex')(func, 'latex');\n";
            str += t + "this.formulationLaTeX = \"Calcula  $\\\\lim_{x\\\\to \"+point+\"} \"+tex+\"$\";\n";
            str += t + "this.formulationHTML = \"Calcula  <katex>\\\\\lim_{x\\\\to \"+point+\"} \"+tex+\"</katex>\";\n";
            str += t + "var self = this;\n";
            str += t + "server.cas.maxima.run('limit('+func+',x,'+point+');').then(function(d){\n";
            str += t + "  self.answer = d.out[0].o;\n";   
            str += t + "  var answerTeX = self.answer;\n";   
            str += t + "  self.answerHTML = self.answer;\n";
            str += t + "  self.answerLaTeX = self.answer;\n";
             str += t + "  defer.resolve(self);\n";  
            str += t + "});\n";
            
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = t+"var casinput = $('#'+userinput.id).mathquill('maxima');\n";
            str += t+"if(casinput.indexOf('limit')>=0){\n";
            str += t+"    check.feedback='Come on! You must calculate the limit, limit is not allowed!';\n";
            str += t+"    check.valid=null;\n";
            str += t+"    defer.resolve(check);\n";
            str += t+"    return;\n";
            str += t+"}\n";
            str += t+"else if(!casinput){\n";
            str += t+"    check.feedback='Empty response!';\n";
            str += t+"    check.valid=null;\n";
            str += t+"    defer.resolve(check);\n";
            str += t+"    return;\n";
            str += t+"}\n";
        
            str += t + "server.cas.maxima.run('fullratsimp('+casinput+'-('+this.answer+'));').then(function(d){\n";            
            str += t + "   if(d.out.length){\n";
            str += t + "      check.valid = d.out[0].o==0;\n";               
            str += t + "   } else{\n";  
            str += t + "      check.valid = null;\n";    
            str += t + "      check.feedback = '<br>Check math expression!';\n";    
            str += t + "   }\n";  
            str += t + "    defer.resolve(check);\n";  
            str += t + "});\n";
            return str;
        },
        resolveHTML: function(t, q, s, libs){
            return t + "html = '<katex>'+$('#'+userinput.id).mathquill('latex')+'</katex>';\n";   
        }   
    };    
     
    module_types["function.derivative"] = {
        
        resolveCreation: function(t, q, s, libs){
            libs.push("RGFUNC_ELEMENTAL");
            libs.push("MATHLEX");
            //Define all graphics in views array and include anywhere in inputdiv, formulationLaTex, etc. using its id
          
            var str = t+"RGFUNC_ELEMENTAL.random.simple();\n";
            if(q.parameters.func)
            {
                str += t + "var func = this.parentQuestion.func;\n";
            }
            else
            {
                str += t+ "var func = RGFUNC_ELEMENTAL.rfunction(['+','-','*','/'], [RGFUNC_ELEMENTAL.random()]);\n";
            }
            //str += t + "this.views['graph0'] = {type:'jsxgraph', cmds:{jsxCreate:\"functiongraph('\"+func.toString()+\"')\"}};\n";  
            str += t + "this.parentQuestion.scope.userinput = this.parentQuestion.scope.userinput || {};\n";
            str += t + "this.parentQuestion.scope.userinput.latex='';\n";
            str += t + "if(this.parentQuestion.scope.userinput.id){$('#'+this.parentQuestion.scope.userinput.id).mathquill('latex','');};\n";
            str += t + "this.inputdiv=\"<mathquill ng-model='userinput' ng-disabled='done'></mathquill>\";\n";
            
            str += t + "var tex = this.parentQuestion.funcTeX;\n";
            str += t + "var macfunc = this.parentQuestion.func;\n";
            str += t + "this.formulationHTML = \"Calcula la funció derivada de <katex>\"+tex+\"</katex>\";\n";
            str += t + "this.formulationLaTeX = \"Calcula la funció derivada de $\"+tex+\"$\";\n";   
            str += t + "var self = this;\n";
            str += t + "server.cas.maxima.run('diff('+macfunc+',x);tex(diff('+macfunc+',x))$').then(function(d){\n";            
            str += t + "  self.answer = d.out[0].o;\n";   
            str += t + "  var answerTeX = d.out[1].o.replace(/$/g,'');\n";   
            str += t + "  self.answerHTML = '<katex>'+answerTeX+'</katex>';\n";
            str += t + "  self.answerLaTeX = '$'+answerTeX+'$';\n";
             str += t + "  defer.resolve(self);\n";  
            str += t + "});\n";
            
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = t+"var casinput = $('#'+userinput.id).mathquill('maxima');\n";
            str += t+"if(casinput.indexOf('diff')>=0){\n";
            str += t+"    check.feedback='Come on! You must differentiate, diff is not allowed!';\n";
            str += t+"    check.valid=null;\n";
            str += t+"    defer.resolve(check);\n";
            str += t+"    return;\n";
            str += t+"}\n";
            str += t+"else if(!casinput){\n";
            str += t+"    check.feedback='Empty response!';\n";
            str += t+"    check.valid=null;\n";
            str += t+"    defer.resolve(check);\n";
            str += t+"    return;\n";
            str += t+"}\n";
            
            str += t + "server.cas.maxima.run('fullratsimp('+casinput+'-('+this.answer+'));').then(function(d){\n";
            str += t + "   if(d.out.length){\n";
            str += t + "      check.valid = d.out[0].o==0;\n";               
            str += t + "   } else{\n";  
            str += t + "      check.feedback = d.err;\n";    
            str += t + "   }\n";  
            str += t + "    defer.resolve(check);\n"; 
            str += t + "});\n";
            return str;
        },
        resolveHTML: function(t, q, s, libs){
            var str = t + "var tex = $('#'+userinput.id).mathquill('latex');\n";
            str += t + "html = '<katex>'+tex+'</katex>';\n"; 
            return str;
        }        
    };    
     
    return module_types;
};

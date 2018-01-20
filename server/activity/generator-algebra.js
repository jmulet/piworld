module.exports = function(UTIL){
 
  
    var module_types = {};
  
    module_types["equation"] = {
      
        resolveCreation: function(t, q, s, libs){
             
            libs.push("RG1");
            libs.push("RGALG");
            libs.push("MATHLEX");
           
            var str = t + "var eqn = this.parentQuestion.eq;\n";
            str += t + "var bar = this.parentQuestion.bar || 'x';\n";
            str += t + "if(this.parentQuestion.template){\n";
            str += t + "   eqn = RG1.processTemplate(this.parentQuestion.template, {range: this.parentQuestion.range});\n";
            str += t + "};\n";
            str += t + "var tex=client.$filter('mathlex')(eqn, 'latex');\n";
            if(s.formulation)
            {
                 var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {   str += t + "this.formulationLaTeX = \"$\"+tex+\"$\";\n";
                str += t + "this.formulationHTML = \"<katex>\"+tex+\"</katex>\";\n";                
            }
            
            str += t + "this.parentQuestion.scope.userinput = [{x:'', checked:0}];\n";
            str += t + "this.inputdiv=\"<im-zeroes-input ng-model='userinput' var='\"+bar+\"' ng-disabled='done'></im-zeroes-input><br><small>Per a escriure l'arrel quadrada d'un nombre escriviu: <b>sqrt(n)</b> </small>\";\n";
            str += t + "var self = this;\n";
            str += t + "server.cas.maxima.run('realonly: true$ algsys(['+eqn+'],['+bar+']);').then(function(d){\n";            
            str += t + "   self.answer = d.out[1].o.replace(/ /g,'').replace(/\\[/g,'').replace(/\\]/g,'').replace(new RegExp(bar+'=','g'),'').split(',').filter(function(e){return e.trim()!=='';});\n";
            str += t + "   self.answerHTML = self.answer.length>0?(''+self.answer).replace(/,/g, ', '):'No té solució';\n";
            str += t + "   self.answerLaTeX = self.answerHTML;\n";
            str += t + "   defer.resolve(self);\n";
            str += t + "});\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
           var str = t + "check.valid = RG1.compareLists(this.answer, userinput);\n";
              str += t + "defer.resolve(check);\n";
              return str;
        },
        resolveHTML: function(t, q, s, libs){
            var str = t + "var tmp = (userinput || []).map(function(e){return 'x='+e.x;});\n";
            str += t + "html = tmp.join(', ');\n";
            return str;
        }                      
    };   
    
    
    module_types["polynomial.operations"] = {
      
        resolveCreation: function(t, q, s, libs){
           
            libs.push("RG1");
            libs.push("RGALG");
            libs.push("MATHLEX");
           
            var str = t + "var expr = this.parentQuestion.expr;\n";
            str += t + "var bar = this.parentQuestion.bar || 'x';\n";
            str += t + "if(this.parentQuestion.template){\n";
            str += t + "   expr = RG1.processTemplate(this.parentQuestion.template, {range: this.parentQuestion.range});\n";
            str += t + "};\n";            
            str += t + "this.parentQuestion.scope.userinput = this.parentQuestion.scope.userinput || {};\n";
            str += t + "this.parentQuestion.scope.userinput.latex = '';\n";
            str += t + "this.inputdiv=\"<mathquill ng-model='userinput' ng-disabled='done' tool-bars='SYM,KYB'></mathquill>\";\n";
            //User may have defined formulation which overrides formulationLaTeX and formulationHTML
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {
                str += t + "var tex=client.$filter('mathlex')(expr, 'latex').replace(/\\*/g,'\\\\, ');\n";
                str += t + "this.formulationLaTeX = \"$\"+tex+\"$\";\n";
                str += t + "this.formulationHTML = \"<katex>\"+tex+\"</katex>\";\n";
            }
            
            str += t + "var self = this;\n";
            str += t + "server.cas.maxima.run('expand('+expr+');').then(function(d){\n";
            str += t + "   self.answer = d.out[0].o;\n";
            str += t + "   var tex = self.answer.replace(/\\*/g,'\\\\, ');\n";
            str += t + "   self.answerHTML = '<katex>'+tex+'</katex>';\n";
            str += t + "   self.answerLaTeX = '$'+tex+'$';\n";
            str += t + "   defer.resolve(self);\n";
            str += t + "});\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            //count number of terms as a first check
            var str = t + "var casinput = $('#'+userinput.id).mathquill('maxima');\n";
            str += t + "if(RGALG.countTerms(casinput)!==RGALG.countTerms(this.answer)){\n";
            str += t + "   check.feedback='<br>Incorrect number of terms';\n";
            str += t + "   defer.resolve(check);\n";
            str += t + "   return;\n";
            str += t + "}\n\n";            
            str += t + "var self = this;\n";
            str += t + "server.cas.maxima.run(casinput+'-('+this.answer+');').then(function(d){\n";  
            str += t + "   if(d.err){\n";
            str += t + "        check.valid = null;\n";
            str += t + "        check.feedback='<br>Check math expression!';\n";
            str += t + "   } else{\n";
            str += t + "        check.valid = d.out[0].o == '0';\n";
            str += t + "   }\n";
            str += t + "   defer.resolve(check);\n";
            str += t + "});\n";
            return str;
        },
        resolveHTML: function(t, q, s, libs){
            var str = t + "html = '<katex>'+$('#'+userinput.id).mathquill('latex')+'</katex>';\n";
            return str;
        }        
    };   
    
   
    
    
    return module_types;
};


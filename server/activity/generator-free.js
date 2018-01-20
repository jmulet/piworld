module.exports = function(UTIL){
  
    var module_types = {};
 
     module_types["free.multiplechoice"] = {
      
         resolveCreation: function(t, q, s, libs){
            
            var str = "";
            if(q.parameters && Object.keys(q.parameters).indexOf('expr')>=0){
                str += t + "var expr = this.parentQuestion.expr;\n";  
            }else{
                q.serverData = q.serverData || [{var: 'serverData'}];
                if(typeof(q.serverData)==='string'){
                    q.serverData = [{var: 'serverData'}];
                }
                else if(!Array.isArray(q.serverData)){
                    q.serverData = [q.serverData];
                }
                str += t + "var expr = this.parentQuestion.expr;\n";                    
            }
            
            //Must normalize expr in order to support NEW SYNTAX
            //scope: string JSON, formulation: string; type='input' or 'multiple; answer (for input); options (for multiple): array [text: '', valid: boolean], hints: ""
            str += t+"\n";           
            str += t+"expr.valids = expr.options? expr.options.filter(function(o){return o.valid;}) : [];\n";
            str += t+"expr.answer = expr.answer || expr.valids.map(function(o){return o.text;}).join(';');\n";
             
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {   //var parsed = UTIL.parseFormulation(expr.formulation);
                str += t + "this.formulationHTML = expr.formulation + (expr.hints? '<br><small>'+expr.hints+'</small>' : '' );\n";
                str += t + "this.formulationLaTeX = this.formulationHTML;\n";                
            }            
            str += t + "this.answer = expr.solution || expr.answer;\n";
            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.feedback = \"\"+expr.feedback;\n";
            //Solution can be an array of one (use radioboxes) or many items (use checkboxes)
            str += t + "s.userinput = '';\n";
            str += t + "s.options = [];\n";           
            //type=== multiple
            str += t + "jQuery.each(expr.options, function(i, e){ s.options.push({text: e.text, valid: false}); });\n";
            str += t + "if(expr.type==='multiple'){\n";    
            str += t + "    this.parentQuestion.allowerrors = this.parentQuestion._allowerrors;\n";
            str += t + "  if(expr.valids.length!==1){\n";
            str += t + "    this.inputdiv=\"<ul class='list-unstyled'><li ng-repeat='option in options'><input type='checkbox' ng-model='option.valid' ng-disabled='done'/>  <span compile='option.text'></span> </li></ul>\";\n";                     
            str += t + "  } else{\n";
            //Decide which input method to use
            str += t + "    this.parentQuestion.allowerrors = 1;\n";
            str += t + "    if(expr.format==='kahoot'){\n";
            str += t + "      s.options = [];\n"; 
            str += t + "      jQuery.each(expr.options, function(i, e){ s.options.push(e.text); });\n";
            str += t + "      s.userinput = function(pos){var value = s.options[pos]; s.done=true; s.check(value);};\n";            
            str += t + "      this.inputdiv=\"<im-kahoot-input ng-model='userinput' options='options' done='done'/> </im-kahoot-input>\";\n";   
            str += t + "    } else{\n";
            str += t + "      s.userinput = {};\n";
            str += t + "      this.inputdiv=\"<ul class='list-unstyled'><li ng-repeat='option in options'><input name='pickradios' type='radio' ng-model='userinput.valid' ng-value='option.text'  ng-disabled='done'/> <span compile='option.text'></span> </li></ul>\";\n";                              
            str += t + "    }\n";
            str += t + "  }\n";
            str += t + "} else{ \n";
            str += t + "    this.inputdiv=\"<input type='text' ng-model='userinput'/>\";\n";                     
            str += t + "}\n\n";
            
            str += t + "defer.resolve(this);\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str =  "";
            str += t + "var expr = this.parentQuestion.expr;\n";
            
            str += t + "if(expr.type==='multiple'){\n";            
            str += t + "  if(expr.valids.length!==1){\n";
            str += t + "            var user = s.options.map(function(e){return e.text+'='+e.valid;}).join('');\n";
            str += t + "            var expected = expr.options.map(function(e){return e.text+'='+e.valid;}).join('');\n";
            str += t + "            check.valid = (user === expected);\n";
            str += t + "  } else{\n";
            str += t + "    if(expr.format==='kahoot'){\n";
            str += t + "      var expected = expr.options.map(function(e){return e.valid? e.text:'';}).join('');\n";
            str += t + "      check.valid = (userinput === expected);\n";
            str += t + "    } else{\n";
             str += t + "      var expected = expr.options.map(function(e){return e.valid? e.text:'';}).join('');\n";
            str += t + "       check.valid = (userinput.valid === expected);\n";
            str += t + "    }\n";
            str += t + "  }\n";
            str += t + "} else{ \n";
            str += t + "      check.valid = (userinput == expr.answer);\n";
            str += t + "}\n\n";
           
           
            str += t+"defer.resolve(check);\n";
            return str;
        },      
        resolveHTML: function(t, q, s, libs){
            var str = "";
            str += t + "var expr = this.parentQuestion.expr;\n";
            str += t + "if(expr.type==='multiple'){\n";
            str += t + "   if(expr.format==='kahoot'){\n";
            str += t + "     html = userinput; \n";
            str += t + "   } else {\n";
            str += t + "      var filtered = s.options.filter(function(e){return e.valid;});\n";
            str += t + "      html = filtered.map(function(e){return e.text;}).join(','); \n";
            str += t + "   }\n";
            str += t + "} else{\n";
            str += t + "     html = userinput; \n";
            str += t + "}\n";
            return str;
        }        
    };   
    
    
     
    module_types["free.fillgaps"] = {
      
         resolveCreation: function(t, q, s, libs){
            
            var str = "";
            if(q.parameters && Object.keys(q.parameters).indexOf('expr')>=0){
                str += t + "var expr = this.parentQuestion.expr;\n";  
            } 
                        
            str += t + "var expr2 = expr.replace(/\\?/g, '\\\\editable{}');\n";
            str += t + "this.parentQuestion.scope.userinput = {latex: expr2};\n";
            str += t + "this.inputdiv=\"\";\n";                                 
             
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {
                
                str += t + "this.formulationHTML = \"<mathquill embedded ng-model='userinput' ng-disabled='done'></mathquill>\";\n";
                str += t + "this.formulationLaTeX = '$'+expr+'$';\n";                
            }            
            
            str += t + "this.answer = this.parentQuestion.solution;\n";
            
            str += t+"var tex = expr;\n";
            str += t + "for(var i in this.answer){\n";
            str += t + "    tex = tex.replace('?', this.answer[i]);\n";
            str += t + "}\n";
            
            
            str += t + "this.answerHTML = \"<katex>\"+tex+\"</katex>\";\n";
            str += t + "this.answerLaTeX = \"$\"+tex+\"$\";\n";
            str += t + "defer.resolve(this);\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = "";
            //str += t + "for(var key in userinput){\n";
            //str += t + "     tmp.push(userinput[key]);\n";
            //str += t + "}\n";
            str += t + "var tmp = jQuery('#'+userinput.id).mathquill('editable-blocks');\n";
            str += t + "check.valid = this.answer.equals(tmp);\n";
            str += t+"defer.resolve(check);\n";
            return str;
        },      
        resolveHTML: function(t, q, s, libs){
            var str = t+" html = this.parentQuestion.expr;\n";
            str += t + "var tmp = jQuery('#'+userinput.id).mathquill('editable-blocks');\n";
            str += t + "for(var i in tmp){\n";
            str += t + "    html = html.replace('?', tmp[i]);\n";
            str += t + "}\n";
            return str;
        }        
    };   
     
    return module_types;
};

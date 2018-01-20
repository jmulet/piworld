module.exports = function(UTIL){
  
    var module_types = {};
  
    module_types["integer.divisors"] = {
      
        resolveCreation: function(t, q, s, libs){
            libs.push("RG1");
            var str = "";
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {
                str += t + "this.formulationHTML = \"Calcula tots els divisors de \"+this.parentQuestion.num;\n";
                str += t + "this.formulationLaTeX = this.formulationHTML;\n";                
            }
            
            str += t + "this.answer = RG1.divisors(this.parentQuestion.num);\n";
            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.parentQuestion.scope.userinput = [{x:'1',check:0}];\n";
            //str += t+"this.inputdiv=\"<input type='text' ng-model='userinput' ng-disabled='done' placeholder='Divisors separats per comes' ng-keypress='$event.which==13 && check()'/>\";\n";
            str += t + "this.inputdiv=\"<im-zeroes-input var='x' ng-model='userinput' ng-disabled='done'></im-zeroes-input>\";\n";
            str += t + "defer.resolve(this);\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = t + "check.valid = RG1.compareLists(this.answer, userinput);\n";
            str += t+"defer.resolve(check);\n";
            return str;
        }       
    };   
    
    
    module_types["integer.gcd"] = {
      
        resolveCreation: function(t, q, s, libs){
            libs.push("RG1");
            var str = "";
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {   str += t + "this.formulationHTML = \"Calcula el Max.c.d (\"+this.parentQuestion.list+\")\";\n";
                str += t + "this.formulationLaTeX = this.formulationHTML;\n";                
            }
            
            str += t + "this.answer = RG1.gcd(this.parentQuestion.list);\n";
            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.parentQuestion.scope.userinput = \"\";\n";
            str += t + "defer.resolve(this);\n";
            return str;
        }     
    };   
    
   
    module_types["integer.lcm"] = {
      
        resolveCreation: function(t, q, s, libs){
            libs.push("RG1");
            var str = "";
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {   str += t + "this.formulationHTML = \"Calcula el Min.c.m (\"+this.parentQuestion.list+\")\";\n";
                str += t + "this.formulationLaTeX = this.formulationHTML;\n";                
            }
            
            str += t + "this.answer = RG1.lcm(this.parentQuestion.list);\n";
            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.parentQuestion.scope.userinput = \"\";\n";
            str += t + "defer.resolve(this);\n";
            return str;
        }      
    };   
            
    
    module_types["integer.primes"] = {
      
        resolveCreation: function(t, q, s, libs){
             
            libs.push("RG1");
            var str= "";
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {
                str += t + "this.formulationHTML = \"Tria tots els nombres primers d'entre \"+this.parentQuestion.list+\"\";\n";
                str += t + "this.formulationLaTeX = this.formulationHTML;\n";
            }
            
            str += t + "this.answer = RG1.filterPrimes(this.parentQuestion.list);\n";
            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.parentQuestion.scope.userinput = [];\n";
            str += t + "var self = this;\n";
            str += t + "this.parentQuestion.list.forEach(function(e){self.parentQuestion.scope.userinput.push({x:e, s:0, check:0})});\n";
            str += t + "this.inputdiv=\"<im-pick-list ng-model='userinput' ng-disabled='done'></im-pick-list>\";\n";
            str += t + "defer.resolve(this);\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = t + "check.valid = RG1.compareLists(this.answer, userinput);\n";
            str += t+"defer.resolve(check);\n";
            return str;
        }         
    };   
    
    module_types["integer.divisibility"] = {
      
        resolveCreation: function(t, q, s, libs){
            libs.push("RG1");
            var str = "";
            if(s.formulation)
            {
                var parsed = UTIL.parseFormulation(s.formulation);
                str += t + "this.formulationHTML = "+parsed+";\n";                
                str += t + "this.formulationLaTeX = RG1.html2latex(this.formulationHTML);\n"; 
            }
            else
            {   str += t + "this.formulationHTML = \"Tria tots els nombres de la llista que siguin divisibles entre \"+this.parentQuestion.num;\n";
                str += t + "this.formulationLaTeX = this.formulationHTML;\n";                
            }
            
            str += t + "var self = this;\n";
            str += t + "this.answer = this.parentQuestion.list.filter(function(v){return v % self.parentQuestion.num==0;});\n";
            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.parentQuestion.scope.userinput = [];\n";
            str += t + "this.parentQuestion.list.forEach(function(e){self.parentQuestion.scope.userinput.push({x:e, s:0, check:0})});\n";
            str += t + "this.inputdiv=\"<im-pick-list ng-model='userinput' ng-disabled='done'></im-pick-list>\";\n";
            str += t + "defer.resolve(this);\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = t + "check.valid = RG1.compareLists(this.answer, userinput);\n";
            str += t+"defer.resolve(check);\n";
            return str;
        }         
    };   
    
    module_types["integer.operations"] = {
      
        resolveCreation: function(t, q, s, libs){
             
            libs.push("RG1");
                        
            var str = t + "var self = this;\n";
            str += t + "if(this.parentQuestion.template){\n";
            str += t + "  var processed = RG1.processTemplate(this.parentQuestion.template, {range: this.parentQuestion.range});\n";
            str += t + "  this.formulationLaTeX = processed.replace(/\\*/g,'·').replace(/\\//, ':');\n";
            str += t + "  this.formulationHTML = this.formulationLaTeX;\n";
            str += t + "  this.answer = eval(processed);\n";
            str += t + "} else {\n";
            str += t + "  this.formulationLaTeX = this.parentQuestion.expr.replace(/\\*/g,'·').replace(/\\//, ':');\n";
            str += t + "  this.formulationHTML = this.formulationLaTeX;\n";
            str += t + "  this.answer = eval(this.parentQuestion.expr);\n";
            str += t + "};\n";


            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.parentQuestion.scope.userinput = '';\n";
            str += t + "defer.resolve(this);\n";
            return str;
        }      
    };   
    
    module_types["fraction.operations"] = {
      
        resolveCreation: function(t, q, s, libs){
            
            libs.push("RG1");
            libs.push("Ratio");
            
            var str = t + "this.formulationLaTeX = client.$filter('mathlex')(this.parentQuestion.expr, 'latex');\n";
            str += t + "this.formulationHTML = \"<katex>\"+this.formulationLaTeX+\"</katex>\";\n";
            str += t + "var self = this;\n";
            str += t + "this.answer = Ratio.parse(eval(this.parentQuestion.expr)).toString();\n";
            str += t + "this.answerHTML = \"\"+this.answer;\n";
            str += t + "this.answerLaTeX = \"\"+this.answer;\n";
            str += t + "this.parentQuestion.scope.userinput = '';\n";
            str += t + "defer.resolve(this);\n";
            return str;
        },
        resolveChecking: function(t, q, s, libs){
            var str = t + "check.valid = eval(userinput -  (this.answer)) < 1e-8;\n";
            str += t+"defer.resolve(check);\n";
            return str;
        }         
    };   
     
    
    return module_types;
};



 
 define(["/activities/libs/math/multiMethodCheck.js", "/activities/libs/math/mathinput/mathquill-input.js"], function(multiMethodCheck){

    var pw = window.pw || {};
    
    var TOLERANCE = 1e-6;
     
 
    var quizzRendererMathquill= function(question, container){
        var that = this;
        this.question = question;
        this.container = container;
        
        this.roots = [""];
        
        this.id = Math.random().toString(36).substr(2);
        
        var template = '<center><div><h3 id="formulation'+this.id+'"></h3>';
        if(question.subformulation){
                   template += '<h3 id="subformulation'+this.id+'"></h3></center>';
        }
        template += '<center><div><span id="mq'+this.id+'" style="width:200px"></div></center>';
        
                
        this.main = $(template);        
         
      
    };
    
    quizzRendererMathquill.prototype =  {
         
        
        render: function(){
            var that = this;
            this.container.empty().append(this.main);
            this.main.find('#formulation'+this.id).html(this.question.formulation);
            this.main.find('#subformulation'+this.id).html(this.question.subformulation);                     
            this.api = that.main.find("#mq"+this.id).pwMathquillInput();
             
            //Check if katex has to be rendered
           window.pw.autoRender(this.main);
        },
        validate: function(){
            var value = this.getValue();
            //Check if this is a valid latex
             try{             
                    var str = katex.renderToString(value, {macros: pw.katexMacros});                      
            } catch(Ex){                
                return 'Invalid expression:: <span style="color:red"><i>'+value+'</i></span>';                
            }
            
            //Guess the format based on the given answer
            if(typeof(this.question.answer)==="string" && !this.question.format){
                this.question.format = "";
                if(this.question.answer.indexOf("sqrt")>=0){
                    this.question.format += "sqrt,";
                } 
                if(this.question.answer.indexOf("^")>=0){
                    this.question.format += "power,";
                }
            }
            
            if(this.question.format){
                if(this.question.format.indexOf("power")>=0){
                    if(value.indexOf("^")<0){
                          return 'Invalid expression:: <span style="color:red"><i>S\'experava una potència.</i></span>';    
                    }
                }
                if(this.question.format.indexOf("sqrt")>=0){
                    if(this.latex.indexOf("\\sqrt")<0){
                          return 'Invalid expression:: <span style="color:red"><i>S\'experava una arrel.</i></span>';    
                    }
                }
            }
            
            if(this.question.forbiddenSymbols){
                if(typeof(this.question.forbiddenSymbols)==="String"){
                    this.question.forbiddenSymbols.split(",");
                }
                var n = this.question.forbiddenSymbols.length;
                for(var i=0; i<n; i++){
                    if(value.indexOf(this.question.forbiddenSymbols[i])>=0){
                          return 'Invalid expression:: <span style="color:red"><i>No és permès l\'ús del símbol '+this.question.forbiddenSymbols[i]+'.</i></span>';                             
                    }
                }
               
            }
            
            if(this.question.validate){
                
                return this.question.validate({userinput: {latex: this.getValue()} });
                
            }
        },
        check: function(){            
            var userInput = this.getValue();        
            var expected = this.question.answer;
            
            //Check if the provider specifies a check method
            if(this.question.check){
                return this.question.check({userinput: {latex: userInput}, answer: expected});                
            }
            
            return multiMethodCheck(userInput, expected, this.question.checkOpts);          
        },
        getValue: function(){            
            return this.api.latex() || "";
        },
        revealAnswer: function(){
            
        },
        getRightAnswer: function(){             
            return '$'+this.question.answer+'$';
        },
        enable: function(enable){
            this.api.enable(enable);               
        },
        destroy: function(){
            this.api.destroy();
            
        }
        
        
    };
    
    
    return quizzRendererMathquill;
 });
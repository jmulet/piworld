 define(["/activities/libs/math/multiMethodCheck.js", "mathinput", "css!/activities/libs/math/mathinput/mathquill/mathquill.css"], function(multiMethodCheck){
  
    var pw = window.pw || {};
 
    var quizzRendererMathinput = function(question, container){
        var that = this;
        this.latex = "";
        this.question = question;
        this.container = container;
        this.id = Math.random().toString(36).substr(2);
        
        var template = '<center><div><h3 id="formulation'+this.id+'"></h3>';
        if(question.subformulation){
                   template += '<h3 id="subformulation'+this.id+'"></h3></center>';
        }
        template += '<center><span id="mathbuttonHolder"></span> <div id="mathkatex" style="display:inline-block"> <span><i> Click to edit </i></span></div></center></div>';
        
        this.main = $(template);        
       
      
    };
    
    quizzRendererMathinput.prototype =  {
        
        render: function(){
            var that = this;
            this.main.find('#formulation'+this.id).html(this.question.formulation);
            this.main.find('#subformulation'+this.id).html(this.question.subformulation);
            
            this.container.empty().append(this.main);
            this.display = this.main.find("#mathkatex");  
            this.buttonHolder = this.main.find("#mathbuttonHolder");  
            
            var callback = function(evt){      
                that.latex = evt.latex || "";
                that.display.empty();
                if(evt.image){
                    that.display.append($(evt.image));
                }
            };
            this.apiBtn = this.buttonHolder.pwMathInput(callback);
            //Check if katex has to be rendered
            window.pw.autoRender(this.main);
        },
        validate: function(){
            
            //Check if this is a valid latex
            try{
                var str = katex.renderToString(this.latex.replace(/·/g,"\\cdot"), {macros: pw.katexMacros});
            } catch(Ex){
                console.log("katex:: unable to render ", this.latex);
                return 'Invalid expression:: <span style="color:red"><i>'+this.latex+'</i></span>';
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
                    if(this.latex.indexOf("^")<0){
                          return 'Invalid expression:: <span style="color:red"><i>S\'esperava una potencia.</i></span>';    
                    }
                }
                if(this.question.format.indexOf("sqrt")>=0){
                    if(this.latex.indexOf("\\sqrt")<0){
                          return 'Invalid expression:: <span style="color:red"><i>S\'esperava una arrel.</i></span>';    
                    }
                }
            }
            
            if(this.question.forbiddenSymbols){
                if(typeof(this.question.forbiddenSymbols)==="String"){
                    this.question.forbiddenSymbols.split(",");
                }
                var n = this.question.forbiddenSymbols.length;
                for(var i=0; i<n; i++){
                    if(this.latex.indexOf(this.question.forbiddenSymbols[i])>=0){
                          return 'Invalid expression:: <span style="color:red"><i>No és permès l\'ús del símbol '+this.question.forbiddenSymbols[i]+'.</i></span>';                             
                    }
                }               
            }
            
            if(this.question.validate){
                return this.question.validate({userinput: {latex: this.latex} });
            }
        },
        check: function(){
            if(this.question.check){
                return this.question.check({userinput: {latex: this.latex}, answer: this.question.answer });
            }
            
            return multiMethodCheck(this.latex, this.question.answer, this.question.checkOpts );             
        },
        getValue: function(){
            return this.latex;
        },
        revealAnswer: function(){
            
        },
        getRightAnswer: function(){           
            return "$"+this.question.answer+"$";
        },
        enable: function(enable){
            this.buttonHolder.find("button").prop("disabled", !enable);
        },
        destroy: function(){
            this.apiBtn.off();
            this.apiBtn.callback = null;
        }
        
        
    };
 
    return quizzRendererMathinput;
 });
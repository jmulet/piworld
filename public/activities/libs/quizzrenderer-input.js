 define([], function(){
  
    var pw = window.pw || {};
    var TOLERANCE = 1e-6;
 
    var quizzRendererInput = function(question, container, checkBtn){
        this.question = question;
        this.container = container;
        this.checkBtn = checkBtn;
        var template = '<center><div><h3>'+question.formulation+'</h3>';
        if(question.subformulation){
                   template += '<h3>'+question.subformulation+'</h3>';
        }
        template += '<center><input style="width:200px;font-size:150%;" type="text"/></center></div>';
        
        this.main = $(template);        
            
    };
    
    quizzRendererInput.prototype =  {
        
        render: function(){
            var that = this;
            this.container.empty().append(this.main);
            this.input = this.main.find("input");   
            this.input.focus();
            this.input.on("keyup", function(evt){
                if(evt.which === 13) {
                    that.checkBtn && that.checkBtn.trigger("click");
                }
            });
            
            //Check if katex has to be rendered
           window.pw.autoRender(this.main);
        },
        validate: function(){
            if(this.question.format==="numeric"){
                var num = this.getValue().replace(/,/g, '.');
                if(isNaN(num)){
                    return "S'esperava una resposta numèrica.";
                }
            }
            if(this.question.validate){
                return this.question.validate({userinput: {text: this.getValue() } });
            }
        },
        check: function(){
            
            var valid;
            if(this.question.format==="numeric") {
                var num = parseFloat(this.input[0].value);
                valid = Math.abs(num - this.question.answer) < TOLERANCE;
            } else {   
                valid = (this.input[0].value === this.question.answer); 
            }
            
            if(this.question.check){
                valid = this.question.check({userinput: {text: this.getValue() } , answer: this.question.answer });
            }
            return valid;
        },
        getValue: function(){
            return this.input[0].value;
        },
        revealAnswer: function(){
            
        },
        getRightAnswer: function(){
            return this.question.answer;
        },
        enable: function(enable){
            this.input.prop("disabled", !enable);
        },
        destroy: function(){
            this.input.off();
        }
        
        
    };
 
    return quizzRendererInput;
 });
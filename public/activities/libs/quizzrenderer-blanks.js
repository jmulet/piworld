 define(["/activities/libs/math/multiMethodCheck.js","/activities/libs/math/mathinput/mathblanks-mathquill.js", "KAS"], function(multiMethodCheck){
  
    var pw = window.pw || {};
    var regex = new RegExp("\\?", "g");
   
    var quizzRendererMathblanks = function(question, container){
        this.question = question;
        this.container = container;
        this.initUI();        
    };
    
    quizzRendererMathblanks.prototype =  {
        
        initUI: function(){
            var that = this;
      
            var template = '<center><div><h3>'+this.question.formulation+'</h3>';
            if(this.question.subformulation){
                       template += '<h3 id="subformulation"></h3></center>';
            } 
            if(this.question.format==="dnd" && this.question.answer.length>1){              
                   template +='<center><div id="dnd_options">';
                   this.answer_copy = $.merge([], this.question.answer).shuffle();
                   $.each(this.answer_copy, function(i, e){
                       template +='<div style="border: 1px solid blue; width:70px; margin:5px; padding:0; font-size:200%; display: inline-block;" id="dnd_option_'+i+'" draggable="true">'+e+'</div>';
                   });
                   template+"</div></center>";
            }

            this.main = $(template);        
            
            if(this.question.format==="dnd"){
                this.main.find('div[draggable="true"]').on("dragstart", function(evt){
                    var num = evt.target.id.split("_")[2];
                    var blank = that.answer_copy[num];
                    evt.originalEvent.dataTransfer.dropEffect = "move";
                    evt.originalEvent.dataTransfer.setData("text/plain", blank);
                    evt.originalEvent.dataTransfer.setData("text/html", evt.target.innerHTML);
                });
            }
        },
        
        render: function(){
            this.container.empty().append(this.main);
            var sf =this.main.find("#subformulation");
            sf.empty();
            
            var opts = {};
            if(this.question.format==="dnd" && this.question.answer.length>1){
                opts.dnd = true;    //Converts the blank activity in drag and drop
            }
            
            this.api = sf.pwMathBlanks(this.question.subformulation, opts);        
            //Check if katex has to be rendered
            window.pw.autoRender(this.main);
            if(this.question.done){
                this.enable(false);
            }
        },
        validate: function(){       
             var blanks = this.api.getBlanks();  
             var m = blanks.length;
            
             if(this.question.forbiddenSymbols){
                if(typeof(this.question.forbiddenSymbols)==="String"){
                    this.question.forbiddenSymbols.split(",");
                }
                var n = this.question.forbiddenSymbols.length;
                for(var i=0; i<n; i++){
                    for(var j=0; j<m; j++){
                        if(blanks[j].indexOf(this.question.forbiddenSymbols[i])>=0){
                              return 'Invalid expression:: <span style="color:red"><i>No és permès l\'ús del símbol '+this.question.forbiddenSymbols[i]+'.</i></span>';                             
                        }
                    }
                }               
            }
            
            if(this.question.validate){
                return this.question.validate({userinput: {blanks: this.api.getBlanks(), latex: this.api.getLatex()} });
            }
        },
        check: function(){
            var that =this;
            var valid = true;
            if($.isArray(this.question.answer)){
                var blanks = this.api.getBlanks();               
                $.each(blanks, function(i,e){
                    valid = valid && multiMethodCheck(e, that.question.answer[i]+"", {});
                });
            } else {
                var expr1 = KAS.parse(pw.fixKAS(this.question.answer)).expr;
                var expr2 = KAS.parse(pw.fixKAS(this.api.getLatex())).expr;
                valid = KAS.compare(expr1, expr2);                
            }
            if(this.question.check){
                   valid = this.question.check({userinput: {blanks: this.api.getBlanks(), latex: this.api.getLatex()}, answer: this.question.answer });
            }
            
            //If allowdnd after a wrong attempt; convert ui to dnd
            if(!valid && this.question.format==="allowdnd"){
                this.question.format = "dnd";
                this.initUI();
                this.render();
            }
            
            return valid;
        },
        getValue: function(){
            return this.api.getLatex();
        },
        revealAnswer: function(){            
        },
        getRightAnswer: function(){
            var that = this;
            if($.isArray(this.question.answer)){
                var i = -1;
                var ra = this.question.subformulation.replace(regex, function (match, contents, offset, s) {
                    i += 1;
                    return that.question.answer[i];
                });
                return ra;
            } else {
                return this.question.answer;
            }
        },
        enable: function(enable){
            this.api.enable(enable);
        },
        destroy: function(){
            this.main.off();
            this.api.destroy();
        }
                
        
    };
 
    return quizzRendererMathblanks;
 });
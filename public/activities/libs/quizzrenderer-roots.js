 define(["KAS", "/activities/libs/math/mathinput/mathquill-input.js"], function(){

    var pw = window.pw || {};
    
    var TOLERANCE = 1e-6;
    
    var containsWithinTolerance = function(array, value){
        var contains = false;
        for(var i=0; i<array.length; i++){
            if(Math.abs(value - array[i]) < TOLERANCE){
                contains = true;
                break;
            }
        }
        return contains; 
    };
 
    var quizzRendererRoots= function(question, container){
        var that = this;
        this.question = question;
        this.container = container;
        
        this.roots = [""];
        
        this.id = Math.random().toString(36).substr(2);
        
        var template = '<center><div><h3 id="formulation'+this.id+'"></h3>';
        if(question.subformulation){
                   template += '<h3 id="subformulation'+this.id+'"></h3></center>';
        }
        template += '<center><div id="rootsHolder'+this.id+'"></div></center>';
        
                
        this.main = $(template);        
        this.rootsHolder = this.main.find("#rootsHolder"+this.id);
        
        this.expectedRoots = new Array(this.question.answer.length);
             $.each(this.question.answer, function(i, ans){
                
                //Use KAS to evaluate this expression (which may contain latex, e.g. \sqrt{3}/2.
                try{
                     var expr = KAS.parse(pw.fixKAS(ans+"")).expr;
                     that.expectedRoots[i] = expr.eval({});
                } catch(Ex){
                     console.log(Ex, ans); 
                     that.expectedRoots[i] = ans;
                }
                
            });
    };
    
    quizzRendererRoots.prototype =  {
        
        renderRoots: function(){
                var that = this;
                this.rootsHolder.find("button").off();
                this.rootsHolder.find("span").off();
                if(this.mqareas){
                    $.each(this.mqareas, function(i, mq){
                        mq.destroy();
                    });
                }
                this.rootsHolder.empty();
                var tmp = '<ul class="list list-unstyled">';
                var n = this.roots.length;
                $.each(this.roots, function(i, r){
                    tmp += '<li>x<sub>'+(i+1)+'</sub>=<span style="width:200px" id="input-'+i+'"></span> <button class="btn btn-xs btn-danger glyphicon glyphicon-remove" id="btnremove-'+i+'"></button>';
                    if(i === n-1){
                         tmp += '<button class="btn btn-xs btn-success glyphicon glyphicon-plus" id="btnplus"></button>';
                    } else {
                        tmp += '<span style="width: 24px;display:inline-block;"> </span>';
                    }       
                    tmp += '</li>';
                });
                if(n===0){
                    tmp += '<li> No solutions <button class="btn btn-sm btn-success glyphicon glyphicon-plus" id="btnplus"></button></li>';
                }
                tmp += "</ul>";
            
                this.rootsHolder.append(tmp);
                
                this.mqareas = [];
                
                $.each(this.roots, function(i, r){
                    var api;
                    var listener = function(){
                          that.roots[i] = api.latex();  
                    };
                    api = that.rootsHolder.find("#input-"+i).pwMathquillInput({onChanges: listener});
                    api.latex(that.roots[i]);
                    that.mqareas.push(api);
                });
            
//                var inputs = this.rootsHolder.find("input");
//                $.each(inputs, function(i, inp){
//                    inp.value = that.roots[i];
//                });
 
                this.rootsHolder.find(".btn-success").on("click", function(){
                    that.roots.push("");
                    that.renderRoots();
                });
                
                this.rootsHolder.find(".btn-danger").on("click", function(){
                    var id = this.id.split("-")[1];
                    that.roots.splice(id,1);
                    that.renderRoots();
                });
                
//                inputs.on("keyup", function(){
//                    console.log(this);
//                    var id = this.id.split("-")[1];
//                    console.log(id);
//                    that.roots[id] = this.value;    
//                    console.log("updateing roots", that.roots);
//                });
           
        },
        
        render: function(){
            this.container.empty().append(this.main);
            this.main.find('#formulation'+this.id).html(this.question.formulation);
            this.main.find('#subformulation'+this.id).html(this.question.subformulation);
            this.renderRoots();
             
            //Check if katex has to be rendered
            window.pw.autoRender(this.main);
        },
        validate: function(){
            //Check if this is a valid latex
            var root;
            try{
                for(var i=0; i<this.roots.length; i++){
                    root = this.roots[i];
                    var str = katex.renderToString(root, {macros: pw.katexMacros});
                }
            } catch(Ex){
                return 'Invalid expression:: <span style="color:red"><i>'+root+'</i></span>';
            }
            
            if(this.question.validate){
                return this.question.validate({userinput: {roots: this.roots} });
            }
            
        },
        check: function(){
            var that = this;
            var valid = true;
             
            $.each(this.roots, function(i, r){
                var userInput;
                //Use KAS to evaluate this expression (which may contain latex, e.g. \sqrt{3}/2.
                try{
                    var expr = KAS.parse(pw.fixKAS(r)).expr;
                    userInput = expr.eval({});
                } catch(Ex){
                    console.log(Ex, r);
                    userInput = r;
                }
                
                valid = valid && containsWithinTolerance(that.expectedRoots, userInput);
            });
            
            valid = valid && (this.expectedRoots.length === this.roots.length);
                     
            return valid;
        },
        getValue: function(){
            var text = "";
            $.each(this.roots, function(i, r){
                text += "x<sub>"+(i+1)+"="+ r +"; ";
            });
            return text;
        },
        revealAnswer: function(){
            var that =this;
            $.each(this.rootsHolder.find("input"), function(i, input){
                
                console.log(input, input.value);
                //Use KAS to evaluate this expression (which may contain latex, e.g. \sqrt{3}/2.
                var userInput;
                try{
                    var expr  = KAS.parse(input.value).expr;
                    userInput = expr.eval({});
                } catch(Ex){
                    userInput = input.value;
                }
                
                if(containsWithinTolerance(that.expectedRoots, userInput)){
                    input.style.background = "#b9f3b9";
                } else {
                    input.style.background = "#f3b9b9";
                }
            });
        },
        getRightAnswer: function(){
            var ra = [];
            $.each(this.question.answer, function(i, ans){                
               ra.push("$x_{"+(i+1)+"}="+ans+"$");               
            });
            if(this.question.answer.length===0){
                ra.push("No solution");
            }
            return ra.join("; ");
        },
        enable: function(enable){
            this.rootsHolder.find("button").prop("disabled", !enable);
            //this.rootsHolder.find("input").prop("disabled", !enable);
            if(this.mqareas){
                $.each( this.mqareas, function(i, mq){
                    mq.enable(enable);
                });
            }
        },
        destroy: function(){
            this.rootsHolder.find("button").off();
            //this.rootsHolder.find("input").off();
            if(this.mqareas){
                $.each( this.mqareas, function(i, mq){
                    mq.destroy();
                });
            }
        }
        
        
    };
    
    
    return quizzRendererRoots;
 });
 define([], function(){
  
    var pw = window.pw || {};
 

    var darkColors = [
        "#0000A0", "#800080", "#800000", "#008000", "#B17503"
    ];
    
    var getColor = function(i){
        return darkColors[i % darkColors.length];
    };
    
    var quizzRendererKahoot = function(question, container, checkBtn){
        var that = this;
        this.question = question;
        this.container = container;
        this.checkBtn = checkBtn;
        var template = '<center><div><h3>'+question.formulation+'</h3>';
        if(question.subformulation){
                   template += '<h3>'+question.subformulation+'</h3></center>';
        }
       
        var html = '<div class="simple-quizz-optscontainer"><center>';
        var width;
        if(question.options.length % 2 === 0 ){
            width = "50%";
        } else {
            width = "33%";   
        }
        this.numValid = 0;
        $.each(question.options, function(i, o){
            that.numValid += o.valid? 1: 0;
            html += '<div class="panel panel-default simple-quizz-optionbtn"  dataoption="'+i+
                    '" style="background:'+getColor(i)+'; width:'+width+';"><div class="simple-quizz-optiontext">'+o.text+"</div></div></td>";
        });
        html +='</center></div><center><div id="instructions" style="font-size:200%; color: blue; text-align:center;"></div></center>';
        template +=  html;
        this.main = $(template);        

    };
    
    quizzRendererKahoot.prototype =  {
        
        render: function(){
            
           
            this.container.empty().append(this.main);
            this.optionWidgets = this.main.find(".panel");
            this.instructions = this.main.find("#instructions");
            
            this.enable(true);
           
            
            //Check if katex has to be rendered
            window.pw.autoRender(this.main);
        },
        validate: function(){
            if(this.question.validate){
                return this.question.validate({userinput: {selected: this.api.getValues(), text: this.getValue()} });
            }
        },
        check: function(){
            var that = this;
            var valid = true;
            this.optionWidgets.css({cursor: "default"});
            $.each(this.question.options, function (i, o) {
                valid = valid && ((o.selected && o.valid) ||  (!o.selected && !o.valid));                
            });
                            
            
            if(this.numValid===1){
                setTimeout(function(){
                     that.optionWidgets.removeClass("simple-quizz-optionselected");
                     that.optionWidgets.css({cursor: "pointer"});
                     $.each(that.question.options, function (i, o) {
                        o.selected = false;                
                    });
                }, 1000);
            }
            
              
            if(this.question.check){
                valid = this.question.check({userinput: {selected: this.api.getValues(), text: this.getValue()} , options: this.question.options });
            }
            
            return valid; 
        },
        getValues: function(){
            var selected = [];
            $.each(this.question.options, function (i, o) {
                if (o.selected) {
                    selected.push(o.text);
                }
            });
            return selected;                
        },
        getValue: function(){
            return this.getValues().join("<br>");                
        },
        revealAnswer: function(){
            this.enable(false);
            var that = this;
            $.each(this.question.options, function (i, e) {
                if (!e.valid) {
                    that.main.find('[dataoption="' + i + '"]').css({"background-color": "lightgray"});
                }
            });
            
        },
        getRightAnswer: function(){           
            var ra = [];
            $.each(this.question.options, function(i, o){                
               if(o.valid) {
                   ra.push(o.text);
               }
            });
            return ra.join("<br>");
        },
        enable: function(enable){
            
            var that = this;
            
            var doSelectMany = function(evt){
                  var attrs = evt.target.attributes;
                    if(!attrs.dataoption || !attrs.dataoption.nodeValue){
                        console.log("Somehing went wrong? no dataoption? ", evt);
                        return;
                   }
                    var indexSelected = attrs.dataoption.nodeValue;
                    var elm = that.container.find('[dataoption="' + indexSelected + '"]');
                    elm.toggleClass("simple-quizz-optionselected");
                    that.question.options[indexSelected].selected = elm.hasClass("simple-quizz-optionselected");
            };
            
            if(enable){
                 this.optionWidgets.css({cursor: "pointer"});
                 if(this.numValid===1){
                    this.instructions.html('Tria una opció');
                    this.optionWidgets.on("click", function(evt){
                        //Automatic submit
                        doSelectMany(evt);
                        that.checkBtn.trigger("click");
                    });

                    } else {
                            this.instructions.html('Tria cap, una, o més opcions');
                            this.optionWidgets.on("click", doSelectMany);                    
                   }
            } else {
                 this.instructions.html("");
                 this.optionWidgets.off();
                 this.optionWidgets.css({cursor: "default"});
            }
        },
        destroy: function(){
            this.optionWidgets.off();
        }
        
        
    };
 
    return quizzRendererKahoot;
 });
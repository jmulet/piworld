 define([], function(){

    var pw = window.pw || {};
 
    var quizzRendererCheckbox = function(question, container){
        this.question = question;
        this.container = container;
        var template = '<center><div><h3>'+question.formulation+'</h3>';
        if(question.subformulation){
                   template += '<h3>'+question.subformulation+'</h3>';
        } 
        
        //Check how many questions are valid?
        var numValid = 0;
        $.each(question.options, function(i, o){
           if(o.valid){
               numValid += 1;
           } 
        });
        
        this.id = Math.floor((Math.random()*1e6));
        var that = this;
        $.each(question.options, function(i, o){
            
            template += '<input type="checkbox" id="checkbox'+that.id+'_'+i+'"';
            if(numValid===1){
                template+= ' name="quizzcheckbox_'+that.id+'" ';
            }
            template += ' value="'+i+'"/> <span>'+o.text+'</span><br>';
            
        });
        template += '</div></center>';
        
        this.main = $(template);        
          
    };
    
    quizzRendererCheckbox.prototype =  {
        
        render: function(){
            this.container.empty().append(this.main);
            this.inputs = this.main.find("input");      
            //Check if katex has to be rendered
           window.pw.autoRender(this.main);
        },
        validate: function(){
            if(this.question.validate){
                return this.question.validate({userinput: {selected: this.getValues(), text: this.getValue()} });
            }
        },
        check: function(){
            var valid = true;
            var that = this;
            $.each(this.question.options, function(i, o){  
                var selected = that.main.find('#checkbox'+that.id+'_'+i).prop("checked");
                valid = valid && ((selected && o.valid) || (!selected && !o.valid));                
            });
            
            if(this.question.check){
                valid = this.question.check({userinput: {selected: this.getValues(), text: this.getValue()} , options: this.question.options });
            }
            
            return valid;
        },
        getValues: function(){
            var that = this;
            var selected = this.main.find('input:checked');
            var list = [];
            $.each(selected, function(i, e){
               var index = parseInt(e.value);
               list.push(that.question.options[index]);;  
            });
            return list;
        },
        getValue: function(){            
            return this.getValues().join("<br>");
        },
        revealAnswer: function(){
            var that = this;
            $.each(this.question.options, function(i, o){                
               if(o.valid) {
                   $("#checkbox"+that.id+"_"+i).css({background: "green"});
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
            this.inputs.prop("disabled", !enable);
        },
        destroy: function(){
            
        }
        
    };
    
    return quizzRendererCheckbox;
 });
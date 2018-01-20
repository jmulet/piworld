define(['/activities/libs/math/mathinput/mathquill-numericpad.js','mathquill','css!/activities/libs/math/mathinput/mathquill/mathquill.css','css!/activities/libs/math/mathinput/mathquill-editor.css'], function(NumPad){

 	 
	var MQ = MathQuill.getInterface(MathQuill.getInterface.MAX);
	var config = {
                  spaceBehavesLikeTab: true,
                  charsThatBreakOutOfSupSub: '=<>',
                  autoCommands: 'pi theta sqrt sum int oo',
                  autoFunctionize: 'sin cos tan sec csc cot log ln',
                  //addCommands: {'oo':['VanillaSymbol','\\infty ','&infin;']},
                  keyboardPassthrough: true,
                  restrictMismatchedBrackets: true
        };

  var link = function(elm, opts){
        var enabled = true;    
        var options = $.extend({}, opts);
            
        var id = Math.random().toString(36).substring(2);
	elm.addClass("mathquill-editable");		
        elm.prop("id", id);
  
        var myconfig;
        if(options.onChanges){
             myconfig = $.extend(config, {handlers:{edit:  options.onChanges}});
        } else {
             myconfig = config;
        }
        
        
        
	var hasTouch = 'ontouchstart' in document.documentElement;
        
        var style;
        if(hasTouch){
            style = 'position:fixed;left:0; width:100%; bottom:0; height:45%; z-index:1000; background:white;display:none;';
        }
        else {
            style = 'position:relative;left:0; width:500px; bottom:0; height:200px; z-index:1000; background:white;display:none;';
        }
        
        var keyboardTmpl = '<div id="mq-keyboard'+id+'" class="mathquill-keyboard-panel" style="'+style+'"></div>';
        var keyboard = $(keyboardTmpl);
      
        var numpad = new NumPad();
        keyboard.append(numpad.elem);
        
        if(hasTouch){        
            $("body").append(keyboard);
        } else {
            elm.parent().append(keyboard);
        }
        
      
        var mqarea = MQ.MathField(elm[0], myconfig);
          
        numpad.bindMQ(mqarea);
       
        var inputs = elm.find('input,textarea');
 
        if(hasTouch){
            inputs.attr('autocapitalize', 'off');
            inputs.attr('readonly', 'true');
        }
        
        var autoClose;
        keyboard.on("click", function(){
           inputs.focus(); 
        });
        
        inputs.on("focus", function(){
            //Hides all other panels
            if(enabled){
                $(".mathquill-keyboard-panel").hide();
                keyboard.show();
                if(autoClose){
                    window.clearTimeout(autoClose);
                }
            }
        });
        inputs.on("blur", function(){
            //Hides all other panels
            autoClose = window.setTimeout(function(){
                    keyboard.hide();
            }, 500);
        });	 
         
         
        var api = {
                latex: function (latex) {
                    if (typeof (latex) === 'string') {
                        mqarea.latex(latex);
                    } else {
                        return mqarea.latex();
                    }
                },
                clear: function () {
                    mqarea.latex("");
                },
                focus: function () {
                    mqarea.focus();
                },
                destroy: function() {
                    mqarea.revert();
                    autoClose && window.clearTimeout(autoClose);
                    numpad.destroy();
                    $("#mq-keyboard"+id).remove();
                },
                enable: function(enable){
                    enabled = enable;
                    elm.find('input,textarea').prop("disabled", !enable);
                    $(".mathquill-keyboard-panel").hide();                   
                }
            };
            
            return api;
        };


 	$.fn.pwMathquillInput = function(opts){
            return link(this, opts);
 	};

});
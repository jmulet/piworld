define(["/activities/libs/math/mathinput/mathquill-numericpad.js", "mathquill"], function(NumPad){
  
var regexInline = new RegExp("\\${1,2}([\\s\\S]*?)\\${1,2}", "g");      
var regexDisplay = new RegExp("\\\\\\[([\\s\\S]*?)\\\\\\]", "g");
var MQ = MathQuill.getInterface(2);
var hasTouch = 'ontouchstart' in document.documentElement;
var style;
if (hasTouch) {
    style = 'position:fixed;left:0; width:100%; bottom:0; height:45%; z-index:1000; background:white;display:none;';
}
else {
    style = 'position:relative;left:0; width:500px; bottom:0; height:200px; z-index:1000; background:white;display:none;';
}

    (function(window, jQuery){
        var regex = new RegExp("\\?", "g");
        
        //Important: latexSentence must never be precompiled!!!
        
               

        
 	var link = function(elem, latexSentence, opts){
 		var isEnabled;
                
                //Bind every innerField of every mathquill to a numericpad... since it does not work on mobile
                var createNumPad = function(root, mqInnerEl, mqInner){                      

                    var id = pw.guid();
                    var keyboardTmpl = '<div id="mq-keyboard'+id+'" class="mathquill-keyboard-panel" style="'+style+'"></div>';
                    var keyboard = $(keyboardTmpl);

                    var numpad = new NumPad(id);
                    numpad.elem.find(".basic-pad").css("display", "none");      //Remove advanced inputs
                    keyboard.append(numpad.elem);
                    numpad.bindMQ(mqInner);

                    if(hasTouch){        
                        $("body").append(keyboard);
                    } else {
                        root.parent().append(keyboard);
                    }

                    var autoClose;
                    keyboard.on("click", function () {
                        mqInnerEl.focus();
                    });

                    mqInnerEl.on("focus", function () {
                        //Hides all other panels
                        if (isEnabled) {
                            $(".mathquill-keyboard-panel").hide();
                            keyboard.show();
                            if (autoClose) {
                                window.clearTimeout(autoClose);
                            }
                        }
                    });
                    mqInnerEl.on("blur", function () {
                        //Hides all other panels
                        autoClose = window.setTimeout(function () {
                            keyboard.hide();
                        }, 500);
                    });	 
                    
                    return numpad;
                };
                
                var options = $.extend({
                    inputwidth: 80
                }, opts);
                
                if(latexSentence.indexOf('<span class="katex">')>=0){
                    console.log("Mathblanks: Error, latexSentence must never be pre parsed by katex.");
                }
                
                var htmlElem, inputs;
                                 
                //latexSentence may contain one or several equations; enclosed into $ $; $$ $$; or \[ \] for different display modes.   
                //Converts latex $...$ into <span id="mq-id"> .... </span> and returns
                //Replaces ? by \\MathQuillMathField{}
                //Returns an object d.html and d.ids. After appending to body; must call  fillInTheBlank = MQ.StaticMath(document.getElementById('mq-id'));
        
                var inputs = [];
        
                var latex2html = latexSentence.replace(regexInline, function (match, contents, offset, s) {
                    contents = contents || match;
                    var static = contents.indexOf("?")<0;
                    contents = contents.replace(regex, "\\MathQuillMathField{}");
                    var id = pw.guid();             
                    inputs.push({static: static, id: id});
                    return ' <span id="mq-'+id+'">'+contents+'<span> ';
                });
            
                
//                var latex2html = d.replace(regex, function (match, contents, offset, s) {
//                    if(options.dnd){
//                        return '<div class="dropzone" style="width:' + options.inputwidth + 'px; background:none; z-index:1000; text-align: center;  display: inline-block; height:30px; border: 1px solid blue; margin:0;padding:0;vertical-align: baseline;font-size:150%;"></div>';
//                    } else {
//                        return '<input style="width:' + options.inputwidth + 'px; z-index:1000;background:none; z-index:1000; text-align: center; border: 1px solid blue; margin:0;padding:0;vertical-align: baseline;font-size:100%; " type="text"/>';
//                    }
//                });                
                htmlElem = $(latex2html);
                htmlElem.css("display", "none");
                elem.append(htmlElem);
                
                //Once rendered mathquillify things
                $.each(inputs, function(i, input){
                    var el = $('#mq-'+input.id);
                    var mq = MQ.StaticMath(el[0]);
          
                    
                    var areas = el.find('input,textarea');                                       
                    if(hasTouch){
                            areas.attr('autocapitalize', 'off');
                            areas.attr('readonly', 'true');
                    }

                    input.numpads = [];
                    $.each(areas, function(k, area){
                            //Now, every area is a mq.innerFields                           
                            var area2 = $(area);                            
                            var numpad = createNumPad(elem, area2, mq.innerFields[k]);                                                      
                            input.numpads.push(numpad);
                    });

                    input.mathquill = mq;
                    input.htmlElems = el.find(".mq-editable-field");
                    
                    options.dnd && input.htmlElems.addClass("dropzone");
                });
                 
          
                 
                var api = {
                    getLatex: function(){
                        var blanks = api.getBlanks();
                        var processed = latexSentence;
                        var i = -1;
                        processed = processed.replace(regex, function (match, contents, offset, s) {                     
                            i += 1;
                            return blanks[i];                                                    
                        });  
                        return processed;
                    },
                    getBlanks: function(){
                        var blanks = [];
                        $.each(inputs, function(i, inp){  
                             if(!inp.static){
                                 var nblanks = inp.mathquill.innerFields.length;
                                 for(var j=0; j < nblanks; j++){
                                     blanks.push(inp.mathquill.innerFields[j].latex());
                                 }
                             }
                        });  
                        return blanks;
                    },
                    setDnd: function(dnd){
                        options.dnd = dnd;

                       $.each(inputs, function(i, input){
                             options.dnd && input.htmlElems.addClass("dropzone");
                             !options.dnd && input.htmlElems.removeClass("dropzone");
                       });
                       
                       this.enable(isEnabled);
                         
                    },
                    enable: function(enable){
                      isEnabled = enable;
                      if(!options.dnd){
                          htmlElem.find('input,textarea').prop("disabled", !enable);
                      } else {
                          
                          if(enable){
                              
                              $.each(inputs, function(i, inp){
                                  $.each(inp.htmlElems, function(j, el){
                                        var mq = inp.mathquill.innerFields[j];                                        
                                        var el2 = $(el);
                                        el2.on("drop", function(evt){                                             
                                            evt.preventDefault();
                                            // Get the id of the target and add the moved element to the target's DOM
                                            var data = evt.originalEvent.dataTransfer.getData("text");                    
                                            mq.latex(data);
                                        });
                                        el2.on("dragover", function(evt){
                                            evt.preventDefault();
                                            evt.originalEvent.dataTransfer.dropEffect = "move";
                                        });                                        
                                  });
                              });
                               
                          } else {
                              $.each(inputs, function(i, inp){
                                  inp.htmlElems.off();
                              });
                          }
                      }
                    },
                    destroy: function(){
                        $.each(inputs, function(i, inp){  
                              inp.mathquill.revert();
                              $.each(inp.numpads, function(k, np){
                                  np.destroy();
                                  $('#mq-keyboard'+np.id).remove();
                                  
                              });
                              
                        }); 
                    }
                };
             
                api.enable(true);
                htmlElem.css("display", "");
                
 		return api;
 	};


 	$.fn.pwMathBlanks = function(latexSentence, opts){
 		return link(this, latexSentence, opts);
 	};

 }(this, jQuery));
 

});
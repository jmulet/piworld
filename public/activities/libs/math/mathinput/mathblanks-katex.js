define(["katex"], function(){
 

(function(window, jQuery){
        var regex = new RegExp("\\?", "g");
        
        //Important: latexSentence must never be precompiled!!!
        
 	var link = function(elem, latexSentence, opts){
 		
                var options = $.extend({
                    inputwidth: 80
                }, opts);
                
                if(latexSentence.indexOf('<span class="katex">')>=0){
                    console.log("Mathblanks: Error, latexSentence must never be pre parsed by katex.");
                }
                
                var htmlElem, inputs;
                //We first get an html representation of latex string                   
                //Second we substitute every blank {{?}} by an input text
                                
                //latexSentence may contain one or several equations; enclosed into $ $; $$ $$; or \[ \] for different display modes.   
                var d = pw.katexParser(latexSentence);
                
                var latex2html = d.replace(regex, function (match, contents, offset, s) {
                    if(options.dnd){
                        return '<div class="dropzone" style="width:' + options.inputwidth + 'px; background:none; z-index:1000; text-align: center;  display: inline-block; height:30px; border: 1px solid blue; margin:0;padding:0;vertical-align: baseline;font-size:150%;"></div>';
                    } else {
                        return '<input style="width:' + options.inputwidth + 'px; z-index:1000;background:none; z-index:1000; text-align: center; border: 1px solid blue; margin:0;padding:0;vertical-align: baseline;font-size:100%; " type="text"/>';
                    }
                });
                
                htmlElem = $(latex2html);
                elem.append(htmlElem);
                elem.find("span .katex-mathml").remove();
                
         
                if(options.dnd){
                    inputs = htmlElem.find(".dropzone");
                } else {
                    inputs = htmlElem.find("input");
                }
               
                 
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
                        $.each(inputs, function(i, o){  
                            
                             if(options.dnd){
                                blanks.push( o.innerHTML );
                             } else {
                                blanks.push( o.value );
                             }
                        }); 
                        return blanks;
                    },
                    enable: function(enable){
                      if(!options.dnd){
                          inputs.prop("disabled", !enable);
                      } else {
                          if(enable){ 
                               inputs.on("drop", function(evt){
                                    console.log("on drop ", evt);
                                    evt.preventDefault();
                                    // Get the id of the target and add the moved element to the target's DOM
                                    var data = evt.originalEvent.dataTransfer.getData("text");                    
                                    $(evt.target).html(data);
                                });
                               inputs.on("dragover", function(evt){
                                    evt.preventDefault();
                                    evt.originalEvent.dataTransfer.dropEffect = "move";
                                    console.log("on dragover", evt);
                                });
                          } else {
                              inputs.off();
                          }
                      }
                    },
                    destroy: function(){
                        inputs.off();
                    }
                };
             
                api.enable(true);
                 
 		return api;
 	};


 	$.fn.pwMathBlanks = function(latexSentence, opts){
 		return link(this, latexSentence, opts);
 	};

 }(this, jQuery));
 

});
(function(pw){    
    
      
    pw.KATEXAUTO_OPTIONS = {
              delimiters: [
                  {left: "$$", right: "$$", display: true},
                  {left: "\\[", right: "\\]", display: true},
                  {left: "$", right: "$", display: false},
                  {left: "\\(", right: "\\)", display: false}
              ]
          };
          
    
    //// AUTO-RENDERER JSXGRAPH
    /*
     * <div class="jxgbox-container" data-boxrange="[4]" data-options="{}">
     *      var expr = KAS.parse("x^2+\\sqrt[3]{x}").expr;
     *      board.create('functiongraph', [function(x){return expr.eval({'x':x});}]);
     * </div>
     * boxrange: [4]            sets xrange -4, 4     yrange -4, 4
     * boxrange: [-1, 3]        sets xrange -1, 3     yrange -1, 3
     * boxrange: [-1, 3, 5]     sets xrange -1, 3     yrange -5, 5
     * boxrange: [-1, 3, 2, 5]  sets xrange -1, 3     yrange 2, 5
     */
    
    pw.JSXGraph_OPTS = {boundingbox: [-10, 10, 10, -10], axis:true, showCopyright: false, showNavigation: true, zoom: true, pan: true};
   
    pw.autoRenderJSXGraph = function(elem){  
        
        var jsxElems = elem.find(".jxgbox-container");
        if(!jsxElems.length){
            return;
        }

        require(['jsxgraph', 'KAS'], function(){
            //Now JSXGraph is available;
            
             $.each(jsxElems, function(i, e){
                 
                 var e2 = $(e);
                 if(e2.find(".jxgbox").length===0){
                 var jsCode = e.innerHTML || "";   
                 e2.empty().removeClass("pw-cloak").css("display", "");
                 
                 //Add a div in the container;
                 var id = 'jxgbox-' + Math.random().toString(36).substring(2);                                      
                 e2.append('<div id="'+id+'" class="jxgbox" style="width:100%;height:100%;"></div>');
                 
                 var useropts = {};
                 if(e.dataset.options){
                     try{ 
                         useropts = eval(e.dataset.options);
                     } catch(Ex){console.log(Ex);}
                 }
                 
                 var options = $.extend(useropts, pw.JSXGraph_OPTS);
                 
                 if(e.dataset.boxrange){
                     try {
                         var boxrange = eval(e.dataset.boxrange);
                         if($.isArray(boxrange)){
                            var bb;
                            switch(boxrange.length){
                            case 1:
                                var a = boxrange[0];
                                bb = [-a, a, a, -a];
                                break;
                            case 2:
                                var a = boxrange[0];
                                var b = boxrange[1];
                                bb = [-a, b, a, -b];
                            case 3:
                                var a = boxrange[0];
                                var b = boxrange[1];
                                var c = boxrange[2];
                                bb = [a, c, b, -c];
                            case 4:
                                bb = [boxrange[0], boxrange[3], boxrange[1], boxrange[2]];
                            }
                            bb && (options.boundingbox = bb);
                          }
                     } catch(Ex){console.log(Ex);}
                 }
                 
                 console.log("init board ",id, options );
                 var brd = JXG.JSXGraph.initBoard(id, options);                          
                 e.board = brd;
                 
                 //Now excute the code in a script in this context
                 var context = {board: brd, KAS: KAS};
                 var script = new pw.Script(context);
                 
                 console.log("Run code", jsCode);
                 script.runInContext(jsCode);
                 script.destroy();
            

                var resize = function () {
                    brd.resizeContainer(brd.containerObj.clientWidth, brd.containerObj.clientHeight, true);
                    brd.setBoundingBox(options.boundingbox);
                    brd.fullUpdate();
                };

                e2.on("resize", resize);
                }
             });
             
        });
    };    
    
    //// AUTO-RENDER ALL STUFF IN ELEMENT

    pw.autoRender = function(elem){
        pw.autoRenderJSXGraph(elem);
        window.renderMathInElement && window.renderMathInElement(elem[0], pw.KATEXAUTO_OPTIONS);
    };

    
})(window.pw);   
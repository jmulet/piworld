
define(['jquery-draggable'], function(){
     
     //ModalTemplate goes to body
     //button goes to elm 
     var modalTemplate = '<div id="mathInput-modal" class="modal fade" role="dialog" style="height:600px!important">' +
         '<div class="modal-dialog" >' +
         ' <div class="modal-content">' +
         ' <div class="modal-header"  style="height:30px!important;background: lavender;padding:5px!important; cursor:move;">' +
         '  <button type="button" class="close" data-dismiss="modal">&times;</button>' +
         '   <h4 class="modal-title"><img src="/assets/img/sigma-50.png" style="height:22px"/> Editor matemàtic</h4>' +
         '  </div>' +
         ' <div class="modal-body"  style="overflow: hidden; padding:0px!important;">' +

         '          <div class="panel panel-default">' +
         '           <ul class="nav nav-tabs">' +
         '               <li class="active">' +
         '                   <a  href="#mathInput-tab1" data-toggle="tab">Escriu</a>' +
         '                </li>' +
         '                 <li>' +
         '                      <a href="#mathInput-tab2" data-toggle="tab">Construeix</a>' +
         '                 </li>' +
         '                 <li>' +
         '                      <a href="#mathInput-tab3" data-toggle="tab">LaTeX</a>' +
         '                  </li>' +
         '              </ul>' +
         '           <div class="tab-content ">' +
         '               <div class="tab-pane active" id="mathInput-tab1"></div>' +
         '               <div class="tab-pane" id="mathInput-tab2"></div>' +
         '               <div class="tab-pane" id="mathInput-tab3">' +
         '                   <textarea style="position:relative; overflow: auto; height: 350px;font-size:200%;width:100%" rows="100"></textarea>' +
         '              </div>' +
         '           </div> ' +      
         '         </div>' +
         '  </div>' +
         '  <div class="modal-footer" style="padding:0px">' +
         '    <button type="button" class="btn btn-danger pull-left" data-dismiss="modal">Cancel·la</button>' +
         '    <button type="button" class="btn btn-success" id="mathInput-okButton">Accepta</button>' +
         '  </div>' +
         ' </div>' +
         ' </div>';

       
     
    var link = function(){
       
       var onAcceptListener;
       var lastTab = 2;

       var modalDialog = $(modalTemplate); 
       $("body").append(modalDialog);
       modalDialog.find(".modal-header").draggable();

       var id="mathInput";
       var tab1 = $("#"+id+"-tab1");
       var tab2 = $("#"+id+"-tab2");
       var tab3 = $("#"+id+"-tab3");


       var mathpainterAPI = tab1.pwMathPaint({width:1000, height: 800, backgroundColor: '#ffd', undo:true});
     
        var mqEdt = tab2.pwMathquillEditor(); 
        console.log(mqEdt);

       
        var textArea = $("#"+id+"-tab3 textarea");

        /**
        textArea. on("keyup", function(evt){
              console.log("modified textarea", textArea.val());
        });
        **/


        mathpainterAPI.onChanges(function(evt){
            textArea.val(evt.latex);
            mqEdt.latex(evt.latex);
        });



        modalDialog.find("a[href='#mathInput-tab1']").on('shown.bs.tab', function(e) {
             var ltx;
             if(lastTab===2){
                 ltx = mqEdt.latex();
                 textArea.val(ltx);
             } else if(lastTab===3){
                 ltx = textArea.val();
                 mqEdt.latex(ltx);
             }

             $.post("/rest/misc/latex2", {type: 'svg', html: ltx, alone: true}).then(function(svg){
                    if(svg.length){
                        mathpainterAPI.canvasAPI.setImage("data:image/svg+xml;base64,"+svg[0]);
                    }
             });

             lastTab = 1;
        });
        modalDialog.find("a[href='#mathInput-tab2']").on('shown.bs.tab', function(e) {
             mqEdt.focus();
             if(lastTab===3){
                var ltx = textArea.val();
                mqEdt.latex(ltx);
                
             }
             lastTab = 2;
        });
        modalDialog.find("a[href='#mathInput-tab3']").on('shown.bs.tab', function(e) {
             textArea.focus();
             if(lastTab===2){
                 var ltx = mqEdt.latex();
                 textArea.val(ltx);
             }
             lastTab = 3;
        });

        modalDialog.find('#mathInput-okButton').click(function(event) {
              var ltx = api.getLatex();
              
              if(!ltx){
                  console.log("Invalid latex expression");
                  alert("Comprova l'expressió matemàtica!");
                  return;
              }

              //In event return latex, svg, image
              $.post("/rest/misc/latex2", {type: 'svg', html: ltx, alone: true}).then(function(svg){
                    var evt ={
                            latex: ltx                            
                    };

                    if(svg.length){
                        evt.svg = "data:image/svg+xml;base64,"+svg[0];
                        evt.image = '<img style="height:30px" latex="'+ltx+'" src="data:image/svg+xml;base64,'+svg[0]+'"/>';
                    }
                    
                    onAcceptListener && onAcceptListener(evt);

             });

             
              modalDialog.modal('hide');
             
        });


        modalDialog.on('hidden.bs.modal', function () {
             mathpainterAPI.stopIdle();
        });

        modalDialog.on('shown.bs.modal', function () {
             $('.nav-tabs a[href="#mathInput-tab2"]').tab('show');
        });

        var api = {
            setLatex: function(latex){
                mqEdt.latex(latex);
                textArea.val(latex);                  
            },
            getLatex: function(){
                 var ltx;
                  if(lastTab===1){
                     ltx = mathpainterAPI.getLatex();
                  } else if(lastTab===2){
                    ltx = mqEdt.latex();
                  } else {
                    ltx = textArea.val();
                  }
                  return ltx;
            },
           clear: function(){
                if(!mathpainterAPI){
                    console.log("clear is not initialized");
                    return;
                }
                mathpainterAPI.clear();
                textArea.val("");
                mqEdt.latex("");
                modalDialog.css({top:'0', left:'0'});
          
                //$('#mathInput-modal a:first').tab('show');
           },
           onAccept: function(listener){
                onAcceptListener = listener;
           },
           destroy: function(){
               mathpainterAPI.destroy();
               $("a[href='#mathInput-tab1']").off();
               $("a[href='#mathInput-tab2']").off();
               $("a[href='#mathInput-tab3']").off();
               modalDialog.off();
           }
        };
        modalDialog[0].api = api;
      
        return api;
    };

    $.fn.pwMathInput= function(callback){
       //Create multiple buttons but all of them are connected to a single modal!
       //var modal = $('#mathInput-modal');
       
       //MODAL is a singleton
       
       var api = pw.MathInputAPI;
       if(api){
            api.clear();
       } else {
            pw.MathInputAPI = link();           
       }
      
       //var id= "mathInput-"+Math.floor(Math.random()*1e6);
       var button = $('<button type="button" class="btn btn-sm btn-default btn-lg" data-toggle="modal" data-target="#mathInput-modal"><img src="/assets/img/sigma-50.png" style="height:22px"/></button>');         
       button[0].callback = callback;
       button.on("click", function(evt){             
           var that = this;
           pw.MathInputAPI.setLatex(this.latex || "");
           pw.MathInputAPI.onAccept(function(e){
               that.latex = pw.MathInputAPI.getLatex();
               that.callback && that.callback(e);
           });               
       });
       this.append(button);  
       
       return button;
    };


    
 });
 
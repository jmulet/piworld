/*!
 * based on angular-canvas-painter - v0.6.0
 * Adapted for jQuery only
 * Copyright (c) 2017, Josep Mulet
 * Released under the MIT license.
 */
'use strict';
(function(window, $) {


var templateButtonsBar = '<div style="background:#ddd;"></div>';

var isTouch = !!('ontouchstart' in window);

var PAINT_START = isTouch ? 'touchstart' : 'mousedown';
var PAINT_MOVE = isTouch ? 'touchmove' : 'mousemove';
var PAINT_END = isTouch ? 'touchend' : 'mouseup';


function getCroppedImage(inCanvas, x0, y0, x1, y1, type, quality){
     var canvas = document.createElement('canvas');
     var w = x1-x0;
     var h = y1-y0;
     canvas.width  = w;
     canvas.height = h;
     var ctx = canvas.getContext('2d');
     //ctx.globalCompositeOperation = "destination-over";
     ctx.drawImage(inCanvas, x0, y0, w, h, 0, 0, w, h);
     return canvas.toDataURL(type, quality);
}

function areSamePixel(pix1, pix2){
  var d1 = pix1.data;
  var d2 = pix2.data;  
  return d1[0]===d2[0] && d1[1]===d2[1] && d1[2]===d2[2] && d1[3]===d2[3];
}

/**
function detectBoundingBox(inCanvas, backgroundPixel){
    console.log("detectBoundingBox", arguments);
    var xmin = -1;
    var xmax = -1;
    var ymin = -1;
    var ymax = -1;
    var w = inCanvas.width;
    var h = inCanvas.height;
    var ctx = inCanvas.getContext('2d');
    for(var x=0; x<=w; x++){
         for(var y=0; y<=h; h++){
              var pixel = ctx.getImageData(x,y,1,1);
               
              if(!areSamePixel(pixel, backgroundPixel)){
                  if( x < xmin ){
                    xmin =x;
                  }
                  if( x > xmax ){
                    xmax =x;
                  }
                  if( y < ymin ){
                    ymin =y;
                  }
                  if( y > ymax ){
                    ymax =y;
                  }
              }

         }
    } 
    console.log("END");
    return [xmin, xmax, ymin, ymax];
}
**/
    
function postLink(elm, options) {
    
        var changeListener;
        var eraseMode = false;
        var xmin=-1;
        var xmax=-1;
        var ymin=-1;
        var ymax=-1;
        var backgroundPixel;
        
        var scope = {version: 0};
        //set default options 
        var randomID = Math.floor(Math.random()*1e6);
        options.canvasId = options.customCanvasId || 'pwCanvasMain'+randomID;
        options.tmpCanvasId = options.customCanvasId ? (options.canvasId + 'Tmp') : 'pwCanvasTmp'+randomID;
        
        //These are the size of the canvas
        options.width = options.width || 800;
        options.height = options.height || 600;

        //These are the size of client viewport
        options.clientWidth = options.clientWidth || 400;
        options.clientHeight = options.clientHeight || 300;

        options.backgroundColor = options.backgroundColor || '#fff';
        options.color = options.color || '#000';
        options.undoEnabled = options.undoEnabled || false;
        options.opacity = options.opacity || 1;
        options.lineWidth = options.lineWidth || 2;
        options.undo = options.undo || true;
        options.imageSrc = options.imageSrc || false;

 
        //Create top buttons bar
        var buttonsBar = $(templateButtonsBar); 
        var buttonUndo = $('<button class="btn btn-default glyphicon glyphicon-arrow-left"></button>');
        buttonUndo.on("click", function(evt){
            if(scope.version>0){
                scope.version -= 1;
            }
            undo(scope.version);
        });
        var buttonPenEraser = $('<button class="btn btn-default glyphicon glyphicon-pencil"></button>');
        buttonPenEraser.on("click", function(evt){
             eraseMode = !eraseMode;  
             if(eraseMode){
                  ctxTmp.strokeStyle = options.backgroundColor;               
             } else {
                  ctxTmp.strokeStyle = options.color;  
             }
            
             buttonPenEraser.toggleClass("glyphicon-pencil").toggleClass("glyphicon-erase");
               
        });
        var buttonClear = $('<button class="btn btn-warning glyphicon glyphicon-trash "></button>');
        buttonClear.on("click", function(evt){
            clear();
        });
        
        
        buttonsBar.append(buttonUndo);
        buttonsBar.append(buttonPenEraser);
        buttonsBar.append(buttonClear);
        elm.append(buttonsBar);
        


        //undo
        var undoCache = [];
        
        //create canvas and context
        var canvas = document.createElement('canvas');
        canvas.id = options.canvasId;
        var canvasTmp = document.createElement('canvas');
        canvasTmp.id = options.tmpCanvasId;
        $(canvasTmp).css({
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: 'cross-hair'
        });
  
        var scroll = $('<div style="position: relative;overflow: auto; height: '+options.clientHeight +'px;"/>');

        scroll.append(canvas);
        scroll.append(canvasTmp);
        elm.append(scroll);
        
        var ctx = canvas.getContext('2d');
        var ctxTmp = canvasTmp.getContext('2d');
        
        var setImage = function(src){ 
          
            var cw = elm.width();
            var ch = elm.height();

            ctx.fillStyle = options.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

             var image = new Image();
             image.onload = function() {
               var iw = this.width;
               var ih = this.height;
               
               var fraction, ratio, realh;
               if(iw > ih){
                   fraction = 0.25;
                   ratio = ih/iw;
                   realh = fraction*cw*ratio
               } else {
                   fraction = 0.1;
                   ratio = ih/iw;
                   realh = fraction*cw*ratio
               }
               ctx.drawImage(this, 0.05*cw, 0.4*(ch-realh), fraction*cw, realh);
             };
             image.src = src;
       };
    
        // background image
        if (options.imageSrc) {
            setImage(options.imageSrc);
        }
        
        //inti variables
        var point = {
          x: 0,
          y: 0
        };
        var ppts = [];

        canvas.width = canvasTmp.width = options.width;
        canvas.height = canvasTmp.height = options.height;
        
        //set context style
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        backgroundPixel = ctx.getImageData(0,0,1,1);

        ctxTmp.globalAlpha = options.opacity;
        ctxTmp.lineJoin = ctxTmp.lineCap = 'round';
        ctxTmp.lineWidth = 10;
        ctxTmp.strokeStyle = options.color;

        var getOffset = function(elem) {
          var bbox = elem.getBoundingClientRect();
          return {
            left: bbox.left,
            top: bbox.top
          };
        };

        var setPointFromEvent = function(point, e) {
          if (isTouch) {
            point.x = e.changedTouches[0].pageX - getOffset(e.target).left;
            point.y = e.changedTouches[0].pageY - getOffset(e.target).top;
          } else {
            point.x = e.offsetX !== undefined ? e.offsetX : e.layerX;
            point.y = e.offsetY !== undefined ? e.offsetY : e.layerY;
          }
        };


        var paint = function(e) {
          if (e) {
            e.preventDefault();
            setPointFromEvent(point, e);
          }
 
          if(xmin<0 || point.x < xmin){
            point.x < 0? xmin=0 :  xmin = point.x;
          }
          if(xmax<0 || point.x > xmax){
            point.x > options.width? xmax=options.width : xmax = point.x;
          }
          if(ymin<0 || point.y < ymin){
            point.y < 0? ymin = 0 : ymin = point.y;
          }
          if(ymax<0 || point.y > ymax){
            point.y > options.height? ymax=options.height : ymax = point.y;
          }
          
          ppts.push({
                  x: point.x,
                  y: point.y
                });

 
                //ctx.globalCompositeOperation="source-over";
                // Saving all the points in an array
               
                if (ppts.length === 3) {
                  var b = ppts[0];
                  ctxTmp.beginPath();
                  ctxTmp.arc(b.x, b.y, ctxTmp.lineWidth, 0, Math.PI * 2, !0);
                  ctxTmp.fill();
                  ctxTmp.closePath();
                  return;
                }

                // Tmp canvas is always cleared up before drawing.
                ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);

                ctxTmp.beginPath();
                ctxTmp.moveTo(ppts[0].x, ppts[0].y);

                for (var i = 1; i < ppts.length - 2; i++) {
                  var c = (ppts[i].x + ppts[i + 1].x) / 2;
                  var d = (ppts[i].y + ppts[i + 1].y) / 2;
                  ctxTmp.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
                }

                // For the last 2 points
                ctxTmp.quadraticCurveTo(
                  ppts[i].x,
                  ppts[i].y,
                  ppts[i + 1].x,
                  ppts[i + 1].y
                );
                ctxTmp.stroke();
            
        };

        var copyTmpImage = function(e) {
         if(e.button>1){
            e.preventDefault();
        
            return;
          }
          if (options.undo) {
              undoCache.push(ctx.getImageData(0, 0, canvasTmp.width, canvasTmp.height));
//              if (!isNaN(options.undo) && options.undo > 0) {
//                undoCache = undoCache.slice(-1 * options.undo);
//              }
              scope.version = undoCache.length;
              
          }
         
          canvasTmp.removeEventListener(PAINT_MOVE, paint, false);
          ctx.drawImage(canvasTmp, 0, 0);
          ctxTmp.clearRect(0, 0, canvasTmp.width, canvasTmp.height);
          ppts = [];
        
           changeListener && changeListener({version: scope.version});
        };

        var startTmpImage = function(e) {
          e.preventDefault();
          if(e.button>1){
            return;
          }

          canvasTmp.addEventListener(PAINT_MOVE, paint, false);

          setPointFromEvent(point, e);
          ppts.push({
            x: point.x,
            y: point.y
          });
          ppts.push({
            x: point.x,
            y: point.y
          });

          paint();
        };

          var MOUSE_DOWN;
          function mousedown() {
            MOUSE_DOWN = true;
          }

          function mouseup() {
            MOUSE_DOWN = false;
          }
  

          function mouseenter(e) {
            // If the mouse is down when it enters the canvas, start a path
            if (MOUSE_DOWN) {
              startTmpImage(e);
            }
          }

          function mouseleave(e) {
            // If the mouse is down when it leaves the canvas, end the path
            if (MOUSE_DOWN) {
              copyTmpImage(e);
            }
          }

        var initListeners = function() {
          canvasTmp.addEventListener(PAINT_START, startTmpImage, false);
          canvasTmp.addEventListener(PAINT_END, copyTmpImage, false);

          if (!isTouch) {

            document.body.addEventListener('mousedown', mousedown);
            document.body.addEventListener('mouseup', mouseup);
 
            canvasTmp.addEventListener('mouseenter', mouseenter);
            canvasTmp.addEventListener('mouseleave', mouseleave);
          }
        };

        var undo = function(version) {
            console.log("undo", version);
          if (undoCache.length > 0) {
            ctx.putImageData(undoCache[version], 0, 0);
            undoCache = undoCache.slice(0, version);
            scope.version = undoCache.length;
          }
        };

        initListeners();
        
        
        var destroy = function(){
            document.body.removeEventListener('mousedown', mousedown);
            document.body.removeEventListener('mouseup', mouseup);
            buttonUndo.off();
            buttonClear.off();
        };
        
        
        var setOption = function(key, value){
            options[key] = value;        
            if(key==='lineWidth'){
                ctxTmp.lineWidth = value;
            }
            else if(key==='color'){
                ctxTmp.strokeStyle = ctxTmp.fillStyle = value;
            }
            else if('opacity'){
                ctxTmp.globalAlpha = value;
            } else if('version'){                
                   if (value < 0) {
                       scope.version = 0;
                   }
                   else if (value >= undoCache.length) {
                     scope.version = undoCache.length;                     
                   }
                   undo(scope.version);                               
            }
        };
        
        var getOption = function(key){
            return options[key];
        };
        
        var getImage = function(cropme, type, quality){
         
           if(cropme){

              //Do pixel based bounding box detection
              /**
              var bb = detectBoundingBox(canvas, backgroundPixel);
              xmin = bb[0];
              xmax = bb[1];
              ymin = bb[2];
              ymax = bb[3];
              **/
              if(xmax === xmin){
                  xmax = xmin+10;
              } 
              if(ymax === ymin){
                  ymax = ymin+10;
              } 
              var eps = 0.2;
              var x0 = Math.floor((1-eps)*xmin);
              var y0 = Math.floor((1-eps)*ymin);
              var x1 = Math.floor((1+eps)*xmax);
              var y1 = Math.floor((1+eps)*ymax);
              
              x1 > options.width? x1= options.width : x1;
              y1 > options.height? y1= options.height : y1;
              return getCroppedImage(canvas, x0, y0, x1, y1, 'image/'+(type || "jpeg"), quality || 0.5);
              
           } else {
            
              return canvas.toDataURL('image/'+(type || "jpeg"), quality || 0.5);
           }
       
        };
        
        var clear = function(){
            scope.version = 0;
            xmin=-1;
            xmax=-1;
            ymin=-1;
            ymax=-1;
            undo(0);
        };
        
        var onChanges = function(listener){
            changeListener = listener; 
        }; 

        var getVersion = function(){
          return scope.version;
        };

        return {undo: undo, clear: clear, destroy: destroy, getImage: getImage, setImage: setImage, 
          setOption: setOption, getOption: getOption, onChanges: onChanges, getVersion: getVersion};
}
  
  
  $.fn.pwCanvasPaint = function(opts){
    
            opts = opts || {};            
            if(this.hasClass("pwCanvasPaint")){
    
                if(opts==="destroy"){
                    
                    this.pwCanvasAPI.destroy();

                } else if(opts==="getImage"){
                    return this.pwCanvasAPI.getImage();
                }
      
            } else {
                this.pwCanvasAPI = postLink(this, opts);
                this.addClass("pwCanvasPaint");
                return this.pwCanvasAPI;
            }
 
  };

 
}(this, jQuery));
/*
 *  Extend mathPaint in order to connect to a 
 *  mathpix ocr and return an interpreted image
 *  via mathjax svg image 
 */

 (function(window, jQuery){

 	var link = function(elem, opts){
 		opts.idle = opts.idle || 3000; 
 		var latex = "";
 		var canvasAPI = elem.pwCanvasPaint(opts);

 		var lastModified = 0;
 		var lastVersion = 0;
 		var changesListener;
 		var interval;

 		var fnInterval = function(){
 			var now = (new Date()).getTime();
 			if( (now-lastModified) > opts.idle  && canvasAPI.getVersion() !== lastVersion){
 				//Perform the magic!
 				lastVersion = canvasAPI.getVersion();
 			 	var imageBase64 = canvasAPI.getImage();
			 	 
				if(lastVersion===0){
						latex = "";
				} else {
						$.post("/rest/misc/mathpix", {url: imageBase64}).then(function(r){

							//if correct; we obtain a latex string and a svg image to render in canvas.
							//if incorrect; we show a message
							console.log(r);
							if(r.latex){
								latex = r.latex;
								changesListener && changesListener({latex: latex});
							} 
							if(r.svg){
								canvasAPI.setImage("data:image/svg+xml;base64,"+r.svg); //make sure it does not tig changes!!
							}
							if(r.error){
								console.log(r.error);
								latex = "";
								changesListener && changesListener({latex: latex});
							}

						});
				}
 			} 
 		};

 		interval = window.setInterval(fnInterval, opts.idle);

 		canvasAPI.onChanges(function(evt){
 		 	lastModified = (new Date()).getTime();
 			//lastVersion = evt.version;
 		});

 		var api = {
 			canvasAPI: canvasAPI,
 			getLatex: function(){
 				return latex;
 			},
 			clear: function(){
 				canvasAPI.clear();
 				api.startIdle();
 			},
 			onChanges: function(listener){
 				changesListener = listener;
 			},
 			startIdle: function(){
 				interval && clearInterval(interval);
 				interval = window.setInterval(fnInterval, opts.idle);
 			},
 			stopIdle: function(){
 				interval && clearInterval(interval);
 			},
                        destroy: function(){
                            canvasAPI.destroy();
                            interval && clearInterval(interval);
                        }
 		};

 		return api;

 	};


 	$.fn.pwMathPaint = function(opts){
 		return link(this, opts);
 	};

 }(this, jQuery));
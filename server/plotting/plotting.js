/*
 * A very basic node.js example that supports rendering to bitmap graphics.
 * This requires the canvas module for node.js (https://npmjs.org/package/canvas)
 * 
 * Known issues: This doesn't work right now because for unknown reasons the infobox enforces HTML rendering.
 * If initInfobox is changed such that it returns without creating a text element it works.
 */

// use the (minified) core, i.e. jsxgraph in one single file, built with r.js
//var JXG = require('../../build/bin/jsxgraphcore.js');

 
module.exports = function(app){

    var JXG = require('./jsxgraphcore.js'),
         fs = require('fs');
 var winston = require('winston');
 
    var U = require('../util.js');
 
    function createBoard(jsxCanvas_str, jsxBoard_str){
        
        //JXG.Options.text.display = 'internal';
        jsxCanvas_str = jsxCanvas_str || '{dim: [300,250]}';
        jsxBoard_str = jsxBoard_str || '{boundingbox: [-5,5,5,-5]}';
       
        var jsxCanvas = (eval("["+jsxCanvas_str+"]") || [{}])[0];
        var jsxBoard = (eval("["+jsxBoard_str+"]") || [{}] )[0];
        
        jsxBoard.showCopyright = jsxBoard.showCopyright || false;
        jsxBoard.showNagivation = jsxBoard.showNagivation || false;
        jsxBoard.axis = jsxBoard.axis!=null? jsxBoard.axis : true;
        jsxBoard.grid = jsxBoard.grid!=null? jsxBoard.grid : true;
        
        var dim = jsxCanvas.dim? {width:jsxCanvas.dim[0], height:jsxCanvas.dim[1]} : {width:300, height:250};          
        jsxBoard.boundingbox = jsxBoard.boundingbox || [-5,5,5,-5];
        var bbox = jsxBoard.boundingbox;
      
        
        var renderer = new JXG.CanvasRenderer(null, dim);        
        var unitX = dim.width / (bbox[2] - bbox[0]);
        var unitY = dim.height / (bbox[1] - bbox[3]);
        var originX = -unitX * bbox[0];
        var originY = unitY * bbox[1];
        var attr = jsxBoard;
        attr.zoomfactor = attr.zoomfactor || 1;
        attr.zoomx = attr.zoomx || 1;
        attr.zoomy = attr.zoomy || 1;
        
        var board = new JXG.Board(null, renderer, "board1", [originX, originY], attr.zoomfactor * attr.zoomx, attr.zoomfactor * attr.zoomy, unitX, unitY, dim.width, dim.height, attr);
        
        
        JXG.boards[board.id] = board;
        board.keepaspectratio = attr.keepaspectratio || false;
        board.resizeContainer(dim.width, dim.height, true, true);
        board.suspendUpdate();
        board.initInfobox();
        
        if (attr.axis) {
            var axattr = typeof attr.axis === 'object' ? attr.axis : {ticks: {drawZero: true}};
            board.defaultAxes = {};
            board.defaultAxes.x = board.create('axis', [[0, 0], [1, 0]], axattr);
            board.defaultAxes.y = board.create('axis', [[0, 0], [0, 1]], axattr);
        }
 
        if (attr.grid) {
            board.create('grid', [], (typeof attr.grid === 'object' ? attr.grid : {}));
        }

        board.renderer.drawZoomBar(board);
        board.unsuspendUpdate();
        return board;  
    };
 
    function createPlot(jsxCanvas, jsxBoard, jsxCreate){
        
       
        jsxCreate = jsxCreate || '';
         
        var board = createBoard(jsxCanvas, jsxBoard);
         
        var context = {};
        
        //Now parse jsxCreate
        var cmds = jsxCreate.replace(/\)(\s)*;/g, ');').split(");");
       
        cmds.forEach(function(c){
            
            if(c.trim()){
               
            var ppos = c.indexOf("(");
            var left = c.substring(0, ppos); 
            var right = c.substring(ppos+1, c.length); 
            var id;
            var method;
           
            
            var eqpos = left.indexOf("=");
            if(eqpos > 0){
                id = left.substring(0, eqpos).trim();
                method = left.substring(eqpos+1).trim();
            }
            else {
                method = left.trim();
            }
            if(right.trim().lastIndexOf(")")===right.length-1){
                right = right.substring(0, right.length-1);
            }
            
            
            var command;
            try{        
                
                command  = U.evalInContext("['"+method+"',"+right+"]", context);
                
                if(command[0].toLowerCase()==="functiongraph" && typeof(command[1])==="string"){
                    //Must create a function from the string passed and apply style
                    //Example:['g1=functiongraph',['x^2-1','blue',5]]
                    var fn = board.jc.snippet(command[1], true, 'x', true);

                    var f = [fn,
                    function(){ 
                      var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[0,0],board);
                      return c.usrCoords[1];
                    },
                    function(){ 
                      var c = new JXG.Coords(JXG.COORDS_BY_SCREEN,[board.canvasWidth,0],board);
                      return c.usrCoords[1];
                    }
                  ];

                   command[1]=f;


                }

                var obj = board.create.apply(board, command);
                if(id && obj){
                    context[id] = obj;
                }
            }
            catch(ex){
                winston.error(ex);
            }
            }
        });
          
        var stream = null;
        if (JXG.supportsCanvas()) {
            // print data url
            //winston.error(board.renderer.canvasRoot.toDataURL());            
            stream = board.renderer.canvasRoot.createPNGStream();
        }
        else
        {
            winston.error("NO canvas support");
        }
    
        
        return stream;
    }
     
    
    //Parses two strings into a png picture
    app.write_png = function(jsxCanvas, jsxBoard, jsxCreate, outputName, success){
        
        outputName = outputName || 'jsxgraph';
        var stream = createPlot(jsxCanvas, jsxBoard, jsxCreate);        
        var fname = outputName;
        if(outputName.indexOf("/")<0){
            outputName = __dirname + '/' + outputName + '.png';
        }
        var out = fs.createWriteStream(fname);
            stream.on('data', function (chunk) {
                out.write(chunk);
            });

            stream.on('end', function () {
                winston.error('saved '+fname);
                if(success){
                    success();
                }
            });
    };
    
    var servlet_png = function (req, res) {         
        var stream = createPlot(req.query.jsxCanvas, req.query.jsxBoard, req.query.jsxCreate);
        
        res.writeHeader(200, {"content-type": "image/png"});
        if(!stream)
        {
            res.end();
            return;
        }
        stream.on('data', function (chunk) {
            res.write(chunk);
        });

        stream.on('end', function () {
            res.end();
        });
    };
     
    if(app.get){ 
        app.get('/rest/jsxgraph', servlet_png); 
    }
};
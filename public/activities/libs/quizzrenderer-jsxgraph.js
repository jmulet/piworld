 define(["/activities/libs/math/multiMethodCheck.js","jsxgraph"], function(multiMethodCheck){
  
    var pw = window.pw || {};
 
    var quizzJSXGraph= function(question, container, checkBtn){
        this.question = question;
        this.container = container;
        this.checkBtn = checkBtn;
        this.id = Math.random().toString(36).slice(2);
        
        var template = '<center><div><h3>'+question.formulation+'</h3>';
        if(question.subformulation){
                   template += '<h3>'+question.subformulation+'</h3>';
        }
        template += '<center><div id="jsxGraph'+this.id+'" style="max-width:500px; height:250px;">';
        template += '<div id="jxgbox-'+this.id+'" class="jxgbox" style="width:100%;height:100%;"></div>';
        template += '<div id="jsxGraph-palette" style="max-width:500px; height:80px; overflow-x:auto;">';
        
        var options = ["LINEAL", "PARABOLA", "HIPERBOLA", "RADICAL", "EXP"]; // "LOG"];
         
        $.each(options, function(i, o){
            template += '<span class="jsxGraph-palette-opt" data-type="'+i+'"> <image src="/activities/libs/img/jsxGraph-palette-opt-'+i+'.png" style="cursor:pointer;width:80px; height:60px;border: 1px #bfbfbf solid;border-radius: 5px;"/></span> ';
        });
        template += '</div></div><div style="margin-top:65px;"><i>Trieu la forma i ajusteu-la desplaçant els punts.</i></div></center>';
                         
        
        this.main = $(template);      
        
    };
    
    quizzJSXGraph.prototype =  {
        clearBoard: function(){        
                var that = this;
                this.brd && JXG.JSXGraph.freeBoard(this.brd);
                this.brd = JXG.JSXGraph.initBoard('jxgbox-'+this.id, this.jsxOptions);  
                var resize = function () {
                    that.brd.resizeContainer(that.brd.containerObj.clientWidth, that.brd.containerObj.clientHeight, true);
                    that.brd.setBoundingBox(that.jsxOptions.boundingbox);
                    that.brd.fullUpdate();
                };
                this.main.off("resize");
                this.main.on("resize", resize);
                
        },
        renderGraph: function(type){
            var that = this;
            this.clearBoard();
            this.type = type;          
          
            switch(type){
                //Allow user to construct lines
                case 0:      
                     this.point1 = this.brd.create('point',[-1,1], {name:'A',size:4,snapToGrid:true});
                     this.point2 = this.brd.create('point',[2,-1], {name:'B',size:4,snapToGrid:true});
                     this.brd.create('line', ["A","B"], {strokeColor:'#00ff00',strokeWidth:2});
                     break;            
                //Allow user to construct parabolas (with 3 points)
                case 1:
                      this.point1 = this.brd.create('point',[-1,1], {name:'A',size:4,snapToGrid:true});
                     this.point2 = this.brd.create('point',[2,-1], {name:'B',size:4,snapToGrid:true});
                     this.point3 = this.brd.create('point',[1,2], {name:'C',size:4,snapToGrid:true});
               
                     var p = [this.point1, this.point2, this.point3];
                     var f = JXG.Math.Numerics.lagrangePolynomial(p);
                     this.brd.create('functiongraph', [f,-10, 10], {strokeColor:'#00ff00',strokeWidth:2});
                     break;
                     
               //Allow user to construct simple prop inversa y = a /(x-b) + c (with 1 point over curve; and 1 point at intersection asimptota )
                case 2:
                     this.point1 = this.brd.create('point',[-1,1], {name:'A',size:4,snapToGrid:true});
                     this.point2 = this.brd.create('point',[2,-1], {name:'B',size:4,snapToGrid:true});
                     this.brd.create('functiongraph', [function(x){return that.point2.coords.usrCoords[2];}], {strokeColor:'#777',strokeWidth:2, dash:2});
                     this.brd.create('functiongraph', [function(x){return that.point2.coords.usrCoords[2]+1000*(x-that.point2.coords.usrCoords[1]);}], {strokeColor:'#777',strokeWidth:2,dash:2});
                     
                     this.brd.create('functiongraph', [function(x){
                             var x1 = that.point1.coords.usrCoords[1];
                             var y1 = that.point1.coords.usrCoords[2];
                             var x2 = that.point2.coords.usrCoords[1];
                             var y2 = that.point2.coords.usrCoords[2];                            
                             return (y1-y2)*(x1-x2)/(x-x2)+y2;}], {strokeColor:'#00ff00',strokeWidth:2});
                    break;
                    
                //Racional y=b sqrt(x-a)+c
                case 3:
                     this.point1 = this.brd.create('point',[-1,1], {name:'A',size:4,snapToGrid:true});
                     this.point2 = this.brd.create('point',[2,-1], {name:'B',size:4,snapToGrid:true});
                     this.brd.create('functiongraph', [function(x){
                             var x1 = that.point1.coords.usrCoords[1];
                             var y1 = that.point1.coords.usrCoords[2];
                             var x2 = that.point2.coords.usrCoords[1];
                             var y2 = that.point2.coords.usrCoords[2];                            
                             return (y2-y1)*Math.sqrt((x-x1)/(x2-x1))+y1;}], {strokeColor:'#00ff00',strokeWidth:2});
                     break;
                     
                //Exponencial y=k b^x + c
                case 4:
                     this.point1 = this.brd.create('point',[-1,1], {name:'A',size:4,snapToGrid:true});
                     this.point2 = this.brd.create('point',[2,3], {name:'B',size:4,snapToGrid:true});
                     this.point3 = this.brd.create('point',[3,0], {name:'C',size:4,snapToGrid:true});
                     
                     this.brd.create('functiongraph', [function(x){return that.point3.coords.usrCoords[2];}], {strokeColor:'#777',strokeWidth:2, dash:2});
                     
                     this.brd.create('functiongraph', [function(x){
                             var x1 = that.point1.coords.usrCoords[1];
                             var y1 = that.point1.coords.usrCoords[2];
                             var x2 = that.point2.coords.usrCoords[1];
                             var y2 = that.point2.coords.usrCoords[2];  
                             var c = that.point3.coords.usrCoords[2];
                             var b = Math.power((y1-c)/(y2-c), 1/(x1-x2));
                             var a = (y1-c)/Math.power(b, x1);
                             return a*Math.power(b,x)+c;}], {strokeColor:'#00ff00',strokeWidth:2});
                     break;
                //Logaritmic y = k log_b (x - c)
                case 5:    
                     this.point1 = this.brd.create('point',[-1,1], {name:'A',size:4,snapToGrid:true});
                     this.point2 = this.brd.create('point',[2,-1], {name:'B',size:4,snapToGrid:true});
                     this.point3 = this.brd.create('point',[3,0], {name:'C',size:4,snapToGrid:true});
                     
                     this.brd.create('functiongraph', [function(x){return that.point3.coords.usrCoords[2]+1000*(x-that.point3.coords.usrCoords[1]);}], {strokeColor:'#777',strokeWidth:2, dash:2});
                     
                     this.brd.create('functiongraph', [function(x){
                             var x1 = that.point1.coords.usrCoords[1];
                             var y1 = that.point1.coords.usrCoords[2];
                             var x2 = that.point2.coords.usrCoords[1];
                             var y2 = that.point2.coords.usrCoords[2];  
                             var c = that.point3.coords.usrCoords[2];
                             var b = Math.power((y1-c)/(y2-c), 1/(x1-x2));
                             var a = y1/Math.power(b, x1);
                             return a*Math.power(b,x)+c;}], {strokeColor:'#00ff00',strokeWidth:2});
                     break;
            }
        },
        render: function(){
            var that =this;
            this.container.empty().append(this.main);
                
                var useropts = {};
                if(this.question.jsxGraph){
                    try{ 
                        useropts = eval(this.question.jsxGraph);
                    } catch(Ex){console.log(Ex);}
                 }
                 
                 this.jsxOptions = $.extend(useropts, pw.JSXGraph_OPTS);                 
                 this.renderGraph(0);
                  
                 this.main.find("span.jsxGraph-palette-opt").on("click", function(evt){
                     
                     var type = parseInt(this.dataset.type);
                     if(type!==that.type){
                          that.renderGraph(type);
                     }
                     
                 });
            //Check if katex has to be rendered
            window.pw.autoRender(this.main);
        },
        validate: function(){
            if(this.question.validate){
                return this.question.validate({userinput: {text: this.getValue() } });
            }
        },
        check: function(){
            
            if(this.question.check){
                return this.question.check({userinput: {text: this.getValue() } , answer: this.question.answer });
            }
            
            var userinput = this.getValue().split("=")[1].trim();
            var expected = this.question.answer.split("=")[1].trim();
            
            return multiMethodCheck(userinput, expected, {});
        },
        //Returns the latex equation of the figure constructed
        getValue: function(){
            switch(this.type){
                case 0:
                    var Ax = this.point1.coords.usrCoords[1];
                    var Ay = this.point1.coords.usrCoords[2];
                    var Bx = this.point2.coords.usrCoords[1];
                    var By = this.point2.coords.usrCoords[2];
                    if(Ax === Bx){
                        //Recta vertical
                        return "x = "+Ax;
                    } else {
                        var dy = (By-Ay); 
                        var dx = (Bx-Ax); 
                        var m = dy/dx;
                        if(m === Math.floor(m)){
                            var eqn = "y="+Ay+"+"+m+"(x-"+Ax+")";
                            console.log("User has entered the line:: "+eqn);
                            return eqn.replace(/\+-/g,'-').replace(/--/g, '+');
                        } else {                          
                           var eqn = "y="+Ay+"+\\frac{"+dy+"}{"+dx+"}(x-"+Ax+")";
                           console.log("User has entered the line:: "+eqn);
                           return eqn.replace(/\+-/g,'-').replace(/--/g, '+');
                        }
                    };
                    break;
                
                //Parabola: Formula de Langrange
                case 1:
                        var x1 = this.point1.coords.usrCoords[1];
                        var y1 = this.point1.coords.usrCoords[2];
                        var x2 = this.point2.coords.usrCoords[1];
                        var y2 = this.point2.coords.usrCoords[2];
                        var x3 = this.point3.coords.usrCoords[1];
                        var y3 = this.point3.coords.usrCoords[2];        

                        var eqn = "y = ";
                        var dd = (x1-x2)*(x1-x3);
                        eqn += "\\frac{"+y1+"}{"+dd+"} (x-"+x2+")(x-"+x3+")";
                        dd = (x2-x1)*(x2-x3);
                        eqn += "+ \\frac{"+y2+"}{"+dd+"} (x-"+x1+")(x-"+x3+")";
                        dd = (x3-x1)*(x3-x2);
                        eqn += "+ \\frac{"+y3+"}{"+dd+"} (x-"+x1+")(x-"+x2+")";
                        console.log("User has entered the parabola:: "+eqn);
                        return eqn.replace(/\+-/g,'-').replace(/--/g, '+');
                        break;
                //Prop inversa: k/(x-a)
                case 2:
                        var x1 = this.point1.coords.usrCoords[1];
                        var y1 = this.point1.coords.usrCoords[2];
                        var x2 = this.point2.coords.usrCoords[1];
                        var y2 = this.point2.coords.usrCoords[2];
                              

                        var eqn = "y = ";
                        var k = (y1-y2)*(x1-x2);
                        eqn +=  "\\frac{"+k+"}{x-"+x2+"}+"+y2;
                        console.log("User has entered the hiperbola:: "+eqn);
                        return eqn.replace(/\+-/g,'-').replace(/--/g, '+').replace(/-\+/g, '-');
                        break;
                //Radical
                case 3:
                        var x1 = this.point1.coords.usrCoords[1];
                        var y1 = this.point1.coords.usrCoords[2];
                        var x2 = this.point2.coords.usrCoords[1];
                        var y2 = this.point2.coords.usrCoords[2];
                              

                        var eqn = "y = \\frac{"+(y2-y1)+"}{\\sqrt{"+(x2-x1)+"}}";
                        
                        eqn +=  "\\sqrt{x-"+x1+"}+"+y1;
                        console.log("User has entered the root "+eqn);
                        return eqn.replace(/\+-/g,'-').replace(/--/g, '+').replace(/-\+/g, '-');
                        break;
                //Exponencial
                case 4:
                        var x1 = this.point1.coords.usrCoords[1];
                        var y1 = this.point1.coords.usrCoords[2];
                        var x2 = this.point2.coords.usrCoords[1];
                        var y2 = this.point2.coords.usrCoords[2];
                        var c = this.point3.coords.usrCoords[2];
                        var b = Math.power((y1-c)/(y2-c), 1/(x1-x2));
                        var a = y1/Math.power(b, x1);
                         
                        var eqn = "y = "+a+"\\cdot "+b+"^x+"+c;                        
                        console.log("User has entered the exponential "+eqn);
                        return eqn.replace(/\+-/g,'-');
                        break;
                        
            }
        },
        revealAnswer: function(){
           
        },
        getRightAnswer: function(){
            return this.question.answer;
        },
        enable: function(enable){
            
        },
        destroy: function(){
           this.brd && JXG.JSXGraph.freeBoard(this.brd);
           this.main.find(".jsxGraph-palette-opt").off();
           this.main.off();
        }
        
        
    };
 
    return quizzJSXGraph;
 });
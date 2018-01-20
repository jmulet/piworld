
define(['mathquill', 'mathlex'], function(){
    
   window.pw.app.register.directive('imMath2dInput', ['$rootScope', function($rootScope){    
    return {
        restrict: 'E',
        replace: true,
        require: ['ngModel'],
        scope: { model: '=ngModel'},
        controller: ['$scope', function($scope){
            
            //Generate a random id
            $scope.id = "textarea_"+Math.random().toString(36).slice(2);
            
            $scope.add = function (val) {
                        var domElement = document.getElementById($scope.id);

                        if (document.selection) {
                            domElement.focus();
                            var sel = document.selection.createRange();
                            sel.text = val;
                            domElement.focus();
                        } else if (domElement.selectionStart || domElement.selectionStart === 0) {
                            var startPos = domElement.selectionStart;
                            var endPos = domElement.selectionEnd;
                            var scrollTop = domElement.scrollTop;
                            //insert
                            var op = "";
                            var before = domElement.value.substring(0, startPos);
                            var c = before.trim().slice(-1);
                            if(startPos>0  && val.trim().length>1 && c!=='(' && c!=='+' && c!=='-' && c!=='/' && c!=='*'  && c!=='^')
                            {
                                op = "*"; //assume multiplication
                            }
                            domElement.value = before + op + val + domElement.value.substring(endPos, domElement.value.length);
                            domElement.focus();
                            //change selection
                            domElement.selectionStart = startPos + op.length + val.length;
                            domElement.selectionEnd = startPos + op.length + val.length;
                            domElement.scrollTop = scrollTop;
                        } else {
                            //apend
                            domElement.value += val;
                            domElement.focus();
                        }
                        //update model from resulting textarea
                        $scope.model = domElement.value;
                    }
                    ;
                }],
        templateUrl: 'app/shared/math2dInput.html',
        link: function(scope, element, attrs)
        {
           
            scope.tabs = {algebra:true, constants:true, symbols: true, vectors: true, trigonometry: true, functions: true};
            scope.placeholder = attrs.placeholder || "Escriu l'expressió matemàtica ...";
            
            if(attrs.hideTabs){
               attrs.hideTabs.split(",").forEach(function(e){
                   scope.tabs[e.trim()] = false;
               });
            }
            
            if(attrs.showTabs){
                for(var key in scope.tabs)
                {
                    scope.tabs[key] = false;
                }
                attrs.showTabs.split(",").forEach(function(e){
                   scope.tabs[e.trim()] = true;
               });
            }
              
        }        
    };
    }]);


  function fixMultiplications(scas){
        //Now must add required * between letters and numbers //Do not break PI
         
        (scas.match(/(\d*)(\w)/g) || []).forEach(function (e) {
            var s = "";
            var list = e.split(/(\D)/g).filter(function (v) {
                return v.length;
            });
            var times = "";
            list.forEach(function (p) {
                s += times + p;
                times = "*";
            });

            scas = scas.replace(e, s);
        });
      
        //Now must add required * between ) and letter
        (scas.match(/(\)\w)/g) || []).forEach(function (e) {
            var s = "";
            var list = e.split(/\)/g);
            var times = "";
            list.forEach(function (p) {
                s += times + p;
                times = ")*";
            });
            scas = scas.replace(e, s);
        });
                 
        return scas;
    }
  
 function cleanEmpty(arr){
     for(var i in arr){
        var e = arr[i];
        if(typeof(e)==='string' && !e){
            arr.splice(i,1);
        }else if(Array.isArray(e)){
            cleanEmpty(e);
        }        
     };     
 } 
 
 //Clears all latex commands \command{}
 function clearCommands(arr, type){
      for(var i=0; i<arr.length; i++){
           var e = arr[i];
           if(typeof(e)==='string'){
                var pos = e.lastIndexOf("\\");
                var before = "";
                if(pos>0){
                    before = e.substring(0,pos);
                }
                var cmd = e.substring(pos);
                 
                if(cmd==='\\frac'){
                    //console.log(" FOUND FRAC ");
                    arr[i] = before+"(";
                    arr.splice(i+2, 0, ')/(');
                    arr.splice(i+4, 0, ')');
                }
                else if(cmd.indexOf('\\sqrt[')>=0){
                    console.log(" FOUND nth root ");
                    var index = cmd.substring(6, cmd.length-1);
                    if(type==='js'){
                        arr[i] = before+ "Math.pow(";
                        arr.splice(i+2, 0, '@1/('+index+'))');                    
                    }else{                    
                        arr[i] = before+ "(";
                        arr.splice(i+2, 0, ')^(1/('+index+'))');                    
                    }
                }
                else if(cmd.indexOf('\\')>=0)
                {
                    console.log("FOUND cmd "+cmd);
                    var cmd = cmd.replace('\\','');
                    if(type==='js'){
                        cmd = "Math."+cmd;
                    } else if(type==='yacas'){
                        cmd = cmd[0].toUpperCase()+cmd.substring(1).toLowerCase();
                    }  
                    arr[i] = before+ cmd + "(";
                    arr.splice(i+2, 0, ')');                    
                }
                else if(cmd.endsWith('e^'))
                {
                    console.log("FOUND cmd e^ "+cmd);
                    cmd = cmd.substring(0, cmd.length-2) || '';
                    if(type==='js'){
                        cmd+= "Math.exp";                        
                    } else if(type==='yacas'){
                        cmd+= "Exp";     
                    } else if(type==='maxima'){
                        cmd+= "exp";     
                    } else{
                        cmd+="e^";
                    }
                    
                    arr[i] = before+ cmd + "(";
                    arr.splice(i+2, 0, ')');                    
                }
                else if(cmd.endsWith('^'))
                {
                    console.log("FOUND cmd ^ "+cmd);
                    
                    if(type==='js'){
                      cmd = cmd.substring(0, cmd.length-1) || '';
                      cmd += "Math.pow";
                    }  
                    
                    arr[i] = before+ cmd + "(";
                    arr.splice(i+2, 0, ')');                    
                }
                else
                {
                    console.log("??? "+cmd);
                }
            }
            else if(Array.isArray(e)){
                clearCommands(e, type);
            }            
        }
 }

window.app.register.filter('latex2', function(){
       
       return function(mathText, type){
            if(type==='latex'){
           return mathText;
       }
       console.log("vvv"+mathText);
       //Now must add required * between number and beginning of command \
       (mathText.match(/(\d*)?=\\/g) || []).forEach(function (e) {
           console.log("Found "+e);
            var s = "";
            var list = e.split('\\').filter(function (v) {
                return v.length;
            });
            var times = "";
            list.forEach(function (p) {
                s += times + "\\" + p;
                times = "*";
            });
            mathText = mathText.replace(e, s);
        });
        
       var out = mathText.replace(/,/g, '@');
      
       //spaces or cdots as multiplications
       out = out.replace(/\\,/g,'*').replace(/\\cdot/g,'*');
       //Fix pi
       out = out.replace(/\\pi/ig,'#').replace(/pi/ig,'#');
       //Fix infinity
       out = out.replace(/\\infty/ig,'#').replace(/infty/ig,'?');
        //parenthesis
       out = out.replace(/\\left\(/g,'{').replace(/\\right\)/g,'}').replace(/\\/g,'\\\\');
       
      // out = out.replace(/}{/g, ')/(');
       //Try to parse text getting rid of curly braces
       var tmp = "['"+out.replace(/{/g,"',['").replace(/}/g,"'],'")+"']";
       console.log(tmp);
       var parsed = eval(tmp);
       cleanEmpty(parsed);
       console.log(parsed);
 
       clearCommands(parsed, type);
       console.log(parsed);
       out = parsed.join(',').replace(/,/g,'').replace(/@/g, ',');
       
       console.log(out);
       out = fixMultiplications(out);
       //Fix pi and e
       if(type==='js'){
               out = out.replace(/#/g,'Math.PI').replace(/e/g,'Math.E').replace(/\?/g,'Number.POSITIVE_INFINITY');                                
       }else if(type==='yacas'){                    
              out = out.replace(/#/g,'Pi').replace(/e/g,'Exp(1)').replace(/\?/g,'Infinity');                  
       }else if(type==='maxima'){                    
              out = out.replace(/#/g,'%pi').replace(/e/g,'%e').replace(/%exp/g,'exp').replace(/\?/g,'infinity');                  
       }else{
              out = out.replace(/#/g,'pi').replace(/\?/g,'infinity');                  
       }
       out = out.replace(/{/g,'(').replace(/}/g,')');
       console.log(out);
       return out;
       };
        
    });
    
    
//The purpose of this filter is to convert from mathlex syntax to any other type,    
// type: latex, sage or tree: added maxima, yacas, js
window.pw.app.register.filter('mathlex', function(){
   return function(mathText, type)
   {
       //Make sure the input text is compatible with mathlex syntax
       
       mathText = fixMultiplications(mathText);       
       //mathlex does only recognize lowercase sin, cos, etc..
       mathText = mathText.replace(/Sin/g,'sin').replace(/Cos/g,'cos').replace(/Tan/g,'tan');
       //mathlex require special symbols to be in # format
       mathText = mathText.replace(/Pi/g,'#pi').replace(/\\pi/g,'#pi').replace(/%pi/g,'#pi').replace(/Math.PI/g,'#pi');
       mathText = mathText.replace(/Exp(1)/g,'#e').replace(/\\e/g,'#e').replace(/%e/g,'#e').replace(/Math.E/g,'#e');       
       //mathlex does not recognize Math.
       mathText = mathText.replace(/Math\./g,'');       
       //mathlex does not recognize \,
       mathText = mathText.replace(/\\,/g,'*');       
       
       //Now perform translation
       
       var out = "";
       try {
                //Important need to load mathlex
                var syntaxTree = MathLex.parse(mathText);
                var stype = type;
                if(type==='maxima' || type==='yacas' || type==='js'){
                    stype = 'sage';
                }
                out = MathLex.render(syntaxTree, stype);
                if(type==='maxima'){
                     out = out.replace(/pi/g,'%pi').replace(/e/g,'%e');
                     out = out.replace(/log/g,'(1/log(10))*log');
                     out = out.replace(/ln/g,'log');
                }
                else if(type==='latex'){
                     out = out.replace(/tan/g,'tg');                     
                }
                else if(type==='yacas'){
                    out = out.replace(/pi/g,'Pi').replace(/e/g,'Exp(1)');
                    out = out.replace(/sin/g,'Sin').replace(/cos/g,'Cos').replace(/tan/g,'Tan');
                    out = out.replace(/sqrt/g,'Sqrt');
                    out = out.replace(/ln/g,'Ln');
                    out = out.replace(/log/g,'(1/(Ln(10)))*Ln');
                }else if(type==='js'){
                    out = out.replace(/pi/g,'Math.PI').replace(/e/g,'Math.E');
                    out = out.replace(/sin/g,'Math.sin').replace(/cos/g,'Math.cos').replace(/tan/g,'Math.tan');
                    out = out.replace(/sqrt/g,'Math.sqrt').replace(/ln/g,'Math.ln');
                    
                    //Transform powers ()^() into Math.pow( , )
                }
                out = out.replace(/,\)/g,')');
            
        }
        catch(err)
        {
            //window.app.DEBUG && console.log(err);
            if(type === 'latex')
            {
                out = "Invalid\\, expression:"+err;
            }       
            console.log("mathlex: Invalid expression: ", mathText, err);
        }
        return out;
   };
});

window.app.register.directive('mathquill', ['Session', '$timeout', '$interval', function (Session, $timeout, $interval) {
    
    var MQ = MathQuill.getInterface(2);
    Session.addCss("assets/libs/mathquill-0.10.1/mathquill.min.css");
    
    return {
        restrict: 'E',
        templateUrl: 'app/shared/mathquill.html',
        replace: true,
        scope: {ngModel: "="},
        controller: ['$scope', function(scope){
    
                console.log("mathquill scope ", scope);
                scope.view = {trig: false, fun:false, sym: false};
                scope.show = {kyb: false};
                
                scope.setView = function(viewName){
                    scope.view = {trig: false, sym: false, fun: false};
                    scope.view[viewName] = true;
                };               
                scope.toggleView = function(viewName){
                    scope.view[viewName] = !scope.view[viewName];
                };                
                scope.insert = function(latex){
                     console.log("mathquill scope ", scope);
                    scope.mathField.write(latex);  
                };  
                scope.insertCmd = function(latex){
                     console.log("mathquill scope ", scope);
                    scope.mathField.cmd(latex);  
                };                 
                scope.clear = function(){
                    if(!scope.editable){
                        //It only deletes editable-blocks content
                        scope.mathField.deleteblocks();  
                        return;
                    }
                   scope.mathField.latex("");  
                };  
                scope.del = function(dir){   
                    //scope.mathField.delete(dir);  
                };  
                scope.move = function(dir){
                    scope.mathField.move(dir);  
                };                  

        }],        
        link: function (scope, element, attrs) {      
          console.log("link mathquill");
          scope.editable = (attrs.embedded==null);
          
          scope.id = 'mathquill_'+Math.random().toString(36).slice(2);
          var toolBars = attrs.toolBars || "*";
          scope.SYM = toolBars.indexOf("SYM")>=0 || toolBars==="*";
          scope.KYB = toolBars.indexOf("KYB")>=0 || toolBars==="*";
          scope.FUN = toolBars.indexOf("FUN")>=0 || toolBars==="*";
          scope.TRIG = toolBars.indexOf("TRIG")>=0 || toolBars==="*";
          
          scope.ngModel = scope.ngModel || "";
          scope.ngModel.id = scope.id;    
          
          var tbs = attrs.toolBars || "";
          scope.tbs = tbs==='simple'? 0:1;
       
          
       
          //Must be called when element is ready
          $timeout(function () {
                var elem = jQuery('#'+scope.id);
                var mathField;
                if(scope.editable){
                    mathField = MQ.MathField(elem[0],  {
                        handlers: {
                          autoFunctionize: "sin cos tan sec csc cot log ln",
                          autoCommands: "pi theta sqrt sum int oo",
                          addCommands: {'oo': ['VanillaSymbol', '\\infty ', '&infin;']},
                          edit: function() {
                            $timeout(function(){
                                scope.ngModel.latex = mathField.latex(); // Get entered math in LaTeX format                            
                                scope.ngModel.text = mathField.text(); // Get entered math in LaTeX format                            
                            });
                          }
                    }});                     
                    elem.addClass('mathquill-full');
                    elem.focus();
                } else{                   
                    mathField = MQ.StaticMath(elem);        
                }
                
                mathField.latex(scope.ngModel.latex || '');   
                
                scope.$watch(attrs.ngModel, function () {                    
                    mathField.latex(scope.ngModel.latex || ''); 
                }); 
                scope.mathField = mathField;
             });                 
        
     
        }               
    };
}]);
    
window.pw.app.register.directive('imVector', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: true,
           scope: { v: '=ngModel' },
           link: function(scope, element, attrs){
               var str = "<span><span mathjax-bind='v.label'>({{v.x}}, {{v.y}}";
               if(scope.v && typeof(scope.v.z)!=='undefined')
               {
                   str += ', {{v.z}}';
               }
               var el = $compile(str+')</span>')(scope);
               element.replaceWith(el);
           }
       };    
    }]);
    
    
window.app.register.directive('imVectorInput', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: true,
           scope: { v: '=ngModel', disabled: '=ngDisabled' },
           link: function(scope, element, attrs){
               var str = "<span><span mathjax-bind='v.label'> </span><span style='font-size:150%'>(</span><input type='text' class='matrixinput' ng-model='v.x' ng-disabled='disabled'/>, <input type='text' class='matrixinput' ng-model='v.y' ng-disabled='disabled'/>";
               if(scope.v && typeof(scope.v.z)!=='undefined')
               {
                   str += ", <input type='text' class='matrixinput' ng-model='v.z' ng-disabled='disabled'/>";
               }
               var el = $compile(str+"<span style='font-size:150%'>)</span></span>")(scope);
               element.replaceWith(el);
              
           }
       };    
    }]);
    
    
window.app.register.directive('imMatrixInput', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: true,
           scope: { matrix: '=ngModel', type: '@type', disabled: '=ngDisabled' },
           link: function(scope, element, attrs){
             if(!scope.type)
             {
                 scope.type = "matrix";
             }
             var str="</span><table border='0' cellpadding='0' cellspacing='2' class='"+scope.type+"'><tbody>";
             str+="<tr ng-repeat='row in matrix'>";
             str+="<td ng-repeat='item in row'><input ng-class=\"item.check===-1?'matrixinput matrixinputwrong':'matrixinput')\" type='text' ng-model='item.v'/></td>";
             str+="</tr></tbody><span></table>";
             var el = $compile(str)(scope);
             element.replaceWith(el);              
           }
       };    
    }]);
    
    
window.app.register.directive('imZeroesInput', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: true,
           scope: { zeroes: '=ngModel', bar: '@var', disabled: '=ngDisabled'
            },
           link: function(scope, element, attrs){
              
            scope.options = ["max","min","other"];
               
            if(!scope.bar){
                scope.bar = 'x';
            }
            var letters = scope.bar.split(",");
            scope.bar = "";
            var sep = "";
            letters.forEach(function(l){
                scope.bar = sep+l;
                sep = ", ";
            });
            
            scope.dim = letters.length;
             
            scope.remove = function(z){ 
                 var i = scope.zeroes.indexOf(z);
                 if(i>=0){ 
                     scope.zeroes.splice(i,1);
                 }
             };
             
             scope.add = function(){ 
                 var obj = {x:'', check:0};
                 if(scope.dim===2){
                     obj = {x:'',y:'',check:0};
                 }
                 else if(scope.dim===3){
                     obj = {x:'',y:'', z:'',check:0};
                 }
                 else if(scope.dim===4){
                     obj = {x:'',y:'', z:'', t:'',check:0};
                 }
                 scope.zeroes.push(obj); 
             };
        
             var str="<table border='0' cellpadding='0' cellspacing='2'><tbody>";
             str+= "<tr ng-repeat='root in zeroes'>";
             str+= "<td><katex>"+scope.bar+"</katex><sub>{{$index+1}}</sub> = ";
             str+= "<input type='text' ng-model='root.x' ng-disabled='disabled' class='rootinput' ng-show='dim>=1'/>";
             str+= "<input type='text' ng-model='root.y' ng-disabled='disabled' class='rootinput' ng-show='dim>=2'/>";
             str+= "<input type='text' ng-model='root.z' ng-disabled='disabled' class='rootinput' ng-show='dim>=3'/>";
             str+= "<input type='text' ng-model='root.t' ng-disabled='disabled' class='rootinput' ng-show='dim>=4'/>";
             str +="<button ng-click='remove(root)' class='btn btn-xs btn-danger' ng-disabled='disabled'>-</button>  ";  
             str +="<img src='assets/img/cross.png' ng-show='root.check==-1'>"
             str +="<img src='assets/img/tick.png' ng-show='root.check==1'>"
             str +="</td></tr></tbody><span></table>"+
                   "<span ng-show='zeroes.length==0'><b>No solution</b><br></span>"+
                   " Add <button ng-click='add()' class='btn btn-xs btn-info' ng-disabled='disabled'>+</button></td><br><small>Per a infinites solucions escriviu: <b>all</b></small>";
             var el = $compile(str)(scope);
             element.replaceWith(el);              
           }
       };    
    }]);
    
window.pw.app.register.directive('imPickList', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: true,
           scope: { v: '=ngModel', disabled: '=ngDisabled' },
           link: function(scope, element, attrs){
               var str = "<span ng-repeat='o in v'><button ng-class=\"o.s?'btn btn-primary':'btn btn-default'\" ng-disabled='disabled' ng-click='o.s=!o.s'>{{o.x}}</button></span>";   
               var el = $compile(str)(scope);
               element.replaceWith(el);   
           }
       };    
    }]);
    
    
window.pw.app.register.directive('imExtremaInput', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: true,
           scope: { extrema: '=ngModel', bar: '@var', disabled: '=ngDisabled'
            },
           link: function(scope, element, attrs){
              
            if(!scope.bar){
                scope.bar = 'x,y';
            }
            var letters = scope.bar.split(",");
            scope.bar = "";
            var sep = "";
            letters.forEach(function(l){
                scope.bar = sep+l;
                sep = ", ";
            });
            
            scope.dim = letters.length;
             
            scope.remove = function(z){ 
                 var i = scope.extrema.indexOf(z);
                 if(i>=0){ 
                     scope.extrema.splice(i,1);
                 }
             };
             
             scope.add = function(){ 
                 var obj = {x:'', check:0};
                 if(scope.dim===2){
                     obj = {x:'',y:'',check:0};
                 }
                 scope.extrema.push(obj); 
             };
        
             var str="<table border='0' cellpadding='0' cellspacing='2'><tbody>";
             str+= "<tr ng-repeat='root in extrema'>";
             str+= "<td><katex>"+scope.bar+"</katex><sub>{{$index+1}}</sub> = ";
             str+= "<input type='text' ng-model='root.x' ng-disabled='disabled' class='rootinput' ng-show='dim>=1'/>";
             str+= "<input type='text' ng-model='root.y' ng-disabled='disabled' class='rootinput' ng-show='dim>=2'/>";
             str+= "<select ng-options='options' ng-model='root.type' ng-disabled='disabled'></select>"
             str+= "<button ng-click='remove(root)' class='btn btn-xs btn-danger' ng-disabled='disabled'>-</button></td>";   
             str+= "<img src='assets/img/cross.png' ng-show='root.check==-1'>"
             str+= "<img src='assets/img/tick.png' ng-show='root.check==1'>"
             str+= "</tr></tbody><span></table>"+
                   "<span ng-show='zeroes.length==0'><em>No extrema</em></span>"+
                   " Add <button ng-click='add()' class='btn btn-xs btn-info' ng-disabled='disabled'>+</button></td>";
             var el = $compile(str)(scope);
             element.replaceWith(el);              
           }
       };    
    }]);
    
    
   window.pw.app.register.directive('imRuffiniInput', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: true,
           scope: { ruffini: '=ngModel', disabled: '=ngDisabled'
            },
           link: function(scope, element, attrs){
              
             if(!scope.ruffini.poly)
             {
                 scope.ruffini.poly = ['', ''];
                                  
             }
             
             if(!scope.ruffini.div)
             {
                 scope.ruffini.div = '';
             }
             
             if(!scope.ruffini.calc)
             {
                 scope.ruffini.calc = new Array(scope.ruffini-1);
             }
             
             if(!scope.ruffini.quoc)
             {
                 scope.ruffini.quoc = new Array(scope.ruffini);
             }
             
             var dim = scope.ruffini.poly.length;
        
             var str="<table border='0' cellpadding='0' cellspacing='2'><tbody>";
             str+= "<tr><td style='border-left: thick double #ff0000'></td>";
             str+= "<td ng-repeat='c in ruffini.poly'>{{c}}</td>";
             str+= "</tr>";
             str+= "<tr><td style='border-left: thick double #ff0000'><input type='text' ng-model='ruffini.div'/></td><td></td>";
             str+= "<td ng-repeat='c in ruffini.calc'><input type='text' ng-model='c'/></td>";
             str+= "</tr>";
             str+= "<tr><td syle='border-left: thick double #ff0000; border-top: thick double #ff0000;'></td>";
             str+= "<td style='border-top: thick double #ff0000;' ng-repeat='c in ruffini.quoc'><input type='text' ng-model='c'/></td>";
             str+= "</tr>";
             str+= "</tbody></table>";
             
             var el = $compile(str)(scope);
             element.replaceWith(el);              
           }
       };    
    }]);


window.app.register.directive('autoGrow', function () {
    return function(scope, element, attr) {

        var opts = {
            maxWidth: parseInt(attr.maxWidth) || 1000,
            minWidth: parseInt(attr.minWidth) || element.width(),
            comfortZone: parseInt(attr.comfortZone) || 10
        };

        var minWidth = opts.minWidth;
        var val = '';
        var input = element;

        var $shadow = angular.element('<div></div>').css({
            position: 'absolute',
            top: -10000,
            left: -10000,
            width: 'auto',
            fontSize: element.css('fontSize'),
            fontFamily: element.css('fontFamily'),
            fontWeight: element.css('fontWeight'),
            letterSpacing: input.css('letterSpacing'),
            whitespace: 'nowrap'
        });

        $shadow.insertAfter(element);
 
        var update = function() {
            if (val === (val = input.val())) {return;}

            // Enter new content into the shadow element
            var escaped = val.replace(/&/g, '&amp;').replace(/\s/g,'&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            $shadow.html(escaped);

            // Calculate new width + whether to change
            var testerWidth = $shadow.width(),
                newWidth = (testerWidth + opts.comfortZone) >= minWidth ? testerWidth + opts.comfortZone : minWidth,
                currentWidth = input.width(),
                isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                                     || (newWidth > minWidth && newWidth < opts.maxWidth);

            // Animate width
            if (isValidWidthChange) {
                input.width(newWidth);
            }
            if (newWidth >= opts.maxWidth) {
                input.width(opts.maxWidth);
            }
        }
 
        if (attr.ngModel) { scope.$watch(attr.ngModel, update); }
        else { element.bind('keyup keydown keypress change', update); }

        update();
    };
});
 
    //It only works for text gaps
   window.pw.app.register.directive('imFillTextGaps', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: false,
           scope: {userinput: '=ngModel', disabled: '=ngDisabled', expression: "=expression" },
           link: function(scope, element, attrs){               
               var update = function(value){
                  
                    var id = 0;
                    scope.expression = value;
                    var str = value;
                    (scope.expression.match(/\?/g) || []).forEach(function(e){
                        //Replace ? with an input box
                        scope.userinput['blank'+id] = "";
                        str = str.replace('?', "<input type='text' ng-model='userinput.blank"+id+"' auto-grow ng-disabled='disabled' style='width:20px;'/>");
                        id += 1;
                    });                                          
                    //var el = $compile("<div>"+str+"</div>")(scope);                    
                    //element.replaceWith(el);
                    element.html(str);
                    $compile(element.contents())(scope);
                };
               
               var unwatch = scope.$watch("expression", update);                
               //scope.$on('$destroy', unwatch());
           }
       };    
    }]);

    //Uses mathquill replacing every ? by \\editable{}
   window.pw.app.register.directive('imFillMathGaps', ['$compile', '$timeout', 'Session', function($compile, $timeout, Session){ 
       return {
           restrict: 'A',
           replace: false,
           scope: {disabled: '=ngDisabled', imFillMathGaps: "=imFillMathGaps", id: "=id" },
           link: function(scope, element, attrs){     
               Session.addCss("assets/libs/mathquill/mathquill.css");
               var update = function(value){                    
                    var id = scope.id;
                    scope.imFillMathGaps = value;
                    var str = value;
                    str = str.replace(/\?/g, "\\editable{}");
                    console.log("STR IS "+str);
                    $timeout(function(){
                        var mathquill = jQuery('#'+id);
                        mathquill.mathquill();
                        mathquill.mathquill('latex', str || '');             
                    }, 600);
                };
               
               console.log(scope.imFillMathGaps);
               update(scope.imFillMathGaps);
               var unwatch = scope.$watch("imFillMathGaps", update);                
               //scope.$on('$destroy', unwatch());
           }
       };    
    }]);

    //kahootInput
   window.pw.app.register.directive('imKahootInput', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: false,
           scope: {disabled: '=ngDisabled', ngModel: "=", options: "=", done: "=" },
           controller: ['$scope', function($scope){
                   $scope.select = function(pos){
                         if($scope.ngModel!==null){
                           if(typeof($scope.ngModel)==='function'){
                                $scope.ngModel(pos);
                            } else {
                                $scope.ngModel = $scope.options[pos];
                            }
                       }                        
                   };
           }],
           link: function(scope, element, attrs){     
             var colors = ['red', 'blue', 'green', 'orange', 'yellow', 'brown', 'olive', 'pink'];
             var str="<table border='0' cellpadding='5px' cellspacing='5px' style='width:100%'><tbody>";
               var cols = Math.floor(scope.options.length / 2);
               for(var i=0; i<2; i++){
                   str+="<tr>";                   
                   for(var j=0; j<cols; j++){
                       var pos = cols*i + j;
                       if(pos < scope.options.length){
                           str+="<td><button ng-disabled=\"disabled\" ng-style=\"{'cursor': done?'not-allowed':'pointer', 'pointer-events': done?'none':'auto'}\" style='min-height:180px; color:white; font-size: 20pt; background-color:"+colors[pos % 8]+"; width:100%; height:100%;' ng-click=\"!done && select("+pos+")\"><span compile=\"options["+pos+"]\"></span></button></td>";
                        }
                   }
                   str+="</tr>";
               }
             str+= "</tbody></table>";
              
             var el = $compile(str)(scope);
             element.replaceWith(el);              
           }
       };    
    }]);


   window.pw.app.register.directive('imDynamicForm', ['$compile', function($compile){ 
       return {
           restrict: 'E',
           replace: false,
           scope: {disabled: '=ngDisabled', ngModel: "=", view: "="},
           controller: ['$scope', function($scope){
                   $scope.select = function(pos){
                       if($scope.ngModel){
                           $scope.ngModel(pos);
                       }                        
                   };
           }],
           link: function(scope, element, attrs){     
            var colors = ['red', 'blue', 'green', 'orange', 'yellow', 'brown', 'olive', 'pink'];
            var str = "";
            for(var i=0; i<scope.view.length; i++){
                var v = scope.view[i];
                var vt = (v.type || "").toLowerCase();
                if( vt === 'number'){
                    str += "<span compile='view["+i+"].title'></span> <input type='number' ng-model = 'ngModel."+v.name+"'/><br>";
                    
                } else if( vt === 'textarea'){
                    str += "<span compile='view["+i+"].title'></span><br> <textarea ng-model = 'ngModel."+v.name+"'></textarea><br>";
                    
                } else if( vt === 'checkbox'){
                    str += "<input type='checkbox' ng-model = 'ngModel."+v.name+"'> <span compile='view["+i+"].title'></span><br>";
                    
                }
                else if( vt === 'combobox'){
                    str += "<span compile='view["+i+"].title'></span> <select ng-model = 'ngModel."+v.name+"'><option ng-repeat='o in view["+i+"].options' value='{{o.value}}'>{{o.label}}</option></select><br>";
                    
                } else {
                    str += "<span compile='view["+i+"].title'></span> <input ng-model = 'ngModel."+v.name+"'/><br>";
                }
            }
            
            console.log(str);
            
            var el = $compile(str)(scope);
            element.replaceWith(el);              
           }
       };    
    }]);
});


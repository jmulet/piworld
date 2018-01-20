 //The returned functions are in mathlex syntax by default
define([], function(){
   
   var F = F || {};
   
   F.config = {min:-5, max:5};
   
   F.types = {"Lineal":0, "Quadratic":1, "Radical":2, "Hyperbole":3, "Exponential":4, "Logarithm":5, "Trigonometric":6};
   
   F.getTypeName = function(id){
       var name = "";
       for(var key in F.types){
           if(F.types[key]==id){
            name = key;
            break;
            }
        }
       return name;
   };
   
   Math.logBase = Math.logBase || function(n, base) {
        return Math.log(n) / Math.log(base);
    };
    
   var random = function()
   {
       return Math.floor(Math.random()*(F.config.max-F.config.min)+F.config.min);
   };
   
   var applyProduct = function(c, p, bar){
        var str = "";
        if(c){
            if(c===1){
                str = bar;
            } else if(c===-1){
                str = "-"+bar;
            } else{
                str =c+p+bar;
            }           
        }
        return str;
   };
   
   var apply = function(str, v, bar){
        if (v)
        {
            if (v > 0)
            {
                str += "+";
            }
            str += " " + v;
            if(bar){
                str += bar;
            }
        }
        return str;
   };
   
   var applyOne = function(str, v)
   {
        if (v === -1)
        {
            str += "-";
        }
        else if (v === 1)
        {
            str += "";
        }
        else
        {
            str += v;
        }
        return str;
   };
   
   var applyOneOp = function(str, v, op)
   {
        if (v === -1)
        {
            str += "-";
        }
        else if (v === 1)
        {
            str += "";
        }
        else
        {
            str += v+op;
        }
        return str;
   };
   
   // y = mx+n
   F.Lineal = function(m, n)
   {
       this.m = m || 1;
       this.n = n;
       
       this.getType = function(){
            return F.types.Lineal;
       };
       
       this.eval = function(x)
       {
           return this.m*x + this.n;
       }; 
       
       this.toLaTeX = function(x){
           x = x || 'x';
           if(x.length>1){
                x = "("+x+")";
           }
           var str = ""+applyProduct(this.m,"\\cdot ",x);
           return apply(str, this.n);
       };
       
       this.toMaxima = function(x){
           x = x || 'x';
           if(x.length>1){
                   x = "("+x+")";
           }
           var str = ""+applyProduct(this.m,"*",x);
           return apply(str, this.n);
       };
       
       this.toYacas = function(x){
          return this.toMaxima(x);
       };
       
       this.toJS = function(x){
           return this.toMaxima(x);
       };
       
       this.toMathLeX = function(x){
           return this.toMaxima(x);
       };
       
       this.toString = function(x)
       {
           return this.toLaTeX(x);
       };   
       
       this.getInverse =  function(){
            return new F.lineal(1/this.m, -this.n/this.m);
       };
       
       this.getDomain = function(){
            return "R";
       };
       
       this.getRange = function(){
            return "R";
       };
   };
   
   F.Lineal.random = function()
   {
        var m = 0;
        while(m===0)
        {
            m = random();
        };
        return new F.Lineal(m, random());
   };
   
   // y = a*x^2 + b*x + c
   F.Quadratic = function(a,b,c)
   {
       this.a = a || 1;
       this.b = b;
       this.c = c;
       
       this.getType = function(){
            return F.types.Quadratic;
       };
    
       this.eval = function(x)
       {
           return (this.a*x + this.b)*x + this.c;
       };
       
       this.toLaTeX = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "" + applyProduct(this.a, "\\,", x + "^2");
            str = apply(str, this.b, "\\," + x);
            str = apply(str, this.c);
            return str;
       };
       
       this.toMaxima = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "" + applyProduct(this.a, "*", x + "^2");
            str = apply(str, this.b, "*" + x);
            str = apply(str, this.c);
            return str;
       };
       
       this.toYacas = function(x){
          return this.toMaxima(x);
       };
       
       this.toJS = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "" + applyProduct(this.a, "*", x + "*"+x);
            str = apply(str, this.b, "*" + x);
            str = apply(str, this.c);
            return str;
       };
       
       this.toMathLeX = function(x){
           return this.toMaxima(x);
       };
       
       this.toString = function(x)
       {
           return this.toLaTeX(x);
       };  
       
       this.getExtrema = function(){
           return -this.b/(2*this.a);
       };
       
       this.getDomain = function(){
            return "R";
       };
       
       this.getRange = function(){
           var y = this.eval(this.getExtrema());
           if(this.a>0)
           {
               return "["+y+", +inf)";
           }
           else{
               return "(-inf, "+y+"]";
           }
           
           
       };
   };
   
   F.Quadratic.random = function()
   {
        var a = 0;
        while(a===0)
        {
            a = random();
        };
        return new F.Quadratic(a, random(), random());
   };
   
   
   // y = b*sqrt(x+a)+c
   F.Radical = function(a, b)
   {
       this.a = a || 0;
       this.b = b || 1;
       
       this.getType = function(){
            return F.types.Radical;
       };
       
       this.eval = function(x)
       {
           return this.b*Math.sqrt(x+this.a);
       };
       
       this.toLaTeX = function(x){
           x = x || 'x';
           if(x.length>1){
                x = "("+x+")";
           }
            var str = "";
            if (this.b !== 1) {
                str += this.b + "\\,";
            }
            str += "\\sqrt{" + x;
            str = apply(str, this.b) + "}";

            return str;
           
       };
       
       this.toMaxima = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "";
            if (this.b !== 1) {
                str += this.b + "*";
            }
            str += "sqrt(" + x;
            str = apply(str, this.b)+")";
            return str;
       };
       
       this.toYacas = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "";
            if (this.b !== 1) {
                str += this.b + "*";
            }
            str += "Sqrt(" + x;
            str = apply(str, this.b)+")";
            return str;
       };
       
       this.toJS = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "";
            if (this.b !== 1) {
                str += this.b + "*";
            }
            str += "Math.sqrt(" + x;
            str = apply(str, this.b)+")";
            return str;
       };
       
       this.toMathLeX = function(x){
           return this.toMaxima(x);
       };
       
       this.toString = function(x)
       {
           return this.toLaTeX(x);
       };   
        
       this.getInverse =  function(){
            return new F.Quadratic(1/this.b^2,0,-this.a);
       };
       
       this.getDomain = function(){
            return "["+(-this.a)+", +inf)";
       };
       
       this.getRange = function(){
           var y = this.eval(this.getExtrema());
           if(this.b>0)
           {
               return "[0, +inf)";
           }
           else{
               return "(-inf, 0]";
           }
       };
   };
   
   F.Radical.random = function()
   {
        var b = 0;
        while(b===0)
        {
            b = random();
        };
        return new F.Radical(random(), b);
   };
   
   
   // y = b / (x+a) + c
   F.Hyperbole = function(a, b, c)
   {
       this.a = a || 0;
       this.b = b || 1;
       this.c = c || 0;
       
       this.getType = function(){
            return F.types.Hyperbole;
       };
       
       this.eval = function(x)
       {
           return this.b/(x+this.a) + this.c;
       };
       
        this.toLaTeX = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "\\frac{" + this.b + "}{" + x;
            str = apply(str, this.a) + "} ";
            str = apply(str, this.c);
            return str;
           
       };
       
       this.toMaxima = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = '' + this.b + "/(" + x;
            str = apply(str, this.a) + ")";
            str = apply(str, this.c);
            return str;
       };
       
       this.toYacas = function(x){            
            return this.toMaxima(x);
       };
       
       this.toJS = function(x){
            return this.toMaxima(x);
       };
       
       this.toMathLeX = function(x){
           return this.toMaxima(x);
       };
       
       this.toString = function(x)
       {
           return this.toLaTeX(x);
       };   
        
       this.getInverse =  function(){
            return new F.Hyperbole(-this.c, this.b, -this.a);
       };
       
       this.getDomain = function(){
            return "(-inf, "+this.a+")U("+this.a+", +inf)";
       };
       
       this.getRange = function(){
            return "(-inf, "+this.c+")U("+this.c+", +inf)";
       };
   };
   
   F.Hyperbole.randomopts = {inverse: false};
   
   F.Hyperbole.random = function()
   {
        var b = 0;
        while(b===0)
        {
            b = random();
        };
        var c = 0;
        if(!F.Hyperbole.randomopts.inverse){
            c = random();
        }
        return new F.Hyperbole(random(), b, c);
   };
   
   // y = a^x or y=e^x
   F.Exponential = function(a)
   {
       this.a = Math.abs(a);
       
       this.getType = function(){
            return F.types.Exponential;
       };
       
       this.eval = function(x)
       {
           return Math.pow(this.a, x);
       };
       
        
       this.toLaTeX = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            if (this.a > 1)
            {
                return this.a === Math.E ? "e^" + x : '' + this.a + "^" + x;
            }
            else
            {
                return '(\\frac{1}{' + (1 / this.a) + "})^" + x;
            }
           
       };
       
       this.toMaxima = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }      
            if (this.a > 1)
            {
                 return this.a === Math.E? "exp("+x+")" : "("+this.a+")^"+x;
            }
            else
            {
                return '(1/' + (1 / this.a) + ")^" + x;
            }
           
       };
       
       this.toYacas = function(x){            
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }      
            if (this.a > 1)
            {
                 return this.a === Math.E? "Exp("+x+")" : "("+this.a+")^"+x;
            }
            else
            {
                return '(1/' + (1 / this.a) + ")^" + x;
            }
       };
       
       this.toJS = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }                   
            return "Math.pow("+this.a+","+x+")";            
       };
       
       this.toMathLeX = function(x){
           return this.toMaxima(x);
       };
       
       this.toString = function(x)
       {
           return this.toLaTeX(x);
       };   
       
       
       this.getInverse =  function(){
            return new F.Logarithm(this.a);
       };
       
       this.getDomain = function(){
            return "R";
       };
       
       this.getRange = function(){
            return "(0, +inf)";
       };
   };
   
   F.Exponential.randomopts = {basegt1: false, basecommon: false}; 
   
   F.Exponential.random = function()
   {
       if(F.Exponential.randomopts.basecommon){
           if(Math.random()<0.5){
                a = Math.E;
            }
            else{
                a = 10;
            }
            return new F.Exponential(a);
       }
       
       var a = Math.floor(Math.random()*10+2);
       if(Math.random()<0.1){
           a = Math.E;
       }
       else if(Math.random()<0.5 && ! F.Exponential.randomopts.basegt1){
           a = 1/a;
       }
       return new F.Exponential(a);
   };
   
   // y = log_a x  or y= ln x
   F.Logarithm = function(a)
   {
       this.a = Math.abs(a);
       
       this.getType = function(){
            return F.types.Logarithm;
       };
       
       this.eval = function(x)
       {
           return Math.logBase(x, this.a);
       };
       
        this.toLaTeX = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            if (this.a > 1)
            {
                return this.a === Math.E ? "\\ln(" + x + ")" : "\\log_{" + this.a + "}(" + x + ")";
            }
            else
            {
                return "\\log_{\\frac{1}{" + (1 / this.a) + "}}(" + x + ")";
            }
           
       };
       
       this.toMaxima = function(x){
             x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            if(this.a === Math.E){
                return "log("+x+")";
            } else {
                return this.a>1? "log("+x+")/log("+this.a+")"  :  "-log("+x+")/log("+(1/this.a)+")";  
            }
           
       };
       
       this.toYacas = function(x){            
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            if(this.a === Math.E){
                return "Ln("+x+")";
            } else {
                return this.a>1? "Ln("+x+")/Ln("+this.a+")"  :  "-Ln("+x+")/Ln("+(1/this.a)+")";  
            }
             
       };
       
       this.toJS = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }                   
            return "Math.log("+x+")/Math.log("+this.a+")";            
       };
       
       this.toMathLeX = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            if (this.a > 1)
            {
                return this.a === Math.E ? "ln(" + x + ")" : "log(" + x + "," + this.a + ")";
            }
            else
            {
                return "log(" + x + ", 1/" + (1/this.a) + ")";
            }
       };
       
       this.toString = function(x)
       {
           return this.toLaTeX(x);
       };
        
       
       this.getInverse =  function(){
            return new F.Exponential(this.a);
       };
       
       this.getDomain = function(){
            return "(0, +inf)";
       };
       
       this.getRange = function(){
            return "R";
       };
   };
   
   F.Logarithm.randomopts = {basegt1: false, basecommon: false};
   
   F.Logarithm.random = function()
   {
       if(F.Logarithm.randomopts.basecommon){
           if(Math.random()<0.5){
                a = Math.E;
            }
            else{
                a = 10;
            }
            return new F.Logarithm(a);
       }
       
       var a = Math.floor(Math.random()*10+2);
       if(Math.random()<0.1){
           a = Math.E;
       }
       else if(Math.random()<0.5 && ! F.Logarithm.randomopts.basegt1){
           a = 1/a;
       }
       return new F.Logarithm(a);
   };
   
   //t=sin, cos, tan  e.g.  b*sin(a*x)
   F.Trigonometric = function(t, a, b)
   {
        this.t = t || "sin";
        this.a = a || 1;
        this.b = b || 1;

        this.getType = function () {
            return F.types.Trigonometric;
        };

        this.eval = function (x)
        {
            return this.b*Math[this.t](this.a*x);
        };
        
       this.toLaTeX = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var func;
            if (this.t === 'tan')
            {
                func = "\\,tg\\,";
            }
            else
            {
                func = "\\" + this.t;
            }

            var str = "";
            str = applyOne(str, this.b) + func + "(";
            str += applyProduct( this.a , "\\, " , x) + ")";

            return str;
           
       };
       
       this.toMaxima = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "";
            str = applyOneOp(str, this.b, '*') +this.t + "(";
            str += applyProduct(this.a, "*", x) + ")";
 
            return str;
           
       };
       
       this.toYacas = function(x){            
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "";
            str = applyOneOp(str, this.b, '*') + this.t[0].toUpperCase()+this.t.toLowerCase().substring(1) + "(";
            str += applyProduct(this.a , "*", x) + ")";
 
            return str;
             
       };
       
       this.toJS = function(x){
            x = x || 'x';
            if (x.length > 1) {
                x = "(" + x + ")";
            }
            var str = "";
            str = this.b + "*Math."+this.t + "(";
            str += applyProduct( this.a, "*", x) + ")";
 
            return str;         
       };
       
       this.toMathLeX = function(x){
            return this.toMaxima(x);
       };
       
       this.toString = function(x)
       {
           return this.toLaTeX(x);
       };

         

        this.getDomain = function () {
            if(this.t==='tan')
            {
                return "R-{n pi/2}";
            }
            else
            {
                return "R";
            }
        };

        this.getRange = function () {
            if(this.t==='tan')
            {
                return "R";
            }
            else
            {
                return "[-1,1]";
            }
       };
   };
   
   F.Trigonometric.randomopts = {list: ['sin','cos','tan']};
   
   F.Trigonometric.random = function(){
       
       var t = F.Trigonometric.randomopts.list[Math.floor(Math.random()*F.Trigonometric.randomopts.list.length)];
       var a = 0, b = 0;
       while(a===0){
           a = Math.abs(random());
       }
       while(b===0){
           b = random();
       }
       return new F.Trigonometric(t, a, b);
   };
   
   /**
    * Added options in this function
    * opts.Type.randomopts =
    * @param {type} opts
    * @returns {unresolved}
    */
   F.random = function(mylist){              
       var list;
       if($.isArray(mylist)){
           list = [];
           mylist.forEach(function(e){
              list.push(F[e].random); 
           });
       } else if(typeof(mylist)==="number"){
           switch(mylist){                
               case  F.types.Lineal: return F.Lineal.random();
               case  F.types.Quadratic: return F.Quadratic.random();
               case  F.types.Radical: return F.Radical.random();
               case  F.types.Hyperbole: return F.Hyperbole.random();
               case  F.types.Exponential: return F.Exponential.random();
               case  F.types.Logarithm: return F.Logarithm.random();
               default: return F.Trigonometric.random();
           }
       }
       else 
       {        
       
            list  = [F.Lineal.random, F.Quadratic.random, F.Radical.random, 
                   F.Hyperbole.random, F.Exponential.random, F.Logarithm.random,
                   F.Trigonometric.random];
       };
       var pick = list[Math.floor(Math.random()*list.length)];
       
       return pick();
   };

   F.random.defaults = function(){
       F.Hyperbole.randomopts = {inverse: false};
       F.Trigonometric.randomopts = {list: ['sin','cos','tan']};
       F.Exponential.randomopts = {basegt1: false, basecommon: false}; 
       F.Logarithm.randomopts = {basegt1: false, basecommon: false};
   };
   
   F.random.simple = function(){
       F.Hyperbole.randomopts = {inverse: true};
       F.Trigonometric.randomopts = {list: ['sin','cos','tan']};
       F.Exponential.randomopts = {basegt1: true, basecommon: false}; 
       F.Logarithm.randomopts = {basegt1: true, basecommon: true};
   };
   
   /**
    * Generates a random funcion with complexity n
    * from bloc funtions in funcs list and operations in ops
    * which can be + - * / and comp
    * @param {type} n
    * @param {type} ops
    * @param {type} funcs
    * @returns {undefined}
    */
   F.rfunction = function(n, ops, funcs){
       var op = ops.random();
       var f1 = funcs.random();
       var f2 = funcs.random();
       
       var str = "";
       if(op === '+'){
           str = f1.toString('x')+" "+op+" "+f2.toString('x');
       }
       else if(op === '-'){
           str = f1.toString('x')+" " +op+" ("+f2.toString('x')+")";
       }
       else if(op === '*' || op === '/'){
           str = "("+f1.toString('x')+") "+op+" ("+f2.toString('x')+")";
       }
       else if(op === 'comp'){
           str = f1.toString(f2.toString('x'));
       }
       return str;       
   };
   
   return F;
   
});


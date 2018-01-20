define(['/activities/libs/math/ratio.js'], function(Ratio){
     
//function isArray(value)
//{
//  return Object.prototype.toString.call(value) === '[object Array]';
//}

var ran = function(min, max){
    return Math.floor(Math.random()*(max-min))+min;
};

/*
*   Stack implementation in JavaScript
*/

function Stack(){
    this.top = null;
    this.count = 0;

    this.getCount = function(){
        return this.count;
    }

    this.getTop = function(){
        return this.top;
    }

    this.push = function(data){
        var node = {
            data : data,
            next : null
        }

        node.next = this.top;
        this.top = node;

        this.count++;
    }

    this.peek = function(){
        if(this.top === null){
            return null;
        }else{
            return this.top.data;
        }
    }

    this.pop = function(){
        if(this.top === null){
            return null;
        }else{
            var out = this.top;
            this.top = this.top.next;
            if(this.count>0){
                this.count--;
            }

            return out.data;
        }
    }

    this.displayAll = function(){
        if(this.top === null){
            return null;
        }else{
            var arr = new Array();

            var current = this.top;
            //console.log(current);
            for(var i = 0;i<this.count;i++){
                arr[i] = current.data;
                current = current.next;
            }

            return arr;
        }
    };
};


var validateExpression = function(expr){
 
      var r = expr.split('');
      var s = expr.split('');
      var st = new Stack();
      var i = 0;
      while (i < s.length)
      {
          if (s[i] === '(') {
              if (s[i + 1] === '(') {
                  st.push(-i);
                } else {
                    st.push(i);
             }
               i++;
            } else if (s[i] !== ')' && s[i] !== '(') {
                i++;
            } else if (s[i] === ')') {
               var top = st.peek();
                if (s[i - 1] === ')' && top < 0) {
                  r[-top] = '$';
                  r[i] = '$';
                  st.pop();
               }
               else if (s[i - 1] === ')' && top > 0) {
                   console.log("Something is wrong!!");
             }
               else if (s[i - 1] !== ')' && top > 0)
                 st.pop();
               i++;
            }
     };
       
       var result = "";
       for (i = 0; i<r.length; i++) {
           if (r[i] === '$') {               
              continue;
              
           }
           result += r[i];
        }
       return result;
};


var Expr = function(l, r, op){
    this.l = l;
    this.r = r;
    this.op = op;
    
    this.toString = function(){
        var left = typeof(this.l)==='object'? this.l.toString():this.l;
        var right =typeof(this.r)==='object'? this.r.toString():this.r;
        return "(("+left+")"+this.op+"("+right+"))";
    };
    
    this.value = function(){
        return eval(this.toString());
    };
};

var rExpr1 = function(n, vmax, a, b){
       
        var v1 = rent1(0, vmax, a, b);
        var v2 = rent1(0, vmax, a, b);
        //operacions amb dos nombres
        var ops = ['+', '-', '*', "/"];
        var op = ops.random();
        if (op === '/' && v2 === 0)
        {
            while (v2 === 0)
            {
                v2 = rent1(0, vmax, a, b);
            }
        }

        if (op === '/' && v1 % v2 !== 0)
        {
            var v3 = rent1(0, 10, false, false);
            v1 = v3 * v2;
        }

        var expr = new Expr(v1, v2, op);

        if (n === 1)
        {
            return expr;
        }
        else
        {
            var modifyleft = Math.random() < 0.5;

            if (modifyleft) {
                expr.l = rExpr1(n - 1, vmax, a, b);
            }
            else {
                expr.r = rExpr1(n - 1, vmax, a, b);
            }
            return expr;
    }
        
    
};

var rent1 = function(n, vmax, a, b)
{    
    if(n===0)
    {
        //simply one number
        var rnd = ran(a?-vmax:0, vmax);
        while(rnd===0 && !b)
        {
            rnd = ran(a?-vmax:0, vmax);
        }
        return rnd;
    }
    else if(n>=1)
    {
       
        return validateExpression(rExpr1(n, vmax, a, b).toString());
    } 
};

var rfrac = function(n, vmax, a, b){
    
    if(n===0)
    {
        var num = rent1(0, vmax, a, b);
        var den = Math.abs(rent1(0, vmax, a, false));
        return new Ratio(num, den);
    }
    else
    {
        var r1 = rfrac(0, vmax, a, b);
        var r2 = rfrac(0, vmax, a, b);
        return r1.toString()+" + "+r2.toString();
    }
    
};

var compareLists= function(list1, list2)
{
   
    var rs1 = [];
    var rs2 = [];
    
    if(typeof(list1)==="string"){
         list1 = list1.split(",");
    }
    if(typeof(list2)==="string"){
        list2 = list2.split(",");
    }
    
    //console.log(list1);
    ////console.log(list2);
    
    list1.forEach(function(e){
        var v = e;
        if(typeof(v)==='object'){
            v = v.x;
        }
        
        var val = null;
        console.log(v);
        if(v==='all')
        {
            val = v;
        }
        else{
             v = (""+v).replace(/sqrt\(/g,'Math.sqrt(');
             try{
                val = parseFloat(eval(v));
            }catch(ex){};
        }
        //console.log(val);
        if(val==='all' || !isNaN(val))
        {
            rs1.push(val);
        }
    });
    
    var listofobjs = false;
    list2.forEach(function(e){
        var v = e;
        if(typeof(v)==='object'){
            if(v.s==null || (v.s!=null && v.s==1))
            {
                v = v.x;
            }
            else
            {
                v = null;
            }
            
            listofobjs = true;
        }
        if(v!==null)
        {
            var val = null;
            if(v==='all')
            {
                val = v;
            }
            else
            {
                v = (""+v).replace(/sqrt\(/g,'Math.sqrt(');
                try{
                    val = parseFloat(eval(v));
                }catch(ex)
                {                
                }
            }
            if(val==='all' || !isNaN(val))
            {
                rs2.push(val);
            }
        }
    }); 
    
    //console.log(rs1);
    //console.log(rs2);
    
    //First check if rs2 contains all items from rs1
    var ok = true;
    rs2.forEach(function(e2){
         if(rs1.indexOf(e2)<0)
        {
            ok = false;
            //console.log("array1 not contains "+e2);
            if(listofobjs)
            {
                for(var i=0; i<list2.length; i++){
                    if(e2==list2[i].x){
                        list2[i].check = -1;
                        break;
                    }
                }
            }
        }
        else
        {
            if(listofobjs)
            {
                for(var i=0; i<list2.length; i++){
                    if(e2==list2[i].x){
                        list2[i].check = 1;
                        break;
                    }
                }
            }
        }
    });
    
    //console.log(list2);
    
    if(ok)
    {
        rs1.forEach(function(e1){
        if(rs2.indexOf(e1)<0)
        {
            ok = false;
           // console.log("array2 not contains "+e1);
        }
    }); 
    }
    return ok;
};

var divisors = function(num){
    var list = [];
    for(var i=1; i<=num; i++){
        if(num % i === 0){
            list.push(i);
        }
    }
    return list;
};

var _gcd = function(a, b)
{
    while (b > 0)
    {
        var temp = b;
        b = a % b; // % is remainder
        a = temp;
    }
    return a;
};

var gcd = function(list){

    var result = list[0];
    for(var i = 1; i < list.length; i++) {
        result = _gcd(result, list[i]);
    }
    return result;

};

var _lcm = function(a, b)
{
    return a * (b / _gcd(a, b));
};

var lcm = function(list)
{
    var result = list[0];
    for(var i = 1; i < list.length; i++){
        result = _lcm(result, list[i]);
    }
    return result;
};

var _isPrime = function(value) {
    for(var i = 2; i < value; i++) {
        if(value % i === 0) {
            return false;
        }
    }
    return value > 1;
};

var filterPrimes = function(list){  
    return list.filter(function(n){
        return _isPrime(n);
    });
};

var removePrimes = function(list){  
    return list.filter(function(n){
        return !_isPrime(n);
    });
};

var templateProcess = function(intemplate, args){
    var template = intemplate+"";
    console.log("TemplateProcess in>"+template);
    template = template.replace(/ /g, '');
    //These are replaced with the same value
    args = args || {};
    var range = args.range || 10;
    for(var i=0; i<11; i++)
    {
        var r = new RegExp("N0_"+i, "g");
        var ran = rent1(0,10,false,true);
        template = template.replace(r, ran);
        r = new RegExp("N0n_"+i, "g");
        template = template.replace(r, ran*rent1(0,range,false,false));
        
        r = new RegExp("N_"+i, "g");
        ran = rent1(0,10,false,false);
        template = template.replace(r, ran);
        r = new RegExp("Nn_"+i, "g");
        template = template.replace(r, ran*rent1(0,range,false,false));
        
        r = new RegExp("Z0_"+i, "g"); 
        ran = rent1(0,10,true,true);
        template = template.replace(r, ran);
         r = new RegExp("Z0n_"+i, "g");
        template = template.replace(r, ran*rent1(0,range,false,false));
        
        r = new RegExp("ZZ_"+i, "g");
        ran = rent1(0,10,true,true);
        template = template.replace(r, '(+'+ran+")");
        r = new RegExp("ZZn_"+i, "g");
        template = template.replace(r, '(+'+ran*rent1(0,range,false,false)+")");
        
        r = new RegExp("Z_"+i, "g");
        var ran = rent1(0,10,true,false);
        template = template.replace(r, ran);
        r = new RegExp("Zn_"+i, "g");
        template = template.replace(r, ran*rent1(0,range,false,false));
    }
    
    //These are replaced with different values
    while(template.indexOf('N0')>=0)
    {
        template = template.replace('N0', rent1(0,range,false,true));
    }
    while(template.indexOf('N')>=0)
    {
        template = template.replace('N', rent1(0,range,false,false));
    }
    while(template.indexOf('Z0')>=0)
    {
        template = template.replace('Z0', rent1(0,range,true,true));
    }
    while(template.indexOf('ZZ')>=0)
    {
        template = template.replace('ZZ', '(+'+rent1(0,range,true,true)+")");
    }
    while(template.indexOf('Z')>=0)
    {
        template = template.replace('Z', rent1(0,range,true,false));
    }
    template = template.replace(/\+\+/g,'+').replace(/\+\-/g,'-').replace(/\-\+/g,'-').replace(/\-\-/g,'+');
    
    //Now, all parts within {...} must be evaluated.
    var result = template.match(/{(.*?)}/g);
    
    if(result){
        result.map(function(val){
            var evaluated = 0;
            console.log("eval "+val);
            //var reg = new RegExp(val.replace('{','\\{').replace('}','\\}'),'g');
            try{
                evaluated = eval(val.replace('{','').replace('}',''));
                 
            }catch(ex){
                console.log(ex);
            }
            template = template.replace(val, evaluated);
        });
    }
    template = template.replace(/\+\+/g,'+').replace(/\+\-/g,'-').replace(/\-\+/g,'-').replace(/\-\-/g,'+');
    console.log("TemplateProcess out>"+template);
    return template;
};

/**
 * converts a string in html format in latex format
 * for most common commands
 * @param {type} str
 * @returns {undefined}c
 */
var html2latex = function(str){
    var latex = str;
    latex = latex.replace(/<katex>/g,'$').replace(/<\/katex>/g,'$');
    latex = latex.replace(/<b>/g,'\\textbf{').replace(/<\/b>/g,'}');
    latex = latex.replace(/<i>/g,'\\textit{').replace(/<\/i/g,'}');
    return latex;
};

//var p = Poly.rpolz(4,'Z',-5,5);
//console.log(p.toString());
//console.log("roots:"+p.roots);
//console.log(p.add([-16,0,0,1]).power(2).toString('z'));
//var Den = new Poly([3,1,-2]);
//var division = p.divide(Den);
//console.log("Division: "+p.toString()+" : "+Den.toString());
//console.log("Quocient="+division.q.toString());
//console.log("Residu="+division.r.toString());
//console.log(rent1(2,10,true,true));

return {rent1: rent1, rfrac: rfrac, divisors: divisors, gcd: gcd, lcm: lcm, 
       filterPrimes: filterPrimes, removePrimes: removePrimes, compareLists: compareLists, 
       processTemplate: templateProcess, ran:ran, html2latex: html2latex, ran: ran};

});
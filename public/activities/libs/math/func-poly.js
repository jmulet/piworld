//The returned functions are in mathlex syntax by default
define(['activities/libs/numbers'], function(N){
   
   var F = F || {};
   
   F.config = {
       typeCoef: 'R'
   };
   
   var random = function(){
       if(F.config.typeCoef==='Q')
       {
            return N.Rational.random();
       }
       else if(F.config.typeCoef==='R')
       {
            return N.Real.random();
       }
       else{
           return N.Integer.random();
       }
   };
   
   //c=coeffient is a Number Object with value() and toString() methods, v=variable, d=degree
   F.Monomial = function(c,v,d)
   {
       this.c = c;
       this.v = v;
       if(v.trim().length>1){
           this.v = "("+v+")";
       }
       this.d = d;
       this.eval = function(x){
           return c.value()*Math.pow(x,d);
       };
       
       this.toString = function(){
           if(this.c.value()!==0)
           {               
               var str = "";
               if(this.c.value() !== 1 || this.d===0){
                   str += this.c.toString();
                   if(this.d!==0)
                   {
                      str +="*";                   
                   }
               }
               
               if(this.d===1)
               {
                   str += this.v;
               }
               else if(this.d===0)
               {
                   //
               }
               else
               {
                   str +=this.v+"^("+this.d+")";
               }
               return str;
           }
           else
           {
               return "0";
           }
       };
   };
    
   F.Monomial.random = function(d, v)
   {
       if(typeof(d) === 'undefined')
       {
           d = random();
       }
       if(typeof(v) === 'undefined')
       {
           v = "x";
       }
       return new F.Monomial(random(), v, d);
   }; 
   
   
   F.Polynomial = function(mm)
   {
       this.mm = mm;
       this.eval = function(x)
       {
           var num = 0;
           $.each(mm, function (i, m)
           {
             num += m.eval(x);  
           });
           return num;
       };
       
       this.toString = function(){
            var s = "";
            $.each(mm, function (i, m)
            {
                if (m.c.value() !== 0)
                {
                    if (m.c.value() > 0 && s !== '')
                    {
                        s += "+";
                    }
                    s += m.toString();
                }
            });
           
           if(s==='')
           {
               s = '0';
           }
           return s;
       };
       
       this.isZero = function(){
            var q = true;
            $.each(mm, function (i, m)
            {
                if (m.c.value() !== 0)
                {
                    q = false;
                }
            });
            return q;
       };
   };
   
   F.Polynomial.random = function(d, v)
   {
       var mm = [];
       for(var i=0; i<=d; i++)
       {
            var dn = d-i;
            var m = F.Monomial.random(dn,v);
            mm.push(m);
       }
       return new F.Polynomial(mm);
   };
  
   return F;
    
});
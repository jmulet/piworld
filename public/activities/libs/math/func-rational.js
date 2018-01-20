define(['activities/libs/numbers','activities/libs/func-poly'], function(N, P){
   var R = R || {};
    
   R.PolyRational = function(n,d){
       this.n = n;
       this.d = d;
       this.eval = function(x){
            return this.n.eval(x) / this.d.eval(x);
       };
       this.toString = function(){
           return "("+this.n.toString()+ ")/("+ this.d.toString()+")";
       };       
   }; 
   
   R.PolyRational.random = function(d){
        if(typeof(d) === 'undefined')
        {
            d = 3;
        }
        var back = P.config.typeCoef;
        P.config.typeCoef = 'Z';
        var n = P.Polynomial.random(N.inRange(0,d));
        var d = P.Polynomial.random(N.inRange(1,d));
        while(n.isZero())
        {
            n = P.Polynomial.random(N.inRange(0,d));
        }
        while(d.isZero())
        {
            d = P.Polynomial.random(N.inRange(1,d));
        }
        P.config.typeCoef = back;
        return new R.PolyRational(n,d);
   };
    
   return R;
});
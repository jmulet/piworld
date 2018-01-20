define(['activities/libs/math/Ratio.min'], function (Ratio) {

    var N = N || {};

    N.config = {
        minCoef: -10,
        maxCoef: 10
    };

 
    N.inRange = function (a,b) {
        return Math.floor(Math.random() * (b-a)) + a;
    };

    var irandom = function () {
        return N.inRange(N.config.minCoef, N.config.maxCoef);
    };

    N.Integer = function (a) {
        this.a = a;
        this.value = function () {
            return this.a;
        };

        this.toString = function () {
            return this.a + "";
        };
    };

    N.Integer.random = function () {
        return new N.Integer(irandom());
    };
   

    N.Rational = function (a, b) {
        var rat = Ratio(a, b).simplify();
        this.a = rat.numerator();
        this.b = rat.denominator();
        if(this.b<0)
        {
            this.b = -this.b;
            this.a = -this.a;
        }

        this.value = function () {
            return this.a / this.b;
        };

        this.toString = function () {
            if(this.b===1)
            {
                return this.a+"";
            }
            else
            {
                var s="";
                if(this.a<0)
                {
                    s = "-";
                }
                    
                return s+" "+Math.abs(this.a) + "/" + this.b;
            }
        };
    };

    N.Rational.random = function () {
        var d = irandom();
        while (d === 0)
        {
            d = irandom();
        }
        return new N.Rational(irandom(), d);
    };
    
    
    N.Real = function(v,s)
    {
        this.v = v;
        this.s = s;
        this.value = function(){
            return this.v;
        };
        this.toString = function(){
            return this.s;
        };
    };
    
    N.Real.random = function () {
        var t = Math.random();
        if(t<0.34)
        {
            return N.Integer.random();
        }
        else if(t>=0.34 && t<0.67)
        {
            return N.Rational.random();
        }
        else
           var value = 1;
           var string = "1";
           if(Math.random()<0.84)
           {
               value = Math.abs(irandom())+1;
               string = ""+value;
           }
           else
           {
               if(Math.random()<0.5)
               {
                    value = Math.PI;
                    string = "#pi";
               }
               else
               {
                   value = Math.E;
                   string = "#e";
               }                
           }
           
           var t2 = Math.random();
           if(t2<0.1)
           {
               value = Math.sqrt(value);
               string = "\sqrt("+string+")";
           }
        
           return new N.Real(value,string); 
        };
     
    return N;
});
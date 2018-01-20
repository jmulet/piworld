define(['/activities/libs/math/rgen-arithmetics.js', '/activities/libs/math/ratio.js'], function(RG1, Ratio){

//Polynomial class
var Poly = function(c)
{
    this.roots = [];
    this.c = c;
    //Must cleanup coefficients in order to remove trailing zeros otherwise
    //degree would be wrong
    while(c.length>1 && eval(c[0])===0)
    {
        c.splice(0,1);
    } 
};

Poly.prototype = {
       
    degree: function(){return c.length-1;},
    
    multiply: function(p2)
    {
        var c2 = p2;
        if(!Array.isArray(p2))
        {
            c2 = p2.c;
        }
        var productdg = this.c.length + c2.length - 2;
        var product = new Array(productdg+1);
        for(var i=0; i<product.length; i++)
        {
            product[i] = 0;
        }

        for(var i = 0; i<c2.length; i++)
        {
            for(var k=0; k<this.c.length; k++)
            {
                product[i+k] += this.c[k]*c2[i];
            };
        };
        return new Poly(product);  
    },
    
    add: function(p2)
    {
        var c2 = p2;
        if(!Array.isArray(p2))
        {
            c2 = p2.c;
        }
        var l1 = this.c.length;
        var l2  = c2.length;
        var result = new Array(Math.max(l1, l2));
        
        for(var i=0; i<result.length; i++)
        {
            var v1 = l1-i-1>=0? eval(this.c[l1-i-1]) : 0;
            var v2 = l2-i-1>=0? eval(c2[l2-i-1]) : 0;
            result[result.length-i-1] = v1 + v2;            
        }
        
        return new Poly(result);
    },
    
    substract: function(p2)
    {
        var c2 = p2;
        if(!Array.isArray(p2))
        {
            c2 = p2.c;
        }
        var l1 = this.c.length;
        var l2  = c2.length;
        var result = new Array(Math.max(l1, l2));
        
        for(var i=0; i<result.length; i++)
        {
            var v1 = l1-i-1>=0? eval(this.c[l1-i-1]) : 0;
            var v2 = l2-i-1>=0? eval(c2[l2-i-1]) : 0;
            result[result.length-i-1] = v1 - v2;            
        }
        
        return new Poly(result);
    },
     
    divide: function(c2)
    {
        var p2 = c2;
        if(Array.isArray(c2))
        {
            p2 = new Poly(c2);
        }
        var l1 = this.c.length;
        var l2  = c2.length;  
        if(l1<l2)
        {
            return {q: new Poly([0]), r: this};
        }
        else
        {
            var quo = new Poly([0]);
            var remainder = this;
            while(remainder.degree()>=p2.degree())
            {
                    var step = this._divide(remainder, p2);
                    quo = quo.add(step.q);
                    remainder = step.r;
            };
        
            return {q: quo, r: remainder};
        }
        
    },
    
    /**
     * One step division
     * @param {type} p1
     * @param {type} c2
     * @param {type} indx
     * @returns {Poly._divide.productAnonym$2}
     */
    _divide: function(p1, p2)
    {
        var q = p1.c[0]/p2.c[0];
        var n = p1.degree() - p2.degree();
        var quocient = Poly.monomial(q, n);
        var remainder = p1.substract(p2.multiply(quocient));
        return {q: quocient, r: remainder};
    },
  
    
    power: function(n)
    {
        if(n===0)
        {
            return new Poly([1]);
        }
        else if(n===1)
        {
            return this;
        }
        else
        {
            var pow = this;
            for(var i=1; i<n; i++)
            {
                pow = pow.multiply(this);
            }
            return pow;
        }
    },

    derive: function()
    {
        if(this.degree()<=0)
        {
            return new Poly([0]);
        }
        
        var deriv = new Array(this.c.length()-1);
        for(var i=0; i<this.c.length-1; i++)
        {
            var n= this.c.length - i;
            deriv[i] = n*this.c[i];
        }
        
        return new Poly(deriv);
    },
   
    
    integrate: function(cte)
    {
        if(!cte)
        {
            cte = 0;
        }
                 
        var integral = new Array(this.c.length()+1);
        for(var i=0; i<this.c.length; i++)
        {
            var n= this.c.length - i;
            integral[i] = this.c[i]/(n+1);
        }
        integral[integral.length()-1] = cte;
        
        return new Poly(integral);
    },
    
    //It will fail for non fully factorizable polynomials
    toFactorForm: function(bar){
        var factorization = "";
        var times = "";        
        this.roots.forEach(function(r){
                var den = 1;
                var num = r;
                if((""+num).indexOf(".") || (""+num).indexOf("/")){
                    var f = Ratio.parse(r);
                    num = f.numerator();
                    den = f.denominator();
                }                
                var sign = num>0?"-":"+";
                den = den===1?"":den;
                factorization += times+"("+den+""+bar+sign+Math.abs(num)+")";
                times = "*";
        });
        return factorization;        
    },
    
    /**
     * Converts polynomial to human readable representation.
     * bar is the name of the variable default=x 
     * format is the language to which to translate default=latex
     */ 
    toString: function(bar, format)
    {
        bar = bar || 'x';
        format = format || 'latex';
        if(bar.length>1){
            bar = "("+ bar +")";
        }
        var str = "";
        for(var i = 0; i<this.c.length; i++)
        {

            if (eval(this.c[i]) !== 0)
            {
                var pow = "";
                var ex = this.c.length - i - 1;
                if (ex > 1)
                {
                    pow = "^" + ex;
                }
                var sign = "";
                if (eval(this.c[i]) < 0)
                {
                    sign = " - ";
                }
                else {
                    sign = i > 0 ? " + " : "";
                }

                var times;
                if (Math.abs(eval(this.c[i])) === 1)
                {
                    times = "";
                }
                else
                {
                    times = (""+this.c[i]).replace("-","");
                    if(i<this.c.length-1)
                    {
                        times += "*";
                    }
                }
                var bbar = times + bar;
                if (i === this.c.length - 1)
                {
                    bbar = times || "1";
                }
                str += sign + bbar + pow;
            }
        } 
        
        if(format==="html")
        {
            str = '<katex>'+str.replace(/\*/g,'\\, ')+'</katex>';
        }
        else if(format==="latex")
        {
            str = str.replace(/\*/g,'\\, ');
        }
        else if(format==="cas")
        {
            //do nothing
        }
        else
        {
            str = str.replace(/\*/g,'\\, ');
        }
        return str || "0";
    }
};

/**
 * Converts a monomial c x^dg to a polinomial object
 * @param {type} c
 * @param {type} dg
 * @returns {rgen-algebra_L1.Poly}
 */
Poly.monomial = function(c, dg)
{
        var result = new Array(dg+1);
        result[0] = c;
        for(var i=1; i<dg+1; i++)
        {
            result[i] = 0;
        };
        return new Poly(result);
};

/**
 * Random polynomial degree g, with coefficients of cos between min and max
 * @param {type} g
 * @param {type} cos
 * @param {type} min
 * @param {type} max
 * @returns {rgen-algebra_L1.Poly}
 */
Poly.rpolc = function(g, cos, min, max)
{
    g = g==null? 1 : g;
    cos = cos || 'Z';
    min = min==null? 0: min;
    max = max==null? 10: max;
   
    if(cos === 'Z')
    {
        var p1 = new Array(g);
        for(var i=0; i<g; i++)
        {
            var r = RG1.ran(min, max);
            if(i===0)
            {
                while(r===0)
                {
                    r = RG1.ran(min, max);
                }
            }
            p1[i] = r;
        }
        return new Poly(p1);
    }
    else if(cos === 'Q')
    {
        var p1 = new Array(g);
        for(var i=0; i<g; i++)
        {
            var r = RG1.ran(min, max);
            if(i===0)
            {
                while(r===0)
                {
                    r = RG1.ran(min, max);
                }
            }
            var d = RG1.ran(1, max);
            if(d>1)
            {
                p1[i] = ""+r+"/"+d;
            }
            else
            {
                p1[i] = ""+r;
            }
        }
        return new Poly(p1);
    }
};

/**
 * Accepts cos = Z,Q,R; generates a random biquadratic polinomial
 * @param {type} cos
 * @param {type} min
 * @param {type} max
 * @returns {undefined}
 */
Poly.rpolbiq = function(cos, min, max)
{
    cos = cos || 'Z';
    min = min==null? 0: min;
    max = max==null? 10: max;
    
    if(cos==='Z')
    {
        var r1 = RG1.ran(min, max);
        var r2 = RG1.ran(min, max);
        var s1 = RG1.ran(-1,1) || -1;
        var s2 = RG1.ran(-1,1) || -1;
        var result = new Poly([1,0,s1*r1*r1]).multiply([1,0,s2*r2*r2]);
        result.roots = [];
        if(s1<=0)
        {
            result.roots.push(r1);
            result.roots.push(-r1);
        }
        if(s2<=0 && r1!==r2)
        {
            result.roots.push(r2);
            result.roots.push(-r2);
        }
        return result;
    }
    else if(cos==='Q')
    {
        var p1 = RG1.ran(min, max) || 1;
        var p2 = RG1.ran(min, max) || 1;
        var r1 = RG1.ran(min, max);
        var r2 = RG1.ran(min, max);
        var s1 = RG1.ran(-1,1) || -1;
        var s2 = RG1.ran(-1,1) || -1;
        
        var result = new Poly([p1*p1,0,s1*r1*r1]).multiply([p2*p2,0,s2*r2*r2]);
        result.roots = [];
        if(s1<=0)
        {
            result.roots.push(r1/p1);
            result.roots.push(-r1/p1);
        }
        if(s2<=0)
        {
            result.roots.push(r2/p2);
            result.roots.push(-r2/p2);
        }        
        return result;
    }
    else
    {
        var p1 = RG1.ran(min, max) || 1;
        var p2 = RG1.ran(min, max) || 1;
        var r1 = RG1.ran(min, max);
        var r2 = RG1.ran(min, max);
        var s1 = RG1.ran(-1,1) || -1;
        var s2 = RG1.ran(-1,1) || -1;
        
        var result = new Poly([p1,0,s1*r1]).multiply([p2,0,s2*r2]);
        result.roots = [];
        if(s1<=0)
        {
            var v1 = Math.sqrt(r1/p1);
            result.roots.push(v1);
            result.roots.push(-v1);
        }
        if(s2<=0)
        {
            var v2 = Math.sqrt(r2/p2);
            result.roots.push(v2);
            result.roots.push(-v2);
        }
        return result;
    }
};


Poly._rpolz = function(g, cos, list){
     
    if(!list.length){
        return new Poly([0]);
    }
     
    if(cos === 'Z')
    {
        var r = eval(list[0]);
        var roots = [r];
        var p1 = new Poly([1, -r]);
        
        for(var i=1; i<g; i++)
        {
            r = eval(list[i]);
            roots.push(r);
            p1 = p1.multiply([1, -r]);
        }
        p1.roots = roots;
        return p1;
    }
    else{
        var frac = (""+list[0]).split("/");
        var d = eval(frac[1]) || 1;
        var r = eval(frac[0]);
        var roots = [r/d];
        var p1 = new Poly([d, -r]);
      
        for(var i=1; i<g; i++)
        {
            frac = (""+list[i]).split("/");
            d = eval(frac[1]) || 1;
            r = eval(frac[0]);
            roots.push(r/d);
            p1 = p1.multiply([d, -r]);
        }
        p1.roots = roots;
        return p1;
    }
};

/**
 * Random polynomial of degree g with roots of cos cos between min and max values
 * >> min can also be an array of roots, then max will be disregarded unless more
 * roots must be generated to fit the desired degree g.
 * @param {type} g
 * @param {type} cos
 * @param {type} min
 * @param {type} max
 * @returns {rgen-algebra_L1.Poly}
 */
Poly.rpolz = function(g, cos, min, max)
{
    g = g==null? 1 : g;
    cos = cos || 'Z';
    min = min==null? 0: min;
    max = max==null? 10: max;
    
    var list = min;
    if(Array.isArray(list)){
        
        if(list.length>g){
            list.slice(0,g);
        } else if(list.length<g){
            while(list.length<g){
                if(cos === 'Z')
                {   
                    list.push(RG1.ran(min, max)+"");
                } else{ 
                    //Un polinomi de grau g, ha de tenir almenys g-2 arrels enteres,
                    //per poder factoritzar per Ruffini
                    var d= Math.abs(RG1.ran(min, max));
                    while(d===0){
                        d= Math.abs(RG1.ran(min, max));
                    }
                    list.push(RG1.ran(min, max)+"/"+d);
                }
            }
        }
    } else {
        list = [];
        var c = 0;
        for(var i=0; i<g; i++){
            if(cos === 'Z')
            {   
                list.push(RG1.ran(min, max)+"");
            } else{ 
                //Un polinomi de grau g, ha de tenir almenys g-2 arrels enteres,
                //per poder factoritzar per Ruffini
                var d= Math.abs(RG1.ran(min, max));
                while(d===0)
                {
                    d= Math.abs(RG1.ran(min, max));
                }
                
                if(c<3){
                    list.push(RG1.ran(min, max)+"/"+d);
                    if(d!==1){
                        c += 1;
                    }
                } else{
                    list.push(RG1.ran(min, max));
                }
                
            }

        }
    }
    
    return Poly._rpolz(g, cos, list);
};   
  

/**
 * Polynomial from coefficients an, .... a0, a1
 * @param {type} as
 * @returns {Poly}
 */
Poly.polc = function(cs){
    return new Poly(cs);
};

/**
 * Polynomial from roots cn, .... c0, c1
 * @param {type} as
 * @returns {Poly}
 */
Poly.polz = function(rs){
    
    var result = new Poly([1,-rs[0]]);
    for(var i=0; i<rs.length; i++)
    {
        result = result.multiply([1,-rs[i]]);
    }    
    result.roots(rs);
    return result;
};
 

//Generates a random equation with roots in a given cos
Poly.rpoleqn = function(a, degree, complexity, cos, v)
{
    a = a || 10;    
    degree = degree || RG1.RG1.ran(1,4);
    complexity = complexity!==null? complexity : RG1.RG1.ran(0,4);
    v = v || 'x';
    cos = cos || 'Z';
    
    if(degree<1)
    {
        degree = 1;
    }
    
    
    var eqn = v+"-1=0";
    
    switch(degree){
        case 1:
            switch(complexity){
                case 0: var t= ['Z*'+v+'+Z=Z0','Z0=Z-Z*'+v].random(); eqn = RG1.processTemplate(t, {range:a}); break; //tipus ax+b=c
                case 1: var t= ['Z*'+v+'+Z=Z*'+v+'+Z','Z-Z*'+v+'+Z*'+v+'=Z'].random(); eqn = RG1.processTemplate(t, {range:a}); break; //tipus ax+b=cx+d
                case 2: var t= ['Z-N*(Z*'+v+'-Z)=Z0'].random(); eqn = RG1.processTemplate(t, {range:a});  break; //amb parentesis 1
                case 2: var t= ['Z-N*(Z*'+v+'-Z)=Z*(Z*'+v+'+Z)-Z*(Z*'+v+'+Z)'].random(); eqn = RG1.processTemplate(t, {range:a});  break; //amb parentesis 2
                case 3: var t= ['Z*'+v+'/N+Z=Z-'+v+"/N"].random(); eqn = RG1.processTemplate(t, {range:a}); break; //amb denominadors 1
                case 4: var t= ['Z*(N*'+v+'+Z)/N+Z*(N*'+v+'+Z)/N=Z*(N*'+v+'+Z)/N+Z/N'].random(); eqn = RG1.processTemplate(t, {range:a}); break; //amb denominadors 2
                default: break;
            };
            break;
        case 2:
            switch(complexity){
                case 0: var t= ['Z*'+v+'^2+Z*'+v+'=0','Z_1*'+v+'^2+{Z_1*Math.pow(Z,2)}=0'].random(); eqn = RG1.processTemplate(t, {range:a}); break; //incompletes
                case 1: var t= [Poly.rpolz(2,'Z',-a,a).toString(v)+"=0", Poly.rpolz(2,'Z',-a,a).toString(v)+"=0", Poly.rpolz(2,'Q',-a,a).toString(v)+"=0", Poly.rpolz(1,'Q',-a,a).power(2).toString(v)+"=0", '{(Z_1)*(Z_1)}*'+v+"^2+{2*(Z_2)*(Z_1)}*"+v+"+{(Z_2)*(Z_2)+N}=0" ].random(); eqn = RG1.processTemplate(t, {range:a}); break; //completes 2 arrels, 1 arrel, 2 arrels
                default: var pol1=Poly.rpolc(1,'Z',-a,a);var pol2=Poly.rpolc(2,'Z',-a,a);var t= [Poly.rpolz(2,'Z',-a,a).add(pol1).toString(v)+"="+pol1.toString(v), Poly.rpolz(2,'Z',-a,a).add(pol2).toString(v)+"="+pol2.toString(v), Poly.rpolz(2,'Q',-a,a).add(pol2).toString(v)+"="+pol2.toString(v), Poly.rpolz(1,'Q',-a,a).power(2).add(pol1).toString(v)+"="+pol1.toString(v), '{(Z_1)*(Z_1)}*'+v+"^2+{2*(Z_2)*(Z_1-1)}*"+v+"+{(Z_2)*(Z_2)}={-2*(Z_2)}*"+v+"+Z", "("+v+"-Z)^2+Z_1={(Z_2)*(Z_2)+Z_1}",'Z_1*('+v+'+Z_2)*('+v+'-Z_2)+{(Z_2)*(Z_2)}*('+v+'-Z_1)^2={-(Z_1)*(Z_2)*(Z_1+Z_2)}'].random();eqn = RG1.processTemplate(t, {range:a}); break; //completes 2 arrels, 1 arrel, 2 arrelsbreak;                                
            };
            break; 
        case 4:
            switch(complexity){
                case 0: var t= ['Z*'+v+'^4+Z*'+v+'^2=0','Z_1*'+v+'^4+{Z_1*Math.pow(Z,2)}=0'].random(); eqn = RG1.processTemplate(t, {range:a}); break; //factoritzables
                case 1: var t= [Poly.rpolz(2,'Z',-a,a).toString(v+'^2')+"=0", Poly.rpolz(2,'Z',-a,a).toString(v+'^2')+"=0", Poly.rpolz(2,'Q',-a,a).toString(v+'^2')+"=0", Poly.rpolz(1,'Q',-a,a).power(2).toString(v+'^2')+"=0"].random(); eqn = t; break; //biquadratiques
                default:  eqn = [Poly.rpolz(4,'Z',-a,a).toString(v)+"=0"].random(); break;
            };
            break; 
        default: 
            switch(complexity){
               default: eqn = [Poly.rpolz(degree,'Z',-a,a).toString(v)+"=0"].random(); break;
            };
            break;
    };
    
    return eqn;    
};

Poly.countTerms = function(str)
{
    var str2 = str.trim();
    if(str2.startsWith('+') || str2.startsWith('-'))
    {
        str2 = str2.substring(1);
    }
    var n = (str2.match(/(\+|\-)/g) || []).length + 1;
    console.log(str);
    console.log(n);
    return n;
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

return Poly;

});
/////////////////////////////////////////
//  JS library for Geometry in 3D 
//  Returns a requirejs module
//  by J. Mulet (c) 2015
//  pep.mulet@gmail.com
/////////////////////////////////////////

define(['/activities/libs/math/ratio'], function (Ratio) {
//
//Utility functions
//
    var Sutil = Sutil || {};

//Gets the sign symbol of a number
    Sutil.sign = function (n)
    {
        if (n >= 0)
            return "+";
        else
            return "-";
    };

    Sutil.withSign = function (n) {
        return " " + Sutil.sign(n) + Math.abs(n) + " ";
    };

//Displays a number with its sign, + is displayed only if ncond<>0
    Sutil.withSign2 = function (n, ncond) {
        if (ncond === 0)
        {
            return n;
        }
        return " " + Sutil.sign(n) + Math.abs(n);
    };

//Displays only if the number is not zero
    Sutil.displayNoZero = function (n) {
        if (n === 0)
        {
            return "";
        }
        return n;
    };

//Displays only if the number is not zero
    Sutil.displayNoZero2 = function (n, literal) {
        if (n === 0)
        {
            return 0;
        }
        return n + " " + literal;
    };

    Sutil.round = function (n)
    {
        return Math.floor(n * 1e12) / 1e12;
    };

//Define Geometry Wrapper
    var G3D = G3D || {};

    G3D.minval = -10;
    G3D.maxval = 10;
    G3D.precision = 1e-12;

//Allow overloading functions
//addMethod - By John Resig (MIT Licensed)
    function addMethod(object, name, fn) {
        var old = object[ name ];
        object[ name ] = function () {
            if (fn.length === arguments.length)
                return fn.apply(this, arguments);
            else if (typeof old === 'function')
                return old.apply(this, arguments);
        };
    }
    
    function convert3D(P){
        P = P || {};
        P.x = P.x || 0;
        P.y = P.y || 0;
        P.z = P.z || 0;
        return P;
    }

//Create class Point
    G3D.Point = function (x, y, z)
    {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.label = "A";

        //Returns the symmetric respect to B
        this.symmetric = function (B)
        {
            var B3 = convert3D(B);
            return new G3D.Point(2 * B3.x - this.x, 2 * B3.y - this.y, 2 * B3.z - this.z);
        };

        this.clone = function ()
        {
            return new G3D.Point(this.x, this.y, this.z);
        };

        this.toString = function ()
        {
            return this.label + "(" + this.x + ", " + this.y + ", "+this.z+")";
        };
    };

    G3D.Point.random = function ()
    {
        var x = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        var y = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        var z = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        return new G3D.Point(x, y, z);
    };

    G3D.Point.midPoint = function (A, B)
    {
        return new G3D.Point(0.5 * (A.x + B.x), 0.5 * (A.y + B.y), 0.5*(A.z + B.z));
    };

    G3D.Point.distance = function (A, B)
    {
        return G3D.Vector.fix(A, B).norm();
    };

    G3D.Point.areAligned = function (A, B, C)
    {
        var v1 = G3D.Vector.fix(A, B);
        var v2 = G3D.Vector.fix(A, C);
        return v1.isParallel(v2);
    };

    G3D.Point.O = new G3D.Point(0, 0, 0);

    G3D.Point.parse = function (str)
    {
        var tmp = str.trim();
        var i0 = tmp.indexOf("(");
        var i1 = tmp.indexOf("[");
        var comps;
        var x = 0;
        var y = 0;
        var z = 0;
        var label = 'A';
        if (i0 >= 0)
        {
            label = str.substr(0, i0);
            tmp = str.substr(i0 + 1);
            tmp = tmp.replace(")", "").trim();
        }
        if (i1 >= 0)
        {
            label = str.substr(0, i1);
            tmp = str.substr(i1 + 1);
            tmp = tmp.replace("]", "").trim();
        }
        var comps = tmp.split(",");
        if (comps.length === 3)
        {
            try{
                x = parseFloat(comps[0]);
                y = parseFloat(comps[1]);
                z = parseFloat(comps[2]);
            }
            catch(e){
                console.log("G3D.Point.parse:"+e);
            }
        }
        var point = new G3D.Point(x, y, z);
        point.label = label;
        return point;
    };


//Define Vector class
    G3D.Vector = function (x, y, z, label)
    {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        this.label = label || "v"; 
        
        if(typeof(x)==='string')
        {
            if(x.trim().length===0)
            {
                x = "0";
            }
            try{
                this.x = eval(x.replace(',','.'));
            }catch(e){
                console.log("G3D.Vector.constructor"+e);
            }
        }
        if(typeof(y)==='string')
        {
            if(y.trim().length===0)
            {
                y = "0";
            }
            try{
                this.y = eval(y.replace(',','.'));
             }catch(e){
                console.log("G3D.Vector.constructor"+e);
            }
        }
        if(typeof(z)==='string')
        {
            if(z.trim().length===0)
            {
                z = "0";
            }
            try{
                this.z = eval(z.replace(',','.'));
             }catch(e){
                console.log("G3D.Vector.constructor"+e);
            }
        }
        this.toString = function ()
        {
            return this.label + "(" + this.x + ", " + this.y + ", "+this.z+")";
        };

        this.clone = function ()
        {
            return new G3D.Vector(this.x, this.y, this.z);
        };

        this.escalarProduct = function (v3)
        {
            var v = convert3D(v3);
            return this.x * v.x + this.y * v.y + this.z*v.z;
        };
        
        this.vectorialProduct = function (v3)
        {
            var v = convert3D(v3);
            var x = this.y*v.z - this.z*v.y;
            var y = this.z*v.x - this.x*v.z;
            var z = this.x*v.y - this.y*v.x;
            return new G3D.Vector(x,y,z,this.label+'x'+v3.label);
        };
        
        this.norm2 = function ()
        {
            return this.escalarProduct(this);
        };
        
        this.norm = function ()
        {
            return Math.sqrt(this.norm2());
        };

        
        this.isParallel = function (v)
        {
            return Math.abs(this.vectorialProduct(v)) < G3D.precision;
        };
        
        this.equals = function(v){
            return this.x===v.x && this.y===v.y && this.z===v.z;
        };

        this.isPerpendicular = function (v)
        {
            return Math.abs(this.escalarProduct(v)) < G3D.precision;
        };

        this.unitary = function ()
        {            
            var norma = this.norm();
            if(norma === 0)
            {
                console.log("G3D.unitary: unable to get unitary of v(0,0,0)!");
                return this;
            }
            return new G3D.Vector(this.x / norma, this.y / norma, this.z / norma);
        };

        /*this.perpendicular = function ()
        {
            return new G3D.Vector(-this.y, this.x);
        };*/


        this.angleRad = function (v)
        {
            var cos = this.escalarProduct(v) / (this.norm() * v.norm());
            return Math.acos(cos);
        };

        this.angleDeg = function (v)
        {
            return this.angleRad(v) * 180 / Math.PI;
        };

        this.projectionOver = function (v)
        {
            return this.escalarProduct(v.unitary());
        };
    };
    
    G3D.determinant = function(u, v, w){
        return u.escalarProduct(v.vectorialProduct(w));
    };
    
    G3D.Vector.mixtProduct = function(u3, v3, w3){        
        return G3D.determinant(u3, v3, w3);
    };

    G3D.Vector.fix = function (A, B)
    {
        var A3 = convert3D(A);
        var B3 = convert3D(B);
        return new G3D.Vector(B3.x - A3.x, B3.y - A3.y, B3.z - A3.z);
    };

    G3D.Vector.O = new G3D.Vector(0, 0, 0);
    G3D.Vector.i = new G3D.Vector(1, 0, 0);
    G3D.Vector.j = new G3D.Vector(0, 1, 0);
    G3D.Vector.k = new G3D.Vector(0, 0, 1);

    G3D.Vector.random = function ()
    {
        var x = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        var y = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        var z = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;        
        return new G3D.Vector(x, y, z);
    };

    G3D.Vector.parse = function (str)
    {
        var tmp = str.trim();
        var i0 = tmp.indexOf("(");
        var i1 = tmp.indexOf("[");
        var comps;
        var x = 0;
        var y = 0;
        var z = 0;
        var label = 'v';
        if (i0 >= 0)
        {
            label = str.substr(0, i0);
            tmp = str.substr(i0 + 1);
            tmp = tmp.replace(")", "").trim();
        }
        if (i1 >= 0)
        {
            label = str.substr(0, i1);
            tmp = str.substr(i1 + 1);
            tmp = tmp.replace("]", "").trim();
        }
        var comps = tmp.split(",");
        if (comps.length === 3)
        {
           try{ 
             x = parseFloat(comps[0]);
             y = parseFloat(comps[1]);
             z = parseFloat(comps[2]);
         }
         catch(e){
             console.log("G3D.Vector.parse: "+e);
         }
        }
        var vec = new G3D.Vector(x, y, z);
        vec.label = label;
        return vec;
    };

//Define G3D.Plane class
    
    G3D.Plane = function(P, d1, d2)
    {         
        G3D.Plane.vectorialType = 0;
        G3D.Plane.parametricType = 1;
        G3D.Plane.generalType = 3; 
        
        this.P = convert3D(P);
        //Plane defined by a point and two director vectors
        if(d1 && d2)
        {
            this.d1 = convert3D(d1);
            this.d2 = convert3D(d2);        
            this.n = this.d1.vectorialProduct(this.d2);
            if(this.n.equals(G3D.Vector.O)){
                console.log("G3D.Plane: d1 and d2 are parallel, thus not defining a plane!");
            }
        }
        //Plane defined by a point and 1 normal vector
        else if(d1 && !d2){
            this.n = convert3D(d1);
            //TODO:construct two independent director vectors
        }
        
        this.hasPoint = function(Q){
            return Math.abs(this.n.escalarProduct(G3D.Vector.fix(Q,this.P))) < G3D.precision;
        };
        
        this.hasDirector = function(v){
            return Math.abs(this.n.escalarProduct(v)) < G3D.precision;
        };
        
        this.hasNormal = function(v){
            return this.n.isParallel(v);
        };
        
        this.hasLine = function(l){
            return this.hasDirector(l.d) && this.hasPoint(l.P);
        };
        
        this.isParallel = function(obj)
        {
            if(obj.n) //obj is a plane
            {
                return this.n.isParallel(obj.n) && !this.hasPoint(obj.P);
            } else if(obj.d) { //obj is a line
                return this.hasDirector(obj.d) && !this.hasPoint(obj.P);
            } else if(!obj.d) { // obj is a point
                return !this.hasPoint(obj);
            };
            console.log("G3D Plane: isParallel unknown object type "+JSON.stringify(obj));
            return false;
        };
        
        this.contains = function(obj)
        {
            if(obj.n) //obj is a plane
            {
                return this.n.isParallel(obj.n) && this.hasPoint(obj.P);
            } else if(obj.d) { //obj is a line
                return this.hasDirector(obj.d) && this.hasPoint(obj.P);
            } else if(!obj.d) { // obj is a point
                return this.hasPoint(obj);
            };
            console.log("G3D Plane: contains unknown object type "+JSON.stringify(obj));
            return false;
        };
        
        this.getPerpendicularLine = function(P){
            return new G3D.Line(P, this.n);
        };
        
        this.intersection = function(obj){
            if(this.contains(obj)){
                return obj;
            }
            //another plane --> Can return a plane or a line
            if(obj.n){
                
            }
            //a line --> can return a line or a Point
            else if(obj.P){
                
            }
            
        };
    };

    G3D.Plane.fromPoints = function(A,B,C){
        var AB = G3D.Vector.fix(A,B);
        var AC = G3D.Vector.fix(A,C);
        var n = AB.vectorialProduct(AC);
        if(n.equals(G3D.Vector.O)){
            console.log("G3D Plane: fromPoints, A, B, C are aligned. Not defining a plane!");
        }
        return new G3D.Plane(A, n);
    };
    
    G3D.Plane.random = function(P, n){
        P = P || G3D.Point.random();
        var n = n || G3D.Vector.random();
        while(n.equals(G3D.Vector.O)){
            n = G3D.Vector.random();
        }
        return new G3D.Plane(P, n);
    };

//Define G3D.Line class
//Line defined by a point and a director vector
    G3D.Line = function (P, d)
    {
        G3D.Line.vectorialType = 0;
        G3D.Line.parametricType = 1;
        G3D.Line.continuousType = 2;
        G3D.Line.generalType = 3; 

        this.P = convert3D(P);
        this.d = convert3D(d);
        this.type = G3D.Line.generalType;
        this.param = "t";

        this.clone = function ()
        {
            return new G3D.Line(this.P.clone(), this.d.clone());
        };

        this.hasPoint = function (Q)
        {
            var remainder1 = this.d.y * (Q.x - this.P.x) - this.d.x * (Q.y - this.P.y);          
            var remainder2 = this.d.z * (Q.y - this.P.y) - this.d.y * (Q.z - this.P.z);          
            return Math.abs(remainder1) < G3D.precision && Math.abs(remainder2) < G3D.precision;
        };

        this.hasVector = function (v)
        {
            return this.d.isParallel(v);
        };

        this.hasNormal = function (v)
        {
            return this.d.isPerpendicular(v) ;
        };

        //TODO instesectionPlane!!!
        this.intersectionXY = function ()
        {
            return this.intersectionPlane(G3D.Plane.XY);
        };

        this.intersectionYZ = function ()
        {
            return this.intersectionPlane(G3D.Plane.YZ);
        };
        
        this.intersectionXZ = function ()
        {
            return this.intersectionPlane(G3D.Plane.XZ);
        };
        //TODO instesectionPlane!!!

        this.isParallel = function (s)
        {
            return this.d.isParallel(s.d);
        };

        this.isPerpendicular = function (s)
        {
            return this.d.isPerpendicular(s.d);
        };
        
        this.isCoincident = function (s)
        {
            if(!this.isParallel(s))
            {
                return false;
            }
            
            return this.hasPoint(s.P);
        };

        this.getParallel = function (A)
        {
            var A3 = convert3D(A);
            return new G3D.Line(A3, this.d);
        };

        /*this.getPerpendicular = function (A)
        {
            return new G3D.Line(A, this.d.perpendicular());
        };
        */
       
        this.getPerpendicularPlane = function(P){
            return new G3D.Plane(P, this.d);
        };
       
        this.angleRad = function (s)
        {
            return this.d.angleRad(s.d);
        };

        this.angleDeg = function (s)
        {
            return this.d.angleDeg(s.d);
        };

        //TODO
        this.distance = function (obj)
        {
            if (obj instanceof G3D.Point)
            {
                var PR = G3D.Vector.fix(this.P, obj);
                return Math.abs(PR.projectionOver(this.d.perpendicular().unitary()));
            }
            else if (obj instanceof G3D.Line)
            {
                if (this.parallel(obj))
                {
                    return this.distance(obj.P);
                }
                else
                {
                    return 0;
                }
            }
        };

        this.newPoint = function (t)
        {
            return new G3D.Point(this.P.x + t * this.d.x, this.P.y + t * this.d.y, this.P.z + t*this.z);
        };

        this.newPointRandom = function ()
        {
            var t = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
            return this.newPoint(t);
        };

        //Returns A / B / C of the general equation Ax+By=C;
        this.getGeneralCoefs = function ()
        {
            return [this.d.y, -this.d.x, this.d.y * this.P.x - this.d.x * this.P.y];
        };

        //Returns m / n of the explicit equation y = mx+n;
        this.getExplicitCoefs = function ()
        {
            var m = this.slope();
            return [m, this.P.y - m * this.P.x];
        };

        //Returns a / b of the segmentary equation x/a + y/b = 1;
        this.getSegmentaryCoefs = function ()
        {
            var coefs = this.getGeneralCoefs();
            return [coefs[2] / coefs[0], coefs[2] / coefs[1]];
        };

        this.intersection = function (s)
        {
            var Mr = this.getGeneralCoefs();
            var Ms = s.getGeneralCoefs();
            var det = Mr[0] * Ms[1] - Mr[1] * Ms[0];
            var x = (Mr[2] * Ms[1] - Ms[2] * Mr[1]) / det;
            var y = (Mr[0] * Ms[2] - Ms[0] * Mr[2]) / det;
            return new G3D.Point(x, y);
        };

        this.getVectorialForm = function (ml)
        {
            var raw = "(x,y) = (" + this.P.x + ", " + this.P.y + ") + " + this.param + " (" + this.d.x + ", " + this.d.y + ")";
            var mathml = raw;

            if (ml)
                return mathml;
            else
                return raw;
        };

        this.getParametricForm = function (ml)
        {
            var raw = "x = " + Sutil.displayNoZero(this.P.x) + Sutil.withSign2(this.d.x, this.P.x) + this.param +
                    " <br> y = " + Sutil.displayNoZero(this.P.y) + Sutil.withSign2(this.d.y, this.P.y) + this.param;
            var eqn2 = "\\left\\{\\begin{array}{lll} x = ";
      
            if (this.P.x != 0)
            {
                eqn2 += this.P.x;
            }
            if (this.d.x > 0)
            {
                if (this.P.x != 0)
                {
                    eqn2 += "+";
                }
                eqn2 +=  this.d.x + "\\cdot " + this.param ;
            }
            else if (this.d.x < 0)
            {
                eqn2 +=  this.d.x + "\\cdot " + this.param ;
            }

            if (this.P.x === 0 && this.d.x === 0)
            {
                eqn2 += "0";
            }

            eqn2 += "\\\\ y =";

            if (this.P.y != 0)
            {
                eqn2 += this.P.y;
            }
            if (this.d.y > 0)
            {
                if (this.P.y != 0)
                {
                    eqn2 += "+";
                }
                eqn2 +=  this.d.y + "\\cdot " + this.param;
            }
            else if (this.d.y < 0)
            {
                eqn2 +=  this.d.y + "\\cdot " + this.param ;
            }

            if (this.P.y === 0 && this.d.y === 0)
            {
                eqn2 += "0";
            }
            eqn2 += "\\end{array}\\right.";
            
            if (ml)
                return eqn2;
            else
                return raw;
        };

        this.getcontinuousForm = function (ml)
        {
            var raw = "(x " + Sutil.withSign(-this.P.x) + ") / (" + this.d.x + ") = " + "(y " + Sutil.withSign(-this.P.y) + ") / (" + this.d.y + ")";

            var px0abs = Math.abs(this.P.x);
            var signx = "-";
            if (this.P.x < 0)
                signx = "+";

            var py0abs = Math.abs(this.P.y);
            var signy = "-";
            if (this.P.y < 0)
                signy = "+";

            var eqn2 = "\\frac{x " + signx + " " + px0abs + "}{" + this.d.x + "}=";
            eqn2 += "\\frac{y " + signy + " " + py0abs + "}{" + this.d.y + "}";

            if (ml)
                return eqn2;
            else
                return raw;
        };

        this.getGeneralForm = function (ml)
        {
            var c = this.getGeneralCoefs();
            var raw = "";
            if (c[0] != 0)
            {
                raw = c[0] + "x";
            }
            if (c[1] != 0)
            {
                raw += Sutil.withSign(c[1]) + "y";
            }
            raw += " = " + c[2];

            var mathml = raw;

            if (ml)
                return mathml;
            else
                return raw;
        };

        this.getExplicitForm = function (ml)
        {
            if (this.d.x == 0)
            {
                return "x = " + this.P.x;
            }
            var m = "";
            if (this.d.y % this.d.x == 0)
            {
                m = this.d.y / this.d.x;
            }
            else
            {
                var f = Ratio.simplify(Ratio(this.d.y, this.d.x));
                m = f[0] + "/" + f[1];
            }
            var n = "";
            var delta = this.P.y * this.d.x - this.d.y * this.P.x;
            var sign = "+";
            if (delta / this.d.x < 0)
            {
                sign = "-";
            }

            if (delta % this.d.x == 0)
            {
                n = Math.abs(delta / this.d.x);
            }
            else
            {
                var f = Ratio.simplify(Ratio(delta, this.d.y));
                n = Math.abs(f[0]) + "/" + Math.abs(f[1]);
            }


            var eqn = "y = " + m + "x " + sign + " " + n;
            return eqn;
        };

        this.getSegmentaryForm = function (ml)
        {
            var c = this.getSegmentaryCoefs();
            var raw = "x/(" + c[0] + ") + y/(" + c[1] + ") =  1";

            var delta = this.P.x * this.d.y - this.d.x * this.P.y;
            var a = "";
            var b = "";
            if (delta % this.d.y == 0)
            {
                a = "" + delta / this.d.y;
            }
            else
            {
                var f = Ratio.simplify(Ratio(delta, this.d.y));
                a = "\\frac{"+f[0]+"}{"+f[1]+"}";
            }

            if (delta % this.d.x == 0)
            {
                b = "" + (-delta / this.d.x);
            }
            else
            {
                var f = Ratio.simplify(Ratio(-delta, this.d.x));
                b = "\\frac{"+f[0]+"}{"+f[1]+"}";
            }


            var eqn = "\\frac{x}{"+a+"}+\\frac{y}{"+b+"}=1";
            if (ml)
                return eqn;
            else
                return raw;
        };

        this.toString = function (ml)
        {
            if (this.type === G3D.Line.vectorialType)
            {
                return this.getVectorialForm(ml);
            }
            else if (this.type === G3D.Line.parametricType)
            {
                return this.getParametricForm(ml);
            }
            else if (this.type === G3D.Line.continuousType)
            {
                return this.getcontinuousForm(ml);
            }
            else if (this.type === G3D.Line.generalType)
            {
                return this.getGeneralForm(ml);
            }
            else if (this.type === G3D.Line.explicitType)
            {
                return this.getExplicitForm(ml);
            }
            else if (this.type === G3D.Line.segmentaryType)
            {
                return this.getSegmentaryForm(ml);
            }
            return "undefined type";
        };

    };

    G3D.Line.segment = function (A, B)
    {
        return new G3D.Line(A, G3D.Vector.fix(A, B));
    };

    G3D.Line.mediatrice = function (A, B)
    {
        return new G3D.Line(G3D.Point.midPoint(A, B), G3D.Vector.fix(A, B).perpendicular());
    };


    G3D.Line.random = function ()
    {
        var d = G3D.Vector.random();
        //vector cannot be 0, it would define no direction so no line...
        while (d.norm() === 0)
        {
            d = G3D.Vector.random();
        }
        var type = Math.floor(Math.random() * 5);
        var line = new G3D.Line(G3D.Point.random(), d);
        line.type = type;
        return line;
    };

   //Creates a new line from its general equation Ax+By=C
   //Returns null if  str cannot be parsed
    G3D.Line.parse = function (str)
    {
        if(str.indexOf("=")<0)
        {
            return null;
        }
        
        var str2 = str.replace(/\s/g, '').toLowerCase();
        var membres = str2.split("=");
        
        var C = 0;
        try{
            C = eval(membres[1]);
        }catch(e){
                console.log("G3D.Line.parse: "+e);
                return null;
        }
        var A = 0;
        var B = 0;
        var left = membres[0];
        //console.log(left);
        var x = 1;
        var y = 0;
        try{   
            A = eval(left);
        }catch(e){
            console.log("G3D.Line.parse: "+e);
            return null;
        }
        x = 0;
        y = 1;
        try{
            B = eval(left);
        }catch(e){
            console.log("G3D.Line.parse: "+e);
            return null;            
                   
        }
        //console.log("ABC"+A+", "+B+", "+C);
        var line = G3D.Line.fromGeneralCoefs(A, B, C);
        //console.log(line.toString());
        return line;
    };

    G3D.Line.fromGeneralCoefs = function (A, B, C)
    {
        var vec = new G3D.Vector(-B, A);
        
        var P;
        
        if(A!=0)
        {
            P = new G3D.Point(C/A, 0);
        }
        else
        {
            P = new G3D.Point(0, C/B);
        }
               
        return new G3D.Line(P, vec);
    };

    G3D.Line.xAxis = new G3D.Line(G3D.Point.O, G3D.Vector.i);
    G3D.Line.yAxis = new G3D.Line(G3D.Point.O, G3D.Vector.j);


//Define the triangle class
    G3D.Triangle = function (A, B, C)
    {
        this.A = A;
        this.B = B;
        this.C = C;

        this.lines = function ()
        {
            return [new G3D.Line(this.C, G3D.Vector.fix(this.B, this.C)), new G3D.Line(this.A, G3D.Vector.fix(this.A, this.C)),
                new G3D.Line(this.B, G3D.Vector.fix(this.A, this.B))];
        };

        this.sides = function ()
        {
            return [G3D.Point.distance(this.B, this.C), G3D.Point.distance(this.A, this.C), G3D.Point.distance(this.A, this.B)];
        };

        this.heightLines = function ()
        {
            return [new G3D.Line(this.B, G3D.Vector.fix(this.A, this.C).perpendicular()),
                new G3D.Line(this.A, G3D.Vector.fix(this.B, this.C).perpendicular()),
                new G3D.Line(this.C, G3D.Vector.fix(this.A, this.B).perpendicular)
            ];
        };

        this.medianas = function ()
        {
            return [G3D.Line.segment(G3D.Point.midPoint(this.A, this.C), this.B),
                G3D.Line.segment(G3D.Point.midPoint(this.C, this.B), this.A),
                G3D.Line.segment(G3D.Point.midPoint(this.A, this.B), this.C)
            ];
        };

        this.mediatrices = function ()
        {
            return [G3D.Line.mediatrice(this.A, this.B),
                G3D.Line.mediatrice(this.A, this.C),
                G3D.Line.mediatrice(this.B, this.C)
            ];
        };

        this.ortocentre = function ()
        {
            var heights = this.heightLines();
            return heights[0].intersection(heights[1]);
        };

        this.baricentre = function ()
        {
            var medias = this.medianas();
            return medias[0].intersection(medias[1]);
        };

        this.circumcentre = function ()
        {
            var medias = this.mediatrices();
            return medias[0].intersection(medias[1]);
        };

        this.anglesRad = function ()
        {
            var AB = G3D.Vector.fix(this.A, this.B);
            var AC = G3D.Vector.fix(this.A, this.C);

            var BA = G3D.Vector.fix(this.B, this.A);
            var BC = G3D.Vector.fix(this.B, this.C);

            var CA = G3D.Vector.fix(this.C, this.A);
            var CB = G3D.Vector.fix(this.C, this.B);

            return [AB.angleRad(AC), BA.angleRad(BC), CA.angleRad(CB)];
        };

        this.anglesDeg = function ()
        {
            var AB = G3D.Vector.fix(this.A, this.B);
            var AC = G3D.Vector.fix(this.A, this.C);

            var BA = G3D.Vector.fix(this.B, this.A);
            var BC = G3D.Vector.fix(this.B, this.C);

            var CA = G3D.Vector.fix(this.C, this.A);
            var CB = G3D.Vector.fix(this.C, this.B);

            return [AB.angleDeg(AC), BA.angleDeg(BC), CA.angleDeg(CB)];
        };

        this.area = function ()
        {
            var director = G3D.Vector.fix(this.A, this.C);
            var line = (new G3D.Line(this.A, director));
            var h_AC = line.distance(this.B);
            return Sutil.round(0.5 * director.norm() * h_AC);
        };

        this.toString = function ()
        {
            return A.toString() + "; " + B.toString() + "; " + C.toString();
        };
    };

    G3D.Triangle.fromSides = function (r, s, t)
    {
        return new G3D.Triangle(r.intersection(s), s.intersection(t), t.intersection(r));
    };


    G3D.Circumference = function(C, r)
    {
        this.C = C;
        this.r = r;
        
        this.toString = function(){
            
            var r2 = this.r*this.r;
            var str = "";
            var tx = "x^2";
            if(C.x)
            {
                var sv = "-"+C.x;
                if(C.x<0)
                {
                    sv = "+"+C.x;
                }
                
                tx = "(x"+sv+")^2";
            }
            
            var ty = "y^2";
            if(C.y)
            {
                var sv = "-"+C.y;
                if(C.y<0)
                {
                    sv = "+"+C.y;
                }
                
                ty = "(x"+sv+")^2";
            }
            
             
            str = tx+" + "+ty+" = "+r2;  
            
            return str;                                       
        };
        
        
        this.hasPoint = function(P)
        {
            var rx = (P.x-this.C.x)/this.r;
            var ry = (P.y-this.C.y)/this.r;
            return Math.abs(rx*rx+ry*ry-1)<G3D.precision;
        };
                
    };

  G3D.Circumfernce.random = function(){
        var r = 0;
        while(r===0)
        {
            r = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        }
        
        return new G3D.Circumference( G3D.Point.random(), Math.abs(r) );
    };

/**
 * a,b are half axis distance
 * @param {type} a
 * @param {type} b
 * @returns {undefined}
 */
    G3D.Ellipse = function(a, b, C){
        
        if(!C)
        {
            C = G3D.Point.O;
        }
        
        this.a = a;
        this.b = b;
        this.C = C;
        
        
        if(a<b)
        {
            this.a = b;
            this.b = a;            
        }
      
        
        this.toString = function(latex){
            
            var str = "";
            var tx = "x^2";
            if(C.x)
            {
                var sv = "-"+C.x;
                if(C.x<0)
                {
                    sv = "+"+C.x;
                }
                
                tx = "(x"+sv+")^2";
            }
            
            var ty = "y^2";
            if(C.y)
            {
                var sv = "-"+C.y;
                if(C.y<0)
                {
                    sv = "+"+C.y;
                }
                
                ty = "(x"+sv+")^2";
            }
            
            if(latex)
            {
               str = "\\frac{"+tx+"}{"+(this.a*this.a)+"} + \\frac{"+ty+"}{"+(this.b*this.b)+"} = 1"; 
            }
            else
            {
               str = tx+"/"+(this.a*this.a)+" + "+ty+"/"+(this.b*this.b)+" = 1";  
            }
            return str;                                       
        };
        
        this.getExcentricity = function(){
            return this.getHalfFocalDistance()/this.a;
        };
        
        this.getHalfFocalDistance = function(){
            return Math.sqrt(this.a*this.a-this.b*this.b);
        };
        
        this.hasPoint = function(P)
        {
            var rx = (P.x-this.C.x)/this.a;
            var ry = (P.y-this.C.y)/this.b;
            return Math.abs(rx*rx+ry*ry-1)<G3D.precision;
        };
        
    };
    
    G3D.Ellipse.random = function(){
        var a = 0;
        while(a===0)
        {
            a = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        }
        var b = 0;
        while(b===0)
        {
            b = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        }
        return new G3D.Ellipse( Math.abs(a), Math.abs(b) );
    };


/**
 * a,b are half axis distance
 * @param {type} a
 * @param {type} b
 * @returns {undefined}
 */
    G3D.Hyperbole = function(a, b, C){
                
        if(!C)
        {
            C = G3D.Point.O;
        }
        
        this.a = a;
        this.b = b;
        this.C = C;
       
        this.toString = function(latex){
             
            var str = "";
            var tx = "x^2";
            if(C.x)
            {
                var sv = "-"+C.x;
                if(C.x<0)
                {
                    sv = "+"+C.x;
                }
                
                tx = "(x"+sv+")^2";
            }
            
            var ty = "y^2";
            if(C.y)
            {
                var sv = "-"+C.y;
                if(C.y<0)
                {
                    sv = "+"+C.y;
                }
                
                ty = "(x"+sv+")^2";
            }
            
            if(latex)
            {
               str = "\\frac{"+tx+"}{"+(this.a*this.a)+"} - \\frac{"+ty+"}{"+(this.b*this.b)+"} = 1"; 
            }
            else
            {
               str = tx+"/"+(this.a*this.a)+" - "+ty+"/"+(this.b*this.b)+" = 1";  
            }
            return str;                        
        };
        
        this.getExcentricity = function(){
            return this.getHalfFocalDistance()/this.a;
        };
        
        this.getHalfFocalDistance = function(){
            return Math.sqrt(this.a*this.a + this.b*this.b);
        };
        
        this.getAsympotes = function(){
            return [new G3D.Line(this.C, new G3D.Vector(a,b)), new G3D.Line(this.C, new G3D.Vector(-a,b))];
        };
        
         this.hasPoint = function(P)
        {
            var rx = (P.x-this.C.x)/this.a;
            var ry = (P.y-this.C.y)/this.b;
            return Math.abs(rx*rx-ry*ry-1)<G3D.precision;
        };
        
    };
    
    G3D.Hyperbole.random = function(){
        var a = 0;
        while(a===0)
        {
            a = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        }
        var b = 0;
        while(b===0)
        {
            b = Math.floor(Math.random() * (G3D.maxval - G3D.minval)) + G3D.minval;
        }
        return new G3D.Hyperbole( Math.abs(a), Math.abs(b));
    };



    return G3D;
});
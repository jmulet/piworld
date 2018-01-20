/////////////////////////////////////////
//  JS library for Geometry in 2D 
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
    var G2D = G2D || {};

    G2D.minval = -10;
    G2D.maxval = 10;
    G2D.precision = 1e-12;

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

//Create class Point
    G2D.Point = function (x, y)
    {
        this.x = x;
        this.y = y;
        this.label = "A";

        //Returns the symmetric respect to B
        this.symmetric = function (B)
        {
            return new G2D.Point(2 * B.x - this.x, 2 * B.y - this.y);
        }

        this.clone = function ()
        {
            return new G2D.Point(this.x, this.y);
        };

        this.toString = function ()
        {
            return this.label + "(" + this.x + ", " + this.y + ")";
        };
    };

    G2D.Point.random = function ()
    {
        var x = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        var y = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        return new G2D.Point(x, y);
    };

    G2D.Point.midPoint = function (A, B)
    {
        return new G2D.Point(0.5 * (A.x + B.x), 0.5 * (A.y + B.y));
    };

    G2D.Point.distance = function (A, B)
    {
        return G2D.Vector.fix(A, B).norm();
    };

    G2D.Point.areAligned = function (A, B, C)
    {
        var v1 = G2D.Vector.fix(A, B);
        var v2 = G2D.Vector.fix(A, C);
        return v1.isParallel(v2);
    };

    G2D.Point.O = new G2D.Point(0, 0);

    G2D.Point.parse = function (str)
    {
        var tmp = str.trim();
        var i0 = tmp.indexOf("(");
        var i1 = tmp.indexOf("[");
        var comps;
        var x = 0;
        var y = 0;
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
        if (comps.length === 2)
        {
            try{
                x = parseFloat(comps[0]);
                y = parseFloat(comps[1]);
            }
            catch(e){
                console.log("G2D.Point.parse:"+e);
            }
        }
        var point = new G2D.Point(x, y);
        point.label = label;
        return point;
    };


//Define Vector class
    G2D.Vector = function (x, y, label)
    {
        this.x = x;
        this.y = y;
        if(typeof(label)==='undefined')
        {
            this.label = "v";
        }
        else
        {
            this.label = label;
        }
        if(typeof(x)==='string')
        {
            if(x.trim().length===0)
            {
                x = "0";
            }
            try{
                this.x = eval(x.replace(',','.'));
            }catch(e){
                console.log("G2D.Vector.constructor"+e);
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
                console.log("G2D.Vector.constructor"+e);
            }
        }
        this.toString = function ()
        {
            return this.label + "(" + this.x + ", " + this.y + ")";
        };

        this.clone = function ()
        {
            return new G2D.Vector(this.x, this.y);
        };

        this.norm = function ()
        {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };

        this.isParallel = function (v)
        {
            return Math.abs(this.x * v.y - this.y * v.x) < G2D.precision;
        };

        this.isPerpendicular = function (v)
        {
            return Math.abs(this.x * v.x + this.y * v.y) < G2D.precision;
        };

        this.unitary = function ()
        {
            var norma = this.norm();
            return new G2D.Vector(this.x / norma, this.y / norma);
        };

        this.perpendicular = function ()
        {
            return new G2D.Vector(-this.y, this.x);
        };

        this.escalarProduct = function (v)
        {
            return v.x * this.x + v.y * this.y;
        };

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

    G2D.Vector.fix = function (A, B)
    {
        return new G2D.Vector(B.x - A.x, B.y - A.y);
    };

    G2D.Vector.i = new G2D.Vector(1, 0);
    G2D.Vector.j = new G2D.Vector(0, 1);

    G2D.Vector.random = function ()
    {
        x = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        y = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        return new G2D.Vector(x, y);
    };

    G2D.Vector.parse = function (str)
    {
        var tmp = str.trim();
        var i0 = tmp.indexOf("(");
        var i1 = tmp.indexOf("[");
        var comps;
        var x = 0;
        var y = 0;
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
        if (comps.length === 2)
        {
           try{ 
             x = parseFloat(comps[0]);
             y = parseFloat(comps[1]);
         }
         catch(e){
             console.log("G2D.Vector.parse: "+e);
         }
        }
        var vec = new G2D.Vector(x, y);
        vec.label = label;
        return vec;
    };


//Define G2D.Line class

//Line defined by a point and a vector
    G2D.Line = function (P, d)
    {
        G2D.Line.vectorialType = 0;
        G2D.Line.parametricType = 1;
        G2D.Line.continuousType = 2;
        G2D.Line.generalType = 3;
        G2D.Line.explicitType = 4;
        G2D.Line.segmentaryType = 5;

        this.P = P;
        this.d = d;
        this.type = G2D.Line.generalType;
        this.param = "t";

        this.clone = function ()
        {
            return new G2D.Line(this.P.clone(), this.d.clone());
        };

        this.slope = function ()
        {
            return this.d.y / this.d.x;
        };

        this.hasPoint = function (Q)
        {
            var remainder = this.d.y * (Q.x - this.P.x) - this.d.x * (Q.y - this.P.y);
            console.log("hasPoint remainder = "+remainder);
            return Math.abs(remainder) < G2D.precision;
        };

        this.hasVector = function (v)
        {
            return Math.abs(this.d.x * v.y - this.d.y * v.x) < G2D.precision;
        };

        this.hasNormal = function (v)
        {
            return Math.abs(this.d.x * v.x + this.d.y * v.y) < G2D.precision;
        };

        this.intersectionX = function ()
        {
            return this.intersection(G2D.Line.xAxis);
        };

        this.intersectionY = function ()
        {
            return this.intersection(G2D.Line.yAxis);
        };

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
                console.log("Lines are not parallell "+this.toString()
                        +"   "+s.toString());
                return false;
            }
            
            return this.hasPoint(s.P);
        };

        this.getParallel = function (A)
        {
            return new G2D.Line(A, this.d);
        };

        this.getPerpendicular = function (A)
        {
            return new G2D.Line(A, this.d.perpendicular());
        };

        this.angleRad = function (s)
        {
            return this.d.angleRad(s.d);
        };

        this.angleDeg = function (s)
        {
            return this.d.angleDeg(s.d);
        };

        this.distance = function (obj)
        {
            if (obj instanceof G2D.Point)
            {
                var PR = G2D.Vector.fix(this.P, obj);
                return Math.abs(PR.projectionOver(this.d.perpendicular().unitary()));
            }
            else if (obj instanceof G2D.Line)
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
            return new G2D.Point(this.P.x + t * this.d.x, this.P.y + t * this.d.y);
        };

        this.newPointRandom = function ()
        {
            var t = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
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
            return new G2D.Point(x, y);
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
            if (this.type === G2D.Line.vectorialType)
            {
                return this.getVectorialForm(ml);
            }
            else if (this.type === G2D.Line.parametricType)
            {
                return this.getParametricForm(ml);
            }
            else if (this.type === G2D.Line.continuousType)
            {
                return this.getcontinuousForm(ml);
            }
            else if (this.type === G2D.Line.generalType)
            {
                return this.getGeneralForm(ml);
            }
            else if (this.type === G2D.Line.explicitType)
            {
                return this.getExplicitForm(ml);
            }
            else if (this.type === G2D.Line.segmentaryType)
            {
                return this.getSegmentaryForm(ml);
            }
            return "undefined type";
        };

    };

    G2D.Line.segment = function (A, B)
    {
        return new G2D.Line(A, G2D.Vector.fix(A, B));
    };

    G2D.Line.mediatrice = function (A, B)
    {
        return new G2D.Line(G2D.Point.midPoint(A, B), G2D.Vector.fix(A, B).perpendicular());
    };


    G2D.Line.random = function ()
    {
        var d = G2D.Vector.random();
        //vector cannot be 0, it would define no direction so no line...
        while (d.norm() === 0)
        {
            d = G2D.Vector.random();
        }
        var type = Math.floor(Math.random() * 5);
        var line = new G2D.Line(G2D.Point.random(), d);
        line.type = type;
        return line;
    };

   //Creates a new line from its general equation Ax+By=C
   //Returns null if  str cannot be parsed
    G2D.Line.parse = function (str)
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
                console.log("G2D.Line.parse: "+e);
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
            console.log("G2D.Line.parse: "+e);
            return null;
        }
        x = 0;
        y = 1;
        try{
            B = eval(left);
        }catch(e){
            console.log("G2D.Line.parse: "+e);
            return null;            
                   
        }
        //console.log("ABC"+A+", "+B+", "+C);
        var line = G2D.Line.fromGeneralCoefs(A, B, C);
        //console.log(line.toString());
        return line;
    };

    G2D.Line.fromGeneralCoefs = function (A, B, C)
    {
        var vec = new G2D.Vector(-B, A);
        
        var P;
        
        if(A!=0)
        {
            P = new G2D.Point(C/A, 0);
        }
        else
        {
            P = new G2D.Point(0, C/B);
        }
               
        return new G2D.Line(P, vec);
    };

    G2D.Line.xAxis = new G2D.Line(G2D.Point.O, G2D.Vector.i);
    G2D.Line.yAxis = new G2D.Line(G2D.Point.O, G2D.Vector.j);


//Define the triangle class
    G2D.Triangle = function (A, B, C)
    {
        this.A = A;
        this.B = B;
        this.C = C;

        this.lines = function ()
        {
            return [new G2D.Line(this.C, G2D.Vector.fix(this.B, this.C)), new G2D.Line(this.A, G2D.Vector.fix(this.A, this.C)),
                new G2D.Line(this.B, G2D.Vector.fix(this.A, this.B))];
        };

        this.sides = function ()
        {
            return [G2D.Point.distance(this.B, this.C), G2D.Point.distance(this.A, this.C), G2D.Point.distance(this.A, this.B)];
        };

        this.heightLines = function ()
        {
            return [new G2D.Line(this.B, G2D.Vector.fix(this.A, this.C).perpendicular()),
                new G2D.Line(this.A, G2D.Vector.fix(this.B, this.C).perpendicular()),
                new G2D.Line(this.C, G2D.Vector.fix(this.A, this.B).perpendicular)
            ];
        };

        this.medianas = function ()
        {
            return [G2D.Line.segment(G2D.Point.midPoint(this.A, this.C), this.B),
                G2D.Line.segment(G2D.Point.midPoint(this.C, this.B), this.A),
                G2D.Line.segment(G2D.Point.midPoint(this.A, this.B), this.C)
            ];
        };

        this.mediatrices = function ()
        {
            return [G2D.Line.mediatrice(this.A, this.B),
                G2D.Line.mediatrice(this.A, this.C),
                G2D.Line.mediatrice(this.B, this.C)
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
            var AB = G2D.Vector.fix(this.A, this.B);
            var AC = G2D.Vector.fix(this.A, this.C);

            var BA = G2D.Vector.fix(this.B, this.A);
            var BC = G2D.Vector.fix(this.B, this.C);

            var CA = G2D.Vector.fix(this.C, this.A);
            var CB = G2D.Vector.fix(this.C, this.B);

            return [AB.angleRad(AC), BA.angleRad(BC), CA.angleRad(CB)];
        };

        this.anglesDeg = function ()
        {
            var AB = G2D.Vector.fix(this.A, this.B);
            var AC = G2D.Vector.fix(this.A, this.C);

            var BA = G2D.Vector.fix(this.B, this.A);
            var BC = G2D.Vector.fix(this.B, this.C);

            var CA = G2D.Vector.fix(this.C, this.A);
            var CB = G2D.Vector.fix(this.C, this.B);

            return [AB.angleDeg(AC), BA.angleDeg(BC), CA.angleDeg(CB)];
        };

        this.area = function ()
        {
            var director = G2D.Vector.fix(this.A, this.C);
            var line = (new G2D.Line(this.A, director));
            var h_AC = line.distance(this.B);
            return Sutil.round(0.5 * director.norm() * h_AC);
        };

        this.toString = function ()
        {
            return A.toString() + "; " + B.toString() + "; " + C.toString();
        };
    };

    G2D.Triangle.fromSides = function (r, s, t)
    {
        return new G2D.Triangle(r.intersection(s), s.intersection(t), t.intersection(r));
    };


    G2D.Circumference = function(C, r)
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
            return Math.abs(rx*rx+ry*ry-1)<G2D.precision;
        };
                
    };

  G2D.Circumfernce.random = function(){
        var r = 0;
        while(r===0)
        {
            r = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        }
        
        return new G2D.Circumference( G2D.Point.random(), Math.abs(r) );
    };

/**
 * a,b are half axis distance
 * @param {type} a
 * @param {type} b
 * @returns {undefined}
 */
    G2D.Ellipse = function(a, b, C){
        
        if(!C)
        {
            C = G2D.Point.O;
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
            return Math.abs(rx*rx+ry*ry-1)<G2D.precision;
        };
        
    };
    
    G2D.Ellipse.random = function(){
        var a = 0;
        while(a===0)
        {
            a = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        }
        var b = 0;
        while(b===0)
        {
            b = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        }
        return new G2D.Ellipse( Math.abs(a), Math.abs(b) );
    };


/**
 * a,b are half axis distance
 * @param {type} a
 * @param {type} b
 * @returns {undefined}
 */
    G2D.Hyperbole = function(a, b, C){
                
        if(!C)
        {
            C = G2D.Point.O;
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
            return [new G2D.Line(this.C, new G2D.Vector(a,b)), new G2D.Line(this.C, new G2D.Vector(-a,b))];
        };
        
         this.hasPoint = function(P)
        {
            var rx = (P.x-this.C.x)/this.a;
            var ry = (P.y-this.C.y)/this.b;
            return Math.abs(rx*rx-ry*ry-1)<G2D.precision;
        };
        
    };
    
    G2D.Hyperbole.random = function(){
        var a = 0;
        while(a===0)
        {
            a = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        }
        var b = 0;
        while(b===0)
        {
            b = Math.floor(Math.random() * (G2D.maxval - G2D.minval)) + G2D.minval;
        }
        return new G2D.Hyperbole( Math.abs(a), Math.abs(b));
    };



    return G2D;
});
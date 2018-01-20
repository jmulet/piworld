       
module.exports = function(){
  
  var xml2js = require('xml2js');
  var fs = require('fs');
 
  var exermath = {};
  
  var getArgs = function(str)
  {
      var i0 = str.indexOf("[");
      var i1 = str.indexOf("]");
      var s = str.slice(i0+1,i1);
      return s.split(",");
  };
  
  
  var ranz = function(min, max)
  {
        return Math.floor(Math.random()*(max-min))+min;
  };
  
  /**
   * Generate a polynomial of degree g, with values within the grup cos
   * with roots within min and max.
   * @param {type} g
   * @param {type} cos
   * @param {type} min
   * @param {type} max
   * @returns {string}
   */
  exermath.rpolz = function(g, cos, min, max, bar){
      try{
        g = parseInt(g);
        cos = cos.trim().toUpperCase();
        min = parseInt(min);
        max = parseInt(max);
      }
      catch(ex)
      {
          console.log(ex);
      }
      
      console.log(g+" "+cos+" "+min+" "+max);
      
      var p = "";
      var sep = "";
      for(var i =0; i<g; i++)
      {
          p += sep+"("+bar+"-("+ranz(min,max)+"))";
          sep = "*";
      }
     
      
      return p;
  };
          
  exermath.parse = function(file){
        var parser = new xml2js.Parser();
        fs.readFile(file, function(err, data) {
        parser.parseString(data, function (err, result) {
        var r = result.exercises;
        console.log(JSON.stringify(r));
        console.log('Done');
        console.log("Title: "+r.title);
        console.log("Exercises: ");
        r.exercise.forEach(function(e){
            var repeat = e.repeat || 1;
            for(var i=0; i<repeat; i++)
            {
                var p = e.parameters[0];
                var eq = p.eq[0];
                var bar= p.var[0];
                if(eq.trim().indexOf('rpolz')===0)
                {
                    var args = getArgs(eq);
                    console.log(args);
                    eq = exermath.rpolz(args[0] || 2, args[1] || 'Z', args[2] || -5, args[3] || 5, bar);
                }
                console.log("\t"+eq+" "+bar);
            }
            
        });
        });      
    });
  };
   
  return exermath;
};
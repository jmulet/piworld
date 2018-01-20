
    if(!String.prototype.startsWith){
        String.prototype.startsWith = function(prefix) {
            return this.indexOf(prefix) === 0;
        };
    }

    if(!String.prototype.endsWith){
        String.prototype.endsWith = function(suffix) {
            return this.match(suffix+"$") == suffix;
        };
    }

   var UTIL = {
    evalInContext: function (source, context) {
        source = '(function(' + Object.keys(context).join(', ') + ') { return ' + source + ';})';

        var compiled = eval(source);

        return compiled.apply(context, values());

        // you likely don't need this - use underscore, jQuery, etc
        function values() {
            var result = [];
            for (var property in context)
                if (context.hasOwnProperty(property))
                    result.push(context[property]);
            return result;
        }
    }
};
    
    
    module.exports = UTIL;



define([], function(){   
     
   var genericRunner = function(url)
   {
        var ajax;
        if($.ajax){
            ajax = $.ajax;
        }
        else {
            
            var Deferred = function(){};
            Deferred.prototype = {
                resolve: function(data){
                    this.success && this.success(data);
                },
                reject: function(data){
                    this.error && this.error(data);
                },
                then: function(successcb, errcb){
                    this.success = successcb;
                    this.error = errcb;
                }
            };
            
            ajax = function(bean){
                var defer = new Deferred();
                
                var params = typeof(bean.data) === 'string' ? bean.data : Object.keys(bean.data).map(
                        function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(bean.data[k]); }
                    ).join('&');

                var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
                xhr.open('POST', bean.url);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState>3 && xhr.status===200) { 
                        defer.resolve(xhr.responseText); 
                    } else {
                        defer.reject(xhr);
                    }
                };
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                xhr.setRequestHeader('Content-Type', bean.contentType);
                xhr.send(params);
                
                return defer; //xhr;
            };
        }
       
        var runner = function(data, useFile)
        {
                var params = {};
                if(typeof(data)==='string')
                {
                    params.script = data;
                }
                else
                {
                    params.lines = data;
                }
                params.useFile = useFile || false;
                
                return ajax({type: "POST",
                                url:  url, 
                                data: JSON.stringify(params),
                                contentType: "application/json"});
             };

            return runner;
    };

    var maxima = {};    
    var sympy = {};
    var yacas = {};
    maxima.run = genericRunner('/rest/cas/maxima');
    sympy.run = genericRunner('/rest/cas/sympy');
    yacas.run = genericRunner('/rest/cas/yacas');

      
    return {maxima: maxima, sympy: sympy, yacas: yacas};
        
 });
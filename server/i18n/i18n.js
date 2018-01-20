 module.exports = function(app){
  
  var cache = {};
  
  var i18n = function(req, res)
  {
      if(!req.query.lang)
      {
          res.status(500).send();
          return;
      }
      
      var lang = req.query.lang;
      if(lang.indexOf("-")>=0)
      {
          lang = lang.substring(0, lang.indexOf("-"));
      }
     
      if(cache[lang])
      {
              res.send(cache[lang])
              return;
      }
      try{        
          var path = __dirname+"/"+lang+".json";
          var json = require(path);
          cache[lang] = json;
          res.send(json)
      }
      catch(err){
          if(cache[lang])
          {
              res.send(cache[lang])
              return;
          }
          try{
              var path = __dirname+"/en.json";  //fallback default language
              var json = require(path);
              cache[lang] = json;
              res.send(json)
          }
          catch(err)
          {
            res.status(404).send();
          }
      }
  };
   
  app.get('/rest/i18n/lang', i18n);
};
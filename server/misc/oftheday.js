module.exports = function(app)
{  
    //Preload stuff from json files
    var eqns = require('./equations.json');
    var quotes = require('./quotes.json');
    var async = require('async');
    
    var removeHypen = function(l){
        if(l && l.indexOf("-")>0){
            return l.split("-")[0];
        }
        return l;
    };
    
    
    var api = {
        getEqn: function(req){
            var lang = removeHypen(app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY")) || 'en';
            var rnd = eqns[Math.floor(Math.random()*eqns.length)];
            var title = (rnd['title_'+lang] || rnd.title) || '';
            var url = (rnd['url_'+lang] || rnd.url) || '';
            return {eqn: rnd.eqn, title: title, url: url};
        },
        getQuote: function(req){
              var lang = removeHypen(app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY")) || 'en';              
              var rnd = quotes[Math.floor(Math.random()*quotes.length)];
              var title = rnd[lang] || rnd.en || '';
              return {quote: title, author: rnd.author};
        } 
    };
    
    var eqn = function eqn(req, res)
    {
        res.send(api.getEqn(req));
    };
    
    var eqn_all = function eqn(req, res)
    {        
        res.send(eqns);
    };
  
    var quote = function quote(req, res)
    {
        res.send(api.getQuote(req));
    };
    
 
    /**
     * Requires idUser and level
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var all = function all(req, res)
    {
        var p = req.body;
        var lang = p.lang || app.removeHypen(app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY")) || "en";
        var level = "";
        if(p.level>=0){
            level = " AND level='"+p.level+"' ";
        }
        var sql = "SELECT * FROM challenges WHERE w=WEEK(now(),1) "+level+" ORDER BY id DESC  LIMIT 1";
        var bean = {eqn: api.getEqn(req), quote: api.getQuote(req)};
        
        var err = function(d){
            res.send(bean);
        };
        
        var ok = function(d){
            if(d.result.length){
                bean.problem = d.result[0];   
                //Decide which type of problem is: old {"ca":"1+1?"} or
                //the json format "[{"formulation":"","type":"",....}]"
                if(bean.problem.formulation.indexOf('"formulation"')>0 && bean.problem.formulation.indexOf('"type"')>0){
                    bean.problem.quizz = bean.problem.formulation;
                } else {
                    bean.problem.formulation = app.i18n_processor(bean.problem.formulation, lang);
                }
                                
                //Load the user answer to this challenge
                var sql2;
                if(p.idGroup){
                    sql2 = "SELECT * FROM challenges_quizz as cq INNER JOIN enroll as e ON e.idUser=cq.idUser WHERE idChallenge='"+bean.problem.id+"' AND e.idGroup='"+p.idGroup+"'";
                } else {
                    sql2 = "SELECT * FROM challenges_quizz WHERE idChallenge='"+bean.problem.id+"' AND idUser='"+p.idUser+"' LIMIT 1";
                }
                var ok2 = function(d2){                   
                        if(p.idGroup){
                            bean.problem.userAnswer = d2.result;
                        } else {
                            if(d2.result.length){
                                bean.problem.userAnswer = d2.result[0];
                            }
                        }                    
                    res.send(bean);
                };                
                app.db.query(sql2, ok2, err)();
            } 
            else {
                res.send(bean);
            }
        };
        app.db.query(sql, ok, err)();
    };
 
 
    var challenge_list = function challenge_list(req, res){
        var p = req.body;
        
        var sql;
        var lang = p.lang || app.removeHypen(app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY")) || "en";
        
        if(p.idUser){
            sql = "SELECT c.*, cq.id as cqid, cq.`when`, cq.answer, cq.valid  FROM challenges_quizz as cq INNER JOIN challenges as c on c.id=cq.idChallenge WHERE idUser="+p.idUser+" ORDER BY cq.`when`";
        } else if(p.id){   
            if(p.idGroup){
                sql = "SELECT c.*, cq.id as cqid, cq.`when`, cq.answer, cq.valid, u.fullname FROM challenges_quizz as cq INNER JOIN challenges as c on c.id=cq.idChallenge INNER JOIN users as u ON u.id=cq.idUser INNER JOIN enroll as e ON e.idUser=cq.idUser WHERE c.id="+p.id+" AND e.idGroup="+p.idGroup+"  ORDER BY cq.`when`";        
            } else {
                sql = "SELECT c.*, cq.id as cqid, cq.`when`, cq.answer, cq.valid, u.fullname FROM challenges_quizz as cq INNER JOIN challenges as c on c.id=cq.idChallenge INNER JOIN users as u ON u.id=cq.idUser WHERE c.id="+p.id+" ORDER BY cq.`when`";        
            }
        } else{
            //Include the total number of answers and pending corrections   
            if(p.idGroup){
                sql = "SELECT c.*, count(cq.id) as total, count(CASE WHEN cq.valid IS NULL THEN 1 ELSE NULL END) as pending FROM challenges as c LEFT JOIN `challenges_quizz` as cq on cq.idChallenge=c.id INNER JOIN enroll as e ON e.idUser=cq.idUser WHERE e.idGroup="+p.idGroup+" ";
            } else {
                sql = "SELECT c.*, count(cq.id) as total, count(CASE WHEN cq.valid IS NULL THEN 1 ELSE NULL END) as pending FROM challenges as c LEFT JOIN `challenges_quizz` as cq on cq.idChallenge=c.id WHERE 1=1 ";
            }
            if(p.level>=0){
              sql += " AND c.level = "+p.level;    
            } 

            if(p.w){
              sql += " AND c.w = "+p.w;    
            } 

            if(p.text){
              sql += " AND c.formulation LIKE '%"+p.text+"%' ";    
            }
            sql += " group by c.id";
        }
                
        var err = function(){
            res.send([]);
        };
        var ok = function(d){
            if(!p.noparse){
                d.result.forEach(function(e){
                     e.formulation = app.i18n_processor(e.formulation, lang);
                });
            }
            res.send(d.result);
        };
        app.db.query(sql, ok, err)();
    };
    
 
    var challenge_save = function challenge_save(req, res){
        var p = req.body;
        
        var sql;
        var objs = {w: p.w || 0, level: p.level || 0, formulation: p.formulation || "", score: p.score || 150};
        if(p.ranswer){
            objs.ranswer = p.ranswer;
        } else {
            objs.ranswer = null;
        }
        if(p.id){
            sql = "UPDATE challenges SET ? WHERE id="+p.id;
        } else {
            sql = "INSERT INTO challenges SET ?";
        }
        var err = function(){
            res.send({ok: false});
        };
        var ok = function(){
            res.send({ok: true});
        };
        app.db.queryBatch(sql, objs, ok, err)();
    };
    
    var challenge_delete = function challenge_delete(req, res){
        var p = req.body;
        var sqls = ["DELETE FROM challenges_quizz WHERE idChallenge='"+p.id+"'", 
                    "DELETE FROM challenges WHERE id="+p.id];
        
        var worker = function(sql, cb){
            app.db.query(sql, cb, cb)();
        };
        
        async.map(sqls, worker, function(){
            res.send({ok: true});
        });
    };
    
    var challenge_register = function challenge_register(req, res){
        var p = req.body;
        
        var sql;
        var  objs = {idChallenge: p.idChallenge, idUser: p.idUser, answer: p.answer || ""};
        if(p.id){
            objs.valid = p.valid;
            sql = "UPDATE challenges_quizz SET `when`=NOW(), ? WHERE id="+p.id;
        } else {
            sql = "INSERT INTO challenges_quizz SET `when`=NOW(), ?";            
        }
        var err = function(){
            res.send({});
        };
        var ok = function(d){
            var id = p.id || d.result.insertId;
            res.send({id: id, idChallenge: p.idChallenge, idUser: p.idUser, answer: p.answer, valid: p.valid});
        };
        app.db.queryBatch(sql, objs, ok, err)();
    };
 
 
  var challenge_correct = function challenge_register(req, res){
        var p = req.body;                
        var sql = "UPDATE challenges_quizz SET valid="+(p.valid===null?"NULL":p.valid)+" WHERE id="+p.id;
        
      var err = function(){
            res.send({});
      };
      var ok = function(d){
            res.send({ok: true});
      };
      app.db.query(sql, ok, err)();
    };
    
    app.post('/rest/oftheday/eqn', eqn);
    app.post('/rest/oftheday/eqns', eqn_all);
    app.post('/rest/oftheday/quote', quote);
    app.post('/rest/oftheday/all', all);
  
    app.post('/rest/challenge/list', challenge_list);
    app.post('/rest/challenge/save', challenge_save);
    app.post('/rest/challenge/delete', challenge_delete);
    app.post('/rest/challenge/register', challenge_register);
    app.post('/rest/challenge/correct', challenge_correct);
};
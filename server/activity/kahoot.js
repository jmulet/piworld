module.exports = function(app){
    
   var async = require("async"); 
    
   //$http.post("/rest/kahoot/ini", {idActivity: $stateParams.idActivity, idAssignment: $stateParams.idAssignment, teacher: Session.getUser().id})  
    
   var ini = function(req, res){
       var p = req.body;
       var sql = "INSERT INTO kahoot SET idActivity='"+p.idActivity
               +"', idAssignment='"+p.idAssignment+"', idTeacher='"+p.teacher+"', idGroup='"+p.idGroup+"', `start`=NOW()";
       
       var error = function(){
            res.send({kahootID: -1});
       };
       
       var ok = function(d){
            res.send({kahootID: d.result.insertId});
       };
       
       app.db.query(sql,ok, error)();
   };
   
     
   var close = function(req, res){
       var p = req.body;
       var sql = "UPDATE kahoot SET `end`=NOW() WHERE id='"+p.kahootID+"' AND `end` IS NULL";
       
       var error = function(){
            res.send({ok: false});
       };
       
       var ok = function(d){
            res.send({ok: true});
       };
       
       app.db.query(sql,ok, error)();
   };
   
   /**
    * Lists all kahoots played on a given idAssignment
    * @param {type} req
    * @param {type} res
    * @returns {undefined}
    */
   var list = function(req, res){
       var p = req.body;
       var sql = "SELECT * FROM kahoot WHERE idAssignment='"+p.idAssigment+"'";
       if(p.idActivity){
           sql += " AND idActivity='"+p.idActivity+"'";
       }
       if(p.idGroup){
           sql += " AND idGroup='"+p.idGroup+"'";
       }
       
       var error = function(){
            res.send([]);
       };
       
       var ok = function(d){
            res.send(d.result);
       };
       
       app.db.query(sql,ok, error)();
   };
   
   //Loads all attempt data for a given kahoot ID
   var load = function(req, res){
       var p = req.body;
       var players = [];
       
       //There is an attempt entry for each player in this kahoot id
       var sql = "select att.*, u.fullname, u.id as idUser from attempts as att inner join logins as l on l.id=att.idLogins inner join users as u on u.id=l.idUser WHERE att.idKahoot='"+p.kahootID+"' order by u.fullname asc";
       var error = function(){
            res.send(players);
       };
       
       var ok = function(d){
            players = d.result;
            
            players.forEach(function(p){
                p.questionMap = {};
            });
            
            
            //Process a single user activity, i.e., load questions, steps and answers for the given p.id --> this is the idAttempt
            var processor = function(p, cb){
                
                 
                var sql1 = "select * from questions where idAttempt='"+p.id+"'";
                var ok1 = function(d1){
                    //For every question - load the associated steps
                    
                    var processQuestions = function(qu, cbqu){
                         
                        var sql2 = "select * from steps where idQuestion='"+qu.id+"'";
                
                        var ok2 = function(d2){
                             //Assume a single-step for Kahoot
                             if(d2.result.length===1){
                                    var d2r = d2.result[0];
                                    var sql3 = "select * from answers where idStep='"+d2r.id+"'";
                             
                                    var ok3 = function(d3){
                                        //Assume a single-answer for step for Kahoot
                                        var d3r = d3.result[0];
                                        var key = qu.question+" :: "+d2r.step + " :: "+d2r.rightAnswer;
                                        p.questionMap[key] = {answer: d3r.answer, valid: d3r.isCorrect==='S', seconds: d2r.seconds};                                        
                                        cbqu();
                                    };

                                    app.db.query(sql3, ok3, cbqu)();
                             } 
                             else {
                                 cbqu();
                             }
                             
                        };
                        
                        app.db.query(sql2, ok2, cbqu)();
                    };
                    
                    async.map(d1.result, processQuestions, function(){
                        cb();
                    });
                };
                
                app.db.query(sql1, ok1, cb)();
            };           
            
            
            
            
            //Post process players
            
            async.map(players, processor, function(){
                
                
               
                //Post process players in order to render a matrix form
                //Transform questionMap into questionList
                //1st get all keys from list of objs
                var keys = [];
                var header1 = {fullname: "", questionList: []};
                var timeMap = {}; //Used to compute the mean time per question
                players.forEach(function(p){                    
                    p.questionList = [];
                    for(var key in p.questionMap){
                        var obj = timeMap[key];
                        if(obj){
                            obj.n += 1;
                            obj.t += p.questionMap[key].seconds || 0;
                        } else {
                            timeMap[key] = {n: 1, t: p.questionMap[key].seconds || 0};
                        }
                        
                        if(keys.indexOf(key)<0){
                            keys.push(key);
                            //Add a header row in players table at top
                            var tmp = key.split(" :: ");
                            header1.questionList.push({question: tmp[0], step: tmp[1], rightAnswer: tmp[2], meanObj: timeMap[key]});
                        }
                    }
                });
                
                //Build headers meantime
                header1.questionList.forEach(function(h){
                    h.meanTime = h.meanObj.n>0? h.meanObj.t/h.meanObj.n : 0;
                    delete h.meanObj;
                });
                
                //2nd Build question list
                players.forEach(function(p){                   
                   
                    keys.forEach(function(k){
                    
                          var obj = p.questionMap[k];
                          if(obj){
                              p.questionList.push(obj);
                          } else {
                              p.questionList.push({});   
                          }
                        
                    });
                    
                    delete p.questionMap;
                    
                });
                
                
                //Add header at top
                players.unshift(header1);
                
                res.send(players);
            });
                        
       };
       
       app.db.query(sql, ok, error)();
       
};

       //Pass kahootID
       var delKahoot = function(req, res){
            var p = req.body;
            
            //Comença esborrant totes les answers
            var sql1 = "DELETE a FROM answers as a INNER JOIN steps as s ON s.id=a.idStep INNER JOIN questions as q ON q.id=s.idQuestion INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN kahoot as k ON k.id=att.idKahoot WHERE k.id='"+p.kahootID+"'";
            //Delete steps
            var sql2 = "DELETE s FROM steps as s INNER JOIN questions as q ON q.id=s.idQuestion INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN kahoot as k ON k.id=att.idKahoot WHERE k.id='"+p.kahootID+"'";
            //Delete questions
            var sql3 = "DELETE q FROM questions as q INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN kahoot as k ON k.id=att.idKahoot WHERE k.id='"+p.kahootID+"'";
            //Delete attempts
            var sql4 = "DELETE att FROM attempts as att INNER JOIN kahoot as k ON k.id=att.idKahoot WHERE k.id='"+p.kahootID+"'";
            //Delete kahoot entry
            var sql5 = "DELETE FROM kahoot WHERE id='"+p.kahootID+"'";
            
            var affected = 0;
            
            var success = function(d){
                affected += d.result.affectedRows;
            };
            
            var q1 = app.db.query(sql1, success);
            var q2 = app.db.query(sql2, success);
            var q3 = app.db.query(sql3, success);
            var q4 = app.db.query(sql4, success);
            var q5 = app.db.query(sql5, success);
            
            q1().then(q2).then(q3).then(q4).then(q5).then(function(){
                res.send({ok: affected>0, affected: affected});
            });
       
       };
       
      
    
   
   app.post("/rest/kahoot/ini", ini);
   app.post("/rest/kahoot/close", close);
   app.post("/rest/kahoot/list", list);
   app.post("/rest/kahoot/load", load);
   app.post("/rest/kahoot/delete", delKahoot);
    


};
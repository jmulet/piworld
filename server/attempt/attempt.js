/*
 * Attempt API, used internally by ActivityBase class
 * implemented by every activity definition
 */
module.exports = function(app){
    
    var Brain = require('../misc/brain');
    var Remover = require('../misc/remover');
    var async = require("async");


    /*
     * close a step
     
    var closeStep = function(req, res)
    {
        var p = req.body;
        
        var sql = "UPDATE steps SET askHelp='"+p.askHelp+"', askSolution='"+
            p.askSolution+"', askTheory='"+p.askTheory+"', `seconds`="+
            p.seconds+" WHERE id="+p.idStep;
        
        //In case of askSolution, must register a wrong answer to the Brain
        if(p.askSolution==='S'){
            var b = Brain.getBrain(app.db, p.idUser);
            if(b){
                b.register(p.idSubject, p.category, false);
            }
        }
        
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        app.db.query(sql, success, error)();
    };

    **/
    
    /**
     * Create a new attempt
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var create = function(req, res)
    {
        var p = req.body;
      
        var sql = "INSERT INTO attempts (idLogins, idActivity, idAssignment, idGroup, attemptStart, level) VALUES('"+(p.idLogin || 0)+
             "','"+(p.idActivity || 0)+"',"+(p.idAssignment || 0)+", '"+p.idGroup+"' ,NOW(), "+(p.level || 0)+")";

        var success = function(d){
            res.send({idAttempt: d.result.insertId || 0});
        };
        
        var error = function(d){
            res.send({idAttempt: 0});
        };
        app.db.query(sql, success, error)();
    };

   /**
     * Updates an attempt
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var update = function(req, res)
    {
        var p = req.body;
        var sql = "UPDATE attempts SET score="+(p.score || 0)+
                ", level="+(p.level || 1)+", attemptEnd=NOW() WHERE id="+p.idAttempt;
        
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        app.db.query(sql, success, error)();
    };
    

     /*
     * Close attempt
     */
    var close = function(req, res)
    {
        var p = req.body;
        var sql = "UPDATE attempts SET attemptEnd=NOW(), done='"+(p.finished?'S':'N')+"', score="+(p.score || 0)+
        ", level="+(p.level || 1)+" WHERE id="+p.idAttempt;
        
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        app.db.query(sql, success, error)();
    };

    
    var createQuestion = function(req, res)
    {
        var p = req.body;  
        
        var sql = "INSERT INTO questions SET ?";

        var values = {idAttempt: p.idAttempt, question: p.question || "", rightAnswer: p.rightAnswer || "", category: p.category || '', level: p.level};
 
        var success = function(d){
            res.send({idQuestion: d.result.insertId});
        };
        
        var error = function(d){
            res.send({idQuestion: 0});
        };
        app.db.queryBatch(sql, values, success, error)();
    };


    /*
     * close a question
     */
    var closeQuestion = function(req, res)
    {
        var p = req.body;
        
        var sql = "UPDATE questions SET ? WHERE id="+p.idQuestion;
        
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
 
        var obj = {seconds: p.seconds || 0, score: p.score || 0, level: p.level || 0, askTheory: p.askTheory?'S':'N',
        askHelp: p.askHelp?'S':'N', askAnswer: p.askAnswer?'S':'N'};

        app.db.queryBatch(sql, obj, success, error)();
    };


    var registerAnswer = function(req, res)
    {
        var p = req.body;
 
        var sql = "INSERT INTO answers SET ?";
        var values = {idQuestion: p.idQuestion || 0, answer: p.answer || "", isCorrect: p.isCorrect? 'S' : 'N'};
        
        //Pass this answer to the brain
//        var brain = Brain.getBrain(app.db, p.idUser);
//        if(brain){
//            brain.register(p.idSubject, p.category, p.isCorrect==='S');
//        }
        
        var success = function(d){
            res.send({idAnswer: d.result.insertId});
        };
        
        var error = function(d){
            res.send({idAnswer: 0});
        };
        app.db.queryBatch(sql, values, success, error)();
    };
    

    
    /**
    var createStep = function(req, res)
    {
        var p = req.body;  
        
        var sql = "INSERT INTO steps SET ?";

        var values = {idQuestion: p.idQuestion, step: p.step, rightAnswer: p.rightAnswer};
 
        var success = function(d){
            res.send({idStep: d.result.insertId});
        };
        
        var error = function(d){
            res.send({idStep: 0});
        };
        app.db.queryBatch(sql, values, success, error)();
    };
    **/
    
    /**
     * List all attempts of a given activity for a given student
     * Attempts are of two types
     * 
     * -Video
     * -Activity
     * 
     * We load both asyncronously
     * 
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var list = function(req, res)
    {
        var p = req.body;
        var response = {v: [], a: []};
        
        //---------------- Video stuff
        var query1 = "select l.id as idLogin, l.login, v.vscore, v.vseconds, v.idAssignment, vq.* from visualization as v inner join logins as l on l.id=v.idLogins left join visualization_quizz as vq on vq.idV=v.id where l.idUser='"+
            p.idUser + "' and v.idActivity='"+p.idActivity+"' order by l.id, v.id, vq.id ";
     
     
        //---------------- Activity stuff        
        var query2 = "SELECT a.* FROM attempts AS a INNER JOIN logins AS l ON a.`idLogins`=l.`id` WHERE l.`idUser`='"+
            p.idUser+"' AND a.`idActivity`='"+p.idActivity+"'";
    
        if(p.idAssignment){
            query2 += " AND a.idAssignment ='"+p.idAssignment+"' ";
        }
        
        query2 += " ORDER BY a.attemptStart DESC";

         
        var f1 = function(cb){
            var success1 = function(d){  
                var tmp = {};
                d.result.forEach(function(e){
                    var row = tmp[e.idLogin];
                    if(!row){
                        row = {login: e.login, vscore: e.vscore, idAssignment: e.idAssignment, vseconds: e.vseconds, quizz: []};
                        tmp[e.idLogin] = row;
                    }
                    if(e.formulation){
                        row.quizz.push({formulation: e.formulation, answer: e.answer, rightAnswer: e.rightAnswer, isValid: e.isValid, score: e.penalty});
                    }
                });

                //Convert tmp to array                 
                Object.keys(tmp).forEach(function(k){
                    response.v.push(tmp[k]);
                });
                 cb(null, d.result);
            };
            var error1 = function(){
                 cb("Error1", null);
            };
            app.db.query(query1, success1, error1)();
            
        };
        var f2 = function(cb){
            var success2 = function(d){  
                response.a = d.result;
                 cb(null, d.result);
            };
            var error2 = function(){
                cb("Error2", null);
            };
            app.db.query(query2, success2, error2)();
        };
        
        async.parallel([f1, f2], function(errs, results){           
           res.send(response);
        });
    };
    
    
    var formatMysqlDate = function(date)
    {
        if(!date){
            return null;
        }
        
        var s = ""+date;
        s = s.replace("T"," ");
        var id = s.lastIndexOf(":");
        s = s.substring(0, id);
        return s;
    };
    
     /**
     * List all attempts for a given assignment id
     * input is p.asgnBean //Pass all the bean of the assignment (applyTo is not required)
     * FIX ME!! Note however, that if applyToAll is 1 and no student is in applyTo then no record is found!
     * 
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var query = function(req, res)
    {
        var p = req.body;
          
       
        var sql;
        
        if(p.asgnBean.applyToAll){
            //This query only works for p.asgnBean.applyToAll = 1
            sql = "select us.id as idUser, us.fullname, g.groupName, if(sum(vscore) is not null, sum(vscore), 0) as vscore from assignments as a inner join units as u on a.idUnit=u.id inner join groups as g on g.id=u.idGroup inner join enroll as e on e.idGroup=g.id "+
                  "inner join users as us on us.id=e.idUser left join logins as l on l.idUser=us.id left join visualization as v on (v.idActivity=a.idActivity and l.id=v.idlogins and l.id is not null) where a.id='"+p.asgnBean.id+"' group by us.id order by concat(g.groupName,' ', us.fullname)";
          
        } else {
            //This query only works for p.asgnBean.applyToAll = 0
            sql    = "select au.idUser, u.fullname, g.groupName, if(sum(vscore) is not null, sum(vscore), 0) as vscore "+
                " from assignments_users as au inner join assignments as a on a.id=au.idAssignment inner join "+
                " users as u on u.id=au.idUser left join units on units.id=a.idUnit left join groups as g on g.id=units.idGroup left join logins as l on l.idUser=u.id left join visualization as v on "+
                " (v.idActivity=a.idActivity and l.id=v.idLogins) where au.idAssignment='"+p.asgnBean.id+"' group by u.id " 
                " order by concat(g.groupName,' ', u.fullname)";
        }

        var extracond = "";
        if(p.asgnBean.fromDate)
        {
            extracond += " AND att.attemptStart>='"+formatMysqlDate(p.asgnBean.fromDate)+"' ";
        }
        if(p.asgnBean.toDate)
        {
            extracond += " AND att.attemptStart<='"+formatMysqlDate(p.asgnBean.toDate)+"' ";
        }


        var sql2 = "select att.id, att.idLogins, att.idActivity, att.idAssignment, date_format(att.attemptStart,'%d-%m-%Y %H:%i') as attemptStart, "+
                   "time_to_sec(timediff(att.attemptEnd, att.attemptStart)) as lapsed, att.done, att.score, att.level, "+
                   " l.idUser from attempts as att inner join logins as l on att.idLogins=l.id where idAssignment='"+
                         p.asgnBean.id+"' or (idActivity='"+p.asgnBean.idActivity+ "' "+extracond +
                         "  ) order by l.idUser";
            
        var userasign = [];

        var success = function(d){
            userasign = d.result;
            d.result.forEach(function(e){
               e.attempts = []; 
            });
                    
        };
        
        var findAttemptList = function(idUser)
        {
            var pointer = null;
            for(var i in userasign)
            {
                var bean = userasign[i];
                if(bean.idUser == idUser)
                {
                    pointer = bean;
                    break;
                }
            }
            return pointer;
        };
        
        var success2 = function(d)
        {
            d.result.forEach(function(e){
                var pointer = findAttemptList(e.idUser);
               
                if(pointer)
                {
                    pointer.attempts.push(e);
                }                
            });
            
            //Determine maxscore from all attempts
            
            userasign.forEach(function(e){
               var max = 0;
               e.attempts.forEach(function(a){
                  if(a.score && a.score>max)
                  {
                      max = a.score;
                  }
               });
               e.maxscore = max;
            });
            
            
            res.send(userasign);
        };
        
        
        var error = function(d){
            res.send(userasign);
        };
        
        var q1 = app.db.query(sql, success, error);
        var q2 = app.db.query(sql2, success2, error);
        
        q1().then(q2);
        
    };
    

 
    
    var erase = function(req, res)
    {
        var p = req.body;
        
        var success = function(d){
            res.send({ok: d.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        Remover.del_attempt(app.db, p.idAttempt, success, error);
        
    };
    
      
    /**
     * Change score and feedback from a list of attempts... teacher can change marks
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var mark = function(req, res)
    {
        var mods = req.body.modifications;
        var queryList = "";
        var sep ="";
        mods.forEach(function(item){
            var template = "UPDATE attempts SET score='"+item.score+"', feedback='"+item.feedback+"' WHERE id='"+item.id+"'";
            queryList += sep+template;
            sep = ";";
        });
        
        var error = function(){
            res.send(false);
        };
        
        var success = function(){
            res.send(true);
        };
        
        app.db.queryBatch(queryList, success, error)();       
    };
    
    
    /**
     * List of top10 best scores for a given activity
     * It also obtains information of all the attempts done by the current user
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var top10 = function(req, res)
    {
        
        var p = req.body;
        p.max = p.max || 10;
        var result = {top: [], attempts: []};
        
        var query = "SELECT u.id as idUser, u.uopts, u.fullname, max(a.score) as score, max(a.level) as level, a.attemptStart FROM attempts as a INNER JOIN logins as l on l.id=a.idLogins INNER JOIN users as u ON u.id=l.idUser WHERE a.idActivity='"+
                p.idActivity+"' GROUP by u.id ORDER BY max(a.score) desc, u.fullname asc LIMIT "+p.max;
        
        var error = function(){
            res.send(result);
        };
        
        var success = function(d){
            result.top = d.result;
            
            if(p.idUser){
                var query2 = "SELECT a.id, a.idAssignment, a.attemptStart, a.attemptEnd, a.done, a.score, a.level  FROM attempts as a INNER JOIN logins as l on l.id=a.idLogins WHERE l.idUser='"+p.idUser+"' AND idActivity='"+p.idActivity+"'";
                if(p.idAssignment){
                    query2 += " AND idAssignment='"+p.idAssignment+"'";
                } 
                 var success2 = function(d2){
                    result.attempts = d2.result;
                    res.send(result);                                
                };
            
                app.db.query(query2, success2, error)();    
            } 
            else
            {            
                res.send(result);
            }
        };
        
        app.db.query(query, success, error)();       
    };
  
    app.post('/rest/attempt/close', close);
    app.post('/rest/attempt/closeQuestion', closeQuestion);
    app.post('/rest/attempt/create', create);
    app.post('/rest/attempt/createQuestion', createQuestion);
    app.post('/rest/attempt/list', list);
    app.post('/rest/attempt/query', query);
    app.post('/rest/attempt/registerAnswer', registerAnswer);
    app.post('/rest/attempt/update', update);
    app.post('/rest/attempt/delete', erase);
    app.post('/rest/attempt/updatemarks', mark); 
    app.post('/rest/attempt/top10', top10);

    //app.post('/rest/attempt/createStep', createStep);
    //app.post('/rest/attempt/closeStep', closeStep);
    

};
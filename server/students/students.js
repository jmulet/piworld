module.exports = function(app){

    var winston = require('winston'),
        Remover = require('../misc/remover'),
          Brain = require('../misc/brain'),
          async = require('async'),
          AdminsAndTeachersMdw = require('../AuthorizedMdw').AdminsAndTeachersMdw;
  
    
    var create = function(req, res){
        var p = req.body;
        var testSql = "SELECT id FROM users WHERE username='"+p.username+"' OR (email<>'' AND email='"+ (p.email || "") +"')";
	
        var fullname = p.fullname || (p.name+" "+p.lastname).toUpperCase() || "";
        var sql = "INSERT INTO users (idRole, username, fullname, password, email, phone, schoolId, valid, uopts) VALUES('"+(p.idRole || app.config.USER_ROLES.student)+"','"+
                p.username+"','"+fullname+"','"+p.password+"','"+(p.email || "")+"', '"+(p.phone || "")+"', '"+(p.schoolId || 0) +"', '"+(p.valid || 1)+"' ,'{}')";
	
        var success = function(d){
            res.send({ok:true, msg: "S'ha creat l'usuari amd id="+d.result.insertId});
        };
        var reject = function(d){
            res.send({ok:false, msg: "Aquest usuari ja existeix en aquest grup"});
        };
        var error = function(d){
            res.send({ok:false, msg: "S'ha produït un error :-("});
        };
        
        app.db.queryIfEmpty(testSql, sql, success, reject, error)();        
    };
    
    
    //Need to pass idRole, otherwise, student will be assumed
    var del = function(req, res){
        var p = req.body;
        var idUser = p.idAlumne || 0;
        if(!p.idRole){
            console.log("Required idRole in user del function, otherwise student is asummed!");
        }
        var idRole = p.idRole || app.config.USER_ROLES.student;
	
	var success = function(d){
            res.send({ok: true, msg: "S'ha eliminat l'usuari "+idUser});
        };
        var failure = function(d){
            res.send({ok: false, msg:"S'ha produït un error quan s'eliminava l'usuari "+idUser});
        };
        if(idRole>=app.config.USER_ROLES.student){
            Remover.del_student(app.db, idUser, success, failure);
        } else {
            Remover.del_teacher(app.db, idUser, success, failure);   
        }
    };
    
    /**
     * 
     * @param {type} req
     * @param {type} res
     * @returns {undefined} List all users in a given filterQuery
     */
    var list = function(req, res){
        var p = req.body;
        var idGroup = p.idGroup;
	var edit = p.edit || 0;
        var filterQuery= p.filterQuery || "";
	
        //List my users
        var f = idGroup?("e.idGroup='"+idGroup+"' "): "";
            f += f & filterQuery? " AND ": "";
            f += filterQuery;
            f =  f? " WHERE "+f: "";
                
                
        var sql = "";
	if(edit)
	{
                sql = "SELECT DISTINCT u.*, e.idRole as eidRole, e.id as idEnroll, DATE_FORMAT(MAX(l.login), '%d %b %Y %H:%i') "+
		" as login FROM users as u LEFT JOIN enroll as e ON e.idUser=u.id LEFT JOIN logins as l ON u.id=l.idUser "+f+
                " GROUP BY id ORDER BY fullname ASC";		
	}
	else
	{
        	sql = "SELECT id, username, fullname, SUM(pscore) AS score, eidRole, idEnroll FROM "+
		"(SELECT a.idActivity, u.`id`, u.`fullname`, u.`username`, IF( MAX(score) IS NULL, 0, MAX(score)) AS pscore, e.idRole as eidRole, e.id as idEnroll "+
		"FROM users AS u LEFT JOIN enroll as e ON e.idUser=u.id LEFT JOIN logins AS l ON u.`id` = l.`idUser` "+
		"LEFT JOIN attempts AS a ON a.`idLogins`=l.`id` "+ f +
		" GROUP BY idActivity, u.id "+
		") t GROUP BY `id` ORDER BY fullname ASC";		
	}
        
        var success = function(d)
        {
            d.result.forEach(function(e){
                    //Parse uopts
                    try{
                           e.uopts = JSON.parse(e.uopts || "{}");
                    }
                    catch(ex)
                    {
                        winston.error(ex);
                    }
                    
            });
            
            res.send(d.result);
        };
        
        var error = function(d)
        {
                res.send([]);
        };
        
        app.db.query(sql)().then(success, error);

    };
     
    /**
     * Llista tots els usuaris que pertanyen a un centre o a un grup
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */ 
    var listmine = function(req, res){
        var p = req.body;
        var f = "";
        var and = "";
        if(p.schoolId)
        {
            f += and+" u.schoolId='"+schoolId+"' ";
            and = "AND";
        }
        if(p.idGroup)
        {
            f += and+" g.id='"+p.idGroup+"' ";
            and = "AND";
        }
        if(f)
        {
            f = "WHERE "+f;
        }
        
        var schoolId = p.schoolId || 0;
	
        var sql = "select distinct u.id, concat('(',g.groupName,') ',u.fullname) as fullname from users as u left join enroll as e on e.idUser=u.id left join groups as g on g.id=e.idGroup  "+f+" order by fullname";		
	 
        var success = function(d)
        {
               res.send(d.result);
        };
        
        var error = function(d)
        {
                res.send({});
        };
        
        app.db.query(sql)().then(success, error);

    };
     
    var update = function(req, res){
        var p = req.body;
        var sql = "UPDATE IGNORE users SET ? WHERE id='"+p.id+"'";
        var values = {};
        p.fullname && (values.fullname = p.fullname);
        p.username && (values.username = p.username);
        p.password && (values.password = p.password);
        p.passwordParents && (values.passwordParents = p.passwordParents);
        if (p.email != null) {
            values.email = p.email
        } 

        if (p.emailParents != null) {
           values.emailParents = p.emailParents; 
        } 
        p.phone && (values.phone = p.phone);
        p.idRole && (values.idRole = p.idRole);
        p.mustChgPwd && (values.mustChgPwd = p.mustChgPwd);
        p.valid && (values.valid = p.valid);
        p.schoolId && (values.schoolId = p.schoolId);
        p.uopts && (values.uopts =JSON.stringify(p.uopts));
        
        
        var success = function(d){
            if(d.result.affectedRows)
            {
                res.send({ok:true, msg: "S'ha actualitzat l'usuari "+p.fullname});
            }
            else
            {
                res.send({ok:false, msg: "No s'ha pogut actualitzar l'usuari :-("});
            }
        };
        
        var error = function(d){
            res.send({ok:false, msg: "No s'ha pogut actualitzar l'usuari :-("});
        };
        app.db.queryBatch(sql, values, success, error)();
    };
    
    
     var update_uopts = function(req, res){
        var p = req.body;
        var sql = "UPDATE IGNORE users SET ? WHERE id='"+p.id+"'";
        var values = {uopts: JSON.stringify(p.uopts || {} )};
        
        var success = function(d){
            if(d.result.affectedRows)
            {
                res.send({ok:true, msg: "S'ha actualitzat l'usuari "+p.fullname});
            }
            else
            {
                res.send({ok:false, msg: "No s'ha pogut actualitzar l'usuari :-("});
            }
        };
        
        var error = function(d){
            res.send({ok:false, msg: "No s'ha pogut actualitzar l'usuari :-("});
        };
        app.db.queryBatch(sql, values, success, error)();
    };
    
    
    //L'importador no pot crear dos usuaris amb el mateix username o email no nul
    //2017-08: En el cas de que username ja existeixi amb el mateix idSchool; únicament farà un update dels camps "fullname" i "email"
    //         si l'opció p.updateIfExists esta activada.
    var importador = function(req, res){
        var p = req.body;
        var text = p.text || "";
        var schoolId = p.schoolId || 0;
        var lines = text.split("\n");
        var expect = 0;
        var correct = 0;
        var log = [];
        
        var tasks = [];
       
        var values = [];
        lines.forEach(function(l){
           var ll = l.trim();
           if(ll.indexOf(":")>=0)
           {
                var fields = ll.split(":"); 
                var n = fields.length;

                var username = (n>0? fields[0] : "").replace(/ /g, ""); 
                var fullname = (n>1? fields[1].trim() : "");
                var password = (n>2? fields[2].trim() : "").replace(/ /g, "");
                var email = (n>3? fields[3].trim() : "");
                var phone = (n>4? fields[4].trim() : "");

                if(username && fullname)
                {

                     var task = function(cb){
                         //First check   //No hi pot haver, dos usuaris amb el mateix username i/o email
                         var testSQL = "SELECT id, username, email, schoolId, idRole FROM users WHERE username='"+username+"' OR (email<>'' AND email='"+email+"')";
                         var sqlInsert = "INSERT INTO users (idRole, username, fullname, password, email, phone, schoolId, valid, uopts) VALUES ('"+(p.idRole || app.config.USER_ROLES.student)+
                                 "', '"+username+"', '"+fullname+"', '"+password+"', '"+email+"', '"+phone+"', '"+schoolId+"', 1, '{}')";
                          
                         var doImport = function(data){ 
                             if(data.result.insertId>0 || data.result.affectedRows>0) {
                                 correct += 1;
                             } else {
                                log.push("Error: A problem updating user "+username+" - "+email+" in database.");
                             }
                             cb();
                         };
                         
                         
                         var doTest = function(data){
                             
                             if(data.result.length<=0){
                                //Can do Insert Import
                                if(!password){
                                    password = "111111";
                                    log.push("Warning: Password set to "+password+" to username "+username);
                                }
                             
                                 app.db.query(sqlInsert, doImport, err)();
                                 
                             } else if(p.updateIfExists && data.result.length===1 && data.result[0].schoolId===schoolId && data.result[0].idRole>=app.config.USER_ROLES.student){
                                 //Can do Update
                                 var sqlUpdate = "UPDATE users SET fullname='"+fullname+"', email='"+email+"' WHERE id='"+data.result[0].id+"'";
                       
                                 app.db.query(sqlUpdate, doImport, err)();
                             }                              
                             else {
                                 log.push("Error: Can't create user "+username+" - "+email+" already exists in school.");
                                 cb();
                                 
                             }                             
                         };
                         
                         var err = function(){
                             log.push("Error: An error occurred when inserting user "+username+" - "+email+" in database.");
                             cb();
                         };
                        
                         app.db.query(testSQL, doTest, err)();
                     };

                     tasks.push(task);
                     expect += 1;
                } else {
                    log.push("Error: Username and fullname required in line -> "+ll);
                }
           }
           else {
               log.push("Error: Can't process line -> "+ll);
           }
        });
        
        if(tasks.length>0 )
        {
            async.series(tasks, function(){
                res.send({ok: true, msg: "S'han importat "+correct+" usuaris de "+expect+" detectats.<br>"+log.join("<br>")});
            });
        }
        else
        {
            res.send({ok: false, msg: "No hi ha dades a importar o no s'ha especificat el grup."});
        }
    };
    
    var statistics = function statistics(req, res)
    {
        var idAlumne =  req.body.idAlumne || 0;
        var lang = req.body.lang || app.parseCookies(req).get("NG_TRANSLATE_LANG_KEY") || "en";
        var detail = [];
        var summary2 = {x: [], y: [], z: []};
        var response = {detail: detail, summary: summary2};
        
       //TODO: This query has to be updated to the system attempt-question-step-answer format
       /* var sql = "SELECT DATE_FORMAT(l.login, '%d-%m-%Y') AS dia," +
                "TIME_FORMAT(a.attemptStart,'%H:%i') AS ini, TIME_FORMAT(SEC_TO_TIME(a.attemptEnd-a.attemptStart),'%Hh %im %ss') AS lapsed, a.id AS idAttempt,  " +
                "COUNT(q.id) AS nquestions, SUM(q.askHelp='S') AS askHelp, SUM(q.askTheory='S') AS askTheory, SUM(q.askSolution='S') AS askSolution, " +
                "a.score, act.id, act.`activity`, " +
                "(SELECT SUM(isCorrect='N') AS nerr FROM answers WHERE idQuestion=q.id) AS errs " +
                "FROM  " +
                "logins AS l INNER JOIN attempts AS a ON l.id=a.idLogins  " +
                "INNER JOIN activities AS act ON act.id = a.idActivity  " +
                "LEFT JOIN questions AS q ON q.idAttempt = a.id  " +
                "WHERE idUser=" + idAlumne + " " +
                "GROUP BY a.id " +
                "ORDER BY l.login, a.attemptStart, act.`activity` ";
        */
        
        
        var sql = "SELECT l.login as dia, week(l.login,1) as week, TIME_FORMAT(a.attemptStart,'%H:%i') AS ini, TIME_FORMAT(SEC_TO_TIME(a.attemptEnd-a.attemptStart),'%Hh %im %ss') AS lapsed, a.id AS idAttempt, a.idKahoot, COUNT(q.id) AS nquestions, a.score, act.id as idActivity, act.`activity`, a.idAssignment "+
                   "FROM logins AS l INNER JOIN attempts AS a ON l.id=a.idLogins  INNER JOIN activities AS act ON act.id = a.idActivity  LEFT JOIN questions AS q ON q.idAttempt = a.id  WHERE idUser='"+idAlumne+"' AND l.parents=0 GROUP BY a.id ORDER BY l.login, a.attemptStart, act.`activity`";
        
        var success =  function(d)
        {
            d.result.forEach(function(e)
            {
                e.video = false;
                app.i18n_activity(e, lang);                
                detail.push(e);
            });
        };
        
        var error =  function(d)
        {
            res.send(response);
        };
        
        var q1 = app.db.query(sql, success, error);
        
        //Add visualization work as well
        //var sql2 = "select DATE_FORMAT(l.login, '%d-%m-%Y') AS dia, week(l.login) as week, TIME_FORMAT(l.login,'%H:%i') AS ini, TIME_FORMAT(SEC_TO_TIME(v.vseconds),'%Hh %im %ss') AS lapsed, v.id as idAttempt, 0 as nquestions, if(vscore, vscore, 0) as score, if(act.id, act.id, 0) as idActivity, act.activity, v.resource from visualization as v inner join logins as l on l.id=v.idLogins left join activities as act on act.id=v.idActivity where l.idUser="+idAlumne;
        //Combine this query with that of visualization quizz
        var sql2 = "select l.login AS dia, week(l.login,1) as week, TIME_FORMAT(l.login,'%H:%i') AS ini, TIME_FORMAT(SEC_TO_TIME(v.vseconds),'%Hh %im %ss') AS lapsed, "
                  +"v.id as idAttempt, 0 as nquestions, if(vscore, vscore, 0) as score, if(act.id, act.id, 0) as idActivity, act.activity, v.resource, count(vq.id) as nq, v.id as idV from visualization as v inner join logins as "
                  +"l on l.id=v.idLogins left join visualization_quizz as vq on v.id=vq.idV left join activities as act on act.id=v.idActivity where l.idUser="+idAlumne+" group by v.id";
         
        var success2 = function(d)
        {
            d.result.forEach(function(e){
                app.i18n_activity(e, lang);
                // e.video = e.idActivity? true:false; //video condition has changed
                e.video = (e.resource == null) || e.resource.indexOf("//www.youtube.com")>=0 || e.resource.indexOf("//youtu.be")>=0;
                detail.push(e);
            });
            
            //Create the summary from the detail data
//            var summary = {};
//            detail.forEach(function(e){
//               var p = summary[e.week];
//               if(!p){
//                   var p = {a: 0, v: 0};
//                   summary[e.week] = p;                   
//               }   
//               if(e.idActivity){
//                    p.a += e.score;
//               } else {
//                    p.v += e.score;
//               }
//            });
//            Object.keys(summary).forEach(function(ky){
//                try{
//                    summary2.x.push(parseInt(ky));
//                    summary2.y.push(summary[ky].a);
//                    summary2.z.push(summary[ky].v);
//                } catch(ex){
//               
//            }});
//            
//            delete summary;
//            response.summary = summary2;
            res.send(response);
        };
        
        var q2 = app.db.query(sql2, success2, error);
        
        q1().then(q2);
       
    };
    
    function compare(b, a) {
        var ta = a.score + a.vscore + a.rscore + a.uscore;
        var tb = b.score + b.vscore + b.rscore + b.uscore;                 
        return ta-tb;
    }

    
    /**
     * Returns the scores in different contexts:
     * for all users/schools:  if all parameter is passed (only authorized schools are listed)
     * for a given school: if schoolId is set
     * for a given group:  if idGroup is set (then only activities associated with idAssignment are treated    
     * 
     * 20-1-2017: Allow to filter scores in a given interval fromDate toDate
     */
    var points = function(req, res)
    {
        var sql0; //Keeps an array of the students in the query
        var sql1; //Keeps the visualtization scores
        var sql2;
        var sql4;
        var interval = "";
        var interval2 = "";
        
        var p = req.body;
        
        if(p.fromDate){
            interval = " AND (l.login>='"+p.fromDate+"') ";
            interval2 = " WHERE (`day`>='"+p.fromDate+"') ";
        }
        if(p.toDate){
            interval += " AND (l.login<='"+p.toDate+"') ";
            interval2 += (interval2? " AND ":" WHERE ")+" (`day`<='"+p.toDate+"') ";
        } 
        
        if(p.schoolId && !p.all)
        {
            sql0 = "SELECT u.id as idUser, u.username, u.fullname, sch.schoolName FROM users as u INNER JOIN schools as sch on sch.id=u.schoolId WHERE u.idRole>="+app.config.USER_ROLES.student+" AND u.schoolId="+p.schoolId;
            
            //Includes any kind of visualization
            sql1 = "SELECT u.id as idUser, if(sum(v.vscore), sum(v.vscore), 0) as vscore FROM visualization as v INNER JOIN logins as l on l.id=v.idLogins INNER JOIN  users as u ON l.idUser=u.id WHERE u.idRole>="+app.config.USER_ROLES.student+" AND u.schoolId="+p.schoolId + interval+" GROUP BY u.id";
            
            //Includes activities
            sql2 = "SELECT idUser, sum(tmp.sc) as score from (select max(score) as sc, l.idUser from attempts as att "+
                   " INNER JOIN logins as l on att.idLogins=l.id INNER JOIN users as u on u.id=l.idUser  WHERE u.idRole>="+app.config.USER_ROLES.student+" AND u.schoolId="+p.schoolId + interval +
                   " GROUP BY concat(l.idUser,att.idActivity, att.idAssignment)) as tmp group by idUser";
       
            //any uploads
            sql4 =  "SELECT u.id as idUser, sum(score) as uscore FROM uploads as v INNER JOIN users as u ON u.id=v.idUser WHERE u.idRole>="+app.config.USER_ROLES.student+" AND u.schoolId="+p.schoolId +" GROUP BY u.id";

        } else if(p.groupId)
        {
            sql0 = "SELECT u.id as idUser, u.username, u.fullname, sch.schoolName, g.groupName FROM users as u INNER JOIN schools as sch on sch.id=u.schoolId INNER JOIN enroll as e ON e.idUser = u.id INNER JOIN groups as g ON g.id=e.idGroup WHERE u.idRole>="+app.config.USER_ROLES.student+" AND e.idGroup="+p.groupId;
            
            //Only includes idAssigned visualizations
            sql1 = "SELECT u.id as idUser, if(sum(v.vscore), sum(v.vscore), 0) as vscore FROM visualization as v INNER JOIN logins as l on l.id=v.idLogins INNER JOIN  users as u ON l.idUser=u.id INNER JOIN assignments as asgn ON asgn.id = v.idAssignment INNER JOIN units as unit on unit.id=asgn.idUnit WHERE u.idRole>="+app.config.USER_ROLES.student+" AND unit.idGroup="+p.groupId + interval +" GROUP BY u.id";
            
            sql2 = "SELECT idUser, sum(tmp.sc) as score from (select max(score) as sc, l.idUser from attempts as att "+
                   " INNER JOIN logins as l on att.idLogins=l.id INNER JOIN users as u on u.id=l.idUser INNER JOIN assignments as asgn ON asgn.id = att.idAssignment INNER JOIN units as unit on unit.id=asgn.idUnit WHERE u.idRole>="+app.config.USER_ROLES.student+" AND unit.idGroup="+p.groupId + interval +
                   " GROUP BY concat(l.idUser,att.idActivity, att.idAssignment)) as tmp group by idUser";
            
            //only uploads with idAssigned to this group
            sql4 =  "SELECT u.id as idUser, sum(score) as uscore from uploads as v INNER JOIN  users as u ON v.idUser=u.id INNER JOIN assignments as asgn ON asgn.id = v.idAssignment INNER JOIN units as unit on unit.id=asgn.idUnit WHERE u.idRole>="+app.config.USER_ROLES.student+" AND unit.idGroup="+p.groupId+" GROUP BY u.id";
        } 
        else
        {
            sql0 = "SELECT u.id as idUser, u.username, u.fullname, sch.schoolName FROM users as u INNER JOIN schools as sch on sch.id=u.schoolId WHERE u.idRole>="+app.config.USER_ROLES.student+" AND (u.schoolId="+p.schoolId+" OR sch.canPublish>0)";
            
            //Includes any kind of visualizations
            sql1 = "SELECT u.id as idUser, if(sum(v.vscore), sum(v.vscore), 0) as vscore FROM visualization as v INNER JOIN logins as l on l.id=v.idLogins INNER JOIN  users as u ON l.idUser=u.id INNER JOIN schools as sch on sch.id=u.schoolId WHERE u.idRole>="+app.config.USER_ROLES.student+" AND (u.schoolId="+p.schoolId+" OR sch.canPublish>0) "+interval+" GROUP BY u.id";
            
            
            sql2 = "SELECT idUser, sum(tmp.sc) as score from (select max(score) as sc, l.idUser from attempts as att "+
                   " INNER JOIN logins as l on att.idLogins=l.id INNER JOIN users as u on u.id=l.idUser  INNER JOIN schools as sch on sch.id=u.schoolId WHERE u.idRole>="+app.config.USER_ROLES.student+" AND (u.schoolId="+p.schoolId+" OR sch.canPublish>0) "+ interval +
                   " GROUP BY concat(l.idUser,att.idActivity, att.idAssignment)) as tmp group by idUser";
            
            //any uploads
            sql4 =  "SELECT u.id as idUser, sum(score) as uscore FROM uploads as v INNER JOIN users as u ON u.id=v.idUser  INNER JOIN schools as sch on sch.id=u.schoolId  WHERE u.idRole>="+app.config.USER_ROLES.student+" AND (u.schoolId="+p.schoolId+" OR sch.canPublish>0) GROUP BY u.id";
        };
       
        var scores = [];
        var map = {};
         
        var error1 = function(d){
            res.send(scores);
        };
        
        var success0 = function(d){
            scores = d.result;
            scores.forEach(function(row){               
                row.score  = 0;  //attempts score
                row.vscore = 0; //visualization scores
                row.rscore = 0; //batches score
                row.uscore = 0; //uploads score
                map[row.idUser] = row;
            });
        };
        
        var q0 = app.db.query(sql0, success0, error1);
        
        var success1 = function(d){
            d.result.forEach(function(row){
                if(map[row.idUser]){
                    map[row.idUser].vscore = row.vscore;
                }
            });            
        };
        
        var q1 = app.db.query(sql1, success1, error1);
        
      
        //ATTEMPTS: Get the total attempt score.
     
         var success2 = function(d){
             d.result.forEach(function(row){
                if(map[row.idUser]){
                    map[row.idUser].score = row.score;
                }
            });         
        };
        var q2 = app.db.query(sql2, success2, error1);
        
        
        //BADGES: Get the total RSCORE
        var sql3 =  "select idUser, sum(rscore) as rscore from badges "+interval2+" where type<200 group by idUser";

        var success3 = function(d){
            d.result.forEach(function(row){
                if(map[row.idUser]){
                    map[row.idUser].rscore = row.rscore;
                }
            });           
        };

        
        var q3 = app.db.query(sql3, success3, error1);
        
      
        
        var success4 = function(d){
            d.result.forEach(function(row){
                map[row.idUser].uscore = row.uscore;
            });                 
            //Sort array based on total score score+vscore+rscore+uscore
            scores.sort(compare);
            //console.log(scores);
            res.send(scores);
        };

        
        var q4 = app.db.query(sql4, success4, error1);
        
        q0().then(q1).then(q2).then(q3).then(q4);
    };
    
    /**
     * TODO: CHECK THIS FUNCTION TO FIT THE SCORES PER CATEGORIES
     *  Pass idUser
     *  It returns the total scores of a given idUser, including free and assigned activities
     *  In case of assigned activities only add up the max and not the sum
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var categoryScores = function(req, res)
    {
        var p = req.body;
        
        var categories = [];
        var response = {categories: categories, score: 0, vscore: 0, rscore: 0, uscore: 0};
        
        //var brain = Brain.instance(app.db, p.idUser);
        
        //var success1 = function(dataset){
            //Transform brain data-set
              
//            var recursiveFunc = function(root, container){
//                 
//                Object.keys(root).forEach(function(key){
//                    var y = root[key].Y;
//                    var n = root[key].N;
//                    var t = n+y;
//                    var tpc = t? Math.floor(100*y/(1.0*t)): 0;
//                    var child = [];
//                    container.push({key: key, tpc: tpc, children: child});
//                    recursiveFunc(root[key].children || {}, child);
//                });
//            };
//            
//            recursiveFunc(dataset.data, categories);
//                       
            
            //Get the total attempt score. 
            var sql2 = "select sum(tmp.sc) as score from (select max(score) as sc, l.idUser from attempts as att "+
                    "inner join logins as l on att.idLogins=l.id inner join users as u on u.id=l.idUser WHERE u.idRole>="+app.config.USER_ROLES.student+
                    " AND l.idUser='"+p.idUser+"' GROUP BY concat(att.idActivity, att.idAssignment)) as tmp";
            var success2 = function(d){
                if(d.result.length)
                {
                    response.score = d.result[0].score;
                }
            };
          
            var error1 = function(d){
                res.send(response);
            };

            var q2 = app.db.query(sql2, success2, error1);

            //Get the total visualization score
            var sql3 = "select sum(if(vscore, vscore, 0)) as vscore from visualization as v inner join logins as l on l.id=v.idLogins where l.idUser="+p.idUser;
            var success3 = function(d){
                if(d.result.length)
                {
                    response.vscore = d.result[0].vscore;
                }               
            };

            var q3 = app.db.query(sql3, success3, error1);
            
            //Get the user badges
            var sql4 = "select * from badges WHERE idUser='"+p.idUser+"' AND type<200";
            var success4 = function(d){
                response.badges = d.result || [];
                
            };
            
            var q4 = app.db.query(sql4, success4, error1);
            
            //Get the total upload score
            var sql5= "select sum(score) as uscore from uploads WHERE idUser='"+p.idUser+"'";
            var success5 = function(d){
                if(d.result.length)
                {
                    response.uscore = d.result[0].uscore || 0;
                }
               res.send(response);
            };
            
            var q5 = app.db.query(sql5, success5, error1);

            q2().then(q3).then(q4).then(q5);
            
        //};           
        
        //brain.train(success1);
        //success1();
        
            
    };
    
    
//{add: toEnroll, remove: toUnroll, idGroup: $scope.grpID})
//Now accepts parameter p.role
    var massiveenroll = function massiveenroll(req, res)
    {
        var p = req.body; 
        var idGroup = p.idGroup;
        var role = p.role || app.config.USER_ROLES.student;
        var add = "";
        var remove = "";
        
        
        var template1 = "";
        p.add.forEach(function(e){            
            template1 += "INSERT INTO `enroll` (idGroup, idUser, idRole) SELECT '"+idGroup+"', '"+e+"', '"+role+
                    "' FROM DUAL WHERE NOT EXISTS (SELECT * FROM `enroll` WHERE idGroup='"+idGroup+"' AND idUser='"+e+"') LIMIT 1; ";            
        });
        
        var sep = "";
        p.remove.forEach(function(e){
            remove += sep+"("+e+","+idGroup+")";
            sep = ",";
        });
         
//Must avoid inserting a idUser which is already there!!!!!  
//        INSERT INTO `enroll` (idGroup, idUser) 
//        SELECT '34', '75' FROM DUAL
//        WHERE NOT EXISTS (SELECT * FROM `enroll` 
//              WHERE idGroup='34' AND idUser='75') 
//        LIMIT 1 
        
        
        var template2 = "DELETE FROM enroll WHERE (idUser, idGroup) IN ("+remove+")";
        
        if(!template1)
        {
            template1 = "SELECT 1+1";
        }
        if(!p.remove.length)
        {
            template2 = "SELECT 1+1";
        }
        
        var success =  function(d)
        {
            res.send({ok:true});
        };
        
        var error =  function(d)
        {
            res.send({ok: false});
        };
        
        var q1 = app.db.query(template1, null, error);
        
        var q2 = app.db.query(template2, success, error);
        
        q1().then(q2);
       
    };
    
    var participants = function(req, res){
       var p = req.body;
       var sql; 
       if(p.idGroup){         
           //time_to_sec(timediff(now(),max(l.login)))
            sql = "select u.id, u.username, u.fullname, u.uopts, unix_timestamp(max(l.login)) as lastLogin, u.email from users as u inner join enroll as e on e.idUser=u.id left join logins as l on l.idUser=u.id where e.idGroup='"+p.idGroup+"' and u.valid=1 group by u.id order by fullname asc";
        }
        else if(p.schoolId) {
            sql = "select u.id, u.username, u.fullname, u.uopts, unix_timestamp(max(l.login)) as lastLogin, u.email from users as u left join logins as l on l.idUser=u.id where u.schoolId='"+p.schoolId+"' and u.valid=1 group by u.id order by fullname asc";
        }
        else {
            sql = "select u.id, u.username, u.fullname, u.uopts, unix_timestamp(max(l.login)) as lastLogin, u.email from users as u left join logins as l on l.idUser=u.id where u.valid=1 group by u.id order by fullname asc";
        }
        
        var error = function(d){            
            res.send([]);
        };
        
        var success = function(d){  
            d.result.forEach(function(e){
                try{
                    e.uopts = JSON.parse(e.uopts); 
                } catch(ex){
                    e.uopts = {};
                }
            });
            res.send(d.result);
        };
        
       app.db.query(sql, success, error)();
        
    };
    
    var badges_list = function(req, res){
        var p = req.body;
        
        var err = function(){
            res.send([]);
        };
        
        var ok = function(d){
            var tmp = {};
            d.result.forEach(function(e){
               try{
                    e.uopts = JSON.parse(e.uopts); 
               } catch(ex){
                    e.uopts = {};
               }
               e.badges = [];
               e.chats = [];
               tmp[e.id] = e; 
            });
            if(!p.idUser){
                var sql2 = "SELECT * FROM badges WHERE idGroup='"+p.idGroup+"'";                
                if(p.idCreator){
                    sql2 += " AND idCreator='"+p.idCreator+"' ";
                }
                if(p.day && p.day2){
                    sql2 += " AND (day>='"+p.day+"' AND day<='"+p.day2+"') ";
                } 
                else if(p.day){
                    sql2 += " AND day='"+p.day+"'";
                }
                if(p.filter){
                    sql2 += " AND "+p.filter;
                }  
                
                var success2 = function(d2){
                    d2.result.forEach(function(e){
                       var user = tmp[e.idUser]; 
                       if(user){
                           user.badges.push(e);   
                       }
                    });
                    
                    
                       //Now load all chats with parents in the given date period
                        var sql3 = "SELECT * FROM chats WHERE idGroup='"+p.idGroup+"' AND parents=1";            
                        if(p.idCreator){
                            sql3 += " AND idUser='"+p.idCreator+"' ";
                        }
                        if(p.day && p.day2){
                            sql3 += " AND (`when`>='"+p.day+"' AND `when`<='"+p.day2+"') ";
                        } 
                        else if(p.day){
                            sql3 += " AND date(`when`)='"+p.day+"'";
                        }
                         
                        var success3 = function(d3){
                                d3.result.forEach(function(e){
                                     var user = tmp[e.isFor]; 
                                     if(user){
                                         user.chats.push(e);   
                                     }
                                });

                                var values = Object.keys(tmp).map(function(k){return tmp[k];});                    
                                res.send(values.sort(function(a,b){return a.fullname.localeCompare(b.fullname);}));
                        };
                        
                        app.db.query(sql3, success3, err)();
                        
                };
                app.db.query(sql2, success2, err)();
            } else {
                res.send(d.result);
            }
        };
        
        
        var sql;
        if(!p.idUser){
            //List all students in this group and load its associated badges with the corresponding filtering (It also retrieves parents chats)
            sql = "SELECT u.id, u.username, u.fullname, u.uopts, u.emailParents FROM users as u INNER JOIN enroll as e on e.idUser=u.id WHERE e.idGroup='"+p.idGroup+"' AND u.idRole>=200 ORDER by u.fullname ASC";
        } else {
            sql = "SELECT * FROM badges WHERE idUser='"+p.idUser+"' AND idGroup='"+p.idGroup+"'";             
            if(p.day && p.day2){
                sql += " AND (day>='"+p.day+"' AND day<='"+p.day2+"') ";
            } 
            else if(p.day){
                sql += " AND day='"+p.day+"'";
            }
            if(p.filter){
                sql += " AND "+p.filter;
            }  
        }
        
       
        app.db.query(sql, ok, err)();
    };
    
    var badges_save = function(req, res){
        var p = req.body;
        
        var err = function(){
            res.send({ok: false, id: 0});
        };
        
        var ok = function(d){
            var modif = 0;
            if(!p.id){
                p.id = d.result.insertId;
                modif = 1;
            } else {
                modif = d.result.affectedRows;
            }
            res.send({ok: modif>0, id: p.id});
        };
        
        var sql = "";
        var objs = {idUser: p.idUser, type: p.type || 0, rscore: p.rscore || 0, idCreator: p.idCreator || 0, idGroup: p.idGroup || 0};
        if(p.id){
            sql = "UPDATE badges SET ? WHERE id='"+p.id+"'";
        } else {
            sql = "INSERT INTO badges SET `day`="+(p.day?"'"+p.day+"'":"CURRENT_DATE()")+",  ?";
        }
        app.db.queryBatch(sql, objs, ok, err)();
    };
    
    var badges_delete = function(req, res){
        var p = req.body;
        
        var err = function(){
            res.send({ok: false});
        };
        
        var ok = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var sql = "DELETE FROM badges WHERE id='"+p.id+"'";
        app.db.query(sql, ok, err)();
    };
    
    app.post('/rest/students/create', AdminsAndTeachersMdw, create);
    app.post('/rest/students/delete', AdminsAndTeachersMdw, del);
    app.post('/rest/students/list', list);
    app.post('/rest/students/listmine', listmine);
    app.post('/rest/students/participants', participants);
    app.post('/rest/students/update', update);
    app.post('/rest/students/updateuopts', update_uopts);
    app.post('/rest/students/import', AdminsAndTeachersMdw, importador);
    app.post('/rest/students/statistics', statistics);
    app.post('/rest/students/scores', points);
    app.post('/rest/students/categoryscores', categoryScores);
    app.post("/rest/students/massiveenroll", AdminsAndTeachersMdw, massiveenroll);
    
    
     app.post("/rest/badges/list", badges_list);
     app.post("/rest/badges/save", AdminsAndTeachersMdw, badges_save);
     app.post("/rest/badges/delete", AdminsAndTeachersMdw, badges_delete);
};

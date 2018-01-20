module.exports = function(app){
    
     var Remover = require('../misc/remover'),
         formidable = require('formidable'),
         fs = require('fs'),
         async = require('async'),
         AdminsAndTeachersMdw = require('../AuthorizedMdw').AdminsAndTeachersMdw;
    
    
     var zpad = function(v){
         return ("0"+v).slice(-2);
     };
    
     var formatMysqlDate = function(date)
     {
        if(!date){
           return null;
        }
        
        if(typeof(date)==="string")
        {
            var s = ""+date;
            s = s.replace("T"," ");
            var id = s.lastIndexOf(":");
            s = s.substring(0, id);
            return s;
        }
        else {
            return zpad(date.getFullYear())+"-"+zpad(date.getMonth()+1)+"-"+zpad(date.getDate())+" "+zpad(date.getHours())+":"+zpad(date.getMinutes());
        }
    };
    
    /*
     * List of assignments created by the user idUser, with filter options
     * idUser, idGroup, filter
     * 
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var queryCreated = function(req, res)
    {
        var filtering = "";
        var and = " AND ";
        var p = req.body;
         
        p.filter = p.filter || {};
        
        if(p.filter.student)
        {
            filtering += and+" u.fullname LIKE '%"+p.filter.student.trim()+"%' ";
        }
        if(p.filter.group)
        {
            filtering += and+" g.groupName LIKE '%"+p.filter.group.trim()+"%' ";
        }
        if(p.dt && p.dt.month && p.dt.year)
        {
           
           var month = p.dt.month;
           var year = p.dt.year;
           var min = year+"-"+month+"-01";
           var max = year+"-"+month+"-31";
           filtering += and+" ( (asgn.fromDate IS NULL OR asgn.fromDate BETWEEN '"+min+"' AND '"+max+"') OR (asgn.toDate IS NULL OR asgn.toDate BETWEEN '"+min+"' AND '"+max+"')) ";
        }
         
        //First need all units in this group
        var sql0 = "SELECT * FROM units WHERE idGroup='"+p.idGroup+"' ORDER BY `order`, `id`, `unit`";
        var result = [];

        var success0 = function(d)
        {
             result = d.result;
             //Always create at top, an unclasified object
             result.unshift({id: 0, unit: '', idGroup: p.idGroup, order: -1});

             //FOR EACH ENTRY Must create assignments object
             result.forEach(function(e){
                  e.assignments = [];
             });
        };

        var error = function(d){
             res.send(result);
         };

        var q0 = app.db.query(sql0, success0, error);
        
        /*var sql1 = "SELECT asgn.*, units.idGroup as idGroup, units.unit, a.activity, a.description, a.category, GROUP_CONCAT(au.idUser) as applied FROM assignments as asgn LEFT JOIN activities as a ON a.id=asgn.idActivity "+
                " LEFT JOIN assignments_users AS au on au.idAssignment=asgn.id LEFT JOIN users as u on u.id=au.idUser LEFT JOIN units ON asgn.idUnit=units.id LEFT JOIN groups as g on units.idGroup=g.id WHERE asgn.idUser='"+
                    p.idUser+"' "+filtering+" GROUP BY asgn.id ORDER BY asgn.postDate, asgn.id, asgn.fromDate";
         */
        
        var sql1 = "SELECT asgn.*, units.id as idUnit, a.activity, a.idSubject, a.description, a.category, a.ytid, a.ytqu, a.icon, a.ggbid, a.hasAct, g.id as idGroup, count(au.id) as assigned, GROUP_CONCAT(au.idUser) as applied FROM "+
               "assignments AS asgn LEFT JOIN assignments_users as au ON asgn.id=au.idAssignment LEFT JOIN activities as a ON a.id=asgn.idActivity "+
               "LEFT JOIN units ON units.id=asgn.idUnit LEFT JOIN groups as g on g.id=units.idGroup LEFT JOIN users as u on u.id=au.idUser "+
               "WHERE g.id='"+p.idGroup+"' "+filtering+" AND (asgn.applyToAll=1 OR au.id IS NOT NULL) GROUP BY asgn.id ORDER BY units.`order`, units.id, units.unit, asgn.order, asgn.postDate, asgn.id, asgn.fromDate";
               
         //Removed WHERE asgn.idUser='"+p.idUser+"' AND 
       
        //Organize assignments in units 
        var success = function(d)
        {
            var tmp = d.result;
            //FOR EACH ENTRY Must get information about the attempts done and the score, whether is open or closed
            tmp.forEach(function(e){
                //Must internationalize "e"
                app.i18n_activity(e, null, req);                
                e.collapsed = false;
                e.open = true;
                
//                try {
//                  e.params = JSON.parse(e.params);  
//                } catch(ex){
//                   e.params = {}; 
//                }
                
                //NOW MUST ORGANIZE assignments INTO their units
                var idUnit = e.idUnit || 0;
                
                for(var i in result){
                    if(result[i].id===idUnit){
                        e.applyTo = (e.applied || "").split(",").map(function(x){return parseInt(x);});
                        delete e.applied;
                        result[i].assignments.push(e);
                        break;
                    }
                }
            });
            
            res.send(result);       
        };
        
   
        var q1 = app.db.query(sql1, success, error);
        
        q0().then(q1);
        
    };
      

    
    /*
     * List of assignments which has been assigned to a given student idUser, idGroup
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     * 9/10/15: Only show assignments in units which are visible!
     */
    var queryAsgn = function(req, res)
    {
        var p = req.body;
        
       //Filtra per mes
//       var filter = "";
//    
//       if(p.dt.month && p.dt.year)
//       {
//           
//           var month = p.dt.month;
//           var year = p.dt.year;
//           var min = year+"-"+month+"-01";
//           var max = year+"-"+month+"-31";
//           filter = "AND ( (asgn.fromDate IS NULL OR asgn.fromDate BETWEEN '"+min+"' AND '"+max+"') OR (asgn.toDate IS NULL OR asgn.toDate BETWEEN '"+min+"' AND '"+max+"'))";
//       }
       
       //First need all units in this group
       var sql0 = "SELECT * FROM units WHERE idGroup='"+p.idGroup+"' AND visible>0 ORDER BY `order`, `id`, `unit`";
       var unitats = [];
       
       var success0 = function(d)
       {
            unitats = d.result;

            //FOR EACH ENTRY Must create assignments object
            unitats.forEach(function(e){
                 e.assignments = [];
            });
       };
       
       var error = function(d){
            res.send(unitats);
        };
       
       var q0 = app.db.query(sql0, success0, error);
       
       //Then retrieve all assignments organized in units
       //This query has been updated to check also for visualization and uploads entries
       //It must also pass idGroup
       
//       var sql1 = "SELECT asgn.*, units.id as idUnit, units.visible, a.activity, a.idSubject, a.description, a.category, a.ytid, a.ytqu, a.icon, a.ggbid, a.hasAct,  max(if(l.idUser is NOT NULL, atm.score, 0)) as maxscore, "+
//               " sum(if(l.idUser is NOT NULL, 1, 0)) as doneAttempts, if(maxAttempts=0 OR sum(if(l.idUser is NOT NULL, 1, 0))<maxAttempts,"+
//               " if ( (asgn.fromDate IS NULL OR now()>=asgn.fromDate) AND (asgn.toDate IS NULL OR now()<asgn.toDate), 1, 0), 0) as open FROM "+
//               " assignments AS asgn LEFT JOIN assignments_users as au ON asgn.id=au.idAssignment LEFT JOIN activities as a ON a.id=asgn.idActivity "+
//               " LEFT JOIN attempts as atm on (atm.`idAssignment`=asgn.id ) LEFT JOIN logins as l on (l.id=atm.idLogins AND l.idUser='"+p.idUser+"') LEFT JOIN units ON units.id=asgn.idUnit "+
//               " WHERE (au.idUser='"+p.idUser+"' OR asgn.applyToAll=1) AND (asgn.visible=1) "+filter+" GROUP BY asgn.id ORDER BY units.`order`, units.id, units.unit, asgn.order, asgn.postDate, asgn.id, asgn.fromDate";
       
        var sql1 = "SELECT asgn.*, units.id as idUnit, units.visible, a.activity, a.idSubject, a.description, a.activityType, a.category, a.ytid, a.ytqu, a.icon, a.ggbid, a.hasAct, "
                 + " if ( (asgn.fromDate IS NULL OR now()>=asgn.fromDate) AND (asgn.toDate IS NULL OR now()<asgn.toDate), 1, 0) as open, b.score, b.vscore, b.uscore, b.doneAttempts "
                 + " FROM assignments AS asgn LEFT JOIN activities as a ON a.id=asgn.idActivity INNER JOIN units ON units.id=asgn.idUnit LEFT JOIN assignments_users as au ON asgn.id=au.idAssignment "                
                 + " LEFT JOIN (select tmp.idAssignment, max(tmp.ascore) as score, max(tmp.vscore) as vscore, max(tmp.uscore) as uscore, sum(tmp.d) as doneAttempts from "
                 + " ( (select idAssignment, score as ascore, 0 as vscore, 0 as uscore, 1 as d from attempts inner join logins on attempts.idLogins=logins.id WHERE logins.idUser='"+p.idUser+"') union (select idAssignment, 0 as ascore, vscore, "
                 + " 0 as uscore, 0 as d from visualization inner join logins on visualization.idLogins=logins.id WHERE logins.idUser='"+p.idUser+"') "
                 + " union (select idAssignment, 0 as ascore, 0 as vscore, score as uscore, 1 as d from uploads where idUser='"+p.idUser+"')) as tmp group by tmp.idAssignment ) as b "
                 +" ON b.idAssignment = asgn.id "
                 +" WHERE (au.idUser='"+p.idUser+"' OR asgn.applyToAll=1) AND units.idGroup='"+p.idGroup+"' AND asgn.visible=1 GROUP BY asgn.id ORDER BY units.`order`, units.id, units.unit, asgn.`order`, asgn.postDate, asgn.id, asgn.fromDate;"
       
       
        //console.log(sql1);
        var success = function(d)
        {
            var tmp = d.result;
            //FOR EACH ENTRY Must get information about the attempts done and the score, whether is open or closed
            tmp.forEach(function(e){
                if(e.visible){
                        //Must internationalize "e"
                        app.i18n_activity(e, null, req);    
                        //Determine if the assignment is done or pending
                        
                        e.open = e.open && (e.maxAttempts===0 || e.maxAttempts < e.doneAttempts);                        
                        
                        var t = e.activityType;
                        
                        var fet = false;
                        if(t==='U'){
                            fet = e.uscore > 0;
                        } else if(t==='V'){
                            fet = e.vscore > 0;
                        }
                        else if(e.hasAct>0) {
                            fet = e.doneAttempts > 0;
                        } else {
                            fet = (e.score + e.vscore + e.uscore) > 0;
                        }
                        
                        
                        e.collapsed = fet;

                        //NOW MUST ORGANIZE assignments INTO their units
                        var idUnit = e.idUnit || 0;

                        for(var i in unitats){
                            if(unitats[i].id === idUnit){
                                unitats[i].assignments.push(e);
                                break;
                            }
                        }
                }
            });
            
            res.send(unitats);
        };
                 
        var q1 = app.db.query(sql1, success, error);
        
        q0().then(q1);
    };
   
     
    
    /**
     * To create an assignment we must also pass a list of students "applyTo"
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var create = function(req, res)
    {
        var p = req.body;
        var applyTo =  p.applyTo;
        
        var doCreate = function(){
            
                    var sql = "INSERT INTO assignments SET ?";

                    var params = p.params || '{}';
                    if(typeof(params)==='object'){
                        try{
                            params = JSON.stringify(params);
                        } catch(ex){
                            params = '{}';
                        }
                    }

                    var obj = {idActivity: p.idActivity || 0, idUser: p.idUser || 0, idUnit: p.idUnit || 0, postDate: formatMysqlDate(p.postDate),
                         maxAttempts: p.maxAttempts || 0, instructions: p.instructions || "", applyToAll: p.applyToAll? 1:0, params: params, visible: p.visible || 0, order: p.order || 99};
                     
                    if(p.fromDate)
                    {
                        obj.fromDate = formatMysqlDate(p.fromDate);
                    }
                    if(p.toDate)
                    {
                        obj.toDate = formatMysqlDate(p.toDate);
                    }

                    var error = function()
                    {
                        res.send({ok: false, id: 0});
                    };

                    var success = function(d)
                    {
                        var id = d.result.insertId;
                        if(applyTo && applyTo.length)
                        {
                            var sql2 = "INSERT INTO assignments_users (idAssignment,idUser) VALUES('"+id+"','";
                            var list = [];
                            applyTo.forEach(function(item){
                                var userId = (0+item) || 0;
                                if(userId>0)
                                {
                                    list.push(userId);
                                }
                            });
                            
                            var success2 = function(){
                                res.send({ok: true, id: id});
                            };

                            if(list.length)
                            {
                                
                                var toDo = function(bean, cb){
                                    app.db.query(sql2+bean+"')", cb, cb)();
                                }
                                
                                async.map(list, toDo, function(err){
                                    if(err){
                                        error();
                                        return;
                                    }
                                    success2();
                                });
                            }
                            else
                            {
                                success2();
                            }
                        }
                        else
                        {
                            res.send({ok: true, id: id});
                        }
                    };


                    app.db.queryBatch(sql, obj, success, error)();

        };
        
        
        //If applyTo is undefined then assume that it is applied to all students in the current group defined by the unit.
        if(!applyTo && !p.applyToAll){
            applyTo = [];
            var sql0 = "select e.idUser from units as u inner join enroll as e on u.idGroup=e.idGroup WHERE u.id='"+p.idUnit+"'";
            
            var success0 = function(d){
                d.result.forEach(function(e){
                   applyTo.push(e.idUser); 
                });
                doCreate();
            };
            
            var error0 = function(d){
                res.send({ok: false, id: 0});
            };
            app.db.query(sql0, success0, error0)();
        }
        else {
            doCreate();
        }          
    };
    
    var updateVisibility = function(req, res)
    {
        var p = req.body;
        var sql = "UPDATE assignments SET visible="+(p.visible || 0)+ " WHERE id="+(p.id || 0) ;
        
            var success = function(d){
                res.send({ok: true});
            };
            
            var error = function(d){
                res.send({ok: false});
            };
            
        app.db.query(sql, success, error)();
    };
    
    var tinyupdate = function(req, res)
    {
        var p = req.body;
        
        var error = function(d){
            res.send(false);
        };
        
        var success = function(d){
            res.send(true);
        };
        var sql = "UPDATE assignments SET ? WHERE id=" + p.id;
        var objs = {fromDate: formatMysqlDate(p.fromDate), toDate: formatMysqlDate(p.toDate), instructions: p.instructions || ""};
        app.db.queryBatch(sql, objs, error, success)();      
    };
    
    var update = function(req, res)
    {
        var p = req.body;
        var applyTo = p.applyTo;
        //First must delete all assigment_users for this id

        var doUpdate = function(){ 

            var sql1 = "DELETE FROM assignments_users WHERE idAssignment='" + p.id+"'";
            var query1 = app.db.query(sql1);

            var sql2 = "UPDATE assignments SET ? WHERE id=" + p.id;
            
            var params = p.params || '{}';
            if(typeof(params)==='object'){
                try{
                    params = JSON.stringify(params);
                } catch(ex){
                    params = '{}';
                }
            }

            var obj = {idUser: p.idUser, idUnit: p.idUnit || 0,   postDate: formatMysqlDate(p.postDate || new Date()),
                fromDate: formatMysqlDate(p.fromDate), toDate: formatMysqlDate(p.toDate), maxAttempts: p.maxAttempts || 0, 
                instructions: p.instructions || "", 
                applyToAll: p.applyToAll? 1:0, params: params, visible: p.visible || 0};

            var query2 = app.db.queryBatch(sql2, obj);

            var sql3 = "INSERT INTO assignments_users (idAssignment, idUser) VALUES ?";

            var list = [];
            (applyTo || []).forEach(function (idUser) {
                list.push([p.id, idUser]);
            });

            var success = function (d) {
                res.send({ok: true});
            };

            var error = function (d) {
                res.send({ok: false});
            };
            var query3 = app.db.queryBatch(sql3, list, success, error);
            
            query1().then(query2).then(query3);
        };
         
        
        //If applyTo is undefined then assume that it is applied to all students in the current group defined by the unit.
        if(!applyTo && !p.applyToAll){
            applyTo = [];
            var sql0 = "select e.idUser from units as u inner join enroll as e on u.idGroup=e.idGroup WHERE u.id='"+p.idUnit+"'";
            
            var success0 = function(d){
                d.result.forEach(function(e){
                   applyTo.push(e.idUser); 
                });
                doUpdate();
            };
            
            var error0 = function(d){
                res.send({ok: false, id: 0});
            };
            app.db.query(sql0, success0, error0)();
        }
        else {
            doUpdate();
        }          
        
    };
    
    //Deletes the entire assignment, to disable one user use assign method
    //Only requires p.idAssigment
    var erase = function(req, res)
    {
        var p = req.body;
        
        var error = function(d){
            res.send(false);
        };
        
        var success = function(d){
            res.send(true);
        };
        
        Remover.del_assignment(app.db, p.idAssignment, success, error);                
    };
    
    var assign = function(req, res)
    {
        var p = req.body;
        //Create or deletes an assignment to a given user
        //p.idAssignment, p.assign = 0/1
        
        var error = function(){
            res.send(false);
        };
        
        var success = function(){
            res.send(true);
        };
        
        if(!p.assign)
        {
            var sql1 = "DELETE FROM assignments_users WHERE id="+p.idAssignment;            
            app.db.query(sql1, error, success)();
        }
        else
        {
            var testQuery = "SELECT id FROM assignments_users WHERE id="+p.idAssignment;
            var doQuery = "INSERT INTO assignments_users SET idAssignment="+p.idAssignment+", idUser="+p.idUser;
             
            app.db.queryIfEmpty(testQuery, doQuery, success, null, error)();
        }
        
    };
  
    var importCreated = function (req, res)
    {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            
            if (err) {
                //console.log(err);
                res.send({});
                return;
            }
            var file = files.file; 
                    
            var idGroup = fields.idGroup; 
            
            fs.readFile(file.path, 'utf8', function(err, data) {
                if (err){
                    console.log(err);
                    res.send({ok: false});
                    return;
                }
               
                try{
                    var json = JSON.parse(data);
                    
                    //Now start creating units from json
                    //Update its id and idGroup 
                    //when done upload assignments
                    
                    var jobs = [];
                    json.forEach(function(u){
                       u.idGroup = idGroup;
                       if(u.visible !== null && u.order>=0 && u.assignments){
                            var f = function(cb){
                                var sql = "INSERT INTO units SET ?";
                                var objs = {unit: u.unit, idGroup: idGroup, order: u.order, visible: u.visible};
                              
                                var success = function(d){
                                    u.id = d.result.insertId;
                                    //Now create all assignments in this unit
                                    u.assignments.forEach(function(a){
                                        var sql2 = "INSERT INTO assignments SET ?";
                                        var objs2 = {idActivity: a.idActivity, idUser: fields.idUser, idUnit: u.id, postDate: formatMysqlDate(a.postDate),
                                                    fromDate: formatMysqlDate(a.fromDate), toDate: formatMysqlDate(a.toDate), maxAttempts: a.maxAttempts, instructions: a.instructions,
                                                    applyToAll: 1, params: a.params, visible: a.visible};
                                        app.db.queryBatch(sql2, objs2)();
                                    });                               
                                    cb(null, null);
                                };
                                var error = function(){
                                    u.id = 0;
                                    cb(null, null);
                                };
                                app.db.queryBatch(sql, objs, success, error)();
                            };
                            jobs.push(f);          
                       }
                    });
                    
                    async.series(jobs, function(errs, results){
                        res.send({ok:true});
                    });
                    
                } catch(ex){
                    console.log(err);
                    res.send({ok: false});
                }
                
            });
            
            
        });
    }; 
    
    var reorder = function(req, res)
    {
        var p = req.body;
        var pos = 0;
       
        var doAsync = function(b, cb){
            
            var sql = "UPDATE assignments SET `order`="+b.pos+", idUnit="+b.idUnit+" WHERE id="+b.id;
            var ok = function(){
                pos += 1;
                cb();
            };
            app.db.query(sql, ok, ok)();
            
        };
        
        async.map(p.order, doAsync, function(){
            res.send({});
        });
    };
    
    app.post('/rest/assignments/querycreated', AdminsAndTeachersMdw, queryCreated);
    app.post('/rest/assignments/importcreated', AdminsAndTeachersMdw, importCreated);
    app.post('/rest/assignments/queryasgn', queryAsgn);
    app.post('/rest/assignments/create', AdminsAndTeachersMdw, create);
    app.post('/rest/assignments/update', AdminsAndTeachersMdw, update);
    app.post('/rest/assignments/tinyupdate', AdminsAndTeachersMdw, tinyupdate);
    app.post('/rest/assignments/updatevisibility', AdminsAndTeachersMdw, updateVisibility);
    app.post('/rest/assignments/delete', AdminsAndTeachersMdw, erase);
    app.post('/rest/assignments/assign', AdminsAndTeachersMdw, assign);
    app.post('/rest/assignments/reorder', AdminsAndTeachersMdw, reorder);
 

};
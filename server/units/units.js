module.exports = function(app){
    //var winston = require('winston');
    var Remover = require('../misc/remover'),
        async = require('async'),
        AdminsAndTeachersMdw = require('../AuthorizedMdw').AdminsAndTeachersMdw;
    var API = {};
    
    API.del = function(idUnit, success, error){
        Remover.del_unit(app.db, idUnit, success, error);
    };
    
    
    var del = function(req, res)
    {
        var p = req.body;
        
        var success = function(d){
            res.send({ok: true});
        };
        
        var error = function(d){
          
            res.send({ok:false});
        };
        
        API.del(p.id, success, error);
         
    };
    
    API.list = function(idGroup, success, error){
        var sql = "SELECT * FROM units WHERE idGroup='"+idGroup+"' ORDER BY `order`, id, unit";
        app.db.query(sql, success, error)();          
    };
    
    var list = function(req, res)
    {
        var p = req.body;
        
        var success = function(d){          
            res.send(d.result);
        };
        
        var error = function(d){
          
            res.send([]);
        };
        
        API.list(p.idGroup, success, error);          
    };
    
    API.list = function(idGroup, success, error){
        var sql = "SELECT * FROM units WHERE idGroup='"+idGroup+"' ORDER BY `order`, id, unit";
        app.db.query(sql, success, error)();          
    };
    
    API.save = function(p, success, error){
        var sql;
        if(p.id){
            sql = "UPDATE units SET ? WHERE id='"+p.id+"'";
        }
        else{
            sql = "INSERT INTO units SET ?";
        }    
        
        if(isNaN(p.visible)){
            p.visible = 2;  //Assume default type
        }
        var obj = {order: p.order || 0, unit: p.unit || '', idGroup: p.idGroup || 0, visible: p.visible};
        
        app.db.queryBatch(sql, obj, success, error)();  
    };
    
    var save = function(req, res)
    {
        var p = req.body;
       
        var success = function(d){
            p.id = p.id || d.result.insertId;
            res.send({ok: d.result.affectedRows>0, id: p.id});
        };
        
        var error = function(d){
          
            res.send({ok:false});
        };
        
        API.save(p, success, error);  
    };
    
    
    var reorder = function(req, res)
    {
        var p = req.body;
        var pos = 0;
       
        var doAsync = function(b, cb){
            
            var sql = "UPDATE units SET `order`="+b.pos+" WHERE id="+b.id;
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
    
    app.APIS.unit = API;
    
    
    /**
     * Generates a report of all activities assigned in the given unit
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var trace = function(req, res){
        var p = req.body;
        var response = {unit: {}, students: []};
        
        var error = function(d){          
            res.send(response);
        };
        
        //Retrieve information about the unit
        var query1 = "SELECT u.id as idUnit, u.unit, u.idGroup, g.groupName FROM units as u INNER JOIN groups as g ON g.id=u.idGroup WHERE u.id="+p.idUnit;
        var success1 = function(d){            
            response.unit = d.result[0];
        };
        var q1 = app.db.query(query1, success1, error);
        
        //Retrieve information about assignments in unit (only those with idActivity associated)
        var query2 = "SELECT asgn.*, group_concat(distinct asgnu.idUser separator ',') as destinataris, a.activity, a.activityType FROM assignments as asgn "+
                     " INNER JOIN activities as a on a.id=asgn.idActivity LEFT JOIN assignments_users as asgnu ON asgnu.idAssignment = asgn.id WHERE asgn.idUnit="+p.idUnit+
                     " GROUP BY asgn.id ORDER BY asgn.order, asgn.postDate, asgn.id";             
            
        var success2 = function(d){    
            d.result.forEach(function(e){
               app.i18n_activity(e, null, req); 
            });
            response.unit.activities = d.result;
            
            
 
        };
        var q2 = app.db.query(query2, success2, error);
        
        var tmpMap = {};
        //Retrieve all students in the group
        var query3 = "SELECT u.* FROM users as u INNER JOIN enroll as e ON e.idUser=u.id INNER JOIN units as un ON un.idGroup=e.idGroup WHERE un.id="+p.idUnit+" AND e.idRole="+app.config.USER_ROLES.student+" ORDER BY u.fullname ASC";
        var success3 = function(d){            
            response.students = d.result;
            //For each student create an empty array 
            response.students.forEach(function(e){
                e.activities = [];
                for(var i=0; i<response.unit.activities.length; i++){
                    var asgn = response.unit.activities[i];
                    if(asgn.applyToAll){
                        e.activities.push({enabled:true});
                    } else {
                        var destins = (asgn.destinataris || "").split(",");
                        if(destins.indexOf(e.idUser)>=0){
                            e.activities.push({enabled: true});
                        } else {
                            e.activities.push({});
                        }
                    }
                }
                tmpMap[e.id] = e;
            });
            
            
            //Get all stuff done in every assignment
            var index = 0;
            var do4Asgn = function(bean, cb){
                
                //Check for all types of activity possible stuff on videos
                //Video visualization
                var query40= "SELECT v.idAssignment, v.vscore, v.vseconds, l.idUser FROM visualization as v INNER JOIN logins as l ON l.id=v.idLogins WHERE v.idActivity="+bean.idActivity;
                var success40 = function(dd40){
                     dd40.result.forEach(function(e){                         
                        var user = tmpMap[e.idUser];
                        if(user){
                            user.activities[index] = {video: {score: e.vscore, seconds: e.vseconds, enabled:true}, score: e.vscore, seconds: e.vseconds, enabled: true};
                        } 
                    });
                }; 
                var q40 = app.db.query(query40, success40);
                
                
                //Decide which type of activity is
                var query4;
                if(bean.activityType==='U') {
                    //Upload activity
                    query4 = "SELECT v.idAssignment, v.score as vscore, 0 as vseconds, v.idUser FROM uploads as v INNER JOIN assignments as a ON a.id=v.idAssignment WHERE a.idActivity="+bean.idActivity;
                } else {
                    //Activity:: Pick only the max score in all attempts
                    query4 = "SELECT v.idAssignment, max(v.score) as vscore, sum(time_to_sec(timediff(v.attemptEnd,v.attemptStart))) as vseconds, l.idUser FROM attempts as v INNER JOIN logins as l ON v.idLogins=l.id WHERE v.idActivity="+bean.idActivity+" GROUP BY l.idUser, v.idAssignment";
                }
                
                
                var success4 = function(dd){
                    //assignment index is index
                    dd.result.forEach(function(e){                         
                        var user = tmpMap[e.idUser];
                        if(user){
                            var obj = user.activities[index];
                            if(!obj){
                                obj = {score: 0, seconds: 0, enabled: true};
                                user.activities[index] = obj;
                            }        
                            obj.activity = {score: e.vscore, seconds: e.vseconds, enabled:true};
                            obj.score += e.vscore;
                            obj.seconds += e.vseconds;
                        } 
                    });
                    
                    index += 1;
                    cb();
                };               
                var error4 = function(){
                    index += 1;
                    cb();
                };
                var q4 = app.db.query(query4, success4, error4);
                
                q40().then(q4);
            };

            async.mapSeries(response.unit.activities, do4Asgn, function(){
                   res.send(response);
                   tmpMap = null;
            });
            
        };        
        var q3 = app.db.query(query3, success3, error);
        
        q1().then(q2).then(q3);
    };
  
    app.post('/rest/unit/delete', AdminsAndTeachersMdw, del);
    app.post('/rest/unit/list', list);
    app.post('/rest/unit/save', AdminsAndTeachersMdw, save);    
    app.post('/rest/unit/reorder', AdminsAndTeachersMdw, reorder);    
    app.post('/rest/unit/trace', trace);    
};
/*
 * This module is intended to provide trace of the work done by users in a given idActivity / idAssignment
 * 
 * In first place, assume that idAssignment is defined!
 * 
 */
module.exports =function(app){
    
    var trace = function(req, res){    
    var p = req.body;
    var idAsgn = p.idAssignment;
  
    //Trace all stuff for a given idAsgn
    var result = {info:{}, data:[]};
    
    //This query lists all visualizations stuff
    var sql = " select v.*, u.id as idUser, u.fullname, u.username, u.uopts, vq.formulation, vq.answer, vq.rightAnswer, vq.isValid, vq.penalty as score from visualization as v inner join assignments as asgn on v.`idActivity`=asgn.idActivity "+
              " inner join logins as l on l.id=v.idLogins inner join users as u on u.id=l.idUser inner join enroll as e on e.idUser=u.id left join visualization_quizz as vq on vq.idV=v.id "+ 
              " where asgn.id='"+idAsgn+"'";
    if(p.allgroups){
        sql += " AND  e.idGroup IN ("+p.allgroups+") "; 
    } else {  
        sql += " AND  e.idGroup='"+p.idGroup+"' "; 
    }
    
    sql += " order by fullname";
    
    //console.log(sql);
    
    
    var error = function(d){
        res.send(result);      
    };
      
    var success = function(d){
        //stores per student
        var map = {};
        var id = 0;
        d.result.forEach(function(e){
            //this stuff of a given student
            var obj = map[e.idUser];
            if(!obj){
                obj = {fullname: e.fullname, username: e.username, resource: e.resource, vseconds: e.vseconds, vscore: e.vscore, quizz: [], uopts: {}};
                try{
                   obj.uopts=JSON.parse(e.uopts); 
                } catch(ex){
                    //
                }
                
                map[e.idUser] = obj;
                id= e.id;
            }
            else{
              if(id !== e.id){
                    obj.vseconds += e.vseconds;  
                    obj.vscore += e.vscore;
               }
               id = e.id;
            }
            if(e.formulation){
                obj.quizz.push({formulation: e.formulation, answer: e.answer, rightAnswer: e.rightAnswer, isValid: e.isValid, score: e.score});
            }
        });
        Object.keys(map).forEach(function(k){
           result.data.push(map[k]); 
        });
        
        //Query information about the activity and/or assignment
        var sql2 = "SELECT * FROM activities WHERE id="+p.idActivity;
        
        var success2 = function(d){
            var entry = d.result[0];
            app.i18n_activity(entry, null, req);
            result.info = entry;
            res.send(result);
        };
        
        app.db.query(sql2, success2, error)();
        
    };
    
              
    app.db.query(sql, success, error)();
     
};


    app.post('/rest/activity/trace', trace);
    
};
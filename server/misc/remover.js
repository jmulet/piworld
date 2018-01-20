(function(){
    
    var remover = remover || {};

    //Removing a group does not remove the user since it can be enrolled to other groups
    //It removes however the enrollments to this group and the assignments and attempts associated with it
    remover.del_group = function(db, idGroup, succ, err, log){
        log = log || [];
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
        
        //Del assignments associated with this group
        var sql1 = "DELETE au FROM assignments_users AS au INNER JOIN assignments as a ON a.id=au.idAssignment INNER JOIN units ON units.id=a.idUnit WHERE units.id='"+idGroup+"'";
        var q1 = db.query(sql1, s, e);
        
        var sql2 = "DELETE a FROM assignments as a INNER JOIN units ON units.id=a.idUnit WHERE units.id='"+idGroup+"'";
        var q2 = db.query(sql2, s, e);

        //Del units        
        var sql3 = "DELETE FROM units WHERE idGroup='"+idGroup+"'";
        var q3 = db.query(sql3, s, e);


        //Del attempts only those associated with the group.... free attempts are not deleted since the user is not deleted!
        //Del answers
        var sql4 = "DELETE a FROM answers as a INNER JOIN questions as q ON q.id=a.idQuestion INNER JOIN attempts as att ON att.id=q.idAttempt WHERE att.idGroup='"+idGroup+"'";
        var q4 = db.query(sql4, s, e);
        
          
        //Del questions
        var sql6 = "DELETE q FROM questions as q INNER JOIN attempts as att ON att.id=q.idAttempt WHERE att.idGroup='"+idGroup+"'";
        var q6 = db.query(sql6, s, e);
         
        //Del attempts themselves
        var sql7 = "DELETE FROM attempts WHERE idGroup='"+idGroup+"'";
        var q7 = db.query(sql7, s, e);


        //Del enrollments
        var sql8 = "DELETE FROM enroll WHERE idGroup='"+idGroup+"'";
        var q8 = db.query(sql8, s, e);

         
        //Del group itself
        var sql9 = "DELETE FROM groups WHERE id='"+idGroup+"'";
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q9 = db.query(sql9, success, error);
         
        q1().then(q2).then(q3).then(q4).then(q6).then(q7).then(q8).then(q9);
    };
    
    
    //Removing a unit will also delete all assignments and attempts associated with that unit    
    remover.del_unit =  function(db, idUnit, succ, err, log){    
        log = log || [];
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
        
      
        //Del attempts only those associated with the unit.... free attempts are not deleted since the user is not deleted!
        //Del answers
        var sql1 = "DELETE a FROM answers as a INNER JOIN questions as q ON q.id=a.idQuestion INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN assignments as asg ON asg.id=att.idAssignment WHERE asg.idUnit='"+idUnit+"'";
        var q1 = db.query(sql1, s, e);
           
        //Del questions
        var sql3 = "DELETE q FROM questions as q INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN assignments as asg ON asg.id=att.idAssignment WHERE asg.idUnit='"+idUnit+"'";
        var q3 = db.query(sql3, s, e);
         
        //Del attempts themselves
        var sql4 = "DELETE att FROM attempts as att INNER JOIN assignments as asg ON asg.id=att.idAssignment WHERE asg.idUnit='"+idUnit+"'";
        var q4 = db.query(sql4, s, e);
        
          //Del assignments associated with this unit
        var sql5 = "DELETE au FROM assignments_users AS au INNER JOIN assignments as a ON a.id=au.idAssignment INNER JOIN units as un ON un.id=a.idUnit WHERE un.id='"+idUnit+"'";
        var q5 = db.query(sql5, s, e);
        
        var sql6 = "DELETE a FROM assignments as a INNER JOIN units as un ON un.id=a.idUnit WHERE un.id='"+idUnit+"'";
        var q6 = db.query(sql6, s, e);
        
        //Last del unit itself
        var sql7 = "DELETE FROM units WHERE id='"+idUnit+"'";
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q7 = db.query(sql7, success, error);
        
        q1().then(q3).then(q4).then(q5).then(q6).then(q7);
        
    };
    
    
    remover.del_assignment = function(db, idAssignment, succ, err, log){
        log = log || [];
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
        
      
        //Del attempts only those associated with the assignment.... free attempts are not deleted since the user is not deleted!
        //Del answers
        var sql1 = "DELETE a FROM answers as a INNER JOIN questions as q ON q.id=a.idQuestion INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN assignments as asg ON asg.id=att.idAssignment WHERE asg.id='"+idAssignment+"'";
        var q1 = db.query(sql1, s, e);
          
        //Del questions
        var sql3 = "DELETE q FROM questions as q INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN assignments as asg ON asg.id=att.idAssignment  WHERE asg.id='"+idAssignment+"'";
        var q3 = db.query(sql3, s, e);
         
        //Del attempts themselves
        var sql4 = "DELETE att FROM attempts as att INNER JOIN assignments as asg ON asg.id=att.idAssignment  WHERE asg.id='"+idAssignment+"'";
        var q4 = db.query(sql4, s, e);
        
          //Del assignments associated with this unit
        var sql5 = "DELETE au FROM assignments_users AS au INNER JOIN assignments as asg ON asg.id=au.idAssignment WHERE asg.id='"+idAssignment+"'";
        var q5 = db.query(sql5, s, e);
        
        var sql6 = "DELETE FROM assignments WHERE id='"+idAssignment+"'";
        
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q6 = db.query(sql6, success, error);
        
        q1().then(q3).then(q4).then(q5).then(q6);
    };
    
    remover.del_attempt = function(db, idAttempt, succ, err, log){
        log = log || [];
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
              
        //Del answers
        var sql1 = "DELETE a FROM answers as a INNER JOIN questions as q ON q.id=a.idQuestion WHERE q.idAttempt='"+idAttempt+"'";
        var q1 = db.query(sql1, s, e);
         
         
        //Del questions
        var sql3 = "DELETE FROM questions WHERE idAttempt='"+idAttempt+"'";
        var q3 = db.query(sql3, s, e);
         
        //Del attempt itself
        var sql4 = "DELETE FROM attempts WHERE id='"+idAttempt+"'";
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q4 = db.query(sql4, success, error);
         
        q1().then(q3).then(q4);
        
    };


    remover.del_teacher = function(db, idUser, succ, err, log){
        log = log || [];
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
        
        //delete units associated with groups
        var sql1 = "DELETE u FROM units as u INNER JOIN groups as g ON u.idGroup=g.id WHERE g.idUserCreator='"+idUser+"'";
        var q1 = db.query(sql1, s, e);
        
        //delete groups enrollments
        var sql2 = "DELETE e FROM enroll as e INNER JOIN groups as g ON e.idGroup=g.id WHERE g.idUserCreator='"+idUser+"'";
        var q2 = db.query(sql2, s, e);
        
        //Must delete all groups created by this teacher
        var sql3 = "DELETE FROM groups WHERE idUserCreator='"+idUser+"'";
        var q3 = db.query(sql3, s, e);
                
        //Must delete all attempts associated with assignments created by this teacher
        //Del answers
        var sql4 = "DELETE a FROM answers as a INNER JOIN questions as q ON q.id=a.idQuestion INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN assignments as asg ON asg.id=att.idAssignment WHERE asg.idUser='"+idUser+"'";
        var q4 = db.query(sql4, s, e);
         
        //Del questions
        var sql6 = "DELETE q FROM questions as q INNER JOIN attempts as att ON att.id=q.idAttempt INNER JOIN assignments as asg ON asg.id=att.idAssignment WHERE asg.idUser='"+idUser+"'";
        var q6 = db.query(sql6, s, e);
         
        //Del attempts themselves
        var sql7 = "DELETE att FROM attempts as att INNER JOIN assignments as asg ON asg.id=att.idAssignment WHERE asg.idUser='"+idUser+"'";
        var q7 = db.query(sql7, s, e);
       
        //Must delete the attempts which the teacher created with his own user (equivalent to student, see below)
        //Del attempts based on idLogins-idUser 
        //Del answers
        var sql41 = "DELETE a FROM answers as a  INNER JOIN questions as q ON q.id=a.idQuestion INNER JOIN attempts as att ON q.idAttempt=att.id INNER JOIN logins as l ON l.id=att.idLogins WHERE l.idUser='"+idUser+"'";
        var q41 = db.query(sql41, s, e);
        
        
        //Del questions
        var sql43 = "DELETE q FROM questions as q INNER JOIN attempts as att ON q.idAttempt=att.id INNER JOIN logins as l ON l.id=att.idLogins WHERE l.idUser='"+idUser+"'";
        var q43 = db.query(sql43, s, e);
         
        //Del attempt itself
        var sql44 = "DELETE att FROM attempts as att INNER JOIN logins as l ON l.id=att.idLogins WHERE l.idUser='"+idUser+"'";
        var q44 = db.query(sql44, s, e);
        
        
        
        //Must delete all assignments created by this teacher
        var sql8 = "DELETE au FROM assignments_users as au INNER JOIN assignments as asg ON asg.id=au.idAssignment WHERE asg.idUser='"+idUser+"'";
        var q8 = db.query(sql8, s, e);
        
        var sql9 = "DELETE FROM assignments WHERE idUser='"+idUser+"'";
        var q9 = db.query(sql9, s, e);
        
        //Delete the teacher itself
        var sql10 = "DELETE FROM users WHERE id='"+idUser+"'";
        var q10 = db.query(sql10, s, e);
            
        //Delete visualizations
        var sql11 = "DELETE v FROM visualization as v INNER JOIN logins as l on l.id=v.idLogins WHERE l.idUser='"+idUser+"'";
        var q11 = db.query(sql11, s, e);
        
        //Delete his logins
        var sql12 = "DELETE FROM logins WHERE idUser='"+idUser+"'";
        var q12 = db.query(sql12, s, e);
        
        //Delete his ratings
        var sql13 = "DELETE FROM ratings WHERE idUser='"+idUser+"'";
        var q13 = db.query(sql13, s, e);
        
        //Delete his comments
        var sql14 = "DELETE FROM comments WHERE idUser='"+idUser+"'";
        
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q14 = db.query(sql14, success, error);
        
        q1().then(q2).then(q3).then(q4).then(q6).then(q7).then(q41).then(q43).then(q44).then(q8).then(q9).then(q10).then(q11).then(q12).then(q13).then(q14);
        
    };

    //This method has to be implemented for a del_teacher
    remover.del_student = function(db, idUser, succ, err, log){
        log = log || [];
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
        
        //Del user itself
        var sql1 = "DELETE FROM users WHERE id='"+idUser+"'";
        var q1 = db.query(sql1, s, e);
        
        //Del enrolls 
        var sql2 = "DELETE FROM enroll WHERE idUser='"+idUser+"'";
        var q2 = db.query(sql2, s, e);
        
        //Del assifgnments users 
        var sql3 = "DELETE FROM assignments_users WHERE idUser='"+idUser+"'";
        var q3 = db.query(sql3, s, e);
        
        //Del attempts based on idLogins-idUser 
        //Del answers
        var sql41 = "DELETE a FROM answers as a  INNER JOIN questions as q ON q.id=a.idQuestion INNER JOIN attempts as att ON q.idAttempt=att.id INNER JOIN logins as l ON l.id=att.idLogins WHERE l.idUser='"+idUser+"'";
        var q41 = db.query(sql41, s, e);
         
        //Del questions
        var sql43 = "DELETE q FROM questions as q INNER JOIN attempts as att ON q.idAttempt=att.id INNER JOIN logins as l ON l.id=att.idLogins WHERE l.idUser='"+idUser+"'";
        var q43 = db.query(sql43, s, e);
         
        //Del attempt itself
        var sql44 = "DELETE att FROM attempts as att INNER JOIN logins as l ON l.id=att.idLogins WHERE l.idUser='"+idUser+"'";
        var q44 = db.query(sql44, s, e);
                
        //Del visualizations
        var sql5 = "DELETE v FROM visualization as v INNER JOIN logins as l ON l.id=v.idLogins WHERE l.idUser='"+idUser+"'";
        var q5 = db.query(sql5, s, e);
        
       //Delete his ratings
        var sql51 = "DELETE FROM ratings WHERE idUser='"+idUser+"'";
        var q51 = db.query(sql51, s, e);
        
        //Delete his comments
        var sql52 = "DELETE FROM comments WHERE idUser='"+idUser+"'";
        var q52 = db.query(sql52, s, e);
                
        //Del logins
        var sql6 = "DELETE FROM logins WHERE idUser='"+idUser+"'";
        
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q6 = db.query(sql6, success, error);
         
        q1().then(q2).then(q3).then(q41).then(q43).then(q44).then(q5).then(q51).then(q52).then(q6);
    };
    
    //When a school is deleted, then everything associated with the school is going to be erased
    //Groups, students, teachers, assignments, attempts, visualization, enrollments, logins, etc.
    //regardless of free or assigned! So caution with this method
    remover.del_school = function(db, idSchool, succ, err, log){
        log = log || [];
        
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
       
        //Basically del teachers in the school
        
        //delete units associated with groups
        var sql1 = "DELETE u FROM units as u INNER JOIN groups as g ON u.idGroup=g.id INNER JOIN users as us ON us.id=g.idUserCreator WHERE us.schoolId='"+idSchool+"'";
        var q1 = db.query(sql1, s, e);
        
        //delete groups enrollments
        var sql2 = "DELETE e FROM enroll as e INNER JOIN groups as g ON e.idGroup=g.id INNER JOIN users as us ON us.id=g.idUserCreator WHERE us.schoolId='"+idSchool+"'";
        var q2 = db.query(sql2, s, e);
        
        //Must delete all groups created by this teacher
        var sql3 = "DELETE g FROM groups as g INNER JOIN users as us ON us.id=g.idUserCreator WHERE us.schoolId='"+idSchool+"'";
        var q3 = db.query(sql3, s, e);
                
        
        
        //Must delete all attempts in the school
        //Del answers
        var sql4 = "DELETE a from answers as a inner join questions as q on q.id=a.idQuestion inner join attempts as att on att.id=q.idAttempt inner join logins as l on l.id=att.idLogins inner join users as us on us.id=l.idUser WHERE us.schoolId='"+idSchool+"'";
        var q4 = db.query(sql4, s, e);
         
         
        //Del questions
        var sql6 = "DELETE q FROM questions q inner join attempts as att on att.id=q.idAttempt inner join logins as l on l.id=att.idLogins inner join users as us on us.id=l.idUser WHERE us.schoolId='"+idSchool+"'";
        var q6 = db.query(sql6, s, e);
         
        //Del attempts themselves
        var sql7 = "DELETE att FROM attempts as att inner join logins as l on l.id=att.idLogins inner join users as us on us.id=l.idUser WHERE us.schoolId='"+idSchool+"'";
        var q7 = db.query(sql7, s, e);
        
        
        //Must delete all assignments of users in school
        var sql8 = "DELETE au FROM assignments_users as au INNER JOIN assignments as asg ON asg.id=au.idAssignment inner join users as us on us.id=asg.idUser WHERE us.schoolId='"+idSchool+"'";
        var q8 = db.query(sql8, s, e);
        
        var sql9 = "DELETE asg FROM assignments as asg inner join users as us on us.id=asg.idUser WHERE us.schoolId='"+idSchool+"'";
        var q9 = db.query(sql9, s, e);
        
            
        //Delete visualizations
        var sql11 = "DELETE v FROM visualization as v INNER JOIN logins as l on l.id=v.idLogins inner join users as us on us.id=l.idUser WHERE us.schoolId='"+idSchool+"'";
        var q11 = db.query(sql11, s, e);
        
        //Delete his logins
        var sql12 = "DELETE l FROM logins as l inner join users as us on us.id=l.idUser WHERE us.schoolId='"+idSchool+"'";
        var q12 = db.query(sql12, s, e);
        
        //Delete his ratings
        var sql13 = "DELETE r FROM ratings as r inner join users as us on us.id=r.idUser WHERE us.schoolId='"+idSchool+"'";
        var q13 = db.query(sql13, s, e);
        
        //Delete his comments
        var sql14 = "DELETE c FROM comments as c inner join users as us on us.id=c.idUser WHERE us.schoolId='"+idSchool+"'";
        var q14 = db.query(sql14, s, e);
        
        //Delete the users themselves
        var sql15 = "DELETE FROM users WHERE schoolId='"+idSchool+"'";
        var q15 = db.query(sql15, s, e);
        
        //Del the school itself
        var sql16 = "DELETE FROM schools WHERE id='"+idSchool+"'";
        var q16 = db.query(sql16, s, e);
        
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q16 = db.query(sql16, success, error);
        
        q1().then(q2).then(q3).then(q4).then(q6).then(q7).then(q8).then(q9).then(q11).then(q12).then(q13).then(q14).then(q15).then(q16);
        
        
        //Basically del students in the school
        
    };
    

    //Restores the entire database removing almost everything (truncating tables)
    //some options can be passed to the object opts.
    remover.del_everything = function(db, opts, succ, err, log){
        log = log || [];
        
        
        var total_removed = 0;
        var total_errors = 0;
              
        var s = function(d){
            total_removed += d.result.affectedRows;
        };   
        
        var e = function(d){
            total_errors += 1;
        };   
       
        
        var sql1 = "TRUNCATE TABLE answers";
        var q1 = db.query(sql1, s, e);
         
        var sql3 = "TRUNCATE TABLE questions";
        var q3 = db.query(sql3, s, e);
        
        var sql4 = "TRUNCATE TABLE attempts";
        var q4 = db.query(sql4, s, e);
         
        var sql5 = "TRUNCATE TABLE assignments";
        var q5 = db.query(sql5, s, e);
        
        var sql6 = "TRUNCATE TABLE assignments_users";
        var q6 = db.query(sql6, s, e);
        
        var sql7 = "TRUNCATE TABLE units";
        var q7 = db.query(sql7, s, e);
        
        var sql8 = "TRUNCATE TABLE enroll";
        var q8 = db.query(sql8, s, e);
        
        var sql9 = "TRUNCATE TABLE visualization";
        var q9 = db.query(sql9, s, e);
                  
        var sql10 = "TRUNCATE TABLE groups";
        var q10 = db.query(sql10, s, e);
                  
        var sql11 = "TRUNCATE TABLE logins";
        var q11 = db.query(sql11, s, e);
        
        //Keep comments and ratings from teacher users which are not deleted
        var sql12 = "DELETE r FROM ratings as r inner join users as us on r.idUser=us.id WHERE us.idRole>=200";
        var q12 = db.query(sql12, s, e);
        
        var sql13 = "DELETE c FROM comments as c inner join users as us on c.idUser=us.id WHERE us.idRole>=200";
        var q13 = db.query(sql13, s, e);
        
        
        var sql14 = "DELETE FROM users WHERE idRole>=200";
        
        
        var success = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(succ){
                succ({affected: total_removed, errors: total_errors});
            }
        };   
        
        var error = function(d){
            log.push("Removed:"+total_removed);
            log.push("Errors:"+total_errors);
            if(err){
                err({affected: total_removed, errors: total_errors});
            }
        };   
        
        var q14 = db.query(sql14, success, error);
        
        q1().then(q3).then(q4).then(q5).then(q6).then(q7).then(q8).then(q9).then(q10).then(q11).then(q12).then(q13).then(q14);        
                
    };


    module.exports = remover;

})();

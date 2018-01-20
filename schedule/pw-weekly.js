var mysql = require('mysql');
var winston = require('winston');
var async = require('async');

//Refractor database
var config = require('../server/server.config');

var pool = mysql.createPool({
      host     : config.mysql.host || 'localhost',
      port     : config.mysql.port || 3306,
      user     : config.mysql.user || 'root',
      database : config.mysql.database || 'imaths',
      password : config.mysql.password || '',
      multipleStatements: true,
      connectionLimit: 99,
      bigNumberStrings: true
    });
   

var db = require('../server/mysql-utils')(pool);

winston.add(winston.transports.File, { 
    name: 'schedule-log',
    filename: '../log/schedule.log', 
    json: false,
    level: config.logLevel}  //Replace 'debug' by 'verbose'
);


//create reusable transporter object using SMTP transport
var transporter;

try{
transporter = nodemailer.createTransport({
   service: 'Gmail',
   auth: {
       user: config.adminEmail,
       pass: config.adminEmailPass
   }
});
} catch(ex){
    winston.log("info", "Unable to create GMAIL transporter");
}


/**
 * BADGES:
 * id     Description        Score
 */
var badges = config.badges; 

var mw = process.argv[2] || 0;      //minus weeks
winston.log("info", ">> pw-weekly going back "+mw+" weeks");

/**
 * Insignies per regularitat
 * Per cada 3 dies diferents en els quals es fan activitats o es veuen videos
 * 
 * @param {type} cb
 * @returns {undefined}
 */
function regularityBadges(cb){
    var badge = badges.REG;
    
    var sql1 = "select count(distinct day(l.login)) as total, l.idUser, date_format(now(),'%Y%v') as wk, u.email from  ( select a.idLogins, a.idActivity FROM attempts as a WHERE idActivity>0 AND score>10 UNION ALL "+
                   "select v.idLogins, v.idActivity FROM visualization as v WHERE idActivity>0 and vscore>10 ) t1 INNER JOIN logins as l ON l.id = t1.idLogins INNER JOIN users as u on u.id=l.idUser WHERE week(l.login,1)=(week(now(),1)-"+mw+
                   ") AND year(l.login)=year(now()) GROUP BY l.idUser HAVING total>="+badge.EVERY;
          
    var err = function(){
        cb();
    };
    
    var entries = [];
    
    var ok1 = function(d1){
        
         var sql2 = "SELECT idUser, date_format(`day`,'%Y%v') as wk FROM badges WHERE type="+badge.id;
         
         var ok2 = function(d2){
            //Check if some badge is missing
            d1.result.forEach(function(e){
                var found = false;
                for(var j=0; j<d2.result.length; j++){
                    var u = d2.result[j];
                    if(u.idUser === e.idUser  && u.wk === e.wk){
                        found = true;               
                        break;
                    }                    
                }
                if(!found){
                    //Must create an entry
                    entries.push({idUser: e.idUser, email: e.email, type: badge.id, rscore: badge.score});
                    
                }
            });
            
           if(entries.length){
               var worker = function(bean, cb2){
                   var sql3 = "INSERT INTO badges (idUser, type, day, rscore) VALUES("+bean.idUser+","+bean.type+",CURRENT_DATE()- INTERVAL "+(mw*7)+" DAY,"+bean.rscore+")";
                   var ok3 = function(d3){
                     if(d3.result.insertId>0){
                         winston.log("info","  CREATED regularity badge for "+bean.idUser);
                         
                           if(transporter && bean.email && bean.email.substring(0,2)!=="??"){
                                //Send an email
                                var mailOptions = {
                                   from: 'piWorld Admin <'+config.adminEmail+'>', // sender address
                                   to: bean.email, 
                                   subject: "Enhorabona! Insígnia de regularitat aconseguida.",  
                                   text: "Molt bé. Segueix realitzant activitats i visualitzant vídeos diverses vegades a la setmana i podràs obtenir més d'aquestes insígnies.",  
                                   html: "<center><h2>Insígnia de regularitat</h2><h2 style='display:table-cell; vertical-align:middle; text-align:center'><img style='display: block; margin: auto;' src='http://piworld.es/assets/img/badge-2.png'/> + "+bean.rscore+" <img style='display: block; margin: auto;'  src='http://piworld.es/assets/img/picoin.png'/></h2><h4>Molt bé. Segueix realitzant activitats i visualitzant vídeos diverses vegades a la setmana i podràs obtenir més d'aquestes insígnies.</h4><h4><a href='http://piworld.es'>http://piworld.es</a></h4></center>"
                               };

                               // send mail with defined transport object
                               transporter.sendMail(mailOptions, function (error, info) {
                                   if (error) {
                                       winston.log("info","Unable to sent email to "+bean.emailerror+" due to ", error);                    
                                   } else {
                                       winston.log("info","Email sent to "+bean.email);                        
                                   }
                                   cb2();
                               });

                         } else{
                              winston.log("info","User "+bean.idUser+" has no email associated");           
                            cb2();
                        }
                         
                         
                     } else {
                         winston.log("info","  FAILED regularity badge for "+bean.idUser);
                         cb2();  
                     }
                     
                   };
                   var err3 = function(){
                     winston.log("info","  FAILED regularity badge for "+bean.idUser);
                     cb2();  
                   };
                   db.query(sql3, ok3, err3)();
               };
               
               async.map(entries, worker, function(){
                   cb();
               });
           } else {
               winston.log("info","  NO new regularity badges found.");
               cb();
           }
            
         };
         
         db.query(sql2, ok2, err)();
    };
    
    db.query(sql1, ok1, err)();
    
}

/**
 * Dóna una medalla al millor estudiant de la setmana per cada grup i centre
 * Per determinar el millor estudiant es compten tots els punts obtinguts en 
 * el període (sense tenir en compte les medalles).
 * Estableix un valor minim de puntació per davall del qual no es donen insignies
 * 
 * @param {type} cb
 * @returns {undefined}
 */
function bestofweek(cb){
    
    var badge = badges.BOW;
    var interval = " AND ( week(l.login,1) = (week(now(),1)-"+mw+")  AND  year(l.login) = year(now()) ) ";
    //Includes any kind of visualizations
    var sql1 = "SELECT u.id as idUser, if(sum(v.vscore), sum(v.vscore), 0) as vscore, e.idGroup, u.email FROM visualization as v INNER JOIN logins as l on l.id=v.idLogins INNER JOIN  users as u "+
            "ON l.idUser=u.id LEFT JOIN `enroll` as e on e.idUser=u.id WHERE u.idRole>="+config.USER_ROLES.student+" "+interval+" GROUP BY e.idGroup, u.id";
            
    //Include attempts        
    var sql2 = "SELECT idUser, sum(tmp.sc) as score, tmp.idGroup from (select max(score) as sc, l.idUser, u.schoolId, e.idGroup, u.email from attempts as att "+
                   " INNER JOIN logins as l on att.idLogins=l.id INNER JOIN users as u on u.id=l.idUser LEFT JOIN `enroll` as e on e.idUser=u.id WHERE u.idRole>="+config.USER_ROLES.student+" "+ interval +
                   " GROUP BY concat(l.idUser,att.idActivity,att.id)) as tmp group by idGroup, idUser";
 
     //Include any uploads (check interval by uploadDate)
    var sql3 =  "SELECT u.id as idUser, sum(score) as uscore, e.idGroup, u.email FROM uploads as v INNER JOIN users as u ON u.id=v.idUser LEFT JOIN enroll as e on e.idUser=u.id  WHERE u.idRole>="+
            config.USER_ROLES.student+" AND v.score>0 AND ( week(v.uploadDate,1) =(week(now(),1)-"+mw+")  AND  year(v.uploadDate) = year(now()) ) GROUP BY idGroup, u.id";  
    
    var err = function(){
        cb();
    };

    var ok1 = function(d1){
        
        //Create a map
        var groups = {};
        d1.result.forEach(function(e){
            if(e.idGroup){
                var obj = groups[e.idGroup];
                if(!obj){
                    obj = {};
                    groups[e.idGroup] = obj;
                }
                var obj2 = obj[e.idUser];
                if(!obj2){
                    obj2 = {idUser: e.idUser, score: 0, email: e.email};
                    obj[e.idUser] = obj2;
                }
                obj2.score += e.vscore;
            }
        });
        
        var ok2 = function(d2){       
            d2.result.forEach(function(e){
                if(e.idGroup){
                    var obj = groups[e.idGroup];
                    if(!obj){
                        obj = {};
                        groups[e.idGroup] = obj;
                    }
                    var obj2 = obj[e.idUser];
                    if(!obj2){
                        obj2 = {idUser: e.idUser, score: 0, email: e.email};
                        obj[e.idUser] = obj2;
                    }
                    obj2.score += e.score;
                }
            });
            var ok3 = function(d3){  
                d3.result.forEach(function(e){
                    if(e.idGroup){
                        var obj = groups[e.idGroup];
                        if(!obj){
                            obj = {};
                            groups[e.idGroup] = obj;
                        }
                        var obj2 = obj[e.idUser];
                        if(!obj2){
                            obj2 = {idUser: e.idUser, score: 0, emai: e.email};
                            obj[e.idUser] = obj2;
                        }
                        obj2.score += e.score;
                    }
                });
                var entries = [];  

                //Now get the maximum score above MIN
                for(var idGroup in groups){
                    var best;
                    var maximum = 0;
                    var sc = groups[idGroup];
                    for(var idUser in sc){
                        var u = sc[idUser];
                        if(u.score > maximum){
                            maximum = u.score;
                            best = u;
                        }
                    }

                    if(maximum >= badge.MIN){                    
                        entries.push(best);
                    }
                }

                if(entries.length){

                    var worker = function(bean, cb2){
                        var idUser = bean.idUser;
                        var testQuery = "SELECT id FROM badges WHERE type='"+badge.id+"' AND idUser='"+idUser+"' AND week(`day`,1)=(week(now(),1)-"+mw+") AND year(`day`)=year(now())";
                        var doQuery = "INSERT INTO badges (idUser, type, day, rscore) VALUES("+idUser+","+badge.id+",CURRENT_DATE()- INTERVAL "+(mw*7)+" DAY,"+badge.score+")";

                        var okw = function(d3){
                            winston.log("info","  CREATED best of the week badge for "+idUser);    
                            
                                    if(transporter && bean.email && bean.email.substring(0,2)!=="??"){
                                       //Send an email
                                       var mailOptions = {
                                          from: 'piWorld Admin <'+config.adminEmail+'>', // sender address
                                          to: bean.email, 
                                          subject: "Enhorabona! Insígnia de millor de la setmana.",  
                                          text: "Molt bé. Segueix utilitzant piWorld de forma regular per aprendre i podràs obtenir més d'aquestes insígnies.",  
                                          html: "<center><h2>Insígnia de millor de la setmana</h2><h2 style='display:table-cell; vertical-align:middle; text-align:center'><img style='display: block; margin: auto;' src='http://piworld.es/assets/img/badge-3.png'/> + "+badge.score
                                                  +" <img style='display: block; margin: auto;'  src='http://piworld.es/assets/img/picoin.png'/></h2><h4>Molt bé. Segueix utilitzant piWorld de forma regular per aprendre i podràs obtenir més d'aquestes insígnies.</h4><h4><a href='http://piworld.es'>http://piworld.es</a></h4></center>"
                                      };

                                      // send mail with defined transport object
                                      transporter.sendMail(mailOptions, function (error, info) {
                                          if (error) {
                                              winston.log("info","Unable to sent email to "+bean.emailerror+" due to ", error);                    
                                          } else {
                                              winston.log("info","Email sent to "+bean.email);                        
                                          }
                                          cb2();
                                      });

                                } else{
                                     winston.log("info","User "+bean.idUser+" has no email associated");           
                                   cb2();
                               }
 
                            
                        };
                        var errw = function(){
                         winston.log("info","  FAILED best of the week badge for "+idUser);
                         cb2();  
                        };
                        db.queryIfEmpty(testQuery, doQuery, okw, cb2, errw)();
                    };                
                    async.map(entries, worker, cb);

                } else {  
                     winston.log("info", "  NO new best of the week badges found");  
                    cb();
                }
            };
            db.query(sql3, ok3, err)();
        };
        db.query(sql2, ok2, err)();
    };

    db.query(sql1, ok1, err)();

}


var challenges = function(cb){
     var badge = badges.CHL;
    //try to find all challenges for this week
    var sql = "SELECT c.id, c.ranswer, c.score, cq.answer, cq.valid, cq.idUser, u.email FROM challenges_quizz as cq INNER JOIN challenges as c on c.id=cq.idChallenge INNER JOIN users as u on u.id=cq.idUser WHERE c.w=WEEK(now(),1)";
       
    var ok = function(d){
        
        //First try to automatically check entries with c.ranswer and cq.valid being null
        var entries = [];
        d.result.forEach(function(e){
           if(e.ranswer && e.valid===null){
               e.valid = (e.ranswer.trim() == e.answer.trim());
               db.query("UPDATE challenges_quizz SET valid="+e.valid?'1':'0'+" WHERE id="+e.id)();              
           } 
           
           if(e.valid){
                   //Must create a badge if not already created!
                   entries.push({idUser: e.idUser, email: e.email, score: e.score});
           } 
        });
        
        if(entries.length){
            
            var worker = function(bean, cb2){
                 //Create a badge if not already created for the current week
                 var idUser = bean.idUser;                 
                 var testQuery = "SELECT id FROM badges WHERE type='"+badge.id+"' AND idUser='"+idUser+"' AND week(`day`,1)=(week(now(),1)-"+mw+") AND year(`day`)=year(now())";
                 var doQuery = "INSERT INTO badges (idUser, type, day, rscore) VALUES("+idUser+","+badge.id+",CURRENT_DATE()- INTERVAL "+(mw*7)+" DAY,"+bean.score+")";

                 var okw = function(d3){
                          winston.log("info","  CREATED weekly challenge badge for "+idUser);                     
                            if(transporter && bean.email && bean.email.substring(0,2)!=="??"){
                                       //Send an email
                                       var mailOptions = {
                                          from: 'piWorld Admin <'+config.adminEmail+'>', // sender address
                                          to: bean.email, 
                                          subject: "Enhorabona! Repte de la setmana aconseguit.",  
                                          text: "Molt bé. Continua participant en els reptes de la setmana i podràs obtenir més d'aquestes insígnies.",  
                                          html: "<center><h2>Repte de la setmana</h2><h2 style='display:table-cell; vertical-align:middle; text-align:center'><img style='display: block; margin: auto;' src='http://piworld.es/assets/img/badge-5.png'/> + "+bean.score
                                                  +" <img style='display: block; margin: auto;'  src='http://piworld.es/assets/img/picoin.png'/></h2><h4>Molt bé. Continua participant en els reptes de la setmana i podràs obtenir més d'aquestes insígnies.</h4><h4><a href='http://piworld.es'>http://piworld.es</a></h4></center>"
                                      };

                                      // send mail with defined transport object
                                      transporter.sendMail(mailOptions, function (error, info) {
                                          if (error) {
                                              winston.log("info","Unable to sent email to "+bean.emailerror+" due to ", error);                    
                                          } else {
                                              winston.log("info","Email sent to "+bean.email);                        
                                          }
                                          cb2();
                                      });

                                } else{
                                     winston.log("info","User "+bean.idUser+" has no email associated");           
                                   cb2();
                               }
                 };
                 var errw = function(){
                      winston.log("info","  FAILED weekly challenge badge for "+idUser);
                       cb2();  
                 };
                 db.queryIfEmpty(testQuery, doQuery, okw, cb2, errw)();
            };
            
            async.map(entries, worker, cb);
            
        } else {
            winston.log("info", "  NO new weekly challenges badges found");  
            cb();
        }
        
    };
    
    db.query(sql, ok, cb)();
};

winston.log("info", ">> Started pw-weekly.");

async.series([regularityBadges, bestofweek, challenges], function(){
    
    
    //Release pool
   pool.end(function (err) {
       winston.log("info",">> Done pw-weekly.");
      // all connections in the pool have ended
    });
});
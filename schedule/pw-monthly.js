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

 
/**
 * Dóna una medalla al millor estudiant de la setmana per cada grup i centre
 * Per determinar el millor estudiant es compten tots els punts obtinguts en 
 * el període (sense tenir en compte les medalles).
 * Estableix un valor minim de puntació per davall del qual no es donen insignies
 * 
 * @param {type} cb
 * @returns {undefined}
 */
function bestofmonth(cb){
    
    var badge = badges.BOM;
    var interval = " AND ( month(l.login) = month(now())  AND  year(l.login) = year(now()) ) ";
    //Includes any kind of visualizations
    var sql1 = "SELECT u.id as idUser, if(sum(v.vscore), sum(v.vscore), 0) as vscore, e.idGroup, u.email FROM visualization as v INNER JOIN logins as l on l.id=v.idLogins INNER JOIN  users as u "+
            "ON l.idUser=u.id LEFT JOIN `enroll` as e on e.idUser=u.id WHERE u.idRole>="+config.USER_ROLES.student+" "+interval+" GROUP BY e.idGroup, u.id";
            
    //Include attempts        
    var sql2 = "SELECT idUser, sum(tmp.sc) as score, tmp.idGroup from (select max(score) as sc, l.idUser, u.schoolId, e.idGroup, u.email from attempts as att "+
                   " INNER JOIN logins as l on att.idLogins=l.id INNER JOIN users as u on u.id=l.idUser LEFT JOIN `enroll` as e on e.idUser=u.id WHERE u.idRole>="+config.USER_ROLES.student+" "+ interval +
                   " GROUP BY concat(l.idUser,att.idActivity,att.id)) as tmp group by idGroup, idUser";
            
    //Include any uploads (check interval by uploadDate)
    var sql3 =  "SELECT u.id as idUser, sum(score) as uscore, e.idGroup, u.email FROM uploads as v INNER JOIN users as u ON u.id=v.idUser LEFT JOIN enroll as e on e.idUser=u.id  WHERE u.idRole>="+
            config.USER_ROLES.student+" AND v.score>0 AND ( month(v.uploadDate) = month(now())  AND  year(v.uploadDate) = year(now()) ) GROUP BY idGroup, u.id";    

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
                            obj2 = {idUser: e.idUser, score: 0, email: e.email};
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
                        var testQuery = "SELECT id FROM badges WHERE type='"+badge.id+"' AND idUser='"+idUser+"' AND month(`day`)=month(now()) AND year(`day`)=year(now())";
                        var doQuery = "INSERT INTO badges (idUser, type, day, rscore) VALUES("+idUser+","+badge.id+",CURRENT_DATE(),"+badge.score+")";

                        var okw = function(d3){
                            winston.log("info","  CREATED best of the month badge for "+idUser);                     
                              if(transporter && bean.email && bean.email.substring(0,2)!=="??"){
                                       //Send an email
                                        var mailOptions = {
                                          from: 'piWorld Admin <'+config.adminEmail+'>', // sender address
                                          to: bean.email, 
                                          subject: "Enhorabona! Insígnia de millor del mes.",  
                                          text: "Molt bé. Segueix utilitzant piWorld de forma regular per aprendre i podràs obtenir més d'aquestes insígnies.",  
                                          html: "<center><h2>Insígnia de millor del mes</h2><h2 style='display:table-cell; vertical-align:middle; text-align:center'><img style='display: block; margin: auto;' src='http://piworld.es/assets/img/badge-4.png'/> + "+badge.score
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
                         winston.log("info","  FAILED best of the month badge for "+idUser);
                         cb2();  
                        };
                        db.queryIfEmpty(testQuery, doQuery, okw, cb2, errw)();
                    };                
                    async.map(entries, worker, cb);

                } else {  
                     winston.log("info", "  NO new best of the month badges found");  
                    cb();
                }
            };
            
            db.query(sql3, ok3, err)();
        };
        
        db.query(sql2, ok2, err)();
    };

    db.query(sql1, ok1, err)();

};

winston.log("info", ">> Started pw-monthly.");

async.series([bestofmonth], function(){
    
    
    //Release pool
   pool.end(function (err) {
       winston.log("info",">> Done pw-monthly.");
      // all connections in the pool have ended
    });
});
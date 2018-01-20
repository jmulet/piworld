var mysql = require('mysql');
var winston = require('winston');
var async = require('async');
var Brain = require('../server/misc/brain');
var nodemailer = require('nodemailer');

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
 * Insignies per comentar activitats
 * Per cada 5 comentaris en activitats diferents se li dona una insignia
 * 
 * @param {type} cb
 * @returns {undefined}
 */
function commentBadges(cb){
    var badge = badges.CMT;
    
    var sql1 = "SELECT count(distinct c.idActivity) as total, c.idUser, u.email FROM comments as c INNER JOIN users as u ON u.id=c.idUser WHERE `comment`<>'' group by c.idUser";
    
    var err = function(){
        cb();
    };
    
    var entries = [];
    
    var ok1 = function(d1){
        
         var sql2 = "SELECT count(b.id) as total, b.idUser FROM badges as b WHERE type="+badge.id+" GROUP BY b.idUser";
         
         var ok2 = function(d2){
            //Check if some badge is missing
            d1.result.forEach(function(e){
                var expected = Math.floor(e.total / badge.EVERY);
                var real = 0;
                for(var j=0; j<d2.result.length; j++){
                    var u = d2.result[j];
                    if(u.idUser === e.idUser){
                        real = u.total;               
                        break;
                    }                    
                }
                if((expected - real) > 0){
                    //Must create a number of entries
                    for(var i=0; i<(expected - real); i++){
                        entries.push({idUser: e.idUser, email: e.email, type: badge.id, rscore: badge.score});
                    }
                }
            });
            
           if(entries.length){
               var worker = function(bean, cb2){
                   console.log(bean);
                   var sql3 = "INSERT INTO badges (idUser, type, day, rscore) VALUES("+bean.idUser+","+bean.type+",CURRENT_DATE(),"+bean.rscore+")";
                   var ok3 = function(d3){
                     if(d3.result.insertId>0){
                         winston.log("info","  CREATED comment badge for "+bean.idUser);                         
                         //Notify user by email if possible
                         if(transporter && bean.email && bean.email.substring(0,2)!=="??"){
                                //Send an email
                                var mailOptions = {
                                   from: 'piWorld Admin <'+config.adminEmail+'>', // sender address
                                   to: bean.email, 
                                   subject: "Enhorabona! Insígnia de comentaris aconseguida.",  
                                   text: "Molt bé. Segueix comentant les activitats que realitzis i podràs obtenir més d'aquestes insígnies.",  
                                   html: "<center><h2>Insígnia de comentaris</h2><h2 style='display:table-cell; vertical-align:middle; text-align:center'><img style='display: block; margin: auto;' src='http://piworld.es/assets/img/badge-1.png'/> + "+bean.rscore+" <img style='display: block; margin: auto;'  src='http://piworld.es/assets/img/picoin.png'/></h2><h4>Molt bé. Segueix comentant les activitats que realitzis i podràs obtenir més d'aquestes insígnies.</h4><h4><a href='http://piworld.es'>http://piworld.es</a></h4></center>"
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
                         winston.log("info","  FAILED comment badge for "+bean.idUser);
                         cb2();
                     }
                       
                   };
                   var err3 = function(){
                     winston.log("info","  FAILED comment badge for "+bean.idUser);
                     cb2();  
                   };
                   db.query(sql3, ok3, err3)();
               };
               
               async.map(entries, worker, function(){
                   cb();
               });
           } else {
               winston.log("info","  NO new comment badges found.");
               cb();
           }
            
         };
         
         db.query(sql2, ok2, err)();
    };
    
    db.query(sql1, ok1, err)();
    
}


function internal(cb){
    var delay = 86400;  //24h
    Brain.updateActivityDifficulty(db);
    //Delete non-validated user creation
    var okw = function(d1){
        winston.log("info","  DELETED "+d1.result.affectedRows+" invalid users.");
        var okw2 = function(d2){
            winston.log("info","  DELETED "+d2.result.affectedRows+" invalid comments.");
            cb();
        };
        db.query("DELETE FROM comments WHERE `comment`=''", okw2, cb)();
        
    };
    
    db.query("DELETE FROM users WHERE valid=-1 AND TIME_TO_SEC(TIMEDIFF(NOW(),`created`))>="+delay, okw, cb)();
    
}
      

var emailAdmin = function(cb){
    var mw = parseInt( process.argv[2] || 5  );      //set day number  
    var data = new Date(); 
    if(data.getDay()!==mw){
        console.log("Bypass emailAdmin");
        cb();
        return;        
    }
    
    //Gather information to be sent
    
    //Els divendres vespre envia un correu a l'administrador
    var text = "piWorld weekly report\n";

    var html = "<h2>piWorld weekly report</h2>";
    
    //Total number of logins and total time
    var sql = "select count(id) as total, count(distinct idUser) as nusers, sum(IF(logout IS NOT NULL, TIME_TO_SEC(TIMEDIFF(logout,login)) ,0)) as sec from logins where week(login,1)=week(now(),1) and year(login)=year(now())";
    
    var err = function(d){
        cb();
    };
    
    var formatLevel = function(l){
        if(l===0){
            return "1-2ESO";
        } else if(l===1){
            return "3-4ESO";
        } else if(l===2){
            return "BATX";
        }
        return l;       
    };
    
    var formatActivity = function(a){
        var t = a;
        try{
            var json = JSON.parse(a);
            t = json.ca || json.es || json.en;
        } catch(ex){}
        
        return t;
    };
    
    var ok = function(r){ 
        if(r.result.length){
            var d = r.result[0];
            text += "Total logins: "+ d.total+", Total users: "+ d.nusers+", Total time (h): "+ (d.sec/3600).toFixed(2)+ ", Time per session (min): "+(d.sec/(60*d.total)).toFixed(2)+"\n";
            html += "<p><em>Total logins:</em> "+ d.total+", <em>Total users:</em> "+ d.nusers+", <em>Total time (h):</em> "+ (d.sec/3600).toFixed(2)+ ", <em>Time per session (min):</em> "+(d.sec/(60*d.total)).toFixed(2)+"</p>";
        }
    };
        
    var q1 = db.query(sql, ok, err);
    
    //----------
    //Amount of visualization
    var sql2 = "select count(resource) as v, count(distinct resource) as nvideos, sum(vscore) as vscore,  sum(vseconds) as vseconds from visualization as v inner join logins as l on l.id=v.idLogins where week(login,1)=week(now(),1) and year(login)=year(now())";
         var ok2 = function(r2){
             if(r2.result.length){
                var d = r2.result[0];
                text += "Visualizations: "+ d.v+", Videos: "+ d.nvideos+", Total score: "+ d.vscore+ ", Visualization time (h): "+(d.vseconds/3600).toFixed(2)+"\n";
                html += "<p><em>Visualizations:</em> "+ d.v+", <em>Videos:</em> "+ d.nvideos+", <em>Total score:</em> "+ d.vscore+ ", <em>Visualization time (h):</em> "+(d.vseconds/3600).toFixed(2)+"</p>";
            }            
         };
    var q2 = db.query(sql2, ok2, err);
   
    //----------
    //Amount of activities
    var sql4="select count(distinct `idActivity`) as activities, count(distinct idLogins) as attempts from attempts where week(attemptStart,1)=week(now(),1) and year(attemptStart)=year(now())";
    var ok4 = function(r4){
            if(r4.result.length){
                var d = r4.result[0];
                text += "Attempts: "+ d.attempts+", Activities: "+ d.activities+"\n";
                html += "<p><em>Attempts:</em> "+ d.attempts+", <em>Activities:</em> "+ d.activities+"</p>";
            }      
    };
    var q4 = db.query(sql4, ok4, err);
    
   
    //----------
    //Comments
    var sql5 = "select a.id, a.activity, c.comment, u.fullname from comments as c inner join activities as a on a.id=c.idActivity inner join users as u on u.id=c.idUser where week(`when`,1)=week(now(),1) and year(`when`)=year(now())";
    var ok5 = function(r5){
      text += "COMMENTS:\n";
      html += "<h3>COMMENTS:</h3><table style='width:100%'><thead><tr style=\"border: 1px solid black; padding: 2px;\"><th>Activity</th><th>Comment</th><th>User name</th></tr></thead><tbody>";
      r5.result.forEach(function(d){
          text += "Comment:"+d.id+"-"+formatActivity(d.activity)+", Comment:"+d.comment+", Username:"+d.fullname+"\n";
          html += "<tr style=\"border: 1px solid black; padding: 2px;\"><th>"+d.id+"-"+formatActivity(d.activity)+"</th><th>"+d.comment+"</th><th>"+d.fullname+"</th></tr>";
      });
      html +="</tbody></table>"; 
    };
    var q5 = db.query(sql5, ok5, err);
     
  //------------
  //Amount of challenges send and pending to be checked
  var sql3 = "select c.level, count(cq.idUser) as submit, sum(if(c.ranswer is null and cq.valid is null, 1, 0)) as pending from challenges as c inner join challenges_quizz as cq on cq.idChallenge=c.id where w=week(now(),1) group by c.level";
  var ok3 = function(r3){
      text += "CHALLENGES:\n";
      html += "<h3>CHALLENGES:</h3><table style='width:100%'><thead><tr style=\"border: 1px solid black; padding: 2px;\"><th>Level</th><th>Submissions</th><th>Pending</th></tr></thead><tbody>";
      r3.result.forEach(function(d){
          text += "Level:"+formatLevel(d.level)+", Submissions:"+d.submit+", Pending:"+d.pending+"\n";
          html += "<tr style=\"border: 1px solid black; padding: 2px;\"><th>"+formatLevel(d.level)+"</th><th>"+d.submit+"</th><th>"+d.pending+"</th></tr>";
      });
      html +="</tbody></table>";              

        //Send an email
        var mailOptions = {
           from: 'piWorld Admin <'+config.adminEmail+'>', // sender address
           to: 'pep.mulet@gmail.com', 
           subject: 'piWorld weekly report: '+data,  
           text: text,  
           html: html  
       };


       // send mail with defined transport object
       if(transporter){
       transporter.sendMail(mailOptions, function (error, info) {
           if (error) {
               winston.error(error);                    
           } else {
               winston.log('Sent week report to '+config.adminEmail);                        
           }
           cb();
       });
        } else {
            cb();
        }

                  
                  
   };   
   var q3 = db.query(sql3, ok3, err);
    
 
 
    q1().then(q2).then(q4).then(q5).then(q3);
};
      

winston.log("info", ">> Started pw-daily.");

async.series([internal, commentBadges, emailAdmin], function(){
    
    
    //Release pool
   pool.end(function (err) {
       winston.log("info",">> Done pw-daily.");
      // all connections in the pool have ended
    });
});
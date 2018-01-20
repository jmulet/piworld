module.exports = function(app){
    
    var sqlite3 = require('sqlite3').verbose(),
             fs = require('fs'),
             async = require('async');
    
    var BckModule = {};
    
    var exec = require('child_process').exec;
    
    BckModule.mysqlDump = function(cfg, cb, ecb){
        var oFile = "./serverBackups/"+cfg.mysql.database+"-"+(new Date()).toISOString()+".sql";
   
        var cmd = cfg.paths.mysqldump+" -u"+cfg.mysql.user;
        if(cfg.mysql.password){
            cmd +=" -p"+cfg.mysql.password+" ";
        }
        cmd +=" --databases "+cfg.mysql.database+" > "+oFile;
        exec(cmd, function(error, stdout, stderr){
            if(error){
                if(ecb){
                    ecb();
                }
                return;
            }
            if(cb){
                cb(oFile);
            }
         
        });        
    };
    
    
    var createsqlite = function(req, res){
        var p = req.body;
        var db = app.db;
            
            var idSchool = p.idSchool || 0; //restrict to this school
            var path = app.config.paths.tmp+"/imaths-"+idSchool+"-"+Math.random().toString(32).slice(2)+".sqlite";


            
            var dblite = new sqlite3.Database(path);
 
            var tables = [
                 "CREATE TABLE `activities`(`id` INTEGER PRIMARY KEY AUTOINCREMENT, `levels` TEXT, `idSubject` INTEGER, `activity` TEXT, `activityType` TEXT, `share` INTEGER, `createdBy` TEXT, `createdWhen` REAL, `description` TEXT, `category` TEXT,`difficulty` INTEGER, `icon` TEXT, `ytid` TEXT, `ytqu` INTEGER DEFAULT '0', `ggbid` TEXT, `hasAct` INTEGER DEFAULT '0', `createjs` INTEGER DEFAULT '0')"
                ,"CREATE TABLE `answers` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idQuestion` INTEGER NOT NULL DEFAULT '0',`answer` TEXT,`isCorrect` TEXT NOT NULL DEFAULT '')"
                ,"CREATE TABLE `assignments` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idActivity` INTEGER DEFAULT '0',`idUser` INTEGER DEFAULT NULL,`idUnit` INTEGER,`postDate` REAL,`order` INTEGER,`fromDate` REAL,`toDate` REAL,`maxAttempts` INTEGER DEFAULT '0',`instructions` TEXT,`applyToAll` INTEGER NOT NULL DEFAULT '0',`params` TEXT,`visible` INTEGER DEFAULT '1')"
                ,"CREATE TABLE `assignments_users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idAssignment` INTEGER,`idUser` INTEGER)"
                ,"CREATE TABLE `attempts` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idLogins` INTEGER DEFAULT '0',`idActivity` INTEGER DEFAULT NULL,`idAssignment` INTEGER DEFAULT '0',`idGroup` INTEGER DEFAULT NULL,`idKahoot` INTEGER DEFAULT '0',`attemptStart` REAL,`attemptEnd` REAL,`done` TEXT DEFAULT 'N',`score` INTEGER DEFAULT '0',`level` INTEGER DEFAULT '0')"
                ,"CREATE TABLE `categories` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idSubject` INTEGER,`category` TEXT)"
                ,"CREATE TABLE `chats` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idGroup` INTEGER,`idUser` INTEGER,`when` REAL,`msg` TEXT)"
                ,"CREATE TABLE `comments` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idUser` INTEGER,`idActivity` INTEGER,`when` REAL DEFAULT CURRENT_TIMESTAMP,`comment` TEXT)"
                ,"CREATE TABLE `enroll` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idGroup` INTEGER,`idUser` INTEGER,`idRole` INTEGER NOT NULL DEFAULT '200')"
                ,"CREATE TABLE `forums` ( `id` INTEGER PRIMARY KEY AUTOINCREMENT,`forum` TEXT NOT NULL DEFAULT '',`description` TEXT,`createdBy` INTEGER,`createdWhen` REAL,`idGroup` INTEGER NOT NULL DEFAULT '0',`canCreateThemes` TEXT NOT NULL DEFAULT '',`visited` INTEGER NOT NULL DEFAULT '0')"
                ,"CREATE TABLE `forums_themes` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `idForum` INTEGER,`theme` TEXT NOT NULL DEFAULT '',`description` TEXT,`createdBy` INTEGER NOT NULL,`createdWhen` REAL,`canCreateEntries` TEXT NOT NULL DEFAULT '',`visited` INTEGER NULL DEFAULT '0')"
                ,"CREATE TABLE `forums_themes_entries` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idForumTheme` INTEGER,`entry` TEXT,`createdBy` INTEGER,`createdWhen` REAL,`answerTo` INTEGER NOT NULL DEFAULT '0')"                
                ,"CREATE TABLE `groups` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`groupName` TEXT,`groupLevel` INTEGER NOT NULL DEFAULT '1',`groupStudies` TEXT NOT NULL DEFAULT 'BAT',`groupLetter` TEXT NOT NULL DEFAULT 'A',`idUserCreator` INTEGER NOT NULL DEFAULT '0',`enrollPassword` TEXT, `idSubject` INTEGER NOT NULL DEFAULT '1',`currentUnit` INTEGER NOT NULL DEFAULT '0',`gopts` TEXT)"
                ,"CREATE TABLE `kahoot` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `idActivity` INTEGER, `idAssignment` INTEGER, `idTeacher` INTEGER, `idGroup` INTEGER, `start` REAL, `end` REAL)"
                ,"CREATE TABLE `logins` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idUser` INTEGER,`ip` TEXT,`login` REAL,`logout` timestamp REAL)"
                ,"CREATE TABLE `news` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`html` TEXT,`title` TEXT,`expires` REAL)"
                ,"CREATE TABLE `questions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idAttempt` INTEGER DEFAULT '0',`question` TEXT,`seconds` INTEGER NOT NULL DEFAULT '0',`category` TEXT DEFAULT 'g',`level` INTEGER DEFAULT '0')"
                ,"CREATE TABLE `ratings` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idActivity` INTEGER,`idUser` INTEGER,`rate` INTEGER,`vrate` INTEGER)"
                ,"CREATE TABLE `regularity` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idUser` INTEGER NOT NULL DEFAULT '0',`week` INTEGER NOT NULL DEFAULT '0',`rscore` INTEGER NOT NULL DEFAULT '0')"
                ,"CREATE TABLE `schools` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`schoolName` TEXT,`professorName` TEXT,`professorEmail` TEXT,`language` TEXT DEFAULT 'ca',`enrollPassword` TEXT,`canEnroll` INTEGER NOT NULL DEFAULT '0',`canPublish` INTEGER NOT NULL DEFAULT '1')"
                ,"CREATE TABLE `subjects` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`name` TEXT NOT NULL DEFAULT '')"
                ,"CREATE TABLE `units` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idGroup` INTEGER NOT NULL DEFAULT '0',`unit` TEXT,`order` INTEGER NOT NULL DEFAULT '0',`visible` INTEGER NOT NULL DEFAULT '1')"
                ,"CREATE TABLE `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idRole` INTEGER NOT NULL DEFAULT '0',`username` TEXT,`fullname` TEXT,`password` TEXT NOT NULL DEFAULT '',`email` TEXT NOT NULL DEFAULT '',`phone` TEXT NOT NULL DEFAULT '',`schoolId` INTEGER DEFAULT '0',`created` REAL NOT NULL DEFAULT CURRENT_TIMESTAMP,`valid` INTEGER NOT NULL DEFAULT '1',`uopts` TEXT)"               
                ,"CREATE TABLE `visualization` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idActivity` INTEGER ,`idAssignment` INTEGER NOT NULL DEFAULT '0',`resource` TEXT,`vscore` INTEGER,`vseconds` INTEGER,`idLogins` INTEGER)"
                ,"CREATE TABLE `visualization_quizz` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idV` INTEGER,`formulation` TEXT,`answer` TEXT,`rightAnswer` TEXT,`isValid` INTEGER,`penalty` INTEGER NOT NULL DEFAULT '0')"
                ,"CREATE TABLE `uploads` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `idAssignment` INTEGER, `idUser` INTEGER, `file` TEXT, `message` TEXT, `uploadDate` REAL, `score` INTEGER NOT NULL DEFAULT '-1', `feedback` TEXT)"
            ];
 

                var tasks_create = [];

                tables.forEach(function(table){                    
                    tasks_create.push(function(cb){
                        dblite.run(table, [], cb);
                    });                    
                });
                
                
                var tasks_insert = [];

                //Insert data into activities
                //console.log("Inserting into activities... ");
                var q1 = db.query("SELECT * FROM activities", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];
                           if(key==="createdWhen" && obj){
                               obj = obj.getTime();
                           }
                           array.push(obj);
                       }
                       tasks_insert.push({query: "INSERT INTO `activities` (`id`,`levels`,`idSubject`,`activity`,`activityType`,`share`,`createdBy`,`createdWhen`, `description`, `category`, `difficulty`, `icon`, `ytid`, `ytqu`, `ggbid`, `hasAct`, `createjs`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                       values: array});

                       });
                   }); 


                //console.log("Inserting into assignments... ");
                var query  = "SELECT a.* FROM assignments as a";
                if(idSchool){
                    query += " INNER JOIN units as u ON a.idUnit=u.id INNER JOIN groups as g ON g.id=u.idGroup INNER JOIN users ON users.id=g.idUserCreator WHERE users.schoolId="+idSchool;
                }

                var q2 = db.query(query, function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];
                           if(obj && (key==="postDate" || key==="fromDate" || key==="toDate")){
                               obj = obj.getTime();
                           }
                           array.push(obj);
                       }

                       tasks_insert.push({query: "INSERT INTO `assignments` (`id`,`idActivity`,`idUser`,`idUnit`,`postDate`,`order`,`fromDate`,`toDate`,`maxAttempts`,`instructions`,`applyToAll`,`params`,`visible`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
                       values: array});

                       });

                });



              //console.log("Inserting into assignments_users... ");
                var q3 = db.query("SELECT * FROM assignments_users", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];              
                           array.push(obj);
                       }

                       tasks_insert.push({query: "INSERT INTO `assignments_users` (`id`,`idAssignment`,`idUser`) VALUES(?,?,?)",
                       values: array});

                       });

                });


                //console.log("Inserting into categories... ");
                var q4 = db.query("SELECT * FROM categories", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];              
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `categories` (`id`,`idSubject`,`category`) VALUES(?,?,?)",
                       values: array});

                       });

                });

                //console.log("Inserting into chats... ");
                var query = "SELECT c.* FROM chats as c ";
                if(idSchool){
                    query += " INNER JOIN users as u ON c.idUser=u.id WHERE u.schoolId="+idSchool;
                }
                var q5 = db.query(query, function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];  
                           if(obj && key==="when"){
                               obj = obj.getTime();
                           }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `chats` (`id`,`idGroup`,`idUser`,`when`,`msg`) VALUES(?,?,?,?,?)",
                      values: array});

                       });

                });


                //console.log("Inserting into comments... ");
                var q6 = db.query("SELECT * FROM comments", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];  
                           if(obj && key==="when"){
                               obj = obj.getTime();
                           }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `comments` (`id`,`idUser`,`idActivity`,`when`,`comment`) VALUES(?,?,?,?,?)",
                       values: array});

                       });

                })();


                //console.log("Inserting into enroll... ");
                var query = "SELECT e.* FROM enroll as e ";
                if(idSchool){
                    query += " INNER JOIN users as u ON e.idUser=u.id WHERE u.schoolId="+idSchool;
                }
                var q7  = db.query(query, function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];                  
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `enroll` (`id`,`idGroup`,`idUser`,`idRole`) VALUES(?,?,?,?)",
                       values: array});

                       });

                });


                //console.log("Inserting into groups... ");
                var query = "SELECT g.* FROM groups as g ";
                if(idSchool){
                    query += " INNER JOIN users as u ON g.idUserCreator=u.id WHERE u.schoolId="+idSchool;
                }
                var q8 = db.query(query, function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key]; 
                           if(key==="enrollPassword"){
                               obj = "";
                           }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `groups` (`id`,`groupName`,`groupLevel`,`groupStudies`,`groupLetter`,`idUserCreator`,`enrollPassword`, `idSubject`,`currentUnit`,`gopts`) VALUES(?,?,?,?,?,?,?,?,?,?)",
                       values:array});

                       });

                });


                //console.log("Inserting into news... ");
                var q9 = db.query("SELECT * FROM news", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key]; 
                           if(obj && key==="expires"){
                               obj = obj.getTime();
                           }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `news` (`id`,`html`,`title`,`expires`) VALUES(?,?,?,?)",
                       values:array});

                       });

                });


                //console.log("Inserting into ratings... ");
                var q10 = db.query("SELECT * FROM ratings", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];              
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `ratings` (`id`,`idActivity`,`idUser`,`rate`,`vrate`) VALUES(?,?,?,?,?)",
                       values:array});

                       });

                });


                //console.log("Inserting into schools... ");
                var query = "SELECT * FROM schools ";
                if(idSchool){
                    query += " WHERE id="+idSchool;
                }
                var q11 = db.query(query, function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];   
                           if(key==="professorEmail" || key==="enrollPassword"){
                               obj = "";
                           }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `schools` (`id`,`schoolName`,`professorName`,`professorEmail`,`language`,`enrollPassword`,`canEnroll`,`canPublish`) VALUES(?,?,?,?,?,?,?,?)",
                       values:array});

                       });

                });


                //console.log("Inserting into subjects... ");
                var q12 = db.query("SELECT * FROM subjects", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];   
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `subjects` (`id`,`name`) VALUES(?,?)",
                       values:array});

                       });

                });


                //console.log("Inserting into units... ");
                var query = "SELECT u.* FROM units as u ";
                if(idSchool){
                    query += " INNER JOIN groups as g ON g.id=u.idGroup INNER JOIN users ON users.id=g.idUserCreator WHERE users.schoolId="+idSchool;
                }
                var q13 = db.query(query, function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];  
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `units` (`id`,`idGroup`,`unit`,`order`,`visible`) VALUES(?,?,?,?,?)",
                       values:array});

                       });

                });


                //console.log("Inserting into users... ");
                var q14 = db.query("SELECT * FROM users WHERE idRole>0", function(d){
                   d.result.forEach(function(row){           
                       var array = [];
                       for(var key in row){
                           var obj = row[key];  
                            if(key==="password" || key==="email" || key==="phone"){
                               obj = "";
                            }
                            if(obj && key==="created"){
                                obj= obj.getTime();
                            }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `users` (`id`,`idRole`,`username`,`fullname`,`password`,`email`,`phone`,`schoolId`,`created`,`valid`,`uopts`) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                       values:array});

                       });

                });
                
                
                var sql = "SELECT f.* FROM forums as f";
                
                if(p.idSchool){
                    sql+= " INNER JOIN groups as g ON f.idGroup = g.id INNER JOIN users as u on u.id=g.idUserCreator WHERE u.schoolId="+p.idSchool;
                }
                var q15 = db.query(sql, function(d){
                   d.result.forEach(function(row){           
                        
                       var array = [];
                       for(var key in row){
                           var obj = row[key];  
                           
                            if(obj && key==="createdWhen"){
                                obj= obj.getTime();
                            }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `forums` (`id`,`forum`,`description`,`createdBy`,`createdWhen`,`idGroup`,`canCreateThemes`,`visited`) VALUES(?,?,?,?,?,?,?,?)",
                       values:array});

                       });

                });
                
                
                sql = "SELECT ft.* FROM forums_themes as ft";
                
                if(p.idSchool){
                    sql+= " INNER JOIN forums as f ON f.id=ft.idForum INNER JOIN groups as g ON f.idGroup = g.id INNER JOIN users as u on u.id=g.idUserCreator WHERE u.schoolId="+p.idSchool;
                }
                var q16 = db.query(sql, function(d){
                   d.result.forEach(function(row){           
                       
                       var array = [];
                       for(var key in row){
                           var obj = row[key];  
                           
                            if(obj && key==="createdWhen"){
                                obj= obj.getTime();
                            }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `forums_themes` (`id`, `idForum`,`theme`,`description`,`createdBy`,`createdWhen`,`canCreateEntries`,`visited`) VALUES(?,?,?,?,?,?,?,?)",
                       values:array});

                       });

                });
                
                sql = "SELECT fte.* FROM forums_themes_entries as fte";
                
                if(p.idSchool){
                    sql+= " INNER JOIN forums_themes as ft ON ft.id = fte.idForumTheme INNER JOIN forums as f ON f.id=ft.idForum INNER JOIN groups as g ON f.idGroup = g.id INNER JOIN users as u on u.id=g.idUserCreator WHERE u.schoolId="+p.idSchool;
                }
                var q17 = db.query(sql, function(d){
                   d.result.forEach(function(row){           
                       
                       var array = [];
                       for(var key in row){
                           var obj = row[key];  
                           
                            if(obj && key==="createdWhen"){
                                obj= obj.getTime();
                            }
                           array.push(obj);
                       }

                       tasks_insert.push({query:"INSERT INTO `forums_themes_entries` (`id`,`idForumTheme`,`entry`,`createdBy`,`createdWhen`,`answerTo`) VALUES(?,?,?,?,?,?)",
                       values:array});

                       });

                });
                
                var doInsert = function(bean, cb){
                    dblite.run(bean.query, bean.values, cb);
                };
                
                
                async.series(tasks_create, function(err, done){
                   
                    q1().then(q2).then(q3).then(q4).then(q5).then(q6).then(q7).then(q8).then(q9).then(q10).then(q11).then(q12).then(q13).then(q14).then(q15).then(q16).then(q17).then(function(){
                        
                        async.map(tasks_insert, doInsert, function(err, done){
                            dblite.close(function(){
                                //Send the resulting file
                                res.download(path, function(err){
                                    fs.unlink(path);
                                });
                                
                            });                              
                        });                        
                    });                    
                });
                
                

           
    };
    

    app.post("/rest/misc/createsqlite", createsqlite);
    return BckModule;
};

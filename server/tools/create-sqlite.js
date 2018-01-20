  var sqlite3 = require('sqlite3').verbose(),
          fs = require('fs'),
    config = require('./server.config'),
    mysql = require('mysql'),
    path = require('path');
   
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
    
global.__publicDir = path.resolve(__dirname, "../public");    
    
var db = require('./mysql-utils')(pool);

try{
    fs.unlinkSync("./imaths.sqlite");
} catch(ex){
        
}

var idSchool = 4; //restrict to this school
var dblite = new sqlite3.Database("./imaths-"+idSchool+".sqlite");


var tables = [
     "CREATE TABLE `activities`(`id` INTEGER PRIMARY KEY AUTOINCREMENT, `levels` TEXT, `idSubject` INTEGER, `activity` TEXT, `activityType` TEXT, `share` INTEGER, `createdBy` TEXT, `createdWhen` NUMBER, `description` TEXT, `category` TEXT,`difficulty` INTEGER, `icon` TEXT, `ytid` TEXT, `ytqu` INTEGER DEFAULT '0', `ggbid` TEXT, `hasAct` INTEGER DEFAULT '0', `createjs` INTEGER DEFAULT '0')"
    ,"CREATE TABLE `answers` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idStep` INTEGER NOT NULL DEFAULT '0',`answer` TEXT,`isCorrect` TEXT NOT NULL DEFAULT '')"
    ,"CREATE TABLE `assignments` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idActivity` INTEGER DEFAULT '0',`idUser` INTEGER DEFAULT NULL,`idUnit` INTEGER,`postDate` NUMBER,`order` INTEGER,`fromDate` NUMBER,`toDate` NUMBER,`maxAttempts` INTEGER DEFAULT '0',`instructions` TEXT,`applyToAll` INTEGER NOT NULL DEFAULT '0',`params` TEXT,`visible` INTEGER DEFAULT '1')"
    ,"CREATE TABLE `assignments_users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idAssignment` INTEGER,`idUser` INTEGER)"
    ,"CREATE TABLE `attempts` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idLogins` INTEGER DEFAULT '0',`idActivity` INTEGER DEFAULT NULL,`idAssignment` INTEGER DEFAULT '0',`idGroup` INTEGER DEFAULT NULL,`idKahoot` INTEGER DEFAULT '0',`attemptStart` NUMBER,`attemptEnd` NUMBER,`done` TEXT DEFAULT 'N',`score` INTEGER DEFAULT '0',`level` INTEGER DEFAULT '0')"
    ,"CREATE TABLE `categories` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idSubject` INTEGER,`category` TEXT)"
    ,"CREATE TABLE `chats` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idGroup` INTEGER,`idUser` INTEGER,`when` NUMBER,`msg` TEXT)"
    ,"CREATE TABLE `comments` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idUser` INTEGER,`idActivity` INTEGER,`when` NUMBER DEFAULT CURRENT_TIMESTAMP,`comment` TEXT)"
    ,"CREATE TABLE `enroll` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idGroup` INTEGER,`idUser` INTEGER,`idRole` INTEGER NOT NULL DEFAULT '200')"
    ,"CREATE TABLE `groups` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`groupName` TEXT,`groupLevel` INTEGER NOT NULL DEFAULT '1',`groupStudies` TEXT NOT NULL DEFAULT 'BAT',`groupLetter` TEXT NOT NULL DEFAULT 'A',`idUserCreator` INTEGER NOT NULL DEFAULT '0',`enrollPassword` TEXT, `idSubject` INTEGER NOT NULL DEFAULT '1',`currentUnit` INTEGER NOT NULL DEFAULT '0',`gopts` TEXT)"
    ,"CREATE TABLE `logins` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idUser` INTEGER,`ip` TEXT,`login` NUMBER,`logout` timestamp NUMBER)"
    ,"CREATE TABLE `news` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`html` TEXT,`title` TEXT,`expires` NUMBER)"
    ,"CREATE TABLE `questions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idAttempt` INTEGER DEFAULT '0',`question` TEXT,`seconds` INTEGER NOT NULL DEFAULT '0',`category` TEXT DEFAULT 'g',`level` INTEGER DEFAULT '0')"
    ,"CREATE TABLE `ratings` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idActivity` INTEGER,`idUser` INTEGER,`rate` INTEGER,`vrate` INTEGER)"
    ,"CREATE TABLE `regularity` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idUser` INTEGER NOT NULL DEFAULT '0',`week` INTEGER NOT NULL DEFAULT '0',`rscore` INTEGER NOT NULL DEFAULT '0')"
    ,"CREATE TABLE `schools` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`schoolName` TEXT,`professorName` TEXT,`professorEmail` TEXT,`language` TEXT DEFAULT 'ca',`enrollPassword` TEXT,`canEnroll` INTEGER NOT NULL DEFAULT '0',`canPublish` INTEGER NOT NULL DEFAULT '1')"
    ,"CREATE TABLE `steps` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idQuestion` INTEGER,`step` TEXT,`askHelp` TEXT NOT NULL DEFAULT 'N',`askSolution` TEXT NOT NULL DEFAULT 'N',`askTheory` TEXT NOT NULL DEFAULT 'N',`seconds` INTEGER NOT NULL DEFAULT '0',`rightAnswer` TEXT)"
    ,"CREATE TABLE `subjects` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`name` TEXT NOT NULL DEFAULT '')"
    ,"CREATE TABLE `units` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idGroup` INTEGER NOT NULL DEFAULT '0',`unit` TEXT,`order` INTEGER NOT NULL DEFAULT '0',`visible` INTEGER NOT NULL DEFAULT '1')"
    ,"CREATE TABLE `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idRole` INTEGER NOT NULL DEFAULT '0',`username` TEXT,`fullname` TEXT,`password` TEXT NOT NULL DEFAULT '',`email` TEXT NOT NULL DEFAULT '',`phone` TEXT NOT NULL DEFAULT '',`schoolId` INTEGER DEFAULT '0',`created` NUMBER NOT NULL DEFAULT CURRENT_TIMESTAMP,`valid` INTEGER NOT NULL DEFAULT '1',`uopts` TEXT)"
    ,"CREATE TABLE `visualization` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idActivity` INTEGER ,`idAssignment` INTEGER NOT NULL DEFAULT '0',`resource` TEXT,`vscore` INTEGER,`vseconds` INTEGER,`idLogins` INTEGER)"
    ,"CREATE TABLE `visualization_quizz` (`id` INTEGER PRIMARY KEY AUTOINCREMENT,`idV` INTEGER,`formulation` TEXT,`answer` TEXT,`rightAnswer` TEXT,`isValid` INTEGER,`penalty` INTEGER NOT NULL DEFAULT '0')"
];






dblite.serialize(function(){
    
    tables.forEach(function(table){
        dblite.run(table);
    });
  
    //Insert data into activities
    console.log("Inserting into activities... ");
    db.query("SELECT * FROM activities", function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];
               if(key==="createdWhen" && obj){
                   obj = obj.getTime();
               }
               array.push(obj);
           }
           dblite.run("INSERT INTO `activities` (`id`,`levels`,`idSubject`,`activity`,`activityType`,`share`,`createdBy`,`createdWhen`, `description`, `category`, `difficulty`, `icon`, `ytid`, `ytqu`, `ggbid`, `hasAct`, `createjs`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
           array);
              
           });
       })(); 
    

    console.log("Inserting into assignments... ");
    var query  = "SELECT a.* FROM assignments as a";
    if(idSchool){
        query += " INNER JOIN units as u ON a.idUnit=u.id INNER JOIN groups as g ON g.id=u.idGroup INNER JOIN users ON users.id=g.idUserCreator WHERE users.schoolId="+idSchool;
    }
    
    db.query(query, function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];
               if(obj && (key==="postDate" || key==="fromDate" || key==="toDate")){
                   obj = obj.getTime();
               }
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `assignments` (`id`,`idActivity`,`idUser`,`idUnit`,`postDate`,`order`,`fromDate`,`toDate`,`maxAttempts`,`instructions`,`applyToAll`,`params`,`visible`) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
           array);
              
           });
     
    })();
  
  
  
  console.log("Inserting into assignments_users... ");
    db.query("SELECT * FROM assignments_users", function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];              
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `assignments_users` (`id`,`idAssignment`,`idUser`) VALUES(?,?,?)",
           array);
              
           });
     
    })();
    
    
    console.log("Inserting into categories... ");
    db.query("SELECT * FROM categories", function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];              
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `categories` (`id`,`idSubject`,`category`) VALUES(?,?,?)",
           array);
              
           });
     
    })();
    
    console.log("Inserting into chats... ");
    var query = "SELECT c.* FROM chats as c ";
    if(idSchool){
        query += " INNER JOIN users as u ON c.idUser=u.id WHERE u.schoolId="+idSchool;
    }
    db.query(query, function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];  
               if(obj && key==="when"){
                   obj = obj.getTime();
               }
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `chats` (`id`,`idGroup`,`idUser`,`when`,`msg`) VALUES(?,?,?,?,?)",
           array);
              
           });
     
    })();
    
    
    console.log("Inserting into comments... ");
    db.query("SELECT * FROM comments", function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];  
               if(obj && key==="when"){
                   obj = obj.getTime();
               }
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `comments` (`id`,`idUser`,`idActivity`,`when`,`comment`) VALUES(?,?,?,?,?)",
           array);
              
           });
     
    })();
    
    
    console.log("Inserting into enroll... ");
    var query = "SELECT e.* FROM enroll as e ";
    if(idSchool){
        query += " INNER JOIN users as u ON e.idUser=u.id WHERE u.schoolId="+idSchool;
    }
    db.query(query, function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];                  
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `enroll` (`id`,`idGroup`,`idUser`,`idRole`) VALUES(?,?,?,?)",
           array);
              
           });
     
    })();


    console.log("Inserting into groups... ");
    var query = "SELECT g.* FROM groups as g ";
    if(idSchool){
        query += " INNER JOIN users as u ON g.idUserCreator=u.id WHERE u.schoolId="+idSchool;
    }
    db.query(query, function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key]; 
               if(key==="enrollPassword"){
                   obj = "";
               }
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `groups` (`id`,`groupName`,`groupLevel`,`groupStudies`,`groupLetter`,`idUserCreator`,`enrollPassword`, `idSubject`,`currentUnit`,`gopts`) VALUES(?,?,?,?,?,?,?,?,?,?)",
           array);
              
           });
     
    })();
    
    
    console.log("Inserting into news... ");
    db.query("SELECT * FROM news", function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key]; 
               if(obj && key==="expires"){
                   obj = obj.getTime();
               }
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `news` (`id`,`html`,`title`,`expires`) VALUES(?,?,?,?)",
           array);
              
           });
     
    })();


    console.log("Inserting into ratings... ");
    db.query("SELECT * FROM ratings", function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];              
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `ratings` (`id`,`idActivity`,`idUser`,`rate`,`vrate`) VALUES(?,?,?,?,?)",
           array);
              
           });
     
    })();
    
    
    console.log("Inserting into schools... ");
    var query = "SELECT * FROM schools ";
    if(idSchool){
        query += " WHERE id="+idSchool;
    }
    db.query(query, function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];   
               if(key==="professorEmail" || key==="enrollPassword"){
                   obj = "";
               }
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `schools` (`id`,`schoolName`,`professorName`,`professorEmail`,`language`,`enrollPassword`,`canEnroll`,`canPublish`) VALUES(?,?,?,?,?,?,?,?)",
           array);
              
           });
     
    })();
    
    
    console.log("Inserting into subjects... ");
    db.query("SELECT * FROM subjects", function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];   
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `subjects` (`id`,`name`) VALUES(?,?)",
           array);
              
           });
     
    })();
    
    
    console.log("Inserting into units... ");
    var query = "SELECT u.* FROM units as u ";
    if(idSchool){
        query += " INNER JOIN groups as g ON g.id=u.idGroup INNER JOIN users ON users.id=g.idUserCreator WHERE users.schoolId="+idSchool;
    }
    db.query(query, function(d){
       d.result.forEach(function(row){           
           var array = [];
           for(var key in row){
               var obj = row[key];  
               array.push(obj);
           }
           
           dblite.run("INSERT INTO `units` (`id`,`idGroup`,`unit`,`order`,`visible`) VALUES(?,?,?,?,?)",
           array);
              
           });
     
    })();
    
 
    console.log("Inserting into users... ");
    db.query("SELECT * FROM users WHERE idRole>0", function(d){
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
           
           dblite.run("INSERT INTO `users` (`id`,`idRole`,`username`,`fullname`,`password`,`email`,`phone`,`schoolId`,`created`,`valid`,`uopts`) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
           array);
              
           });
     
    })();
 
});

//dblite.close(); 
 
module.exports = function(app)
{  
    var nodemailer = require('nodemailer');
    winston = require('winston'),
    Remover = require('../misc/remover'),
    Brain = require('../misc/brain'),
    async = require('async'),
    dateformat = require('dateformat'),
    fs = require('fs'),
    AuthorizedMdw = require('../AuthorizedMdw'),
    RootOnlyMdw = AuthorizedMdw.RootOnlyMdw,
    AdminsOnlyMdw = AuthorizedMdw.AdminsOnlyMdw;
    
    
    // Only a part of the user object is stored into express-session object
    function createSessionUser(bean) {
        return {id: bean.id, username: bean.username, idRole: bean.idRole,
            idLogin: bean.idLogin, parents: bean.parents, schoolId: bean.schoolId, groups: bean.groups};
    }
    
    function clientFingerprint(req){
        var ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;        
        return new Buffer(ip).toString("base64").replace(/-/g, ".");
    };
    
    
    /**
     * Works in two modes:
     *      If user is passed (encrypted) then check against user and password
     *      
     *      If idS5 is passed then check against open logins...
     * 
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var auth = function(req, res)
    {
        //Assume that body is text/plain -> no parsing by middleware has been taken
        var p;
        try{        
            p = JSON.parse(app.decrypt(req.body));
        } catch(Ex){
            res.send({ok:false, msg: "invalid middleware"});
            return;
        }
        
        var sql;
        if(p.idUser && p.cfp){            
                var clientfp = clientFingerprint(req); 

                if(p.cfp===clientfp){
                       sql = "SELECT id FROM logins WHERE id='" + p.idLogin + "' AND idUser='" + p.idUser + "' LIMIT 1";
                } else {                 
                    res.send({ok: false, msg: "Invalid client fingerprint"});
                    return;
                }

        } else {
      
                if(p.idUser === 0)
                {            
                    var chk = (p.password===app.config.adminPassword);
                    res.send({ok: chk});        
                    return;
                }
                sql = "SELECT id FROM users WHERE id='" + p.idUser+"' ";
                if(p.password){
                    sql+= " AND BINARY password='" + p.password + "' LIMIT 1";
                }               
                else if(p.passwordParents){
                    sql+= " AND BINARY passwordParents='" + p.passwordParents + "' LIMIT 1";
                }        
                else {
                    sql+= " LIMIT 0";
                }
        }  
       
        var success = function (d)
        {
            res.send({ok: d.result.length > 0});
        };

        var error = function ()
        {
            res.send({ok: false, msg: "Database error"});
        };
        
        
        app.db.query(sql, success, error)();
    
        
    };

    var login = function(req, res)
    {
        //Assume that body is text/plain -> no parsing by middleware has been taken
        var p;
        try{                    
            p = JSON.parse(app.decrypt(req.body));
             
        } catch(Ex){
            res.send({ok:false, msg: "invalid middleware"});
            return;
        }
        
        
        var ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
        
        
        //First check for build-in admin user
        if(p.username===app.config.adminUser && p.password===app.config.adminPassword)
        {
            var bean = {id:0, idRole: app.config.USER_ROLES.admin, username: app.config.adminUser, fullname: 'Administrator', email: '',  
                groups: [], uopts:{}, schoolId: 0, schoolName: "", professorName: "", professorEmail: "", language: app.config.adminLang};
            
           
            var sql = "INSERT INTO logins (idUser,ip,parents,login) VALUES('0','"+ip+"',0,now())";
            
            
            var success = function(d)
            {
                bean.idLogin = d.result.insertId;     
                bean.cfp = clientFingerprint(req);
            };
            
            var error = function()
            {
                var userInfoEncrypted = app.encrypt(JSON.stringify(bean));   
                res.send({user_info: userInfoEncrypted, ok: false, msg: 'Valid admin user. Unable to create a login instance'});
            };
            
            //Add information to the bean about the logins done by this user
            var sql2 = "SELECT * FROM logins WHERE idUser=0 AND parents=0";
            var success2 = function(d)
            {
                bean.logins = d.result;
                var userInfoEncrypted = app.encrypt(JSON.stringify(bean));
                req.session.user = createSessionUser(bean);
                res.send({user_info: userInfoEncrypted, ok: true, msg: 'Valid admin user'});
            };
            
            var error2 = function(d)
            {
                bean.logins = [];
                var userInfoEncrypted = app.encrypt(JSON.stringify(bean));
                req.session.user = createSessionUser(bean);
                res.send({user_info: userInfoEncrypted, ok: true, msg: 'Valid admin user'});
            };
            
            var q1 = app.db.query(sql, success, error);
            var q2 = app.db.query(sql2, success2, error2);
            q1().then(q2);
            return;
        }
        
        
        //Check against database users        
        //  g.groupLevel, g.groupStudies, g.groupLetter, g.idUserCreator, g.enrollPassword, g.gopts, ---- left join groups as g on u.groupId=g.id
        // Must escape fields
        var whichPassword = p.parents? "passwordParents" : "password";
        var whichValidation = p.parents? "" : " AND (valid=1 OR idRole<"+app.config.USER_ROLES.student+")";
        
        var testSql = "SELECT u.*, sc.schoolName, sc.professorName, sc.professorEmail, sc.language, sc.enrollPassword, sc.canEnroll, sc.canPublish from users as u "+
                " left join schools as sc on sc.id=u.schoolId WHERE BINARY "+whichPassword+"=" + app.db.pool.escape(p.password) + 
                " AND "+whichPassword + "<>'' AND "+whichPassword+" IS NOT NULL "+
                " AND BINARY username=" + app.db.pool.escape(p.username) + " "+
                whichValidation;
      
        var sql2 = function(pd){
            pd.user_info = pd.result[0] || {}; //keep a copy of the first query result.
            //Remove password entry
            delete pd.user_info.password;
            
            var id = pd.user_info.id || 0;
            return "INSERT INTO logins (idUser, ip, parents, login) VALUES('" +id+ "','"+ip+"',"+(p.parents?"1":"0")+",now())";
        };
        var success = function(pd){
            pd.user_info.idLogin = pd.result.insertId;
            pd.user_info.parents = p.parents;
            pd.user_info.cfp = clientFingerprint(req);
            
            try
            {
                pd.user_info.uopts = JSON.parse(pd.user_info.uopts || '{}');
            }
            catch(ex)
            {
                winston.error(ex);
                pd.user_info.uopts = {};
            }
            //When a valid user is logged in, then the brain starts to classify the user
            //Brain.getBrain(app.db, pd.user_info.id).train();
        };        
        
        var reject = function(pd){
            res.send({ok: false, msg: 'Invalid user or password'});
        };
        var error = function(pd){
             res.send({ok: false, msg: 'An internal error has occurred. Check if database server is running'});
        };
        
        var q1 = app.db.queryIfNotEmpty(testSql, sql2, success, reject, error);
        
        //This query loads all groups in which the user is enrolled to
        //24-3-16: Return creatorFullname field
        var sql3 = function(d){
           /*
            return  " SELECT e.id as idEnroll, e.idGroup, e.idUser, e.idRole as eidRole, g.groupName, g.groupStudies, g.groupLevel, g.groupLetter, "+
                   " g.idUserCreator, g.enrollPassword, g.idSubject, g.currentUnit, g.gopts, s.name  FROM enroll as e INNER JOIN groups as g on g.id=e.idGroup "+
                   " INNER JOIN subjects as s ON s.id=g.idSubject WHERE e.idUser='"+d.user_info.id+"'";
           */
          return  " SELECT e.id as idEnroll, e.idGroup, e.idUser, e.idRole as eidRole, g.groupName, g.groupStudies, g.groupLevel, g.groupLetter, g.groupYear, "+
                   " g.idUserCreator, u.fullname as creatorFullname, g.enrollPassword, g.idSubject, g.currentUnit, g.gopts, g.thmcss, s.name  FROM enroll as e INNER JOIN groups as g on g.id=e.idGroup "+
                   " INNER JOIN subjects as s ON s.id=g.idSubject LEFT JOIN users as u ON u.id=g.idUserCreator WHERE e.idUser='"+d.user_info.id+"' ORDER BY g.groupYear DESC, g.groupName ASC";
        };
        
        var success3 = function(d)
        {
            
            d.user_info.groups = d.result || [];
            
            d.user_info.groups.forEach(function(e){
            
                if(d.user_info.idRole>=app.config.USER_ROLES.teacher)
                {
                   try{
                        e.gopts = JSON.parse(e.gopts || '{}');
                   }
                   catch(ex){
                       winston.error(ex);
                       e.gopts = {lang: 'es', showTools: true};
                   }
                }
                else
                {
                    e.gopts = {lang: 'es', showTools: true};
                }     
             });
            
            //Finally parse config file
            d.user_info.config = {};
            fs.readFile(__serverDir+'/config.json', 'utf8', function (err, data) {
                if(!err){
                    try{
                        d.user_info.config = JSON.parse(data);
                    } catch(ex){ 
                        console.log(ex);
                    }; 
                } else {
                    console.log(err);
                }
                
                //If book validation check if book is active for this user
                var userInfoEncrypted = app.encrypt(JSON.stringify(d.user_info));   
                if(p.bookId){
                    //Use the function below
                    var callback = function(dr){
                        req.session.user = createSessionUser(d.user_info);
                        res.send({user_info: userInfoEncrypted, ok: true, okbook:dr, msg: 'Valid user'});
                    };
                    authorizeBook({idUser: d.user_info.id, idRole: d.user_info.idRole, idLogin: d.user_info.idLogin, groups: d.user_info.groups.map(function(e){ return e.idGroup;}).join(",")  }, p.bookId, callback);  
                } else {
                    req.session.user = createSessionUser(d.user_info);
                    res.send({user_info: userInfoEncrypted, ok: true, msg: 'Valid user'});
                }
            });
            
            
        };
        
        var q3 = app.db.query(sql3, success3, error);
        
        
         
        q1().then(q3);
    };
    
    
    var logout = function(req, res)
    {
        var p = req.body;
        var sql =  "UPDATE logins SET logout=NOW() WHERE id="+ (p.idLogin || 0);
        var resolved = function(data){
            Brain.removeBrain(p.idUser);
            req.session.user = null;
            req.session.destroy();
            res.send({ok: true});
        };
        var rejected = function(data){
            res.send({ok: false});
        };
        app.db.query(sql)().then(resolved, rejected);
    };
    
    
    var logins = function(req, res)
    {
        var p = req.body;
        var sql =  "UPDATE logins SET logout=NOW() WHERE id="+ (p.idLogin || 0);
        var resolved = function(data){
            Brain.removeBrain(p.idUser);
            res.send({ok: true});
        };
        var rejected = function(data){
            res.send({ok: false});
        };
        app.db.query(sql)().then(resolved, rejected);
    };
    
    


    var center_list = function(req, res)
    {
        var p = req.body;
        var sql =  "SELECT * FROM schools order by schoolName";
        var resolved = function(data){            
            res.send(data.result);
        };
        var rejected = function(data){
            res.send([]);
        };
        app.db.query(sql, resolved, rejected)();
    };
    
    var center_update = function(req, res)
    {
        var p = req.body;
        var sql = "";
        var obj = {schoolName: p.schoolName, professorName: p.professorName, professorEmail: p.professorEmail, language: p.language,
                   enrollPassword: p.enrollPassword, canEnroll: p.canEnroll || 0, canPublish: p.canPublish || 0};
        if(p.id)
        {
            sql =  "UPDATE schools SET ? WHERE id='"+ p.id + "'";
        }
        else
        {
            sql =  "INSERT INTO schools SET ?";
        }
        
        var resolved = function(data){
            var id = p.id || data.result.insertId;
            res.send({ok: true, id: id});
        };
        var rejected = function(data){
            res.send({ok: false});
        };
        app.db.queryBatch(sql, obj, resolved, rejected)();
    };
    
    var center_delete = function(req, res)
    {
        var p = req.body;
        
        var resolved = function(data){
            res.send({ok: data.affectedRows>0});            
        };
        var rejected = function(data){
            res.send({ok: false});
        };
        Remover.del_school(app.db, p.id, resolved, rejected);
    };
    
    var prenroll = function(req, res)
    {
        var p = req.body;
        
        var txt = p.enroll.id.trim();
        //p.enroll.id must have this format id-password
        var i = txt.indexOf("-");
        if(i<0){
            res.send({ok: false});
            return;
        }
        
        var id = txt.substring(0, i);
        var pwd = txt.substring(i+1);
      
        //Check if the center information is ok
        var sql = "SELECT * FROM schools WHERE canEnroll>0 AND id='"+id+"' and enrollPassword='"+pwd+"'";
        
        
        var resolved = function(d){
            if (d.result.length)
            {
                res.send({ok: true, schoolName: d.result[0].schoolName, professorName: d.result[0].professorName, schoolId: d.result[0].id});
            }
            else
            {
                res.send({ok: false});
            }           
        };
        
        
        var error = function(d){
            res.send({ok:false});
        };
        
        app.db.query(sql, resolved, error)();    
};
      
var doenroll = function(req, res)
{
        var p = req.body;
        //Check if a user with the same email is already created
        var testSql = "select id from users where username='"+p.enroll.email+"' OR (email<>'' AND email='"+p.enroll.email+"')";
       
        var sql = "INSERT INTO users (idRole,username,fullname,password,email,phone,schoolId,created,valid,uopts) VALUES('"+(p.enroll.idRole || app.config.USER_ROLES.student)+"','"+
                p.enroll.email+"','"+p.enroll.surname+", "+p.enroll.name+"','"+p.enroll.upassword+"','"+(p.enroll.email || "")+"','"+(p.enroll.phone || "")+"','"+(p.enroll.schoolId || 0)+"', NOW(),'-1','{}')";
        
        var resolved = function(d){
            if (d.result.insertId)
            {
                 var data = {idUser: d.result.insertId, password: p.enroll.upassword};
                 
                 var hash = app.encrypt(JSON.stringify(data));
                 
                 var ref = 'https://' + app.config.hostname+"/rest/register?q="+hash;
                 
                 var text = "Estau a punt d'acabar la inscripció a piWorld. Només heu de validar el vostre correu electrònic anant o clicant el següent enllaç: Moltes gràcies. Aquest és un missatge automàtic, per favor no contesteu aquest correu.";
                 
                 var html = "<h2>Estau a punt d'acabar la inscripció a piWorld.</h2>"+
                            "<p>Només heu de validar el vostre correu electrònic anant o clicant el següent enllaç:</p> <p><a href='"+ref+"'>"+ref+"</a></p> <p>Moltes gràcies.</p>"+
                            "<p><small>Aquest és un missatge automàtic, per favor no contesteu aquest correu.</small></p>";
                 
                //Send an email
                 var mailOptions = {
                    from: 'piWorld Admin <'+app.config.adminEmail+'>', // sender address
                    to: p.enroll.email, 
                    subject: 'Confirmació creació usuari piWorld',  
                    text: text,  
                    html: html  
                };


                //create reusable transporter object using SMTP transport
                var transporter = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: app.config.adminEmail,
                            pass: app.config.adminEmailPass
                        }
                });

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        //Role back user creation
                        app.db.query("DELETE FROM users WHERE id="+data.idUser)();
                        winston.error(error);
                        res.send({ok: false, msg: "Could not sent email."});
                    } else {
                        winston.log('Message sent: ' + info.response);
                        res.send({ok: true, user: data});
                    }
                });
                
            }
            else
            {
                res.send({ok: false});
            }           
        };
        
        var rejected = function(d){
           res.send({ok: false});
        };
        
        
        var error = function(d){
            res.send({ok:false});
        };
        
        app.db.queryIfEmpty(testSql, sql, resolved, rejected, error)();       
};

var forgotpwd = function(req, res){
  
    var email = req.body.email || "";
    var phone = req.body.phone || "";
    var sql = "SELECT * FROM users WHERE email<>'' AND email='"+email+"' AND phone<>'' AND phone='"+phone+"'";
    
    var err = function(){
        res.send({ok: false, msg: "S'ha produït un error imprevist"});
    };
    
    var ok = function(d){
        
        if(d.result.length === 1){
            var user = d.result[0];
            var id = user.id;
            var pwd = Math.random().toString(36).substring(2,8);
            var sql2 = "UPDATE users SET password='"+pwd+"' WHERE id='"+id+"'";
            
            var success = function(){
                //Send an email to the user
                 var text = "S'ha canviat la contrasenya d'accés a piWorld. Usuari: "+user.username+"; Contrasenya: "+pwd;
                 
                 var html = "<h2>S'ha canviat la contrasenya d'accés a piWorld.</h2>"+
                            "<p>Usuari: "+user.username+"; Contrasenya: "+pwd+"</p>"+
                            "<p><small>Aquest és un missatge automàtic, per favor no contesteu aquest correu.</small></p>";
                 
                //Send an email
                 var mailOptions = {
                    from: 'piWorld Admin <'+app.config.adminEmail+'>', // sender address
                    to: email, 
                    subject: 'Canvi de contrasenya a piWorld',  
                    text: text,  
                    html: html  
                };


                //create reusable transporter object using SMTP transport
                var transporter = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                              user: app.config.adminEmail,
                              pass: app.config.adminEmailPass
                        }
                });

                // send mail with defined transport object
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        //Role back password modification
                        app.db.query("UPDATE users SET password='"+user.password+"' WHERE id='"+id+"'")();
                        winston.error(error);
                        res.send({ok: false, msg: "Could not sent email."});
                    } else {
                        winston.log('Message sent: ' + info.response);
                        res.send({ok: true, msg: "Password modified and email send."});
                    }
                });
            };
            
            app.db.query(sql2, success, err)();
        } else {
            res.send({ok: false, msg: "No es troba cap usuari amb aquests correu electrònic i telèfon!"});
        }
    };
    
    app.db.query(sql, ok, err)();    
};

var registerGet = function(req, res)
{
        var q = req.query.q;
        var s = new Buffer(q, 'base64').toString('utf8');
        
        var obj = {};
        try{
            obj = JSON.parse(s);
        }
        catch(ex)
        {
            res.send("<b>Error:</b> No s'ha pogut registrar l'usuari perquè la clau de validació no és vàlida.");
            return;
        }
       
        if(!obj.idUser || !(obj.password || obj.email))
        {
            res.send("<b>Error:</b> No s'ha pogut registrar l'usuari perquè la clau de validació no és vàlida.");
            return;
        }
        
        var sql1;
        var validMsg;
        var invalidMsg;
        if(obj.password){        
          sql1  = "UPDATE users SET valid=1 WHERE id='"+obj.idUser+"'";
          validMsg = "<center><img src='https://" + app.config.hostname+"/assets/img/logo.png'/><p> <b>Molt Bé!</b> S'ha validat l'usuari. Ja podeu accedir a <a href='https://piworld.es'>https://piworld.es</a></p></center>";
          invalidMsg ="<center><img src='https://" + app.config.hostname+"/assets/img/logo2.png'/><p> <b>Ups!</b> No s'ha pogut validar l'usuari perquè la base de dades ha fallat.</p></center>";
        } else {
            if(req.query.a==1){
                sql1  = "UPDATE users SET valid=1, email='"+obj.email.replace("??","")+"'  WHERE id='"+obj.idUser+"'";
                validMsg = "<center><img src='https://" + app.config.hostname+"/assets/img/logo.png'/><p><b>Molt Bé!</b> S'ha validat el correu electrònic. Ja podeu accedir a <a href='https://piworld.es'>https://piworld.es</a></p></center>";
                invalidMsg ="<center><img src='https://" + app.config.hostname+"/assets/img/logo2.png'/><p><b>Ups!</b> No s'ha pogut validar el correu electrònic perquè la base de dades ha fallat.</p></center>";
            } else {
                sql1  = "UPDATE users SET email=''  WHERE id='"+obj.idUser+"'";
                validMsg = "<center><img src='https://" + app.config.hostname+"/assets/img/logo.png'/><p><b>D'acord!</b> S'ha desvinculat el correu electrònic del compte de piWorld.</p></center>";
                invalidMsg ="<center><img src='https://" + app.config.hostname+"/assets/img/logo2.png'/><p><b>Ups!</b> No s'ha pogut desvincular el correu electrònic del compte de piWorld perquè la base de dades ha fallat.</p></center>";
            }
        }
        
        var success = function(d){
            if(d.result.affectedRows>0)
            {
                res.send(validMsg);
            }
            else
            {
                res.send(invalidMsg);
            }
        };
        
        var error = function(){
             res.send("Error updating database");
        };
        
        app.db.query(sql1, success, error)();
};



var changepwd = function(req, res)
{
        //Assume that body is text/plain -> no parsing by middleware has been taken
        var p;
        try{        
            p = JSON.parse(app.decrypt(req.body));
        } catch(Ex){
            res.send({ok:false, msg: "invalid middleware"});
            return;
        }
        var sql1;
        if(p.password){        
            sql1 = "UPDATE users SET password='"+p.password+"', mustChgPwd=0 WHERE id='"+p.idUser+"'";
        } else if(p.passwordParents){        
            sql1 = "UPDATE users SET passwordParents='"+p.passwordParents+"', mustChgPwd=0 WHERE id='"+p.idUser+"'";
        }
        var error = function(){
             res.send({ok: false, msg: 'Error updating database user'});
        };
        
        var success = function(d){
            if(d.result.affectedRows>0)
            {
                res.send({ok: true, msg: 'Password changed.'});
            }
            else
            {
                error();
            }
        };
 
        app.db.query(sql1, success, error)();
};


var linkmail = function(req, res)
{
        var p = req.body;        
        var sql1 = "UPDATE users SET email='"+p.email+"' WHERE id='"+p.idUser+"'";
          
        var error = function(){
             res.send({ok: false, msg: 'Error updating database user'});
        };
        
        var success = function(d){
            if(d.result.affectedRows>0)
            {
                    //Now send instructions email to this email
                    var email = (p.email || "").replace("??", "");
                    if(email){
                    var data = {idUser: p.idUser, email: p.email};                 
                    var hash = new Buffer(JSON.stringify(data)).toString('base64');
                 
                    var acceptLink = 'https://' + app.config.hostname+"/rest/register?a=1&q="+hash;
                    var refuseLink = 'https://' + app.config.hostname+"/rest/register?a=0&q="+hash;
                    
                    var text = "Necessitau verificar la vinculació de piWorld a aquest correu electrònic.\n"+
                                p.fullname+" ha associat l'usuari "+p.username+" de piWorld amb aquest correu electrònic.\n"+
                                "Si estau d'ACORD navegau l'enllaç "+acceptLink+"\n\n"+
                                "Si no sou "+p.fullname+" rebutjeu navegant l'enllaç "+refuseLink;

                    var html = "<h3>Necessitau verificar la vinculació de piWorld a aquest correu electrònic.</h3>"+
                                "<p><em>"+p.fullname+"</em> ha associat l'usuari <em>"+p.username+"</em> de piWorld amb aquest correu electrònic.</p>"+
                                "<p>Si estau d'ACORD cliqueu o navegau l'enllaç <a href='"+acceptLink+"'>"+acceptLink+"</a></p><br>"+
                                "<p>Si no sou "+p.fullname+" rebutjeu clicant o navegau l'enllaç <a href='"+refuseLink+"'>"+refuseLink+"</a></p>";

                    //Send an email
                     var mailOptions = {
                        from: 'piWorld Admin <'+app.config.adminEmail+'>', // sender address
                        to: email, 
                        subject: 'Vinculació de piWorld a correu electrònic.',  
                        text: text,  
                        html: html  
                    };
                    

                    //create reusable transporter object using SMTP transport
                    var transporter = nodemailer.createTransport({
                            service: 'Gmail',
                            auth: {
                                  user: app.config.adminEmail,
                                  pass: app.config.adminEmailPass
                            }
                    });

                    // send mail with defined transport object
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            winston.error(error);
                            res.send({ok: false, msg: "Could not sent email."});
                        } else {
                            winston.log('Message sent: ' + info.response);
                            res.send({ok: true, msg: "Email modified and email sent."});
                        }
                    });
                } else {
                    res.send({ok: false, msg: "Could not sent email."});
                }
               
            }
            else
            {
                error();
            }
        };
 
        app.db.query(sql1, success, error)();
};

/**
 * Forces group or user to change its password on next login
 */
var forcepassword = function(req, res)
{
        var p = req.body;   
        var sql; 
        if(p.idGroup){
            sql = "UPDATE users as u inner join enroll as e on e.`idUser`=u.id  SET u.`mustChgPwd`=1 WHERE e.idGroup="+p.idGroup+" and e.idRole>="+app.config.USER_ROLES.student;
        } else if(p.idUser){
            sql = "UPDATE users SET mustChgPwd=1 WHERE id="+p.idUser;
        } else {
            res.send({ok: false, msg: "Error: Either idUser or idGroup must be passed!"});
            return;
        }             
        
        var ok = function(d){
            res.send({ok: true, msg: d.result.affectedRows+" students will be prompted with new password required on next login."});
        };
        
        var err = function(d){
            res.send({ok: false, msg: "No update has been made"});
        };
        
        
        app.db.query(sql, ok, err)();
};


//{route: route, params: stateParams, username: user.username, schoolId: idSchool, idRole: user.idRole}
var authstateparams = function(req, res){
    var sql;
    var p = req.body;
    if(p.route==='home.ide'){
        if(p.idRole === app.config.USER_ROLES.teacheradmin)
        {
             sql = "SELECT a.id FROM activities as a INNER JOIN users AS u on u.username=a.createdBy WHERE a.id='"+p.params.idActivity+"' AND u.schoolId='"+p.schoolId+"'";
        }
        else{
            sql = "SELECT id FROM activities WHERE createdBy='"+p.username+"' AND id='"+p.params.idActivity+"'";
        }                        
    }
    else if(p.route==='home.students' || p.route==='home.progress'){
        if(!p.params.id){
            res.send(true);
            return;
        }
        //Simplement comprovam si estic enrollat com a alguna modalitat de teacher per poder-ho obrir
        //sql = "SELECT g.id FROM groups AS g INNER JOIN users AS u on u.id=g.idUserCreator WHERE g.id='"+p.params.id+"' AND username='"+p.username+"'";
        sql = "SELECT e.id FROM enroll as e INNER JOIN groups as g on g.id=e.idGroup INNER JOIN users as u on u.id=e.idUser WHERE g.id='"+p.params.id+"' AND u.username='"+p.username+"' AND e.idRole<"+app.config.USER_ROLES.student+"";        
    }
    
    if(sql){
        var success = function(d){
             res.send(d.result.length>0);
        };
        var error = function(d){
             res.send(false);
        };
        app.db.query(sql, success, error)();
    }
    else
    {
        res.send(false);
    }
};

/**
 * 
 * @param {type} req
 * @param {type} res
 * @returns {undefined}This function, allows to analyze in detail the logins performed by a given idUser
 */
var loginList = function(req, res){
    var sql = "select week(login,1) as week, login, if(logout is not null, time_to_sec(timediff(logout,login)), 0) as sec, ip, parents from logins as l where idUser='" +
     req.body.idUser+"' ORDER BY login DESC";
    
    var success = function(d){
        var tt = 0;
        var cc = {};
        d.result.forEach(function(e){
            var p = cc[e.week];
            if(!p){
                var p = {c: 0};
                cc[e.week] = p;
            }
            p.c += 1;            
            tt += e.sec;
        });
        var cc2 = {x:[], y:[]};
        Object.keys(cc).forEach(function(ky){
            try{
                cc2.x.push(parseInt(ky));
                cc2.y.push(cc[ky].c);
            } catch(ex){
                
            }
        });
        delete cc;        
        res.send({totalTime: tt, counts: cc2, logins: d.result});
    };
    
    var error = function(){
        res.send({totalTime: 0, counts: {x:[],  y:[]}, logins:[]});
    };
    
    app.db.query(sql, success, error)();
};

var newslist = function(req, res){
  
    //if badges key present show a news with last granted badges
    var p = req.body;
    
    var sql = "SELECT * FROM news";
    if(p.filter){
        sql += " WHERE expires IS NULL OR expires>=NOW()";
    }
    sql +=  " ORDER BY `order` ASC, id DESC";
    var success = function(d){
        
        if(p.badges){
            var sql2 = "SELECT b.*, u.fullname, s.schoolName FROM badges as b INNER JOIN users as u on u.id=b.idUser INNER JOIN schools as s on s.id=u.schoolId WHERE b.day >= (NOW() - INTERVAL 10 DAY) AND b.type < 200 ORDER BY `day` DESC, b.type ASC, u.fullname ASC LIMIT 4 ";
            var error2 = function(){
                res.send(d.result);
            };
            var success2 = function(d2){                
                if(d2.result.length){
                    var html = "<p>Darreres <b>Insígnies</b> aconseguides:</p><table class='table'>";
                    d2.result.forEach(function(e){
                        html +="<tr>";
                        html +="<th style='width:100px;text-align: right;vertical-align: middle;'><img src='assets/img/badge-"+e.type+".png' height='45'/></th><th style='text-align: center;vertical-align: middle;'><p>"+e.fullname+
                                "</p><p> <small>"+dateformat(e.day, "dd-mm-yyyy")+" ("+e.schoolName+")</small><p></th>";
                        html +="</tr>";
                    });
                    html += "</table>";
                    var badgesNews = {id:-1, html: html, title: "Last Badges", expires: null, order: 0};
                    d.result.unshift(badgesNews);
                }
                res.send(d.result);
            };
            app.db.query(sql2, success2, error2)();    
        } else {
            res.send(d.result);
        }
        
    };
    
    var error = function(){
        res.send([]);
    };
        
    app.db.query(sql, success, error)();    
};

var newsdel = function(req, res){
  
    var p = req.body;
    var sql = "DELETE FROM news WHERE id='"+p.id+"' LIMIT 1";
    var success = function(d){
        res.send({ok: d.result.affectedRows>0});
    };
    
    var error = function(){
        res.send({ok: false});
    };    
    app.db.query(sql, success, error)();    
};

var newsupdate = function(req, res){
    
    
    var p = req.body;

    if(p.expires){
        p.expires = "'"+p.expires.split(".")[0].replace(/T/gi, " ")+"'";
    } else {
        p.expires = "NULL";
    }
    
     
    var title = app.db.pool.escape(p.title);
    var html = app.db.pool.escape(p.html);
    
    var sql;
    if(p.id>0){
        sql = "UPDATE news SET expires="+p.expires+", title="+title+", html="+html+" WHERE id='"+p.id+"'";
                
    } else {
        sql = "INSERT INTO news (title, html, expires) VALUES("+title+","+html+","+p.expires+")";
    }
    var success = function(d){
        res.send({ok: d.result.affectedRows>0});
    };
    
    var error = function(){
        res.send({ok: false});
    };
    
    app.db.query(sql, success, error)();    
};

var newsReorder = function(req, res)
    {
        var p = req.body;
        var pos = 0;
       
        var doAsync = function(b, cb){
            
            var sql = "UPDATE news SET `order`="+b.pos+" WHERE id="+b.id;
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
    
    /*
     * Creates a visualization entry in the database for the book access.
     * Makes sure that creates a virtual logins id if not idLogins is passed
     */
   function createVisualizationEntry(idUser, ip, macbook, idLogins){
        if(idUser<0 || !macbook){
            return;
        }
       
        var ok = function(d){
            var idLogin = d.result.insertId;
            if(idLogin){
                app.db.query("INSERT INTO visualization (idActivity, idAssignment, resource, vscore, vseconds, idLogins) VALUES(0,0,'book:"+macbook+"',10,1,'"+idLogin+"')")();
            }
        };
        
        if(!idLogins){
            app.db.query("INSERT INTO logins (idUser,ip,parents,login) VALUES('"+idUser+"','"+(ip || "")+"',0,NOW())", ok)();
        } else {
            ok({result: {insertId: idLogins}});
        }
   } 
 
 
 /*
  * Valida un llibre atraves del bean userinfo
  */
    function authorizeBook(userinfo, bookId, callback){  
 
        userinfo.id = userinfo.id || userinfo.idUser;
        
        var err = function(){            
            callback && callback(false);            
        };
       
        var ok1 = function(d){
            if(d.result.length){
                var row = d.result[0];
                 if(row.allStudents || (row.allTeachers && userinfo.idRole < app.config.USER_ROLES.student)){
                    callback && callback(true); 
                } else {
                      
                        var ok2 = function(d2){
                            if(d2.result.length>0){
                                createVisualizationEntry(userinfo.id, "", bookId, userinfo.idLogin);
                            }
                            callback && callback(d2.result.length>0);  
                        };
                    
                       var groupSearch = "";
                       if(userinfo.groups){
                          groupSearch = " OR bu.idGroup IN ("+ userinfo.groups+") ";
                       }
                       var sql2 = "SELECT bu.id FROM books_user as bu INNER JOIN books as b on b.id=bu.idbook  where ( bu.idUser='"+userinfo.id+"' "+groupSearch+" ) "+
                        " AND b.id='"+row.id+"' AND (bu.expires IS NULL OR NOW()<=bu.expires)";
                        
                        app.db.query(sql2, ok2, err)();
                }
            } else {
                //This book does not exist in database
                callback && callback(false);     
            }
        };
         
        var sql1 = "SELECT * FROM books WHERE bookCode='"+bookId+"'"; 
        app.db.query(sql1, ok1, err)();
    }
    
    
 
    var authbooks = function(req, res)
    {
        var p = req.body;
         
        var cb = function(d){
            
            res.send({okbook: d});
            
        };
        
        authorizeBook(p, p.bookId, cb);
 
    };


/**
 * All the logic in order to manage books
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
    var authbookmgr = function(req, res){
        var p = req.body;
        
        
        var err = function(){           
            if(p.method.indexOf("/list")>0)
            {
                res.send([]);
            }  else {
                res.send({ok: false});
            }         
        };
       
        var ok= function(d){
            if(p.method.indexOf("/list")>0)
            {
                res.send(d.result);
            } else {
                res.send({ok: d.result.insertId + d.result.affectedRows});
            }
        };
        
        var sql;
        var and = "";
        var prepared;
        if(p.method==="books/list"){
            var conditions="";
            if(p.id){
                conditions = " id='"+p.id+"' ";
                and = " AND ";
            }
            if(p.bookCode){
                conditions = and+" bookCode='"+p.bookCode+"' ";
            }
            
            sql = "SELECT * FROM books "+(conditions? " WHERE ": "") + conditions;
        } else  if(p.method==="books_user/list"){
            var conditions="";
            if(p.idbook){
                conditions = " idbook='"+p.idbook+"' ";
                and = " AND ";
            }
            if(p.idUser){
                conditions = and+" idUser='"+p.idUser+"' ";
            }
            if(p.idGroup){
                conditions = and+" idGroup='"+p.Group+"' ";
            }
            
            sql = "SELECT * FROM books_user "+(conditions? " WHERE ": "") + conditions;
        } else  if(p.method==="books/update"){    
            prepared = p.book; 
            delete prepared.edit;
            if(p.book.id){
                 sql = "UPDATE books SET ? WHERE id='"+p.book.id+"'";
                 delete prepared.id;
            } else {
                 sql = "INSERT INTO books (`bookCode`,`title`,`author`,`url`,`year`,`genre`,`img`,`key`,`allStudents`,`allTeachers`) VALUES ?";
                
            }
             
        } else  if(p.method==="books_user/update"){   
            
            //First get rid of all entries for this idbook
            var ok2 = function(){
                
                  //Create a batch for all entries to be inserted
                  var worker = function(bean, cb){
                        if(!bean.idUser && !bean.idGroup){
                            cb();
                            return;
                        }
                      
                        var iduser = bean.idUser? "'"+bean.idUser+"'" : "NULL";
                        var idgroup = bean.idGroup? "'"+bean.idGroup+"'" : "NULL";
                        //2017-08-23T22:00:00.000Z 
                         if(bean.expires){
                            bean.expires = "'"+bean.expires.split(".")[0].replace(/T/gi, " ")+"'";
                        } else {
                            bean.expires = "NULL";
                        }
                        sql = "INSERT INTO books_user (idbook, idUser, idGroup, expires) VALUES('"+p.idbook+"', "+iduser+", "+idgroup+","+bean.expires+")";
                        app.db.query(sql, cb, cb)();    
                  };
                  
                  async.mapLimit(p.list, 10, worker, function(){
                      res.send({ok: true});
                  });
            };
                    
            app.db.query("DELETE FROM books_user WHERE idbook='"+p.idbook+"'", ok2, err)();   
            
            return;
           
        }
        
        if(prepared){ 
              app.db.queryBatch(sql, prepared, ok, err)();    
        } else {
              app.db.query(sql, ok, err)();     
        }
    };

    // These are public
    app.post('/rest/users/auth', auth);
    app.post('/rest/users/login', login);
    app.post('/rest/users/logout', logout);


    app.post('/rest/center/list', center_list);
    app.post('/rest/center/update', AdminsOnlyMdw, center_update);
    app.post('/rest/center/delete', RootOnlyMdw, center_delete);

    app.post('/rest/auth/prenroll', prenroll);
    app.post('/rest/auth/doenroll', doenroll);
    app.post('/rest/auth/forgotpwd', forgotpwd);
    app.post('/rest/auth/changepwd', changepwd);
    app.post('/rest/auth/forcepassword', forcepassword);
    app.post('/rest/auth/linkmail', linkmail);
    app.post('/rest/auth/books', authbooks);
    app.post('/rest/auth/bookmgr', authbookmgr);
    
    app.post('/rest/auth/loginlist', loginList);    
    app.post('/rest/auth/authstateparams', authstateparams);

    app.post('/rest/news/list', newslist);
    app.post('/rest/news/del', AdminsOnlyMdw, newsdel);
    app.post('/rest/news/update', AdminsOnlyMdw, newsupdate);
    app.post('/rest/news/reorder', newsReorder);

    app.get('/rest/register', registerGet);
};


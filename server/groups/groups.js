
module.exports = function(app)
{

    var winston = require('winston');
    var Remover = require('../misc/remover');
    var exec = require('child_process').exec,
        AdminsAndTeachersMdw = require('../AuthorizedMdw').AdminsAndTeachersMdw;
    
    
    var create = function (req, res)
    {
        var p = req.body;
        var groupName = p.groupLevel + " " + p.groupStudies + " " + p.groupLetter;
        var idUser = p.idUser;
        var gopts = p.gopts || {};

        //Check if this group is already created
        var testSql = "SELECT id FROM groups WHERE groupName='" + groupName + "' AND idSubject='"+p.idSubject+"' AND idUserCreator='" + idUser + "'";

        var sql2 = "INSERT INTO groups (groupName, groupLevel, groupStudies, groupLetter, groupYear, idUserCreator, enrollPassword, idSubject, gopts) " +
                "VALUES('" + groupName + "','" + p.groupLevel + "','" + p.groupStudies + "','" + p.groupLetter +
                "', year(timestampadd(month,-6, NOW()))-2000, '" + idUser + "','" + p.enrollPassword + "', '"+(p.idSubject || 1)+"', '"+JSON.stringify(gopts)+"')";


        var successCallback = function (data)
        {
            var id = data.result.insertId;
            if (id > 0)
            {               
                //When the group is created, then add the creator as enrolled in the group with role teacher
                var sql3 = "INSERT INTO enroll (idGroup, idUser, idRole) VALUES('"+id+"','"+idUser+"','"+app.config.USER_ROLES.teacher+"')";
                var success = function(){
                    //Create the files folder for this group
                    var base = __dirname+"/../../public/files/";
                    exec("mkdir "+base+id, function(error, stdout, stderr){
                        if(error){
                            res.send({ok: false, id: id, msg: "Error creating group's folder"}); 
                            return;
                        }
                        res.send({ok: true, id: id, msg: "OK"}); //" = > i18n("OK-MSG", $lang)." : id=" + $id));
                    });                         
                };
                var error = function(){
                     res.send({ok: false, id: id, msg: "Error creating enroll entry"}); //" = > i18n("OK-MSG", $lang)." : id=" + $id));
                };
                app.db.query(sql3, success, error)();                
            }
            else
            {
                res.send({ok: false, id: id,
                    msg: "Error inserting group"}); //" = > i18n("OK-MSG", $lang)." : id=" + $id));
            }
        };
        
        var rejectCallback = function (err)
        {
            res.send({ok: false, id: 0,
                msg: "This group already exists"}); //" = > i18n("OK-MSG", $lang)." : id=" + $id));

        };
        
        var errorCallback = function (err)
        {
            res.send({ok: false, id: 0,
                msg: "Error inserting group"}); //" = > i18n("OK-MSG", $lang)." : id=" + $id));

        };
        
        app.db.queryIfEmpty(testSql, sql2, successCallback, rejectCallback, errorCallback)();        
       
    };


    var del = function(req, res)
    {
        var p = req.body;               
        var idGroup = p.idGroup || 0;
       
        var success = function(d){
             var base = __dirname+"/../../public/files/";
             exec("rm -fr "+base+idGroup, function(error, stdout, stderr){
                    if(error){
                        res.send({ok: false, msg: "Error deleting group's folder"}); 
                        return;
                    }
                    res.send({ok: true, msg: "OK"});
                });           
            res.send({ok: d.affectedRows>0, msg: 'Group '+idGroup+' has been deleted.'});
        };
    
        var error = function(d){
            res.send({ok: false, msg: 'Error while deleting group '+idGroup+'.'});
        };
        
        Remover.del_group(app.db, idGroup, success, error);
    };
       
       
//List the groups created by a given user idUser
//It is no longer necessary since it will be loaded by user login, check users/auth.js

var list = function(req, res)
{
    var p = req.body;
    
    //console.log(p);
    
    var id = p.idUser;
    var sql;
    if(p.includeEnrolled){
       
        //This query returns a list of all groups in which you are enrolled to in some eidRole
        //Added fields owner, ownerFullname
        
       sql = "SELECT e.id as idEnroll, e.idGroup, e.idUser, e.idRole as eidRole, g.groupName, g.groupStudies, g.groupLevel, g.groupLetter, g.groupYear, g.idUserCreator, "+       
             " g.enrollPassword, g.idSubject, g.currentUnit, g.gopts, s.name, u.username as owner, u.fullname as ownerFullname  FROM enroll as e INNER JOIN groups as g on g.id=e.idGroup INNER JOIN subjects as s ON s.id=g.idSubject "+
             " LEFT JOIN users as u on u.id=g.idUserCreator WHERE e.idUser='"+id+"' AND e.idRole<"+app.config.USER_ROLES.student+" ORDER BY g.groupYear DESC, groupName ASC";
    } else { 
       
       //This query returns a list of all groups created by a teacher with idUser = id
       //Added fields owner, ownerFullname
        
       sql = "SELECT g.id as idGroup, g.groupName, g.idUserCreator, g.groupYear, g.enrollPassword, g.idSubject, g.currentUnit, g.gopts, s.name, u.username as owner, u.fullname as ownerFullname  FROM groups as g INNER JOIN subjects "+
             " as s ON s.id=g.idSubject LEFT JOIN users as u on u.id=g.idUserCreator WHERE idUserCreator='" + id + "' ORDER BY groupName ASC";
    }       
           
    var resolved = function(d){
        d.result.forEach(function(e){
            e.gopts = JSON.parse(e.gopts);
        });
        res.send(d.result);
    };
    var rejected = function(d){
        res.send({});
    };

    app.db.query(sql, resolved, rejected)();
};
     
var listcenter = function(req, res)
{
    var p = req.body;
    //var sql = "select g.id, g.groupName, s.name, u.fullname, g.enrollPassword from groups as g inner join users "+
    //        " as u on u.id=g.idUserCreator inner join subjects as s on s.id=g.idSubject where u.schoolId='"+p.schoolId+"'";
    
    var sql = "select g.id as idGroup, g.groupName, s.name, u.fullname, g.idUserCreator, g.enrollPassword, g.groupYear, e.id as enrolled from groups as g inner join users "+
            " as u on u.id=g.idUserCreator inner join subjects as s on s.id=g.idSubject left join enroll as e on (e.idGroup=g.id and idUser='"+
             p.idUser+"')  where u.schoolId='"+p.schoolId+"' ORDER BY g.groupYear desc, g.groupName asc";
    
    var resolved = function(d){
        res.send(d.result);
    };
    var rejected = function(d){
        res.send({});
    };

    app.db.query(sql, resolved, rejected)();
};     
        
var update = function(req, res)
{
        var p = req.body;
        var id = p.id || p.idGroup || 0;
        //update a new group
        var groupName = p.groupLevel + " " + p.groupStudies + " " + p.groupLetter;
        var idUser = p.idUser;
        var gopts = p.gopts || {};
      
        //Check if the group resulting from modifications is already created
        var testSql = "SELECT id FROM groups WHERE groupName='" + groupName + "' AND idUserCreator='" + idUser + "'";
        
        var testFunc = function(rows){
            var nr = rows.length;
            return nr === 0 || (nr === 1 && rows[0].id === id);
        };
        
        var sql2 = "UPDATE groups SET groupName='" + groupName + "', groupLevel='" +
                p.groupLevel + "', groupStudies='" + p.groupStudies + "', groupLetter='" + p.groupLetter +
                "', enrollPassword='" + p.enrollPassword + "', gopts='"+JSON.stringify(gopts)+"', currentUnit='"+(p.currentUnit || 0)+
                "', idSubject='"+(p.idSubject || 1)+"' WHERE id=" + id;
        
        var resolved = function(d){
            if (d.result.affectedRows)
            {
                res.send({ok: true, id: id,
                        msg:"S'ha actualitzat el nou grup " + groupName + " amb id=" + id});
            }
            else
            {
                res.send({ok: false, id: id,
                        msg: "Hi hagut un problema a l'hora d'actualitzar el grup " + groupName + "."});
            }           
        };
        
        var rejected = function(d){
            res.send({ok:false, id: id, msg: "Ja existeix el grup " + groupName + ". No es pot fer la modificació."});
        };
        
        var error = function(d){
            res.send({ok:false, id: id, msg: "S'ha produït un error :-("});
        };
        
        app.db.queryIf(testSql, testFunc, sql2, resolved, rejected, error)();    
};


var doenroll = function(req, res)
{
        var p = req.body;
        var role = p.eidRole || p.idRole || app.config.USER_ROLES.student;
                
        if(p.id) //Already exists entry, so performs an update of idUser, idGroup, idRole
        {
            var sql = "UPDATE enroll SET idUser='"+p.idUser+"', idGroup='"+p.idGroup+"', idRole='"+role+"' WHERE id='"+p.id+"'";
            var error = function(){
                res.send({ok: false});
            };

            var success = function(d){
                res.send({ok: d.result.affectedRows>0});                
            };

            app.db.query(sql, success, error)();
            
        }
        else{
           
            var test0 = "SELECT g.*, s.name FROM groups as g inner join subjects as s on s.id=g.idSubject WHERE g.id='"+p.idGroup+"' AND g.enrollPassword='"+p.enrollPassword+"'";
            var testSql2 = "SELECT id FROM enroll where idUser='"+p.idUser+"' AND idGroup='"+p.idGroup+"'";
            var sql2 = "INSERT INTO enroll (idUser, idGroup, idRole) VALUES('"+p.idUser+"','"+p.idGroup+"', '"+role+"')";

            var group = {};
            var resolved = function(d){
                var data = {ok: true, msg: "Us heu apuntat al grup.", group: group};
                if (d.result.insertId)
                {
                   data.idEnroll = d.result.insertId;
                }
                res.send(data);
            };


            var error = function(){
                res.send({ok: false, msg: "Error d'accés a la DB"});
            };

            var rejected = function(){
                res.send({ok: false, msg: "Ja estau matriculat a aquest grup!"});
            };

            var success = function(d){

                if(d.result.length===0)
                {
                    res.send({ok: false, msg: "Contrasenya invàlida"});
                }
                else
                {
                    group = d.result[0];
                    group.idGroup = group.id;
                    delete group.id;
                    group.idEnroll = d.result.insertId;
                    group.eidRole = role;
                    
                    app.db.queryIfEmpty(testSql2, sql2, resolved, rejected, error)();
                }
            };


            app.db.query(test0, success, error)();

        }
};

var unenroll = function(req, res)
{
        var p = req.body;
        var sql;
        if(p.id)
        {
            sql = "DELETE FROM enroll WHERE id='"+p.id+"' LIMIT 1";
        }
        else {
            sql = "DELETE FROM enroll WHERE idGroup='"+p.idGroup+"' AND idUser='"+p.idUser+"' LIMIT 1";
        }
 
        var error = function(){
            res.send({ok: false});
        };


        var success = function(d){ 
            res.send({ok: d.result.affectedRows>0});             
        };


        app.db.query(sql, success, error)();
        
};

app.post('/rest/groups/create', AdminsAndTeachersMdw, create);
app.post('/rest/groups/delete', AdminsAndTeachersMdw, del);
app.post('/rest/groups/list', list);
app.post('/rest/groups/listcenter', listcenter);
app.post('/rest/groups/update', AdminsAndTeachersMdw, update);
app.post('/rest/groups/doenroll', doenroll);
app.post('/rest/groups/unenroll', unenroll);

};


module.exports = function(app){
    
    
    //-------------------------------FORUMS
    var listf = function(req, res){
        
        var search = req.body.searchQuery || "";
        var schoolId = req.body.schoolId;
        
        if(schoolId){
            if(search){
                search += " AND ";
            }
            search +=" u.schoolId='"+schoolId+"' ";
        }
        if(search){
            search = " WHERE "+search+" ";
        }
        
        //var sql = "SELECT f.*, u.fullname, u.schoolId from forums as f left join users as u on f.createdBy=u.id "+search+" ORDER BY f.forum";
        var sql = "SELECT f.*, u.fullname, u.schoolId, count(ft.id) as totalThemes from forums as f left join users as u on f.createdBy=u.id left join forums_themes as ft on f.id=ft.idForum "+search+"  GROUP BY f.id ORDER BY f.forum";
        
        var success = function(d){
            d.result.forEach(function(e){                
                try{
                    e.canCreateThemes = JSON.parse(e.canCreateThemes);
                } catch(ex){
                    e.canCreateThemes = {};
                    e.canCreateThemes[app.config.USER_ROLES.teacher] = true;
                    e.canCreateThemes[app.config.USER_ROLES.teacherNonEditing] = true;
                    e.canCreateThemes[app.config.USER_ROLES.student] = false;
                }               
            });
            
            res.send(d.result);
        };
        
        var error = function(d){
            res.send([]);
        };
        
        app.db.query(sql, success, error)();
    };

    var updatef = function(req, res){
        var p = req.body;
        var sql;
        if(p.id){
            sql = "UPDATE forums SET ? WHERE id='"+p.id+"'";
        } else {
            sql = "INSERT INTO forums SET ?";
        }
        
        var perms;
        if(typeof(p.canCreateThemes)==='object'){
            perms = JSON.stringify(p.canCreateThemes || {});
        } else {
            perms = p.canCreateThemes;
        }
        
        var obj = {forum: p.forum || "Noname forum", description: p.description || "", createdBy: p.createdBy || app.config.adminUser, idGroup: p.idGroup || 0, canCreateThemes: perms || ""};
        if(!p.id){
            obj.createdWhen = new Date();
        }
        
        var success = function(d){
            var id = p.id;
            if(!id){
                id = d.result.insertId;
            }
            res.send({ok: true, id: id});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.queryBatch(sql, obj, success, error)();
    };
    
    var deletef = function(req, res){
        var p = req.body;
        var sql0 = "DELETE fte FROM forums_themes_entries as fte INNER JOIN forums_themes as ft ON fte.idForumTheme=ft.id WHERE ft.idForum='"+p.id+"'";
        var sql1 = "DELETE FROM forums_themes WHERE idForum='"+p.id+"'";
        var sql2 = "DELETE FROM forums WHERE id='"+p.id+"'";
        var rows = 0;
        var success = function(d){
            rows += d.result.affectedRows;
        };
        var success2 = function(d){
            rows += d.result.affectedRows;
            res.send({ok: rows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        var q0 = app.db.query(sql0, success, error);
        var q1 = app.db.query(sql1, success, error);
        var q2 = app.db.query(sql2, success2, error);
        q0().then(q1).then(q2);
    };

    //-------------------------------THEMES
    var listt = function(req, res){
        var p = req.body;
        //var sql = "SELECT f.*, u.fullname, u.schoolId from forums_themes as f left join users as u on f.createdBy=u.id WHERE f.idForum='"+p.idForum+"' ORDER BY f.createdWhen, f.theme";
        var sql = "SELECT f.*, u.fullname, u.schoolId, count(fte.id) as totalEntries from forums_themes as f left join users as u on f.createdBy=u.id left join forums_themes_entries as fte on fte.idForumTheme=f.`id` WHERE f.idForum='"
                +p.idForum+"'  group by f.id ORDER BY f.createdWhen, f.theme";
        
        var success = function(d){
             d.result.forEach(function(e){                
                try{
                    e.canCreateEntries = JSON.parse(e.canCreateEntries);
                } catch(ex){
                    e.canCreateEntries = {};
                    e.canCreateEntries[app.config.USER_ROLES.teacher] = true;
                    e.canCreateEntries[app.config.USER_ROLES.teacherNonEditing] = true;
                    e.canCreateEntries[app.config.USER_ROLES.student] = true;
                }               
            });
            res.send(d.result);
        };
        
        var error = function(d){
            res.send([]);
        };
        
        app.db.query(sql, success, error)();
    };

    var updatet = function(req, res){
        var p = req.body;
        var sql;
        if(p.id){
            sql = "UPDATE forums_themes SET ? WHERE id='"+p.id+"'";
        } else {
            sql = "INSERT INTO forums_themes SET ?";
        }
        var perms;
        if(typeof(p.canCreateEntries)==='object'){
            perms = JSON.stringify(p.canCreateEntries || {});
        } else {
            perms = p.canCreateEntries;
        }
        
        var obj = {idForum:  p.idForum || 0, theme: p.theme || "Noname theme", description: p.description || "", createdBy: p.createdBy || app.config.adminUser, canCreateEntries: perms || ""};
        if(!p.id){
            obj.createdWhen = new Date();
        }
        
        var success = function(d){
            var id = p.id;
            if(!id){
                id = d.result.insertId;
            }
            res.send({ok: true, id: id});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.queryBatch(sql, obj, success, error)();
    };
    
    var deletet = function(req, res){
        var p = req.body;
        var sql1 = "DELETE FROM forums_themes_entries WHERE idForumTheme='"+p.id+"'";
        var sql2 = "DELETE FROM forums_themes WHERE id='"+p.id+"'";
        var rows = 0;
        var success = function(d){
            rows += d.result.affectedRows;
        };
        var success2 = function(d){
            rows += d.result.affectedRows;
            res.send({ok: rows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        var q1 = app.db.query(sql1, success, error);
        var q2 = app.db.query(sql2, success2, error);
        
        q1().then(q2);
    };
    
    //-------------------------------ENTRIES (must be arranged in a tree stucture)
    var liste = function(req, res){
        var p = req.body;
        var sql = "SELECT f.*, u.fullname, u.uopts, u.schoolId from forums_themes_entries as f left join users as u on f.createdBy=u.id WHERE f.idForumTheme='"+p.idForumTheme+"' ORDER BY f.createdWhen";
        
        var tree = [];
        
        var recursive = function(tmp, node){
            for(var i=0; i<tmp.length; i++){
                var e = tmp[i];
                if(e.answerTo==node.id){
                    e.nodes = [];
                    tmp.splice(tmp.indexOf(e), 1);
                    i--;
                    recursive(tmp, e);
                    try{
                        e.uopts = JSON.parse(e.uopts);
                    } catch(ex){
                        //
                    }
                    node.nodes.push(e);
                }
            };
        };
        
        var success = function(d){
            var tmp = d.result;            
            //First add all root elements to the tree (those with answerTo = 0)
            for(var i=0; i<tmp.length; i++){
                var e = tmp[i];
                if(e.answerTo==0){
                    e.nodes = [];
                    tmp.splice(tmp.indexOf(e), 1);
                    i--;
                    recursive(tmp, e);
                    try{
                        e.uopts = JSON.parse(e.uopts);
                    } catch(ex){
                        //
                    }
                    tree.push(e);
                }
            };
            res.send(tree);
        };
        
        var error = function(d){
            res.send([]);
        };
        
        app.db.query(sql, success, error)();
    };

    var updatee = function(req, res){
        var p = req.body;
        var sql;
        if(p.id){
            sql = "UPDATE forums_themes_entries SET ? WHERE id='"+p.id+"'";
        } else {
            sql = "INSERT INTO forums_themes_entries SET ?";
        }
        var obj = {idForumTheme: p.idForumTheme || 0, entry: p.entry || "", createdBy: p.createdBy || app.config.adminUser, 
            answerTo: p.answerTo || 0};
        
        if(!p.id){
            obj.createdWhen = new Date();
        }
        
        var success = function(d){
            var id = p.id;
            if(!id){
                id = d.result.insertId;
            }
            res.send({ok: true, id: id});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.queryBatch(sql, obj, success, error)();
    };
    
    var deletee = function(req, res){
        var p = req.body;
        var sql;
        
        if(p.ids && p.ids.length){
            sql = "DELETE FROM forums_themes_entries WHERE id IN ("+p.ids.join(',')+")";
        } else {
            sql = "DELETE FROM forums_themes_entries WHERE id='"+p.id+"'";
        }
    
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.query(sql, success, error)();
    };
    
    
     var visitf = function(req, res){
        var p = req.body;
        var sql;
        
        sql = "UPDATE forums SET visited=visited+1 WHERE id='"+p.id+"'";
       
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.query(sql, success, error)();
    };
    
     var visitt = function(req, res){
        var p = req.body;
        var sql;
        
        sql = "UPDATE forums_themes SET visited=visited+1 WHERE id='"+p.id+"'";         
    
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.query(sql, success, error)();
    };
    
    
     /**
      * idUser és la id de l'emissor
      * 
      * isFor és la id del destinatari
      *       Si no esta especificada = 0 pot esser qualssevol usuari en el grup (mode de xat tradicional)
      * 
      * parents = 0  l'emissor i destinaris son profes o estudiants
      * parents = 1  l'emissor o destinaris son profes o pares
      * 
      * @param {type} req
      * @param {type} res
      * @returns {undefined}
      */
     var chatlist = function(req, res){
        var p = req.body;
        var sql;
        
        var isFor = p.isFor || 0;
        var parents = p.parents || 0;
        var isForQuery = " isFor=" + isFor;
        if (p.xatGroup) {
            isForQuery = " (isFor=0 || isFor=" + isFor+")";
        }
        
        if(p.all){
            //This query selects all chats in group
            sql = "SELECT u.fullname, u.id, u.uopts, c.* FROM chats as c INNER JOIN users as u on c.idUser=u.id WHERE c.idGroup='"+p.idGroup+"' AND "+isForQuery+ " AND parents="+parents;         
        } 
        else if(p.idUser){
            sql = "SELECT c.* FROM chats as c WHERE c.idUser='"+p.idUser+"' AND "+isForQuery+ " AND parents="+parents;   
            if(p.when){
                sql += " AND date(c.when)='"+p.when+"'";
            }
            if(p.idGroup){
                sql += " AND c.idGroup='"+p.idGroup+"'";
            }
            sql += " ORDER BY c.`when` DESC";
        }
        else {
            //Limits the number of entries
            var lim = p.limit || 20;
            sql = "SELECT u.fullname, u.id, u.uopts, c.* FROM chats as c INNER JOIN users as u on c.idUser=u.id WHERE c.idGroup='"+p.idGroup+"' AND "+isForQuery+ " AND parents="+parents+" ORDER BY c.id DESC LIMIT "+lim;         
        }
    
        var success = function(d){
            if(p.idUser){
                res.send(d.result);
            } else {
                //Must return an array of sorted days each day containing an array of entries
                //result = [ {date: xxxx, list: [....]}, .... ]
                var sorted = d.result.sort(function(a, b){ return a.when.getTime()-b.when.getTime();});
                var map = {};
                sorted.forEach(function(d){
                    var key = ("0" + (d.when.getDate())).slice(-2) + '-' +( "0" + (d.when.getMonth() + 1)).slice(-2) + '-' +  d.when.getFullYear();
                    var obj = map[key];
                    if(!obj){
                        obj = {date: key, list: []};
                        map[key] = obj;
                    }
                    try{
                        d.uopts = JSON.parse(d.uopts);
                    } catch(ex){
                        d.uopts = {};
                    }
                    obj.list.push(d);    
                });
                var out = [];
                Object.keys(map).forEach(function(k){
                   out.push(map[k]); 
                });
                res.send(out);
            }
        };
        
        var error = function(d){
            res.send([]);
        };
        
        app.db.query(sql, success, error)();
    };
    
    
    var chatdel = function(req, res){
        var p = req.body;
        var sql = "DELETE FROM chats WHERE id='"+(p.id || -1)+"'";         
        
        var success = function(d){
            res.send({ok: d.result.affectedRows>0});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.query(sql, success, error)();
    };
    
    
    var chatsave = function(req, res){
        var p = req.body;
        var sql, obj;
        if(p.id){
            obj = {msg: p.msg || "", isFor: p.isFor || 0, parents: p.parents || 0};
            if(p.when) {
                obj.when = p.when;
            }
            sql = "UPDATE chats SET ? WHERE id='"+p.id+"'";         
        } else {
            obj = {msg: p.msg || "", idGroup: p.idGroup, idUser: p.idUser, isFor: p.isFor || 0, parents: p.parents || 0};
            if(p.when) {
                 obj.when = p.when;
                 sql = "INSERT INTO chats SET ?"; 
            } else {
                 sql = "INSERT INTO chats SET `when`= NOW(), ?"; 
            }
                      
        } 
        
        var success = function(d){
            var ok;
            if(p.id){
                ok  = d.result.affectedRows>0;
            } else {
                ok  = d.result.insertId>0;
            }
            var id = p.id || d.result.insertId;            
            res.send({ok: d.result.affectedRows>0, id: id});
        };
        
        var error = function(d){
            res.send({ok: false});
        };
        
        app.db.queryBatch(sql, obj, success, error)();
    };
    
    app.post("/rest/forums/list", listf);
    app.post("/rest/forums/update", updatef);
    app.post("/rest/forums/delete", deletef);
    app.post("/rest/forums/visited", visitf);
    
    app.post("/rest/forums/themes/list", listt);
    app.post("/rest/forums/themes/update", updatet);
    app.post("/rest/forums/themes/delete", deletet);
    app.post("/rest/forums/themes/visited", visitt);
    
    app.post("/rest/forums/entries/list", liste);
    app.post("/rest/forums/entries/update", updatee);
    app.post("/rest/forums/entries/delete", deletee);
    
    app.post("/rest/chats/list", chatlist);
    app.post("/rest/chats/delete", chatdel);
    app.post("/rest/chats/save", chatsave);
    
};
module.exports =function(app){

    var async = require('async');
    var xl = require('excel4node'),
    AdminsAndTeachersMdw = require('../AuthorizedMdw').AdminsAndTeachersMdw;

    var pda_list = function(req, res){
        var p = req.body;
          
        var error = function(){
            res.send([]);
        };
        
        var success = function(d){
            res.send(d.result);
        };
        
        var sql;
        if(p.idUser){
           sql = "SELECT pa.*, pag.grade FROM pda_activities as pa INNER JOIN pda_activities_grades as pag ON pag.idActivity=pa.id WHERE pag.idUser='"+p.idUser+"' AND pa.idGroup='"+p.idGroup+"' ";           
        } else {
           sql = "SELECT * FROM pda_activities as pa WHERE pa.idGroup='"+p.idGroup+"' AND pa.idCreator='"+p.idCreator+"' ";
        }
        
        if(p.day && p.day2){
            sql += " AND (pa.dia>='"+p.day+"' AND pa.dia<='"+p.day2+"') ";
        } else if(p.day){
            sql += " AND (pa.dia>='"+p.day+"') ";
        }
        
        if(p.visible != null){
            sql += " AND pa.visible="+p.visible+" "; 
        }
        
        sql += " ORDER BY pa.dia ASC, pa.id ASC, pa.desc ASC";
            
        app.db.query(sql, success, error)();
        
    };


    /**
     * Returns an structure like this
     * [
     *      { user: Object, 21: Object}
     * ]
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    var pda_listall = function(req, res){
        var p = req.body;
          
        var error = function(){
            res.send([]);
        };
        
        var success = function(d){
            
            var tmp = {};
            d.result.forEach(function(e){
               try{
                    e.uopts = JSON.parse(e.uopts); 
               } catch(ex){
                    e.uopts = {};
               }
               tmp[e.id] = {user: e}; 
            });
           
            var sql2 = "SELECT pg.*, pa.trimestre, pa.desc, pa.dia, pa.idCreator, pa.idGroup, pa.weight, pa.category, pa.visible, pa.formula "+
                       " FROM pda_activities_grades as pg INNER JOIN pda_activities as pa ON pa.id=pg.idActivity WHERE pa.idGroup='"+p.idGroup+
                       "' AND pa.idCreator='"+p.idCreator+"'";                
                
            var success2 = function(d2){
                    d2.result.forEach(function(e){
                       var row = tmp[e.idUser]; 
                       if(row){
                           row[e.idActivity+""] = e;   
                       }
                    });
                    var values = Object.keys(tmp).map(function(k){return tmp[k];});
                    res.send(values.sort(function(a,b){return a.user.fullname.localeCompare(b.user.fullname);}));
            };
            app.db.query(sql2, success2, error)();            
        };
        
        var sql = "SELECT u.id, u.username, u.fullname, u.uopts FROM users as u INNER JOIN enroll as e on e.idUser=u.id WHERE e.idGroup='"+p.idGroup+"' AND u.idRole>=200 ";
        if(p.filter){
            sql += " AND "+p.filter;
        }
        sql += " ORDER by u.fullname ASC";
        app.db.query(sql, success, error)();
        
    };


    var pda_listgrades = function(req, res){
        var p = req.body;
          
        var error = function(){
            res.send([]);
        };
        
        var success = function(d){
            var tmp = {};
            d.result.forEach(function(e){
               try{
                    e.uopts = JSON.parse(e.uopts); 
               } catch(ex){
                    e.uopts = {};
               }
               e.grade = {};
               tmp[e.id] = e; 
            });
           
                var sql2 = "SELECT * FROM pda_activities_grades WHERE idActivity='"+p.idActivity+"'";                
                
                var success2 = function(d2){
                    d2.result.forEach(function(e){
                       var user = tmp[e.idUser]; 
                       if(user){
                           user.grade = e;   
                       }
                    });
                    var values = Object.keys(tmp).map(function(k){return tmp[k];});
                    res.send(values.sort(function(a,b){return a.fullname.localeCompare(b.fullname);}));
                };
                app.db.query(sql2, success2, error)();            
        };
        
        var sql = "SELECT u.id, u.username, u.fullname, u.uopts FROM users as u INNER JOIN enroll as e on e.idUser=u.id WHERE e.idGroup='"+p.idGroup+"' AND u.idRole>=200 ";
        if(p.filter){
            sql += " AND "+p.filter;
        }
        sql += " ORDER by u.fullname ASC";
        app.db.query(sql, success, error)();
        
    };



    var pda_save= function(req, res){
        var p = req.body;
          
        var error = function(){
            res.send({ok: false});
        };
        
        var success = function(d){
            if(!p.id){
                p.id = d.result.insertId;
            }
            res.send({ok: p.id>0, id: p.id});
        };
        
        var sql;
        var obj; 
        if(p.id){
            sql = "UPDATE pda_activities SET ? WHERE id='"+p.id+"'";
            obj = p;
        } else {
            sql = "INSERT INTO pda_activities SET ?";
            obj = p;
        }
            
        app.db.queryBatch(sql, obj, success, error)();
        
    };



    var pda_delete = function(req, res){
        var p = req.body;
        
        var error = function(){
            res.send({ok: false});
        };
        
        var total = 0;
        
        var success1 = function(d){
            total = d.result.affectedRows>0;
        };
        
        var success2 = function(d){
            total += d.result.affectedRows;
            res.send({ok: total>0});
        };
        
        var sql1 = "DELETE FROM pda_activities WHERE id='"+p.id+"'";
        var sql2 = "DELETE FROM pda_activities_grades WHERE idActivity='"+p.id+"'";
        
        var q1 = app.db.query(sql1, success1);
        var q2 = app.db.query(sql2, success2, error);
        
        q1().then(q2);
        
    };
   
    
    
    /**
     * Support a list of objects to be saved
     * list = [ {id, idActivity, idUser, grade}, ... ]
     * @param {type} req
     * @param {type} res
     * @returns {undefined}
     */
    
    var workerSaveGrade = function(p, cb) {
        var sql;
        if(p.id){
            sql = "UPDATE pda_activities_grades SET grade='"+p.grade+"' WHERE id='"+p.id+"'";
                
        } else {
            sql = "INSERT INTO pda_activities_grades SET idActivity='"+p.idActivity+"', idUser='"+p.idUser+"', grade='"+p.grade+"'";                            
        }           
        var success = function(d) {
            if(!p.id){
                p.id = d.result.insertId;
            }
            cb(null, {id: p.id, ok: d.result.insertId || d.result.affectedRows});
        };
        var error = function() {
            cb(null, {id: 0, ok: false});
        };
        app.db.query(sql, success, error)();
    };
    
    var pda_savegrade= function(req, res){
        var p = req.body;
        
        if(p.list && Array.isArray(p.list)) {
            async.map(p.list, workerSaveGrade, function(errs, ds){
                 res.send(ds);
            });
            
        } else {
            var cb = function (err, d) {
                res.send(d);
            };
     
            workerSaveGrade(p, cb);
        }

    };

 

    var workerDeleteGrade = function(p, cb) {
        var sql = "DELETE FROM pda_activities_grades WHERE id='"+p.id+"'";                            
           
        var success = function(d) {
            cb(null, {id: p.id, ok: d.result.affectedRows > 0});
        };
        var error = function() {
            cb(null, {id: 0, ok: false});
        };
        app.db.query(sql, success, error)();
    };
    
    var pda_deletegrade= function(req, res){
        var p = req.body;
        
        if(p.list && Array.isArray(p.list)) {
            async.map(p.list, workerDeleteGrade, function(errs, ds){
                 res.send(ds);
            });
            
        } else {
            var cb = function (err, d) {
                res.send(d);
            };
     
            workerDeleteGrade(p, cb);
        }

    };


    var pda_createxls = function(req, res){
        var data = req.body.workbook;
         
        // Create a new instance of a Workbook class
        var wb = new xl.Workbook();
        // Create global styles
        for(var key in data.styles) {
           var style = data.styles[key];
           data.styles[key] = wb.createStyle(style);
        }
        
        // Add Worksheets to the workbook
        data.sheets.forEach( (sheet) => {
            var ws = wb.addWorksheet(sheet.label);
            
//            var cf = sheet.conditionalFormat;
//            if(cf) {
//                if(cf[1].style){
//                    cf[1].style = data.styles[cf[1].style];
//                }
//                console.log('Applying conditional rule', cf);
//                 
//                ws.addConditionalFormattingRule(cf[0], cf[1]);
//               
//            }
            
            for(var key in (sheet.columns || {})) {
                var col = sheet.columns[key];
                if(col.width) {
                    ws.column(key).setWidth(col.width);
                }
            }
            
            sheet.cells.forEach( (ce) => {
                var cell = ws.cell(ce.r, ce.c);
                var type = (ce.t || '').toLowerCase();
                if(type === 'n'){
                    cell = cell.number(ce.v);
                } else if(type === 'b'){
                    cell = cell.bool(ce.v);
                } else if(type === 'f' || ce.f){
                    cell = cell.formula(ce.f);
                } else if(type === 'd'){
                    cell = cell.date(ce.v);
                } else if(type === 'l'){
                    cell = cell.link(ce.v);
                }
                else {
                    cell = cell.string(ce.v);
                }
                
                
                if(ce.s) {
                    var style = data.styles[ce.s];
                    if (style) {
                        cell = cell.style(style);
                    }
                }
            });
        });
        
        wb.write(data.filename, res);      
    };
    
    app.post('/rest/pda/activities/list', pda_list);
    app.post('/rest/pda/activities/listall', pda_listall);
    app.post('/rest/pda/activities/listgrades', pda_listgrades);
    app.post('/rest/pda/activities/save', AdminsAndTeachersMdw, pda_save);
    app.post('/rest/pda/activities/delete', AdminsAndTeachersMdw, pda_delete);
    
    app.post('/rest/pda/activities/savegrade', AdminsAndTeachersMdw, pda_savegrade);
    app.post('/rest/pda/activities/deletegrade', AdminsAndTeachersMdw, pda_deletegrade);
    app.post('/rest/pda/activities/createxls', AdminsAndTeachersMdw, pda_createxls);    
};

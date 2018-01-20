module.exports = function(app)
{
    var https = require('https');
/**
 * finds information for a given video in a given session
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
var vinfo = function vinfo(req, res){    
    var p = req.body;
    var idActivity = p.idActivity;
      
    var r = "NULL";
    if(p.resource){
        r = "'"+p.resource.replace(/'/g, '')+"'";
    }
        
    var error = function(d){
        res.send({id:0, ok: false});
    };
    //ERROR: This query has to be for a given userID
    //var findQuery = "SELECT max(id) as id, max(idLogins) as idLogins, sum(vscore) as vscore, sum(vseconds) as vseconds FROM visualization WHERE idActivity="+idActivity +" AND resource="+r; 
    var findQuery = "SELECT max(v.id) as id, max(v.idLogins) as idLogins, sum(vscore) as vscore, sum(vseconds) as vseconds FROM visualization as v INNER JOIN logins as l ON v.idLogins=l.id WHERE v.idActivity='"+
                idActivity +"' "+ (p.idAssignment? "AND v.idAssignment='"+p.idAssignment+"'": "") +" AND (v.resource="+r+" OR v.resource IS NULL) AND l.idUser='"+p.idUser+"'";   
    //v.resource IS NULL is just to support all visualization entries where resource was not annotated.
        
 
    var success = function(data){
        var dd=data.result[0]; 
        
        if(p.idAssignment){
            //It must also pass whether assignment is "closed" or not
            var query = "SELECT id FROM assignments WHERE id="+p.idAssignment+" AND (fromDate IS NULL OR fromDate<=now()) AND (toDate is NULL OR toDate>=now())";
            app.db.query(query, function(d3){
                var closed = d3.result.length <=0 ;
                res.send({id: dd.id, vscore: dd.vscore, seconds: dd.vseconds, idLogins: dd.idLogins, closed: closed, ok: true});
            }, error)();
                        
        } else {        
            res.send({id: dd.id, vscore: dd.vscore, seconds: dd.vseconds, idLogins: dd.idLogins, closed: false, ok: true});
        }
    };
         
    app.db.query(findQuery, success, error)();
};

/**
 * Lists all entries for a given video for a user or a session ID
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
var vlist = function vlist(req, res){    
    var p = req.body;
    var idActivity = p.idActivity;
      
    var r = "NULL";
    if(p.resource){
        r = "'"+p.resource.replace(/'/g, '')+"'";
    }
        
    var error = function(d){
        res.send([]);
    };
    
    var success = function(data){       
       res.send(data.result);
    };
    
     
    var findQuery = "SELECT v.*, count(vq.id) as nq FROM visualization as v inner join logins as l on l.id=v.idLogins left join visualization_quizz as vq on v.id=vq.idV WHERE v.idActivity="+idActivity +" AND v.resource="+r; 
    if(p.idLogins){
        findQuery += " AND v.idLogins="+p.idLogins;
    } else if(p.idUser) {
        findQuery += " AND l.idUser="+p.idUser;
    }
    findQuery += " GROUP by v.id";
    app.db.query(findQuery, success, error)();
};


/**
 * Loads a list of entries in table visualization_quizz given a idV
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
var vdetail = function vdetail(req, res){    
    var p = req.body;
            
    var error = function(d){
        res.send([]);
    };
    
    var success = function(data){       
       res.send(data.result);
    };
         
    var findQuery = "SELECT * FROM visualization_quizz WHERE idV="+p.idV; 
    app.db.query(findQuery, success, error)();
};




var vscore = function vscore(req, res){
    var p = req.body;
    var idActivity = p.idActivity;
    var idLogin = p.idLogin;
    var value = p.vscore || 0;
    var time = p.vseconds || 0;
     
    var r = "NULL";
    if(p.resource){
        r = "'"+p.resource.replace(/'/g, '')+"'";
    }
     
    var testQuery;
    if(p.id){
        testQuery = "UPDATE visualization SET vscore=vscore+"+value+", vseconds=vseconds+"+time+"  WHERE id='"+p.id+"'";    
    }
    else {
        testQuery = "UPDATE visualization SET vscore=vscore+"+value+", vseconds=vseconds+"+time+"  WHERE idLogins="+idLogin+" AND idActivity="+idActivity +" AND resource="+r;
    }
    var failQuery = "INSERT INTO visualization SET vscore="+value+", vseconds="+time+", idLogins="+idLogin+", idActivity="+idActivity+", idAssignment="+(p.idAssignment || 0)+", resource="+r;
    
    
  
    
    var error = function(d){
        res.send({id:0, ok: false});
    };
    
    var success = function(d){
        if(d.result.affectedRows>0)
        {
            //An Update has been performed. In case p.idV is not defined, load this value
            if(p.id){
                res.send({id: p.id, ok: true});
            }
            else {
                //console.log("Aixo no s'hauria d'executar mai ara!!!");
                //We need the overall score for this video... in this login and previous ones
                var findQuery = "SELECT max(id) as id, sum(vscore) as vscore, sum(vseconds) as vseconds FROM visualization WHERE idActivity="+idActivity +" AND resource="+r; 
                        ////"SELECT * FROM visualization WHERE idLogins="+idLogin+" AND idActivity="+idActivity +" AND resource="+r;                
                app.db.query(findQuery, function(data){var dd=data.result[0]; res.send({id: dd.id, vscore: dd.vscore, seconds: dd.vseconds,  ok: true});}, error)();
            }
        }
        else            
        {
            app.db.query(failQuery, function(data){var id = data.result.insertId; res.send({id: id, ok: id>0});}, error)();
        }        
    };
     
    app.db.query(testQuery, success, error)();
};

/**
 * 
 * @type type //b: {idV: idV, formulation: formulation, answer: answer, rightAnswer: rightAnswer, isValid: isValid}    
 */
var vscore_quizz = function vscore_quizz(req, res){
    var p = req.body;
     
    var query = "INSERT INTO visualization_quizz SET ?";
    
    var error = function(d){
        res.send({id: 0, ok: false});
    };
    
    var success = function(d){        
        var id = d.result.insertId;
        res.send({id: id, ok: id>0}); 
        
        if(p.penalty){
            var sql = "UPDATE visualization SET vscore=vscore";
            sql += p.isValid?"+(":"-(";
            sql += p.penalty+") WHERE id='"+p.idV+"'";   
            app.db.query(sql)();
        }
    };
     
    app.db.queryBatch(query, p, success, error)();
};


/**
 * Requires idActivity and idUser
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */
var vtrace = function(req, res){
    var p = req.body;
     
    var query = "select l.id as idLogin, l.login, v.vscore, v.vseconds, vq.* from visualization as v inner join logins as l on l.id=v.idLogins left join visualization_quizz as vq on vq.idV=v.id where l.idUser='"+
            p.idUser + "' and v.idActivity='"+p.idActivity+"' "+ (p.idAssignment? "AND v.idAssignment='"+p.idAssignment+"'": "") +" order by l.id, v.id, vq.id ";
    
    var error = function(d){
        res.send([]);
    };
    
    var success = function(d){        
        var tmp = {};
        
        d.result.forEach(function(e){
            var row = tmp[e.idLogin];
            if(!row){
                row = {login: e.login, vscore: e.vscore, vseconds: e.vseconds, quizz: []};
                tmp[e.idLogin] = row;
            }
            if(e.formulation){
                row.quizz.push({formulation: e.formulation, answer: e.answer, rightAnswer: e.rightAnswer, score: e.penalty});
            }
        });
        
        //Convert tmp to array
        var array = [];
        Object.keys(tmp).forEach(function(k){
            array.push(tmp[k]);
        });
        
        res.send(array);
    };
     
    app.db.queryBatch(query, p, success, error)();
};


var vimeoConfig = function(req, response){
    var p = req.body;
    var url = 'https://player.vimeo.com/video/' + p.vimeoId + '/config';
    console.log(url);
    https.get(url, function(res) {
        var body = '';
        
        res.on('data', function(chunk){
            console.log("data chunck ", chunk);
            body += chunk;
        });
         

        res.on('end', function(){
            console.log(body);
            var json;
            try{
                json = JSON.parse(body);
            } catch(ex){
                json = {};
            }
            
            response.send(json);
        });                   
    }).on("error", function(e){
  console.log("Got error: " + e.message);
});             
};
   

app.post('/rest/video/vinfo', vinfo);
app.post('/rest/video/vdetail', vdetail);
app.post('/rest/video/vlist', vlist);
app.post('/rest/video/vscore', vscore);
app.post('/rest/video/vquizz', vscore_quizz);
app.post('/rest/video/vtrace', vtrace);
app.post('/rest/video/vimeoconfig', vimeoConfig);
 
};
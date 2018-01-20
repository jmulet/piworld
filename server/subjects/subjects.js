module.exports = function(app)
{  

    var list = function(req, res)
    {
        //var p = req.body;
             
        var sql = "SELECT * FROM subjects ORDER BY id ASC";


        var success = function(d)
        {
            res.send(d.result);        
        };

        var error = function()
        {
            res.send({});
        };
        
        app.db.query(sql, success, error)();
        
    };

    app.post('/rest/subjects/list', list);

};
 
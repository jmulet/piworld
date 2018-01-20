var winston = require('winston'),
          Q = require('q');   

var dbUtils = function (pool)
{
    var api = {pool: pool};
    
    api.QUERY_EMPTYSET = "SELECT 1 FROM DUAL WHERE FALSE";
    
    /* Simple database query executing internal success and errorCallbacks and 
     * returning a promise
     * 
     * You pass the query in queryObj which can be:
     *              string --> "SELECT * FROM users"
     * or a function to access parent queries
     *              function(parentData){ return "SELECT * FROM users WHERE id="+parentData.result[0].id;}
     * successCallback can be a function returning null or a promise
     * errorCallback can be a function returning null or a promise
     **/
     
    api.query = function (queryObj, successCallback, errorCallback) {
        //create a defer promise

        var objFunc = function (parentData)
        {
            parentData = parentData || {};
            var defer = Q.defer();

            var query = queryObj;
            if (typeof (query) === 'function')
            {
                query = queryObj(parentData);
            }

            winston.log('debug', query);
            pool.getConnection(function (err, connection) {
                if (err) {
                    winston.error(err);
                    if (errorCallback) {
                        var r = errorCallback(err);
                        if(r)
                        {
                            r.then(function(nd){defer.reject();});
                        }
                        else
                        {
                            defer.reject();
                        }                            
                    }
                    else
                    {
                        defer.reject();
                    }
                    return;
                }

                connection.query(query, function (err, result, fields) {
                    connection.release();
                    if (err) {
                        winston.error(err);
                        if (errorCallback) {
                            var r = errorCallback(err);
                            if(r)
                            {
                                r.then(function(nd){defer.reject();});
                            }
                            else
                            {
                                defer.reject();
                            } 
                        }
                        else
                        {
                            defer.reject();
                        }
                        return;
                    }

                    if (typeof (result.affectedRows) !== 'undefined')
                    {
                        winston.log('debug', "nup=" + result.affectedRows);
                    }
                    else {
                        winston.log('debug', "rows.length=" + result.length);
                    }

                    parentData.result = result;
                    parentData.fields = fields;
                    if (successCallback) {
                        var r = successCallback(parentData);
                        //successCallback can be a function or a promise
                        if(r)
                        {
                            successCallback(parentData).then(function(nd){
                                defer.resolve(nd);
                            });                            
                        }
                        else
                        {
                            defer.resolve(parentData);
                        }                        
                    }
                    else
                    {
                        defer.resolve(parentData);
                    }
                    
                });
                
            });

            return defer.promise;
        };

        return objFunc;
    };


    //.......
    api.queryBatch = function (queryObj, listOfData, successCallback, errorCallback) {
        //create a defer promise

        var objFunc = function (parentData)
        {
            parentData = parentData || {};
            var defer = Q.defer();

            var query = queryObj;
            if (typeof (query) === 'function')
            {
                query = queryObj(parentData);
            }

            winston.log('debug', query);
            pool.getConnection(function (err, connection) {
                if (err) {
                    winston.error(err);
                    if (errorCallback) {
                        var r = errorCallback(err);
                        if(r)
                        {
                            r.then(function(nd){defer.reject();});
                        }
                        else
                        {
                            defer.reject();
                        }                            
                    }
                    else
                    {
                        defer.reject();
                    }
                    return;
                }

                connection.query(query, [listOfData], function (err, result, fields) {
                    connection.release();
                    if (err) {
                        winston.error(err);
                        if (errorCallback) {
                            var r = errorCallback(err);
                            if(r)
                            {
                                r.then(function(nd){defer.reject();});
                            }
                            else
                            {
                                defer.reject();
                            } 
                        }
                        else
                        {
                            defer.reject();
                        }
                        return;
                    }

                    if (typeof (result.affectedRows) !== 'undefined')
                    {
                        winston.log('debug', "nup=" + result.affectedRows);
                    }
                    else {
                        winston.log('debug', "rows.length=" + result.length);
                    }

                    parentData.result = result;
                    parentData.fields = fields;
                    if (successCallback) {
                        var r = successCallback(parentData);
                        //successCallback can be a function or a promise
                        if(r)
                        {
                            successCallback(parentData).then(function(nd){
                                defer.resolve(nd);
                            });                            
                        }
                        else
                        {
                            defer.resolve(parentData);
                        }                        
                    }
                    else
                    {
                        defer.resolve(parentData);
                    }
                    
                });
                
            });

            return defer.promise;
        };

        return objFunc;
    };


    /* Compound database query executing internal success and errorCallbacks and 
     * returning a promise
     * 
     * Firt executes a testQuery, which is validated or tested against the testFunc
     * if testFunc returns true, then the second query is executed with its corresponding
     * success and errorCallbacks as in the previous method.
     * 
     * You pass the query in queryObj which can be:
     *              string --> "SELECT * FROM users"
     * or a function to access parent queries
     *              function(parentData){ return "SELECT * FROM users WHERE id="+parentData.result[0].id;}
     * successCallback can be a function returning null or a promise: executed if the test is true and the second query succeeds
     * rejectCallback can be a function returning null or a promise: executed if the test is false.
     * errorCallback can be a function returning null or a promise: executed in case of any error
     **/
    api.queryIf = function (testQuery, testFunc, query, successCallback, rejectCallback, errorCallback)
    {

        var objFunc = function (parentData)
        {
            parentData = parentData || {};
            var defer = Q.defer();

            var query1 = testQuery;
            if (typeof (query1) === 'function')
            {
                query1 = testQuery(parentData);
            }

            winston.log('debug', query1);
            pool.getConnection(function (err, connection) {
                if (err) {
                    winston.error(err);
                    if (typeof(errorCallback)==='function') {
                        var r = errorCallback(err);
                        if(r)
                        {
                            r.then(function(nd){defer.reject();});
                        }
                        else
                        {
                            defer.reject();
                        }       
                    }
                    else{
                        defer.reject();
                    }
                    return;
                }

                connection.query(query1, function (err, rows, flds) {
                    if (err) {
                        connection.release();
                        winston.error(err);
                        if (errorCallback) {
                            var r = errorCallback(err);
                            if(r)
                            {
                                r.then(function(nd){defer.reject();});
                            }
                            else
                            {
                                defer.reject();
                            }       
                        }
                        else{
                            defer.reject();
                        }
                        
                        return;
                    }
                    if (typeof (rows.affectedRows) !== 'undefined')
                    {
                        winston.log('debug', "nup=" + rows.affectedRows);
                    }
                    else {
                        winston.log('debug', "rows.length=" + rows.length);
                    }

                    parentData.result = rows;
                    parentData.fields = flds;
                    
                    var query2 = query;
                    if (typeof (query2) === 'function')
                    {
                        query2 = query(parentData);
                    }
            
                    if (testFunc(rows))
                    {
                        //Do now the real query
                        winston.log('debug', query2);
                        connection.query(query2, function (err, result, fields) {
                            connection.release();
                            if (err) {
                                winston.error(err);
                                if (errorCallback) {
                                    var r = errorCallback(err);
                                    if(r)
                                    {
                                        r.then(function(nd){defer.reject();});
                                    }
                                    else
                                    {
                                        defer.reject();
                                    }       
                                }
                                else{
                                    defer.reject();
                                }
                                return;
                            }
                            if (typeof (result.affectedRows) !== 'undefined')
                            {
                                winston.log('debug', "nup=" + result.affectedRows);
                            }
                            else {
                                winston.log('debug', "rows.length=" + result.length);
                            }
                            parentData.result = result;
                            parentData.fields = fields;
                            //final success
                            if (successCallback) {
                                var r = successCallback(parentData);
                                if(r)
                                {
                                    r.then(function(nd){defer.resolve(nd);});
                                }
                                else
                                {
                                    defer.resolve(parentData);
                                }
                            }
                            else
                            {
                                defer.resolve(parentData);
                            }

                        });
                    }
                    else
                    {
                        winston.log('debug', "queryIf condition not satisfied");
                        connection.release();
                        if (rejectCallback) {
                            var r = rejectCallback(rows);
                            if(r)
                            {
                                r.then(function(nd){defer.reject();});
                            }
                            else
                            {
                                defer.reject();
                            }       
                        }
                        else
                        {
                            defer.reject();
                        }
                    }

                });

            });

            return defer.promise;
        };

        return objFunc;
    };

/**
 *  A particular case of queryIf, where the testFunc checks that the testQuery returns an empty set 
 */
    api.queryIfEmpty = function (testQuery, query, successCallback, rejectCallback, errorCallback)
    {
        var test = function (r) {
            return r.length === 0;
        };
        
        return api.queryIf(testQuery, test, query, successCallback,rejectCallback, errorCallback);
    };
/**
 *  A particular case of queryIf, where the testFunc checks that the testQuery returns a non empty set 
 */
    api.queryIfNotEmpty = function (testQuery, query, successCallback, rejectCallback, errorCallback)
    {
        var test = function (r) {
            return r.length > 0;
        };
        
        return api.queryIf(testQuery, test, query, successCallback, rejectCallback, errorCallback);
    };

/**
 * Queue a list of promises
 * @param {type} list
 * @returns {dbUtils.api.queue.q}
 */
    api.queue = function(list)
    {
        if(list.length>1)
        {
            var q = list[0]();
            for(var i=1; i<list.length; i++)
            {
                q = q.then(list[i]);
            }
            return q;
        }
    };


    return api;
  
};

module.exports = dbUtils;


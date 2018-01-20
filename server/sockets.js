
module.exports = function (io, _db) {
    var async = require('async');

    //Hold a map between socketId and user
    var sockets = {};
    var rooms =  {};
    var roomUsers =  {};

    var badWords = ['fuck', 'shit', 'bitch', 'asshole', 'cunt', 'fag', 'fuk', 'fck', 'fcuk', 'assfuck', 'assfucker', 'fucker',
        'burro', 'burra', 'burros', 'burras', 'calientapollas', 'calientapolla', 'capullo', 'capullos', 'cabron', 'cabrones', 'cabrons',
        'cabrón', 'gilipolla', 'gilipollas', 'tonto', 'tonta', 'tontos', 'tontas', 'puta', 'putas', 'putes', 'idiota', 'idiotas', 'idiotes',
        'imbecil', 'imbécil', 'imbeciles', 'imbecils', 'mamon', 'mamona', 'mamones', 'mamons', 'polla', 'pollas', 'polles', 'maricón', 'maricon', 'maricones', 'maricons',
        'cap de fava', 'beneït', 'subnormal', 'subnormals', 'subnormales'
    ];
    var rgx = new RegExp("\\b(" + badWords.join("|") + ")\\b", 'gi');


    function isSwearWord(fieldValue) {
        if (rgx.test(fieldValue)) {
            return true;
        }

        return false;
    }

    /**
     * 
     * @param {type} idUser
     * @returns {ns.getSocketID.key|Writer.getSocketID.key|module.exports.sockets|sockets|angular@call;module.exports.getSocketID.key|Reader.getSocketID.key|window.module.exports.getSocketID.key}Returns the socket ID for a given idUser
     */
    function getSocketID(idUser) {
        //console.log("Try to find "+idUser+" in sockets list");
        if (!idUser) {
            return null;
        }
        for (var key in sockets) {
            var user = sockets[key];
            //console.log(user); 
            if (user && user.id === idUser) {
                return key;
            }
        }
        return null;
    }

    io.on('connection', function (socket) {


        socket.on('addUser', function (user) {
            if (!user) {
                ////console.log("Not user, dismiss");
                return;
            }
            user.lastLogin = Math.floor(new Date().getTime() * 0.001); //in seconds
            sockets[socket.id] = user;


            //console.log("addUser");
            //console.log(sockets);

            //Join this user to all its groups
            (user.groups || []).forEach(function (e) {
                var room = e.idGroup + "/";
                ////console.log(" Joining user to group: "+room);
                socket.join(room);
            });

            //Ok, now emit which clients which are connected in the same schoolId
            ////console.log(user);
            var clients = [];
            for (var key in sockets) {
                var u = sockets[key];
                if (u && u.schoolId === user.schoolId) {
                    clients.push(u);
                }
            }
            //////console.log("sending");
            //////console.log(clients);
            io.sockets.emit("connectedUsers", { users: clients, login: user });
        });


        socket.on('disconnect', function () {
            //////console.log("Disconnected "+socket.id);           
            var user = sockets[socket.id];
            if (!user) {
                return;
            }
            //Logout this user by registering logout time                   
            _db.query("UPDATE logins SET logout=NOW() WHERE id='" + user.idLogin + "'")();

            //                    var room = user.schoolId+"/"+user.groupId;
            //                    socket.leave(room);
            //                    socket.leave(room+"/chat");
            delete sockets[socket.id];

            //Ok, now emit which clients which are connected in the same schoolId
            var clients = [];
            for (var key in sockets) {
                var u = sockets[key];
                if (u && u.schoolId === user.schoolId) {
                    clients.push(u);
                }
            }
            //////console.log("sending");
            //////console.log(clients);
            io.sockets.emit("connectedUsers", { users: clients, logout: user });
        });

        //Send a notication growl like to another user or users
        socket.on('notification', function (data) {
            ////console.log(data);
            data.idUsers.forEach(function (idUser) {
                //find socket in sockets
                for (var key in sockets) {
                    var user = sockets[key];
                    if (user && user.id == idUser) {
                        ////console.log("emit notification to user ");
                        ////console.log(user.id);
                        ////console.log(key);
                        io.sockets.connected[key].emit("notification", { title: data.title || "", msg: data.msg });
                        //break;
                    }
                }

            });
        });


        socket.on('chat-send', function (d) {
            //
            ////console.log("SERVER recieved ");
            ////console.log(d);
            var room = d.idGroup + "/";
            socket.join(room);

            //check for bad words
            if (isSwearWord(d.msg ||  "")) {
                //No publiquis el missatge i envia una notificació a l'emissor que ha estat censurat
                var key = getSocketID(d.idUser);
                if (key) {
                    io.sockets.connected[key].emit("notification", { title: "Missatge censurat" || "", msg: d.msg });
                }
                return;
            }

            //commit data to database
            var sql = "INSERT INTO chats SET `when`=NOW(), ?";
            var obj = { idUser: d.idUser, msg: d.msg, idGroup: d.idGroup, parents: 0, isFor: 0 };

            var success = function (data) {
                //Notify other users in the same idGroup of this new chat
                ////console.log("emitting this");
                d.id = data.result.insertId;
                if (d.id > 0) {
                    io.to(room).emit('chat-recieved', d);
                }
            };

            _db.queryBatch(sql, obj, success)();

        });


        socket.on('chat-refresh', function (d) {
            var room = d.idGroup + "/";
            socket.join(room);
            io.to(room).emit('chat-refresh', d);
        });


        socket.on('group-update', function (d) {
            //
            ////console.log("SERVER recieved group update ");
            ////console.log(d);
            var room = d.idGroup + "/";
            socket.join(room);
            //Notify other users in the same idGroup that the group config has been changed
            io.to(room).emit('group-change', d);
        });

        /**
        
        //Kahoot {kahootID: $scope.kahootID, idActivity: $stateParams.idActivity, idAssignment: $stateParams.idAssignment, teacher: Session.getUser().id}, )
         socket.on("kahoot-ini", function(d){;                        
            var room = "kahoot/"+d.kahootID+"/";            
            socket.join(room);
            //Notify users in group that a kahoot has started
            io.to(d.idGroup+"/").emit("notification", {title: "kahoot "+d.kahootID || "", msg: "Sol.licitud per començar un kahoot"});   
         });
        
        //Kahoot {kahootID: $scope.kahootID, idActivity: $stateParams.idActivity, idAssignment: $stateParams.idAssignment, teacher: Session.getUser().id})
        socket.on("kahoot-join", function(d, acknow){
            //console.log("join ");
            //console.log(d);
            var room = "kahoot/"+d.kahootID+"/";  
            
            //Try to retrieve teacher and check if this kahoot is alive by checking database
            var teacher, idActivity, idAssignment;            
            var sql = "select * from kahoot WHERE id='"+d.kahootID+"'";
            
            var ok = function(data){
                
                if(data.result.length){
                   
                    teacher = data.result[0].idTeacher;
                    idActivity = data.result[0].idActivity;
                    idAssignment = data.result[0].idAssignment;
                    
                    if(data.result[0].end !== null){
                       //socket.emit("kahoot-accept", {accept: false, teacher: teacher, msg: "Kahoot is closed"});
                       acknow( {accept: false, teacher: teacher, msg: "Kahoot is closed"} );
                    } else {
                        
                        //Create an attempt for this student and pass it to master
                        var sql = "INSERT INTO attempts SET attemptStart=NOW(), ?";
                        var objs = {idLogins: d.user.idLogin || 0, idActivity: idActivity || 0, idAssignment: idAssignment || 0, idGroup: 0, idKahoot: d.kahootID};
                        
                        var success = function(sqlD){
                            d.idAttempt = sqlD.result.insertId;
                            
                            //socket.emit("kahoot-accept", {accept: true, teacher: teacher, idAttempt: d.idAttempt, idActivity: idActivity});                        
                            acknow( {accept: true, teacher: teacher, idAttempt: d.idAttempt, idActivity: idActivity} );
                            socket.join(room);
                            var key = getSocketID(teacher);
                            if(key){
                                io.sockets.connected[key].emit("kahoot-joined", d);                  
                            } else {
                                io.to(room).emit("kahoot-joined", d);
                            }                                                
                        };
                        
                        _db.queryBatch(sql, objs, success)();
                        
                    }
                    
                } else {
                    //socket.emit("kahoot-accept", {accept: false, msg: "Kahoot not found"});
                    acknow( {accept: false, msg: "Kahoot not found"} );
                }
            };
            
            var err = function(d){
                //socket.emit("kahoot-accept", {accept: false, teacher: teacher});
                acknow( {accept: false, teacher: teacher, msg: "Unknown error"} );
            };            
            _db.query(sql, ok, err)();
          
        });
        
        socket.on("kahoot-leave", function(d){
             //If normal leave with rating
            if(d.rating){                
                var ok = function(d){
                    if(d.affectedRows<=0){
                        _db.query("INSERT INTO ratings (idUser, idActivity, rate) SET ('"+d.user.id+"','"+d.idActivity+"','"+d.rating+"')")();
                    }
                };
                _db.query("UPDATE ratings SET rate='"+d.rating+"' WHERE idUser='"+d.user.id+"' AND idActivity='"+(d.idActivity || 0)+"'", ok)();
            }
            
            //Close attempt
            if(d.idAttempt){
                _db.query("UPDATE attempts SET attemptEnd=NOW() WHERE id="+d.idAttempt)();
            }
            
            var room = "kahoot/"+d.kahootID+"/";     
            var key = getSocketID(d.teacher);
            if(key){
                io.sockets.connected[key].emit("kahoot-left", d);        
                
            } else {
                io.to(room).emit("kahoot-left", d);
                
            }            
        });
        
         socket.on("kahoot-setend", function(d){
            //console.log("kahoot-setend");
            //console.log(d);
            var key = getSocketID(d.id);
            //console.log(key);
            if(key){
                io.sockets.connected[key].emit("kahoot-goend", {});                  
                //console.log("sended kahoot-goend");
            } else {
                   var room = "kahoot/"+d.kahootID+"/";            
                   //console.log("emitting goend to "+room);
                    io.to(room).emit("kahoot-goend", {});
            }
        });
            
            
        socket.on("kahoot-setsurvey", function(d){
            //console.log("kahoot-setend");
            //console.log(d);
            var key = getSocketID(d.id);
            //console.log(key);
            if(key){
                io.sockets.connected[key].emit("kahoot-gosurvey", {});                  
                //console.log("sended kahoot-goend");
            } else {
                   var room = "kahoot/"+d.kahootID+"/";            
                   //console.log("emitting goend to "+room);
                    io.to(room).emit("kahoot-gosurvey", {});
            }
        });
            
        
        //socket.emit("kahoot-setready", {kahootID: $scope.kahootID});
        socket.on("kahoot-setready", function(d){
            var room = "kahoot/"+d.kahootID+"/";            
            //console.log("emitting setready to "+room);
            io.to(room).emit("kahoot-ready", {});
        });
        
        socket.on("kahoot-setquestion", function(d){
            var room = "kahoot/"+d.kahootID+"/";            
            //console.log("emitting setquestion to "+room);
            io.to(room).emit("kahoot-question", d.question);
        });
        
        socket.on("kahoot-setanswer", function(d){
            var room = "kahoot/"+d.kahootID+"/";           
            var key = getSocketID(d.teacher);
            if(key){
                io.sockets.connected[key].emit("kahoot-answer", d);                  
            } else {
                io.to(room).emit("kahoot-answer", d);
            }    
        });
                  
        socket.on("kahoot-corrections", function(d){
            //console.log("kahoot-corrections problem");             
            //console.log(sockets);
            //console.log(d);
            
            var taskProcess = function(e, callback){
                    
                    //console.log("Processing e ",e);
                    
                    if(!e.idAttempt){
                        callback();
                        return;
                    }
                         *
                         *  Falta segons i categoria
                         *  rightanswer
                         *
                        
                        
//                            e.qdef.question
//                            e.qdef.subquestion
//
//                            e.valid.score --> update attempt entry (replace it or add it?) !!!!!!!!
//                            e.valid.valid --> is correct?
                        
                        var sec = e.seconds || 0;
                        var rightAnswer = e.rightAnswer || '';
                        var category = e.category || 'MISC';
                        var userAnswer = e.userAnswer || "";
                       
                        
                        var sql1 = "INSERT INTO questions SET ?"; 
                        var objs1 = {question: e.qdef.question, seconds: sec, category: category, idAttempt: e.idAttempt};
                        
                        var onError = function(){
                            callback();
                        };

                        var s1 = function(data1){
                            var idQuestion = data1.result.insertId;
                            var sql2 = "INSERT INTO steps SET ?";
                            var objs2 = {step: e.qdef.subquestion, seconds: sec, rightAnswer: rightAnswer, idQuestion: idQuestion};
                            var s2 = function(data2){
                                 var idStep = data2.result.insertId;
                                 var sql3 = "INSERT INTO answers SET ?";
                                 var objs3 = {answer: userAnswer, isCorrect: e.valid.valid?'S':'N', idStep: idStep};
                                 var s3 = function(data3){
                                     var sql4 = "UPDATE attempts SET score=score+"+e.valid.score+" WHERE id="+e.idAttempt;
                                      _db.query(sql4, onError, onError)();
                                     
                                 };
                                 _db.queryBatch(sql3, objs3, s3, onError)();
                            };
                            _db.queryBatch(sql2, objs2, s2, onError)();

                        };
                         _db.queryBatch(sql1, objs1, s1, onError)();
                       
                         
                 
                        for(var key in sockets){
                                var user = sockets[key];
                                if(user && user.id === e.idUser){
                                     console.log("emitting feedback to e.idUser "+ e.idUser+ " "+e.valid);
                                     io.sockets.connected[key].emit("kahoot-feedback", e.valid);
                                     //break; (make sure to send to all connected users, with duplicates
                                }
                        }               
               
            };
            
            async.map(d, taskProcess);
            
        });
        
        socket.on("kahoot-settimeout", function(d){
            //console.log("kahoot-question timeout");
            //console.log(d);
            var room = "kahoot/"+d.kahootID+"/";   
            io.to(room).emit("kahoot-timeout", d); 
        });
        
     **/

    });

};
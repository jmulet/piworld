(function(app, angular){
'use strict';



app.factory('PwTable', ['$q', '$filter', function($q, $filter){
   
    var factory = function(params, datafunc){
        var self = this;
        params.filter = params.filter  || {};
        params.sorting = params.sorting  || [];
        params.classes = params.classes  || {};
        params.maxSize = params.maxSize || 5;
        params.total = 0;        
        params.page = params.page || 1;       
        params.count =  params.count || 10;
        params.counts = params.counts || [10, 20, 30];
        
        this.params = params;
        this.$loading = false;
        
        var mustFilter = function(){
            var hasKey = false;
            for(var ky in self.params.filter){
                if(self.params.filter[ky] && self.params.filter[ky].trim()){
                    hasKey = true;
                }
            };
            return hasKey;
        };
        
        this.sortBy = function(key){
            var tmp = self.params.sorting.map(function(x){
                return x.replace("+","").replace("-","");
            });
            
            var idx = tmp.indexOf(key);
            
            if(idx < 0){
                self.params.sorting.unshift("+"+key);
            } else {
               var v = self.params.sorting[idx];
               var v1 = v.substring(0, 1);
               //Switch from asc -> desc -> none --> asc ...
               if( v1==='+' || (v1!=='+' && v1!=='-')){
                   self.params.sorting[idx] = '-'+key;
               } else {
                    self.params.sorting.splice(idx, 1);
                    self.params.classes[key] = "";
               }
           }
            self.paginate();
        };
        
        var orderBy = function(){                        
            var haskeys = self.params.sorting.length;
            var sortBy;
            if(haskeys){
                sortBy = self.params.sorting;  
                self.params.classes = {};
                jQuery.each(self.params.sorting, function(i, e){
                    var type = "+";
                    if(e.substring(0, 1)==="-"){
                        type = "-";
                    }
                    var ky = e.replace("+", "").replace("-", "");
                    if(type==='-'){
                        self.params.classes[ky] = "glyphicon glyphicon-chevron-down";
                    } else {
                        self.params.classes[ky] = "glyphicon glyphicon-chevron-up";
                    } 
                });
            }
            return sortBy;
        };
        
        
        
        this.setCount = function(count){
            self.params.count = count || 1;
            self.paginate();
        };
        
        this.reload = function(){
            var defer = $q.defer();
            this.$loading = true;
            datafunc(defer, params);
            defer.promise.then(function(data){                
                self.allData = data;      
                self.params.page = 1;
                self.paginate();
                self.$loading = false;
            });
        };
        
        this.paginate = function(){            
             var data = angular.copy(this.allData);
             data =  mustFilter() ? $filter('filter')(data, this.params.filter) : data;
             //Total is set after filtering
             this.params.total = data.length;
             this.pages = Math.ceil(this.params.total / this.params.count);
             var orderby = orderBy();
             data = orderby ? $filter('orderBy')(data, orderby ) : data;            
             data = data.slice((this.params.page - 1) * this.params.count, this.params.page * this.params.count);                
             this.$data = data;
        };
        
        this.reload();
        
    };
   
    return factory;
}]);
/*
 * CacheService
 */
app.factory('MyCacheService', ['$q', '$http', '$interval', function($q, $http, $interval){
    var service = {};
    var defaultExpiration = 300000; //Default 5 min for timecache
    var caches = {};          //static cache
    
    function Cache(key, expirable){
        this.key = key;
        this.expirable = expirable;
        this.cacheData = {};
        this.timer = null;
        if(expirable){
            var self = this;
            var fn = function(){
                for(var ky in self.cacheData){
                    self.cacheData[ky].valid = false;
                }
            };
            if(typeof(this.expirable)!=='number'){
                this.expirable = defaultExpiration;
            }
            if(this.expirable > 0){
                this.timer = $interval(fn, this.expirable);
            }
        }
        
        this.httpCache = function(v, url, params, forceUpdate){
               var defer = $q.defer();
               var self = this;
               if(forceUpdate){
                   delete this.cacheData[v];
               }
               if(this.cacheData[v] && this.cacheData[v].valid){
                   defer.resolve(this.cacheData[v].data);
               } else {                   
                   $http.post('/rest/'+url, params).then(function(r){
                       self.cacheData[v] = {valid: true, data: r.data};
                       defer.resolve(r.data);
                   });
               }
              return defer.promise;  
        };
        
        this.put = function(key, value){
            this.cacheData[key] = value;
        };
        
        this.get = function(key, defaultValue){
            var obj = this.cacheData[key];
            if(!obj && defaultValue){
                this.cacheData[key] = defaultValue;
                obj = this.cacheData[key];
            }
            return obj;
        };
        
        this.destroy = function(){
            this.cacheData = {};
            if(this.timer){
                $interval.cancel(this.timer);
            }
        };
    };
    
    service.getCache = function(key, expirable){
        if(caches[key]){
            return caches[key];
        } else {
            var obj = new Cache(key, expirable);
            caches[key] = obj;
            return obj;
        }
    };
    
    service.destroy = function(key){        
        if(key){
            var obj = caches[key];
            if(obj){
                obj.destroy();
                delete caches[key];
            }
        } else {
            for(var ky in caches){
                service.destroy(ky);
            }
        }
    };
    
    return service;
}]); 

 




/*
 * Store here all persistent data, over page refresh, which is implemented
 * via cookies. Sensible data will be encrypted.
 */
app.service('Session', ['USER_ROLES', 'CONFIG', 'MyCacheService', '$http', '$rootScope',  '$state', '$location', 'AUTH_EVENTS', '$timeout', '$q',
    function(USER_ROLES, CONFIG, MyCacheService, $http, $rootScope,  $state, $location, AUTH_EVENTS, $timeout) {
 
        /***
         ***  Creates a safe io.socket around angular digest cycle
         ***/
        var Socket = function(){
            
                var socketio = null;  //private object

                var createFakeSocket = function(){
                    this.on = function(evt, cb, acknow){console.log("Socket.on "+evt+" is disabled.");};
                    this.emit = function(evt, data, acknow){console.log("Socket.emit "+evt+" is disabled.");};
                };

                //Attach socket to app
                this.connect = function(){    
                    if(!window.io){
                        console.log("Can't find window.io library... creating a fake socket object");               
                        createFakeSocket();
                        return;
                    }

                    try{
                        pw.DEBUG && console.log("socket:: creating new socket with ", CONFIG.SERVERIP);
                        socketio = window.io.connect(CONFIG.SERVERIP, {'forceNew': true, 'force new connection':true});
                    } catch(ex){
                        console.log("socket:: Unable to connect to socket: "+socketio);
                        createFakeSocket();
                    }        
                };

                //wrapper around on and emit methods
                this.on = function(evt, cb, acknow){
                    pw.DEBUG && console.log("socket on:: ", evt);
                    if(!socketio){
                       this.connect();
                    }
                    socketio.on(evt, function(data, acknow){
                        if(cb){
                            $timeout(cb(data));
                        }
                    });
                };

                this.emit = function(evt, data, acknow){
                    if(!socketio){
                       this.connect();
                    }
                    pw.DEBUG && console.log("socket emit:: ", evt, data);
                    socketio.emit(evt, data, function(response){
                        if(acknow){
                            $timeout(acknow(response));
                        }
                    });
                };

                this.disconnect = function(){
                    if(socketio && socketio.disconnect){
                        try{
                            socketio.disconnect();
                            socketio = null;
                        } catch(ex){
                            console.log("Unable to disconnect socket: ", ex);
                        }
                    }
                };
        
            return this;
        };
 
        var socketInstance;
 
        this.roles = USER_ROLES;
        this.assignmentsCache = {};  //Cache to allow interComponent communication; between pwcUnits and pwcQuickSearch
         
        var storage = localStorage;  //or sessionStorage
        var self = this;
        var se = function (evt) {
            if(evt.key==="pwSession"){
                if(evt.oldValue!==null && evt.newValue===null){
                    console.log("Session closed in one tab; propagate to all tabs...");
                    self.logout();
                } else if(evt.oldValue===null && evt.newValue!==null){
                    console.log("Session started in one tab; propagate to all tabs...");
                    
                    $state.go("home");
                }
            } 
        };

        if (window.addEventListener) {
            addEventListener('storage', se);
        }
        else if (window.attachEvent) {
            attachEvent('onstorage', se);
        }
                
	this.create = function(user) {                 
                user.config = user.config || {};
                this.user = user;   //holds current login user                
                this.css = [];      //holds dynamically loaded css in session
               
                if(user.idRole === USER_ROLES.parents){                        
                    this.updateStore();
                }
                this.initialize();
                return user;
	};
        
        var createLink = function(stylePath){                           
                if(document.createStyleSheet)
                {
                    document.createStyleSheet(stylePath);
                }
                else{
                    var link = document.createElement("link");
                    link.type = "text/css";
                    link.rel = "stylesheet";
                    link.href = stylePath;
                    document.getElementsByTagName("head")[0].appendChild(link);
                }
        };
        
        this.recoverStore = function(){
                var val = storage.getItem("pwSession");
                var obj = {};
                if(val){
                    try{
                        var decrypted = pw.decrypt(val);
                        obj = JSON.parse(decrypted);
                        this.user = obj.user || {};
                        this.user.isStore = true;
                        this.css = obj.css || [];
                        $.each(this.css, function(i, cs){
                            createLink(cs);
                        });
                        this.selectedGroup = obj.selectedGroup || {};
                        this.grp = obj.grp || {};
                        this.student = obj.student || {};
                        this.related = obj.related || [];
                    } catch(Ex){}
                }
                return obj;
        };

        this.updateStore = function(){
                //console.log("Update store");
                var obj={
                    user: this.user,
                    css: this.css,
                    selectedGroup: this.selectedgroup,
                    grp: this.grp,
                    student: this.student,
                    related: this.related
                };
                try {
                    var encrypted = pw.encrypt(JSON.stringify(obj));
                    storage.setItem("pwSession", encrypted);
                } catch (Ex) {
                    console.log(Ex);
                }
            };
         
        this.destroy = function() {
                storage.removeItem('pwSession');
                localStorage.removeItem('pwSession');
                this.user = null;
                this.css = null;
                this.grp = null;
                this.selectedgroup = null;
                this.related = null;
                this.student = null;
                socketInstance && socketInstance.disconnect();
                socketInstance = null;
                MyCacheService.destroy();   
                localStorage.removeItem('ngIdle.expiry');
                this.assignmentsCache = {};
                this.destroyed = true;
	};
        
        this.updateUopts = function(){                
                $http.post('/rest/students/updateuopts', this.user.uopts);
                this.updateCookies();
        };
        
        this.getUser = function(){
            return this.user || {};
        };
        
        this.setGroup = function(grp) {
            this.grp = grp;
            this.destroyed = false;
            this.updateStore();
	};
        
        this.getGroup = function() {
            return this.grp || {};
        };
        
        this.setRelatedActivity = function(list){
            this.related = list;
            this.updateStore();
        };
        
        this.getRelatedActivity = function(){
           return this.related || [];
        };
        
        
        this.setCurrentGroup = function(grp) {
            this.selectedgroup = grp;               
            this.updateStore();
	};
        
        this.getCurrentGroup = function() {
            return this.selectedgroup || {};           
	};
        
        this.setStudent = function(student) {
            this.student = student;
            this.updateStore();
	};
        
        this.getStudent = function() {              
            return this.student || {};                              
	};
        
        this.getCss = function(){
            return this.css || []; 
        };
        
        this.addCss = function(stylePath){
            //discard strange paths, empty or not ending with .css
            if(!stylePath || stylePath.trim().length===0 || !stylePath.trim().toLowerCase().endsWith(".css"))
            {
                console.log("Session.addCss: Invalid path "+stylePath);
                return;
            }
            var sheets = this.getCss(); 
            if(sheets && $.inArray(stylePath, sheets)< 0)
            {   
                this.updateStore();
                sheets.push(stylePath);  
                createLink(stylePath);
            } 
        };
        
        this.removeCss = function(stylePath){
            var sheets = this.getCss(); 
            if(sheets)
            {
                var idx = $.inArray(stylePath, sheets);
                if(idx>= 0)
                {
                    this.getCss().splice(idx, 1);               
                    $('link[href=\"'+stylePath+'\"]').prop('disabled', true).remove();
                    this.updateStore();
                }
            }
        };
         
        this.logout = function(){
                var user = this.getUser();
                if(user)
                {
                    if(user.idRole === USER_ROLES.guest){
                           self.destroy();
                           $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
                           $location.path('/login');
                    } else {
                        var doLogout = function(d) {
                            self.destroy();
                            $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
                            $location.path('/login');                               
                        };
                        $http.post('/rest/users/logout', {idLogin: user.idLogin, idUser: user.id}).then(doLogout, doLogout);                            
                    }
                }
                else
                {
                   $location.path('/login');
                }      
        };
    
     this.soundSupported = true;           
        
        //Singleton and lazy initialization
     this.getSocket = function () {
                if(!socketInstance){
                    socketInstance = new Socket();
                    socketInstance.connect();
                }
                return socketInstance;
        };

     pw.Sound.register({'newchat': '/assets/sounds/chat.ogg'});                    
        
    //EVENT INITIALIZATION BASED ON SOCKETS AND BROADCAST
    this.initialize = function(){
        pw.DEBUG && console.log("Session service initialization...");        
    };


    //When initializing the service; make sure it recovers data from Storage
    this.recoverStore();
     
    return this;
}]);


app.service('Modals', [ '$uibModal', '$timeout', function($uibModal, $timeout) {
	
        var lastPwdTyped = new Date().getTime();
        var LATENCY = 120000; //2 min.
        
        this.resetLatency = function(){
            lastPwdTyped = new Date().getTime();
        };
        
        this.sudlg = function(okcb, cancelcb){
            
                var time = new Date().getTime();
                var requirePwd = (time-lastPwdTyped) > LATENCY;
                
                if(requirePwd){
                    var modalInstance = $uibModal.open({
                        templateUrl: 'app/shared/su-dlg.html',
                        controller: ['$scope', 'Auth', function ($scope, Auth) {

                                $scope.cpwd = {text: ""};
                                $scope.invalidpwd = "";
                                var attempts = 0;
                                $timeout( function(){
                                    jQuery('#su-dlg').focus();
                                });

                                $scope.ok = function () {
                                        Auth.checkPassword($scope.cpwd.text).then(function (d){
                                            if (d.ok)
                                            {
                                                lastPwdTyped = time;
                                                modalInstance.close();
                                            }
                                            else
                                            {
                                                $scope.invalidpwd = 'Invalid password';
                                                attempts += 1;
                                                if(attempts > 3){
                                                    modalInstance.dismiss();
                                                }
                                            }
                                        });
                                };

                                $scope.cancel = function () {
                                    modalInstance.dismiss();
                                };

                            }],
                        size: 'md'
                    });

                    modalInstance.result.then(function() {
                        okcb && okcb();
                    }, function () {
                        cancelcb && cancelcb();
                    });
                
                } else {
                   lastPwdTyped = time;
                    okcb && okcb();
                    
                }
        };
        
        this.notificationdlg = function(title, msg, okcb, opts){
            
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/notification-dlg.html',
                    controller: ['$scope', function ($scope) {
                            $scope.ok = function () {
                                modalInstance.close();
                            }; 
                            $scope.title = title;
                            $scope.msg = msg;
                        }],
                    size: (opts? (opts.size || 'md') : 'md')
                });

                modalInstance.result.then(function() {
                    okcb && okcb();
                }, function () {
                    okcb && okcb();
                });

                return modalInstance;
        };
        
        this.inputdlg = function(title, msg, inivalue, okcb, cancelcb, opts){
            
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/input-dlg.html',
                    controller: ['$scope', function ($scope) {
                            
                             $timeout( function(){
                                    jQuery('#input-dlg').focus();
                                });
                            
                            $scope.ok = function () {
                                modalInstance.close($scope.model.text);
                            };
                            $scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            $scope.title = title;
                            $scope.msg = msg;
                            $scope.model = {text: inivalue};
                            $scope.typetextarea = (opts? (opts.type==='textarea') : false);                            
                        }],
                    size: (opts? (opts.size || 'md') : 'md')
                });

                modalInstance.result.then(function(value) {
                    okcb && okcb(value);
                }, function () {
                    cancelcb && cancelcb();
                });

                return modalInstance;
            };
            
            
            
        this.confirmdlg = function(title, msg, okcb, cancelcb, opts, rejectcb){
            
                 var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/confirm-dlg.html',
                    controller: ['$scope', function ($scope) {
                            $scope.ok = function () {
                                modalInstance.close();
                            };
                            $scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            $scope.reject = function () {
                                modalInstance.dismiss(-1);
                            };
                            $scope.title = title;
                            $scope.msg = msg;
                            $scope.rejection = 'N';
                            if(rejectcb && typeof(rejectcb)==="function"){
                                $scope.rejection = 'Y';
                            }
                        }],
                    size: (opts ? (opts.size || 'md') : 'md')
                });

                modalInstance.result.then(function() {
                    okcb && okcb();
                }, function(id) {
                    if(id===-1){
                        rejectcb && rejectcb();
                    } else{
                        cancelcb && cancelcb();
                    }
                });
                
                return modalInstance;
            };
            
            
        this.confirmdlgpwd = function(title, msg, okcb, cancelcb, opts){
            
                var time = new Date().getTime();
                var requirePwd = (time-lastPwdTyped) > LATENCY;
                if(!requirePwd){
                    lastPwdTyped = time;
                }
            
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/confirm-dlg-pwd.html',
                    controller: ['$scope', 'Auth', function ($scope, Auth) {

                            $timeout( function(){
                                    jQuery('#confirm-input-pwd').focus();
                            });
                             
                            $scope.cpwd = {text: ""};
                            $scope.invalidpwd = "";
                            $scope.title = title;
                            $scope.msg = msg;
                            $scope.requirePwd = requirePwd;
                            var attempts = 0;

                            $scope.ok = function () {
                                if(requirePwd){
                                    Auth.checkPassword($scope.cpwd.text).then(function (d) {
                                        if (d.ok)
                                        {
                                            lastPwdTyped = time;
                                            modalInstance.close();
                                        }
                                        else
                                        {
                                            $scope.invalidpwd = 'Invalid password';
                                            attempts += 1;
                                            if(attempts > 3){
                                                modalInstance.dismiss();
                                            }
                                        }
                                    });
                                } else {
                                    modalInstance.close(true);
                                }
                            };

                            $scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            
                        }],
                    size: (opts ? (opts.size || 'md') : 'md')
                });

                modalInstance.result.then(function() {
                    okcb && okcb();
                }, function () {
                    cancelcb && cancelcb();
                });
                
                return modalInstance;
            };
                
        return this;
    }
]);



app.factory('Auth', [ '$http', '$rootScope', '$q', 'Session', 'AUTH_EVENTS', '$translate', 'USER_ROLES',
function($http, $rootScope, $q, Session, AUTH_EVENTS, $translate, USER_ROLES) {
	var authService = {};
	 
        authService.Session = Session;
         
        //Create a guest user
        authService.guest = function(){
             var defer = $q.defer();
             var userInfo = {id: -1, idRole: USER_ROLES.guest, fullname: 'Guest user', groups: [], uopts:{postcomments: false}};
                //Show subjects as groups
                $http.post('/rest/subjects/list').then(function(r){                         
                    jQuery.each(r.data, function(indx, e){
                        userInfo.groups.push({id:0, groupName:e.name, idSubject: e.id, gopts: {postcomments: true, allowenroll: false}});
                    });                    
                    Session.create(userInfo);
                    defer.resolve(userInfo);
                });
                
             return defer.promise;             
        };
         
	//the login function
	 authService.login = function(userData, success, error) {
		    
                var post = $http({
                            method: 'POST',
                            url: '/rest/users/login',
                            data: pw.encrypt(JSON.stringify(userData)),
                            headers: {
                                'Content-Type': 'text/plain;charset=UTF-8'
                            }}
                            ).then(function(response) {
                  
                var data = response.data;
                  
                if(data.ok)
                {                    
                    var userInfo = JSON.parse(pw.decrypt(data.user_info));
                    
                    if(userData.parents){
                        userInfo.idRole = USER_ROLES.parents;
                    }
                    Session.create(userInfo);
                    
                    //Passa a l'idioma que estableix el centre per defecte
                    if(userInfo.uopts && userInfo.uopts.lang){
                        $translate.use(userInfo.upots.lang);
                    };
                   
                    $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                    success && success(userInfo);			 
                }
                else
                {
                    $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
		    error && error(data.msg);
                }
                    
		});
		return post;
	};

	//check if the user is authenticated: Now returns a promise because
        //it requires checking the sessionID
	authService.isAuthenticated = function() {
                var defer = $q.defer();
                var user = Session.getUser();
                
		if(user==null || user.cfp == null || user.mustChgPwd){
                    
                    defer.resolve(false);
                    
                } else if(user.isStore){
                    
                    //Logins based on client fingerprint                    
                     var user_encrypted = pw.encrypt(JSON.stringify({idUser: user.id, cfp: user.cfp, idLogin: user.idLogin}));
                     $http({
                            method: 'POST',
                            url: '/rest/users/auth',
                            data: user_encrypted,
                            headers: {
                                'Content-Type': 'text/plain;charset=UTF-8'
                            }}
                            ).then(function(r){
                         if(!r.data.ok){
                             console.log("The current session is not valid ... loging out!", r.data);
                             //Data in Storage is wrong... delete
                             localStorage.removeItem("pwSession");
                             sessionStorage.removeItem("pwSession");
                         } else {
                             //Prevent for future checks
                             user.isStore = false;
                         }
                         defer.resolve(r.data.ok);
                     });
                     
                } else {
                    
                    defer.resolve(true);
                    
                }
                return defer.promise;
	};
	
	//check if the user is authorized to access the next route in terms of ROLES
	//this function can be also used on element level
	//e.g. <p ng-if="isAuthorized(authorizedRoles)">show this only to admins</p>
	authService.isAuthorized = function(authorizedRoles) {
            
            if (!angular.isArray(authorizedRoles)) {
                    authorizedRoles = [authorizedRoles];
	    }
                        
            var user = Session.getUser();
            if(!user)
            {
                user = {idRole: USER_ROLES.guest};
            }
            pw.DEBUG && console.log("isAutorized", user, authorizedRoles);
	    return authorizedRoles.indexOf(user.idRole) !== -1;
	};
        
        /**
         * Check if a given user is authorized to access next route in terms of STATEPARAMS
         * 
         * @returns {Promise}
         */
        authService.authStateParams = function(route, stateParams) {
                var user = Session.getUser();
                var defer = $q.defer();

                if (user && user.idRole === USER_ROLES.admin) {
                    defer.resolve(true);
                }
                else if (user) {
                    $http.post('/rest/auth/authstateparams', {route: route, params: stateParams, username: user.username, idRole: user.idRole, schoolId: user.schoolId}).then(
                            function (r) {
                                defer.resolve(r.data);
                            }
                    );

                } else
                {
                    defer.resolve(false);
                }

                return defer.promise;            
	};
	
        
        authService.checkPassword = function(pwd){
            var user = Session.getUser();
            var defer = $q.defer();
            
            if(!user)
            {
                defer.resolve({ok: false});
            }
            var obj = {idUser: user.id};
            if(user.idRole===USER_ROLES.parents){
                obj.passwordParents = pwd;
            } else {
                obj.password = pwd;
            }
            var user_encrypted = pw.encrypt(JSON.stringify(obj));
            $http({
                    method: 'POST',
                    url: '/rest/users/auth',
                    data: user_encrypted,
                    headers: {
                        'Content-Type': 'text/plain;charset=UTF-8'
                    
                    }}).then(
                        function(r) {
                            defer.resolve(r.data);
            });
            
            return defer.promise;
        };
        
	//log out the user and broadcast the logoutSuccess event
	authService.logout = Session.logout;
        
	return authService;
} ]);
 
 
}(window.pw.app, angular)); 
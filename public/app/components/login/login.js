/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
(function(app, angular){
'use strict';

app.controller('LoginController', [ '$scope', '$rootScope', '$state', 'growl', '$http', 
    '$translate', 'Auth', 'USER_ROLES', 'Modals',  '$uibModal', '$location',
function($scope, $rootScope, $state, growl, $http, $translate, Auth, USER_ROLES, 
    Modals, $uibModal, $location) {
        $scope.version = window.pw.PW_VERSION;
        $scope.lang = navigatorLang() || 'ca';
        if($scope.lang.indexOf("-")){
            $scope.lang = $scope.lang.substring(0, $scope.lang.indexOf("-"));
        }
        if(['ca','es','en'].indexOf($scope.lang)<0){
            $scope.lang = "es";
        }
        var clearStoragePressed;
        $scope.isMobile = window.pw.isMobile() && localStorage;
       
        $translate.use($scope.lang);
	$scope.credentials = {username: "", password: "", parents: false};
        if($scope.isMobile){                
            var pwMobile = localStorage.getItem("pwMobile");
            if(pwMobile){
                try{
                    var obj = JSON.parse(pw.decrypt(pwMobile));
                    $scope.credentials.username = obj.username || "";   
                    $scope.credentials.password = obj.password || "";
                } catch(Ex){}
            }
           
        }
        $scope.beanOpts = {canAdd: true, canDel: true, readonly: {str: true, complex: {im: {alpha: true}}}};
        
	$scope.error = "";
        $scope.hideAlert = true;
        $scope.enroll = {id:"", password:"", name: "", surname:"", email: "", phone: "", upassword:"", urepassword:""};
        $scope.showRegistrationForm = false;
        $scope.registrationCenter = {};
        $scope.guestSession = {is: false, gsClosed: false};
         
        
        $scope.slides = [];
        
        $scope.go = function(a,b) {
            $scope.username=a;
            $scope.password=b;
            $scope.parents=false;
            $scope.login();
        };
  
        $scope.changeLanguage = function (langKey) {
            $scope.lang = langKey;
            //Auth.Session.setLang(langKey);  
            $translate.use(langKey);
            $rootScope.$broadcast("changeLang", langKey);
        };
  
  
        var changePwd = function(){
                var amParent = $scope.user.idRole===USER_ROLES.parents;
                
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/components/home/changepwd-dlg.html',
                    controller: ['$scope', function (scope) {

                            scope.pwd = "";
                            scope.newpwd = "";
                            scope.newpwd2 = "";
                            scope.username = $scope.user.username;
                            scope.hideoldpwd = true;
                            
                            scope.ok = function () {
                                
                                if (scope.newpwd.trim().length < 6)
                                {
                                    growl.error("La longitud mínima de la contrasenya són 6 caràcters.");
                                    return;
                                }
                                else
                                {
                                    if (scope.newpwd.trim() === $scope.user.email.trim()) {
                                        growl.error("La constrasenya ha d'esser diferent que el correu electrònic");
                                        return;
                                    }
                                    var re = /[0-9]/;
                                    if (!re.test(scope.newpwd)) {
                                        growl.error("La constrasenya ha de contenir almenys un nombre (0-9)!");
                                        return;
                                    }
                                    re = /[a-z]/;
                                    if (!re.test(scope.newpwd)) {
                                        growl.error("La contrasenya ha de contenir almenys una lletra minúscula (a-z)!");
                                        return;
                                    }
                                }
                                if (scope.newpwd !== scope.newpwd2)
                                {
                                    growl.error("Les contrasenyes no coincideixen.");
                                    return;
                                }
                                
                                modalInstance.close(scope.newpwd);
                                    
                            };
                            scope.cancel = function () {
                                modalInstance.dismiss();
                            };                         

                        }],
                    size: 'md'
                });

                modalInstance.result.then(function(password) {
                    var obj = {idUser: $scope.user.id};
                    if(amParent){
                        obj.passwordParents = password; 
                    } else {
                        obj.password = password; 
                    }
                                            
                    $http({
                      method: "post",
                      url: "/rest/auth/changepwd",
                      data: pw.encrypt(JSON.stringify(obj)),
                      headers: {
                        'Content-Type': 'text/plain;charset=UTF-8'
                      }
                    }).then(function (r) {
                        if (r.data.ok) {
                            Modals.notificationdlg("Nova contrasenya", "S'ha canviat satisfactòriament la contrasenya"+(amParent?" d'accés família.":"."));
                            statego();
                            $scope.user.mustChgPwd = 0;
                        } else {
                            growl.warning("Ho sentim però, no s'ha pogut canviar la contrasenya.");
                            $scope.loading = false;
                        }
                    });
                                    
                }, function(){
                    //err
                    $scope.loading = false;
                    
                });
            };
         
        function statego(){
            var cachedRouteTo = localStorage.getItem("cachedRouteTo");
           //console.log("stagego function called in login ", lss);
            if(cachedRouteTo){
                var s = JSON.parse(cachedRouteTo);
                $state.go(s.name, s.params);
                ///console.log("going to cached route and destroying cached info ", cachedRouteTo);
                localStorage.removeItem("cachedRouteTo");
            } else {
                
                if($scope.user.idRole === USER_ROLES.parents){
                    console.log("going to home parents");
                    $state.go('home.parents');
                } else {
                    console.log("going to home");
                    $state.go('home');
                }
            }
        }
         
	//Performs the login function, by sending a request to the server with the Auth service
	$scope.login = function() {
		$scope.error = "";
                $scope.hideAlert = true;
                $scope.loading = true;
		Auth.login($scope.credentials, function(user) {
                         
                        $scope.user = user;
                        
                        console.log(user); 
                        if(user.idRole === USER_ROLES.guest) {
                            $state.go('home.activitysearch');
                            return;
                        }
                         
                        Modals.resetLatency();
                        
                        if($scope.credentials.username!=="root" && $scope.isMobile && !clearStoragePressed){
                           //Desa els parametres dins del navegador
                           localStorage.setItem("pwMobile", pw.encrypt(JSON.stringify($scope.credentials)));
                        }
                    
			//success function
                        if(user.language)
                        {
                            $translate.use(user.language);
                        } 
                        if(user.idRole === USER_ROLES.parents && user.uopts.parentsMailLang){
                            $translate.use(user.uopts.parentsMailLang);
                        }
                        jQuery("#bowser-alert").hide(100);
                        
                        
                        if(user.mustChgPwd  && user.idRole!==USER_ROLES.parents){     
                            
                            $scope.loading = false;
                            changePwd();           
                            
                        } else {
    
                            if(user.config.requireEmail && (user.idRole!==USER_ROLES.admin && !user.email) && user.idRole!==USER_ROLES.parents){
                            
                                    var modalInstance = $uibModal.open({
                                        templateUrl: 'app/components/login/linkmail.html',
                                        controller: ['$scope', '$timeout', function (scope, $timeout) {

                                                scope.ok = function () {
                                                    //Verify valid mail structure
                                                    if(!scope.email || !pw.testEmail(scope.email)){
                                                        scope.err = true;
                                                        return;
                                                    }
                                                    modalInstance.close(scope.email);
                                                }; 
                                                scope.email = "";   
                                                scope.username = user.username;
                                                
                                                $timeout(function(){jQuery("#emailbox").focus();});
                                            }],
                                        size: 'md'
                                    });

                                    modalInstance.result.then(function(mail) {
                                        statego();
                                        if(mail){                                            
                                            $http.post("/rest/auth/linkmail", {idUser: $scope.user.id, username: $scope.user.username, fullname: $scope.user.fullname, email: "??"+mail}).then(function (r) {                                                    
                                                    if(r.data.ok){
                                                        growl.notify("Comproveu el vostre correu electrònic i seguiu les instruccions per acabar el procés.", {title:"Correu vinculat: "+mail, ttl: -1});
                                                    } else {
                                                        growl.error(r.data.msg);
                                                        $scope.loading = false;
                                                        return;
                                                    }
                                            });
                                        }
                                    }, function(){
                                        $scope.loading = false;
                                        return;
                                    });
                            } else if(user.email.substring(0,2)==="??"){
                                 growl.notify("Comproveu el vostre correu electrònic i seguiu les instruccions per acabar el procés.", {title:"Correu vinculat: "+user.email.substring(2), ttl: -1});
                                 statego();
                            } else {
                                 statego();
                            }
                            
                        }
                        
		}, function(err) {
                        console.log(err);
                        $scope.credentials.password = "";
			$scope.error = err;
                        $scope.hideAlert = false;
                        $scope.loading = false;
		});
	};
        
        /*
        $scope.guest = function() {
            $scope.error = "";
            $scope.hideAlert = true;
            $scope.credentials.password = "";
            $scope.credentials.username = "";
            $scope.loading = false;
            
            Auth.guest().then(function(user){                                   
                $scope.selectedGroup = user.groups[0];  
                Auth.Session.setCurrentGroup($scope.selectedGroup);
                $scope.guestSession = {is: true, gsClosed: false};               
                var lss = localStorage.getItem("cachedRouteTo");
                if(lss){
                    var cachedRouteTo = JSON.parse(lss);
                     $state.go(cachedRouteTo.name, cachedRouteTo.params);
                    localStorage.removeItem("cachedRouteTo");
                } else {
                     $state.go('home.activitysearch');
                }    
            });                
	};
         */

         $scope.guest = function() {
             $scope.credentials.username = "guest";
             $scope.credentials.password = "guest18";
             $scope.login();
         };
                 
        $scope.goLogin = function() {
                $scope.error = "";
                $scope.hideAlert = true;
                $scope.guestSession = {is: false, gsClosed: true};
                $state.go('login');     
	};
        
        $scope.prenroll = function()
        {
            $http.post("/rest/auth/prenroll", {enroll: $scope.enroll}).then(function(r){
                var data = r.data;
                if(data.ok)
                {
                    $scope.showRegistrationForm = true;
                    $scope.registrationCenter = data;                    
                }
                else
                {
                    $scope.enroll.id = "";
                    growl.error("Les dades del centre són incorrectes o bé no accepta inscripcions. Consulteu al professor responsable.");
                }
            });
           
        };
	
        
        $scope.cancel_enroll = function(){
            $scope.enroll = {id:"", password:"", name: "", surname:"", email: "", upassword:"", urepassword:""};
            $scope.showRegistrationForm = false;
        };
        
        $scope.do_enroll = function(){
            
            //Primer fa una validació del formulari
            if(!$scope.enroll.name.trim())
            {
                growl.error("Cal que escriviu un nom.");
                return;
            }
            if(!$scope.enroll.surname.trim())
            {
                growl.error("Cal que escriviu els llinatges.");
                return;
            }
            if(!$scope.enroll.email.trim() || $scope.enroll.email.indexOf("@")<0)
            {
                growl.error("Cal que escriviu un correu electrònic correcte.");
                return;
            }
            if(!$scope.enroll.phone.trim())
            {
                growl.error("Cal que escriviu un codi de recuperació de contrasenya.");
                return;
            }
            if($scope.enroll.upassword.trim().length<6)
            {
                growl.error("La longitud mínima de la contrasenya són 6 caràcters.");
                return;
            }
            else
            {
                 if($scope.enroll.upassword.trim() === $scope.enroll.email.trim()) {
                   growl.error("La constrasenya ha d'esser diferent que el correu electrònic");
                   return;
                 }
                 var re = /[0-9]/;
                 if(!re.test($scope.enroll.upassword)) {
                   growl.error("La constrasenya ha de contenir almenys un nombre (0-9)!");
                   return;
                 }
                 re = /[a-z]/;
                 if(!re.test($scope.enroll.upassword)) {
                   growl.error("La contrasenya ha de contenir almenys una lletra minúscula (a-z)!");
                   return;
                 }                 
            }
            if($scope.enroll.upassword!==$scope.enroll.urepassword)
            {
                growl.error("Les contrasenyes no coincideixen.");
                return;
            }
            
            var capitalize = function(str){
 
                    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});

            };
            
            $scope.enroll.email = $scope.enroll.email.toLowerCase().trim();
            $scope.enroll.name = capitalize($scope.enroll.name).trim();
            $scope.enroll.surname = capitalize($scope.enroll.surname).trim();
            $scope.enroll.idRole = USER_ROLES.student;
            $scope.enroll.schoolId = $scope.registrationCenter.schoolId;
            
            $http.post("/rest/auth/doenroll", {enroll: $scope.enroll}).then(function(r){
                var data = r.data;
                if(data.ok)
                {
                    $scope.enroll = {id:"", password:"", name: "", surname:"", email: "", phone: "", upassword:"", urepassword:""};
                    Modals.notificationdlg("","Comproveu el vostre correu electrònic i seguiu les instruccions per completar la inscripció. Teniu 24 h per fer-ho. Gràcies");
                    $scope.showRegistrationForm = false;
                    
                }
                else
                {
                     growl.error("S'ha produit un error. Possiblement un usuari amb el mateix email ja estigui registrat.");
                }
            });
        };
	// if a session exists for current user (page was refreshed)
	// log him in again
	//if ($window.sessionStorage && $window.sessionStorage["userInfo"]) {
	//	var credentials = JSON.parse($window.sessionStorage["userInfo"]);
	//	$scope.login(credentials);
	//}
        
        $scope.forgotPassword = function(){
            
            var modalInstance = $uibModal.open({
                    templateUrl: 'app/components/login/forgotpwd-dlg.html',
                    controller: ['$scope', function (scope) {
                            scope.ok = function () {
                                if (scope.bean.email && scope.bean.email.trim() && scope.bean.phone && scope.bean.phone.trim()) {
                                    modalInstance.close(scope.bean);
                                } else {
                                    growl.warning("No es pot deixar cap dels camps buits.");
                                }
                                    
                            };
                            scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            scope.bean = {email: "", phone: ""};
                        }],
                    size: 'md'
                });

                modalInstance.result.then(function(bean) {
                        
                            $http.post("/rest/auth/forgotpwd", bean).then(function(r) {
                                if (r.data.ok) {
                                    Modals.notificationdlg("Nova contrasenya", "Comproveu el vostre correu electrònic.");
                                } else {
                                    growl.warning(r.data.msg);
                                }
                            });
                                    
                });
                            
        };
        
        $http.post("/rest/news/list", {filter: true, badges: true}).then(function(r){
            $scope.slides = r.data;
            //called focus
            jQuery("#uname").focus();
        }, function(err){
            //In case of error - database is not responding
            console.log(err);
            $location.url("nodatabase.html");
        });
        
        $scope.clearLocalStorage = function(){
             localStorage.removeItem("pwMobile");
             $scope.credentials.username = "";
             $scope.credentials.password = "";
             clearStoragePressed = true;
        };
        
        
         
        $rootScope.adjustPadding(); 
} ]);

}(window.pw.app, angular));
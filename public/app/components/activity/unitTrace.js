window.pw.app.register.controller("UnitTraceController", ["$scope", "$transition$", "$http", "$filter", "Session", "growl", "$uibModal", "$timeout",
    function($scope, $transition$, $http, $filter, Session, growl, $uibModal, $timeout){
       
       $scope.idUnit = $transition$.params().idUnit;
       $scope.unit = { activities: []};
       $scope.students = [];
       $scope.accomplished = 0;
       $scope.tgs = {overlayQ: false, overlayV: false};
       
       $scope.loadData = function(){
           $http.post("/rest/unit/trace", {idUnit: $scope.idUnit}).then(function(r){
              var data = r.data;
              $scope.unit = data.unit; 
              $scope.students = data.students;
              jQuery.each($scope.students, function(i, e){
                 var total = 0;
                 e.fullname = $filter("nameShortener")(e.fullname);
                 jQuery.each(e.activities, function(j, a){
                     if(a.score){
                         total += a.score;
                     }
                 });
                 e.total = total;
              });
              $scope.updateAccomplished(); 
           });
       };
       
        $scope.myFilter = function(bean) {
                if(!$scope.filterNames){
                    return true;
                }       
                return (bean.fullname || "").toLowerCase().indexOf($scope.filterNames.toLowerCase())>=0;
            };
       
       $scope.loadData();
       
       $scope.updateAccomplished = function(){
           var total = 0;
           var done = 0;
           jQuery.each($scope.students, function(i, e){
                if($scope.myFilter(e)){
                    jQuery.each(e.activities, function(j, a){
                        total += 1;
                        if(a.score){
                            done += 1;
                        }
                    });                    
                }
             });
           if(total){
               $scope.accomplished = Math.round(100*done/total);
           }           
       };
       
       
       //----This logic is to show ACTIVITY type info in attempts
       //----Show as overlay is more efficient
       
    
       
       $scope.fetchReview = function(idAttempt){
            //Fetch attempt info
            $http.post('rest/activity/fetchreview', {idAttempt: idAttempt}).then(
                function(r){
                    var data = r.data;
                    $scope.review = data.activity;
                    $scope.attempt = data.attempt;
                    
                    $timeout(function(){
                        pw.autoRender($("#ut-overlay-questions"), pw.KATEXAUTO_OPTIONS);
                    }, 1000);
                }
            );
        };
        
        $scope.fetchVideo = function(att){
            $scope.attempt = att;
        };
                
        $scope.showAttempts = function(s, index){
            $scope.review = [];
            $scope.attempt = {};
            //Fetch all attempts for the given assignment
            var idUser = s.id;
            var idActivity = $scope.unit.activities[index].idActivity;
            var idAssignment = $scope.unit.activities[index].id;
            var bean = {idActivity: idActivity, idAssignment: idAssignment, idUser: idUser};
            $http.post('rest/attempt/list', bean).then(function(r){
                $scope.attempts = r.data;
                if(r.data.a.length>0){
                    $scope.fetchReview(r.data.a[0].id);
                }
                $scope.tgs.overlayQ = true;
            });             
        };
        
        $scope.hideOverlays = function(){
            $scope.tgs.overlayQ=false; 
            $scope.tgs.overlayV=false;
        };
        
        $scope.showVideo = function(s, index){
            $scope.review = [];
            $scope.attempt = {};
            //Fetch all attempts for the given assignment
            var idUser = s.id;
            var idActivity = $scope.unit.activities[index].idActivity;
            var idAssignment = $scope.unit.activities[index].id;
            var bean = {idActivity: idActivity, idAssignment: idAssignment, idUser: idUser};
            $http.post('rest/attempt/list', bean).then(function(r){
                $scope.attempts = r.data;
                if(r.data.v.length>0){
                    $scope.fetchVideo(r.data.v[0]);
                }
                $scope.tgs.overlayV = true;
            });             
        };
        
        $scope.sendRemainder = function(a){
            var indx = $scope.unit.activities.indexOf(a);
            console.log("Remainder for ", a, indx);
            var list = [];
            
            //Take only filtered students in view
            jQuery.each($scope.students, function(i, e){
                if($scope.myFilter(e)){
                    
                    var x = e.activities[indx];
                    if(x && e.email && (!x.score || x.score<0)){
                       
                       //Valid email
                       if(e.email.substring(0,2)!=="??"){
                            console.log(e.email, x);
                            list.push(e);
                       }
                    }              
                }
            });
            
            //Open a dialog if list has items
            if(list.length){
                var user = Session.getUser();
                
                var sender = function(bean){
                    jQuery.each(bean.selected, function(i,u){
                        
                        var obj = {to: u.email, subject: bean.subject, html: bean.html, from: user.email, fromName: user.emailPassword? user.fullname : "", emailPassword: user.emailPassword};
                       
                       console.log("enviant post ", obj);
                       var msg = pw.encrypt(JSON.stringify(obj));
                        
                       var post = $http({
                            method: 'POST',
                            url: '/rest/gapis/email',
                            data: msg,
                            headers: {
                                'Content-Type': 'text/plain;charset=UTF-8'
                                }
                            }).then(function(r){
                                if(r.data.ok){
                                    growl.success("S'ha enviat el correu a "+u.email);
                                } else {
                                    growl.error("No s'ha pogut enviar el correu a "+u.email);
                                    console.log(r.data.msg);
                                }
                        }, function(r){
                            console.log("S'ha produït un error "+r);
                        });
                                               
                    });
                    

                };
                
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/shared/remainders-dlg.html',
                    controller: ['$scope', function (scope) {
                            scope.ok = function () {    
                                if(!scope.bean.subject.trim() || !scope.bean.html.trim()){
                                    return;
                                }
                                modalInstance.close(scope.bean);                                    
                            };
                            scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            
                            var html = "<p>Hola,</p> Et recordam que s'acosta el termini per fer l'activitat núm. "
                                         +a.idActivity+", "+a.activity+".</p><p>Entra amb el teu usuari a <a href='https://piworld.es'>https://piworld.es</a> i realitza l'activitat.</p><p>Passa-t'ho bé</p><p>";
                                 (user.emailPassword? user.fullname : "L'administrador de piWorld")+"</p>";
                            scope.bean = {subject: "Recordatori activitat num. "+a.idActivity, html: html, selected: []};
                            scope.list = list;
                            jQuery.each(list, function(i, e){
                                scope.bean.selected.push(e);
                            });
                        }],
                    size: 'lg',
                    resolve: {
                        lazyModules_picklist: ['$ocLazyLoad', function($ocLazyLoad) {
                                return $ocLazyLoad.load('fxpicklist');
                            }]
                    }
                });

                modalInstance.result.then(function(bean) {
                        if(bean.selected.length){
                            sender(bean);            
                        } else {
                            growl.warning("No hi ha emails per enviar.");
                        }
                });
                
                
            } else {
                growl.warning("No hi ha emails per enviar.");
            }
            
        };
    
       
}]);
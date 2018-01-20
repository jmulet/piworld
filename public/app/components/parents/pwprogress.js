//
define([], function(){  
    'use strict';
 
   window.pw.app.register.controller('PwProgressController', ['$http', '$scope', '$rootScope', '$filter', 
    '$transition$', '$uibModal', 'growl', '$translate', 'Session', 'PwTable', '$state',  
    function ($http, $scope, $rootScope, $filter, $transition$, $uibModal, growl, $translate,
                Session, PwTable, $state) {
        
        //Session.addCss('assets/libs/angular-jsx-graph/jsxgraph.css');
        $scope.user = Session.getUser(); 
       
        
         var computeBB = function(datax, datay, dataz){
               if(!datax.length){
                   return [0,1,1,0];
               }
               var minx = datax[0];
               var miny = datay[0];
               var maxx = minx+1;
               var maxy = miny+1;
               
               datax.forEach(function(e){
                  if(e>maxx){
                      maxx = e;
                  }
                  if(e<minx){
                      minx = e;
                  }
               });
               
               datay.forEach(function(e){
                  if(e>maxy){
                      maxy = e;
                  }
                  if(e<miny){
                      miny = e;
                  }
               });
               
               if(dataz){
                 dataz.forEach(function(e){
                  if(e>maxy){
                      maxy = e;
                  }
                  if(e<miny){
                      miny = e;
                  }
               });
               }
               
               return [minx,maxy,maxx,miny];
            };
            
            
        
            $scope.tableParams = new PwTable({
                count: 10, // count per page
                sorting: ["+dia"]
                }, 
               function ($defer, params) {
                    if($scope.user){
                        $http.post('/rest/students/statistics', {idAlumne: $scope.user.id}).then(function (r){
                                var payload = r.data.detail;
                                        /**
                                         var d = payload.summary;

                                         var f = [d.x, d.y]; 
                                         var f2 = [d.x, d.z]; 
                                         var bb = computeBB(d.x, d.y, d.z);                     
                                         bb[3] = -1;

                                         var board = JXG.JSXGraph.initBoard('summaryChart', {axis : true, boundingbox : bb, showCopyright: false});
                                         board.create('axis', [ [bb[2], bb[3]], [bb[2], bb[1]] ], {withLabel: true, name: "Count", label: {offset: [0,30]}});
                                         if(f[0].length){
                                         var chart = board.create('chart', f, {chartStyle:'line,point', strokeWidth:3, strokeColor:'#0000ff'});
                                         var chart2 = board.create('chart', f2, {chartStyle:'line,point', strokeWidth:3, strokeColor:'#ff0000'});
                                         }
                                         **/
                                        $defer.resolve(payload);
                                });
                        } else {
                            $defer.resolve([]);
                        }                                                   
               });
               
             $scope.tableParams2 = new PwTable({
                count: 10, // count per page
                sorting: ["-login"]
                }, 
               function ($defer, params) {
                    if($scope.user){
                        $http.post('/rest/auth/loginlist', {idUser: $scope.user.id}).then(function(r){
                            $scope.loginData = r.data;  
                             
                            $defer.resolve(r.data.logins);
                            /**
                            var f = [d.counts.x, d.counts.y];                    
                            var bb = computeBB(d.counts.x, d.counts.y);                     
                            bb[3] = -1;
                            var board = JXG.JSXGraph.initBoard('loginChart', {axis : true, boundingbox : bb, showCopyright: false});
                            board.create('axis', [ [bb[2], bb[3]], [bb[2], bb[1]] ], {withLabel: true, name: "Count", label: {offset: [0,30]}});
                            if(f[0].length){
                                var chart = board.create('chart', f, {chartStyle:'bar,point', width:0.3, dir:'vertical'});
                            }
                            **/
                            });    
                        } else {
                            $defer.resolve([]);
                        }                                                   
               });
                              
            var isLoaded = [false, false, false];
            $scope.lazy = function(indx){
                if(!isLoaded[indx]){
                    isLoaded[indx] = true;
                    if(indx === 0){
                         $scope.tableParams.reload();
                    } else if(indx===1){
                         $scope.tableParams2.reload();
                    } else {
                          $scope.showScore($scope.user);
                    }                    
                }
            };


            $scope.detall = function(p){
                $state.go("home.activity.review", {idActivity: p.idActivity, idAssignment: p.idAssignment, idAttempt: p.idAttempt});
            };
            
           
           
            
            $scope.showScore = function(u)
            {
                $scope.tab2$loading = true;
                $http.post('/rest/students/categoryscores', {idUser: u.id}).then(function(r){
                     var d = r.data;
                        d.rscore = 0;
                        jQuery.each(d.badges, function(i, e){
                            d.rscore += e.rscore;
                            var desc = $rootScope.badgeDescription(e.type);
                            var punts= $translate.instant("SCORE");
                            e.html = "<div><p>"+desc+"</p> <p>"+$filter("date")(e.day, "dd-MM-yyyy")+"<p><p>"+e.rscore+" "+punts+"</p></div>";
                        });
                        
                        $scope.myScores = d; 
                        $scope.tab2$loading = false;
                        
                });                               
            };
            
            //Shows a dlg with the detail of this quizz
            $scope.quizzDetail = function(g){
                $http.post('/rest/video/vdetail', {idV: g.idV}).then(function(r){                        
                     //DETAIL IS OBTAINED FROM ARRAY DATA
                     //OPEN A DIALOG TO DISPLAY THE DATA
                     
                     var modalInstance = $uibModal.open({
                templateUrl: 'app/components/students/video-detail.html',
                controller: ['$scope', 'modalParams', function($scope, modalParams){
                            $scope.title = modalParams.title;
                            $scope.data = modalParams.data;
                            $scope.cpwd = '';
                            $scope.invalidpwd = '';

                            $scope.ok = function () {
                                 modalInstance.close('ok');
                            };

                            $scope.cancel = function () {
                                modalInstance.dismiss('cancel');
                            };
                }],                        
                resolve: {
                    modalParams: function(){ return { 
                        title: 'Video ' + g.resource,
                        data: r.data 
                    };}
                }
            });

      
  
  
                });                               
            };
  
        
        
            //Now depending on which tab, load one or other thing
             isLoaded = [false, false, false];
             $scope.lazy($scope.active);
            
            
            
            $scope.myFilter = function (bean) {
                if (!$scope.filterNames) {
                    return true;
                }
                return (bean.fullname || "").toLowerCase().indexOf($scope.filterNames.toLowerCase()) >= 0;
            };
    
    
        }]);


});
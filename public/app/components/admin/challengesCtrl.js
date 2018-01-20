define([], function(){
"use strict"; 
 

window.pw.app.register.controller('ChallengesCtrl', [ '$scope', '$filter', '$http', '$translate',  'growl', 'PwTable', 'AVAILABLE', 'Modals', 
function($scope, $filter, $http, $translate,  growl, PwTable, AVAILABLE, Modals) {
    
   
    $scope.onDelete = function(b){
      var ok = function(){
            $http.post("/rest/challenge/delete", {id: b.id}).then(function(r){
                  $scope.reload();
            });
      };
      Modals.confirmdlg("Confirm delete challege "+b.id, "Segur que voleu eliminar aquest repte?", ok);
    };
    
    $scope.create = function(){
      $scope.tableParams.$data.push({w: 0, level: 0, formulation_en: "", formulation_es: "", formulation_ca: "", score: 150, edit: true});  
    };
    
    
    $scope.thisWeek = $filter('date')(new Date(), 'ww'); 
    
    $scope.levelList = [
        {id: 0, label:"1-2ESO"},
        {id: 1, label:"3-4ESO"},
        {id: 2, label:"BAT"}    
    ];
    
    $scope.tableParams = new PwTable({
                count: 20, // count per page
                sorting: ["-id"]
                }, 
               function ($defer, params) {
                    
                   $http.post("/rest/challenge/list", {noparse: true}).then(function(r){
                        jQuery.each(r.data, function(i, e){
                           try{
                               var json = JSON.parse(e.formulation);
                               e.formulation_ca = json.ca || "";
                               e.formulation_es = json.es || "";
                               e.formulation_en = json.en || "";
                           } catch(ex){
                               e.formulation_ca = e.formulation;
                               e.formulation_es = e.formulation;
                               e.formulation_en = e.formulation;
                           }
                        });
                        $defer.resolve(r.data);
                  });
                                                                    
    });
    
    
     
     $scope.tableParams2 = new PwTable({
                count: 20, // count per page
                sorting: ["+when"]
                }, 
               function ($defer, params) {
                   if($scope.selected){
                   $http.post("/rest/challenge/list", {id: $scope.selected.id, lang: $translate.use()}).then(function(r){
                        $defer.resolve(r.data);                       
                  });
                } else{
                    $defer.resolve([]);
                }
                                                                    
    });
    
    $scope.onEdit = function(g){
        g.org = angular.copy(g);
        g.edit = true;
    };
    
    $scope.onCancelEdit = function(g){
        for(var key in g.org){
            g[key] = g.org[key];
        }
        delete g.org;
        g.edit = false;
    };
   
    $scope.onSaveEdit = function(g){
        delete g.org;
        g.edit = false;
        var tmp = angular.copy(g);
        var formulation = {ca:g.formulation_ca, es: g.formulation_es, en: g.formulation_en};
        tmp.formulation = JSON.stringify(formulation);
        delete tmp.formulation_ca;
        delete tmp.formulation_es;
        delete tmp.formulation_en;
        delete tmp.edit;
        delete tmp.activeLang;
        delete tmp.org;
        $http.post("/rest/challenge/save", tmp).then(function(r){
              $scope.reload();
        });
        
    };
    
    $scope.translate = function(b, lang, force){
        var origin = b["formulation_"+lang];
        var list = [];
        jQuery.each(AVAILABLE.langs, function(i, e){
                if(e!==lang && origin && (!b["formulation_"+e] || force) ){
                    list.push(e);
                }
            });
            
            if(list.length){
                $http.post('/rest/activity/translate', {text: origin, source: lang, target: list}).then(function(r){
                     var d = r.data;
                     jQuery.each(Object.keys(d), function(i, k){
                            b["formulation_"+k] = d[k];
                     });
                });
            }
    };
    
    $scope.onSelect = function(g){
        $scope.selected = g;
        $scope.tableParams2.reload();
    };
    
    $scope.reload = function(){
        $scope.tableParams.reload();
    };
    
    
    $scope.changeCorrect = function(g){        
        $http.post("/rest/challenge/correct", {id: g.cqid, valid: g.valid}).then(function(r){
            if(!r.data.ok){
                growl.error("Can't update challange correction :-(");
            }
        });
    };
    
}]);

});
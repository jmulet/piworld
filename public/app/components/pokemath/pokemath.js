
window.pw.app.register.controller("PokeMathCtrl", ["$scope", "growl", "Modals", "$uibModal", "$timeout", function($scope, growl, Modals, $uibModal, $timeout){
       
        var myOptions = {
            zoom: 9,
            maxZoom: 20,
            center: new google.maps.LatLng(39.4, 2.83),
            mapTypeId: google.maps.MapTypeId.SATELLITE
        };
        
        var map = new google.maps.Map(document.getElementById('pokemap'), myOptions);
        var mgr = new MarkerManager(map, {maxZoom: 20});
        
        $scope.captures = [];
        
        google.maps.event.addListener(mgr, 'loaded', function(){
            mgr.addMarkers(getCityMarkers(), 0, 17);
            mgr.addMarkers(getPokeMarkers(), 18, 20);
           // mgr.addMarkers(getMarkers(1000), 18, 21);
            mgr.refresh();
        });
        
        var cities = [
            ["Binissalem", 39.6889783, 2.838805],
            ["Inca", 39.7205911, 2.9102994]
        ];
        
                
        function getCityMarkers() {
            var batch = [];
            for (var i = 0; i < cities.length; ++i) {
                var c = cities[i];
                var marker = new google.maps.Marker({
                    position: {lat: c[1], lng: c[2]},                    
                    icon: 'assets/img/pokemath/sight.png',
                    title: c[0]
                });                
                batch.push(marker);
            }
            return batch;
        }
        
        function getPokeMarkers(){
            
            var pokes = [];
            for (var i = 0; i < cities.length; ++i) {
                var c = cities[i];
                for (var j = 0; j < 20; ++j) {                    
                    var a = Math.floor(Math.random()*10);
                    var b = Math.floor(Math.random()*10);
                    var q = {                       
                        formulation: "Quant són "+a+"+"+b+"?", type: "multiple", options: [{text:a+b, valid:true}, {text:a-b, valid: false}, {text: b+a-2, valid: false}, {text: a+b+4, valid: false}]
                    };
                    pokes.push({name: c[0]+" Animal", lat: c[1] + 0.005*(Math.random()-0.5), lng: c[2]+ 0.005*(Math.random()-0.5), question: q});                    
                }
                   
            }
            
            var batch = [];
            for (var i = 0; i < pokes.length; ++i) {
                var c = pokes[i];
                var marker = new google.maps.Marker({
                    position: {lat: c.lat, lng: c.lng},                    
                    icon: 'assets/img/pokemath/poke.png',
                    title: c.name,
                    obj: c
                });                
                google.maps.event.addListener(marker, 'click', function(evt){
                    var m = mgr.getMarker(evt.latLng.lat(), evt.latLng.lng(), map.getZoom());
                    var question = m.obj.question;
                    $timeout(function(){
                       var a = Math.floor(Math.random()*20);
                       var b = Math.floor(Math.random()*30);
                       var ok = function(r){
                           console.log(r);
                           var valid = true;
                           if(question.type==='input'){
                               valid = (r == question.answer);
                           } else {
                               jQuery.each(question.options, function(indx, e){
                                  if(e.selected && !e.valid || (!e.selected && e.valid)){
                                      valid = false;
                                  } 
                               });
                           }
                           
                            if(valid){
                                growl.success("Molt be! Has aconseguit capturar un pockemath");
                                mgr.removeMarker(m);
                                $scope.captures.push(m.icon);
                            } else {
                                growl.error("Ohh, No! Aquest pockemath acaba de mutar!");
                                console.log(m);
                                var p = {lat: m.position.lat(), lng: m.position.lng()};                      
                                var position = {lat: p.lat + 0.005*(Math.random()-0.5), lng: p.lng+ 0.005*(Math.random()-0.5)};
                                mgr.removeMarker(m);
                                var nm = new google.maps.Marker({
                                    position: position,                    
                                    icon: 'assets/img/pokemath/poke.png',
                                    title: m.title,
                                    obj: m.obj
                                });   
                                mgr.addMarkers([nm], 18, 19);
                                
                            }
                       }; 
                       questiondlg("Vols caçar aquest pokemath?", question, ok);
                        
                    });
                    
                    
                });
                batch.push(marker);
            }
            return batch;
            
         
        }
                
       
       
         
        function questiondlg(title, question, okcb, cancelcb){
            
                var modalInstance = $uibModal.open({
                    templateUrl: 'app/components/pokemath/pokemath-dlg.html',
                    controller: ['$scope', function ($scope) {
                            $scope.ok = function () {
                                modalInstance.close($scope.model.text);
                            };
                            $scope.cancel = function () {
                                modalInstance.dismiss();
                            };
                            $scope.title = title;                            
                            $scope.model = {text: ""};
                            $scope.question = question;                     
                        }],
                    size: "md"
                });

                modalInstance.result.then(function(value) {
                    okcb && okcb(value);
                }, function () {
                    cancelcb && cancelcb();
                });

                return modalInstance;
            };
            
}]);
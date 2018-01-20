
define([], function(){
  "use strict"; 
    window.pw.app.register.controller('ActivityIdeCtrl', ['$scope', '$http', '$transition$', '$uibModal', 'growl',  '$state', '$interval', 
         '$filter', '$q', 'Session',  'USER_ROLES', 'Upload','Modals', '$sce', '$timeout', '$templateCache',
        function($scope, $http, $transition$, $uibModal, growl, $state, $interval,
               $filter, $q, Session, USER_ROLES, Upload, Modals, $sce, $timeout, $templateCache){
            
            var admin = Session.getUser().idRole === USER_ROLES.admin || Session.getUser().idRole === USER_ROLES.teacheradmin;
            var indexes = 0;
            $scope.readonly = false;
            $scope.files = [];
            $scope.libraries = [];
            $scope.workspaces = [];   
            $scope.tabset = {activeTabIndex: 0, activeTab: null};
            $scope.showCode = true;
            $scope.idActivity = $transition$.params().idActivity;
            $scope.path = $scope.idActivity;
            $scope.ideLog = "";
            $scope.uploads = [];
            $scope.uploading = false;
            $scope.runopts = {guest: true, debug: true, test: true, autoplay: true};
            
            //Get more info about this activity
            $http.post('rest/activity/load', {id: $scope.idActivity}).then(function(r){
                $scope.activity = r.data;
            });
            
             
            var firstLoadC = true;
            $scope.reloadClient = function () {
                $http.post('rest/fs/dir', {path: $scope.path}).then(
                        function (r) {
                            var data = r.data;
                            $scope.files = data;                            
                              //First time, load QProvider.json if present                            
                            if(firstLoadC)
                            {
                                firstLoadC = false;
                                data[0].nodes.forEach(function(e){
                                    if(e.title.search(/(.*)theory(.*)html/ig)>=0){
                                        $scope.openFile(e);
                                    }
                                });
                            }
                        }
                );
            };

            $scope.reloadLibs = function () {
                $http.post('rest/fs/dir', {path: "libs"}).then(
                        function (r) {
                            $scope.libraries = r.data;                            
                        }
                );

            };
            
            $scope.reload = function (node) {
                if (node.server) {
                    $scope.reloadServer();
                } else if (node.dir && node.file.indexOf("libs") === 0) {
                    $scope.reloadLibs();
                } else {
                    $scope.reloadClient();
                }
            };


            if (admin) {
                $scope.libraries = [];
            }

            var firstLoad = true;
            $scope.reloadServer = function () {
                $http.post('rest/fs/dir', {path: $scope.path, server: true}).then(
                        function (r) {
                            var data = r.data;
                            $scope.serverfiles = data;
                     
                            //First time, load serverData.json if present                            
                            if(firstLoad)
                            {
                                firstLoad = false;
                                data[0].nodes.forEach(function(e){
                                    if(e.title.search(/(.*)serverData(.*)json/ig)>=0 ||  e.title.search(/(.*)server-data(.*)json/ig)>=0){
                                        $scope.openFile(e);
                                    }
                                });
                            }
                            
                        }
                );
            };
            
            
            $scope.reloadClient();
            $scope.reloadServer();
             
            $scope.save = function(){                
                //Determine which is the current tab
                var w = $scope.tabset.activeTab;
                if(w!==null)
                {
                     $scope.saving = true;
                     $http.post('rest/fs/put', {path: w.node.file, src: w.src, server: w.node.server || false}).then(
                                function(r){
                                   $scope.ideLog += r.data.log+"<br>";
                                   w.modified = false;
                                   growl.success("S'ha desat correctament el fitxer " + w.node.title);
                                   $scope.saving = false;
                                   $scope.reloadClient();
                                    
                            }
                    , function(){
                        growl.error(":-(  No s'ha desat el fitxer " + w.node.title);
                        $scope.saving = false;
                    });                    
                }
            };
            
            
            $scope.minify = function(node){
                 if(! (node.file.toLowerCase().endsWith('.css') || node.file.toLowerCase().endsWith('.js')) )
                 {
                     growl.warning("Can't minify file type "+node.file);
                     return;
                 }
                 $http.post('rest/fs/minify', {file: node.file, server: node.server}).then(
                        function (r) {
                            $scope.ideLog += r.data.log+"<br>";
                            $scope.reload(node); 
                        }
                );
            
            };
            
            
             $scope.saveAll = function(){
                
             $scope.savingAll = true;
             var promises = []; 
             $.each($scope.workspaces, function(i, w){
                     if(w.modified){
                            var q = $q.defer();
                            promises.push(q.promise);

                            $http.post('rest/fs/put',{path: w.node.file, src: w.src, server: w.node.server || false}).then(
                                       function(r){
                                          $scope.ideLog += r.data.log+"<br>";
                                          w.modified = false;                                   
                                          q.resolve();
                                   }
                           ,function(d){
                               q.reject();
                           });        
                     }
                });
                 
                $q.all(promises).then(function(){
                    $scope.savingAll = false;
                });
            };
            
            
            $scope.newfile = function (dirNode) {
                               
                            var modalInstance = $uibModal.open({
                                templateUrl: 'app/shared/input-dlg.html',
                                controller: ['$scope', function ($scope) {
                                    $scope.ok = function () {
                                        modalInstance.close($scope.model);                                       
                                    };
                                    $scope.cancel = function () {
                                        modalInstance.dismiss();
                                    };
                                    $scope.title = "Crear un nou fitxer o directori";
                                    $scope.msg = "Escriviu el nom del fitxer i la seva extensió (directori sense extensió)";
                                    $scope.model = {text: ""};
                                }],
                                size: 's'
                            });
                            
                            modalInstance.result.then(function (confirm) {
                            
                                  var name = confirm.text.trim();
                                        if(name.length>0 && $scope.files.indexOf(name)<0)
                                        {
                                            var src = "";
                                            if(name.indexOf(".")<0)
                                            {
                                                //This is a Directory
                                                $http.post('rest/fs/mkdir', {path: dirNode.file + "/" + name, server: dirNode.server}).then(
                                                   function(){ 
                                                    $scope.reload(dirNode);                                          
                                                });
                                            }
                                            else
                                            {
                                                //This is a file
                                                //Depending on the type of extension generate a template
                                                if(name.toLowerCase().endsWith(".json"))
                                                {
                                                    src = "{\n\t\"key\": \"value\"\n}";
                                                }
                                                else if(name.toLowerCase().endsWith(".js"))
                                                {
                                                    src = "(function(){\n\n})()";
                                                }
                                                else if(name.toLowerCase().endsWith(".htm") || name.toLowerCase().endsWith(".html"))
                                                {
                                                    src = "<h5>Title</h5>\n";
                                                }
                                                  
                                                
                                                $http.post('rest/fs/put', {path: dirNode.file + "/" + name, src: src, server: dirNode.server}).then(
                                                    function (r) {
                                                       $scope.ideLog += r.data.log+"<br>";
                                                       $scope.reload(dirNode);
                                                    }                                            
                                                );
                                            }    
                                        } else {
                                            growl.error("Invalid file or directory name");
                                        }
                                }
                            , function () {
                                //dismissed
                            });

                        };
                   
            $scope.deleteFile = function(node)
            {
                 var modalInstance = $uibModal.open({
                                templateUrl: 'app/shared/confirm-dlg.html',
                                controller: ['$scope', function ($scope) {
                                    $scope.ok = function () {
                                        modalInstance.close();                                       
                                    };
                                    $scope.cancel = function () {
                                        modalInstance.dismiss();
                                    };
                                    $scope.title = "Confirmació";
                                    $scope.msg = "Segur que voleu eliminar el fitxer o directori "+node.title;                 
                                }],
                                size: 's'
                            });
                            
                            modalInstance.result.then(function() {
                                       
                                            $http.post('rest/fs/delete', {node: node}).then(
                                                function (r) {
                                                     
                                                    $scope.ideLog += r.data.log+"<br>";
                                                    $scope.reload(node);
                                                    var idx = -1;
                                                    $scope.workspaces.forEach(function(e){
                                                       if(e.node.file === node.file){
                                                           idx = i;
                                                       } 
                                                    });
                                                    if(idx >= 0)
                                                    {
                                                        $scope.workspaces.splice(idx, 1);
                                                    }
                                                }
                                            )
                                        
                                
                            , function () {
                                //dismissed
                            };});
            };
            
            $scope.renameFile = function(node)
            {
                 var modalInstance = $uibModal.open({
                                templateUrl: 'app/shared/input-dlg.html',
                                controller: ['$scope', function ($scope) {
                                    $scope.ok = function () {
                                        modalInstance.close($scope.model.text);                                       
                                    };
                                    $scope.cancel = function () {
                                        modalInstance.dismiss();
                                    };
                                    $scope.title = "Renombrar "+node.title;
                                    $scope.msg = "Escriviu el nom del fitxer o directori";
                                    $scope.model = {text: node.title};
                                }],
                                size: 's'
                            });
                            
                            modalInstance.result.then(function (confirm) {
                                  var name = confirm.trim();
                                        if(name.length>0)
                                        {
                                            var idx = node.file.lastIndexOf("/");
                                            var base = node.file.substring(0,idx);
                                            var toFile = base+"/"+name;
                                            $http.post('rest/fs/rename', {from: node.file, 
                                                to: toFile, server: node.server}).then(
                                                function (r) {
                                                   
                                                    
                                                    $scope.ideLog += r.data.log+"<br>";
                                                    $scope.reload(node);
                                                    
                                                    $scope.workspaces.forEach(function(e){
                                                       if(e.file === node.file){
                                                           e.node.title = name;
                                                           e.node.file = toFile;
                                                       } 
                                                    });
                                                }
                                            );
                                        }
                                }
                            , function () {
                                //dismissed
                            });

                        };                   

            $scope.unzip = function(node){
                var type = "";
                if(node.server){
                    type = "server";
                }
                if(node.dir && node.file.indexOf("libs")===0){
                    type = "libs";
                }
                $http.post('rest/fs/unzip', {path: node.file, type: type, server: node.server}).then(
                            function (r) {                                
                                $scope.ideLog += r.data.log + "<br>";
                                $scope.reload(node);
                });                
            };
            
            //Close workspace
            $scope.close = function(w)
            {
                    var idx = $scope.workspaces.indexOf(w);
                    var rcb = function(){
                        $scope.workspaces.splice(idx,1);
                    };
                        
                    if(w.modified)
                    {
                        var okcb = function(){
                             $scope.save();
                        };
                        Modals.confirmdlg("File changed", "Save changes of "+w.node.title+"?", okcb, null, {}, rcb );
                    } else {
                        rcb();
                    }
            };
            
            
           $scope.aceLoaded = function(editor){
                //Keep a copy of the current editor in the active workspace
                var w = $scope.tabset.activeTab;
                    
                if(w){
                    var mode = "javascript";
                    if (w.node.title.toLowerCase().endsWith(".js"))
                    {
                        mode = "javascript";
                    }
                    else
                    {
                        var i = w.node.title.lastIndexOf(".");
                        mode = w.node.title.toLowerCase().substring(i + 1);
                    }
                    //if(mode==="html")
                    //{
                    //    editor.setTheme("ace/theme/twilight");
                    //}
                    
                    editor.renderer.setShowGutter(true);
                    editor.getSession().setUseWrapMode(true);
                    editor.getSession().setMode("ace/mode/"+mode);

                    w.editor = editor;       
                    editor.getSession().on('change', function(evt){
                        //console.log(evt);
                        if(w.initialized){
                            w.modified = true;
                        } else {
                            w.initialized = true;
                            w.modified = false;
                        }
                    });
                    
                    editor.commands.addCommand({
                        name: 'Save',
                        bindKey: {win: 'Ctrl-S', mac: 'Command-S'},
                        exec: function(editor){
                            $scope.save();
                        },
                        readOnly: false
                    });
                }
                //_editor.$blockScrolling =  Infinity;
                window.pw.app.DEBUG && console.log("loaded "+editor);
            };
            
        
            
            var readFile = function(node, dir)
            {
                 if(!$scope.showCode){
                    $scope.showCode = true;
                    $state.go("home.ide", {idActivity: $scope.idActivity});
                 }
                        
                var found = false;
                jQuery.each($scope.workspaces, function(i,w){
                    if(w.node.file===node.file){
                        found=true;
                        $scope.tabset.activeTabIndex = w.index;
                        return true;
                    }
                });
                
                if(!found)
                {
                    $http.post('rest/fs/get', {path: node.file, server: node.server}).then(
                            function (r) {
                                 var w = {node: node, src: r.data.src, modified: false, type: 'editor', index: indexes};
                                 //check type
                                 var f = node.title.toLowerCase();
                                 if(f.indexOf(".pdf")>0 || f.indexOf(".gif")>0 || f.indexOf(".png")>0 || f.indexOf(".jpg")>0 || f.indexOf(".jpeg")>0 ||
                                    f.indexOf(".doc")>0 || f.indexOf(".xls")>0 || f.indexOf(".odt")>0 || f.indexOf(".ods")>0){
                                        w.type = 'preview';
                                        w.url = $sce.trustAsResourceUrl('https://docs.google.com/gview?url=https://piworld.es/activities/'+w.node.file+'&embedded=true');
                                 }
                                 
                                 $scope.workspaces.push(w);
                                 $scope.tabset.activeTab = w;
                                 $timeout(function(){
                                    $scope.tabset.activeTabIndex = w.index; 
                                }, 100);
                                 
                                 indexes += 1;
                            }
                    );
                }
            };
             
             
            $scope.openFile = function(node)
            {
                readFile(node, $scope.path);
            };
            
            
            $scope.onTabSelect = function(ws){
                 $scope.tabset.activeTab = ws;
            };
            
            $scope.insert = function(activityType){
                var w = $scope.tabset.activeTab;
                if(!w){
                    return;
                }
                var obj;
                try{
                    obj = JSON.parse(w.src);
                } catch(ex){
                    $scope.check();
                    return;
                }
                
                var nquestion;
                
                
                switch(activityType){ 
                    case "free.multiplechoice": nquestion = {title: "Tria l'opció correcta", serverData: [{var:"database", file: "server-data.json"}], repeat: 10, type: activityType, tips: ""}; break;
                    case('free.fillgaps'): break;
                    case('integer.divisors'):
                        nquestion = {title: "Calcula tots els divisors", repeat: 10, type: activityType, tips: "", config: {maxValue: 30}, parameters: {num: "Math.irandom(2, config.maxValue)"} }; break;                                               
                    case('integer.gcd'): 
                        nquestion = {title: "Calcula el màxim comú divisor", repeat: 10, type: activityType, tips: "", config: {maxValue: 30}, parameters: { x1: "Math.irandom(2, config.maxValue)",
                                        x2: "Math.irandom(2, config.maxValue)", list: "[this.x1, this.x2]"} }; break;                                               
                    case('integer.lcm'):  
                        nquestion = {title: "Calcula el mínim comú múltiple", repeat: 10, type: activityType, tips: "", config: {maxValue: 30}, parameters: { x1: "Math.irandom(2, config.maxValue)",
                                        x2: "Math.irandom(2, config.maxValue)", list: "[this.x1, this.x2]"} }; break;                                               
                    case('integer.primes'):                     
                            nquestion = {title: "Identifica els nombres primers", repeat: 10, type: activityType, tips: "", config: {maxValue: 50}, parameters: {list: "list(10, rent1(0, config.maxValue, false, false))"}}; break;    
                    case('integer.divisibility'): 
                           nquestion = {title: "Criteris de divisibilitat per 2, 3 i 5", repeat: 10, type: activityType, tips: "", config: {maxValue: 50}, parameters: {num: "[2, 3, 5].random()", list: "list(10, rent1(0,config.maxValue,false,false))" }}; break;    
                    case('integer.operations'): 
                            nquestion = {title: "Realitza la següent operació", parameters: {"template": "['N+Z0*(Z+Z-N)', 'Z0+Z0+Z0'].random()"},
                                    repeat: 10, type: "integer.operations", tips: ""}; break;
                    case('fraction.operations'): break;
                    case('equation'):
                        nquestion = {
                            title: "Equacions de segon grau incompletes",
                            parameters: {
                                a: "Math.irandom(1,10)",
                                b: "Math.irandom(-10,10)",
                                eq: "this.a+'*x^2'+this.b+'*x=0'",
                                bar: "x"
                            },
                            repeat: 10,
                            type: "equation",
                            hints: ""
                        };
                        break;
                    case('polynomial.operations'): 
                        nquestion = {title: "Suma y resta de polinomios",
                            parameters: {
                                "n1": "rent1(0,4,false,false)+1",
                                "n2": "rent1(0,4,false,false)+1",
                                "poly1": "rpolc(#n1,'Z',-20,20)",
                                "poly2": "rpolc(#n2,'Z',-20,20)",
                                "op": "['+','-'].random()",
                                "expr": "#poly1.toString('x')+#op+'('+#poly2.toString('x')+')'"
                            },
                            repeat: 10,
                            steps: [
                                {
                                    "type": "polynomial.operations",
                                    "formulation": "'P(x)='+#poly1.toString('x', 'html')+',  Q(x)='+#poly2.toString('x','html')+'. Calcula P(x) '+#op+' Q(x)'",
                                    "tips": "Recorda que pots sumar nombre amb nombre, x amb x, x^2 and x^2, etc."
                                }
                            ], hints: ""};
                        break;
                    case('function.elemental.type'): 
                        nquestion = {title: "Identifica les funcions elementals",
                            parameters: { 
                            },
                            repeat: 10, hints: "", type: "function.elemental.type"};
                        break;
                    case('function.limit'): 
                    nquestion = {title: "Calcula els límits",
                            parameters: { 
                                func: "(x^2-9)/(x-3)", point: "3"
                            },
                            repeat: 10, hints: "", type: "function.limit"};
                        break;
                    case('function.derivate'): 
                        nquestion = {title: "Calcula les derivades de les funcions",
                            parameters: { 
                                func: "x*cos(x)"
                            },
                            repeat: 10, hints: "", type: "function.derivative"};
                        break;
                    default:
                        nquestion = null; break;
                }
               
                if(nquestion){
                    obj.questions.push(nquestion);
                    w.src = JSON.stringify(obj, null, '\t');                   
                }
            };
            
            
            $scope.insertHTML = function(type){
                var w = $scope.tabset.activeTab;
                if(!w){
                    return;
                }
                
                var code;
                
                switch(type){ 
                    case "ytvideo":                         
                        var okcb = function(id){
                                if(id  && id.trim()){
                                    id = id.trim();
                                    code = "\t <video-embed video-id=\"'"+id+"'\" video-url=\"'https://youtu.be/"+id+
                                            "'\"  player-vars=\"playerVars\" player-width=\"playerVars.width\"  player-height=\"playerVars.height\"></video-embed>\n";
                                     w.editor.insert(code);           
                                }
                        };
                        Modals.inputdlg("Insert youtube video", "Write video ID", "", okcb);
                        break;      
                    
                    case('geogebra'): 
                        var okcb = function(id){
                                if(id  && id.trim()){
                                    id = id.trim();
                                    code = "\t  <div geogebra=\""+id+"\"></div>\n";
                                     w.editor.insert(code);           
                                }
                        };
                        Modals.inputdlg("Insert geogebra applet", "Write geogebra ID", "", okcb);
                        break;
                        
                    case('link-download'):
                        var okcb = function(id){
                                if(id  && id.trim()){
                                    id = id.trim();
                                    code = "\t   <a ng-href=\"activities/"+$scope.idActivity+"/"+id+" ng-click=\"registerSFA($event)\" target=\"_blank\"><img src=\"files/download.png\" alt=\"download\"/> "+id+"</a>\n";
                                     w.editor.insert(code);           
                                }
                        };
                        Modals.inputdlg("Insert download link", "Write file name", "", okcb);
                        break;
                        
                    case('doc-embed'):
                        var okcb = function(id){
                                if(id  && id.trim()){
                                    id = id.trim();
                                    code = "\t  <iframe src=\"https://docs.google.com/viewer?url=https://piworld.es/activities/"+$scope.idActivity+"/"+id+"&embedded=true\" width=\"700\" height=\"400\"></iframe>\n";
                                     w.editor.insert(code);           
                                }
                        };
                        Modals.inputdlg("Insert embedded document", "Write file name", "", okcb);
                        break;
                }
               
            };
            
            
                        
            $scope.insertJS = function(type){
                var w = $scope.tabset.activeTab;
                if(!w){
                    return;
                }
                
                var code;
                 
                switch(type){ 
                    case "controller": 
                        if(w.src.toLowerCase().indexOf("app.register.controller(")>=0){
                            growl.warning("This file already contains a controller");
                            return;
                        }
                        code = "<script language=\"javascript\">\n";
                        code += "\t window.pw.app.register.controller(\"theory"+$scope.idActivity+"\", [\"$scope\", function($scope){\n";
                        code += "\n\t\t $scope.questions = [];\n\n";
                        code +="\t}]);\n</script>"; 
                        
                        w.src = code + "\n\n" + w.src;
                        return;
                        
                        break;                       
                    case('question-input'): code="\t\t\t {time: \"00:00\", formulation: \"\", type: \"input\", answer: \"\" }"; break;
                    case('question-multiple'): code="\t\t\t {time: \"00:00\", formulation: \"\", type: \"multiple\", options: [ \n\t\t\t {title: \"\", valid: false}, {title: \"\", valid: false}, {title: \"\", valid: false}, {title: \"\", valid: false} \n\t\t\t ] }"; break;                    
                }
               
                if(code){
                    w.editor.insert(code);
                } 
                 
            };
            
            
            $scope.check = function(){
                var w = $scope.tabset.activeTab;
                var err;
                try{
                    JSON.parse(w.src);
                } catch(ex){
                    err = ex;
                }
                if(err){
                    Modals.notificationdlg("Source with errrors", err);
                } else {
                    growl.success("Success", "Check passed!");
                }
            };
            
            $scope.openLib = function(f)
            {
                readFile(f, "activities/libs");
            };
            
          
            var updateImporting = function(){
               var active = 0;
               for(var i=0; i<$scope.uploads.length; i++){
                   if($scope.uploads.status===0){
                       active += 1;
                   }
               }                
               $scope.uploading = active > 0;
            };
            
            
            $scope.upload = function(files, node) {
                
                if(node){
                    $scope.selectNode = node;
                }
                
                if(files===null || files.length === 0){
                    return;
                }
                 
                var type = "";
                if($scope.selectNode.server){
                    type = "server";
                }
                if($scope.selectNode.dir && $scope.selectNode.file.indexOf("libs")===0){
                    type = "libs";
                }
             
                //console.log(files);
                //console.log(node);
                
                var desc = "";
                for(var i=0; i<files.length; i++){
                    desc += node.file+"/"+files[i].name+"; ";
                }
             
                var upBean = {description: desc, progress: "0 %", status: 0};
                $scope.uploads.push(upBean);
               
                Upload.upload({
                    url: '/rest/fs/upload',
                    fields: {username: Session.getUser().username, path: node.file, type: type},
                    file: files
                    //files: files
                }).then(
                        
                    function(res){
                        $scope.reload($scope.selectNode);
                        $scope.selectNode = null;
                        $scope.importing = false;
                        if(res.data.log){
                            Modals.notificationdlg("Upload log", res.data.log);
                        }
                       upBean.status = 1;
                       upBean.progress = 'DONE'; 
                       updateImporting();

                    },
                    function(res){
                         $scope.importing = false;
                        $scope.uploadPercent = "ERROR!";
                        growl.error('Upload error. Status: ' + res.status);
                        $scope.selectNode = null;                    
                        upBean.status = -1;
                        upBean.progress = 'ERROR'; 
                        updateImporting();
                    },
                    function(evt){
                         var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);                    
                        upBean.progress = progressPercentage + '% ';    
                    }                        
                        
                ); 
             };
            
            $scope.play = function()
            {      
                var obj = {idActivity: parseInt($scope.idActivity), idAssignment: 0};                
                $state.go("home.activity", obj);
    
            };
            
            $scope.run = function()
            {
                $scope.activity = {id: $scope.idActivity, idAssignment: 0};
                $scope.showCode = !$scope.showCode;
                if($scope.showCode)
                {
                    //Destroy iframe
                    console.log("Destroying iframe....");
                    
                    pw.iframeAPI.destroy();
                    $("#btn-fullscreen").off();
                    $('#activity-iframe-test').attr("src", "about:blank");
                    window.pw.FScreen.setOnfullscreenchange(null);   
                    return;
                }
                
                var isJS = true;
              
                var e = $scope.tabset.activeTab;
                if (e.node.title.toLowerCase().indexOf(".html") >= 0 || e.node.title.toLowerCase().indexOf(".htm") > 0) {
                    isJS = false;
                    $templateCache.put("activities/test.html", e.src);
                    $scope.htmlSrc = "activities/test.html";
                }
                            
                if(!isJS){                   
                    return;
                } 
                $scope.htmlSrc = null;
                
                //Prepare iframe         
                $timeout(function(){
                    var opts = ["idAssignment=0"];
                    if($scope.runopts.debug){
                        opts.push("debug=1");
                    }
                    if($scope.runopts.test){
                        opts.push("test=1");
                    }
                    if($scope.runopts.guest){
                        opts.push("guest=1");
                    }
                    if($scope.runopts.autoplay){
                        opts.push("autoplay=1");
                    }
                    var url = "/activities/"+$scope.activity.id+"/index.html"+ (opts.length? "?": "") + opts.join("&");
                    console.log("setting url ", url);
                    var element = $('#activity-test');
                    var iframe = $('#activity-iframe-test');
                    iframe.prop("src", url);
                  
                    var btn = $("#btn-fullscreen");
                    btn.on("click", function(evt){
                        window.pw.FScreen.toggleFullscreen(element, btn);                        
                    });
                    
                    
                    window.pw.FScreen.setOnfullscreenchange(function(evt){
                        if(!window.pw.FScreen.fullscreenElement()){
                            window.pw.FScreen.exitFullscreen();
                        }
                     });
                                        
                    pw.iframeAPI.attachListener(function(evtName, msg){
                        console.log("iFrame event:: ",evtName, msg);
                    });   
                }, 1000);
                
            };
            
            
            $scope.goEditor = function(){
                
                //Try to find an appropiate editor
                if(["V", "U", "Q", "A"].indexOf($scope.activity.type)>=0){
                    $state.go("home.editactivity"+$scope.activity.type, {idActivity: $scope.idActivity});
                } else {
                    $state.go("home.editactivityA", {idActivity: $scope.idActivity});                 
                }
                
            };
            
    }]);

});
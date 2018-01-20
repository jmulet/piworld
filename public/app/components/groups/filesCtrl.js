/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
define([], function(){
"use strict";
 

window.pw.app.register.controller('FilesCtrl', ['$http', '$scope', '$rootScope', '$state', '$filter', '$uibModal', '$translate', 'Session', 
    'PwTable', 'growl', 'Upload', 'Modals', 'USER_ROLES', '$sce', '$timeout', 'clipboard', 'CONFIG', 'Idle',
    function ($http, $scope, $rootScope, $state, $filter, $uibModal, $translate, Session, PwTable, growl, Upload, Modals, USER_ROLES, $sce, $timeout, clipboard, CONFIG, Idle) {   
        
 
        Session.addCss("assets/libs/angular-ui-tree/dist/angular-ui-tree.min.css");
        Session.addCss("assets/css/flaticon/flaticon.css");
        Session.addCss("assets/css/ace.css");
        
            $scope.files = [];
            $scope.uploads = [];
            $scope.uploading = false;
            $scope.uploadPercent = "";
            var indexes = 0;
            $scope.tabset = {activeTab: null, activeTabIndex: 0};
            $scope.workspaces = [];
            $scope.group = Session.getCurrentGroup();
            $scope.user = Session.getUser();
           
            $scope.teacher = $scope.group && ($scope.group.eidRole === USER_ROLES.teacher || $scope.group.eidRole === USER_ROLES.teacheradmin) || $scope.user.idRole === USER_ROLES.teacheradmin;


            $scope.setGroup = function(g){
                $scope.group = g;
                $scope.reloadClient();
            };


            $scope.reloadClient = function () {
                $http.post('rest/fs/dir', {path: "", idGroup: $scope.group.idGroup}).then(
                        function (r) {
                            $scope.files = r.data;                              
                        }
                );
            };

            $rootScope.$on("changeGrp", function (evt, d) {
                $scope.group = d.group;
                $scope.reloadClient();
            });


            $scope.reloadClient();

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
             
                
                var desc = "";
                for(var i=0; i<files.length; i++){
                    desc += node.file+"/"+files[i].name+"; ";
                }
             
                var upBean = {description: desc, progress: "0 %", status: 0};
                $scope.uploads.push(upBean);
               
                Upload.upload({
                    url: '/rest/fs/upload',
                    fields: {username: Session.getUser().username, path: node.file, idGroup: $scope.group.idGroup, type: type},
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
                     
                    $scope.reloadClient();
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
                    Idle.watch();
                  }
                        
                );    
     
             };
            
            $scope.extFileIcon = function(node){
                var pos = node.title.lastIndexOf(".");
                if(pos){
                    var css =  "flaticon-"+node.title.toLowerCase().substring(pos+1)+"-file-format";
                    return css;
                }
                return "";
            };

            //Uploads file into selected directory
            $scope.newfile = function(node) {                
                $scope.selectDir = node.title;                
            };
            
            //Creates a new directory into directory
            $scope.newdir = function(node) {                
                var path="";
                
                var scb = function(v){
                  if(v){
                    $http.post("/rest/fs/mkdir", { idGroup: $scope.group.idGroup, path: node.file+"/"+v}).then(function(){
                        $scope.reloadClient();
                  });
                }
                };
                                    
                Modals.inputdlg("New directory","Escriu el nom del directori", path, scb);                
                
            };
            
            $scope.unzip = function(node){
                 $http.post('rest/fs/unzip', {path: node.file, idGroup: $scope.group.idGroup}).then(
                            function (r) {
                                $scope.ideLog += r.data.log + "<br>";
                                $scope.reloadClient();
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
                            $scope.msg = "Segur que voleu eliminar el fitxer o directori " + node.title;
                        }],
                    size: 's'
                });

                modalInstance.result.then(function () {

                    $http.post('rest/fs/delete', {node: node, idGroup: $scope.group.idGroup}).then(
                            function (r) {
                                $scope.ideLog += r.data.log + "<br>";
                                $scope.reloadClient();
                            })
                            , function () {
                                //dismissed
                            };
                });
            };

            $scope.renameFile = function (node)
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
                            $scope.title = "Renombrar " + node.title;
                            $scope.msg = "Escriviu el nom del fitxer o directori";
                            $scope.model = {text: node.title};
                        }],
                    size: 'sm'
                });

                modalInstance.result.then(function (confirm) {
                    var name = confirm.trim();
                    if (name.length > 0)
                    {
                        var idx = node.file.lastIndexOf("/");
                        var base = node.file.substring(0, idx);
                        var toFile = base + "/" + name;
                        $http.post('rest/fs/rename', {from: node.file,
                            to: toFile, server: false, idGroup: $scope.group.idGroup}).then(
                                function (r) {
                                    $scope.ideLog += r.data.log + "<br>";
                                    $scope.reloadClient();
                                    
                                }
                        );
                    }
                }
                , function () {
                    //dismissed
                });

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
                    if(mode==="html")
                    {
                        editor.setTheme("ace/theme/twilight");
                    }
                    
                    editor.renderer.setShowGutter(true);
                    editor.getSession().setUseWrapMode(true);
                    editor.getSession().setMode("ace/mode/"+mode);                    
                }
                //_editor.$blockScrolling =  Infinity;
                window.pw.app.DEBUG && console.log("loaded "+editor);
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
            
            $scope.copyLink = function(node){   
                var link = CONFIG.SERVERIP;
                if(link.indexOf("localhost")>=0 || link.indexOf("127.0.0.1")>=0){
                    link +=":"+CONFIG.NODE_PORT;
                }
                link += "/files/"+$scope.group.idGroup+node.file;
                clipboard.copyText(link);              
            };
            
            $scope.openFile = function(node){  
               
                var type = "doc";
                var src = $sce.trustAsResourceUrl('https://docs.google.com/gview?url=https://pw.es/files/'+$scope.group.idGroup+node.file+'&embedded=true');
                var f = node.title.toLowerCase();
                if(f.endsWith(".gif") || f.endsWith(".png") || f.endsWith(".jpg") || f.endsWith(".jpeg") || f.endsWith(".bmp")  ){
                    type = "img";
                    src = "files/"+$scope.group.idGroup+node.file;
                } 
                else if(f.endsWith(".txt") || f.endsWith(".sql") || f.endsWith(".js") || f.endsWith(".css") || f.endsWith(".html")  || f.endsWith(".htm")  || f.endsWith(".json") ||  f.endsWith(".xml") ){
                    type = "editor";
                    
                    src = "files/"+$scope.group.idGroup+node.file;
                    $http.post('rest/fs/get', {path: node.file, idGroup: $scope.group.idGroup, server: node.server}).then(
                            function (r) {  
                                var w = {node: node, type: type, index: indexes, modified: false, src: r.data.src};
                                $scope.workspaces.push(w);
                                $timeout(function(){$scope.tabset.activeTabIndex = w.index;}, 100);
                                indexes += 1;
                                $scope.tabset.activeTab = w;
                            }
                    );
                    return;
                } else if(f.endsWith(".doc") || f.endsWith(".docx") || f.endsWith(".ppt") || f.endsWith(".pptx") || f.endsWith(".xls") || f.endsWith(".xlsx")){                    
                    src = $sce.trustAsResourceUrl('https://view.officeapps.live.com/op/view.aspx?src=http://pw.es/files/'+$scope.group.idGroup+node.file);                      
                }
                 
                var w = {node: node, type: type, index: indexes, modified: false, src: src};
                $scope.workspaces.push(w);
                $timeout(function(){$scope.tabset.activeTabIndex = w.index;}, 100);
                indexes += 1;
                $scope.tabset.activeTab = w;
                
            };
            
        }]);
});
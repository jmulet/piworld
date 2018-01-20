define(["filesaver"], function(){
   
      
window.pw.app.register.controller('NotebookCtrl', ['$http', '$scope', 'growl', 'Modals', 'Upload', '$sce', '$q', '$timeout',
    function ($http, $scope,  growl,  Modals, Upload, $sce, $q, $timeout) {
         
         
            var user = Session.getUser();
            
            var globalTabIndex = 0;
            $scope.tabset = {activeTabIndex: 0, activeTab: null};
          
            $scope.create = function()
            {                    
                var success = function(name){
                    if(name.trim().length){
                        $http.post("/rest/pitex/create", {idUser: user.id, project: name}).then(function(){
                              $scope.refreshProjects();                        
                       });
                    }
                };
                
                Modals.inputdlg("Escriviu un nom", "Nom del projecte", "piTeX-Project1", success);                                
            };
            
             $scope.forceOpenProject = function(p){
                 $scope.workspaces = null;
                 $scope.openProject(p);
             };
            
            $scope.openProject = function(p){
                   $scope.currentProject = p;
                   $http.post("/rest/pitex/list", {idUser: user.id, project: p}).then(function(r){
                   var d = r.data;
                   d.files = d.files.filter(function(e){
                        var e2 = e.toLowerCase();
                        return e2.indexOf(".tex")>=0 || e2.indexOf(".jpg")>=0 || e2.indexOf(".png")>=0 || e2.indexOf(".pdf")>=0;
                   });
                   
                   d.files.forEach(function(e){                      
                       if(!d.images[e]){
                           d.images[e] = "/assets/img/file.png"; //default
                       } 
                   });
                   
                   $scope.docs = d;           
                   
                   //Create a default workspace for this project
                   if(!$scope.workspaces){
                        $scope.workspaces = [];
                              
                        //Crea un panell de log
                        $scope.logw = {type: "log", src: "", file: d, modified: false, active: false, title: 'log', index: -2};
                        $scope.outw = {type: "pdf", src: "", file: d, active: false, title: 'output', index: -1};
                       
                   } else {
                       //update docs
                       $scope.workspaces.forEach(function(w){
                           $scope.docs.sources[w.file] = w.src;
                       });
                   }
                   
                   //Open source.tex
                   $scope.openDoc("source.tex");
                });
            };
            
            $scope.removeProject = function(p){   
                
                var success = function(){
                   $http.post("/rest/fs/delete", {idUser: user.id, node: {dir:true, file: "pitex/"+p, server: true}}).then(function(){
                       if($scope.currentProject === p){
                           $scope.currentProject = null;
                           $scope.workspaces = null;
                       } 
                       $scope.refreshProjects();                        
                });
                };
                
                Modals.confirmdlgpwd("Confirm delete", "Segur que voleu eliminar el projecte "+p+"?", success);
            };
            
            $scope.renameProject = function(p){   
                
                var success = function(toProj){
                   $http.post("/rest/fs/rename", {idUser: user.id, from: "pitex/"+p, to: "pitex/"+toProj, server: true}).then(function(){                        
                       $scope.refreshProjects();                        
                   });
                };
                
                Modals.inputdlg("Rename project", "Write a name for your project:", p, success);
            };
            
            $scope.cloneProject = function(p){   
                
                   $http.post("/rest/fs/rename", {idUser: user.id, copy: true, from: "pitex/"+p, to: "pitex/"+p+"_cloned", server: true}).then(function(){                        
                       $scope.refreshProjects();                        
                   });
               
            };
            
            $scope.removeDoc = function(d){   
                
                //Prevent deleting source.tex
                if(d.toLowerCase()==="template.tex" || d.toLowerCase()==="source.tex"){
                    return;
                }
                
                var success = function(){
                   $http.post("/rest/fs/delete", {idUser: user.id, node:{dir: false, server:true, file: "pitex/"+$scope.currentProject+"/"+d} }).then(function(){
                        $scope.openProject($scope.currentProject);                        
                    });
                };
                
                Modals.confirmdlgpwd("Confirm delete", "Segur que voleu eliminar el document "+$scope.currentProject+"/"+d+"?", success);
            };
            
            //Adds a tex document in the current project
            $scope.createTeX = function(){
                 var number = 2;
                 while($scope.docs.files.indexOf("source"+number+".tex")>=0){
                    number += 1;
                 }
                     
                 $http.post("/rest/fs/put", {idUser: user.id, src: "%To include this file edit template.tex and add the command \\include{source"+number+"}\n", server:true, path: "pitex/"+$scope.currentProject+"/source"+number+".tex"} ).then(function(){
                        $scope.openProject($scope.currentProject);                        
                  });
            };
             
            
            $scope.save = function(){
                
                var activews = $scope.tabset.activeTab;
                
                if(activews && activews.type==='tex'){
                
                    $http.post("/rest/pitex/save", {idUser: user.id, project: $scope.currentProject, files: [{name: activews.file, src: activews.src}] }).then(function(r){
                       var d = r.data;
                       if(d.errs.length){
                           growl.error("Error saving file/s "+d.errs.join("; "));
                       } else {
                           activews.modified = false;
                           growl.success("File/s saved");
                           //Must update the docs object
                           $scope.docs.sources[activews.file] = activews.src;                           
                       }
                    });
                }  
            };
            
            var saveAll = function(){
                
              var defer = $q.defer();
              
              var files = [];
              jQuery.each($scope.workspaces, function(i, w){
                   if(w.type==='tex'){
                      w.modified = false;
                      files.push({name: w.file, src: w.src});
                       //Must update the docs object
                       $scope.docs.sources[w.file] = w.src;        
                   }
              });
             
             if(files.length){
                  $http.post("/rest/pitex/save", {idUser: user.id, project: $scope.currentProject, files: files }).then(function(r){
                      var d = r.data;
                      if(d.errs.length){
                           growl.error("Error saving file/s "+d.errs.join("; "));
                       }
                        defer.resolve();
                  });
             } else{
                 defer.resolve();
             }
              
             return defer.promise;
                
            };
            
            $scope.pandoc = function(type){
                
                 //If src does not contain begin document, then use as file source.tex
                var activews = $scope.tabset.activeTab;
                var f = 'template.tex';
                if(activews && activews.type==='tex'){
                    f = activews.src.toLowerCase().indexOf("\\begin{document}")<0? 'template.tex' : activews.file;
                }
                
                
                var req = {url: "/rest/pitex/pandoc",
                    data: {idUser: user.id, project: $scope.currentProject, file: f, type: type},
                    method: 'POST',
                    responseType: 'arraybuffer'
                };
                
                
                saveAll().then(function(){
                        $http(req).then(
                                function(data)
                                {
                                    var mime = "application/text";
                                    if (type === 'odt')
                                    {
                                        mime = "application/vnd.oasis.opendocument.text";
                                    }
                                    else if (type === 'docx')
                                    {
                                        mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                                    }
                                    else if (type === 'pdf')
                                    {
                                        type = "application/pdf";
                                    }
                                    else
                                    {
                                        type = "application/octet-stream";
                                    }
                                    var blob = new Blob([data], {type: mime});
                                    saveAs(blob, $scope.currentProject+ "."+type);
                                });                                    
                            });
            };
            
            
            $scope.project = function(){
                 
                 var req = {url: "/rest/pitex/zip",
                    data: {idUser: user.id, project: $scope.currentProject},
                    method: 'POST',
                    responseType: 'arraybuffer'
                };
                $http(req).then(
                        function(data)
                        {
                            var blob = new Blob([data], {type: 'application/zip'});
                            saveAs(blob, $scope.currentProject+ ".zip");
                        });
                   
            };
            
            $scope.pdf = function(saveit){
                
                //If src does not contain begin document, then use as file source.tex
                var activews = $scope.tabset.activeTab;
                var f = 'template.tex';
                if(activews && activews.type==='tex'){
                    f = activews.src.toLowerCase().indexOf("\\begin{document}")<0? 'template.tex' : activews.file;
                }
           
                //makesure it saves all modified files
                saveAll().then(function(){
                $http.post("/rest/pitex/makepdf", {idUser: user.id, project: $scope.currentProject, file: f}).then(function(r){
                    var d = r.data;
                    $scope.logw.src = d.log;
                    
                   if(d.pdf){
                       growl.success("PDF sucessfully generated.");
                       $scope.tabset.activeTabIndex=-1;
                   } else {
                       growl.error("Error generating PDF. Check log.");
                       $scope.tabset.activeTabIndex=-2;
                   }
                    
                    //If generated, download the actual pdf
                    if(d.pdf){
                        var req = {url: "/rest/pitex/getpdf",
                        data: {idUser: user.id, project: $scope.currentProject, file: f},
                        method: 'POST',
                        responseType: 'arraybuffer'
                    };
                    $http(req).then(
                            function(data)
                            {
                                var blob = new Blob([data], {type: 'application/pdf'});                            
                                $scope.outw.src = $sce.trustAsResourceUrl(URL.createObjectURL(blob));                           
                                if(saveit){saveAs(blob, $scope.currentProject+ ".pdf");}
                            });
                        }
                    });
          
                });
                
                };
            
            
            $scope.refreshProjects = function(){
                $http.post("/rest/pitex/projects", {idUser: user.id}).then(function(r){
                   $scope.projs = r.data; 
                });
            };
            
            $scope.upload = function(file){
               if(file===null){
                    return;
                }
                  
               $scope.importing = true;  
                Upload.upload({
                    url: '/rest/pitex/upload',
                    fields: {idUser: user.id, project: $scope.currentProject},
                    file: file
                }).then(
                  function(res){
                     $scope.uploadPercent = "";
                     $scope.openProject($scope.currentProject);
                     $scope.importing = false;
                  },
                  function(res){
                    $scope.importing = false;
                    $scope.uploadPercent = "ERROR!";
                    growl.error('Upload error. Status: ' + res.status); 
                  },
                  function(evt){
                    var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                    //console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
                    $scope.uploadPercent = progressPercentage + '% ';     
                  }                        
                );
                    
             };
            
            $scope.closeTab = function(w){
                if (w.type === 'log' || w.type === 'pdf') {
                    return;
                }

                var idx = $scope.workspaces.indexOf(w);
                var ccb = function () {
                    $scope.workspaces.splice(idx, 1);
                };

                if (w.modified)
                {
                    var okcb = function () {
                        $scope.save();
                    };
                    Modals.confirmdlg("File changed", "Save changes of " + w.title + "?", okcb, ccb);
                } else {
                    ccb();
                }

               
                
            };
            
            $scope.aceLoaded = function(editor){
                  var w = $scope.tabset.activeTab;
                  if(w){
                    var mode = "javascript";
                    if (w.title.toLowerCase().endsWith(".js"))
                    {
                        mode = "javascript";
                    } 
                    else if (w.title.toLowerCase().endsWith(".tex"))
                    {
                        mode = "latex";
                    }
                    else
                    {
                        var i = w.title.lastIndexOf(".");
                        mode = w.title.toLowerCase().substring(i + 1);
                    }
                    if(mode==="html")
                    {
                        editor.setTheme("ace/theme/twilight");
                    }
                    
                    editor.renderer.setShowGutter(true);
                    editor.getSession().setUseWrapMode(true);
                    editor.getSession().setMode("ace/mode/"+mode);

                    w.editor = editor;       
                    editor.getSession().on('change', function(evt){
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
            };
            
            $scope.onTabSelect = function(w){
                $scope.tabset.activeTab = w;
            };
            
            $scope.openDoc = function(d){                
                var image = d.toLowerCase().indexOf(".png")>0 || d.toLowerCase().indexOf(".jpg")>0;
                
                if(d.toLowerCase().indexOf(".tex")>0 || image){
                    
                var found = false;
                jQuery.each($scope.workspaces, function(i,w){
                    if(w.file===d){
                        found=true;
                        $scope.tabset.activeTabIndex = w.index;
                        return true;
                    }
                });
              
                if(!found)
                {            
                    var w = {type: image?'img':'tex', src: image? $scope.docs.images[d] : $scope.docs.sources[d], file: d, modified: false, index: globalTabIndex, title: d};
                    $scope.workspaces.push(w);
                    globalTabIndex += 1;
                    $scope.tabset.activeTab = w;
                    $timeout(function(){
                        $scope.tabset.activeTabIndex = w.index; 
                    }, 100);
                    
                }
                }
            };
            
            $scope.insertFormula = function(type){
                
                var w = $scope.tabset.activeTab;
                if(w){
                    
                    var text;
                    switch(type){
                        case("system2"): text= "\\left\\{  \\begin{array}{ll} \n\t\t x + y &= 1 \\\\ \n\t\t x - y &= 0 \n\t \\end{array}  \\right ."; break;
                        case("system3"): text= "\\left\\{  \\begin{array}{ll} \n\t\t x + y +z &= 2 \\\\ \n\t\t x - y &= 0 \\\\ \n\t\t  - 2y + z &= 2 \n\t \\end{array}  \\right ."; break;
                        case("matrix3"): text= "\\left(  \\begin{array}{ccc} \n\t\t 1 & 0 & 0 \\\\ \n\t\t 0 & 1 & 0 \\\\ \n\t\t  0 & 0 & 1 \n\t \\end{array}  \\right)"; break;
                        case("det3"): text= "\\left|  \\begin{array}{ccc} \n\t\t 1 & 0 & 0 \\\\ \n\t\t 0 & 1 & 0 \\\\ \n\t\t  0 & 0 & 1 \n\t \\end{array}  \\right|"; break;
                        
                        case("picelikewise"): text= "f(x) = \\left\\{  \\begin{array}{ll} x^2 - 4 & si\\,\\, x < 1  \\\\ \n\t\t 1/x & si\\,\\, x \\ge 1 \n\t \\end{array}  \\right ."; break;    
                        case("limit"): text= "\\lim_{x \\to +\\infty} \\frac{3x^2 +7x^3}{x^2 +5x^4} = 3"; break;
                        case("derivate"): text= "\\frac{dy}{dx}"; break;
                        case("integral"): text= "\\int_a^b f(x)\\,dx"; break;                        
                    }
                    if(text){
                        w.editor.insert("\\begin{equation*}\n\t "+text+" \n\\end{equation*}");
                    }
                }
            };
            
            $scope.insertTable = function(){
              
                
                var cols = 4;
                var rows = 4;
                
                var tex = [];
                tex.push("\\begin{table}[ht]");
                tex.push("\\centering % used for centering table");
                var row = "|";
                for(var i=0; i<cols; i++){
                    row += "c|";
                }
                tex.push("\\begin{tabular}{"+row+"}");
                tex.push("\\hline");
                row = "";
                sep = "";
                for(var j=0; j<cols; j++){
                        row += sep + "Col"+(j+1);
                        sep = " & ";
                }
                tex.push(row + " \\\\ [0.5ex] % inserts table %heading");
                tex.push("\\hline \\hline %inserts double horizontal lines");
                for(var i=0; i<rows; i++){
                    var row = "";
                    var sep = "";
                    for(var j=0; j<cols; j++){
                        row += sep + "x"+(i+1)+""+(j+1);
                        sep = " & ";
                    }
                        tex.push(row + " \\\\ \\hline ");
                }          
                tex.push("\\end{tabular}");
                tex.push("\\end{table}");


                var w = $scope.tabset.activeTab;
                if (w) {
                    w.editor.insert(tex.join("\n"));
                }

            };
            
            $scope.refreshProjects();
         
        }]);

});
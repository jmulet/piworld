
define(['filesaver'], function(){
    "use strict";
    window.pw.app.register.controller('ActivitySheetCtrl', ['$scope','$rootScope','ActivitySrv','$http','$filter','$transition$', '$q',
        'ActivityBase', 'client', 'server', 'Session',
        function($scope, $rootScope, ActivitySrv, $http, $filter, $transition$, $q, QPBase, client, server, Session){
            
                $scope.totalQ = 0;
                var labels = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","y","z"];
                $scope.loading = false;
               
                //You can pass an array of ids activities
                var ids = $transition$.params().idActivities+"";
                var list_ids = ids.split("-");
                
                
                var questionsTeX, views;
                
                $scope.generate = function(){
                 
                $scope.loading = true;
                questionsTeX = [];
                $scope.questions = [];
                views = {};
                 
                list_ids.forEach(function(id){
                    
                    var path = "activities/" + id + "/QProvider.min.js";
                    ActivitySrv.i18n(id).then(function(i18n){ 
                    //Lazy load controller in order to have access to the QuestionProvider
                    requirejs([path], function (getQPInstance) {
                        var implementation = getQPInstance(client, server);
                        var Klass = QPBase.extend(implementation);
                        var QP = new Klass();
                        QP.setRest(false);
                        
                       var resolveReject = function(){
                          //Now everything has been resolved in QP!
                           QP._generatedQuestions.forEach(function(question){
                               var obj1 = { headingHTML: question.headingHTML, steps:[]};
                               var obj2 = { headingLaTeX: question.headingLaTeX, steps:[]};
                               $scope.questions.push(obj1);
                               questionsTeX.push(obj2);
                               question._registeredSteps.forEach(function(step){
                                   if(question.expr.type==='multiple' && question.expr.options){
                                       step.formulationHTML += "<br><table><tr>";
                                       jQuery.each(question.expr.options, function(kk, op){
                                          step.formulationHTML += "<td style='padding-left:40px'> (" +labels[kk % 24] + ") " +op.text+ "</td>"; 
                                       });
                                       step.formulationHTML += "</tr></table>";
                                       
                                       step.formulationLaTeX += "\n \\begin{tabular}{"+"l ".repeat(question.expr.options.length)+"}\n";
                                       var sep = "";
                                       jQuery.each(question.expr.options, function(kk, op){
                                          step.formulationLaTeX += sep + " ("+labels[kk % 24] + ")   " +op.text.html2latex(); 
                                          sep = " & ";
                                       });
                                       step.formulationLaTeX += "\n\\end{tabular}\n";
                                   }
                                   obj1.steps.push({answerHTML: step.answerHTML, formulationHTML: step.formulationHTML}); 
                                   obj2.steps.push({answerLaTeX: step.answerLaTeX, formulationLaTeX: step.formulationLaTeX}); 
                                   for(var idView in step.views){
                                       views[idView+"_"+question.id] = step.views[idView];
                                   }
                               });
                           });
                                                      
                           $scope.loading = false;
                       };   
                       
                       var resolveSuccess = function(question) {                           
                              QP.create().then(resolveSuccess, resolveReject);
                       };
                       
                       var success = function(){
                           QP.create().then(resolveSuccess, resolveReject);
                       };
                       
                       var error = function(){
                           $scope.loading = true;
                           console.log("Can't resolve this activity!");
                       };
                       
                       QP.setIds(id, 0, Session.getCurrentGroup().idGroup, Session.getCurrentGroup().idSubject, Session.getUser().id);       
                       QP.setScope($scope).then(success, error);
                        
                       
                       
                    });
                });
                
                });
            };

            $scope.generateDocument = function (toFormat)
            {
                $scope.loading = true;
                var req = {url: 'rest/reports/activitySheet',
                    data: {type: toFormat, questions: questionsTeX, views: views},
                    method: 'POST',
                    responseType: 'arraybuffer'
                };
                $http(req).then(
                        function (data)
                        {
                            var type = "application/text";
                            if (toFormat === 'odt')
                            {
                                type = "application/vnd.oasis.opendocument.text";
                            }
                            else if (toFormat === 'docx')
                            {
                                type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                            }
                            else if (toFormat === 'pdf')
                            {
                                type = "application/pdf";
                            }
                            else
                            {
                                type = "application/octet-stream";
                            }
                            var blob = new Blob([data], {type: type});
                            var ran = Math.floor(Math.random() * 1000000);
                            saveAs(blob, "imaths-sheet-act" + $transition$.params().idActivities+ "-" + ran + "." + toFormat);
                            $scope.loading = false;
                            
                        }
                                
                );
            };

            $scope.generate();
            
            $rootScope.$on("changeLang", function(evt, d){
                $scope.generate();
            });
        }]);

        
});
 
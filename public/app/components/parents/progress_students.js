//
// Parents home dash "https://www.gstatic.com/charts/loader.js"
define(["https://www.gstatic.com/charts/loader.js", "jquery-draggable", "mobile-dnd"], function(){  
    'use strict';
 
    function validateEmail(email) 
    {
        var re = /\S+@\S+\.\S+/;
        return re.test(email);
    }
 
    var BADGES_TYPES = {
       FA: 400,
       RE: 401,
       ATTENDANCE: [400, 401],
       HOMEWORK: [200, 201, 300],
       CLASSWORK: [202, 203, 304],
       BEHAVIOUR: [303, 302, 301, 204, 205, 305]
   };

    var i18n_badges = {
            ca: {
                1: "Comentaris",
                2: "Regularitat",
                3: "Millor de la setmana",
                4: "Millor del mes",
                5: "Repte de la setmana",
                50: "Guanyador d'un Kahoot",
                100: "Especial de Nadal",
                101: "Especial de Pasqua",
                200: "Deures fets completament",
                201: "Deures fets",
                202: "Treballa molt bé en classe ",
                203: "Treballa en classe",
                204: "Participa, presta atenció",
                205: "Surt a la pissarra",
                300: "No ha fet els deures",
                301: "Xerra i/o molesta",
                302: "No duu el material necessari",
                303: "Falta greu de comportament",
                304: "No treballa a classe",
                305: "Passiu, no presta atenció",
                400: "Falta a classe",
                401: "Falta puntualitat"
            },
            es: {
                1: "Comentarios",
                2: "Regularidad",
                3: "Mejor de la semana",
                4: "Mejor del mes",
                5: "Reto de la setmana",
                50: "Ganador de un Kahoot",
                100: "Especial de Navidad",
                101: "Especial de Pascua",
                200: "Deberes hechos correctamente",
                201: "Deberes hechos",
                202: "Trabaja muy bien en clase",
                203: "Trabaja en clase",
                204: "Participa, presta atención",
                205: "Sale a la pizarra",
                300: "No ha hecho los deberes",
                301: "Habla y/o molesta",
                302: "No trae el material necesario",
                303: "Falta grave de comportamiento",
                304: "No trabaja en clase",
                305: "Passivo, no presta atención",
                400: "Falta a clase",
                401: "Falta de puntualidad"
            },
            en:{
                1: "Comments",
                2: "Regularity",
                3: "Best of the week",
                4: "Best of the month",
                5: "Week challenge",
                50: "Kahoot winner",
                100: "Xmas special badge",
                101: "Easter special badge",
                200: "Homework correctly done",
                201: "Homework done",
                202: "Works very well in class",
                203: "Works in class",
                204: "Participates, pays attention",
                205: "Blackboard exercise",
                300: "Homework not done",
                301: "Speaks and / or annoys",
                302: "Does not bring the required material",
                303: "Very bad behaviour",
                304: "Does not work in class",
                305: "Passive, does not pay attention",
                400: "Class absence",
                401: "Late to class"
            }
    };


    var LANGDEFAULT = "ca";

    var i18n = {
        ca: {
            PENDING: 'Pendent',
            NOGRADE: 'No avaluat',
            DAYNAME: ["Dl", "Dt", "Dm", "Dj", "Dv"],
            DEARFAMILY: "Benvolguda família de l'alumne/a",
            AYWF: "Us faig arribar el resum setmanal de la matèria",
            BESTWISHES: "Atentament",
            DAY: "Dia",
            TERM: "Avaluació",
            ACTIVITY: "Activitat",
            GRADE: "Nota",
            GRADES: "Notes",
            MESSAGES: "Missatges",
            SUBJECTEMAIL: "Seguiment. Setmana",
            FURTHERINFO: "Recordau que podeu consultar en qualsevol moment la informació a través del portal <a href='https://piworld.es'>https://piworld.es</a> amb les credencials que us varem propocionar",
            FURTHERINFO2: "Recordau que podeu consultar en qualsevol moment la informació a través del portal https://piworld.es amb les credencials que us varem propocionar",
            SUMMARY: "Resum",
            SUBJECT: "Matèria",
            NODAY: "Cap dia",
            NEVER: "Mai",
            WEEKPROGRESS: "Evolució setmanal",
            ITEM: "Aspecte",
            FA: "Falta a classe",
            RE: "Retard",
            HOMEWORK: "Deures",
            CLASSWORK: "Feina a classe",
            BEHAVIOUR: "Comportament",
            NOHOMEWORK: "No duu els deures",
            NOCLASSWORK: "No fa feina a classe",
            BADBEHAVIOUR: "Mal comportament",
            GRADE0: "No avaluat o nota neutre",
            GRADEN: "Nota negativa",
            GRADEP: "Nota positiva",
            PROGRESSOF: "Avaluació de l'alumne/a",
            INSUBJECT: "en la matèria",
            OFYEAR: "del curs",
            MEANING: "Significat",
            FREQUENCY: "Freqüència",
            MESSAGE: "Missatge",
            CHECKEMAIL: "Reviseu el camp correu electrònic.",
            CONFIGUPDATED: "S'ha desat la configuració",
            CONFIGERROR: ":-(  Upps! No s'han pogut desar la configuració.",
            NOACTIVITIES: "No s'han trobat activitats",
            NOMESSAGES: "No hi ha missatges"
        },

        es:{
            PENDING: 'Pendiente',
            NOGRADE: 'No evaluado',
            DAYNAME: ["Lu", "Ma", "Mi", "Ju", "Vi"],
            DEARFAMILY: "Querida familia del alumno/a",
            AYWF: "Les mando un resumen semanal de la materia",
            BESTWISHES: "Atentamente",
            DAY: "Día",
            TERM: "Evaluación",
            ACTIVITY: "Actividad",
            GRADE: "Nota",
            GRADES: "Notas",
            MESSAGES: "Mensajes",
            SUBJECTEMAIL: "Seguimento. Setmana",
            FURTHERINFO: "Recordad que podeis consultar en cualquier momento la información a través del portal <a href='https://piworld.es'>https://piworld.es</a> con las credenciales que os dimos",
            FURTHERINFO2: "Recordad que podeis consultar en cualquier momento la información a través del portal https://piworld.es con las credenciales que os dimos",
            SUMMARY: "Resumen",
            SUBJECT: "Materia",
            NODAY: "Ningun dia",
            NEVER: "Nunca",
            WEEKPROGRESS: "Evolución semanal",
            ITEM: "Aspecto",
            FA: "Falta a clase",
            RE: "Retraso",
            HOMEWORK: "Deberes",
            CLASSWORK: "Trabaja a classe",
            BEHAVIOUR: "Comportamiento",
            NOHOMEWORK: "No trae los deberes",
            NOCLASSWORK: "No trabaja en clase",
            BADBEHAVIOUR: "Mal comportamiento",
            GRADE0: "No evaluado o nota neutra",
            GRADEN: "Nota negativa",
            GRADEP: "Nota positiva",
            PROGRESSOF: "Evaluación del alumno/a",
            INSUBJECT: "en la materia",
            OFYEAR: "del curso",
            MEANING: "Significado",
            FREQUENCY: "Frecuencia",
            MESSAGE: "Mensaje",
            CHECKEMAIL: "Revisad el campo correo electrónico.",
            CONFIGUPDATED: "Se ha guardado la configuración",
            CONFIGERROR: ":-(  Upps! No se ha podido guardar la configuración",
            NOACTIVITIES: "No se han encontrado actividades",
            NOMESSAGES: "No hay mensajes"
        },

        en: {
            PENDING: 'Pending',
            NOGRADE: 'No grade',
            DAYNAME: ["Mo", "Tu", "Wd", "Th", "Fr"],
            DEARFAMILY: "Dear family of the student",
            AYWF: "Attached you will find a weekly summary of the subject",
            BESTWISHES: "Best wishes",
            DAY: "Day",
            TERM: "Term",
            ACTIVITY: "Activity",
            GRADE: "Grade",
            GRADES: "Grades",
            MESSAGES: "Messages",
            SUBJECTEMAIL: "Progress. Week",
            FURTHERINFO: "Please remember that you will find further information at <a href='https://piworld.es'>https://piworld.es</a>. Login credentials are required",
            FURTHERINFO2: "Please remember that you will find further information at https://piworld.es. Login credentials are required",
            SUMMARY: "Summary",
            SUBJECT: "Subject",
            NODAY: "Never",
            NEVER: "Never",
            WEEKPROGRESS: "Weekly progress",
            ITEM: "Item",
            FA: "Class absences",
            RE: "Late to class",
            HOMEWORK: "Homework",
            CLASSWORK: "Classwork",
            BEHAVIOUR: "Behaviour",
            NOHOMEWORK: "No homework handed",
            NOCLASSWORK: "No work at class",
            BADBEHAVIOUR: "Bad behaviour",
            GRADE0: "No grade or neutral grade",
            GRADEN: "Negative grade",
            GRADEP: "Positive grade",
            PROGRESSOF: "Grades of the student",
            INSUBJECT: "in the subject",
            OFYEAR: "of the academic year",
            MEANING: "Meaning",
            FREQUENCY: "Frequency",
            MESSAGE: "Message",
            CHECKEMAIL: "Please check email field",
            CONFIGUPDATED: "The configuration has been saved",
            CONFIGERROR: ":-(  Upps! An error occurred while saving the configuration",
            NOACTIVITIES: "No activities found",
            NOMESSAGES: "There are no messages"
        }
    };

    var geti18n = function(key, lang){
       var x = i18n[lang]  || i18n[LANGDEFAULT];
       return x[key] || key;
    };

 
    var DateFormater = function(date){
        
        if(typeof(date)==="string"){
            this.date= new Date(date);
        } else {
            this.date = date;
        }
    };
    
    DateFormater.prototype = {
        mysql: function(){
            return this.date.toISOString().slice(0, 10).replace('T', ' ');
        },
        local: function(){
            var arr = this.date.toLocaleString().split(",");
            return arr[0];
        },
        curt: function(delim){
            if(!delim){
                delim = "/";
            }
            if(!this.date){
                return "";
            }
            return this.date.getDate()+delim+(this.date.getMonth()+1)+delim+this.date.getFullYear();
        },
        parse: function(_date,_format,_delimiter)
        {
            if(!_delimiter){
                if(_date.indexOf("/")>0){
                    _delimiter = "/";
                } else {
                    _delimiter = "-";
                }
            }
            _format = _format || "dd"+_delimiter+"mm"+_delimiter+"yyyy";            
            var formatLowerCase=_format.toLowerCase();
            var formatItems=formatLowerCase.split(_delimiter);
            var dateItems=_date.split(_delimiter);
            var monthIndex=formatItems.indexOf("mm");
            var dayIndex=formatItems.indexOf("dd");
            var yearIndex=formatItems.indexOf("yyyy");
            var month=parseInt(dateItems[monthIndex]);
            month-=1;
            this.date = new Date(dateItems[yearIndex],month,dateItems[dayIndex]);     
            this.date.setHours(12);
            return this;
        }
    };

    //Inici i final de curs    
    var dayIni = (2000+pw.currentYear)+ "-09-10";
    var dayEnd = (2001+pw.currentYear)+ "-09-10";
    
   var showGrade = function(grade, lang){
        lang = lang || "ca";
        if(grade>=0){
            return grade;
        }
        else if(grade===-1){
            return geti18n("PENDING");
        }
        else if(grade===-2){
            return geti18n("NOGRADE");
        }
        return "";
}   ; 

    window.pw.app.register.factory("ParentsRest", function(){
       
        var Rest = {
            //List badges of idUser. If day, of that day, if day2 in this interval
           badges: function(idUser, idGroup, day, day2){       
                var obj = {idUser: idUser, idGroup: idGroup || 0, day: day, day2: day2};
                return $.ajax({
                    type: "POST",
                    url: "/rest/badges/list",
                    data: JSON.stringify(obj),
                    contentType: "application/json"});             
            },
            listActivities: function(idCreator, idGroup, idUser, day1, day2){
                var obj = {idCreator: idCreator, idGroup: idGroup, idUser: idUser, day: day1, day2: day2, visible: 1};
                return $.ajax({
                    type: "POST",
                    url: "/rest/pda/activities/list",
                    data: JSON.stringify(obj),
                    contentType: "application/json"});    
            },
            listComments: function(idFrom, idTo, idGroup){
                // XatGroup 1 also includes shared messages to group
                var obj = {idUser: idFrom, isFor: idTo, idGroup: idGroup, parents: 1, xatGroup: 1};
                return $.ajax({
                    type: "POST",
                    url: "/rest/chats/list",
                    data: JSON.stringify(obj),
                    contentType: "application/json"}); 
            }
        };
      
        return Rest;
    });
 
    window.pw.app.register.controller('StudentsProgressController', [ '$scope', '$rootScope', 'Session', 
    'ParentsRest', '$timeout', '$translate', '$uibModal', '$http', 'growl',
    function($scope, $rootScope, Session, rest, $timeout, $translate, $uibModal, $http, growl) {
         
        $scope.status = {};
        $scope.user = Session.getUser();
        var group = $scope.user.groups[0];
        $scope.selectedGroup = Session.getCurrentGroup() || group;
        
        var lang = $scope.user.uopts.parentsMailLang;
        if(lang){
            $translate.use(lang);
        } 
 
        $scope.i18n = {};
        $scope.internationalize = function(){
            var lang = $translate.use();
            var x = i18n[lang] || i18n["ca"];
            $.each(Object.keys(x), function(i, key){
                $scope.i18n[key] = x[key] || key;
            });                           
        };
        $scope.internationalize();
 
        $scope.logout = function(){
            Session.logout();               
        };

        google.charts.load("current", {packages:["calendar"]});
        google.charts.setOnLoadCallback(update);
        
        function update(){
             $("#view-informes-calendars").show();
             doStatistics();
        };
        
        $scope.hideDetails = function(){
            $scope.selectedDay = null;
            $('#badgeDetail').css("visibility", "hidden");
        };
        
        $scope.badgeDescription = function(type){
          var lang = $translate.use();
          var desc = "Badge";
          return (i18n_badges[lang] || {} )[type] || desc;
        };  
        
        $scope.update = function(g){
             $scope.selectedGroup = g;
             dayIni = (2000+g.groupYear)+ "-09-10";
             dayEnd = (2001+g.groupYear)+ "-09-10";
             group = g;
             $scope.selectedDay = null;
             $('#badgeDetail').css("visibility", "hidden");
             update();
        };
        
        $rootScope.$on("changeLang", function(lang){
            $scope.internationalize();
            update();
        });
     

    var drawChart = function(id, title, rows, details, min, max) {      
       
       var dataTable = new google.visualization.DataTable();
       dataTable.addColumn({ type: 'date', id: 'Date' });
       dataTable.addColumn({ type: 'number', id: 'Aspect' });
       dataTable.addRows(rows);
 
       var chart = new google.visualization.Calendar(document.getElementById(id));

       var options = {
         title: title,
         height: 350,
         calendar: {
            daysOfWeek: 'DLMMJVS'
        },
        colorAxis:{
            minValue: min,
            maxValue: max
        }
       };

       chart.draw(dataTable, options);
       
        if(details){
             var selectHandler = function() {          
               var select = chart.getSelection();           
               if(select.length && select[0].row>=0){                  
                   var n = select[0].row;
                   var date = new DateFormater(new Date(select[0].date)).curt();
                   var list = details[n];
                   $timeout(
                           function(){
                               $scope.selectedDay = {date: date, list: list};
                               $('#badgeDetail').css("visibility", "");
                           }
                   );                                 
               } else {
                   $timeout(
                           function(){
                               $scope.selectedDay = null;
                               $('#badgeDetail').css("visibility", "hidden");
                           }
                   );                                
               }
             };
             
             google.visualization.events.addListener(chart, 'select', selectHandler);
         }
        
   };
   

   function doStatistics(){
       
        var user = $scope.user;
        //Take day1 as start of academic year  
        var day2 = new DateFormater(new Date()).mysql();

        rest.badges(user.id, group.idGroup, dayIni, day2).then( function(data) {
        
        //Agrupa les dades per dia
        
        var rows1 = [];
        var rows2 = {};
        var rows3 = {};
        var rows4 = {};
        var details2 = {};
        var details3 = {};
        var details4 = {};
        
        var days = [];
        var years = [];
        var daysClasswork = [];
        var daysHomework = [];
        var nFA = 0;
        var nRE = 0;
        var nCasa = 0;      //Aquests compten els pics que no... és a dir, score < 0
        var nClasse = 0;
        var nComportament = 0; 
        
        $.each(data, function(i, e){
          
            if(e.type>=200){
                var fecha = new Date(e.day);
                var year = fecha.getFullYear();
                
                if(years.indexOf(year) < 0) {
                    years.push(year);
                }
                
                if(days.indexOf(e.day)<0){
                    days.push(e.day);
                }
            
                var d = new Date(e.day);
                                
                if(BADGES_TYPES.ATTENDANCE.indexOf(e.type)>=0){                           //Assistencia
                    if(e.type===400){
                        nFA += 1;
                    } else {
                        nRE += 1;
                    }
                    rows1.push([d, e.rscore ]);                
                }                
                else if(BADGES_TYPES.CLASSWORK.indexOf(e.type)>=0){    //Classe
                                           
                    if(daysClasswork.indexOf(e.day)<0){
                        daysClasswork.push(e.day);
                    }    
                    
                    var list = rows2[e.day];
                    if(!list){
                        list = [d, 0];
                        rows2[e.day] = list;
                    }
                    if(e.rscore<0){
                        nClasse += 1;
                    }
                    list[1] += e.rscore;
                    
                    var list2 = details2[e.day];
                    if(!list2){
                        list2 = [];
                        details2[e.day] = list2;
                    }
                    list2.push(e);
                    
                }
                else if(BADGES_TYPES.HOMEWORK.indexOf(e.type)>=0){    //Casa
                    
                    if(daysHomework.indexOf(e.day)<0){
                        daysHomework.push(e.day);
                    }            
                    
                    var list = rows3[e.day];
                    if(!list){
                        list = [d, 0];
                        rows3[e.day] = list;
                    }
                    if(e.rscore<0){
                        nCasa += 1;
                    }
                    list[1] += e.rscore;
                    
                    var list2 = details3[e.day];
                    if(!list2){
                        list2 = [];
                        details3[e.day] = list2;
                    }
                    list2.push(e);
                }
                else if(BADGES_TYPES.BEHAVIOUR.indexOf(e.type)>=0){    //Comportament
                    var list = rows4[e.day];
                    if(!list){
                        list = [d, 0];
                        rows4[e.day] = list;
                    }
                    if(e.rscore<0){
                        nComportament += 1;
                    }
                    list[1] += e.rscore;
                    
                    var list2 = details4[e.day];
                    if(!list2){
                        list2 = [];
                        details4[e.day] = list2;
                    }
                    list2.push(e);
                }
            }
        });
        
        
        var total = days.length;
        var nyears = years.length || 1;
        var totalHomework = daysHomework.length;
        var totalClasswork = daysClasswork.length;
        nCasa = totalHomework - nCasa;
        nClasse = totalClasswork - nClasse;
        var tpc1 , tpc2  , tpc3, tpc4, tpc5 = '';
        if(total > 0){
            //Puc calcular percentatges
            tpc1 = '  ('+ Math.round(nFA*100/total)+ '%)';
            tpc2 = '  ('+ Math.round(nRE*100/total)+ '%)';
            tpc3 = '  ('+ Math.round(nClasse*100/totalClasswork)+ '%)';
            tpc4 = '  ('+ Math.round(nCasa*100/totalHomework)+ '%)';
            tpc5 = '  ('+ Math.round(nComportament*100/total)+ '%)';
        }
        
        $("#fa-total").html(nFA + tpc1);
        $("#re-total").html(nRE + tpc2);
        $("#casa-total").html(nCasa + tpc4);
        $("#classe-total").html(nClasse + tpc3);
        $("#comportament-total").html(nComportament + tpc5); 
        
        //Converteix les dades a llistes de dues columnes
        
        //Abans de dibuixar els calendaris s'ha de comprovar si hi ha 1 o més anys
        //perque la mida vertical dels div s'ha de duplicar.
        $("#calendar_faltes").css("height", 200*nyears+"px");
        $("#calendar_classe").css("height", 200*nyears+"px");
        $("#calendar_deures").css("height", 200*nyears+"px");
        $("#calendar_comportament").css("height", 200*nyears+"px");
        
        drawChart('calendar_faltes', $scope.i18n.FA+" & "+$scope.i18n.RE, rows1, null, -5, 0);
        drawChart('calendar_classe', $scope.i18n.CLASSWORK, Object.values(rows2), Object.values(details2), -20, 20);
        drawChart('calendar_deures', $scope.i18n.HOMEWORK,  Object.values(rows3), Object.values(details3), -20, 20);
        drawChart('calendar_comportament', $scope.i18n.BEHAVIOUR,  Object.values(rows4), Object.values(details4), -50, 20);
        
      });       
        
      
 
      rest.listActivities(group.idUserCreator, group.idGroup, user.id, dayIni, dayEnd).then(function(data){
            var tbody = "";
            $.each(data, function(i, d){
                
                var dia = new Date(d.dia);
                var diaStr =dia.getDate()+"-"+(dia.getMonth()+1)+"-"+dia.getFullYear();
                 
                tbody += "<tr><td>"+d.trimestre+"</td><td>"+diaStr+"</td><td>"+d.desc+"</td><td>"+
                        showGrade(d.grade)+"</td></tr>";               
            });
            if(!data.length){
                tbody +='<tr><td colspan="4"><i>'+geti18n("NOACTIVITIES")+'</i></td></tr>';
            }
            $("#tbody-activitats").html(tbody);
        
      });
     
           
     
      rest.listComments(group.idUserCreator, user.id, group.idGroup).then(function(data){
            var tbody = "";
            $.each(data, function(i, d){
                var dia = new Date(d.when);
                var diaStr =dia.getDate()+"-"+(dia.getMonth()+1)+"-"+dia.getFullYear();                
                tbody += "<tr><td>"+diaStr+"</td><td>"+d.msg+"</td></tr>";               
            });
            if(!data.length){
                tbody +='<tr><td colspan="4"><i>'+geti18n("NOMESSAGES")+'</i></td></tr>';
            }
            $("#tbody-missatges").html(tbody);
        
      });
          
   };
      
    $timeout(function(){
        $('#badgeDetailHandler').draggable();
    }, 2000);

        
        
    $rootScope.adjustPadding();
    }]);


});
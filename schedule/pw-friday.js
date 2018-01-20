/**
 * 
 * Aquest schedule s'activa els divendres quan acaben les classes (Veure al crontab)
 * L'objectiu es recopilar informació dels alumnes per enviar a les families que
 * així ho hagin autoritzat mitjançant un correu electronic dels pares.
 * 
 * L'script segueix les següents passes
 * 
 * 0.- Determina el dia d'inici i fi de la setmana actual.
 * 1.- Llista tots els alumnes que tenen associat emailParents
 * 2.- Per a cada alumne, cerca tots els grups que tenen dins uopts. sendParentsReport
 * 3.- Per a cada grup, llista els badges de l'alumne dins d'aquell grup.
 * 4.- Si hi ha algun badge segueix generant el body del correu
 *     Si no s'ha trobat cap badge voldria dir que aquesta setmana es de festes, p.e., i no s'ha d'enviar res.
 *     
 * 5.- Crea una taula per dia amb els badges id>200
 * 6.- Carrega els xats associats amb idUser < 0 (vol dir parents), és a dir, comunicacions escrites a pares.
 * 7.- Carrega el llistat de notes d'activitats de l'alumne.
 * 8.- Finalment, envia el correu.
 * 
 * Now in user.uopts we have parentsMailFreq = 0: never, 1=one week (default) up to 4=monthly       
  *                          parentsMailLang = ca (default); es; en        
  *                          parentsMailLast = '2017-12-22' es per tenir un control del darrer email que s'ha enviat i implementar parentsMailFreq 
 * @type type

 *  node pw-friday.js 0 '' -test  --> goes back 0 week, filter students '' and do not send emails since -test   
 */


   
var nodemailer = require('nodemailer');
var mysql = require('mysql');
var winston = require('winston');
var async = require('async');

function addDays(theDate, days) {
    return new Date(theDate.getTime() + days*24*60*60*1000);
}
function mysqlDate(theDate){
    return theDate.toISOString().split("T")[0];
}
function localDate(theDate){
    var arr = theDate.toISOString().split("T")[0].split("-");
    return arr[2]+"/"+arr[1]+"/"+arr[0];
}

//Refractor database
var config = require('../server/server.config');

var pool = mysql.createPool({
      host     : config.mysql.host || 'localhost',
      port     : config.mysql.port || 3306,
      user     : config.mysql.user || 'root',
      database : config.mysql.database || 'imaths',
      password : config.mysql.password || '',
      multipleStatements: true,
      connectionLimit: 99,
      bigNumberStrings: true
    });
   

var db = require('../server/mysql-utils')(pool);

winston.add(winston.transports.File, { 
    name: 'schedule-log',
    filename: '../log/schedule.log', 
    json: false,
    level: config.logLevel}  //Replace 'debug' by 'verbose'
);




var today = new Date();
var TODAY = today.getFullYear()+"-"+(today.getMonth()+1)+"-"+today.getDate();

var LANGDEFAULT = "ca";

var i18n = {
    ca: {
        PENDING: 'Pendent',
        NOGRADE: 'No avaluat',
        DAYNAME: ["Dl", "Dt", "Dm", "Dj", "Dv"],
        DEARFAMILY: "Benvolguda família de l'alumne/a",
        AYWF: "Us faig arribar el resum setmanal de la matèria",
        BESTWISHES: "Atentament",
        AUTOEMAIL: "Aquest és un missatge automàtic. Per favor, no escriviu a n'aquest correu.",
        DAY: "Dia",
        TERM: "Avaluació",
        ACTIVITY: "Activitat",
        GRADE: "Nota",
        GRADES: "Notes",
        MESSAGES: "Missatges",
        SUBJECTEMAIL: "Seguiment. Setmana",
        FURTHERINFO: "Recordau que podeu consultar en qualsevol moment la informació a través del portal <a href='https://piworld.es'>https://piworld.es</a>. Des d'aquí, també podeu configurar les opccions d'enviament de missatges. " + 
                     "Consultau el professor si no disposau de les credencials d'accés",
        FURTHERINFO2: "Recordau que podeu consultar en qualsevol moment la informació a través del portal https://piworld.es. Des d'aquí, també podeu configurar les opccions d'enviament de missatges. " + 
                "Consultau el professor si no disposau de les credencials d'accés",
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
        GRADEP: "Nota positiva"
    },
    
    es:{
        PENDING: 'Pendiente',
        NOGRADE: 'No evaluado',
        DAYNAME: ["Lu", "Ma", "Mi", "Ju", "Vi"],
        DEARFAMILY: "Querida familia del alumno/a",
        AYWF: "Les mando un resumen semanal de la materia",
        BESTWISHES: "Atentamente",
        AUTOEMAIL: "Este es un mensaje automático. Por favor, no escriba a este correo.",
        DAY: "Día",
        TERM: "Evaluación",
        ACTIVITY: "Actividad",
        GRADE: "Nota",
        GRADES: "Notas",
        MESSAGES: "Mensajes",
        SUBJECTEMAIL: "Seguimento. Setmana",
        FURTHERINFO: "Recordad que podeis consultar en cualquier momento la información a través del portal <a href='https://piworld.es'>https://piworld.es</a>. Desde aquí, tambien se puede configurar las opciones de mensajeria. " +
          "Consultad el professor si no disponeis de las credenciales de acceso",
        FURTHERINFO2: "Recordad que podeis consultar en cualquier momento la información a través del portal https://piworld.es. Desde aquí, tambien se puede configurar las opciones de mensajeria. "+
         "Consultad el professor si no disponeis de las credenciales de acceso",
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
        GRADEP: "Nota positiva"
    },
    
    en: {
        PENDING: 'Pending',
        NOGRADE: 'No grade',
        DAYNAME: ["Mo", "Tu", "Wd", "Th", "Fr"],
        DEARFAMILY: "Dear family of the student",
        AYWF: "Attached you will find a weekly summary of the subject",
        BESTWISHES: "Best wishes",
        AUTOEMAIL: "This is an automatic message. Please, do not replay to this email.",
        DAY: "Day",
        TERM: "Term",
        ACTIVITY: "Activity",
        GRADE: "Grade",
        GRADES: "Grades",
        MESSAGES: "Messages",
        SUBJECTEMAIL: "Progress. Week",
        FURTHERINFO: "Please remember that you will find further information at <a href='https://piworld.es'>https://piworld.es</a>. Login credentials are required (contact the teacher for further information)",
        FURTHERINFO2: "Please remember that you will find further information at https://piworld.es. Login credentials are required (contact the teacher for further information)",
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
        GRADEP: "Positive grade"
    }
};

var geti18n = function(key, lang){
   var x = i18n[lang]  || i18n[LANGDEFAULT];
   return x[key] || key;
};

/**
 * BADGES:
 * id     Description        Score
 */
var badges = config.badges; 

var mw = parseInt(process.argv[2] || "0") || 0;      //minus weeks
var containsFilter = process.argv[3] || "";     //only send to users with fullnames containing this filter

var testMode;
process.argv.forEach(function(arg){
    if(arg==="-test"){
        testMode = true;
    }
})

winston.log("info", ">> pw-friday going back "+mw+" weeks");
winston.log("info", ">> pw-friday filtering "+containsFilter+" in fullname");
if(testMode){
    winston.log("info", ">> pw-friday USING TEST MODE -- NO MAIL WILL BE SENT");
}

var today = new Date();
var monday = addDays(today, -today.getDay() + 1 -mw*7);
var friday = addDays(monday, 4 );
console.log("Monday -- friday: ",monday, friday);

var mondayStr = localDate(monday); 
var fridayStr = localDate(friday);
var mondaySql = mysqlDate(monday); 
var fridaySql = mysqlDate(friday);
var d = new Date();
d.setDate(d.getDate() - 244);
var currentYear = d.getFullYear()-2000;
 
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
} 
 
var RED = "#e87726";
var GREEN = "#507ee2";
 
var parentsList; 

// This is to hold prepared emails. Send only one email per parent. Which may
// contain more than one group.
// So the keys of this object are the parentsEmail
var mapOfEmails = {};
 
function listUsers(cb){    
    var sql = "SELECT * FROM users WHERE emailParents<>'NULL' AND idRole>=200";
    var err = function(){
        parentsList = [];
        cb();
    }
    var success= function(d){
        parentsList = d.result;
        parentsList.forEach(function(e){
            e.groups = [];
            try{
                e.uopts = JSON.parse(e.uopts);
                if(typeof(e.uopts) !== "object") {
                    e.uopts = {};
                }
            } catch(Ex){}
        });        
       
        cb();
    }
    db.query(sql, success, err)();
};


function processGroups(user, userGroups, callback){
    
    var lang = user.uopts.parentsMailLang || LANGDEFAULT;
    
    var worker = function(group, cb2){
       
        if(containsFilter && user.fullname.indexOf(containsFilter)<0){              
            winston.log("info"," user "+user.fullname+" does not match filter " + containsFilter);
            cb2();
            return;
        }
        
        //Check on parents uopts
        if(user.uopts.parentsMailFreq === 0){
            winston.log("info"," parents of user "+user.fullname+" has set parentsMailFreq = 0. Nothing to do.");
            cb2();
            return;
        }
        if(user.uopts.parentsMailFreq > 1 && user.uopts.parentsMailLast){
            //Check-frequency
            try{
                var lastDate = new Date(user.uopts.parentsMailLast);
                var weeksEllapsed = Math.round((today-lastDate)/(604800000));
                if(weeksEllapsed < user.uopts.parentsMailFreq){
                       winston.log("info"," parents of user "+user.fullname+" set parentsMailFreq = "+user.uopts.parentsMailFreq +" and only "+weeksEllapsed + " weeks ellapsed.");
                       cb2();
                       return;
                }
            } catch(Ex){}         
        }
       
        var DIES = geti18n("DAYNAME", lang);
                
        if(group.gopts.sendParentsReport){
            
            //Load stuff of this student-group
            //First is to load badges
            var loadBadges = function(cb3){
                var sql = "SELECT * FROM badges WHERE day>='"+mondaySql+"' AND day<='"+fridaySql+"' AND type>=200 AND idUser='"+user.id+"' AND idGroup='"+group.id+"'";
                var success3 = function(d){
                    group.badges = d.result;
                    cb3();
                }  
                db.query(sql, success3, cb3)();
            }
            
            var loadChats = function(cb3){
                var sql = "SELECT c.`when`, c.msg, u.fullname as desde FROM chats as c INNER JOIN users as u ON u.id=c.idUser WHERE c.`when`>='"+mondaySql+
                        "' AND c.`when`<='"+fridaySql+"' AND c.idGroup="+group.id+" AND c.isFor="+user.id+" AND c.parents=1";
                var success3 = function(d){
                    group.chats = d.result;
                    cb3();
                }  
                db.query(sql, success3, cb3)();
            }
            
            var loadActivities = function(cb3){
                var sql = "SELECT pa.*, pag.grade FROM pda_activities as pa INNER JOIN pda_activities_grades as pag ON pa.id=pag.idActivity WHERE pag.idUser='"+
                        user.id+"' AND pa.idGroup='"+group.id+"' AND pa.visible > 0";
                
                var success3 = function(d){
                    group.activities = d.result;
                    cb3();
                }  
                db.query(sql, success3, cb3)();
            }
            
            var prepareEmails = function(cb3){
                group.badges = group.badges || [];
                group.chats = group.chats || [];
                group.activities = group.activities || [];
                
                if(group.badges.length ===0 && group.chats.length===0){
                    //Nothing to send
                    winston.log("info"," User "+user.id+" in group "+group.id+" has no data to send. No email.");
                    cb3();
                    return;
                }
                
                //Preparing email
                var BODY = '';
    
                        
                BODY += "<h3 style=\"color:blue\"> "+geti18n("SUMMARY", lang) + " "+mondayStr+" - " + fridayStr+ ". "+geti18n("SUBJECT", lang)+": <b>" +group.subject+" "+group.groupName+"</b> </h3>"+
                "<p>"+geti18n("DEARFAMILY", lang)+" "+user.fullname+",</p>"+
                "<p>"+geti18n("AYWF", lang)+" <b>"+group.subject+" "+group.groupName+"</b>.</p>"+
                '<p>'+geti18n("FURTHERINFO", lang)+'.</p>'+
                "<p>"+geti18n("BESTWISHES", lang)+",</p>"+
                "<p>"+group.creatorName+" ("+group.creatorEmail+") </p>"+  
                "<p>"+group.schoolName+ "</p>"+  
                "<br/>";  
                
                
        
                var TEXT = geti18n("DEARFAMILY", lang)+" "+user.fullname+",\n"+
                geti18n("AYWF", lang)+" "+group.subject+" "+group.groupName+".\n"+
                geti18n("FURTHERINFO2", lang)+'.\n'+
                geti18n("BESTWISHES", lang)+",\n"+
                group.creatorName+" ("+group.creatorEmail+") \n"+  
                group.schoolName+ "\n"+  
                +"\t"+geti18n("AUTOEMAIL") +"\n\n" +
                geti18n("SUMMARY", lang).toUpperCase() + " "+mondayStr+" - " + fridayStr+ ". "+geti18n("SUBJECT", lang)+": " +group.subject+" "+group.groupName+" \n\n";
                
                var cFA = new Array(5);
                var cRE = new Array(5);
                var cDE = new Array(5);
                var cCL = new Array(5);
                var cCO = new Array(5);
                cFA.fill("#AAA");
                cRE.fill("#AAA");
                cDE.fill("#AAA");
                cCL.fill("#AAA");
                cCO.fill("#AAA");
                
                var faltesStr= ""; retardsStr= ""; classeStr= ""; deuresStr= ""; comportamentStr = "";
                
                //Filtra els badges per dies
                var mondayDay = monday.getDate();
                for(var day = 0; day<5; day++){
                    
                    var fbadges = group.badges.filter(function(e){
                        return e.day.getDate()=== (mondayDay+day);
                    });
                    
                    var containsFA = false;
                    var containsRE = false;
                    var deures = 0;
                    var classe = 0;
                    var comportament = 0;
                    
                    fbadges.forEach(function(e){
                            if(e.type===400 || e.type===401){                           //Assistencia
                                if(e.type===400){
                                    containsFA = true;
                                } else {
                                    containsRE = true;
                                }
                            }                
                            else if(e.type===202 || e.type===203 || e.type === 304){    //Classe
                                classe += e.rscore;
                            }
                            else if(e.type===200 || e.type===201 || e.type === 300){    //Casa
                                deures += e.rscore;
                            }
                            else if(e.type===301 || e.type===302 || e.type === 303  || e.type===204 || e.type===205 || e.type === 305){    //Comportament
                                comportament += e.rscore;
                            }
                        
                    });
                    
                    if(containsFA && containsRE){
                        containsFA = false;
                    }
                    
                    if(containsFA){
                        cFA[day] = RED;
                        faltesStr += DIES[day]+"; "
                    }
                    if(containsRE){
                        cRE[day] = RED;
                        retardsStr += DIES[day]+"; "
                    }
                    
                    if(deures>0){
                        cDE[day] = GREEN;
                    }
                    else if(deures<0){
                        cDE[day] = RED;
                        deuresStr += DIES[day]+"; "
                    }
                    
                    if(classe>0){
                        cCL[day] = GREEN;
                    }
                    else if(classe<0){
                        cCL[day] = RED;
                        classeStr += DIES[day]+"; "
                    }
                    
                    if(comportament>0){
                        cCO[day] = GREEN;
                    }
                    else if(comportament<0){
                        cCO[day] = RED;
                        comportamentStr += DIES[day]+"; "
                    }
                    
                }
                
                faltesStr = faltesStr || geti18n("NEVER", lang);
                retardStr = retardsStr || geti18n("NEVER", lang);
                deuresStr = deuresStr || geti18n("NEVER", lang);
                classeStr = classeStr || geti18n("NEVER", lang);
                comportamentStr = comportamentStr || geti18n("NEVER", lang);
                
                
                BODY += "<h4>"+geti18n("WEEKPROGRESS", lang)+":</h4>";
                BODY += '<table><thead><tr><th>'+geti18n("ITEM", lang)+'</th><th>'+DIES[0]+'</th><th>'+DIES[1]+'</th><th>'+DIES[2]+'</th><th>'+DIES[3]+'</th><th>'+DIES[4]+'</th></tr></thead><tbody>';
               
                BODY += '<tr><td>'+geti18n("FA", lang)+'</td><td style="background:'+cFA[0]+'"></td><td style="background:'+cFA[1]+'"></td><td style="background:'+cFA[2]+'"></td><td style="background:'+cFA[3]+'"></td><td style="background:'+cFA[4]+'"></td></tr>';
                BODY += '<tr><td>'+geti18n("RE", lang)+'</td><td style="background:'+cRE[0]+'"></td><td style="background:'+cRE[1]+'"></td><td style="background:'+cRE[2]+'"></td><td style="background:'+cRE[3]+'"></td><td style="background:'+cRE[4]+'"></td></tr>';
                BODY += '<tr><td>'+geti18n("HOMEWORK", lang)+'</td><td style="background:'+cDE[0]+'"></td><td style="background:'+cDE[1]+'"></td><td style="background:'+cDE[2]+'"></td><td style="background:'+cDE[3]+'"></td><td style="background:'+cDE[4]+'"></td></tr>';
                BODY += '<tr><td>'+geti18n("CLASSWORK", lang)+'</td><td style="background:'+cCL[0]+'"></td><td style="background:'+cCL[1]+'"></td><td style="background:'+cCL[2]+'"></td><td style="background:'+cCL[3]+'"></td><td style="background:'+cCL[4]+'"></td></tr>';
                BODY += '<tr><td>'+geti18n("BEHAVIOUR", lang)+'</td><td style="background:'+cCO[0]+'"></td><td style="background:'+cCO[1]+'"></td><td style="background:'+cCO[2]+'"></td><td style="background:'+cCO[3]+'"></td><td style="background:'+cCO[4]+'"></td></tr>';
                
                BODY += "</tbody></table>";
                BODY += '<p><b><span style="color:white;background:#AAA">'+geti18n("GRADE0", lang)+'</span>   <span style="color:white;background:'+GREEN+'">'+geti18n("GRADEP", lang)+'</span>   <span style="color:white;background:'+RED+'">'+geti18n("GRADEN", lang)+'</span></b></p>';
                
                TEXT += "* "+geti18n("WEEKPROGRESS", lang).toUpperCase()+":\n";
                TEXT += "\t\t "+geti18n("FA", lang)+": \t " + faltesStr + "\n";
                TEXT += "\t\t "+geti18n("RE", lang)+": \t " + retardsStr + "\n";
                TEXT += "\t\t "+geti18n("NOHOMEWORK", lang)+": \t " + deuresStr + "\n";
                TEXT += "\t\t "+geti18n("NOCLASSWORK", lang)+": \t " + classeStr + "\n";
                TEXT += "\t\t "+geti18n("BADBEHAVIOUR", lang)+": \t " + comportamentStr + "\n";
                
                
                //Significat dels colors:
                
                if(group.chats.length){
                    BODY += "<h4>"+geti18n("MESSAGES", lang)+":</h4><ul>";
                    
                    TEXT += "\n* "+geti18n("MESSAGES", lang).toUpperCase()+": \n";
                    
                    group.chats.forEach(function(e){
                            var dataf = localDate(e.when);
                            BODY += "<li> "+dataf+":  "+e.msg + "</li>";
                            TEXT += "\t "+dataf+": \t "+e.msg + "\n";
                    });
                    BODY += "</ul>";                    
                }
                
                if(group.activities.length){
                    BODY += "<h4>"+geti18n("GRADES", lang)+":</h4>";
                    TEXT += "\n* "+geti18n("GRADES", lang).toUpperCase()+": \n";
                    
                    BODY +="<table><thead><th>"+geti18n("TERM", lang)+"</th><th>"+geti18n("DAY", lang)+"</th><th>"+geti18n("ACTIVITY", lang)+"</th><th>"+geti18n("GRADE", lang)+"</th></thead><tbody>";
                    
                    group.activities.forEach(function(e){
                            e.dia.setHours(12);
                            BODY += "<tr><td>"+e.trimestre+"a</td><td>"+localDate(e.dia)+"</td><td>"+e.desc + "</td><td>" + showGrade(e.grade)+"</td></tr>";
                            TEXT += "\t "+geti18n("TERM", lang)+" "+e.trimestre+" \t "+localDate(e.dia)+" \t "+e.desc + "\t "+ geti18n("GRADE", lang) + "=" + showGrade(e.grade)+"\n";                    
                    });
                    BODY += "</tbody></table>";                    
                }

                
                    var preparedEmail = mapOfEmails[user.emailParents];
                    if (!preparedEmail) {
                        preparedEmail = {mailOptions: null, user: user};
                        mapOfEmails[user.emailParents] = preparedEmail;
                    }

                    if(!preparedEmail.mailOptions) {
                        var mailOptions = {
                           from: 'piWorld Admin <'+config.adminEmail+'>', // sender address
                           to: user.emailParents, 
                           subject: geti18n("SUBJECTEMAIL", lang)+" "+mondayStr+"-"+fridayStr,  
                           text: TEXT,  
                           html: BODY 
                        };
                        preparedEmail.mailOptions = mailOptions;
                    } else {
                        preparedEmail.mailOptions.text += "\n\n" + TEXT;
                        preparedEmail.mailOptions.html += "</br></br><hr/><hr/></br></br>" + BODY;
                    }
                    cb3();
                
                
                
            };

            async.series([loadBadges, loadChats, loadActivities, prepareEmails], cb2);
            
        } else {
            //Although parent email is activated, this group does not allow sending info.
            //Nothing to do; no email send    
            winston.log("info"," group "+group.id+" has unspecified key sendParentsReport. Skip group.");
            cb2();
        }  
    };
    
    async.mapSeries(userGroups, worker, callback);
}


function listGroups(cb){    
     
    if(parentsList.length===0){
        winston.log("info"," No parents with email specified.");
        cb();
        return;
    }
     
    var worker = function(bean, cb2){
        var sql = "SELECT g.*, u.fullname as creatorName, u.email as creatorEmail, s.name as subject, sch.schoolName as schoolName FROM groups as g INNER JOIN users as u ON u.id=g.idUserCreator INNER JOIN schools as sch ON sch.id=u.schoolId INNER JOIN enroll as e on e.idGroup=g.id INNER JOIN subjects as s ON s.id=g.idSubject WHERE e.idUser='"+bean.id+"' AND g.groupYear='"+currentYear+"'";
        var success= function(d){
            bean.groups = d.result;
            
            bean.groups.forEach(function(e){
                //Parse gopts
                try{
                    e.gopts = JSON.parse(e.gopts); 
                    if(typeof(e.gopts) !== "object") {
                    e.gopts = {};
                }
                } catch(Ex){
                    e.gopts = {};
                }
            });
            
          
            processGroups(bean, bean.groups, cb2);                                   
        }
        
        db.query(sql, success, cb2)();
         
    };
    
    async.mapSeries(parentsList, worker, cb);
    
};


 

async.series([listUsers, listGroups], function(){
    //create reusable transporter object using SMTP transport
    var transporter;

    try{
    transporter = nodemailer.createTransport({
       service: 'Gmail',
       auth: {
           user: config.adminEmail,
           pass: config.adminEmailPass
       }
    });
    } catch(ex){
        winston.log("info", "Unable to create GMAIL transporter");
    }

    var emailOk = 0;
    var emailFailed = 0;

    var PREAMBLE = '<html><head> <meta charset="UTF-8"><style>table, th, td {border: 1px solid black;} th{width:60px;}</style></head><body>';
    var FOOTER ="<br/><p><i>"+geti18n("AUTOEMAIL")+ "</i></p><br/></body></html>";
   

    // Finally send all prepared emails
    var sendEmailWorker = function(preparedEmail, cb) {
       
        
        preparedEmail.mailOptions.html = PREAMBLE + preparedEmail.mailOptions.html + FOOTER;

        var user = preparedEmail.user;
        var mailOptions = preparedEmail.mailOptions;


        if (testMode) {
                    console.log(" We are in testmode.... it would send an email to ");
                    console.log(JSON.stringify(mailOptions.from));
                    console.log(JSON.stringify(mailOptions.to));
                    console.log(JSON.stringify(mailOptions.subject));
                    console.log(JSON.stringify(mailOptions.html));
                    user.uopts.parentsMailLast = TODAY;
                    cb();
        } else {
                     transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            winston.log("info", "Unable to sent email to " + user.emailParents + " due to ", error);
                            emailFailed += 1;
                            cb();
                        } else {
                            emailOk += 1;
                            winston.log("info", "Email sent to " + user.emailParents);

                            //Everything went smoothly then set parentsMailLast in useropts
                            user.uopts.parentsMailLast = TODAY;
                            var done = function() {
                                cb && cb();
                            }
                            db.queryBatch("UPDATE users SET ? WHERE id='"+user.id+"'", {uopts: JSON.stringify(user.uopts)}, done, done)();
                          
                        }
                        
                        
                    });
        }
    };

    var listEmails = Object.keys(mapOfEmails).map((item) => mapOfEmails[item]);
    if(listEmails.length === 0) {
        console.log('No hi ha emails per enviar');
        //Release pool
       pool.end(function (err) {
           winston.log("info",">> Done pw-friday.");
          // all connections in the pool have ended
        });
        return;
    }  

    async.mapSeries(listEmails, sendEmailWorker, function(){
        winston.log("All done. Emails send OK=" + emailOk + "; FAILED=" + emailFailed);

       //Release pool
       pool.end(function (err) {
           winston.log("info",">> Done pw-friday.");
          // all connections in the pool have ended
        });
    });
    
});
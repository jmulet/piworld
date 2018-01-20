/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

(function(app, angular){
'use strict';

app.filter('nameShortener', function () {
        return function (fn) {

            var p = fn.split(",");
            if (p.length > 1) {
                var q = p[0].replace(/  /gi, ' ').split(" ");
                var out = q[0];
                if (q.length > 1) {
                    out += " " + q[1].substring(0, 1) + ".";
                }
                out += ", " + p[1];
                return out;
            }
            return fn;
        };
    });


app.filter('timeHMS', ['$translate', function($translate) {
  return function(sec) {
    if(sec==null){
        return $translate.instant("NEVER");
    }
    var hours = Math.floor(sec / 3600);
    var minutes = Math.floor( (sec-3600*hours) / 60);
    var seconds = Math.round(sec-3600*hours-60*minutes);
    
    var timeString;
    if(hours===0 && minutes===0 && seconds ===0){
        timeString = $translate.instant("NOW");;
    } else {
        timeString = ((hours < 10) ? ("0"+hours) : (hours)) + ":";
        timeString += ((minutes < 10) ? ("0"+minutes) : (minutes)) + ":";
        timeString += ((seconds < 10) ? ("0"+seconds) : (seconds));    
    }
    
    
    return timeString;
};
}]);

app.filter('timeDHM', ['$translate', function($translate) {
  //sec ARE ms from origin date
  return function(sec) {
  
    if(sec==null){
        return $translate.instant("NEVER");
    }    
    sec = new Date().getTime()*0.001 - sec;
   
    var days = Math.floor(sec / 86400);
    var hours = Math.floor((sec-86400*days) / 3600);
    var minutes = Math.floor( (sec-86400*days-3600*hours) / 60);
    
    var timeString = days+' '+$translate.instant("DAYS")+ ' '+hours+' '+$translate.instant("HOURS")+ ' '+minutes+' '+$translate.instant("MINUTES")+ ' ';
    return timeString;
};
}]);

app.filter('correct', function(){
    return function(value)
    {
        var out = value || "";
        var low = out.toLowerCase().trim();
        if(low==='s')
        {
            out = "<span style='color:green'>SI</span>";
        }
        else if(low==='n')
        {
            out = "<span style='color:red'>NO</span>";
        }
        return out;
    };
});
   

app.filter('rolename', ['USER_ROLES', function(USER_ROLES){
    return function(idRole)
    {
        var out = idRole || "";
        if(idRole ===USER_ROLES.admin)
        {
            out = "ADMINISTRATOR";
        }
        else if(idRole ===USER_ROLES.teacher)
        {
            out = "TEACHER";
        }
        else if(idRole ===USER_ROLES.teacherNonEditing)
        {
            out = "TEACHER-nonEditing";
        }
        else if(idRole ===USER_ROLES.teacheradmin)
        {
            out = "TEACHER ADMIN";
        }
        else if(idRole ===USER_ROLES.student)
        {
            out = "STUDENT";
        }
        else if(idRole ===USER_ROLES.guest)
        {
            out = "GUEST";
        }
        else if(idRole ===USER_ROLES.parents)
        {
            out = "FAMILY";
        }
        else{
            out = idRole+"-UNKNOWN";
        }
        return out;
    };
}]);

}(window.pw.app, angular));

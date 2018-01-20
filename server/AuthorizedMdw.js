
var config = require("./server.config");

var factory = function(roles) {
  
    return function(req, res, next) {
        //console.log(req.path, " Authorize ", roles);
        if (req.session && req.session.user) {
            var user = req.session.user;
            var idRole = user.idRole;
            //console.log("user is ", idRole);
            if (roles.indexOf(idRole) < 0) {
               return res.status(403).send(); //Unathorized
            }
        }
        next();
    };
    
};


module.exports = {
    FactoryMdw: factory,
    RootOnlyMdw: factory([config.USER_ROLES.admin]),
    AdminsOnlyMdw: factory([config.USER_ROLES.admin, config.USER_ROLES.teacheradmin]),
    AdminsAndTeachersMdw: factory([config.USER_ROLES.admin, config.USER_ROLES.teacher, config.USER_ROLES.teacheradmin, config.USER_ROLES.teacherNonEditing]),
    TeachersOnlyMdw: factory([config.USER_ROLES.teacher, config.USER_ROLES.teacheradmin, config.USER_ROLES.teacherNonEditing]),
    StudentsOnlyMdw: factory([config.USER_ROLES.student]),
    ParentsOnlyMdw: factory([config.USER_ROLES.parents])
};
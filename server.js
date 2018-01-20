/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var config = require('./server/server.config'),
    path = require('path'),
    express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mysql = require('mysql2'),
    winston = require('winston'),
    expressWinston = require('express-winston'),
    compression = require('compression'),
    session = require('express-session'),
    MemoryStore = require('memorystore')(session),
    helmet = require('helmet'),
    domain = require('domain');

var d = domain.create();
d.on('error', function (err) {
    console.error(err);
});

winston.exitOnError = false;


app.enable('trust proxy');
app.use(helmet());
app.use(compression());
app.use(bodyParser.urlencoded({ limit: '100mb', extended: false }));
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.text({ limit: '100mb' }));
app.use(methodOverride());

const memoryStore = new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h    
});

/*dispose: function (key, value) {
        console.log("About to dispose memory session store", key, value);
    }
*/

app.use(session({
    name: "pwCookie",
    secret: 'ñkj3499m_!EF',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: true,
        maxAge: 86400000,
        httpOnly: false
    },
    store: memoryStore
}));

// Basic security middleware:: Only checks if the user is authenticated
// except for anonymousRoutes
var anonymousRoutes = ["/rest/i18n/lang", "/rest/news/list",
    "/rest/users/login", "/rest/users/auth", "/rest/auth/bookmgr"];

app.use(function (req, res, next) {
    var p = req.path;
    if (p[0] !== '/') {
        p = '/' + p;
    }
    var found = (anonymousRoutes.indexOf(p) >= 0);
    if (!found && p.indexOf("/rest/") >= 0 && !req.session.user) {
        //console.log(req.path);     
        //Not logged in.
        return res.status(401).send();
    }
    next();
});

var pool = mysql.createPool({
    host: config.mysql.host || 'localhost',
    port: config.mysql.port || 3306,
    user: config.mysql.user || 'root',
    database: config.mysql.database || 'imaths',
    password: config.mysql.password || '',
    multipleStatements: true,
    connectionLimit: 99,
    bigNumberStrings: true
});


app.db = require('./server/mysql-utils')(pool);
app.config = config;
app.APIS = {};

winston.add(winston.transports.File, {
    name: 'info-log',
    filename: './log/imaths-server.log',
    json: false,
    level: config.logLevel || 'verbose'
}  //Replace 'debug' by 'verbose'
);



app.parseCookies = function (request) {
    var list = {},
        rc = request.headers ? request.headers.cookie : request;

    rc && rc.split(';').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    var parser = function () {
        this.get = function (key) {
            var cookie = list[key];
            if (cookie) {
                return cookie.replace(/["']/g, '');
            }
            return null;
        };
    };

    return new parser();
};

//Resolve paths
global.__publicDir = path.resolve(__dirname, "./public");
global.__serverDir = path.resolve(__dirname, "./server");



d.run(function () {
    require('./server/misc/encryption')(app);
    require('./server/users/auth')(app);
    require('./server/cas/cas')(app);
    require('./server/reports/reports')(app);

    require('./server/groups/groups')(app);
    require('./server/students/students')(app);
    require('./server/activity/activities')(app);
    require('./server/activity/pda')(app);
    require('./server/activity/trace')(app);
    require('./server/activity/video')(app);
    //require('./server/activity/kahoot')(app);
    require('./server/fs/fs')(app);
    require('./server/attempt/attempt')(app);
    require('./server/assignments/assignments')(app);
    require('./server/misc/oftheday')(app);
    require('./server/misc/mathtutor')(app);
    require('./server/misc/forums')(app);
    require('./server/misc/gapis')(app);
    require('./server/subjects/subjects')(app);
    require('./server/i18n/i18n')(app);
    require('./server/units/units')(app);
    require('./server/plotting/plotting')(app);

    //var bckUtils = require('./server/misc/backupUtils')(app);
    //bckUtils.mysqlDump(app.config);

    //require('./server/misc/dbcheck')(app);

    //Check if the root user is created in the database
    var testSql = "SELECT id FROM users WHERE id=0";
    var sql = "INSERT INTO users (idRole,username,fullname,password,email,schoolId,valid,uopts) VALUES("
     + app.config.USER_ROLES.admin + ",'" + app.config.adminUser + "','Administrator','" 
     + app.config.adminPassword + "','" + app.config.adminEmail + "',0,1,'{}')";
    var success = function (d) {
        app.db.query("UPDATE users SET id=0 WHERE id=" + d.result.insertId)();
    };
    app.db.queryIfEmpty(testSql, sql, success)();

    if (app.config.platform !== 'linux') {
        var staticPath = path.resolve(__dirname, 'public');
        app.use(express.static(staticPath, { lastModified: true }));
    }

    //Sockets
    require('./server/sockets')(io, app.db);


    server.listen(config.express.port, function () {
        winston.info(new Date() + ': piWorld server started on port ' + config.express.port);
    });


});
/* 
 * piWorld server
 * by Josep Mulet (pep.mulet@gmail.com)
 */
var config = require('./server/server.config'),
    path = require('path'),
    express = require('express'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mysql = require('mysql'),
    winston = require('winston'),
    expressWinston = require('express-winston'),
    compression = require('compression'),
    session = require('express-session'),
    //MemoryStore = require('memorystore')(session),
    MemCachedStore = require('connect-memcached')(session),
    helmet = require('helmet'),
    domain = require('domain'),
    ejs = require('ejs'),
    findLang = require('./server/langInspector');

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

//const memoryStore = new MemoryStore({
//    checkPeriod: 86400000 // prune expired entries every 24h    
//});

const memoryStore = new MemCachedStore({
    hosts: ['127.0.0.1:11211']
});
  

/*dispose: function (key, value) {
        console.log("About to dispose memory session store", key, value);
    }
*/

app.use(session({
    name: "pwCookie",
    secret: 'aj2!_fgk49imbF',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        maxAge: 86400000,  //1 day
        httpOnly: false
    },
    store: memoryStore
}));

app.set('view engine', 'ejs');
const viewsPath = __dirname + '/server/views';
console.log('Mounting views:: ', viewsPath);
app.set('views', viewsPath);

// Basic security middleware:: Only checks if the user is authenticated
// except for anonymousRoutes
var anonymousRoutes = ["/rest/i18n/lang", "/rest/news/list",
    "/rest/users/login", "/rest/users/auth", "/rest/auth/bookmgr",
    "/rest/fs/uploads/bonificador"];

var TRANSLATIONS = {
    es: require('./server/i18n/es.json'),
    ca: require('./server/i18n/ca.json'),
    en: require('./server/i18n/en.json')
};

const bypassSecurity = process.argv.indexOf("--public") >= 0;

app.use(function (req, res, next) {

    var p = req.path;
    if (p[0] !== '/') {
        p = '/' + p;
    }
    
    if(!bypassSecurity) {
        var found = (anonymousRoutes.indexOf(p) >= 0);
        if (!found && p.indexOf("/rest/") >= 0 && !req.session.user) {
            //console.log(req.path);     
            //Not logged in.
            return res.status(401).send();
        }
    }

    // find current lang
    const lang = findLang(req);
    res.locals.lang = lang;
    res.locals.prefixUrl = function (url) {
        return url;
    };
    res.locals.translations = TRANSLATIONS[lang] ||  {};
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
    filename: './log/piworld-server.log',
    json: false,
    level: config.logLevel || 'verbose'
}
);



app.parseCookies = require('./server/parseCookies');

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


    //require('./server/activity/kahoot')(app);
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

    if (app.config.serveStatic) {
        var staticPath = path.resolve(__dirname, 'public');
        app.use(express.static(staticPath, { lastModified: true }));
    }

    //Sockets
    require('./server/sockets')(io, app.db);


    //Error routes
    app.use(function (error, request, response, next) {
        if (!response.headersSent) {
            let lang = response.locals.lang;
            if (!lang) {
                lang = findLang(request, response);            
            }  
            if (request.headers.accept && request.headers.accept.indexOf('application/json') >= 0) {
                // respond with json
                response.status(404).send({msg: this.i18n.i18nTranslate("404")});
                return;
            }            
            else if (request.headers.accept && request.headers.accept.indexOf('text/html') >= 0) {
                // respond with html page
                response.status(404).render("errors/404", {translations: translations, lang: lang});
                return;
            }            
        }
        next();
    });

    app.use(function (error, request, response, next) {
        if (!response.headersSent) {
            let lang = response.locals.lang;
            if (!lang) {
                lang = findLang(request, response);
            } 

            if (request.headers.accept && request.headers.accept.indexOf('application/json') >= 0) {
                console.log(error);
                 // respond with json
                const httpCode = ( error || {} ).httpCode;
                response.status(httpCode || 500).send(error || { msg: this.i18n.i18nTranslate("500")});
            }            
            else if (request.headers.accept && request.headers.accept.indexOf('text/html') >= 0) {
                // respond with html page
                response.status(500).render("errors/500", {error: error, translations: translations, lang: lang});
            }            
        }
    });



    server.listen(config.express.port, function () {
        winston.info(new Date() + ': piWorld server started on port ' + config.express.port);
    });


});
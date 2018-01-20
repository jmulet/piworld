
var extend = require('util')._extend;

var platform = process.platform;

/* PLATFORM INDEPENDENT CONFIGURATION */

var config = {
    USER_ROLES: {
        admin: 0,
        teacher: 100,
        teacherNonEditing: 105,
        teacheradmin: 110,
        student: 200,
        guest: 300,
        undefined: 400,
        parents: 500
    },
    AES_SECRET: '',             // * Secret for encryption
    LANGS: ['ca', 'es', 'en'],
    hostname: 'localhost:3000', // * Your hostname
    adminUser: 'root',          // * The admin username
    adminPassword: '',          // * The admin password
    adminLang: 'ca',            // * Default lang
    adminEmail: '',             // * Admin's email
    adminEmailPass: '',         // * Admin's email password
    mathpix: { "app_id": "", "app_key": "", "Content-type": "application/json" },
    API_KEY: "",    //google api key
    oauth2: {
        // Just in case you need google apis
    },
    badges: {   //don't touch this
        CMT: { id: 1, desc: "Comment bagde", score: 10, EVERY: 4 },
        REG: { id: 2, desc: "Regularity bagde", score: 100, EVERY: 3 },
        BOW: { id: 3, desc: "Best of weeek bagde", score: 200, MIN: 100 },
        BOM: { id: 4, desc: "Best of month bagde", score: 300, MIN: 500 },
        CHL: { id: 5, desc: "Weekly challenge badge", score: 140 }
    }

};

/* PLATFORM DEPENDENT CONFIGURATION */
//Configure the database connection here

var platform_config = {};

if (platform.indexOf('win') === 0) {
    console.log("Node platform win");
    platform_config = {
     
        mysql: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'imaths'
        },

        //Configure executable and temporal paths here
        paths: {
            maxima: 'c:\\Maxima-5.31.2\\bin\\maxima.bat',
            python: 'c:\\Python33\\python.exe',
            yacas: '',
            pandoc: 'c:\\Pandoc\\pandoc.exe',
            tmp: 'c:\\imaths-tmp\\',
            mysqldump: ''
        },
        
        serveStatic: true,

        express: {
            port: 3000
        }

    };
}
else if (platform === 'darwin') {
    console.log("Node platform darwin");
    platform_config = {

        //Configure the database connection here
        mysql: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'imaths'
        },

        //Configure executable and temporal paths here
        paths: {
            maxima: '/Applications/Maxima.app/Contents/Resources/maxima.sh',
            python: '/usr/bin/python',
            pandoc: '/usr/local/bin/pandoc',
            tex: '/usr/local/texlive/2014basic/bin/universal-darwin/',
            yacas: '/usr/bin/yacas',
            tmp: '/Users/josep/imaths-tmp/',
            mysqldump: '/usr/local/mysql/bin/mysqldump'
        },

        express: {
            port: 3000
        },
        serveStatic: true,
        logLevel: 'debug'

    };
}
else if (platform === 'linux') {
    console.log("Node platform linux");

    platform_config = {

        mysql: {
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'imaths'
        },

        //Configure executable and temporal paths here
        paths: {
            maxima: '/usr/bin/maxima',
            python: '/usr/bin/python',
            yacas: '/usr/bin/yacas',
            tex: '',
            pandoc: '/usr/local/bin/pandoc',
            tmp: '/root/imaths-tmp/',
            mysqldump: '/usr/bin/mysqldump'
        },

        express: {
            port: 3000
        },

        serveStatic: false,
        logLevel: 'warn'


    };
}
else {
    console.log("Unknown platform ", platform,". Please provide a configuration.");
    process.exit(1);
}
platform_config.platform = platform;

module.exports = extend(config, platform_config);

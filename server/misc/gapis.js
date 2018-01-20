module.exports = function(app){
    

var googleapis = require('googleapis');
 
var translate = googleapis.translate('v2'),
 youtube = googleapis.youtube('v3'),
 async = require('async'),
 nodemailer = require('nodemailer');

    
    
//input is a list of {text: 'Prova de traducció a un altre idioma', source: 'ca', target: 'en'}
var traductor = function(req, res){
    var p = req.body;
    if(!p.target.length)
    {
        p.target = [p.target];
    }
    var tasks = [];
    var translations = {};
    p.target.forEach(function(e){       
       tasks.push(               
               function(cb){
//                   translate({text: p.text, source: p.source, target: e}, function(result){                      
//                       translations[e] = result;
//                       cb();
//                   })                                
//                  //format is text or html
                    var params = {format: 'text', key: app.config.API_KEY, q: p.text, target: e, source: p.source};
                    if(p.format){
                        params.format = p.format;
                    }
                    translate.translations.list(params, function(err, data){   
                         if(err){
                             console.log(err);
                             translations[e] = p.text;
                             cb();
                             return;
                         }
                         if(data.translations.length){
                            translations[e] = data.translations[0].translatedText;
                         } else {
                             translations[e] = p.text;
                         }
                         cb();
                    });
                }               
           );        
    });
    
    //Traslate in parallel
    async.parallel(tasks, function(err, results){
       res.send(translations);
    });
    
};


 /**
 * Search videos wih q.search conditions
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */ 
var ytsearch = function(req, res){
    var p = req.body;
     //channelId: //channelType;  type= channel, video or playlist
    var params = {key: app.config.API_KEY, part:'snippet', type: 'videos', q: p.search, maxResults: p.limit || 25};
    if(p.channelId){
        params.channelId = p.channelId;
    }
    if(p.type){
        params.type = p.type;
    }
    youtube.search.list(params, function(err, data){
        if(err){
            console.log(err);
            res.send({items: []});
            return;
        }
        res.send(data);
    }); 
 };
 
 
/**
 * Gets information of a given video id from youtube
 * @param {type} req
 * @param {type} res
 * @returns {undefined}
 */ 
var ytvideo = function(req, res){
    var p = req.body;
     //channelId: //channelType;  type= channel, video or playlist
    var params = {key: app.config.API_KEY, part:'snippet', id: p.id, maxResults: p.limit || 5};
    
    youtube.videos.list(params, function(err, data){
        if(err){
            console.log(err);
            res.send({});
            return;
        }
        if(data.items.length){
            res.send(data.items[0].snippet);
        } else {
            res.send({});
        }
        
    }); 
 };
 
 
//Requires p.subject, p.text, p.html, p.to,  p.from (is optional if not, use adminEmail)
//to - Comma separated list or an array of recipients e-mail addresses
//Now it comes with encrypted body because it may contain the email password of the sender

var emailer = function(req, res){
    var p;
    try{        
        p = JSON.parse(app.decrypt(req.body));
    } catch(Ex){
        res.send({ok:false, msg: "invalid middleware"});
        return;
    }
    
    if(!p.text){
        p.text = p.html;
    }
                 
    //Send an email
     var mailOptions = {
        from: (p.fromName? '': 'piWorld Admin')+ ' <'+(p.from || app.config.adminEmail)+'>', // sender address
        to: p.to, 
        subject: p.subject,  
        text: p.text,  
        html: p.html  
    };
    
   // console.log(mailOptions);

    //create reusable transporter object using SMTP transport
    var transporter, auth;
   
    if(p.from && p.emailPassword){
        auth = {
                user: p.from,
                pass: p.emailPassword
            };
    } else {
        auth = {
                user: app.config.adminEmail,
                pass: app.config.adminEmailPass
            };
    }
    
    
    try{
        transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: auth
    });
    } catch(ex){
       res.send({ok: false, msg: ex});
       return;
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, function (error, info) {
        //console.log(error, info);
        if (error) {
            res.send({ok: false, msg: error});
        } else {
            res.send({ok: true, msg: info});
        }
    });                     
 }; 
    
 app.post('/rest/gapis/ytsearch', ytsearch);
 app.post('/rest/gapis/ytvideo', ytvideo);
 app.post('/rest/gapis/translate', traductor); 
 app.post('/rest/gapis/email', emailer); 

 };
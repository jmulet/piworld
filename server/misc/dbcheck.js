module.exports = function(app)
{  
    //Preload stuff from json files
    var fs = require('fs');
    
	var dbCheck = function(req, res)
	{
		var dir = 'public/activities';
		var files = fs.readdirSync(dir);
		for (var i in files){
		var id = files[i].trim();
                var name = dir + '/' + id;
                if (fs.statSync(name).isDirectory()){
			
			try{
				var data = fs.readFileSync(name+'/QProvider.json');
				console.log('Found '+name+' as a valid activity');
				console.log('Checking if it is in database with id ...'+id);
				var testQuery = "SELECT id FROM activities WHERE id='"+id+"'";
                               
				var success = function(d){
					if(d.result.length===0)
                                        {
                                            console.log("Activity "+d.id+" creating database entry");
                                            var query = "INSERT INTO activities SET createdWhen=NOW(), ?";
                                            var json = JSON.parse(d.data);
                                            var title = JSON.stringify(json.title || {}) || 'No title';
                                            title = title.replace('{','').replace('}','');
                                            
                                            var description = JSON.stringify(json.description || {}) || 'No description';
                                            description = description.replace('{','').replace('}','');
                                            var author = JSON.stringify(json.author) || 'admin';
                                            author = author.replace(/\"/g, '');
                                            var levels = JSON.stringify(json.levels) || '*'; 
                                            levels = levels.toUpperCase().replace(/\"/g, '');
                                            var type = JSON.stringify(json.type || 0) || 0; 
                                            var category = JSON.stringify(json.category) || '*'; 
                                            category = category.toUpperCase().replace(/\"/g, '');
                                
                                            var dset = {id: d.id, levels: levels, activity: title, activityType: type, share: 'S', createdBy: author, description: description, category: category};
                                            var success2 = function(d){
                                                //res.send('Ok');
                                                System.out.println('ok');
                                            };
                                            var error2 = function(d){
                                                //res.send('Error');
                                                System.out.println('error');
                                            };
                                            app.db.queryBatch(query, dset, success2, error2)();
                                        }
                                        else
                                        {
                                            console.log("Activity "+d.id+" already in database.");
                                            //res.send('No');
                                        }
				};
				 
				var error = function(d){
					console.log("An error occurred");
					//res.send('Error');
				};
                                var dd= {id:id, data: data}
				app.db.query(testQuery, success, error)(dd);
			}
			catch(e)
			{
				console.log('Dismiss '+name+' not valid activity '+e); 				
			}
					
        } 
    }
			
	};
	
	dbCheck();
	
	app.post('rest/misc/dbcheck', dbCheck);
};
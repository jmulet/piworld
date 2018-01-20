(function () {


    var MAXLEVEL = 4;
    var MEMORY_CYCLES = 4;

    var BrainModule = {};
    var winston = require('winston');
    var cache = {};

    BrainModule.getBrain = function (db, idUser)
    {
        if (!cache[idUser + ""])
        {
            var obj = new Brain(db, idUser);
            cache[idUser + ""] = obj;
        }
        return cache[idUser + ""];
    };

    BrainModule.instance = function (db, idUser)
    {
        return new Brain(db, idUser);
    };

    BrainModule.removeBrain = function (idUser)
    {
        delete cache[idUser + ""];
    };

    /**
     * UPDATES the field difficulty in activities table based on ALL users performance
     * in each activity. Difficulty is set from 0 to 4.
     * 
     * This query must be called by server on a daily basis.
     * 
     * @param {Database} db
     * @returns {undefined} none
     */
    BrainModule.updateActivityDifficulty = function (db)
    {
        var sql = "UPDATE activities as act, (select idActivity, " +
                "round(4*(1-sum(score*(level+1))/sum(level+1)/100)) as difficulty, " +
                "count(id) as numAttempts from attempts where done='S' group by idActivity) as src " +
                "set act.`difficulty`=(act.`difficulty`+ src.numAttempts*src.`difficulty`)/(src.numAttempts+1) " +
                " where src.idActivity=act.id";
        db.query(sql, function (d) {
            winston.log("Updated activity difficulty: "+d.result.affectedRows+" entries modified.");
        })();

    };



    //Count [correct and incorrect instance for the current node and all their subchildren]
    var counter = function (node, c) {
        c = c || {Y: 0, N: 0};
        c.Y += node.Y;
        c.N += node.N;

        for (var key in node.children) {
            var subnode = node.children[key];
            counter(subnode, c);
        }
        return c;
    };
    

    var DataBrain = function () {
        this.data = {};     //Holds the structure category - performance

        //here simpleCategory cannot contain .
        var _getChild = function (parent, simpleCategory) {
            var child = parent[simpleCategory];
            if (!child) {
                child = {Y: 0, N: 0, LL: [], children: {} };
                parent[simpleCategory] = child;
            }
            return child;
        };

        //Real complex category X.Y.Z, returns the innermost node and checks if all their subchilds are created
        this.getInnerChild = function (category) {
            var list = category.split(".");
            var mainCategory = list[0];
            var mainChild = _getChild(this.data, mainCategory);
            var current = mainChild;
            for (var i = 1; i < list.length; i++) {
                current = _getChild(current.children, list[i]);
            }
            return current;
        };
        
        var _toString = function(key, node, t){
            var str = "";
            for(var i=0; i<t; i++){
                str += "\t";
            }
            str += key+"[Y:"+node.Y+", N:"+node.N+", LL:"+node.LL+"]\n";
            
            for(var ky in node.children){
                var nod = node.children[ky];
                str += _toString(ky, nod, t+1);
            }
            return str;
        };
        
        this.toString = function(){
            var str = "";
            var t = 0;
            for(var key in this.data){
                var node = this.data[key];
                str += _toString(key, node, t);
            }
            
            return str;
        };
    };




    var Brain = function (db, idUser)
    {
        this.defaultLevel = 1;  //Used by untrained or undefined tags
        this._db = db;
        this.idUser = idUser;
        this.data = new DataBrain();     //Holds the structure category - performance

        this.register = function (idSubject, category, isCorrect) {
            var fullcategory = idSubject + "." + (category || 'g').toUpperCase().trim();
            //Modify this.data according to this new user input;
            
            var obj = this.data.getInnerChild(fullcategory);
           
            isCorrect ? obj.Y += 1 : obj.N += 1;
             
        };

        /**
         * There are two ways to train, one based on activity attempt total score and the other one which is more
         * accurate, based on each particular question category-level-performance
         * @returns {undefined}
         */
        this.train = function(cb)
        {
            //Must obtain information of all activities performed by this user
            //Information is gathered in the format of the tag-sytem.
            //Tag system is heirarchial, thus tags are in tree format.
            //For each tag, we provide a performance mark 0-100

            //How this user has performed on different tasks?
            //Is the given level correct or not?
            this.data = new DataBrain();
            var self = this;
            var sql = "select act.idSubject, q.category, q.level, ans.isCorrect from attempts as att inner join logins as l on l.id=att.idLogins inner join activities "+
            " as act on act.id=att.idActivity left join questions as q on q.idAttempt=att.id left join answers as ans on ans.idQuestion=q.id where l.idUser='"
            + this.idUser + "'";
        
            var success = function (d) {
              
                //Sort resultset by category
                d.result.forEach(function (row) {
                    var idSubject = row.idSubject || 0;
                    var tag = (row.category || 'g').toUpperCase();
                    var correct = (row.isCorrect || '').toUpperCase();

                    var child = self.data.getInnerChild(idSubject + "." + tag);
                    if (correct === 'S')
                    {
                        child.Y += 1;
                    }
                    else if (correct === 'N') {
                        child.N += 1;
                    }
                                       
                });
                
                if(cb){
                    cb(self.data);
                }

            };
            
            var error = function(err){
                console.log(err);
            };

            this._db.query(sql, success, error)();

        };


        this.getLevelSimple = function(idSubject, category) {
            
            //console.log("called __getLevel "+idSubject+" and "+category);
            var fullcategory = idSubject + "." + (category || 'g').toUpperCase().trim();

            var innerChild = this.data.getInnerChild(fullcategory);
            
            var counts = counter(innerChild);
           
            var total = 1.0*(counts.Y + counts.N);    //correct / incorrect
            var sum = counts.Y;

            var level = this.defaultLevel;
            
            if (total)
            {
                level = MAXLEVEL * sum / (1.0*total);
                //Average this over the last Levels "LL" array
                var num = 0;
                var den = 0;
                for(var i=0; i<innerChild.LL.length; i++){
                    num += i*i*innerChild.LL[i];
                    den += i*i;
                }
                var i = innerChild.LL.length+1;
                num += i*i*level;
                den += i*i;
                
                //Averaged level is
                level = Math.round(num/(1.0*den));
            }
            
            //Register this level in the innerChild!
            innerChild.LL.push(level);
            if(innerChild.LL.length > MEMORY_CYCLES){
                innerChild.LL.splice(0,1);
            }

            return level;
        };

        this.getLevel = function (idSubject, category)
        {
            
            //console.log("in get level "+idSubject+" cat "+category);
            //From the trained brain we interpolate the performance for the required
            //tags. Level is an scaled performance ranging from 0 - 4, i.e.
            //From simple to harder levels.
            category = category || "";
            if((""+category).indexOf(',')>=0)
            {
                var self = this;
                var sum = 0;
                var count = 0;
                category.split(",").forEach(function (c) {   //Take the mean of all these categories
                    if (c.trim()) {
                        sum += self.getLevelSimple(idSubject, c.trim());
                        count += 1;
                    }
                });

                return count > 0 ? Math.round(sum / (1.0 * count)) : this.defaultLevel;
            }
            else {
                return this.getLevelSimple(idSubject, category);
            }
        };


    };

    module.exports = BrainModule;

}());



        /*
         Brain.prototype.train = function()
         {
         //Must obtain information of all activities performed by this user
         //Information is gathered in the format of the tag-sytem.
         //Tag system is heirarchial, thus tags are in tree format.
         //For each tag, we provide a performance mark 0-100
         
         //How this user has performed on different tasks?
         //Is the given level correct or not?
         
         this.data = {};
         var self = this;
         var tmp = {};
         
         var sql =  "SELECT att.idActivity,att.score, att.level, act.category, act.difficulty from attempts as att inner join logins as l "+
         " on l.id=att.idLogins inner join users as u on u.id=l.idUser inner join activities as act on act.id = att.idActivity where u.id="+this.idUser+" and att.done='S'";
         
         
         var success = function(d){
         //Sort resultset by category
         d.result.forEach(function(row){
         var tag = (row.category || 'g').toLowerCase();
         var tags = tag.split(",");
         tags.forEach(function(t){
         var t2 = t.trim();
         var obj = tmp[t2];
         if(!obj)
         {
         obj = [];
         tmp[t2] = obj;
         }
         obj.push(row);
         });
         });
         
         
         //compute performance per tag
         for(var tag in tmp)
         {
         var sum = 0;
         var count = 0;
         tmp[tag].forEach(function(row){
         sum += row.score*(row.level+1);
         count += row.level+1;
         });
         if(count)
         {
         self.data[tag] = sum/count;
         }                        
         }
         tmp = [];
         };
         
         this._db.query(sql, success)();
         
         };
         */


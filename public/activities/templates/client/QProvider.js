//QProvider.js automatically generated from QProvider.json at Sun Oct 04 2015 07:45:28 GMT+0200 (CEST)
//Please, do not manually edit this file since it will be overriden.
define(["activities/libs/rgen-arithmetics.js","activities/libs/rgen-algebra.js","activities/libs/imDirectives.min.js"], function(RG1, POLY){
	"use strict";
	var module = function(client, server){
		return {

			init: function(){
				this._super();
				var self = this;
				var brain = this.brain;
				this.config.randomOrder = false;
				this.config.browsable = false;
				this.config.timeout = 0;
				this.config.allowerrors = 4;
				this.config.canAskTheory = true;
				this.config.canAskHelp = true;
				this.config.category = "ALG.POLY.FACTOR";
			},

			define: function(){
				var self = this;
				var i18n = this.i18n;
				//-------------------------Question 1
				var questions1 = this.createQuestion({
					init: function(){
						this._super(self.scope);
						this.headingHTML = i18n.get('head');
						this.allowerrors = 4;
					},

					update: function(){
					    var n = Math.floor(Math.random()+3);
					    this.poly = POLY.rpolz(n, 'Z', -5, 5);
					    if(Math.random()<0.25){
					        this.poly.c.push(0);
					    }
						this.ldps = {};
						client.selectLevel(this);
					}
				
					}, {repeat: 5});
				
				//....STEP1_1
				var step1_1 = {
					resolveCreate: function(defer){
						this.addScore = 1;
						var self = this;
						var txt = this.parentQuestion.poly.toString('x');
					    this.formulationLaTeX = "$"+txt+"$";
					    this.formulationHTML = "<katex>"+txt+"</katex>";
					    var cas = this.parentQuestion.poly.toString('x','cas');
					    server.cas.maxima.run("factor("+cas+");tex(factor("+cas+"))$").success(function(d){
					        self.answer = d.out[0].o;
					        self.answerHTML = "<katex>"+d.out[1].o+"</katex>";
					        self.answerLaTeX= "$"+d.out[1].o+"$";
					        self.parentQuestion.scope.userinput = '';
						    self.inputdiv = "P(x)=<input type='text' ng-model='userinput' ng-disabled='done' placeholder='factorization, p.e. (x-1)*(x+2)^2' style='width: 250px'/>";
						    defer.resolve(self);
					    });
					    
					},
					resolveCheck: function(defer){
						var userinput = this.parentQuestion.scope.userinput;
						var check = {valid: false, feedback: ''};
						var dif1 = "( "+this.answer+" ) - ( "+ (userinput || 0)+" )";
						if(userinput.indexOf(')')<0 && userinput.indexOf('(')<0){
						     check.feedback = 'Factor form needed!';
						     defer.resolve(check);
						     return;
						}
					 	server.cas.maxima.run(dif1+";").success(function(d){
						    if(d.err || d.out.length<1){
						        check.valid = null;
						        check.feedback='<br>Check math expression!';
						   } else{
						        check.valid = d.out[0].o == '0';
						   }
						   defer.resolve(check);
						});
					},
					getUserinputHTML: function(){
						var userinput = this.parentQuestion.scope.userinput;
						var html = "<katex>P(x)="+userinput.replace(/\*/g,'\\, ')+"</katex>";
						return html;
					}
				};
				questions1.forEach(function(q){
					q.createStep(step1_1);
				});
			
				}

		
		};

	};
	return module;
}); 
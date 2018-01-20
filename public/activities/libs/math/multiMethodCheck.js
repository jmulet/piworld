 define(["KAS"], function(){
   var TOLERANCE = 1e-6;
   
   //Based on the correct-answer; guess if this activity is of type numeric or algebraic
   var checker = function(userInput, expected, checkOpts){
        var userInput_orig = userInput;
        var expected_orig = expected;

        var type = "";

        try {
            var fixed_expected = pw.fixKAS(expected);
            expected = KAS.parse(fixed_expected).expr;
            if (!expected) {
                console.log("KAS unable to parse:: ", fixed_expected);
            }
        } catch (Ex) {
            console.log(Ex);
        }

        try {
            var tmp = expected.eval({});
            if (isNaN(tmp)) {
                type = "algebraic";
            } else {
                expected = tmp;
                type = "numeric";
            }
        } catch (Ex) {
            type = "";
        }

        //Use KAS to evaluate this expression (which may contain latex, e.g. \sqrt{3}/2.
        try {
            if (type) {
                var fixed_userinput = pw.fixKAS(userInput);
                userInput = KAS.parse(fixed_userinput).expr;
                if (!userInput) {
                    console.log("KAS unable to parse:: ", fixed_userinput);
                }

                if (type === "numeric") {
                    userInput = userInput.eval({});
                }                
            }
        } catch (Ex) {
            console.log(Ex);
            type = "";
        }


        var valid;
        if (type === "numeric") {
            valid = Math.abs(userInput - expected) < TOLERANCE;
        } else if (type === "algebraic") {
            try {
                valid = KAS.compare(userInput, expected).equal;
                if(checkOpts.simplified && valid){
                    valid = userInput.isSimplified();
                    if(!valid){
                        valid = {ok: false, msg: "Expressió no simplificada"};
                    }
                }
            } catch (Ex) {
                console.log("KAS failed to compare expressions ");
                type = "";
            }
        }

        //KAS fails and we need another method :: USE MAXIMA
        if (!type) {
            var defer = $.Deferred();
            valid = defer.promise();

            require(["/activities/libs/math/server-cas.js", "/activities/libs/math/latexParser/latex2mac.js"], function (SCAS, latex2mac) {
                var expr1, expr2;
                try {
                    expr1 = latex2mac.parse(userInput_orig);
                    expr2 = latex2mac.parse(expected_orig);
                } catch (Ex) {
                    console.log("Latex2mac:: Unable to parse expressions ", Ex, expr1, expr2);
                    defer.resolve();
                    return;
                }
                var comp = "ratsimp( (" + expr1 + ") - (" + expr2 + ") );";
                SCAS.maxima.run(comp).then(function (r) {
                    if (!comp.err && comp.out.length) {
                        defer.resolve(comp.out[0].o === "0");
                    } else {
                        defer.resolve();
                    }
                });
            });
        }

        return valid;
            
   };
   
   
   return checker;
});
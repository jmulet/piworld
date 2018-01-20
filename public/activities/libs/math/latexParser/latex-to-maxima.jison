/* Translates latex equations to CAS maxima */

/* lexical grammar */
%lex

// Some code that does stuff
%{
  // Number parsing
  doNumber = function(a){return parseFloat(a);};
  // Basic operators
  doAdd = function(a,b){return a+'+'+b;};
  doSub = function(a,b){return a+'-'+b;};
  doMul = function(a,b){return a+'*'+b;};
  doDiv = function(a,b){return a+'/'+b;};
  doPow = function(a,b){return '('+a+')^('+b+')';};
  doMod = function(a,b){return 'mod('+a+','+b+')';};
  doSqrt = function(a){return 'sqrt('+a+')';};
  doNRoot = function(a,b){return '('+b+')^(1/'+a+')';};
  doLn = function(a){return 'log('+a+')';};
  doLog10 = function(a){return '(log('+a+')/log(10))';};
  doLogBase = function(a,b){return '(log('+b+')/log('+a+'))';};
  // Brackets
  doParen = function(a){return '('+a+')';};
  doCurly = function(a){return '('+a+')';};
  doSquare = function(a){return '('+a+')';};
  doFloor = function(a){return 'floor('+a+')';};
  doCeil = function(a){return 'round('+a+')';};
  doAbs = function(a){return 'abs('+a+')';};
  // Trig
  doSin = function(a){return 'sin('+a+')';};
  doCos = function(a){return 'cos('+a+')';};
  doTan = function(a){return 'tan('+a+')';};
  doArcSin = function(a){return 'asin('+a+')';};
  doArcCos = function(a){return 'acos('+a+')';};
  doArcTan = function(a){return 'atan('+a+')';};
  doCsc = function(a){return '(1/sin('+a+'))';};
  doSec = function(a){return '(1/cos('+a+'))';};
  doCot = function(a){return '(1/tan('+a+'))';};
  // Logic
  doNot = function(a){ return '!'+a;};
  doAnd = function(a,b){ return a+'&&'+b;};
  doOr = function(a,b){ return a+'||'+b;};
  doIfThen = function(a,b){ return 'if('+a+'){'+b+';}'; };
  doEqual = function(a,b){ return a +'='+ b; }; // need fixing for logical test
  doNotEqual = function(a,b){ return a+'!='+b; };
  doLess = function(a,b){ return a+'<'+b; };
  doGreater = function(a,b){ return a+'>'+b; };
  doLessEq = function(a,b){ return a+'<='+b; };
  doGreaterEq = function(a,b){ return a+'>='+b; };
  // Summations

  // Constants:
  doConst = function(a){
    console.log("Const ", a);
    if( a === 'e' || a === '\\e' ){return '%e';}
    if( a === '\\pi' || a === '\pi' ){ return '%pi';}
    return a;
  };
  // Symbols (ie variables)
  doVar = function(a){
    if( a.indexOf('\\') === 0 ){
      return a.slice(1);
    }
    // Other ie x or y or froggie
    return a;
  };
%}

%%

// Variables numbers and constants
([0-9]*\.{0,1}[0-9]+)   { return 'NUMBER'; }
/*  (\w[a-zA-Z0-9_]*)       { return 'VAR'; } */
("e")                   { return 'CONST'; }
("\\e")                 { return 'CONST'; }
("\\pi")                { return 'CONST'; }

([a-zA-Z])     { return 'VAR'; }
("\\alpha")      { return 'VAR'; }
("\\beta")       { return 'VAR'; }
("\\chi")        { return 'VAR'; }
("\\delta")      { return 'VAR'; }
("\\epsilon")    { return 'VAR'; }
("\\varepsilon") { return 'VAR'; }
("\\eta")        { return 'VAR'; }
("\\gamma")      { return 'VAR'; }
("\\iota")       { return 'VAR'; }
("\\kappa")      { return 'VAR'; }
("\\lambda")     { return 'VAR'; }
("\\mu")         { return 'VAR'; }
("\\nu")         { return 'VAR'; }
("\\omega")      { return 'VAR'; }
("\\phi")        { return 'VAR'; }
("\\varphi")     { return 'VAR'; }
("\\psi")        { return 'VAR'; }
("\\rho")        { return 'VAR'; }
("\\sigma")      { return 'VAR'; }
("\\tau")        { return 'VAR'; }
("\\theta")      { return 'VAR'; }
("\\upsilon")    { return 'VAR'; }
("\\xi")         { return 'VAR'; }
("\\zeta")       { return 'VAR'; }
("\\Delta")      { return 'VAR'; }
("\\Gamma")      { return 'VAR'; }
("\\Lambda")     { return 'VAR'; }
("\\Omega")      { return 'VAR'; }
("\\Phi")        { return 'VAR'; }
("\\Pi")         { return 'VAR'; }
("\\Psi")        { return 'VAR'; }
("\\Sigma")      { return 'VAR'; }
("\\Theta")      { return 'VAR'; }
("\\Upsilon")    { return 'VAR'; }
("\\Xi")         { return 'VAR'; }
("\\aleph")      { return 'VAR'; }
("\\beth")       { return 'VAR'; }
("\\daleth")     { return 'VAR'; }
("\\gimel")      { return 'VAR'; }
// Basic operators
("+")                   { return 'ADD'; }
("-")                   { return 'SUB'; }
("\\pm")                { return 'ADDSUB'; }
("*")                   { return 'MUL'; }
("\\times")             { return 'MUL'; }
("\\cdot")              { return 'MUL'; }
("/")                   { return 'DIV'; }
("\\div")               { return 'DIV'; }
("\\frac")              { return 'FRAC'; }
("\\mod")               { return 'MOD'; }
// Exponential stuff
("\\sqrt")              { return 'SQRT'; }
("^")                   { return 'POW'; }
("\\ln")                { return 'LN'; }
("\\log_")              { return 'LOGBASE'; }
("\\log")               { return 'LOG10'; }
// Trig functions 
("\\sin")               { return 'SIN'; }
("\\cos")               { return 'COS'; }
("\\tan")               { return 'TAN'; }
("\\arcsin")            { return 'ARCSIN'; }
("\\arccos")            { return 'ARCCOS'; }
("\\arctan")            { return 'ARCTAN'; }
("\\csc")               { return 'CSC'; }
("\\sec")               { return 'SEC'; }
("\\cot")               { return 'COT'; }
// Brackets 
("||")                  { return 'MAGNITUDE'; }
("|")                   { return 'ABS'; }
("(")                   { return 'LPAREN'; }
("{")                   { return 'LCURLY'; }
("[")                   { return 'LSQUARE'; }
("\\lceil")             { return 'LCEIL'; }
("\\lfloor")            { return 'LFLOOR'; }
(")")                   { return 'RPAREN'; }
("}")                   { return 'RCURLY'; }
("]")                   { return 'RSQUARE'; }
("\\rceil")             { return 'RCEIL'; }
("\\rfloor")            { return 'RFLOOR'; }
("\\left")              {  }
("\\right")             {  }
// Logic stuff
("\\sim")               {return 'NOT';}
("\\wedge")             {return 'AND';}
("\\vee")               {return 'OR';}
("\\to")                {return 'IFTHEN';}
("\\leftrightarrow")    {return 'IFTHEN';}
("\\Rightarrow")        {return 'IFTHEN';}
("\\Leftrightarrow")    {return 'IFTHEN';}
("=")                   {return 'EQUAL';}
("\\equiv")             {return 'EQUAL';}
("\\ne")                {return 'NOT_EQUAL';}
("\\le")                {return 'LESS_EQUAL';}
("<=")                  {return 'LESS_EQUAL';}
("<")                   {return 'LT';}
("\\ge")                {return 'GREAT_EQUAL';}
(">=")                  {return 'GREAT_EQUAL';}
(">")                   {return 'GT';}
// Summation and product
("_")                   {return 'UNDERSCORE';}
("\\sum")               {return 'SUM';}

// Other stuff to ignore 
("$")                   {  }
(\s+)                   { }   /** Assume space as multiplication under some cases **/
<<EOF>>                 { return 'EOF'; }

/lex

/* operator associations and precedence */
%left SUM
%left IFTHEN
%left NOT AND OR EQUAL NOT_EQUAL LT GT GREAT_EQ LESS_EQ
%left ADD SUB
%left MUL DIV FRAC MOD
%right POW SQRT
%right SIN COS TAN ARCSIN ARCCOS ARCTAN CSC SEC COT LN LOG10 LOGBASE
%right UNDERSCORE
%right NEG /* unary negate operator should be done first */
%left IGNORE NUMBER


%start expressions

%% /* language grammar */

expressions
    : e EOF
        {return $1;}
    ;

e
    : e ADD e           {$$ = doAdd($1,$3);}
    | e SUB e           {$$ = doSub($1,$3);}
    | e MUL e           {$$ = doMul($1,$3);}    
    | e DIV e           {$$ = doDiv($1,$3);}
    | e MOD e           {$$ = doMod($1,$3);}
    | SQRT LSQUARE e RSQUARE LCURLY e RCURLY  {$$ = doNRoot($3,$6);}
    | SQRT  LCURLY e  RCURLY          {$$ = doSqrt($3);}
    | SQRT  e           {$$ = doSqrt($2);}
    | NROOT e e         {$$ = doNRoot($2, $3);}
    | FRAC e e          {$$ = doDiv($2,$3);}
    | e POW e           {$$ = doPow($1,$3);}
    | LN e              {$$ = doLn($2);}
    | LOG10 e           {$$ = doLog10($2);}
    | LOGBASE e e       {$$ = doLogBase($2,$3);}
    //Spaces
    | e SPACE e         {$$ = doMul($1,$3);}
    | e e               {$$ = doMul($1,$2);}
    
  
    | LPAREN SPACE e SPACE RPAREN   {$$ = doParen($3);}
    // Brackets
    | ABS     e ABS      {$$ = doAbs($2);}
    | LPAREN  e RPAREN   {$$ = doParen($2);}
    | LCURLY  e RCURLY   {$$ = doCurly($2);}
    | LSQUARE e RSQUARE  {$$ = doSquare($2);}
    | LFLOOR  e RFLOOR   {$$ = doFloor($2);}
    | LCEIL   e RCEIL    {$$ = doCeil($2);}
    // Trig
    | SIN e              {$$ = doSin($2);}
    | COS e              {$$ = doCos($2);}
    | TAN e              {$$ = doTan($2);}
    | ARCSIN e           {$$ = doArcSin($2);}
    | ARCCOS e           {$$ = doArcCos($2);}
    | ARCTAN e           {$$ = doArcTan($2);}
    | CSC e              {$$ = doCsc($2);}
    | SEC e              {$$ = doSec($2);}
    | COT e              {$$ = doCot($2);}
    // Logic
    | e IFTHEN e         {$$ = doIfThen($1,$3);}
    | NOT e              {$$ = doNot($2);}
    | e AND e            {$$ = doAnd($1,$3);}
    | e OR e             {$$ = doOr($1,$3);}
    | e EQUAL e          {$$ = doEqual($1,$3);}
    | e NOT_EQUAL e      {$$ = doNotEqual($1,$3);}
    | e LT e             {$$ = doLess($1,$3);}
    | e GT e             {$$ = doGreater($1,$3);}
    | e GREAT_EQ e       {$$ = doGreaterEq($1,$3);}
    | e LESS_EQ e        {$$ = doLessEq($1,$3);}
    // Summations
    | SUM SUBSCRIPT e POW e e {$$ = doSum($6,$3,$5);}
    // Basics
    | CONST               {$$ = doConst(yytext); }
    | NUMBER              {$$ = doNumber(yytext); }
    | VAR                 {$$ = doVar(yytext); }
    // Convert 5x to 5*x
    | NUMBER e          {$$ = doMul($1,$2);}
    | CONST e           {$$ = doMul(doConst($1),$2);}
    | VAR e           {$$ = doMul($1,$2);}
    ;


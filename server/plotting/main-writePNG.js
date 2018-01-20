
var PL = {};
require('./plotting.js')(PL);
var args = process.argv.slice(2);
PL.write_png(args[0], args[1], args[2]);


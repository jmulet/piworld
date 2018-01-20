var EventEmitter = require('events').EventEmitter;
var path = require('path');
var util = require('util');
var spawn = require('child_process').spawn;

function toArray(source) {
    if (typeof source === 'undefined' || source === null) {
        return [];
    } else if (!Array.isArray(source)) {
        return [source];
    }
    return source;
}

function extend(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
        if (source) {
            for (var key in source) {
                obj[key] = source[key];
            }
        }
    });
    return obj;
}

/**
 * An interactive Yacas shell exchanging data through stdio
 * @param {string} script    The script to execute (can be a file or commands)
 * @param {object} [options] The launch options (also passed to child_process.spawn)
 * @constructor
 */
var YacasShell = function (script, options) {
    var self = this;
    var errorData = '';
    EventEmitter.call(this);

    options = extend({}, YacasShell.defaultOptions, options);
    var yacasPath = options.yacasPath || '/usr/bin/yacas';
    var yacasOptions = toArray(options.yacasOptions);
    var scriptArgs = toArray(options.args);

    this.script = script;
    this.command = yacasOptions.concat(this.script);
    this.mode = options.mode || 'text';
    this.terminated = false;
   
    this.childProcess = spawn(yacasPath, this.command, {});
    
    ['stdout', 'stdin', 'stderr'].forEach(function (name) {
        self[name] = self.childProcess[name];
        self.mode !== 'binary' && self[name].setEncoding('utf8');
    });

    // listen for incoming data on stdout
    this.stdout.on('data', function (data) {
        //console.log("stdout->"+data);
        self.mode !== 'binary' && self.receive(data);
    });

    // listen to stderr and emit errors for incoming data
    this.stderr.on('data', function (data) {
        //console.log("stderr->"+data);
        errorData += ''+data;
    });

    this.childProcess.on('exit', function (code) {
        //console.log("exit->"+code);
        var err;
        if (errorData || code !== 0) { //
            if (errorData) {
                err = self.parseError(errorData);
            } else {
                err = new Error('process exited with code ' + code);
            }
            err = extend(err, {
                executable: yacasPath,
                options: yacasOptions.length ? yacasOptions : null,
                script: self.script,
                args: scriptArgs.length ? scriptArgs : null,
                exitCode: code
            });
            // do not emit error if only a callback is used
            if (self.listeners('error').length || !self._endCallback) {
                self.emit('error', err);
            }
        }
        self.exitCode = code;
        self.terminated = true;
        self.emit('close');
        self._endCallback && self._endCallback(err);
    });
};
util.inherits(YacasShell, EventEmitter);

// allow global overrides for options
YacasShell.defaultOptions = {};

/**
 * Runs a Yacas script and returns collected messages
 * @param  {string}   script   The script to execute
 * @param  {Object}   options  The execution options
 * @param  {Function} callback The callback function to invoke with the script results
 * @return {YacasShell}       The YacasShell instance
 */
YacasShell.run = function (script, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = null;
    }

    var yacshell = new YacasShell(script, options);
    var output = [];

    return yacshell.on('message', function (message) {
        output.push(message);
    }).end(function (err) {
        if (err) return callback(err);
        return callback(null, output.length ? output : null);
    });
};

/**
 * Parses an error thrown from the Maxima process through stderr
 * @param  {string|Buffer} data The stderr contents to parse
 * @return {Error} The parsed error with extended stack trace when traceback is available
 */
YacasShell.prototype.parseError = function (data) {
    var text = ''+data;
    var error;

    if (/^Traceback/.test(text)) {
        // traceback data is available
        var lines = (''+data).trim().split(/\n/g);
        var exception = lines.pop();
        error = new Error(exception);
        error.traceback = data;
        // extend stack trace
        error.stack += '\n    ----- Yacas Traceback -----\n  ';
        error.stack += lines.slice(1).join('\n  ');
    } else {
        // otherwise, create a simpler error with stderr contents
        error = new Error(text);
    }

    return error;
};

/**
 * Sends a message to the Yacas shell through stdin
 * This method
 * Override this method to format data to be sent to the Maxima process
 * @param {string|Object} data The message to send
 * @returns {YacasShell} The same instance for chaining calls
 */
YacasShell.prototype.send = function (message) {
    if (this.mode === 'binary') {
        throw new Error('cannot send a message in binary mode, use stdin directly instead');
    } else if (this.mode === 'json') {
        // write a JSON formatted message
        this.stdin.write(JSON.stringify(message) + '\n');
    } else {
        // write text-based message (default)
        if (typeof message !== 'string') message = message.toString();
        this.stdin.write(message + '\n');
    }
    return this;
};

/**
 * Parses data received from the Maxima shell stdout stream and emits "message" events
 * This method is not used in binary mode
 * Override this method to parse incoming data from the Maxima process into messages
 * @param {string|Buffer} data The data to parse into messages
 */
YacasShell.prototype.receive = function (data) {
    var self = this;
    var lines = (''+data).split(/\n/g);

    if (lines.length === 1) {
        // an incomplete record, keep buffering
        this._remaining = (this._remaining || '') + lines[0];
        return this;
    }

    var lastLine = lines.pop();
    // fix the first line with the remaining from the previous iteration of 'receive'
    lines[0] = (this._remaining || '') + lines[0];
    // keep the remaining for the next iteration of 'receive'
    this._remaining = lastLine;

    lines.forEach(function (line) {
        if (self.mode === 'json') {
            try {
                self.emit('message', JSON.parse(line));
            } catch (err) {
                self.emit('error', extend(
                    new Error('invalid JSON message: ' + data + ' >> ' + err),
                    { inner: err, data: line}
                ));
            }
        } else {
            self.emit('message', line);
        }
    });

    return this;
};

/**
 * Closes the stdin stream, which should cause the process to finish its work and close
 * @returns {YacasShell} The same instance for chaining calls
 */
YacasShell.prototype.end = function (callback) {
    this.childProcess.stdin.end();
    this._endCallback = callback;
    return this;
};

module.exports = YacasShell;
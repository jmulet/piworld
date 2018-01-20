module.exports = function parseCookies(request) {
    var list = {},
        rc = request.headers ? request.headers.cookie : request;

    rc && rc.split(';').forEach(function (cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    var parser = function () {
        this.get = function (key) {
            var cookie = list[key];
            if (cookie) {
                return cookie.replace(/["']/g, '');
            }
            return null;
        };
    };

    return new parser();
};
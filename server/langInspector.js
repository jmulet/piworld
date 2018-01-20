const cookieParser = require('./parseCookies'); 


const I18n = {
    SUPPORTED_LANGS: ['ca', 'es', 'en'],
    DEFAULT_LANG: 'en'
};

module.exports = function langInspector(request, response) {
    let lang;

    // First check for queryParameter clang
    lang = (request.query["clang"] || "").toLowerCase();
    if (I18n.SUPPORTED_LANGS.indexOf(lang) < 0) {
        lang = null;
    } else if (response) {
        // set a cookie to avoid using queryParameters on future requests
        response.cookie("clang", lang);
    }

    // Second check for a clang cookie
    if (!lang && request.headers.cookie) {
        lang = (cookieParser(request).get("clang") || "").toLowerCase();
        if (I18n.SUPPORTED_LANGS.indexOf(lang) < 0) {
            lang = null;
        }
    }

    // Finally, look for request header
    if (!lang) {
        lang = (request.acceptsLanguages(I18n.SUPPORTED_LANGS) || I18n.DEFAULT_LANG).toLowerCase();
        if (I18n.SUPPORTED_LANGS.indexOf(lang) < 0) {
            lang = I18n.DEFAULT_LANG;
        }
    }

    return lang;
}

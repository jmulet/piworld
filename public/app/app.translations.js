(function(app, angular){
'use strict';  

app.config(['$translateProvider', function ($translateProvider) {
        $translateProvider.useCookieStorage();
        $translateProvider.useUrlLoader('/rest/i18n/lang'); 
        $translateProvider.useSanitizeValueStrategy(null);
        $translateProvider.preferredLanguage(navigatorLang() || 'ca');        
    }]);
   
}(window.pw.app, angular));  
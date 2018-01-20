var module = angular.module('ngJSPanel', []);

module.service('jsPanel', function(){
   
    $.jsPanel.defaults.controls.iconfont = 'bootstrap';
    $.jsPanel.defaults.theme = 'primary';
    
    this.create = function (title, template) {
        var panel = $.jsPanel({
            //selector: "#jspanel-func .panel-body",
            title: title || "",
            position: "center",
            load:  {url: template}
        });
        return panel;
    };
    
    return this;
});

 define(['text!/activities/libs/math/mathinput/mathquill-numericpad.html'], function(template){

        

    var NumPad = function NumPad(id){
        this.id = id || 0;
        this.elem = $(template);
    };
    
    
    NumPad.prototype.bindMQ = function(mqarea){
        //var hasTouch = 'ontouchstart' in document.documentElement;
        var els = this.elem.find('button.mqkeybtn');
        els.unbind().off();
        els.on('click', mqeeinsert);            
        
    

        function mqeeinsert(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            
            var t = $(this).attr("btntext");
            var type = $(this).attr("btntype");
            t = t.replace('\\\\', '\\');
            if (type === 'cmd') {
                mqarea.cmd(t);
            } else if (type === 'latex') { //latex
                mqarea.write(t);
            } else if (type === 'key') { //keyboard character
                mqarea.typedText(t);
            } else if (type === 'func') { //function
                var sel = mqarea.getSelection && mqarea.getSelection();
                if (sel) {
                    mqarea.write(t + '\\left(' + sel + '\\right)');
                } else {
                    mqarea.write(t + '\\left(\\right)');
                    mqarea.keystroke('Left');
                }
            } else if (type === 'int') { //interval
                var leftbrack = t.charAt(0);
                var rightbrack = t.charAt(1);
                var sel = mqarea.getSelection && mqarea.getSelection();
                if (sel) {
                    mqarea.write('\\left' + leftbrack + sel + '\\right' + rightbrack);
                } else {
                    mqarea.write('\\left' + leftbrack + '\\right' + rightbrack);
                    mqarea.keystroke('Left');
                }
            } else if (type === 'sfunc') {  //simplefunction
                var sel = mqarea.getSelection && mqarea.getSelection();
                if (sel) {
                    mqarea.write(t + '{' + sel + '}');
                } else {
                    mqarea.write(t + '{}');
                }
                mqarea.keystroke('Left');
            } else if (type === 'ctrl') {  //control keys (Up, Backspace, etc)
                mqarea.keystroke(t);
            }
            mqarea.focus();

            return false;
        }

    };                
        
        
     NumPad.prototype.destroy = function(){
         this.elem.find('button.mqkeybtn').unbind().off();
     }; 
     
     
    return NumPad;

});
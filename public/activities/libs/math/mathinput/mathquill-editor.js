define(['text!mqEdtPalette', 'css!mqEdtCss'], function(paletteTemplate){

(function(window, $){ 
     
     //ModalTemplate goes to body
     //button goes to elm 
     /**
    var template = '<div style="height:300px!important;padding:10px;">'+
    			   '   <h3><span id="mathquill-{{id}}"></span></h3>'+
    			   '	<div id="mathquill-palette-{{id}}">'+
    			   '    </div>'+
    			   '</div>';
	**/   


 	var MQ, mqarea, mqareaholder;
	var mqmousebase;

	MQ = MathQuill.getInterface(MathQuill.getInterface.MAX);
	

 	var link = function(elm){
 		var onChangesListener;
 		var id = Math.floor(Math.random()*1e6);
 		//var html = $(template.replace(/{{id}}/g, id));
 		//elm.append(html);

	    var palette = $(paletteTemplate.replace(/{{id}}/g, id));
	    elm.append(palette);		


	     //Simplify palette!!

	  $('a[href="#tabs-brackets"').parent().remove();
	  $('a[href="#tabs-acc"').parent().remove();
	  $('a[href="#tabs-calc"').parent().remove();



	    MQ.config({
			  spaceBehavesLikeTab: true,
			  charsThatBreakOutOfSupSub: '=<>',
			  autoCommands: 'pi theta sqrt sum int oo',
			  autoFunctionize: 'sin cos tan sec csc cot log ln',
			  addCommands: {'oo':['VanillaSymbol','\\infty ','&infin;']},
			  keyboardPassthrough: true,
			  handlers: { edit: function(){ 
		  	  			onChangesListener && onChangesListener();
		   				} },
		  	  restrictMismatchedBrackets: true
     	});


		/**** Editor pallete bloc1 **/
        var hasTouch = 'ontouchstart' in document.documentElement;
        mqareaholder = $('#mathquill-'+id);
        mqarea = MQ.MathField(mqareaholder[0]);
		//$('.mathquill-rendered-math').each(function() { MQ.StaticMath(this); });
	  	var inputs = mqareaholder.find('input,textarea');
	  	inputs.focus();
	  	inputs.attr('autocapitalize', 'off');
	  	inputs.attr('readonly', 'true');



  	
  	if (!hasTouch) {
  		$('#mqeeinsides td.mqeebtn').bind('click',mqeeinsert);

  		/**

bind('mouseover mouseup', function() {
			if (!$(this).hasClass("mqeeactive")) {
				$(this).addClass("mqeehighlight");	
			}
		}).bind('mousedown', function (e) {
			$(this).addClass("mqeeclick");	
			if (e.preventDefault) {e.preventDefault()};
		}).bind('mouseout', function () {
			$(this).removeClass("mqeehighlight");
			$(this).removeClass("mqeeclick");
		}).bind('mouseup', function () {
			$(this).removeClass("mqeeclick");
		})
  		**/

		 
  		$('#mqeetopbar').mousedown(function(evt) {
  			if (evt.preventDefault) {evt.preventDefault()};
  			$("body").addClass("unselectable");
			mqmousebase = {left:evt.pageX, top: evt.pageY};
			$("body").bind('mousemove',mqeemousemove);
			$("body").mouseup(function(event) {
				var p = $('#mqee').offset();
				lasteepos.left = p.left;
				lasteepos.top = p.top;
				$("body").off('mousemove',mqeemousemove);
				$("body").removeClass("unselectable");
				$(this).off(event);
			});
		});
  	} else {
  		$('#mqeeinsides td.mqeebtn').bind('touchstart', function (e) {
  			if (e.preventDefault) {e.preventDefault()};
			$(this).addClass("mqeeclick");	
		}).bind('touchend', function (e) {
			if (e.preventDefault) {e.preventDefault()};
			$(this).delay(500).removeClass("mqeeclick");
		}).bind('touchend', mqeeinsert);
		$('#mqeeclosebutton').bind('touchend',function(e) {if (e.preventDefault) {e.preventDefault()}; hideee()});
		$('#mqeetopbar').bind('touchstart', function(evt) {
			if (evt.preventDefault) {evt.preventDefault()};
			var touch = evt.originalEvent.changedTouches[0] || evt.originalEvent.touches[0];
			mqmousebase = {left:touch.pageX, top: touch.pageY};
			$("body").addClass("unselectable");
			$("body").bind('touchmove',mqeetouchmove);
			$("body").bind('touchend', function(event) {
				var p = $('#mqee').offset();
				lasteepos.left = p.left;
				lasteepos.top = p.top;
				$("body").off('touchmove',mqeetouchmove);
				$("body").removeClass("unselectable");
				$(this).off(event);
			});	
		});
 	}
  	/* prevents stuff outside of mathquill from getting clicked, but also prevents
  	   selecting text in touch mode
  		$('#mqeeinsides').bind("touchstart", function (evt) {
  			if (evt.preventDefault) {evt.preventDefault()};
  			if (evt.stopPropagation) {evt.stopPropagation()};
		});*/

		/** Editor palette bloc 2 **/

		//When page loads...

	$(".tab_content").hide(); //Hide all content
	$("#tabs-general").css({"display": ""});  //Show the general tab.

	//On Click Event
	$("ul.tabs li").click(function() {

		$("ul.tabs li").removeClass("active"); //Remove any "active" class
		$(this).addClass("active"); //Add "active" class to selected tab
		$(".tab_content").hide(); //Hide all tab content

		var activeTab = $(this).find("a").attr("href"); //Find the href attribute value to identify the active tab + content
		$(activeTab).show(); //Fade in the active ID content
		mqarea.focus();
		return false;
	});


	/** Editor palette bloc 3 **/
function mqPrepTabs(type,extras) {   //type: 0 basic, 1 advanced.  extras = 'interval' or 'ineq'
	$(".tab_content").hide();
	$("ul.tabs li").removeClass("active").each(function(index,el) {
		if (index==0) {  	
			if (type==0) { 
				$(el).addClass("active").show();
				var activeTab = $(el).find("a").attr("href"); //Find the href attribute value to identify the active tab + content
				$(activeTab).show();
			} else {
				$(el).hide();
			}
		} else if (index==1) {  	
			if (type==1) { 
				$(el).addClass("active").show();
				var activeTab = $(el).find("a").attr("href"); //Find the href attribute value to identify the active tab + content
				$(activeTab).show();
			} else {
				$(el).hide();
			}
		} else if (index==2) {
			if (extras=='int') {
				$(el).show();
			} else {
				$(el).hide();
			}
		} else if (index==3) {
			if (extras=='ineq') {
				$(el).show();
			} else {
				$(el).hide();
			}
		} else {
			if (type==1) { 
				$(el).show();
			} else {
				$(el).hide();
			}
		}		
	});
	
}
function mqeemousemove(evt) {
	$('#mqee').css('left', (evt.pageX - mqmousebase.left) + lasteepos.left)
	  .css('top', (evt.pageY - mqmousebase.top) + lasteepos.top);
	if (evt.preventDefault) {evt.preventDefault()};
	if (evt.stopPropagation) {evt.stopPropagation()};
	return false;
}
function mqeetouchmove(evt) {
	var touch = evt.originalEvent.changedTouches[0] || evt.originalEvent.touches[0];
  		
	$('#mqee').css('left', (touch.pageX - mqmousebase.left) + lasteepos.left)
	  .css('top', (touch.pageY - mqmousebase.top) + lasteepos.top);
	if (evt.preventDefault) {evt.preventDefault()};
	if (evt.stopPropagation) {evt.stopPropagation()};

	return false;
}

function mqeeinsert(e) {
	if (e.preventDefault) {e.preventDefault()};
	if (e.stopPropagation) {e.stopPropagation()};
	var t = $(this).attr("btntext");
        var type = $(this).attr("btntype");
        t = t.replace('\\\\','\\');
        if (type=='cmd') {
		mqarea.cmd(t);
	} else if (type=='latex') { //latex
		mqarea.write(t);
	} else if (type=='key') { //keyboard character
		mqarea.typedText(t);
	} else if (type=='func') { //function
		var sel = mqarea.getSelection();
		if (sel) {
			mqarea.write(t+'\\left('+sel+'\\right)');
		} else {
			mqarea.write(t+'\\left(\\right)');
			mqarea.keystroke('Left');
		}
	} else if (type=='int') { //interval
		var leftbrack = t.charAt(0);
		var rightbrack = t.charAt(1);
		var sel = mqarea.getSelection();
		if (sel) {
			mqarea.write('\\left'+leftbrack+sel+'\\right'+rightbrack);
		} else {
			mqarea.write('\\left'+leftbrack+'\\right'+rightbrack);
			mqarea.keystroke('Left');
		}
	} else if (type=='sfunc') {  //simplefunction
		var sel = mqarea.getSelection();
		if (sel) {
			mqarea.write(t+'{'+sel+'}');
		} else {
			mqarea.write(t+'{}');
		}
		mqarea.keystroke('Left');
	} else if (type=='ctrl') {  //control keys (Up, Backspace, etc)
		mqarea.keystroke(t);
	} 
	mqarea.focus();

	return false;
}
  

	 
		 
		var api = {
			latex: function(latex){
				if(typeof(latex)==='string'){
					 mqarea.latex(latex);
				} else {
					 return mqarea.latex();
				}
			},
			clear: function(){
				mqarea.latex("");
			},
			focus: function(){
				mqarea.focus();
			}
		}
		return api;
 	};


 	$.fn.pwMathquillEditor = function(elm, opts){
 		return link(this, opts);
 	}

 }(this, jQuery))


});

/* 
 * Extensions to prototypes
 */
function navigatorLang(){
    if(navigator.languages != undefined)
    {
        return navigator.languages[0];
    }
    else
    {
        return navigator.language;
    }
}

(function(exporta){


        //adds endsWidth support to the prototype of String class
        if (!String.prototype.startsWith) 
        {
          Object.defineProperty(String.prototype, 'startsWith', {
            value: function(searchString) {

              var subjectString = this.toString();

              var lastIndex = subjectString.indexOf(searchString);
              return lastIndex === 0;
            }
          });
        };

        if (!String.prototype.endsWith) 
        {
          Object.defineProperty(String.prototype, 'endsWith', {
            value: function(searchString, position) {

              var subjectString = this.toString();

              if(typeof(searchString)==='object'){
                  var found = false;
                  for(var i in searchString){

                      if(subjectString.endsWith(searchString[i])){
                          found = true;
                          break;
                      }
                  }
                  return found;
              }  

              if (position === undefined || position > subjectString.length) {
                position = subjectString.length;
              }
              position -= searchString.length;
              var lastIndex = subjectString.indexOf(searchString, position);
              return lastIndex !== -1 && lastIndex === position;
            }
          });
        };

        if(!String.prototype.repeat){
            String.prototype.repeat = function(times) {
               return (new Array(times + 1)).join(this);
            };
        }

        String.prototype.html2latex = function() {
               var out = this.replace(/<katex>/gi,'$').replace(/<\/katex>/gi,'$');
               return out;
        };

        if(!Object.values){
            Object.values = function (object) {
                var values = [];
                for (var property in object) {
                    values.push(object[property]);
                }
                return values;
            };
        }


        if(!Array.prototype.random)
        {
            Object.defineProperty(Array.prototype, 'random', {
            value: function() {
                return this[Math.floor(Math.random()*this.length)];
            }
          });
        }

        if(!Array.prototype.equals)
        {
            Array.prototype.equals = function (array, strict) {
                if (!array)
                    return false;

                if (arguments.length === 1)
                    strict = true;

                if (this.length !== array.length)
                    return false;

                for (var i = 0; i < this.length; i++) {
                    if (this[i] instanceof Array && array[i] instanceof Array) {
                        if (!this[i].equals(array[i], strict))
                            return false;
                    }
                    else if (strict && this[i] !== array[i]) {
                        return false;
                    }
                    else if (!strict) {
                        return this.sort().equals(array.sort(), true);
                    }
                }
                return true;
            };
        }

        if(!Array.prototype.clear)
        {
            Array.prototype.clear = function() {
                this.splice(0, this.length);
            };
        }

        if(!Array.prototype.shuffle)
        {
            Array.prototype.shuffle = function() {
              var i = this.length, j, temp;
              if ( i === 0 ) return this;
              while ( --i ) {
                 j = Math.floor( Math.random() * ( i + 1 ) );
                 temp = this[i];
                 this[i] = this[j];
                 this[j] = temp;
              }
              return this;
            };
        }


        if(!Array.prototype.forEach)
        {
            Array.prototype.forEach = angular.forEach;
        }

        //Polyfill DOM operations for all browsers
        if (!Element.prototype.remove ) {
            Element.prototype.remove = function() {
                this.parentNode.removeChild(this);
            };
        }


        //Define extra Mathematical prototypes
        //Power to any exponent, not only integer
        
        if(!Math.ln)
        {
            Math.ln = Math.log;   //An alias; log_10 is log10.            
        }
        Math.power = function(b, x){
            return Math.exp(x*Math.log(b));
        };
        
        if(!Math.logb)
        {
            Math.logb = function(a, b) {
                return Math.log(a)/Math.log(b || 10);
            };
        }
        if(!Math.root)
        {
            Math.root = function(a, n) {
                return Math.power(a, 1.0/n);
            };
        }
        if(!Math.srandom)
        {
            Math.srandom = function() {
                return Math.random().toString(36).slice(2);
            };
        }
        if(!Math.irandom)
        {
            Math.irandom = function(a, b) {
                a = a || 0;
                b = b || 10;
                return Math.floor( Math.random()*(b-a)) + a;
            };
        }
        if(!Math.seed)
        {  
            Math.seed = function(seed) {
                this.seed = seed;
                this.random = function(n){
                    n = n || 1;
                    var list = new Array(n);
                    for(var i=0; i<n; i++){
                        this.seed = (this.seed * 9301 + 49297) % 233280;
                        list[i] = this.seed / 233280;
                    }
                    return n>1? list: list[0];
                };
                return this;
            };
        }
        if(!Math.fact){
            Math.fact = function(n) {
                if ((typeof n !== 'number') ||  n < 0){ 
                    return false; 
                }
                if (n === 0) {
                    return 1;
                }
                return n * Math.fact(n - 1);
            };
        }
        if(!Math.binomial){
           Math.binomial = function (n, k) {
            if ((typeof n !== 'number') || (typeof k !== 'number') || n < k){ 
                return false; 
            }
            var coeff = 1;
            for (var x = n-k+1; x <= n; x++) {
                coeff *= x;
            }
            for (x = 1; x <= k; x++) {
                coeff /= x;
            }
            return coeff;
        };
        }


        /**
         * Object.extend()
         * @author  Bryan Dragon
         * @website www.bryandragon.com
         * @license MIT
         */
        (function () {
          'use strict';

          var hasOwn = Object.prototype.hasOwnProperty
            , descriptorProps =
                'get,set,value,writable,enumerable,configurable'.split(',');

          // Add the ability to invoke "super" from within the given function
          function withSuper(fn, _super_) {
            return function () {
              var _super = this._super;
              this._super = _super_;
              var value = fn.apply(this, arguments);
              this._super = _super;
              return value;
            };
          }

          if (typeof Object.extend !== 'function') {
            Object.extend = function (Parent, protoProps, staticProps) {
              var prototype, Child;

              if (typeof Parent !== 'function' && arguments.length < 3) {
                staticProps = protoProps;
                protoProps = Parent;
                Parent = function () {};
              }

              protoProps || (protoProps = {});
              staticProps || (staticProps = {});

              Child = function () {
                if (this.init) {
                  this.init.apply(this, arguments);
                }
              };

              // Inherit static properties
              for (var name in Parent) {
                if (hasOwn.call(Parent, name)) {
                  Child[name] = Parent[name];
                }
              }

              // Add static properties
              for (var name in staticProps) {
                Child[name] = staticProps[name];
              }

              // Build child prototype
              function ctor() { this.constructor = Child; }
              ctor.prototype = Parent.prototype;

              prototype = new ctor;

              // Add instance properties to prototype
              for (var name in protoProps) {
                // Define ECMAScript5 properties for properties prefixed
                // with `$`
                if (name.substr(0, 1) === '$' &&
                      (typeof protoProps[name] === 'object' ||
                       typeof protoProps[name] === 'function')) {
                  var descriptor = protoProps[name];
                  name = name.substr(1);

                  // Support closures
                  if (typeof descriptor === 'function') {
                    descriptor = descriptor();
                  }

                  // Allow getter/setter inheritance
                  var parentDescriptor =
                    Object.getOwnPropertyDescriptor(Parent.prototype, name);

                  if (parentDescriptor) {
                    var hasValue = (hasOwn.call(descriptor, 'value') ||
                                    hasOwn.call(descriptor, 'writable'));
                    var hasAccessor = (hasOwn.call(descriptor, 'get') ||
                                       hasOwn.call(descriptor, 'set'));

                    descriptorProps.forEach(function (prop) {
                      if (prop === 'get' || prop === 'set') {
                        if (! hasValue) {
                          if (typeof parentDescriptor[prop] === 'function') {
                            if (typeof descriptor[prop] === 'function') {
                              descriptor[prop] = withSuper(descriptor[prop],
                                parentDescriptor[prop]);
                            }
                            else {
                              descriptor[prop] = parentDescriptor[prop];
                            }
                          }
                        }
                      }
                      else if (prop === 'value' || prop === 'writable') {
                        if (! hasAccessor) {
                          if (! hasOwn.call(descriptor, prop) &&
                                hasOwn.call(parentDescriptor, prop)) {
                            descriptor[prop] = parentDescriptor[prop];
                          }
                        }
                      }
                      else {
                        if (! hasOwn.call(descriptor, prop) &&
                              hasOwn.call(parentDescriptor, prop)) {
                          descriptor[prop] = parentDescriptor[prop];
                        }
                      }
                    });
                  }

                  Object.defineProperty(prototype, name, descriptor);
                }
                // Allow instance methods to call `this._super()`
                else if (typeof protoProps[name] === 'function' &&
                         typeof prototype[name] === 'function') {
                  prototype[name] =
                    withSuper(protoProps[name], Parent.prototype[name]);
                }
                // Otherwise, just copy the property
                else {
                  prototype[name] = protoProps[name];
                }
              }

              // Apply child prototype
              Child.prototype = prototype;

              // Provide reference to parent prototype,
              // as is convention elsewhere
              Child.__super__ = Parent.prototype;

              // Allow inheritance directly from child class
              Child.extend = function (protoProps, staticProps) {
                return Object.extend(Child, protoProps, staticProps);
              }

              return Child;
            };
          }


  })();


exporta.isMobile = function(){
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

exporta.testEmail = function(emailAddress){
    var pattern = new RegExp(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/i);
    return pattern.test(emailAddress);
};



//Events polyfill--------------------------------------------------------------
// addEventListener support for IE8 and before
    exporta.bindEvent = function (element, eventName, eventHandler) {
        if (element.addEventListener) {
            element.addEventListener(eventName, eventHandler, false);
        } else if (element.attachEvent) {
            element.attachEvent('on' + eventName, eventHandler);
        }
    };
    exporta.unbindEvent = function (element, eventName) {
        if (element.removeEventListener) {
            element.removeEventListener(eventName);
        } else if (element.detachEvent) {
            element.detachEvent('on' + eventName);
        }
    };
    
    
//Iframe API ====================================================================
            
var iframeAPI= {
        isIframe: window.parent && window.parent!==window && (window.location.origin === window.parent.location.origin),
        initialized: false,
        listeners: [],                       
        init: function(){  
              if(iframeAPI.initialized){
                  return;
              }
              var listener = function(evt){
                  var mail;
                  try{
                      mail = JSON.parse(evt.data);
                      $.each(iframeAPI.listeners, function(i, handler){
                        handler(mail.key, mail.msg);  
                      });
                  } catch(Ex){
                      console.log(evt.data, Ex);
                  }                 
                   
              };
              exporta.bindEvent(window, "message", listener);
              iframeAPI.initialized = true;
        },
        destroy: function(){
             exporta.bindEvent(window, "message");
        },
        attachListener: function(listener){
            if(!iframeAPI.initialized){
                iframeAPI.init();
            }
            iframeAPI.listeners.push(listener);
        },
        send: function(key, msg, frame){                             
            if(!iframeAPI.isIframe && !frame){
                console.log("isIframe?",iframeAPI.isIframe, "You must provide an iframe to send to");
                return;
            }
            var mail = {
                key: key,
                msg: msg
            };
            if(!frame){
                frame = window.parent;
            }
            if(!frame.postMessage){
                frame = frame.contentWindow;
            }
            frame.postMessage(JSON.stringify(mail), "*");
        }
};    

exporta.iframeAPI= iframeAPI;
                                
//wrapper around fullscreen with a css fallback for ios
////FScreen======================================================================
 
var FSKey = {
    fullscreenEnabled: 0,
    fullscreenElement: 1,
    requestFullscreen: 2,
    exitFullscreen: 3,
    fullscreenchange: 4,
    fullscreenerror: 5
};

var webkit = ['webkitFullscreenEnabled', 'webkitFullscreenElement', 'webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitfullscreenchange', 'webkitfullscreenerror'];
var moz = ['mozFullScreenEnabled', 'mozFullScreenElement', 'mozRequestFullScreen', 'mozCancelFullScreen', 'mozfullscreenchange', 'mozfullscreenerror'];
var ms = ['msFullscreenEnabled', 'msFullscreenElement', 'msRequestFullscreen', 'msExitFullscreen', 'MSFullscreenChange', 'MSFullscreenError'];

var vendor = 'fullscreenEnabled' in document && Object.keys(FSKey) || webkit[0] in document && webkit || moz[0] in document && moz || ms[0] in document && ms || [];

var fullscreenElement;
var btnHandler;
    
    
var FScreen = {
  toggleFullscreen: function(element, btn) {
        if(!fullscreenElement){
            FScreen.requestFullscreen(element, btn);            
        } else {
             if(element === fullscreenElement){
                 FScreen.exitFullscreen(element);
             } else {
                 FScreen.exitFullscreen();
                 FScreen.requestFullscreen(element, btn);                 
             }
        }
  },
  requestFullscreen: function(element, btn) {
    
        btn && btn.removeClass("glyphicon-resize-full");        
        fullscreenElement = element;        
        btn && btn.addClass("glyphicon-resize-small");        
        btnHandler = btn;      
        
        if(FScreen.fullscreenEnabled()){
           return (element[0][vendor[FSKey.requestFullscreen]])();            
        } else {
            element.addClass("fullscreen-max");
        }
  }, 
  exitFullscreen: function(element, btn) {
        if (btnHandler) {
            btnHandler.removeClass("glyphicon-resize-small").addClass("glyphicon-resize-full");
        }
        fullscreenElement = null;
        if (FScreen.fullscreenEnabled()) {
            return document[vendor[FSKey.exitFullscreen]].bind(document)();
        } else {
            element.removeClass("fullscreen-max");
        } 
  },
  addEventListener: function(type, handler, options) {
    return document.addEventListener(vendor[FSKey[type]], handler, options);
  },
  removeEventListener: function(type, handler, options) {
    return document.removeEventListener(vendor[FSKey[type]], handler, options);
  },
  fullscreenEnabled: function() {
    return Boolean(document[vendor[FSKey.fullscreenEnabled]]);
  },
  fullscreenElement :  function() {
    return document[vendor[FSKey.fullscreenElement]];
  },
  getOnfullscreenchange : function() {
    return document[('on' + vendor[FSKey.fullscreenchange]).toLowerCase()];
  },
  setOnfullscreenchange : function(handler) {
    return document[('on' + vendor[FSKey.fullscreenchange]).toLowerCase()] = handler;
  },
  getOnfullscreenerror : function() {
    return document[('on' + vendor[FSKey.fullscreenerror]).toLowerCase()];
  },
  setOnfullscreenerror : function(handler) {
    return document[('on' + vendor[FSKey.fullscreenerror]).toLowerCase()] = handler;
  } 
};
 
exporta.FScreen = FScreen;
   
     
exporta.Sound = {
        categories: {
            sounds: ["soundRightAnswer", "soundWrongAnswer", "soundTimeout", "ok", "wrong"],
            themes: ["soundGameOver", "theme1", "theme2", "theme3"]
        },
        volumeSounds: 1.0,
        volumeThemes: 0.6,
        enableSounds: true,
        enableThemes: true,
        enable: {
            sounds: function(enable){
                    exporta.Sound.enableSounds = enable;
            },
            themes: function(enable){
                exporta.Sound.enableThemes = enable;
            }
        },
        fallback: ["mp3", "ogg"],
        sounds: {},
        playing: [],
        register: function(map){
            var that = this;
            $.each( Object.keys(map), function(i, key){
                if(!that.sounds[key]){
                        var url = map[key];
                        if(typeof(url)==="string"){
                              var pos = url.lastIndexOf(".");
                              var base = url.substring(0, pos);
                              var ext = url.substring(pos+1, url.length).toLowerCase().trim();            
                              var image = document.createElement("AUDIO"); 
                              if(!image.canPlayType("audio/"+ext)){
                                    console.log("audio/"+ext+" is not supported");
                                    for(var i=0; i<pw.Sound.fallback.length; i++){
                                        var type = pw.Sound.fallback[i]; 
                                        if(type!==ext){
                                            if(image.canPlayType("audio/"+type)){
                                                console.log("Use fallback audio/"+type+" instead");
                                                url = base+"."+type;
                                                break;
                                            }
                                        }
                                    }                
                              }
                            image.preload = "auto";  
                            image.src = url;                    
                            that.sounds[key] = image;
                        } else {
                            that.sounds[key] = url;
                        }
                }
            });
        },
        play: function(key, loop, volume){
            if( (!this.enableSounds && this.categories.sounds.indexOf(key)>=0) ||
                 !this.enableThemes && this.categories.themes.indexOf(key)>=0 ){
                return;
            }             
            
            
            var that =this;
            var player = this.sounds[key];
            if(player){
                var isTheme = that.categories.themes.indexOf(key);
                player.volume = volume || (isTheme? that.volumeThemes : that.volumeSounds);
                if(loop){
                    player.loop = loop;
                    player.loopCount = 0;
                }                
                player.play();
                player.onended = function() {                    
                    player.currentTime = 0;
                    if( (player.loop>0 && player.loopCount < player.loop) || player.loop < 0)
                    {
                        player.loopCount += 1;
                        player.play();
                        return;
                    }
                    var i = that.playing.indexOf(player);
                    if(i>=0){
                        that.playing.splice(i,1);
                    }
                    player.onended = null;
                };
                this.playing.push(player);
            } else {
                console.log("Unregistered sound ", key, ". Use ", Object.keys(this.sounds));
            }
        },
        stop: function(key){
            if(key){
                var player = this.sounds[key];
                if(player){
                    player.pause();
                    player.currentTime = 0;                   
                    var i = this.playing.indexOf(player);
                    if(i>=0){
                        this.playing.splice(i,1);
                    }
                }
            } else {
                $.each(this.playing, function(i,s){
                    s.pause();
                    s.loop = 0;
                    s.loopCount = 0;
                    s.onended = null;
                    s.currentTime = 0;
                });
                this.playing.splice(0, this.playing.length);
            }
        }
    };
    
//Encriptació===============================================================
    
//    var b64_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
//    function encode_base64(data) {
//    var o1, o2, o3, h1, h2, h3, h4, bits, r, i = 0, enc = "";
//    if (!data) { return data; }
//    do {
//      o1 = data[i++];
//      o2 = data[i++];
//      o3 = data[i++];
//      bits = o1 << 16 | o2 << 8 | o3;
//      h1 = bits >> 18 & 0x3f;
//      h2 = bits >> 12 & 0x3f;
//      h3 = bits >> 6 & 0x3f;
//      h4 = bits & 0x3f;
//      enc += b64_table.charAt(h1) + b64_table.charAt(h2) + b64_table.charAt(h3) + b64_table.charAt(h4);
//    } while (i < data.length);
//    r = data.length % 3;
//    return (r ? enc.slice(0, r - 3) : enc) + "===".slice(r || 3);
//  }
// 
//   function decode_base64(data) {
//    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, result = [];
//    if (!data) { return data; }
//    data += "";
//    do {
//      h1 = b64_table.indexOf(data.charAt(i++));
//      h2 = b64_table.indexOf(data.charAt(i++));
//      h3 = b64_table.indexOf(data.charAt(i++));
//      h4 = b64_table.indexOf(data.charAt(i++));
//      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
//      o1 = bits >> 16 & 0xff;
//      o2 = bits >> 8 & 0xff;
//      o3 = bits & 0xff;
//      result.push(o1);
//      if (h3 !== 64) {
//        result.push(o2);
//        if (h4 !== 64) {
//          result.push(o3);
//        }
//      }
//    } while (i < data.length);
//    return result;
//  }
 
/*
	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	// http://whatwg.org/html/common-microsyntaxes.html#space-character
	var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;

	// `decode` is designed to be fully compatible with `atob` as described in the
	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
	// The optimized base64-decoding algorithm used is based on @atk’s excellent
	// implementation. https://gist.github.com/atk/1020396
	var decode_base64 = function(input) {
		input = String(input)
			.replace(REGEX_SPACE_CHARACTERS, '');
		var length = input.length;
		if (length % 4 == 0) {
			input = input.replace(/==?$/, '');
			length = input.length;
		}
		if (
			length % 4 == 1 ||
			// http://whatwg.org/C#alphanumeric-ascii-characters
			/[^+a-zA-Z0-9/]/.test(input)
		) {
			error(
				'Invalid character: the string to be decoded is not correctly encoded.'
			);
		}
		var bitCounter = 0;
		var bitStorage;
		var buffer;
		var output = '';
		var position = -1;
		while (++position < length) {
			buffer = TABLE.indexOf(input.charAt(position));
			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
			// Unless this is the first of a group of 4 characters…
			if (bitCounter++ % 4) {
				// …convert the first 8 bits to a single ASCII character.
				output += String.fromCharCode(
					0xFF & bitStorage >> (-2 * bitCounter & 6)
				);
			}
		}
		return output;
	};

	// `encode` is designed to be fully compatible with `btoa` as described in the
	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
	var encode_base64 = function(input) {
		input = String(input);
		if (/[^\0-\xFF]/.test(input)) {
			// Note: no need to special-case astral symbols here, as surrogates are
			// matched, and the input is supposed to only contain ASCII anyway.
			error(
				'The string to be encoded contains characters outside of the ' +
				'Latin1 range.'
			);
		}
		var padding = input.length % 3;
		var output = '';
		var position = -1;
		var a;
		var b;
		var c;
		var d;
		var buffer;
		// Make sure any padding is handled outside of the loop.
		var length = input.length - padding;

		while (++position < length) {
			// Read three bytes, i.e. 24 bits.
			a = input.charCodeAt(position) << 16;
			b = input.charCodeAt(++position) << 8;
			c = input.charCodeAt(++position);
			buffer = a + b + c;
			// Turn the 24 bits into four chunks of 6 bits each, and append the
			// matching character for each of them to the output.
			output += (
				TABLE.charAt(buffer >> 18 & 0x3F) +
				TABLE.charAt(buffer >> 12 & 0x3F) +
				TABLE.charAt(buffer >> 6 & 0x3F) +
				TABLE.charAt(buffer & 0x3F)
			);
		}

		if (padding == 2) {
			a = input.charCodeAt(position) << 8;
			b = input.charCodeAt(++position);
			buffer = a + b;
			output += (
				TABLE.charAt(buffer >> 10) +
				TABLE.charAt((buffer >> 4) & 0x3F) +
				TABLE.charAt((buffer << 2) & 0x3F) +
				'='
			);
		} else if (padding == 1) {
			buffer = input.charCodeAt(position);
			output += (
				TABLE.charAt(buffer >> 2) +
				TABLE.charAt((buffer << 4) & 0x3F) +
				'=='
			);
		}

		return output;
	};
 

   function keyCharAt(key, i) {
    return key.charCodeAt( Math.floor(i % key.length) );
   }
 
  function xor_encrypt(key, data) {
    return jQuery.map(Array.from(data),  function(c, i) {
      return c.charCodeAt(0) ^ keyCharAt(key, i);
    });
  }
 
  function xor_decrypt(key, data) {
    return jQuery.map(Array.from(data), function(c, i) {
      return String.fromCharCode( c ^ keyCharAt(key, i) );
    }).join("");
  }
   
  exporta.encrypt = function(data) {
      // data = xor_encrypt(key, data);
      return encode_base64(data);
  };
    
  exporta.decrypt = function(data) {
      data = decode_base64(data);
      return data;//xor_decrypt(key, data);
  }; 
  */
 
var SeedKey = "jl8jKsYDwB";
   
exporta.Alea = function(seed) {
  var me = this, mash = Mash();

  me.next = function() {
    var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
    me.s0 = me.s1;
    me.s1 = me.s2;
    return me.s2 = t - (me.c = t | 0);
  };

  // Apply the seeding algorithm from Baagoe.
  me.c = 1;
  me.s0 = mash(' ');
  me.s1 = mash(' ');
  me.s2 = mash(' ');
  me.s0 -= mash(seed);
  if (me.s0 < 0) { me.s0 += 1; }
  me.s1 -= mash(seed);
  if (me.s1 < 0) { me.s1 += 1; }
  me.s2 -= mash(seed);
  if (me.s2 < 0) { me.s2 += 1; }
  mash = null;
};

function Mash() {
  var n = 0xefc8249d;

  var mash = function(data) {
    data = data.toString();
    for (var i = 0; i < data.length; i++) {
      n += data.charCodeAt(i);
      var h = 0.02519603282416938 * n;
      n = h >>> 0;
      h -= n;
      h *= n;
      n = h >>> 0;
      h -= n;
      n += h * 0x100000000; // 2^32
    }
    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  };

  return mash;
}

var r0 = 32;
var r1 = 126;
var rr = r1-r0;
var rr1 = rr-1;

exporta.encrypt = function(str){
	var alea = new exporta.Alea(SeedKey);
	var n = str.length; 
	var byt = new Array(n);
	for(var i=0; i<n; i++){
		var c = str.charCodeAt(i);
	 	if(r0<=c && c<=r1){
	 		var offset = Math.floor(alea.next()*rr1);
		    var nc = (c+offset-r0)%rr+r0;
		    byt[i]=nc;
		} else {
			byt[i]=c;
		}
	}
    return String.fromCharCode.apply(String, byt);
};

exporta.decrypt = function(str){
	var byt = new Array(n);
	var n = str.length;
	var alea = new exporta.Alea(SeedKey);
	for(var i=0; i<n; i++){
		var c = str.charCodeAt(i);
		if(r0<=c && c<=r1){
			var offset = Math.floor(alea.next()*rr1);
		    var nc = (c-offset-r0+rr)%rr+r0;
		    byt[i]=nc;
		} else {
			byt[i]=c;
		}
	}
	return String.fromCharCode.apply(String, byt);
};
 
 
 //Try to find which is the current academic year (starts beginning of august)
 var d = new Date();
 d.setDate(d.getDate() - 244);
 exporta.currentYear = d.getFullYear()-2000;


exporta.guid = function(){
    return Math.random().toString(36).slice(2);
};
    
})(window.pw  || window);
 
module.exports = function(app)
{

//    var b64_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
//    
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
//
// 
//
//	var TABLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
//	// http://whatwg.org/html/common-microsyntaxes.html#space-character
//	var REGEX_SPACE_CHARACTERS = /[\t\n\f\r ]/g;
//
//	// `decode` is designed to be fully compatible with `atob` as described in the
//	// HTML Standard. http://whatwg.org/html/webappapis.html#dom-windowbase64-atob
//	// The optimized base64-decoding algorithm used is based on @atk’s excellent
//	// implementation. https://gist.github.com/atk/1020396
//	var decode_base64 = function(input) {
//		input = String(input)
//			.replace(REGEX_SPACE_CHARACTERS, '');
//		var length = input.length;
//		if (length % 4 == 0) {
//			input = input.replace(/==?$/, '');
//			length = input.length;
//		}
//		if (
//			length % 4 == 1 ||
//			// http://whatwg.org/C#alphanumeric-ascii-characters
//			/[^+a-zA-Z0-9/]/.test(input)
//		) {
//			error(
//				'Invalid character: the string to be decoded is not correctly encoded.'
//			);
//		}
//		var bitCounter = 0;
//		var bitStorage;
//		var buffer;
//		var output = '';
//		var position = -1;
//		while (++position < length) {
//			buffer = TABLE.indexOf(input.charAt(position));
//			bitStorage = bitCounter % 4 ? bitStorage * 64 + buffer : buffer;
//			// Unless this is the first of a group of 4 characters…
//			if (bitCounter++ % 4) {
//				// …convert the first 8 bits to a single ASCII character.
//				output += String.fromCharCode(
//					0xFF & bitStorage >> (-2 * bitCounter & 6)
//				);
//			}
//		}
//		return output;
//	};
//
//	// `encode` is designed to be fully compatible with `btoa` as described in the
//	// HTML Standard: http://whatwg.org/html/webappapis.html#dom-windowbase64-btoa
//	var encode_base64 = function(input) {
//		input = String(input);
//		if (/[^\0-\xFF]/.test(input)) {
//			// Note: no need to special-case astral symbols here, as surrogates are
//			// matched, and the input is supposed to only contain ASCII anyway.
//			console.log(
//				'The string to be encoded contains characters outside of the ' +
//				'Latin1 range.'
//			);
//                    input = input.replace(/[^\0-\xFF]/g, '');
//		}
//		var padding = input.length % 3;
//		var output = '';
//		var position = -1;
//		var a;
//		var b;
//		var c;
//		var d;
//		var buffer;
//		// Make sure any padding is handled outside of the loop.
//		var length = input.length - padding;
//
//		while (++position < length) {
//			// Read three bytes, i.e. 24 bits.
//			a = input.charCodeAt(position) << 16;
//			b = input.charCodeAt(++position) << 8;
//			c = input.charCodeAt(++position);
//			buffer = a + b + c;
//			// Turn the 24 bits into four chunks of 6 bits each, and append the
//			// matching character for each of them to the output.
//			output += (
//				TABLE.charAt(buffer >> 18 & 0x3F) +
//				TABLE.charAt(buffer >> 12 & 0x3F) +
//				TABLE.charAt(buffer >> 6 & 0x3F) +
//				TABLE.charAt(buffer & 0x3F)
//			);
//		}
//
//		if (padding == 2) {
//			a = input.charCodeAt(position) << 8;
//			b = input.charCodeAt(++position);
//			buffer = a + b;
//			output += (
//				TABLE.charAt(buffer >> 10) +
//				TABLE.charAt((buffer >> 4) & 0x3F) +
//				TABLE.charAt((buffer << 2) & 0x3F) +
//				'='
//			);
//		} else if (padding == 1) {
//			buffer = input.charCodeAt(position);
//			output += (
//				TABLE.charAt(buffer >> 2) +
//				TABLE.charAt((buffer << 4) & 0x3F) +
//				'=='
//			);
//		}
//
//		return output;
//	};
// 
//
//   function keyCharAt(key, i) {
//    return key.charCodeAt( Math.floor(i % key.length) );
//   }
// 
//  function xor_encrypt(key, data) {
//    return Array.from(data).map( function(c, i) {
//      return c.charCodeAt(0) ^ keyCharAt(key, i);
//    });
//  }
// 
//  function xor_decrypt(key, data) {
//    return Array.from(data).map( function(c, i) {
//      return String.fromCharCode( c ^ keyCharAt(key, i) );
//    }).join("");
//  }
// 
//
//  app.encrypt = function(data) {
//      // data = xor_encrypt(key, data);
//      return encode_base64(data);
//  };
//    
//  app.decrypt = function(data) {
//      data = decode_base64(data);
//      return data; //xor_decrypt(key, data);
//  }; 


var key = "jl8jKsYDwB"; 
app.Alea = function(seed) {
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

app.encrypt = function(str){
	var alea = new app.Alea(key);
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

app.decrypt = function(str){
	var byt = new Array(n);
	var n = str.length;
	var alea = new app.Alea(key);
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
 

};


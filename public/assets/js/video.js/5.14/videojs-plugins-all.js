define(['videojs_core'], function(videojs){
    

//=====================================================================BEGIN YOUTUBE-TECH
    

/* The MIT License (MIT)

Copyright (c) 2014-2015 Benoit Tremblay <trembl.ben@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */
/*global define, YT*/
 
  var Tech = videojs.getComponent('Tech');

  var Youtube = videojs.extend(Tech, {

    constructor: function(options, ready) {
      Tech.call(this, options, ready);

      this.setPoster(options.poster);
      this.setSrc(this.options_.source, true);

      // Set the vjs-youtube class to the player
      // Parent is not set yet so we have to wait a tick
      setTimeout(function() {
        this.el_.parentNode.className += ' vjs-youtube';

        if (_isOnMobile) {
          this.el_.parentNode.className += ' vjs-youtube-mobile';
        }

        if (Youtube.isApiReady) {
          this.initYTPlayer();
        } else {
          Youtube.apiReadyQueue.push(this);
        }
      }.bind(this));
    },

    dispose: function() {
      if (this.ytPlayer) {
        //Dispose of the YouTube Player
        if(ytPlay)
        this.ytPlayer.stopVideo();
        this.ytPlayer.destroy();
      } else {
        //YouTube API hasn't finished loading or the player is already disposed
        var index = Youtube.apiReadyQueue.indexOf(this);
        if (index !== -1) {
          Youtube.apiReadyQueue.splice(index, 1);
        }
      }
      this.ytPlayer = null;

      this.el_.parentNode.className = this.el_.parentNode.className
        .replace(' vjs-youtube', '')
        .replace(' vjs-youtube-mobile', '');
      this.el_.parentNode.removeChild(this.el_);

      //Needs to be called after the YouTube player is destroyed, otherwise there will be a null reference exception
      Tech.prototype.dispose.call(this);
    },

    createEl: function() {
      var div = document.createElement('div');
      div.setAttribute('id', this.options_.techId);
      div.setAttribute('style', 'width:100%;height:100%;top:0;left:0;position:absolute');
      div.setAttribute('class', 'vjs-tech');

      var divWrapper = document.createElement('div');
      divWrapper.appendChild(div);

      if (!_isOnMobile && !this.options_.ytControls) {
        var divBlocker = document.createElement('div');
        divBlocker.setAttribute('class', 'vjs-iframe-blocker');
        divBlocker.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%');

        // In case the blocker is still there and we want to pause
        divBlocker.onclick = function() {
          this.pause();
        }.bind(this);

        divWrapper.appendChild(divBlocker);
      }

      return divWrapper;
    },

    initYTPlayer: function() {
      var playerVars = {
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        loop: this.options_.loop ? 1 : 0
      };

      // Let the user set any YouTube parameter
      // https://developers.google.com/youtube/player_parameters?playerVersion=HTML5#Parameters
      // To use YouTube controls, you must use ytControls instead
      // To use the loop or autoplay, use the video.js settings

      if (typeof this.options_.autohide !== 'undefined') {
        playerVars.autohide = this.options_.autohide;
      }

      if (typeof this.options_['cc_load_policy'] !== 'undefined') {
        playerVars['cc_load_policy'] = this.options_['cc_load_policy'];
      }

      if (typeof this.options_.ytControls !== 'undefined') {
        playerVars.controls = this.options_.ytControls;
      }

      if (typeof this.options_.disablekb !== 'undefined') {
        playerVars.disablekb = this.options_.disablekb;
      }

      if (typeof this.options_.end !== 'undefined') {
        playerVars.end = this.options_.end;
      }

      if (typeof this.options_.color !== 'undefined') {
        playerVars.color = this.options_.color;
      }

      if (!playerVars.controls) {
        // Let video.js handle the fullscreen unless it is the YouTube native controls
        playerVars.fs = 0;
      } else if (typeof this.options_.fs !== 'undefined') {
        playerVars.fs = this.options_.fs;
      }

      if (typeof this.options_.end !== 'undefined') {
        playerVars.end = this.options_.end;
      }

      if (typeof this.options_.hl !== 'undefined') {
        playerVars.hl = this.options_.hl;
      } else if (typeof this.options_.language !== 'undefined') {
        // Set the YouTube player on the same language than video.js
        playerVars.hl = this.options_.language.substr(0, 2);
      }

      if (typeof this.options_['iv_load_policy'] !== 'undefined') {
        playerVars['iv_load_policy'] = this.options_['iv_load_policy'];
      }

      if (typeof this.options_.list !== 'undefined') {
        playerVars.list = this.options_.list;
      } else if (this.url && typeof this.url.listId !== 'undefined') {
        playerVars.list = this.url.listId;
      }

      if (typeof this.options_.listType !== 'undefined') {
        playerVars.listType = this.options_.listType;
      }

      if (typeof this.options_.modestbranding !== 'undefined') {
        playerVars.modestbranding = this.options_.modestbranding;
      }

      if (typeof this.options_.playlist !== 'undefined') {
        playerVars.playlist = this.options_.playlist;
      }

      if (typeof this.options_.playsinline !== 'undefined') {
        playerVars.playsinline = this.options_.playsinline;
      }

      if (typeof this.options_.rel !== 'undefined') {
        playerVars.rel = this.options_.rel;
      }

      if (typeof this.options_.showinfo !== 'undefined') {
        playerVars.showinfo = this.options_.showinfo;
      }

      if (typeof this.options_.start !== 'undefined') {
        playerVars.start = this.options_.start;
      }

      if (typeof this.options_.theme !== 'undefined') {
        playerVars.theme = this.options_.theme;
      }

      // Allow undocumented options to be passed along via customVars
      if (typeof this.options_.customVars !== 'undefined') {
        var customVars = this.options_.customVars;
        Object.keys(customVars).forEach(function(key) {
          playerVars[key] = customVars[key];
        });
      }

      this.activeVideoId = this.url ? this.url.videoId : null;
      this.activeList = playerVars.list;

      this.ytPlayer = new YT.Player(this.options_.techId, {
        videoId: this.activeVideoId,
        playerVars: playerVars,
        events: {
          onReady: this.onPlayerReady.bind(this),
          onPlaybackQualityChange: this.onPlayerPlaybackQualityChange.bind(this),
          onStateChange: this.onPlayerStateChange.bind(this),
          onError: this.onPlayerError.bind(this)
        }
      });
    },

    onPlayerReady: function() {
      if (this.options_.muted) {
        this.ytPlayer.mute();
      }

      this.playerReady_ = true;
      this.triggerReady();

      if (this.playOnReady) {
        this.play();
      } else if (this.cueOnReady) {
        this.ytPlayer.cueVideoById(this.url.videoId);
        this.activeVideoId = this.url.videoId;
      }
    },

    onPlayerPlaybackQualityChange: function() {

    },

    onPlayerStateChange: function(e) {
      var state = e.data;

      if (state === this.lastState || this.errorNumber) {
        return;
      }

      this.lastState = state;

      switch (state) {
        case -1:
          this.trigger('loadstart');
          this.trigger('loadedmetadata');
          this.trigger('durationchange');
          break;

        case YT.PlayerState.ENDED:
          this.trigger('ended');
          break;

        case YT.PlayerState.PLAYING:
          this.trigger('timeupdate');
          this.trigger('durationchange');
          this.trigger('playing');
          this.trigger('play');

          if (this.isSeeking) {
            this.onSeeked();
          }
          break;

        case YT.PlayerState.PAUSED:
          this.trigger('canplay');
          if (this.isSeeking) {
            this.onSeeked();
          } else {
            this.trigger('pause');
          }
          break;

        case YT.PlayerState.BUFFERING:
          this.player_.trigger('timeupdate');
          this.player_.trigger('waiting');
          break;
      }
    },

    onPlayerError: function(e) {
      this.errorNumber = e.data;
      this.trigger('error');

      this.ytPlayer.stopVideo();
    },

    error: function() {
      switch (this.errorNumber) {
        case 5:
          return { code: 'Error while trying to play the video' };

        case 2:
        case 100:
          return { code: 'Unable to find the video' };

        case 101:
        case 150:
          return { code: 'Playback on other Websites has been disabled by the video owner.' };
      }

      return { code: 'YouTube unknown error (' + this.errorNumber + ')' };
    },

    src: function(src) {
      if (src) {
        this.setSrc({ src: src });
      }

      return this.source;
    },

    poster: function() {
      // You can't start programmaticlly a video with a mobile
      // through the iframe so we hide the poster and the play button (with CSS)
      if (_isOnMobile) {
        return null;
      }

      return this.poster_;
    },

    setPoster: function(poster) {
      this.poster_ = poster;
    },

    setSrc: function(source) {
      if (!source || !source.src) {
        return;
      }

      delete this.errorNumber;
      this.source = source;
      this.url = Youtube.parseUrl(source.src);

      if (!this.options_.poster) {
        if (this.url.videoId) {
          // Set the low resolution first
          this.poster_ = 'https://img.youtube.com/vi/' + this.url.videoId + '/0.jpg';
          this.trigger('posterchange');

          // Check if their is a high res
          this.checkHighResPoster();
        }
      }

      if (this.options_.autoplay && !_isOnMobile) {
        if (this.isReady_) {
          this.play();
        } else {
          this.playOnReady = true;
        }
      } else if (this.activeVideoId !== this.url.videoId) {
        if (this.isReady_) {
          this.ytPlayer.cueVideoById(this.url.videoId);
          this.activeVideoId = this.url.videoId;
        } else {
          this.cueOnReady = true;
        }
      }
    },

    autoplay: function() {
      return this.options_.autoplay;
    },

    setAutoplay: function(val) {
      this.options_.autoplay = val;
    },

    loop: function() {
      return this.options_.loop;
    },

    setLoop: function(val) {
      this.options_.loop = val;
    },

    play: function() {
      if (!this.url || !this.url.videoId) {
        return;
      }

      this.wasPausedBeforeSeek = false;

      if (this.isReady_) {
        if (this.url.listId) {
          if (this.activeList === this.url.listId) {
            this.ytPlayer.playVideo();
          } else {
            this.ytPlayer.loadPlaylist(this.url.listId);
            this.activeList = this.url.listId;
          }
        }

        if (this.activeVideoId === this.url.videoId) {
          this.ytPlayer.playVideo();
        } else {
          this.ytPlayer.loadVideoById(this.url.videoId);
          this.activeVideoId = this.url.videoId;
        }
      } else {
        this.trigger('waiting');
        this.playOnReady = true;
      }
    },

    pause: function() {
      if (this.ytPlayer) {
        this.ytPlayer.pauseVideo();
      }
    },

    paused: function() {
      return (this.ytPlayer) ?
        (this.lastState !== YT.PlayerState.PLAYING && this.lastState !== YT.PlayerState.BUFFERING)
        : true;
    },

    currentTime: function() {
      return this.ytPlayer ? this.ytPlayer.getCurrentTime() : 0;
    },

    setCurrentTime: function(seconds) {
      if (this.lastState === YT.PlayerState.PAUSED) {
        this.timeBeforeSeek = this.currentTime();
      }

      if (!this.isSeeking) {
        this.wasPausedBeforeSeek = this.paused();
      }

      this.ytPlayer.seekTo(seconds, true);
      this.trigger('timeupdate');
      this.trigger('seeking');
      this.isSeeking = true;

      // A seek event during pause does not return an event to trigger a seeked event,
      // so run an interval timer to look for the currentTime to change
      if (this.lastState === YT.PlayerState.PAUSED && this.timeBeforeSeek !== seconds) {
        clearInterval(this.checkSeekedInPauseInterval);
        this.checkSeekedInPauseInterval = setInterval(function() {
          if (this.lastState !== YT.PlayerState.PAUSED || !this.isSeeking) {
            // If something changed while we were waiting for the currentTime to change,
            //  clear the interval timer
            clearInterval(this.checkSeekedInPauseInterval);
          } else if (this.currentTime() !== this.timeBeforeSeek) {
            this.trigger('timeupdate');
            this.onSeeked();
          }
        }.bind(this), 250);
      }
    },

    seeking: function () {
      return this.isSeeking;
    },

    seekable: function () {
      if(!this.ytPlayer || !this.ytPlayer.getVideoLoadedFraction) {
        return {
          length: 0,
          start: function() {
            throw new Error('This TimeRanges object is empty');
          },
          end: function() {
            throw new Error('This TimeRanges object is empty');
          }
        };
      }
      var end = this.ytPlayer.getDuration();

      return {
        length: 1,
        start: function() { return 0; },
        end: function() { return end; }
      };
    },

    onSeeked: function() {
      clearInterval(this.checkSeekedInPauseInterval);
      this.isSeeking = false;

      if (this.wasPausedBeforeSeek) {
        this.pause();
      }

      this.trigger('seeked');
    },

    playbackRate: function() {
      return this.ytPlayer ? this.ytPlayer.getPlaybackRate() : 1;
    },

    setPlaybackRate: function(suggestedRate) {
      if (!this.ytPlayer) {
        return;
      }

      this.ytPlayer.setPlaybackRate(suggestedRate);
      this.trigger('ratechange');
    },

    duration: function() {
      return this.ytPlayer ? this.ytPlayer.getDuration() : 0;
    },

    currentSrc: function() {
      return this.source && this.source.src;
    },

    ended: function() {
      return this.ytPlayer ? (this.lastState === YT.PlayerState.ENDED) : false;
    },

    volume: function() {
      return this.ytPlayer ? this.ytPlayer.getVolume() / 100.0 : 1;
    },

    setVolume: function(percentAsDecimal) {
      if (!this.ytPlayer) {
        return;
      }

      this.ytPlayer.setVolume(percentAsDecimal * 100.0);
      this.setTimeout( function(){
        this.trigger('volumechange');
      }, 50);

    },

    muted: function() {
      return this.ytPlayer ? this.ytPlayer.isMuted() : false;
    },

    setMuted: function(mute) {
      if (!this.ytPlayer) {
        return;
      }
      else{
        this.muted(true);
      }

      if (mute) {
        this.ytPlayer.mute();
      } else {
        this.ytPlayer.unMute();
      }
      this.setTimeout( function(){
        this.trigger('volumechange');
      }, 50);
    },

    buffered: function() {
      if(!this.ytPlayer || !this.ytPlayer.getVideoLoadedFraction) {
        return {
          length: 0,
          start: function() {
            throw new Error('This TimeRanges object is empty');
          },
          end: function() {
            throw new Error('This TimeRanges object is empty');
          }
        };
      }

      var end = this.ytPlayer.getVideoLoadedFraction() * this.ytPlayer.getDuration();

      return {
        length: 1,
        start: function() { return 0; },
        end: function() { return end; }
      };
    },

    // TODO: Can we really do something with this on YouTUbe?
    preload: function() {},
    load: function() {},
    reset: function() {},

    supportsFullScreen: function() {
      return true;
    },

    // Tries to get the highest resolution thumbnail available for the video
    checkHighResPoster: function(){
      var uri = 'https://img.youtube.com/vi/' + this.url.videoId + '/maxresdefault.jpg';

      try {
        var image = new Image();
        image.onload = function(){
          // Onload may still be called if YouTube returns the 120x90 error thumbnail
          if('naturalHeight' in image){
            if (image.naturalHeight <= 90 || image.naturalWidth <= 120) {
              return;
            }
          } else if(image.height <= 90 || image.width <= 120) {
            return;
          }

          this.poster_ = uri;
          this.trigger('posterchange');
        }.bind(this);
        image.onerror = function(){};
        image.src = uri;
      }
      catch(e){}
    }
  });

  Youtube.isSupported = function() {
    return true;
  };

  Youtube.canPlaySource = function(e) {
    return Youtube.canPlayType(e.type);
  };

  Youtube.canPlayType = function(e) {
    return (e === 'video/youtube');
  };

  var _isOnMobile = videojs.browser.IS_IOS || useNativeControlsOnAndroid();

  Youtube.parseUrl = function(url) {
    var result = {
      videoId: null
    };

    var regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regex);

    if (match && match[2].length === 11) {
      result.videoId = match[2];
    }

    var regPlaylist = /[?&]list=([^#\&\?]+)/;
    match = url.match(regPlaylist);

    if(match && match[1]) {
      result.listId = match[1];
    }

    return result;
  };

  function apiLoaded() {
    YT.ready(function() {
      Youtube.isApiReady = true;

      for (var i = 0; i < Youtube.apiReadyQueue.length; ++i) {
        Youtube.apiReadyQueue[i].initYTPlayer();
      }
    });
  }

  function loadScript(src, callback) {
    var loaded = false;
    var tag = document.createElement('script');
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    tag.onload = function () {
      if (!loaded) {
        loaded = true;
        callback();
      }
    };
    tag.onreadystatechange = function () {
      if (!loaded && (this.readyState === 'complete' || this.readyState === 'loaded')) {
        loaded = true;
        callback();
      }
    };
    tag.src = src;
  }

  function injectCss() {
    var css = // iframe blocker to catch mouse events
              '.vjs-youtube .vjs-iframe-blocker { display: none; }' +
              '.vjs-youtube.vjs-user-inactive .vjs-iframe-blocker { display: block; }' +
              '.vjs-youtube .vjs-poster { background-size: cover; }' +
              '.vjs-youtube-mobile .vjs-big-play-button { display: none; }';

    var head = document.head || document.getElementsByTagName('head')[0];

    var style = document.createElement('style');
    style.type = 'text/css';

    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

  function useNativeControlsOnAndroid() {
    var stockRegex = window.navigator.userAgent.match(/applewebkit\/(\d*).*Version\/(\d*.\d*)/i);
    //True only Android Stock Browser on OS versions 4.X and below
    //where a Webkit version and a "Version/X.X" String can be found in
    //user agent.
    return videojs.browser.IS_ANDROID && videojs.browser.ANDROID_VERSION < 5 && stockRegex && stockRegex[2] > 0;
  }

  Youtube.apiReadyQueue = [];

  loadScript('https://www.youtube.com/iframe_api', apiLoaded);
  injectCss();

  // Older versions of VJS5 doesn't have the registerTech function
  if (typeof videojs.registerTech !== 'undefined') {
    videojs.registerTech('Youtube', Youtube);
  } else {
    videojs.registerComponent('Youtube', Youtube);
  }
 
//=====================================================================END YOUTUBE-TECH

//=====================================================================BEGIN VIMEO-TECH
(function (global, factory) {
    
  var VimeoAPI = {Player: factory()};  //This is the replacement of froogaloop
        
  var VimeoState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3
  };

  var Tech = videojs.getComponent('Tech');

  var Vimeo = videojs.extend(Tech, {
    constructor: function(options, ready) {
      Tech.call(this, options, ready);
      
      this.piWorld = this.piWorld || {};
      if(options.poster !== "") {this.setPoster(options.poster);}
      this.setSrc(this.options_.source.src, true);

      setTimeout(function() {
        this.el_.parentNode.className += ' vjs-vimeo';

        if (Vimeo.isApiReady) {
          this.initPlayer();
        } else {
          Vimeo.apiReadyQueue.push(this);
        }
      }.bind(this));

    },
   
    dispose: function() {
      this.el_.parentNode.className = this.el_.parentNode.className.replace(' vjs-vimeo', '');
    },

    createEl: function() {        
      this.vimeo = {};
      this.vimeoInfo = {};
      this.baseUrl = 'https://player.vimeo.com/video/';
      this.baseApiUrl = 'http://www.vimeo.com/api/v2/video/';
      this.videoId = Vimeo.parseUrl(this.options_.source.src).videoId;

      this.iframe = document.createElement('iframe');
      this.iframe.setAttribute('id', this.options_.techId);
      this.iframe.setAttribute('title', 'Vimeo Video Player');
      this.iframe.setAttribute('class', 'vimeoplayer');
      this.iframe.setAttribute('src', this.baseUrl + this.videoId);
      this.iframe.setAttribute('frameborder', '0');
      this.iframe.setAttribute('scrolling', 'no');
      this.iframe.setAttribute('marginWidth', '0');
      this.iframe.setAttribute('marginHeight', '0');
      this.iframe.setAttribute('webkitAllowFullScreen', '0');
      this.iframe.setAttribute('mozallowfullscreen', '0');
      this.iframe.setAttribute('allowFullScreen', '0');

      var divWrapper = document.createElement('div');
      divWrapper.setAttribute('style', 'margin:0 auto;padding-bottom:56.25%;width:100%;height:0;position:relative;overflow:hidden;');
      divWrapper.setAttribute('class', 'vimeoFrame');
      divWrapper.appendChild(this.iframe);

      if (!_isOnMobile && !this.options_.ytControls) {
        var divBlocker = document.createElement('div');
        divBlocker.setAttribute('class', 'vjs-iframe-blocker');
        divBlocker.setAttribute('style', 'position:absolute;top:0;left:0;width:100%;height:100%');

        // In case the blocker is still there and we want to pause
        divBlocker.onclick = function() {
          this.onPause();
        }.bind(this);

        divWrapper.appendChild(divBlocker);
      }

/**
      if (Vimeo.isApiReady) {
        this.initPlayer();
      } else {
        Vimeo.apiReadyQueue.push(this);
      }
**/
      if(this.options_.poster === "") {
        $.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_this){
          return function(data) {
            // Set the low resolution first
            _this.setPoster(data[0].thumbnail_large);
            _this.pw.thumbnail = data[0].thumbnail_large || data[0].thumbnail_medium;
            _this.pw.title = data[0].title;
            _this.pw.description = data[0].description;
          };
        })(this));
      }
       
      return divWrapper;
    },

    initPlayer: function() {
       
      var self = this;
      var vimeoVideoID = Vimeo.parseUrl(this.options_.source.src).videoId;
      //load vimeo
      if (this.vimeo && this.vimeo.unload) {
        this.vimeo.unload();
        delete this.vimeo;
      }

      self.vimeo = new VimeoAPI.Player(self.iframe);
      
      self.vimeoInfo = {
        state: VimeoState.UNSTARTED,
        volume: 1,
        muted: false,
        muteVolume: 1,
        time: 0,
        duration: 0,
        buffered: 0,
        url: self.baseUrl + self.videoId,
        error: null
      };

        self.vimeo.ready().then(function(){
            //console.log("VIMEO IS READY");
              self.isReady_ = true;
              self.triggerReady();
              self.trigger('loadedmetadata');
              if (self.startMuted) {
                self.setMuted(true);
                self.startMuted = false;
              }
              
              self.vimeo.on('progress', function(data){ self.onLoadProgress(data); });
              self.vimeo.on('timeupdate', function(data){ self.onPlayProgress(data); });
              self.vimeo.on('play', function(id){ self.onPlay(id); });
              self.vimeo.on('pause', function(id){ self.onPause(id); });
              self.vimeo.on('ended', function(id){ self.onFinish(id); });
              self.vimeo.on('seeked', function(data){ self.onSeek(data); });
        });
        

    },
 

    onLoadProgress: function(data) {
      var durationUpdate = !this.vimeoInfo.duration;
      this.vimeoInfo.duration = data.duration;
      this.vimeoInfo.buffered = data.percent;
      this.trigger('progress');
      if (durationUpdate) this.trigger('durationchange');
    },
    onPlayProgress: function(data) {
        
      this.vimeoInfo.time = data.seconds;     
      this.trigger('timeupdate');      
    },
    onPlay: function() {
      this.vimeoInfo.state = VimeoState.PLAYING;
       //this.trigger('timeupdate');
       this.trigger('durationchange');
       this.trigger('playing');
       this.trigger('play');
    },
    onPause: function() {
      this.vimeoInfo.state = VimeoState.PAUSED;
      this.trigger('pause');
    },
    onFinish: function() {
      this.vimeoInfo.state = VimeoState.ENDED;
      this.trigger('ended');
    },
    onSeek: function(data) {
      this.trigger('seeking');
      this.vimeoInfo.time = data.seconds;
      this.trigger('timeupdate');
      this.trigger('seeked');
    },
    onError: function(error){
      this.error = error;
      this.trigger('error');
    },

    error: function() {
      switch (this.errorNumber) {
        case 2:
          return { code: 'Unable to find the video' };

        case 5:
          return { code: 'Error while trying to play the video' };

        case 100:
          return { code: 'Unable to find the video' };

        case 101:
        case 150:
          return { code: 'Playback on other Websites has been disabled by the video owner.' };
      }

      return { code: 'Vimeo unknown error (' + this.errorNumber + ')' };
    },

    src: function() {
      return this.source;
    },

    poster: function() {
      return this.poster_;
    },

    setPoster: function(poster) {
      this.poster_ = poster;
    },

    setSrc: function(source) {
      if (!source || !source.src) {
        return;
      }

      this.source = source;
      this.url = Vimeo.parseUrl(source.src);

      if (!this.options_.poster) {
        if (this.url.videoId) {
          $.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_this){
            return function(data) {
              // Set the low resolution first
              _this.poster_ = data[0].thumbnail_small;
            };
          })(this));

          // Check if their is a high res
          this.checkHighResPoster();
        }
      }

      if (this.options_.autoplay && !_isOnMobile) {
        if (this.isReady_) {
          this.play();
        } else {
          this.playOnReady = true;
        }
      }
    },

    supportsFullScreen: function() {
      return true;
    },

    //TRIGGER
    load : function(){},
    play : function(){ this.vimeo.play().catch(function(err){console.log(err);}); },
    pause : function(){ this.vimeo.pause().catch(function(err){console.log(err);}); },
    paused : function(){
      return this.vimeoInfo.state !== VimeoState.PLAYING &&
             this.vimeoInfo.state !== VimeoState.BUFFERING;
    },

    currentTime : function(){ return this.vimeoInfo.time || 0; },

    setCurrentTime :function(seconds){
      this.vimeo.setCurrentTime(seconds);
      this.player_.trigger('timeupdate');
    },

    duration :function(){ return this.vimeoInfo.duration || 0; },
    buffered :function(){ return videojs.createTimeRange(0, (this.vimeoInfo.buffered*this.vimeoInfo.duration) || 0); },

    volume :function() { return (this.vimeoInfo.muted)? this.vimeoInfo.muteVolume : this.vimeoInfo.volume; },
    setVolume :function(percentAsDecimal){
      this.vimeo.setVolume(percentAsDecimal);
      this.vimeoInfo.volume = percentAsDecimal;
      this.player_.trigger('volumechange');
    },
    currentSrc :function() {
      return this.el_.src;
    },
    muted :function() { return this.vimeoInfo.muted || false; },
    setMuted :function(muted) {
      if (muted) {
        this.vimeoInfo.muteVolume = this.vimeoInfo.volume;
        this.setVolume(0);
      } else {
        this.setVolume(this.vimeoInfo.muteVolume);
      }

      this.vimeoInfo.muted = muted;
      this.player_.trigger('volumechange');
    },

    // Tries to get the highest resolution thumbnail available for the video
    checkHighResPoster: function(){
      var uri = '';

      try {

        $.getJSON(this.baseApiUrl + this.videoId + '.json?callback=?', {format: "json"}, (function(_uri){
          return function(data) {
            // Set the low resolution first
            _uri = data[0].thumbnail_large;
          };
        })(uri));

        var image = new Image();
        image.onload = function(){
          // Onload thumbnail
          if('naturalHeight' in this){
            if(this.naturalHeight <= 90 || this.naturalWidth <= 120) {
              this.onerror();
              return;
            }
          } else if(this.height <= 90 || this.width <= 120) {
            this.onerror();
            return;
          }

          this.poster_ = uri;
          this.trigger('posterchange');
        }.bind(this);
        image.onerror = function(){};
        image.src = uri;
      }
      catch(e){}
    }
  });

  Vimeo.isSupported = function() {
    return true;
  };

  Vimeo.canPlaySource = function(e) {
    return (e.type === 'video/vimeo');
  };

  var _isOnMobile = /(iPad|iPhone|iPod|Android)/g.test(navigator.userAgent);

  Vimeo.parseUrl = function(url) {
    var result = {
      videoId: null
    };

    var regex = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/;
    var match = url.match(regex);

    if (match) {
      result.videoId = match[5];
    }

    return result;
  };

  function injectCss() {
    var css = // iframe blocker to catch mouse events
              '.vjs-vimeo .vjs-iframe-blocker { display: none; }' +
              '.vjs-vimeo.vjs-user-inactive .vjs-iframe-blocker { display: block; }' +
              '.vjs-vimeo .vjs-poster { background-size: cover; }' +
              '.vjs-vimeo { height:100%; }' +
              '.vimeoplayer { width:100%; height:180%; position:absolute; left:0; top:-40%; }';

    var head = document.head || document.getElementsByTagName('head')[0];

    var style = document.createElement('style');
    style.type = 'text/css';

    if (style.styleSheet){
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    head.appendChild(style);
  }

  Vimeo.apiReadyQueue = [];

  var vimeoIframeAPIReady = function() {
    Vimeo.isApiReady = true;
    injectCss();

    for (var i = 0; i < Vimeo.apiReadyQueue.length; ++i) {
      Vimeo.apiReadyQueue[i].initPlayer();
    }
  };

  vimeoIframeAPIReady();

  videojs.registerTech('Vimeo', Vimeo);
        
        
}(this, function () { 'use strict';

//
// This is the Vimeo Javascript API, returns constructor VimeoAPI.Player
//
	var arrayIndexOfSupport = typeof Array.prototype.indexOf !== 'undefined';
	var postMessageSupport = typeof window.postMessage !== 'undefined';

	if (!arrayIndexOfSupport || !postMessageSupport) {
	    throw new Error('Sorry, the Vimeo Player API is not available in this browser.');
	}

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var index = createCommonjsModule(function (module, exports) {
	(function (exports) {
	  'use strict';
	  //shared pointer

	  var i;
	  //shortcuts
	  var defineProperty = Object.defineProperty,
	      is = function (a, b) {
	    return a === b || a !== a && b !== b;
	  };

	  //Polyfill global objects
	  if (typeof WeakMap == 'undefined') {
	    exports.WeakMap = createCollection({
	      // WeakMap#delete(key:void*):boolean
	      'delete': sharedDelete,
	      // WeakMap#clear():
	      clear: sharedClear,
	      // WeakMap#get(key:void*):void*
	      get: sharedGet,
	      // WeakMap#has(key:void*):boolean
	      has: mapHas,
	      // WeakMap#set(key:void*, value:void*):void
	      set: sharedSet
	    }, true);
	  }

	  if (typeof Map == 'undefined' || typeof new Map().values !== 'function' || !new Map().values().next) {
	    exports.Map = createCollection({
	      // WeakMap#delete(key:void*):boolean
	      'delete': sharedDelete,
	      //:was Map#get(key:void*[, d3fault:void*]):void*
	      // Map#has(key:void*):boolean
	      has: mapHas,
	      // Map#get(key:void*):boolean
	      get: sharedGet,
	      // Map#set(key:void*, value:void*):void
	      set: sharedSet,
	      // Map#keys(void):Iterator
	      keys: sharedKeys,
	      // Map#values(void):Iterator
	      values: sharedValues,
	      // Map#entries(void):Iterator
	      entries: mapEntries,
	      // Map#forEach(callback:Function, context:void*):void ==> callback.call(context, key, value, mapObject) === not in specs`
	      forEach: sharedForEach,
	      // Map#clear():
	      clear: sharedClear
	    });
	  }

	  if (typeof Set == 'undefined' || typeof new Set().values !== 'function' || !new Set().values().next) {
	    exports.Set = createCollection({
	      // Set#has(value:void*):boolean
	      has: setHas,
	      // Set#add(value:void*):boolean
	      add: sharedAdd,
	      // Set#delete(key:void*):boolean
	      'delete': sharedDelete,
	      // Set#clear():
	      clear: sharedClear,
	      // Set#keys(void):Iterator
	      keys: sharedValues, // specs actually say "the same function object as the initial value of the values property"
	      // Set#values(void):Iterator
	      values: sharedValues,
	      // Set#entries(void):Iterator
	      entries: setEntries,
	      // Set#forEach(callback:Function, context:void*):void ==> callback.call(context, value, index) === not in specs
	      forEach: sharedForEach
	    });
	  }

	  if (typeof WeakSet == 'undefined') {
	    exports.WeakSet = createCollection({
	      // WeakSet#delete(key:void*):boolean
	      'delete': sharedDelete,
	      // WeakSet#add(value:void*):boolean
	      add: sharedAdd,
	      // WeakSet#clear():
	      clear: sharedClear,
	      // WeakSet#has(value:void*):boolean
	      has: setHas
	    }, true);
	  }

	  /**
	   * ES6 collection constructor
	   * @return {Function} a collection class
	   */
	  function createCollection(proto, objectOnly) {
	    function Collection(a) {
	      if (!this || this.constructor !== Collection) return new Collection(a);
	      this._keys = [];
	      this._values = [];
	      this._itp = []; // iteration pointers
	      this.objectOnly = objectOnly;

	      //parse initial iterable argument passed
	      if (a) init.call(this, a);
	    }

	    //define size for non object-only collections
	    if (!objectOnly) {
	      defineProperty(proto, 'size', {
	        get: sharedSize
	      });
	    }

	    //set prototype
	    proto.constructor = Collection;
	    Collection.prototype = proto;

	    return Collection;
	  }

	  /** parse initial iterable argument passed */
	  function init(a) {
	    var i;
	    //init Set argument, like `[1,2,3,{}]`
	    if (this.add) a.forEach(this.add, this);
	    //init Map argument like `[[1,2], [{}, 4]]`
	    else a.forEach(function (a) {
	        this.set(a[0], a[1]);
	      }, this);
	  }

	  /** delete */
	  function sharedDelete(key) {
	    if (this.has(key)) {
	      this._keys.splice(i, 1);
	      this._values.splice(i, 1);
	      // update iteration pointers
	      this._itp.forEach(function (p) {
	        if (i < p[0]) p[0]--;
	      });
	    }
	    // Aurora here does it while Canary doesn't
	    return -1 < i;
	  };

	  function sharedGet(key) {
	    return this.has(key) ? this._values[i] : undefined;
	  }

	  function has(list, key) {
	    if (this.objectOnly && key !== Object(key)) throw new TypeError("Invalid value used as weak collection key");
	    //NaN or 0 passed
	    if (key != key || key === 0) for (i = list.length; i-- && !is(list[i], key);) {} else i = list.indexOf(key);
	    return -1 < i;
	  }

	  function setHas(value) {
	    return has.call(this, this._values, value);
	  }

	  function mapHas(value) {
	    return has.call(this, this._keys, value);
	  }

	  /** @chainable */
	  function sharedSet(key, value) {
	    this.has(key) ? this._values[i] = value : this._values[this._keys.push(key) - 1] = value;
	    return this;
	  }

	  /** @chainable */
	  function sharedAdd(value) {
	    if (!this.has(value)) this._values.push(value);
	    return this;
	  }

	  function sharedClear() {
	    (this._keys || 0).length = this._values.length = 0;
	  }

	  /** keys, values, and iterate related methods */
	  function sharedKeys() {
	    return sharedIterator(this._itp, this._keys);
	  }

	  function sharedValues() {
	    return sharedIterator(this._itp, this._values);
	  }

	  function mapEntries() {
	    return sharedIterator(this._itp, this._keys, this._values);
	  }

	  function setEntries() {
	    return sharedIterator(this._itp, this._values, this._values);
	  }

	  function sharedIterator(itp, array, array2) {
	    var p = [0],
	        done = false;
	    itp.push(p);
	    return {
	      next: function () {
	        var v,
	            k = p[0];
	        if (!done && k < array.length) {
	          v = array2 ? [array[k], array2[k]] : array[k];
	          p[0]++;
	        } else {
	          done = true;
	          itp.splice(itp.indexOf(p), 1);
	        }
	        return { done: done, value: v };
	      }
	    };
	  }

	  function sharedSize() {
	    return this._values.length;
	  }

	  function sharedForEach(callback, context) {
	    var it = this.entries();
	    for (;;) {
	      var r = it.next();
	      if (r.done) break;
	      callback.call(context, r.value[1], r.value[0], this);
	    }
	  }
	})(typeof exports != 'undefined' && typeof commonjsGlobal != 'undefined' ? commonjsGlobal : window);
	});

	var npo_src = createCommonjsModule(function (module) {
	/*! Native Promise Only
	    v0.8.1 (c) Kyle Simpson
	    MIT License: http://getify.mit-license.org
	*/

	(function UMD(name, context, definition) {
		// special form of UMD for polyfilling across evironments
		context[name] = context[name] || definition();
		if (typeof module != "undefined" && module.exports) {
			module.exports = context[name];
		} else if (typeof define == "function" && define.amd) {
			define(function $AMD$() {
				return context[name];
			});
		}
	})("Promise", typeof commonjsGlobal != "undefined" ? commonjsGlobal : commonjsGlobal, function DEF() {
		/*jshint validthis:true */
		"use strict";

		var builtInProp,
		    cycle,
		    scheduling_queue,
		    ToString = Object.prototype.toString,
		    timer = typeof setImmediate != "undefined" ? function timer(fn) {
			return setImmediate(fn);
		} : setTimeout;

		// dammit, IE8.
		try {
			Object.defineProperty({}, "x", {});
			builtInProp = function builtInProp(obj, name, val, config) {
				return Object.defineProperty(obj, name, {
					value: val,
					writable: true,
					configurable: config !== false
				});
			};
		} catch (err) {
			builtInProp = function builtInProp(obj, name, val) {
				obj[name] = val;
				return obj;
			};
		}

		// Note: using a queue instead of array for efficiency
		scheduling_queue = function Queue() {
			var first, last, item;

			function Item(fn, self) {
				this.fn = fn;
				this.self = self;
				this.next = void 0;
			}

			return {
				add: function add(fn, self) {
					item = new Item(fn, self);
					if (last) {
						last.next = item;
					} else {
						first = item;
					}
					last = item;
					item = void 0;
				},
				drain: function drain() {
					var f = first;
					first = last = cycle = void 0;

					while (f) {
						f.fn.call(f.self);
						f = f.next;
					}
				}
			};
		}();

		function schedule(fn, self) {
			scheduling_queue.add(fn, self);
			if (!cycle) {
				cycle = timer(scheduling_queue.drain);
			}
		}

		// promise duck typing
		function isThenable(o) {
			var _then,
			    o_type = typeof o;

			if (o != null && (o_type == "object" || o_type == "function")) {
				_then = o.then;
			}
			return typeof _then == "function" ? _then : false;
		}

		function notify() {
			for (var i = 0; i < this.chain.length; i++) {
				notifyIsolated(this, this.state === 1 ? this.chain[i].success : this.chain[i].failure, this.chain[i]);
			}
			this.chain.length = 0;
		}

		// NOTE: This is a separate function to isolate
		// the `try..catch` so that other code can be
		// optimized better
		function notifyIsolated(self, cb, chain) {
			var ret, _then;
			try {
				if (cb === false) {
					chain.reject(self.msg);
				} else {
					if (cb === true) {
						ret = self.msg;
					} else {
						ret = cb.call(void 0, self.msg);
					}

					if (ret === chain.promise) {
						chain.reject(TypeError("Promise-chain cycle"));
					} else if (_then = isThenable(ret)) {
						_then.call(ret, chain.resolve, chain.reject);
					} else {
						chain.resolve(ret);
					}
				}
			} catch (err) {
				chain.reject(err);
			}
		}

		function resolve(msg) {
			var _then,
			    self = this;

			// already triggered?
			if (self.triggered) {
				return;
			}

			self.triggered = true;

			// unwrap
			if (self.def) {
				self = self.def;
			}

			try {
				if (_then = isThenable(msg)) {
					schedule(function () {
						var def_wrapper = new MakeDefWrapper(self);
						try {
							_then.call(msg, function $resolve$() {
								resolve.apply(def_wrapper, arguments);
							}, function $reject$() {
								reject.apply(def_wrapper, arguments);
							});
						} catch (err) {
							reject.call(def_wrapper, err);
						}
					});
				} else {
					self.msg = msg;
					self.state = 1;
					if (self.chain.length > 0) {
						schedule(notify, self);
					}
				}
			} catch (err) {
				reject.call(new MakeDefWrapper(self), err);
			}
		}

		function reject(msg) {
			var self = this;

			// already triggered?
			if (self.triggered) {
				return;
			}

			self.triggered = true;

			// unwrap
			if (self.def) {
				self = self.def;
			}

			self.msg = msg;
			self.state = 2;
			if (self.chain.length > 0) {
				schedule(notify, self);
			}
		}

		function iteratePromises(Constructor, arr, resolver, rejecter) {
			for (var idx = 0; idx < arr.length; idx++) {
				(function IIFE(idx) {
					Constructor.resolve(arr[idx]).then(function $resolver$(msg) {
						resolver(idx, msg);
					}, rejecter);
				})(idx);
			}
		}

		function MakeDefWrapper(self) {
			this.def = self;
			this.triggered = false;
		}

		function MakeDef(self) {
			this.promise = self;
			this.state = 0;
			this.triggered = false;
			this.chain = [];
			this.msg = void 0;
		}

		function Promise(executor) {
			if (typeof executor != "function") {
				throw TypeError("Not a function");
			}

			if (this.__NPO__ !== 0) {
				throw TypeError("Not a promise");
			}

			// instance shadowing the inherited "brand"
			// to signal an already "initialized" promise
			this.__NPO__ = 1;

			var def = new MakeDef(this);

			this["then"] = function then(success, failure) {
				var o = {
					success: typeof success == "function" ? success : true,
					failure: typeof failure == "function" ? failure : false
				};
				// Note: `then(..)` itself can be borrowed to be used against
				// a different promise constructor for making the chained promise,
				// by substituting a different `this` binding.
				o.promise = new this.constructor(function extractChain(resolve, reject) {
					if (typeof resolve != "function" || typeof reject != "function") {
						throw TypeError("Not a function");
					}

					o.resolve = resolve;
					o.reject = reject;
				});
				def.chain.push(o);

				if (def.state !== 0) {
					schedule(notify, def);
				}

				return o.promise;
			};
			this["catch"] = function $catch$(failure) {
				return this.then(void 0, failure);
			};

			try {
				executor.call(void 0, function publicResolve(msg) {
					resolve.call(def, msg);
				}, function publicReject(msg) {
					reject.call(def, msg);
				});
			} catch (err) {
				reject.call(def, err);
			}
		}

		var PromisePrototype = builtInProp({}, "constructor", Promise,
		/*configurable=*/false);

		// Note: Android 4 cannot use `Object.defineProperty(..)` here
		Promise.prototype = PromisePrototype;

		// built-in "brand" to signal an "uninitialized" promise
		builtInProp(PromisePrototype, "__NPO__", 0,
		/*configurable=*/false);

		builtInProp(Promise, "resolve", function Promise$resolve(msg) {
			var Constructor = this;

			// spec mandated checks
			// note: best "isPromise" check that's practical for now
			if (msg && typeof msg == "object" && msg.__NPO__ === 1) {
				return msg;
			}

			return new Constructor(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") {
					throw TypeError("Not a function");
				}

				resolve(msg);
			});
		});

		builtInProp(Promise, "reject", function Promise$reject(msg) {
			return new this(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") {
					throw TypeError("Not a function");
				}

				reject(msg);
			});
		});

		builtInProp(Promise, "all", function Promise$all(arr) {
			var Constructor = this;

			// spec mandated checks
			if (ToString.call(arr) != "[object Array]") {
				return Constructor.reject(TypeError("Not an array"));
			}
			if (arr.length === 0) {
				return Constructor.resolve([]);
			}

			return new Constructor(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") {
					throw TypeError("Not a function");
				}

				var len = arr.length,
				    msgs = Array(len),
				    count = 0;

				iteratePromises(Constructor, arr, function resolver(idx, msg) {
					msgs[idx] = msg;
					if (++count === len) {
						resolve(msgs);
					}
				}, reject);
			});
		});

		builtInProp(Promise, "race", function Promise$race(arr) {
			var Constructor = this;

			// spec mandated checks
			if (ToString.call(arr) != "[object Array]") {
				return Constructor.reject(TypeError("Not an array"));
			}

			return new Constructor(function executor(resolve, reject) {
				if (typeof resolve != "function" || typeof reject != "function") {
					throw TypeError("Not a function");
				}

				iteratePromises(Constructor, arr, function resolver(idx, msg) {
					resolve(msg);
				}, reject);
			});
		});

		return Promise;
	});
	});

	var Promise$1 = (npo_src && typeof npo_src === 'object' && 'default' in npo_src ? npo_src['default'] : npo_src);

	/**
	 * @module lib/callbacks
	 */

	var callbackMap = new WeakMap();

	/**
	 * Store a callback for a method or event for a player.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {Player} player The player object.
	 * @param {string} name The method or event name.
	 * @param {(function(this:Player, *): void|{resolve: function, reject: function})} callback
	 *        The callback to call or an object with resolve and reject functions for a promise.
	 * @return {void}
	 */
	function storeCallback(player, name, callback) {
	    var playerCallbacks = callbackMap.get(player.element) || {};

	    if (!(name in playerCallbacks)) {
	        playerCallbacks[name] = [];
	    }

	    playerCallbacks[name].push(callback);
	    callbackMap.set(player.element, playerCallbacks);
	}

	/**
	 * Get the callbacks for a player and event or method.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {Player} player The player object.
	 * @param {string} name The method or event name
	 * @return {function[]}
	 */
	function getCallbacks(player, name) {
	    var playerCallbacks = callbackMap.get(player.element) || {};
	    return playerCallbacks[name] || [];
	}

	/**
	 * Remove a stored callback for a method or event for a player.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {Player} player The player object.
	 * @param {string} name The method or event name
	 * @param {function} [callback] The specific callback to remove.
	 * @return {boolean} Was this the last callback?
	 */
	function removeCallback(player, name, callback) {
	    var playerCallbacks = callbackMap.get(player.element) || {};

	    if (!playerCallbacks[name]) {
	        return true;
	    }

	    // If no callback is passed, remove all callbacks for the event
	    if (!callback) {
	        playerCallbacks[name] = [];
	        callbackMap.set(player.element, playerCallbacks);

	        return true;
	    }

	    var index = playerCallbacks[name].indexOf(callback);

	    if (index !== -1) {
	        playerCallbacks[name].splice(index, 1);
	    }

	    callbackMap.set(player.element, playerCallbacks);
	    return playerCallbacks[name] && playerCallbacks[name].length === 0;
	}

	/**
	 * Move callbacks associated with an element to another element.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {HTMLElement} oldElement The old element.
	 * @param {HTMLElement} newElement The new element.
	 * @return {void}
	 */
	function swapCallbacks(oldElement, newElement) {
	    var playerCallbacks = callbackMap.get(oldElement);

	    callbackMap.set(newElement, playerCallbacks);
	    callbackMap.delete(oldElement);
	}

	/**
	 * @module lib/functions
	 */

	/**
	 * Get the name of the method for a given getter or setter.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {string} prop The name of the property.
	 * @param {string} type Either “get” or “set”.
	 * @return {string}
	 */
	function getMethodName(prop, type) {
	    if (prop.indexOf(type.toLowerCase()) === 0) {
	        return prop;
	    }

	    return '' + type.toLowerCase() + prop.substr(0, 1).toUpperCase() + prop.substr(1);
	}

	/**
	 * Check to see if the object is a DOM Element.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {*} element The object to check.
	 * @return {boolean}
	 */
	function isDomElement(element) {
	    return element instanceof window.HTMLElement;
	}

	/**
	 * Check to see whether the value is a number.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @see http://dl.dropboxusercontent.com/u/35146/js/tests/isNumber.html
	 * @param {*} value The value to check.
	 * @param {boolean} integer Check if the value is an integer.
	 * @return {boolean}
	 */
	function isInteger(value) {
	    // eslint-disable-next-line eqeqeq
	    return !isNaN(parseFloat(value)) && isFinite(value) && Math.floor(value) == value;
	}

	/**
	 * Check to see if the URL is a Vimeo url.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {string} url The url string.
	 * @return {boolean}
	 */
	function isVimeoUrl(url) {
	    return (/^(https?:)?\/\/(player.)?vimeo.com/.test(url)
	    );
	}

	/**
	 * Get the Vimeo URL from an element.
	 * The element must have either a data-vimeo-id or data-vimeo-url attribute.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {object} oEmbedParameters The oEmbed parameters.
	 * @return {string}
	 */
	function getVimeoUrl() {
	    var oEmbedParameters = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	    var id = oEmbedParameters.id;
	    var url = oEmbedParameters.url;
	    var idOrUrl = id || url;

	    if (!idOrUrl) {
	        throw new Error('An id or url must be passed, either in an options object or as a data-vimeo-id or data-vimeo-url attribute.');
	    }

	    if (isInteger(idOrUrl)) {
	        return 'https://vimeo.com/' + idOrUrl;
	    }

	    if (isVimeoUrl(idOrUrl)) {
	        return idOrUrl.replace('http:', 'https:');
	    }

	    if (id) {
	        throw new TypeError('“' + id + '” is not a valid video id.');
	    }

	    throw new TypeError('“' + idOrUrl + '” is not a vimeo.com url.');
	}

	var oEmbedParameters = ['id', 'url', 'width', 'maxwidth', 'height', 'maxheight', 'portrait', 'title', 'byline', 'color', 'autoplay', 'autopause', 'loop', 'responsive'];

	/**
	 * Get the 'data-vimeo'-prefixed attributes from an element as an object.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {HTMLElement} element The element.
	 * @param {Object} [defaults={}] The default values to use.
	 * @return {Object<string, string>}
	 */
	function getOEmbedParameters(element) {
	    var defaults = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	    for (var _iterator = oEmbedParameters, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
	        var _ref;

	        if (_isArray) {
	            if (_i >= _iterator.length) break;
	            _ref = _iterator[_i++];
	        } else {
	            _i = _iterator.next();
	            if (_i.done) break;
	            _ref = _i.value;
	        }

	        var param = _ref;

	        var value = element.getAttribute('data-vimeo-' + param);

	        if (value || value === '') {
	            defaults[param] = value === '' ? 1 : value;
	        }
	    }

	    return defaults;
	}

	/**
	 * Make an oEmbed call for the specified URL.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {string} videoUrl The vimeo.com url for the video.
	 * @param {Object} [params] Parameters to pass to oEmbed.
	 * @return {Promise}
	 */
	function getOEmbedData(videoUrl) {
	    var params = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	    return new Promise(function (resolve, reject) {
	        if (!isVimeoUrl(videoUrl)) {
	            throw new TypeError('“' + videoUrl + '” is not a vimeo.com url.');
	        }

	        var url = 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(videoUrl);

	        for (var param in params) {
	            if (params.hasOwnProperty(param)) {
	                url += '&' + param + '=' + encodeURIComponent(params[param]);
	            }
	        }

	        var xhr = 'XDomainRequest' in window ? new XDomainRequest() : new XMLHttpRequest();
	        xhr.open('GET', url, true);

	        xhr.onload = function () {
	            if (xhr.status === 404) {
	                reject(new Error('“' + videoUrl + '” was not found.'));
	                return;
	            }

	            if (xhr.status === 403) {
	                reject(new Error('“' + videoUrl + '” is not embeddable.'));
	                return;
	            }

	            try {
	                var json = JSON.parse(xhr.responseText);
	                resolve(json);
	            } catch (error) {
	                reject(error);
	            }
	        };

	        xhr.onerror = function () {
	            var status = xhr.status ? ' (' + xhr.status + ')' : '';
	            reject(new Error('There was an error fetching the embed code from Vimeo' + status + '.'));
	        };

	        xhr.send();
	    });
	}

	/**
	 * Create an embed from oEmbed data inside an element.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {object} data The oEmbed data.
	 * @param {HTMLElement} element The element to put the iframe in.
	 * @return {HTMLIFrameElement} The iframe embed.
	 */
	function createEmbed(_ref2, element) {
	    var html = _ref2.html;

	    if (!element) {
	        throw new TypeError('An element must be provided');
	    }

	    if (element.getAttribute('data-vimeo-initialized') !== null) {
	        return element.querySelector('iframe');
	    }

	    var div = document.createElement('div');
	    div.innerHTML = html;

	    var iframe = div.firstChild;

	    element.appendChild(iframe);
	    element.setAttribute('data-vimeo-initialized', 'true');

	    return iframe;
	}

	/**
	 * Initialize all embeds within a specific element
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {HTMLElement} [parent=document] The parent element.
	 * @return {void}
	 */
	function initializeEmbeds() {
	    var parent = arguments.length <= 0 || arguments[0] === undefined ? document : arguments[0];

	    var elements = [].slice.call(parent.querySelectorAll('[data-vimeo-id], [data-vimeo-url]'));

	    var handleError = function (error) {
	        if ('console' in window && console.error) {
	            console.error('There was an error creating an embed: ' + error);
	        }
	    };

	    var _loop = function () {
	        if (_isArray2) {
	            if (_i2 >= _iterator2.length) return 'break';
	            _ref3 = _iterator2[_i2++];
	        } else {
	            _i2 = _iterator2.next();
	            if (_i2.done) return 'break';
	            _ref3 = _i2.value;
	        }

	        var element = _ref3;

	        try {
	            // Skip any that have data-vimeo-defer
	            if (element.getAttribute('data-vimeo-defer') !== null) {
	                return 'continue';
	            }

	            var params = getOEmbedParameters(element);
	            var url = getVimeoUrl(params);

	            getOEmbedData(url, params).then(function (data) {
	                return createEmbed(data, element);
	            }).catch(handleError);
	        } catch (error) {
	            handleError(error);
	        }
	    };

	    _loop2: for (var _iterator2 = elements, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
	        var _ref3;

	        var _ret = _loop();

	        switch (_ret) {
	            case 'break':
	                break _loop2;

	            case 'continue':
	                continue;}
	    }
	}

	/**
	 * Parse a message received from postMessage.
	 *
	 * @param {*} data The data received from postMessage.
	 * @return {object}
	 */
	function parseMessageData(data) {
	    if (typeof data === 'string') {
	        data = JSON.parse(data);
	    }

	    return data;
	}

	/**
	 * Post a message to the specified target.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {Player} player The player object to use.
	 * @param {string} method The API method to call.
	 * @param {object} params The parameters to send to the player.
	 * @return {void}
	 */
	function postMessage(player, method, params) {
	    if (!player.element.contentWindow.postMessage) {
	        return;
	    }

	    var message = {
	        method: method
	    };

	    if (params !== undefined) {
	        message.value = params;
	    }

	    // IE 8 and 9 do not support passing messages, so stringify them
	    var ieVersion = parseFloat(navigator.userAgent.toLowerCase().replace(/^.*msie (\d+).*$/, '$1'));
	    if (ieVersion >= 8 && ieVersion < 10) {
	        message = JSON.stringify(message);
	    }

	    player.element.contentWindow.postMessage(message, player.origin);
	}

	/**
	 * Parse the data received from a message event.
	 *
	 * @author Brad Dougherty <brad@vimeo.com>
	 * @param {Player} player The player that received the message.
	 * @param {(Object|string)} data The message data. Strings will be parsed into JSON.
	 * @return {void}
	 */
	function processData(player, data) {
	    data = parseMessageData(data);
	    var callbacks = [];
	    var param = void 0;

	    if (data.event) {
	        if (data.event === 'error') {
	            var promises = getCallbacks(player, data.data.method);

	            for (var _iterator = promises, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
	                var _ref;

	                if (_isArray) {
	                    if (_i >= _iterator.length) break;
	                    _ref = _iterator[_i++];
	                } else {
	                    _i = _iterator.next();
	                    if (_i.done) break;
	                    _ref = _i.value;
	                }

	                var promise = _ref;

	                var error = new Error(data.data.message);
	                error.name = data.data.name;

	                promise.reject(error);
	                removeCallback(player, data.data.method, promise);
	            }
	        }

	        callbacks = getCallbacks(player, 'event:' + data.event);
	        param = data.data;
	    } else if (data.method) {
	        callbacks = getCallbacks(player, data.method);
	        param = data.value;

	        // Clear all the callbacks
	        removeCallback(player, data.method);
	    }

	    for (var _iterator2 = callbacks, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
	        var _ref2;

	        if (_isArray2) {
	            if (_i2 >= _iterator2.length) break;
	            _ref2 = _iterator2[_i2++];
	        } else {
	            _i2 = _iterator2.next();
	            if (_i2.done) break;
	            _ref2 = _i2.value;
	        }

	        var callback = _ref2;

	        try {
	            if (typeof callback === 'function') {
	                callback.call(player, param);
	                continue;
	            }

	            callback.resolve(param);
	        } catch (e) {
	            // empty
	        }
	    }
	}

	var classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	var playerMap = new WeakMap();
	var readyMap = new WeakMap();

	var Player = function () {
	    /**
	    * Create a Player.
	    *
	    * @author Brad Dougherty <brad@vimeo.com>
	    * @param {(HTMLIFrameElement|HTMLElement|string|jQuery)} element A reference to the Vimeo
	    *        player iframe, and id, or a jQuery object.
	    * @param {object} [options] oEmbed parameters to use when creating an embed in the element.
	    * @return {Player}
	    */
	    function Player(element) {
	        var _this = this;

	        var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
	        classCallCheck(this, Player);

	        /* global jQuery */
	        if (window.jQuery && element instanceof jQuery) {
	            if (element.length > 1 && window.console && console.warn) {
	                console.warn('A jQuery object with multiple elements was passed, using the first element.');
	            }

	            element = element[0];
	        }

	        // Find an element by ID
	        if (typeof element === 'string') {
	            element = document.getElementById(element);
	        }

	        // Not an element!
	        if (!isDomElement(element)) {
	            throw new TypeError('You must pass either a valid element or a valid id.');
	        }

	        // Already initialized an embed in this div, so grab the iframe
	        if (element.nodeName !== 'IFRAME') {
	            var iframe = element.querySelector('iframe');

	            if (iframe) {
	                element = iframe;
	            }
	        }

	        // iframe url is not a Vimeo url
	        if (element.nodeName === 'IFRAME' && !isVimeoUrl(element.getAttribute('src') || '')) {
	            throw new Error('The player element passed isn’t a Vimeo embed.');
	        }

	        // If there is already a player object in the map, return that
	        if (playerMap.has(element)) {
	            return playerMap.get(element);
	        }

	        this.element = element;
	        this.origin = '*';

	        var readyPromise = new Promise$1(function (resolve, reject) {
	            var onMessage = function (event) {
	                if (!isVimeoUrl(event.origin) || _this.element.contentWindow !== event.source) {
	                    return;
	                }

	                if (_this.origin === '*') {
	                    _this.origin = event.origin;
	                }

	                var data = parseMessageData(event.data);
	                var isReadyEvent = 'event' in data && data.event === 'ready';
	                var isPingResponse = 'method' in data && data.method === 'ping';

	                if (isReadyEvent || isPingResponse) {
	                    _this.element.setAttribute('data-ready', 'true');
	                    resolve();
	                    return;
	                }

	                processData(_this, data);
	            };

	            if (window.addEventListener) {
	                window.addEventListener('message', onMessage, false);
	            } else if (window.attachEvent) {
	                window.attachEvent('onmessage', onMessage);
	            }

	            if (_this.element.nodeName !== 'IFRAME') {
	                var params = getOEmbedParameters(element, options);
	                var url = getVimeoUrl(params);

	                getOEmbedData(url, params).then(function (data) {
	                    var iframe = createEmbed(data, element);
	                    _this.element = iframe;
	                    swapCallbacks(element, iframe);

	                    return data;
	                }).catch(function (error) {
	                    return reject(error);
	                });
	            }
	        });

	        // Store a copy of this Player in the map
	        readyMap.set(this, readyPromise);
	        playerMap.set(this.element, this);

	        // Send a ping to the iframe so the ready promise will be resolved if
	        // the player is already ready.
	        if (this.element.nodeName === 'IFRAME') {
	            postMessage(this, 'ping');
	        }

	        return this;
	    }

	    /**
	    * Call a function when the player is initialized.
	    *
	    * @author Brad Dougherty <brad@vimeo.com>
	    * @param {function} onFulfilled Function to be called when the player
	    *        is initialized.
	    * @param {function} [onRejected] Function to be called if
	    *        there is an error initializing the player.
	    * @return {Promise}
	    */


	    Player.prototype.then = function then(onFulfilled) {
	        var onRejected = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

	        return this.ready().then(onFulfilled, onRejected);
	    };

	    /**
	     * Get a promise for a method.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {string} name The API method to call.
	     * @param {Object} [args={}] Arguments to send via postMessage.
	     * @return {Promise}
	     */


	    Player.prototype.callMethod = function callMethod(name) {
	        var _this2 = this;

	        var args = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	        return new Promise$1(function (resolve, reject) {
	            // We are storing the resolve/reject handlers to call later, so we
	            // can’t return here.
	            // eslint-disable-next-line promise/always-return
	            return _this2.ready().then(function () {
	                storeCallback(_this2, name, {
	                    resolve: resolve,
	                    reject: reject
	                });

	                postMessage(_this2, name, args);
	            });
	        });
	    };

	    /**
	     * Get a promise for the value of a player property.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {string} name The property name
	     * @return {Promise}
	     */


	    Player.prototype.get = function get(name) {
	        var _this3 = this;

	        return new Promise$1(function (resolve, reject) {
	            name = getMethodName(name, 'get');

	            // We are storing the resolve/reject handlers to call later, so we
	            // can’t return here.
	            // eslint-disable-next-line promise/always-return
	            return _this3.ready().then(function () {
	                storeCallback(_this3, name, {
	                    resolve: resolve,
	                    reject: reject
	                });

	                postMessage(_this3, name);
	            });
	        });
	    };

	    /**
	     * Get a promise for setting the value of a player property.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {string} name The API method to call.
	     * @param {mixed} value The value to set.
	     * @return {Promise}
	     */


	    Player.prototype.set = function set(name, value) {
	        var _this4 = this;

	        return Promise$1.resolve(value).then(function (val) {
	            name = getMethodName(name, 'set');

	            if (val === undefined || val === null) {
	                throw new TypeError('There must be a value to set.');
	            }

	            return _this4.ready().then(function () {
	                return new Promise$1(function (resolve, reject) {
	                    storeCallback(_this4, name, {
	                        resolve: resolve,
	                        reject: reject
	                    });

	                    postMessage(_this4, name, val);
	                });
	            });
	        });
	    };

	    /**
	     * Add an event listener for the specified event. Will call the
	     * callback with a single parameter, `data`, that contains the data for
	     * that event.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {string} eventName The name of the event.
	     * @param {function(*)} callback The function to call when the event fires.
	     * @return {void}
	     */


	    Player.prototype.on = function on(eventName, callback) {
	        if (!eventName) {
	            throw new TypeError('You must pass an event name.');
	        }

	        if (!callback) {
	            throw new TypeError('You must pass a callback function.');
	        }

	        if (typeof callback !== 'function') {
	            throw new TypeError('The callback must be a function.');
	        }

	        var callbacks = getCallbacks(this, 'event:' + eventName);
	        if (callbacks.length === 0) {
	            this.callMethod('addEventListener', eventName).catch(function () {
	                // Ignore the error. There will be an error event fired that
	                // will trigger the error callback if they are listening.
	            });
	        }

	        storeCallback(this, 'event:' + eventName, callback);
	    };

	    /**
	     * Remove an event listener for the specified event. Will remove all
	     * listeners for that event if a `callback` isn’t passed, or only that
	     * specific callback if it is passed.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {string} eventName The name of the event.
	     * @param {function} [callback] The specific callback to remove.
	     * @return {void}
	     */


	    Player.prototype.off = function off(eventName, callback) {
	        if (!eventName) {
	            throw new TypeError('You must pass an event name.');
	        }

	        if (callback && typeof callback !== 'function') {
	            throw new TypeError('The callback must be a function.');
	        }

	        var lastCallback = removeCallback(this, 'event:' + eventName, callback);

	        // If there are no callbacks left, remove the listener
	        if (lastCallback) {
	            this.callMethod('removeEventListener', eventName).catch(function (e) {
	                // Ignore the error. There will be an error event fired that
	                // will trigger the error callback if they are listening.
	            });
	        }
	    };

	    /**
	     * A promise to load a new video.
	     *
	     * @promise LoadVideoPromise
	     * @fulfill {number} The video with this id successfully loaded.
	     * @reject {TypeError} The id was not a number.
	     */
	    /**
	     * Load a new video into this embed. The promise will be resolved if
	     * the video is successfully loaded, or it will be rejected if it could
	     * not be loaded.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {number} id The id of the video.
	     * @return {LoadVideoPromise}
	     */


	    Player.prototype.loadVideo = function loadVideo(id) {
	        return this.callMethod('loadVideo', id);
	    };

	    /**
	     * A promise to perform an action when the Player is ready.
	     *
	     * @todo document errors
	     * @promise LoadVideoPromise
	     * @fulfill {void}
	     */
	    /**
	     * Trigger a function when the player iframe has initialized. You do not
	     * need to wait for `ready` to trigger to begin adding event listeners
	     * or calling other methods.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {ReadyPromise}
	     */


	    Player.prototype.ready = function ready() {
	        var readyPromise = readyMap.get(this);
	        return Promise$1.resolve(readyPromise);
	    };

	    /**
	     * A representation of a text track on a video.
	     *
	     * @typedef {Object} VimeoTextTrack
	     * @property {string} language The ISO language code.
	     * @property {string} kind The kind of track it is (captions or subtitles).
	     * @property {string} label The human‐readable label for the track.
	     */
	    /**
	     * A promise to enable a text track.
	     *
	     * @promise EnableTextTrackPromise
	     * @fulfill {VimeoTextTrack} The text track that was enabled.
	     * @reject {InvalidTrackLanguageError} No track was available with the
	     *         specified language.
	     * @reject {InvalidTrackError} No track was available with the specified
	     *         language and kind.
	     */
	    /**
	     * Enable the text track with the specified language, and optionally the
	     * specified kind (captions or subtitles).
	     *
	     * When set via the API, the track language will not change the viewer’s
	     * stored preference.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {string} language The two‐letter language code.
	     * @param {string} [kind] The kind of track to enable (captions or subtitles).
	     * @return {EnableTextTrackPromise}
	     */


	    Player.prototype.enableTextTrack = function enableTextTrack(language, kind) {
	        if (!language) {
	            throw new TypeError('You must pass a language.');
	        }

	        return this.callMethod('enableTextTrack', {
	            language: language,
	            kind: kind
	        });
	    };

	    /**
	     * A promise to disable the active text track.
	     *
	     * @promise DisableTextTrackPromise
	     * @fulfill {void} The track was disabled.
	     */
	    /**
	     * Disable the currently-active text track.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {DisableTextTrackPromise}
	     */


	    Player.prototype.disableTextTrack = function disableTextTrack() {
	        return this.callMethod('disableTextTrack');
	    };

	    /**
	     * A promise to pause the video.
	     *
	     * @promise PausePromise
	     * @fulfill {void} The video was paused.
	     */
	    /**
	     * Pause the video if it’s playing.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {PausePromise}
	     */


	    Player.prototype.pause = function pause() {
	        return this.callMethod('pause');
	    };

	    /**
	     * A promise to play the video.
	     *
	     * @promise PlayPromise
	     * @fulfill {void} The video was played.
	     */
	    /**
	     * Play the video if it’s paused. **Note:** on iOS and some other
	     * mobile devices, you cannot programmatically trigger play. Once the
	     * viewer has tapped on the play button in the player, however, you
	     * will be able to use this function.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {PlayPromise}
	     */


	    Player.prototype.play = function play() {
	        return this.callMethod('play');
	    };

	    /**
	     * A promise to unload the video.
	     *
	     * @promise UnloadPromise
	     * @fulfill {void} The video was unloaded.
	     */
	    /**
	     * Return the player to its initial state.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {UnloadPromise}
	     */


	    Player.prototype.unload = function unload() {
	        return this.callMethod('unload');
	    };

	    /**
	     * A promise to get the autopause behavior of the video.
	     *
	     * @promise GetAutopausePromise
	     * @fulfill {boolean} Whether autopause is turned on or off.
	     */
	    /**
	     * Get the autopause behavior for this player.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetAutopausePromise}
	     */


	    Player.prototype.getAutopause = function getAutopause() {
	        return this.get('autopause');
	    };

	    /**
	     * A promise to set the autopause behavior of the video.
	     *
	     * @promise SetAutopausePromise
	     * @fulfill {boolean} Whether autopause is turned on or off.
	     */
	    /**
	     * Enable or disable the autopause behavior of this player.
	     *
	     * By default, when another video is played in the same browser, this
	     * player will automatically pause. Unless you have a specific reason
	     * for doing so, we recommend that you leave autopause set to the
	     * default (`true`).
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {boolean} autopause
	     * @return {SetAutopausePromise}
	     */


	    Player.prototype.setAutopause = function setAutopause(autopause) {
	        return this.set('autopause', autopause);
	    };

	    /**
	     * A promise to get the color of the player.
	     *
	     * @promise GetColorPromise
	     * @fulfill {string} The hex color of the player.
	     */
	    /**
	     * Get the color for this player.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetColorPromise}
	     */


	    Player.prototype.getColor = function getColor() {
	        return this.get('color');
	    };

	    /**
	     * A promise to set the color of the player.
	     *
	     * @promise SetColorPromise
	     * @fulfill {string} The color was successfully set.
	     * @reject {TypeError} The string was not a valid hex or rgb color.
	     * @reject {ContrastError} The color was set, but the contrast is
	     *         outside of the acceptable range.
	     * @reject {EmbedSettingsError} The owner of the player has chosen to
	     *         use a specific color.
	     */
	    /**
	     * Set the color of this player to a hex or rgb string. Setting the
	     * color may fail if the owner of the video has set their embed
	     * preferences to force a specific color.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {string} color The hex or rgb color string to set.
	     * @return {SetColorPromise}
	     */


	    Player.prototype.setColor = function setColor(color) {
	        return this.set('color', color);
	    };

	    /**
	     * A promise to get the current time of the video.
	     *
	     * @promise GetCurrentTimePromise
	     * @fulfill {number} The current time in seconds.
	     */
	    /**
	     * Get the current playback position in seconds.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetCurrentTimePromise}
	     */


	    Player.prototype.getCurrentTime = function getCurrentTime() {
	        return this.get('currentTime');
	    };

	    /**
	     * A promise to set the current time of the video.
	     *
	     * @promise SetCurrentTimePromise
	     * @fulfill {number} The actual current time that was set.
	     * @reject {RangeError} the time was less than 0 or greater than the
	     *         video’s duration.
	     */
	    /**
	     * Set the current playback position in seconds. If the player was
	     * paused, it will remain paused. Likewise, if the player was playing,
	     * it will resume playing once the video has buffered.
	     *
	     * You can provide an accurate time and the player will attempt to seek
	     * to as close to that time as possible. The exact time will be the
	     * fulfilled value of the promise.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {number} currentTime
	     * @return {SetCurrentTimePromise}
	     */


	    Player.prototype.setCurrentTime = function setCurrentTime(currentTime) {
	        return this.set('currentTime', currentTime);
	    };

	    /**
	     * A promise to get the duration of the video.
	     *
	     * @promise GetDurationPromise
	     * @fulfill {number} The duration in seconds.
	     */
	    /**
	     * Get the duration of the video in seconds. It will be rounded to the
	     * nearest second before playback begins, and to the nearest thousandth
	     * of a second after playback begins.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetDurationPromise}
	     */


	    Player.prototype.getDuration = function getDuration() {
	        return this.get('duration');
	    };

	    /**
	     * A promise to get the ended state of the video.
	     *
	     * @promise GetEndedPromise
	     * @fulfill {boolean} Whether or not the video has ended.
	     */
	    /**
	     * Get the ended state of the video. The video has ended if
	     * `currentTime === duration`.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetEndedPromise}
	     */


	    Player.prototype.getEnded = function getEnded() {
	        return this.get('ended');
	    };

	    /**
	     * A promise to get the loop state of the player.
	     *
	     * @promise GetLoopPromise
	     * @fulfill {boolean} Whether or not the player is set to loop.
	     */
	    /**
	     * Get the loop state of the player.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetLoopPromise}
	     */


	    Player.prototype.getLoop = function getLoop() {
	        return this.get('loop');
	    };

	    /**
	     * A promise to set the loop state of the player.
	     *
	     * @promise SetLoopPromise
	     * @fulfill {boolean} The loop state that was set.
	     */
	    /**
	     * Set the loop state of the player. When set to `true`, the player
	     * will start over immediately once playback ends.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {boolean} loop
	     * @return {SetLoopPromise}
	     */


	    Player.prototype.setLoop = function setLoop(loop) {
	        return this.set('loop', loop);
	    };

	    /**
	     * A promise to get the paused state of the player.
	     *
	     * @promise GetLoopPromise
	     * @fulfill {boolean} Whether or not the video is paused.
	     */
	    /**
	     * Get the paused state of the player.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetLoopPromise}
	     */


	    Player.prototype.getPaused = function getPaused() {
	        return this.get('paused');
	    };

	    /**
	     * A promise to get the text tracks of a video.
	     *
	     * @promise GetTextTracksPromise
	     * @fulfill {VimeoTextTrack[]} The text tracks associated with the video.
	     */
	    /**
	     * Get an array of the text tracks that exist for the video.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetTextTracksPromise}
	     */


	    Player.prototype.getTextTracks = function getTextTracks() {
	        return this.get('textTracks');
	    };

	    /**
	     * A promise to get the embed code for the video.
	     *
	     * @promise GetVideoEmbedCodePromise
	     * @fulfill {string} The `<iframe>` embed code for the video.
	     */
	    /**
	     * Get the `<iframe>` embed code for the video.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetVideoEmbedCodePromise}
	     */


	    Player.prototype.getVideoEmbedCode = function getVideoEmbedCode() {
	        return this.get('videoEmbedCode');
	    };

	    /**
	     * A promise to get the id of the video.
	     *
	     * @promise GetVideoIdPromise
	     * @fulfill {number} The id of the video.
	     */
	    /**
	     * Get the id of the video.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetVideoIdPromise}
	     */


	    Player.prototype.getVideoId = function getVideoId() {
	        return this.get('videoId');
	    };

	    /**
	     * A promise to get the title of the video.
	     *
	     * @promise GetVideoTitlePromise
	     * @fulfill {number} The title of the video.
	     */
	    /**
	     * Get the title of the video.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetVideoTitlePromise}
	     */


	    Player.prototype.getVideoTitle = function getVideoTitle() {
	        return this.get('videoTitle');
	    };

	    /**
	     * A promise to get the native width of the video.
	     *
	     * @promise GetVideoWidthPromise
	     * @fulfill {number} The native width of the video.
	     */
	    /**
	     * Get the native width of the currently‐playing video. The width of
	     * the highest‐resolution available will be used before playback begins.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetVideoWidthPromise}
	     */


	    Player.prototype.getVideoWidth = function getVideoWidth() {
	        return this.get('videoWidth');
	    };

	    /**
	     * A promise to get the native height of the video.
	     *
	     * @promise GetVideoHeightPromise
	     * @fulfill {number} The native height of the video.
	     */
	    /**
	     * Get the native height of the currently‐playing video. The height of
	     * the highest‐resolution available will be used before playback begins.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetVideoHeightPromise}
	     */


	    Player.prototype.getVideoHeight = function getVideoHeight() {
	        return this.get('videoHeight');
	    };

	    /**
	     * A promise to get the vimeo.com url for the video.
	     *
	     * @promise GetVideoUrlPromise
	     * @fulfill {number} The vimeo.com url for the video.
	     * @reject {PrivacyError} The url isn’t available because of the video’s privacy setting.
	     */
	    /**
	     * Get the vimeo.com url for the video.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetVideoUrlPromise}
	     */


	    Player.prototype.getVideoUrl = function getVideoUrl() {
	        return this.get('videoUrl');
	    };

	    /**
	     * A promise to get the volume level of the player.
	     *
	     * @promise GetVolumePromise
	     * @fulfill {number} The volume level of the player on a scale from 0 to 1.
	     */
	    /**
	     * Get the current volume level of the player on a scale from `0` to `1`.
	     *
	     * Most mobile devices do not support an independent volume from the
	     * system volume. In those cases, this method will always return `1`.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @return {GetVolumePromise}
	     */


	    Player.prototype.getVolume = function getVolume() {
	        return this.get('volume');
	    };

	    /**
	     * A promise to set the volume level of the player.
	     *
	     * @promise SetVolumePromise
	     * @fulfill {number} The volume was set.
	     * @reject {RangeError} The volume was less than 0 or greater than 1.
	     */
	    /**
	     * Set the volume of the player on a scale from `0` to `1`. When set
	     * via the API, the volume level will not be synchronized to other
	     * players or stored as the viewer’s preference.
	     *
	     * Most mobile devices do not support setting the volume. An error will
	     * *not* be triggered in that situation.
	     *
	     * @author Brad Dougherty <brad@vimeo.com>
	     * @param {number} volume
	     * @return {SetVolumePromise}
	     */


	    Player.prototype.setVolume = function setVolume(volume) {
	        return this.set('volume', volume);
	    };

	    return Player;
	}();

	initializeEmbeds();

	return Player;

}));
 
    
//=====================================================================END VIMEO-TECH




//======================================================================BEGIN VIDEOJS-MARKERS
/*! videojs-markers - v0.5.0 - 2015-08-01
* Copyright (c) 2015 ; Licensed  */
/*! videojs-markers !*/
(function($, videojs, undefined) {
    
   //default setting
   var defaultSetting = {
      markerStyle: {
         'width':'7px',
         'border-radius': '30%',
         'background-color': 'red'
      },
      markerTip: {
         display: true,
         text: function(marker) {
            return marker? marker.text: null;
         },
         time: function(marker) {
            return marker? marker.time: -1;
         }
      },
      breakOverlay:{
         display: false,
         displayTime: 4,
         text: function(marker) {
            return marker? marker.overlayText: null;
         },
         style: {
            'width':'100%',
            'height': '20%',
            'background-color': 'rgba(0,0,0,0.7)',
            'color': 'white',
            'font-size': '17px'
         }
      },
      onMarkerClick: function(marker) {},
      onMarkerReached: function(marker) {},
      markers: []
   };
   
   // create a non-colliding random number
   function generateUUID() {
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
         var r = (d + Math.random()*16)%16 | 0;
         d = Math.floor(d/16);
         return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
      return uuid;
   };
   
   function registerVideoJsMarkersPlugin(options) {
      /**
       * register the markers plugin (dependent on jquery)
       */
      
      this.piWorld = this.piWorld || {};
   
      var setting      = $.extend(true, {}, defaultSetting, options),
          markersMap   = {},
          markersList  = [], // list of markers sorted by time
          videoWrapper = $(this.el()),
          currentMarkerIndex  = -1, 
          player       = this,
          markerTip    = null,
          breakOverlay = null,
          overlayIndex = -1;
          
      function sortMarkersList() {
         // sort the list by time in asc order
         markersList.sort(function(a, b){
            return setting.markerTip.time(a) - setting.markerTip.time(b);
         });
      }
      
      function addMarkers(newMarkers) {
         // create the markers
         $.each(newMarkers, function(index, marker) {
            marker.key = generateUUID();
            var  m = createMarkerDiv(marker);
            videoWrapper.find('.vjs-progress-control').append(m);
            
            // store marker in an internal hash map
            markersMap[marker.key] = marker;
            markersList.push(marker);          
         });
         
         sortMarkersList();
      }
      
      function getPosition(marker){
          return (setting.markerTip.time(marker) / player.duration()) * 100;
      }
      
      function createMarkerDiv(marker) {
         var markerDiv = $("<div class='vjs-marker'></div>");
         markerDiv.css(marker.markerStyle || setting.markerStyle)
            .css({"margin-left" : -parseFloat(markerDiv.css("width"))/2 + 'px', 
               "left" : getPosition(marker) + '%'})
            .attr("data-marker-key", marker.key)
            .attr("data-marker-time", setting.markerTip.time(marker));
            
         // add user-defined class to marker
         if (marker["class"]) {
            markerDiv.addClass(marker["class"]);
         }
         
         // bind click event to seek to marker time
         markerDiv.on('click', function(e) {
            
            var preventDefault = false;
            if (typeof setting.onMarkerClick === "function") {
               // if return false, prevent default behavior
               preventDefault = setting.onMarkerClick(marker) == false;
            }
            
            if (!preventDefault) {
               var key = $(this).data('marker-key');
               player.currentTime(setting.markerTip.time(markersMap[key]));
            }
         });
         
         if (setting.markerTip.display) {
            registerMarkerTipHandler(markerDiv);
         }
         
         return markerDiv;
      }      
      function updateMarkers() {
         // update UI for markers whose time changed

         for (var i = 0; i< markersList.length; i++) {
            var marker = markersList[i];
            var markerDiv = videoWrapper.find(".vjs-marker[data-marker-key='" + marker.key +"']"); 
            var markerTime = setting.markerTip.time(marker);
            
            if (markerDiv.data('marker-time') !== markerTime) {
               markerDiv.css({"left": getPosition(marker) + '%'})
                  .attr("data-marker-time", markerTime);
            }
         }
         sortMarkersList();
      }

      function removeMarkers(indexArray) {
         // reset overlay
         if (breakOverlay){
             overlayIndex = -1;
             breakOverlay.css("display", "none");
         }
         currentMarkerIndex = -1;

         for (var i = 0; i < indexArray.length; i++) {
            var index = indexArray[i];
            var marker = markersList[index];
            if (marker) {
               // delete from memory
               delete markersMap[marker.key];
               markersList[index] = null;
               
               // delete from dom
               videoWrapper.find(".vjs-marker[data-marker-key='" + marker.key +"']").remove();
            }
         }
         
         // clean up array
         for (var i = markersList.length - 1; i >=0; i--) {
            if (markersList[i] === null) {
               markersList.splice(i, 1);
            }
         }
         
         // sort again
         sortMarkersList();
      }
      
      
      // attach hover event handler
      function registerMarkerTipHandler(markerDiv) {
         
         markerDiv.on('mouseover', function(){
            var marker = markersMap[$(this).data('marker-key')];
            
            markerTip.find('.vjs-tip-inner').text(setting.markerTip.text(marker));
            
            // margin-left needs to minus the padding length to align correctly with the marker
            markerTip.css({"left" : getPosition(marker) + '%',
                           "margin-left" : (-parseFloat(markerTip.css("width"))/2 - 1) + 'px',
                           "visibility"  : "visible"});
            
         }).on('mouseout',function(){
            markerTip.css("visibility", "hidden");
         });
      }
      
      function initializeMarkerTip() {
         markerTip = $("<div class='vjs-tip'><div class='vjs-tip-arrow'></div><div class='vjs-tip-inner'></div></div>");
         videoWrapper.find('.vjs-progress-control').append(markerTip);
      }
      
      // show or hide break overlays
      function updateBreakOverlay(currentTime) {
          if(currentMarkerIndex < 0){
            return;
         }
         
         var marker = markersList[currentMarkerIndex];
         var markerTime = setting.markerTip.time(marker);
         
         var text = setting.breakOverlay.text(marker);
         if(!text){
             return;
         }
          
         if (currentTime >= markerTime && 
            currentTime <= (markerTime + setting.breakOverlay.displayTime)) {

            if (overlayIndex !== currentMarkerIndex){
               overlayIndex = currentMarkerIndex;
               breakOverlay.find('.vjs-break-overlay-text').text(text);
            }
            
            breakOverlay.css("visibility", "visible");
         
            window.setTimeout(function(){
                 breakOverlay.css("visibility", "hidden");
            }, 1000*setting.breakOverlay.displayTime);
            
         } else {
            overlayIndex = -1;
            breakOverlay.css("visibility", "hidden");
         }
      }
      
      // problem when the next marker is within the overlay display time from the previous marker
      function initializeOverlay() {
         breakOverlay = $("<div class='vjs-break-overlay'><div class='vjs-break-overlay-text'></div></div>")
            .css(setting.breakOverlay.style);
         videoWrapper.append(breakOverlay);
         overlayIndex = -1;
      }
      
      function onTimeUpdate() {
         /*
             check marker reached in between markers
             the logic here is that it triggers a new marker reached event only if the player 
             enters a new marker range (e.g. from marker 1 to marker 2). Thus, if player is on marker 1 and user clicked on marker 1 again, no new reached event is triggered)
         */
         
         var getNextMarkerTime = function(index) {
            if (index < markersList.length - 1) {
               return setting.markerTip.time(markersList[index + 1]);
            } 
            // next marker time of last marker would be end of video time
            return player.duration();
         };
         var currentTime = player.currentTime();
         var newMarkerIndex;
         
         if (currentMarkerIndex !== -1) {
            // check if staying at same marker
            var nextMarkerTime = getNextMarkerTime(currentMarkerIndex);
            if(currentTime >= setting.markerTip.time(markersList[currentMarkerIndex]) &&
               currentTime < nextMarkerTime) {
           
               //updateBreakOverlay(currentTime);
               return;
            }
         }
         
         // check first marker, no marker is selected
         if (markersList.length > 0 &&
            currentTime < setting.markerTip.time(markersList[0])) {
            newMarkerIndex = -1;
         } else {
            // look for new index
            for (var i = 0; i < markersList.length; i++) {
               nextMarkerTime = getNextMarkerTime(i);
               
               if(currentTime >= setting.markerTip.time(markersList[i]) &&
                  currentTime < nextMarkerTime) {
                  
                  newMarkerIndex = i;
                  break;
               }
            }
         }
         
         // set new marker index
         if (newMarkerIndex !== currentMarkerIndex) {
            // trigger event
            if (newMarkerIndex !== -1 && options.onMarkerReached) {
              options.onMarkerReached(markersList[newMarkerIndex]);
            }
            currentMarkerIndex = newMarkerIndex;
         }
         
         // update overlay
         if(setting.breakOverlay.display) {
            updateBreakOverlay(currentTime);
         }
      }
      
      // setup the whole thing
      function initialize() {         
         this.markersInitialized = true;
         if(!(options.markers && options.markers.length )){
             return;
         }
         //console.log("initializing markers");
         if (setting.markerTip.display) {
            initializeMarkerTip();
         }
      
         // remove existing markers if already initialized
         player.markers.removeAll();
         addMarkers(options.markers);
                  
         if (setting.breakOverlay.display) {
            initializeOverlay();
         }
         onTimeUpdate();
         player.on("timeupdate", onTimeUpdate);
      }
      
      // setup the plugin after we loaded video's meta data (does not work for youtube or vimeo)
      player.on("loadedmetadata", function() {
          //console.log("markers, loadmetada");
          if(player.duration()){
              initialize();
          }
      });
      
      // workaround (for youtube or vimeo)
      player.on("durationchange", function() {
          //console.log("markers, durationchange");
          if(player.duration() && !this.markersInitialized){
              //console.log("markers, intiialize call for duration ", player.duration());
              initialize();
          }
      });
       
      
      // exposed plugin API
      player.markers = {
         getMarkers: function() {
           return markersList;
         },
         next : function() {
            // go to the next marker from current timestamp
            var currentTime = player.currentTime();
            for (var i = 0; i < markersList.length; i++) {
               var markerTime = setting.markerTip.time(markersList[i]);
               if (markerTime > currentTime) {
                  player.currentTime(markerTime);
                  break;
               }
            }
         },
         prev : function() {
            // go to previous marker
            var currentTime = player.currentTime();
            for (var i = markersList.length - 1; i >=0 ; i--) {
               var markerTime = setting.markerTip.time(markersList[i]);
               // add a threshold
               if (markerTime + 0.5 < currentTime) {
                  player.currentTime(markerTime);
                  break;
               }
            }
         },
         add : function(newMarkers) {
            // add new markers given an array of index
            addMarkers(newMarkers);
         },
         remove: function(indexArray) {
            // remove markers given an array of index
            removeMarkers(indexArray);
         },
         removeAll: function(){
            var indexArray = [];
            for (var i = 0; i < markersList.length; i++) {
               indexArray.push(i);
            }
            removeMarkers(indexArray);
         },
         updateTime: function(){
            // notify the plugin to update the UI for changes in marker times 
            updateMarkers();
         },
         reset: function(newMarkers){
            // remove all the existing markers and add new ones
            player.markers.removeAll();
            addMarkers(newMarkers);
         },
         destroy: function(){
            // unregister the plugins and clean up even handlers
            player.markers.removeAll();
            breakOverlay.remove();
            markerTip.remove();
            player.off("timeupdate", updateBreakOverlay);
            delete player.markers;
         }
      };
   }

   videojs.plugin('markers', registerVideoJsMarkersPlugin);

})(jQuery, videojs);
//======================================================================END VIDEOJS-MARKERS



//======================================================================BEGIN VIDEOJS-OFFSET
(function(videojs) {

  "use strict";


/* videojs-offset main */

// Base function.
var vjsoffset = function(options) {
  var Player;
  this._offsetStart = options.start || 0;
  this._offsetEnd = options.end || 0;
  this._restartBeginning = options.restart_beginning || false;

  Player = this.constructor;
  if(!Player.__super__ || !Player.__super__.__offsetInit) {
    Player.__super__ = {
      __offsetInit: true,
      duration: Player.prototype.duration,
      currentTime: Player.prototype.currentTime,
      bufferedPercent: Player.prototype.bufferedPercent,
      remainingTime: Player.prototype.remainingTime
    };

    Player.prototype.duration = function(){
      if(this._offsetEnd > 0) {
        return this._offsetEnd - this._offsetStart;
      }
      return Player.__super__.duration.apply(this, arguments) - this._offsetStart;
    };

    Player.prototype.currentTime = function(seconds){
      if(seconds !== undefined){
        return Player.__super__.currentTime.call(this, seconds + this._offsetStart) - this._offsetStart;
      }
      return Player.__super__.currentTime.apply(this, arguments) - this._offsetStart;
    };

    Player.prototype.remainingTime = function(){
      var curr = this.currentTime();
      if(curr < this._offsetStart) {
        curr = 0;
      }
      return this.duration() - curr;
    };

    Player.prototype.startOffset = function(){
      return this._offsetStart;
    };

    Player.prototype.endOffset = function(){
      if(this._offsetEnd > 0) {
        return this._offsetEnd;
      }
      return this.duration();
    };
  }

  this.on('timeupdate', function(){
    var curr = this.currentTime();
    if(curr < 0){
      this.currentTime(0);
      this.play();
    }
    if(this._offsetEnd > 0 && (curr > (this._offsetEnd-this._offsetStart))) {
      this.pause();
      if (!this._restartBeginning) {
        this.currentTime(this._offsetEnd-this._offsetStart);
      } else {
        this.trigger('loadstart');
        this.currentTime(0);
      }
    }
  });

  return this;

};

 
// Export to the root, which is probably `window`.
//window.vjsoffset = vjsoffset;
videojs.plugin('offset', vjsoffset);


})(videojs);

//======================================================================END VIDEOJS-OFFSET


return videojs;

}); //end-define



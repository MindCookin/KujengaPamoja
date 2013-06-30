
/*********************************************
 *	
 * 	A copy of the original Udacity's
 * 	SoundManager, with modifications on assets loading
 * 
 ************************************************/

SoundManager = Class.extend({
	
	clips : {},
	
    enabled : true,
    
    _context : null,
    _mainNode : null,
    
	create: function () {
		
		try {
	       	sndManager._context = new webkitAudioContext();
		} catch(e){
//			window.alert("Your browser do not support Web Audio, sorry.");
		}
		
		if( sndManager._context )
		{
        	sndManager._mainNode = sndManager._context.createGainNode(0);
        	sndManager._mainNode.connect( sndManager._context.destination );
        }
	},
	
	loadAsync : function( path, callbackFcn ){
		
		if( !sndManager._context )
		{
			return false;
		}
		
		if(this.clips[path])
		{
			callbackFcn( this.clips[path].s );
			return this.clips[path].s;
		}
		
		var clip = { s : new Sound(), b : null, l : false };
		this.clips[path] = clip;
		clip.s.path = path;
		
		var request = new XMLHttpRequest();
		request.open("GET", path, true );
		request.responseType = "arraybuffer";
		request.onload = function() {
			
			sndManager._context.decodeAudioData( request.response, 
				function ( decodedBuffer ){
					clip.b = decodedBuffer;
					clip.l = true;
					callbackFcn( clip.s );
				},
				function ( error ){
					console.log("Failed to load sound");
				} 
			);
		};
		request.send();
		
		return clip.s;
	},
	
	toggleMute : function(){
		
		if( sndManager._context )
        	sndManager._mainNode.gain.value = ( sndManager._mainNode.gain.value === 0 ) ? 1 : 0;
	},
	
	stopAll: function() {
		
		if( !sndManager._context )
			return;
		
		sndManager._mainNode.disconnect();
        sndManager._mainNode = sndManager._context.createGainNode(0);
        sndManager._mainNode.connect( sndManager._context.destination );
	},
	
	playSound: function (path, settings) {
		
		if( !sndManager._context )	return false;
		if (!sndManager.enabled) 	return false;
		
		var looping = false;
		var volume = 0.2;
		
		if (settings) {
			if (settings.looping) looping = settings.looping;
			if (settings.volume) volume = settings.volume;
		}
		
		var sd = this.clips[path];
		if (sd === null) return false;
		if (sd.l === false) return false;
		
		var currentClip = null;
		currentClip = sndManager._context.createBufferSource();
        currentClip.buffer = sd.b;
		currentClip.gain.value = volume;
		currentClip.loop = looping;
		
		currentClip.connect( sndManager._mainNode );
        currentClip.noteOn( 0 );

		return true;
	},

	playSoundInstance : function(soundpath, loop, volume ) {
		
		sndManager.loadAsync( soundpath, function( sound ){ 
				sound.play( loop, volume );
		} );
	}
});


//----------------------------
Sound = Class.extend({
	path: "",

	play: function(loop, volume ) {
	
		if( !volume ) volume = 1;
	
        var settings = { looping : loop, volume : volume };
        sndManager.playSound( this.path, settings );
	}
});

var sndManager = new SoundManager();

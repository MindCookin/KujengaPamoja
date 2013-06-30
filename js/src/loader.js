/*********************************************
 *	
 * This class is responsible for loading assets
 * and javascript source code before the game begins.
 * 
 ************************************************/


LoaderClass = Class.extend({	
	
	// a happy face to draw when everything its loaded
	happy_face : "^-^",
	
	// a set of arrays containing the path to all our assets
	javascript_libs	:[ "/_ah/channel/jsapi", "http://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js", "/js/libs/three.min.js", '/js/libs/greensock/TweenMax.min.js' ],
	javascript_src_mini	:[ "/js/libs/physi-min.js", "/js/libs/stats.min.js", "/js/machine-min.js" ],
	javascript_src_debug:[	// load javascript_src_debug instead of javascript_src_mini whenever you want to debug the code. Minified source is hard to debug.
		"/js/src/constants.js", 
		"/js/ext/EventBus.js",
		"/js/libs/physi-min.js",
		"/js/libs/stats.min.js",
		"/js/ext/OrbitControls.js",
		"/js/ext/SoundManager.js",
		"/js/src/connections.js",
		"/js/src/scene.js",
		"/js/src/gameplay.js",
		"/js/src/machine.js"
	],
	texture_files 	: [ "/images/metal.jpg" ],
	sound_files		: [ "/sounds/background.mp3" , "/sounds/blip.mp3", "/sounds/hit.mp3", "/sounds/lifelost.mp3", "/sounds/lift.mp3", "/sounds/pop.mp3", "/sounds/win.mp3" ],
	
	// the assets dictionary
	cachedAssets : {},
	
	// callback reference and flag for loading
	callback	: null,
	loading		: true,
	
	// the DOM elemnts
	boxDOM 		: null,
	textDOM 	: null,
	barsDOM 	: null,
	
	
	/**
	 * start loading, receives the callback 
	 * to call when all its loaded.
 	 * @param {function} callbackFcn 
	 */
	start : function( callbackFcn ){
	
		// set DOM
		loader.boxDOM = document.getElementById('loader');
		loader.textDOM = document.getElementById('loader_text');
		loader.barsDOM = document.getElementById('loader_bars');
	
		// set callback and start loading
		loader.callback = callbackFcn;
		loader.loadLibs();
		
		// resize handler
		window.onresize = loader.resize;
	}, 
	
	/**
	 * loads javascript libs
	 */
	loadLibs : function(){
		
		loader.textDOM.innerHTML = 'Loading Libraries';
		loader.loadAssets( loader.javascript_libs, loader.loadSrc );
		
		loader.boxDOM.style.visibility = "visible";
		loader.resize();
	},
	
	/**
	 * loads javascript source ( my code and some 
	 * third party that depends on libs i.e. Physijs )
	 */
	loadSrc : function(){
		
		loader.textDOM.innerHTML = 'Loading Source';
//		loader.loadAssets( loader.javascript_src_mini, loader.loadTextures );
		loader.loadAssets( loader.javascript_src_debug, loader.loadTextures );
	},
	
	/**
	 * loads textures/images
	 */
	loadTextures : function(){
	
		loader.textDOM.innerHTML = 'Loading Textures';
		loader.loadAssets( loader.texture_files, loader.loadSounds );
	}, 
	
	/**
	 * loads sounds
	 */
	loadSounds : function(){
	
		// we must create Sound Manager before start loading sounds 
		sndManager.create();
	
		loader.textDOM.innerHTML = 'Loading Sounds';
		loader.loadAssets( loader.sound_files, loader.finish );
	}, 
	
	/**
	 * finish the loader and shows happy face
	 */
	finish : function(){
		
		loader.textDOM.innerHTML = 'Show happy face';
		loader.barsDOM.innerHTML = loader.happy_face;
		loader.resize();
		
		// set a time out to see happy face a while ^_^
		setTimeout( loader.callback, 1000 );
		
		// set loading flag to false
		loader.loading = false;
	},

	/**
	 * Loads assets and adds them to cachedAssets dictionary
	 * Is a copy of the one of the course but with some modifications ( i.e. loads sounds )
	 * 
 	 * @param {Array} assetList 
 	 * @param {function} callbackFcn 
	 */
	loadAssets : function (assetList, callbackFcn) {
	
		// All the information we need to keep track of
		// for this batch.
		var loadBatch = {
			count: 0,
			total: assetList.length,
			cb: callbackFcn
		};

		// Iterates through all the assets provided
		// loads them depending of the extension 
		// and adds them to cachedAssets
		for(var i = 0; i < assetList.length; i++) {
			if(!loader.cachedAssets[assetList[i]]) {
				var assetType = loader.getAssetTypeFromExtension(assetList[i]);

				if(assetType === 0) { // Asset is the texture
					
					var texture = THREE.ImageUtils.loadTexture( 'images/metal.jpg', null, function(){
						loader.onLoadedCallback(texture, loadBatch);
					} );
						
					loader.cachedAssets[assetList[i]] = texture;

				} else if(assetType === 1) { // Asset is Javascript
					
					var fileref = document.createElement('script');
					fileref.setAttribute("type", "text/javascript");
					fileref.onload = function (e){
						loader.onLoadedCallback(fileref,loadBatch);
					};
					fileref.setAttribute("src", assetList[i]);
					document.getElementsByTagName("head")[0].appendChild(fileref);
					
					loader.cachedAssets[assetList[i]] = fileref;
					
				} else if(assetType === 2) { // Asset is Sound
					
					var sound = sndManager.loadAsync( assetList[i], function(sound){
						loader.onLoadedCallback( sound, loadBatch );
					} )
					
					loader.cachedAssets[assetList[i]] = sound;
				}

			} else { // Asset is already loaded
				loader.onLoadedCallback(loader.cachedAssets[assetList[i]], loadBatch);
			}
		}
	},

	/**
	 * The callback for each batch loadAssets function loads.
	 * Is responsible for checking if there is something left to be loaded in the batch.
	 *
 	 * @param {*} asset
 	 * @param {Object} batch
	 */
	onLoadedCallback : function (asset, batch) {
		
		// update the bars down the loader DOM
		loader.barsDOM.innerHTML += "I";
		loader.resize();
		
		// If the entire batch has been loaded,
		// call the callback.
		batch.count++;
		if(batch.count == batch.total) {
			batch.cb(asset);
		}
		
	},

	/**
	 * This function returns the type of an asset 
	 * depending on its filename (fname)
	 *
 	 * @param {Strings} fname
	 */
	getAssetTypeFromExtension : function(fname) {
		if(fname.indexOf('.jpg') != -1 || fname.indexOf('.jpeg') != -1 || fname.indexOf('.png') != -1 || fname.indexOf('.gif') != -1 || fname.indexOf('.wp') != -1) {
			// It's an image!
			return 0;
		}

		if(fname.indexOf('.js') != -1 || fname.indexOf('.json') != -1 || fname.indexOf('jsapi') != -1) {
			// It's javascript!
			return 1;
		}
		
		if(fname.indexOf('.mp3') != -1 ) {
			// It's Sound
			return 2;
		}

		// Uh Oh
		return -1;
	},
	
	/**
	 * Updates position of DOM elements
	 */
	resize : function(){
		
		if( loader.loading )
		{
			var left = window.innerWidth /2 - loader.boxDOM.offsetWidth/2;
			var top  = window.innerHeight /2 - loader.boxDOM.offsetHeight / 2;
			
			loader.boxDOM.style.top = top + "px";
			loader.boxDOM.style.left = left + "px";
		}
	}
})

var loader = new LoaderClass();
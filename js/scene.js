GameSceneClass = Class.extend({	

	CUBE_DIMENSIONS : { w : 25, h : 15, d : 75 },
	VIEWPORT_DIMENSIONS : { w : 0, h : 0 },

	container	: null,
	camera		: null, 
	cameraControls: null, 
	scene		: null,
	renderer	: null,
	spotLight	: null,
	fixedDirectionalLight : null,
	pointLight	: null,
	stats		: null,
	arrows 		: null,
	
	actualSelection : { floor : 0, line : 0 },
	
	arrowsChildren 	: [],
	blocksGrid 		: [],
	allBlocks		: [],
	ground 			: null,
	actualObject	: null,
	checkSimulation : true,
	
	texture : null,
	
	initialObjects : 20,

	start : function() {
	
		// variables definition
		var block, color, blockGeom; 
		var wall, wallGeom, wallParams;
		var arrow, arrowGeom, arrowParams;
		var fixedDirectionalLight, fixedDirectionalLight2, hemisphereLight;
		var i;
		
		// DOM ELEMENT CONTAINER
		gameScene.container = document.getElementById( 'game_wrapper' );
		
		// RENDERER
		try {
			gameScene.renderer = new THREE.WebGLRenderer( { antialias: true, sortObjects : false, shadowMapEnabled : true, shadowMapType : THREE.PCFShadowMap } );
		} catch(error) {
			alert( "Three.js WebGLRenderer is not supported on your browser. Please open Kujenga Pamonga on Google Chrome to see the full experience.");
			return;
		}
		
		gameScene.renderer.sortObjects = false;
		gameScene.renderer.setSize( gameScene.VIEWPORT_DIMENSIONS.w, gameScene.VIEWPORT_DIMENSIONS.h );
		gameScene.renderer.shadowMapEnabled = true;
		gameScene.renderer.shadowMapType 	= THREE.PCFShadowMap;
		gameScene.container.appendChild( gameScene.renderer.domElement );

		// CAMERA
		gameScene.camera = new THREE.PerspectiveCamera( 50, gameScene.VIEWPORT_DIMENSIONS.w / gameScene.VIEWPORT_DIMENSIONS.h, 1, 10000 );
		gameScene.camera.position.set( 150, 180, 200 );

		// CAMERA CONTROLS
		gameScene.resetView();
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userRotate = gameScene.cameraControls.userPan = gameScene.cameraControls.userZoom = false;

		// SCENE
		gameScene.scene = new Physijs.Scene();
		
		// LIGHTS
		hemisphereLight = new THREE.HemisphereLight( 0xFFFFFF, COLOR_YELLOW, .6 );
		gameScene.scene.add( hemisphereLight );
		
		fixedDirectionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		fixedDirectionalLight.position.copy( gameScene.camera.position );
		fixedDirectionalLight.position.setZ( 200 );
		fixedDirectionalLight.castShadow = true;
		fixedDirectionalLight.shadowCameraNear = 200;
		fixedDirectionalLight.shadowCameraFar = gameScene.camera.far;
		fixedDirectionalLight.shadowCameraFov = 50;
		fixedDirectionalLight.shadowBias = -0.0000001;
		fixedDirectionalLight.shadowDarkness = 0.3;
		fixedDirectionalLight.shadowMapWidth = 2048;
		fixedDirectionalLight.shadowMapHeight = 2048;
		gameScene.scene.add( fixedDirectionalLight );
		
		/*
		gameScene.fixedDirectionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
		gameScene.fixedDirectionalLight.position.set( 400, 180, -300 );
		gameScene.fixedDirectionalLight.castShadow = true;
		gameScene.fixedDirectionalLight.shadowCameraNear = 200;
		gameScene.fixedDirectionalLight.shadowCameraFar = gameScene.camera.far;
		gameScene.fixedDirectionalLight.shadowCameraFov = 50;
		gameScene.fixedDirectionalLight.shadowBias = -0.0000001;
		gameScene.fixedDirectionalLight.shadowDarkness = 0.3;
		gameScene.fixedDirectionalLight.shadowMapWidth = 2048;
		gameScene.fixedDirectionalLight.shadowMapHeight = 2048;
		gameScene.scene.add( gameScene.fixedDirectionalLight );
		*/
		gameScene.spotLight = new THREE.SpotLight( 0xddddff, 1.2 );
		gameScene.scene.add( gameScene.spotLight );
		
		// TEXTURE
		gameScene.texture = THREE.ImageUtils.loadTexture( 'images/metal.jpg' );
		gameScene.texture.wrapS = gameScene.texture.wrapT = THREE.RepeatWrapping;
		gameScene.texture.repeat.set( 1, .5 );
		
		// GROUND
		var groundGeom 		= new THREE.PlaneGeometry( 768, 768 );
		gameScene.ground 	= new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { map: gameScene.texture, ambient: 0x030303, color: 0x9d5602, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
		gameScene.ground.material.ambient = gameScene.ground.material.color;
		gameScene.ground.name = "ground";
		gameScene.ground.rotation.x = -90*Math.PI/180;
		gameScene.ground.receiveShadow	 = true;
		gameScene.ground.__dirtyPosition = true;
		gameScene.scene.add( gameScene.ground );
		
		// WALLS
		wallParams = [ 	{ x : 768/2, y: 0, z : 0, rX : -90*Math.PI/180, rY : -90*Math.PI/180, rZ: 0, color : COLOR_RED },
						{ x : -768/2, y: 0, z : 0, rX : -90*Math.PI/180, rY : 90*Math.PI/180, rZ: 0, color : COLOR_GREEN },
						{ x : 0, y: 0, z : -768/2, rX : 0, rY : 0, rZ: -90*Math.PI/180, color : COLOR_BLUE },
						{ x : 0, y: 0, z : 768/2, rX : 0, rY : 180*Math.PI/180, rZ: 90*Math.PI/180, color : COLOR_YELLOW }
						];
							
		for ( i = 0; i < 4; i++ )
		{
			wallGeom = new THREE.PlaneGeometry( 768, 768/2 );
			wall = new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { map: gameScene.texture, ambient: 0x030303, color: wallParams[i].color, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
			wall.position.y = 768/2;
			wall.material.ambient = 0x030303;
			
			wall.position.set( wallParams[i].x, wallParams[i].y, wallParams[i].z );
			wall.rotation.set( wallParams[i].rX, wallParams[i].rY, wallParams[i].rZ );
			
			wall.receiveShadow = true;
			wall.__dirtyPosition = true;
			gameScene.scene.add( wall );
		}
		

		// BLOCKS
		blockGeom = new THREE.CubeGeometry( gameScene.CUBE_DIMENSIONS.w, gameScene.CUBE_DIMENSIONS.h, gameScene.CUBE_DIMENSIONS.d );
		for ( i = 0; i < gameScene.initialObjects; i ++ ) {

			var floor 	= Math.floor(i/3);
			var line 	= Math.floor(i%3);
		//	color		= gameScene.getRandomColor();
			color		= COLOR_BLOCKS[ Math.floor( Math.random() * COLOR_BLOCKS.length )];

			material = Physijs.createMaterial(
				new THREE.MeshPhongMaterial( { map: gameScene.texture, metal : true, ambient: 0x030303, color: color, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ),
				.4, // low friction
				.1 // low restitution
			);
			
			
			block = new Physijs.BoxMesh( blockGeom, material );	
			block.material.transparent = false;
			block.material.opacity = 1;
			block.originalColor 	= color;
			block.addEventListener( 'collision', gameScene.collideBlocks );
			block.castShadow 		= true;
			block.receiveShadow 	= true;

			gameScene.scene.add( block );
			gameScene.allBlocks.push( block );
		}
		
		gameScene.actualObject = gameScene.allBlocks[0];
		gameScene.resetBlocks();
		
		// STATS
		gameScene.stats = new Stats();
		gameScene.stats.domElement.style.position 	= 'absolute';
		gameScene.stats.domElement.style.top 		= '0px';
//		gameScene.container.appendChild( gameScene.stats.domElement );
		
		// ARROWS
		gameScene.arrows = new THREE.Object3D();
		arrowGeom = new THREE.CylinderGeometry( 0, 4, 10, 10 );
		
		arrowParams = [  { x: gameScene.CUBE_DIMENSIONS.w, y:0, z:0, rX : 0, rY : 0, rZ : -90 * Math.PI/180, color : COLOR_RED },
						{ x: -gameScene.CUBE_DIMENSIONS.w, y:0, z:0, rX : 0, rY : 0, rZ : 90 * Math.PI/180, color : COLOR_GREEN },
						{ x: 0, y:0, z:-gameScene.CUBE_DIMENSIONS.d / 2 - 10, rX : -90 * Math.PI/180, rY : 0, rZ :0, color : COLOR_BLUE  },
						{ x: 0, y:0, z:gameScene.CUBE_DIMENSIONS.d / 2 + 10, rX : 90 * Math.PI/180, rY : 0, rZ : 0, color : COLOR_YELLOW },
						{ x: 0, y:gameScene.CUBE_DIMENSIONS.h, z:0, rX : 0, rY : 0, rZ : 0, color : COLOR_BLUE },
						{ x: 0, y:-gameScene.CUBE_DIMENSIONS.h, z:0, rX : Math.PI, rY :0, rZ : 0, color : COLOR_YELLOW }
					];

		for ( i = 0; i < 6; i ++ ) {

			arrow = new THREE.Mesh( arrowGeom, new THREE.MeshLambertMaterial( { color : arrowParams[i].color}) );
			arrow.position.x = arrowParams[i].x;
			arrow.position.y = arrowParams[i].y;
			arrow.position.z = arrowParams[i].z;
			arrow.rotation.x = arrowParams[i].rX;
			arrow.rotation.y = arrowParams[i].rY;
			arrow.rotation.z = arrowParams[i].rZ;
			
			gameScene.arrowsChildren.push( arrow );
			gameScene.arrows.add( arrow );
		}

		
		// RESIZE LISTENER
		$(window).resize( gameScene.resize );
		gameScene.resize();
	},

	resize : function() {

		gameScene.VIEWPORT_DIMENSIONS = { w : $('#game_wrapper').width(), h : $('#game_wrapper').height() };
		
		gameScene.camera.aspect = gameScene.VIEWPORT_DIMENSIONS.w / gameScene.VIEWPORT_DIMENSIONS.h;
		gameScene.camera.updateProjectionMatrix();

		gameScene.renderer.setSize( gameScene.VIEWPORT_DIMENSIONS.w, gameScene.VIEWPORT_DIMENSIONS.h );
	},
	
	
	reset : function() {
	
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = true;
		
		gameScene.resetBlocks();
	},

	resetBlocks : function(){
	
		var block;
		var floor, line, i, j;
	
		gameScene.blocksGrid = [];
	
		for ( i = 0; i < gameScene.initialObjects; i ++ ) {
		
				floor 	= Math.floor(i/3);
				line 	= Math.floor(i%3);

				block 					= gameScene.allBlocks[i];	
				
				block.position.x = ( floor % 2 === 0 ) ? line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w * 1.5 ) : -gameScene.CUBE_DIMENSIONS.w /2;
				block.position.y = gameScene.CUBE_DIMENSIONS.h/2 + ( gameScene.CUBE_DIMENSIONS.h*1*floor );
				block.position.z = ( floor % 2 === 0 ) ? 0 : line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w ) ;

				block.rotation.x = 0;
				block.rotation.y = ( floor % 2 === 0 ) ? 0 : -Math.PI / 2.01;
				block.rotation.z = 0;
				
				block.__dirtyPosition = true;

				gameScene.scene.add( block );
				
				if ( !gameScene.blocksGrid[ floor ] )
					gameScene.blocksGrid[ floor ] = [];
				
				gameScene.blocksGrid[ floor ][line] = block;
		}
		
//		gameScene.scene.simulate( 1.5, 5 );
	},

	render : function() {
	
		if ( connections.data.state != PLAY_PLACE && gameScene.checkSimulation )
			gameScene.scene.simulate( 1.5, 5 );
		
		gameScene.cameraControls.update();
		gameScene.spotLight.position.copy( gameScene.camera.position );
		gameScene.renderer.render( gameScene.scene, gameScene.camera );
		
		if ( connections.data.state >= PLAY_SELECT && connections.data.state <= PLAY_PLACE )
			gameScene.showArrows()
		else 
			gameScene.hideArrows();
		
		gameScene.stats.update();
	},
	
	startGame : function(){
		gameScene.resetView();
	},
	
	select : function() {
		
		gameScene.actualObject = gameScene.blocksGrid[ gameScene.actualSelection.floor ][ gameScene.actualSelection.line ];
		gameScene.makeTransparent();
	},

	move : function( vector ) 
	{
		if( gameScene.actualSelection.floor % 2 === 1  )
		{
			var v = gameScene.actualObject.rotation.clone();
			v.normalize();
			vector.cross( v )
			vector.negate();
		}
			
		gameScene.actualObject.setLinearVelocity( vector );
	}, 
		
	place : function( vector )
	{
		if( gameScene.actualSelection.floor % 2 === 1  )
		{
			var v = gameScene.actualObject.rotation.clone();
			v.normalize();
			vector.cross( v )
			vector.negate();
		}
		
		vector.add( gameScene.actualObject.position );
		
		gameScene.actualObject.__dirtyPosition = true;
		TweenMax.to( gameScene.actualObject.position, .5, { x : vector.x, y : vector.y, z : vector.z, onUpdate : function(){ 
			gameScene.actualObject.__dirtyPosition = true; 
			} } )
	},
	
	resetView: function(){
		
		if( connections.data.users[0] )
		{
			TweenMax.to( gameScene.camera, 1, { fov : 50, onUpdate : function(){ gameScene.camera.updateProjectionMatrix() } } )
			TweenMax.to( gameScene.camera.position, 1, { x : -109, y : 143, z : 200 } )
		} else {
			gameScene.camera.fov = 50;
			gameScene.camera.updateProjectionMatrix();
			gameScene.camera.position.set( -109, 143, 200 );
		}

		gameScene.cameraControls = new THREE.OrbitControls( gameScene.camera, gameScene.renderer.domElement );
		gameScene.cameraControls.autoRotate = gameScene.cameraControls.userPan = false;
		gameScene.cameraControls.userRotate = gameScene.cameraControls.userZoom = true;
		gameScene.cameraControls.maxPolarAngle = Math.PI/2.5;
		gameScene.cameraControls.maxDistance = 500;
		gameScene.cameraControls.minDistance = 50;
		gameScene.cameraControls.center.copy( new THREE.Vector3(0,50,0))
		gameScene.cameraControls.zoomIn(1)
	}, 
	
	makeOpaque : function(){
		
		var i, j, floors, lines;
		
		if( gameScene.actualObject )
			gameScene.actualObject.castShadow 	= true;
		
		for ( i = 0, floors = gameScene.blocksGrid.length; i < floors; i++ )
		{
			for ( j = 0, lines = gameScene.blocksGrid[i].length; j < lines; j++ )
			{
				if ( gameScene.blocksGrid[i][j] && gameScene.blocksGrid[i][j] != gameScene.actualObject )
				{
					gameScene.blocksGrid[i][j].material.setValues( { color : gameScene.blocksGrid[i][j].originalColor } );
					gameScene.blocksGrid[i][j].material.transparent = false;
					gameScene.blocksGrid[i][j].material.opacity = 1;
					gameScene.blocksGrid[i][j].material.map = gameScene.texture;
					gameScene.blocksGrid[i][j].material.needsUpdate = true;
					gameScene.blocksGrid[i][j].castShadow 		= true;
					gameScene.blocksGrid[i][j].receiveShadow 	= true;
				}
			}
		}
	}, 
	
	makeTransparent : function(){
	
		var i, j, floors, lines;
		
		if( gameScene.actualObject )
		{
			gameScene.actualObject.material.setValues( { color : machine.getActiveUserData().color } );
			gameScene.actualObject.material.ambient 	= gameScene.actualObject.material.color;
			gameScene.actualObject.material.transparent = false;
			gameScene.actualObject.material.opacity 	= 1;
			gameScene.actualObject.material.map 		= null;
			gameScene.actualObject.material.needsUpdate = true
			gameScene.actualObject.castShadow 			= false;
			gameScene.actualObject.receiveShadow 		= true;
		}
		
		for ( i = 0, floors = gameScene.blocksGrid.length; i < floors; i++ )
		{
			for ( j = 0, lines = gameScene.blocksGrid[i].length; j < lines; j++ )
			{
				if ( gameScene.blocksGrid[i][j] && gameScene.blocksGrid[i][j] != gameScene.actualObject )
				{
					gameScene.blocksGrid[i][j].material.setValues( { color : COLOR_GRAY } );
					gameScene.blocksGrid[i][j].material.ambient 	= gameScene.blocksGrid[i][j].material.color;
					gameScene.blocksGrid[i][j].material.transparent = true;
					gameScene.blocksGrid[i][j].material.opacity = .5;
					gameScene.blocksGrid[i][j].material.map = null;
					gameScene.blocksGrid[i][j].material.needsUpdate = true;
					gameScene.blocksGrid[i][j].castShadow 		= false;
					gameScene.blocksGrid[i][j].receiveShadow 	= false;
				}
			}
		}
		
		gameScene.renderer.sortObjects = true;
	}, 
	
	getRandomColor : function(){
		return Math.random() * 0xAAAAAA;
	},
	
	showArrows : function(){	
		if( !gameScene.arrows.parent || ( gameScene.actualObject != gameScene.arrows.parent ))
			gameScene.actualObject.add( gameScene.arrows );
			
	},
	
	hideArrows : function(){	
		if( gameScene.arrows.parent )
			gameScene.arrows.parent.remove( gameScene.arrows );
	},
	
	showUpDown : function(){
	
		if( gameScene.arrowsChildren[2].parent )
		{
			gameScene.arrows.remove(gameScene.arrowsChildren[2]);
			gameScene.arrows.remove(gameScene.arrowsChildren[3]);
			gameScene.arrows.add(gameScene.arrowsChildren[4]); 
			gameScene.arrows.add(gameScene.arrowsChildren[5]);
		}
	},
	
	showFrontBack : function(){
	
		if( !gameScene.arrowsChildren[2].parent )
		{
			gameScene.arrows.add(gameScene.arrowsChildren[2]);
			gameScene.arrows.add(gameScene.arrowsChildren[3]);
			gameScene.arrows.remove(gameScene.arrowsChildren[4]); 
			gameScene.arrows.remove(gameScene.arrowsChildren[5]);
		}
	}, 

	toggleStats : function(){
		if( gameScene.container.contains( gameScene.stats.domElement ) )
			gameScene.container.removeChild( gameScene.stats.domElement );
		else
			gameScene.container.appendChild( gameScene.stats.domElement );
	},
	
	collideBlocks : function(){
		
		if ( connections.data.state >= PLAY_MOVE && connections.data.state <= CHECK_PLACE )	
			sndManager.playSoundInstance( '/sounds/hit.mp3', false, .2 );
	}, 
	
	placeBlockOnTop : function()
	{
		var lastLine 	= gameScene.blocksGrid[gameScene.blocksGrid.length-1];
	
		gameScene.blocksGrid[ gameScene.actualSelection.floor ].splice( gameScene.actualSelection.line, 1 );
			
		// if lastLine is full qe add a new floor
		if ( lastLine.length >= 3 )
			gameScene.blocksGrid.push([]);
		
		// and add the actualObject to our new floor
		gameScene.blocksGrid[gameScene.blocksGrid.length-1].push( gameScene.actualObject );
		
		// set Actual selection
		gameScene.actualSelection.floor = gameScene.blocksGrid.length-1;
		gameScene.actualSelection.line 	= gameScene.blocksGrid[gameScene.blocksGrid.length-1].length-1;
		
		var floor 	= gameScene.blocksGrid.length + 1;
		var line 	= 1;
		var targetPosition	= new THREE.Vector3();
		var targetRotation	= new THREE.Vector3();
		var physicsLimiter	= new THREE.Vector3();
	
		gameScene.actualObject.setAngularFactor( physicsLimiter );
		gameScene.actualObject.setLinearFactor( physicsLimiter );
		gameScene.actualObject.setAngularVelocity( physicsLimiter );
		gameScene.actualObject.setLinearVelocity( physicsLimiter );
		
		targetPosition.x = ( floor % 2 === 0 ) ? line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w * 1.5 ) : -gameScene.CUBE_DIMENSIONS.w /2;
		targetPosition.y = gameScene.CUBE_DIMENSIONS.h/2 + ( gameScene.CUBE_DIMENSIONS.h*1*floor ) - 10;
		targetPosition.z = ( floor % 2 === 0 ) ? 0 : line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w ) ;
		
		targetRotation.x = 0;
		targetRotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
		targetRotation.z = 0;

		gameScene.checkSimulation = false;
		gameScene.renderer.sortObjects = true;
		
		gameScene.actualObject.__dirtyPosition = true;
		TweenMax.to( gameScene.actualObject.position, .5, { x : targetPosition.x, y : targetPosition.y, z : targetPosition.z, onUpdate : function(){ 
			gameScene.actualObject.__dirtyPosition = true; 
			gameScene.renderer.sortObjects = true;
			} } )
		
		gameScene.actualObject.__dirtyRotation = true;
		TweenMax.to( gameScene.actualObject.rotation, .5, { 
					x : targetRotation.x, y : targetRotation.y, z : targetRotation.z, 
					onUpdate : function(){ 	gameScene.actualObject.__dirtyRotation = true; }, 
					onComplete : function(){ 
						connections.sendMessage('/moveOK');
						gameScene.checkSimulation = true;
					} } )	
		
		
		sndManager.playSoundInstance( '/sounds/lift.mp3', false );
		
		TweenMax.to( gameScene.camera.position, 1, { x : 85, y : targetPosition.y + 100, z : 200 } )
		TweenMax.to( gameScene.camera, 1, { fov : 40, onUpdate : function(){ gameScene.camera.updateProjectionMatrix() } } )
	}
})

var gameScene = new GameSceneClass();
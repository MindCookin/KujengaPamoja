GameSceneClass = Class.extend({	

	CUBE_DIMENSIONS : { w : 25, h : 15, d : 75 },
	VIEWPORT_DIMENSIONS : { w : 0, h : 0 },

	camera		: null, 
	cameraControls: null, 
	scene		: null,
	renderer	: null,
	spotLight	: null,
	pointLight	: null,
	stats		: null,
	
	actualSelection : { floor : 0, line : 0 },
	
	objects 	: [],
	ground 		: null,
	actualObject: null,
	
	initialObjects : 19,

	start : function() {
	
		// imports
		Physijs.scripts.worker 	= 'js/libs/physijs_worker.js';
		Physijs.scripts.ammo 	= 'ammo.js';

		// variables definition
		var block, color;
		var i;
		var container = document.getElementById( 'game_wrapper' );
		
		// set dimensions
		gameScene.VIEWPORT_DIMENSIONS = { w : $('#game_wrapper').width(), h : $('#game_wrapper').height() };
		
		// renderer
		gameScene.renderer = new THREE.WebGLRenderer( { antialias: true } );
		gameScene.renderer.sortObjects = false;
		gameScene.renderer.setSize( gameScene.VIEWPORT_DIMENSIONS.w, gameScene.VIEWPORT_DIMENSIONS.h );
		gameScene.renderer.shadowMapEnabled = true;
		gameScene.renderer.shadowMapType 	= THREE.PCFShadowMap;
		container.appendChild( gameScene.renderer.domElement );

		// camera
		gameScene.camera = new THREE.PerspectiveCamera( 50, gameScene.VIEWPORT_DIMENSIONS.w / gameScene.VIEWPORT_DIMENSIONS.h, 1, 10000 );
		gameScene.camera.position.x = 150;
		gameScene.camera.position.y = 180;
		gameScene.camera.position.z = 200;

		// camera controls
		gameScene.cameraControls = new THREE.OrbitControls( gameScene.camera, gameScene.renderer.domElement );
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userRotate = gameScene.cameraControls.userPan = gameScene.cameraControls.userZoom = false;
		gameScene.cameraControls.maxPolarAngle = Math.PI/2.5;
		gameScene.cameraControls.maxDistance = 500;
		gameScene.cameraControls.minDistance = 50;
		gameScene.cameraControls.center.copy( new THREE.Vector3(0,50,0))
		gameScene.cameraControls.zoomIn(1.5)
		gameScene.scene = new Physijs.Scene();

		// lights
		gameScene.scene.add( new THREE.AmbientLight( 0x000000 ) );

		var spotLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		spotLight.position.copy( gameScene.camera.position );
		spotLight.position.setZ( 200 );
		spotLight.castShadow = true;
		spotLight.shadowCameraNear = 200;
		spotLight.shadowCameraFar = gameScene.camera.far;
		spotLight.shadowCameraFov = 50;
		spotLight.shadowBias = -0.00022;
		spotLight.shadowDarkness = 0.5;
		spotLight.shadowMapWidth = 1024;
		spotLight.shadowMapHeight = 1024;
		gameScene.scene.add( spotLight );
		
		gameScene.spotLight = new THREE.SpotLight( 0xddddff, 2.5 );
		gameScene.spotLight.castShadow = true;
		gameScene.spotLight.shadowCameraNear = gameScene.camera.near;
		gameScene.spotLight.shadowCameraFar = gameScene.camera.far;
		gameScene.spotLight.shadowCameraFov = 50;
		gameScene.spotLight.shadowBias = -0.00022;
		gameScene.spotLight.shadowDarkness = 0.5;
		gameScene.spotLight.shadowMapWidth = 1024;
		gameScene.spotLight.shadowMapHeight = 1024;
		gameScene.scene.add( gameScene.spotLight );
		
		// ELEMENTS
		// ground
		var groundGeom = new THREE.PlaneGeometry( 768, 768 );
		gameScene.ground = new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0x9d5602, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
		gameScene.ground.material.ambient = gameScene.ground.material.color;
		gameScene.ground.name = "ground";
		gameScene.ground.rotation.x = -90*Math.PI/180;
		gameScene.ground.receiveShadow	 = true;
		gameScene.ground.__dirtyPosition = true;
		gameScene.scene.add( gameScene.ground );
		
		// walls
		for ( i = 0; i < 4; i++ )
		{
			var wallGeom = new THREE.PlaneGeometry( 768, 768/2 );
			var wall = new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { ambient: 0x030303, color: gameScene.getRandomColor(), specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
			wall.position.y = 768/2;
			wall.material.ambient = 0x030303;
			
			if ( i == 0 )
			{
				wall.position.x = 768/2;
				wall.rotation.x = -90*Math.PI/180;
				wall.rotation.y = -90*Math.PI/180;
			} else if ( i == 1 )
			{
				wall.position.x = -768/2;
				wall.rotation.x = -90*Math.PI/180;
				wall.rotation.y = 90*Math.PI/180;
			} else if ( i == 2 )
			{
				wall.position.z = -768/2;
				wall.rotation.z = -90*Math.PI/180;
			} else if ( i == 3 )
			{
				wall.position.z = 768/2;
				wall.rotation.z = 90*Math.PI/180;
				wall.rotation.y = 180*Math.PI/180;
			}
			wall.receiveShadow = true;
			wall.__dirtyPosition = true;
			gameScene.scene.add( wall );
		}

		// blocks
		var geometry = new THREE.CubeGeometry( gameScene.CUBE_DIMENSIONS.w, gameScene.CUBE_DIMENSIONS.h, gameScene.CUBE_DIMENSIONS.d );
		for ( i = 0; i < gameScene.initialObjects; i ++ ) {

			var floor 	= Math.floor(i/3);
			var line 	= Math.floor(i%3);
			color		= gameScene.getRandomColor();

//			material = new THREE.MeshPhongMaterial( { metal : true, ambient: 0x030303, color: color, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } );
			
			material = Physijs.createMaterial(
				new THREE.MeshPhongMaterial( { metal : true, ambient: 0x030303, color: color, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ),
				.4, // low friction
				.1 // low restitution
			);
			
			var object = new Physijs.BoxMesh( geometry, material );	
			object.material.ambient = object.material.color;
			object.originalColor = color;

			object.position.x = ( floor % 2 === 0 ) ? line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w * 1.5 ) : -gameScene.CUBE_DIMENSIONS.w /2;
			object.position.y = gameScene.CUBE_DIMENSIONS.h/2 + ( gameScene.CUBE_DIMENSIONS.h*1*floor );
			object.position.z = ( floor % 2 === 0 ) ? 0 : line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w ) ;

			object.rotation.x = 0;
			object.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
			object.rotation.z = 0;

			object.castShadow 		= true;
			object.receiveShadow 	= true;
			object.__dirtyPosition 	= true;

			gameScene.scene.add( object );
			
			if ( !gameScene.objects[ floor ] )
				gameScene.objects[ floor ] = [];
			
			gameScene.objects[ floor ][line] = object;
		}
		
		// stats
		gameScene.stats = new Stats();
		gameScene.stats.domElement.style.position = 'absolute';
		gameScene.stats.domElement.style.top = '0px';
		container.appendChild( gameScene.stats.domElement );
	},

	resize : function() {

		gameScene.camera.aspect = gameScene.VIEWPORT_DIMENSIONS.w / gameScene.VIEWPORT_DIMENSIONS.h;
		gameScene.camera.updateProjectionMatrix();

		gameScene.renderer.setSize( gameScene.VIEWPORT_DIMENSIONS.w, gameScene.VIEWPORT_DIMENSIONS.h );
	},
	
	
	reset : function() {
	
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = true;
		
		var block, color;
		var floor, line, i, j;
		var simpleArray = [];	
		
		for ( i = 0; i < gameScene.objects.length; i++ ) {
			for ( j = 0; j < 3; j++ ) {
				block = gameScene.objects[i][j];
				
				if ( block && block != null )
				{
					simpleArray.push( block );
					gameScene.scene.remove( block );
				}
			}
		}
		
		gameScene.objects = [];
	
		for ( i = 0; i < gameScene.initialObjects; i ++ ) {
		
				floor 	= Math.floor(i/3);
				line 	= Math.floor(i%3);
				color	= gameScene.getRandomColor();

				block = simpleArray.pop();	
				block.material.color 	= new THREE.Color( color );
				block.material.ambient 	= block.material.color;
				block.originalColor 	= color;

				block.position.x = ( floor % 2 === 0 ) ? line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w * 1.5 ) : -gameScene.CUBE_DIMENSIONS.w /2;
				block.position.y = gameScene.CUBE_DIMENSIONS.h/2 + ( gameScene.CUBE_DIMENSIONS.h*1*floor );
				block.position.z = ( floor % 2 === 0 ) ? 0 : line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w ) ;

				block.rotation.x = 0;
				block.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
				block.rotation.z = 0;
				
				block.__dirtyPosition = true;

				gameScene.scene.add( block );
				
				if ( !gameScene.objects[ floor ] )
					gameScene.objects[ floor ] = [];
				
				gameScene.objects[ floor ][line] = block;
		}
		
		gameScene.scene.simulate( 1.5, 5 );
	},

	render : function() {
	
		if ( connections.data.state != PLAY_PLACE )
			gameScene.scene.simulate( 1.5, 5 );
		
		gameScene.cameraControls.update();
		gameScene.spotLight.position.copy( gameScene.camera.position );
		gameScene.renderer.render( gameScene.scene, gameScene.camera );
		
		gameScene.stats.update();
	},
	
	select : function() {
		
		gameScene.actualObject = gameScene.objects[ gameScene.actualSelection.floor ][ gameScene.actualSelection.line ];
		gameScene.makeTransparent();
	},

	move : function( vector ) 
	{
		gameScene.actualObject.setLinearVelocity( vector );
	}, 
		
	place : function( vector ){

		vector.add( gameScene.actualObject.position );
		gameScene.actualObject.__dirtyPosition = true;
		TweenMax.to( gameScene.actualObject.position, .5, { x : vector.x, y : vector.y, z : vector.z, onUpdate : function(){ 
			gameScene.actualObject.__dirtyPosition = true; 
			} } )
	},
	
	resetView: function(){
		
		gameScene.camera.position.copy( new THREE.Vector3(50,180,200));

		gameScene.cameraControls = new THREE.OrbitControls( gameScene.camera, gameScene.renderer.domElement );
		gameScene.cameraControls.autoRotate= false;
		gameScene.cameraControls.userPan = false;
		gameScene.cameraControls.userRotate = gameScene.cameraControls.userZoom = true;
		gameScene.cameraControls.maxPolarAngle = Math.PI/2.5;
		gameScene.cameraControls.maxDistance = 500;
		gameScene.cameraControls.minDistance = 50;
		gameScene.cameraControls.center.copy( new THREE.Vector3(0,50,0))
		gameScene.cameraControls.zoomIn(1.5)
	}, 
	
	makeOpaque : function(){
		
		if( gameScene.actualObject )
			gameScene.actualObject.castShadow 	= true;
		
		for ( var i = 0; i < gameScene.objects.length; i++ )
		{
			for (var j = 0; j < gameScene.objects[i].length; j++ )
			{
				if ( gameScene.objects[i][j] && gameScene.objects[i][j] != gameScene.actualObject )
				{
					gameScene.objects[i][j].material.setValues( { color : gameScene.objects[i][j].originalColor } );
					gameScene.objects[i][j].material.transparent = false;
					gameScene.objects[i][j].material.opacity = 1;
					gameScene.objects[i][j].castShadow 		= true;
					gameScene.objects[i][j].receiveShadow 	= true;
				}
			}
		}
	}, 
	
	makeTransparent : function(){
	
		if( gameScene.actualObject )
		{
			gameScene.actualObject.material.setValues( { color : machine.getActiveUserData().color } );
			gameScene.actualObject.material.transparent = false;
			gameScene.actualObject.material.opacity 	= 1;
			gameScene.actualObject.castShadow 			= false;
			gameScene.actualObject.receiveShadow 		= true;
		}
		
		for ( var i = 0; i < gameScene.objects.length; i++ )
		{
			for (var j = 0; j < gameScene.objects[i].length; j++ )
			{
				if ( gameScene.objects[i][j] && gameScene.objects[i][j] != gameScene.actualObject )
				{
					gameScene.objects[i][j].material.setValues( { color : COLOR_GRAY } );
					gameScene.objects[i][j].material.transparent = true;
					gameScene.objects[i][j].material.opacity = .5;
					gameScene.objects[i][j].castShadow 		= false;
					gameScene.objects[i][j].receiveShadow 	= false;
				}
			}
		}
	}, 
	
	getRandomColor : function(){
		return Math.random() * 0xAAAAAA;
	}
})

var gameScene = new GameSceneClass();
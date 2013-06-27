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
	
	arrowsChildren : [],
	objects 	: [],
	ground 		: null,
	actualObject: null,
	
	initialObjects : 20,

	start : function() {
	
		// imports
		Physijs.scripts.worker 	= 'js/libs/physijs_worker.js';
		Physijs.scripts.ammo 	= 'ammo.js';

		// variables definition
		var block, color;
		var i;
		gameScene.container = document.getElementById( 'game_wrapper' );
		
		// set dimensions
		gameScene.VIEWPORT_DIMENSIONS = { w : $('#game_wrapper').width(), h : $('#game_wrapper').height() };
		
		// renderer
		gameScene.renderer = new THREE.WebGLRenderer( { antialias: true } );
		gameScene.renderer.sortObjects = false;
		gameScene.renderer.setSize( gameScene.VIEWPORT_DIMENSIONS.w, gameScene.VIEWPORT_DIMENSIONS.h );
		gameScene.renderer.shadowMapEnabled = true;
		gameScene.renderer.shadowMapType 	= THREE.PCFShadowMap;
		gameScene.container.appendChild( gameScene.renderer.domElement );

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
		gameScene.cameraControls.zoomIn(1)
		gameScene.scene = new Physijs.Scene();

		// lights
		gameScene.scene.add( new THREE.AmbientLight( 0x000000 ) );

		gameScene.fixedDirectionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		gameScene.fixedDirectionalLight.position.copy( gameScene.camera.position );
		gameScene.fixedDirectionalLight.position.setZ( 200 );
		gameScene.fixedDirectionalLight.castShadow = true;
		gameScene.fixedDirectionalLight.shadowCameraNear = 200;
		gameScene.fixedDirectionalLight.shadowCameraFar = gameScene.camera.far;
		gameScene.fixedDirectionalLight.shadowCameraFov = 50;
		gameScene.fixedDirectionalLight.shadowBias = -0.0000001;
		gameScene.fixedDirectionalLight.shadowDarkness = 0.3;
		gameScene.fixedDirectionalLight.shadowMapWidth = 2048;
		gameScene.fixedDirectionalLight.shadowMapHeight = 2048;

		gameScene.scene.add( gameScene.fixedDirectionalLight );
		
		gameScene.spotLight = new THREE.SpotLight( 0xddddff, 2.5 );
		gameScene.spotLight.castShadow = true;
		gameScene.spotLight.shadowCameraNear = gameScene.camera.near;
		gameScene.spotLight.shadowCameraFar = gameScene.camera.far;
		gameScene.spotLight.shadowCameraFov = 50;
		gameScene.spotLight.shadowBias = -0.00022;
		gameScene.spotLight.shadowDarkness = 0.5;
		gameScene.spotLight.shadowMapWidth = 2048;
		gameScene.spotLight.shadowMapHeight = 2048;
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
		
		var wallData = [ 	{ x : 768/2, y: 0, z : 0, rX : -90*Math.PI/180, rY : -90*Math.PI/180, rZ: 0, color : COLOR_RED },
							{ x : -768/2, y: 0, z : 0, rX : -90*Math.PI/180, rY : 90*Math.PI/180, rZ: 0, color : COLOR_GREEN },
							{ x : 0, y: 0, z : -768/2, rX : 0, rY : 0, rZ: -90*Math.PI/180, color : COLOR_BLUE },
							{ x : 0, y: 0, z : 768/2, rX : 0, rY : 180*Math.PI/180, rZ: 90*Math.PI/180, color : COLOR_YELLOW }
							];
		
		// walls
		for ( i = 0; i < 4; i++ )
		{
			var wallGeom = new THREE.PlaneGeometry( 768, 768/2 );
			var wall = new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { ambient: 0x030303, color: wallData[i].color, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
			wall.position.y = 768/2;
			wall.material.ambient = 0x030303;
			
			wall.position.set( wallData[i].x, wallData[i].y, wallData[i].z );
			wall.rotation.set( wallData[i].rX, wallData[i].rY, wallData[i].rZ );
			
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
			object.rotation.y = ( floor % 2 === 0 ) ? 0 : -Math.PI / 2.01;
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
//		gameScene.container.appendChild( gameScene.stats.domElement );
		
		// arrows
		gameScene.arrows = new THREE.Object3D();
		var aGeometry = new THREE.CylinderGeometry( 0, 4, 10, 10 );
		var aMesh;
		
		var params = [  { x: gameScene.CUBE_DIMENSIONS.w, y:0, z:0, rX : 0, rY : 0, rZ : -90 * Math.PI/180, color : COLOR_RED },
						{ x: -gameScene.CUBE_DIMENSIONS.w, y:0, z:0, rX : 0, rY : 0, rZ : 90 * Math.PI/180, color : COLOR_GREEN },
						{ x: 0, y:0, z:-gameScene.CUBE_DIMENSIONS.d / 2 - 10, rX : -90 * Math.PI/180, rY : 0, rZ :0, color : COLOR_BLUE  },
						{ x: 0, y:0, z:gameScene.CUBE_DIMENSIONS.d / 2 + 10, rX : 90 * Math.PI/180, rY : 0, rZ : 0, color : COLOR_YELLOW },
						{ x: 0, y:gameScene.CUBE_DIMENSIONS.h, z:0, rX : 0, rY : 0, rZ : 0, color : COLOR_BLUE },
						{ x: 0, y:-gameScene.CUBE_DIMENSIONS.h, z:0, rX : Math.PI, rY :0, rZ : 0, color : COLOR_YELLOW }
					];

		for ( i = 0; i < 6; i ++ ) {

			aMesh = new THREE.Mesh( aGeometry, new THREE.MeshLambertMaterial( { color : params[i].color}) );
			aMesh.position.x = params[i].x;
			aMesh.position.y = params[i].y;
			aMesh.position.z = params[i].z;
			aMesh.rotation.x = params[i].rX;
			aMesh.rotation.y = params[i].rY;
			aMesh.rotation.z = params[i].rZ;
			
			gameScene.arrowsChildren.push( aMesh );
			gameScene.arrows.add( aMesh );
		}

		$(window).resize( gameScene.resize );
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
				block.rotation.y = ( floor % 2 === 0 ) ? 0 : -Math.PI / 2.01;
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
		
		if ( connections.data.state >= PLAY_SELECT && connections.data.state <= PLAY_PLACE )
			gameScene.showArrows()
		else 
			gameScene.hideArrows();
		
		gameScene.stats.update();
	},
	
	select : function() {
		
//		gameScene.showUpDown();
		
		gameScene.actualObject = gameScene.objects[ gameScene.actualSelection.floor ][ gameScene.actualSelection.line ];
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
		
		gameScene.camera.position.copy( new THREE.Vector3(50,180,200));

		gameScene.cameraControls = new THREE.OrbitControls( gameScene.camera, gameScene.renderer.domElement );
		gameScene.cameraControls.autoRotate= false;
		gameScene.cameraControls.userPan = false;
		gameScene.cameraControls.userRotate = gameScene.cameraControls.userZoom = true;
		gameScene.cameraControls.maxPolarAngle = Math.PI/2.5;
		gameScene.cameraControls.maxDistance = 500;
		gameScene.cameraControls.minDistance = 50;
		gameScene.cameraControls.center.copy( new THREE.Vector3(0,50,0))
		gameScene.cameraControls.zoomIn(1)
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
					gameScene.objects[i][j].material.ambient 	= gameScene.objects[i][j].originalColor;
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
			gameScene.actualObject.material.ambient 	= gameScene.actualObject.material.color;
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
					gameScene.objects[i][j].material.ambient 	= gameScene.objects[i][j].material.color;
					gameScene.objects[i][j].material.transparent = true;
					gameScene.objects[i][j].material.opacity = .5;
					gameScene.objects[i][j].castShadow 		= false;
					gameScene.objects[i][j].receiveShadow 	= false;
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
	
//		if( gameScene.arrows.parent )
//			gameScene.arrows.parent.remove( gameScene.arrows );
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
	}
})

var gameScene = new GameSceneClass();
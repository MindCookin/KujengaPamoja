GameBoardClass = Class.extend({	

	CUBE_DIMENSIONS : { w : 25, h : 15, d : 75 },
	VIEWPORT_DIMENSIONS : { w : 0, h : 0 },

	stats		: null,
	
	camera		: null, 
	cameraControls: null, 
	scene		: null,
	renderer	: null,
	spotLight	: null,
	pointLight	: null,
	
	checkedPlace: false,
	checkedMove	: false,
	haveLost	: false,
	
	looper : null,
	
	actualSelection : { floor : 0, line : 0 },
	
	objects 	: [],
	ground 			: null,
	actualObject 	: null,
	
	initialObjects : 19,

	start : function() {
	
		Physijs.scripts.worker 	= 'js/libs/physijs_worker.js';
		Physijs.scripts.ammo 	= 'ammo.js';

		var block, color;
		var i;
		var container = document.getElementById( 'game_wrapper' );
		
		gameBoard.VIEWPORT_DIMENSIONS = { w : $('#game_wrapper').width(), h : $('#game_wrapper').height() };
		
		gameBoard.renderer = new THREE.WebGLRenderer( { antialias: true } );
		gameBoard.renderer.sortObjects = false;
		gameBoard.renderer.setSize( gameBoard.VIEWPORT_DIMENSIONS.w, gameBoard.VIEWPORT_DIMENSIONS.h );

		gameBoard.renderer.shadowMapEnabled = true;
		gameBoard.renderer.shadowMapType 	= THREE.PCFShadowMap;

		container.appendChild( gameBoard.renderer.domElement );

		gameBoard.camera = new THREE.PerspectiveCamera( 50, gameBoard.VIEWPORT_DIMENSIONS.w / gameBoard.VIEWPORT_DIMENSIONS.h, 1, 10000 );
		gameBoard.camera.position.x = 150;
		gameBoard.camera.position.y = 180;
		gameBoard.camera.position.z = 200;

		gameBoard.cameraControls = new THREE.OrbitControls( gameBoard.camera, gameBoard.renderer.domElement );
		gameBoard.cameraControls.autoRotate= true;
		gameBoard.cameraControls.userRotate = gameBoard.cameraControls.userPan = gameBoard.cameraControls.userZoom = false;
		gameBoard.cameraControls.maxPolarAngle = Math.PI/2.5;
		gameBoard.cameraControls.maxDistance = 500;
		gameBoard.cameraControls.minDistance = 50;
		gameBoard.cameraControls.center.copy( new THREE.Vector3(0,50,0))
		gameBoard.cameraControls.zoomIn(1.5)

		gameBoard.scene = new Physijs.Scene();

		// LIGHTS
		gameBoard.scene.add( new THREE.AmbientLight( 0x000000 ) );

		var spotLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		spotLight.position.copy( gameBoard.camera.position );
		spotLight.position.setZ( 200 );
		spotLight.castShadow = true;
		spotLight.shadowCameraNear = 200;
		spotLight.shadowCameraFar = gameBoard.camera.far;
		spotLight.shadowCameraFov = 50;
		spotLight.shadowBias = -0.00022;
		spotLight.shadowDarkness = 0.5;
		spotLight.shadowMapWidth = 1024;
		spotLight.shadowMapHeight = 1024;
		gameBoard.scene.add( spotLight );
		
		gameBoard.spotLight = new THREE.SpotLight( 0xddddff, 2.5 );
		gameBoard.spotLight.castShadow = true;
		gameBoard.spotLight.shadowCameraNear = gameBoard.camera.near;
		gameBoard.spotLight.shadowCameraFar = gameBoard.camera.far;
		gameBoard.spotLight.shadowCameraFov = 50;
		gameBoard.spotLight.shadowBias = -0.00022;
		gameBoard.spotLight.shadowDarkness = 0.5;
		gameBoard.spotLight.shadowMapWidth = 1024;
		gameBoard.spotLight.shadowMapHeight = 1024;
		gameBoard.scene.add( gameBoard.spotLight );
		
		// GROUND
//		materials.push( new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.SmoothShading } ) );
		
		var groundGeom = new THREE.PlaneGeometry( 768, 768 );
		gameBoard.ground = new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { ambient: 0x030303, color: 0x9d5602, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
		gameBoard.ground.material.ambient = gameBoard.ground.material.color;
		gameBoard.ground.name = "ground";
		gameBoard.ground.rotation.x = -90*Math.PI/180;
		gameBoard.ground.receiveShadow	 = true;
		gameBoard.ground.__dirtyPosition = true;
		gameBoard.scene.add( gameBoard.ground );
		
		for ( i = 0; i < 4; i++ )
		{
			var wallGeom = new THREE.PlaneGeometry( 768, 768/2 );
			var wall = new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { ambient: 0x030303, color: gameBoard.getRandomColor(), specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
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
			gameBoard.scene.add( wall );
		}

		var geometry = new THREE.CubeGeometry( gameBoard.CUBE_DIMENSIONS.w, gameBoard.CUBE_DIMENSIONS.h, gameBoard.CUBE_DIMENSIONS.d );
		for ( i = 0; i < gameBoard.initialObjects; i ++ ) {

			var floor 	= Math.floor(i/3);
			var line 	= Math.floor(i%3);
			color		= gameBoard.getRandomColor();

			material = new THREE.MeshPhongMaterial( { metal : true, ambient: 0x030303, color: color, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } );
				
			var object = new Physijs.BoxMesh( geometry, material );	
			object.material.ambient = object.material.color;
			object.originalColor = color;

			object.position.x = ( floor % 2 === 0 ) ? line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w * 1.5 ) : -gameBoard.CUBE_DIMENSIONS.w /2;
			object.position.y = gameBoard.CUBE_DIMENSIONS.h/2 + ( gameBoard.CUBE_DIMENSIONS.h*1*floor );
			object.position.z = ( floor % 2 === 0 ) ? 0 : line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w ) ;

			object.rotation.x = 0;
			object.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
			object.rotation.z = 0;

			object.castShadow 		= true;
			object.receiveShadow 	= true;
			object.__dirtyPosition 	= true;

			gameBoard.scene.add( object );
			
			if ( !gameBoard.objects[ floor ] )
				gameBoard.objects[ floor ] = [];
			
			gameBoard.objects[ floor ][line] = object;
		}

		gameBoard.stats = new Stats();
		gameBoard.stats.domElement.style.position = 'absolute';
		gameBoard.stats.domElement.style.top = '0px';
		container.appendChild( gameBoard.stats.domElement );
	
//		window.addEventListener( 'resize', gameBoard.onWindowResize, false );
	},
	
	reset : function() {
	
		gameBoard.stopAnimate();
		gameBoard.cameraControls.autoRotate= true;
		gameBoard.cameraControls.userZoom = gameBoard.cameraControls.userRotate = true;
		
		gameBoard.counter = 0;
		gameBoard.checkedPlace  = false;
		gameBoard.haveLost 		= false;
		gameBoard.checkedMove 	= false;
		
		var block, color;
		var floor, line, i, j;
		var simpleArray = [];	
		
		for ( i = 0; i < gameBoard.objects.length; i++ ) {
			for ( j = 0; j < 3; j++ ) {
				block = gameBoard.objects[i][j];
				
				if ( block && block != null )
				{
					simpleArray.push( block );
					gameBoard.scene.remove( block );
				}
			}
		}
		
		gameBoard.objects = [];
	
		for ( i = 0; i < gameBoard.initialObjects; i ++ ) {
		
				floor 	= Math.floor(i/3);
				line 	= Math.floor(i%3);
				color	= gameBoard.getRandomColor();

				block = simpleArray.pop();	
				block.material.color 	= new THREE.Color( color );
				block.material.ambient 	= block.material.color;
				block.originalColor 	= color;

				block.position.x = ( floor % 2 === 0 ) ? line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w * 1.5 ) : -gameBoard.CUBE_DIMENSIONS.w /2;
				block.position.y = gameBoard.CUBE_DIMENSIONS.h/2 + ( gameBoard.CUBE_DIMENSIONS.h*1*floor );
				block.position.z = ( floor % 2 === 0 ) ? 0 : line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w ) ;

				block.rotation.x = 0;
				block.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
				block.rotation.z = 0;
				
				block.__dirtyPosition = true;

				gameBoard.scene.add( block );
				
				if ( !gameBoard.objects[ floor ] )
					gameBoard.objects[ floor ] = [];
				
				gameBoard.objects[ floor ][line] = block;
		}
		
		gameBoard.scene.simulate( 1.5, 5 );
			
		setTimeout( gameBoard.animate, 500 );
	},

	onWindowResize : function() {

		gameBoard.camera.aspect = gameBoard.VIEWPORT_DIMENSIONS.w / gameBoard.VIEWPORT_DIMENSIONS.h;
		gameBoard.camera.updateProjectionMatrix();

		gameBoard.renderer.setSize( gameBoard.VIEWPORT_DIMENSIONS.w, gameBoard.VIEWPORT_DIMENSIONS.h );
	},

	stopAnimate : function() {
		window.cancelAnimationFrame( gameBoard.looper );
	},

	animate : function() {

		gameBoard.looper = requestAnimationFrame( gameBoard.animate );

		gameBoard.render();
		
		gameBoard.stats.update();
	},

	render : function() {
	
		if ( connections.data.state != PLAY_PLACE )
			gameBoard.scene.simulate( 1.5, 5 );
			
		gameBoard.handleState();
		
		gameBoard.checkLoose();

		gameBoard.cameraControls.update();
		gameBoard.spotLight.position.copy( gameBoard.camera.position );
		gameBoard.renderer.render( gameBoard.scene, gameBoard.camera );
	},

	handleSelection :function( direction ) {
		
		console.log("select:", machine.getActiveUserData().name );
		
		gameBoard.cameraControls.autoRotate= false;
		gameBoard.cameraControls.userZoom = gameBoard.cameraControls.userRotate = true;
		
		gameBoard.counter = 0;
		gameBoard.checkedPlace  = false;
		gameBoard.haveLost 		= false;
		gameBoard.checkedMove 	= false;
		
		switch( direction )
		{
			case 0 : gameBoard.actualSelection.floor++; break;	// up
			case 1 : gameBoard.actualSelection.line--; break;	// left
			case 2 : gameBoard.actualSelection.floor--; break;	// down
			case 3 : gameBoard.actualSelection.line++; break;	// right
		}
		
		if ( gameBoard.actualSelection.floor >= gameBoard.objects.length - 1 )
			gameBoard.actualSelection.floor = 0;
		else if (  gameBoard.actualSelection.floor < 0 )
			gameBoard.actualSelection.floor = gameBoard.objects.length - 2;
			
		var lineArray = gameBoard.objects[ gameBoard.actualSelection.floor ];	
		if ( gameBoard.actualSelection.line >= lineArray.length )
			gameBoard.actualSelection.line = 0;
		else if ( gameBoard.actualSelection.line < 0 )
			gameBoard.actualSelection.line = lineArray.length - 1;
		
		gameBoard.select(); 
	},
	
	select : function() {
		
		gameBoard.actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		gameBoard.makeTransparent();
	},

	handleMove: function( direction ){
		
		var vector = new THREE.Vector3;
		switch( direction )
		{
			case 0 : vector.z = -30; break;	// up
			case 1 : vector.x = -30; break;	// left
			case 2 : vector.z = 30; break;	// down
			case 3 : vector.x = 30; break;	// right
		}
		
		gameBoard.move( vector );
	},
		
	move : function( vector ) 
	{
//		gameBoard.actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		gameBoard.actualObject.setLinearVelocity( vector );
	}, 
	
	handlePlace : function( direction ){
	
//		gameBoard.actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		var lastLineArray 	= gameBoard.objects[ gameBoard.objects.length - 1 ];
		var floor 			= gameBoard.objects.length - 1;
		var freePlaces 		= [ 0, 1, 2 ];
		var line			= -1;
		
		for( var i = lastLineArray.length-1; i >= 0; i-- )
		{
			if ( lastLineArray[i] || lastLineArray[i] != null )
				freePlaces.splice(i,1);
		}
		
		if ( freePlaces.length === 0 && lastLineArray.indexOf(gameBoard.actualObject) < 0 )
			floor++;
		
		
		var selectedLine = gameBoard.actualSelection.line;
		if ( freePlaces.length > 0 )
		{
			switch( direction )
			{
				case 0 : selectedLine++; break;	// up
				case 1 : selectedLine--; break;	// left
				case 2 : selectedLine--; break;	// down
				case 3 : selectedLine++; break;	// right
			}
			
			
			for( var i = freePlaces.length-1; i >= 0; i-- )
			{
				if ( freePlaces[i] === selectedLine )
					line = freePlaces[i];
			}
			
			if ( line < 0 )
			{
				if ( direction === 1 || direction === 2 )
					line = freePlaces[freePlaces.length-1];
				else
					line = freePlaces[0];
			}
			
		} else if ( lastLineArray.indexOf(gameBoard.actualObject) < 0 ){
			line = 1;
		} else {
			return;
		}
		
		gameBoard.place( floor, line );
	}, 
		
	place : function( floor, line  ){
	
		var vector = new THREE.Vector3;
		vector.x = ( floor % 2 === 0 ) ? line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w * 1.5 ) : -gameBoard.CUBE_DIMENSIONS.w /2;
		vector.y = gameBoard.CUBE_DIMENSIONS.h/2 + ( gameBoard.CUBE_DIMENSIONS.h*1*floor );
		vector.z = ( floor % 2 === 0 ) ? 0 : line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w ) ;
		
//		gameBoard.actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		
		gameBoard.scene.remove( gameBoard.actualObject );
		gameBoard.actualObject.position.x = vector.x;
		gameBoard.actualObject.position.y = vector.y;
		gameBoard.actualObject.position.z = vector.z;
		
		gameBoard.actualObject.rotation.x = 0;
		gameBoard.actualObject.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
		gameBoard.actualObject.rotation.z = 0;
		
		gameBoard.actualObject.__dirtyRotation = true;
		gameBoard.actualObject.__dirtyPosition = true;
		
		gameBoard.objects[ gameBoard.actualSelection.floor ].splice( gameBoard.actualSelection.line, 1 );
		
		if ( floor >= gameBoard.objects.length )
			gameBoard.objects[floor] = [];
		
		gameBoard.objects[ floor ][ line ] = gameBoard.actualObject;
		gameBoard.actualSelection.floor = floor;
		gameBoard.actualSelection.line = line;
		
		gameBoard.scene.add( gameBoard.actualObject );
	},
	
	checkMove : function(){
	
		if( gameBoard.actualObject._physijs.touches.length === 0 )
		{
			if( gameBoard.actualObject._physijs.linearVelocity.x === 0 &&
				gameBoard.actualObject._physijs.linearVelocity.y === 0 &&
				gameBoard.actualObject._physijs.linearVelocity.z === 0 &&
				gameBoard.actualObject._physijs.angularVelocity.x === 0 &&
				gameBoard.actualObject._physijs.angularVelocity.y === 0 &&
				gameBoard.actualObject._physijs.angularVelocity.z === 0 )
			{
				gameBoard.checkedMove = true;
				connections.sendMessage('/moveOK');
			}
		}
	},
	
	checkPlace : function()
	{
		gameBoard.counter++;
		
		if( gameBoard.counter < 30 )
			return;
	
		var i, j;
		var floors = gameBoard.objects.length, lines;
		var object;
		var movingObjects = gameBoard.initialObjects;
		
		for ( i = 0; i < floors; i++ )
		{
			lines = gameBoard.objects[i].length;
		
			for ( j = 0; j < lines; j++ )
			{
				object = gameBoard.objects[i][j];
					
				if( object && object._physijs )
				{
					if( object._physijs.linearVelocity.x === 0 &&
						object._physijs.linearVelocity.y === 0 &&
						object._physijs.linearVelocity.z === 0 &&
						object._physijs.angularVelocity.x === 0 &&
						object._physijs.angularVelocity.y === 0 &&
						object._physijs.angularVelocity.z === 0 )
					{
						movingObjects--;
					}
				}
			}
		}
		
		if ( movingObjects === 0 )
			gameBoard.checkedPlace = true;
	},
	
	cleanAndStart : function(){
		
		gameBoard.counter = 0;
		gameBoard.checkedMove = gameBoard.checkedPlace = gameBoard.haveLost = false;
		gameBoard.actualSelection 	= { floor : 0, line : 0 };
		gameBoard.actualObject		= null;
		
		connections.sendMessage('/startGame');
	},
	
	checkLoose : function(){
		
		if( gameBoard.haveLost || connections.data.state < PLAY_MOVE || connections.data.state > CHECK_PLACE )
			return;
		
		if ( gameBoard.ground._physijs.touches.length > 4 )
		{
			gameBoard.cameraControls.autoRotate= true;
			gameBoard.cameraControls.userZoom = gameBoard.cameraControls.userRotate = false;
			
	//		gameBoard.makeOpaque();
			gameBoard.haveLost = true;
			connections.sendMessage('/loose');
		}
	}, 
	
	resetView: function(){
		
		gameBoard.camera.position.copy( new THREE.Vector3(50,180,200));

		gameBoard.cameraControls = new THREE.OrbitControls( gameBoard.camera, gameBoard.renderer.domElement );
		gameBoard.cameraControls.autoRotate= true;
		gameBoard.cameraControls.userPan = false;
		gameBoard.cameraControls.userRotate = gameBoard.cameraControls.userZoom = true;
		gameBoard.cameraControls.maxPolarAngle = Math.PI/2.5;
		gameBoard.cameraControls.maxDistance = 500;
		gameBoard.cameraControls.minDistance = 50;
		gameBoard.cameraControls.center.copy( new THREE.Vector3(0,50,0))
		gameBoard.cameraControls.zoomIn(1.5)
	}, 
	
	makeOpaque : function(){
		
		if( gameBoard.actualObject )
			gameBoard.actualObject.castShadow 	= true;
		
		for ( var i = 0; i < gameBoard.objects.length; i++ )
		{
			for (var j = 0; j < gameBoard.objects[i].length; j++ )
			{
				if ( gameBoard.objects[i][j] && gameBoard.objects[i][j] != gameBoard.actualObject )
				{
					gameBoard.objects[i][j].material.setValues( { color : gameBoard.objects[i][j].originalColor } );
					gameBoard.objects[i][j].material.transparent = false;
					gameBoard.objects[i][j].material.opacity = 1;
					gameBoard.objects[i][j].castShadow 		= true;
					gameBoard.objects[i][j].receiveShadow 	= true;
				}
			}
		}
	}, 
	
	makeTransparent : function(){
	
		if( gameBoard.actualObject )
		{
			gameBoard.actualObject.material.setValues( { color : machine.getActiveUserData().color } );
			gameBoard.actualObject.material.transparent = false;
			gameBoard.actualObject.material.opacity 	= 1;
			gameBoard.actualObject.castShadow 			= false;
			gameBoard.actualObject.receiveShadow 		= true;
		}
		
		for ( var i = 0; i < gameBoard.objects.length; i++ )
		{
			for (var j = 0; j < gameBoard.objects[i].length; j++ )
			{
				if ( gameBoard.objects[i][j] && gameBoard.objects[i][j] != gameBoard.actualObject )
				{
					gameBoard.objects[i][j].material.setValues( { color : COLOR_GRAY } );
					gameBoard.objects[i][j].material.transparent = true;
					gameBoard.objects[i][j].material.opacity = .5;
					gameBoard.objects[i][j].castShadow 		= false;
					gameBoard.objects[i][j].receiveShadow 	= false;
				}
			}
		}
	}, 
	
	getRandomColor : function(){
		return Math.random() * 0xAAAAAA;
	},
	
	handleState : function(){
		
		if( gameBoard.haveLost )
			return;
		
		if( connections.data.state == PLAY_MOVE && !gameBoard.checkedMove )
			gameBoard.checkMove();
		
		if ( connections.data.state == CHECK_PLACE && gameBoard.checkedMove  )
		{
			if( !gameBoard.checkedPlace )
				gameBoard.checkPlace();
			else 
			{
				console.log( "CHECKEDPLACE to start:"+gameBoard.checkedPlace )
				gameBoard.cleanAndStart();
			}
		}
	}
})

var gameBoard = new GameBoardClass();
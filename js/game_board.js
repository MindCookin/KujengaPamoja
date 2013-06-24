GameBoardClass = Class.extend({	

	CUBE_DIMENSIONS : { w : 25, h : 15, d : 75 },
	VIEWPORT_DIMENSIONS : { w : 0, h : 0 },

	stats		: null,
	
	camera		: null, 
	cameraControls: null, 
	scene		: null,
	renderer	: null,
	
	checkedMove	: false,
	haveLost	: false,
	
	actualSelection : { floor : 0, line : 0 },
	
	objects 	: [],
	ground 			: null,
	actualObject 	: null,

	start : function() {
	
		Physijs.scripts.worker 	= 'js/libs/physijs_worker.js';
		Physijs.scripts.ammo 	= 'ammo.js';

		var i;
		var container = document.getElementById( 'game_wrapper' );
		
		gameBoard.VIEWPORT_DIMENSIONS = { w : $('#game_wrapper').width(), h : $('#game_wrapper').height() };
		
		gameBoard.renderer = new THREE.WebGLRenderer( { antialias: true } );
		gameBoard.renderer.sortObjects = false;
		gameBoard.renderer.setSize( gameBoard.VIEWPORT_DIMENSIONS.w, gameBoard.VIEWPORT_DIMENSIONS.h );

		gameBoard.renderer.shadowMapEnabled = true;
		gameBoard.renderer.shadowMapType = THREE.PCFShadowMap;

		container.appendChild( gameBoard.renderer.domElement );

		gameBoard.camera = new THREE.PerspectiveCamera( 50, gameBoard.VIEWPORT_DIMENSIONS.w / gameBoard.VIEWPORT_DIMENSIONS.h, 1, 10000 );
		gameBoard.camera.position.z = 250;
		gameBoard.camera.position.y = 170;
		gameBoard.camera.position.x = 120;

		gameBoard.cameraControls = new THREE.OrbitControls( gameBoard.camera, gameBoard.renderer.domElement );
//		gameBoard.cameraControls.autoRotate= true
		gameBoard.cameraControls.maxPolarAngle = Math.PI/2.5;
		gameBoard.cameraControls.maxDistance = 500;
		gameBoard.cameraControls.minDistance = 50;

		gameBoard.scene = new Physijs.Scene();

		gameBoard.scene.add( new THREE.AmbientLight( 0x333333 ) );

		directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
		directionalLight.position.copy( gameBoard.camera.position );
		directionalLight.castShadow = true;

		directionalLight.shadowCameraNear = 200;
		directionalLight.shadowCameraFar = gameBoard.camera.far;
		directionalLight.shadowCameraFov = 50;

		directionalLight.shadowBias = -0.00022;
		directionalLight.shadowDarkness = 0.5;

		directionalLight.shadowMapWidth = 1024;
		directionalLight.shadowMapHeight = 1024;

		gameBoard.scene.add( directionalLight );
		
		var groundGeom = new THREE.PlaneGeometry( 768, 768 );
		gameBoard.ground = new Physijs.BoxMesh( groundGeom, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
		gameBoard.ground.name = "ground";
		gameBoard.ground.rotation.x = -90*Math.PI/180;
		gameBoard.ground.receiveShadow = true;
		gameBoard.ground.__dirtyPosition = true;
		gameBoard.scene.add( gameBoard.ground );
		
		for ( i = 0; i < 4; i++ )
		{
			var wallGeom = new THREE.PlaneGeometry( 768, 768/2 );
			var wall = new Physijs.BoxMesh( groundGeom, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
			wall.position.y = 768/2;
			
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
		for ( i = 0; i < 19; i ++ ) {

			var floor 	= Math.floor(i/3);
			var line 	= Math.floor(i%3);

			var material = Physijs.createMaterial(
				new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }),
				.6, // medium friction
				.3 // low restitution
			);
			
			//material =  new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } );
				
			var object = new Physijs.BoxMesh( geometry, material );	
			object.material.ambient = object.material.color;
			object.originalColor = object.material.color;
			object.collisions = 0;	// important for collision handling

			object.position.x = ( floor % 2 === 0 ) ? line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w * 1.5 ) : -gameBoard.CUBE_DIMENSIONS.w /2;
			object.position.y = gameBoard.CUBE_DIMENSIONS.h/2 + ( gameBoard.CUBE_DIMENSIONS.h*1*floor );
			object.position.z = ( floor % 2 === 0 ) ? 0 : line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w ) ;

			object.rotation.x = 0;
			object.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
			object.rotation.z = 0;

			object.castShadow = true;
			object.receiveShadow = true;
			object.__dirtyPosition = true;

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
	
		var block;
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
	
		for ( i = 0; i < 19; i ++ ) {
		
				floor 	= Math.floor(i/3);
				line 	= Math.floor(i%3);

				block = simpleArray.pop();	
				block.material.color 	= new THREE.Color( Math.random() * 0xffffff );
				block.material.ambient 	= block.material.color;
				block.originalColor 	= block.material.color;

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
	},

	onWindowResize : function() {

		gameBoard.camera.aspect = gameBoard.VIEWPORT_DIMENSIONS.w / gameBoard.VIEWPORT_DIMENSIONS.h;
		gameBoard.camera.updateProjectionMatrix();

		gameBoard.renderer.setSize( gameBoard.VIEWPORT_DIMENSIONS.w, gameBoard.VIEWPORT_DIMENSIONS.h );
	},

	animate : function() {

		requestAnimationFrame( gameBoard.animate );

		gameBoard.render();
		
		gameBoard.stats.update();
	},

	render : function() {
		
		directionalLight.position.copy( gameBoard.camera.position );
		
		if ( connections.data.state != PLAY_PLACE )
			gameBoard.scene.simulate( 1.5, 5 );
			
		if( gameBoard.ground._physijs.touches.length > 4 && !gameBoard.haveLost )
			gameBoard.loose();
		
		if( connections.data.state == PLAY_MOVE && !gameBoard.checkedMove && !gameBoard.haveLost )
			gameBoard.checkMove();

		gameBoard.cameraControls.update();
	
		gameBoard.renderer.render( gameBoard.scene, gameBoard.camera );
	},

	handleSelection :function( direction ) {
		
		gameBoard.checkedMove = false;
		
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
		gameBoard.actualObject.material.transparent 	= false;
		gameBoard.actualObject.material.opacity 		= 1;
		gameBoard.actualObject.castShadow 	= true;
		gameBoard.actualObject.receiveShadow 	= true;

		for ( var i = 0; i < gameBoard.objects.length; i++ )
		{
			for (var j = 0; j < gameBoard.objects[i].length; j++ )
			{
				if ( gameBoard.objects[i][j] && gameBoard.objects[i][j] !=  gameBoard.actualObject )
				{
					gameBoard.objects[i][j].material.transparent = true;
					gameBoard.objects[i][j].material.opacity = .3;
					gameBoard.objects[i][j].castShadow 		= false;
					gameBoard.objects[i][j].receiveShadow 	= false;
				}
			}
		}
	},

	handleMove: function( direction ){
		
		var vector = new THREE.Vector3;
		switch( direction )
		{
			case 0 : vector.z = -40; break;	// up
			case 1 : vector.x = -40; break;	// left
			case 2 : vector.z = 40; break;	// down
			case 3 : vector.x = 40; break;	// right
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
				console.log( "MOVE OK!!!!!!!!")
				
				gameBoard.checkedMove = true;
				connections.sendMessage('/moveOK');
			}
		}
	}, 
	
	clean : function(){
		gameBoard.actualSelection 	= { floor : 0, line : 0 };
		gameBoard.actualObject		= null;
		gameBoard.select();
	},
	
	loose : function(){
		console.log( "TOUCHES::", gameBoard.ground._physijs.touches.length );
		gameBoard.haveLost = true;
		connections.sendMessage('/loose');
	}
})

var gameBoard = new GameBoardClass();
GameBoardClass = Class.extend({	

	CUBE_DIMENSIONS : { w : 25, h : 15, d : 75 },
	VIEWPORT_DIMENSIONS : { w : 900, h : 700 },

	stats		: null, 
	physics_stats:null,
	
	camera		: null, 
	controls	: null, 
	scene		: null,
	renderer	: null,
	
	objects 	: [],
	actualSelection : { floor : 0, line : 0 },

	start : function() {
	
		Physijs.scripts.worker 	= 'js/libs/physijs_worker.js';
		Physijs.scripts.ammo 	= 'ammo.js';

		var container = document.getElementById( 'game_wrapper' );
		
//		document.body.appendChild( container );

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
		gameBoard.camera.lookAt( new THREE.Vector3( 0, 200, 0 ) );

		gameBoard.controls = new THREE.TrackballControls( gameBoard.camera );
		gameBoard.controls.enabled = false;
		gameBoard.controls.rotateSpeed = 1.0;
		gameBoard.controls.zoomSpeed = 1.2;
		gameBoard.controls.panSpeed = 0.8;
		gameBoard.controls.noZoom = false;
		gameBoard.controls.noPan = false;
		gameBoard.controls.staticMoving = true;
		gameBoard.controls.dynamicDampingFactor = 0.3;

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
		var ground = new Physijs.BoxMesh( groundGeom, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
		
		ground.rotation.x = -90*Math.PI/180;
		ground.receiveShadow = true;
		ground.__dirtyPosition = true;
		
		gameBoard.scene.add( ground );

		var geometry = new THREE.CubeGeometry( gameBoard.CUBE_DIMENSIONS.w, gameBoard.CUBE_DIMENSIONS.h, gameBoard.CUBE_DIMENSIONS.d );

		for ( var i = 0; i < 19; i ++ ) {

			var floor 	= Math.floor(i/3);
			var line 	= Math.floor(i%3);

			var object = new Physijs.BoxMesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );	
			object.material.ambient = object.material.color;

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

		var info = document.createElement( 'div' );
		info.style.position = 'absolute';
		info.style.top = '10px';
		info.style.width = '100%';
		info.style.textAlign = 'center';
		info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js</a> webgl - draggable cubes';
		container.appendChild( info );

		gameBoard.stats = new Stats();
		gameBoard.stats.domElement.style.position = 'absolute';
		gameBoard.stats.domElement.style.top = '0px';
		container.appendChild( gameBoard.stats.domElement );

		gameBoard.physics_stats = new Stats();
		gameBoard.physics_stats.domElement.style.position = 'absolute';
		gameBoard.physics_stats.domElement.style.top = '50px';
		gameBoard.physics_stats.domElement.style.zIndex = 99;
		container.appendChild( gameBoard.physics_stats.domElement );
	
//		window.addEventListener( 'resize', gameBoard.onWindowResize, false );

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
		gameBoard.physics_stats.update();
	},

	render : function() {
		
		directionalLight.position.copy( gameBoard.camera.position );
		
		gameBoard.controls.update();
		
		if ( connections.data.state != PLAY_PLACE )
			gameBoard.scene.simulate( 1.5, 5 );

		gameBoard.renderer.render( gameBoard.scene, gameBoard.camera );
	},

	handleSelection :function( direction ) {
		
		switch( direction )
		{
			case 0 : gameBoard.actualSelection.floor++; break;	// up
			case 1 : gameBoard.actualSelection.line--; break;	// left
			case 2 : gameBoard.actualSelection.floor--; break;	// down
			case 3 : gameBoard.actualSelection.line++; break;	// right
		}
		
		if ( gameBoard.actualSelection.floor >= gameBoard.objects.length )
			gameBoard.actualSelection.floor = 0;
		else if (  gameBoard.actualSelection.floor < 0 )
			gameBoard.actualSelection.floor = gameBoard.objects.length - 1;
			
		var lineArray = gameBoard.objects[ gameBoard.actualSelection.floor ];	
		if ( gameBoard.actualSelection.line >= lineArray.length )
			gameBoard.actualSelection.line = 0;
		else if ( gameBoard.actualSelection.line < 0 )
			gameBoard.actualSelection.line = lineArray.length - 1;
		
		gameBoard.select(); 
	},
	
	select : function() {
		
		var actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		actualObject.material.transparent 	= false;
		actualObject.material.opacity 		= 1;
		actualObject.castShadow 	= true;
		actualObject.receiveShadow 	= true;

		for ( var i = 0; i < gameBoard.objects.length; i++ )
		{
			for (var j = 0; j < gameBoard.objects[i].length; j++ )
			{
				if ( gameBoard.objects[i][j] !=  actualObject )
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
		var actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		actualObject.setLinearVelocity( vector );
	}, 
	
	handlePlace : function( direction ){
	
		var actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		var lastLineArray 	= gameBoard.objects[ gameBoard.objects.length - 1 ];
		var floor 			= gameBoard.objects.length - 1;
		var freePlaces 		= [ 0, 1, 2 ];
		var line			= -1;
		
		for( var i = lastLineArray.length-1; i >= 0; i-- )
		{
			if ( lastLineArray[i] || lastLineArray[i] != null )
				freePlaces.splice(i,1);
		}
		
		if ( freePlaces.length === 0 && lastLineArray.indexOf(actualObject) < 0 )
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
			
		} else if ( lastLineArray.indexOf(actualObject) < 0 ){
			line = 1;
		} else {
			line = lastLineArray.indexOf(actualObject);
		}
		
		gameBoard.place( floor, line );
	}, 
		
	place : function( floor, line  ){
	
		var vector = new THREE.Vector3;
		vector.x = ( floor % 2 === 0 ) ? line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w * 1.5 ) : -gameBoard.CUBE_DIMENSIONS.w /2;
		vector.y = gameBoard.CUBE_DIMENSIONS.h/2 + ( gameBoard.CUBE_DIMENSIONS.h*1*floor );
		vector.z = ( floor % 2 === 0 ) ? 0 : line * gameBoard.CUBE_DIMENSIONS.w - ( gameBoard.CUBE_DIMENSIONS.w ) ;
		
		var actualObject = gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ];
		
		gameBoard.scene.remove( actualObject );
		actualObject.position.x = vector.x;
		actualObject.position.y = vector.y;
		actualObject.position.z = vector.z;
		
		actualObject.rotation.x = 0;
		actualObject.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
		actualObject.rotation.z = 0;
		
		actualObject.__dirtyRotation = true;
		actualObject.__dirtyPosition = true;
		
		
		gameBoard.objects[ gameBoard.actualSelection.floor ][ gameBoard.actualSelection.line ] = null;
		
		if ( floor >= gameBoard.objects.length )
			gameBoard.objects[floor] = [];
		
		gameBoard.objects[ floor ][ line ] = actualObject;
		gameBoard.actualSelection.floor = floor;
		gameBoard.actualSelection.line = line;
		
		gameBoard.scene.add( actualObject );
	}  
})

var gameBoard = new GameBoardClass();
GameBoardClass = Class.extend({	

	counter		: 0,
	checkedPlace: false,
	checkedMove	: false,
	haveLost	: false,

	looper : null,
	
	center : new THREE.Vector3( 0,0,0 ),
	
	start : function() {
		
		gameScene.start()
		
//		window.addEventListener( 'resize', gameBoard.onWindowResize, false );
	},
	
	reset : function() {
	
		gameBoard.stopAnimate();
		
		gameScene.reset();
	
		gameBoard.counter = 0;
		gameBoard.checkedPlace  = false;
		gameBoard.haveLost 		= false;
		gameBoard.checkedMove 	= false;
			
		setTimeout( gameBoard.animate, 500 );
	},

	onWindowResize : function() {

		gameScene.resize();
	},

	stopAnimate : function() {
		window.cancelAnimationFrame( gameBoard.looper );
	},

	animate : function() {

		gameBoard.looper = requestAnimationFrame( gameBoard.animate );

		gameBoard.handleState();
		gameBoard.checkLoose();
		
		gameScene.render();
	},

	handleSelection : function( direction ) {
		
		gameScene.cameraControls.autoRotate= false;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = true;
		
		gameBoard.counter = 0;
		gameBoard.checkedPlace  = false;
		gameBoard.haveLost 		= false;
		gameBoard.checkedMove 	= false;
		
		switch( direction )
		{
			case 0 : gameScene.actualSelection.floor++; break;	// up
			case 1 : gameScene.actualSelection.line--; break;	// left
			case 2 : gameScene.actualSelection.floor--; break;	// down
			case 3 : gameScene.actualSelection.line++; break;	// right
		}
		
		if ( gameScene.actualSelection.floor >= gameScene.objects.length - 1 )
			gameScene.actualSelection.floor = 0;
		else if (  gameScene.actualSelection.floor < 0 )
			gameScene.actualSelection.floor = gameScene.objects.length - 2;
			
		var lineArray = gameScene.objects[ gameScene.actualSelection.floor ];	
		if ( gameScene.actualSelection.line >= lineArray.length )
			gameScene.actualSelection.line = 0;
		else if ( gameScene.actualSelection.line < 0 )
			gameScene.actualSelection.line = lineArray.length - 1;
		
		gameScene.select(); 
	},

	handleMove: function( direction ){
		
		if( gameBoard.checkedMove )
			return;
		
		var vector = new THREE.Vector3;
		switch( direction )
		{
			case 0 : vector.z = -30; break;	// up
			case 1 : vector.x = -30; break;	// left
			case 2 : vector.z = 30; break;	// down
			case 3 : vector.x = 30; break;	// right
		}
		
		gameScene.move( vector );
	}, 
	
	handlePlace : function( direction ){
	
		
		if( gameBoard.checkedPlace )
			return;
	
		if ( direction >= 0 && direction <= 3 )
		{	
			var vector = new THREE.Vector3;
			switch( direction )
			{
				case 0 : vector.z = -gameScene.CUBE_DIMENSIONS.w; break;	// up
				case 1 : vector.x = -gameScene.CUBE_DIMENSIONS.w; break;	// left
				case 2 : vector.z = gameScene.CUBE_DIMENSIONS.w; break;	// down
				case 3 : vector.x = gameScene.CUBE_DIMENSIONS.w; break;	// right
			}
			
			gameScene.place( vector );
		} else {
			gameScene.actualObject.setAngularFactor( new THREE.Vector3(1,1,1) );
			gameScene.actualObject.setLinearFactor( new THREE.Vector3(1,1,1) );
			gameScene.actualObject.setAngularVelocity( new THREE.Vector3(0,0,0) );
			gameScene.actualObject.setLinearVelocity( new THREE.Vector3(0,0,0) );
			gameScene.actualObject.__dirtyPosition = false;
			gameScene.actualObject.__dirtyRotation = false;
		}
	}, 
	
	checkMove : function(){
	
		gameBoard.center.setY( gameScene.actualObject.position.y );
		var distance 	= gameScene.actualObject.position.distanceTo( gameBoard.center )
		
		if (( gameScene.actualObject.rotation.y > 1 && distance > gameScene.CUBE_DIMENSIONS.d + 1 ) ||
			( gameScene.actualObject.rotation.y < 1 && distance > gameScene.CUBE_DIMENSIONS.w * 2.5 ) 
			)
		{
			gameBoard.checkedMove = true;
			gameBoard.placeBlockOnTop();
//			connections.sendMessage('/moveOK');
		}
	},
	
	checkPlace : function()
	{
		if( gameBoard.counter == 0 )
		{
			TweenMax.killTweensOf( gameScene.actualObject.position );
			gameScene.scene.setGravity( new THREE.Vector3( 0, -10, 0 ) );
		}
		
		gameBoard.counter++;
		
		if( gameBoard.counter < 30 )
			return;
	
		var i, j;
		var floors = gameScene.objects.length, lines;
		var object;
		var movingObjects = gameScene.initialObjects;
		
		for ( i = 0; i < floors; i++ )
		{
			lines = gameScene.objects[i].length;
		
			for ( j = 0; j < lines; j++ )
			{
				object = gameScene.objects[i][j];
					
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
	
	checkLoose : function(){
		
		if( gameBoard.haveLost || connections.data.state < PLAY_MOVE || connections.data.state > CHECK_PLACE )
			return;
		
		var i, j;
		var floors = gameScene.objects.length, lines;
		var object;
		var distance;

		for ( i = 0; i < floors; i++ )
		{
			lines = gameScene.objects[i].length;
		
			for ( j = 0; j < lines; j++ )
			{
				object = gameScene.objects[i][j];
					
				if( !gameBoard.haveLost && object && object._physijs && object != gameScene.actualObject )
				{
					gameBoard.center.setY( object.position.y );
					distance = object.position.distanceTo( gameBoard.center );
				
					if (( object.rotation.y > 1 && distance > gameScene.CUBE_DIMENSIONS.d ) ||
						( object.rotation.y < 1 && distance > gameScene.CUBE_DIMENSIONS.w * 2.5 ) 
						)
					{
						gameScene.cameraControls.autoRotate= true;
						gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = false;
						
						gameBoard.haveLost = true;
						connections.sendMessage('/loose');
						return;
					}
				}
			}
		}
	}, 
	
	cleanAndStart : function(){
		
		gameBoard.counter = 0;
		gameBoard.checkedMove = gameBoard.checkedPlace = gameBoard.haveLost = false;
		
		gameScene.actualSelection 	= { floor : 0, line : 0 };
		gameScene.actualObject		= null;
		
		connections.sendMessage('/startGame');
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
				gameBoard.cleanAndStart();
			}
		}
	}, 
	
	placeBlockOnTop : function()
	{
		var lastLine 	= gameScene.objects[gameScene.objects.length-1];
	
		gameScene.objects[ gameScene.actualSelection.floor ].splice( gameScene.actualSelection.line, 1 );
			
		// if lastLine is full qe add a new floor
		if ( lastLine.length >= 3 )
			gameScene.objects.push([]);
		
		// and add the actualObject to our new floor
		gameScene.objects[gameScene.objects.length-1].push( gameScene.actualObject );
		
		// set Actual selection
		gameScene.actualSelection.floor = gameScene.objects.length-1;
		gameScene.actualSelection.line 	= gameScene.objects[gameScene.objects.length-1].length-1;
		
		var floor 	= gameScene.objects.length + 1;
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

		gameScene.actualObject.position.copy( targetPosition );
		gameScene.actualObject.rotation.copy( targetRotation );
		gameScene.actualObject.__dirtyPosition = true;
		gameScene.actualObject.__dirtyRotation = true;
		
		connections.sendMessage('/moveOK');
	}
})

var gameBoard = new GameBoardClass();
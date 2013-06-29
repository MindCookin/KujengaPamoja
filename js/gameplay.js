GamePlayClass = Class.extend({	

	counter		: 0,
	
	checkedPlace: false,
	checkedMove	: false,
	haveLost	: false,

	looper : null,
	
	center : new THREE.Vector3( 0,0,0 ),
	
	start : function() { 
		gameScene.start()
	},
	
	reset : function() {
	
		gamePlay.stopAnimate();
		
		gameScene.reset();
	
		gamePlay.counter 		= 0;
		gamePlay.checkedPlace  	= false;
		gamePlay.haveLost 		= false;
		gamePlay.checkedMove 	= false;
			
		setTimeout( gamePlay.animate, 500 );
	},

	onWindowResize : function() {
		gameScene.resize();
	},

	stopAnimate : function() {
		window.cancelAnimationFrame( gamePlay.looper );
	},

	animate : function() {

		gamePlay.looper = requestAnimationFrame( gamePlay.animate );

		gamePlay.checkState();
		gamePlay.checkLose();
		
		gameScene.render();
	},
	
	startGame : function(){
		
		gameScene.cameraControls.autoRotate= false;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = true;
		
		gamePlay.counter 		= 0;
		gamePlay.checkedPlace  	= false;
		gamePlay.haveLost 		= false;
		gamePlay.checkedMove 	= false;
		
		gameScene.startGame();
	},

	handleSelection : function() {
		
		var direction = connections.data.press;
		
		switch( direction )
		{
			case 0 : gameScene.actualSelection.floor++; break;	// up
			case 1 : gameScene.actualSelection.line--; break;	// left
			case 2 : gameScene.actualSelection.floor--; break;	// down
			case 3 : gameScene.actualSelection.line++; break;	// right
		}
		
		if ( gameScene.actualSelection.floor >= gameScene.blocksGrid.length - 1 )
			gameScene.actualSelection.floor = 0;
		else if (  gameScene.actualSelection.floor < 0 )
			gameScene.actualSelection.floor = gameScene.blocksGrid.length - 2;
			
		var lineArray = gameScene.blocksGrid[ gameScene.actualSelection.floor ];	
		if ( gameScene.actualSelection.line >= lineArray.length )
			gameScene.actualSelection.line = 0;
		else if ( gameScene.actualSelection.line < 0 )
			gameScene.actualSelection.line = lineArray.length - 1;
		
		gameScene.showUpDown();
		gameScene.select(); 
	},

	handleMove: function(){
		
		var direction = connections.data.press;
		
		if( gamePlay.checkedMove )
			return;
		
		gameScene.showFrontBack();
		
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
	
	handlePlace : function(){
	
		var direction 	= connections.data.press;
		var accuracy	= connections.data.accuracy;
		
		if( gamePlay.checkedPlace )
			return;
	
		if ( direction >= 0 && direction <= 3 )
		{	
			var vector = new THREE.Vector3;
			switch( direction )
			{
				case 0 : vector.z = ( accuracy ) ? - 5 	: -gameScene.CUBE_DIMENSIONS.w -1; break;	// up
				case 1 : vector.x = ( accuracy ) ? - 5 	: -gameScene.CUBE_DIMENSIONS.w - 1; break;	// left
				case 2 : vector.z = ( accuracy ) ? 5 	: gameScene.CUBE_DIMENSIONS.w + 1; break;	// down
				case 3 : vector.x = ( accuracy ) ? 5 	: gameScene.CUBE_DIMENSIONS.w + 1; break;	// right
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
	
		gamePlay.center.setY( gameScene.actualObject.position.y );
		var distance 	= gameScene.actualObject.position.distanceTo( gamePlay.center )
		
		if (( gameScene.actualObject.rotation.y > 1 && distance > gameScene.CUBE_DIMENSIONS.d + 1 ) ||
			( gameScene.actualObject.rotation.y < 1 && distance > gameScene.CUBE_DIMENSIONS.w * 2.5 ) 
			)
		{
			gamePlay.checkedMove = true;
			gameScene.placeBlockOnTop();
		}
	},
	
	checkPlace : function()
	{
		if( gamePlay.counter == 0 )
		{
			TweenMax.killTweensOf( gameScene.actualObject.position );
			gameScene.scene.setGravity( new THREE.Vector3( 0, -10, 0 ) );
		}
		
		gamePlay.counter++;
		
		if( gamePlay.counter < 30 )
			return;
	
		var i, j;
		var floors = gameScene.blocksGrid.length, lines;
		var object;
		var movingObjects = gameScene.initialObjects;
		
		for ( i = 0; i < floors; i++ )
		{
			lines = gameScene.blocksGrid[i].length;
		
			for ( j = 0; j < lines; j++ )
			{
				object = gameScene.blocksGrid[i][j];
					
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
		{
			if( gameScene.actualSelection.line > 0 &&
				(gameScene.blocksGrid[ gameScene.actualSelection.floor][0].position.y < gameScene.actualObject.position.y - 5)
				)
			{
				gamePlay.lose();
				return;
			}
		
			gamePlay.checkedPlace = true;
		}
	},
	
	checkLose : function(){
		
		if( gamePlay.haveLost || connections.data.state < PLAY_MOVE || connections.data.state > CHECK_PLACE )
			return;
		
		var i, j;
		var floors = gameScene.blocksGrid.length, lines;
		var object;
		var distance;

		for ( i = 0; i < floors; i++ )
		{
			lines = gameScene.blocksGrid[i].length;
		
			for ( j = 0; j < lines; j++ )
			{
				object = gameScene.blocksGrid[i][j];
					
				if( !gamePlay.haveLost && object && object._physijs )
				{
					if( object == gameScene.actualObject && connections.data.state < CHECK_PLACE )
						continue;
				
					gamePlay.center.setY( object.position.y );
					distance = object.position.distanceTo( gamePlay.center );
				
					if (( object.rotation.y > 1 && distance > gameScene.CUBE_DIMENSIONS.d ) ||
						( object.rotation.y < 1 && distance > gameScene.CUBE_DIMENSIONS.w * 2.5 ) 
						)
					{
						gamePlay.lose();
						return;
					}
				}
			}
		}
	}, 
	
	lose : function(){
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = false;
		
		gamePlay.haveLost = true;
		connections.sendMessage('/lose');
	},
	
	restart : function(){
		
		gamePlay.counter = 0;
		gamePlay.checkedMove = gamePlay.checkedPlace = gamePlay.haveLost = false;
		
		gameScene.actualSelection 	= { floor : 0, line : 0 };
		gameScene.actualObject		= null;
		
		connections.sendMessage('/startGame');
	},
	
	checkState : function(){
		
		if( gamePlay.haveLost )
			return;
		
		if( connections.data.state == PLAY_MOVE && !gamePlay.checkedMove )
			gamePlay.checkMove();
		
		if ( connections.data.state == CHECK_PLACE && gamePlay.checkedMove  )
		{
			if( !gamePlay.checkedPlace )
				gamePlay.checkPlace();
			else 
				gamePlay.restart();
		}
	}
})

var gamePlay = new GamePlayClass();
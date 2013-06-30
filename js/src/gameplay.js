/*********************************************
 
  This class is responsible for checking all 
  gameplay features and act in consecuence, 
  normally updating GameScene
  
 ************************************************/

GamePlayClass = Class.extend({	
	
	// a counter for stability checking
	counter		: 0,
	
	// some flags to notify the gameplay state
	checkedPlace: false,
	checkedMove	: false,
	haveLost	: false,

	// a reference to the requestAnimationFrame loop
	looper : null,
	
	// the center of the stage reference, 
	// useful to not create every time a new empty vector
	// on checkMove or checkLose
	center : new THREE.Vector3( 0,0,0 ),
	
	/**
	 * initializes gameplay, just start gameScene
	 */	
	start : function() { 
		gameScene.start()
	},
	
	/**
	 * called when a new game is created 
	 */	
	reset : function() {
	
		// stop animation to reset our scene
		gamePlay.stopAnimate();
		
		// reset our scene
		gameScene.reset();
	
		// reset flags and counters
		gamePlay.counter 		= 0;
		gamePlay.checkedPlace  	= false;
		gamePlay.haveLost 		= false;
		gamePlay.checkedMove 	= false;
			
		// wait for gameScene to reset and continue with animations
		// setTimeout prevents some strange behaviours on physics
		setTimeout( gamePlay.animate, 500 );
	},

	/**
	 * resize handler
	 */	
	onWindowResize : function() {
		gameScene.resize();
	},

	/**
	 * stops animation frame
	 */	
	stopAnimate : function() {
		window.cancelAnimationFrame( gamePlay.looper );
	},

	/**
	 * handles requestAnimationFrame reference
	 * and all the game loop behaviours 
	 * ( game state, lose and rendering )
	 */	
	animate : function() {

		gamePlay.looper = requestAnimationFrame( gamePlay.animate );

		gamePlay.checkState();
		gamePlay.checkLose();
		
		gameScene.render();
	},
	
	/**
	 * starts a new game from scratch
	 */	
	startGame : function(){
		
		// reset flasg and counters, just in case...
		gamePlay.counter 		= 0;
		gamePlay.checkedPlace  	= false;
		gamePlay.haveLost 		= false;
		gamePlay.checkedMove 	= false;
		
		// starts the scene
		gameScene.startGame();
	},

	/**
	 * handles player's block selection
	 */	
	handleSelection : function() {
		
		// the direction is setted by the button the user press
		var direction = connections.data.press;
		
		// we change gameScene.actualSelection, an object 
		// that makes reference to our selected block floor and line 
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
		
		// set blue and yellow arrow position
		gameScene.showUpDown();
		
		// shows selection on gameScene
		gameScene.select(); 
	},

	/**
	 * handles player's move
	 */	
	handleMove: function(){
		
		// the direction is setted by the button the user press
		var direction = connections.data.press;
		
		// if the player has confirmed it's move, we return 
		// ( sometimes happens due to server/player lag)
		if( gamePlay.checkedMove )
			return;
		
		// we set a vector for the block impulse
		var vector = new THREE.Vector3;
		switch( direction )
		{
			case 0 : vector.z = -30; break;	// up
			case 1 : vector.x = -30; break;	// left
			case 2 : vector.z = 30; break;	// down
			case 3 : vector.x = 30; break;	// right
		}
		
		// show front and back arrows
		gameScene.showFrontBack();
		
		// move the block in the scene
		gameScene.move( vector );
	}, 
	
	/**
	 * handles player's place block on top of the tower
	 */	
	handlePlace : function(){
	
		// the direction is setted by the button the user press 
		var direction 	= connections.data.press;
		
		// we check if accuracy is ON
		var accuracy	= connections.data.accuracy;
		
		// if the player has confirmed it's place position, we return 
		// ( sometimes happens due to server/player lag)
		if( gamePlay.checkedPlace )
			return;
	
		// set a vector to move the block in a certain direction
		// the distance is reduced if accuracy is ON
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
		
			// if there is no direction, it means that OK button has been pressed.
			// it is time to add physics to the block
			gameScene.actualObject.setAngularFactor( new THREE.Vector3(1,1,1) );
			gameScene.actualObject.setLinearFactor( new THREE.Vector3(1,1,1) );
			gameScene.actualObject.setAngularVelocity( new THREE.Vector3(0,0,0) );
			gameScene.actualObject.setLinearVelocity( new THREE.Vector3(0,0,0) );
			gameScene.actualObject.__dirtyPosition = false;
			gameScene.actualObject.__dirtyRotation = false;
		}
	}, 
	
	/**
	 * checks if the move is enough to remove the block from the tower
	 */	
	checkMove : function(){
	
		// we need to check the distance of the block 
		// to the center of the tower
		
		// to do so, we set center vector Y to the player's selected 
		// block Y and check the distance from one to another
		gamePlay.center.setY( gameScene.actualObject.position.y );
		
		var distance 	= gameScene.actualObject.position.distanceTo( gamePlay.center )
		
		// if the distance is enough, we set checkedMove to true 
		// and place the block on top of our tower
		if (( gameScene.actualObject.rotation.y > 1 && distance > gameScene.CUBE_DIMENSIONS.d + 1 ) ||
			( gameScene.actualObject.rotation.y < 1 && distance > gameScene.CUBE_DIMENSIONS.w * 2.5 ) 
			)
		{
			gamePlay.checkedMove = true;
			gameScene.placeBlockOnTop();
		}
	},
	
	/**
	 * checks if we have placed our block in a correct position
	 * and if the tower maintains stable
	 */	
	checkPlace : function()
	{
		// if counter is 0 means it's time to set Physics
		// to the starting values
		if( gamePlay.counter == 0 )
		{
			// remove any Tween that our selected block have
			TweenMax.killTweensOf( gameScene.actualObject.position );
			
			// set gravity to the starting value
			gameScene.scene.setGravity( new THREE.Vector3( 0, -10, 0 ) );
		}
		
		// add one to counter 
		gamePlay.counter++;
		
		// we only check the blocks movements when counter 
		// is bigger than 30 ( after one second, aprox... )
		// we have to wait this time to check the tower stability
		if( gamePlay.counter < 30 )
			return;
	
		var i, j;
		var floors = gameScene.blocksGrid.length, lines;
		var object;
		var movingObjects = gameScene.initialObjects;
		
		// check linearVelocity and angularVelocity of all the blocks
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
		
		// if there are no moving objects we can check
		if ( movingObjects === 0 )
		{
			// checks if we have put the block in a higher floor that its target
			if( gameScene.actualSelection.line > 0 &&
				(gameScene.blocksGrid[ gameScene.actualSelection.floor][0].position.y < gameScene.actualObject.position.y - 5)
				)
			{
				gamePlay.lose();
				return;
			}
		
			// if not, we are done
			gamePlay.checkedPlace = true;
		}
	},
	
	/**
	 * check blocks positions and moves to check if we have lost
	 */	
	checkLose : function(){
		
		// if we have lost or the state is not the correct it has no sense to check lose
		if( gamePlay.haveLost || connections.data.state < PLAY_MOVE || connections.data.state > CHECK_PLACE )
			return;
		
		var i, j;
		var floors = gameScene.blocksGrid.length, lines;
		var object;
		var distance;

		// iterate through all our blocks
		for ( i = 0; i < floors; i++ )
		{
			lines = gameScene.blocksGrid[i].length;
		
			for ( j = 0; j < lines; j++ )
			{
				object = gameScene.blocksGrid[i][j];
					
				if( !gamePlay.haveLost && object && object._physijs )
				{
					// we only check our actualObject position if we are in check place State
					// in other case, we drop it from our test
					if( object == gameScene.actualObject && connections.data.state < CHECK_PLACE )
						continue;
				
					// we have to check the distance of the block to the center of the tower
					gamePlay.center.setY( object.position.y );
					distance = object.position.distanceTo( gamePlay.center );
				
					// if it is higher that the cube's dimension it means it is off the tower
					if (( object.rotation.y > 1 && distance > gameScene.CUBE_DIMENSIONS.d ) ||
						( object.rotation.y < 1 && distance > gameScene.CUBE_DIMENSIONS.w * 2.5 ) 
						)
					{
						// and we have lost :(
						gamePlay.lose();
						return;
					}
				}
			}
		}
	}, 
	
	/**
	 * The player loses
	 */	
	lose : function(){
		
		// set the camera to rotate automatically and remove user's controls
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = false;
		
		// set haveLost flag
		gamePlay.haveLost = true;
		
		// and notify the server of our lose
		connections.sendMessage('/lose');
	},
	
	/**
	 * Called when we press Play Again button
	 */	
	restart : function(){
		
		// we only need to reset some variables
		gamePlay.counter = 0;
		gamePlay.checkedMove = gamePlay.checkedPlace = gamePlay.haveLost = false;
		
		gameScene.actualSelection 	= { floor : 0, line : 0 };
		gameScene.actualObject		= null;
		
		// and notify the server to start the game
		connections.sendMessage('/startGame');
	},
	
	/**
	 * Called in each iteration, this function is responsible
	 * for calling the checkMove, checkPLace and restart methods
	 * when the state is the correct one
	 */	
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
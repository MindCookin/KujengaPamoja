/*********************************************
 
  This class is responsible for checking all 
  gameplay features and act in consecuence, 
  normally updating GameScene
  
 ************************************************/

GameSceneClass = Class.extend({	

	// Dimensions references
	CUBE_DIMENSIONS : { w : 25, h : 15, d : 75 },
	VIEWPORT_DIMENSIONS : { w : 0, h : 0 },
	GROUND_SIDE		: 400,

	// objects from the scene
	container	: null,
	camera		: null, 
	cameraControls: null, 
	scene		: null,
	renderer	: null,
	spotLight	: null,
	directionalLight : null,
	directionalLightContainer : null,
	pointLight	: null,
	stats		: null,
	arrows 		: null,
	ground 		: null,
	metalTexture: null,
	woodTexture	: null,
	plywoodTexture: null,
	baseObjectMaterial : null,
	
	// Dictionary to relate a color to a material, useful for block material
	dictColorsMaterials : {},
	
	// actual block selection floor and line
	actualSelection : { floor : 0, line : 0 },
	
	// helper that contains all arrows 
	arrowsChildren 	: [],
	
	// the blocks grid multidimensional array
	blocksGrid 		: [],
	
	// array containing all the blocks
	allBlocks		: [],
	
	// actual selected block reference
	actualObject	: null,
	
	// flag for physics checking
	checkSimulation : true,
	
	// quantity of initial blocks
	initialObjects : 20,

	/**
	 * start gameScene elements: THREE.js objects 
	 * ( scene, camera, viewport, ground, blocks, etc.. )
	 * Physijs physics engine and Stats
	 */
	start : function() {
	
		// variables definition
		var block, color, blockGeom; 
		var wall, wallGeom, wallParams;
		var arrow, arrowGeom, arrowParams;
		var materials = [];
		var hemisphereLight;
		var i;
		
		// DOM ELEMENT CONTAINER
		gameScene.container = document.getElementById( 'game_wrapper' );
		
		// RENDERER
		// check WebGLRenderer capabilities
		try {
			gameScene.renderer = new THREE.WebGLRenderer( { antialias: true, sortObjects : false, shadowMapEnabled : true, shadowMapType : THREE.PCFShadowMap } );
		} catch(error) {
			alert( "Three.js WebGLRenderer is not supported on your browser. Please open Kujenga Pamonga on Google Chrome to see the full experience.");
			return;
		}
		
		// 
		gameScene.renderer.sortObjects = false;						// we do not need to check sort on every loop
		gameScene.renderer.setSize( gameScene.VIEWPORT_DIMENSIONS.w, gameScene.VIEWPORT_DIMENSIONS.h );	// set dimensions
		gameScene.renderer.shadowMapEnabled = true;					// needed to cast shadows
		gameScene.renderer.shadowMapType 	= THREE.PCFShadowMap;
		gameScene.container.appendChild( gameScene.renderer.domElement );

		// CAMERA
		// a normal PerspectiveCamera
		gameScene.camera = new THREE.PerspectiveCamera( 50, gameScene.VIEWPORT_DIMENSIONS.w / gameScene.VIEWPORT_DIMENSIONS.h, 1, 10000 );	
		gameScene.camera.position.set( 150, 180, 200 );

		// CAMERA CONTROLS
		// helper for controlling the camera. 
		gameScene.resetView();
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userRotate = gameScene.cameraControls.userPan = gameScene.cameraControls.userZoom = false;

		// SCENE
		// a Physijs scene ( THREE scene + physics )
		gameScene.scene = new Physijs.Scene();
		
		// LIGHTS
		// global light
		hemisphereLight = new THREE.HemisphereLight( 0xFFFFFF, COLOR_YELLOW, .7 );
		hemisphereLight.name = "hemisphereLight";
		gameScene.scene.add( hemisphereLight );
		
		// directional light that cast a long shadow
		
		gameScene.directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
//		gameScene.directionalLight.position.copy( gameScene.camera.position );
		gameScene.directionalLight.position = new THREE.Vector3( 200, 75, 200 );
		gameScene.directionalLight.castShadow = true;
		gameScene.directionalLight.shadowCameraNear = 200;
		gameScene.directionalLight.shadowCameraFar = gameScene.camera.far;
		gameScene.directionalLight.shadowCameraFov = 50;
		gameScene.directionalLight.shadowBias = -0.00000001;
		gameScene.directionalLight.shadowDarkness = 0.3;
		gameScene.directionalLight.shadowMapWidth = 2048;
		gameScene.directionalLight.shadowMapHeight = 2048;
		
		gameScene.directionalLightContainer = new THREE.Object3D();
		
		gameScene.directionalLightContainer.add( gameScene.directionalLight );
		gameScene.scene.add( gameScene.directionalLightContainer );
		
		// spotlight attached to the camera
		gameScene.spotLight = new THREE.SpotLight( 0xddddff, 1.2 );
		gameScene.scene.add( gameScene.spotLight );
		
		// TEXTURE
		// load metalTexture from our cachedAssets
    	gameScene.metalTexture = loader.cachedAssets[ '/images/metal.jpg' ];
		gameScene.metalTexture.wrapS = gameScene.metalTexture.wrapT = THREE.RepeatWrapping;
		gameScene.metalTexture.repeat.set( 1, .5 );
		
    	gameScene.woodTexture = loader.cachedAssets[ '/images/wood.jpg' ];
		gameScene.woodTexture.wrapS = gameScene.woodTexture.wrapT = THREE.RepeatWrapping;
		gameScene.woodTexture.repeat.set( 1, .5 );
		
    	gameScene.plywoodTexture = loader.cachedAssets[ '/images/plywood.jpg' ];
		gameScene.plywoodTexture.wrapS = gameScene.plywoodTexture.wrapT = THREE.RepeatWrapping;
		gameScene.plywoodTexture.repeat.set( 1, .5 );
		
		// GROUND
		// set ground properties, basically a Plane with woodTexture 
		var groundGeom 		= new THREE.PlaneGeometry( gameScene.GROUND_SIDE, gameScene.GROUND_SIDE );
		gameScene.ground 	= new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { map: gameScene.woodTexture, ambient: 0x030303, color: 0x9d5602, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
		gameScene.ground.material.ambient = gameScene.ground.material.color;
		gameScene.ground.name = "ground";
		gameScene.ground.rotation.x = -90*Math.PI/180;
		gameScene.ground.receiveShadow	 = true;
		gameScene.ground.__dirtyPosition = true;
		gameScene.scene.add( gameScene.ground );
		
		// WALLS
		// set walls properties, basically Planes with woodTexture and different colors
		wallParams = [ 	{ x : gameScene.GROUND_SIDE/2, y: 0, z : 0, rX : -90*Math.PI/180, rY : -90*Math.PI/180, rZ: 0, color : COLOR_RED },
						{ x : -gameScene.GROUND_SIDE/2, y: 0, z : 0, rX : -90*Math.PI/180, rY : 90*Math.PI/180, rZ: 0, color : COLOR_GREEN },
						{ x : 0, y: 0, z : -gameScene.GROUND_SIDE/2, rX : 0, rY : 0, rZ: -90*Math.PI/180, color : COLOR_BLUE },
						{ x : 0, y: 0, z : gameScene.GROUND_SIDE/2, rX : 0, rY : 180*Math.PI/180, rZ: 90*Math.PI/180, color : COLOR_YELLOW }
						];
							
		for ( i = 0; i < 4; i++ )
		{
			wallGeom = new THREE.PlaneGeometry( gameScene.GROUND_SIDE, gameScene.GROUND_SIDE/2 );
			wall = new Physijs.BoxMesh( groundGeom, new THREE.MeshPhongMaterial( { map: gameScene.woodTexture, ambient: 0x030303, color: wallParams[i].color, specular: 0x009900, shininess: 10, shading: THREE.SmoothShading } ) );
			wall.name = "wall"+i;
			wall.material.ambient = 0x030303;
			
			wall.position.set( wallParams[i].x, wallParams[i].y, wallParams[i].z );
			wall.rotation.set( wallParams[i].rX, wallParams[i].rY, wallParams[i].rZ );
			wall.position.setY( gameScene.GROUND_SIDE/2 );
			
			wall.receiveShadow = true;
			wall.__dirtyPosition = true;
			gameScene.scene.add( wall );
		}
		

		// BLOCKS
		
		// set the blocks general geometry
		blockGeom = new THREE.CubeGeometry( gameScene.CUBE_DIMENSIONS.w, gameScene.CUBE_DIMENSIONS.h, gameScene.CUBE_DIMENSIONS.d );
		
		// setup a material array for blocks, 
		// each material related with a color from COLOR_BLOCKS array
		
		for ( i = 0; i < COLOR_BLOCKS.length; i++ )
		{
			materials[i] = Physijs.createMaterial(
				new THREE.MeshLambertMaterial( {map: gameScene.metalTexture, 
												metal : false, 
												ambient: 0x030303, 
												color: COLOR_BLOCKS[i], 
											//	specular: 0x000000, 
											//	shininess: 2, 
												shading: THREE.SmoothShading } ),
				.4, // low friction
				.1 // low restitution
			);
			
			gameScene.dictColorsMaterials[ COLOR_BLOCKS[i] ] = materials[i];
		}
		
		// create blocks
		for ( i = 0; i < gameScene.initialObjects; i ++ ) {

			// setup the block's floor and line
			var floor 	= Math.floor(i/3);
			var line 	= Math.floor(i%3);
			
			// setup the Mesh
			block = new Physijs.BoxMesh( blockGeom, materials[ i % materials.length ] );	
			block.material.transparent = false;
			block.material.opacity = 1;
			block.originalColor 	= block.material.color.getHex();
			block.addEventListener( 'collision', gameScene.collideBlocks ); // setup a collision listener to play a sound on collide
			block.castShadow 		= true;
//			block.receiveShadow 	= true;

			gameScene.scene.add( block );
			gameScene.allBlocks.push( block ); // add the block to allBlocks array
		}
		
		// we create a single material called baseObjectMaterial 
		// to use when actualObject is highlighted
		gameScene.baseObjectMaterial = block.material.clone();
		
		// setup gameScene.actualObject for initial calls
		gameScene.actualObject = gameScene.allBlocks[0];
		
		// and set blocks grid
		gameScene.resetBlocks();
		
		// STATS
		gameScene.stats = new Stats();
		gameScene.stats.domElement.style.position 	= 'absolute';
		gameScene.stats.domElement.style.top 		= '0px';
//		gameScene.container.appendChild( gameScene.stats.domElement );
		
		// ARROWS
		gameScene.arrows = new THREE.Object3D();
		arrowGeom = new THREE.CylinderGeometry( 0, 4, 10, 10 );
		
		// we have 6 arrows one for each face of the cube
		// we show one or another depending on the state
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

	/**
	 * resize handler
	 * updates viewport VIEWPORT_DIMENSIONS 
	 * camera and renderer
	 */
	resize : function() {
		
		gameScene.VIEWPORT_DIMENSIONS = { w : $('#game_wrapper').width(), h : $('#game_wrapper').height() };
		
		// update camera aspect
		gameScene.camera.aspect = gameScene.VIEWPORT_DIMENSIONS.w / gameScene.VIEWPORT_DIMENSIONS.h;
		gameScene.camera.updateProjectionMatrix();	// important to call each time we update camera aspect

		// update renderer size
		gameScene.renderer.setSize( gameScene.VIEWPORT_DIMENSIONS.w, gameScene.VIEWPORT_DIMENSIONS.h );
	},
	
	
	/**
	 * called from gameplay when a new game is created 
	 */
	reset : function() {
	
		// rotate automatically the camera
		gameScene.cameraControls.autoRotate= true;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = true;
		
		// reset blocks grid
		gameScene.resetBlocks();
	},

	/**
	 * creates a multidimensional array
	 * where first fimension is floor and 
	 * second is line. The variable that 
	 * contains the array is blocksGrid
	 */
	resetBlocks : function(){
	
		var block;
		var floor, line, i, j;
	
		gameScene.blocksGrid = [];
	
		// iterate through all blocks
		for ( i = 0; i < gameScene.initialObjects; i ++ ) {
		
				// setup block's floor and line
				floor 	= Math.floor(i/3);
				line 	= Math.floor(i%3);

				// select the block
				block 	= gameScene.allBlocks[i];	
				
				// set positions and rotation 
				block.position.x = ( floor % 2 === 0 ) ? line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w * 1.5 ) : -gameScene.CUBE_DIMENSIONS.w /2;
				block.position.y = gameScene.CUBE_DIMENSIONS.h/2 + ( gameScene.CUBE_DIMENSIONS.h*1*floor );
				block.position.z = ( floor % 2 === 0 ) ? 0 : line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w ) ;

				block.rotation.x = 0;
				block.rotation.y = ( floor % 2 === 0 ) ? 0 : -Math.PI / 2.01;
				block.rotation.z = 0;
				
				// important to hack physics
				block.__dirtyPosition = true;

				// add block to scene
				gameScene.scene.add( block );
				
				// create a new floor if it don't exists
				if ( !gameScene.blocksGrid[ floor ] )
					gameScene.blocksGrid[ floor ] = [];
				
				// fill the array
				gameScene.blocksGrid[ floor ][line] = block;
		}
		
	},

	/**
	 * renders the scene and update stats
	 */
	render : function() {
	
		// check if we need to simulate physics
		if ( connections.data.state != PLAY_PLACE && gameScene.checkSimulation )
			gameScene.scene.simulate( 1.5, 5 );
		
		// update camera controls and light
		gameScene.cameraControls.update();
		gameScene.spotLight.position.copy( gameScene.camera.position );
		gameScene.directionalLightContainer.rotation.setY( gameScene.directionalLightContainer.rotation.y + 0.01 );
		
		// render the scene
		gameScene.renderer.render( gameScene.scene, gameScene.camera );
		
		// check if we need to show arrows
		if ( connections.data.state >= PLAY_SELECT && connections.data.state <= PLAY_PLACE )
			gameScene.showArrows()
		else 
			gameScene.hideArrows();
		
		// upate stats
		gameScene.stats.update();
		
		// disable sortObjects once renderer has made his job
		// this helps (or I hope so) on preformance.
		if ( gameScene.renderer.sortObjects )
			gameScene.renderer.sortObjects = false;
	},
	
	/**
	 * called from gameplay startGame
	 * basically resets the view and stop camera movement, if moving
	 */
	startGame : function(){
		
		// stop camera rotation
		gameScene.cameraControls.autoRotate= false;
		gameScene.cameraControls.userZoom = gameScene.cameraControls.userRotate = true;
		
		// set actualObject material to one of the dictionary materials,
		// this prevents to create a new material for actualObject
		if ( gameScene.actualObject )
			gameScene.actualObject.material = gameScene.dictColorsMaterials[ gameScene.actualObject.originalColor ];
		
		// reset camera view
		gameScene.resetView();
	},
	
	/**
	 * called from gameplay handleSelection
	 * set the actual selected block
	 * and makes the scene transparent
	 */
	select : function() {
		
		gameScene.actualObject = gameScene.blocksGrid[ gameScene.actualSelection.floor ][ gameScene.actualSelection.line ];
		gameScene.makeTransparent();
	},

	/**
	 * called from gameplay handleMove
	 * impulse the selected block in a certain direction
	 */
	move : function( vector ) 
	{
		// if the block is rotated ( is in an odd floor )
		// we need to make a little trick to rotate the vector
		// to be according with the arrows direction
		if( gameScene.actualSelection.floor % 2 === 1  )
		{	
			var v = gameScene.actualObject.rotation.clone();
			v.normalize();
			vector.cross( v )
			vector.negate();
		}
		
		// setup actualObject.originalColor to the color of the player, 
		// so the block will remain with the player's color.
		// This is useful to keep track of each player's placed block.
		if( gameScene.actualObject.originalColor != machine.getActiveUserData().color )
			gameScene.actualObject.originalColor = machine.getActiveUserData().color;
		
		// make impulse
		gameScene.actualObject.setLinearVelocity( vector );
	}, 
	
	/**
	 * called from gameplay handlePlace
	 * moves the block to place when it is over the tower
	 */	
	place : function( vector )
	{
		// if the block is rotated ( is in an odd floor )
		// we need to make a little trick to rotate the vector
		// to be according with the arrows direction
		if( gameScene.actualSelection.floor % 2 === 1  )
		{
			var v = gameScene.actualObject.rotation.clone();
			v.normalize();
			vector.cross( v )
			vector.negate();
		}
		
		// we add the block position to the vector so it 
		// is now our target position 
		vector.add( gameScene.actualObject.position );
		
		// tween the object position
		// notice that we need to set __dirtyPosition to true in
		// each iteration to hack our physics engine
		gameScene.actualObject.__dirtyPosition = true;
		TweenMax.to( gameScene.actualObject.position, .5, { x : vector.x, y : vector.y, z : vector.z, onUpdate : function(){ 
			gameScene.actualObject.__dirtyPosition = true; 
			} } )
	},
	
	/**
	 * called from gameplay handlePlace
	 * enable physics for the selected block once OK button is pressed in PLACE state
	 */	
	placed : function()
	{
		gameScene.actualObject.setAngularFactor( new THREE.Vector3(1,1,1) );
		gameScene.actualObject.setLinearFactor( new THREE.Vector3(1,1,1) );
		gameScene.actualObject.setAngularVelocity( new THREE.Vector3(0,0,0) );
		gameScene.actualObject.setLinearVelocity( new THREE.Vector3(0,0,0) );
		gameScene.actualObject.__dirtyPosition = false;
		gameScene.actualObject.__dirtyRotation = false;
	},
	
	/**
	 * reset scene camera controls and camera
	 */	
	resetView: function(){
		
		// check if it is the first call or not 
		if( connections.data.users[0] )
		{
			// if not, we add a friendly animation 
			TweenMax.to( gameScene.camera, 1, { fov : 50, onUpdate : function(){ gameScene.camera.updateProjectionMatrix() } } )
			TweenMax.to( gameScene.camera.position, 1, { x : -109, y : 143, z : 200 } )
		} else {
			gameScene.camera.fov = 50;
			gameScene.camera.updateProjectionMatrix();
			gameScene.camera.position.set( -109, 143, 200 );
		}

		// reset our camera controls
		gameScene.cameraControls = new THREE.OrbitControls( gameScene.camera, gameScene.renderer.domElement );
		gameScene.cameraControls.autoRotate = gameScene.cameraControls.userPan = false;
		gameScene.cameraControls.userRotate = gameScene.cameraControls.userZoom = true;
		gameScene.cameraControls.maxPolarAngle = Math.PI/2;
		gameScene.cameraControls.maxDistance = 250;
		gameScene.cameraControls.minDistance = 100;
		gameScene.cameraControls.center.copy( new THREE.Vector3(0,50,0))
		gameScene.cameraControls.zoomIn(1)
	}, 
	
	/**
	 * make all blocks opaque updating their material
	 */	
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
					gameScene.blocksGrid[i][j].material.map = gameScene.metalTexture;
					gameScene.blocksGrid[i][j].material.needsUpdate = true;
					gameScene.blocksGrid[i][j].castShadow 		= true;
					gameScene.blocksGrid[i][j].receiveShadow 	= false;
				}
			}
		}
	}, 
	
	/**
	 * make all blocks transparent ( except actual ) updating their material
	 */	
	makeTransparent : function(){
	
		var i, j, floors, lines;
		
		// setup actualObject material
		// is quite different to the others and funcdamentally is not transparent
		// use gameScene.baseObjectMaterial
		if( gameScene.actualObject )
		{
			// we use baseObjectMaterial to higlight actualObject without 
			// modifying other materials and without createing a new material
			// each time we select a block
			gameScene.actualObject.material = gameScene.baseObjectMaterial;
			gameScene.actualObject.material.setValues( { color : machine.getActiveUserData().color } );
			gameScene.actualObject.material.ambient 	= gameScene.actualObject.material.color;
			gameScene.actualObject.material.transparent = false;
			gameScene.actualObject.material.opacity 	= 1;
			gameScene.actualObject.material.map 		= null;
			gameScene.actualObject.material.needsUpdate = true
			gameScene.actualObject.castShadow 			= false;
			gameScene.actualObject.receiveShadow 		= true;
		}
		
		
		// set all the other blocks materials transparency
		for ( i = 0, floors = gameScene.blocksGrid.length; i < floors; i++ )
		{
			for ( j = 0, lines = gameScene.blocksGrid[i].length; j < lines; j++ )
			{
				if ( gameScene.blocksGrid[i][j] && gameScene.blocksGrid[i][j] != gameScene.actualObject )
				{
					// if the block has a different material than its original material
					// means that it was previously an actualObject, so we reset its material
					// to the original one. This helps to prevent creating new materials each time
					// we setup a new actualObject (see line 561)
					if( gameScene.blocksGrid[i][j].material != gameScene.dictColorsMaterials[ gameScene.blocksGrid[i][j].originalColor ] )
						gameScene.blocksGrid[i][j].material = gameScene.dictColorsMaterials[ gameScene.blocksGrid[i][j].originalColor ];
					
					if( !gameScene.blocksGrid[i][j].material.transparent )
					{
						gameScene.blocksGrid[i][j].material.setValues( { color : COLOR_GRAY } );
						gameScene.blocksGrid[i][j].material.ambient 	= gameScene.blocksGrid[i][j].material.color;
						gameScene.blocksGrid[i][j].material.transparent = true;
						gameScene.blocksGrid[i][j].material.opacity = .5;
						gameScene.blocksGrid[i][j].material.map = null;
					}
					
					gameScene.blocksGrid[i][j].castShadow 		= false;
					gameScene.blocksGrid[i][j].receiveShadow 	= false;
					gameScene.blocksGrid[i][j].material.needsUpdate = true;
				}
			}
		}
		
		// set up renderer to sortObjects in next
		// rendering pass. It is important for transparency z-index issues.
		gameScene.renderer.sortObjects = true;
	}, 
	
	/**
	 * returns a random color
	 */	
	getRandomColor : function(){
		return Math.random() * 0xAAAAAA;
	},
	
	/**
	 * add arrows to the scene
	 */	
	showArrows : function(){	
		if( !gameScene.arrows.parent || ( gameScene.actualObject != gameScene.arrows.parent ))
			gameScene.actualObject.add( gameScene.arrows );
			
	},
	
	/**
	 * remove arrows from the scene
	 */	
	hideArrows : function(){	
		if( gameScene.arrows.parent )
			gameScene.arrows.parent.remove( gameScene.arrows );
	},
	
	/**
	 * show blue and yellow arrows up and down
	 */	
	showUpDown : function(){
	
		if( gameScene.arrowsChildren[2].parent )
		{
			gameScene.arrows.remove(gameScene.arrowsChildren[2]);
			gameScene.arrows.remove(gameScene.arrowsChildren[3]);
			gameScene.arrows.add(gameScene.arrowsChildren[4]); 
			gameScene.arrows.add(gameScene.arrowsChildren[5]);
		}
	},
	
	/**
	 * show blue and yellow arrows front and back
	 */	
	showFrontBack : function(){
	
		if( !gameScene.arrowsChildren[2].parent )
		{
			gameScene.arrows.add(gameScene.arrowsChildren[2]);
			gameScene.arrows.add(gameScene.arrowsChildren[3]);
			gameScene.arrows.remove(gameScene.arrowsChildren[4]); 
			gameScene.arrows.remove(gameScene.arrowsChildren[5]);
		}
	}, 

	/**
	 * toggle stats visibility
	 */	
	toggleStats : function(){
		if( gameScene.container.contains( gameScene.stats.domElement ) )
			gameScene.container.removeChild( gameScene.stats.domElement );
		else
			gameScene.container.appendChild( gameScene.stats.domElement );
	},
	
	/**
	 * plays a sound on block collision
	 */	
	collideBlocks : function(){
		
		if ( connections.data.state >= PLAY_MOVE && connections.data.state <= CHECK_PLACE )	
			sndManager.playSoundInstance( '/sounds/hit.mp3', false, .2 );
	}, 
	
	/**
	 * places actual block on top of the tower
	 */	
	placeBlockOnTop : function()
	{
		// search for the last line
		var lastLine 	= gameScene.blocksGrid[gameScene.blocksGrid.length-1];
	
		// remove actual block from blocksGrid ( it will have a new position )
		gameScene.blocksGrid[ gameScene.actualSelection.floor ].splice( gameScene.actualSelection.line, 1 );
			
		// if lastLine is full we add a new floor
		if ( lastLine.length >= 3 )
			gameScene.blocksGrid.push([]);
		
		// and add the actualObject to our new floor
		gameScene.blocksGrid[gameScene.blocksGrid.length-1].push( gameScene.actualObject );
		
		// set actual selection
		gameScene.actualSelection.floor = gameScene.blocksGrid.length-1;
		gameScene.actualSelection.line 	= gameScene.blocksGrid[gameScene.blocksGrid.length-1].length-1;
		
		var floor 	= gameScene.blocksGrid.length + 1;
		var line 	= 1;
		var targetPosition	= new THREE.Vector3();
		var targetRotation	= new THREE.Vector3();
		var physicsLimiter	= new THREE.Vector3();
	
		// a little trick to remove all physics
		gameScene.actualObject.setAngularFactor( physicsLimiter );
		gameScene.actualObject.setLinearFactor( physicsLimiter );
		gameScene.actualObject.setAngularVelocity( physicsLimiter );
		gameScene.actualObject.setLinearVelocity( physicsLimiter );
		
		// set our new target position and rotation
		targetPosition.x = ( floor % 2 === 0 ) ? line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w * 1.5 ) : -gameScene.CUBE_DIMENSIONS.w /2;
		targetPosition.y = gameScene.CUBE_DIMENSIONS.h/2 + ( gameScene.CUBE_DIMENSIONS.h*1*floor ) - 10;
		targetPosition.z = ( floor % 2 === 0 ) ? 0 : line * gameScene.CUBE_DIMENSIONS.w - ( gameScene.CUBE_DIMENSIONS.w ) ;
		
		targetRotation.x = 0;
		targetRotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
		targetRotation.z = 0;

		// we do not simulate physics right now
		// it will create strange behaviours
		gameScene.checkSimulation = false;
		
		// Tween the object to its new position
		// we need to hack __dirtyPosition and sortObjects on each iteration
		// for physics and backface culling behaviours
		gameScene.actualObject.__dirtyPosition = true;
		gameScene.renderer.sortObjects = true;
		TweenMax.to( gameScene.actualObject.position, .5, { x : targetPosition.x, y : targetPosition.y, z : targetPosition.z, onUpdate : function(){ 
			gameScene.actualObject.__dirtyPosition = true; 
			gameScene.renderer.sortObjects = true;
			} } )
		
		
		// we need to tween separatedly rotation and position
		gameScene.actualObject.__dirtyRotation = true;
		TweenMax.to( gameScene.actualObject.rotation, .5, { 
					x : targetRotation.x, y : targetRotation.y, z : targetRotation.z, 
					onUpdate : function(){ 	gameScene.actualObject.__dirtyRotation = true; }, 
					onComplete : function(){ 
						connections.sendMessage('/moveOK');
						gameScene.checkSimulation = true;
					} } )	
		
		
		// play lift sound
		sndManager.playSoundInstance( '/sounds/lift.mp3', false );
		
		// and finally tween the camera to the top of the tower
		TweenMax.to( gameScene.camera.position, 1, { x : 85, y : targetPosition.y + 100, z : 200 } )
		TweenMax.to( gameScene.camera, 1, { fov : 40, onUpdate : function(){ gameScene.camera.updateProjectionMatrix() } } )
	}
})

var gameScene = new GameSceneClass();
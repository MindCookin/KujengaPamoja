
Physijs.scripts.worker 	= 'js/libs/physijs_worker.js';
Physijs.scripts.ammo 	= 'ammo.js';
	
var connection;	
var container, stats, physics_stats;
var camera, controls, scene, projector, renderer;
var objects = [], plane;

var mouse = new THREE.Vector2(),
offset = new THREE.Vector3(),
INTERSECTED, SELECTED;

var VIEWPORT_WIDTH 	= 900;
var VIEWPORT_HEIGHT = 700;


window.onload = function() {
	init();
	animate();
	
	};

function init() {

	container = document.getElementById( 'game_wrapper' );
	
	document.body.appendChild( container );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.sortObjects = false;
	renderer.setSize( VIEWPORT_WIDTH, VIEWPORT_HEIGHT );

	renderer.shadowMapEnabled = true;
	renderer.shadowMapType = THREE.PCFShadowMap;

	container.appendChild( renderer.domElement );

	camera = new THREE.PerspectiveCamera( 50, VIEWPORT_WIDTH / VIEWPORT_HEIGHT, 1, 10000 );
	camera.position.z = 250;
	camera.position.y = 170;
	camera.position.x = 120;
	camera.lookAt( new THREE.Vector3( 0, 200, 0 ) );

	controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 1.0;
	controls.zoomSpeed = 1.2;
	controls.panSpeed = 0.8;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	scene = new Physijs.Scene();

	scene.add( new THREE.AmbientLight( 0x333333 ) );

	directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
	directionalLight.position.copy( camera.position );
	directionalLight.castShadow = true;

	directionalLight.shadowCameraNear = 200;
	directionalLight.shadowCameraFar = camera.far;
	directionalLight.shadowCameraFov = 50;

	directionalLight.shadowBias = -0.00022;
	directionalLight.shadowDarkness = 0.5;

	directionalLight.shadowMapWidth = 1024;
	directionalLight.shadowMapHeight = 1024;

	scene.add( directionalLight );
	
	var groundGeom = new THREE.PlaneGeometry( 768, 768 );
	var ground = new Physijs.BoxMesh( groundGeom, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
	
	ground.rotation.x = -90*Math.PI/180;
	ground.receiveShadow = true;
	ground.__dirtyPosition = true;
	
	scene.add( ground );

	var geometry = new THREE.CubeGeometry( 25, 15, 75 );

	for ( var i = 0; i < 21; i ++ ) {

		var floor 	= Math.floor(i/3);
		var line 	= Math.floor(i%3);

		var object = new Physijs.BoxMesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );	
		object.material.ambient = object.material.color;

		object.position.x = ( floor % 2 === 0 ) ? line * geometry.width - ( geometry.width * 1.5 ) : -geometry.width /2;
		object.position.y = geometry.height/2 + ( geometry.height*1*floor );
		object.position.z = ( floor % 2 === 0 ) ? 0 : line * geometry.width - ( geometry.width ) ;

		object.rotation.x = 0;
		object.rotation.y = ( floor % 2 === 0 ) ? 0 : Math.PI / 2.01;
		object.rotation.z = 0;

		object.castShadow = true;
		object.receiveShadow = true;
		object.__dirtyPosition = true;

		scene.add( object );

		objects.push( object );
	}

	plane = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true, wireframe: true } ) );
	plane.visible = false;
	scene.add( plane );

	projector = new THREE.Projector();

	var info = document.createElement( 'div' );
	info.style.position = 'absolute';
	info.style.top = '10px';
	info.style.width = '100%';
	info.style.textAlign = 'center';
	info.innerHTML = '<a href="http://threejs.org" target="_blank">three.js</a> webgl - draggable cubes';
	container.appendChild( info );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );

	physics_stats = new Stats();
	physics_stats.domElement.style.position = 'absolute';
	physics_stats.domElement.style.top = '50px';
	physics_stats.domElement.style.zIndex = 100;
	container.appendChild( physics_stats.domElement );
		
	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
	renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

	camera.aspect = VIEWPORT_WIDTH / VIEWPORT_HEIGHT;
	camera.updateProjectionMatrix();

	renderer.setSize( VIEWPORT_WIDTH, VIEWPORT_HEIGHT );

}

function onDocumentMouseMove( event ) {

	event.preventDefault();

	mouse.x = ( event.clientX / VIEWPORT_WIDTH ) * 2 - 1;
	mouse.y = - ( event.clientY / VIEWPORT_HEIGHT ) * 2 + 1;

	//

	var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );


	if ( SELECTED ) {

		var intersects = raycaster.intersectObject( plane );
		SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );
		return;

	}


	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {

		if ( INTERSECTED != intersects[ 0 ].object ) {

			if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

			INTERSECTED = intersects[ 0 ].object;
			INTERSECTED.currentHex = INTERSECTED.material.color.getHex();

			plane.position.copy( INTERSECTED.position );
			plane.lookAt( camera.position );

		}

		container.style.cursor = 'pointer';

	} else {

		if ( INTERSECTED ) INTERSECTED.material.color.setHex( INTERSECTED.currentHex );

		INTERSECTED = null;

		container.style.cursor = 'auto';

	}

}

function onDocumentMouseDown( event ) {

	event.preventDefault();

	var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
	projector.unprojectVector( vector, camera );

	var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {

		controls.enabled = false;

		SELECTED = intersects[ 0 ].object;
		
		var intersects = raycaster.intersectObject( plane );
		offset.copy( intersects[ 0 ].point ).sub( plane.position );

		container.style.cursor = 'move';

	}

}

function onDocumentMouseUp( event ) {

	event.preventDefault();

	controls.enabled = true;

	if ( INTERSECTED ) {

		plane.position.copy( INTERSECTED.position );

		SELECTED = null;

	}

	container.style.cursor = 'auto';

}

//

function animate() {

	requestAnimationFrame( animate );

	render();
	
	stats.update();
	physics_stats.update();
}

function render() {

	$("#console").text( SELECTED );
	
	if ( SELECTED )
	{
		SELECTED.__dirtyPosition = true;
	}
	
	directionalLight.position.copy( camera.position );
	
	controls.update();
	
	scene.simulate( 1.5, 5 );

	renderer.render( scene, camera );
}

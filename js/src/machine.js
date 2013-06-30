/*********************************************
 	
	This class is responsible for distributing 
	events and communications through connection 
	from the desktop side.
	
	It also handles all machine button events and 
	machine's screen display
  
 ************************************************/

MachineClass = Class.extend({

	// array with players' characteristics
	playerData : [ 	{ name:'Red Player',	className:'red',	color:COLOR_RED }, 
					{ name:'Green Player',	className:'green',	color:COLOR_GREEN },
					{ name:'Blue Player',	className:'blue',	color:COLOR_BLUE },
					{ name:'Yellow Player',	className:'yellow',	color:COLOR_YELLOW } ],
	
	// arrays that act as dictionaries relating data or funcitons with a concrete state 
	stateScreenDict 	: [],
	stateSoundDict 		: [],
	stateGameplayDict 	: [],

	
	/**
	 * start the engines
	 */	
	start : function(){
		
		// stateSoundDict contains sounds data
		machine.stateSoundDict[PLAY_STARTGAME]	= { sound : '/sounds/win.mp3', loop : false, volume : .5 };
		machine.stateSoundDict[PLAY_SELECT] 	= { sound : '/sounds/pop.mp3', loop : false, volume : .4 };
		machine.stateSoundDict[PLAY_PLACE] 		= { sound : '/sounds/pop.mp3', loop : false, volume : .4 };
		machine.stateSoundDict[PLAY_MOVE] 		= { sound : '/sounds/blip.mp3', loop : false, volume : .5 };
		machine.stateSoundDict[CHECK_PLACE] 	= { sound : '/sounds/blip.mp3', loop : false, volume : .5 };
		machine.stateSoundDict[LOSE] 			= { sound : '/sounds/lifelost.mp3', loop : false, volume : .5 };
		
		// stateScreenDict relate states with functions 
		// that change machine screen display
		machine.stateScreenDict[READY]				= machine.onReady;
		machine.stateScreenDict[PLAY_STARTGAME] 	= machine.onStartGame;
		machine.stateScreenDict[PLAY_MOVE]			= machine.onMove;
		machine.stateScreenDict[PLAY_PLACE]			= machine.onPlace;
		machine.stateScreenDict[CHECK_PLACE]		= machine.onCheckPlace;
		machine.stateScreenDict[LOSE]				= machine.onLose;
		
		// stateGameplayDict relate states with functions of gameplay
		machine.stateGameplayDict[PLAY_STARTGAME]	= gamePlay.startGame;
		machine.stateGameplayDict[PLAY_SELECT]		= gamePlay.handleSelection;
		machine.stateGameplayDict[PLAY_MOVE]		= gamePlay.handleMove;
		machine.stateGameplayDict[PLAY_PLACE]		= gamePlay.handlePlace;	
		
		// button listeners
		$('.btnSound').click( machine.clickSound );
		$('.btnTransparency').click( machine.clickTransparency );
		$('.btnResetView').click( machine.clickView );
		$('.btnPlay').click( machine.clickPlay );
		$('.btnStats').click( machine.clickStats );
		$('#game_wrapper').mouseenter( machine.showGameInfo );
		$('#game_wrapper').mouseleave( machine.hideGameInfo );
		$('.btnMinify').click( machine.clickMinify );
		
		// connection listeners
		connections.addEventListener("onMessage", 	machine.onMessageHandler );
		connections.addEventListener("onClose", 	machine.onCloseHandler );
		
		// start gameplay
		gamePlay.start();
		gamePlay.animate();
		
		// play background sound
		sndManager.playSoundInstance( '/sounds/background.mp3', true );
		
		// shorten our url to make it more friendly 
		// and easier to type in mobile
		machine.shortenURL();
		
		// set transparency of transparency button
		TweenMax.set( '.btnTransparency', { alpha : .5 } );
	},
	
	/**
	 * handle connection closing
	 */	
	onCloseHandler : function(){
		
		if ( connections.data.closed )
			machine.checkUserState();
	},

	/**
	 * handle connection message notification
	 * This is one of the most important functions,
	 * it updates gameplay and screen on every
	 * player notification ( i.e. press a button )
	 */	
	onMessageHandler : function() {
		
		machine.setGameplay();
		machine.setScreen();
		machine.playSound();
		machine.checkUserState();
	},
	
	/**
	 * check the sound to play on a player's 
	 * notification
	 */
	playSound : function(){
		
		var data = machine.stateSoundDict[ connections.data.state ];
			
		// if there is data, then we can play a sound
		if( data )
		{
			// but we have a double check for some special cases 
			if ( 
				( data.sound == '/sounds/blip.mp3'&& connections.data.press > 0 ) || 
				( data.sound == '/sounds/pop.mp3' && connections.data.press < 0 )  
			)
				return;
			else
				sndManager.playSoundInstance( data.sound, data.loop, data.volume );
		}
	},
	
	/**
	 * set the machine screen related with the state
	 * is called on every player notification
	 */
	setScreen : function(){
		
		// if there is a function to call for this state, we call it
		if( machine.stateScreenDict[ connections.data.state ] )
			machine.stateScreenDict[ connections.data.state ]();
	},
	
	/**
	 * set gameplay related with the state
	 * is called on every player notification
	 */
	setGameplay : function(){
		
		// if there is a function to call for this state, we call it
		if( machine.stateGameplayDict[ connections.data.state ] )
			machine.stateGameplayDict[ connections.data.state ]();
	},
	
	/**
	 * called when state is READY
	 */
	onReady : function(){
	
		// we check if it is the first time
		// and show .btnPlay and .startFun
		if ( $('.btnPlay').css('display') == "none" )
		{
			TweenMax.set( '#initial_screen .btnPlay', {alpha:0, scaleY : 0, display:"block"} );
			TweenMax.to( '#initial_screen .btnPlay', .5, {alpha:1, scaleY : 1, autoAlpha : true } );
			
			TweenMax.set( '#initial_screen .startFun', {alpha:0, display:"block"} );
			TweenMax.to( '#initial_screen .startFun', .5, {alpha:1, autoAlpha : true } );
		}
	},
	
	/**
	 * called when state is LOSE
	 */
	onLose : function(){
		
		// we hide info_screen
		TweenMax.to( '#info_screen', .5, {scaleX:0,scaleY:0 } );
		
		// and sow stats_screen ( could be called lose_screen )
		TweenMax.set( '#stats_screen', {scaleX:0,scaleY:0} );
		TweenMax.to( '#stats_screen', .5, {scaleX:1,scaleY:1, autoAlpha : true } );
		
		// show a sentence from our bucket of sentences
		// replacing active player name and floors
		var mText = FINAL_SENTENCES[ Math.floor( Math.random() * FINAL_SENTENCES.length ) ];
		mText = mText.replace("[ACTIVE]", machine.getActiveUserData().name );
		mText = mText.replace("[FLOOR]", gameScene.blocksGrid.length );
		$('#stats_screen .sentence').html( mText );
		
		// hide toolbar and camera control text
		machine.hideGameInfo();
	},
	
	/**
	 * called when state is PLAY_MOVE
	 */
	onMove : function(){
		// update info_screen text
		$('#info_screen p').text( MACHINE_PLAYERMOVE );
	},
	
	/**
	 * called when state is PLAY_PLACE
	 */
	onPlace : function(){
		// update info_screen text
		$('#info_screen p').text( MACHINE_PLAYERPLACE );
	},
	
	/**
	 * called when state is CHECK_PLACE
	 */
	onCheckPlace : function(){
		// update info_screen text
		$('#info_screen p').text( MACHINE_CHECKPLACE );
	},
	
	/**
	 * called when state is PLAY_STARTGAME
	 */
	onStartGame : function(){
	
		// set our display to the active user's colors and texts
		$('#info_screen p').text( MACHINE_PLAYERSELECT.replace("[ACTIVE]", machine.getActiveUserData().name ) );
		
		// hide intial screen or stats screen if they are visible
		TweenMax.to( '#initial_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
		TweenMax.to( '#stats_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
		
		// show info screen
		TweenMax.set( '#info_screen', { scaleX:0, scaleY:0 } );
		TweenMax.to( '#info_screen', .5, { scaleX:1, scaleY:1, ease:"Quint.easeOut", autoAlpha : true} );	

		$('#info_screen').removeClass( 'red green blue yellow');
		$('#info_screen').addClass( machine.getActiveUserData().className );
		
		// update #playersSidebar names and state
		// actually is not shown, but could be useful in the future
		$('#playersSidebar li').each( function()
		{
			if( $(this).hasClass( machine.getActiveUserData().className ) )
				$(this).text( PLAYER_TURN.replace("[ACTIVE]", machine.getActiveUserData().name ) )
			else
				$(this).text( PLAYER_WAIT );
		});
		
		// updates background to show active user's color
		machine.showBackground();
	},
	
	/**
	 * helper thar returns active user's data from playerData array
	 */
	getActiveUserData : function(){
		
		switch( connections.data.active )
		{
			case connections.data.users[0] : return machine.playerData[0]; break;
			case connections.data.users[1] : return machine.playerData[1]; break;
			case connections.data.users[2] : return machine.playerData[2]; break;
			case connections.data.users[3] : return machine.playerData[3]; break;
		}
	},
	
	/**
	 * handles btnPlay click event
	 */
	clickPlay : function( event )
	{
		event.preventDefault();
		
		// check if we come from LOSE ( reset ) or from READY state
		if ( connections.data.state == LOSE )	gamePlay.reset();
		else									machine.showGameInfo();
		
		connections.sendMessage('/startGame');
	}, 
	
	/**
	 * toggle mute/unmute
	 */
	clickSound : function( event )
	{
		event.preventDefault();
		machine.toggleToolsButton( $(this) );
		
		sndManager.toggleMute();
	}, 
	
	/**
	 * show/hide stats
	 */
	clickStats  :function( event )
	{
		event.preventDefault();
		machine.toggleToolsButton( $(this) );
		
		gameScene.toggleStats();
	},
	
	/**
	 * make blocks opaque or transparent
	 */
	clickTransparency : function( event )
	{
		event.preventDefault();
		machine.toggleToolsButton( $(this) );
		
		if ( $(this).hasClass('transparent'))
			gameScene.makeTransparent();
		else
			gameScene.makeOpaque();
	},
	
	/**
	 * reset camera view
	 */
	clickView : function( event ){
	
		event.preventDefault();
		gameScene.resetView();
		
	},
	
	/**
	 * toggles a toolbar button transparency
	 */
	toggleToolsButton : function( element ){
	
		if ( element.hasClass('transparent'))
		{
			TweenMax.to( element, .3, { alpha : 1 } );
			element.removeClass('transparent');
		}
		else
		{
			TweenMax.to( element, .3, { alpha : .5 } );
			element.addClass('transparent');
		}
	},
	
	/**
	 * shows the bottom information of how to move the camera, etc...
	 */
	showGameInfo  :function( event ){
	
		if( event )
			event.preventDefault();
		
		if( connections.data.state >= PLAY_STARTGAME && connections.data.state <= CHECK_PLACE  )
		{
			TweenMax.to( '#toolbar', .3, { alpha : 1, autoAlpha : true } );
			TweenMax.to( '#camera_controls_info', .3, { alpha : 1, autoAlpha : true } );
		}
	},
	
	/**
	 * hides the bottom information 
	 */
	hideGameInfo  :function( event ){
	
		if( event )
			event.preventDefault();
		
		TweenMax.to( '#toolbar', .3, { alpha : 0 } );
		TweenMax.to( '#camera_controls_info', .3, { alpha : 0 } );
	},
	
	/**
	 * changes the background color with a soft animation
	 * and a little DOM trick
	 */
	showBackground : function(){
	
		$('#game_background').removeClass( 'red green blue yellow');
		TweenMax.set( '#game_background', { alpha : 0 } );
		$('#game_background').addClass( machine.getActiveUserData().className )
		
		TweenMax.to( '#game_background', 2, { alpha : 1, onComplete : function(){
			$('body').removeClass( 'red green blue yellow');
			$('body').addClass( machine.getActiveUserData().className );
		} } );
		
	},
	
	/**
	 * checks the players state. 
	 * If they are active means that they are connected to the game
	 */
	checkUserState : function(){
		
		var i, max, className;
		var users = connections.data.users;
		
		// iterate through all players and check 
		// if they are connected or not
		// This has to be done in each notification, because players 
		// can connect during the game
		for ( i = 0, max = users.length; i < max; i++ )
		{
			className = machine.playerData[i].className;
		
			if ( connections.data.users[i] != "" && !$("#playersSidebar ." + className ).hasClass("active") )
				machine.activateUser( "#playersSidebar ." + className )
			else if ( connections.data.users[i] == "" )
				machine.deactivateUser( "#playersSidebar ." + className )		
		}
	},
	
	/**
	 * notifies a player connection
	 */
	activateUser : function(name){
		$(name + ' .tick').css('visibility', 'visible');
		TweenMax.to( name, .5, {marginLeft:-150, onComplete :  function(){ $(name).addClass( 'active' ); } } );
		
		sndManager.playSoundInstance( '/sounds/blip.mp3', false );
	}, 
	
	/**
	 * notifies a player disconnection
	 */
	deactivateUser : function(name){
		$(name + ' .tick').css('visibility', 'hidden');
		TweenMax.to( name, .5, {marginLeft:-200, onComplete :  function(){ $(name).removeClass( 'active' ); } } );
	}, 
	
	/**
	 * shorten the game's url 
	 */
	shortenURL: function()
	{
		$.ajax({
			url: 'https://www.googleapis.com/urlshortener/v1/url?shortUrl=http://goo.gl/fbsS&key=AIzaSyB1Q-_z_lOa8dbdaERT13LnHyDllGoONbs',
			type: 'POST',
			contentType: 'application/json; charset=utf-8',
			data: '{ longUrl: "' + connections.game_url +'"}',
			dataType: 'json',
			success: function(response) {
				$('.url').text( response.id );
				$('.url').attr( 'href', response.id );
				$('#camera_controls_info span').text( response.id );
			},
			error :  function(response) {
				$('.url').text( connections.game_url );
				$('.url').attr( 'href', connections.game_url );
				$('#camera_controls_info span').text( connections.game_url );
			}
		});	
	},
	
	/**
	 * minifies info_screen
	 */
	clickMinify : function( event ){
		event.preventDefault();
		
		$('#info_screen').toggleClass("minified");
		
		if ( $('#info_screen').hasClass("minified") )
			$(this).text("+")
		else
			$(this).text("x")
	}
});

var machine = new MachineClass();
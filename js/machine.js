MachineClass = Class.extend({

	playerData : [ 	{ name:'Red Player',	className:'red',	color:COLOR_RED }, 
					{ name:'Green Player',	className:'green',	color:COLOR_GREEN },
					{ name:'Blue Player',	className:'blue',	color:COLOR_BLUE },
					{ name:'Yellow Player',	className:'yellow',	color:COLOR_YELLOW } ],
					
	stateScreenDict 	: [],
	stateSoundDict 		: [],
	stateGameplayDict 	: [],

	start : function(){
		
		// state dictionaries
		machine.stateSoundDict[PLAY_STARTGAME]	= { sound : '/sounds/win.mp3', loop : false, volume : .5 };
		machine.stateSoundDict[PLAY_SELECT] 	= { sound : '/sounds/pop.mp3', loop : false, volume : .4 };
		machine.stateSoundDict[PLAY_PLACE] 		= { sound : '/sounds/pop.mp3', loop : false, volume : .4 };
		machine.stateSoundDict[PLAY_MOVE] 		= { sound : '/sounds/blip.mp3', loop : false, volume : .5 };
		machine.stateSoundDict[CHECK_PLACE] 	= { sound : '/sounds/blip.mp3', loop : false, volume : .5 };
		machine.stateSoundDict[LOSE] 			= { sound : '/sounds/lifelost.mp3', loop : false, volume : .5 };
		
		machine.stateScreenDict[READY]				= machine.onReady;
		machine.stateScreenDict[PLAY_STARTGAME] 	= machine.onStartGame;
		machine.stateScreenDict[PLAY_MOVE]			= machine.onMove;
		machine.stateScreenDict[PLAY_PLACE]			= machine.onPlace;
		machine.stateScreenDict[CHECK_PLACE]		= machine.onCheckPlace;
		machine.stateScreenDict[LOSE]				= machine.onLose;
		
		machine.stateGameplayDict[PLAY_STARTGAME]	= gamePlay.startGame;
		machine.stateGameplayDict[PLAY_SELECT]		= gamePlay.handleSelection;
		machine.stateGameplayDict[PLAY_MOVE]		= gamePlay.handleMove;
		machine.stateGameplayDict[PLAY_PLACE]		= gamePlay.handlePlace;	
		
		// Listeners
		$('.btnSound').click( machine.clickSound );
		$('.btnTransparency').click( machine.clickTransparency );
		$('.btnResetView').click( machine.clickView );
		$('.btnPlay').click( machine.clickPlay );
		$('.btnStats').click( machine.clickStats );
		$('#game_wrapper').mouseenter( machine.showGameInfo );
		$('#game_wrapper').mouseleave( machine.hideGameInfo );
		$('.btnMinify').click( machine.clickMinify );
		
		connections.addEventListener("onMessage", 	machine.onMessageHandler );
		connections.addEventListener("onClose", 	machine.onCloseHandler );
		
		// call methods
		gamePlay.start();
		gamePlay.animate();
		
		sndManager.create();
		sndManager.playSoundInstance( '/sounds/background.mp3', true );
		
		machine.shortenURL();
		
		TweenMax.set( '.btnTransparency', { alpha : .5 } );
	},
	
	onCloseHandler : function(){
		
		if ( connections.data.closed )
			machine.checkUserState();
	},

	onMessageHandler : function() {
		
		machine.setGameplay();
		machine.setScreen();
		machine.playSound();
		machine.checkUserState();
	},
	
	playSound : function(){
		
		var data = machine.stateSoundDict[ connections.data.state ];
			
		if( data )
		{
			if ( 
				( data.sound == '/sounds/blip.mp3'&& connections.data.press > 0 ) || 
				( data.sound == '/sounds/pop.mp3' && connections.data.press < 0 )  
			)
				return;
			else
				sndManager.playSoundInstance( data.sound, data.loop, data.volume );
		}
	},
	
	setScreen : function(){
		
		if( machine.stateScreenDict[ connections.data.state ] )
			machine.stateScreenDict[ connections.data.state ]();
	},
	
	setGameplay : function(){
		
		if( machine.stateGameplayDict[ connections.data.state ] )
			machine.stateGameplayDict[ connections.data.state ]();
	},
	
	onReady : function(){
		if ( $('.btnPlay').css('display') == "none" )
		{
			TweenMax.set( '#initial_screen .btnPlay', {alpha:0, scaleY : 0, display:"block"} );
			TweenMax.to( '#initial_screen .btnPlay', .5, {alpha:1, scaleY : 1, autoAlpha : true } );
			
			TweenMax.set( '#initial_screen .startFun', {alpha:0, display:"block"} );
			TweenMax.to( '#initial_screen .startFun', .5, {alpha:1, autoAlpha : true } );
		}
	},
	
	onLose : function(){
		
		TweenMax.to( '#info_screen', .5, {scaleX:0,scaleY:0 } );
		
		TweenMax.set( '#stats_screen', {scaleX:0,scaleY:0} );
		TweenMax.to( '#stats_screen', .5, {scaleX:1,scaleY:1, autoAlpha : true } );
		
		var mText = FINAL_SENTENCES[ Math.floor( Math.random() * FINAL_SENTENCES.length ) ];
		mText = mText.replace("[ACTIVE]", machine.getActiveUserData().name );
		mText = mText.replace("[FLOOR]", gameScene.blocksGrid.length );
		
		$('#stats_screen .sentence').html( mText );
		
		machine.hideGameInfo();
	},
	
	onMove : function(){
		$('#info_screen p').text( MACHINE_PLAYERMOVE );
	},
	
	onPlace : function(){
		$('#info_screen p').text( MACHINE_PLAYERPLACE );
	},
	
	onCheckPlace : function(){
		$('#info_screen p').text( MACHINE_CHECKPLACE );
	},
	
	onStartGame : function(){
	
		$('#info_screen p').text( MACHINE_PLAYERSELECT.replace("[ACTIVE]", machine.getActiveUserData().name ) );
			
		TweenMax.to( '#initial_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
		TweenMax.to( '#stats_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
		
		TweenMax.set( '#info_screen', { scaleX:0, scaleY:0 } );
		TweenMax.to( '#info_screen', .5, { scaleX:1, scaleY:1, ease:"Quint.easeOut", autoAlpha : true} );	

		$('#info_screen').removeClass( 'red green blue yellow');
		$('#info_screen').addClass( machine.getActiveUserData().className );
				
		$('#playersSidebar li').each( function()
		{
			if( $(this).hasClass( machine.getActiveUserData().className ) )
				$(this).text( PLAYER_TURN.replace("[ACTIVE]", machine.getActiveUserData().name ) )
			else
				$(this).text( PLAYER_WAIT );
		});
		
		machine.showBackground();
	},
	
	getActiveUserData : function(){
		
		switch( connections.data.active )
		{
			case connections.data.users[0] : return machine.playerData[0]; break;
			case connections.data.users[1] : return machine.playerData[1]; break;
			case connections.data.users[2] : return machine.playerData[2]; break;
			case connections.data.users[3] : return machine.playerData[3]; break;
		}
	},
	
	clickPlay : function( event )
	{
		event.preventDefault();
		
		if ( connections.data.state == LOSE )	gamePlay.reset();
		else									machine.showGameInfo();
		
		connections.sendMessage('/startGame');
	}, 
	
	clickSound : function( event )
	{
		event.preventDefault();
		machine.toggleToolsButton( $(this) );
		
		sndManager.toggleMute();
	}, 
	
	clickStats  :function( event )
	{
		event.preventDefault();
		machine.toggleToolsButton( $(this) );
		
		gameScene.toggleStats();
	},
	
	clickTransparency : function( event )
	{
		event.preventDefault();
		machine.toggleToolsButton( $(this) );
		
		if ( $(this).hasClass('transparent'))
			gameScene.makeTransparent();
		else
			gameScene.makeOpaque();
	},
	
	clickView : function( event ){
	
		event.preventDefault();
		gameScene.resetView();
		
	},
	
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
	
	showGameInfo  :function( event ){
	
		if( event )
			event.preventDefault();
		
		if( connections.data.state >= PLAY_STARTGAME && connections.data.state <= CHECK_PLACE  )
		{
			TweenMax.to( '#toolbar', .3, { alpha : 1, autoAlpha : true } );
			TweenMax.to( '#camera_controls_info', .3, { alpha : 1, autoAlpha : true } );
		}
	},
	
	hideGameInfo  :function( event ){
	
		if( event )
			event.preventDefault();
		
		TweenMax.to( '#toolbar', .3, { alpha : 0 } );
		TweenMax.to( '#camera_controls_info', .3, { alpha : 0 } );
	},
	
	showBackground : function(){
	
		$('#game_background').removeClass( 'red green blue yellow');
		TweenMax.set( '#game_background', { alpha : 0 } );
		$('#game_background').addClass( machine.getActiveUserData().className )
		
		TweenMax.to( '#game_background', 2, { alpha : 1, onComplete : function(){
			$('body').removeClass( 'red green blue yellow');
			$('body').addClass( machine.getActiveUserData().className );
		} } );
		
	},
	
	checkUserState : function(){
		
		var i, max, className;
		var users = connections.data.users;
		
		for ( i = 0, max = users.length; i < max; i++ )
		{
			className = machine.playerData[i].className;
		
			if ( connections.data.users[i] != "" && !$("#playersSidebar ." + className ).hasClass("active") )
				machine.activateUser( "#playersSidebar ." + className )
			else if ( connections.data.users[i] == "" )
				machine.deactivateUser( "#playersSidebar ." + className )		
		}
	},
	
	activateUser : function(name){
		$(name + ' .tick').css('visibility', 'visible');
		TweenMax.to( name, .5, {marginLeft:-150, onComplete :  function(){ $(name).addClass( 'active' ); } } );
		
		sndManager.playSoundInstance( '/sounds/blip.mp3', false );
	}, 
	
	deactivateUser : function(name){
		$(name + ' .tick').css('visibility', 'hidden');
		TweenMax.to( name, .5, {marginLeft:-200, onComplete :  function(){ $(name).removeClass( 'active' ); } } );
	}, 
	
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
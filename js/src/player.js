/*********************************************
 	
	This class is responsible for distributing 
	events and communications through connection
	from the player side.
	
	It also handles all player button events and 
	player's screen display
  
 ************************************************/

PlayerClass = Class.extend({

	// dictionary of player keys/buttons
	playerButtonKeys : { "btnUp" : 0, "btnLeft" : 1, "btnDown" : 2, "btnRight" : 3, "btnOK" : 4,  },
	
	// an array/dictionary that relates functions with states
	stateDict	: [],

	/**
	 * start the player
	 */	
	start	: function(){
		
		// initialize buttons
		var keys = Object.keys(player.playerButtonKeys);
		for ( var i = 0, max = keys.length; i < max; i++ )
		{
			// add listeners
			$( '#' + keys[i] ).mousedown( player.press );
			
			// set our buttons' scale to zero
			TweenMax.set( '#' + keys[i], { scaleX : 0, scaleY : 0 } );
		}
		
		// add listener to accurate button
		$('#btnAccurate').click( player.clickAccurate );	
		
		// listen to message notifications
		connections.addEventListener("onMessage", player.onMessage );
		
		// set stateDict functions, to be called on message notifications
		player.stateDict[PLAY_STARTGAME] 	= player.onStartGame;
		player.stateDict[PLAY_MOVE] 		= player.onMove;
		player.stateDict[PLAY_PLACE] 		= player.onPlace;
		player.stateDict[READY] 			= player.hideButtons;
		player.stateDict[CHECK_PLACE] 		= player.onCheckPlace;
		player.stateDict[LOSE] 				= player.onLoose;
	},
	
	/**
	 * handles button press ( except accuracy )
	 * @param{Event} event 
	 */	
	press : function( event ) {
		
		event.preventDefault();
		
		// set message data information 
		// sender : who is sending the message ( the player id )
		// press : the key pressed
		// accuracy : if accuracy is ON or OFF
		var data = 	'sender='	+ connections.me + '&' +
					'press='	+ player.playerButtonKeys[event.currentTarget.id] +  '&' +
					'accuracy='	+ $('#btnAccurate').hasClass("selected");
					
		// sends message to server			
		connections.sendMessage('/pressed', data);
	},
	
	/**
	 * handles message notifications
	 */	
	onMessage : function() {
	
		// if there is a function in stateDict to call, we call it
		if(	player.stateDict[connections.data.state] != null )
			player.stateDict[connections.data.state]();
	},
	
	/**
	 * called when state is PLAY_STARTGAME
	 */	
	onStartGame : function(){
	
		// if player is the active player, 
		// show buttons
		if( connections.data.active == connections.me )
		{
			$('h1').css( 'fontSize', '30px' );
			$('h1').text(PLAYER_SELECT);
			
			player.showButtons();
			connections.sendMessage('/activated');
			
		//	if not, hide them and show "Wait message"
		} else if ( $('h1').text() != PLAYER_WAIT ){
			player.hideButtons();
			$('h1').css( 'fontSize', '60px' );
			$('h1').text( PLAYER_WAIT );
		}
	}, 
	
	/**
	 * called when state is PLAY_MOVE
	 */	
	onMove : function(){
	
		// if player is the active player 
		// and is the first call we setup the display
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_MOVE )
		{
			$('h1').text(PLAYER_MOVE);
			TweenMax.to( '#btnOK', .5, { scaleX : 0, scaleY : 0, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		}
	},
	
	/**
	 * called when state is PLAY_PLACE
	 */	
	onPlace : function(){
	
		// if player is the active player 
		// and is the first call we setup the display
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_PLACE )
		{
			$('h1').text(PLAYER_PLACE);
			TweenMax.to( '#btnOK', .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
			TweenMax.to( '#btnAccurate', .5, { alpha : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		}
	},
	
	/**
	 * called when state is CHECK_PLACE
	 */	
	onCheckPlace : function(){
	
		// if player is the active player 
		// and is the first call we setup the display
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_CHECKPLACE )
			$('h1').text(PLAYER_CHECKPLACE);
			
		player.hideButtons();	
	},
	
	/**
	 * called when state is LOSE
	 */	
	onLoose : function(){
	
		// if player is the active player 
		// and is the first call we setup the display
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_LOSE )
			$('h1').text(PLAYER_LOSE);
			
		player.hideButtons();
	},
	
	/**
	 * hides all buttons
	 */	
	hideButtons : function(){
	
		if( $('#playerButtons').hasClass('active') )
		{	
			var i, max;
			var keys = Object.keys(player.playerButtonKeys);
		
			$('#playerButtons').removeClass("active");
			
			for ( i = 0, max = keys.length; i < max; i++ )
				TweenMax.to( '#' + keys[i], .5, { scaleX : 0, scaleY : 0, ease : "Power3.easeOut", overwrite : 1 } );
				
			TweenMax.to( '#btnAccurate', .5, { alpha : 0, ease : "Power3.easeOut", overwrite : 1 } )
		}
	},
	
	/**
	 * shows buttons
	 */	
	showButtons : function(){
	
		if( !$('#playerButtons').hasClass('active') )
		{
			var i, max;
			var keys = Object.keys(player.playerButtonKeys);
			
			$('#playerButtons').addClass("active");
					
			for ( i = 0, max = keys.length; i < max; i++ )
				TweenMax.to( '#' + keys[i], .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } );
				
			$('#btnAccurate').removeClass("selected");
		}	
	}, 
	
	/**
	 * set accuracy button selected class
	 */	
	clickAccurate : function(event){
		
		event.preventDefault();
		
		$(this).toggleClass("selected");
	}
	
});

var player = new PlayerClass();
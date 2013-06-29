PlayerClass = Class.extend({

	playerButtonKeys : { "btnUp" : 0, "btnLeft" : 1, "btnDown" : 2, "btnRight" : 3, "btnOK" : 4,  },
	stateDict	: [],

	start	: function(){
		
		var keys = Object.keys(player.playerButtonKeys);
		for ( var i = 0, max = keys.length; i < max; i++ )
		{
			$( '#' + keys[i] ).mousedown( player.press );
			TweenMax.set( '#' + keys[i], { scaleX : 0, scaleY : 0 } );
		}
		
		$('#btnAccurate').click( player.clickAccurate );	
		$('window').mouseup( player.press );
		
		connections.addEventListener("onMessage", player.onMessage );
		
		player.stateDict[PLAY_STARTGAME] 	= player.onStartGame;
		player.stateDict[PLAY_MOVE] 		= player.onMove;
		player.stateDict[PLAY_PLACE] 		= player.onPlace;
		player.stateDict[READY] 			= player.hideButtons;
		player.stateDict[CHECK_PLACE] 		= player.onCheckPlace;
		player.stateDict[LOSE] 				= player.onLoose;
	},
	
	press : function( event ) {
		
		event.preventDefault();
		
		var data = 	'sender='	+ connections.me + '&' +
					'press='	+ player.playerButtonKeys[event.currentTarget.id] +  '&' +
					'accuracy='	+ $('#btnAccurate').hasClass("selected");
					
		connections.sendMessage('/pressed', data);
	},
	
	onMessage : function() {
	
		if(	player.stateDict[connections.data.state] != null )
			player.stateDict[connections.data.state]();
	},
	
	onStartGame : function(){
	
		if( connections.data.active == connections.me )
		{
			$('h1').css( 'fontSize', '30px' );
			$('h1').text(PLAYER_SELECT);
			
			player.showButtons();
			connections.sendMessage('/activated');
			
		} else if ( $('h1').text() != PLAYER_WAIT ){
			player.hideButtons();
			$('h1').css( 'fontSize', '60px' );
			$('h1').text( PLAYER_WAIT );
		}
	}, 
	
	onMove : function(){
	
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_MOVE )
		{
			$('h1').text(PLAYER_MOVE);
			TweenMax.to( '#btnOK', .5, { scaleX : 0, scaleY : 0, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		}
	},
	
	onPlace : function(){
	
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_PLACE )
		{
			$('h1').text(PLAYER_PLACE);
			TweenMax.to( '#btnOK', .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
			TweenMax.to( '#btnAccurate', .5, { alpha : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		}
	},
	
	onCheckPlace : function(){
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_CHECKPLACE )
			$('h1').text(PLAYER_CHECKPLACE);
			
		player.hideButtons();	
	},
	
	onLoose : function(){
		if( connections.data.active == connections.me && $('h1').text() != PLAYER_LOSE )
			$('h1').text(PLAYER_LOSE);
			
		player.hideButtons();
	},
	
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
	
	clickAccurate : function(event){
		
		event.preventDefault();
		
		$(this).toggleClass("selected");
	}
	
});

var player = new PlayerClass();
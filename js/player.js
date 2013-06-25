PlayerClass = Class.extend({

	playerButtonKeys : { "btnUp" : 0, "btnLeft" : 1, "btnDown" : 2, "btnRight" : 3, "btnOK" : 4,  },

	press : function( event ) {
		
		if ( connections.data.state >= PLAY_SELECT )
		{
			if ( connections.data.active == connections.me )
			{
				var data = 	'sender='	+ connections.me + '&' +
							'press='	+ player.playerButtonKeys[event.currentTarget.id];
				connections.sendMessage('/pressed', data);
			}
		}
		
		return false;
	},

	release : function( event ) {
		
		if ( connections.data.press >= 0 )
			connections.sendMessage('/released' );
		
		return false;
	},
	
	onMessage : function() {
		
		if ( connections.data.state == PLAY_STARTGAME )
		{
			if( connections.data.active == connections.me )
			{
				$('h1').css( 'fontSize', '30px' );
				$('h1').text(PLAYER_SELECT);
				
				player.showButtons();
				connections.sendMessage('/activated');
				
			} else {
				player.hideButtons();
				$('h1').css( 'fontSize', '60px' );
				$('h1').text( PLAYER_WAIT );
			}
		}
		
		if ( connections.data.state == PLAY_MOVE && connections.data.active == connections.me )
		{
			$('h1').text(PLAYER_MOVE);
			TweenMax.to( '#btnOK', .5, { scaleX : 0, scaleY : 0, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
			
		} else if ( connections.data.state == PLAY_PLACE && connections.data.active == connections.me ) {
		
			$('h1').text(PLAYER_PLACE);
			TweenMax.to( '#btnOK', .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		}
		
		if ( connections.data.state == READY || connections.data.state >= CHECK_PLACE )
		{
			player.hideButtons();
		}
	},

	start	: function(){
		
		var keys = Object.keys(player.playerButtonKeys);
		for ( var i = 0; i < keys.length; i++ )
		{
			$( '#' + keys[i] ).mousedown( player.press );
			TweenMax.set( '#' + keys[i], { scaleX : 0, scaleY : 0 } );
		}
			
		$('window').mouseup( player.press );
		
		connections.addEventListener("onMessage", player.onMessage );
	},
	
	hideButtons : function(){
	
		var i, length;
		var keys = Object.keys(player.playerButtonKeys);
	
		$('#playerButtons').removeClass("active");
		
		for ( i = 0; i < keys.length; i++ )
			TweenMax.to( '#' + keys[i], .5, { scaleX : 0, scaleY : 0, ease : "Power3.easeOut", overwrite : 1 } );
	},
	
	showButtons : function(){
	
		var i, length;
		var keys = Object.keys(player.playerButtonKeys);
		
		$('#playerButtons').addClass("active");
				
		for ( i = 0; i < keys.length; i++ )
			TweenMax.to( '#' + keys[i], .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } );
	}
	
});

var player = new PlayerClass();
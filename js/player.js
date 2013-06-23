PlayerClass = Class.extend({

	playerButtonKeys : { "btnUp" : 0, "btnLeft" : 1, "btnDown" : 2, "btnRight" : 3, "btnOK" : 4,  },

	press : function( event ) {
		
		if ( connections.data.state >= PLAY_SELECT && connections.data.active == connections.me )
		{
			var data = 	'sender='	+ connections.me + '&' +
						'press='	+ player.playerButtonKeys[event.currentTarget.id];
			connections.sendMessage('/pressed', data);
		}
		
		return false;
	},

	release : function( event ) {
		
		if ( connections.data.press >= 0 )
			connections.sendMessage('/released' );
		
		return false;
	},
	
	onMessage : function() {
	
		console.log( "ON MESSAGE PLAYER!!!!")
		
		if ( connections.data.state == PLAY_SET_ACTIVE && connections.data.active == connections.me )
		{
			var keys = Object.keys(player.playerButtonKeys);
		
			for ( var i = 0; i < keys.length; i++ )
				TweenMax.to( '#' + keys[i], .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut" } );
			
			connections.sendMessage('/activated');
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
	}
});

var player = new PlayerClass();
PlayerClass = Class.extend({

	playerButtonKeys : { "btnUp" : 0, "btnLeft" : 1, "btnDown" : 2, "btnRight" : 3, "btnOK" : 4,  },

	click : function( event ) {
		
		var data = 	'sender='	+ connections.me + '&' +
					'press='	+ player.playerButtonKeys[event.currentTarget.id];
					
		connections.sendMessage('/pressed', data);
		return false;
	},

	onMessage : function() {
		console.log( "ON MESSAGE PLAYER!!!!")
	},

	start	: function(){
		$('#btnUp').click( player.click );
		$('#btnDown').click( player.click );
		$('#btnLeft').click( player.click );
		$('#btnRight').click( player.click );
		$('#btnOK').click( player.click );
		
		connections.addEventListener("onMessage", player.onMessage );
	}
});

var player = new PlayerClass();
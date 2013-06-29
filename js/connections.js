ConnectionClass = EventBusClass.extend({

	token		: null,
	game_url 	: null,
	game_key 	: null,
	me 			: null,
	data 		: { users : [] },
	socket		: null,
	channel		: null,
				
	sendMessage : function(path, opt_param) {
		
		path += '?g=' + connections.game_key + '&u=' + connections.me;
		
		if (opt_param) {
			path += '&' + opt_param;
		}
			var xhr = new XMLHttpRequest();
			xhr.open('POST', path, true);
			xhr.send();
	},
		  
	onOpened : function() {
		connections.sendMessage('/opened');
	},
				  
	onMessage : function(m) {
			  
		// The first connection receives a bad formatted JSON
		// so first of all I check if the message(m) is ok or not
		
		try
		{
		   newState = JSON.parse(m.data);
		}
		catch(e)
		{
			console.log( "onMessage : Error parsing" );
			newState= "";
		}
			
		if( newState ) { 
		
			if ( newState.closed )
			{
				connections.data.closed = newState.closed;
				connections.dispatch("onClose");
			}
			else	
			{
				connections.data.users[0] 	= newState.user1;
				connections.data.users[1] 	= newState.user2;
				connections.data.users[2] 	= newState.user3;
				connections.data.users[3] 	= newState.user4;
				connections.data.machine	= newState.machine;
				connections.data.active 	= newState.active;
				connections.data.press  	= newState.press;
				connections.data.accuracy	= newState.accuracy;
				connections.data.lose  		= newState.lose;
				connections.data.state  	= newState.state;
				
				console.log( "STATE : " + newState.state );
				
				connections.dispatch("onMessage");
			}
		}
	},
				  
	onError : function(e){
//		alert( "Error: " + JSON.parse(e.data) );			
	},
		  
	onClose : function(e){
//		alert( "Close: " + JSON.parse(e.data) );
	},
		  
	openChannel : function( token ) {

		var token 	= token;
		connections.channel = new goog.appengine.Channel( token );
			
		var handler = {
			'onopen': 	connections.onOpened,
			'onmessage':connections.onMessage,
			'onerror': 	connections.onError,
			'onclose': 	connections.onClose
		};

		connections.socket 			= connections.channel.open(handler);
		connections.socket.onopen 	= connections.onOpened;
		connections.socket.onmessage= connections.onMessage;
		connections.socket.onclose	= connections.onClose;
	},
		  
	initialize : function() {
		
		window.onbeforeunload = function () {
			connections.sendMessage('/closed');
			connections.socket.close();
		};
		
		connections.openChannel( connections.token );
	}   
});  

connections = new ConnectionClass(); 
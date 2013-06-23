ConnectionClass = EventBusClass.extend({

	game_key 	: null,
	me 			: null,
	data 		: {},
				
	sendMessage : function(path, opt_param) {
		
		console.log( connections.game_key, connections.me );
		
		path += '?g=' + connections.game_key;
		
		if (opt_param) {
			path += '&' + opt_param;
		}
			var xhr = new XMLHttpRequest();
			xhr.open('POST', path, true);
			xhr.send();
	},
		  
	onOpened : function() {
	
		console.log( "onOpened" );
		connections.sendMessage('/opened');
	},
				  
	onMessage : function(m) {
			  
		// The first connection receives a bad formatted JSON
		// so first of all I check if the message(m) is ok or not
			
		console.log( "onMessage : received message" );
		
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
			
			connections.data.user1 	= newState.user1;
			connections.data.user2 	= newState.user2;
			connections.data.user3 	= newState.user3;
			connections.data.user4 	= newState.user4;
			connections.data.machine= newState.machine;
			connections.data.active = newState.active;
			connections.data.press  = newState.press;
			connections.data.loose  = newState.loose;
			connections.data.state  = newState.state;
			
			console.log( "STATE : " + newState.state );
			
			connections.dispatch("onMessage");
		}
	},
				  
	onError : function(e){
		alert( "Error: " + JSON.parse(e.data) );			
	},
		  
	onClose : function(e){
		alert( "Close: " + JSON.parse(e.data) );
	},
		  
	openChannel : function( token ) {

		var token 	= token;
		var channel = new goog.appengine.Channel( token );
			
		console.log( token );
			
		var handler = {
			'onopen': connections.onOpened,
			'onmessage': connections.onMessage,
			'onerror': connections.onError,
			'onclose': connections.onClose
		};

		var socket = channel.open(handler);
		socket.onopen = connections.onOpened;
		socket.onmessage = connections.onMessage;
	},
		  
	initialize : function( token ) {
		
		// TODO : review unnecessary initial message	
		connections.openChannel( token );
	}   
});  

connections = new ConnectionClass(); 
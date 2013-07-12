/*********************************************
 *	
 * This class is responsible for the conection 
 * with the server. Implements EventBus, a third party class 
 * that provides it with Event dispatching functionality
 *
 * Both Machine and Player have a connection.
 * 
 ************************************************/

ConnectionClass = EventBusClass.extend({

	// token that identifies the socket
	token		: null,
	// game url
	game_url 	: null,
	// game identifier
	game_key 	: null,
	// user identifier
	me 			: null,
	// game data, starts with 0 users
	data 		: { users : [] },
	// the socket
	socket		: null,
	// the channel
	channel		: null,
	
	/**
	 * initializes the connection 
	 */	  
	initialize : function() {
		
		// a handler for window closing
		window.onbeforeunload = function () {
			connections.sendMessage('/closed');
			connections.socket.close();
		};
		
		// open a new channel with our provided token
		connections.openChannel( connections.token );
	},
	
	/**
	 * This function is responsible for sending messages 
	 * to the server. 
	 * Receives the url path and opt_parameters to add to the POST request
 	 * @param {String} path
 	 * @param {String} opt_param
	 */
	sendMessage : function(path, opt_param, opt_user) {
		
		// set the URL
		var user = ( opt_user ) ? opt_user : connections.me;
		path += '?g=' + connections.game_key + '&u=' + user;
		
		if (opt_param) {
			path += '&' + opt_param;
		}
		
		// Ajax call
		var xhr = new XMLHttpRequest();
		xhr.open('POST', path, true);
		xhr.send();
	},
	
	/**
	 * This function handles the socket open connection
	 * and notifies the server
	 */	  
	onOpened : function() {
		connections.sendMessage('/opened');	// we send a message that we are ready
	},
	
	/**
	 * This function handles the socket message connection
	 * Receives the message string in JSON format
 	 * @param {String} m
	 */			  
	onMessage : function(m) {
			  
		// Check if message is a correct JSON
		try
		{
		   newState = JSON.parse(m.data);
		}
		catch(e)
		{
			console.log( "onMessage : Error parsing" );
			newState= "";
		}
		
		// If everything is OK we set a new state 	
		// and dispatch an event to notify player and machine
		if( newState ) { 
		
			if ( newState.closed )
			{
				connections.data.closed = newState.closed;
				connections.dispatch("onClose");
			}
			else	
			{
				connections.data.users[0] 	= { id : newState.user1, isDesktop : ( newState.desktop_users.indexOf( newState.user1 ) > 0 ) };
				connections.data.users[1] 	= { id : newState.user2, isDesktop : ( newState.desktop_users.indexOf( newState.user2 ) > 0 ) };
				connections.data.users[2] 	= { id : newState.user3, isDesktop : ( newState.desktop_users.indexOf( newState.user3 ) > 0 ) };
				connections.data.users[3] 	= { id : newState.user4, isDesktop : ( newState.desktop_users.indexOf( newState.user4 ) > 0 ) };
				connections.data.machine	= newState.machine;
				connections.data.active 	= { id : newState.active, isDesktop : ( newState.desktop_users.indexOf( newState.active ) > 0 ) };;
				connections.data.press  	= newState.press;
				connections.data.accuracy	= newState.accuracy;
				connections.data.lose  		= newState.lose;
				connections.data.state  	= newState.state;
				
				console.log( "STATE : " + newState.state );
				
				connections.dispatch("onMessage");
			}
		}
	},
	
	/**
	 * This function handles if there is a socket error
	 * Receives the error message string in JSON format
 	 * @param {String} m
	 */			  			  
	onError : function(e){
		alert( "Error: " + JSON.parse(e.data) );			
	},
	
	/**
	 * This function handles socket closing
	 * Receives an error message string in JSON format
 	 * @param {String} m
	 */			  			  	  
	onClose : function(e){
		alert( "Close: " + JSON.parse(e.data) );
	},
	
	/**
	 * This function is responsible for opening a new channel 
	 * and create a new socket, wich will send information 
	 * through our opened channel to the server
	 *
	 * token identifies our connection from others
 	 * @param {String} token
	 */			  			  	 	  
	openChannel : function( token ) {

		// create a new Google App Engine Channel
		connections.channel = new goog.appengine.Channel( token );
		
		// set the handler for notifications
		var handler = {
			'onopen': 	connections.onOpened,
			'onmessage':connections.onMessage,
			'onerror': 	connections.onError,
			'onclose': 	connections.onClose
		};

		// set the socket and attach handlers
		connections.socket 			= connections.channel.open(handler);
		connections.socket.onopen 	= connections.onOpened;
		connections.socket.onmessage= connections.onMessage;
		connections.socket.onclose	= connections.onClose;
	}  
});  

connections = new ConnectionClass(); 
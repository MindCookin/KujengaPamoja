
onOpened = function() {
	console.log( "onOpened" );
		
	openedChannel = true;
	sendMessage('/opened');
		
};
      
onMessage = function(m) {
	  
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
		console.log( "onMessage : success!!" );
		state.board = newState.board || state.board;
		state.userX = newState.userX || state.userX;
		state.userO = newState.userO || state.userO;
		state.moveX = newState.moveX;
		state.winner = newState.winner || "";
		state.winningBoard = newState.winningBoard || "";
		updateGame();
	}
};
	  
 onError = function(e){
	alert( "Error: " + JSON.parse(e.data) );
};
	  
onClose = function(e){
	alert( "Close: " + JSON.parse(e.data) );
};
      
openChannel = function() {

	var token = '{{ token }}';
    var channel = new goog.appengine.Channel( token );
		
	console.log( token );
		
    var handler = {
        'onopen': onOpened,
        'onmessage': onMessage,
        'onerror': onError,
        'onclose': onClose
    };

    var socket = channel.open(handler);
	socket.onopen = onOpened;
    socket.onmessage = onMessage;
}
      
initialize = function() {
	openChannel();
	
	/*
	var i;
	for (i = 0; i < 9; i++) {
		var square = document.getElementById(i);
		square.onmouseover = new Function('highlightSquare(' + i + ')');
		square.onclick = new Function('moveInSquare(' + i + ')');
	}*/
	
	onMessage({data: '{{ initial_message }}'});
}      

setTimeout(initialize, 100);
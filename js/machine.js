MachineClass = Class.extend({

	start : function(){
		
		$('.btnPlay').click( machine.clickPlay );
		
		connections.addEventListener("onMessage", machine.onMessageHandler );
	},

	onMessageHandler : function() {
		
		console.log( "ON MESSAGE MACHINE!!!!", connections.data.state );
		machine.setScreen();
		
		if ( connections.data.state == PLAY_SELECT )
		{
			if ( connections.data.press >= 0 )
				gameBoard.handleSelection( connections.data.press );
		} else if ( connections.data.state == PLAY_MOVE )
		{
			if ( connections.data.press >= 0 )
				gameBoard.handleMove( connections.data.press );
				
		} else if ( connections.data.state == PLAY_PLACE )
		{
			if ( connections.data.press >= 0 )
				gameBoard.handlePlace( connections.data.press );
		}
	},
	
	setScreen : function(){
	
		/** set active player **/
		if ( connections.data.user1 && !$("#playersSidebar .red").hasClass("active") )
			TweenMax.to( '#playersSidebar .red', .5, {marginLeft:0, onComplete : machine.addActiveClass, onCompleteParams : [  $('#playersSidebar .red')] } );
		
		if ( connections.data.user2 && !$("#playersSidebar .green").hasClass("active") )
			TweenMax.to( '#playersSidebar .green', .5, {marginLeft:0, onComplete : machine.addActiveClass, onCompleteParams : [  $('#playersSidebar .green')] } );
		
		if ( connections.data.user3 && !$("#playersSidebar .blue").hasClass("active") )
			TweenMax.to( '#playersSidebar .blue', .5, {marginLeft:0, onComplete : machine.addActiveClass, onCompleteParams : [  $('#playersSidebar .blue')] } );
		
		if ( connections.data.user4 && !$("#playersSidebar .yellow").hasClass("active") )
			TweenMax.to( '#playersSidebar .yellow', .5, {marginLeft:0, onComplete : machine.addActiveClass, onCompleteParams : [  $('#playersSidebar .yellow')] } );
			
		/** set play button **/
		if ( connections.data.state == READY )
		{
			TweenMax.set( '.btnPlay', {alpha:0} );
			TweenMax.to( '.btnPlay', .5, {alpha:1, autoAlpha : true } );
		}
	},
	
	addActiveClass : function( target ){
		target.addClass( 'active' );
	},
	
	clickPlay : function( event ){
		
		TweenMax.to( '#initial_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
		
		TweenMax.set( '#info_screen', { scaleX:0, scaleY:0 } );
		TweenMax.to( '#info_screen', .5, { scaleX:1, scaleY:1, ease:"Quint.easeOut", autoAlpha : true} );
		
		connections.sendMessage('/startGame');
		return false;
	}
});

var machine = new MachineClass();
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
				
		} else if ( connections.data.state == CHECK_PLACE )
		{
			gameBoard.clean();
			connections.sendMessage('/startGame');
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
		if ( connections.data.state == READY && $('.btnPlay').css('display') == "none" )
		{
			TweenMax.set( '#initial_screen .btnPlay', {alpha:0, scaleY : 0, display:"block"} );
			TweenMax.to( '#initial_screen .btnPlay', .5, {alpha:1, scaleY : 1, autoAlpha : true } );
		}
		
		if( connections.data.state == LOOSE )
		{
			TweenMax.set( '#stats_screen .btnPlay', { alpha:0, scaleY : 0, display:"block"} );
			TweenMax.to( '#stats_screen .btnPlay', .5, { alpha:1, scaleY : 1, autoAlpha : true, delay : .5 } );
			
			TweenMax.to( '#info_screen', .5, {scaleX:0,scaleY:0 } );
			
			TweenMax.set( '#stats_screen', {scaleX:0,scaleY:0} );
			TweenMax.to( '#stats_screen', .5, {scaleX:1,scaleY:1, autoAlpha : true } );
		}
		
		if ( connections.data.state == PLAY_STARTGAME )
		{
			$('#info_screen p').text( MACHINE_PLAYERSELECT.replace("[ACTIVE]", machine.getActiveUserName() ) );
			
			TweenMax.to( '#initial_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
			TweenMax.to( '#stats_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
			
			TweenMax.set( '#info_screen', { scaleX:0, scaleY:0 } );
			TweenMax.to( '#info_screen', .5, { scaleX:1, scaleY:1, ease:"Quint.easeOut", autoAlpha : true} );	

			$('body').removeClass( 'red green blue yellow');
			$('#info_screen').removeClass( 'red green blue yellow');
			
			$('#info_screen').addClass( machine.getActiveUserColor() );
			$('body').addClass( machine.getActiveUserColor() );
			
			$('#playersSidebar li').each( function(){
				if( $(this).hasClass( machine.getActiveUserColor() ) )
					$(this).text( PLAYER_TURN.replace("[ACTIVE]", machine.getActiveUserName() ) )
				else
					$(this).text( PLAYER_WAIT );
			});
		}
		
		if ( connections.data.state == PLAY_MOVE )
			$('#info_screen p').text( MACHINE_PLAYERMOVE );
			
		if ( connections.data.state == PLAY_PLACE )
			$('#info_screen p').text( MACHINE_PLAYERPLACE );
			
	},
	
	getActiveUserName : function(){
		
		var name;
		switch( connections.data.active )
		{
			case connections.data.user1 : name = 'Red Player'; break;
			case connections.data.user2 : name = 'Green Player'; break;
			case connections.data.user3 : name = 'Blue Player'; break;
			case connections.data.user4 : name = 'Yellow Player'; break;
		}
		
		return name;
	},
	
	getActiveUserColor : function(){
		
		var color;
		switch( connections.data.active )
		{
			case connections.data.user1 : color = 'red'; break;
			case connections.data.user2 : color = 'green'; break;
			case connections.data.user3 : color = 'blue'; break;
			case connections.data.user4 : color = 'yellow'; break;
		}
		
		return color;
	},
	
	addActiveClass : function( target ){
		target.addClass( 'active' );
	},
	
	clickPlay : function( event ){
		
		if ( connections.data.state == LOOSE )
			gameBoard.reset();
		
		connections.sendMessage('/startGame');
		return false;
	}
});

var machine = new MachineClass();
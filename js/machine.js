MachineClass = Class.extend({

	playerData : [ 	{ name:'Red Player',className:'red',color:COLOR_RED }, 
					{ name:'Green Player',className:'green',color:COLOR_GREEN },
					{ name:'Blue Player',className:'blue',color:COLOR_BLUE },
					{ name:'Yellow Player',className:'yellow',color:COLOR_YELLOW } ],

	start : function(){
		
		$('.btnSound').click( machine.toggleSound );
		$('.btnTransparency').click( machine.toggleTransparency );
		$('.btnResetView').click( machine.resetView );
		$('.btnPlay').click( machine.clickPlay );
		
		connections.addEventListener("onMessage", machine.onMessageHandler );
		connections.addEventListener("onClose", machine.onCloseHandler );
	},
	
	onCloseHandler : function(){
		
		if ( connections.data.closed )
		{
			var selector;
			switch( connections.data.closed )
			{
				case connections.data.user1 : selector = "#playersSidebar .red";	break;
				case connections.data.user2 : selector = "#playersSidebar .green";	break;
				case connections.data.user3 : selector = "#playersSidebar .blue";	break;
				case connections.data.user4 : selector = "#playersSidebar .yellow";	break;
			}
			
			$( selector ).removeClass( 'active' );
			TweenMax.to( selector, .5, {marginLeft:-150} ); 
		}
	},

	onMessageHandler : function() {
		
		machine.setScreen();
		
		if ( connections.data.state == PLAY_SELECT )
		{
//			if ( connections.data.press >= 0 )
				gameBoard.handleSelection( connections.data.press );
			
		} else if ( connections.data.state == PLAY_MOVE )
		{
			if ( connections.data.press >= 0 )
				gameBoard.handleMove( connections.data.press );
				
		} else if ( connections.data.state == PLAY_PLACE )
			gameBoard.handlePlace( connections.data.press );	
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
			$('#info_screen p').text( MACHINE_PLAYERSELECT.replace("[ACTIVE]", machine.getActiveUserData().name ) );
			
			TweenMax.to( '#initial_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
			TweenMax.to( '#stats_screen', .5, {scaleX:0,scaleY:0,ease:"Quint.easeIn"} );
			
			TweenMax.set( '#info_screen', { scaleX:0, scaleY:0 } );
			TweenMax.to( '#info_screen', .5, { scaleX:1, scaleY:1, ease:"Quint.easeOut", autoAlpha : true} );	

			$('body').removeClass( 'red green blue yellow');
			$('#info_screen').removeClass( 'red green blue yellow');
			
			$('#info_screen').addClass( machine.getActiveUserData().className );
			$('body').addClass( machine.getActiveUserData().className );
			
			$('#playersSidebar li').each( function(){
				if( $(this).hasClass( machine.getActiveUserData().className ) )
					$(this).text( PLAYER_TURN.replace("[ACTIVE]", machine.getActiveUserData().name ) )
				else
					$(this).text( PLAYER_WAIT );
			});
		}
		
		if ( connections.data.state == PLAY_MOVE )
			$('#info_screen p').text( MACHINE_PLAYERMOVE );
			
		if ( connections.data.state == PLAY_PLACE )
			$('#info_screen p').text( MACHINE_PLAYERPLACE );
			
		if ( connections.data.state == CHECK_PLACE )	
			$('#info_screen p').text( MACHINE_CHECKPLACE );
			
	},
	
	getActiveUserData : function(){
		
		switch( connections.data.active )
		{
			case connections.data.user1 : return machine.playerData[0]; break;
			case connections.data.user2 : return machine.playerData[1]; break;
			case connections.data.user3 : return machine.playerData[2]; break;
			case connections.data.user4 : return machine.playerData[3]; break;
		}
	},
	
	addActiveClass : function( target ){
		target.addClass( 'active' );
	},
	
	clickPlay : function( event ){
		
		if ( connections.data.state == LOOSE )
			gameBoard.reset();
		
		connections.sendMessage('/startGame');
		return false;
	}, 
	
	toggleSound : function( event ){
		// TODO
	}, 
	
	toggleTransparency : function( event ){
		if ( $(this).hasClass('transparent'))
		{
			TweenMax.to( $(this), .5, { alpha : 1 } );
			$(this).removeClass('transparent');
			gameScene.makeTransparent();
		}
		else
		{
			TweenMax.to( $(this), .5, { alpha : .5 } );
			$(this).addClass('transparent');
			gameScene.makeOpaque();
		}
	},
	
	resetView : function( event ){
		gameScene.resetView();
	}
});

var machine = new MachineClass();
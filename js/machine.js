MachineClass = Class.extend({

	playerData : [ 	{ name:'Red Player',className:'red',color:COLOR_RED }, 
					{ name:'Green Player',className:'green',color:COLOR_GREEN },
					{ name:'Blue Player',className:'blue',color:COLOR_BLUE },
					{ name:'Yellow Player',className:'yellow',color:COLOR_YELLOW } ],

	start : function(){
		
		$('.btnSound').click( machine.clickSound );
		$('.btnTransparency').click( machine.clickTransparency );
		$('.btnResetView').click( machine.clickView );
		$('.btnPlay').click( machine.clickPlay );
		$('.btnStats').click( machine.clickStats );
		
		$('#game_wrapper').mouseenter( machine.showGameInfo )
		$('#game_wrapper').mouseleave( machine.hideGameInfo )
		
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
			gameBoard.handleSelection( connections.data.press );
		else if ( connections.data.state == PLAY_MOVE )
			gameBoard.handleMove( connections.data.press );
		else if ( connections.data.state == PLAY_PLACE )
			gameBoard.handlePlace( connections.data.press );	
	},
	
	setScreen : function(){
	
		/** set active player **/
		if ( connections.data.user1 && !$("#playersSidebar .red").hasClass("active") )
			machine.activate( "#playersSidebar .red" )
			
		if ( connections.data.user2 && !$("#playersSidebar .green").hasClass("active") )
			machine.activate( "#playersSidebar .green" )
			
		if ( connections.data.user3 && !$("#playersSidebar .blue").hasClass("active") )
			machine.activate( "#playersSidebar .blue" )
			
		if ( connections.data.user4 && !$("#playersSidebar .yellow").hasClass("active") )
			machine.activate( "#playersSidebar .yellow" )
			
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

			$('#info_screen').removeClass( 'red green blue yellow');
			
			$('#info_screen').addClass( machine.getActiveUserData().className );
			
			
			$('#playersSidebar li').each( function(){
				if( $(this).hasClass( machine.getActiveUserData().className ) )
					$(this).text( PLAYER_TURN.replace("[ACTIVE]", machine.getActiveUserData().name ) )
				else
					$(this).text( PLAYER_WAIT );
			});
			
			machine.showBackground();
		}
		
		if ( connections.data.state == PLAY_MOVE )
			$('#info_screen p').text( MACHINE_PLAYERMOVE );
			
		if ( connections.data.state == PLAY_PLACE )
			$('#info_screen p').text( MACHINE_PLAYERPLACE );
			
		if ( connections.data.state == CHECK_PLACE )	
			$('#info_screen p').text( MACHINE_CHECKPLACE );
		

		if( connections.data.state < PLAY_STARTGAME || connections.data.state > CHECK_PLACE )
			machine.hideGameInfo();
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
	
	clickPlay : function( event )
	{
		event.preventDefault();
		
		if ( connections.data.state == LOOSE )
			gameBoard.reset();
		else	
			machine.showGameInfo();
		
		connections.sendMessage('/startGame');
	}, 
	
	clickSound : function( event )
	{
		event.preventDefault();
		machine.toggleTransparency( $(this) );
		
		// TODO
	}, 
	
	clickStats  :function( event )
	{
		event.preventDefault();
		machine.toggleTransparency( $(this) );
		
		gameScene.toggleStats();
	},
	
	clickTransparency : function( event )
	{
		event.preventDefault();
		machine.toggleTransparency( $(this) );
		
		if ( $(this).hasClass('transparent'))
			gameScene.makeTransparent();
		else
			gameScene.makeOpaque();
	},
	
	clickView : function( event ){
	
		event.preventDefault();
		
		gameScene.resetView();
		
	},
	
	toggleTransparency : function( element ){
	
		if ( element.hasClass('transparent'))
		{
			TweenMax.to( element, .3, { alpha : 1 } );
			element.removeClass('transparent');
		}
		else
		{
			TweenMax.to( element, .3, { alpha : .5 } );
			element.addClass('transparent');
		}
	},
	
	showGameInfo  :function( event ){
	
		if( event )
			event.preventDefault();
		
		if( connections.data.state >= PLAY_STARTGAME && connections.data.state <= CHECK_PLACE  )
		{
			TweenMax.to( '#toolbar', .5, { top : 0 } );
			TweenMax.to( '#camera_controls_info', .5, { bottom : 0 } );
		}
	},
	
	hideGameInfo  :function( event ){
	
		if( event )
			event.preventDefault();
		
		TweenMax.to( '#toolbar', .5, { top : -30 } );
		TweenMax.to( '#camera_controls_info', .5, { bottom : -30 } );
	},
	
	showBackground : function(){
	
		$('#game_background').removeClass( 'red green blue yellow');
		TweenMax.set( '#game_background', { alpha : 0 } );
		$('#game_background').addClass( machine.getActiveUserData().className )
		
		TweenMax.to( '#game_background', 2, { alpha : 1, onComplete : function(){
			$('body').removeClass( 'red green blue yellow');
			$('body').addClass( machine.getActiveUserData().className );
		} } );
		
	},
	
	activate : function(name){
		$(name + ' .tick').css('visibility', 'visible');
		TweenMax.to( name, .5, {marginLeft:-150, onComplete : machine.addActiveClass, onCompleteParams : [  $(name)] } );
	}
});

var machine = new MachineClass();
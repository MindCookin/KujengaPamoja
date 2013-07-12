
DesktopPlayerClass = Class.extend({	
	
	// dictionary of desktopPlayer keys/buttons
	keys : {"38" : 0, // up
			"37" : 1, // left
			"40" : 2, // down
			"39" : 3, // right
			"32" : 4
			},
			
	stateDict : [],
	accuracy : false,
	
	start : function(){			
	
		document.addEventListener( 'keyup', desktopPlayer.handleKeyDown );
		
		desktopPlayer.stateDict[PLAY_STARTGAME] = desktopPlayer.onStartGame;
		desktopPlayer.stateDict[PLAY_MOVE] 		= desktopPlayer.onMove;
		desktopPlayer.stateDict[PLAY_PLACE] 	= desktopPlayer.onPlace;
		desktopPlayer.stateDict[READY] 			= desktopPlayer.hideButtons;
		desktopPlayer.stateDict[CHECK_PLACE] 	= desktopPlayer.onCheckPlace;
		desktopPlayer.stateDict[LOSE] 			= desktopPlayer.onLoose;
		
		TweenMax.set( '#desktopPlayerButtons', { alpha : 0 } )
		TweenMax.set( '#btnAccurate', { alpha : 0 } )
	}, 
	
	onMessageHandler : function(){
	
		// if there is a function in stateDict to call, we call it
		if(	desktopPlayer.stateDict[connections.data.state] != null )
			desktopPlayer.stateDict[connections.data.state]();
	},
	
	handleKeyDown : function( event ){
	
		event.preventDefault();
		
		if ( event.keyCode == "65" )	// if user press A, switch accuracy mode
			desktopPlayer.toggleAccuracy();
		
		// check if active is a desktop player
		// and if it is, send our pressed key data
		if ( connections.data.active && connections.data.active.isDesktop && desktopPlayer.keys[event.keyCode] >= 0 )
		{
			var data = 	'sender='	+ connections.data.active.id + '&' +
						'press='	+ desktopPlayer.keys[event.keyCode] +  '&' +
						'accuracy='	+ desktopPlayer.accuracy;
						
			// sends message to server			
			connections.sendMessage('/pressed', data, connections.data.active.id );
		}
	},
	
	/**
	 * called when state is PLAY_STARTGAME
	 */	
	onStartGame : function(){
	
		// if active is a desktop player, we checkout from here
		if( connections.data.active.isDesktop )
		{
			connections.sendMessage('/activated', null, connections.data.active.id );
			desktopPlayer.showButtons();
		}
	}, 
	
	/**
	 * called when state is PLAY_MOVE
	 */	
	onMove : function(){
	
		// hide SPACEBAR button on move
		if( connections.data.active.isDesktop )
			TweenMax.to( '#btnSpacebar', .5, { scaleX : 0, scaleY : 0, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
	},
	
	/**
	 * called when state is PLAY_PLACE
	 */	
	onPlace : function(){
	
		// show SPACEBAR button and Accurate button
		if( connections.data.active.isDesktop )
		{
			TweenMax.to( '#btnSpacebar', .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
			TweenMax.to( '#btnAccurate', .5, { alpha : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		}
	},
	
	/**
	 * called when state is CHECK_PLACE
	 */	
	onCheckPlace : function(){
			
		desktopPlayer.hideButtons();	
	},
	
	/**
	 * called when state is LOSE
	 */	
	onLoose : function(){
	
		desktopPlayer.hideButtons();
	}, 
	
	toggleAccuracy : function(){
		desktopPlayer.accuracy = ( desktopPlayer.accuracy ) ? false : true;
		
		if ( desktopPlayer.accuracy )	$('#btnAccurate').addClass( "selected" );
		else 							$('#btnAccurate').removeClass( "selected" );
	}, 
	
	hideButtons : function(){
		TweenMax.to( '#desktopPlayerButtons', .5, { alpha : 0, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		TweenMax.to( '#btnAccurate', .5, { alpha : 0, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
	}, 
	
	showButtons : function(){
		TweenMax.to( '#desktopPlayerButtons', .5, { alpha : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
		TweenMax.to( '#btnSpacebar', .5, { scaleX : 1, scaleY : 1, autoAlpha : true, ease : "Power3.easeOut", overwrite : 1 } )
	}
});

var desktopPlayer = new DesktopPlayerClass();
MachineClass = Class.extend({

	start : function(){
		
		connections.addEventListener("onMessage", machine.onMessageHandler );
	},

	onMessageHandler : function() {
		
		console.log( "ON MESSAGE MACHINE!!!!", connections.data.state );
		
		if ( connections.data.user1 && !$("#playersSidebar .red").hasClass("active") )
			$("#playersSidebar .red").addClass( "active" );
		
		if ( connections.data.user2 && !$("#playersSidebar .green").hasClass("active") )
			$("#playersSidebar .green").addClass( "active" );
			
		if ( connections.data.user3 && !$("#playersSidebar .blue").hasClass("active") )
			$("#playersSidebar .blue").addClass( "active" );
			
		if ( connections.data.user4 && !$("#playersSidebar .yellow").hasClass("active") )
			$("#playersSidebar .yellow").addClass( "active" );
	}
});

var machine = new MachineClass();
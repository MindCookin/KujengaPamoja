/*********************************************
 * Constants for gameplay
 ************************************************/

// The game states
var INIT 			= 0;	// the game initializes ( inmediatly after loading )
var READY 			= 1;	// some player has connected
var PLAY_STARTGAME 	= 2;	// play button has been pressed, or we restart the gameplay loop ( SELECT, MOVE and PLACE )
var PLAY_SELECT 	= 3;	// player have to select a block
var PLAY_MOVE 		= 4;	// player have to move the selected block	
var PLAY_PLACE 		= 5;	// player have to place the selected block on top of the tower
var CHECK_PLACE 	= 6;	// checking if PLACE has been OK
var LOSE 			= 8;	// if the tower falls or the player throws a block out of the tower, he loses

// Texts to show in Machine
var	MACHINE_PLAYERSELECT 	= "[ACTIVE]'s turn. Select a block with your pad and press OK when done."; 
var	MACHINE_PLAYERMOVE 		= "Move your block and release it from the block tower without dropping any other block."; 
var	MACHINE_PLAYERPLACE		= "Good! Now select a position to place your block and pass the buck to the next one." ;
var	MACHINE_CHECKPLACE		= 'Stability checking...';

// Texts to show in player
var	PLAYER_WAIT 	= 'Wait for your turn'; 
var	PLAYER_SELECT 	= 'Select a block'; 
var	PLAYER_MOVE 	= 'Remove it from the block tower'; 
var	PLAYER_PLACE	= 'Now place it over the top';
var	PLAYER_TURN		= '[ACTIVE] turn';
var	PLAYER_CHECKPLACE= 'Checking...';
var	PLAYER_LOSE	= 'Oh no, you have lost!';

// Color reference
var COLOR_RED 	= 0xa91515;
var COLOR_GREEN 	= 0x3ba915;
var COLOR_BLUE 	= 0x1561a9;
var COLOR_YELLOW	= 0xe7ac04;
var COLOR_GRAY	= 0x777777;
var COLOR_DARKGRAY= 0x3f3c38;
var COLOR_BLOCKS  = [ COLOR_RED, COLOR_GREEN, COLOR_BLUE, COLOR_YELLOW ];

// Texts to show when player loses
var FINAL_SENTENCE1 = "[ACTIVE] has made a wrong move and the tower master has drop him out from Kujenga Pamoja hall of fame.<br/><br/>Anyway, you have made it up to [FLOOR] floors. <br/><br/>You think you can beat this mark? Let's see what you got!";
var FINAL_SENTENCE2 = "[ACTIVE] I think you need a little practice to beat [FLOOR] floors.<br/><br/>What do you think? It's building time so let's do it!";
var FINAL_SENTENCE3 = "Great!! You might be proud of reaching [FLOOR] floors, but that's not a mark for true Kujenga warriors. <br/><br/>Do you have what it takes? So play again and beat your mark!";
var FINAL_SENTENCE4 = "[FLOOR] floors could be a good mark for a trainee architect, but if you want to be a true Kujenga master you need something more. <br/><br/>Let's do it again and build the empire state of Kujenga's towers!";
var FINAL_SENTENCES = [ FINAL_SENTENCE1, FINAL_SENTENCE2, FINAL_SENTENCE3, FINAL_SENTENCE4 ];
/******** States ************/
const INIT 				= 0;
const READY 			= 1;
const PLAY_STARTGAME 	= 2;
const PLAY_SELECT 		= 3;
const PLAY_MOVE 		= 4;
const PLAY_PLACE 		= 5;
const CHECK_PLACE 		= 6;
const STATS 			= 7;
const LOOSE 			= 8;

const	MACHINE_PLAYERSELECT 	= "It's [ACTIVE] turn. Select a block with your pad and press OK when done."; 
const	MACHINE_PLAYERMOVE 		= "Now move your block and release it from the block tower. Be careful and don't drop any other block."; 
const	MACHINE_PLAYERPLACE		= "Great. Now select a position to place your block and pass the buck to the next one." ;

const	PLAYER_WAIT 	= 'Wait for your turn'; 
const	PLAYER_SELECT 	= 'Select a block'; 
const	PLAYER_MOVE 	= 'Remove it from the block tower'; 
const	PLAYER_PLACE	= 'Now place it over the top';
const	PLAYER_TURN		= '[ACTIVE] turn';

const COLOR_RED 	= 0xa91515;
const COLOR_GREEN 	= 0x3ba915;
const COLOR_BLUE 	= 0x1561a9;
const COLOR_YELLOW	= 0xe7ac04;
const COLOR_GRAY	= 0x777777;

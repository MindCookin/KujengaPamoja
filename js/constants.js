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

const	MACHINE_PLAYERSELECT 	= "[ACTIVE]'s turn. Select a block with your pad and press OK when done."; 
const	MACHINE_PLAYERMOVE 		= "Move your block and release it from the block tower without dropping any other block."; 
const	MACHINE_PLAYERPLACE		= "Good! Now select a position to place your block and pass the buck to the next one." ;
const	MACHINE_CHECKPLACE		= 'Stability checking...';

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

const FINAL_SENTENCE1 = "[ACTIVE] has made a wrong move and the tower master has drop him out from Kujenga Pamoja hall of fame!<br/><br/>Anyway, you all have made it up to [FLOOR] floors. <br/><br/>You think you can beat this mark? Let's see what you got!";
const FINAL_SENTENCE2 = "No you don't... What! Oh please... <br/><br/> [ACTIVE] I think you need a little practice to beat [FLOOR] floors.<br/><br/>What do you think? It's building time so let's beat it!";
const FINAL_SENTENCE3 = "Great!! You might be proud of having reached [FLOOR] floors, but that's not a mark for true Kujenga warriors. <br/><br/>Do you have what it takes? So play again and beat your mark!";
const FINAL_SENTENCE4 = "[FLOOR] floors could be a good mark for a trainee architect, but if you want to be a true Kujenga master you need something more. <br/><br/>Let's do it again and build the empire state of Kujenga's towers!";
const FINAL_SENTENCES = [ FINAL_SENTENCE1, FINAL_SENTENCE2, FINAL_SENTENCE3, FINAL_SENTENCE4 ];
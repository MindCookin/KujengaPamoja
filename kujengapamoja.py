import os
import logging

from google.appengine.api import channel
from google.appengine.api import users
from google.appengine.ext import db

import json
import jinja2
import webapp2
import string
import random

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'])
	
"""
All the data we store for a game
"""
class Game(db.Model):
	machine = db.StringProperty()
	user1 	= db.StringProperty()
	user2 	= db.StringProperty()
	user3 	= db.StringProperty()
	user4 	= db.StringProperty()
	active  = db.StringProperty()
	press  	= db.IntegerProperty()
	accuracy= db.BooleanProperty()
	loose  	= db.BooleanProperty()
	state  	= db.IntegerProperty()

"""
Handles game updates and creates Game model
"""
class GameUpdater():
	game = None

	def __init__(self, game):
		self.game = game

	"""Returns a json containing the information in Game model"""
	def get_game_message(self):
		gameUpdate = {
			"machine" 	: self.game.machine,
			"user1" 	: '' if not self.game.user1 else self.game.user1,
			"user2" 	: '' if not self.game.user2 else self.game.user2,
			"user3" 	: '' if not self.game.user3 else self.game.user3,
			"user4" 	: '' if not self.game.user4 else self.game.user4,
			"active" 	: self.game.active,
			"press"  	: self.game.press,
			"accuracy"  : self.game.accuracy,
			"loose"  	: self.game.loose,
			"state"  	: self.game.state
		}
		return json.dumps(gameUpdate)

	"""Sends update notifications to the players and machine"""
	def send_update(self):

		#retrieves the actual game model information
		message = self.get_game_message()
		
		#send message to machine
		channel.send_message( self.game.machine + self.game.key().id_or_name(), message)

		if self.game.user1:	#send message to user1, if exists
			channel.send_message( self.game.user1 + self.game.key().id_or_name(), message)
		if self.game.user2:	#send message to user2, if exists
			channel.send_message( self.game.user2 + self.game.key().id_or_name(), message)
		if self.game.user3:	#send message to user3, if exists
			channel.send_message( self.game.user3 + self.game.key().id_or_name(), message)
		if self.game.user4:	#send message to user4, if exists
			channel.send_message( self.game.user4 + self.game.key().id_or_name(), message)
	
	"""Sends close notifications to the machine"""
	def send_close(self, user_id):
		message = json.dumps( { "closed" : user_id } )
		channel.send_message( self.game.machine + self.game.key().id_or_name(), message)

"""
Returns the actual game corresponding to the given game_key
Essential to track the correct game model.
"""		
class GameFromRequest():
	game = None;

	def __init__(self, request):
		user = request.get('u')
		game_key = request.get('g')
		if user and game_key:
			self.game = Game.get_by_key_name(game_key)

	def get_game(self):
		return self.game

"""
Sent by Player whenever a key is pressed.
Notifies machine and players that a key has been pressed.
"""		
class Pressed(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
		user = self.request.get('u')

		#Check the current key pressed and sends update if we are in gameplay
		if game and user and user == game.active and game.state >= 3 and game.state < 6:
			
			#retrieve the key pressed
			keyPressed = int( self.request.get('press') )
			
			#if keyPressed is lower than 3 means that an arrow key has been pressed
			#updates the game model's state, set press to the corresponding arrow key
			if keyPressed < 4 :
				game.press 		= keyPressed
				game.accuracy 	= bool( self.request.get('accuracy') == "true" )
				game.put()
				
				#send update
				GameUpdater(game).send_update()
			else :
				#if keyPressed is higher than 3 means that OK key has been pressed
				#updates the game model's state, set press to -1 to indicate that no arrow key has been pressed
				game.press = -1
				game.state += 1
				game.put()
				
				#send update
				GameUpdater(game).send_update()

"""
Sent by Machine after a good move.
Updates state and send updates to all connections (players and machine).
"""		
class MoveOK(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
		user = self.request.get('u')

		#updates the game model's state, set press to -1 to indicate that no arrow key has been pressed
		if game and user:
			game.state += 1
			game.press = -1
			game.put()
			
			#send update
			GameUpdater(game).send_update()

"""
Sent by Machine or Player when a socket is opened.
Notify all about the update;
"""			
class Opened(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
			
		# override key pressed, little trick for connecting when already in a started game
		game.press = -1
		GameUpdater(game).send_update()

"""
Sent by Player when a socket is closed.
Notify only machine;
"""			
class Closed(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
		user = self.request.get('u')
		
		#remove the user from game model
		if game and user:
			if game.user1 	== user :game.user1 = ""
			elif game.user2 == user :game.user2 = ""
			elif game.user3 == user :game.user3 = ""
			elif game.user4 == user :game.user4 = ""
			game.put();
		
			#and send update
			GameUpdater(game).send_close( user )

"""
Sent by Machine
Notify all that the game has started and set the active user/player
"""					
class StartGame(webapp2.RequestHandler):

	def post(self):
		
		game = GameFromRequest(self.request).get_game()
		
		# set game state to PLAY_STARTGAME
		game.state = 2
		
		#add user in a list to make easy to handle
		usersList = [ game.user1, game.user2, game.user3, game.user4 ]
		
		#set active user in game model
		if not game.active:
			game.active = usersList[0]
		else :
			index = usersList.index( game.active ) + 1
			
			if index < len(usersList) and usersList[index] :
				game.active = usersList[index]
			else :
				game.active = usersList[0]
			
		game.put()
		
		# send update
		GameUpdater(game).send_update()

"""
Sent by Player after receiving StartGame
Notify the machine and players that we can start selecting blocks
"""							
class Activated(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
		
		# set game state to PLAY_SELECT
		game.state = 3;
		game.put()
		GameUpdater(game).send_update()

"""
Sent by Machine whenever a player loses
Notify all that a player loses
"""							
class Lose(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
		# set game state to LOSE
		game.state = 8;
		game.put()
		GameUpdater(game).send_update()

"""
Called when opening the main url or the player url
Initializes game model, creates new token and user/machine identifiers, updates all changes and send notifications to all
"""									
class Main(webapp2.RequestHandler):

    def get(self):
		
		#Retrieve the u GET parameter from url. 
		#If exists means that this user already exists
		user = self.request.get('u')
		
		#If there is no user we create a new one and give him a new identifier
		if not user:
			user = id_generator(21, string.digits )
		
		#Retrieve g GET parameter, the game_key
		game_key = self.request.get('g') 
		
		# if there is no game_key means that this is the machine 
		# and we need to create a new one
		if not game_key :
			
			# create a new game_key that will be distributed to users by the URL
			game_key = id_generator()
			
			# create a new game model
			game = Game(
				key_name = game_key,
				machine = user,
				state	= 0
			)
			game.put()
		else :
		
			# if there is a game_key, means that we have a Game, and we retrieve it
			game = Game.get_by_key_name(game_key)
			
			#check is the user exists
			if user != game.user1 and user != game.user2 and user != game.user3 and user != game.user4 :
				# if it don't, we create it and add him to game model
				if not game.user1 :
					game.user1 = user
				elif not game.user2 :
					game.user2 = user
				elif not game.user3 :
					game.user3 = user
				elif not game.user4 :
					game.user4 = user
				
				# and update game state in consecuence
				if game.state == 0:
					game.state = 1
				
				game.put()
			else :
				# if already exists, show a message that this user has connected before ( shouldn't happen anyway )
				template_values = { 'user_disabled' : "true" }
				template = JINJA_ENVIRONMENT.get_template('player.html')
				self.response.write(template.render(template_values))
				return
				
		#retrieve game token
		token = channel.create_channel( user + game_key )
		
		#and create the url ( we will only use it in machine)
		game_url = self.request.url + "?g=" + game_key
		
		#update template values
		template_values = {
			'token': token,
			'game_key': game_key,
			'game_url': game_url,
			'machine': 	game.machine,
			'user1': 	game.user1,
			'user2': 	game.user2,
			'user3': 	game.user3,
			'user4': 	game.user4,
			'me': user
		}
		
		#and create the HTML corresponding to the Player or Machine, 
		#depending if there is g GET parameter or not
		if self.request.get('g'):
			template = JINJA_ENVIRONMENT.get_template('player.html')
			self.response.write(template.render(template_values))
		else:
			template = JINJA_ENVIRONMENT.get_template('machine.html')
			self.response.write(template.render(template_values))
			
"""
a simple id generator 
used when creating a game_key and user id
"""
def id_generator(size = 6 , chars = string.ascii_uppercase + string.digits ):
	return ''.join(random.choice(chars) for x in range(size))

"""
Application rooting
"""			
application = webapp2.WSGIApplication([
    ('/', Main),
    ('/opened', Opened),
    ('/closed', Closed),
    ('/startGame', StartGame),
    ('/pressed', Pressed),
    ('/activated', Activated),
    ('/lose', Lose),
    ('/moveOK', MoveOK)
], debug=True)
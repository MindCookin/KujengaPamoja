import os
import logging

from google.appengine.api import channel
from google.appengine.api import users
from google.appengine.ext import db

import json
import jinja2
import webapp2

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'])

class Game(db.Model):
	"""All the data we store for a game"""
	machine = db.StringProperty()
	user1 	= db.StringProperty()
	user2 	= db.StringProperty()
	user3 	= db.StringProperty()
	user4 	= db.StringProperty()
	active  = db.StringProperty()
	press  	= db.IntegerProperty()
	loose  	= db.BooleanProperty()
	state  	= db.IntegerProperty()

class GameUpdater():
  game = None

  def __init__(self, game):
    self.game = game

  def get_game_message(self):
    gameUpdate = {
		"machine" 	: self.game.machine,
		"user1" 	: '' if not self.game.user1 else self.game.user1,
		"user2" 	: '' if not self.game.user2 else self.game.user2,
		"user3" 	: '' if not self.game.user3 else self.game.user3,
		"user4" 	: '' if not self.game.user4 else self.game.user4,
		"active" 	: self.game.active,
		"press"  	: self.game.press,
		"loose"  	: self.game.loose,
		"state"  	: self.game.state
    }
    return json.dumps(gameUpdate)

  def send_update(self):
	message = self.get_game_message()
	channel.send_message( self.game.machine + self.game.key().id_or_name(), message)

	if self.game.user1:
		channel.send_message( self.game.user1 + self.game.key().id_or_name(), message)
	if self.game.user2:
		channel.send_message( self.game.user2 + self.game.key().id_or_name(), message)
	if self.game.user3:
		channel.send_message( self.game.user3 + self.game.key().id_or_name(), message)
	if self.game.user4:
		channel.send_message( self.game.user4 + self.game.key().id_or_name(), message)
		  
class GameFromRequest():
	game = None;

	def __init__(self, request):
		user = users.get_current_user()
		game_key = request.get('g')
		if user and game_key:
			self.game = Game.get_by_key_name(game_key)

	def get_game(self):
		return self.game

class Pressed(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
		user = users.get_current_user()

		if game and user:
			GameUpdater(game).send_update()
	
class Opened(webapp2.RequestHandler):

	def post(self):
		game = GameFromRequest(self.request).get_game()
		GameUpdater(game).send_update()

class Main(webapp2.RequestHandler):

    def get(self):
		
		user = users.get_current_user()
		
		if not user:
			self.redirect(users.create_login_url(self.request.uri))	
			return
			
		#Si hay game_key, significa que es un jugador
		#Si no hay game_key, es la maquina
		
		game_key = self.request.get('g') 
		user_id = user.user_id()
		
		if not game_key :
			# TODO : generar game_key dinamicamente
			game_key = "x7fgh2"
			
			# y creo un nuevo Game
			game = Game(
				key_name = game_key,
				machine = user_id,
				state	= 0
			)
			game.put()
		else :
		
			# recojo el Game
			game = Game.get_by_key_name(game_key)
			
			#compruebo si existe usuario
			if user_id != game.user1 or user_id != game.user2 or user_id != game.user3 or user_id != game.user4 :
				# creo el usuario si no existe
				if not game.user1 :
					game.state = 1
					game.user1 = user_id
					game.put()
				elif not game.user2 :
					game.state = 1
					game.user2 = user_id
					game.put()
				elif not game.user3 :
					game.state = 1
					game.user3 = user_id
					game.put()
				elif not game.user4 :
					game.state = 1
					game.user4 = user_id
					game.put()
		
		#recojo el token
		token = channel.create_channel( user_id + game_key )
		
		# Actualizo el HTML:
		template_values = {
			'token': token,
			'game_key': game_key,
			'machine': 	game.machine,
			'user1': 	game.user1,
			'user2': 	game.user2,
			'user3': 	game.user3,
			'user4': 	game.user4,
			'me': user_id
		}
		
		if self.request.get('g'):
			template = JINJA_ENVIRONMENT.get_template('player.html')
			self.response.write(template.render(template_values))
		else:
			template = JINJA_ENVIRONMENT.get_template('machine.html')
			self.response.write(template.render(template_values))
			
application = webapp2.WSGIApplication([
    ('/', Main),
    ('/opened', Opened),
    ('/pressed', Pressed)
], debug=True)
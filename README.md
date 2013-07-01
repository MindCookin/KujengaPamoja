Kujenga Pamoja
============

Kujenga Pamoja is a kind of tribute to "Jenga", the block playing game. In fact, "Jenga" means "built" in Suajili, and "Kujenga Pamoja" means "build together".

This said, the idea was to create a multiplayer experience based on the use of socket communications, connecting mobile phones with a desktop application, using the phones like a gamepad while desktop application acts like the machine/console. 

How to play
--------------
First of all, open the [game](http://2.kujenga-pamoja.appspot.com) in Chrome( at this time, it is not avalaible in other browsers ). You will be presented with an URL. Introduce the URL in your smartphone (this time you can use any browser) and follow the instructions. You should be able to play with the "machine" (desktop) from your mobile phone.

Note1 : Enable Wifi connection in your smartphone. If you don't have a good bandwith, you will experiment strange behaviours.
Note2 : If you don't have any smartphone, just open the given URL in a new tab. It is not so beatiful but is much more handy.

How it works
--------------
Basically the machine (the application on your desktop browser) opens a communication channel with the player( mobile phone) that let the server receive and send messages inbetween them in nearly real time. Now we can use the phone as a gamepad and update the game in real time.

In the code side, we need to create a channel from the Google App Engine javascript Channel API. This is made at ConnectionClass ( there is one Connection for each side: one for machine and one for player ). Once we have the connection ready, we can send messages between machine and player. We have to take care that each message pass through our server, and he handles were to distribute it. 

In the very first step ( when we first open the "machine" and ask the server for a Channel ), the server creates a unique identifier for our Channel (the token) and gives the machine a unique identifier to identify that user. We create a url with some get parameters that let us identify players when they connect to our server. When a new player is connected, the server just give him a new identifier, without modifying the token. 

We store the actual state of the game in the server ( initialized, ready, ongame, lose, etc... ). This is send at the same time to all the ConnectionClass instances, and each player and machine updates its state accordingly. In the other side, both machine and player send messages to the server whenever a button is pressed or when the player loses or if the game is ready to start...

More 
--------------
For further information on how the game was made please read the [documentation](http://2.kujenga-pamoja.appspot.com/docs/docs.html).

Resources
---------
### Libraries
The incredible [THREE.js](http://threejs.org/) for WebGL and 3D.

[Physijs](http://chandlerprall.github.io/Physijs/) for physics integration in THREE.

[Google App Engine Channel](https://developers.google.com/appengine/docs/python/channel/) for socket communications.

[TweenMax](http://www.greensock.com/tag/javascript/)

[jQuery](http://jquery.com/)

[Closure compiler](https://developers.google.com/closure/compiler/) to compress the code. Really useful.

Hosted on [Google App Engine](https://developers.google.com/appengine/)

### Fonts :
[Commando](http://www.fontsquirrel.com/fonts/Commando)[CC BY-SA 3.0](http://creativecommons.org/licenses/by-nc-sa/3.0/).

### Music and sounds :
[Lift](http://www.flashkit.com/soundfx/Interfaces/Blips/Lift_Me_-Vyachesl-8596/index.php)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)

[Click](http://www.flashkit.com/soundfx/Interfaces/Clink-Intermed-476/index.php)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)

[Fairyland](http://www.freesound.org/people/AlienXXX/sounds/82328/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)

[Life Lost](http://www.freesound.org/people/noirenex/sounds/159408/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)

[8bit Coin](http://www.freesound.org/people/timgormly/sounds/170147/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)

[Coinup](http://www.freesound.org/people/mattwasser/sounds/58919/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)

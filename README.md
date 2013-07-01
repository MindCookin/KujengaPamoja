Kujenga Pamoja
============

About the game
--------------
Kujenga Pamoja is a kind of tribute to "Jenga", the block playing game. In fact, "Jenga" means "built" in Suajili, and "Kujenga Pamoja" means "build together".

This said, the idea was to create a multiplayer experience based on the use of socket communications, connecting mobile phones with a desktop application, using the phones like a gamepad while desktop application acts like the machine/console. 

How to play
--------------
First of all, open kujenga-pamoja.appspot.com in Chrome( at this time, it is not avalaible in other browsers ). You will be presented with an URL. Introduce the URL in your smartphone (this time you can use any browser) and follow the instructions. You should be able to play with the "machine" (desktop) from your mobile phone.

Note1 : Enable Wifi connection in your smartphone. If you don't have a good bandwith, you will experiment strange behaviours.
Note2 : If you don't have any smartphone, just open the given URL in a new tab. It is not so beatiful but is much more handy.

Technical issues
--------------
The language I chose was javascript, the native language to use with HTML5's canvas 3D context. That means that Kujenga Pamoja is a web application and will only run within a browser. In fact, actually it's only running in Chrome, because THREE.js WebGLRenderer is not supported in other browser.

THREE.js abstracts WebGL plain code, and is much easier to develop than plain WebGL. Udacity's [Interactive 3D Graphics course](https://www.udacity.com/course/cs291) uses this library, and basically I learn nearly all I know of THREE from this course. [Physijs](http://chandlerprall.github.io/Physijs/) was my physics engine pick. Well it is not really a physics engine, it is a layout over [Ammo.js](https://github.com/kripken/ammo.js/) that implements methods for THREE.js development.

For interactive mobile communications I chose [Google App Engine Channel](https://developers.google.com/appengine/docs/python/channel/). It creates a socket and stablish open communications from client to server and reverse. Easy to start with and easy to use. To use it I need my project to be hosted on [Google App Engine](https://developers.google.com/appengine/). I chose Python for my server language (I didn't use it before) and it was a really good surprise. As a front-end developer, I enjoyed very much the sintaxis.

I didn't work with HTML5's 3D context before, and neather with sockets, so I have to thank these tools developers to make them so easy to use.

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

### Game Design and Source Code and Graphics
Kujenga Pamoja by Santiago Bernabé García ( [Mind Cookin](http://mindcookin.com) )[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)

### Fonts :
[Commando](http://www.fontsquirrel.com/fonts/Commando)[CC BY-SA 3.0](http://creativecommons.org/licenses/by-nc-sa/3.0/).

### Music and sounds :
[Lift](http://www.flashkit.com/soundfx/Interfaces/Blips/Lift_Me_-Vyachesl-8596/index.php)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
[Click](http://www.flashkit.com/soundfx/Interfaces/Clink-Intermed-476/index.php)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
[Fairyland](http://www.freesound.org/people/AlienXXX/sounds/82328/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
[Life Lost](http://www.freesound.org/people/noirenex/sounds/159408/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
[8bit Coin](http://www.freesound.org/people/timgormly/sounds/170147/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)
[Coinup](http://www.freesound.org/people/mattwasser/sounds/58919/)[CC BY 3.0](http://creativecommons.org/licenses/by/3.0/)


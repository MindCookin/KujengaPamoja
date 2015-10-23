java -jar compiler.jar --js=ext/OrbitControls.js --js=ext/SoundManager.js --js=ext/EventBus.js --js=src/connections.js --js=src/scene.js --js=src/gameplay.js --js=src/constants.js --js=src/desktopPlayer.js --js=src/machine.js --js_output_file=machine-min.js --language_in=ECMASCRIPT5 --compilation_level=SIMPLE_OPTIMIZATIONS
java -jar compiler.jar --js=ext/EventBus.js --js=src/connections.js --js=src/constants.js --js=src/player.js --js_output_file=player-min.js --language_in=ECMASCRIPT5 --compilation_level=SIMPLE_OPTIMIZATIONS
echo Compressed like a chicken sandwich

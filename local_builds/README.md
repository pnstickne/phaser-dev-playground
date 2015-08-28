JavasSript files located in this directory in the form of

   phaser-?{version}.js

are treated as local Phaser builds. These versions will be exposed in the list of available Phaser versions to run against. 

An easy way to automate placing a build here from the local development Phaser git repository, use a build as:

    grunt build && cp build/phaser.js path_to_playground/local_builds

JavasSript files located in this directory in the form of `phaser.js` or in a subdirectory, `{version}\phaser.js` are treated as local Phaser builds. The version can be any useful tag such as an actual version number, SHA, build date, etc..

These versions will be exposed in the list of available Phaser versions to run against. 

An easy way to automate placing a build here from the local development Phaser git repository, use a build as:

    grunt build && cp build/phaser.js path_to_playground/local_builds

JavaScript files located in this directory (or `{version}` subdirectory) are treated as Phaser Plugins and are loaded automatically whenever the relevant local version is selected. If a Plugin occurs in the main directory, but not in the `{version}` directory, then it will be used. Otherwise Plugins will also be loaded from the relevant `{version}` path.

# Phaser Examples - Developer Playground

This repository maintains previous local functionality found in the [Phaser Examples][examples] repository and is designed to allow *fast/local developer interaction*.

This repository links the Phaser Examples via a Git Submodule but does not otherwise contain Phaser example code.

If new to Phaser or not doing local development, the [Online Phaser Examples][online-examples] may be a better place to start. The Phaser framework itself [can be found here][phaser].


## Learn By Example

Phaser comes with an ever growing suite of [Examples][examples].These examples can be interacted with and even edited/created [in the online Phaser demo site][online-examples].  

This repository allows these demos to also be run locally.

The examples need to be run through a local web server (in order to avoid file access permission errors from your browser). You can use your own web server, or start the included web server using grunt.

Using a locally installed web server browse to the examples folder:

    examples/index.html

Alternatively in order to start the included web server, after you've cloned the repo, run `npm install` to install all dependencies, then `grunt connect` to start a local server. After running this command you should be able to access your local webserver at `http://127.0.0.1:8001`. Then browse to the examples folder: `http://127.0.0.1:8001/examples/index.html`

There is a 'Side View' example viewer as well as the default. This loads all the examples into a left-hand frame for faster navigation.


## Contributing

1. Write some code
2. Submit a Pull Request


## Bugs?

Please add them to the [Playground Issue Tracker][issues] with as much info as possible.


## About Phaser

Phaser is a fast, free and fun open source game framework for making desktop and mobile browser HTML5 games. It uses [Pixi.js][pixijs] internally for fast 2D Canvas and WebGL rendering.

By Richard Davey, [Photon Storm](http://www.photonstorm.com)

## License

Phaser and all examples are released under the [MIT License](http://opensource.org/licenses/MIT). This does not include any assets (art, music, sounds)

[issues]: https://github.com/pnstickne/phaser-examples-playground
[examples]: https://github.com/photonstorm/phaser-examples
[online-examples]: http://examples.phaser.io
[phaser]: https://github.com/photonstorm/phaser
[pixijs]: https://github.com/GoodBoyDigital/pixi.js 


# Phaser Examples - Developer Playground

This repository maintains previous local functionality found in the [Phaser Examples][examples] repository and is designed to allow *fast/local developer interaction*.

The Playground is designed to interact well with local Phaser and Phaser Examples but does not contain any Phaser framework or example code.

If new to Phaser and not doing development on the core framework or examples, the [Online Phaser Examples][online-examples] may be a better place to start. The Phaser framework itself [can be found here][phaser].

The Playground allows these demos to also be run locally and provides an environment useful for development or when running against local changes. Some of the changes / differences are:

- Supports *local Phaser builds*
- Remote Phaser builds are cached for *offline development*
- Runs against *local Example repository*
- *Reduced UI decorations*; no social or sharing support
- *No iframe* is used to hold game content
- Phaser is *loaded as a synchronous script* (without XHR)
- Only targets *non-minified* Phaser builds

A local Node.js-Express server is used to host resources to avoid all sorts of ugly CORS issues; the server also combines necessarying resource and API calls.

## Getting Started

First pull a local copy of the [Phaser Example][examples] repository.

To start the Example playground open a Node.js-compatible terminal.

Then navigate to the playground root directory and start the default grunt task:

    grunt

This will start the local which can be accessed by navigating to http://localhost:3000/index.html

By default the the examples will be searched for in a sibling repository called 'phaser-examples', for example if the Playground is in '$/repos/playground' then the examples will be looked for in '$/repos/phaser-examples'.

To change this, specify a different location to find the examples:

   PHASER_EXAMPLES=path_to_example_repo grunt

To run use a local Phaser build, simply move the Phaser.js file into '$playground_repo/local_builds'. This can be done 'automatically' after building Phaser (from the Phaser repository) by using:

    grunt build && cp builds/Phaser.js $playground_repo/local_builds

Multiple local builds are supported as long as they are given unique names in the form Phaser-{some_label}.js. There is no support for minified Phaser builds.

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


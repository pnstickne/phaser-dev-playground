# Phaser Examples - Playground

This [Phaser Example Playground][playground] (or simply 'Playground') maintains and enhances functionality previously found in the [Phaser Examples][examples] repository. It is designed to allow *fast local developer interaction* with the [Phaser framework][phaser], Phaser Examples, and to complement other resources.

If new to Phaser and not doing development on the core framework or examples, the [Online Phaser Examples][online-examples] or [Online Phaser Sandbox][sandbox] may be better places to start.

## Why the Playground?

The Playground is designed to interact well with local [Phaser][phaser] and [Phaser Examples][example] git repositories; it does not contain any Phaser framework or example code itself.

The Playground allows the Phaser examples to be run locally and provides an environment useful for development and running against local changes. The Playground is specially designed for working on *local builds* of Phaser or *local modifications* to the Phaser example repository.

Some of the differences between the Online Examples are:

- Supports *local Phaser builds*
- Remote Phaser builds are cached for *offline development*
- Runs against a *local Example repository*
- *Reduced UI decorations*; no social or sharing support
- *No iframe* is used to hold game content
- Phaser is *loaded as a synchronous script* (without XHR)
- Uses *full (non-minified) Phaser builds*

A local Node.js-Express server is used to host resources to avoid all sorts of ugly CORS issues; the server also combines necessarying resource and API calls.

## Getting Started

First clone/pull a local copy of the [Phaser Example][examples] repository. This is required because the Playground does *not* include any of the Phaser examples.

To start the Example playground open a Node.js-compatible terminal and then navigate to the playground root directory. The Node.js-Express server can then be started with the default grunt task:

    grunt

This will start the local which can be accessed by navigating to http://localhost:3000/index.html

By default the the examples will be searched for in a sibling repository called 'phaser-examples', for example if the Playground is in '$/repos/playground' then the examples will be looked for in '$/repos/phaser-examples'.

To change this, specify a different location to find the examples:

    PHASER_EXAMPLES=path_to_example_repo grunt

To use a local / custom Phaser build, simply move the 'phaser.js' file into '$/repos/playground/local_builds'. This can be done in an automated fashion when performing a Phaser build by using:

    # (remember: do this in the Phaser repository)
    grunt build && cp builds/Phaser.js $/repos/playground/local_builds

Multiple local builds are supported as long as they are given unique names in the form 'phaser-{some_label}.js'. Because the Playground is designed for development, there is no support for minified builds or map files.

## Contributing

1. Write some code

2. Submit a Pull Request

## Bugs?

Please add them to the [Playground Issue Tracker][issues] with as much info as possible.

## About Phaser

Phaser is a fast, free and fun open source game framework by Richard Davey of [Photon Storm](http://www.photonstorm.com) for making desktop and mobile browser HTML5 games. It uses [Pixi.js][pixijs] internally for fast 2D Canvas and WebGL rendering.

## License

The Phaser, Phaser Examples, and the Phaser Playground are released under the [MIT License](http://opensource.org/licenses/MIT); this does *not* include any assets (art, music, sounds) that may be found within.

[playground]: https://github.com/pnstickne/phaser-examples-playground
[issues]: https://github.com/pnstickne/phaser-examples-playground/issues
[examples]: https://github.com/photonstorm/phaser-examples
[online-examples]: http://examples.phaser.io
[phaser]: https://github.com/photonstorm/phaser
[pixijs]: https://github.com/GoodBoyDigital/pixi.js 


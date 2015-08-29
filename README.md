# Phaser Examples - Playground

This [Phaser Example Playground][playground] (or simply 'Playground') maintains and enhances functionality previously found in the [Phaser Examples][examples] repository. It is designed to allow *fast local developer interaction* with the [Phaser framework][phaser], Phaser Examples, and to complement other resources.

If new to Phaser, and not doing development on the core framework or examples, the [online Phaser Examples][online-examples] or [online Phaser Sandbox][online-sandbox] may be better places to start.

## Why the Playground?

The Playground is designed to interact well with local [Phaser][phaser] and [Phaser Examples][examples] git repositories; it does not contain any Phaser framework or example code itself.

The Playground allows Phaser Examples to be run locally and provides an environment taylored towwards development and testing local changes. The Playground is specially designed for working on *local builds* of Phaser or *local modifications* to the Phaser Example repository.

Some of the differences between the online Examples are:

- Supports *local Phaser builds* - great for expirimenting with core changes
- Remote Phaser builds are cached for *offline development*
- Runs against a *local Example repository*
  - New examples can be added by creating new files/directories
- *Reduced UI decorations*
  - No social or sharing support
- *No iframe* is used to hold game content
- Phaser is *loaded as a synchronous script*, without XHR
  - Loads *full (non-minified) Phaser builds*
- *Save/persist example modifications* using browser localStorage

A local Node.js-Express server is used to host resources to avoid all sorts of ugly CORS issues; the server also takes care of supplying resources in a unified manner, caching external data, and exposing Playground-specific API calls.

## Getting Started

First clone/pull a local copy of the [Phaser Example][examples] repository. This is required because the Playground does *not* include any of the Phaser examples.

To start the Example playground open a Node.js-compatible terminal and then navigate to the playground root directory. The Node.js-Express server can then be started with a grunt task:

    grunt play

This will start the local which can be accessed by navigating to **http://localhost:3000/index.html**

By default the the examples will be searched for in a sibling repository called 'phaser-examples', for example if the Playground is in '$/repos/playground' then the examples will be looked for in '$/repos/phaser-examples'.

To change this, specify a different location to find the examples:

    PHASER_EXAMPLES=path_to_example_repo grunt play

To use a local / custom Phaser build, simply move the 'phaser.js' file into '$/repos/playground/local_builds'. This can be done in an automated fashion when performing a Phaser build by using:

    # Remember: do this in the Phaser repository
    grunt build && cp builds/phaser.js $/repos/playground/local_builds

Multiple local builds are supported as long as they are given unique names in the form 'phaser-{some_label}.js'. Because the Playground is designed for development, and debugging of such, there is no support for minified builds or map files.

## Contributing

1. Write some code

   - Add a feature, fix a bug, or improve existing code

   - Make sure it passes `grunt lint` - "When in Rome.."

2. Submit a Pull Request

## Bugs?

Please add them to the [Playground Issue Tracker][issues] with as much info as possible.

## About Phaser

Phaser is a fast, free and fun open source game framework by Richard Davey of [Photon Storm](http://www.photonstorm.com) for making desktop and mobile browser HTML5 games. It uses [Pixi.js][pixijs] internally for fast 2D Canvas and WebGL rendering.

## License

The Phaser, Phaser Examples, and the Phaser Playground are released under the [MIT License](http://opensource.org/licenses/MIT); this does *not* necessarily include any assets (art, music, sounds) that may be found within.

[playground]: https://github.com/pnstickne/phaser-examples-playground
[issues]: https://github.com/pnstickne/phaser-examples-playground/issues
[examples]: https://github.com/photonstorm/phaser-examples
[online-examples]: http://examples.phaser.io
[online-sandbox]: http://phaser.io/sandbox
[phaser]: https://github.com/photonstorm/phaser
[pixijs]: https://github.com/GoodBoyDigital/pixi.js 


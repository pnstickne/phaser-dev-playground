# Phaser dev:Playground

The [Phaser dev:Playground][playground] project (or simply 'Playground') maintains and enhances functionality previously found in the [Phaser Examples][examples] repository. It is designed to allow *fast local developer interaction* with the [Phaser framework][phaser], Phaser Examples, and to complement other resources.

If new to Phaser, and not doing development on the core framework or examples, the [online Phaser Examples][online-examples] or [online Phaser Sandbox][online-sandbox] may be better places to start.

The Playground requires [Node.js][nodejs] and some knowledge of the Node console.

## Why dev:Playground?

The Playground is designed to interact well with local [Phaser][phaser] and [Phaser Examples][examples] git repositories; it does not contain any Phaser framework or example code itself.

The Playground allows Phaser Examples to be run locally and provides an environment taylored towards development and testing local changes. The Playground is specially designed for working on *local builds* of Phaser or *local modifications* to the Phaser Example repository.

Some of the differences between the [online Examples][online-examples] (which is a great site, but serves a different role) are:

- Supports *local Phaser builds* - great for expirimenting with core changes
- Remote Phaser builds are cached for *offline development*
- Runs against a *local Example repository*
  - New examples can be added by creating new files/directories
- *Reduced UI decorations*
  - No social or sharing support
- *No iframe* is used to hold/host Game content
- Phaser is *loaded as a synchronous script*, without XHR
  - Loads *full (non-minified) Phaser builds*
- *Save/persist example modifications* using browser localStorage
- The *only* server dependency is Node.js - no PHP or other server required

A local Node.js-Express server is used to host resources as it is not feasible to run Phaser off of a 'file:' URL due to CORS issues and security restrictions; the Express server also takes care of supplying resources in a unified manner, caching external data, and exposing Playground-specific API calls.

## Getting Started

First clone a local copy of the [Phaser Example][examples] repository. This is required because the Playground does *not* include any of the Phaser examples.

To start the Playground open a Node.js terminal and navigate to the root directory of the Playground repository (henceforth refered to as `$/repos/playground`).

The first task to fetchi and update the required Node Package dependencies:

    cd $/repos/playground
    npm install

After the dependencies are installed, simple start the Node.js-Express server:

    grunt play

This will start the hosting server which can be accessed by navigating to `http://localhost:3000/index.html`. (Warning: this server is *not* designed for public access.)

By default the the Examples will be searched for in a sibling repository called 'phaser-examples', for example if the Playground repository is `$/repos/playground` then the examples will be looked for in `$/repos/phaser-examples`.

To change the location used to find the Examples use:

    PHASER_EXAMPLES=path_to_example_repo grunt play
    # or:
    grunt play --phaser-examples=path_to_example_repo

### Editing Examples 

The Playground uses the [CodeMirror][codemirror] editor and all examples are immediatly editable.

The 'Save and Run Code' button saves the changes *to the browser's localStorage*. The changes will remain in effect until the 'Discard Changes' button is pressed. Changes 'saved' in this manner are *not* persisted to the Example repository.

The examples in the Examples repository can also be edited directly on disk. After saving the changes in a local editor simply reload the example webpage. (Note: browser edits *must* be discarded for the changes to show up.)

#### Adding and Removing Examples

To add a new example or remove an existing example just add or remove the file from the linked Example repository (eg. `$/repos/phaser-examples`). The change will be reflected when the example list page is reloaded. Examples can also be renamed or moved.

The Playground lists all example folders and files it finds. Some example categories such as `wip` will show up even though most of these "Work In Progress" examples are incomplete; such categories are *not* included the online Example site.

There is no need to manually update any JSON metadata file.

### Managing listed Phaser Builds

#### Using Local Phaser Builds

To use a local / custom Phaser build, simply move the built `phaser.js` file into `$/repos/playground/local_builds`. This can be done in an automated fashion when performing a Phaser build by using:

    cd $/repos/phaser
    # Remember: do this in the Phaser repository
    grunt build && cp builds/phaser.js $/repos/playground/local_builds

Multiple local builds are supported as long if they are put in a subdirectory in the form `some_label/phaser.js`. The "some_label" can be any useful (and filesystem-valid) mnemonic but it should be short. Because the Playground is designed for development, and debugging of such, there is no support for minified builds or map files. See the documentation local_builds/README.md for more details.

The new or updated local build will be avialable/used the next time the example page is refreshed.

#### Link a new Remote Build

Edit the `conf/phaser_builds.json` file. Follow the example of the "2.2.2-box2d" build to add a new remote build.

The remote Phaser library is cached the first time it is requested; make sure to clear the `cache` if the remote file changes.

#### Hide an Existing Official Phaser Builder

Official Phaser Builds, as determined by GitHub tags, can be prevented from being listed in the Version selector. This is useful to suppress obsolete/uninteresting builds or known-broken builds. Simply edit the `conf/phaser_buiods.json` file, adding an entry matching the given version Tag as request, and specify `obsolete:true`.

By default there are several version excluded, such as those prior to the 1.0 release.

### Caching and Offline Access

The `cache` directory is used for various caching purposed. If caching goes terribly wrong then delete the contents of this folder and restart the Playground server.

The first time a published Phaser build is used it is downloaded from rawgit and stored in the cache folder. The cached version will continue to remain available without internet access.

Access to the github API, such as when determine the latest Phaser builds, is also cached for a short time; a stale-copy will be returned in offline scenarios.

## Contributing

1. Fork the github repository

2. Write code!

   - Add a feature, fix a bug, or improve existing code

   - Make sure it passes `grunt lint` - "When in Rome.."

     (if there is a a good reason to ignore a rule, or would like a new rule added, it can be discussed)

3. Submit a Pull Request

   - Squash many commits into one (or several) relevant commits

   - *No good PR refused* - but be mindful of feedback

## Bugs?

Please add them to the [Playground Issue Tracker][issues] with as much info as possible.

## About Phaser

Phaser is a fast, free and fun open source game framework by Richard Davey of [Photon Storm](http://www.photonstorm.com) for making desktop and mobile browser HTML5 games. It uses [Pixi.js][pixijs] internally for fast 2D Canvas and WebGL rendering.

## License

The Phaser, Phaser Examples, and the Phaser Playground are released under the [MIT License](http://opensource.org/licenses/MIT); this does *not* necessarily include any assets (art, music, sounds) that may be found within.

[playground]: https://github.com/pnstickne/phaser-dev-playground
[issues]: https://github.com/pnstickne/phaser-examples-playground/issues
[examples]: https://github.com/photonstorm/phaser-examples
[online-examples]: http://examples.phaser.io
[online-sandbox]: http://phaser.io/sandbox
[phaser]: https://github.com/photonstorm/phaser
[pixijs]: https://github.com/GoodBoyDigital/pixi.js 
[nodejs]: https://nodejs.org
[codemirror]: https://codemirror.net/

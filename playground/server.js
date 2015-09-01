"use strict";

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var util = require('util');
var uuid = require('uuid');

var EXAMPLE_PATH = process.env.EXAMPLE_PATH;
var PORT = process.env.PORT;

var example_root = path.join(EXAMPLE_PATH, 'examples');
var playground_root = path.resolve('playground');
var cache_root = path.resolve('cache');
var local_root = path.resolve('local_builds');

app.get('/', function (req, res)
{
  res.send('Hello World!');
});

var flatCache = require('flat-cache');
var cache = flatCache.load('git_api_cache', cache_root);

var Rx = require('rx');

Rx.Observable.prototype.toNodeCallback = function (cb) {
  var value;
  this.subscribe(
    function (x) { value = x; },
    function (err) { cb(err); },
    function () { cb(null, value); });
};

// Returns Obs<build_info>
function getLocalBuilds ()
{
  var readdir = Rx.Observable.fromNodeCallback(fs.readdir);

  return readdir(local_root).flatMap(function (names) {
    return names.map(function (name) {
      var m = name.match(/^(?:phaser|phaser-(.*))[.]js$/i);
      if (m)
      {
        var localName = m[1] ? 'local.' + m[1] : 'local';
        return {
          name: localName,
          sha: null,
          type: 'file'
        };
      }
    })
    .filter(function (build) {
      return !!build;
    });
  });
}

// build_info:
// - name
// - sha (only from git)
// - type: branch, tag, local, remote
// - url

// returns Obs<build_info>
function getRemoteBuilds ()
{

  var buildTime = cache.getKey('remote_builds_fetched_at');
  var forceFetch = buildTime && (+buildTime + 5 * 60 * 1000) < +Date.now();

  var builds = cache.getKey('remote_builds');
  if (!forceFetch && builds) {
    return Rx.Observable.from(builds);
  }

  console.log("Updating remote build information");

  var request = require('request-json');
  var client = request.createClient('https://api.github.com');

  var getRx = Rx.Observable.fromNodeCallback(client.get, client, function (response, body) {
      return {response: response, body: body};
    });

  // returns Obs<build_info[]>
  function remoteBranchCollection ()
  {
    return getRx('repos/photonstorm/phaser/branches?per_page=100')
      .map(function (r) {

        var items = r.response.statusCode === 200 ? r.body : [];
        return items.map(function (item) {
          var versionName = item['name'];
          var sha = item['commit']['sha'];
          return {
            name: versionName,
            sha: sha,
            url: util.format("https://cdn.rawgit.com/photonstorm/phaser/%s/build/phaser.js", sha),
            type: 'branch'
          }
        });
      });
  }

  // returns Obs<build_info[]>
  function remoteTagCollection ()
  {
    return getRx('repos/photonstorm/phaser/git/refs/tags?per_page=100')
      .map(function (r) {

        var items = r.response.statusCode === 200 ? r.body : [];
        return items
          .filter(function (item) {
            return !!item['ref'];
          })
          .map(function (item) {
            var versionName = item['ref'].replace(/^refs\/tags\//, '');
            var sha = item['object']['sha'];
            return {
              name: versionName,
              sha: sha,
              url: util.format("https://cdn.rawgit.com/photonstorm/phaser/%s/build/phaser.js", sha),
              type: 'tag'
            }
          });
      });
  }

  var allCollections = [];

  return Rx.Observable.concat(
      remoteBranchCollection(),
      remoteTagCollection()
    )
    // Side-effect / save stream when complete
    .tap(function (x) {
      allCollections.push(x);
    })
    .tapOnCompleted(function () {
      console.log('Caching remote build information');
      var allBuilds = Array.prototype.concat.apply([], allCollections); // aka flatMap(identity)
      cache.setKey('remote_builds', allBuilds);
      cache.setKey('remote_builds_fetched_at', +Date.now());
      cache.save();
    })
    .tapOnError(function (err) {
      console.warn('Failed to get remote information (using cache if available)');
    })
    // Use cache if needed
    .catch(Rx.Observable.from([builds ? builds : []]))
    // Obs<build_info[]> -> Obs<build_info>
    .flatMap(function (m) {
      return m;
    });
}

function cleanupBuilds (builds) {
  function flatMap(arr, fn) {
    return Array.prototype.concat.apply([], arr.map(fn));
  }

  return flatMap(builds, function (build) {
      if (build.name === 'v2.4.0') {
        return [];
      }
      if (build.name === 'master') {
        return [{
          name: '2.2.2.box2d.min',
          url: 'http://examples.phaser.io/_site/phaser/phaser.2.2.2.box2d.min.js'
        }, build]
      }
      else {
        return [build];
      }
    });
}

// returns Obs<build_info[]>
function getBuilds ()
{
  return Rx.Observable
    .merge(
      getLocalBuilds(),
      getRemoteBuilds())
    .reduce(function (prev, build) {
      prev.push(build);
      return prev;
    }, [])
    .map(cleanupBuilds);
}

// Returns a list of the available phaser versions that can
// be serviced. The actual JS may still need to be downloaded.
app.get('/phaser/versions', function (req, res, next)
{

  function haveBuilds (err, builds)
  {
    if (!err)
    {
      res.send({versions: builds});
    }
    else
    {
      next(err);
      return;
    }
  }

  getBuilds().toNodeCallback(haveBuilds);

})

function serveLocalPhaserVersion (req, res, next, version)
{

  var filename = version != null ? util.format("phaser-%s.js", version) : "phaser.js";
  var filePath = path.join(local_root, filename);

  console.warn("Serving local phase");
  var readStream = fs.createReadStream(filePath);

  readStream.on('error', function (err)
  {
    console.log('Failed to read local Phaser build: %s', filePath);
    next(err);
  });

  readStream.pipe(res);

}

// Scan the example directory and build metadata out of it
function buildExampleMetadata (root, cb)
{

  var exampleGroups = {};

  fs.readdirSync(example_root).forEach(function (name)
  {
      var filePath = path.join(example_root, name);
      var stat = fs.statSync(filePath);

      if (stat.isDirectory() && !name.match(/^[_.]/))
      {
        var exampleGroup = [];
        exampleGroups[name] = exampleGroup;

        fs.readdirSync(filePath).forEach(function (name)
        {
          var m = name.match(/^(.*)[.]js$/);
          if (m)
          {
            var encodedFilename = encodeURIComponent(name);
            encodedFilename = encodedFilename.replace(/%20/g, '+');
            exampleGroup.push({
              file: encodedFilename,
              title: m[1]
            });
          }
        });
      }
  });

  cb(null, exampleGroups);
}

// Fetch/build the example metadata
app.get('/examples/examples.json', function (req, res, next)
{

  buildExampleMetadata(example_root, function (err, examples)
  {
    if (err)
    {
      next(err);
      return;
    }

    res.send(examples);
  });

});

// relFile - local name of resource, without cache/root path
// url - resource to fetch if there is no cached copy
// returns Obs<{file:/*actual file path*/}
function downloadAndCacheFile (relFile, url) {

  function downloadFile (file, url, cb) {
    var request = require('request');

    console.warn("Downloading %s from %s", file, url);

    var tempFile = path.join(cache_root, util.format("_%s", uuid.v4()));

    var writeStream = fs.createWriteStream(tempFile);

    writeStream.on('error', function (err) {
      console.warn("Unable to download file: %s", err);

      try { fs.unlinkSync(tempFile); }
      catch (e) { /*  Don't care */ }

      cb(err);
    });

    writeStream.on('finish', function () {
      console.warn("File downloaded");

      try { fs.renameSync(tempFile, file); }
      catch (e)
      {
        try { fs.unlinkSync(tempFile); }
        catch (e) { /* Don't care */ }
      }

      cb(null, file);
    });

    request(url).pipe(writeStream);
  }

  return Rx.Observable.of({
      file: path.join(cache_root, relFile),
      url: url
    })
    .concatMap(function (v) {
      try {
        fs.statSync(v.file);
        // File exists
        return Rx.Observable.of({
          file: v.file
        });
      }
      catch (e) {
        // Download file
        return Rx.Observable
          .fromNodeCallback(downloadFile)(v.file, v.url)
          .share()
          .map(function (file) {
            return {
              file: file
            }
          });
      }
    });
}

// Fetch a specific Phaser script version
// The Phaser Version is ultimately fetched from Git (or perhaps a local path)
// but cached locally for future offline access.
//   version: a short version name such as '4.3.1', 'master', or 'local'
app.get('/phaser/phaser-:version.js', function (req, res, next)
{
  getBuilds()
    .subscribe(function (builds) {

      var versionName = req.params.version;

      var m = versionName.match(/^local(?:[.](.*))?$/);
      if (m) {
        serveLocalPhaserVersion(req, res, next, m[1]);
        return;
      }      

      var targetBuild = builds.filter(function (version)
      {
        return version.name === versionName;
      })[0];

      if (!targetBuild) {
        next("No target version found: " + versionName);
        return;
      }

      // The specific SHA is used in the CDN url to avoid stale cahce pulls, mainly with branch names.
      // The URL could also use the non-CDN rawgit but the SHA information is already available.
      var sha = targetBuild.sha;
      var buildUrl = targetBuild.url;
      var relFile = sha
        ? util.format("phaser-%s-%s.js", versionName, sha)
        : util.format("phaser-%s.js", versionName);

      downloadAndCacheFile(relFile, buildUrl)
        .take(1) // Should only be 1 ..
        .subscribe(function (v) {
          var file = v.file;

          console.warn("Serving file: %s", file);

          var readStream = fs.createReadStream(file);
          readStream.on('error', function (err) {
            console.log('error in reading (after fetch)');
            next(err);
          });

          res.setHeader("X-Origin-Resource", buildUrl);
          readStream.pipe(res);

        }, function (err) {
          next(err);
        });

    }, function (err) {
      next(err);
    });

});

var server = app.listen(PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Playground server listening at http://%s:%s', host, port);
  console.log('  EXAMPLE_PATH: %s', example_root);
  console.log('     SITE_PATH: %s', playground_root);
  console.log('     CAHE_PATH: %s', cache_root);
  console.log('  LOCAL_BUILDS: %s', local_root);
});

app.use('/', express.static(playground_root));

app.use('/assets', express.static(path.join(example_root, 'assets')));
app.use('/examples', express.static(example_root));

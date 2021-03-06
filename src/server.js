"use strict";

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var util = require('util');
var uuid = require('uuid');

var EXAMPLE_PATH = process.env.EXAMPLE_PATH || '../phaser-examples';
var PORT = process.env.PORT || '3000';

var example_root = path.join(EXAMPLE_PATH, 'examples');
var playground_root = path.resolve('playground');
var cache_root = path.resolve('cache');
var local_root = path.resolve('local_builds');

var mustacheExpress = require('mustache-express');

app.engine('mustache', mustacheExpress());

app.set('json spaces', 2);

app.set('view engine', 'mustache');

app.set('views', path.join(playground_root, 'views'));

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

// build_info:
// - name
// - sha (only from git)
// - type: branch, tag, local, remote
// - url

// Looks in the "local_builds" directory (and subdirectories) to
// find locally installed/accessible phaser versions.
// Returns Obs<build_info>
function getLocalBuilds ()
{
  return Rx.Observable
    .fromNodeCallback(fs.readdir)(local_root)
    .flatMap(function (names) {
      return names
        .map(function (name) {
          var file = path.join(local_root, name);          
          var stat = fs.statSync(file);
          if (stat.isDirectory())
          {
            // Should really grab first phaser.* javascript file..
            return {
              name: 'local.' + name,
              type: 'local'
            };
          } else if (name.match(/^phaser[.]js$/i)) {
            return {
              name: 'local',
              type: 'local'
            };
          }
        })
        .filter(function (build) {
          return !!build;
        });
    });
}

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

  var getRx = Rx.Observable
    .fromNodeCallback(client.get, client, function (response, body) {
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

  return Rx.Observable
    .zip(
      remoteBranchCollection(),
      remoteTagCollection()
    )
    .flatMap(function (m) { return m; })
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
      console.warn('Failed to get remote information (using cache if available): %s', err);
    })
    // Use cache if needed
    .catch(Rx.Observable.from([builds ? builds : []]))
    // Obs<build_info[]> -> Obs<build_info>
    .flatMap(function (m) {
      return m;
    });
}

var target_builds = require('../conf/phaser_builds.json');

// Given an array of build information return a array of build information.
// This can include sorting, removing builds, or adding new builds.
function cleanupBuilds (builds) {

  var buildsByName = {};
  builds.forEach(function (build) {
    buildsByName[build.name] = build;
  });

  // Ref. http://stackoverflow.com/a/15040626/2864740
  var extend = require('util')._extend;

  target_builds.builds.forEach(function (buildConf) {
    // Add new build as required
    var build = buildsByName[buildConf.name];
    if (!build) {
      build = buildsByName[buildConf.name] = {};
      builds.push(build);
    }
    // Copy over properties (all primitives)
    extend(build, buildConf);
  });

  return builds
    .filter(function (build) {
      return !build.obsolete;
    })
    .sort(function (a, b) {

      function cmpDesc (_a, _b) {
        return _a > _b ? -1 : (_b > _a ? 1 : 0);
      }

      // Normalize sort information a bit better
      function d (build) {
        var versionMatch = build.name.match(/(\d+)[.](\d+)(?:[.](\d+))?/);
        return {
          name: build.name,
          paddedVersion: versionMatch
            ? util.format("%s-%s-%s",
                ("00" + versionMatch[1]).slice(-2),
                ("00" + versionMatch[2]).slice(-2),
                ("00" + (versionMatch[3] || '')).slice(-2))
            : "",
          isLocal: build.type === 'local',
          isBranch: build.type === 'branch'
        };
      }

      var ax = d(a);
      var bx = d(b);
      var x

      x = cmpDesc(ax.isLocal, bx.isLocal);
      if (x) { return x; }

      x = cmpDesc(ax.isBranch, bx.isBranch);
      if (x) { return x; }

      x = cmpDesc(ax.paddedVersion, bx.paddedVersion);
      if (x) { return x; }

      return cmpDesc(ax.name, bx.name);
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

  getBuilds()
    .toNodeCallback(function (err, builds) {
      if (err) {
        next(err);
        return;
      }

      res.json({versions: builds});
    });

})

function serveLocalPhaserVersion (req, res, next, version)
{

  var filename = version != null ? util.format("%s/phaser.js", version) : "phaser.js";
  var filePath = path.join(local_root, filename);

  console.warn("Serving local phaser: %s", filePath);
  var readStream = fs.createReadStream(filePath);

  readStream.on('error', function (err)
  {
    console.log('Failed to read local Phaser build: %s', filePath);
    next(err);
  });

  readStream.pipe(res);

}

// Returns Rx Observable that scans the example directory and builds metadata out of it.
function getExampleMetadata (root) {

  var readdir = Rx.Observable.fromNodeCallback(fs.readdir);

  return readdir(root)
    .flatMap(function (groupNames) {

      return groupNames
        .map(function (groupName) {

          var groupPath = path.join(root, groupName);

          if (groupName.match(/^[_.]/)
              || !fs.statSync(groupPath).isDirectory()) {
            return;
          }

          return readdir(groupPath)
            .map(function (fileNames) {
              return {
                group: groupName,
                fileNames: fileNames
                  .filter(function (name) {
                    return !!name.match(/.[.]js$/);
                  })
              };
            })
            .filter(function (group) {
              return !!group.fileNames.length;
            });

        })
        .filter(function (readObs) {
          return !!readObs;
        });

    })
    // Rx<Rx<{group:,fileNames:[]}>> -> Rx<{group:,fileNames:[]}>
    .mergeAll()
    // Extract example information from filenames
    .map(function (v) {
      return {
        group: v.group,
        examples: v.fileNames
          .map(function (name) {
            var m = name.match(/^(.*)[.]js$/);
            var title = m[1];

            return {
              file: name,
              title: title
            };
          })
      };
    })
    // -> Rx<{group:,examples:[]}>
    // Group examples together
    .reduce(function (acc, v) {
      acc[v.group] = v.examples;
      return acc;
    }, {});

}

// Fetch/build the example metadata
app.get('/examples/examples.json', function (req, res, next)
{

  function exampleMetadataBuilt (err, groups) {
    if (err) {
      next(err);
      return;
    }

    res.json(groups);
  }

  getExampleMetadata(example_root)
    .toNodeCallback(exampleMetadataBuilt);

});

// relFile - local name of resource relative to the cache/root path
//           if there is a path portion specified it will be created first
// url - resource to fetch if there is no cached copy
// returns Obs<{file:/*actual file path*/}
function downloadAndCacheFile (relFile, url) {

  function downloadFile (file, url, cb) {
    var request = require('request');

    console.warn("Downloading %s from %s", file, url);

    // probably better to use mkdirp module..
    // http://stackoverflow.com/questions/13696148/node-js-create-folder-or-use-existing
    // BROKEN - uses relFile
    var targetDir = path.dirname(relFile, parseInt("766", 8));
    if (targetDir) {
      try {
        fs.mkdirSync(path.join(cache_root, targetDir));
      } catch (e) {
        if (!("" + e).match(/EEXIST/)) {
          cb(err);
          return;
        } else {
          /* Don't care */
        }
      }
    }

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
app.get('/phaser/:version/phaser.js', function (req, res, next)
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
        ? util.format("%s/phaser-%s.js", versionName, sha)
        : util.format("%s/phaser.js", versionName);

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

app.use('/examples/view', function (req, res, next) {
  var opts = {
    root: playground_root
  };

  res.render('view_full');
});

app.use(/\/examples$/, function (req, res, next) {
  var opts = {
    root: playground_root
  };

  res.sendFile('index.html', opts, function (err) {
    if (err) {
      next(err);
      return;
    }
    // Success handled automatically
  });
});

app.use('/js', express.static(path.join(playground_root, 'js')));
app.use('/css', express.static(path.join(playground_root, 'css')));
app.use('/images', express.static(path.join(playground_root, 'images')));
app.use('/fonts', express.static(path.join(playground_root, 'fonts')));

app.use('/examples/src', express.static(example_root));
app.use('/_plugins', express.static(path.join(example_root, '_plugins')));
app.use('/assets', express.static(path.join(example_root, 'assets')));

app.use(/\/$/, function (req, res, next) {
  res.redirect('/examples');
});

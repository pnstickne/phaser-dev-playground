var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');

var EXAMPLE_PATH = process.env.EXAMPLE_PATH;
var PORT = process.env.PORT;

var example_root = path.join(EXAMPLE_PATH, 'examples');
var playground_root = path.resolve('playground');
var cache_root = path.resolve('cache');
var local_root = path.resolve('local_builds');

app.get('/', function (req, res) {
  res.send('Hello World!');
});

var flatCache = require('flat-cache');
var cache = flatCache.load('git_api_cache', cache_root);

function getBuilds (cb) {
  getLocalBuilds(function (err, localBuilds) {
    if (err) {
      cb(err);
      return;
    }
    getRemoteBuilds(function (err, remoteBuilds) {
      if (err) {
        cb(err);
        return;
      }

      var allBuilds = Array.prototype.concat.call([], localBuilds, remoteBuilds);
      cb(null, allBuilds);
    });
  });
}

function getLocalBuilds (cb) {
  var builds = [];

  fs.readdirSync(local_root).forEach(function(name) {
      var filePath = path.join(local_root, name);
      var m = name.match(/^(?:phaser|phaser-(.*))[.]js$/i);
      if (m) {
        var localName = m[1] ? 'local.' + m[1] : 'local';
        builds.push({
          name: localName,
          sha: null
        });
      }
  });

  cb(null, builds);
}

// cb(err, data).
// data - [{sha:sha1, name:branch_or_tag_name}]
function getRemoteBuilds (cb) {

  var buildTime = cache.getKey('remote_builds_fetched_at');
  var forceFetch = buildTime && (+buildTime + (5 * 60 * 1000)) < +Date.now();

  var builds = cache.getKey('remote_builds');
  if (!forceFetch && builds) {
    cb(null, builds);
    return;
  }

  console.log("Updating branch/tag build information from git");

  var request = require('request-json');
  var client = request.createClient('https://api.github.com');

  function remoteBranches (cb) {
    // Hopefully there are never more than 100 tags..
    client.get('repos/photonstorm/phaser/branches?per_page=100', function (err, response, body) {
      if (!err && response.statusCode == 200) 
      {
        var data = body;
        var builds = [];
        var i = data.length;

        while (i--) {
          var item = data[i];
          // The version name is the tag name without the 'v' which was introduced later
          var versionName = item['name'];

          builds.push({
            name: versionName,
            sha: item['commit']['sha']
          });
        }

        cb(null, builds);
      }
      else 
      {
        cb(JSON.stringify(body));
      }
    });    
  }

  function remoteTags (cb) {
    // Hopefully there are never more than 100 tags..
    client.get('repos/photonstorm/phaser/git/refs/tags?per_page=100', function (err, response, body) {
      if (!err && response.statusCode == 200) 
      {
        var data = body;
        var builds = [];
        var i = data.length;

        while (i--) {
          var item = data[i];
          if (item['ref']) {
            var versionName = item['ref'].replace(/^refs\/tags\//,'');

            builds.push({
              name: versionName,
              sha: item['object']['sha']
            });
          }
        }


        cb(null, builds);
      }
      else 
      {
        cb(JSON.stringify(body));
      }
    });
  }

  remoteBranches(function (err, branchBuilds) {
    if (err) {
      cb(err)
      return;
    }

    remoteTags(function (err, tagBuilds) {
      if (err) {
        cb(err);
        return;
      }

      var allBuilds = Array.prototype.concat.call([], branchBuilds, tagBuilds);

      cache.setKey('remote_builds', allBuilds);
      cache.setKey('remote_builds_fetched_at', +Date.now());
      cache.save();

      cb(null, allBuilds);
    });
  });

}

// Returns a list of the available phaser versions that can
// be serviced. The actual JS may still need to be downloaded.
app.get('/phaser/versions', function (req, res, next) {
	
  getBuilds(function (err, builds) {
    if (!err) {
      res.send({versions: builds});
    } else {
      next(err);
    }
  });

})

function serveLocalPhaserVersion(req, res, next, version) {

  var filename = version != null ? "phaser-" + version + ".js" : "phaser.js";
  var filePath = path.join(local_root, filename);

  // var stats;
  // try {
  //   stats = fs.statSync(filePath);
  // } catch (e) {
  //   next(e);
  //   return;
  // }

  console.log('Streaming: ' + filePath);
  var readStream = fs.createReadStream(filePath);

  readStream.on('error', function (err) {
    console.log('Failed to read local Phaser build: %s', filePath);
    next(err);
  });  

  readStream.pipe(res);

}

// Scan the example directory and build metadata out of it
function buildExampleMetadata (root, cb) {

  var exampleGroups = {};

  fs.readdirSync(example_root).forEach(function(name) {
      var filePath = path.join(example_root, name);
      var stat = fs.statSync(filePath);

      if (stat.isDirectory() && !name.match(/^[_.]/)) {
        var exampleGroup = [];
        exampleGroups[name] = exampleGroup;

        fs.readdirSync(filePath).forEach(function (name) {
          var filePath2 = path.join(filePath, name);
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
app.get('/examples/examples.json', function (req, res, next) {

  buildExampleMetadata(example_root, function (err, examples) {
    if (err) {
      next(err);
      return;
    }

    res.send(examples);
  });

});

// Fetch a specific Phaser script version
// The Phaser Version is ultimately fetched from Git (or perhaps a local path)
// but cached locally for future offline access.
//   version: a short version name such as '4.3.1', 'master', or 'local'
app.get('/phaser/phaser-:version.js', function (req, res, next) {
	var request = require('request');

  getBuilds(function (err, builds)
  {
    if (err) {
      next(err);
      return;
    }

    var versionName = req.params.version;

    var m = versionName.match(/^local(?:[.](.*))?$/);
    if (m) {
      serveLocalPhaserVersion(req, res, next, m[1]);
      return;
    }

    var targetVersion = builds.filter(function (version) {
      return version.name === versionName;
    })[0];

    if (!targetVersion) {
      console.log("No target version found: " + versionName);
      next("error");
      return;
    }

    // The specific SHA is used in the CDN url to avoid stale cahce pulls, mainly with branch names.
    // The URL could also use the non-CDN rawgit but the SHA information is already available.
    var targetSha = targetVersion.sha;
    var phaserUrl = "https://cdn.rawgit.com/photonstorm/phaser/" + targetSha + "/build/phaser.js";

    res.setHeader("X-Origin-Resource", phaserUrl);

    //fs.readFile(path.combine(cache_root, 'phaser-' + targetSha + ".js"), "r", function (err, )
    var f = path.join(cache_root, "phaser-" + targetSha + ".js");

    readStream = fs.createReadStream(f);
    readStream.on('error', function (err) {
      console.log('error in reading ' + f + " requesting proxy")
      readStream.unpipe();

      var t = path.join(cache_root, "_" + ((Math.random() * 40000) << 0));
      // Nope, so try to create    
      var writeStream = fs.createWriteStream(t);
      
      writeStream.on('error', function (err) {
        console.log("Unable to write to cache: " + e);

        try {
          fs.unlinkSync(t);
        } catch (e) {
          // Don't care
        }

        next(err);
      });
      
      writeStream.on('finish', function (err) {

        console.log("Remote dowload complete - renaming temp file");

        try {
          fs.renameSync(t, f);
        } catch (e) {
          try {
            fs.unlinkSync(t);
          } catch (e) {
            // Don't care
          }
        }

        readStream = fs.createReadStream(f);
        readStream.on('error', function (err) {
          console.log('error in reading (after fetch)');
          next(err);
        });

        readStream.pipe(res);
      });

      request(phaserUrl).pipe(writeStream);

    });

    // Automatically ends request
    readStream.pipe(res);

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

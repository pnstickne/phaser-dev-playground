var express = require('express');
var app = express();
var path = require('path');

var EXAMPLE_PATH = process.env.EXAMPLE_PATH;
var PORT = process.env.PORT;

var example_root = path.join(EXAMPLE_PATH, 'examples');
var playground_root = path.resolve('playground');

app.get('/', function (req, res) {
  res.send('Hello World!');
});

// Returns a list of the available phaser versions that can
// be serviced. The actual JS may still need to be downloaded.
app.get('/phaser/versions', function (req, res, next) {
	
	var request = require('request-json');
        var client = request.createClient('https://api.github.com')
	client.get('repos/photonstorm/phaser/git/refs/tags', function (err, response, body) {
	 if (response.statusCode == 200) {
var data = body;

        var tags = ['master', 'dev'];
        if (false && isLocal) {
        tags.push(localTagName);
        }																                                var i = data.length;
		  while (i--) {
                           if (data[i]['ref']) {
                         tags.push(data[i]['ref'].replace('refs/tags/',''))
                                   } else {
                                    tags.push('??');
                                 }
                          }

console.log(tags);
              res.send(200, {tags: tags});


	 } else {
	 	next(err);
	 }
	
	});

})

// Fetch a specific Phaser script version
app.get('/phaser/phaser-:version.js', function (req, res, next) {
	var request = require('request');

	var version = req.params.version;
	var phaserUrl = "https://cdn.rawgit.com/photonstorm/phaser/" + version + "/build/phaser.js";

	request(phaserUrl).pipe(res);
//	request(phaserUrl, function (error, response, body) {
//		if (response.statusCode == 200) {
//			response.pipe(res);
//		} else {
//			next(error + "hi!" + response.statusCode + ":" + phaserUrl);
//		}
//	});
   
});

  
var server = app.listen(PORT, function () {
  var host = server.address().address;
  var port = server.address().port;
      
  console.log('Example app listening at http://%s:%s', host, port);
  console.log('  EXAMPLE_PATH: %s', example_root);
  console.log('     SITE_PATH: %s', playground_root);
});

app.use('/', express.static(playground_root));

app.use('/assets', express.static(path.join(example_root, 'assets')));
app.use('/examples', express.static(example_root));




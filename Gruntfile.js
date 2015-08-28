var util = require('util');
var path = require('path');

module.exports = function (grunt) {

    function valid_example_path(path) {

      var fs = require('fs');
      try {
        var stats = fs.lstatSync(path + '/examples');

        if (stats.isDirectory()) {
          return true;
	}
      }
      catch (e) {
        return false;
      }

    }


    grunt.config('example-path',
        grunt.option('example-path') || process.env.EXAMPLE_PATH || '../phaser-examples');

    if (!valid_example_path(grunt.config('example-path')))
    {
	grunt.fail.warn(
	  util.format('"%s" does not appear to be a valid phaser-example repository.', grunt.config('example-path')));

    }

    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-express-server');
    grunt.loadNpmTasks('grunt-contrib-watch');

//    grunt.loadTasks('./tasks');

    grunt.initConfig({

        env: {
	   dev: {
	    EXAMPLE_PATH: path.resolve(grunt.config('example-path'))
	    }
	},

	express: {
            dev: {
	      options: {
	        script: 'playground/server.js'
		}
            }
        },

	watch: {
	    express: {
	          files:  [
		  	'**/*.js',
			grunt.config('example-path') + '/**/*.js'
		  ],
		        tasks:  [ 'express' ],
			      options: {
			              spawn: false  
				            }
					        }
						  }

    });

    grunt.registerTask('default', ['env', 'express', 'watch'])

};

"use strict";

var util = require('util');
var path = require('path');

module.exports = function (grunt) {

    function valid_example_path (path) {

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
    grunt.loadNpmTasks('grunt-eslint');

    grunt.initConfig({

      eslint: {
            options: {
              configFile: 'conf/eslint.json'
            },
            target: [
              /* 'playground/js/phaser*.js', */
              'Gruntfile.js',
              'playground/*.js',
              'playground/js/phaser-viewer.js'
            ]
        },

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
          files: [
            'playground/**/*.js',
            grunt.config('example-path') + '/**/*.js'
          ],
          tasks: ['express'],
          options: {
            spawn: false
          }
        }
      }

    });

    grunt.registerTask('play', ['env', 'express', 'watch']);
    grunt.registerTask('default', ['env', 'express', 'watch']);

    grunt.registerTask('lint', ['eslint']);

};

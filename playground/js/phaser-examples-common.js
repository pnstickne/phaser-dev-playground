/**
* Some shared UI stuff
*
* PhaserExamples.Common = ..
*
*/

'use strict';

if (!window.PhaserExamples) {
    window.PhaserExamples = {};
}

jQuery(function ($) {

    // URI-encodes the string, and then "fixes" some valid query string values
    function encodeQueryValue (str) {
        return encodeURIComponent(str)
            .replace(/%20/gi, '+')
            .replace(/%2f/gi, '/');
    }

    function buildNewExampleUrl (exampleData) {

        if (!exampleData.name) {
            // Data used file, not name .. stub in.
            // These are currently already space+endcoded+with.js
            exampleData.name = exampleData.file
                .replace(/[+]/g, ' ')
                .replace(/[.]js$/i, '');
        }

        // The values are not encoded
        var dir = exampleData.dir || '';
        var name = exampleData.name || '';

        var baseUrl = 'examples/view';
        var pairs = [];

        pairs.push('path=' + encodeQueryValue(dir + "/" + name));
        
        return baseUrl + '?' + pairs.join('&');
    }

    // Return example data information (from the current URL)
    function getUrlData () {
        var purlUrl = $.url();
        var param = purlUrl.param.bind(purlUrl);

        // Always strings, but an empty string is invalid..
        var dir = param('d') || '';
        var file = param('f') || '';
        var title = param('t') || '';
        var path = param('path') || '';
        var name = '';
        var jsbin = param('jsbin') || '';
        var version = param('v') || param('phaser_version');

        if (dir || file) {
            // old-style urls
            if (file) {
                name = file
                    .replace(/[.]js$/i, '');
            }

            if (!title) {
                title = name;
            }
        }
        else if (path)
        {
            // new-style urls
            var components = path.split("/", 2);
            dir = components[0];
            name = components[1];

            title = name;
            file = name + ".js";
        }

        // Restore if minimal
        if (jsbin && !jsbin.match(/^http:/i)) {
            jsbin = "http://jsbin.com/" + jsbin + "/edit?js,output";
        }

        return {
            dir: dir,
            name: name,
            file: file,
            title: title,
            jsbin: jsbin,
            version: version
        };
    }

    // The base URL for the example site (which contains _site, assets, etc)
    function getExampleBaseUrl () {
        var baseUrl = "http://" + window.location.host + window.location.pathname;

        baseUrl = baseUrl.replace(/\/_site\/.*$/, '');

        return baseUrl;
    }

    PhaserExamples.Common = {
        createExampleUrl: buildNewExampleUrl,
        encodeQueryValue: encodeQueryValue,
        getUrlData: getUrlData,
        getExampleBaseUrl: getExampleBaseUrl
    };

});

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

    // Encodes standalone spaces as dashes, space-dash-space as dash-dash-dash.
    // Dashes and spaces that are not encoded (and percent signs) are percent-encoded.
    function dashEncode (str) {
        return str.replace(/(?:( - )|(-)|( (?! ))|( )|(%))/g, function (m, a, b, c, d, e) {
            if (a) { // ( - )
                return '---';
            } else if (b) { // (-)
                return '%2d'
            } else if (c) { // ( (?! ))
                return '-';
            } else if (d) { // ( )
                return '%20';
            } else if (e) { // (%)
                return '%25';
            }
        });
    }

    // The opposite of dashEncode
    function dashDecode (str) {
        return str
            .replace(/---|-/g, function (m) {
                return m === '---' ? ' - ' : ' ';
            })
            .replace(/%2d/g, '-')
            .replace(/%20/g, ' ')
            .replace(/%25/g, '%');
    }

    // URI-encodes the string, and then "fixes" some valid query string values
    function encodeQueryValue (str) {
        return encodeURIComponent(str)
            .replace(/%20/gi, '+')
            .replace(/%2f/gi, '/');
    }

    // Build the URL for the example (not HTML-escaped!)
    function buildOldExampleUrl (exampleData) {

        // The values are already assumed to be encoded, but this might not be valid
        var exampleDir = exampleData.dir;
        var exampleFile = exampleData.file || '';
        var exampleTitle = exampleData.title || '';

        var baseUrl = 'view_full.html';
        var pairs = [];
        
        pairs.push('d=' + exampleDir);
        pairs.push('f=' + exampleFile);
        if (exampleData.jsbin) {
            pairs.push('jsbin=' + exampleData.jsbin);
        }
        
        // Only include the title if it is not trivially recoverable
        if (exampleTitle && (exampleTitle.replace(/ /g, "+") + ".js") !== exampleFile) {
            pairs.push('t=' + exampleTitle);
        }

        return baseUrl + '?' + pairs.join('&');
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
        var jsbin = exampleData.jsbin || '';

        var baseUrl = 'view_full.html';
        var pairs = [];

        pairs.push('path=' + encodeQueryValue(dashEncode(dir + "/" + name)));
        if (jsbin) {
            // Only care about the resource/id - the rest can be put in later
            var m = jsbin.match(/^http:\/\/jsbin.com\/(.*?)\/edit/i);
            if (m) {
                jsbin = m[1];
            }
            pairs.push('jsbin=' + encodeQueryValue(jsbin));
        }
        
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
            var components = dashDecode(path).split("/", 2);
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
        createOldExampleUrl: buildOldExampleUrl,
        encodeQueryValue: encodeQueryValue,
        getUrlData: getUrlData,
        getExampleBaseUrl: getExampleBaseUrl
    };

});

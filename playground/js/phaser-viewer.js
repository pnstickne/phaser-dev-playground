'use strict';

jQuery(function ($) {

	var defaultVersionTag = 'master';

	var exampleData = PhaserExamples.Common.getUrlData();
	var dir = exampleData.dir;
	var file = exampleData.file;
	var title = exampleData.title;
	var jsbin = exampleData.jsbin;
	var requestedVersion = exampleData.version || defaultVersionTag;

	var isLocal = true;

	var exampleBaseUrl = PhaserExamples.Common.getExampleBaseUrl();

	//  Where to find the local Phaser build
	var localPhaserUrl = exampleBaseUrl + 'js/phaser.js';
	//  What to display for a local tag
	var localTagName = 'local';

	document.title = 'phaser - ' + title;
	$("#title").append(title);

	// Return the actual loaded Phaser version - or an empty string
	function getLoadedPhaserVersion () {
		if (window.Phaser && window.Phaser.VERSION) {
			return "" + window.Phaser.VERSION;
		} else {
			return "";
		}
	}

	function updateDisplayedVersion (versionTag) {
		var realVersion = getLoadedPhaserVersion();
		var version = realVersion;

		$(".phaser-version span")
			.html("Phaser version: " + version);
	}

	function versionCorrectedUrl (versionTag) {
		var pageUri = $.url();

		var params = pageUri.param();
		
		// Only keep the version if not the default (ie. master)
		if (versionTag !== defaultVersionTag) {
			params['v'] = versionTag;
		} else {
			delete params['v'];
		}

		var baseUrl = "http://" + window.location.host + window.location.pathname;

		var pairs = [];
		for (var k in params) {
			if (params.hasOwnProperty(k)) {
				var v = PhaserExamples.Common.encodeQueryValue(params[k]);
				pairs.push(k + "=" + v);
			}
		}

		return baseUrl + '?' + pairs.join('&');
	}

	// Attempt to switch to the version specified by loading the appropriate URL
	function switchToVersion (versionTag) {
		window.location.href = versionCorrectedUrl(versionTag);
	}

	// List the found Phaser versions/tags
	function displayPhaserVersionSelection (versions, activeTag) {

		var $element = $('.phaser-version');
		var $dropdown = $("<select></select>").on('change', function() {
			switchToVersion(this.value);    		
		});
		$element.append($dropdown);
		$dropdown.append($("<option></option>").text("Select a version"));
		$.each(versions, function (codeKey, version) {
			var option = $("<option></option>")
				.attr("value", version.name + "_" + version.sha)
				.text(version.name);
			$dropdown.append(option);
		});

		$dropdown.val(activeTag);

	}

	function getVersions () {
		var dfd = new $.Deferred();

		// Gets a list of git tags, i.e Phaser.js versions and creates a dropdown for them. 
		// on selecting the page will reload and load the select version of github.
		$.get("phaser/versions")
			.done(function( data ) {
				dfd.resolve(data.versions);
			});

		return dfd;
	};

	getVersions()
		.done(function (versions) {
			displayPhaserVersionSelection(versions, requestedVersion);
		});

	// Semi-replacement for $.getScript - but it supplies different
	// information to the promise handlers.
	// IE9+ only
	function loadScript (url) {
		var dfd = new $.Deferred();

		var script = document.createElement('script');
		
		// "Modern" - FF, Chrome, IE10
		script.onload = function () {
			dfd.resolve(script, 'success');
  		};

		// IE9, older Opera perhaps - just double up and listen to all
		if ('onreadystatechange' in script)
		{
			script.onreadystatechange = function () {
				var rs = script.readyState;
				if (['complete', 'loaded'].indexOf(rs) > -1) {
					dfd.resolve(script, 'success');
				}
	  		};
		}
		
		script.onerror = function () {
			dfd.reject(null, null, 'Failed to load');
			script.parentNode.removeChild(script);
		};

		script.async = true;
		script.type = 'text/javascript';
		script.src = url;

		var head = document.getElementsByTagName("head")[0];
		head.appendChild(script);

		return dfd;
	}

	var scriptLoader = loadScript; // or $.getScript

	// Load the local version of Phaser
	function loadLocalPhaser () {
		var phaserUrl = localPhaserUrl;
		return scriptLoader(phaserUrl)
			.done(function (script, textStatus) {
				console.log("Loaded local Phaser.js: " + phaserUrl);
				window.Phaser.LOADED_FROM = phaserUrl;
				loadAndRunCode();
				updateDisplayedVersion('local');
			})
			.fail(function(jqxhr, settings, exception) {
				console.log("Failed to load local Phaser.js (" + phaser + "), nothing else to do");
			});
	}

	// Load a specific (remote) version of Phaser from Git
	function loadRemotePhaser (versionTag) {
		var dfd = $.Deferred();
		loadAndRunCode();
		updateDisplayedVersion(versionTag);
		return;
		// Loading is now handled by in-document JS or possibly
		// on resource generation itself.

		var phaserUrl = "https://cdn.rawgit.com/photonstorm/phaser/" + versionTag + "/build/phaser.js"
		return scriptLoader(phaserUrl)
			.done(function (script, textStatus) {
				console.log("Loaded github Phaser.js: " + phaserUrl);
				window.Phaser.LOADED_FROM = phaserUrl;
				loadAndRunCode();
				updateDisplayedVersion(versionTag);
			})
			.fail(function (jqxhr, settings, exception) {
				console.log("Failed to load Phaser.js from github (" + phaserUrl + "), falling back to local copy");
				return loadLocalPhaser();
			});
	}

	if (requestedVersion !== localTagName) {
		loadRemotePhaser(requestedVersion);
	}
	else
	{
		loadLocalPhaser();
	}

	// Use as key into localStore for this example
	var codeKey = "[" + dir + "/" + file + "]";

	$("#livecode-run").click(function () {
		runCustomCode();
	});

	$("#livecode-reset").click(function () {
		resetCustomCode();
	});

	$("#create-codepen").click(function () {
		exportToCodepen();
	});

	var textArea = $('#livecode').get(0);
	var codeEditor = CodeMirror.fromTextArea(textArea, {
		mode: 'javascript',
		extraKeys: {
			"Ctrl-Enter": function () {
				runCustomCode();
			},
			"Ctrl-R": function () {
				resetCustomCode();
			}
		}
	});

	function createTemplates (source, verstionTag) {

		var phaserSrcUrl = window.Phaser.LOADED_FROM;

		source = source.replace(/\bPhaser[.](?:AUTO|WEBGL|CANVAS)\b/, '$mode');
		source = source.replace(/(['"])assets\//g, '$a+$1/');

	    source = 'var $mode = Phaser.CANVAS;' +
			'\nvar $a = "' + exampleBaseUrl + '/assets";\n\n' + source;

		var src = phaserSrcUrl + '?_=' + Date.now();

		return {
			html: "<script src='" + src + "'></script><div id=phaser-example></div>",
			js: source
		};

	};

	function createCodepen (templates) {

		var penData = {
			"title": "New Pen!",
			html: templates.html,
			js: templates.js
		};
		
		$('<form method=POST target=_blank style=display:none />')
			.attr('action', 'http://codepen.io/pen/define')
			.append(
				$('<input type=hidden name=data />')
					.val(JSON.stringify(penData)))
			.append(
				$('<input type=submit value=createpen />'))
			.appendTo('body') // FF, IE need form in document
			.submit()
			.remove();
	}

	function exportToCodepen () {

		var source = codeEditor.getDoc().getValue();

		var templates = createTemplates(source, requestedVersion);
		createCodepen(templates);

	}

	// Store the current code and reload the page
	// When the page is reloaded the stored code will begin to run
	function runCustomCode () {

		var source = codeEditor.getDoc().getValue();
		var cursor = codeEditor.getCursor();
		var scrollInfo = codeEditor.getScrollInfo();

		var data = {
			source: source,
			cursor: {
				line: cursor.line,
				ch: cursor.ch
			},
			scroll: {
				left: scrollInfo.left,
				top: scrollInfo.top
			}
		};
		window.localStorage.setItem(codeKey, JSON.stringify(data));
		window.location.reload();
	}

	// Remove the edited code and reload the page
	// When the page is reloaded it will run the original code
	function resetCustomCode () {
		window.localStorage.removeItem(codeKey);
		window.location.reload();
	}

	function evaluateCode (source) {
		$.globalEval(source);
	}

	//  Extracts the meta JSON information from the source file.
	function parseSourceMeta (source) {

		var metaMatch = source.match(/^\s*[+]({[\S\s]*?\n\s*});?\s*$/m);
		var meta = {};

		if (metaMatch) {
			try {
				meta = JSON.parse(metaMatch[1]);
				// Strip meta and all blank lines at the top
				source = source.substring(metaMatch[0].length);
				source = source.replace(/^(?:\s*?\n)*/, '');
			} catch (e) {
				// No parse .. leave same
				console.warn("Failed to parse meta: " + e);
			}
		}

		return {
			meta: meta,
			source: source
		}
	}

	function showAndRunCode (content, data) {

		var parsed = parseSourceMeta(content);
		var source = parsed.source;

		//	Hook up the control panel
		$(".pause-button").click(function() {
			if (game.paused)
			{
				game.paused = false;
			}
			else
			{
				game.paused = true;
			}
		});

		$(".mute-button").click(function() {
			if (game.sound.mute)
			{
				game.sound.mute = false;
			}
			else
			{
				game.sound.mute = true;
			}
		});

		$(".reset-button").click(function() {
			document.location.reload(true);
		});

		showMeta(parsed.meta);
		codeEditor.getDoc().setValue(source);

		if (data) 
		{
			var cursor = data.cursor;
			if (cursor) {
				codeEditor.setCursor(cursor);
			}
			
			var scroll = data.scroll;
			if (scroll) {
				codeEditor.scrollTo(scroll.left, scroll.top);
			}

			codeEditor.focus();
		}

		evaluateCode(source);

	}

	function showMeta(meta) {
		if (meta) {
			//debugger;
			$('#description').text(meta.description);
			$('#instructions').text(meta.instructions);
		}
	}

	function loadAndRunCode () {

		var stored = window.localStorage.getItem(codeKey);
		if (stored) {
			var data;
			try {
				data = JSON.parse(stored);
			} catch (e) {
				// Not much care
			}
			if (data) 
			{
				showAndRunCode(data.source, data);
				return;
			}
		}

		$.ajax({
			url: "examples/" + dir + "/" + file,
			dataType: "text"
		})
		.done(function(data) {

			showAndRunCode(data);

		})
		.fail(function(jqxhr, settings, exception) {
			$("#title").text("Error");
			var node = '<p>Unable to load <u>' + dir + '/' + file + '</u></p>';
			$('#phaser-example').append(node);
		});
	}

});

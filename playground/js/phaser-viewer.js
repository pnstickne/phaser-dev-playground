'use strict';

/* global window:false, localStorage:false, document:false,
          jQuery: false, PhaserExamples:false, CodeMirror:false,
          game: false */

jQuery(function ($) {

	var defaultVersionTag = 'master';

	var exampleData = PhaserExamples.Common.getUrlData();
	var dir = exampleData.dir;
	var file = exampleData.file;
	var title = exampleData.title;
	var requestedVersion = exampleData.version || defaultVersionTag;

	document.title = 'phaser - ' + title;

	$("#title").append(title);
	$('#v2link').attr('href',
		'http://phaser.io/examples/v2/' + dir + '/'
			+ file.replace(/\+/g, '-').replace(/\s+/, '-').replace(/\.js$/, ''));

	// Return the actual loaded Phaser version - or an empty string
	function getLoadedPhaserVersion () {
		if (window.Phaser && window.Phaser.VERSION)
		{
			return "" + window.Phaser.VERSION;
		}
		else
		{
			return "";
		}
	}

	function versionCorrectedUrl (versionTag) {
		var pageUri = $.url();

		var params = pageUri.param();

		// Only keep the version if not the default (ie. master)
		if (versionTag !== defaultVersionTag) {
			params['v'] = versionTag;
		}
		else {
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

		var $dropdown = $('.phaser-version select');
		$dropdown.on('change', function () {
			switchToVersion(this.value);
		});

		$.each(versions, function (codeKey, version) {
			var title = version.license !== "commercial"
				? version.name
				: version.name + " ($)";
			var option = $("<option></option>")
				.attr("value", version.name)
				.text(title);
			$dropdown.append(option);
		});

		$dropdown.val(activeTag);

	}

	function getVersions () {
		var dfd = new $.Deferred();

		// Gets a list of git tags, i.e Phaser.js versions and creates a dropdown for them.
		// on selecting the page will reload and load the select version of github.
		$.get("phaser/versions")
			.done(function (data) {
				dfd.resolve(data.versions);
			});

		return dfd;
	}

	getVersions()
		.done(function (versions) {
			displayPhaserVersionSelection(versions, requestedVersion);
		});

	// Use as key into localStore for this example
	var codeKey = "[" + dir + "/" + file + "]";

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

	$("#livecode-run").click(function () {
		runCustomCode();
	});

	$("#livecode-reset").click(function () {
		resetCustomCode();
	});

	showBuildDetails();
	loadAndRunCode();

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

		localStorage.setItem(codeKey, JSON.stringify(data));
		window.location.reload();
	}

	// Remove the edited code and reload the page
	// When the page is reloaded it will run the original code
	function resetCustomCode () {
		localStorage.removeItem(codeKey);
		window.location.reload();
	}

	function evaluateCode (source) {
		$.globalEval(source);
	}

	//  Extracts the meta JSON information from the source file.
	function parseSourceMeta (sourceCode)
	{

		var source = sourceCode;
		var metaMatch = source.match(/^\s*[+]({[\S\s]*?\n\s*});?\s*$/m);
		var meta = {};

		if (metaMatch)
		{
			try
			{
				meta = JSON.parse(metaMatch[1]);
				// Strip meta and all blank lines at the top
				source = source.substring(metaMatch[0].length);
				source = source.replace(/^(?:\s*?\n)*/, '');
			}
			catch (e)
			{
				// No parse .. leave same
				console.warn("Failed to parse meta: " + e);
			}
		}

		return {
			meta: meta,
			source: source
		}
	}

	function showAndRunCode (content, data)
	{

		var parsed = parseSourceMeta(content);
		var source = parsed.source;

		//	Hook up the control panel
		$(".pause-button").click(function ()
		{
			if (game.paused)
			{
				game.paused = false;
			}
			else
			{
				game.paused = true;
			}
		});

		$(".mute-button").click(function ()
		{
			if (game.sound.mute)
			{
				game.sound.mute = false;
			}
			else
			{
				game.sound.mute = true;
			}
		});

		$(".reset-button").click(function ()
		{
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

	function showBuildDetails () {

		function addDetail (detail) {
			$('#build-details').append(
				$("<li/>").text(detail));
		}

		var Phaser = window.Phaser;
		if (!Phaser) {
			addDetail("Failed to load Phaser");
			return;
		}

		addDetail("VER: " + Phaser.VERSION);
	}

	function showMeta (meta)
	{
		if (meta)
		{
			$('#description').text(meta.description);
			$('#instructions').text(meta.instructions);
		}
	}

	function loadAndRunCode ()
	{

		var stored = localStorage.getItem(codeKey);
		if (stored) {
			var data;
			try {
				data = JSON.parse(stored);
			}
			catch (e) {
				// Not much care
			}
			if (data) {
				showAndRunCode(data.source, data);
				return;
			}
		}

		return $.ajax({
			url: "examples/src/" + dir + "/" + file,
			dataType: "text"
		})
		.done(function (data) {
			showAndRunCode(data);
		})
		.fail(function (jqxhr, settings, exception) {
			$("#title").text("Error: " + exception);
			var node = '<p>Unable to load <u>' + dir + '/' + file + '</u></p>';
			$('#phaser-example').append(node);
		});
	}

});

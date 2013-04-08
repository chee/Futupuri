/*global chrome:false*/
chrome.app.runtime.onLaunched.addListener(function () {
	'use strict';
	chrome.app.window.create( '../html/index.html', {
		minWidth: 640,
		maxWidth: 640,
		minHeight: 675,
		maxHeight: 675
	});
});
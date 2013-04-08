window.templates = (function ( chrome, $, _ ) {
	'use strict';

	var templates = {};

	$( '#templates' ).children().each(function () {
		var tmpl = $( this );
		templates[ this.id ] = function ( obj ) {
			var html = tmpl.html();
			Object.keys( obj ).forEach(function ( key ) {
				html = html.replace( new RegExp( '\\{\\{ ' + key + ' \\}\\}', 'g' ), obj[ key ] );
			});
			return html.trim();
		};
	});

	return templates;
})( window.chrome, window.jQuery, window._ );
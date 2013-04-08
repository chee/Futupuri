window.tools = (function ( chrome, $, _ ) {
	'use strict';

	// thx, guy on SO
	function uriToBlob ( dataURI ) {
		var binary = atob( dataURI.replace( /.*,/, '' ) );
		var array = [];
		for ( var i = 0; i < binary.length; i++ ) {
			array.push( binary.charCodeAt( i ) );
		}
		return new Blob( [new Uint8Array( array )], { type: 'image/png' } );
	}

	return {
		removeImage: function ( id ) {
			chrome.storage.local.remove( id );
			window.tools.updateValues();
		},

		saveImage: function ( dataURI, fileName ) {
			fileName = fileName || 'chee.png';
			chrome.fileSystem.chooseEntry( { type: 'saveFile', suggestedName: fileName }, function ( save ) {
				save.createWriter( function ( writer ) {
					writer.write( uriToBlob( dataURI ) );
				});
			});
		},

		updateValues: function () {
			$( '.photo-value' ).text( $( '.photographs' ).children().length );
		}

	};

})( window.chrome, window.jQuery, window._ );
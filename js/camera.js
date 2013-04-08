/*global tools:false, templates:false, pixel:false*/
(function( chrome, $, _ ){
	'use strict';

	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
	var URL = window.URL || window.webkitURL;

	var SPACE_BAR = 32;

	var video = $( '#video' ).get( 0 );
	var canvas = $( '#output' );
	var context = canvas.get( 0 ).getContext( '2d' );
	var snap = $( '.snap' );
	var photographs = $( '.photographs' );
	var effectsButton = $( '.effects-button' );
	var effects = $( '#effects' );
	var body = $( document.body );

	photographs.on( 'dblclick', 'img', function ( event ) {
		open( event.target.src );
	}).on( 'click', '.remove', function ( event ) {
		var element = $( event.target ).parent();
		var img = element.find( 'img' ).get( 0 );
		tools.removeImage( img.dataset.id );
		element.remove();
	}).on( 'click', '.save', function ( event ) {
		var img = $( event.target ).siblings( 'img' ).get( 0 );
		tools.saveImage( img.src, 'futu-' + img.dataset.id + '.png' );
	});

	snap.on( 'click', takePicture );

	body.on( 'keyup', function ( event ) {
		if ( event.which === SPACE_BAR ) {
			takePicture();
		}
	});

	effects.on( 'click', '.effect-demo', function () {
		var element = $( event.target );
		if ( !element.is( 'canvas' ) ) {
			element = element.find( 'canvas' );
		}
		canvas.get( 0 ).dataset.filter = element.get( 0 ).dataset.filter;
		toggleEffects();
	});

	effectsButton.on( 'click', toggleEffects );

	function takePicture () {
		// get data:image/png url for photo
		var dataURI = canvas.get( 0 ).toDataURL();

		// add that to the db
		var picture = {};
		picture[ photographs.children().length ] = dataURI;

		chrome.storage.local.set( picture, function() {
			insertPicture( dataURI );
		});
	}

	chrome.storage.local.get(function ( data ) {
		var i = 0;
		while ( data[ i ] ) {
			insertPicture( data[ i ] );
			i++;
		}
	});

	function insertPicture ( src ) {
		var picture = templates.picture({
			src: src,
			id: photographs.children().length
		});

		photographs.append( picture );
		tools.updateValues();

		setTimeout(function () {
			photographs.prop( 'scrollLeft', photographs.prop( 'scrollWidth' ) );
		}, 1 );

	}

	function animateOutput ( video, context, width, height ) {
		width = width || 640;
		height = height || 480;
		if ( $( context.canvas ).is( ':visible' ) ) {
			context.drawImage( video, 0, 0, width, height );
			pixel.applyFilter( context );
		}
		window.requestAnimationFrame( function () {
			animateOutput( video, context, width, height );
		});
	}

	navigator.getUserMedia({
		video: true
	}, function ( stream ) {
		// start video running
		video.src = URL.createObjectURL( stream );

		// copy video to canvas
		window.requestAnimationFrame( function () {
			animateOutput( video, context );
		});

		Object.keys( pixel.filters ).forEach( function ( name ) {
			effects.append( makeDemo( name ) );
		});

	});

	function makeDemo ( name ) {
		var demoSettings = {
			width: canvas.width() / 3.5,
			height: canvas.height() / 3.5,
			filter: name
		};
		var demo = $( templates.effectDemo( demoSettings ) );

		animateOutput( video, demo.find( 'canvas' ).get( 0 ).getContext( '2d' ), demoSettings.width, demoSettings.height );
		return demo;
	}

	function toggleEffects () {
		body.toggleClass( 'show-effects' );
	}
})( window.chrome, window.jQuery, window._ );
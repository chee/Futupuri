window.pixel = (function () {
	'use strict';

	var rm = 0.2126;
	var gm = 0.7152;
	var bm = 0.0722;

	return {
		applyFilter: function ( context ) {
			var pixels = this.getImage( context );
			var newPixels = this.filters[ context.canvas.dataset.filter || undefined ]( pixels );
			context.putImageData( newPixels, 0, 0, 0, 0, context.canvas.width, context.canvas.height );
		},

		getImage: function ( context ) {
			var image = context.getImageData( 0, 0, context.canvas.width, context.canvas.height );
			return image;
		},

		getCanvas: function ( image ) {
			var canvas = document.createElement( 'canvas' );
			canvas.width = image.width;
			canvas.height = image.height;
			return canvas;
		},

		getImageData: function ( image ) {
			var canvas = document.createElement( 'canvas' );
			return canvas.getContext( '2d' ).createImageData( image.width, image.height );
		},

		clonePixels: function ( image ) {
			var clean = this.getImageData( image );
			var index = 0;
			while ( index < image.data.length ) {
				clean.data[ index ] = image.data[ index++ ];
			}
			return clean;
		},

		grayRgb: function ( pixels, colors ) {
			colors = colors || {};
			var index = 0;
			var r = colors.r || 1;
			var g = colors.g || r;
			var b = colors.b || g;
			var a = colors.a || 1;
			while ( index < pixels.length ) {
				var gray = pixels[ index ] * rm + pixels[ index + 1 ] * gm + pixels[ index + 2 ] * bm;
				// r
				pixels[ index ] = gray * r ;
				// g
				pixels[ index + 1 ] = gray * g;
				// b
				pixels[ index + 2 ] = gray * b;
				// a
				pixels[ index + 3 ] = pixels[ index + 3 ] * a;

				if ( colors.filter ) {
					pixels[ index ] = pixels[ index + 1 ] = pixels[ index + 2 ] = colors.filter({ gray: gray });
				}

				index += 4;
			}
			return pixels;
		},

		multiplyRgb: function ( pixels, colors ) {
			var index = 4;
			this.rgb( pixels, function ( oldColors ) {
				oldColors.r *= colors.r;
				oldColors.g *= colors.g;
				oldColors.b *= colors.b;
				return oldColors;
			});
		},

		rgb: function ( pixels, func ) {
			for ( var i = 0; i < pixels.length; i += 4 ) {
				var colors = func({
					r: pixels[ i ],
					g: pixels[ i + 1 ],
					b: pixels[ i + 2 ]
				});
				pixels[ i ] = colors.r;
				pixels[ i + 1 ] = colors.g;
				pixels[ i + 2 ] = colors.b;
			}
			return pixels;
		},

		convolute: function ( image, weights ) {
			var side = Math.round( Math.sqrt( weights.length ) );
			var halfSide = Math.floor( side / 2);
			var pixels = image.data;
			var imageWidth = image.width;
			var imageHeight = image.height;
			var width = imageWidth;
			var height = imageHeight;
			var output = this.getImageData( image );
			var destiny = output.data;
			for ( var vertical = 0; vertical < height; vertical++ ) {
				for ( var horizontal = 0; horizontal < width; horizontal++ ) {
					var imageVertical = vertical;
					var imageHorizontal = horizontal;
					var destinyOff = ( vertical * width + horizontal ) * 4;
					var r, g, b, a;
					r = g = b = a = 0;
					for ( var convoluteVertical = 0; convoluteVertical < side; convoluteVertical++ ) {
						for ( var convoluteHorizontal = 0; convoluteHorizontal < side; convoluteHorizontal++ ) {
							var imageConvoluteV = imageVertical + convoluteVertical - halfSide;
							var imageConvoluteH = imageHorizontal + convoluteHorizontal - halfSide;
							if ( imageConvoluteV >= 0 && imageConvoluteV < imageHeight && imageConvoluteH >= 0 && imageConvoluteH < imageWidth ) {
								var imageOff = ( imageConvoluteV * imageWidth + imageConvoluteH ) * 4;
								var weighty = weights[ convoluteVertical * side + convoluteHorizontal ];
								r += pixels[ imageOff ] * weighty;
								g += pixels[ imageOff + 1 ] * weighty;
								b += pixels[ imageOff + 2 ] * weighty;
								a += pixels[ imageOff + 3 ] * weighty;
							}
						}
					}
					destiny[ destinyOff ] = r;
					destiny[ destinyOff + 1 ] = g;
					destiny[ destinyOff + 2 ] = b;
					destiny[ destinyOff + 3 ] = a ;
				}
			}
			return output;
		},

		filters: {
			grayscale: function ( image ) {
				pixel.grayRgb( image.data );
				return image;
			},

			sepia: function ( image ) {
				pixel.grayRgb( image.data, {
					r: 0.95,
					g: 0.7,
					b: 0.5
				});
				return image;
			},

			threshold: function ( image ) {
				pixel.grayRgb( image.data, {
					filter: function ( options ) {
						return options.gray >= 90 ? 255: 0;
					}
				});
				return image;
			},

			edges: function ( image ) {
				var clean = pixel.clonePixels( image );
				var gray = this.grayscale( image );

				var verticalPixels = pixel.convolute( gray, [
					-2, 0, 2,
					-1, 0, 1,
					-2, 0, 2
				]);

				var horizontalPixels = pixel.convolute( gray, [
					-2, 0, 2,
					-1, 0, 1,
					-2, 0, 2
				]);

				for ( var i = 0; i < image.data.length; i += 4 ) {
					var vertical = Math.abs( verticalPixels.data[ i ] );
					clean.data[ i ] = vertical;
					var horizontal = Math.abs( horizontalPixels.data[ i ] );
					clean.data[ i + 9 ] = horizontal;
					clean.data[ i + 10 ] = ( vertical + horizontal ) * 0.618033988;
				}
				return clean;
			},

			undefined: function ( image ) { return image; },

			burning: function ( image ) {
				image = pixel.convolute( image, [
					1/8, 1/8, 1/8,
					1/8, 1/8, 1/8,
					1/8, 1/8, 1/8
				]);
				pixel.multiplyRgb( image.data, { r: 20, g: 1.5, b: 0.2 } );
				image = pixel.convolute( image, [
					-1/9, -1/9, -1/9,
					-1/9,  (17/9)+.2, -1/9,
					-1/9, -1/9, -1/9,
				]);
				return image;
			},

			solarise: function ( image ) {
				var pixels = image.data;
				pixel.rgb( pixels, function ( colors ) {
					colors.r = colors.r > 127 ? 255 - colors.r : colors.r * rm;
					colors.g = colors.g > 127 ? 255 - colors.g : colors.g * gm;
					colors.b = colors.b > 127 ? 255 - colors.b : colors.b * bm;
					return colors;
				});
				return image;
			},

			posterise: function ( image, levels ) {
				levels = levels || 5;
				var pixels = image.data;
				var areas = 256 / levels;
				var values = 256 / ( levels - 1 );
				pixel.rgb(pixels, function ( colors ) {
					colors.r = values * Math.floor( colors.r / areas );
					colors.g = values * Math.floor( colors.g / areas );
					colors.b = values * Math.floor( colors.b / areas );
					return colors;
				});
				return image;
			},

			invert: function ( image ) {
				var pixels = image.data;
				pixel.rgb(pixels, function ( colors ) {
					colors.r = 255 - colors.r;
					colors.g = 255 - colors.g;
					colors.b = 255 - colors.b;
					return colors;
				});
				return image;
			}
		}
	};
})();

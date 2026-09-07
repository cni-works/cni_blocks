( function() {
	'use strict';

	const allowedFonts = [ 'Noto Sans JP', 'Noto Serif JP', 'M PLUS 1p', 'M PLUS Rounded 1c', 'Zen Kaku Gothic New', 'Zen Maru Gothic', 'Zen Old Mincho', 'Zen Kurenaido', 'Shippori Mincho', 'Kosugi Maru', 'Yuji Boku', 'Kiwi Maru', 'Kaisei Decol', 'Kaisei Opti', 'Mochiy Pop One', 'Klee One', 'Yomogi', 'Yusei Magic', 'Roboto', 'Lato', 'Montserrat', 'Poppins', 'Josefin Sans', 'Quicksand', 'Damion', 'Caveat', 'Cinzel', 'Dancing Script', 'Tangerine' ];
	const fontWeights = {
		'Zen Old Mincho': [ '400', '500', '600', '700', '800' ], 'Shippori Mincho': [ '400', '500', '600', '700', '800' ],
		'Kiwi Maru': [ '300', '400', '500' ], 'Kaisei Decol': [ '400', '500', '700' ], 'Kaisei Opti': [ '400', '500', '700' ],
		'Mochiy Pop One': [ '400' ], 'Zen Kurenaido': [ '400' ], 'Klee One': [ '400', '600' ], 'Yomogi': [ '400' ], 'Yusei Magic': [ '400' ],
		'Kosugi Maru': [ '400' ], 'Yuji Boku': [ '400' ], 'Lato': [ '300', '400', '700', '900' ],
		'Poppins': [ '100', '200', '300', '400', '500', '600', '700', '800', '900' ],
		'Josefin Sans': [ '300', '400', '500', '600', '700' ], 'Quicksand': [ '300', '400', '500', '600', '700' ],
		'Damion': [ '400' ], 'Caveat': [ '400', '500', '600', '700' ], 'Cinzel': [ '400', '500', '600', '700', '800', '900' ],
		'Dancing Script': [ '400', '500', '600', '700' ], 'Tangerine': [ '400', '700' ],
	};
	const loaded = {};
	const textDesignFonts = {
		'simple-shadow': 'Noto Sans JP', 'frame-label': 'Zen Kaku Gothic New', 'white-label': 'Zen Kaku Gothic New', 'elegant-gradient': 'Noto Serif JP', 'pop-outline-shadow': 'M PLUS Rounded 1c', 'sale-price': 'Noto Sans JP', 'outline': 'Montserrat', 'gold-metal': 'Noto Serif JP', 'marker-underline': 'Zen Kaku Gothic New', 'neon': 'M PLUS Rounded 1c', 'accent-underline': 'Noto Sans JP', 'center-slash': 'Zen Kaku Gothic New', 'left-bar': 'Noto Sans JP', 'left-bar-band': 'Noto Sans JP', 'short-underline': 'Noto Sans JP', 'double-underline': 'Noto Sans JP', 'center-underline': 'Noto Sans JP', 'side-lines': 'Noto Sans JP', 'corner-frame': 'Noto Sans JP', 'speech-underline': 'Noto Sans JP', 'eyebrow-title': 'Montserrat', 'number-title': 'Montserrat', 'backdrop-title': 'Montserrat'
	};

	function prepareRuby( root ) {
		root.querySelectorAll( '.wp-block-cni-blocks-heading-plus ruby[data-cni-ruby]:not([data-cni-ruby-ready])' ).forEach( function( ruby ) {
			const reading = ruby.getAttribute( 'data-cni-ruby' );
			if ( ! reading ) return;
			const baseCharacters = Array.from( ruby.textContent );
			const rubyCharacters = Array.from( reading );
			if ( baseCharacters.length === rubyCharacters.length && baseCharacters.length > 1 && ruby.children.length === 0 ) {
				const fragment = document.createDocumentFragment();
				baseCharacters.forEach( function( character, index ) {
					const characterRuby = document.createElement( 'ruby' );
					const rt = document.createElement( 'rt' );
					characterRuby.className = 'cni-heading-plus__ruby cni-heading-plus__ruby-character';
					characterRuby.setAttribute( 'data-cni-ruby-ready', 'true' );
					characterRuby.appendChild( document.createTextNode( character ) );
					rt.textContent = rubyCharacters[ index ];
					characterRuby.appendChild( rt );
					fragment.appendChild( characterRuby );
				} );
				ruby.replaceWith( fragment );
				return;
			}
			const rt = document.createElement( 'rt' );
			rt.textContent = reading;
			ruby.appendChild( rt );
			ruby.setAttribute( 'data-cni-ruby-ready', 'true' );
		} );
	}

	function loadFont( family ) {
		if ( ! family || allowedFonts.indexOf( family ) === -1 || loaded[ family ] ) return;
		loaded[ family ] = true;
		const available = fontWeights[ family ] || [ '300', '400', '500', '600', '700', '800', '900' ];
		const weights = available.length === 1 ? '' : ':wght@' + available.join( ';' );
		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent( family ).replace( /%20/g, '+' ) + weights + '&display=swap';
		document.head.appendChild( link );
	}

	document.querySelectorAll( '.wp-block-cni-blocks-heading-plus[data-google-font]' ).forEach( function( heading ) {
		loadFont( heading.getAttribute( 'data-google-font' ) );
	} );
	/* Structural designs use an auxiliary font even when the main heading keeps
	 * the theme font. Load it explicitly so editor and front cannot diverge. */
	document.querySelectorAll( '.wp-block-cni-blocks-heading-plus[data-cni-heading-design]' ).forEach( function( heading ) {
		loadFont( textDesignFonts[ heading.getAttribute( 'data-cni-heading-design' ) ] );
	} );
	document.querySelectorAll( '.wp-block-cni-blocks-heading-plus[data-secondary-google-font]' ).forEach( function( heading ) {
		loadFont( heading.getAttribute( 'data-secondary-google-font' ) );
	} );
	document.querySelectorAll( '.cni-image-text-layer__item[data-cni-text-design]' ).forEach( function( layer ) {
		loadFont( textDesignFonts[ layer.getAttribute( 'data-cni-text-design' ) ] );
	} );

	prepareRuby( document );
} )();

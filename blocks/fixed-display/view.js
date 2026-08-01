( function() {
	'use strict';

	function initializeFixedDisplay( block ) {
		const closeButton = block.querySelector( ':scope > .cni-fixed-display__close' );
		if ( ! closeButton ) {
			return;
		}

		closeButton.addEventListener( 'click', function() {
			block.hidden = true;
		} );
	}

	function initializeAll() {
		document.querySelectorAll( '.wp-block-cni-blocks-fixed-display' ).forEach( initializeFixedDisplay );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initializeAll );
	} else {
		initializeAll();
	}
} )();

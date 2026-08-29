( function() {
	'use strict';

	function prepareBackgroundVideos() {
		const videos = document.querySelectorAll( '.wp-block-cni-blocks-outer > .cni-outer__background-video' );
		if ( ! videos.length ) return;

		const reducedMotion = window.matchMedia ? window.matchMedia( '(prefers-reduced-motion: reduce)' ) : null;
		const updatePlayback = function() {
			videos.forEach( function( video ) {
				if ( reducedMotion && reducedMotion.matches ) {
					video.pause();
					return;
				}

				const playResult = video.play();
				if ( playResult && typeof playResult.catch === 'function' ) {
					playResult.catch( function() {} );
				}
			} );
		};

		updatePlayback();

		if ( reducedMotion ) {
			if ( typeof reducedMotion.addEventListener === 'function' ) {
				reducedMotion.addEventListener( 'change', updatePlayback );
			} else if ( typeof reducedMotion.addListener === 'function' ) {
				reducedMotion.addListener( updatePlayback );
			}
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', prepareBackgroundVideos );
	} else {
		prepareBackgroundVideos();
	}
} )();

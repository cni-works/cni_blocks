( function() {
	'use strict';

	function set( element, name, value ) {
		if ( element.style.getPropertyValue( name ) !== value ) element.style.setProperty( name, value );
	}

	function configure( block ) {
		if ( ! block ) return;
		// Read the already-saved variables instead of changing saved markup.
		const shift = parseFloat( block.style.getPropertyValue( '--cni-bg2-shift' ) ) || 13;
		const factor = shift < 10 ? .6 : ( shift > 18 ? 1.75 : 1 );
		const duration = parseFloat( block.style.getPropertyValue( '--cni-bg2-duration' ) ) || 18;
		set( block, '--cni-bg2-motion-distance', 'clamp(' + ( 18 * factor ) + 'px, ' + ( 4 * factor ) + 'vw, ' + ( 44 * factor ) + 'px)' );
		set( block, '--cni-bg2-motion-angle', ( 12 * factor ) + 'deg' );
		set( block, '--cni-bg2-motion-scale', String( .025 * factor ) );
		set( block, '--cni-bg2-motion-ring-from', String( 1 - .3 * factor ) );
		set( block, '--cni-bg2-motion-ring-to', String( 1 + .8 * factor ) );
		set( block, '--cni-bg2-motion-phase', ( -duration * .25 ) + 's' );
		const canvas = block.querySelector( ':scope > .cni-bg2__canvas' );
		if ( ! canvas ) return;
		canvas.querySelectorAll( '.cni-bg2__fluid-shape, .cni-bg2__polygon-item, .cni-bg2__confetti-item, .cni-bg2__spot-item, .cni-bg2__ring-item' ).forEach( function( item, index ) {
			[ 'x', 'y' ].forEach( function( axis ) {
				const raw = parseFloat( item.style.getPropertyValue( '--drift-' + axis ) ) || ( index % 2 ? -6 : 6 );
				const direction = ( raw < 0 ? -1 : 1 ) * ( .55 + .45 * Math.min( 1, Math.abs( raw ) / ( 12 * factor ) ) );
				set( item, '--cni-bg2-item-' + axis, 'calc(var(--cni-bg2-motion-distance, 44px) * ' + direction.toFixed( 4 ) + ')' );
			} );
			const delay = Math.abs( parseFloat( item.style.getPropertyValue( '--delay' ) ) || 0 );
			set( item, '--cni-bg2-item-phase', ( -duration * ( .2 + delay / 12 * .55 ) ).toFixed( 3 ) + 's' );
		} );
		canvas.querySelectorAll( '.cni-bg2__pattern' ).forEach( function( pattern ) {
			if ( pattern.style.inset === '0px' || pattern.style.inset === '0' ) pattern.setAttribute( 'data-cni-bg2-motion-overscan', 'true' );
			// Repeated patterns travel whole tile periods, so infinite loops have
			// no seam. Full-canvas illustrations use bounded transforms instead.
			const repeat = pattern.style.backgroundRepeat === 'repeat';
			if ( repeat ) {
				const sizes = pattern.style.backgroundSize.split( /\s+/ );
				const x = parseFloat( sizes[ 0 ] ); const y = parseFloat( sizes[ 1 ] || sizes[ 0 ] );
				const cycles = factor < 1 ? 1 : ( factor > 1 ? 3 : 2 );
				if ( sizes[ 0 ].endsWith( 'px' ) && Number.isFinite( x ) && Number.isFinite( y ) && Math.max( x, y ) <= 200 ) {
					set( pattern, '--cni-bg2-pattern-x', ( x * cycles ) + 'px' );
					set( pattern, '--cni-bg2-pattern-y', ( y * cycles ) + 'px' );
					if ( pattern.getAttribute( 'data-cni-bg2-repeat-motion' ) !== 'true' ) pattern.setAttribute( 'data-cni-bg2-repeat-motion', 'true' );
					return;
				}
			}
			pattern.removeAttribute( 'data-cni-bg2-repeat-motion' );
		} );
	}

	function preview( block ) {
		const canvas = block && block.querySelector( ':scope > .cni-bg2__canvas' );
		if ( canvas && canvas.getAnimations ) canvas.getAnimations( { subtree: true } ).forEach( function( animation ) { animation.currentTime = 0; } );
	}

	window.cniBlocksBackgroundMotion = { configure: configure, preview: preview };
	function initialize() { document.querySelectorAll( '.wp-block-cni-blocks-background-design-plus' ).forEach( configure ); }
	if ( document.readyState === 'loading' ) document.addEventListener( 'DOMContentLoaded', initialize, { once: true } );
	else initialize();
} )();

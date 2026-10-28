( function() {
	'use strict';

	const initialized = new WeakSet();
	const scrollBlocks = [];
	let framePending = false;

	function moveToPageLayer( block ) {
		if ( block.parentElement === document.body ) return;
		// An Outer+, transformed column or clipped container can trap a fixed
		// descendant regardless of its z-index. Keep the same DOM node (and its
		// events/content) but place it outside those ancestor stacking contexts.
		// Preserve inherited typography and custom properties before reparenting.
		const computed = window.getComputedStyle( block );
		const inherited = [ 'color', 'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-variant', 'line-height', 'letter-spacing', 'word-spacing', 'text-align', 'text-transform', 'text-indent', 'white-space', 'direction', 'writing-mode' ];
		const values = [];
		inherited.forEach( function( property ) { if ( ! block.style.getPropertyValue( property ) ) values.push( [ property, computed.getPropertyValue( property ) ] ); } );
		for ( let index = 0; index < computed.length; index++ ) {
			const property = computed[ index ];
			if ( property.indexOf( '--' ) === 0 && ! block.style.getPropertyValue( property ) ) values.push( [ property, computed.getPropertyValue( property ) ] );
		}
		values.forEach( function( entry ) { if ( entry[ 1 ] ) block.style.setProperty( entry[ 0 ], entry[ 1 ] ); } );
		document.body.appendChild( block );
	}

	function updateScrollVisibility() {
		framePending = false;
		const scrollTop = Math.max( 0, window.scrollY || document.documentElement.scrollTop || 0 );
		scrollBlocks.forEach( function( entry ) {
			const value = scrollTop >= entry.threshold ? '1' : '0';
			if ( entry.block.getAttribute( 'data-cni-fixed-scroll-visible' ) !== value ) entry.block.setAttribute( 'data-cni-fixed-scroll-visible', value );
		} );
	}

	function scheduleScrollVisibility() {
		if ( framePending ) return;
		framePending = true;
		window.requestAnimationFrame( updateScrollVisibility );
	}

	function initializeFixedDisplay( block ) {
		if ( initialized.has( block ) || block.closest( '.editor-styles-wrapper' ) ) return;
		initialized.add( block );
		moveToPageLayer( block );
		const threshold = Number( block.getAttribute( 'data-show-after-scroll' ) );
		if ( Number.isFinite( threshold ) && threshold > 0 ) {
			scrollBlocks.push( { block: block, threshold: Math.min( 100000, threshold ) } );
		} else if ( block.hasAttribute( 'data-show-after-scroll' ) ) {
			block.setAttribute( 'data-cni-fixed-scroll-visible', '1' );
		}
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
		updateScrollVisibility();
		if ( scrollBlocks.length ) {
			window.addEventListener( 'scroll', scheduleScrollVisibility, { passive: true } );
			window.addEventListener( 'pageshow', scheduleScrollVisibility );
		}
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initializeAll );
	} else {
		initializeAll();
	}
} )();

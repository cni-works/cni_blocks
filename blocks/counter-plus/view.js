( function() {
	'use strict';

	function finiteNumber( value, fallback ) {
		const parsed = Number( value );
		return Number.isFinite( parsed ) ? parsed : fallback;
	}
	function formatNumber( value, decimals, grouping, groupSeparator, decimalSeparator ) {
		const fixed = value.toFixed( decimals ).split( '.' );
		let integer = fixed[ 0 ];
		if ( grouping ) integer = integer.replace( /\B(?=(\d{3})+(?!\d))/g, groupSeparator );
		return decimals ? integer + decimalSeparator + fixed[ 1 ] : integer;
	}
	function initialize( counter ) {
		const output = counter.querySelector( '.cni-counter-plus__number' );
		if ( ! output ) return;
		const start = finiteNumber( counter.dataset.start, 0 );
		const end = finiteNumber( counter.dataset.end, 100 );
		const decimals = Math.max( 0, Math.min( 6, parseInt( counter.dataset.decimals, 10 ) || 0 ) );
		const duration = Math.max( 0, finiteNumber( counter.dataset.duration, 2 ) ) * 1000;
		const grouping = counter.dataset.grouping !== '0';
		const groupSeparator = counter.dataset.groupSeparator || ',';
		const decimalSeparator = counter.dataset.decimalSeparator || '.';
		const render = function( value ) { output.textContent = formatNumber( value, decimals, grouping, groupSeparator, decimalSeparator ); };
		const reduced = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
		let started = false;
		function run() {
			if ( started ) return;
			started = true;
			if ( reduced || duration === 0 || start === end ) { render( end ); return; }
			const begin = performance.now();
			function frame( now ) {
				const progress = Math.min( 1, ( now - begin ) / duration );
				const eased = counter.dataset.easing === 'linear' ? progress : 1 - Math.pow( 1 - progress, 3 );
				render( start + ( end - start ) * eased );
				if ( progress < 1 ) window.requestAnimationFrame( frame );
			}
			window.requestAnimationFrame( frame );
		}
		if ( reduced || !( 'IntersectionObserver' in window ) ) { run(); return; }
		render( start );
		const observer = new IntersectionObserver( function( entries ) {
			if ( entries.some( function( entry ) { return entry.isIntersecting; } ) ) { observer.disconnect(); run(); }
		}, { threshold: 0.2 } );
		observer.observe( counter );
	}
	document.querySelectorAll( '.wp-block-cni-blocks-counter-plus' ).forEach( initialize );
} )();

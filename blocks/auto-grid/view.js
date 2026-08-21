( function() {
	'use strict';

	function getCards( grid ) {
		return Array.prototype.filter.call( grid.children, function( child ) {
			return child.classList.contains( 'wp-block-cni-blocks-grid-card' );
		} );
	}

	function clearLastRowOffset( cards ) {
		cards.forEach( function( card ) {
			card.classList.remove( 'cni-grid-card--last-row-centered' );
			card.style.removeProperty( '--cni-grid-last-row-offset' );
		} );
	}

	function centerIncompleteLastRow( grid ) {
		const cards = getCards( grid );

		clearLastRowOffset( cards );

		if ( cards.length < 2 ) {
			return;
		}

		const styles = window.getComputedStyle( grid );
		const minWidth = parseFloat( styles.getPropertyValue( '--cni-grid-min-width-current' ) );
		const gap = parseFloat( styles.columnGap ) || 0;
		const columns = minWidth > 0 ? Math.max( 1, Math.floor( ( grid.clientWidth + gap ) / ( minWidth + gap ) ) ) : 1;
		const remaining = cards.length % columns;
		const cardWidth = columns > 0 ? ( grid.clientWidth - ( columns - 1 ) * gap ) / columns : 0;
		const columnStep = cardWidth + gap;

		if ( columns < 2 || remaining === 0 || cardWidth <= 0 ) {
			return;
		}

		const offset = ( columns - remaining ) * columnStep / 2;

		cards.slice( -remaining ).forEach( function( card ) {
			card.classList.add( 'cni-grid-card--last-row-centered' );
			card.style.setProperty( '--cni-grid-last-row-offset', offset + 'px' );
		} );
	}

	function initializeGrid( grid ) {
		const update = function() {
			centerIncompleteLastRow( grid );
		};

		update();

		if ( typeof window.ResizeObserver === 'function' ) {
			const observer = new window.ResizeObserver( update );
			observer.observe( grid );
		}
	}

	function initialize() {
		document.querySelectorAll( '.wp-block-cni-blocks-auto-grid[data-last-row-alignment="center"]' ).forEach( initializeGrid );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize );
	} else {
		initialize();
	}
} )();

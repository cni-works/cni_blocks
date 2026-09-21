( function() {
	'use strict';

	function getCards( grid ) {
		return Array.prototype.filter.call( grid.children, function( child ) {
			return child.classList.contains( 'wp-block-cni-blocks-grid-card' );
		} );
	}

	function firstBadgeMedia( card ) {
		const inner = card ? card.querySelector( ':scope > .cni-grid-card__inner' ) : null;
		if ( ! inner ) return null;
		const first = inner.firstElementChild;
		return first && ( first.classList.contains( 'wp-block-image' ) || first.classList.contains( 'wp-block-cover' ) ) ? first : null;
	}

	function clearBadgeMediaPosition( card ) {
		[ '--cni-grid-badge-anchor-left', '--cni-grid-badge-anchor-top', '--cni-grid-badge-anchor-width', '--cni-grid-badge-anchor-height' ].forEach( function( property ) {
			card.style.removeProperty( property );
		} );
	}

	function updateBadgeMediaPosition( card ) {
		const media = firstBadgeMedia( card );
		if ( ! media || ! media.getBoundingClientRect ) {
			clearBadgeMediaPosition( card );
			return null;
		}
		const cardRect = card.getBoundingClientRect();
		const mediaRect = media.getBoundingClientRect();
		if ( cardRect.width < 1 || cardRect.height < 1 || mediaRect.width < 1 || mediaRect.height < 1 ) return media;
		card.style.setProperty( '--cni-grid-badge-anchor-left', ( mediaRect.left - cardRect.left - card.clientLeft ) + 'px' );
		card.style.setProperty( '--cni-grid-badge-anchor-top', ( mediaRect.top - cardRect.top - card.clientTop ) + 'px' );
		card.style.setProperty( '--cni-grid-badge-anchor-width', mediaRect.width + 'px' );
		card.style.setProperty( '--cni-grid-badge-anchor-height', mediaRect.height + 'px' );
		return media;
	}

	function initializeBadgeMediaCard( card ) {
		const update = function() { updateBadgeMediaPosition( card ); };
		let observedMedia = firstBadgeMedia( card );
		const observer = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver( update ) : null;
		if ( observer ) {
			observer.observe( card );
			if ( observedMedia ) observer.observe( observedMedia );
		}
		const observeImages = function() {
			card.querySelectorAll( '.cni-grid-card__inner img' ).forEach( function( image ) {
				if ( ! image.dataset.cniGridBadgeObserved ) {
					image.dataset.cniGridBadgeObserved = '1';
					image.addEventListener( 'load', update );
				}
			} );
		};
		const mutations = typeof window.MutationObserver === 'function' ? new window.MutationObserver( function() {
			const nextMedia = firstBadgeMedia( card );
			if ( observer && nextMedia && nextMedia !== observedMedia ) observer.observe( nextMedia );
			observedMedia = nextMedia;
			observeImages();
			update();
		} ) : null;
		const inner = card.querySelector( ':scope > .cni-grid-card__inner' );
		if ( mutations && inner ) mutations.observe( inner, { childList: true, subtree: true } );
		observeImages();
		window.requestAnimationFrame( update );
	}

	function clearLastRowOffset( cards ) {
		cards.forEach( function( card ) {
			card.classList.remove( 'cni-grid-card--last-row-centered' );
			card.style.removeProperty( '--cni-grid-last-row-offset' );
		} );
	}

	function clearFlowArrows( cards ) {
		cards.forEach( function( card ) {
			card.removeAttribute( 'data-cni-flow-arrow' );
			card.style.removeProperty( '--cni-grid-flow-arrow-y' );
		} );
	}

	function flowArrowVerticalPosition( card, alignment ) {
		const image = alignment !== 'card' ? card.querySelector( 'img' ) : null;
		if ( ! image || ! image.getBoundingClientRect ) return 50;

		const cardRect = card.getBoundingClientRect();
		const imageRect = image.getBoundingClientRect();
		if ( cardRect.height < 1 || imageRect.height < 1 ) return 50;

		return Math.max( 0, Math.min( 100, ( ( imageRect.top - cardRect.top + imageRect.height / 2 ) / cardRect.height ) * 100 ) );
	}

	function updateFlowArrows( grid ) {
		const cards = getCards( grid );
		const isMobile = window.matchMedia && window.matchMedia( '(max-width: 767px)' ).matches;
		const mobileDirection = grid.getAttribute( 'data-cni-flow-mobile-direction' ) || 'down';
		const verticalAlign = [ 'auto', 'card', 'image' ].indexOf( grid.getAttribute( 'data-cni-flow-vertical-align' ) ) !== -1 ? grid.getAttribute( 'data-cni-flow-vertical-align' ) : 'auto';

		clearFlowArrows( cards );
		if ( ! grid.hasAttribute( 'data-cni-flow-arrows' ) || cards.length < 2 || ( isMobile && mobileDirection === 'none' ) ) {
			return;
		}

		cards.slice( 0, -1 ).forEach( function( card, index ) {
			const next = cards[ index + 1 ];
			const sameRow = Math.abs( card.offsetTop - next.offsetTop ) < 4;

			if ( sameRow ) {
				card.setAttribute( 'data-cni-flow-arrow', 'right' );
				card.style.setProperty( '--cni-grid-flow-arrow-y', flowArrowVerticalPosition( card, verticalAlign ) + '%' );
			} else if ( isMobile && mobileDirection === 'down' ) {
				card.setAttribute( 'data-cni-flow-arrow', 'down' );
			}
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
			if ( grid.getAttribute( 'data-last-row-alignment' ) === 'center' ) {
				centerIncompleteLastRow( grid );
			} else {
				clearLastRowOffset( getCards( grid ) );
			}
			updateFlowArrows( grid );
		};

		update();

		if ( typeof window.ResizeObserver === 'function' ) {
			const observer = new window.ResizeObserver( update );
			observer.observe( grid );
		}
	}

	function initialize() {
		document.querySelectorAll( '.wp-block-cni-blocks-auto-grid[data-last-row-alignment="center"], .wp-block-cni-blocks-auto-grid[data-cni-flow-arrows]' ).forEach( initializeGrid );
		document.querySelectorAll( '.wp-block-cni-blocks-grid-card[data-cni-grid-badge-anchor="media"]' ).forEach( initializeBadgeMediaCard );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initialize );
	} else {
		initialize();
	}
} )();

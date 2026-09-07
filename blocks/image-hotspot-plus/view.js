( function() {
	'use strict';
	function syncModal( root ) { if ( root && root.getAttribute( 'data-card-display' ) === 'modal' ) root.classList.toggle( 'is-modal-open', !! root.querySelector( '.cni-image-hotspot-plus__card.is-open' ) ); }
	function closeAll( root, except ) { root.querySelectorAll( '.cni-image-hotspot-plus__card.is-open' ).forEach( function( card ) { if ( card !== except ) card.classList.remove( 'is-open' ); } ); root.querySelectorAll( '.cni-image-hotspot-plus__point.is-active' ).forEach( function( point ) { if ( point.getAttribute( 'aria-controls' ) !== ( except && except.id ) ) point.classList.remove( 'is-active' ); } ); syncModal( root ); }
	document.addEventListener( 'click', function( event ) {
		const point = event.target.closest( '.cni-image-hotspot-plus__point' );
		const close = event.target.closest( '.cni-image-hotspot-plus__card-close, .cni-image-hotspot-plus__modal-backdrop' );
		if ( close ) { const root = close.closest( '.wp-block-cni-blocks-image-hotspot-plus' ); const card = close.closest( '.cni-image-hotspot-plus__card' ); if ( root && close.classList.contains( 'cni-image-hotspot-plus__modal-backdrop' ) ) { closeAll( root, null ); return; } if ( card && root ) { card.classList.remove( 'is-open' ); const trigger = root.querySelector( '[aria-controls="' + card.id + '"]' ); if ( trigger ) { trigger.classList.remove( 'is-active' ); trigger.setAttribute( 'aria-expanded', 'false' ); trigger.focus(); } syncModal( root ); } return; }
		if ( ! point || point.closest( '[data-interaction="hover"]' ) ) return;
		const root = point.closest( '.wp-block-cni-blocks-image-hotspot-plus' ); const card = document.getElementById( point.getAttribute( 'aria-controls' ) ); if ( ! root || ! card ) return;
		const open = ! card.classList.contains( 'is-open' ); closeAll( root, open ? card : null ); card.classList.toggle( 'is-open', open ); point.classList.toggle( 'is-active', open ); point.setAttribute( 'aria-expanded', open ? 'true' : 'false' ); syncModal( root );
	} );
	document.addEventListener( 'keydown', function( event ) { if ( event.key !== 'Escape' ) return; document.querySelectorAll( '.wp-block-cni-blocks-image-hotspot-plus' ).forEach( function( root ) { closeAll( root, null ); } ); } );
	document.querySelectorAll( '.wp-block-cni-blocks-image-hotspot-plus[data-interaction="hover"] .cni-image-hotspot-plus__point' ).forEach( function( point ) { const root = point.closest( '.wp-block-cni-blocks-image-hotspot-plus' ); const card = document.getElementById( point.getAttribute( 'aria-controls' ) ); if ( ! root || ! card ) return; const open = function() { closeAll( root, card ); card.classList.add( 'is-open' ); point.classList.add( 'is-active' ); point.setAttribute( 'aria-expanded', 'true' ); }; point.addEventListener( 'mouseenter', open ); point.addEventListener( 'focus', open ); } );
} )();

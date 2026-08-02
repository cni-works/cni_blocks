( function() {
	'use strict';

	let instanceNumber = 0;

	function directTabItems( panels ) {
		return Array.prototype.filter.call( panels.children, function( child ) {
			return child.classList.contains( 'wp-block-cni-blocks-tab-item' );
		} );
	}

	function initTabs( root ) {
		const tablist = root.querySelector( ':scope > .cni-tabs__tablist' );
		const panelsContainer = root.querySelector( ':scope > .cni-tabs__panels' );
		if ( ! tablist || ! panelsContainer ) {
			return;
		}

		const items = directTabItems( panelsContainer );
		if ( ! items.length ) {
			return;
		}

		instanceNumber += 1;
		const buttons = [];
		const panels = [];
		let activeIndex = parseInt( root.dataset.activeIndex || '0', 10 );
		activeIndex = Number.isFinite( activeIndex ) ? Math.max( 0, Math.min( items.length - 1, activeIndex ) ) : 0;

		items.forEach( function( item, index ) {
			const buttonId = 'cni-tabs-' + instanceNumber + '-tab-' + index;
			const panelId = 'cni-tabs-' + instanceNumber + '-panel-' + index;
			const button = document.createElement( 'button' );
			const panel = item.querySelector( ':scope > .cni-tab-item__panel' );
			if ( ! panel ) {
				return;
			}

			button.type = 'button';
			button.id = buttonId;
			button.className = 'cni-tabs__tab';
			button.setAttribute( 'role', 'tab' );
			button.setAttribute( 'aria-controls', panelId );
			button.style.setProperty( '--cni-tab-active-color', item.dataset.activeColor || '#2385b8' );
			button.style.setProperty( '--cni-tab-active-text', item.dataset.activeTextColor || '#ffffff' );

			if ( item.dataset.iconBefore ) {
				const before = document.createElement( 'span' );
				before.className = 'cni-tabs__icon';
				before.setAttribute( 'aria-hidden', 'true' );
				before.textContent = item.dataset.iconBefore;
				button.appendChild( before );
			}
			if ( item.dataset.faBefore ) {
				const fontAwesomeBefore = document.createElement( 'i' );
				fontAwesomeBefore.className = 'cni-tabs__icon ' + item.dataset.faBefore;
				fontAwesomeBefore.setAttribute( 'aria-hidden', 'true' );
				button.appendChild( fontAwesomeBefore );
			}
			const label = document.createElement( 'span' );
			label.textContent = item.dataset.tabLabel || 'タブ';
			button.appendChild( label );
			if ( item.dataset.iconAfter ) {
				const after = document.createElement( 'span' );
				after.className = 'cni-tabs__icon';
				after.setAttribute( 'aria-hidden', 'true' );
				after.textContent = item.dataset.iconAfter;
				button.appendChild( after );
			}
			if ( item.dataset.faAfter ) {
				const fontAwesomeAfter = document.createElement( 'i' );
				fontAwesomeAfter.className = 'cni-tabs__icon ' + item.dataset.faAfter;
				fontAwesomeAfter.setAttribute( 'aria-hidden', 'true' );
				button.appendChild( fontAwesomeAfter );
			}

			panel.id = panelId;
			panel.setAttribute( 'role', 'tabpanel' );
			panel.setAttribute( 'aria-labelledby', buttonId );
			panel.tabIndex = 0;
			tablist.appendChild( button );
			buttons.push( button );
			panels.push( panel );
		} );

		function activate( index, moveFocus ) {
			if ( index < 0 || index >= buttons.length ) {
				return;
			}
			activeIndex = index;
			root.style.setProperty( '--cni-tabs-current-color', buttons[index].style.getPropertyValue( '--cni-tab-active-color' ) );
			buttons.forEach( function( button, buttonIndex ) {
				const active = buttonIndex === index;
				button.classList.toggle( 'is-active', active );
				button.setAttribute( 'aria-selected', active ? 'true' : 'false' );
				button.tabIndex = active ? 0 : -1;
				panels[buttonIndex].hidden = ! active;
			} );
			if ( moveFocus ) {
				buttons[index].focus();
			}
		}

		buttons.forEach( function( button, index ) {
			button.addEventListener( 'click', function() { activate( index, false ); } );
			button.addEventListener( 'keydown', function( event ) {
				let nextIndex = null;
				if ( event.key === 'ArrowRight' ) {
					nextIndex = ( index + 1 ) % buttons.length;
				} else if ( event.key === 'ArrowLeft' ) {
					nextIndex = ( index - 1 + buttons.length ) % buttons.length;
				} else if ( event.key === 'Home' ) {
					nextIndex = 0;
				} else if ( event.key === 'End' ) {
					nextIndex = buttons.length - 1;
				}
				if ( nextIndex !== null ) {
					event.preventDefault();
					activate( nextIndex, true );
				}
			} );
		} );

		root.classList.add( 'is-enhanced' );
		activate( activeIndex, false );
	}

	function initAllTabs() {
		document.querySelectorAll( '.wp-block-cni-blocks-tabs' ).forEach( initTabs );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', initAllTabs );
	} else {
		initAllTabs();
	}
} )();

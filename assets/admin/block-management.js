( function() {
	'use strict';
	const form = document.getElementById( 'cni-blocks-management' );
	if ( ! form ) return;
	const inputs = Array.from( form.querySelectorAll( '[data-cni-blocks-unit]' ) );
	function update() {
		const count = list => list.reduce( ( sum, input ) => sum + Number( input.dataset.cniBlocksCount ), 0 );
		const enabled = count( inputs.filter( input => input.checked ) );
		const total = count( inputs );
		form.querySelector( '[data-cni-blocks-summary]' ).textContent = '未保存の設定：ON ' + enabled + ' ／ OFF ' + ( total - enabled ) + '（全' + total + 'ブロック）';
		inputs.forEach( input => { input.closest( 'tr' ).querySelector( '[data-cni-blocks-state]' ).textContent = input.checked ? 'ON' : 'OFF'; } );
	}
	form.addEventListener( 'change', function( event ) {
		if ( ! event.target.matches( '[data-cni-blocks-unit]' ) ) return;
		inputs.filter( input => input.dataset.cniBlocksUnit === event.target.dataset.cniBlocksUnit ).forEach( input => { input.checked = event.target.checked; } );
		update();
	} );
	form.querySelectorAll( '[data-cni-blocks-all]' ).forEach( button => {
		button.addEventListener( 'click', function() {
			if ( button.dataset.cniBlocksAll === 'off' && ! window.confirm( button.dataset.confirm ) ) return;
			inputs.forEach( input => { input.checked = button.dataset.cniBlocksAll === 'on'; } );
			update();
		} );
	} );
} )();

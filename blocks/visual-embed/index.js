( function( blocks, element, blockEditor, components, i18n, serverSideRender ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InspectorControls } = blockEditor;
	const { ColorPalette, Notice, PanelBody, RangeControl, TextareaControl, TextControl, ToggleControl } = components;
	const ServerSideRender = serverSideRender.ServerSideRender || serverSideRender.default || serverSideRender;

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function extractEmbedUrl( value ) {
		const input = ( value || '' ).trim();
		if ( ! input ) {
			return '';
		}

		if ( input.toLowerCase().indexOf( '<iframe' ) !== -1 ) {
			const documentNode = new window.DOMParser().parseFromString( input, 'text/html' );
			const iframe = documentNode.querySelector( 'iframe' );
			return iframe ? ( iframe.getAttribute( 'src' ) || '' ).trim() : '';
		}

		return input;
	}

	function isAllowedMapUrl( value ) {
		try {
			const url = new window.URL( value );
			const allowedHost = url.hostname === 'www.google.com' || url.hostname === 'google.com' || url.hostname === 'maps.google.com';
			const allowedPath = url.pathname.indexOf( '/maps/embed' ) === 0 || ( url.hostname === 'maps.google.com' && url.pathname.indexOf( '/maps' ) === 0 );
			return url.protocol === 'https:' && allowedHost && allowedPath;
		} catch ( error ) {
			return false;
		}
	}

	blocks.registerBlockType( 'cni-blocks/visual-embed', {
		apiVersion: 3,
		title: __( '地図+', 'cni-blocks' ),
		description: __( 'Googleマップを全幅またはレスポンシブな高さで表示します。', 'cni-blocks' ),
		icon: 'location-alt',
		category: 'cni-blocks',
		attributes: {
			embedUrl: { type: 'string', default: '' },
			title: { type: 'string', default: '地図' },
			width: { type: 'number', default: 100 },
			heightPc: { type: 'number', default: 450 },
			heightTablet: { type: 'number', default: 400 },
			heightMobile: { type: 'number', default: 320 },
			radius: { type: 'number', default: 0 },
			showBorder: { type: 'boolean', default: false },
			borderWidth: { type: 'number', default: 1 },
			borderColor: { type: 'string', default: '#dddddd' },
			lazyLoad: { type: 'boolean', default: true },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const blockProps = useBlockProps();
			const hasUrl = !! attributes.embedUrl;
			const isAllowed = hasUrl && isAllowedMapUrl( attributes.embedUrl );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'Googleマップ埋め込み', 'cni-blocks' ), initialOpen: true },
						el( TextareaControl, {
							label: __( '埋め込みコードまたはURL', 'cni-blocks' ),
							help: __( 'Googleマップの「地図を埋め込む」で取得したiframeコードを貼り付けてください。保存されるのはURLだけです。', 'cni-blocks' ),
							value: attributes.embedUrl || '',
							onChange: function( value ) { setAttributes( { embedUrl: extractEmbedUrl( value ) } ); },
						} ),
						el( TextControl, {
							label: __( '地図の説明', 'cni-blocks' ),
							help: __( '例：店舗所在地の地図。読み上げにも使用されます。', 'cni-blocks' ),
							value: attributes.title || '',
							onChange: function( value ) { setAttributes( { title: value } ); },
						} ),
						el( ToggleControl, {
							label: __( '遅延読み込みを使用', 'cni-blocks' ),
							checked: attributes.lazyLoad !== false,
							onChange: function( value ) { setAttributes( { lazyLoad: !! value } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( 'サイズ', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '幅（%）', 'cni-blocks' ), value: numberOr( attributes.width, 100 ), min: 20, max: 100, onChange: function( value ) { setAttributes( { width: numberOr( value, 100 ) } ); } } ),
						el( RangeControl, { label: __( '高さ：PC（px）', 'cni-blocks' ), value: numberOr( attributes.heightPc, 450 ), min: 120, max: 1000, onChange: function( value ) { setAttributes( { heightPc: numberOr( value, 450 ) } ); } } ),
						el( RangeControl, { label: __( '高さ：タブレット（px）', 'cni-blocks' ), value: numberOr( attributes.heightTablet, 400 ), min: 120, max: 1000, onChange: function( value ) { setAttributes( { heightTablet: numberOr( value, 400 ) } ); } } ),
						el( RangeControl, { label: __( '高さ：モバイル（px）', 'cni-blocks' ), value: numberOr( attributes.heightMobile, 320 ), min: 120, max: 1000, onChange: function( value ) { setAttributes( { heightMobile: numberOr( value, 320 ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '枠線・角丸', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '角丸（px）', 'cni-blocks' ), value: numberOr( attributes.radius, 0 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { radius: numberOr( value, 0 ) } ); } } ),
						el( ToggleControl, { label: __( '枠線を表示', 'cni-blocks' ), checked: !! attributes.showBorder, onChange: function( value ) { setAttributes( { showBorder: !! value } ); } } ),
						attributes.showBorder ? el( RangeControl, { label: __( '枠線の太さ（px）', 'cni-blocks' ), value: numberOr( attributes.borderWidth, 1 ), min: 1, max: 12, onChange: function( value ) { setAttributes( { borderWidth: numberOr( value, 1 ) } ); } } ) : null,
						attributes.showBorder ? el( 'p', null, __( '枠線の色', 'cni-blocks' ) ) : null,
						attributes.showBorder ? el( ColorPalette, { value: attributes.borderColor || '#dddddd', clearable: false, onChange: function( value ) { setAttributes( { borderColor: value || '#dddddd' } ); } } ) : null
					)
				),
				el(
					'div',
					blockProps,
					! hasUrl ? el( Notice, { status: 'info', isDismissible: false }, __( '右側の設定にGoogleマップの埋め込みコードを貼り付けてください。', 'cni-blocks' ) ) : null,
					hasUrl && ! isAllowed ? el( Notice, { status: 'error', isDismissible: false }, __( 'Googleマップの有効な埋め込みURLを確認できません。', 'cni-blocks' ) ) : null,
					isAllowed ? el( ServerSideRender, { block: 'cni-blocks/visual-embed', attributes: attributes } ) : null
				)
			);
		},
		save: function() {
			return null;
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n, window.wp.serverSideRender );

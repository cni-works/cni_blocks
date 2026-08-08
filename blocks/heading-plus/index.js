( function( blocks, element, blockEditor, components, data, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useEffect } = element;
	const { useSelect } = data;
	const { AlignmentToolbar, BlockControls, ColorPalette, InspectorControls, RichText, useBlockProps } = blockEditor;
	const { PanelBody, RangeControl, SelectControl } = components;
	const googleFonts = [ '', 'Noto Sans JP', 'Noto Serif JP', 'M PLUS 1p', 'M PLUS Rounded 1c', 'Zen Kaku Gothic New', 'Zen Maru Gothic', 'Zen Old Mincho', 'Zen Kurenaido', 'Shippori Mincho', 'Kosugi Maru', 'Yuji Boku', 'Kiwi Maru', 'Kaisei Decol', 'Kaisei Opti', 'Mochiy Pop One', 'Klee One', 'Yomogi', 'Yusei Magic', 'Roboto', 'Lato', 'Montserrat', 'Poppins', 'Josefin Sans', 'Quicksand', 'Damion', 'Caveat', 'Cinzel', 'Dancing Script', 'Tangerine' ];
	const fontWeights = {
		'Zen Old Mincho': [ '400', '500', '600', '700', '800' ], 'Shippori Mincho': [ '400', '500', '600', '700', '800' ],
		'Kiwi Maru': [ '300', '400', '500' ], 'Kaisei Decol': [ '400', '500', '700' ], 'Kaisei Opti': [ '400', '500', '700' ],
		'Mochiy Pop One': [ '400' ], 'Zen Kurenaido': [ '400' ], 'Klee One': [ '400', '600' ], 'Yomogi': [ '400' ], 'Yusei Magic': [ '400' ],
		'Kosugi Maru': [ '400' ], 'Yuji Boku': [ '400' ], 'Lato': [ '300', '400', '700', '900' ],
		'Poppins': [ '100', '200', '300', '400', '500', '600', '700', '800', '900' ],
		'Josefin Sans': [ '300', '400', '500', '600', '700' ], 'Quicksand': [ '300', '400', '500', '600', '700' ],
		'Damion': [ '400' ], 'Caveat': [ '400', '500', '600', '700' ], 'Cinzel': [ '400', '500', '600', '700', '800', '900' ],
		'Dancing Script': [ '400', '500', '600', '700' ], 'Tangerine': [ '400', '700' ],
	};
	const loadedFonts = {};

	function numberOr( value, fallback ) { return typeof value === 'number' ? value : fallback; }
	function loadFont( family ) {
		if ( ! family || loadedFonts[ family ] ) return;
		loadedFonts[ family ] = true;
		const available = fontWeights[ family ] || [ '300', '400', '500', '600', '700', '800', '900' ];
		const weights = available.length === 1 ? '' : ':wght@' + available.join( ';' );
		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent( family ).replace( /%20/g, '+' ) + weights + '&display=swap';
		document.head.appendChild( link );
	}
	function styleFor( a ) {
		return {
			'--cni-heading-font': a.fontFamily ? '"' + a.fontFamily + '", sans-serif' : 'inherit',
			'--cni-heading-weight': a.fontWeight || '700',
			'--cni-heading-style': a.fontStyle || 'normal',
			'--cni-heading-transform': a.textTransform || 'none',
			'--cni-heading-size-pc': numberOr( a.fontSizePc, 40 ) + 'px',
			'--cni-heading-size-tablet': numberOr( a.fontSizeTablet, 34 ) + 'px',
			'--cni-heading-size-mobile': numberOr( a.fontSizeMobile, 28 ) + 'px',
			'--cni-heading-line-height': numberOr( a.lineHeight, 1.3 ),
			'--cni-heading-letter-spacing': numberOr( a.letterSpacing, 0 ) + 'px',
			'--cni-heading-color': a.textColor || 'inherit',
			'--cni-heading-background': a.backgroundColor || 'transparent',
			'--cni-heading-align': a.alignment || 'left',
			'--cni-heading-padding-y': numberOr( a.paddingVertical, 0 ) + 'px',
			'--cni-heading-padding-x': numberOr( a.paddingHorizontal, 0 ) + 'px',
		};
	}
	function propsFor( a, save, editorDevice ) {
		const props = { style: styleFor( a ) };
		if ( a.fontFamily ) props[ 'data-google-font' ] = a.fontFamily;
		if ( ! save && editorDevice ) props[ 'data-editor-device' ] = editorDevice;
		return save ? blockEditor.useBlockProps.save( props ) : useBlockProps( props );
	}
	function palette( label, value, onChange ) {
		return el( element.Fragment, null, el( 'p', null, label ), el( ColorPalette, { value: value, onChange: onChange, clearable: true } ) );
	}

	blocks.registerBlockType( 'cni-blocks/heading-plus', {
		apiVersion: 3,
		title: __( '見出し+', 'cni-blocks' ), icon: 'heading', category: 'cni-blocks',
		description: __( '端末別の文字サイズ、Google Fonts、字間、色を設定できる見出しです。', 'cni-blocks' ),
		attributes: {
			content: { type: 'string', source: 'html', selector: '.cni-heading-plus__text', default: '見出しを入力' }, level: { type: 'number', default: 2 }, fontFamily: { type: 'string', default: '' }, fontWeight: { type: 'string', default: '700' }, fontStyle: { type: 'string', default: 'normal' }, textTransform: { type: 'string', default: 'none' }, fontSizePc: { type: 'number', default: 40 }, fontSizeTablet: { type: 'number', default: 34 }, fontSizeMobile: { type: 'number', default: 28 }, lineHeight: { type: 'number', default: 1.3 }, letterSpacing: { type: 'number', default: 0 }, textColor: { type: 'string', default: '' }, backgroundColor: { type: 'string', default: '' }, alignment: { type: 'string', default: 'left' }, paddingVertical: { type: 'number', default: 0 }, paddingHorizontal: { type: 'number', default: 0 },
		},
		supports: { anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			const editorDevice = useSelect( function( select ) {
				const editorStore = select( 'core/editor' );
				return editorStore && editorStore.getDeviceType ? editorStore.getDeviceType() : 'Desktop';
			}, [] );
			useEffect( function() { loadFont( a.fontFamily ); }, [ a.fontFamily ] );
			return el( element.Fragment, null,
				el( BlockControls, null, el( AlignmentToolbar, { value: a.alignment || 'left', onChange: function( value ) { props.setAttributes( { alignment: value || 'left' } ); } } ) ),
				el( InspectorControls, null,
					el( PanelBody, { title: __( '見出し設定', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( 'HTML見出しレベル', 'cni-blocks' ), value: a.level || 2, options: [ 1, 2, 3, 4, 5, 6 ].map( function( level ) { return { label: 'H' + level, value: level }; } ), onChange: function( value ) { props.setAttributes( { level: parseInt( value, 10 ) || 2 } ); } } ),
						el( SelectControl, { label: __( 'フォント', 'cni-blocks' ), help: __( 'Google Fontsを選ぶと編集画面と公開画面で必要なフォントだけを読み込みます。', 'cni-blocks' ), value: a.fontFamily || '', options: googleFonts.map( function( font ) { return { label: font || __( 'テーマのフォント', 'cni-blocks' ), value: font }; } ), onChange: function( value ) { const available = fontWeights[ value ] || [ '300', '400', '500', '600', '700', '800', '900' ]; props.setAttributes( { fontFamily: value, fontWeight: available.indexOf( a.fontWeight || '700' ) !== -1 ? ( a.fontWeight || '700' ) : ( available.indexOf( '400' ) !== -1 ? '400' : available[ 0 ] ) } ); } } ),
						el( SelectControl, { label: __( 'フォントの太さ', 'cni-blocks' ), value: a.fontWeight || '700', options: ( fontWeights[ a.fontFamily ] || [ '300', '400', '500', '600', '700', '800', '900' ] ).map( function( weight ) { return { label: weight, value: weight }; } ), onChange: function( value ) { props.setAttributes( { fontWeight: value } ); } } ),
						el( SelectControl, { label: __( 'フォントのスタイル', 'cni-blocks' ), value: a.fontStyle || 'normal', options: [ { label: __( '普通', 'cni-blocks' ), value: 'normal' }, { label: __( '斜体', 'cni-blocks' ), value: 'italic' } ], onChange: function( value ) { props.setAttributes( { fontStyle: value } ); } } ),
						el( SelectControl, { label: __( '文字の変形', 'cni-blocks' ), value: a.textTransform || 'none', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '大文字', 'cni-blocks' ), value: 'uppercase' }, { label: __( '小文字', 'cni-blocks' ), value: 'lowercase' }, { label: __( '単語の先頭を大文字', 'cni-blocks' ), value: 'capitalize' } ], onChange: function( value ) { props.setAttributes( { textTransform: value } ); } } )
					),
					el( PanelBody, { title: __( 'サイズ・間隔', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '文字サイズ：PC（px）', 'cni-blocks' ), value: numberOr( a.fontSizePc, 40 ), min: 12, max: 160, onChange: function( value ) { props.setAttributes( { fontSizePc: value } ); } } ),
						el( RangeControl, { label: __( '文字サイズ：タブレット（px）', 'cni-blocks' ), value: numberOr( a.fontSizeTablet, 34 ), min: 12, max: 140, onChange: function( value ) { props.setAttributes( { fontSizeTablet: value } ); } } ),
						el( RangeControl, { label: __( '文字サイズ：モバイル（px）', 'cni-blocks' ), value: numberOr( a.fontSizeMobile, 28 ), min: 12, max: 100, onChange: function( value ) { props.setAttributes( { fontSizeMobile: value } ); } } ),
						el( RangeControl, { label: __( '行の高さ', 'cni-blocks' ), value: numberOr( a.lineHeight, 1.3 ), min: 0.8, max: 3, step: 0.1, onChange: function( value ) { props.setAttributes( { lineHeight: value } ); } } ),
						el( RangeControl, { label: __( '文字間隔（px）', 'cni-blocks' ), value: numberOr( a.letterSpacing, 0 ), min: -5, max: 30, step: 0.5, onChange: function( value ) { props.setAttributes( { letterSpacing: value } ); } } ),
						el( RangeControl, { label: __( '上下の内側余白（px）', 'cni-blocks' ), value: numberOr( a.paddingVertical, 0 ), min: 0, max: 100, onChange: function( value ) { props.setAttributes( { paddingVertical: value } ); } } ),
						el( RangeControl, { label: __( '左右の内側余白（px）', 'cni-blocks' ), value: numberOr( a.paddingHorizontal, 0 ), min: 0, max: 100, onChange: function( value ) { props.setAttributes( { paddingHorizontal: value } ); } } )
					),
					el( PanelBody, { title: __( '色', 'cni-blocks' ), initialOpen: false }, palette( __( '文字色', 'cni-blocks' ), a.textColor, function( value ) { props.setAttributes( { textColor: value || '' } ); } ), palette( __( '背景色', 'cni-blocks' ), a.backgroundColor, function( value ) { props.setAttributes( { backgroundColor: value || '' } ); } ) )
				),
				el( 'div', propsFor( a, false, editorDevice ), el( RichText, { tagName: 'h' + ( a.level || 2 ), className: 'cni-heading-plus__text', value: a.content, allowedFormats: [ 'core/bold', 'core/italic', 'core/link' ], placeholder: __( '見出しを入力', 'cni-blocks' ), onChange: function( value ) { props.setAttributes( { content: value } ); } } ) )
			);
		},
		save: function( props ) {
			const a = props.attributes;
			return el( 'div', propsFor( a, true ), el( RichText.Content, { tagName: 'h' + ( a.level || 2 ), className: 'cni-heading-plus__text', value: a.content } ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.data, window.wp.i18n );

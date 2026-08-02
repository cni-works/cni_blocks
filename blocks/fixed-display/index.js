( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls } = blockEditor;
	const { ColorPalette, Notice, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const INNER_TEMPLATE = [
		[ 'core/paragraph', { placeholder: __( '固定表示する内容を入力', 'cni-blocks' ) } ],
	];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function px( value, fallback ) {
		return numberOr( value, fallback ) + 'px';
	}

	function getFixedStyle( attributes ) {
		return {
			'--cni-fixed-offset-x': px( attributes.offsetX, 24 ),
			'--cni-fixed-offset-y': px( attributes.offsetY, 24 ),
			'--cni-fixed-width': px( attributes.width, 360 ),
			'--cni-fixed-max-viewport-width': numberOr( attributes.maxViewportWidth, 90 ) + 'vw',
			'--cni-fixed-padding': px( attributes.padding, 16 ),
			'--cni-fixed-background': attributes.transparentBackground ? 'transparent' : ( attributes.backgroundColor || '#ffffff' ),
			'--cni-fixed-radius': px( attributes.radius, 8 ),
			'--cni-fixed-border-width': attributes.showBorder ? px( attributes.borderWidth, 1 ) : '0px',
			'--cni-fixed-border-color': attributes.borderColor || '#dddddd',
			'--cni-fixed-shadow': attributes.showShadow !== false ? '0 8px 28px rgba(0, 0, 0, 0.2)' : 'none',
			'--cni-fixed-z-index': numberOr( attributes.zIndex, 999 ),
		};
	}

	function getFixedBlockProps( attributes, save ) {
		const props = {
			style: getFixedStyle( attributes ),
			'data-position': attributes.position || 'bottom-right',
			'data-show-desktop': attributes.showDesktop !== false ? '1' : '0',
			'data-show-tablet': attributes.showTablet !== false ? '1' : '0',
			'data-show-mobile': attributes.showMobile !== false ? '1' : '0',
		};

		return save ? blockEditor.useBlockProps.save( props ) : useBlockProps( props );
	}

	blocks.registerBlockType( 'cni-blocks/fixed-display', {
		apiVersion: 3,
		title: __( '固定表示+', 'cni-blocks' ),
		description: __( '内側に配置したブロックを公開画面の指定位置に固定表示します。', 'cni-blocks' ),
		icon: 'sticky',
		category: 'cni-blocks',
		attributes: {
			position: { type: 'string', default: 'bottom-right' },
			offsetX: { type: 'number', default: 24 },
			offsetY: { type: 'number', default: 24 },
			width: { type: 'number', default: 360 },
			maxViewportWidth: { type: 'number', default: 90 },
			padding: { type: 'number', default: 16 },
			backgroundColor: { type: 'string', default: '#ffffff' },
			transparentBackground: { type: 'boolean', default: false },
			radius: { type: 'number', default: 8 },
			showShadow: { type: 'boolean', default: true },
			showBorder: { type: 'boolean', default: false },
			borderWidth: { type: 'number', default: 1 },
			borderColor: { type: 'string', default: '#dddddd' },
			zIndex: { type: 'number', default: 999 },
			showDesktop: { type: 'boolean', default: true },
			showTablet: { type: 'boolean', default: true },
			showMobile: { type: 'boolean', default: true },
			showCloseButton: { type: 'boolean', default: false },
			closeLabel: { type: 'string', default: '閉じる' },
		},
		supports: {
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const blockProps = getFixedBlockProps( attributes, false );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( '固定位置', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( '表示位置', 'cni-blocks' ),
							value: attributes.position || 'bottom-right',
							options: [
								{ label: __( '左上', 'cni-blocks' ), value: 'top-left' },
								{ label: __( '上中央', 'cni-blocks' ), value: 'top-center' },
								{ label: __( '右上', 'cni-blocks' ), value: 'top-right' },
								{ label: __( '左下', 'cni-blocks' ), value: 'bottom-left' },
								{ label: __( '下中央', 'cni-blocks' ), value: 'bottom-center' },
								{ label: __( '右下', 'cni-blocks' ), value: 'bottom-right' },
							],
							onChange: function( value ) { setAttributes( { position: value } ); },
						} ),
						el( RangeControl, { label: __( '左右位置（px）', 'cni-blocks' ), value: numberOr( attributes.offsetX, 24 ), min: 0, max: 200, onChange: function( value ) { setAttributes( { offsetX: numberOr( value, 24 ) } ); } } ),
						el( RangeControl, { label: __( '上下位置（px）', 'cni-blocks' ), value: numberOr( attributes.offsetY, 24 ), min: 0, max: 200, onChange: function( value ) { setAttributes( { offsetY: numberOr( value, 24 ) } ); } } ),
						el( RangeControl, { label: __( '重なり順', 'cni-blocks' ), value: numberOr( attributes.zIndex, 999 ), min: 1, max: 9999, onChange: function( value ) { setAttributes( { zIndex: numberOr( value, 999 ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( 'サイズ・余白', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '幅（px）', 'cni-blocks' ), value: numberOr( attributes.width, 360 ), min: 50, max: 1200, onChange: function( value ) { setAttributes( { width: numberOr( value, 360 ) } ); } } ),
						el( RangeControl, { label: __( '画面幅に対する最大幅（vw）', 'cni-blocks' ), help: __( '設定したpx幅より画面が狭い場合に使用する上限です。', 'cni-blocks' ), value: numberOr( attributes.maxViewportWidth, 90 ), min: 10, max: 100, onChange: function( value ) { setAttributes( { maxViewportWidth: numberOr( value, 90 ) } ); } } ),
						el( RangeControl, { label: __( '内側余白（px）', 'cni-blocks' ), value: numberOr( attributes.padding, 16 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { padding: numberOr( value, 16 ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '背景・枠線', 'cni-blocks' ), initialOpen: false },
						el( ToggleControl, { label: __( '背景を透明にする', 'cni-blocks' ), checked: !! attributes.transparentBackground, onChange: function( value ) { setAttributes( { transparentBackground: !! value } ); } } ),
						! attributes.transparentBackground ? el( 'p', null, __( '背景色', 'cni-blocks' ) ) : null,
						! attributes.transparentBackground ? el( ColorPalette, { value: attributes.backgroundColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { backgroundColor: value || '#ffffff' } ); } } ) : null,
						el( RangeControl, { label: __( '角丸（px）', 'cni-blocks' ), value: numberOr( attributes.radius, 8 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { radius: numberOr( value, 8 ) } ); } } ),
						el( ToggleControl, { label: __( '影を表示', 'cni-blocks' ), checked: attributes.showShadow !== false, onChange: function( value ) { setAttributes( { showShadow: !! value } ); } } ),
						el( ToggleControl, { label: __( '枠線を表示', 'cni-blocks' ), checked: !! attributes.showBorder, onChange: function( value ) { setAttributes( { showBorder: !! value } ); } } ),
						attributes.showBorder ? el( RangeControl, { label: __( '枠線の太さ（px）', 'cni-blocks' ), value: numberOr( attributes.borderWidth, 1 ), min: 1, max: 12, onChange: function( value ) { setAttributes( { borderWidth: numberOr( value, 1 ) } ); } } ) : null,
						attributes.showBorder ? el( 'p', null, __( '枠線の色', 'cni-blocks' ) ) : null,
						attributes.showBorder ? el( ColorPalette, { value: attributes.borderColor || '#dddddd', clearable: false, onChange: function( value ) { setAttributes( { borderColor: value || '#dddddd' } ); } } ) : null
					),
					el(
						PanelBody,
						{ title: __( '表示する端末', 'cni-blocks' ), initialOpen: false },
						el( ToggleControl, { label: __( 'PCで表示', 'cni-blocks' ), checked: attributes.showDesktop !== false, onChange: function( value ) { setAttributes( { showDesktop: !! value } ); } } ),
						el( ToggleControl, { label: __( 'タブレットで表示', 'cni-blocks' ), checked: attributes.showTablet !== false, onChange: function( value ) { setAttributes( { showTablet: !! value } ); } } ),
						el( ToggleControl, { label: __( 'モバイルで表示', 'cni-blocks' ), checked: attributes.showMobile !== false, onChange: function( value ) { setAttributes( { showMobile: !! value } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '閉じるボタン', 'cni-blocks' ), initialOpen: false },
						el( ToggleControl, { label: __( '閉じるボタンを表示', 'cni-blocks' ), checked: !! attributes.showCloseButton, onChange: function( value ) { setAttributes( { showCloseButton: !! value } ); } } ),
						attributes.showCloseButton ? el( TextControl, { label: __( '読み上げ用の文字', 'cni-blocks' ), value: attributes.closeLabel || '', onChange: function( value ) { setAttributes( { closeLabel: value } ); } } ) : null
					)
				),
				el(
					'div',
					blockProps,
					el( Notice, { className: 'cni-fixed-display__editor-note', status: 'info', isDismissible: false }, __( '公開画面では指定位置に固定されます。編集画面では通常位置で表示しています。', 'cni-blocks' ) ),
					attributes.showCloseButton ? el( 'button', { className: 'cni-fixed-display__close', type: 'button', disabled: true, 'aria-label': attributes.closeLabel || __( '閉じる', 'cni-blocks' ) }, '×' ) : null,
					el( 'div', { className: 'cni-fixed-display__content' }, el( InnerBlocks, { template: INNER_TEMPLATE, templateLock: false, renderAppender: InnerBlocks.ButtonBlockAppender } ) )
				)
			);
		},
		save: function( props ) {
			const attributes = props.attributes;
			return el(
				'div',
				getFixedBlockProps( attributes, true ),
				attributes.showCloseButton ? el( 'button', { className: 'cni-fixed-display__close', type: 'button', 'aria-label': attributes.closeLabel || __( '閉じる', 'cni-blocks' ) }, '×' ) : null,
				el( 'div', { className: 'cni-fixed-display__content' }, el( InnerBlocks.Content ) )
			);
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

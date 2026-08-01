( function( blocks, element, blockEditor, components, data, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const STEP_ITEM = 'cni-blocks/step-item';
	const ITEM_CONTENT_TEMPLATE = [
		[ 'core/heading', { level: 3, placeholder: __( '見出し', 'cni-blocks' ) } ],
		[ 'core/paragraph', { placeholder: __( '説明を入力', 'cni-blocks' ) } ],
	];
	const STEP_TEMPLATE = [ [ STEP_ITEM, { markerLabel: 'STEP' } ] ];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function px( value, fallback ) {
		return numberOr( value, fallback ) + 'px';
	}

	function getStepStyle( attributes ) {
		const startNumber = Math.max( 1, numberOr( attributes.startNumber, 1 ) );

		return {
			'--cni-step-counter-start': startNumber - 1,
			'--cni-step-marker-size': px( attributes.markerSize, 72 ),
			'--cni-step-marker-color': attributes.markerColor || '#2385b8',
			'--cni-step-marker-label-color': attributes.markerLabelColor || '#ffffff',
			'--cni-step-marker-number-color': attributes.markerNumberColor || '#ffffff',
			'--cni-step-title-background': attributes.titleBackgroundColor || '#f2f2f2',
			'--cni-step-title-color': attributes.titleColor || '#333333',
			'--cni-step-item-gap': px( attributes.itemGap, 32 ),
			'--cni-step-line-width': px( attributes.lineWidth, 3 ),
			'--cni-step-line-style': attributes.lineStyle || 'solid',
			'--cni-step-line-color': attributes.lineColor || '#dddddd',
		};
	}

	blocks.registerBlockType( STEP_ITEM, {
		apiVersion: 3,
		title: __( 'ステップ項目', 'cni-blocks' ),
		description: __( 'ステップ+の内部で使用する項目です。', 'cni-blocks' ),
		icon: 'marker',
		category: 'cni-blocks',
		parent: [ 'cni-blocks/step' ],
		attributes: {
			markerLabel: { type: 'string', default: 'STEP' },
		},
		supports: {
			inserter: false,
			html: false,
			reusable: false,
		},
		edit: function( props ) {
			const blockProps = useBlockProps();

			return el(
				'li',
				blockProps,
				el(
					'div',
					{ className: 'cni-step-item__marker', 'aria-hidden': 'true' },
					el( 'span', { className: 'cni-step-item__label' }, props.attributes.markerLabel || '' ),
					el( 'span', { className: 'cni-step-item__number' } )
				),
				el(
					'div',
					{ className: 'cni-step-item__content' },
					el(
						'div',
						{ className: 'cni-step-item__inner' },
						el( InnerBlocks, {
							template: ITEM_CONTENT_TEMPLATE,
							templateLock: false,
							renderAppender: InnerBlocks.ButtonBlockAppender,
						} )
					)
				)
			);
		},
		save: function( props ) {
			return el(
				'li',
				blockEditor.useBlockProps.save(),
				el(
					'div',
					{ className: 'cni-step-item__marker', 'aria-hidden': 'true' },
					el( 'span', { className: 'cni-step-item__label' }, props.attributes.markerLabel || '' ),
					el( 'span', { className: 'cni-step-item__number' } )
				),
				el(
					'div',
					{ className: 'cni-step-item__content' },
					el( 'div', { className: 'cni-step-item__inner' }, el( InnerBlocks.Content ) )
				)
			);
		},
	} );

	blocks.registerBlockType( 'cni-blocks/step', {
		apiVersion: 3,
		title: __( 'ステップ+', 'cni-blocks' ),
		description: __( '自由なブロックを配置できる手順項目を追加し、番号を自動表示します。', 'cni-blocks' ),
		icon: 'editor-ol',
		category: 'cni-blocks',
		attributes: {
			startNumber: { type: 'number', default: 1 },
			markerLabel: { type: 'string', default: 'STEP' },
			showMarkerLabel: { type: 'boolean', default: true },
			markerStyle: { type: 'string', default: 'filled' },
			markerShape: { type: 'string', default: 'circle' },
			markerSize: { type: 'number', default: 72 },
			markerColor: { type: 'string', default: '#2385b8' },
			markerLabelColor: { type: 'string', default: '#ffffff' },
			markerNumberColor: { type: 'string', default: '#ffffff' },
			titleBackgroundColor: { type: 'string', default: '#f2f2f2' },
			titleColor: { type: 'string', default: '#333333' },
			itemGap: { type: 'number', default: 32 },
			showLine: { type: 'boolean', default: true },
			lineStyle: { type: 'string', default: 'solid' },
			lineWidth: { type: 'number', default: 3 },
			lineColor: { type: 'string', default: '#dddddd' },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes, clientId } = props;
			const blockEditorDispatch = data.dispatch( 'core/block-editor' );
			const blockEditorSelect = data.select( 'core/block-editor' );
			const startNumber = Math.max( 1, numberOr( attributes.startNumber, 1 ) );
			const blockProps = useBlockProps( {
				style: getStepStyle( attributes ),
				start: startNumber,
				'data-marker-style': attributes.markerStyle || 'filled',
				'data-marker-shape': attributes.markerShape || 'circle',
				'data-show-label': attributes.showMarkerLabel !== false ? '1' : '0',
				'data-show-line': attributes.showLine !== false ? '1' : '0',
			} );

			function updateMarkerLabel( value ) {
				setAttributes( { markerLabel: value } );
				blockEditorSelect.getBlocks( clientId ).forEach( function( child ) {
					if ( child.name === STEP_ITEM ) {
						blockEditorDispatch.updateBlockAttributes( child.clientId, { markerLabel: value } );
					}
				} );
			}

			function changeMarkerStyle( value ) {
				const nextAttributes = { markerStyle: value };
				const markerColor = attributes.markerColor || '#2385b8';
				if ( value === 'outline' && attributes.markerLabelColor === '#ffffff' && attributes.markerNumberColor === '#ffffff' ) {
					nextAttributes.markerLabelColor = markerColor;
					nextAttributes.markerNumberColor = markerColor;
				} else if ( value === 'filled' && attributes.markerLabelColor === markerColor && attributes.markerNumberColor === markerColor ) {
					nextAttributes.markerLabelColor = '#ffffff';
					nextAttributes.markerNumberColor = '#ffffff';
				}
				setAttributes( nextAttributes );
			}

			function updateMarkerColor( value ) {
				const nextColor = value || '#2385b8';
				const currentColor = attributes.markerColor || '#2385b8';
				const nextAttributes = { markerColor: nextColor };
				if ( attributes.markerStyle === 'outline' && attributes.markerLabelColor === currentColor ) {
					nextAttributes.markerLabelColor = nextColor;
				}
				if ( attributes.markerStyle === 'outline' && attributes.markerNumberColor === currentColor ) {
					nextAttributes.markerNumberColor = nextColor;
				}
				setAttributes( nextAttributes );
			}

			function addStep() {
				const step = blocks.createBlock( STEP_ITEM, { markerLabel: attributes.markerLabel || '' } );
				blockEditorDispatch.insertBlock( step, undefined, clientId, true );
			}

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( '番号・マーカー文字', 'cni-blocks' ), initialOpen: true },
						el( RangeControl, { label: __( '開始番号', 'cni-blocks' ), value: startNumber, min: 1, max: 100, onChange: function( value ) { setAttributes( { startNumber: Math.max( 1, numberOr( value, 1 ) ) } ); } } ),
						el( ToggleControl, { label: __( 'マーカー文字を表示', 'cni-blocks' ), checked: attributes.showMarkerLabel !== false, onChange: function( value ) { setAttributes( { showMarkerLabel: !!value } ); } } ),
						attributes.showMarkerLabel !== false ? el( TextControl, {
							label: __( 'マーカーの文字', 'cni-blocks' ),
							help: __( 'STEP、POINT、DAY、手順など短い文字がおすすめです。', 'cni-blocks' ),
							value: attributes.markerLabel || '',
							onChange: updateMarkerLabel,
						} ) : null
					),
					el(
						PanelBody,
						{ title: __( 'マーカースタイル', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( 'スタイル', 'cni-blocks' ),
							value: attributes.markerStyle || 'filled',
							options: [
								{ label: __( '塗りつぶし', 'cni-blocks' ), value: 'filled' },
								{ label: __( 'アウトライン', 'cni-blocks' ), value: 'outline' },
							],
							onChange: changeMarkerStyle,
						} ),
						el( SelectControl, {
							label: __( '形', 'cni-blocks' ),
							value: attributes.markerShape || 'circle',
							options: [
								{ label: __( '円', 'cni-blocks' ), value: 'circle' },
								{ label: __( '角丸', 'cni-blocks' ), value: 'rounded' },
							],
							onChange: function( value ) { setAttributes( { markerShape: value } ); },
						} ),
						el( RangeControl, { label: __( 'マーカーサイズ（px）', 'cni-blocks' ), value: numberOr( attributes.markerSize, 72 ), min: 40, max: 120, onChange: function( value ) { setAttributes( { markerSize: numberOr( value, 72 ) } ); } } ),
						el( 'p', null, __( 'マーカーの色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.markerColor || '#2385b8', clearable: false, onChange: updateMarkerColor } ),
						el( 'p', null, __( 'マーカー文字の色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.markerLabelColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { markerLabelColor: value || '#ffffff' } ); } } ),
						el( 'p', null, __( '番号の色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.markerNumberColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { markerNumberColor: value || '#ffffff' } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '見出し・間隔', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( '見出し背景色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.titleBackgroundColor || '#f2f2f2', clearable: false, onChange: function( value ) { setAttributes( { titleBackgroundColor: value || '#f2f2f2' } ); } } ),
						el( 'p', null, __( '見出し文字色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.titleColor || '#333333', clearable: false, onChange: function( value ) { setAttributes( { titleColor: value || '#333333' } ); } } ),
						el( RangeControl, { label: __( 'ステップ間隔（px）', 'cni-blocks' ), value: numberOr( attributes.itemGap, 32 ), min: 0, max: 120, onChange: function( value ) { setAttributes( { itemGap: numberOr( value, 32 ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '接続線', 'cni-blocks' ), initialOpen: false },
						el( ToggleControl, { label: __( '接続線を表示', 'cni-blocks' ), checked: attributes.showLine !== false, onChange: function( value ) { setAttributes( { showLine: !!value } ); } } ),
						attributes.showLine !== false ? el( SelectControl, {
							label: __( '線の種類', 'cni-blocks' ),
							value: attributes.lineStyle || 'solid',
							options: [
								{ label: __( '直線', 'cni-blocks' ), value: 'solid' },
								{ label: __( '点線', 'cni-blocks' ), value: 'dotted' },
								{ label: __( '破線', 'cni-blocks' ), value: 'dashed' },
							],
							onChange: function( value ) { setAttributes( { lineStyle: value } ); },
						} ) : null,
						attributes.showLine !== false ? el( RangeControl, { label: __( '線の太さ（px）', 'cni-blocks' ), value: numberOr( attributes.lineWidth, 3 ), min: 1, max: 12, onChange: function( value ) { setAttributes( { lineWidth: numberOr( value, 3 ) } ); } } ) : null,
						attributes.showLine !== false ? el( 'p', null, __( '線の色', 'cni-blocks' ) ) : null,
						attributes.showLine !== false ? el( ColorPalette, { value: attributes.lineColor || '#dddddd', clearable: false, onChange: function( value ) { setAttributes( { lineColor: value || '#dddddd' } ); } } ) : null
					)
				),
				el(
					'ol',
					blockProps,
					el( InnerBlocks, {
						allowedBlocks: [ STEP_ITEM ],
						template: STEP_TEMPLATE,
						templateLock: false,
						renderAppender: false,
					} ),
					el(
						'li',
						{ className: 'cni-step-add-item' },
						el( Button, { className: 'cni-step-add-item__button', icon: 'plus-alt2', variant: 'secondary', onClick: addStep }, __( 'ステップを追加', 'cni-blocks' ) )
					)
				)
			);
		},
		save: function( props ) {
			const attributes = props.attributes;
			const startNumber = Math.max( 1, numberOr( attributes.startNumber, 1 ) );
			const blockProps = blockEditor.useBlockProps.save( {
				style: getStepStyle( attributes ),
				start: startNumber,
				'data-marker-style': attributes.markerStyle || 'filled',
				'data-marker-shape': attributes.markerShape || 'circle',
				'data-show-label': attributes.showMarkerLabel !== false ? '1' : '0',
				'data-show-line': attributes.showLine !== false ? '1' : '0',
			} );

			return el( 'ol', blockProps, el( InnerBlocks.Content ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.data, window.wp.i18n );

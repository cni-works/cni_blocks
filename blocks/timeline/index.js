( function( blocks, element, blockEditor, components, data, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const TIMELINE_ITEM = 'cni-blocks/timeline-item';
	const ITEM_CONTENT_TEMPLATE = [
		[ 'core/heading', { level: 3, placeholder: __( '見出し', 'cni-blocks' ) } ],
		[ 'core/paragraph', { placeholder: __( '内容を入力', 'cni-blocks' ) } ],
	];
	const TIMELINE_TEMPLATE = [ [ TIMELINE_ITEM, { label: '10:00' } ] ];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function px( value, fallback ) {
		return numberOr( value, fallback ) + 'px';
	}

	function getTimelineStyle( attributes ) {
		return {
			'--cni-timeline-marker-size': px( attributes.markerSize, 16 ),
			'--cni-timeline-marker-color': attributes.markerColor || '#2385b8',
			'--cni-timeline-label-color': attributes.labelColor || '#555555',
			'--cni-timeline-label-font-size': px( attributes.labelFontSize, 18 ),
			'--cni-timeline-item-gap': px( attributes.itemGap, 32 ),
			'--cni-timeline-content-gap': px( attributes.contentGap, 16 ),
			'--cni-timeline-line-width': px( attributes.lineWidth, 3 ),
			'--cni-timeline-line-style': attributes.lineStyle || 'solid',
			'--cni-timeline-line-color': attributes.lineColor || '#dddddd',
		};
	}

	blocks.registerBlockType( TIMELINE_ITEM, {
		apiVersion: 3,
		title: __( 'タイムライン項目', 'cni-blocks' ),
		description: __( 'タイムライン+の内部で使用する項目です。', 'cni-blocks' ),
		icon: 'clock',
		category: 'cni-blocks',
		parent: [ 'cni-blocks/timeline' ],
		attributes: {
			label: { type: 'string', default: '10:00' },
		},
		supports: {
			inserter: false,
			html: false,
			reusable: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const blockProps = useBlockProps();

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'ラベル', 'cni-blocks' ), initialOpen: true },
						el( TextControl, {
							label: __( 'ラベルの文字', 'cni-blocks' ),
							help: __( '時刻だけでなく、午前、DAY 1、第1段階なども入力できます。', 'cni-blocks' ),
							value: attributes.label || '',
							onChange: function( value ) { setAttributes( { label: value } ); },
						} )
					)
				),
				el(
					'li',
					blockProps,
					el( 'span', { className: 'cni-timeline-item__marker', 'aria-hidden': 'true' } ),
					el( 'div', { className: 'cni-timeline-item__label' }, attributes.label || __( 'ラベル', 'cni-blocks' ) ),
					el(
						'div',
						{ className: 'cni-timeline-item__content' },
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
				el( 'span', { className: 'cni-timeline-item__marker', 'aria-hidden': 'true' } ),
				el( 'div', { className: 'cni-timeline-item__label' }, props.attributes.label || '' ),
				el( 'div', { className: 'cni-timeline-item__content' }, el( InnerBlocks.Content ) )
			);
		},
	} );

	blocks.registerBlockType( 'cni-blocks/timeline', {
		apiVersion: 3,
		title: __( 'タイムライン+', 'cni-blocks' ),
		description: __( '時刻や日付、工程などのラベルと自由な内容を時系列で表示します。', 'cni-blocks' ),
		icon: 'clock',
		category: 'cni-blocks',
		attributes: {
			markerStyle: { type: 'string', default: 'outline' },
			markerSize: { type: 'number', default: 16 },
			markerColor: { type: 'string', default: '#2385b8' },
			labelColor: { type: 'string', default: '#555555' },
			labelFontSize: { type: 'number', default: 18 },
			itemGap: { type: 'number', default: 32 },
			contentGap: { type: 'number', default: 16 },
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
			const blockProps = useBlockProps( {
				style: getTimelineStyle( attributes ),
				'data-marker-style': attributes.markerStyle || 'outline',
				'data-show-line': attributes.showLine !== false ? '1' : '0',
			} );

			function addItem() {
				const item = blocks.createBlock( TIMELINE_ITEM, { label: __( '新しい項目', 'cni-blocks' ) } );
				blockEditorDispatch.insertBlock( item, undefined, clientId, true );
			}

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( '丸印とラベル', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( '丸印のスタイル', 'cni-blocks' ),
							value: attributes.markerStyle || 'outline',
							options: [
								{ label: __( 'アウトライン', 'cni-blocks' ), value: 'outline' },
								{ label: __( '塗りつぶし', 'cni-blocks' ), value: 'filled' },
							],
							onChange: function( value ) { setAttributes( { markerStyle: value } ); },
						} ),
						el( RangeControl, { label: __( '丸印のサイズ（px）', 'cni-blocks' ), value: numberOr( attributes.markerSize, 16 ), min: 8, max: 40, onChange: function( value ) { setAttributes( { markerSize: numberOr( value, 16 ) } ); } } ),
						el( 'p', null, __( '丸印の色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.markerColor || '#2385b8', clearable: false, onChange: function( value ) { setAttributes( { markerColor: value || '#2385b8' } ); } } ),
						el( RangeControl, { label: __( 'ラベルの文字サイズ（px）', 'cni-blocks' ), value: numberOr( attributes.labelFontSize, 18 ), min: 10, max: 40, onChange: function( value ) { setAttributes( { labelFontSize: numberOr( value, 18 ) } ); } } ),
						el( 'p', null, __( 'ラベルの文字色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.labelColor || '#555555', clearable: false, onChange: function( value ) { setAttributes( { labelColor: value || '#555555' } ); } } )
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
					),
					el(
						PanelBody,
						{ title: __( '間隔', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '項目間の余白（px）', 'cni-blocks' ), value: numberOr( attributes.itemGap, 32 ), min: 0, max: 120, onChange: function( value ) { setAttributes( { itemGap: numberOr( value, 32 ) } ); } } ),
						el( RangeControl, { label: __( 'ラベルと内容の間隔（px）', 'cni-blocks' ), value: numberOr( attributes.contentGap, 16 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { contentGap: numberOr( value, 16 ) } ); } } )
					)
				),
				el(
					'ol',
					blockProps,
					el( InnerBlocks, {
						allowedBlocks: [ TIMELINE_ITEM ],
						template: TIMELINE_TEMPLATE,
						templateLock: false,
						renderAppender: false,
					} ),
					el(
						'li',
						{ className: 'cni-timeline-add-item' },
						el( Button, { className: 'cni-timeline-add-item__button', icon: 'plus-alt2', variant: 'secondary', onClick: addItem }, __( 'タイムライン項目を追加', 'cni-blocks' ) )
					)
				)
			);
		},
		save: function( props ) {
			const attributes = props.attributes;
			const blockProps = blockEditor.useBlockProps.save( {
				style: getTimelineStyle( attributes ),
				'data-marker-style': attributes.markerStyle || 'outline',
				'data-show-line': attributes.showLine !== false ? '1' : '0',
			} );

			return el( 'ol', blockProps, el( InnerBlocks.Content ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.data, window.wp.i18n );

( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { AlignmentToolbar, BlockControls, ColorPalette, InspectorControls, RichText, useBlockProps } = blockEditor;
	const { PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;

	function numberOr( value, fallback ) { return typeof value === 'number' && Number.isFinite( value ) ? value : fallback; }
	function formatNumber( value, a ) {
		const decimals = Math.max( 0, Math.min( 6, numberOr( a.decimals, 0 ) ) );
		const fixed = numberOr( value, 0 ).toFixed( decimals ).split( '.' );
		let integer = fixed[ 0 ];
		if ( a.useGrouping !== false ) integer = integer.replace( /\B(?=(\d{3})+(?!\d))/g, a.groupSeparator || ',' );
		return decimals ? integer + ( a.decimalSeparator || '.' ) + fixed[ 1 ] : integer;
	}
	function alignValues( alignment ) {
		if ( alignment === 'center' ) return { justify: 'center', items: 'center' };
		if ( alignment === 'right' ) return { justify: 'flex-end', items: 'flex-end' };
		return { justify: 'flex-start', items: 'flex-start' };
	}
	function styleFor( a ) {
		const align = alignValues( a.alignment || 'left' );
		const style = {
			'--cni-counter-number-size-pc': numberOr( a.numberSizePc, 56 ) + 'px', '--cni-counter-number-size-mobile': numberOr( a.numberSizeMobile, 42 ) + 'px', '--cni-counter-affix-size': numberOr( a.affixSize, 18 ) + 'px', '--cni-counter-gap': numberOr( a.gap, 8 ) + 'px', '--cni-counter-number-color': a.numberColor || 'inherit', '--cni-counter-affix-color': a.affixColor || 'inherit', '--cni-counter-align': a.alignment || 'left', '--cni-counter-justify': align.justify, '--cni-counter-items': align.items,
		};
		if ( a.numberWeight ) style[ '--cni-counter-number-weight' ] = a.numberWeight;
		if ( a.affixWeight ) style[ '--cni-counter-affix-weight' ] = a.affixWeight;
		return style;
	}
	function dataProps( a ) {
		return { style: styleFor( a ), 'data-layout': a.layout || 'stacked', 'data-start': numberOr( a.start, 0 ), 'data-end': numberOr( a.end, 100 ), 'data-decimals': numberOr( a.decimals, 0 ), 'data-grouping': a.useGrouping !== false ? '1' : '0', 'data-group-separator': a.groupSeparator || ',', 'data-decimal-separator': a.decimalSeparator || '.', 'data-duration': numberOr( a.duration, 2 ), 'data-easing': a.easing || 'easeOut' };
	}
	function palette( label, value, onChange ) { return el( element.Fragment, null, el( 'p', null, label ), el( ColorPalette, { value: value, clearable: true, onChange: onChange } ) ); }

	blocks.registerBlockType( 'cni-blocks/counter-plus', {
		apiVersion: 3, title: __( 'カウンター+', 'cni-blocks' ), icon: 'editor-ol', category: 'cni-blocks', description: __( '接頭語・接尾語と書式を設定できる、低モーション対応の数値カウンターです。', 'cni-blocks' ),
		attributes: { start: { type: 'number', default: 0 }, end: { type: 'number', default: 100 }, decimals: { type: 'number', default: 0 }, useGrouping: { type: 'boolean', default: true }, groupSeparator: { type: 'string', default: ',' }, decimalSeparator: { type: 'string', default: '.' }, prefix: { type: 'string', source: 'html', selector: '.cni-counter-plus__prefix', default: '' }, suffix: { type: 'string', source: 'html', selector: '.cni-counter-plus__suffix', default: '' }, layout: { type: 'string', default: 'stacked' }, duration: { type: 'number', default: 2 }, easing: { type: 'string', default: 'easeOut' }, alignment: { type: 'string', default: 'left' }, numberSizePc: { type: 'number', default: 56 }, numberSizeMobile: { type: 'number', default: 42 }, affixSize: { type: 'number', default: 18 }, gap: { type: 'number', default: 8 }, numberColor: { type: 'string', default: '' }, affixColor: { type: 'string', default: '' }, numberWeight: { type: 'string', default: '' }, affixWeight: { type: 'string', default: '' } },
		supports: { anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			return el( element.Fragment, null,
				el( BlockControls, null, el( AlignmentToolbar, { value: a.alignment || 'left', onChange: function( value ) { props.setAttributes( { alignment: value || 'left' } ); } } ) ),
				el( InspectorControls, null,
					el( PanelBody, { title: __( '数値', 'cni-blocks' ), initialOpen: true },
						el( TextControl, { label: __( '開始', 'cni-blocks' ), type: 'number', value: numberOr( a.start, 0 ), onChange: function( value ) { props.setAttributes( { start: Number( value ) || 0 } ); } } ),
						el( TextControl, { label: __( '終了', 'cni-blocks' ), type: 'number', value: numberOr( a.end, 100 ), onChange: function( value ) { props.setAttributes( { end: Number( value ) || 0 } ); } } ),
						el( RangeControl, { label: __( '小数点以下の桁数', 'cni-blocks' ), value: numberOr( a.decimals, 0 ), min: 0, max: 6, onChange: function( value ) { props.setAttributes( { decimals: value } ); } } ),
						el( ToggleControl, { label: __( '桁区切りを表示', 'cni-blocks' ), checked: a.useGrouping !== false, onChange: function( value ) { props.setAttributes( { useGrouping: !! value } ); } } ),
						a.useGrouping !== false ? el( TextControl, { label: __( '桁区切り文字', 'cni-blocks' ), value: a.groupSeparator || ',', onChange: function( value ) { props.setAttributes( { groupSeparator: value.slice( 0, 1 ) || ',' } ); } } ) : null,
						numberOr( a.decimals, 0 ) > 0 ? el( TextControl, { label: __( '小数点区切り文字', 'cni-blocks' ), value: a.decimalSeparator || '.', onChange: function( value ) { props.setAttributes( { decimalSeparator: value.slice( 0, 1 ) || '.' } ); } } ) : null
					),
					el( PanelBody, { title: __( '配置・アニメーション', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, { label: __( '接頭語・数値・接尾語の並び', 'cni-blocks' ), value: a.layout || 'stacked', options: [ { label: __( '縦並び', 'cni-blocks' ), value: 'stacked' }, { label: __( '横並び', 'cni-blocks' ), value: 'inline' } ], onChange: function( value ) { props.setAttributes( { layout: value } ); } } ),
						el( RangeControl, { label: __( '要素間の間隔（px）', 'cni-blocks' ), value: numberOr( a.gap, 8 ), min: 0, max: 60, onChange: function( value ) { props.setAttributes( { gap: value } ); } } ),
						el( RangeControl, { label: __( 'アニメーション時間（秒）', 'cni-blocks' ), help: __( '低モーション設定の端末ではアニメーションせず終了値を表示します。', 'cni-blocks' ), value: numberOr( a.duration, 2 ), min: 0, max: 10, step: 0.1, onChange: function( value ) { props.setAttributes( { duration: value } ); } } ),
						el( SelectControl, { label: __( 'アニメーション効果', 'cni-blocks' ), value: a.easing || 'easeOut', options: [ { label: __( '滑らか', 'cni-blocks' ), value: 'easeOut' }, { label: __( '一定速度', 'cni-blocks' ), value: 'linear' } ], onChange: function( value ) { props.setAttributes( { easing: value } ); } } )
					),
					el( PanelBody, { title: __( 'スタイル', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '数値サイズ：PC（px）', 'cni-blocks' ), value: numberOr( a.numberSizePc, 56 ), min: 16, max: 180, onChange: function( value ) { props.setAttributes( { numberSizePc: value } ); } } ),
						el( RangeControl, { label: __( '数値サイズ：モバイル（px）', 'cni-blocks' ), value: numberOr( a.numberSizeMobile, 42 ), min: 16, max: 120, onChange: function( value ) { props.setAttributes( { numberSizeMobile: value } ); } } ),
						el( RangeControl, { label: __( '接頭語・接尾語サイズ（px）', 'cni-blocks' ), value: numberOr( a.affixSize, 18 ), min: 10, max: 80, onChange: function( value ) { props.setAttributes( { affixSize: value } ); } } ),
						el( SelectControl, { label: __( '数値の太さ', 'cni-blocks' ), value: a.numberWeight || '700', options: [ '300', '400', '500', '600', '700', '800', '900' ].map( function( weight ) { return { label: weight, value: weight }; } ), onChange: function( value ) { props.setAttributes( { numberWeight: value } ); } } ),
						el( SelectControl, { label: __( '接頭語・接尾語の太さ', 'cni-blocks' ), value: a.affixWeight || '400', options: [ '300', '400', '500', '600', '700', '800', '900' ].map( function( weight ) { return { label: weight, value: weight }; } ), onChange: function( value ) { props.setAttributes( { affixWeight: value } ); } } ),
						palette( __( '数値の色', 'cni-blocks' ), a.numberColor, function( value ) { props.setAttributes( { numberColor: value || '' } ); } ), palette( __( '接頭語・接尾語の色', 'cni-blocks' ), a.affixColor, function( value ) { props.setAttributes( { affixColor: value || '' } ); } )
					)
				),
				el( 'div', useBlockProps( dataProps( a ) ),
					el( RichText, { tagName: 'span', className: 'cni-counter-plus__prefix', value: a.prefix, placeholder: __( '接頭語', 'cni-blocks' ), allowedFormats: [], onChange: function( value ) { props.setAttributes( { prefix: value } ); } } ),
					el( 'span', { className: 'cni-counter-plus__number' }, formatNumber( a.end, a ) ),
					el( RichText, { tagName: 'span', className: 'cni-counter-plus__suffix', value: a.suffix, placeholder: __( '接尾語', 'cni-blocks' ), allowedFormats: [], onChange: function( value ) { props.setAttributes( { suffix: value } ); } } )
				)
			);
		},
		save: function( props ) {
			const a = props.attributes;
			return el( 'div', blockEditor.useBlockProps.save( dataProps( a ) ), el( RichText.Content, { tagName: 'span', className: 'cni-counter-plus__prefix', value: a.prefix } ), el( 'span', { className: 'cni-counter-plus__number' }, formatNumber( a.end, a ) ), el( RichText.Content, { tagName: 'span', className: 'cni-counter-plus__suffix', value: a.suffix } ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

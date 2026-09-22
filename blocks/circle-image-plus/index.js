( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;

	function numberOr( value, fallback ) { return typeof value === 'number' ? value : fallback; }
	function separatorText( value ) { return { dash: '—', bullet: '•', slash: '/', none: '' }[ value ] || '—'; }
	function repeatedText( text, separator ) {
		const source = ( text || '' ).trim();
		if ( ! source ) return '';
		const unit = source + ( separatorText( separator ) ? ' ' + separatorText( separator ) + ' ' : '  ' );
		const length = Array.from( unit ).length || 1;
		return unit.repeat( Math.max( 1, Math.min( 6, Math.ceil( 48 / length ) ) ) ).trim();
	}
	function styleFor( a ) {
		const defaultColor = a.ringBackground === 'black' ? '#ffffff' : ( a.ringBackground === 'white' ? '#111111' : 'currentColor' );
		const circleSize = { small: 180, medium: 240, large: 320, xlarge: 400 }[ a.sizePreset || 'medium' ] || 240;
		return {
			'--cni-circle-size': circleSize + 'px',
			'--cni-circle-text-color': a.textColor || defaultColor,
			'--cni-circle-hover-text-color': a.hoverTextColor || a.textColor || defaultColor,
			'--cni-circle-text-weight': a.textWeight || '600',
			'--cni-circle-letter-spacing': numberOr( a.letterSpacing, 0 ) + 'px',
		};
	}
	function propsFor( a ) {
		return {
			style: styleFor( a ),
			'data-size': a.sizePreset || 'medium',
			'data-alignment': a.alignment || 'center',
			'data-text-size': a.textSize || 'normal',
			'data-ring-background': a.ringBackground || 'none',
			'data-ring-gap': a.ringGap || 'normal',
			'data-rotation': a.rotationEnabled === false ? 'off' : 'on',
			'data-rotation-direction': a.rotationDirection || 'clockwise',
			'data-rotation-speed': a.rotationSpeed || 'slow',
		};
	}
	function palette( label, value, onChange ) {
		return el( element.Fragment, null, el( 'p', null, label ), el( ColorPalette, { value: value, clearable: true, onChange: onChange } ) );
	}
	function preview( a, pathId ) {
		const image = a.mediaUrl
			? el( 'img', { className: 'cni-circle-image-plus__image', src: a.mediaUrl, alt: a.mediaAlt || '' } )
			: el( 'span', { className: 'cni-circle-image-plus__placeholder', 'aria-hidden': 'true' } );
		const svg = el( 'svg', { className: 'cni-circle-image-plus__svg', viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' },
			el( 'defs', null, el( 'path', { id: pathId, d: 'M 50 5 a 45 45 0 1 1 0 90 a 45 45 0 1 1 0 -90' } ) ),
			el( 'text', { className: 'cni-circle-image-plus__text', textLength: '282.74', lengthAdjust: 'spacing' }, el( 'textPath', { href: '#' + pathId, startOffset: '0%' }, repeatedText( a.ringText, a.separator ) ) )
		);
		return el( 'span', { className: 'cni-circle-image-plus__visual' }, image, el( 'span', { className: 'cni-circle-image-plus__ring' }, svg ) );
	}

	const attributes = {
		mediaId: { type: 'number', default: 0 }, mediaUrl: { type: 'string', default: '' }, mediaAlt: { type: 'string', default: '' },
		sizePreset: { type: 'string', default: 'medium' }, alignment: { type: 'string', default: 'center' }, ringText: { type: 'string', default: 'CREATIVE DESIGN' }, separator: { type: 'string', default: 'dash' },
		textSize: { type: 'string', default: 'normal' }, textColor: { type: 'string', default: '' }, textWeight: { type: 'string', default: '600' }, letterSpacing: { type: 'number', default: 0 },
		ringBackground: { type: 'string', default: 'none' }, ringGap: { type: 'string', default: 'normal' }, rotationEnabled: { type: 'boolean', default: true }, rotationDirection: { type: 'string', default: 'clockwise' }, rotationSpeed: { type: 'string', default: 'slow' },
		linkUrl: { type: 'string', default: '' }, linkTarget: { type: 'boolean', default: false }, hoverTextColor: { type: 'string', default: '' },
	};

	blocks.registerBlockType( 'cni-blocks/circle-image-plus', {
		apiVersion: 3,
		title: __( 'サークル画像+', 'cni-blocks' ),
		icon: 'format-image',
		category: 'cni-blocks',
		description: __( '円形画像の外周へ文字を配置し、ゆっくり回転させられる装飾画像です。', 'cni-blocks' ),
		keywords: [ __( '円形画像', 'cni-blocks' ), __( '回転文字', 'cni-blocks' ), __( 'リング', 'cni-blocks' ) ],
		attributes: attributes,
		supports: { align: [ 'wide', 'full' ], anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			const set = props.setAttributes;
			const pathId = 'cni-circle-image-plus-editor-' + props.clientId.replace( /[^a-z0-9_-]/gi, '' );
			const selectImage = function( media ) { if ( media && media.url ) set( { mediaId: media.id || 0, mediaUrl: media.url, mediaAlt: media.alt || '' } ); };
			const previewElement = preview( a, pathId );
			return el( element.Fragment, null,
				el( InspectorControls, null,
					el( PanelBody, { title: __( '画像', 'cni-blocks' ), initialOpen: true },
						a.mediaUrl ? el( 'img', { className: 'cni-circle-image-plus__media-thumbnail', src: a.mediaUrl, alt: a.mediaAlt || '' } ) : null,
						el( MediaUploadCheck, null, el( MediaUpload, { onSelect: selectImage, allowedTypes: [ 'image' ], value: a.mediaId || 0, render: function( mediaProps ) { return el( Button, { variant: 'secondary', onClick: mediaProps.open }, a.mediaUrl ? __( '画像を変更', 'cni-blocks' ) : __( '画像を選択', 'cni-blocks' ) ); } } ) ),
						a.mediaUrl ? el( TextControl, { label: __( '代替テキスト', 'cni-blocks' ), value: a.mediaAlt || '', onChange: function( value ) { set( { mediaAlt: value } ); } } ) : null,
						a.mediaUrl ? el( Button, { variant: 'tertiary', isDestructive: true, onClick: function() { set( { mediaId: 0, mediaUrl: '', mediaAlt: '' } ); } }, __( '画像を削除', 'cni-blocks' ) ) : null
					),
					el( PanelBody, { title: __( 'レイアウト', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( 'サークルサイズ', 'cni-blocks' ), value: a.sizePreset || 'medium', options: [ { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '中', 'cni-blocks' ), value: 'medium' }, { label: __( '大', 'cni-blocks' ), value: 'large' }, { label: __( '特大', 'cni-blocks' ), value: 'xlarge' } ], onChange: function( value ) { set( { sizePreset: value } ); } } ),
						el( SelectControl, { label: __( '配置', 'cni-blocks' ), value: a.alignment || 'center', options: [ { label: __( '左寄せ', 'cni-blocks' ), value: 'left' }, { label: __( '中央寄せ', 'cni-blocks' ), value: 'center' }, { label: __( '右寄せ', 'cni-blocks' ), value: 'right' } ], onChange: function( value ) { set( { alignment: value } ); } } )
					),
					el( PanelBody, { title: __( '外周テキスト', 'cni-blocks' ), initialOpen: true },
						el( TextControl, { label: __( 'テキスト', 'cni-blocks' ), value: a.ringText || '', onChange: function( value ) { set( { ringText: value } ); } } ),
						el( SelectControl, { label: __( '区切り', 'cni-blocks' ), value: a.separator || 'dash', options: [ { label: '—', value: 'dash' }, { label: '•', value: 'bullet' }, { label: '/', value: 'slash' }, { label: __( 'なし', 'cni-blocks' ), value: 'none' } ], onChange: function( value ) { set( { separator: value } ); } } ),
						el( SelectControl, { label: __( '文字サイズ', 'cni-blocks' ), value: a.textSize || 'normal', options: [ { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '大', 'cni-blocks' ), value: 'large' } ], onChange: function( value ) { set( { textSize: value } ); } } ),
						el( SelectControl, { label: __( '文字の太さ', 'cni-blocks' ), value: a.textWeight || '600', options: [ { label: '400', value: '400' }, { label: '500', value: '500' }, { label: '600', value: '600' }, { label: '700', value: '700' } ], onChange: function( value ) { set( { textWeight: value } ); } } ),
						el( RangeControl, { label: __( '文字間隔（px）', 'cni-blocks' ), value: numberOr( a.letterSpacing, 0 ), min: -2, max: 10, step: 0.5, onChange: function( value ) { set( { letterSpacing: numberOr( value, 0 ) } ); } } ),
						palette( __( '文字色', 'cni-blocks' ), a.textColor, function( value ) { set( { textColor: value || '' } ); } ),
						el( SelectControl, { label: __( '画像と外周文字の間隔', 'cni-blocks' ), value: a.ringGap || 'normal', options: [ { label: __( '狭い', 'cni-blocks' ), value: 'narrow' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '広い', 'cni-blocks' ), value: 'wide' } ], onChange: function( value ) { set( { ringGap: value } ); } } )
					),
					el( PanelBody, { title: __( 'リング背景', 'cni-blocks' ), initialOpen: false }, el( SelectControl, { label: __( '背景', 'cni-blocks' ), value: a.ringBackground || 'none', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '白', 'cni-blocks' ), value: 'white' }, { label: __( '黒', 'cni-blocks' ), value: 'black' } ], onChange: function( value ) { set( { ringBackground: value } ); } } ) ),
					el( PanelBody, { title: __( '回転', 'cni-blocks' ), initialOpen: false },
						el( ToggleControl, { label: __( '外周文字を回転', 'cni-blocks' ), checked: a.rotationEnabled !== false, onChange: function( value ) { set( { rotationEnabled: !! value } ); } } ),
						a.rotationEnabled !== false ? el( SelectControl, { label: __( '回転方向', 'cni-blocks' ), value: a.rotationDirection || 'clockwise', options: [ { label: __( '右回り', 'cni-blocks' ), value: 'clockwise' }, { label: __( '左回り', 'cni-blocks' ), value: 'counterclockwise' } ], onChange: function( value ) { set( { rotationDirection: value } ); } } ) : null,
						a.rotationEnabled !== false ? el( SelectControl, { label: __( '回転速度', 'cni-blocks' ), value: a.rotationSpeed || 'slow', options: [ { label: __( 'ゆっくり', 'cni-blocks' ), value: 'slow' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '速い', 'cni-blocks' ), value: 'fast' } ], onChange: function( value ) { set( { rotationSpeed: value } ); } } ) : null
					),
					el( PanelBody, { title: __( 'リンク', 'cni-blocks' ), initialOpen: false },
						el( TextControl, { label: __( 'リンクURL', 'cni-blocks' ), type: 'url', value: a.linkUrl || '', onChange: function( value ) { set( { linkUrl: value } ); } } ),
						a.linkUrl ? el( ToggleControl, { label: __( '新しいタブで開く', 'cni-blocks' ), checked: !! a.linkTarget, onChange: function( value ) { set( { linkTarget: !! value } ); } } ) : null,
						a.linkUrl ? palette( __( 'ホバー時の文字色', 'cni-blocks' ), a.hoverTextColor, function( value ) { set( { hoverTextColor: value || '' } ); } ) : null
					)
				),
				el( 'div', Object.assign( { className: 'wp-block-cni-blocks-circle-image-plus' }, useBlockProps( propsFor( a ) ) ),
					el( 'div', { className: 'cni-circle-image-plus__editor-preview' }, previewElement,
						el( MediaUploadCheck, null, el( MediaUpload, { onSelect: selectImage, allowedTypes: [ 'image' ], value: a.mediaId || 0, render: function( mediaProps ) { return el( Button, { className: 'cni-circle-image-plus__image-select', variant: 'secondary', onClick: mediaProps.open }, a.mediaUrl ? __( '画像を変更', 'cni-blocks' ) : __( '画像を選択', 'cni-blocks' ) ); } } ) )
					)
				)
			);
		},
		save: function() { return null; },
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

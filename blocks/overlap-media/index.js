( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls, MediaUpload, MediaUploadCheck } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const CONTENT_TEMPLATE = [
		[ 'core/heading', { level: 3, placeholder: __( '見出し', 'cni-blocks' ) } ],
		[ 'core/paragraph', { placeholder: __( '内容を入力', 'cni-blocks' ) } ],
	];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function getStyle( a ) {
		return {
			'--cni-overlap-image-width': numberOr( a.imageWidth, 65 ) + '%',
			'--cni-overlap-content-width': numberOr( a.contentWidth, 50 ) + '%',
			'--cni-overlap-pc': numberOr( a.overlapPc, 20 ) + '%',
			'--cni-overlap-tablet': numberOr( a.overlapTablet, 12 ) + '%',
			'--cni-overlap-mobile': numberOr( a.overlapMobile, 0 ) + '%',
			'--cni-overlap-image-radius': numberOr( a.imageRadius, 0 ) + 'px',
			'--cni-overlap-content-background': a.contentBackgroundColor || '#ffffff',
			'--cni-overlap-content-opacity': numberOr( a.contentBackgroundOpacity, 90 ) / 100,
			'--cni-overlap-content-color': a.contentTextColor || '#333333',
			'--cni-overlap-padding-pc': numberOr( a.paddingPc, 32 ) + 'px',
			'--cni-overlap-padding-tablet': numberOr( a.paddingTablet, 24 ) + 'px',
			'--cni-overlap-padding-mobile': numberOr( a.paddingMobile, 20 ) + 'px',
			'--cni-overlap-content-radius': numberOr( a.contentRadius, 8 ) + 'px',
			'--cni-overlap-content-shadow': a.showShadow !== false ? '0 12px 32px rgba(0, 0, 0, 0.16)' : 'none',
			'--cni-overlap-border-width': a.showBorder ? numberOr( a.borderWidth, 1 ) + 'px' : '0px',
			'--cni-overlap-border-color': a.borderColor || '#dddddd',
		};
	}

	function blockPropsFor( a, save ) {
		const props = {
			style: getStyle( a ),
			'data-image-position': a.imagePosition || 'left',
			'data-vertical-align': a.verticalAlign || 'center',
			'data-image-ratio': a.imageRatio || '3-2',
			'data-mobile-order': a.mobileOrder || 'image-first',
		};
		return save ? blockEditor.useBlockProps.save( props ) : useBlockProps( props );
	}

	function imageElement( a ) {
		return a.imageUrl ? el( 'img', { className: 'cni-overlap-media__image', src: a.imageUrl, alt: a.imageAlt || '', loading: 'lazy' } ) : null;
	}

	const attributes = {
		imageId: { type: 'number', default: 0 }, imageUrl: { type: 'string', default: '' }, imageAlt: { type: 'string', default: '' },
		imagePosition: { type: 'string', default: 'left' }, imageWidth: { type: 'number', default: 65 }, contentWidth: { type: 'number', default: 50 },
		verticalAlign: { type: 'string', default: 'center' }, imageRatio: { type: 'string', default: '3-2' }, imageRadius: { type: 'number', default: 0 },
		overlapPc: { type: 'number', default: 20 }, overlapTablet: { type: 'number', default: 12 }, overlapMobile: { type: 'number', default: 0 },
		mobileOrder: { type: 'string', default: 'image-first' }, contentBackgroundColor: { type: 'string', default: '#ffffff' },
		contentBackgroundOpacity: { type: 'number', default: 90 }, contentTextColor: { type: 'string', default: '#333333' },
		paddingPc: { type: 'number', default: 32 }, paddingTablet: { type: 'number', default: 24 }, paddingMobile: { type: 'number', default: 20 },
		contentRadius: { type: 'number', default: 8 }, showShadow: { type: 'boolean', default: true }, showBorder: { type: 'boolean', default: false },
		borderWidth: { type: 'number', default: 1 }, borderColor: { type: 'string', default: '#dddddd' },
	};

	blocks.registerBlockType( 'cni-blocks/overlap-media', {
		apiVersion: 3,
		title: __( '画像重ねレイアウト+', 'cni-blocks' ),
		description: __( '画像と自由なコンテンツを重ね、モバイルでは縦並びにできるレイアウトです。', 'cni-blocks' ),
		icon: 'align-pull-left', category: 'cni-blocks',
		keywords: [ __( '画像重ね', 'cni-blocks' ), __( 'ブロークングリッド', 'cni-blocks' ), __( 'メディアとテキスト', 'cni-blocks' ) ],
		attributes: attributes,
		supports: { align: [ 'wide', 'full' ], anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			const set = props.setAttributes;
			const range = function( label, key, fallback, min, max, help ) {
				return el( RangeControl, { label: label, help: help, value: numberOr( a[ key ], fallback ), min: min, max: max, onChange: function( value ) { const next = {}; next[ key ] = numberOr( value, fallback ); set( next ); } } );
			};
			const palette = function( label, key, fallback ) {
				return [ el( 'p', { key: key + '-label' }, label ), el( ColorPalette, { key: key, value: a[ key ] || fallback, clearable: false, onChange: function( value ) { const next = {}; next[ key ] = value || fallback; set( next ); } } ) ];
			};
			const selectImage = function( media ) {
				if ( media && media.url ) set( { imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '' } );
			};

			return el( element.Fragment, null,
				el( InspectorControls, null,
					el( PanelBody, { title: __( '画像', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( '画像の位置', 'cni-blocks' ), value: a.imagePosition || 'left', options: [ { label: __( '左', 'cni-blocks' ), value: 'left' }, { label: __( '右', 'cni-blocks' ), value: 'right' } ], onChange: function( value ) { set( { imagePosition: value } ); } } ),
						el( SelectControl, { label: __( '画像の縦横比', 'cni-blocks' ), value: a.imageRatio || '3-2', options: [ { label: '3:2', value: '3-2' }, { label: '16:9', value: '16-9' }, { label: '4:3', value: '4-3' }, { label: __( '正方形', 'cni-blocks' ), value: '1-1' } ], onChange: function( value ) { set( { imageRatio: value } ); } } ),
						range( __( '画像エリアの幅（%）', 'cni-blocks' ), 'imageWidth', 65, 30, 90 ),
						range( __( '画像の角丸（px）', 'cni-blocks' ), 'imageRadius', 0, 0, 80 ),
						a.imageUrl ? el( TextControl, { label: __( '代替テキスト', 'cni-blocks' ), value: a.imageAlt || '', onChange: function( value ) { set( { imageAlt: value } ); } } ) : null
					),
					el( PanelBody, { title: __( '重なりと配置', 'cni-blocks' ), initialOpen: true },
						range( __( '文章エリアの幅（%）', 'cni-blocks' ), 'contentWidth', 50, 30, 90 ),
						range( __( '重なり量：PC（%）', 'cni-blocks' ), 'overlapPc', 20, 0, 100 ),
						range( __( '重なり量：タブレット（%）', 'cni-blocks' ), 'overlapTablet', 12, 0, 100 ),
						range( __( '重なり量：モバイル（%）', 'cni-blocks' ), 'overlapMobile', 0, 0, 100, __( '0の場合は通常の縦並びになります。', 'cni-blocks' ) ),
						el( SelectControl, { label: __( '文章エリアの上下位置', 'cni-blocks' ), value: a.verticalAlign || 'center', options: [ { label: __( '上', 'cni-blocks' ), value: 'start' }, { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '下', 'cni-blocks' ), value: 'end' } ], onChange: function( value ) { set( { verticalAlign: value } ); } } ),
						el( SelectControl, { label: __( 'モバイルの並び順', 'cni-blocks' ), value: a.mobileOrder || 'image-first', options: [ { label: __( '画像 → 文章', 'cni-blocks' ), value: 'image-first' }, { label: __( '文章 → 画像', 'cni-blocks' ), value: 'content-first' } ], onChange: function( value ) { set( { mobileOrder: value } ); } } )
					),
					el( PanelBody, { title: __( '文章エリアの背景', 'cni-blocks' ), initialOpen: false },
						palette( __( '背景色', 'cni-blocks' ), 'contentBackgroundColor', '#ffffff' ),
						range( __( '背景の透明度（%）', 'cni-blocks' ), 'contentBackgroundOpacity', 90, 0, 100, __( '文章やボタンの透明度には影響しません。', 'cni-blocks' ) ),
						palette( __( '文字色', 'cni-blocks' ), 'contentTextColor', '#333333' )
					),
					el( PanelBody, { title: __( '文章エリアの余白・装飾', 'cni-blocks' ), initialOpen: false },
						range( __( '内側余白：PC（px）', 'cni-blocks' ), 'paddingPc', 32, 0, 100 ), range( __( '内側余白：タブレット（px）', 'cni-blocks' ), 'paddingTablet', 24, 0, 100 ), range( __( '内側余白：モバイル（px）', 'cni-blocks' ), 'paddingMobile', 20, 0, 100 ),
						range( __( '角丸（px）', 'cni-blocks' ), 'contentRadius', 8, 0, 80 ),
						el( ToggleControl, { label: __( '影を表示', 'cni-blocks' ), checked: a.showShadow !== false, onChange: function( value ) { set( { showShadow: !! value } ); } } ),
						el( ToggleControl, { label: __( '枠線を表示', 'cni-blocks' ), checked: !! a.showBorder, onChange: function( value ) { set( { showBorder: !! value } ); } } ),
						a.showBorder ? range( __( '枠線の太さ（px）', 'cni-blocks' ), 'borderWidth', 1, 1, 12 ) : null,
						a.showBorder ? palette( __( '枠線の色', 'cni-blocks' ), 'borderColor', '#dddddd' ) : null
					)
				),
				el( 'div', blockPropsFor( a, false ),
					el( 'div', { className: 'cni-overlap-media__media' }, imageElement( a ),
						el( 'div', { className: 'cni-overlap-media__image-actions' },
							el( MediaUploadCheck, null, el( MediaUpload, { onSelect: selectImage, allowedTypes: [ 'image' ], value: a.imageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'secondary', onClick: mediaProps.open }, a.imageUrl ? __( '画像を変更', 'cni-blocks' ) : __( '画像を選択', 'cni-blocks' ) ); } } ) ),
							a.imageUrl ? el( Button, { variant: 'tertiary', isDestructive: true, onClick: function() { set( { imageId: 0, imageUrl: '', imageAlt: '' } ); } }, __( '削除', 'cni-blocks' ) ) : null
						)
					),
					el( 'div', { className: 'cni-overlap-media__content' }, el( 'div', { className: 'cni-overlap-media__content-inner' }, el( InnerBlocks, { template: CONTENT_TEMPLATE, templateLock: false, renderAppender: InnerBlocks.ButtonBlockAppender } ) ) )
				)
			);
		},
		save: function( props ) {
			const a = props.attributes;
			return el( 'div', blockPropsFor( a, true ), el( 'div', { className: 'cni-overlap-media__media' }, imageElement( a ) ), el( 'div', { className: 'cni-overlap-media__content' }, el( 'div', { className: 'cni-overlap-media__content-inner' }, el( InnerBlocks.Content ) ) ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

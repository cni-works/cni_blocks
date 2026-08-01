( function( blocks, element, blockEditor, components, i18n, serverSideRender ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InspectorControls } = blockEditor;
	const { ColorPalette, PanelBody, RangeControl, SelectControl, ToggleControl } = components;
	const ServerSideRender = serverSideRender.ServerSideRender || serverSideRender.default || serverSideRender;
	const settings = window.cniPostListSettings || {};
	const postTypes = Array.isArray( settings.postTypes ) && settings.postTypes.length
		? settings.postTypes
		: [ { label: __( '投稿', 'cni-blocks' ), value: 'post' } ];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	blocks.registerBlockType( 'cni-blocks/post-list', {
		apiVersion: 3,
		title: __( '投稿リスト+', 'cni-blocks' ),
		description: __( '投稿やカスタム投稿をカードまたはテキストリストで表示します。', 'cni-blocks' ),
		icon: 'list-view',
		category: 'cni-blocks',
		attributes: {
			postType: { type: 'string', default: 'post' },
			postsPerPage: { type: 'number', default: 6 },
			offset: { type: 'number', default: 0 },
			sortOrder: { type: 'string', default: 'newest' },
			displayType: { type: 'string', default: 'card' },
			showImage: { type: 'boolean', default: true },
			showCategory: { type: 'boolean', default: true },
			showDate: { type: 'boolean', default: true },
			showTitle: { type: 'boolean', default: true },
			titleLevel: { type: 'number', default: 3 },
			titleFontSize: { type: 'number', default: 0 },
			minWidthPc: { type: 'number', default: 280 },
			minWidthTablet: { type: 'number', default: 0 },
			minWidthMobile: { type: 'number', default: 0 },
			gap: { type: 'number', default: 24 },
			cardPadding: { type: 'number', default: 16 },
			cardBackgroundColor: { type: 'string', default: '#ffffff' },
			cardRadius: { type: 'number', default: 8 },
			cardShadow: { type: 'boolean', default: false },
			cardBorder: { type: 'boolean', default: true },
			cardBorderWidth: { type: 'number', default: 1 },
			cardBorderColor: { type: 'string', default: '#dddddd' },
			imageRatio: { type: 'string', default: '16-9' },
			hoverEffect: { type: 'string', default: 'lift' },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const isCard = attributes.displayType !== 'list';
			const blockProps = useBlockProps();

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( '投稿の取得', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( '投稿タイプ', 'cni-blocks' ),
							value: attributes.postType || 'post',
							options: postTypes,
							onChange: function( value ) { setAttributes( { postType: value } ); },
						} ),
						el( RangeControl, {
							label: __( '表示件数', 'cni-blocks' ),
							value: numberOr( attributes.postsPerPage, 6 ),
							min: 1,
							max: 24,
							onChange: function( value ) { setAttributes( { postsPerPage: numberOr( value, 6 ) } ); },
						} ),
						el( RangeControl, {
							label: __( 'オフセット（先頭から除外する件数）', 'cni-blocks' ),
							value: numberOr( attributes.offset, 0 ),
							min: 0,
							max: 100,
							onChange: function( value ) { setAttributes( { offset: numberOr( value, 0 ) } ); },
						} ),
						el( SelectControl, {
							label: __( '並び順', 'cni-blocks' ),
							value: attributes.sortOrder || 'newest',
							options: [
								{ label: __( '新しい順', 'cni-blocks' ), value: 'newest' },
								{ label: __( '古い順', 'cni-blocks' ), value: 'oldest' },
								{ label: __( '更新日順', 'cni-blocks' ), value: 'modified' },
								{ label: __( 'ランダム', 'cni-blocks' ), value: 'random' },
							],
							onChange: function( value ) { setAttributes( { sortOrder: value } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( '表示形式', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( '表示タイプ', 'cni-blocks' ),
							value: attributes.displayType || 'card',
							options: [
								{ label: __( 'カード', 'cni-blocks' ), value: 'card' },
								{ label: __( 'テキストリスト（1カラム）', 'cni-blocks' ), value: 'list' },
							],
							onChange: function( value ) { setAttributes( { displayType: value } ); },
						} ),
						isCard ? el( ToggleControl, { label: __( 'アイキャッチを表示', 'cni-blocks' ), checked: attributes.showImage !== false, onChange: function( value ) { setAttributes( { showImage: !!value } ); } } ) : null,
						el( ToggleControl, { label: __( 'カテゴリーバッジを表示', 'cni-blocks' ), checked: attributes.showCategory !== false, onChange: function( value ) { setAttributes( { showCategory: !!value } ); } } ),
						el( ToggleControl, { label: __( '投稿日を表示', 'cni-blocks' ), checked: attributes.showDate !== false, onChange: function( value ) { setAttributes( { showDate: !!value } ); } } ),
						el( ToggleControl, { label: __( 'タイトルを表示', 'cni-blocks' ), checked: attributes.showTitle !== false, onChange: function( value ) { setAttributes( { showTitle: !!value } ); } } ),
						attributes.showTitle !== false ? el( SelectControl, {
							label: __( '見出しレベル', 'cni-blocks' ),
							value: numberOr( attributes.titleLevel, 3 ),
							options: [
								{ label: 'h2', value: 2 },
								{ label: 'h3', value: 3 },
								{ label: 'h4', value: 4 },
								{ label: 'h5', value: 5 },
							],
							onChange: function( value ) { setAttributes( { titleLevel: parseInt( value, 10 ) || 3 } ); },
						} ) : null,
						attributes.showTitle !== false ? el( RangeControl, {
							label: __( '見出し文字サイズ（px・0でテーマ標準）', 'cni-blocks' ),
							value: numberOr( attributes.titleFontSize, 0 ),
							min: 0,
							max: 48,
							onChange: function( value ) { setAttributes( { titleFontSize: numberOr( value, 0 ) } ); },
						} ) : null
					),
					isCard ? el(
						PanelBody,
						{ title: __( 'カードのカラム', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'PC 最小幅（px）', 'cni-blocks' ), value: numberOr( attributes.minWidthPc, 280 ), min: 160, max: 600, step: 10, onChange: function( value ) { setAttributes( { minWidthPc: numberOr( value, 280 ) } ); } } ),
						el( RangeControl, { label: __( 'タブレット 最小幅（px・0でPCを継承）', 'cni-blocks' ), value: numberOr( attributes.minWidthTablet, 0 ), min: 0, max: 600, step: 10, onChange: function( value ) { setAttributes( { minWidthTablet: numberOr( value, 0 ) } ); } } ),
						el( RangeControl, { label: __( 'モバイル 最小幅（px・0で上位を継承）', 'cni-blocks' ), value: numberOr( attributes.minWidthMobile, 0 ), min: 0, max: 600, step: 10, onChange: function( value ) { setAttributes( { minWidthMobile: numberOr( value, 0 ) } ); } } ),
						el( RangeControl, { label: __( 'カード間隔（px）', 'cni-blocks' ), value: numberOr( attributes.gap, 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { gap: numberOr( value, 24 ) } ); } } )
					) : null,
					isCard ? el(
						PanelBody,
						{ title: __( 'カードデザイン', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'カード内余白（px）', 'cni-blocks' ), value: numberOr( attributes.cardPadding, 16 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { cardPadding: numberOr( value, 16 ) } ); } } ),
						el( 'p', null, __( 'カード背景色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.cardBackgroundColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { cardBackgroundColor: value || '#ffffff' } ); } } ),
						el( RangeControl, { label: __( '角丸（px）', 'cni-blocks' ), value: numberOr( attributes.cardRadius, 8 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { cardRadius: numberOr( value, 8 ) } ); } } ),
						el( ToggleControl, { label: __( '影を表示', 'cni-blocks' ), checked: !!attributes.cardShadow, onChange: function( value ) { setAttributes( { cardShadow: !!value } ); } } ),
						el( ToggleControl, { label: __( '枠線を表示', 'cni-blocks' ), checked: attributes.cardBorder !== false, onChange: function( value ) { setAttributes( { cardBorder: !!value } ); } } ),
						attributes.cardBorder !== false ? el( RangeControl, { label: __( '枠線の太さ（px）', 'cni-blocks' ), value: numberOr( attributes.cardBorderWidth, 1 ), min: 1, max: 12, onChange: function( value ) { setAttributes( { cardBorderWidth: numberOr( value, 1 ) } ); } } ) : null,
						attributes.cardBorder !== false ? el( 'p', null, __( '枠線の色', 'cni-blocks' ) ) : null,
						attributes.cardBorder !== false ? el( ColorPalette, { value: attributes.cardBorderColor || '#dddddd', clearable: false, onChange: function( value ) { setAttributes( { cardBorderColor: value || '#dddddd' } ); } } ) : null
					) : null,
					isCard ? el(
						PanelBody,
						{ title: __( '画像・マウスオーバー', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( '画像比率', 'cni-blocks' ),
							value: attributes.imageRatio || '16-9',
							options: [
								{ label: '16:9', value: '16-9' },
								{ label: '4:3', value: '4-3' },
								{ label: '1:1', value: '1-1' },
							],
							onChange: function( value ) { setAttributes( { imageRatio: value } ); },
						} ),
						el( SelectControl, {
							label: __( 'マウスオーバー時の動き', 'cni-blocks' ),
							value: attributes.hoverEffect || 'lift',
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( '画像を暗くする', 'cni-blocks' ), value: 'darken' },
								{ label: __( '画像を拡大する', 'cni-blocks' ), value: 'zoom' },
								{ label: __( 'カードを少し持ち上げる', 'cni-blocks' ), value: 'lift' },
							],
							onChange: function( value ) { setAttributes( { hoverEffect: value } ); },
						} )
					) : null
				),
				el(
					'div',
					blockProps,
					el( ServerSideRender, {
						block: 'cni-blocks/post-list',
						attributes: attributes,
					} )
				)
			);
		},
		save: function() {
			return null;
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n, window.wp.serverSideRender );

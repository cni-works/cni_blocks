( function( blocks, element, blockEditor, components, i18n, serverSideRender ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InspectorControls } = blockEditor;
	const { ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const ServerSideRender = serverSideRender.ServerSideRender || serverSideRender.default || serverSideRender;

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	blocks.registerBlockType( 'cni-blocks/breadcrumb', {
		apiVersion: 3,
		title: __( 'パンくず表示+', 'cni-blocks' ),
		description: __( '現在のページに合わせたパンくずを好きな位置に表示します。', 'cni-blocks' ),
		icon: 'arrow-right-alt',
		category: 'cni-blocks',
		attributes: {
			showHome: { type: 'boolean', default: true },
			homeLabel: { type: 'string', default: 'ホーム' },
			showCurrent: { type: 'boolean', default: true },
			hideOnFront: { type: 'boolean', default: true },
			separator: { type: 'string', default: 'chevron' },
			textAlign: { type: 'string', default: 'left' },
			fontSize: { type: 'number', default: 14 },
			textColor: { type: 'string', default: '#666666' },
			linkColor: { type: 'string', default: '#2271b1' },
			separatorColor: { type: 'string', default: '#999999' },
			paddingTop: { type: 'number', default: 8 },
			paddingBottom: { type: 'number', default: 8 },
		},
		usesContext: [ 'postId', 'postType' ],
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes, context } = props;
			const postId = context && context.postId ? context.postId : 0;
			const blockProps = useBlockProps();

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'パンくずの内容', 'cni-blocks' ), initialOpen: true },
						el( ToggleControl, {
							label: __( 'ホームを表示', 'cni-blocks' ),
							checked: attributes.showHome !== false,
							onChange: function( value ) { setAttributes( { showHome: !!value } ); },
						} ),
						attributes.showHome !== false ? el( TextControl, {
							label: __( 'ホームの文字', 'cni-blocks' ),
							value: attributes.homeLabel || '',
							onChange: function( value ) { setAttributes( { homeLabel: value } ); },
						} ) : null,
						el( ToggleControl, {
							label: __( '現在のページを表示', 'cni-blocks' ),
							checked: attributes.showCurrent !== false,
							onChange: function( value ) { setAttributes( { showCurrent: !!value } ); },
						} ),
						el( ToggleControl, {
							label: __( 'トップページでは非表示', 'cni-blocks' ),
							checked: attributes.hideOnFront !== false,
							onChange: function( value ) { setAttributes( { hideOnFront: !!value } ); },
						} ),
						el( SelectControl, {
							label: __( '区切り記号', 'cni-blocks' ),
							value: attributes.separator || 'chevron',
							options: [
								{ label: '›', value: 'chevron' },
								{ label: '>', value: 'greater' },
								{ label: '/', value: 'slash' },
								{ label: '»', value: 'double' },
							],
							onChange: function( value ) { setAttributes( { separator: value } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( '配置・サイズ', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( '文字の配置', 'cni-blocks' ),
							value: attributes.textAlign || 'left',
							options: [
								{ label: __( '左寄せ', 'cni-blocks' ), value: 'left' },
								{ label: __( '中央', 'cni-blocks' ), value: 'center' },
								{ label: __( '右寄せ', 'cni-blocks' ), value: 'right' },
							],
							onChange: function( value ) { setAttributes( { textAlign: value } ); },
						} ),
						el( RangeControl, { label: __( '文字サイズ（px）', 'cni-blocks' ), value: numberOr( attributes.fontSize, 14 ), min: 10, max: 32, onChange: function( value ) { setAttributes( { fontSize: numberOr( value, 14 ) } ); } } ),
						el( RangeControl, { label: __( '上の余白（px）', 'cni-blocks' ), value: numberOr( attributes.paddingTop, 8 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { paddingTop: numberOr( value, 8 ) } ); } } ),
						el( RangeControl, { label: __( '下の余白（px）', 'cni-blocks' ), value: numberOr( attributes.paddingBottom, 8 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { paddingBottom: numberOr( value, 8 ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '色', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( '文字色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.textColor || '#666666', clearable: false, onChange: function( value ) { setAttributes( { textColor: value || '#666666' } ); } } ),
						el( 'p', null, __( 'リンク色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.linkColor || '#2271b1', clearable: false, onChange: function( value ) { setAttributes( { linkColor: value || '#2271b1' } ); } } ),
						el( 'p', null, __( '区切り記号の色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.separatorColor || '#999999', clearable: false, onChange: function( value ) { setAttributes( { separatorColor: value || '#999999' } ); } } )
					)
				),
				el(
					'div',
					blockProps,
					el( ServerSideRender, {
						block: 'cni-blocks/breadcrumb',
						attributes: attributes,
						urlQueryArgs: postId ? { post_id: postId } : {},
					} )
				)
			);
		},
		save: function() {
			return null;
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n, window.wp.serverSideRender );

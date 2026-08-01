( function( blocks, element, blockEditor, components, i18n, serverSideRender ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InspectorControls } = blockEditor;
	const { ColorPalette, Notice, PanelBody, RangeControl, SelectControl, TextControl } = components;
	const ServerSideRender = serverSideRender.ServerSideRender || serverSideRender.default || serverSideRender;

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	blocks.registerBlockType( 'cni-blocks/custom-field', {
		apiVersion: 3,
		title: __( 'カスタムフィールド+', 'cni-blocks' ),
		description: __( '現在の投稿や固定ページに保存されたカスタムフィールドを表示します。', 'cni-blocks' ),
		icon: 'editor-code',
		category: 'cni-blocks',
		attributes: {
			fieldKey: { type: 'string', default: '' },
			displayMode: { type: 'string', default: 'linebreak' },
			fallbackText: { type: 'string', default: '' },
			htmlTag: { type: 'string', default: 'div' },
			textAlign: { type: 'string', default: 'left' },
			fontSize: { type: 'number', default: 0 },
			textColor: { type: 'string', default: '' },
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
						{ title: __( 'カスタムフィールド設定', 'cni-blocks' ), initialOpen: true },
						el( TextControl, {
							label: __( 'カスタムフィールド名', 'cni-blocks' ),
							help: __( '例：company_name（先頭が「_」の非公開フィールドは表示できません）', 'cni-blocks' ),
							value: attributes.fieldKey || '',
							onChange: function( value ) { setAttributes( { fieldKey: value } ); },
						} ),
						el( SelectControl, {
							label: __( '表示方法', 'cni-blocks' ),
							value: attributes.displayMode || 'linebreak',
							options: [
								{ label: __( '改行を反映', 'cni-blocks' ), value: 'linebreak' },
								{ label: __( '1行のテキスト', 'cni-blocks' ), value: 'plain' },
							],
							onChange: function( value ) { setAttributes( { displayMode: value } ); },
						} ),
						el( TextControl, {
							label: __( '値がない場合の文字', 'cni-blocks' ),
							help: __( '空欄の場合はブロック自体を表示しません。', 'cni-blocks' ),
							value: attributes.fallbackText || '',
							onChange: function( value ) { setAttributes( { fallbackText: value } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( '表示スタイル', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( 'HTML要素', 'cni-blocks' ),
							value: attributes.htmlTag || 'div',
							options: [
								{ label: 'div', value: 'div' },
								{ label: 'p', value: 'p' },
								{ label: 'span', value: 'span' },
							],
							onChange: function( value ) { setAttributes( { htmlTag: value } ); },
						} ),
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
						el( RangeControl, {
							label: __( '文字サイズ（px）', 'cni-blocks' ),
							help: __( '0の場合はテーマの標準サイズを使用します。', 'cni-blocks' ),
							value: numberOr( attributes.fontSize, 0 ),
							min: 0,
							max: 72,
							onChange: function( value ) { setAttributes( { fontSize: numberOr( value, 0 ) } ); },
						} ),
						el( 'p', null, __( '文字色', 'cni-blocks' ) ),
						el( ColorPalette, {
							value: attributes.textColor || undefined,
							onChange: function( value ) { setAttributes( { textColor: value || '' } ); },
						} )
					)
				),
				el(
					'div',
					blockProps,
					! attributes.fieldKey ? el( Notice, { status: 'info', isDismissible: false }, __( '右側の設定でカスタムフィールド名を入力してください。', 'cni-blocks' ) ) : null,
					attributes.fieldKey ? el( ServerSideRender, {
						block: 'cni-blocks/custom-field',
						attributes: attributes,
						urlQueryArgs: postId ? { post_id: postId } : {},
					} ) : null
				)
			);
		},
		save: function() {
			return null;
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n, window.wp.serverSideRender );

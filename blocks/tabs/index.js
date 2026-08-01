( function( blocks, element, blockEditor, components, data, i18n ) {
	'use strict';

	const el = element.createElement;
	const { useEffect } = element;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const TAB_ITEM = 'cni-blocks/tab-item';
	const GROUP_TEMPLATE = [
		[ 'core/group', {}, [ [ 'core/paragraph', { placeholder: __( 'タブの内容を入力', 'cni-blocks' ) } ] ] ],
	];
	const TABS_TEMPLATE = [
		[ TAB_ITEM, { label: 'タブ 01' } ],
		[ TAB_ITEM, { label: 'タブ 02' } ],
	];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function px( value, fallback ) {
		return numberOr( value, fallback ) + 'px';
	}

	function sanitizeFontAwesomeClasses( value ) {
		return String( value || '' )
			.split( /\s+/ )
			.filter( function( className ) { return /^fa[a-z0-9-]*$/i.test( className ); } )
			.join( ' ' );
	}

	function getTabsStyle( attributes, activeColor ) {
		return {
			'--cni-tabs-current-color': activeColor || '#2385b8',
			'--cni-tabs-inactive-background': attributes.inactiveBackgroundColor || '#f0f0f0',
			'--cni-tabs-inactive-text': attributes.inactiveTextColor || '#333333',
			'--cni-tabs-content-background': attributes.contentBackgroundColor || '#ffffff',
			'--cni-tabs-content-border-width': attributes.contentBorder !== false ? '1px' : '0px',
			'--cni-tabs-content-border-color': attributes.contentBorderColor || '#dddddd',
			'--cni-tabs-content-padding': px( attributes.contentPadding, 24 ),
			'--cni-tabs-label-padding-y': px( attributes.labelPaddingY, 14 ),
			'--cni-tabs-label-padding-x': px( attributes.labelPaddingX, 24 ),
			'--cni-tabs-label-radius': px( attributes.labelRadius, 8 ),
			'--cni-tabs-gap': px( attributes.tabGap, 4 ),
		};
	}

	function tabButtonChildren( tab ) {
		const children = [];
		if ( tab.attributes.iconBefore ) {
			children.push( el( 'span', { key: 'before', className: 'cni-tabs__icon', 'aria-hidden': 'true' }, tab.attributes.iconBefore ) );
		}
		if ( tab.attributes.fontAwesomeBefore ) {
			children.push( el( 'i', { key: 'fa-before', className: 'cni-tabs__icon ' + sanitizeFontAwesomeClasses( tab.attributes.fontAwesomeBefore ), 'aria-hidden': 'true' } ) );
		}
		children.push( el( 'span', { key: 'label' }, tab.attributes.label || __( 'タブ', 'cni-blocks' ) ) );
		if ( tab.attributes.iconAfter ) {
			children.push( el( 'span', { key: 'after', className: 'cni-tabs__icon', 'aria-hidden': 'true' }, tab.attributes.iconAfter ) );
		}
		if ( tab.attributes.fontAwesomeAfter ) {
			children.push( el( 'i', { key: 'fa-after', className: 'cni-tabs__icon ' + sanitizeFontAwesomeClasses( tab.attributes.fontAwesomeAfter ), 'aria-hidden': 'true' } ) );
		}
		return children;
	}

	blocks.registerBlockType( TAB_ITEM, {
		apiVersion: 3,
		title: __( 'タブ項目', 'cni-blocks' ),
		description: __( 'タブ+の内部で使用する項目です。', 'cni-blocks' ),
		icon: 'excerpt-view',
		category: 'cni-blocks',
		parent: [ 'cni-blocks/tabs' ],
		usesContext: [ 'cni-blocks/tabs-active-index' ],
		attributes: {
			label: { type: 'string', default: 'タブ' },
			activeColor: { type: 'string', default: '#2385b8' },
			activeTextColor: { type: 'string', default: '#ffffff' },
			iconBefore: { type: 'string', default: '' },
			iconAfter: { type: 'string', default: '' },
			fontAwesomeBefore: { type: 'string', default: '' },
			fontAwesomeAfter: { type: 'string', default: '' },
		},
		supports: {
			inserter: false,
			html: false,
			reusable: false,
		},
		edit: function( props ) {
			const tabState = data.useSelect( function( select ) {
				const editor = select( 'core/block-editor' );
				return {
					index: editor.getBlockIndex( props.clientId ),
					rootClientId: editor.getBlockRootClientId( props.clientId ),
					isSelected: editor.isBlockSelected( props.clientId ) || editor.hasSelectedInnerBlock( props.clientId, true ),
				};
			}, [ props.clientId ] );
			const activeIndex = numberOr( props.context[ 'cni-blocks/tabs-active-index' ], 0 );
			const isActive = tabState.index === activeIndex;

			useEffect( function() {
				if ( tabState.isSelected && tabState.index >= 0 && tabState.index !== activeIndex && tabState.rootClientId ) {
					data.dispatch( 'core/block-editor' ).updateBlockAttributes( tabState.rootClientId, { activeIndex: tabState.index } );
				}
			}, [ tabState.isSelected, tabState.index, tabState.rootClientId, activeIndex ] );

			const blockProps = useBlockProps( {
				className: isActive ? 'is-editor-active' : 'is-editor-hidden',
			} );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'タブの内容', 'cni-blocks' ), initialOpen: true },
						el( TextControl, { label: __( 'タブ名', 'cni-blocks' ), value: props.attributes.label || '', onChange: function( value ) { props.setAttributes( { label: value } ); } } ),
						el( TextControl, { label: __( '文字の前の記号', 'cni-blocks' ), help: __( '絵文字や短い記号を入力できます。', 'cni-blocks' ), value: props.attributes.iconBefore || '', onChange: function( value ) { props.setAttributes( { iconBefore: value } ); } } ),
						el( TextControl, { label: __( '文字の後の記号', 'cni-blocks' ), value: props.attributes.iconAfter || '', onChange: function( value ) { props.setAttributes( { iconAfter: value } ); } } ),
						el( TextControl, { label: __( '文字の前のFont Awesomeクラス', 'cni-blocks' ), help: __( '例：fa-solid fa-user。サイト側でFont Awesomeが読み込まれている場合に表示されます。', 'cni-blocks' ), value: props.attributes.fontAwesomeBefore || '', onChange: function( value ) { props.setAttributes( { fontAwesomeBefore: sanitizeFontAwesomeClasses( value ) } ); } } ),
						el( TextControl, { label: __( '文字の後のFont Awesomeクラス', 'cni-blocks' ), help: __( '例：fa-solid fa-arrow-right', 'cni-blocks' ), value: props.attributes.fontAwesomeAfter || '', onChange: function( value ) { props.setAttributes( { fontAwesomeAfter: sanitizeFontAwesomeClasses( value ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '選択時の色', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( '選択色', 'cni-blocks' ) ),
						el( ColorPalette, { value: props.attributes.activeColor || '#2385b8', clearable: false, onChange: function( value ) { props.setAttributes( { activeColor: value || '#2385b8' } ); } } ),
						el( 'p', null, __( '選択時の文字色', 'cni-blocks' ) ),
						el( ColorPalette, { value: props.attributes.activeTextColor || '#ffffff', clearable: false, onChange: function( value ) { props.setAttributes( { activeTextColor: value || '#ffffff' } ); } } )
					)
				),
				el(
					'div',
					blockProps,
					el( InnerBlocks, {
						allowedBlocks: [ 'core/group' ],
						template: GROUP_TEMPLATE,
						templateLock: false,
						renderAppender: false,
					} )
				)
			);
		},
		save: function( props ) {
			const savedAttributes = {
				'data-tab-label': props.attributes.label || '',
				'data-active-color': props.attributes.activeColor || '#2385b8',
				'data-active-text-color': props.attributes.activeTextColor || '#ffffff',
				'data-icon-before': props.attributes.iconBefore || '',
				'data-icon-after': props.attributes.iconAfter || '',
			};
			const fontAwesomeBefore = sanitizeFontAwesomeClasses( props.attributes.fontAwesomeBefore );
			const fontAwesomeAfter = sanitizeFontAwesomeClasses( props.attributes.fontAwesomeAfter );
			if ( fontAwesomeBefore ) {
				savedAttributes['data-fa-before'] = fontAwesomeBefore;
			}
			if ( fontAwesomeAfter ) {
				savedAttributes['data-fa-after'] = fontAwesomeAfter;
			}
			const blockProps = blockEditor.useBlockProps.save( savedAttributes );

			return el(
				'div',
				blockProps,
				el( 'div', { className: 'cni-tab-item__fallback-label' }, props.attributes.label || 'タブ' ),
				el( 'div', { className: 'cni-tab-item__panel' }, el( InnerBlocks.Content ) )
			);
		},
	} );

	blocks.registerBlockType( 'cni-blocks/tabs', {
		apiVersion: 3,
		title: __( 'タブ+', 'cni-blocks' ),
		description: __( '自由なブロックを配置できる内容をタブで切り替えます。', 'cni-blocks' ),
		icon: 'index-card',
		category: 'cni-blocks',
		attributes: {
			activeIndex: { type: 'number', default: 0 },
			design: { type: 'string', default: 'standard' },
			widthPc: { type: 'string', default: 'equal' },
			widthTablet: { type: 'string', default: 'equal' },
			widthMobile: { type: 'string', default: 'fit' },
			overflowPc: { type: 'string', default: 'wrap' },
			overflowTablet: { type: 'string', default: 'scroll' },
			overflowMobile: { type: 'string', default: 'scroll' },
			inactiveBackgroundColor: { type: 'string', default: '#f0f0f0' },
			inactiveTextColor: { type: 'string', default: '#333333' },
			contentBackgroundColor: { type: 'string', default: '#ffffff' },
			contentBorder: { type: 'boolean', default: true },
			contentBorderColor: { type: 'string', default: '#dddddd' },
			contentPadding: { type: 'number', default: 24 },
			labelPaddingY: { type: 'number', default: 14 },
			labelPaddingX: { type: 'number', default: 24 },
			labelRadius: { type: 'number', default: 8 },
			tabGap: { type: 'number', default: 4 },
		},
		providesContext: {
			'cni-blocks/tabs-active-index': 'activeIndex',
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes, clientId } = props;
			const tabItems = data.useSelect( function( select ) {
				return select( 'core/block-editor' ).getBlocks( clientId ).filter( function( block ) { return block.name === TAB_ITEM; } );
			}, [ clientId ] );
			const maxIndex = Math.max( 0, tabItems.length - 1 );
			const activeIndex = Math.min( maxIndex, Math.max( 0, numberOr( attributes.activeIndex, 0 ) ) );
			const activeTab = tabItems[activeIndex];

			useEffect( function() {
				if ( attributes.activeIndex !== activeIndex ) {
					setAttributes( { activeIndex: activeIndex } );
				}
			}, [ attributes.activeIndex, activeIndex ] );

			const blockProps = useBlockProps( {
				style: getTabsStyle( attributes, activeTab && activeTab.attributes.activeColor ),
				'data-design': attributes.design || 'standard',
				'data-width-pc': attributes.widthPc || 'equal',
				'data-width-tablet': attributes.widthTablet || 'equal',
				'data-width-mobile': attributes.widthMobile || 'fit',
				'data-overflow-pc': attributes.overflowPc || 'wrap',
				'data-overflow-tablet': attributes.overflowTablet || 'scroll',
				'data-overflow-mobile': attributes.overflowMobile || 'scroll',
			} );

			function activateTab( index ) {
				setAttributes( { activeIndex: index } );
				if ( tabItems[index] ) {
					data.dispatch( 'core/block-editor' ).selectBlock( tabItems[index].clientId );
				}
			}

			function addTab() {
				const labelNumber = String( tabItems.length + 1 ).padStart( 2, '0' );
				const tab = blocks.createBlock( TAB_ITEM, { label: __( 'タブ', 'cni-blocks' ) + ' ' + labelNumber } );
				data.dispatch( 'core/block-editor' ).insertBlock( tab, undefined, clientId, true );
				setAttributes( { activeIndex: tabItems.length } );
			}

			function deviceOptions( label, widthAttribute, overflowAttribute ) {
				return [
					el( SelectControl, {
						key: label + '-width',
						label: label + __( 'のタブ幅', 'cni-blocks' ),
						value: attributes[widthAttribute],
						options: [
							{ label: __( '文字幅に合わせる', 'cni-blocks' ), value: 'fit' },
							{ label: __( 'すべて等幅', 'cni-blocks' ), value: 'equal' },
						],
						onChange: function( value ) { const update = {}; update[widthAttribute] = value; setAttributes( update ); },
					} ),
					el( SelectControl, {
						key: label + '-overflow',
						label: label + __( 'で収まらない場合', 'cni-blocks' ),
						value: attributes[overflowAttribute],
						options: [
							{ label: __( '横スクロール', 'cni-blocks' ), value: 'scroll' },
							{ label: __( '複数行に折り返す', 'cni-blocks' ), value: 'wrap' },
						],
						onChange: function( value ) { const update = {}; update[overflowAttribute] = value; setAttributes( update ); },
					} ),
				];
			}

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'タブのデザイン', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( 'デザイン', 'cni-blocks' ),
							value: attributes.design || 'standard',
							options: [
								{ label: __( '標準', 'cni-blocks' ), value: 'standard' },
								{ label: __( 'ライン', 'cni-blocks' ), value: 'line' },
							],
							onChange: function( value ) { setAttributes( { design: value } ); },
						} ),
						el( RangeControl, { label: __( 'ラベルの上下余白（px）', 'cni-blocks' ), value: numberOr( attributes.labelPaddingY, 14 ), min: 4, max: 60, onChange: function( value ) { setAttributes( { labelPaddingY: numberOr( value, 14 ) } ); } } ),
						el( RangeControl, { label: __( 'ラベルの左右余白（px）', 'cni-blocks' ), value: numberOr( attributes.labelPaddingX, 24 ), min: 4, max: 80, onChange: function( value ) { setAttributes( { labelPaddingX: numberOr( value, 24 ) } ); } } ),
						el( RangeControl, { label: __( 'ラベル上部の角丸（px）', 'cni-blocks' ), value: numberOr( attributes.labelRadius, 8 ), min: 0, max: 40, onChange: function( value ) { setAttributes( { labelRadius: numberOr( value, 8 ) } ); } } ),
						el( RangeControl, { label: __( 'タブ間隔（px）', 'cni-blocks' ), value: numberOr( attributes.tabGap, 4 ), min: 0, max: 40, onChange: function( value ) { setAttributes( { tabGap: numberOr( value, 4 ) } ); } } )
					),
					el( PanelBody, { title: __( '端末別の表示', 'cni-blocks' ), initialOpen: false }, deviceOptions( 'PC', 'widthPc', 'overflowPc' ), deviceOptions( __( 'タブレット', 'cni-blocks' ), 'widthTablet', 'overflowTablet' ), deviceOptions( __( 'スマートフォン', 'cni-blocks' ), 'widthMobile', 'overflowMobile' ) ),
					el(
						PanelBody,
						{ title: __( '非選択タブの色', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( '背景色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.inactiveBackgroundColor || '#f0f0f0', clearable: false, onChange: function( value ) { setAttributes( { inactiveBackgroundColor: value || '#f0f0f0' } ); } } ),
						el( 'p', null, __( '文字色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.inactiveTextColor || '#333333', clearable: false, onChange: function( value ) { setAttributes( { inactiveTextColor: value || '#333333' } ); } } )
					),
					el(
						PanelBody,
						{ title: __( 'コンテンツ部分', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '内側余白（px）', 'cni-blocks' ), value: numberOr( attributes.contentPadding, 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { contentPadding: numberOr( value, 24 ) } ); } } ),
						el( 'p', null, __( '背景色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.contentBackgroundColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { contentBackgroundColor: value || '#ffffff' } ); } } ),
						el( ToggleControl, { label: __( '枠線を表示', 'cni-blocks' ), checked: attributes.contentBorder !== false, onChange: function( value ) { setAttributes( { contentBorder: !!value } ); } } ),
						attributes.contentBorder !== false ? el( 'p', null, __( '枠線の色', 'cni-blocks' ) ) : null,
						attributes.contentBorder !== false ? el( ColorPalette, { value: attributes.contentBorderColor || '#dddddd', clearable: false, onChange: function( value ) { setAttributes( { contentBorderColor: value || '#dddddd' } ); } } ) : null
					)
				),
				el(
					'div',
					blockProps,
					el(
						'div',
						{ className: 'cni-tabs__tablist cni-tabs__editor-tablist', role: 'tablist', 'aria-label': __( 'タブ', 'cni-blocks' ) },
						tabItems.map( function( tab, index ) {
							const isActive = index === activeIndex;
							return el(
								Button,
								{
									key: tab.clientId,
									className: 'cni-tabs__tab' + ( isActive ? ' is-active' : '' ),
									role: 'tab',
									'aria-selected': isActive ? 'true' : 'false',
									style: {
										'--cni-tab-active-color': tab.attributes.activeColor || '#2385b8',
										'--cni-tab-active-text': tab.attributes.activeTextColor || '#ffffff',
									},
									onClick: function() { activateTab( index ); },
								},
								tabButtonChildren( tab )
							);
						} )
					),
					el( 'div', { className: 'cni-tabs__panels cni-tabs__editor-panels' }, el( InnerBlocks, { allowedBlocks: [ TAB_ITEM ], template: TABS_TEMPLATE, templateLock: false, renderAppender: false } ) ),
					el( 'div', { className: 'cni-tabs-add-item' }, el( Button, { className: 'cni-tabs-add-item__button', icon: 'plus-alt2', variant: 'secondary', onClick: addTab }, __( 'タブを追加', 'cni-blocks' ) ) )
				)
			);
		},
		save: function( props ) {
			const attributes = props.attributes;
			const blockProps = blockEditor.useBlockProps.save( {
				style: getTabsStyle( attributes, '#2385b8' ),
				'data-active-index': Math.max( 0, numberOr( attributes.activeIndex, 0 ) ),
				'data-design': attributes.design || 'standard',
				'data-width-pc': attributes.widthPc || 'equal',
				'data-width-tablet': attributes.widthTablet || 'equal',
				'data-width-mobile': attributes.widthMobile || 'fit',
				'data-overflow-pc': attributes.overflowPc || 'wrap',
				'data-overflow-tablet': attributes.overflowTablet || 'scroll',
				'data-overflow-mobile': attributes.overflowMobile || 'scroll',
			} );

			return el(
				'div',
				blockProps,
				el( 'div', { className: 'cni-tabs__tablist', role: 'tablist', 'aria-label': 'タブ' } ),
				el( 'div', { className: 'cni-tabs__panels' }, el( InnerBlocks.Content ) )
			);
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.data, window.wp.i18n );

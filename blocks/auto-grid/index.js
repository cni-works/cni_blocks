( function( blocks, element, blockEditor, components, data, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const CARD_BLOCK = 'cni-blocks/grid-card';
	const GRID_TEMPLATE = [ [ CARD_BLOCK ] ];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function px( value, fallback ) {
		return numberOr( value, fallback ) + 'px';
	}

	function getGridStyle( attributes ) {
		const minWidthPc = Math.max( 120, numberOr( attributes.minWidthPc, 280 ) );
		const minWidthTablet = attributes.minWidthTablet > 0 ? attributes.minWidthTablet : minWidthPc;
		const minWidthMobile = attributes.minWidthMobile > 0 ? attributes.minWidthMobile : minWidthTablet;

		const style = {
			'--cni-grid-min-width-pc': minWidthPc + 'px',
			'--cni-grid-min-width-tablet': Math.max( 120, minWidthTablet ) + 'px',
			'--cni-grid-min-width-mobile': Math.max( 120, minWidthMobile ) + 'px',
			'--cni-grid-card-padding-pc': px( attributes.cardPaddingPc, 24 ),
			'--cni-grid-card-padding-tablet': px( attributes.cardPaddingTablet, 20 ),
			'--cni-grid-card-padding-mobile': px( attributes.cardPaddingMobile, 16 ),
			'--cni-grid-gap-x': px( attributes.gapHorizontal, 24 ),
			'--cni-grid-gap-y': px( attributes.gapVertical, 24 ),
			'--cni-grid-card-background': attributes.cardBackgroundColor || '#ffffff',
			'--cni-grid-card-radius': px( attributes.cardRadius, 8 ),
			'--cni-grid-card-shadow': attributes.cardShadow ? '0 8px 24px rgba(0, 0, 0, 0.12)' : 'none',
			'--cni-grid-card-border-width': attributes.cardBorder ? px( attributes.cardBorderWidth, 1 ) : '0px',
			'--cni-grid-card-border-color': attributes.cardBorderColor || '#dddddd',
		};

		if ( attributes.flushFirstImage ) {
			style[ '--cni-grid-first-image-ratio' ] = {
				'16-9': '16 / 9',
				'3-2': '3 / 2',
				'1-1': '1 / 1',
			}[ attributes.firstImageAspectRatio ] || '4 / 3';
			style[ '--cni-grid-first-image-fit' ] = attributes.firstImageFit === 'contain' ? 'contain' : 'cover';
			style[ '--cni-grid-first-image-position' ] = [ 'top', 'bottom' ].indexOf( attributes.firstImagePosition ) !== -1 ? attributes.firstImagePosition : 'center';
		}

		return style;
	}

	function getGridBlockProps( attributes ) {
		const blockProps = {
			style: getGridStyle( attributes ),
			'data-equal-height': attributes.equalHeight !== false ? '1' : '0',
			'data-align-buttons-bottom': attributes.alignButtonsBottom ? '1' : '0',
		};

		if ( attributes.centerLastRow ) {
			blockProps[ 'data-last-row-alignment' ] = 'center';
		}

		if ( attributes.flushFirstImage ) {
			blockProps.className = 'cni-grid--flush-first-image';
		}

		return blockProps;
	}

	function clearLastRowOffset( cards ) {
		cards.forEach( function( card ) {
			card.classList.remove( 'cni-grid-card--last-row-centered' );
			card.style.removeProperty( '--cni-grid-last-row-offset' );
		} );
	}

	function centerIncompleteLastRow( container, enabled ) {
		const cards = Array.prototype.filter.call( container.children, function( child ) {
			return child.classList.contains( 'wp-block-cni-blocks-grid-card' );
		} );

		clearLastRowOffset( cards );

		if ( ! enabled || cards.length < 2 ) {
			return;
		}

		const styles = window.getComputedStyle( container );
		const minWidth = parseFloat( styles.getPropertyValue( '--cni-grid-min-width-current' ) );
		const gap = parseFloat( styles.columnGap ) || 0;
		const columns = minWidth > 0 ? Math.max( 1, Math.floor( ( container.clientWidth + gap ) / ( minWidth + gap ) ) ) : 1;
		const remaining = cards.length % columns;
		const cardWidth = columns > 0 ? ( container.clientWidth - ( columns - 1 ) * gap ) / columns : 0;
		const columnStep = cardWidth + gap;

		if ( columns < 2 || remaining === 0 || cardWidth <= 0 ) {
			return;
		}

		const offset = ( columns - remaining ) * columnStep / 2;

		cards.slice( -remaining ).forEach( function( card ) {
			card.classList.add( 'cni-grid-card--last-row-centered' );
			card.style.setProperty( '--cni-grid-last-row-offset', offset + 'px' );
		} );
	}

	blocks.registerBlockType( CARD_BLOCK, {
		apiVersion: 3,
		title: __( 'Grid+ Card', 'cni-blocks' ),
		description: __( 'Grid+内部で使用するカード。', 'cni-blocks' ),
		icon: 'index-card',
		category: 'cni-blocks',
		parent: [ 'cni-blocks/auto-grid' ],
		attributes: {
			linkUrl: { type: 'string', default: '' },
			linkTarget: { type: 'boolean', default: false },
			showLinkArrow: { type: 'boolean', default: false },
			hoverEffect: { type: 'string', default: 'lift' },
		},
		supports: {
			inserter: false,
			html: false,
			reusable: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const linkUrl = attributes.linkUrl || '';
			const hoverEffect = [ 'lift', 'darken', 'lift-darken', 'none' ].indexOf( attributes.hoverEffect ) !== -1 ? attributes.hoverEffect : 'lift';
			const blockProps = useBlockProps();

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'カードリンク', 'cni-blocks' ), initialOpen: false },
						el( TextControl, {
							label: __( 'リンクURL', 'cni-blocks' ),
							type: 'url',
							value: linkUrl,
							help: __( '設定すると、公開画面でカード全体をクリックできます。', 'cni-blocks' ),
							onChange: function( value ) {
								setAttributes( { linkUrl: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( '新しいタブで開く', 'cni-blocks' ),
							checked: !! attributes.linkTarget,
							disabled: ! linkUrl,
							onChange: function( value ) {
								setAttributes( { linkTarget: value } );
							},
						} ),
						el( ToggleControl, {
							label: __( '右下に矢印を表示', 'cni-blocks' ),
							checked: !! attributes.showLinkArrow,
							disabled: ! linkUrl,
							onChange: function( value ) {
								setAttributes( { showLinkArrow: value } );
							},
						} ),
						el( SelectControl, {
							label: __( 'マウスオーバー時の効果', 'cni-blocks' ),
							value: hoverEffect,
							disabled: ! linkUrl,
							options: [
								{ label: __( '浮き上がる', 'cni-blocks' ), value: 'lift' },
								{ label: __( '暗くする', 'cni-blocks' ), value: 'darken' },
								{ label: __( '浮き上がる・暗くする', 'cni-blocks' ), value: 'lift-darken' },
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
							],
							onChange: function( value ) {
								setAttributes( { hoverEffect: value } );
							},
						} )
					)
				),
				el(
					'div',
					blockProps,
					el(
						'div',
						{ className: 'cni-grid-card__inner' },
						el( InnerBlocks, {
							templateLock: false,
							renderAppender: InnerBlocks.ButtonBlockAppender,
						} )
					)
				)
			);
		},
		save: function( props ) {
			const { attributes } = props;
			const linkUrl = ( attributes.linkUrl || '' ).trim();
			const hoverEffect = [ 'lift', 'darken', 'lift-darken', 'none' ].indexOf( attributes.hoverEffect ) !== -1 ? attributes.hoverEffect : 'lift';
			const classes = [ 'has-cni-grid-card-link' ];

			if ( hoverEffect !== 'lift' ) {
				classes.push( 'cni-grid-card--hover-' + hoverEffect );
			}

			const saveProps = linkUrl ? { className: classes.join( ' ' ) } : {};

			return el(
				'div',
				blockEditor.useBlockProps.save( saveProps ),
				el(
					'div',
					{ className: 'cni-grid-card__inner' },
					el( InnerBlocks.Content )
				),
				linkUrl && el( 'a', {
					className: 'cni-grid-card__link',
					href: linkUrl,
					target: attributes.linkTarget ? '_blank' : undefined,
					rel: attributes.linkTarget ? 'noopener noreferrer' : undefined,
					'aria-label': __( 'このカードを開く', 'cni-blocks' ),
				} ),
				linkUrl && attributes.showLinkArrow && el(
					'span',
					{ className: 'cni-grid-card__link-arrow', 'aria-hidden': 'true' },
					'→'
				)
			);
		},
	} );

	blocks.registerBlockType( 'cni-blocks/auto-grid', {
		apiVersion: 3,
		title: __( 'Grid+', 'cni-blocks' ),
		description: __( 'カードの最小幅から列数を自動計算するレスポンシブグリッド。', 'cni-blocks' ),
		icon: 'grid-view',
		category: 'cni-blocks',
		attributes: {
			minWidthPc: { type: 'number', default: 280 },
			minWidthTablet: { type: 'number', default: 0 },
			minWidthMobile: { type: 'number', default: 0 },
			cardPaddingPc: { type: 'number', default: 24 },
			cardPaddingTablet: { type: 'number', default: 20 },
			cardPaddingMobile: { type: 'number', default: 16 },
			flushFirstImage: { type: 'boolean', default: false },
			firstImageAspectRatio: { type: 'string', default: '4-3' },
			firstImageFit: { type: 'string', default: 'cover' },
			firstImagePosition: { type: 'string', default: 'center' },
			gapHorizontal: { type: 'number', default: 24 },
			gapVertical: { type: 'number', default: 24 },
			cardBackgroundColor: { type: 'string', default: '#ffffff' },
			cardRadius: { type: 'number', default: 8 },
			cardShadow: { type: 'boolean', default: false },
			cardBorder: { type: 'boolean', default: false },
			cardBorderWidth: { type: 'number', default: 1 },
			cardBorderColor: { type: 'string', default: '#dddddd' },
			equalHeight: { type: 'boolean', default: true },
			alignButtonsBottom: { type: 'boolean', default: false },
			centerLastRow: { type: 'boolean', default: false },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const gridRef = element.useRef( null );
			const addCard = function() {
				const card = blocks.createBlock( CARD_BLOCK );

				data.dispatch( 'core/block-editor' ).insertBlock( card, undefined, props.clientId, true );
			};
			const gridBlockProps = getGridBlockProps( attributes );
			gridBlockProps.ref = gridRef;
			const blockProps = useBlockProps( gridBlockProps );

			element.useEffect( function() {
				const grid = gridRef.current;
				const layout = grid ? grid.querySelector( ':scope > .block-editor-inner-blocks > .block-editor-block-list__layout' ) : null;

				if ( ! layout ) {
					return undefined;
				}

				const update = function() {
					centerIncompleteLastRow( layout, !! attributes.centerLastRow );
				};
				const resizeObserver = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver( update ) : null;
				const mutationObserver = typeof window.MutationObserver === 'function' ? new window.MutationObserver( update ) : null;

				update();
				if ( resizeObserver ) {
					resizeObserver.observe( layout );
				}
				if ( mutationObserver ) {
					mutationObserver.observe( layout, { childList: true } );
				}

				return function() {
					if ( resizeObserver ) {
						resizeObserver.disconnect();
					}
					if ( mutationObserver ) {
						mutationObserver.disconnect();
					}
				};
			}, [ attributes.centerLastRow, props.clientId ] );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( 'カードの最小幅', 'cni-blocks' ), initialOpen: true },
						el( RangeControl, {
							label: __( 'PC 最小幅（px）', 'cni-blocks' ),
							value: numberOr( attributes.minWidthPc, 280 ),
							min: 120,
							max: 600,
							step: 10,
							onChange: function( value ) { setAttributes( { minWidthPc: numberOr( value, 280 ) } ); },
						} ),
						el( RangeControl, {
							label: __( 'タブレット 最小幅（px・0でPCを継承）', 'cni-blocks' ),
							value: numberOr( attributes.minWidthTablet, 0 ),
							min: 0,
							max: 600,
							step: 10,
							onChange: function( value ) { setAttributes( { minWidthTablet: numberOr( value, 0 ) } ); },
						} ),
						el( RangeControl, {
							label: __( 'モバイル 最小幅（px・0で上位設定を継承）', 'cni-blocks' ),
							value: numberOr( attributes.minWidthMobile, 0 ),
							min: 0,
							max: 600,
							step: 10,
							onChange: function( value ) { setAttributes( { minWidthMobile: numberOr( value, 0 ) } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( 'カード内余白', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'PC padding（px）', 'cni-blocks' ), value: numberOr( attributes.cardPaddingPc, 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingPc: numberOr( value, 24 ) } ); } } ),
						el( RangeControl, { label: __( 'タブレット padding（px）', 'cni-blocks' ), value: numberOr( attributes.cardPaddingTablet, 20 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingTablet: numberOr( value, 20 ) } ); } } ),
						el( RangeControl, { label: __( 'モバイル padding（px）', 'cni-blocks' ), value: numberOr( attributes.cardPaddingMobile, 16 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingMobile: numberOr( value, 16 ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( 'カード先頭画像', 'cni-blocks' ), initialOpen: false },
						el( ToggleControl, {
							label: __( '先頭画像を上・左右の余白いっぱいに表示', 'cni-blocks' ),
							help: __( '各カードの先頭に直接配置した画像ブロックだけに適用します。', 'cni-blocks' ),
							checked: !!attributes.flushFirstImage,
							onChange: function( value ) { setAttributes( { flushFirstImage: !!value } ); },
						} ),
						attributes.flushFirstImage ? el( SelectControl, {
							label: __( '画像の縦横比', 'cni-blocks' ),
							value: attributes.firstImageAspectRatio || '4-3',
							options: [
								{ label: '16:9', value: '16-9' },
								{ label: '3:2', value: '3-2' },
								{ label: '4:3', value: '4-3' },
								{ label: '1:1', value: '1-1' },
							],
							onChange: function( value ) { setAttributes( { firstImageAspectRatio: value } ); },
						} ) : null,
						attributes.flushFirstImage ? el( SelectControl, {
							label: __( '画像の収まり', 'cni-blocks' ),
							value: attributes.firstImageFit || 'cover',
							options: [
								{ label: __( 'トリミング（cover）', 'cni-blocks' ), value: 'cover' },
								{ label: __( '全体を表示（contain）', 'cni-blocks' ), value: 'contain' },
							],
							onChange: function( value ) { setAttributes( { firstImageFit: value } ); },
						} ) : null,
						attributes.flushFirstImage ? el( SelectControl, {
							label: __( 'トリミング位置', 'cni-blocks' ),
							value: attributes.firstImagePosition || 'center',
							options: [
								{ label: __( '上', 'cni-blocks' ), value: 'top' },
								{ label: __( '中央', 'cni-blocks' ), value: 'center' },
								{ label: __( '下', 'cni-blocks' ), value: 'bottom' },
							],
							onChange: function( value ) { setAttributes( { firstImagePosition: value } ); },
						} ) : null
					),
					el(
						PanelBody,
						{ title: __( 'カード間隔', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( '横gap（px）', 'cni-blocks' ), value: numberOr( attributes.gapHorizontal, 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { gapHorizontal: numberOr( value, 24 ) } ); } } ),
						el( RangeControl, { label: __( '縦gap（px）', 'cni-blocks' ), value: numberOr( attributes.gapVertical, 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { gapVertical: numberOr( value, 24 ) } ); } } )
					),
					el(
						PanelBody,
						{ title: __( 'カードデザイン', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( 'カード背景色', 'cni-blocks' ) ),
						el( ColorPalette, {
							value: attributes.cardBackgroundColor || '#ffffff',
							onChange: function( value ) { setAttributes( { cardBackgroundColor: value || '#ffffff' } ); },
							clearable: false,
						} ),
						el( RangeControl, { label: __( '角丸（px）', 'cni-blocks' ), value: numberOr( attributes.cardRadius, 8 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { cardRadius: numberOr( value, 8 ) } ); } } ),
						el( ToggleControl, { label: __( '影を表示', 'cni-blocks' ), checked: !!attributes.cardShadow, onChange: function( value ) { setAttributes( { cardShadow: !!value } ); } } ),
						el( ToggleControl, { label: __( '枠線を表示', 'cni-blocks' ), checked: !!attributes.cardBorder, onChange: function( value ) { setAttributes( { cardBorder: !!value } ); } } ),
						attributes.cardBorder ? el( RangeControl, { label: __( '枠線の太さ（px）', 'cni-blocks' ), value: numberOr( attributes.cardBorderWidth, 1 ), min: 1, max: 12, onChange: function( value ) { setAttributes( { cardBorderWidth: numberOr( value, 1 ) } ); } } ) : null,
						attributes.cardBorder ? el( 'p', null, __( '枠線の色', 'cni-blocks' ) ) : null,
						attributes.cardBorder ? el( ColorPalette, {
							value: attributes.cardBorderColor || '#dddddd',
							onChange: function( value ) { setAttributes( { cardBorderColor: value || '#dddddd' } ); },
							clearable: false,
						} ) : null
					),
					el(
						PanelBody,
						{ title: __( '高さ・ボタン配置', 'cni-blocks' ), initialOpen: false },
						el( ToggleControl, { label: __( 'カードの高さをそろえる', 'cni-blocks' ), checked: attributes.equalHeight !== false, onChange: function( value ) { setAttributes( { equalHeight: !!value } ); } } ),
						el( ToggleControl, {
							label: __( '最終行のカードを中央揃え', 'cni-blocks' ),
							help: __( '3列で5枚の場合、下段の2枚をカード幅を変えずに中央へ寄せます。', 'cni-blocks' ),
							checked: !! attributes.centerLastRow,
							onChange: function( value ) { setAttributes( { centerLastRow: !!value } ); },
						} ),
						el( ToggleControl, {
							label: __( '最後のボタンをカード下端へそろえる', 'cni-blocks' ),
							help: __( '各カードの最後に配置した「ボタン」ブロックへ適用します。', 'cni-blocks' ),
							checked: !!attributes.alignButtonsBottom,
							onChange: function( value ) { setAttributes( { alignButtonsBottom: !!value } );
							},
						} )
					)
				),
				el(
					'div',
					blockProps,
					el( InnerBlocks, {
						allowedBlocks: [ CARD_BLOCK ],
						orientation: 'horizontal',
						template: GRID_TEMPLATE,
						templateLock: false,
						renderAppender: false,
					} ),
					el(
						'div',
						{ className: 'cni-grid-add-card' },
						el(
							Button,
							{
								className: 'cni-grid-add-card__button',
								icon: 'plus-alt2',
								variant: 'secondary',
								onClick: addCard,
							},
							__( 'カードを追加', 'cni-blocks' )
						)
					)
				)
			);
		},
		save: function( props ) {
			const attributes = props.attributes;
			const blockProps = blockEditor.useBlockProps.save( getGridBlockProps( attributes ) );

			return el( 'div', blockProps, el( InnerBlocks.Content ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.data, window.wp.i18n );

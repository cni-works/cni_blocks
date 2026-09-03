( function( blocks, element, blockEditor, components, data, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const { useSelect } = data;
	const CARD_BLOCK = 'cni-blocks/grid-card';
	const GRID_TEMPLATE = [ [ CARD_BLOCK ] ];

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	function px( value, fallback ) {
		return numberOr( value, fallback ) + 'px';
	}

	function isCellGrid( attributes ) {
		return attributes.layoutMode === 'cell';
	}

	function cellBorderWidth( value ) {
		return { none: 0, thin: 1, standard: 2, thick: 4 }[ value ] || 0;
	}

	function cellBorderValue( value, fallback ) {
		return [ 'none', 'thin', 'standard', 'thick' ].indexOf( value ) !== -1 ? value : fallback;
	}

	function cellVerticalLineGradient( columns, firstColumn, color, width ) {
		if ( columns < 2 || width < 1 ) return 'none';
		const positions = [];
		const firstWidth = [ '20', '25', '30', '35' ].indexOf( firstColumn ) !== -1 ? parseInt( firstColumn, 10 ) : 100 / columns;
		for ( let index = 1; index < columns; index += 1 ) {
			const position = index === 1 ? firstWidth : firstWidth + ( ( 100 - firstWidth ) / ( columns - 1 ) * ( index - 1 ) );
			positions.push( Math.round( position * 100 ) / 100 );
		}
		return positions.map( function( position ) {
			return 'linear-gradient(to right, transparent calc(' + position + '% - ' + width + 'px), ' + color + ' calc(' + position + '% - ' + width + 'px), ' + color + ' ' + position + '%, transparent ' + position + '%)';
		} ).join( ', ' );
	}

	function cellPadding( value ) {
		const values = { none: 0, small: 12, standard: 24, large: 36, xlarge: 48 };
		return Object.prototype.hasOwnProperty.call( values, value ) ? values[ value ] : 24;
	}

	function cellRadius( value ) {
		return { none: 0, small: 6, medium: 14, large: 24 }[ value ] || 0;
	}

	function cellCardSettings( attributes ) {
		const columnSpan = Math.max( 1, Math.min( 4, numberOr( attributes.cellColumnSpan, 1 ) ) );
		const rowSpan = Math.max( 1, Math.min( 4, numberOr( attributes.cellRowSpan, 1 ) ) );
		const horizontal = [ 'left', 'center', 'right' ].indexOf( attributes.cellHorizontalAlign ) !== -1 ? attributes.cellHorizontalAlign : 'left';
		const vertical = [ 'top', 'center', 'bottom' ].indexOf( attributes.cellVerticalAlign ) !== -1 ? attributes.cellVerticalAlign : 'top';
		return {
			columnSpan: columnSpan,
			rowSpan: rowSpan,
			horizontal: horizontal,
			vertical: vertical,
			style: {
				'--cni-cell-column-span': columnSpan,
				'--cni-cell-row-span': rowSpan,
				'--cni-cell-text-align': horizontal,
				'--cni-cell-content-align': { top: 'flex-start', center: 'center', bottom: 'flex-end' }[ vertical ],
				...(attributes.cellBackgroundColor ? { '--cni-cell-background': attributes.cellBackgroundColor } : {}),
				...(attributes.cellTextColor ? { '--cni-cell-text-color': attributes.cellTextColor } : {})
			}
		};
	}

	function cardAxisPadding( attributes, axis, device, fallback ) {
		const value = attributes[ 'cardPadding' + axis + device ];
		return typeof value === 'number' && value >= 0
			? value
			: numberOr( attributes[ 'cardPadding' + device ], fallback );
	}

	function getGridStyle( attributes ) {
		const minWidthPc = Math.max( 120, numberOr( attributes.minWidthPc, 280 ) );
		const minWidthTablet = attributes.minWidthTablet > 0 ? attributes.minWidthTablet : minWidthPc;
		const minWidthMobile = attributes.minWidthMobile > 0 ? attributes.minWidthMobile : minWidthTablet;
		const paddingVerticalPc = cardAxisPadding( attributes, 'Vertical', 'Pc', 24 );
		const paddingHorizontalPc = cardAxisPadding( attributes, 'Horizontal', 'Pc', 24 );
		const paddingVerticalTablet = cardAxisPadding( attributes, 'Vertical', 'Tablet', 20 );
		const paddingHorizontalTablet = cardAxisPadding( attributes, 'Horizontal', 'Tablet', 20 );
		const paddingVerticalMobile = cardAxisPadding( attributes, 'Vertical', 'Mobile', 16 );
		const paddingHorizontalMobile = cardAxisPadding( attributes, 'Horizontal', 'Mobile', 16 );

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

		[
			[ 'VerticalPc', paddingVerticalPc ],
			[ 'HorizontalPc', paddingHorizontalPc ],
			[ 'VerticalTablet', paddingVerticalTablet ],
			[ 'HorizontalTablet', paddingHorizontalTablet ],
			[ 'VerticalMobile', paddingVerticalMobile ],
			[ 'HorizontalMobile', paddingHorizontalMobile ],
		].forEach( function( setting ) {
			const attributeName = 'cardPadding' + setting[ 0 ];
			if ( typeof attributes[ attributeName ] === 'number' && attributes[ attributeName ] >= 0 ) {
				style[ '--cni-grid-card-padding-' + setting[ 0 ].replace( 'Vertical', 'v-' ).replace( 'Horizontal', 'h-' ).replace( 'Pc', 'pc' ).replace( 'Tablet', 'tablet' ).replace( 'Mobile', 'mobile' ) ] = setting[ 1 ] + 'px';
			}
		} );

		if ( attributes.flushFirstImage && ! isCellGrid( attributes ) ) {
			style[ '--cni-grid-first-image-ratio' ] = {
				'16-9': '16 / 9',
				'3-2': '3 / 2',
				'1-1': '1 / 1',
			}[ attributes.firstImageAspectRatio ] || '4 / 3';
			style[ '--cni-grid-first-image-fit' ] = attributes.firstImageFit === 'contain' ? 'contain' : 'cover';
			style[ '--cni-grid-first-image-position' ] = [ 'top', 'bottom' ].indexOf( attributes.firstImagePosition ) !== -1 ? attributes.firstImagePosition : 'center';
		}

		if ( isCellGrid( attributes ) ) {
			const columnsPc = Math.max( 1, Math.min( 6, numberOr( attributes.cellColumnsPc, 3 ) ) );
			const columnsTablet = Math.max( 1, Math.min( 4, numberOr( attributes.cellColumnsTablet, 2 ) ) );
			const columnsMobile = Math.max( 1, Math.min( 2, numberOr( attributes.cellColumnsMobile, 1 ) ) );
			const innerBorder = cellBorderValue( attributes.cellInnerBorder, 'thin' );
			const verticalBorder = cellBorderValue( attributes.cellVerticalBorder, innerBorder );
			const horizontalBorder = cellBorderValue( attributes.cellHorizontalBorder, innerBorder );
			const borderColor = attributes.cellBorderColor || '#dddddd';
			style[ '--cni-cell-columns-pc' ] = columnsPc;
			style[ '--cni-cell-columns-tablet' ] = columnsTablet;
			style[ '--cni-cell-columns-mobile' ] = columnsMobile;
			if ( columnsPc > 1 && [ '20', '25', '30', '35' ].indexOf( attributes.cellFirstColumn ) !== -1 ) {
				style[ '--cni-cell-first-column' ] = attributes.cellFirstColumn + '%';
				style[ '--cni-cell-columns-after-first' ] = columnsPc - 1;
			}
			style[ '--cni-cell-outer-border-width' ] = cellBorderWidth( attributes.cellOuterBorder ) + 'px';
			style[ '--cni-cell-vertical-border-width' ] = cellBorderWidth( verticalBorder ) + 'px';
			style[ '--cni-cell-horizontal-border-width' ] = cellBorderWidth( horizontalBorder ) + 'px';
			style[ '--cni-cell-border-color' ] = borderColor;
			style[ '--cni-cell-padding' ] = cellPadding( attributes.cellPadding ) + 'px';
			style[ '--cni-cell-radius' ] = cellRadius( attributes.cellRadius ) + 'px';
			style[ '--cni-cell-background' ] = attributes.cellTransparentBackground ? 'transparent' : ( attributes.cellBackgroundColor || '#ffffff' );
			const verticalBorderWidth = cellBorderWidth( verticalBorder );
			style[ '--cni-cell-vertical-line-gradient-pc' ] = cellVerticalLineGradient( columnsPc, attributes.cellFirstColumn, borderColor, verticalBorderWidth );
			style[ '--cni-cell-vertical-line-gradient-tablet' ] = cellVerticalLineGradient( columnsTablet, 'equal', borderColor, verticalBorderWidth );
			style[ '--cni-cell-vertical-line-gradient-mobile' ] = cellVerticalLineGradient( columnsMobile, 'equal', borderColor, verticalBorderWidth );
			style[ '--cni-cell-vertical-line-gradient-compact' ] = cellVerticalLineGradient( 2, 'equal', borderColor, verticalBorderWidth );
			style[ '--cni-cell-scroll-min-width' ] = Math.max( 640, columnsPc * 220 ) + 'px';
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

		if ( attributes.flushFirstImage && ! isCellGrid( attributes ) ) {
			blockProps.className = 'cni-grid--flush-first-image';
		}

		if ( isCellGrid( attributes ) ) {
			blockProps.className = ( blockProps.className ? blockProps.className + ' ' : '' ) + 'cni-grid--cell';
			blockProps[ 'data-cell-transparent-background' ] = attributes.cellTransparentBackground ? '1' : '0';
			blockProps[ 'data-cell-mobile-layout' ] = [ 'stack', 'scroll', 'compact' ].indexOf( attributes.cellMobileLayout ) !== -1 ? attributes.cellMobileLayout : 'stack';
			if ( numberOr( attributes.cellColumnsPc, 3 ) > 1 && [ '20', '25', '30', '35' ].indexOf( attributes.cellFirstColumn ) !== -1 ) {
				blockProps[ 'data-cell-first-column' ] = attributes.cellFirstColumn;
			}
		}

		return blockProps;
	}

	/* Gutenberg adds its own inline grid columns to InnerBlocks in the editor.
	 * Keep that editor-only value in sync with the same responsive rules used
	 * by the saved CSS, so the first-column preset is visible while editing. */
	function editorCellGridTemplate( attributes, device ) {
		const columnsPc = Math.max( 1, Math.min( 6, numberOr( attributes.cellColumnsPc, 3 ) ) );
		const columnsTablet = Math.max( 1, Math.min( 4, numberOr( attributes.cellColumnsTablet, 2 ) ) );
		const firstColumn = [ '20', '25', '30', '35' ].indexOf( attributes.cellFirstColumn ) !== -1 ? attributes.cellFirstColumn : '';
		const mobileLayout = [ 'stack', 'scroll', 'compact' ].indexOf( attributes.cellMobileLayout ) !== -1 ? attributes.cellMobileLayout : 'stack';

		if ( device === 'Mobile' ) {
			if ( mobileLayout === 'stack' ) return '1fr';
			if ( mobileLayout === 'compact' ) return 'repeat(2, minmax(0, 1fr))';
		}

		if ( device === 'Tablet' ) {
			return 'repeat(' + columnsTablet + ', minmax(0, 1fr))';
		}

		return firstColumn && columnsPc > 1
			? 'minmax(0, ' + firstColumn + '%) repeat(' + ( columnsPc - 1 ) + ', minmax(0, 1fr))'
			: 'repeat(' + columnsPc + ', minmax(0, 1fr))';
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
			cellBackgroundColor: { type: 'string', default: '' },
			cellTextColor: { type: 'string', default: '' },
			cellHorizontalAlign: { type: 'string', default: 'left' },
			cellVerticalAlign: { type: 'string', default: 'top' },
			cellColumnSpan: { type: 'number', default: 1 },
			cellRowSpan: { type: 'number', default: 1 },
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
			const cellSettings = cellCardSettings( attributes );
			const blockProps = useBlockProps( { style: cellSettings.style } );

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
					),
					el(
						PanelBody,
						{ title: __( 'セル設定', 'cni-blocks' ), initialOpen: false },
						el( 'p', { className: 'components-base-control__help' }, __( '親のGrid+が「セルグリッド」の時だけ公開画面に適用されます。', 'cni-blocks' ) ),
						el( 'p', null, __( 'セル背景色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.cellBackgroundColor || '', clearable: true, onChange: function( value ) { setAttributes( { cellBackgroundColor: value || '' } ); } } ),
						el( 'p', null, __( 'セル文字色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.cellTextColor || '', clearable: true, onChange: function( value ) { setAttributes( { cellTextColor: value || '' } ); } } ),
						el( SelectControl, { label: __( '横位置', 'cni-blocks' ), value: cellSettings.horizontal, options: [ { label: __( '左', 'cni-blocks' ), value: 'left' }, { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '右', 'cni-blocks' ), value: 'right' } ], onChange: function( value ) { setAttributes( { cellHorizontalAlign: value || 'left' } ); } } ),
						el( SelectControl, { label: __( '縦位置', 'cni-blocks' ), value: cellSettings.vertical, options: [ { label: __( '上', 'cni-blocks' ), value: 'top' }, { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '下', 'cni-blocks' ), value: 'bottom' } ], onChange: function( value ) { setAttributes( { cellVerticalAlign: value || 'top' } ); } } ),
						el( RangeControl, { label: __( '横サイズ（セル数）', 'cni-blocks' ), value: cellSettings.columnSpan, min: 1, max: 4, onChange: function( value ) { setAttributes( { cellColumnSpan: Math.max( 1, Math.min( 4, numberOr( value, 1 ) ) ) } ); } } ),
						el( RangeControl, { label: __( '縦サイズ（セル数）', 'cni-blocks' ), value: cellSettings.rowSpan, min: 1, max: 4, onChange: function( value ) { setAttributes( { cellRowSpan: Math.max( 1, Math.min( 4, numberOr( value, 1 ) ) ) } ); } } )
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
			const cellSettings = cellCardSettings( attributes );

			if ( hoverEffect !== 'lift' ) {
				classes.push( 'cni-grid-card--hover-' + hoverEffect );
			}

			const saveProps = linkUrl ? { className: classes.join( ' ' ) } : {};
			const hasCellSettings = !! attributes.cellBackgroundColor || !! attributes.cellTextColor || cellSettings.horizontal !== 'left' || cellSettings.vertical !== 'top' || cellSettings.columnSpan !== 1 || cellSettings.rowSpan !== 1;
			if ( hasCellSettings ) {
				saveProps.className = ( saveProps.className ? saveProps.className + ' ' : '' ) + 'cni-grid-card--cell-configured';
				saveProps.style = cellSettings.style;
			}

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
			cardPaddingVerticalPc: { type: 'number', default: -1 },
			cardPaddingHorizontalPc: { type: 'number', default: -1 },
			cardPaddingVerticalTablet: { type: 'number', default: -1 },
			cardPaddingHorizontalTablet: { type: 'number', default: -1 },
			cardPaddingVerticalMobile: { type: 'number', default: -1 },
			cardPaddingHorizontalMobile: { type: 'number', default: -1 },
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
			layoutMode: { type: 'string', default: 'grid' },
			cellColumnsPc: { type: 'number', default: 3 },
			cellColumnsTablet: { type: 'number', default: 2 },
			cellColumnsMobile: { type: 'number', default: 1 },
			cellFirstColumn: { type: 'string', default: 'equal' },
			cellMobileLayout: { type: 'string', default: 'stack' },
			cellOuterBorder: { type: 'string', default: 'standard' },
			cellInnerBorder: { type: 'string', default: 'thin' },
			cellVerticalBorder: { type: 'string', default: '' },
			cellHorizontalBorder: { type: 'string', default: '' },
			cellBorderColor: { type: 'string', default: '#dddddd' },
			cellPadding: { type: 'string', default: 'standard' },
			cellRadius: { type: 'string', default: 'none' },
			cellBackgroundColor: { type: 'string', default: '#ffffff' },
			cellTransparentBackground: { type: 'boolean', default: false },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const cellMode = isCellGrid( attributes );
			const gridRef = element.useRef( null );
			const editorDevice = useSelect( function( select ) {
				const editorStore = select( 'core/editor' );
				return editorStore && editorStore.getDeviceType ? editorStore.getDeviceType() : 'Desktop';
			}, [] );
			const addCard = function() {
				const card = blocks.createBlock( CARD_BLOCK );

				data.dispatch( 'core/block-editor' ).insertBlock( card, undefined, props.clientId, true );
			};
			const gridBlockProps = getGridBlockProps( attributes );
			gridBlockProps[ 'data-editor-device' ] = [ 'Desktop', 'Tablet', 'Mobile' ].indexOf( editorDevice ) !== -1 ? editorDevice : 'Desktop';
			gridBlockProps.ref = gridRef;
			const blockProps = useBlockProps( gridBlockProps );

			element.useEffect( function() {
				const grid = gridRef.current;
				const layout = grid ? grid.querySelector( cellMode ? ':scope > .cni-cell-grid-scroll > .block-editor-inner-blocks > .block-editor-block-list__layout' : ':scope > .block-editor-inner-blocks > .block-editor-block-list__layout' ) : null;

				if ( ! layout ) {
					return undefined;
				}

				const update = function() {
					centerIncompleteLastRow( layout, ! cellMode && !! attributes.centerLastRow );
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
			}, [ attributes.centerLastRow, cellMode, props.clientId ] );

			element.useEffect( function() {
				const grid = gridRef.current;
				const layout = grid ? grid.querySelector( cellMode ? ':scope > .cni-cell-grid-scroll > .block-editor-inner-blocks > .block-editor-block-list__layout' : ':scope > .block-editor-inner-blocks > .block-editor-block-list__layout' ) : null;

				if ( ! layout ) return;

				if ( cellMode ) {
					layout.style.setProperty( 'grid-template-columns', editorCellGridTemplate( attributes, editorDevice ) );
				} else {
					layout.style.removeProperty( 'grid-template-columns' );
				}
			}, [ cellMode, editorDevice, attributes.cellColumnsPc, attributes.cellColumnsTablet, attributes.cellFirstColumn, attributes.cellMobileLayout, props.clientId ] );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el( PanelBody, { title: __( 'レイアウトモード', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( 'モード', 'cni-blocks' ), value: cellMode ? 'cell' : 'grid', options: [ { label: __( '通常グリッド', 'cni-blocks' ), value: 'grid' }, { label: __( 'セルグリッド', 'cni-blocks' ), value: 'cell' } ], onChange: function( value ) { setAttributes( { layoutMode: value === 'cell' ? 'cell' : 'grid' } ); } } ),
						cellMode ? el( 'p', { className: 'components-base-control__help' }, __( '各Grid+ Cardがセルになります。セルを選択すると、背景色・文字色・揃え・Spanを設定できます。', 'cni-blocks' ) ) : null
					),
					cellMode ? el( PanelBody, { title: __( 'セルグリッド', 'cni-blocks' ), initialOpen: true },
						el( RangeControl, { label: __( 'PC列数', 'cni-blocks' ), value: Math.max( 1, Math.min( 6, numberOr( attributes.cellColumnsPc, 3 ) ) ), min: 1, max: 6, onChange: function( value ) { setAttributes( { cellColumnsPc: Math.max( 1, Math.min( 6, numberOr( value, 3 ) ) ) } ); } } ),
						el( SelectControl, { label: __( 'PC 1列目の幅', 'cni-blocks' ), value: attributes.cellFirstColumn || 'equal', disabled: numberOr( attributes.cellColumnsPc, 3 ) < 2, options: [ { label: __( '均等', 'cni-blocks' ), value: 'equal' }, { label: __( '狭い（20%）', 'cni-blocks' ), value: '20' }, { label: __( '標準（25%）', 'cni-blocks' ), value: '25' }, { label: __( '広い（30%）', 'cni-blocks' ), value: '30' }, { label: __( '特大（35%）', 'cni-blocks' ), value: '35' } ], onChange: function( value ) { setAttributes( { cellFirstColumn: value || 'equal' } ); } } ),
						el( RangeControl, { label: __( 'タブレット列数', 'cni-blocks' ), value: Math.max( 1, Math.min( 4, numberOr( attributes.cellColumnsTablet, 2 ) ) ), min: 1, max: 4, onChange: function( value ) { setAttributes( { cellColumnsTablet: Math.max( 1, Math.min( 4, numberOr( value, 2 ) ) ) } ); } } ),
						el( SelectControl, { label: __( 'モバイル表示', 'cni-blocks' ), value: attributes.cellMobileLayout || 'stack', options: [ { label: __( '縦に並べる（1列）', 'cni-blocks' ), value: 'stack' }, { label: __( '横スクロールで比較する', 'cni-blocks' ), value: 'scroll' }, { label: __( '2列に縮小する', 'cni-blocks' ), value: 'compact' } ], onChange: function( value ) { setAttributes( { cellMobileLayout: value || 'stack' } ); } } ),
						el( SelectControl, { label: __( '外枠', 'cni-blocks' ), value: attributes.cellOuterBorder || 'standard', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '細い（1px）', 'cni-blocks' ), value: 'thin' }, { label: __( '標準（2px）', 'cni-blocks' ), value: 'standard' }, { label: __( '太い（4px）', 'cni-blocks' ), value: 'thick' } ], onChange: function( value ) { setAttributes( { cellOuterBorder: value || 'none' } ); } } ),
						el( SelectControl, { label: __( '縦の区切り線', 'cni-blocks' ), value: cellBorderValue( attributes.cellVerticalBorder, cellBorderValue( attributes.cellInnerBorder, 'thin' ) ), options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '細い（1px）', 'cni-blocks' ), value: 'thin' }, { label: __( '標準（2px）', 'cni-blocks' ), value: 'standard' }, { label: __( '太い（4px）', 'cni-blocks' ), value: 'thick' } ], onChange: function( value ) { setAttributes( { cellVerticalBorder: value || 'none' } ); } } ),
						el( SelectControl, { label: __( '横の区切り線', 'cni-blocks' ), value: cellBorderValue( attributes.cellHorizontalBorder, cellBorderValue( attributes.cellInnerBorder, 'thin' ) ), options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '細い（1px）', 'cni-blocks' ), value: 'thin' }, { label: __( '標準（2px）', 'cni-blocks' ), value: 'standard' }, { label: __( '太い（4px）', 'cni-blocks' ), value: 'thick' } ], onChange: function( value ) { setAttributes( { cellHorizontalBorder: value || 'none' } ); } } ),
						el( 'p', null, __( '罫線色', 'cni-blocks' ) ), el( ColorPalette, { value: attributes.cellBorderColor || '#dddddd', clearable: false, onChange: function( value ) { setAttributes( { cellBorderColor: value || '#dddddd' } ); } } ),
						el( SelectControl, { label: __( 'セル内余白', 'cni-blocks' ), value: attributes.cellPadding || 'standard', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '標準', 'cni-blocks' ), value: 'standard' }, { label: __( '大', 'cni-blocks' ), value: 'large' }, { label: __( '特大', 'cni-blocks' ), value: 'xlarge' } ], onChange: function( value ) { setAttributes( { cellPadding: value || 'standard' } ); } } ),
						el( SelectControl, { label: __( '外側の角丸', 'cni-blocks' ), value: attributes.cellRadius || 'none', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '中', 'cni-blocks' ), value: 'medium' }, { label: __( '大', 'cni-blocks' ), value: 'large' } ], onChange: function( value ) { setAttributes( { cellRadius: value || 'none' } ); } } ),
						el( ToggleControl, { label: __( 'セル背景を透明にする', 'cni-blocks' ), checked: !! attributes.cellTransparentBackground, help: __( '透明時は縦の区切り線だけを表示します。', 'cni-blocks' ), onChange: function( value ) { setAttributes( value ? { cellTransparentBackground: true, cellHorizontalBorder: 'none' } : { cellTransparentBackground: false } ); } } ),
						! attributes.cellTransparentBackground ? el( element.Fragment, null, el( 'p', null, __( 'セルの標準背景色', 'cni-blocks' ) ), el( ColorPalette, { value: attributes.cellBackgroundColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { cellBackgroundColor: value || '#ffffff' } ); } } ) ) : null
					) : null,
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
						el( RangeControl, { label: __( 'PC 上下余白（px）', 'cni-blocks' ), value: cardAxisPadding( attributes, 'Vertical', 'Pc', 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingVerticalPc: numberOr( value, 24 ) } ); } } ),
						el( RangeControl, { label: __( 'PC 左右余白（px）', 'cni-blocks' ), value: cardAxisPadding( attributes, 'Horizontal', 'Pc', 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingHorizontalPc: numberOr( value, 24 ) } ); } } ),
						el( RangeControl, { label: __( 'タブレット 上下余白（px）', 'cni-blocks' ), value: cardAxisPadding( attributes, 'Vertical', 'Tablet', 20 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingVerticalTablet: numberOr( value, 20 ) } ); } } ),
						el( RangeControl, { label: __( 'タブレット 左右余白（px）', 'cni-blocks' ), value: cardAxisPadding( attributes, 'Horizontal', 'Tablet', 20 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingHorizontalTablet: numberOr( value, 20 ) } ); } } ),
						el( RangeControl, { label: __( 'モバイル 上下余白（px）', 'cni-blocks' ), value: cardAxisPadding( attributes, 'Vertical', 'Mobile', 16 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingVerticalMobile: numberOr( value, 16 ) } ); } } ),
						el( RangeControl, { label: __( 'モバイル 左右余白（px）', 'cni-blocks' ), value: cardAxisPadding( attributes, 'Horizontal', 'Mobile', 16 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { cardPaddingHorizontalMobile: numberOr( value, 16 ) } ); } } )
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
					cellMode ? el( 'div', { className: 'cni-cell-grid-scroll' }, el( InnerBlocks, {
						allowedBlocks: [ CARD_BLOCK ], orientation: 'horizontal', template: GRID_TEMPLATE, templateLock: false, renderAppender: false,
					} ) ) : el( InnerBlocks, {
						allowedBlocks: [ CARD_BLOCK ], orientation: 'horizontal', template: GRID_TEMPLATE, templateLock: false, renderAppender: false,
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
							cellMode ? __( 'セルを追加', 'cni-blocks' ) : __( 'カードを追加', 'cni-blocks' )
						)
					)
				)
			);
		},
		save: function( props ) {
			const attributes = props.attributes;
			const blockProps = blockEditor.useBlockProps.save( getGridBlockProps( attributes ) );
			const cellMode = isCellGrid( attributes );
			if ( cellMode ) {
				return el( 'div', blockProps,
					el( 'div', { className: 'cni-cell-grid-scroll', tabIndex: 0, role: 'region', 'aria-label': __( 'セルグリッド', 'cni-blocks' ) },
						el( 'div', { className: 'cni-cell-grid-content' }, el( InnerBlocks.Content ) )
					),
					attributes.cellMobileLayout === 'scroll' ? el( 'p', { className: 'cni-cell-grid-scroll-hint' }, __( '横にスワイプして表示できます', 'cni-blocks' ) ) : null
				);
			}

			return el( 'div', blockProps, el( InnerBlocks.Content ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.data, window.wp.i18n );

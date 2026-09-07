( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls, MediaUpload, MediaUploadCheck, useSettings } = blockEditor;
	const { Button, ColorPalette, FocalPointPicker, PanelBody, RangeControl, SelectControl, ToggleControl } = components;

	function cssUrl( url ) {
		if ( ! url ) return 'none';
		return 'url("' + String( url ).replace( /["\\\n\r]/g, '\\$&' ) + '")';
	}

	function px( value ) {
		return ( typeof value === 'number' ? value : 0 ) + 'px';
	}

	const DIVIDER_TYPES = [
		'none',
		'slope',
		'curve',
		'wave',
		'triangle',
		'triangle-flex',
		'zigzag',
		'cloud',
		'torn',
		'scallop',
		'arch',
		'curve-flex',
	];

	function normalizeDividerType( value ) {
		return DIVIDER_TYPES.indexOf( value ) !== -1 ? value : 'none';
	}

	function numberInRange( value, min, max, fallback ) {
		const number = typeof value === 'number' ? value : fallback;
		return Math.max( min, Math.min( max, number ) );
	}

	function shapeWidthInRange( value, min, fallback ) {
		return numberInRange( value, min, 100, fallback );
	}

	function dividerPath( type, cloudDensity, direction, shapeWidth, zigzagCount ) {
		const normalizedDirection = direction === 'outward' ? 'outward' : 'inward';
		const center = 600;
		let halfWidth;
		let left;
		let right;
		let path;

		switch ( normalizeDividerType( type ) ) {
			case 'slope':
				return 'M0 42 L1200 96 L1200 120 L0 120 Z';
			case 'curve':
				return 'M0 76 C280 8 920 8 1200 76 L1200 120 L0 120 Z';
			case 'wave':
				return 'M0 70 C150 12 300 12 450 70 S750 128 900 70 S1050 12 1200 70 L1200 120 L0 120 Z';
			case 'triangle':
				return 'M0 98 L600 10 L1200 98 L1200 120 L0 120 Z';
			case 'triangle-flex':
				halfWidth = 600 * shapeWidthInRange( shapeWidth, 5, 18 ) / 100;
				left = center - halfWidth;
				right = center + halfWidth;
				return normalizedDirection === 'outward'
					? 'M' + left + ' 0 L600 120 L' + right + ' 0 Z'
					: 'M0 116 L' + left + ' 116 L600 0 L' + right + ' 116 L1200 116 L1200 120 L0 120 Z';
			case 'zigzag':
				zigzagCount = Math.round( numberInRange( zigzagCount, 3, 30, 6 ) );
				path = normalizedDirection === 'outward' ? 'M0 0' : 'M0 92';
				for ( let index = 0; index < zigzagCount; index++ ) {
					const step = 1200 / zigzagCount;
					path += ' L' + ( ( index + 0.5 ) * step ) + ( normalizedDirection === 'outward' ? ' 120' : ' 34' );
					path += ' L' + ( ( index + 1 ) * step ) + ( normalizedDirection === 'outward' ? ' 0' : ' 92' );
				}
				return path + ( normalizedDirection === 'outward' ? ' Z' : ' L1200 120 L0 120 Z' );
			case 'curve-flex':
				halfWidth = 600 * shapeWidthInRange( shapeWidth, 30, 100 ) / 100;
				left = center - halfWidth;
				right = center + halfWidth;
				if ( normalizedDirection === 'outward' ) {
					return 'M' + left + ' 0 Q600 120 ' + right + ' 0 Z';
				}
				return 'M0 120 L' + left + ' 120 Q600 0 ' + right + ' 120 L1200 120 Z';
			case 'torn':
				return 'M0 88 L54 72 L106 84 L158 56 L212 78 L266 62 L322 86 L378 54 L432 76 L486 60 L542 84 L600 52 L656 78 L710 58 L766 86 L822 56 L878 76 L934 60 L990 84 L1046 54 L1102 78 L1154 64 L1200 82 L1200 120 L0 120 Z';
			case 'scallop':
				return 'M0 92 Q60 18 120 92 Q180 18 240 92 Q300 18 360 92 Q420 18 480 92 Q540 18 600 92 Q660 18 720 92 Q780 18 840 92 Q900 18 960 92 Q1020 18 1080 92 Q1140 18 1200 92 L1200 120 L0 120 Z';
			case 'arch':
				return 'M0 100 Q600 -18 1200 100 L1200 120 L0 120 Z';
			default:
				return '';
		}
	}

	function legacyDividerPath( type, cloudDensity, direction, shapeWidth, zigzagCount ) {
		if ( normalizeDividerType( type ) !== 'curve-flex' ) {
			return dividerPath( type, cloudDensity, direction, shapeWidth, zigzagCount );
		}

		const normalizedDirection = direction === 'outward' ? 'outward' : 'inward';
		const center = 600;
		const halfWidth = 600 * shapeWidthInRange( shapeWidth, 30, 100 ) / 100;
		const left = center - halfWidth;
		const right = center + halfWidth;

		if ( normalizedDirection === 'outward' ) {
			return 'M' + left + ' 0 C' + ( left + halfWidth * 0.35 ) + ' 0 ' + ( center - halfWidth * 0.45 ) + ' 120 600 120 C' + ( center + halfWidth * 0.45 ) + ' 120 ' + ( right - halfWidth * 0.35 ) + ' 0 ' + right + ' 0 Z';
		}

		return 'M0 116 L' + left + ' 116 C' + ( left + halfWidth * 0.35 ) + ' 116 ' + ( center - halfWidth * 0.45 ) + ' 0 600 0 C' + ( center + halfWidth * 0.45 ) + ' 0 ' + ( right - halfWidth * 0.35 ) + ' 116 ' + right + ' 116 L1200 116 L1200 120 L0 120 Z';
	}

	function cloudElements( cloudDensity ) {
		const density = numberInRange( cloudDensity, 1, 3, 2 );
		const clouds = density === 1 ? [
			[ -28, 95, 64, 32 ], [ 34, 87, 44, 39 ], [ 84, 70, 50, 52 ], [ 132, 86, 36, 38 ],
			[ 186, 94, 34, 27 ], [ 232, 79, 46, 43 ], [ 282, 52, 58, 67 ], [ 340, 72, 48, 51 ], [ 390, 92, 34, 29 ],
			[ 454, 89, 41, 35 ], [ 505, 70, 53, 51 ], [ 560, 61, 61, 60 ], [ 620, 86, 43, 38 ],
			[ 688, 94, 35, 27 ], [ 734, 81, 43, 40 ], [ 786, 48, 62, 64 ], [ 848, 63, 53, 56 ], [ 902, 90, 38, 32 ],
			[ 966, 86, 45, 38 ], [ 1018, 70, 51, 49 ], [ 1074, 58, 58, 60 ], [ 1133, 51, 63, 66 ], [ 1196, 85, 49, 38 ], [ 1234, 95, 36, 27 ],
		] : density === 3 ? [
			[ -18, 96, 43, 26 ], [ 25, 89, 29, 33 ], [ 58, 76, 34, 44 ], [ 94, 84, 27, 36 ], [ 126, 94, 25, 27 ],
			[ 166, 75, 34, 45 ], [ 203, 54, 43, 57 ], [ 244, 67, 36, 49 ], [ 280, 88, 28, 33 ],
			[ 324, 92, 27, 29 ], [ 358, 70, 35, 47 ], [ 397, 78, 30, 41 ], [ 432, 47, 46, 61 ], [ 478, 65, 37, 50 ], [ 517, 90, 29, 31 ],
			[ 559, 83, 31, 37 ], [ 594, 66, 37, 49 ], [ 633, 89, 28, 32 ], [ 669, 94, 26, 27 ],
			[ 709, 71, 35, 46 ], [ 747, 55, 43, 58 ], [ 791, 73, 35, 47 ], [ 828, 88, 29, 33 ],
			[ 873, 93, 27, 28 ], [ 907, 65, 38, 50 ], [ 948, 75, 32, 44 ], [ 984, 50, 45, 63 ], [ 1029, 67, 37, 49 ], [ 1068, 90, 29, 31 ],
			[ 1110, 80, 32, 39 ], [ 1147, 57, 42, 57 ], [ 1190, 72, 36, 46 ], [ 1228, 94, 34, 27 ],
		] : [
			[ -22, 96, 51, 28 ], [ 30, 88, 37, 37 ], [ 73, 73, 44, 49 ], [ 119, 85, 34, 38 ], [ 158, 94, 30, 28 ],
			[ 205, 77, 43, 44 ], [ 252, 49, 56, 64 ], [ 307, 63, 47, 54 ], [ 355, 89, 35, 32 ],
			[ 410, 91, 34, 30 ], [ 454, 68, 47, 51 ], [ 505, 74, 40, 46 ], [ 551, 45, 59, 62 ], [ 610, 65, 49, 53 ], [ 661, 89, 36, 33 ],
			[ 716, 82, 40, 40 ], [ 761, 61, 51, 56 ], [ 812, 87, 38, 35 ], [ 858, 94, 31, 28 ],
			[ 906, 70, 46, 49 ], [ 955, 52, 57, 64 ], [ 1012, 68, 48, 52 ], [ 1062, 90, 36, 32 ],
			[ 1114, 84, 40, 38 ], [ 1159, 57, 53, 57 ], [ 1216, 91, 45, 31 ],
		];

		return [ el( 'rect', { key: 'base', x: 0, y: 96, width: 1200, height: 24 } ) ].concat(
			clouds.map( function( cloud, index ) {
				return el( 'ellipse', {
					key: 'cloud-' + index,
					cx: cloud[0],
					cy: cloud[1],
					rx: cloud[2],
					ry: cloud[3],
				} );
			} )
		);
	}

	function dividerElement( position, attributes, pathGenerator ) {
		const prefix = position === 'top' ? 'top' : 'bottom';
		const type = normalizeDividerType( attributes[ prefix + 'DividerType' ] );
		if ( type === 'none' ) return null;

		const height = numberInRange( attributes[ prefix + 'DividerHeight' ], 20, 240, 80 );
		const density = numberInRange( attributes[ prefix + 'DividerCloudDensity' ], 1, 3, 2 );
		const direction = attributes[ prefix + 'DividerDirection' ] === 'outward' ? 'outward' : 'inward';
		const shapeWidth = attributes[ prefix + 'DividerShapeWidth' ];
		const zigzagCount = attributes[ prefix + 'DividerZigzagCount' ];
		const supportsDirection = type === 'triangle-flex' || type === 'curve-flex' || type === 'zigzag';
		const className = 'cni-outer__divider cni-outer__divider--' + position +
			( attributes[ prefix + 'DividerFlip' ] ? ' is-flipped' : '' ) +
			( supportsDirection && direction === 'outward' ? ' is-outward' : '' );

		return el(
			'div',
			{
				className: className,
				style: {
					'--cni-outer-divider-height': height + 'px',
					'--cni-outer-divider-color': attributes[ prefix + 'DividerColor' ] || '#ffffff',
				},
				'aria-hidden': 'true',
			},
			el(
				'svg',
				{ viewBox: type === 'cloud' ? '0 -20 1200 140' : '0 0 1200 120', preserveAspectRatio: 'none', focusable: 'false' },
				type === 'cloud' ? cloudElements( density ) : el( 'path', { d: ( pathGenerator || dividerPath )( type, density, direction, shapeWidth, zigzagCount ) } )
			)
		);
	}

	function dividerTypeOptions( currentType ) {
		const options = [
			{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
			{ label: __( '傾斜', 'cni-blocks' ), value: 'slope' },
			{ label: __( 'カーブ', 'cni-blocks' ), value: 'curve-flex' },
			{ label: __( '波', 'cni-blocks' ), value: 'wave' },
			{ label: __( '三角', 'cni-blocks' ), value: 'triangle-flex' },
			{ label: __( 'ギザギザ', 'cni-blocks' ), value: 'zigzag' },
			{ label: __( '雲', 'cni-blocks' ), value: 'cloud' },
			{ label: __( 'ちぎり紙', 'cni-blocks' ), value: 'torn' },
			{ label: __( 'スカラップ', 'cni-blocks' ), value: 'scallop' },
		];

		if ( currentType === 'curve' ) options.push( { label: __( 'カーブ（旧形式）', 'cni-blocks' ), value: 'curve' } );
		if ( currentType === 'triangle' ) options.push( { label: __( '三角（旧形式）', 'cni-blocks' ), value: 'triangle' } );
		if ( currentType === 'arch' ) options.push( { label: __( '中央アーチ（旧形式）', 'cni-blocks' ), value: 'arch' } );

		return options;
	}

	function dividerSettingsControl( position, attributes, setAttributes, colorPalette ) {
		const prefix = position === 'top' ? 'top' : 'bottom';
		const typeKey = prefix + 'DividerType';
		const colorKey = prefix + 'DividerColor';
		const heightKey = prefix + 'DividerHeight';
		const flipKey = prefix + 'DividerFlip';
		const densityKey = prefix + 'DividerCloudDensity';
		const directionKey = prefix + 'DividerDirection';
		const shapeWidthKey = prefix + 'DividerShapeWidth';
		const zigzagCountKey = prefix + 'DividerZigzagCount';
		const type = normalizeDividerType( attributes[ typeKey ] );
		const direction = attributes[ directionKey ] === 'outward' ? 'outward' : 'inward';
		const supportsDirection = type === 'triangle-flex' || type === 'curve-flex' || type === 'zigzag';
		const supportsWidth = type === 'triangle-flex' || type === 'curve-flex';
		const supportsFlip = type === 'slope' || type === 'wave' || type === 'cloud' || type === 'torn';

		function update( key, value ) {
			const next = {};
			next[ key ] = value;
			setAttributes( next );
		}

		return el(
			'div',
			{ className: 'cni-outer-divider-control' },
			el( 'h3', null, position === 'top' ? __( '上部区切り', 'cni-blocks' ) : __( '下部区切り', 'cni-blocks' ) ),
			el( SelectControl, {
				label: __( '形', 'cni-blocks' ),
				value: type,
				options: dividerTypeOptions( type ),
				onChange: function( value ) {
					const nextType = normalizeDividerType( value );
					const next = {};
					next[ typeKey ] = nextType;
					if ( nextType === 'triangle-flex' ) {
						next[ directionKey ] = 'outward';
						next[ shapeWidthKey ] = 18;
						next[ heightKey ] = 48;
					}
					if ( nextType === 'curve-flex' ) {
						next[ directionKey ] = 'outward';
						next[ shapeWidthKey ] = 100;
						next[ heightKey ] = 64;
					}
					if ( nextType === 'zigzag' ) next[ zigzagCountKey ] = 6;
					setAttributes( next );
				},
			} ),
			supportsDirection ? el( SelectControl, {
				label: __( '区切りの向き', 'cni-blocks' ),
				value: direction,
				options: [
					{ label: __( '外側へ突き出す', 'cni-blocks' ), value: 'outward' },
					{ label: __( '内側へ切り込む', 'cni-blocks' ), value: 'inward' },
				],
				onChange: function( value ) { update( directionKey, value === 'outward' ? 'outward' : 'inward' ); },
			} ) : null,
			type !== 'none' ? el( 'p', null, supportsDirection && direction === 'outward' ? __( '突き出す部分の色', 'cni-blocks' ) : __( '区切られ側の色', 'cni-blocks' ) ) : null,
			type !== 'none' ? el( ColorPalette, {
				colors: colorPalette,
				value: attributes[ colorKey ] || '#ffffff',
				clearable: false,
				onChange: function( value ) { update( colorKey, value || '#ffffff' ); },
			} ) : null,
			type !== 'none' ? el( RangeControl, {
				label: __( '区切りの深さ（px）', 'cni-blocks' ),
				value: numberInRange( attributes[ heightKey ], 20, 240, 80 ),
				min: 20,
				max: 240,
				step: 2,
				onChange: function( value ) { update( heightKey, numberInRange( value, 20, 240, 80 ) ); },
			} ) : null,
			supportsWidth ? el( RangeControl, {
				label: type === 'triangle-flex' ? __( '三角の幅（%）', 'cni-blocks' ) : __( 'カーブの幅（%）', 'cni-blocks' ),
				value: shapeWidthInRange( attributes[ shapeWidthKey ], type === 'triangle-flex' ? 5 : 30, type === 'triangle-flex' ? 18 : 100 ),
				min: type === 'triangle-flex' ? 5 : 30,
				max: type === 'triangle-flex' ? 40 : 100,
				step: 1,
				onChange: function( value ) { update( shapeWidthKey, shapeWidthInRange( value, type === 'triangle-flex' ? 5 : 30, type === 'triangle-flex' ? 18 : 100 ) ); },
			} ) : null,
			type === 'zigzag' ? el( RangeControl, {
				label: __( 'ギザギザの数', 'cni-blocks' ),
				value: Math.round( numberInRange( attributes[ zigzagCountKey ], 3, 30, 6 ) ),
				min: 3,
				max: 30,
				step: 1,
				onChange: function( value ) { update( zigzagCountKey, Math.round( numberInRange( value, 3, 30, 6 ) ) ); },
			} ) : null,
			type === 'cloud' ? el( RangeControl, {
				label: __( '雲の細かさ', 'cni-blocks' ),
				value: numberInRange( attributes[ densityKey ], 1, 3, 2 ),
				min: 1,
				max: 3,
				step: 1,
				onChange: function( value ) { update( densityKey, numberInRange( value, 1, 3, 2 ) ); },
			} ) : null,
			supportsFlip ? el( ToggleControl, {
				label: __( '左右反転', 'cni-blocks' ),
				checked: !! attributes[ flipKey ],
				onChange: function( value ) { update( flipKey, !! value ); },
			} ) : null
		);
	}

	function focalPointFromCss( value ) {
		const match = String( value || '' ).match( /^([0-9.]+)%\s+([0-9.]+)%$/ );
		if ( ! match ) return { x: 0.5, y: 0.5 };
		return {
			x: Math.max( 0, Math.min( 1, parseFloat( match[1] ) / 100 ) ),
			y: Math.max( 0, Math.min( 1, parseFloat( match[2] ) / 100 ) ),
		};
	}

	function focalPointToCss( value ) {
		const x = value && typeof value.x === 'number' ? Math.max( 0, Math.min( 1, value.x ) ) : 0.5;
		const y = value && typeof value.y === 'number' ? Math.max( 0, Math.min( 1, value.y ) ) : 0.5;
		return Math.round( x * 10000 ) / 100 + '% ' + Math.round( y * 10000 ) / 100 + '%';
	}

	function hasDiagonalBackground( attributes ) {
		return attributes.backgroundType === 'diagonal';
	}

	function diagonalAngle( attributes ) {
		const legacyAngles = {
			'down-right': 135,
			'down-left': 225,
			'up-right': 45,
			'up-left': 315,
		};
		const value = attributes.diagonalAngle;
		return typeof value === 'number' && value >= 0 && value <= 360
			? value
			: ( legacyAngles[ attributes.diagonalDirection ] || 135 );
	}

	function diagonalBackgroundImage( attributes ) {
		const accentColor = attributes.diagonalAccentColor || '#1e73be';
		const splitPosition = numberInRange( attributes.diagonalSplitPosition, 10, 90, 50 );

		return 'linear-gradient(' + diagonalAngle( attributes ) + 'deg, ' + accentColor + ' 0 ' + splitPosition + '%, #ffffff ' + splitPosition + '% 100%)';
	}

	function backgroundPositionWithOffset( position, offsetX, offsetY ) {
		const parts = String( position || 'center center' ).trim().split( /\s+/ );
		const xMap = { left: '0%', center: '50%', right: '100%' };
		const yMap = { top: '0%', center: '50%', bottom: '100%' };
		const x = xMap[ parts[0] ] || parts[0] || '50%';
		const y = yMap[ parts[1] ] || parts[1] || '50%';

		return 'calc(' + x + ' + ' + offsetX + 'px) calc(' + y + ' + ' + offsetY + 'px)';
	}

	function hexToRgba( color, opacity ) {
		const value = String( color || '' ).trim();
		const shortMatch = /^#([0-9a-f]{3})$/i.exec( value );
		const longMatch = /^#([0-9a-f]{6})$/i.exec( value );
		let hex = '';

		if ( shortMatch ) {
			hex = shortMatch[ 1 ].split( '' ).map( function( character ) { return character + character; } ).join( '' );
		} else if ( longMatch ) {
			hex = longMatch[ 1 ];
		} else {
			return 'rgba(0, 0, 0, 0)';
		}

		return 'rgba(' + parseInt( hex.slice( 0, 2 ), 16 ) + ', ' + parseInt( hex.slice( 2, 4 ), 16 ) + ', ' + parseInt( hex.slice( 4, 6 ), 16 ) + ', ' + ( numberInRange( opacity, 0, 100, 0 ) / 100 ) + ')';
	}

	function gradientOverlayBackground( attributes ) {
		const angle = numberInRange( attributes.overlayGradientAngle, 0, 360, 90 );
		const startPosition = numberInRange( attributes.overlayGradientStartPosition, 0, 100, 0 );
		const endPosition = Math.max( startPosition, numberInRange( attributes.overlayGradientEndPosition, 0, 100, 70 ) );
		const startColor = hexToRgba( attributes.overlayGradientStartColor || '#ffffff', attributes.overlayGradientStartOpacity );
		const endColor = hexToRgba( attributes.overlayGradientEndColor || '#ffffff', attributes.overlayGradientEndOpacity );

		return 'linear-gradient(' + angle + 'deg, ' + startColor + ' ' + startPosition + '%, ' + endColor + ' ' + endPosition + '%)';
	}

	function gradientPresetAttributes( preset ) {
		const presets = {
			'left-light': { overlayGradientStartColor: '#ffffff', overlayGradientStartOpacity: 92, overlayGradientStartPosition: 0, overlayGradientEndColor: '#ffffff', overlayGradientEndOpacity: 0, overlayGradientEndPosition: 72, overlayGradientAngle: 90 },
			'right-light': { overlayGradientStartColor: '#ffffff', overlayGradientStartOpacity: 0, overlayGradientStartPosition: 28, overlayGradientEndColor: '#ffffff', overlayGradientEndOpacity: 92, overlayGradientEndPosition: 100, overlayGradientAngle: 90 },
			'top-light': { overlayGradientStartColor: '#ffffff', overlayGradientStartOpacity: 92, overlayGradientStartPosition: 0, overlayGradientEndColor: '#ffffff', overlayGradientEndOpacity: 0, overlayGradientEndPosition: 72, overlayGradientAngle: 180 },
			'bottom-light': { overlayGradientStartColor: '#ffffff', overlayGradientStartOpacity: 0, overlayGradientStartPosition: 28, overlayGradientEndColor: '#ffffff', overlayGradientEndOpacity: 92, overlayGradientEndPosition: 100, overlayGradientAngle: 180 },
			'left-dark': { overlayGradientStartColor: '#000000', overlayGradientStartOpacity: 72, overlayGradientStartPosition: 0, overlayGradientEndColor: '#000000', overlayGradientEndOpacity: 0, overlayGradientEndPosition: 72, overlayGradientAngle: 90 },
		};

		return presets[ preset ] || null;
	}

	function getOuterStyle( attributes ) {
		const desktopImage = cssUrl( attributes.backgroundImageUrl );
		const tabletImage = attributes.tabletBackgroundImageUrl
			? cssUrl( attributes.tabletBackgroundImageUrl )
			: desktopImage;
		const mobileImage = attributes.mobileBackgroundImageUrl
			? cssUrl( attributes.mobileBackgroundImageUrl )
			: tabletImage;

		const diagonalBackground = hasDiagonalBackground( attributes );
		const isGradientOverlay = attributes.overlayType === 'gradient';
		const style = {
			'--cni-outer-background-color': attributes.backgroundColor || 'transparent',
			'--cni-outer-background-image': diagonalBackground ? diagonalBackgroundImage( attributes ) : desktopImage,
			'--cni-outer-mobile-background-image': diagonalBackground ? diagonalBackgroundImage( attributes ) : mobileImage,
			'--cni-outer-background-position': attributes.backgroundPosition || 'center center',
			'--cni-outer-overlay-color': attributes.overlayColor || '#000000',
			'--cni-outer-overlay-opacity': typeof attributes.overlayOpacity === 'number' ? attributes.overlayOpacity / 100 : 0,
			'--cni-outer-content-width': attributes.contentWidth > 0 ? px( attributes.contentWidth ) : '100%',
			'--cni-outer-padding-v-pc': px( attributes.paddingVerticalPc ),
			'--cni-outer-padding-h-pc': px( attributes.paddingHorizontalPc ),
			'--cni-outer-padding-v-tablet': px( attributes.paddingVerticalTablet ),
			'--cni-outer-padding-h-tablet': px( attributes.paddingHorizontalTablet ),
			'--cni-outer-padding-v-mobile': px( attributes.paddingVerticalMobile ),
			'--cni-outer-padding-h-mobile': px( attributes.paddingHorizontalMobile ),
			'--cni-outer-border-width': px( attributes.borderWidth ),
			'--cni-outer-border-color': attributes.borderColor || '#dddddd',
			'--cni-outer-border-radius': px( attributes.borderRadius ),
		};
		if ( isGradientOverlay ) {
			style['--cni-outer-overlay-background'] = gradientOverlayBackground( attributes );
			style['--cni-outer-overlay-opacity'] = 1;
		} else if ( attributes.overlayType === 'none' ) {
			style['--cni-outer-overlay-opacity'] = 0;
		}

		if ( attributes.backgroundDisplay === 'cover-fixed' && ! diagonalBackground ) {
			style['--cni-outer-background-attachment'] = 'fixed';
		}
		if ( diagonalBackground ) {
			style['--cni-outer-tablet-background-image'] = diagonalBackgroundImage( attributes );
		} else if ( attributes.tabletBackgroundImageUrl ) {
			style['--cni-outer-tablet-background-image'] = tabletImage;
		}
		if ( attributes.backgroundFocalPointPc ) {
			style['--cni-outer-background-position-pc'] = attributes.backgroundFocalPointPc;
		}
		if ( attributes.backgroundFocalPointTablet ) {
			style['--cni-outer-background-position-tablet'] = attributes.backgroundFocalPointTablet;
		}
		if ( attributes.backgroundFocalPointMobile ) {
			style['--cni-outer-background-position-mobile'] = attributes.backgroundFocalPointMobile;
		}
		const offsetX = numberInRange( attributes.backgroundOffsetX, -500, 500, 0 );
		const offsetY = numberInRange( attributes.backgroundOffsetY, -500, 500, 0 );
		if ( ! diagonalBackground && ( offsetX !== 0 || offsetY !== 0 ) ) {
			style['--cni-outer-background-position-pc'] = backgroundPositionWithOffset(
				attributes.backgroundFocalPointPc || attributes.backgroundPosition,
				offsetX,
				offsetY
			);
			style['--cni-outer-background-position-tablet'] = backgroundPositionWithOffset(
				attributes.backgroundFocalPointTablet || attributes.backgroundPosition,
				offsetX,
				offsetY
			);
			if ( ! attributes.disableBackgroundOffsetOnMobile ) {
				style['--cni-outer-background-position-mobile'] = backgroundPositionWithOffset(
					attributes.backgroundFocalPointMobile || attributes.backgroundPosition,
					offsetX,
					offsetY
				);
			}
		}
		if ( attributes.minHeightPc > 0 ) {
			style['--cni-outer-min-height-pc'] = px( attributes.minHeightPc );
		}
		if ( attributes.minHeightTablet > 0 ) {
			style['--cni-outer-min-height-tablet'] = px( attributes.minHeightTablet );
		}
		if ( attributes.minHeightMobile > 0 ) {
			style['--cni-outer-min-height-mobile'] = px( attributes.minHeightMobile );
		}
		if ( attributes.borderStyle === 'dotted' || attributes.borderStyle === 'dashed' ) {
			style['--cni-outer-border-style'] = attributes.borderStyle;
		}
		if ( attributes.creativeBackgroundEffect === 'zoom' && ! diagonalBackground && attributes.backgroundImageUrl ) {
			style['--cni-outer-creative-background-image'] = desktopImage;
			style['--cni-outer-creative-tablet-background-image'] = tabletImage;
			style['--cni-outer-creative-mobile-background-image'] = mobileImage;
		}
		if ( attributes.creativeFrameEffect === 'draw' ) {
			style['--cni-outer-creative-frame-color'] = attributes.creativeFrameColor || '#ffffff';
		}

		return style;
	}

	function hasOutwardDivider( attributes ) {
		return [ 'top', 'bottom' ].some( function( prefix ) {
			const type = normalizeDividerType( attributes[ prefix + 'DividerType' ] );
			const supportsDirection = type === 'triangle-flex' || type === 'curve-flex' || type === 'zigzag';
			return supportsDirection && attributes[ prefix + 'DividerDirection' ] === 'outward';
		} );
	}

	function imageControl( label, imageId, imageUrl, onSelect, onRemove ) {
		return el(
			'div',
			{ className: 'cni-outer-image-control' },
			el( 'p', { className: 'cni-outer-image-control__label' }, label ),
			imageUrl
				? el( 'img', { className: 'cni-outer-image-control__preview', src: imageUrl, alt: '' } )
				: null,
			el(
				'div',
				{ className: 'cni-outer-image-control__actions' },
				el(
					MediaUploadCheck,
					null,
					el( MediaUpload, {
						onSelect: onSelect,
						allowedTypes: [ 'image' ],
						multiple: false,
						value: imageId || 0,
						render: function( obj ) {
							return el(
								Button,
								{ variant: 'secondary', onClick: obj.open },
								imageUrl ? __( '画像を変更', 'cni-blocks' ) : __( '画像を選択', 'cni-blocks' )
							);
						},
					} )
				),
				imageUrl
					? el( Button, { variant: 'tertiary', isDestructive: true, onClick: onRemove }, __( '削除', 'cni-blocks' ) )
					: null
			)
		);
	}

	function videoControl( videoId, videoUrl, onSelect, onRemove ) {
		return el(
			'div',
			{ className: 'cni-outer-image-control' },
			el( 'p', { className: 'cni-outer-image-control__label' }, __( '背景動画', 'cni-blocks' ) ),
			videoUrl
				? el( 'video', { className: 'cni-outer-image-control__preview', src: videoUrl, muted: true, controls: true, playsInline: true } )
				: null,
			el( 'p', { className: 'cni-outer-control-help' }, __( '動画未再生時と低モーション設定時には、PC背景画像を静止画として表示します。音声は再生されません。', 'cni-blocks' ) ),
			el(
				'div',
				{ className: 'cni-outer-image-control__actions' },
				el(
					MediaUploadCheck,
					null,
					el( MediaUpload, {
						onSelect: onSelect,
						allowedTypes: [ 'video' ],
						multiple: false,
						value: videoId || 0,
						render: function( obj ) {
							return el(
								Button,
								{ variant: 'secondary', onClick: obj.open },
								videoUrl ? __( '動画を変更', 'cni-blocks' ) : __( '動画を選択', 'cni-blocks' )
							);
						},
					} )
				),
				videoUrl
					? el( Button, { variant: 'tertiary', isDestructive: true, onClick: onRemove }, __( '削除', 'cni-blocks' ) )
					: null
			)
		);
	}

	function backgroundVideoElement( attributes, isEditor ) {
		if ( hasDiagonalBackground( attributes ) || ! attributes.backgroundVideoUrl ) return null;

		return el( 'video', {
			className: 'cni-outer__background-video',
			src: attributes.backgroundVideoUrl,
			poster: attributes.backgroundImageUrl || undefined,
			muted: true,
			loop: true,
			playsInline: true,
			preload: 'metadata',
			'aria-hidden': 'true',
			autoPlay: !! isEditor,
		} );
	}

	function hasCreativeImageZoom( attributes ) {
		return attributes.creativeBackgroundEffect === 'zoom' && ! hasDiagonalBackground( attributes ) && !! attributes.backgroundImageUrl;
	}

	function outerClassName( attributes ) {
		const classes = [];
		if ( hasOutwardDivider( attributes ) ) classes.push( 'cni-outer--has-outward-divider' );
		if ( hasCreativeImageZoom( attributes ) ) classes.push( 'cni-outer--creative-background-zoom' );
		if ( attributes.creativeFrameEffect === 'draw' ) classes.push( 'cni-outer--creative-frame-draw' );
		if ( attributes.creativeContentEffect === 'lift' ) classes.push( 'cni-outer--creative-content-lift' );
		return classes.join( ' ' );
	}

	function creativeBackgroundElement( attributes ) {
		if ( ! hasCreativeImageZoom( attributes ) ) return null;
		return el(
			'div',
			{ className: 'cni-outer__creative-background-clip', 'aria-hidden': 'true' },
			el( 'div', { className: 'cni-outer__creative-background' } )
		);
	}

	function creativeFrameElement( attributes ) {
		if ( attributes.creativeFrameEffect !== 'draw' ) return null;
		return el(
			'div',
			{ className: 'cni-outer__creative-frame', 'aria-hidden': 'true' },
			el( 'span', { className: 'cni-outer__creative-frame-line cni-outer__creative-frame-line--top' } ),
			el( 'span', { className: 'cni-outer__creative-frame-line cni-outer__creative-frame-line--right' } ),
			el( 'span', { className: 'cni-outer__creative-frame-line cni-outer__creative-frame-line--bottom' } ),
			el( 'span', { className: 'cni-outer__creative-frame-line cni-outer__creative-frame-line--left' } )
		);
	}

	function focalPointControl( label, imageUrl, value, onChange ) {
		if ( ! imageUrl ) return null;
		const enabled = !!value;

		return el(
			'div',
			{ className: 'cni-outer-focal-point-control' },
			el( ToggleControl, {
				label: label,
				checked: enabled,
				onChange: function( checked ) { onChange( checked ? '50% 50%' : '' ); },
			} ),
			enabled ? el( FocalPointPicker, {
				url: imageUrl,
				value: focalPointFromCss( value ),
				onChange: function( point ) { onChange( focalPointToCss( point ) ); },
			} ) : null
		);
	}

	blocks.registerBlockType( 'cni-blocks/outer', {
		apiVersion: 3,
		title: __( 'Outer+', 'cni-blocks' ),
		description: __( '背景や余白、内側幅を設定し、中に自由なブロックを配置できるセクション。', 'cni-blocks' ),
		icon: 'align-wide',
		category: 'cni-blocks',
		variations: [
			{
				name: 'outer-default',
				title: __( 'Outer+', 'cni-blocks' ),
				isDefault: true,
				scope: [ 'inserter' ],
				attributes: {
					align: 'full',
					backgroundColor: '#f5f5f5',
					paddingVerticalPc: 64,
					paddingHorizontalPc: 24,
					paddingVerticalTablet: 48,
					paddingHorizontalTablet: 24,
					paddingVerticalMobile: 32,
					paddingHorizontalMobile: 16,
				},
			},
		],
		attributes: {
			tagName: { type: 'string', default: 'div' },
			backgroundColor: { type: 'string', default: '' },
			backgroundType: { type: 'string', default: 'solid' },
			diagonalAccentColor: { type: 'string', default: '#1e73be' },
			diagonalDirection: { type: 'string', default: 'down-right' },
			diagonalAngle: { type: 'number', default: -1 },
			diagonalSplitPosition: { type: 'number', default: 50 },
			backgroundImageId: { type: 'number', default: 0 },
			backgroundImageUrl: { type: 'string', default: '' },
			backgroundVideoId: { type: 'number', default: 0 },
			backgroundVideoUrl: { type: 'string', default: '' },
			isHero: { type: 'boolean', default: false },
			tabletBackgroundImageId: { type: 'number', default: 0 },
			tabletBackgroundImageUrl: { type: 'string', default: '' },
			mobileBackgroundImageId: { type: 'number', default: 0 },
			mobileBackgroundImageUrl: { type: 'string', default: '' },
			backgroundPosition: { type: 'string', default: 'center center' },
			backgroundFocalPointPc: { type: 'string', default: '' },
			backgroundFocalPointTablet: { type: 'string', default: '' },
			backgroundFocalPointMobile: { type: 'string', default: '' },
			backgroundDisplay: { type: 'string', default: 'cover' },
			backgroundOffsetX: { type: 'number', default: 0 },
			backgroundOffsetY: { type: 'number', default: 0 },
			disableBackgroundOffsetOnMobile: { type: 'boolean', default: true },
			overlayColor: { type: 'string', default: '#000000' },
			overlayOpacity: { type: 'number', default: 0 },
			overlayType: { type: 'string', default: 'solid' },
			overlayGradientPreset: { type: 'string', default: 'custom' },
			overlayGradientStartColor: { type: 'string', default: '#ffffff' },
			overlayGradientEndColor: { type: 'string', default: '#ffffff' },
			overlayGradientStartOpacity: { type: 'number', default: 90 },
			overlayGradientEndOpacity: { type: 'number', default: 0 },
			overlayGradientStartPosition: { type: 'number', default: 0 },
			overlayGradientEndPosition: { type: 'number', default: 70 },
			overlayGradientAngle: { type: 'number', default: 90 },
			contentWidth: { type: 'number', default: 0 },
			minHeightPc: { type: 'number', default: 0 },
			minHeightTablet: { type: 'number', default: 0 },
			minHeightMobile: { type: 'number', default: 0 },
			paddingVerticalPc: { type: 'number', default: 0 },
			paddingHorizontalPc: { type: 'number', default: 0 },
			paddingVerticalTablet: { type: 'number', default: 0 },
			paddingHorizontalTablet: { type: 'number', default: 0 },
			paddingVerticalMobile: { type: 'number', default: 0 },
			paddingHorizontalMobile: { type: 'number', default: 0 },
			borderStyle: { type: 'string', default: 'solid' },
			borderWidth: { type: 'number', default: 0 },
			borderColor: { type: 'string', default: '#dddddd' },
			borderRadius: { type: 'number', default: 0 },
			creativeBackgroundEffect: { type: 'string', default: 'none' },
			creativeFrameEffect: { type: 'string', default: 'none' },
			creativeFrameColor: { type: 'string', default: '#ffffff' },
			creativeContentEffect: { type: 'string', default: 'none' },
			topDividerType: { type: 'string', default: 'none' },
			topDividerColor: { type: 'string', default: '#ffffff' },
			topDividerHeight: { type: 'number', default: 80 },
			topDividerFlip: { type: 'boolean', default: false },
			topDividerCloudDensity: { type: 'number', default: 2 },
			topDividerDirection: { type: 'string', default: 'inward' },
			topDividerShapeWidth: { type: 'number', default: 100 },
			topDividerZigzagCount: { type: 'number', default: 6 },
			bottomDividerType: { type: 'string', default: 'none' },
			bottomDividerColor: { type: 'string', default: '#ffffff' },
			bottomDividerHeight: { type: 'number', default: 80 },
			bottomDividerFlip: { type: 'boolean', default: false },
			bottomDividerCloudDensity: { type: 'number', default: 2 },
			bottomDividerDirection: { type: 'string', default: 'inward' },
			bottomDividerShapeWidth: { type: 'number', default: 100 },
			bottomDividerZigzagCount: { type: 'number', default: 6 },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			color: {
				text: true,
				background: false,
				link: false,
			},
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const diagonalBackground = hasDiagonalBackground( attributes );
			const settingsPalette = useSettings( 'color.palette' )[ 0 ];
			const colorPalette = Array.isArray( settingsPalette ) && settingsPalette.length ? settingsPalette : undefined;
			const TagName = attributes.tagName === 'section' ? 'section' : 'div';
			const pcBackgroundImageUrl = attributes.backgroundImageUrl || '';
			const tabletBackgroundImageUrl = attributes.tabletBackgroundImageUrl || pcBackgroundImageUrl;
			const mobileBackgroundImageUrl = attributes.mobileBackgroundImageUrl || tabletBackgroundImageUrl;
			const hasBackgroundMedia = !! ( pcBackgroundImageUrl || tabletBackgroundImageUrl || mobileBackgroundImageUrl || attributes.backgroundVideoUrl );
			const selectedBorderStyle = attributes.borderStyle === 'dotted' || attributes.borderStyle === 'dashed'
				? attributes.borderStyle
				: 'solid';
			const borderType = attributes.borderWidth > 0 ? selectedBorderStyle : 'none';
			const blockProps = useBlockProps( {
				style: getOuterStyle( attributes ),
				className: outerClassName( attributes ),
			} );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
					PanelBody,
					{ title: __( '背景', 'cni-blocks' ), initialOpen: true },
					el( SelectControl, {
						label: __( '背景タイプ', 'cni-blocks' ),
						value: diagonalBackground ? 'diagonal' : 'solid',
						options: [
							{ label: __( '通常背景', 'cni-blocks' ), value: 'solid' },
							{ label: __( '白＋カラーの斜め背景', 'cni-blocks' ), value: 'diagonal' },
						],
						onChange: function( value ) { setAttributes( { backgroundType: value === 'diagonal' ? 'diagonal' : 'solid' } ); },
					} ),
					diagonalBackground
						? el(
							element.Fragment,
							null,
							el( 'p', null, __( '斜め背景のカラー', 'cni-blocks' ) ),
							el( ColorPalette, {
								colors: colorPalette,
								value: attributes.diagonalAccentColor || '#1e73be',
								onChange: function( value ) { setAttributes( { diagonalAccentColor: value || '#1e73be' } ); },
								clearable: false,
							} ),
							el( RangeControl, {
								label: __( '斜めの角度（°）', 'cni-blocks' ),
								value: diagonalAngle( attributes ),
								min: 0,
								max: 360,
								step: 5,
								help: __( '135°で左上から右下へ分かれます。', 'cni-blocks' ),
								onChange: function( value ) { setAttributes( { diagonalAngle: typeof value === 'number' ? value : 135 } ); },
							} ),
							el( RangeControl, {
								label: __( '色の分割位置（%）', 'cni-blocks' ),
								value: numberInRange( attributes.diagonalSplitPosition, 10, 90, 50 ),
								min: 10,
								max: 90,
								help: __( '小さいほど選択カラーの領域が狭くなります。', 'cni-blocks' ),
								onChange: function( value ) { setAttributes( { diagonalSplitPosition: numberInRange( value, 10, 90, 50 ) } ); },
							} ),
							el( 'p', { className: 'cni-outer-control-help' }, __( '斜め背景では画像・動画は表示されません。通常背景へ戻すと、設定済みの画像・動画を再び使用できます。オーバーレイは斜め背景にも適用されます。', 'cni-blocks' ) )
						)
						: el(
							element.Fragment,
							null,
							el( 'p', null, __( '背景色', 'cni-blocks' ) ),
							el( ColorPalette, {
								colors: colorPalette,
								value: attributes.backgroundColor || '',
								onChange: function( value ) { setAttributes( { backgroundColor: value || '' } ); },
								clearable: true,
							} )
						),
						imageControl(
							__( 'PC背景画像', 'cni-blocks' ),
							attributes.backgroundImageId,
							attributes.backgroundImageUrl,
							function( media ) {
								setAttributes( {
									backgroundImageId: media && media.id ? media.id : 0,
									backgroundImageUrl: media && media.url ? media.url : '',
								} );
							},
							function() { setAttributes( { backgroundImageId: 0, backgroundImageUrl: '' } ); }
						),
						videoControl(
							attributes.backgroundVideoId,
							attributes.backgroundVideoUrl,
							function( media ) {
								setAttributes( {
									backgroundVideoId: media && media.id ? media.id : 0,
									backgroundVideoUrl: media && media.url ? media.url : '',
								} );
							},
							function() { setAttributes( { backgroundVideoId: 0, backgroundVideoUrl: '' } ); }
						),
						el( ToggleControl, {
							label: __( 'ヒーローエリアとして使用する', 'cni-blocks' ),
							checked: attributes.isHero === true,
							help: __( 'ファーストビューで使用する背景画像を優先的に読み込みます。トップページのヒーローエリアなどで使用してください。背景画像に近い背景色を設定すると、画像読み込み前の表示が自然になります。', 'cni-blocks' ),
							onChange: function( value ) { setAttributes( { isHero: !! value } ); },
						} ),
						imageControl(
							__( 'タブレット背景画像（未設定時はPC画像）', 'cni-blocks' ),
							attributes.tabletBackgroundImageId,
							attributes.tabletBackgroundImageUrl,
							function( media ) {
								setAttributes( {
									tabletBackgroundImageId: media && media.id ? media.id : 0,
									tabletBackgroundImageUrl: media && media.url ? media.url : '',
								} );
							},
							function() { setAttributes( { tabletBackgroundImageId: 0, tabletBackgroundImageUrl: '' } ); }
						),
						imageControl(
							__( 'モバイル背景画像（未設定時はタブレット／PC画像）', 'cni-blocks' ),
							attributes.mobileBackgroundImageId,
							attributes.mobileBackgroundImageUrl,
							function( media ) {
								setAttributes( {
									mobileBackgroundImageId: media && media.id ? media.id : 0,
									mobileBackgroundImageUrl: media && media.url ? media.url : '',
								} );
							},
							function() { setAttributes( { mobileBackgroundImageId: 0, mobileBackgroundImageUrl: '' } ); }
						),
						el( SelectControl, {
							label: __( '背景画像の位置', 'cni-blocks' ),
							value: attributes.backgroundPosition || 'center center',
							options: [
								{ label: __( '左上', 'cni-blocks' ), value: 'left top' },
								{ label: __( '中央上', 'cni-blocks' ), value: 'center top' },
								{ label: __( '右上', 'cni-blocks' ), value: 'right top' },
								{ label: __( '左中央', 'cni-blocks' ), value: 'left center' },
								{ label: __( '中央', 'cni-blocks' ), value: 'center center' },
								{ label: __( '右中央', 'cni-blocks' ), value: 'right center' },
								{ label: __( '左下', 'cni-blocks' ), value: 'left bottom' },
								{ label: __( '中央下', 'cni-blocks' ), value: 'center bottom' },
								{ label: __( '右下', 'cni-blocks' ), value: 'right bottom' },
							],
							onChange: function( value ) { setAttributes( { backgroundPosition: value || 'center center' } ); },
						} ),
						pcBackgroundImageUrl || tabletBackgroundImageUrl || mobileBackgroundImageUrl
							? el( 'p', { className: 'cni-outer-control-help' }, __( 'フォーカルポイントを有効にした端末では、上の背景位置よりフォーカルポイントが優先されます。', 'cni-blocks' ) )
							: null,
						focalPointControl(
							__( 'フォーカルポイントを使用（PC）', 'cni-blocks' ),
							pcBackgroundImageUrl,
							attributes.backgroundFocalPointPc,
							function( value ) { setAttributes( { backgroundFocalPointPc: value } ); }
						),
						focalPointControl(
							__( 'フォーカルポイントを使用（タブレット）', 'cni-blocks' ),
							tabletBackgroundImageUrl,
							attributes.backgroundFocalPointTablet,
							function( value ) { setAttributes( { backgroundFocalPointTablet: value } ); }
						),
						focalPointControl(
							__( 'フォーカルポイントを使用（モバイル）', 'cni-blocks' ),
							mobileBackgroundImageUrl,
							attributes.backgroundFocalPointMobile,
							function( value ) { setAttributes( { backgroundFocalPointMobile: value } ); }
						),
						el( SelectControl, {
							label: __( '背景画像の表示', 'cni-blocks' ),
							value: attributes.backgroundDisplay || 'cover',
							options: [
								{ label: __( 'カバー', 'cni-blocks' ), value: 'cover' },
								{ label: __( 'カバー固定（PC・タブレット）', 'cni-blocks' ), value: 'cover-fixed' },
							],
								help: __( 'カバー固定は背景を画面に固定します。モバイルでは表示の安定性を優先して通常のカバーになります。', 'cni-blocks' ),
								onChange: function( value ) { setAttributes( { backgroundDisplay: value === 'cover-fixed' ? 'cover-fixed' : 'cover' } ); },
							} ),
						! diagonalBackground && hasBackgroundMedia ? el(
							element.Fragment,
							null,
							el( 'h3', null, __( '背景オフセット', 'cni-blocks' ) ),
							el( 'p', { className: 'cni-outer-control-help' }, __( '背景画像・動画の見せる位置を、現在の背景位置またはフォーカルポイントから相対的に調整します。', 'cni-blocks' ) ),
							el( RangeControl, {
								label: __( '水平方向（px：左マイナス／右プラス）', 'cni-blocks' ),
								value: numberInRange( attributes.backgroundOffsetX, -500, 500, 0 ),
								min: -500,
								max: 500,
								onChange: function( value ) { setAttributes( { backgroundOffsetX: typeof value === 'number' ? value : 0 } ); },
							} ),
							el( RangeControl, {
								label: __( '垂直方向（px：上マイナス／下プラス）', 'cni-blocks' ),
								value: numberInRange( attributes.backgroundOffsetY, -500, 500, 0 ),
								min: -500,
								max: 500,
								onChange: function( value ) { setAttributes( { backgroundOffsetY: typeof value === 'number' ? value : 0 } ); },
							} ),
							el( ToggleControl, {
								label: __( 'モバイルではオフセットを無効にする', 'cni-blocks' ),
								checked: attributes.disableBackgroundOffsetOnMobile !== false,
								onChange: function( value ) { setAttributes( { disableBackgroundOffsetOnMobile: !! value } ); },
							} )
						) : null,
						el( SelectControl, {
							label: __( 'オーバーレイ', 'cni-blocks' ),
							value: attributes.overlayType === 'none' || attributes.overlayType === 'gradient' ? attributes.overlayType : 'solid',
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( '単色', 'cni-blocks' ), value: 'solid' },
								{ label: __( 'グラデーション', 'cni-blocks' ), value: 'gradient' },
							],
							onChange: function( value ) { setAttributes( { overlayType: value === 'gradient' || value === 'none' ? value : 'solid' } ); },
						} ),
						attributes.overlayType !== 'none' && attributes.overlayType !== 'gradient'
							? el(
								element.Fragment,
								null,
								el( 'p', null, __( 'オーバーレイ色', 'cni-blocks' ) ),
								el( ColorPalette, {
									colors: colorPalette,
									value: attributes.overlayColor || '#000000',
									onChange: function( value ) { setAttributes( { overlayColor: value || '#000000' } ); },
									clearable: false,
								} ),
								el( RangeControl, {
									label: __( 'オーバーレイ透明度（%）', 'cni-blocks' ),
									value: attributes.overlayOpacity || 0,
									min: 0,
									max: 100,
									onChange: function( value ) { setAttributes( { overlayOpacity: typeof value === 'number' ? value : 0 } ); },
								} )
							) : null,
						attributes.overlayType === 'gradient'
							? el(
								element.Fragment,
								null,
								el( SelectControl, {
									label: __( 'グラデーションプリセット', 'cni-blocks' ),
									value: attributes.overlayGradientPreset || 'custom',
									options: [
										{ label: __( 'カスタム', 'cni-blocks' ), value: 'custom' },
										{ label: __( '左を明るく（文字を載せやすい）', 'cni-blocks' ), value: 'left-light' },
										{ label: __( '右を明るく（文字を載せやすい）', 'cni-blocks' ), value: 'right-light' },
										{ label: __( '上を明るく', 'cni-blocks' ), value: 'top-light' },
										{ label: __( '下を明るく', 'cni-blocks' ), value: 'bottom-light' },
										{ label: __( '左を暗く（白文字向け）', 'cni-blocks' ), value: 'left-dark' },
									],
									onChange: function( value ) {
										const preset = gradientPresetAttributes( value );
										setAttributes( Object.assign( { overlayGradientPreset: value || 'custom' }, preset || {} ) );
									},
								} ),
								el( 'p', null, __( '開始色', 'cni-blocks' ) ),
								el( ColorPalette, {
									colors: colorPalette,
									value: attributes.overlayGradientStartColor || '#ffffff',
									onChange: function( value ) { setAttributes( { overlayGradientPreset: 'custom', overlayGradientStartColor: value || '#ffffff' } ); },
									clearable: false,
								} ),
								el( RangeControl, {
									label: __( '開始色の不透明度（%）', 'cni-blocks' ),
									value: numberInRange( attributes.overlayGradientStartOpacity, 0, 100, 90 ), min: 0, max: 100,
									onChange: function( value ) { setAttributes( { overlayGradientPreset: 'custom', overlayGradientStartOpacity: numberInRange( value, 0, 100, 90 ) } ); },
								} ),
								el( RangeControl, {
									label: __( '開始位置（%）', 'cni-blocks' ),
									value: numberInRange( attributes.overlayGradientStartPosition, 0, 100, 0 ), min: 0, max: 100,
									onChange: function( value ) { setAttributes( { overlayGradientPreset: 'custom', overlayGradientStartPosition: numberInRange( value, 0, 100, 0 ) } ); },
								} ),
								el( 'p', null, __( '終了色', 'cni-blocks' ) ),
								el( ColorPalette, {
									colors: colorPalette,
									value: attributes.overlayGradientEndColor || '#ffffff',
									onChange: function( value ) { setAttributes( { overlayGradientPreset: 'custom', overlayGradientEndColor: value || '#ffffff' } ); },
									clearable: false,
								} ),
								el( RangeControl, {
									label: __( '終了色の不透明度（%）', 'cni-blocks' ),
									value: numberInRange( attributes.overlayGradientEndOpacity, 0, 100, 0 ), min: 0, max: 100,
									onChange: function( value ) { setAttributes( { overlayGradientPreset: 'custom', overlayGradientEndOpacity: numberInRange( value, 0, 100, 0 ) } ); },
								} ),
								el( RangeControl, {
									label: __( '終了位置（%）', 'cni-blocks' ),
									value: numberInRange( attributes.overlayGradientEndPosition, 0, 100, 70 ), min: 0, max: 100,
									onChange: function( value ) { setAttributes( { overlayGradientPreset: 'custom', overlayGradientEndPosition: numberInRange( value, 0, 100, 70 ) } ); },
								} ),
								el( RangeControl, {
									label: __( '角度（°：90で左から右）', 'cni-blocks' ),
									value: numberInRange( attributes.overlayGradientAngle, 0, 360, 90 ), min: 0, max: 360,
									onChange: function( value ) { setAttributes( { overlayGradientPreset: 'custom', overlayGradientAngle: numberInRange( value, 0, 360, 90 ) } ); },
								} )
							) : null
					),
					el(
						PanelBody,
						{ title: __( 'マウスオーバー演出', 'cni-blocks' ), initialOpen: false },
						el( 'p', { className: 'cni-outer-control-help' }, __( 'PCではホバー、キーボード操作ではフォーカス時に表示します。モバイルと「動きを減らす」設定では通常表示のままです。', 'cni-blocks' ) ),
						el( SelectControl, {
							label: __( '背景演出', 'cni-blocks' ),
							value: attributes.creativeBackgroundEffect || 'none',
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( '背景をゆっくり拡大', 'cni-blocks' ), value: 'zoom' },
							],
							help: pcBackgroundImageUrl ? __( 'PC背景画像に適用されます。動画背景と斜め背景は通常表示のままです。', 'cni-blocks' ) : __( 'PC背景画像を設定すると適用されます。動画背景と斜め背景は通常表示のままです。', 'cni-blocks' ),
							onChange: function( value ) { setAttributes( { creativeBackgroundEffect: value === 'zoom' ? 'zoom' : 'none' } ); },
						} ),
						el( SelectControl, {
							label: __( 'フレーム演出', 'cni-blocks' ),
							value: attributes.creativeFrameEffect || 'none',
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( 'フレームを順に描画', 'cni-blocks' ), value: 'draw' },
							],
							onChange: function( value ) { setAttributes( { creativeFrameEffect: value === 'draw' ? 'draw' : 'none' } ); },
						} ),
						attributes.creativeFrameEffect === 'draw' ? el( 'p', null, __( 'フレーム色', 'cni-blocks' ) ) : null,
						attributes.creativeFrameEffect === 'draw' ? el( ColorPalette, {
							colors: colorPalette,
							value: attributes.creativeFrameColor || '#ffffff',
							clearable: false,
							onChange: function( value ) { setAttributes( { creativeFrameColor: value || '#ffffff' } ); },
						} ) : null,
						el( SelectControl, {
							label: __( 'コンテンツ演出', 'cni-blocks' ),
							value: attributes.creativeContentEffect || 'none',
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( 'コンテンツを少し浮かせる', 'cni-blocks' ), value: 'lift' },
							],
							onChange: function( value ) { setAttributes( { creativeContentEffect: value === 'lift' ? 'lift' : 'none' } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( 'レイアウト', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( '内側コンテンツの幅', 'cni-blocks' ),
							value: attributes.contentWidth > 0 ? 'limited' : 'full',
							options: [
								{ label: __( '幅制限なし', 'cni-blocks' ), value: 'full' },
								{ label: __( '内側最大幅を指定', 'cni-blocks' ), value: 'limited' },
							],
							help: __( 'Outer+自体の通常幅・幅広・全幅は、ブロック上部の配置ツールから選択します。', 'cni-blocks' ),
							onChange: function( value ) { setAttributes( { contentWidth: value === 'limited' ? ( attributes.contentWidth || 1200 ) : 0 } ); },
						} ),
						attributes.contentWidth > 0 ? el( RangeControl, {
							label: __( '内側コンテンツ最大幅（px）', 'cni-blocks' ),
							value: attributes.contentWidth || 0,
							min: 320,
							max: 1920,
							step: 10,
							onChange: function( value ) { setAttributes( { contentWidth: typeof value === 'number' ? value : 1200 } ); },
						} ) : null,
						el( SelectControl, {
							label: __( 'HTML要素', 'cni-blocks' ),
							value: attributes.tagName || 'div',
							options: [
								{ label: 'div', value: 'div' },
								{ label: 'section', value: 'section' },
							],
							help: __( '意味のある独立したセクションにはsection、それ以外のレイアウト用途にはdivを使用します。', 'cni-blocks' ),
							onChange: function( value ) { setAttributes( { tagName: value === 'section' ? 'section' : 'div' } ); },
						} ),
					),
					el(
						PanelBody,
						{ title: __( '区切り', 'cni-blocks' ), initialOpen: false },
						el( 'p', { className: 'cni-outer-control-help' }, __( '隣接するセクションの背景色を指定すると、自然につながって見えます。', 'cni-blocks' ) ),
						dividerSettingsControl( 'top', attributes, setAttributes, colorPalette ),
						dividerSettingsControl( 'bottom', attributes, setAttributes, colorPalette )
					),
					el(
						PanelBody,
						{ title: __( '内側余白', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'PC 上下余白（px）', 'cni-blocks' ), value: attributes.paddingVerticalPc || 0, min: 0, max: 240, onChange: function( value ) { setAttributes( { paddingVerticalPc: value || 0 } ); } } ),
						el( RangeControl, { label: __( 'PC 左右余白（px）', 'cni-blocks' ), value: attributes.paddingHorizontalPc || 0, min: 0, max: 160, onChange: function( value ) { setAttributes( { paddingHorizontalPc: value || 0 } ); } } ),
						el( RangeControl, { label: __( 'タブレット 上下余白（px）', 'cni-blocks' ), value: attributes.paddingVerticalTablet || 0, min: 0, max: 240, onChange: function( value ) { setAttributes( { paddingVerticalTablet: value || 0 } ); } } ),
						el( RangeControl, { label: __( 'タブレット 左右余白（px）', 'cni-blocks' ), value: attributes.paddingHorizontalTablet || 0, min: 0, max: 160, onChange: function( value ) { setAttributes( { paddingHorizontalTablet: value || 0 } ); } } ),
						el( RangeControl, { label: __( 'モバイル 上下余白（px）', 'cni-blocks' ), value: attributes.paddingVerticalMobile || 0, min: 0, max: 240, onChange: function( value ) { setAttributes( { paddingVerticalMobile: value || 0 } ); } } ),
					el( RangeControl, { label: __( 'モバイル 左右余白（px）', 'cni-blocks' ), value: attributes.paddingHorizontalMobile || 0, min: 0, max: 160, onChange: function( value ) { setAttributes( { paddingHorizontalMobile: value || 0 } ); } } )
					),
					el(
						PanelBody,
						{ title: __( '最小高さ', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, {
							label: __( 'PC 最小高さ（px・0で指定なし）', 'cni-blocks' ),
							value: attributes.minHeightPc || 0,
							min: 0,
							max: 1200,
							step: 10,
							onChange: function( value ) { setAttributes( { minHeightPc: typeof value === 'number' ? value : 0 } ); },
						} ),
						el( RangeControl, {
							label: __( 'タブレット 最小高さ（px・0で指定なし）', 'cni-blocks' ),
							value: attributes.minHeightTablet || 0,
							min: 0,
							max: 1200,
							step: 10,
							onChange: function( value ) { setAttributes( { minHeightTablet: typeof value === 'number' ? value : 0 } ); },
						} ),
						el( RangeControl, {
							label: __( 'モバイル 最小高さ（px・0で指定なし）', 'cni-blocks' ),
							value: attributes.minHeightMobile || 0,
							min: 0,
							max: 1200,
							step: 10,
							onChange: function( value ) { setAttributes( { minHeightMobile: typeof value === 'number' ? value : 0 } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( '枠線・角丸', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( '枠線の種類', 'cni-blocks' ),
							value: borderType,
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( '直線', 'cni-blocks' ), value: 'solid' },
								{ label: __( '点線', 'cni-blocks' ), value: 'dotted' },
								{ label: __( '破線', 'cni-blocks' ), value: 'dashed' },
							],
							onChange: function( value ) {
								if ( value === 'none' ) {
									setAttributes( { borderStyle: 'solid', borderWidth: 0 } );
									return;
								}
								setAttributes( {
									borderStyle: value === 'dotted' || value === 'dashed' ? value : 'solid',
									borderWidth: attributes.borderWidth > 0 ? attributes.borderWidth : 1,
								} );
							},
						} ),
						borderType !== 'none' ? el( RangeControl, {
							label: __( '枠線の太さ（px）', 'cni-blocks' ),
							value: attributes.borderWidth || 1,
							min: 1,
							max: 12,
							onChange: function( value ) { setAttributes( { borderWidth: value || 1 } ); },
						} ) : null,
						borderType !== 'none' ? el( 'p', null, __( '枠線の色', 'cni-blocks' ) ) : null,
						borderType !== 'none' ? el( ColorPalette, {
							colors: colorPalette,
							value: attributes.borderColor || '#dddddd',
							onChange: function( value ) { setAttributes( { borderColor: value || '#dddddd' } ); },
							clearable: false,
						} ) : null,
						el( RangeControl, {
							label: __( '角丸（px）', 'cni-blocks' ),
							value: attributes.borderRadius || 0,
							min: 0,
							max: 80,
							onChange: function( value ) { setAttributes( { borderRadius: value || 0 } ); },
						} )
					)
				),
				el(
					TagName,
					blockProps,
					dividerElement( 'top', attributes ),
					creativeBackgroundElement( attributes ),
					backgroundVideoElement( attributes, true ),
					creativeFrameElement( attributes ),
					el(
						'div',
						{ className: 'cni-outer__inner' },
						el( InnerBlocks, {
							templateLock: false,
							renderAppender: InnerBlocks.ButtonBlockAppender,
						} )
					),
					dividerElement( 'bottom', attributes )
				)
			);
		},
		save: function( props ) {
			const attributes = props.attributes;
			const TagName = attributes.tagName === 'section' ? 'section' : 'div';
			const blockProps = blockEditor.useBlockProps.save( {
				style: getOuterStyle( attributes ),
				className: outerClassName( attributes ),
			} );

			return el(
				TagName,
				blockProps,
				dividerElement( 'top', attributes ),
				creativeBackgroundElement( attributes ),
				backgroundVideoElement( attributes, false ),
				creativeFrameElement( attributes ),
				el(
					'div',
					{ className: 'cni-outer__inner' },
					el( InnerBlocks.Content )
				),
				dividerElement( 'bottom', attributes )
			);
		},
		deprecated: [ {
			save: function( props ) {
				const attributes = props.attributes;
				const TagName = attributes.tagName === 'section' ? 'section' : 'div';
				const blockProps = blockEditor.useBlockProps.save( {
					style: getOuterStyle( attributes ),
					className: hasOutwardDivider( attributes ) ? 'cni-outer--has-outward-divider' : '',
				} );

				return el(
					TagName,
					blockProps,
					dividerElement( 'top', attributes, legacyDividerPath ),
					backgroundVideoElement( attributes, false ),
					el(
						'div',
						{ className: 'cni-outer__inner' },
						el( InnerBlocks.Content )
					),
					dividerElement( 'bottom', attributes, legacyDividerPath )
				);
			},
		} ],
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { InspectorControls, InnerBlocks, useBlockProps, useSettings } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, ToggleControl } = components;
	const DIVIDER_TYPES = [ 'none', 'slope', 'curve-flex', 'wave', 'triangle-flex', 'zigzag', 'cloud', 'torn', 'scallop' ];
	const DEFAULT_POSITIONS = [
		{ x: 14, y: 18, size: 74 }, { x: 86, y: 20, size: 70 }, { x: 52, y: 84, size: 78 }, { x: 16, y: 74, size: 66 }, { x: 84, y: 76, size: 64 },
	];
	const DEFAULT_BOKEH_DOTS = [
		{ x: 9, y: 12, size: 58, opacity: 0.46, shape: 'circle' }, { x: 28, y: 28, size: 30, opacity: 0.38, shape: 'circle' }, { x: 52, y: 10, size: 22, opacity: 0.34, shape: 'circle' }, { x: 78, y: 20, size: 48, opacity: 0.44, shape: 'circle' },
		{ x: 93, y: 48, size: 26, opacity: 0.36, shape: 'circle' }, { x: 12, y: 68, size: 42, opacity: 0.42, shape: 'circle' }, { x: 40, y: 56, size: 18, opacity: 0.30, shape: 'circle' }, { x: 64, y: 72, size: 64, opacity: 0.48, shape: 'circle' },
		{ x: 84, y: 86, size: 32, opacity: 0.34, shape: 'circle' }, { x: 28, y: 92, size: 24, opacity: 0.36, shape: 'circle' }, { x: 50, y: 40, size: 38, opacity: 0.40, shape: 'circle' }, { x: 72, y: 48, size: 16, opacity: 0.30, shape: 'circle' },
		{ x: 4, y: 38, size: 20, opacity: 0.32, shape: 'circle' }, { x: 96, y: 8, size: 18, opacity: 0.30, shape: 'circle' }, { x: 46, y: 86, size: 28, opacity: 0.36, shape: 'circle' }, { x: 94, y: 70, size: 44, opacity: 0.42, shape: 'circle' },
	];
	const COLOR_PRESETS = {
		mist: { baseColor: '#f8fafc', color1: '#bfdbfe', color2: '#ddd6fe', color3: '#fbcfe8', color4: '#fde68a', color5: '#bbf7d0' },
		bloom: { baseColor: '#fffaf5', color1: '#fecdd3', color2: '#fde68a', color3: '#fed7aa', color4: '#ddd6fe', color5: '#bbf7d0' },
		cool: { baseColor: '#f4fbff', color1: '#bae6fd', color2: '#99f6e4', color3: '#c4b5fd', color4: '#d9f99d', color5: '#bfdbfe' },
		warm: { baseColor: '#fffaf2', color1: '#fed7aa', color2: '#fbcfe8', color3: '#fde68a', color4: '#fecaca', color5: '#ddd6fe' },
		mono: { baseColor: '#fafafa', color1: '#e5e7eb', color2: '#cbd5e1', color3: '#f1f5f9', color4: '#d1d5db', color5: '#e2e8f0' },
	};
	const COMPOSITION_PRESETS = {
		center: { horizontalAlign: 'center', verticalAlign: 'center', positionPreset: 'balanced', bokehBalance: 'balanced', centerSpace: 'clear' },
		left: { horizontalAlign: 'left', verticalAlign: 'center', positionPreset: 'right', bokehBalance: 'right', centerSpace: 'normal' },
		right: { horizontalAlign: 'right', verticalAlign: 'center', positionPreset: 'left', bokehBalance: 'left', centerSpace: 'normal' },
		top: { horizontalAlign: 'left', verticalAlign: 'top', positionPreset: 'bottom', bokehBalance: 'bottom', centerSpace: 'normal' },
		surround: { horizontalAlign: 'center', verticalAlign: 'center', positionPreset: 'balanced', bokehBalance: 'balanced', centerSpace: 'clear' },
	};
	const DESIGN_PRESETS = {
		corporate: Object.assign( { backgroundStyle: 'mesh', colorPreset: 'cool', colorCount: 3, intensity: 'soft', blurLevel: 'soft', spotSize: 'normal', contentOverlay: 'none', backgroundMotion: 'none' }, COLOR_PRESETS.cool, COMPOSITION_PRESETS.left ),
		beauty: Object.assign( { backgroundStyle: 'spots', colorPreset: 'bloom', colorCount: 4, intensity: 'normal', blurLevel: 'soft', spotSize: 'large', contentOverlay: 'light', backgroundMotion: 'none' }, COLOR_PRESETS.bloom, COMPOSITION_PRESETS.center ),
		friendly: Object.assign( { backgroundStyle: 'bokeh', baseColor: '#fffdf8', patternColor: '#f59e0b', patternOpacity: 22, patternDensity: 42, bokehShape: 'circle', bokehSize: 'normal', bokehBlur: 'strong', contentOverlay: 'none', backgroundMotion: 'none' }, COMPOSITION_PRESETS.surround ),
		tech: Object.assign( { backgroundStyle: 'soft-polygons', baseColor: '#f7fbff', patternColor: '#38bdf8', patternOpacity: 18, patternDensity: 42, generatedPatternSize: 'large', generatedPatternVariation: 'normal', generatedPatternBalance: 'right', generatedPatternCharacter: 'wide', contentOverlay: 'light', backgroundMotion: 'none' }, COMPOSITION_PRESETS.left ),
		cta: Object.assign( { backgroundStyle: 'spots', colorPreset: 'warm', colorCount: 4, intensity: 'normal', blurLevel: 'soft', spotSize: 'large', contentOverlay: 'light', backgroundMotion: 'color-breathe', motionSpeed: 'verySlow', motionStrength: 'subtle', motionMobile: 'static' }, COLOR_PRESETS.warm, COMPOSITION_PRESETS.center ),
	};
	function clamp( value, min, max ) { return Math.max( min, Math.min( max, value ) ); }
	function numberInRange( value, min, max, fallback ) { return clamp( typeof value === 'number' ? value : fallback, min, max ); }
	function px( value ) { return ( typeof value === 'number' ? value : 0 ) + 'px'; }
	function legacyPaddingY( value ) { return { none: 0, small: 40, standard: 80, large: 120, xlarge: 160 }[ value ] || 80; }
	function legacyPaddingX( value ) { return { none: 0, small: 24, medium: 48, large: 80 }[ value ] || 24; }
	function legacyMinHeight( value ) { return { small: 320, medium: 480, large: 640, viewport: 0 }[ value ] || 0; }
	function legacyBorderRadius( value ) { return { small: 8, medium: 20, large: 40 }[ value ] || 0; }
	function legacyContentWidth( value ) { return { narrow: 800, standard: 1200, wide: 1400, full: 0 }[ value ] || 1200; }
	function layoutValues( attributes ) {
		const useOuterPadding = attributes.useOuterPadding === true;
		const useOuterMinHeight = attributes.useOuterMinHeight === true;
		const useOuterBorder = attributes.useOuterBorder === true;
		const legacyY = legacyPaddingY( attributes.paddingY );
		const legacyX = legacyPaddingX( attributes.paddingX );
		const legacyHeight = legacyMinHeight( attributes.minHeight );
		const useOuterContentWidth = attributes.useOuterContentWidth === true;
		return {
			contentWidth: useOuterContentWidth ? numberInRange( attributes.innerContentWidth, 0, 1920, legacyContentWidth( attributes.contentWidth ) ) : legacyContentWidth( attributes.contentWidth ),
			paddingVerticalPc: useOuterPadding ? numberInRange( attributes.paddingVerticalPc, 0, 240, legacyY ) : legacyY,
			paddingHorizontalPc: useOuterPadding ? numberInRange( attributes.paddingHorizontalPc, 0, 160, legacyX ) : legacyX,
			paddingVerticalTablet: useOuterPadding ? numberInRange( attributes.paddingVerticalTablet, 0, 240, Math.min( legacyY, 72 ) ) : Math.min( legacyY, 72 ),
			paddingHorizontalTablet: useOuterPadding ? numberInRange( attributes.paddingHorizontalTablet, 0, 160, Math.min( legacyX, 24 ) ) : Math.min( legacyX, 24 ),
			paddingVerticalMobile: useOuterPadding ? numberInRange( attributes.paddingVerticalMobile, 0, 240, Math.min( legacyY, 72 ) ) : Math.min( legacyY, 72 ),
			paddingHorizontalMobile: useOuterPadding ? numberInRange( attributes.paddingHorizontalMobile, 0, 160, Math.min( legacyX, 24 ) ) : Math.min( legacyX, 24 ),
			minHeightPc: useOuterMinHeight ? numberInRange( attributes.minHeightPc, 0, 1200, legacyHeight ) : legacyHeight,
			minHeightTablet: useOuterMinHeight ? numberInRange( attributes.minHeightTablet, 0, 1200, 0 ) : ( attributes.minHeight === 'viewport' ? 0 : legacyHeight ),
			minHeightMobile: useOuterMinHeight ? numberInRange( attributes.minHeightMobile, 0, 1200, 0 ) : ( attributes.minHeight === 'viewport' ? 0 : legacyHeight ),
			borderRadius: useOuterBorder ? numberInRange( attributes.outerBorderRadius, 0, 80, 0 ) : legacyBorderRadius( attributes.borderRadius ),
			borderWidth: useOuterBorder ? numberInRange( attributes.borderWidth, 0, 12, 0 ) : 0,
			borderStyle: useOuterBorder && ( attributes.borderStyle === 'dotted' || attributes.borderStyle === 'dashed' ) ? attributes.borderStyle : 'solid',
			borderColor: attributes.borderColor || '#dddddd',
		};
	}
	function normalizeDividerType( value ) { return DIVIDER_TYPES.indexOf( value ) !== -1 ? value : 'none'; }
	function hasOutwardDivider( attributes ) {
		return [ 'top', 'bottom' ].some( function( position ) {
			const prefix = position === 'top' ? 'top' : 'bottom';
			const type = normalizeDividerType( attributes[ prefix + 'DividerType' ] );
			return ( type === 'triangle-flex' || type === 'curve-flex' || type === 'zigzag' ) && attributes[ prefix + 'DividerDirection' ] === 'outward';
		} );
	}
	function dividerPath( type, density, direction, shapeWidth, zigzagCount ) {
		const outward = direction === 'outward';
		const width = numberInRange( shapeWidth, type === 'triangle-flex' ? 5 : 30, 100, type === 'triangle-flex' ? 18 : 100 );
		const half = 600 * width / 100;
		const left = 600 - half;
		const right = 600 + half;
		switch ( normalizeDividerType( type ) ) {
			case 'slope': return 'M0 42 L1200 96 L1200 120 L0 120 Z';
			case 'curve-flex': return outward ? 'M' + left + ' 0 Q600 120 ' + right + ' 0 Z' : 'M0 120 L' + left + ' 120 Q600 0 ' + right + ' 120 L1200 120 Z';
			case 'wave': return 'M0 70 C150 12 300 12 450 70 S750 128 900 70 S1050 12 1200 70 L1200 120 L0 120 Z';
			case 'triangle-flex': return outward ? 'M' + left + ' 0 L600 120 L' + right + ' 0 Z' : 'M0 116 L' + left + ' 116 L600 0 L' + right + ' 116 L1200 116 L1200 120 L0 120 Z';
			case 'zigzag': {
				const count = Math.round( numberInRange( zigzagCount, 3, 30, 6 ) );
				let path = outward ? 'M0 0' : 'M0 92';
				for ( let index = 0; index < count; index += 1 ) {
					const step = 1200 / count;
					path += ' L' + ( ( index + 0.5 ) * step ) + ( outward ? ' 120' : ' 34' );
					path += ' L' + ( ( index + 1 ) * step ) + ( outward ? ' 0' : ' 92' );
				}
				return path + ( outward ? ' Z' : ' L1200 120 L0 120 Z' );
			}
			case 'torn': return 'M0 88 L54 72 L106 84 L158 56 L212 78 L266 62 L322 86 L378 54 L432 76 L486 60 L542 84 L600 52 L656 78 L710 58 L766 86 L822 56 L878 76 L934 60 L990 84 L1046 54 L1102 78 L1154 64 L1200 82 L1200 120 L0 120 Z';
			case 'scallop': return 'M0 92 Q60 18 120 92 Q180 18 240 92 Q300 18 360 92 Q420 18 480 92 Q540 18 600 92 Q660 18 720 92 Q780 18 840 92 Q900 18 960 92 Q1020 18 1080 92 Q1140 18 1200 92 L1200 120 L0 120 Z';
			default: return '';
		}
	}
	function cloudElements( density ) {
		const count = numberInRange( density, 1, 3, 2 ) === 3 ? 18 : ( numberInRange( density, 1, 3, 2 ) === 1 ? 9 : 13 );
		const clouds = [ el( 'rect', { key: 'base', x: 0, y: 94, width: 1200, height: 26 } ) ];
		for ( let index = 0; index < count; index += 1 ) {
			const step = 1200 / count;
			clouds.push( el( 'ellipse', { key: 'cloud-' + index, cx: index * step + step / 2, cy: 91 - ( index % 3 ) * 10, rx: step * 0.72, ry: 24 + ( index % 2 ) * 12 } ) );
		}
		return clouds;
	}
	function dividerElement( position, attributes ) {
		const prefix = position === 'top' ? 'top' : 'bottom';
		const type = normalizeDividerType( attributes[ prefix + 'DividerType' ] );
		if ( type === 'none' ) return null;
		const direction = attributes[ prefix + 'DividerDirection' ] === 'outward' ? 'outward' : 'inward';
		const supportsDirection = type === 'triangle-flex' || type === 'curve-flex' || type === 'zigzag';
		const className = 'cni-generated-background-plus__divider cni-generated-background-plus__divider--' + position +
			( attributes[ prefix + 'DividerFlip' ] ? ' is-flipped' : '' ) +
			( supportsDirection && direction === 'outward' ? ' is-outward' : '' );
		return el( 'div', { className: className, style: { '--cni-generated-divider-height': numberInRange( attributes[ prefix + 'DividerHeight' ], 20, 240, 80 ) + 'px', '--cni-generated-divider-color': attributes[ prefix + 'DividerColor' ] || '#ffffff' }, 'aria-hidden': 'true' },
			el( 'svg', { viewBox: type === 'cloud' ? '0 -20 1200 140' : '0 0 1200 120', preserveAspectRatio: 'none', focusable: 'false' }, type === 'cloud' ? cloudElements( attributes[ prefix + 'DividerCloudDensity' ] ) : el( 'path', { d: dividerPath( type, attributes[ prefix + 'DividerCloudDensity' ], direction, attributes[ prefix + 'DividerShapeWidth' ], attributes[ prefix + 'DividerZigzagCount' ] ) } ) )
		);
	}
	function dividerSettingsControl( position, attributes, setAttributes, colors ) {
		const prefix = position === 'top' ? 'top' : 'bottom';
		const typeKey = prefix + 'DividerType';
		const type = normalizeDividerType( attributes[ typeKey ] );
		const directionKey = prefix + 'DividerDirection';
		const direction = attributes[ directionKey ] === 'outward' ? 'outward' : 'inward';
		const supportsDirection = type === 'triangle-flex' || type === 'curve-flex' || type === 'zigzag';
		const supportsWidth = type === 'triangle-flex' || type === 'curve-flex';
		const supportsFlip = type === 'slope' || type === 'wave' || type === 'cloud' || type === 'torn';
		const update = function( key, value ) { const next = {}; next[ key ] = value; setAttributes( next ); };
		return el( 'div', { className: 'cni-generated-background-plus__divider-control' },
			el( 'h3', null, position === 'top' ? __( '上部区切り', 'cni-blocks' ) : __( '下部区切り', 'cni-blocks' ) ),
			el( SelectControl, { label: __( '形', 'cni-blocks' ), value: type, options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '傾斜', 'cni-blocks' ), value: 'slope' }, { label: __( 'カーブ', 'cni-blocks' ), value: 'curve-flex' }, { label: __( '波', 'cni-blocks' ), value: 'wave' }, { label: __( '三角', 'cni-blocks' ), value: 'triangle-flex' }, { label: __( 'ギザギザ', 'cni-blocks' ), value: 'zigzag' }, { label: __( '雲', 'cni-blocks' ), value: 'cloud' }, { label: __( 'ちぎり紙', 'cni-blocks' ), value: 'torn' }, { label: __( 'スカラップ', 'cni-blocks' ), value: 'scallop' } ], onChange: function( value ) { const next = {}; next[ typeKey ] = normalizeDividerType( value ); if ( value === 'triangle-flex' ) { next[ directionKey ] = 'outward'; next[ prefix + 'DividerHeight' ] = 48; next[ prefix + 'DividerShapeWidth' ] = 18; } if ( value === 'curve-flex' ) { next[ directionKey ] = 'outward'; next[ prefix + 'DividerHeight' ] = 64; next[ prefix + 'DividerShapeWidth' ] = 100; } setAttributes( next ); } } ),
			supportsDirection ? el( SelectControl, { label: __( '区切りの向き', 'cni-blocks' ), value: direction, options: [ { label: __( '外側へ突き出す', 'cni-blocks' ), value: 'outward' }, { label: __( '内側へ切り込む', 'cni-blocks' ), value: 'inward' } ], onChange: function( value ) { update( directionKey, value === 'outward' ? 'outward' : 'inward' ); } } ) : null,
			type !== 'none' ? el( ColorPalette, { colors: colors, value: attributes[ prefix + 'DividerColor' ] || '#ffffff', clearable: false, onChange: function( value ) { update( prefix + 'DividerColor', value || '#ffffff' ); } } ) : null,
			type !== 'none' ? el( RangeControl, { label: __( '区切りの深さ（px）', 'cni-blocks' ), value: numberInRange( attributes[ prefix + 'DividerHeight' ], 20, 240, 80 ), min: 20, max: 240, step: 2, onChange: function( value ) { update( prefix + 'DividerHeight', numberInRange( value, 20, 240, 80 ) ); } } ) : null,
			supportsWidth ? el( RangeControl, { label: type === 'triangle-flex' ? __( '三角の幅（%）', 'cni-blocks' ) : __( 'カーブの幅（%）', 'cni-blocks' ), value: numberInRange( attributes[ prefix + 'DividerShapeWidth' ], type === 'triangle-flex' ? 5 : 30, 100, type === 'triangle-flex' ? 18 : 100 ), min: type === 'triangle-flex' ? 5 : 30, max: type === 'triangle-flex' ? 40 : 100, onChange: function( value ) { update( prefix + 'DividerShapeWidth', numberInRange( value, type === 'triangle-flex' ? 5 : 30, 100, type === 'triangle-flex' ? 18 : 100 ) ); } } ) : null,
			type === 'zigzag' ? el( RangeControl, { label: __( 'ギザギザの数', 'cni-blocks' ), value: Math.round( numberInRange( attributes[ prefix + 'DividerZigzagCount' ], 3, 30, 6 ) ), min: 3, max: 30, step: 1, onChange: function( value ) { update( prefix + 'DividerZigzagCount', Math.round( numberInRange( value, 3, 30, 6 ) ) ); } } ) : null,
			type === 'cloud' ? el( RangeControl, { label: __( '雲の細かさ', 'cni-blocks' ), value: numberInRange( attributes[ prefix + 'DividerCloudDensity' ], 1, 3, 2 ), min: 1, max: 3, step: 1, onChange: function( value ) { update( prefix + 'DividerCloudDensity', numberInRange( value, 1, 3, 2 ) ); } } ) : null,
			supportsFlip ? el( ToggleControl, { label: __( '左右反転', 'cni-blocks' ), checked: !! attributes[ prefix + 'DividerFlip' ], onChange: function( value ) { update( prefix + 'DividerFlip', !! value ); } } ) : null
		);
	}
	function colorWithAlpha( color, alpha ) {
		const value = ( color || '' ).replace( '#', '' );
		const hex = value.length === 3 ? value.split( '' ).map( function( part ) { return part + part; } ).join( '' ) : value;
		if ( ! /^[0-9a-f]{6}$/i.test( hex ) ) return color || 'transparent';
		return 'rgba(' + parseInt( hex.slice( 0, 2 ), 16 ) + ',' + parseInt( hex.slice( 2, 4 ), 16 ) + ',' + parseInt( hex.slice( 4, 6 ), 16 ) + ',' + alpha + ')';
	}
	function hexColor( color, fallback ) {
		const value = String( color || '' ).replace( '#', '' );
		const hex = value.length === 3 ? value.split( '' ).map( function( part ) { return part + part; } ).join( '' ) : value;
		return /^[0-9a-f]{6}$/i.test( hex ) ? '#' + hex : fallback;
	}
	function mixWithWhite( color, amount ) {
		const hex = hexColor( color, '#ec4899' );
		const mix = clamp( amount, 0, 1 );
		const channel = function( start ) { return Math.round( parseInt( hex.slice( start, start + 2 ), 16 ) + ( 255 - parseInt( hex.slice( start, start + 2 ), 16 ) ) * mix ); };
		return '#' + [ channel( 1 ), channel( 3 ), channel( 5 ) ].map( function( value ) { return value.toString( 16 ).padStart( 2, '0' ); } ).join( '' );
	}
	function svgDataUrl( svg ) { return 'url("data:image/svg+xml,' + encodeURIComponent( svg ) + '")'; }
	function noiseImage( color, opacity ) {
		const hex = hexColor( color, '#64748b' );
		const red = parseInt( hex.slice( 1, 3 ), 16 ) / 255;
		const green = parseInt( hex.slice( 3, 5 ), 16 ) / 255;
		const blue = parseInt( hex.slice( 5, 7 ), 16 ) / 255;
		return svgDataUrl( '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="4" stitchTiles="stitch"/><feComponentTransfer><feFuncR type="table" tableValues="' + red + ' ' + red + '"/><feFuncG type="table" tableValues="' + green + ' ' + green + '"/><feFuncB type="table" tableValues="' + blue + ' ' + blue + '"/><feFuncA type="table" tableValues="0 ' + opacity + '"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>' );
	}
	function waveImage( color, opacity, angle ) {
		return svgDataUrl( '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><path d="M0 40 C20 8 40 8 60 40 S100 72 120 40 S160 8 180 40 S220 72 240 40" fill="none" stroke="' + hexColor( color, '#64748b' ) + '" stroke-width="2" stroke-opacity="' + opacity + '" transform="rotate(' + angle + ' 120 40)"/></svg>' );
	}
	function geometryImage( type, color, opacity ) {
		const stroke = hexColor( color, '#64748b' );
		if ( type === 'hexagon' ) return svgDataUrl( '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="84" viewBox="0 0 96 84"><path d="M24 2h48l22 40-22 40H24L2 42zM24 2l24 40 24-40M24 82l24-40 24 40" fill="none" stroke="' + stroke + '" stroke-width="1" stroke-opacity="' + opacity + '"/></svg>' );
		return svgDataUrl( '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="84" viewBox="0 0 96 84"><path d="M48 2 94 82H2zm0 0v80M2 82 94 82" fill="none" stroke="' + stroke + '" stroke-width="1" stroke-opacity="' + opacity + '"/></svg>' );
	}
	function intensityValue( value ) { return { soft: 0.36, normal: 0.54, strong: 0.72 }[ value ] || 0.36; }
	function fadeValue( value ) { return { soft: '76%', normal: '66%', clear: '54%' }[ value ] || '66%'; }
	function generatedPositions( preset ) {
		const templates = {
			balanced: DEFAULT_POSITIONS,
			left: [ { x: 8, y: 18, size: 82 }, { x: 34, y: 50, size: 74 }, { x: 14, y: 84, size: 78 }, { x: 58, y: 14, size: 60 }, { x: 56, y: 82, size: 58 } ],
			right: [ { x: 92, y: 18, size: 82 }, { x: 66, y: 50, size: 74 }, { x: 86, y: 84, size: 78 }, { x: 42, y: 14, size: 60 }, { x: 44, y: 82, size: 58 } ],
			top: [ { x: 14, y: 8, size: 80 }, { x: 52, y: 14, size: 76 }, { x: 88, y: 10, size: 74 }, { x: 28, y: 58, size: 58 }, { x: 76, y: 56, size: 58 } ],
			bottom: [ { x: 14, y: 90, size: 80 }, { x: 52, y: 84, size: 76 }, { x: 88, y: 90, size: 74 }, { x: 28, y: 42, size: 58 }, { x: 76, y: 44, size: 58 } ],
		};
		if ( preset !== 'random' && templates[ preset ] ) return templates[ preset ].map( function( spot ) { return Object.assign( {}, spot ); } );
		const layouts = [
			[ { x: 10, y: 16 }, { x: 88, y: 18 }, { x: 28, y: 86 }, { x: 82, y: 76 }, { x: 52, y: 48 } ],
			[ { x: 8, y: 72 }, { x: 78, y: 10 }, { x: 88, y: 84 }, { x: 26, y: 26 }, { x: 50, y: 56 } ],
			[ { x: 18, y: 10 }, { x: 90, y: 50 }, { x: 48, y: 88 }, { x: 12, y: 56 }, { x: 68, y: 20 } ],
			[ { x: 50, y: 8 }, { x: 12, y: 44 }, { x: 86, y: 36 }, { x: 34, y: 88 }, { x: 78, y: 84 } ],
		];
		const layout = layouts[ Math.floor( Math.random() * layouts.length ) ];
		return layout.map( function( spot, index ) {
			return {
				x: Math.round( clamp( spot.x + ( Math.random() * 28 - 14 ), 2, 98 ) ),
				y: Math.round( clamp( spot.y + ( Math.random() * 28 - 14 ), 2, 98 ) ),
				size: Math.round( 54 + Math.random() * 24 + ( index === 0 ? 6 : 0 ) ),
			};
		} );
	}
	function bokehDotCount( density ) { return Math.round( 6 + numberInRange( density, 10, 100, 50 ) * 0.18 ); }
	function bokehBlurDeviation( value ) { return { weak: 14, normal: 28, strong: 46 }[ value ] || 28; }
	function bokehSizeScale( value ) { return { small: 0.72, normal: 1, large: 1.32 }[ value ] || 1; }
	function bokehMotionFade( value ) { return { weak: '54%', normal: '68%', strong: '84%' }[ value ] || '68%'; }
	function balancedBokehDots( dots, balance ) {
		return dots.map( function( dot ) {
			const next = Object.assign( {}, dot );
			if ( balance === 'left' ) next.x = 3 + dot.x * 0.66;
			if ( balance === 'right' ) next.x = 31 + dot.x * 0.66;
			if ( balance === 'top' ) next.y = 3 + dot.y * 0.64;
			if ( balance === 'bottom' ) next.y = 33 + dot.y * 0.64;
			return next;
		} );
	}
	function generatedBokehDots( shape, variation ) {
		const shapes = [ 'circle', 'square', 'triangle' ];
		const variance = numberInRange( variation, 0, 100, 70 ) / 100;
		return Array.from( { length: 24 }, function( unused, index ) {
			const roll = Math.random();
			const baseSize = roll < 0.16 ? 54 + Math.random() * 34 : ( roll < 0.52 ? 30 + Math.random() * 28 : 12 + Math.random() * 18 );
			return {
				x: Math.round( 3 + Math.random() * 94 ), y: Math.round( 3 + Math.random() * 94 ),
				size: Math.round( baseSize * ( 1 - variance * 0.45 + Math.random() * variance * 0.9 ) ),
				opacity: Math.round( ( 0.28 + Math.random() * 0.35 ) * 100 ) / 100,
				shape: shape === 'mixed' ? shapes[ Math.floor( Math.random() * shapes.length ) ] : ( shapes.indexOf( shape ) !== -1 ? shape : 'circle' ),
			};
		} );
	}
	function normalizedBokehDots( dots ) {
		return Array.from( { length: 24 }, function( unused, index ) {
			const source = DEFAULT_BOKEH_DOTS[ index % DEFAULT_BOKEH_DOTS.length ];
			const fallback = index < DEFAULT_BOKEH_DOTS.length ? source : { x: ( source.x + 43 ) % 100, y: ( source.y + 31 ) % 100, size: Math.max( 12, source.size - 8 ), opacity: Math.max( 0.24, source.opacity - 0.08 ), shape: source.shape };
			const dot = dots && dots[ index ] || fallback;
			return {
				x: clamp( typeof dot.x === 'number' ? dot.x : fallback.x, 0, 100 ), y: clamp( typeof dot.y === 'number' ? dot.y : fallback.y, 0, 100 ),
				size: clamp( typeof dot.size === 'number' ? dot.size : fallback.size, 8, 110 ), opacity: clamp( typeof dot.opacity === 'number' ? dot.opacity : fallback.opacity, 0.1, 0.9 ),
				shape: [ 'circle', 'square', 'triangle' ].indexOf( dot.shape ) !== -1 ? dot.shape : fallback.shape,
			};
		} );
	}
	function bokehImage( attributes ) {
		const dots = balancedBokehDots( normalizedBokehDots( attributes.bokehDots ), attributes.bokehBalance ).slice( 0, bokehDotCount( attributes.patternDensity ) );
		const color = hexColor( attributes.patternColor, '#ec4899' );
		const opacity = numberInRange( attributes.patternOpacity, 5, 80, 20 ) / 100;
		const variation = numberInRange( attributes.bokehSizeVariation, 0, 100, 70 ) / 100;
		const sizeScale = bokehSizeScale( attributes.bokehSize );
		const shapes = dots.map( function( dot, index ) {
			const radius = Math.max( 14, dot.size * ( 3.2 + variation * 1.2 ) * sizeScale );
			const x = dot.x * 12;
			const y = dot.y * 7;
			const fill = attributes.bokehAutoShades === false ? color : mixWithWhite( color, [ 0.20, 0.42, 0.62, 0.76 ][ index % 4 ] );
			const alpha = Math.min( 0.9, opacity * dot.opacity * 2.2 );
			if ( dot.shape === 'square' ) return '<rect x="' + ( x - radius ) + '" y="' + ( y - radius ) + '" width="' + ( radius * 2 ) + '" height="' + ( radius * 2 ) + '" rx="' + ( radius * 0.20 ) + '" fill="' + fill + '" fill-opacity="' + alpha + '"/>';
			if ( dot.shape === 'triangle' ) return '<path d="M' + x + ' ' + ( y - radius * 1.15 ) + ' L' + ( x + radius ) + ' ' + ( y + radius * 0.78 ) + ' L' + ( x - radius ) + ' ' + ( y + radius * 0.78 ) + ' Z" fill="' + fill + '" fill-opacity="' + alpha + '"/>';
			return '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="' + fill + '" fill-opacity="' + alpha + '"/>';
		} ).join( '' );
		return svgDataUrl( '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"><filter id="b" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="' + bokehBlurDeviation( attributes.bokehBlur ) + '"/></filter><g filter="url(#b)">' + shapes + '</g></svg>' );
	}
	function seededRandom( seed ) {
		let state = ( Math.abs( Math.floor( typeof seed === 'number' ? seed : 1729 ) ) || 1729 ) >>> 0;
		return function() { state = ( state * 1664525 + 1013904223 ) >>> 0; return state / 4294967296; };
	}
	function generatedPatternSeed() { return Math.floor( Math.random() * 2147483646 ) + 1; }
	function generatedPatternScale( value ) { return { small: 0.72, normal: 1, large: 1.34 }[ value ] || 1; }
	function generatedPatternVariation( value ) { return { low: 0.22, normal: 0.58, high: 1 }[ value ] || 0.58; }
	function generatedPatternPosition( random, balance ) {
		let x = random(); let y = random();
		if ( balance === 'left' ) x *= 0.68;
		if ( balance === 'right' ) x = 0.32 + x * 0.68;
		if ( balance === 'top' ) y *= 0.64;
		if ( balance === 'bottom' ) y = 0.36 + y * 0.64;
		if ( balance === 'center' ) { x = 0.14 + x * 0.72; y = 0.14 + y * 0.72; }
		return { x: x, y: y };
	}
	function fluidShapeLayout( balance ) {
		const layouts = {
			left: [ { x: '78%', y: '28%' }, { x: '72%', y: '78%' } ],
			right: [ { x: '22%', y: '28%' }, { x: '28%', y: '78%' } ],
			top: [ { x: '76%', y: '70%' }, { x: '22%', y: '76%' } ],
			bottom: [ { x: '76%', y: '26%' }, { x: '24%', y: '22%' } ],
			center: [ { x: '18%', y: '24%' }, { x: '82%', y: '76%' } ],
			balanced: [ { x: '80%', y: '24%' }, { x: '18%', y: '78%' } ],
		};
		return layouts[ balance ] || layouts.balanced;
	}
	function patternImage( type, attributes ) {
		const random = seededRandom( attributes.patternSeed );
		const density = numberInRange( attributes.patternDensity, 10, 100, 50 );
		const opacity = numberInRange( attributes.patternOpacity, 5, 80, 20 ) / 100;
		const color = hexColor( attributes.patternColor, '#38bdf8' );
		const colorFor = function( index ) { return attributes.bokehAutoShades === false ? color : mixWithWhite( color, [ 0.12, 0.32, 0.52, 0.70, 0.82 ][ index % 5 ] ); };
		const alphaFor = function( index, amount ) { return Math.min( 0.85, opacity * amount * ( 0.55 + random() * 0.70 ) ); };
		const scale = generatedPatternScale( attributes.generatedPatternSize );
		const variation = generatedPatternVariation( attributes.generatedPatternVariation );
		const balance = attributes.generatedPatternBalance || 'balanced';
		const character = attributes.generatedPatternCharacter || '';
		const shapes = [];
		let index;
		if ( type === 'pixel-wave' ) {
			const count = Math.round( 42 + density * 1.12 );
			const band = { top: 180, center: 350, bottom: 520 }[ attributes.patternPlacement ] || 350;
			const waveStrength = { calm: 0.62, strong: 1.48 }[ character ] || 1;
			for ( index = 0; index < count; index += 1 ) {
				const point = generatedPatternPosition( random, balance ); const x = point.x * 1200;
				const curve = band + Math.sin( x / ( 118 + random() * 90 * variation ) + random() * 3.8 * variation ) * ( 36 + density * 0.42 ) * waveStrength;
				const y = curve + ( random() - 0.5 ) * ( 64 + density * 2.8 ) * ( 0.45 + variation );
				const distance = Math.abs( y - curve ) / ( 45 + density * 1.3 );
				const size = ( 2 + random() * ( 3 + density / 17 ) * Math.max( 0.32, 1 - distance ) * ( 0.55 + variation ) ) * scale;
				shapes.push( '<rect x="' + Math.round( x ) + '" y="' + Math.round( y ) + '" width="' + Math.round( size ) + '" height="' + Math.round( size ) + '" fill="' + colorFor( index ) + '" fill-opacity="' + alphaFor( index, Math.max( 0.2, 1 - distance ) ) + '"/>' );
			}
		} else if ( type === 'soft-polygons' ) {
			const count = Math.round( 7 + density * 0.20 );
			const aspect = { slender: 0.58, wide: 1.52 }[ character ] || 1;
			for ( index = 0; index < count; index += 1 ) {
				const pointPosition = generatedPatternPosition( random, balance ); const x = pointPosition.x * 1200; const y = pointPosition.y * 700; const size = ( 86 + random() * ( 90 + density * 1.45 ) * ( 0.4 + variation ) ) * scale;
				const rotation = random() * Math.PI * 2;
				const point = function( angle ) { return Math.round( x + Math.cos( angle ) * size * aspect ) + ',' + Math.round( y + Math.sin( angle ) * size ); };
				shapes.push( '<polygon points="' + point( rotation ) + ' ' + point( rotation + 2.1 + ( random() - 0.5 ) * variation * 0.5 ) + ' ' + point( rotation + 4.2 - ( random() - 0.5 ) * variation * 0.5 ) + '" fill="' + colorFor( index ) + '" fill-opacity="' + alphaFor( index, 0.48 + variation * 0.36 ) + '"/>' );
			}
		} else if ( type === 'confetti' ) {
			const count = Math.round( 10 + density * 0.70 );
			for ( index = 0; index < count; index += 1 ) {
				const point = generatedPatternPosition( random, balance ); const x = 30 + point.x * 1140; const y = 26 + point.y * 648; const size = ( 4 + random() * ( 5 + density / 13 ) * ( 0.55 + variation ) ) * scale; const kind = character === 'dots' ? 0 : ( character === 'lines' ? 3 : Math.floor( random() * 4 ) ); const fill = colorFor( index ); const alpha = alphaFor( index, 0.62 + variation * 0.38 );
				if ( kind === 0 ) shapes.push( '<circle cx="' + x + '" cy="' + y + '" r="' + size / 2 + '" fill="' + fill + '" fill-opacity="' + alpha + '"/>' );
				else if ( kind === 1 ) shapes.push( '<rect x="' + ( x - size / 2 ) + '" y="' + ( y - size / 2 ) + '" width="' + size + '" height="' + size + '" rx="1" fill="' + fill + '" fill-opacity="' + alpha + '" transform="rotate(' + Math.round( random() * 55 ) + ' ' + x + ' ' + y + ')"/>' );
				else if ( kind === 2 ) shapes.push( '<path d="M' + x + ' ' + ( y - size ) + ' L' + ( x + size * 0.85 ) + ' ' + ( y + size * 0.7 ) + ' L' + ( x - size * 0.85 ) + ' ' + ( y + size * 0.7 ) + 'Z" fill="' + fill + '" fill-opacity="' + alpha + '"/>' );
				else shapes.push( '<path d="M' + ( x - size ) + ' ' + ( y + size / 2 ) + ' L' + ( x + size ) + ' ' + ( y - size / 2 ) + '" stroke="' + fill + '" stroke-width="' + Math.max( 1, size / 3 ) + '" stroke-linecap="round" stroke-opacity="' + alpha + '"/>' );
			}
		} else if ( type === 'rings' ) {
			const isRipple = character === 'ripple'; const count = isRipple ? Math.round( 2 + density * 0.035 ) : Math.round( 4 + density * 0.30 );
			for ( index = 0; index < count; index += 1 ) {
				const point = generatedPatternPosition( random, balance ); const x = point.x * 1200; const y = point.y * 700; const radius = ( isRipple ? 62 + random() * ( 82 + density * 1.1 ) : 10 + random() * ( 18 + density * 0.62 ) * ( 0.5 + variation ) ) * scale; const stroke = colorFor( index ); const alpha = alphaFor( index, isRipple ? 0.44 : 0.54 + variation * 0.36 ); const strokeWidth = isRipple ? 1 + random() * 1.4 : ( character === 'bold' ? 2.2 + random() * 2.6 : 0.8 + random() * ( 1.1 + variation * 1.4 ) );
				if ( character === 'dots' ) shapes.push( '<circle cx="' + x + '" cy="' + y + '" r="' + Math.max( 2, radius * 0.28 ) + '" fill="' + stroke + '" fill-opacity="' + alpha + '"/>' );
				else shapes.push( '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="none" stroke="' + stroke + '" stroke-width="' + strokeWidth + '" stroke-opacity="' + alpha + '"/>' );
				if ( character !== 'dots' && ( isRipple || random() < 0.24 + variation * 0.58 ) ) shapes.push( '<circle cx="' + x + '" cy="' + y + '" r="' + ( radius + ( isRipple ? 22 : 6 + random() * 15 * scale ) ) + '" fill="none" stroke="' + stroke + '" stroke-width="1" stroke-opacity="' + ( alpha * 0.58 ) + '"/>' );
			}
		} else if ( type === 'flow-lines' ) {
			const count = Math.round( 2 + density / 24 ); const lineMode = { calm: 0.58, dynamic: 1.46 }[ character ] || 1; const direction = attributes.patternPlacement || 'horizontal';
			for ( index = 0; index < count; index += 1 ) {
				const point = generatedPatternPosition( random, balance ); const y = 70 + point.y * 560; const amplitude = ( 24 + random() * ( 28 + density * 0.66 ) * ( 0.45 + variation ) ) * lineMode * scale; const phase = ( random() - 0.5 ) * 120 * variation; const slope = direction === 'up' ? -110 : ( direction === 'down' ? 110 : 0 ); const stroke = colorFor( index ); const alpha = alphaFor( index, 0.50 + variation * 0.30 );
				shapes.push( '<path d="M-100 ' + ( y + slope / 2 ) + ' C170 ' + ( y - amplitude + phase ) + ' 355 ' + ( y + amplitude - phase ) + ' 590 ' + ( y + slope * 0.5 ) + ' S975 ' + ( y - amplitude + slope - phase ) + ' 1300 ' + ( y + amplitude + slope ) + '" fill="none" stroke="' + stroke + '" stroke-width="' + ( 0.8 + random() * ( 0.8 + variation * 2.0 ) ) + '" stroke-opacity="' + alpha + '"/>' );
			}
		} else if ( type === 'halftone' ) {
			const columns = Math.round( ( 10 + density / 5 ) / scale ); const rows = Math.round( ( 6 + density / 12 ) / scale ); const direction = attributes.patternPlacement || 'right'; const contrast = { soft: 0.65, strong: 1.35 }[ character ] || 1;
			for ( let row = 0; row < rows; row += 1 ) for ( let column = 0; column < columns; column += 1 ) {
				const x = ( column + 0.5 ) * 1200 / columns; const y = ( row + 0.5 ) * 700 / rows;
				const progress = direction === 'bottom' ? y / 700 : ( direction === 'top' ? 1 - y / 700 : ( direction === 'left' ? 1 - x / 1200 : x / 1200 ) );
				const randomFactor = 1 + ( random() - 0.5 ) * variation * 0.64; const radius = Math.max( 0.35, ( 1 - progress ) * ( 1.2 + density / 16 ) * randomFactor * contrast );
				shapes.push( '<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="' + colorFor( row + column ) + '" fill-opacity="' + ( opacity * ( 0.12 + ( 1 - progress ) * 0.72 * contrast ) ) + '"/>' );
			}
		} else if ( type === 'tile-geometry' ) {
			const columns = Math.max( 3, Math.round( ( 4 + density / 14 ) / scale ) ); const rows = Math.max( 2, Math.round( ( 3 + density / 20 ) / scale ) ); const cellWidth = 1200 / columns; const cellHeight = 700 / rows; const fillAmount = { sparse: 0.36, filled: 0.84 }[ character ] || 0.62;
			for ( let row = 0; row < rows; row += 1 ) for ( let column = 0; column < columns; column += 1 ) {
				const x = column * cellWidth; const y = row * cellHeight; const fill = colorFor( row * columns + column ); const alpha = alphaFor( row + column, 0.34 + variation * 0.28 ); const flipped = random() > 0.5; const visible = random() < fillAmount * ( balance === 'center' && Math.abs( column / columns - 0.5 ) < 0.18 ? 0.68 : 1 );
				if ( visible ) shapes.push( '<path d="M' + x + ' ' + y + ' L' + ( x + cellWidth ) + ' ' + y + ' L' + ( x + ( flipped ? cellWidth : 0 ) ) + ' ' + ( y + cellHeight ) + 'Z" fill="' + fill + '" fill-opacity="' + alpha + '"/>' );
				if ( visible && random() < 0.48 + variation * 0.3 ) shapes.push( '<path d="M' + x + ' ' + ( y + cellHeight ) + ' L' + ( x + cellWidth ) + ' ' + ( y + cellHeight ) + ' L' + ( x + ( flipped ? 0 : cellWidth ) ) + ' ' + y + 'Z" fill="' + colorFor( row * columns + column + 1 ) + '" fill-opacity="' + ( alpha * ( 0.48 + random() * 0.34 ) ) + '"/>' );
			}
		}
		return svgDataUrl( '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">' + shapes.join( '' ) + '</svg>' );
	}
	function motionElements( attributes ) {
		const motion = attributes.backgroundMotion || 'none';
		const isSpotMotion = motion === 'spot-breathe' && ( attributes.backgroundStyle === 'mesh' || attributes.backgroundStyle === 'spots' );
		if ( isSpotMotion ) return [ 1, 2, 3, 4, 5 ].map( function( index ) { return el( 'span', { key: 'motion-spot-' + index, className: 'cni-generated-background-plus__motion-spot cni-generated-background-plus__motion-spot--' + index } ); } );
		if ( ( attributes.backgroundStyle === 'mesh' || attributes.backgroundStyle === 'spots' ) && motion === 'color-breathe' ) return [ 1, 2 ].map( function( index ) { return el( 'span', { key: 'motion-color-' + index, className: 'cni-generated-background-plus__motion-color cni-generated-background-plus__motion-color--' + index } ); } );
		if ( ( attributes.backgroundStyle === 'mesh' || attributes.backgroundStyle === 'spots' ) && motion === 'focus-shift' ) return el( 'span', { className: 'cni-generated-background-plus__motion-focus' } );
		if ( attributes.backgroundStyle === 'rings' && motion === 'ring-ripple' ) return [ 1, 2, 3 ].map( function( index ) { return el( 'span', { key: 'motion-ripple-' + index, className: 'cni-generated-background-plus__motion-ripple cni-generated-background-plus__motion-ripple--' + index } ); } );
		if ( attributes.backgroundStyle === 'fluid-shapes' ) return [ 1, 2 ].map( function( index ) { return el( 'span', { key: 'fluid-shape-' + index, className: 'cni-generated-background-plus__fluid-shape cni-generated-background-plus__fluid-shape--' + index } ); } );
		if ( attributes.backgroundStyle === 'bokeh' && [ 'bokeh-float', 'bokeh-breathe', 'bokeh-wobble' ].indexOf( motion ) !== -1 ) {
			const dots = balancedBokehDots( normalizedBokehDots( attributes.bokehDots ), attributes.bokehBalance ).slice( 0, Math.min( 5, bokehDotCount( attributes.patternDensity ) ) );
			const color = hexColor( attributes.patternColor, '#ec4899' ); const opacity = numberInRange( attributes.patternOpacity, 5, 80, 20 ) / 100; const variation = numberInRange( attributes.bokehSizeVariation, 0, 100, 70 ) / 100; const scale = bokehSizeScale( attributes.bokehSize );
			return dots.map( function( dot, index ) {
				const shade = attributes.bokehAutoShades === false ? color : mixWithWhite( color, [ 0.20, 0.42, 0.62, 0.76 ][ index % 4 ] );
				return el( 'span', { key: 'motion-bokeh-' + index, className: 'cni-generated-background-plus__motion-bokeh cni-generated-background-plus__motion-bokeh--' + ( index + 1 ), style: { left: dot.x + '%', top: dot.y + '%', width: Math.max( 12, dot.size * ( 0.50 + variation * 0.20 ) * scale ) + '%', '--cni-generated-bokeh-motion-color': colorWithAlpha( shade, Math.min( 0.74, opacity * dot.opacity * 2.2 ) ) } } );
			} );
		}
		if ( motion === 'glow-drift' ) return el( 'span', { className: 'cni-generated-background-plus__motion-glow' } );
		return null;
	}
	function normalizedPositions( positions ) {
		return DEFAULT_POSITIONS.map( function( fallback, index ) {
			const spot = positions && positions[ index ] || {};
			return { x: clamp( typeof spot.x === 'number' ? spot.x : fallback.x, 0, 100 ), y: clamp( typeof spot.y === 'number' ? spot.y : fallback.y, 0, 100 ), size: clamp( typeof spot.size === 'number' ? spot.size : fallback.size, 40, 180 ) };
		} );
	}
	function styleFor( a ) {
		const positions = normalizedPositions( a.spotPositions );
		const layout = layoutValues( a );
		const patternDensity = numberInRange( a.patternDensity, 10, 100, 50 );
		const patternOpacity = numberInRange( a.patternOpacity, 5, 80, 20 ) / 100;
		const patternSize = Math.round( 10 + ( 100 - patternDensity ) * 0.8 );
		const patternColor = a.patternColor || '#64748b';
		const alpha = intensityValue( a.intensity );
		const colorCount = clamp( typeof a.colorCount === 'number' ? a.colorCount : 3, 2, 5 );
		const sizeScale = { small: 0.72, normal: 0.9, large: 1 }[ a.spotSize ] || 1;
		const countScale = { 2: 1.22, 3: 1.08, 4: 0.95, 5: 0.84 }[ colorCount ];
		const backgroundScale = a.backgroundStyle === 'spots' ? 0.92 : 1.15;
		const brightness = { light: 1.06, normal: 1, dark: 0.90 }[ a.brightness ] || 1;
		const saturation = { muted: 0.72, normal: 1, vivid: 1.28 }[ a.saturation ] || 1;
		const centerColor = { clear: 'rgba(255,255,255,0.38)', normal: 'rgba(255,255,255,0.10)', colored: 'rgba(255,255,255,0)' }[ a.centerSpace ] || 'rgba(255,255,255,0.10)';
		const style = {
			'--cni-generated-base': a.baseColor || '#f8fafc',
			'--cni-generated-fade': fadeValue( a.blurLevel ),
			'--cni-generated-brightness': brightness,
			'--cni-generated-saturation': saturation,
			'--cni-generated-center-color': centerColor,
			'--cni-generated-max-width': layout.contentWidth > 0 ? px( layout.contentWidth ) : '100%',
			'--cni-generated-padding-v-pc': px( layout.paddingVerticalPc ),
			'--cni-generated-padding-h-pc': px( layout.paddingHorizontalPc ),
			'--cni-generated-padding-v-tablet': px( layout.paddingVerticalTablet ),
			'--cni-generated-padding-h-tablet': px( layout.paddingHorizontalTablet ),
			'--cni-generated-padding-v-mobile': px( layout.paddingVerticalMobile ),
			'--cni-generated-padding-h-mobile': px( layout.paddingHorizontalMobile ),
			'--cni-generated-min-height-pc': px( layout.minHeightPc ),
			'--cni-generated-min-height-tablet': px( layout.minHeightTablet ),
			'--cni-generated-min-height-mobile': px( layout.minHeightMobile ),
			'--cni-generated-border-width': px( layout.borderWidth ),
			'--cni-generated-border-style': layout.borderStyle,
			'--cni-generated-border-color': layout.borderColor,
			'--cni-generated-border-radius': px( layout.borderRadius ),
			'--cni-generated-pattern-color': colorWithAlpha( patternColor, patternOpacity ),
			'--cni-generated-pattern-size': patternSize + 'px',
			'--cni-generated-pattern-stroke': Math.max( 1, Math.round( patternDensity / 55 ) ) + 'px',
			'--cni-generated-pattern-angle': numberInRange( a.patternAngle, 0, 360, 45 ) + 'deg',
			'--cni-generated-wave-image': waveImage( patternColor, patternOpacity, numberInRange( a.patternAngle, 0, 360, 45 ) ),
			'--cni-generated-geometry-image': geometryImage( a.geometryType, patternColor, patternOpacity ),
			'--cni-generated-noise-image': noiseImage( patternColor, patternOpacity ),
			'--cni-generated-wave-width': Math.round( patternSize * 4 ) + 'px',
			'--cni-generated-wave-height': Math.round( patternSize * 1.4 ) + 'px',
			'--cni-generated-geometry-width': Math.round( patternSize * 1.8 ) + 'px',
			'--cni-generated-geometry-height': Math.round( patternSize * 1.6 ) + 'px',
		};
		for ( let index = 0; index < 5; index += 1 ) {
			const visible = index < colorCount;
			const color = a[ 'color' + ( index + 1 ) ] || COLOR_PRESETS.mist[ 'color' + ( index + 1 ) ];
			const size = Math.round( positions[ index ].size * sizeScale * countScale * backgroundScale );
			style[ '--cni-generated-color-' + ( index + 1 ) ] = colorWithAlpha( color, visible ? alpha : 0 );
			style[ '--cni-generated-x-' + ( index + 1 ) ] = positions[ index ].x + '%';
			style[ '--cni-generated-y-' + ( index + 1 ) ] = positions[ index ].y + '%';
			style[ '--cni-generated-size-' + ( index + 1 ) ] = size + '%';
		}
		if ( a.backgroundStyle === 'bokeh' ) style['--cni-generated-bokeh-image'] = bokehImage( a );
		if ( [ 'pixel-wave', 'soft-polygons', 'confetti', 'rings', 'flow-lines', 'halftone', 'tile-geometry' ].indexOf( a.backgroundStyle ) !== -1 ) style['--cni-generated-pattern-image'] = patternImage( a.backgroundStyle, a );
		if ( a.backgroundStyle === 'rings' || a.backgroundStyle === 'fluid-shapes' ) {
			const fluidLayout = fluidShapeLayout( a.generatedPatternBalance || 'balanced' );
			style['--cni-generated-fluid-x-1'] = fluidLayout[0].x;
			style['--cni-generated-fluid-y-1'] = fluidLayout[0].y;
			style['--cni-generated-fluid-x-2'] = fluidLayout[1].x;
			style['--cni-generated-fluid-y-2'] = fluidLayout[1].y;
			style['--cni-generated-fluid-color-1'] = colorWithAlpha( patternColor, Math.min( 0.50, patternOpacity * 1.35 ) );
			style['--cni-generated-fluid-color-2'] = colorWithAlpha( mixWithWhite( patternColor, 0.48 ), Math.min( 0.46, patternOpacity * 1.08 ) );
			style['--cni-generated-fluid-size'] = { small: '30%', normal: '46%', large: '62%' }[ a.generatedPatternSize ] || '46%';
			style['--cni-generated-fluid-size-2'] = { small: '22%', normal: '34%', large: '46%' }[ a.generatedPatternSize ] || '34%';
		}
		if ( a.backgroundMotion && a.backgroundMotion !== 'none' ) {
			const motionDistance = { subtle: '3.5%', normal: '6%' }[ a.motionStrength ] || '3.5%';
			const glowDistance = { subtle: '18%', normal: '30%' }[ a.motionStrength ] || '18%';
			style['--cni-generated-motion-duration'] = { normal: '32s', slow: '48s', verySlow: '68s' }[ a.motionSpeed ] || '48s';
			style['--cni-generated-motion-distance'] = motionDistance;
			style['--cni-generated-motion-distance-negative'] = '-' + motionDistance;
			style['--cni-generated-motion-glow-distance'] = glowDistance;
			style['--cni-generated-motion-glow-distance-negative'] = '-' + glowDistance;
			if ( a.backgroundStyle === 'fluid-shapes' && a.backgroundMotion === 'fluid-morph' ) {
				const fluidMotion = { subtle: { distance: '8%', scaleUp: '1.12', scaleDown: '0.90' }, normal: { distance: '14%', scaleUp: '1.20', scaleDown: '0.82' } }[ a.motionStrength ] || { distance: '8%', scaleUp: '1.12', scaleDown: '0.90' };
				style['--cni-generated-motion-duration'] = { normal: '30s', slow: '38s', verySlow: '52s' }[ a.motionSpeed ] || '38s';
				style['--cni-generated-fluid-motion-distance'] = fluidMotion.distance;
				style['--cni-generated-fluid-motion-distance-negative'] = '-' + fluidMotion.distance;
				style['--cni-generated-fluid-motion-scale-up'] = fluidMotion.scaleUp;
				style['--cni-generated-fluid-motion-scale-down'] = fluidMotion.scaleDown;
			}
			if ( a.backgroundStyle === 'bokeh' ) style['--cni-generated-bokeh-motion-fade'] = bokehMotionFade( a.bokehBlur );
		}
		if ( a.useOuterMinHeight !== true && a.minHeight === 'viewport' ) {
			style['--cni-generated-min-height-pc'] = '100vh';
			style['--cni-generated-min-height-tablet'] = '100vh';
			style['--cni-generated-min-height-mobile'] = '100vh';
		}
		return style;
	}
	function legacyStyleFor( a ) {
		const positions = normalizedPositions( a.spotPositions );
		const alpha = intensityValue( a.intensity );
		const sizeScale = { small: 0.72, normal: 1, large: 1.25 }[ a.spotSize ] || 1.25;
		const brightness = { light: 1.06, normal: 1, dark: 0.90 }[ a.brightness ] || 1;
		const saturation = { muted: 0.72, normal: 1, vivid: 1.28 }[ a.saturation ] || 1;
		const centerColor = { clear: 'rgba(255,255,255,0.38)', normal: 'rgba(255,255,255,0.10)', colored: 'rgba(255,255,255,0)' }[ a.centerSpace ] || 'rgba(255,255,255,0.10)';
		const style = { '--cni-generated-base': a.baseColor || '#f8fafc', '--cni-generated-fade': fadeValue( a.blurLevel ), '--cni-generated-brightness': brightness, '--cni-generated-saturation': saturation, '--cni-generated-center-color': centerColor };
		for ( let index = 0; index < 5; index += 1 ) {
			const visible = index < ( typeof a.colorCount === 'number' ? a.colorCount : 3 );
			const color = a[ 'color' + ( index + 1 ) ] || COLOR_PRESETS.mist[ 'color' + ( index + 1 ) ];
			style['--cni-generated-color-' + ( index + 1 )] = colorWithAlpha( color, visible ? alpha : 0 );
			style['--cni-generated-x-' + ( index + 1 )] = positions[index].x + '%';
			style['--cni-generated-y-' + ( index + 1 )] = positions[index].y + '%';
			style['--cni-generated-size-' + ( index + 1 )] = Math.round( positions[index].size * sizeScale ) + '%';
		}
		return style;
	}
	function propsFor( a, save ) {
		const props = {
			style: styleFor( a ),
			className: hasOutwardDivider( a ) ? 'cni-generated-background-plus--has-outward-divider' : '',
			'data-content-width': a.contentWidth || 'standard',
			'data-min-height': a.minHeight || 'auto',
			'data-vertical-align': a.verticalAlign || 'center',
			'data-horizontal-align': a.horizontalAlign || 'left',
			'data-padding-y': a.paddingY || 'standard',
			'data-padding-x': a.paddingX || 'small',
			'data-border-radius': a.borderRadius || 'none',
			'data-overflow': a.overflow || 'hidden',
			'data-background-style': a.backgroundStyle || 'mesh',
			'data-content-overlay': a.contentOverlay || 'none',
			'data-geometry-type': a.geometryType || 'diagonal',
			'data-presentation-level': a.presentationLevel || 'basic',
			'data-composition-preset': a.compositionPreset || 'custom',
			'data-generated-pattern-character': a.generatedPatternCharacter || '',
		};
		if ( a.backgroundMotion && a.backgroundMotion !== 'none' ) {
			props['data-background-motion'] = a.backgroundMotion;
			props['data-motion-mobile'] = a.motionMobile || 'static';
		}
		return save ? blockEditor.useBlockProps.save( props ) : useBlockProps( props );
	}
	function legacyPropsForSave( a ) {
		return blockEditor.useBlockProps.save( {
			style: legacyStyleFor( a ),
			'data-content-width': a.contentWidth || 'standard', 'data-min-height': a.minHeight || 'auto', 'data-vertical-align': a.verticalAlign || 'center', 'data-horizontal-align': a.horizontalAlign || 'left', 'data-padding-y': a.paddingY || 'standard', 'data-padding-x': a.paddingX || 'small', 'data-border-radius': a.borderRadius || 'none', 'data-overflow': a.overflow || 'hidden', 'data-background-style': a.backgroundStyle || 'mesh', 'data-content-overlay': a.contentOverlay || 'none',
		} );
	}
	function palette( label, value, onChange ) { return el( element.Fragment, null, el( 'p', null, label ), el( ColorPalette, { value: value, clearable: false, onChange: onChange } ) ); }
	const attributes = {
		contentWidth: { type: 'string', default: 'standard' }, minHeight: { type: 'string', default: 'auto' }, verticalAlign: { type: 'string', default: 'center' }, horizontalAlign: { type: 'string', default: 'left' }, paddingY: { type: 'string', default: 'standard' }, paddingX: { type: 'string', default: 'small' }, borderRadius: { type: 'string', default: 'none' }, overflow: { type: 'string', default: 'hidden' },
		useOuterContentWidth: { type: 'boolean', default: false }, innerContentWidth: { type: 'number', default: 0 },
		useOuterPadding: { type: 'boolean', default: false }, paddingVerticalPc: { type: 'number', default: 0 }, paddingHorizontalPc: { type: 'number', default: 0 }, paddingVerticalTablet: { type: 'number', default: 0 }, paddingHorizontalTablet: { type: 'number', default: 0 }, paddingVerticalMobile: { type: 'number', default: 0 }, paddingHorizontalMobile: { type: 'number', default: 0 },
		useOuterMinHeight: { type: 'boolean', default: false }, minHeightPc: { type: 'number', default: 0 }, minHeightTablet: { type: 'number', default: 0 }, minHeightMobile: { type: 'number', default: 0 },
		useOuterBorder: { type: 'boolean', default: false }, borderStyle: { type: 'string', default: 'solid' }, borderWidth: { type: 'number', default: 0 }, borderColor: { type: 'string', default: '#dddddd' }, outerBorderRadius: { type: 'number', default: 0 },
		topDividerType: { type: 'string', default: 'none' }, topDividerColor: { type: 'string', default: '#ffffff' }, topDividerHeight: { type: 'number', default: 80 }, topDividerFlip: { type: 'boolean', default: false }, topDividerCloudDensity: { type: 'number', default: 2 }, topDividerDirection: { type: 'string', default: 'inward' }, topDividerShapeWidth: { type: 'number', default: 100 }, topDividerZigzagCount: { type: 'number', default: 6 },
		bottomDividerType: { type: 'string', default: 'none' }, bottomDividerColor: { type: 'string', default: '#ffffff' }, bottomDividerHeight: { type: 'number', default: 80 }, bottomDividerFlip: { type: 'boolean', default: false }, bottomDividerCloudDensity: { type: 'number', default: 2 }, bottomDividerDirection: { type: 'string', default: 'inward' }, bottomDividerShapeWidth: { type: 'number', default: 100 }, bottomDividerZigzagCount: { type: 'number', default: 6 },
			backgroundStyle: { type: 'string', default: 'mesh' }, colorPreset: { type: 'string', default: 'mist' }, colorCount: { type: 'number', default: 3 }, baseColor: { type: 'string', default: '#f8fafc' }, color1: { type: 'string', default: '#bfdbfe' }, color2: { type: 'string', default: '#ddd6fe' }, color3: { type: 'string', default: '#fbcfe8' }, color4: { type: 'string', default: '#fde68a' }, color5: { type: 'string', default: '#bbf7d0' }, intensity: { type: 'string', default: 'soft' }, blurLevel: { type: 'string', default: 'normal' }, spotSize: { type: 'string', default: 'large' }, positionPreset: { type: 'string', default: 'balanced' }, spotPositions: { type: 'array', default: DEFAULT_POSITIONS }, brightness: { type: 'string', default: 'normal' }, saturation: { type: 'string', default: 'normal' }, centerSpace: { type: 'string', default: 'normal' }, contentOverlay: { type: 'string', default: 'none' }, designPreset: { type: 'string', default: 'custom' }, presentationLevel: { type: 'string', default: 'basic' }, compositionPreset: { type: 'string', default: 'custom' }, patternColor: { type: 'string', default: '#64748b' }, patternOpacity: { type: 'number', default: 20 }, patternDensity: { type: 'number', default: 50 }, patternAngle: { type: 'number', default: 45 }, patternPlacement: { type: 'string', default: 'center' }, patternSeed: { type: 'number', default: 1729 }, generatedPatternSize: { type: 'string', default: 'normal' }, generatedPatternVariation: { type: 'string', default: 'normal' }, generatedPatternBalance: { type: 'string', default: 'balanced' }, generatedPatternCharacter: { type: 'string', default: '' }, geometryType: { type: 'string', default: 'diagonal' }, bokehShape: { type: 'string', default: 'circle' }, bokehAutoShades: { type: 'boolean', default: true }, bokehSize: { type: 'string', default: 'normal' }, bokehBlur: { type: 'string', default: 'normal' }, bokehBalance: { type: 'string', default: 'balanced' }, bokehSizeVariation: { type: 'number', default: 70 }, bokehDots: { type: 'array', default: DEFAULT_BOKEH_DOTS }, backgroundMotion: { type: 'string', default: 'none' }, motionSpeed: { type: 'string', default: 'slow' }, motionStrength: { type: 'string', default: 'subtle' }, motionMobile: { type: 'string', default: 'static' },
	};
	const legacyAttributes = Object.assign( {}, attributes, {
		spotPositions: { type: 'array', default: [ { x: 16, y: 18, size: 100 }, { x: 84, y: 24, size: 96 }, { x: 55, y: 84, size: 104 }, { x: 18, y: 76, size: 82 }, { x: 84, y: 76, size: 86 } ] },
	} );

	blocks.registerBlockType( 'cni-blocks/generated-background-plus', {
		apiVersion: 3,
		title: __( '背景生成+', 'cni-blocks' ),
		icon: 'art',
		category: 'cni-blocks',
		description: __( '画像を使わず、メッシュグラデーションやぼかしスポットの背景を作るセクションです。', 'cni-blocks' ),
		keywords: [ __( '背景', 'cni-blocks' ), __( 'グラデーション', 'cni-blocks' ), __( 'メッシュ', 'cni-blocks' ) ],
		attributes: attributes,
		supports: { align: [ 'wide', 'full' ], anchor: true, html: false },
		deprecated: [ {
			attributes: legacyAttributes,
			save: function( props ) {
				const a = props.attributes;
				return el( 'section', legacyPropsForSave( a ), el( 'div', { className: 'cni-generated-background-plus__background', 'aria-hidden': 'true' } ), el( 'div', { className: 'cni-generated-background-plus__inner' }, el( InnerBlocks.Content ) ) );
			},
		} ],
		edit: function( props ) {
			const a = props.attributes;
			const set = props.setAttributes;
			const settingsPalette = useSettings( 'color.palette' )[ 0 ];
			const colorPalette = Array.isArray( settingsPalette ) && settingsPalette.length ? settingsPalette : undefined;
			const currentLayout = layoutValues( a );
			const isSpotStyle = a.backgroundStyle === 'mesh' || a.backgroundStyle === 'spots';
			const isBokehStyle = a.backgroundStyle === 'bokeh';
			const generatedPatternStyles = [ 'pixel-wave', 'soft-polygons', 'confetti', 'rings', 'flow-lines', 'halftone', 'tile-geometry', 'fluid-shapes' ];
			const isGeneratedPatternStyle = generatedPatternStyles.indexOf( a.backgroundStyle ) !== -1;
			const usesPlacement = isSpotStyle || isBokehStyle || isGeneratedPatternStyle;
			const supportsPatternMotion = [ 'dots', 'grid', 'waves', 'geometry', 'pixel-wave', 'soft-polygons', 'confetti', 'rings', 'flow-lines', 'halftone', 'tile-geometry' ].indexOf( a.backgroundStyle ) !== -1;
			const motionOptions = [ { label: __( 'なし（静止）', 'cni-blocks' ), value: 'none' }, { label: __( '光のにじみ移動', 'cni-blocks' ), value: 'glow-drift' } ];
			if ( isSpotStyle ) motionOptions.splice( 1, 0, { label: __( '環境的：ブラースポット呼吸', 'cni-blocks' ), value: 'spot-breathe' }, { label: __( '色彩の呼吸', 'cni-blocks' ), value: 'color-breathe' }, { label: __( 'フォーカス移動', 'cni-blocks' ), value: 'focus-shift' } );
			if ( isBokehStyle ) motionOptions.splice( 1, 0, { label: __( 'ぼかしドット：漂う', 'cni-blocks' ), value: 'bokeh-float' }, { label: __( 'ぼかしドット：呼吸', 'cni-blocks' ), value: 'bokeh-breathe' }, { label: __( 'ぼかしドット：ゆらぐ', 'cni-blocks' ), value: 'bokeh-wobble' } );
			if ( a.backgroundStyle === 'rings' ) motionOptions.splice( 1, 0, { label: __( '波紋が広がる', 'cni-blocks' ), value: 'ring-ripple' } );
			if ( a.backgroundStyle === 'fluid-shapes' ) motionOptions.splice( 1, 0, { label: __( '流体シェイプ：ゆらぐ', 'cni-blocks' ), value: 'fluid-morph' } );
			if ( supportsPatternMotion ) motionOptions.splice( 1, 0, { label: __( 'パターン背景の移動', 'cni-blocks' ), value: 'pattern-slide' } );
			const select = function( label, key, fallback, options ) { return el( SelectControl, { label: label, value: a[ key ] || fallback, options: options, onChange: function( value ) { const next = {}; next[ key ] = value; set( next ); } } ); };
			const applyColorPreset = function( preset ) { set( Object.assign( { colorPreset: preset }, COLOR_PRESETS[ preset ] || COLOR_PRESETS.mist ) ); };
			const updatePlacement = function( value ) { set( { positionPreset: value, spotPositions: generatedPositions( value ) } ); };
			const updatePadding = function( key, value ) { const next = { useOuterPadding: true }; [ 'paddingVerticalPc', 'paddingHorizontalPc', 'paddingVerticalTablet', 'paddingHorizontalTablet', 'paddingVerticalMobile', 'paddingHorizontalMobile' ].forEach( function( layoutKey ) { next[ layoutKey ] = layoutKey === key ? ( typeof value === 'number' ? value : 0 ) : currentLayout[ layoutKey ]; } ); set( next ); };
			const updateMinHeight = function( key, value ) { const next = { useOuterMinHeight: true, minHeightPc: currentLayout.minHeightPc, minHeightTablet: currentLayout.minHeightTablet, minHeightMobile: currentLayout.minHeightMobile }; next[ key ] = typeof value === 'number' ? value : 0; set( next ); };
			const updateBorder = function( next ) { set( Object.assign( { useOuterBorder: true }, next ) ); };
			const generatedCharacterConfig = function( style ) {
				const configs = {
					'pixel-wave': { label: __( '波の強さ', 'cni-blocks' ), options: [ { label: __( '標準', 'cni-blocks' ), value: '' }, { label: __( 'ゆるい', 'cni-blocks' ), value: 'calm' }, { label: __( '強い', 'cni-blocks' ), value: 'strong' } ] },
					'soft-polygons': { label: __( '形の比率', 'cni-blocks' ), options: [ { label: __( '標準', 'cni-blocks' ), value: '' }, { label: __( '細長め', 'cni-blocks' ), value: 'slender' }, { label: __( 'ワイド', 'cni-blocks' ), value: 'wide' } ] },
					confetti: { label: __( '図形の種類', 'cni-blocks' ), options: [ { label: __( 'ミックス', 'cni-blocks' ), value: '' }, { label: __( 'ドット中心', 'cni-blocks' ), value: 'dots' }, { label: __( '線中心', 'cni-blocks' ), value: 'lines' } ] },
					rings: { label: __( 'リングの表情', 'cni-blocks' ), options: [ { label: __( 'リング中心', 'cni-blocks' ), value: '' }, { label: __( 'ドット中心', 'cni-blocks' ), value: 'dots' }, { label: __( '太め', 'cni-blocks' ), value: 'bold' }, { label: __( '波紋', 'cni-blocks' ), value: 'ripple' } ] },
					'flow-lines': { label: __( '線の表情', 'cni-blocks' ), options: [ { label: __( '標準', 'cni-blocks' ), value: '' }, { label: __( '穏やか', 'cni-blocks' ), value: 'calm' }, { label: __( '動きあり', 'cni-blocks' ), value: 'dynamic' } ] },
					'fluid-shapes': { label: __( 'シェイプの表情', 'cni-blocks' ), options: [ { label: __( 'やわらかい', 'cni-blocks' ), value: '' }, { label: __( '丸み強め', 'cni-blocks' ), value: 'round' }, { label: __( '有機的', 'cni-blocks' ), value: 'organic' } ] },
					halftone: { label: __( '濃淡差', 'cni-blocks' ), options: [ { label: __( '標準', 'cni-blocks' ), value: '' }, { label: __( 'やわらかい', 'cni-blocks' ), value: 'soft' }, { label: __( 'くっきり', 'cni-blocks' ), value: 'strong' } ] },
					'tile-geometry': { label: __( '面の量', 'cni-blocks' ), options: [ { label: __( '標準', 'cni-blocks' ), value: '' }, { label: __( '少なめ', 'cni-blocks' ), value: 'sparse' }, { label: __( '多め', 'cni-blocks' ), value: 'filled' } ] },
				};
				return configs[ style ] || null;
			};
			const characterConfig = generatedCharacterConfig( a.backgroundStyle );
			const applyDesignPreset = function( value ) {
				if ( ! DESIGN_PRESETS[ value ] ) { set( { designPreset: 'custom' } ); return; }
				const next = Object.assign( { designPreset: value, presentationLevel: value === 'cta' ? 'hero' : 'impression', compositionPreset: value === 'corporate' || value === 'tech' ? 'left' : ( value === 'cta' ? 'center' : 'surround' ) }, DESIGN_PRESETS[ value ] );
				if ( next.backgroundStyle === 'bokeh' ) next.bokehDots = generatedBokehDots( next.bokehShape || 'circle', a.bokehSizeVariation );
				set( next );
			};
			const applyPresentationLevel = function( value ) {
				const levels = {
					basic: { presentationLevel: 'basic', intensity: 'soft', saturation: 'normal', patternOpacity: 20, contentOverlay: 'none', backgroundMotion: 'none' },
					impression: { presentationLevel: 'impression', intensity: 'normal', saturation: 'normal', patternOpacity: 30, contentOverlay: 'light' },
					hero: { presentationLevel: 'hero', intensity: 'normal', saturation: 'vivid', patternOpacity: 38, centerSpace: 'clear', contentOverlay: 'light', useOuterMinHeight: true, minHeightPc: Math.max( 520, currentLayout.minHeightPc ), minHeightTablet: Math.max( 420, currentLayout.minHeightTablet ), minHeightMobile: Math.max( 360, currentLayout.minHeightMobile ) },
				};
				set( Object.assign( { designPreset: 'custom' }, levels[ value ] || levels.basic ) );
			};
			const applyCompositionPreset = function( value ) {
				if ( ! COMPOSITION_PRESETS[ value ] ) { set( { compositionPreset: 'custom' } ); return; }
				const next = Object.assign( { compositionPreset: value, designPreset: 'custom' }, COMPOSITION_PRESETS[ value ] );
				if ( a.backgroundStyle === 'mesh' || a.backgroundStyle === 'spots' ) next.spotPositions = generatedPositions( next.positionPreset );
				set( next );
			};
			return el( element.Fragment, null,
				el( InspectorControls, null,
					el( PanelBody, { title: __( 'デザインプリセット', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( 'デザイン意図', 'cni-blocks' ), value: a.designPreset || 'custom', help: __( '用途に合う背景・配色・構図をまとめて適用します。適用後は個別に調整できます。', 'cni-blocks' ), options: [ { label: __( 'カスタム（指定なし）', 'cni-blocks' ), value: 'custom' }, { label: __( '信頼感・法人（おすすめ）', 'cni-blocks' ), value: 'corporate' }, { label: __( '上質・美容', 'cni-blocks' ), value: 'beauty' }, { label: __( '親しみ・店舗／子育て', 'cni-blocks' ), value: 'friendly' }, { label: __( '先進的・IT', 'cni-blocks' ), value: 'tech' }, { label: __( 'キャンペーン／CTA', 'cni-blocks' ), value: 'cta' } ], onChange: applyDesignPreset } ),
						el( SelectControl, { label: __( '演出レベル', 'cni-blocks' ), value: a.presentationLevel || 'basic', options: [ { label: __( '基本：本文・通常セクション向け', 'cni-blocks' ), value: 'basic' }, { label: __( '印象：サービス紹介・導線向け', 'cni-blocks' ), value: 'impression' }, { label: __( '主役：ファーストビュー・CTA向け', 'cni-blocks' ), value: 'hero' } ], onChange: applyPresentationLevel } ),
						el( SelectControl, { label: __( '構図', 'cni-blocks' ), value: a.compositionPreset || 'custom', options: [ { label: __( 'カスタム', 'cni-blocks' ), value: 'custom' }, { label: __( '中央に文章', 'cni-blocks' ), value: 'center' }, { label: __( '左に文章・右に装飾', 'cni-blocks' ), value: 'left' }, { label: __( '右に文章・左に装飾', 'cni-blocks' ), value: 'right' }, { label: __( '上に文章・下に装飾', 'cni-blocks' ), value: 'top' }, { label: __( '周囲を装飾・中央を明るく抜く', 'cni-blocks' ), value: 'surround' } ], onChange: applyCompositionPreset } )
					),
					el( PanelBody, { title: __( '背景生成', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( 'スタイル', 'cni-blocks' ), value: a.backgroundStyle || 'mesh', options: [ { label: __( 'ソフトメッシュ', 'cni-blocks' ), value: 'mesh' }, { label: __( 'ブラースポット', 'cni-blocks' ), value: 'spots' }, { label: __( 'ぼかしドット', 'cni-blocks' ), value: 'bokeh' }, { label: __( 'ソフトポリゴン', 'cni-blocks' ), value: 'soft-polygons' }, { label: __( 'ピクセルウェーブ', 'cni-blocks' ), value: 'pixel-wave' }, { label: __( 'コンフェッティ', 'cni-blocks' ), value: 'confetti' }, { label: __( 'リング／輪郭ドット', 'cni-blocks' ), value: 'rings' }, { label: __( '流線・曲線', 'cni-blocks' ), value: 'flow-lines' }, { label: __( '流体シェイプ', 'cni-blocks' ), value: 'fluid-shapes' }, { label: __( 'ハーフトーン', 'cni-blocks' ), value: 'halftone' }, { label: __( 'タイル幾何学', 'cni-blocks' ), value: 'tile-geometry' }, { label: __( 'ノイズ', 'cni-blocks' ), value: 'noise' }, { label: __( 'ドット', 'cni-blocks' ), value: 'dots' }, { label: __( 'グリッド', 'cni-blocks' ), value: 'grid' }, { label: __( '波形', 'cni-blocks' ), value: 'waves' }, { label: __( '幾何学模様', 'cni-blocks' ), value: 'geometry' } ], onChange: function( value ) { const generated = generatedPatternStyles.indexOf( value ) !== -1; const placement = value === 'pixel-wave' ? 'center' : ( value === 'halftone' ? 'right' : ( value === 'flow-lines' ? 'horizontal' : a.patternPlacement ) ); set( { backgroundStyle: value || 'mesh', backgroundMotion: 'none', generatedPatternCharacter: '', patternPlacement: placement, baseColor: value === 'bokeh' || generated ? '#ffffff' : a.baseColor, patternColor: ( value === 'bokeh' || generated ) && a.patternColor === '#64748b' ? '#38bdf8' : a.patternColor } ); } } ),
						isSpotStyle ? el( SelectControl, { label: __( '配色プリセット', 'cni-blocks' ), value: a.colorPreset || 'mist', options: [ { label: __( 'ミスト', 'cni-blocks' ), value: 'mist' }, { label: __( 'ブルーム', 'cni-blocks' ), value: 'bloom' }, { label: __( 'クール', 'cni-blocks' ), value: 'cool' }, { label: __( 'ウォーム', 'cni-blocks' ), value: 'warm' }, { label: __( 'モノトーン', 'cni-blocks' ), value: 'mono' }, { label: __( 'カスタム', 'cni-blocks' ), value: 'custom' } ], onChange: function( value ) { if ( value !== 'custom' ) applyColorPreset( value ); else set( { colorPreset: 'custom' } ); } } ) : null,
						isSpotStyle ? el( SelectControl, { label: __( '色数', 'cni-blocks' ), value: String( a.colorCount || 3 ), options: [ { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' } ], onChange: function( value ) { set( { colorCount: parseInt( value, 10 ) || 3 } ); } } ) : null,
						palette( __( 'ベース背景色', 'cni-blocks' ), a.baseColor, function( value ) { set( { baseColor: value || '#f8fafc', colorPreset: 'custom' } ); } ),
						isSpotStyle ? [ 1, 2, 3, 4, 5 ].slice( 0, typeof a.colorCount === 'number' ? a.colorCount : 3 ).map( function( index ) { return el( 'div', { key: 'color-' + index }, palette( __( 'カラー', 'cni-blocks' ) + index, a[ 'color' + index ], function( value ) { const next = { colorPreset: 'custom' }; next[ 'color' + index ] = value || COLOR_PRESETS.mist[ 'color' + index ]; set( next ); } ) ); } ) : el( element.Fragment, null,
							palette( isBokehStyle ? __( '図形の色', 'cni-blocks' ) : __( '模様色', 'cni-blocks' ), a.patternColor, function( value ) { set( { patternColor: value || ( isBokehStyle ? '#ec4899' : '#64748b' ) } ); } ),
							el( RangeControl, { label: isBokehStyle ? __( '図形の濃さ（%）', 'cni-blocks' ) : __( '模様の濃さ（%）', 'cni-blocks' ), value: numberInRange( a.patternOpacity, 5, 80, 20 ), min: 5, max: 80, onChange: function( value ) { set( { patternOpacity: numberInRange( value, 5, 80, 20 ) } ); } } ),
							el( RangeControl, { label: isBokehStyle ? __( '図形の数', 'cni-blocks' ) : __( '密度', 'cni-blocks' ), value: numberInRange( a.patternDensity, 10, 100, 50 ), min: 10, max: 100, onChange: function( value ) { set( { patternDensity: numberInRange( value, 10, 100, 50 ) } ); } } ),
							isBokehStyle ? el( element.Fragment, null,
								el( SelectControl, { label: __( '図形の形', 'cni-blocks' ), value: a.bokehShape || 'circle', options: [ { label: __( '丸', 'cni-blocks' ), value: 'circle' }, { label: __( '四角', 'cni-blocks' ), value: 'square' }, { label: __( '三角', 'cni-blocks' ), value: 'triangle' }, { label: __( '混在', 'cni-blocks' ), value: 'mixed' } ], onChange: function( value ) { const shape = value || 'circle'; set( { bokehShape: shape, bokehDots: generatedBokehDots( shape, a.bokehSizeVariation ) } ); } } ),
								el( ToggleControl, { label: __( '同系色を自動で混ぜる', 'cni-blocks' ), checked: a.bokehAutoShades !== false, help: __( '選択色を基準に、明るさの異なる近い色を混ぜます。', 'cni-blocks' ), onChange: function( value ) { set( { bokehAutoShades: !! value } ); } } ),
								el( SelectControl, { label: __( 'ドットサイズ', 'cni-blocks' ), value: a.bokehSize || 'normal', options: [ { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '大', 'cni-blocks' ), value: 'large' } ], onChange: function( value ) { set( { bokehSize: value || 'normal' } ); } } ),
								el( SelectControl, { label: __( 'ぼかし度', 'cni-blocks' ), value: a.bokehBlur || 'normal', options: [ { label: __( '弱い', 'cni-blocks' ), value: 'weak' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '強い', 'cni-blocks' ), value: 'strong' } ], onChange: function( value ) { set( { bokehBlur: value || 'normal' } ); } } ),
								el( SelectControl, { label: __( '配置バランス', 'cni-blocks' ), value: a.bokehBalance || 'balanced', options: [ { label: __( '均等', 'cni-blocks' ), value: 'balanced' }, { label: __( '左寄り', 'cni-blocks' ), value: 'left' }, { label: __( '右寄り', 'cni-blocks' ), value: 'right' }, { label: __( '上寄り', 'cni-blocks' ), value: 'top' }, { label: __( '下寄り', 'cni-blocks' ), value: 'bottom' } ], onChange: function( value ) { set( { bokehBalance: value || 'balanced' } ); } } ),
								el( RangeControl, { label: __( '大きさのばらつき', 'cni-blocks' ), value: numberInRange( a.bokehSizeVariation, 0, 100, 70 ), min: 0, max: 100, onChange: function( value ) { set( { bokehSizeVariation: numberInRange( value, 0, 100, 70 ) } ); } } )
							) : null,
							isGeneratedPatternStyle ? el( element.Fragment, null,
								el( ToggleControl, { label: __( '同系色を自動で混ぜる', 'cni-blocks' ), checked: a.bokehAutoShades !== false, help: __( '選択色を基準に、明るさの異なる近い色を混ぜます。', 'cni-blocks' ), onChange: function( value ) { set( { bokehAutoShades: !! value } ); } } ),
								el( SelectControl, { label: __( '模様の大きさ', 'cni-blocks' ), value: a.generatedPatternSize || 'normal', options: [ { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '大', 'cni-blocks' ), value: 'large' } ], onChange: function( value ) { set( { generatedPatternSize: value || 'normal' } ); } } ),
								el( SelectControl, { label: __( 'ばらつき', 'cni-blocks' ), value: a.generatedPatternVariation || 'normal', options: [ { label: __( '控えめ', 'cni-blocks' ), value: 'low' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '大きめ', 'cni-blocks' ), value: 'high' } ], onChange: function( value ) { set( { generatedPatternVariation: value || 'normal' } ); } } ),
								el( SelectControl, { label: __( '配置バランス', 'cni-blocks' ), value: a.generatedPatternBalance || 'balanced', options: [ { label: __( '均等', 'cni-blocks' ), value: 'balanced' }, { label: __( '左寄り', 'cni-blocks' ), value: 'left' }, { label: __( '右寄り', 'cni-blocks' ), value: 'right' }, { label: __( '上寄り', 'cni-blocks' ), value: 'top' }, { label: __( '下寄り', 'cni-blocks' ), value: 'bottom' }, { label: __( '中央控えめ', 'cni-blocks' ), value: 'center' } ], onChange: function( value ) { set( { generatedPatternBalance: value || 'balanced' } ); } } ),
								( a.backgroundStyle === 'pixel-wave' || a.backgroundStyle === 'halftone' || a.backgroundStyle === 'flow-lines' ) ? el( SelectControl, { label: a.backgroundStyle === 'pixel-wave' ? __( '帯の位置', 'cni-blocks' ) : ( a.backgroundStyle === 'halftone' ? __( '濃くする方向', 'cni-blocks' ) : __( '流れる方向', 'cni-blocks' ) ), value: a.patternPlacement || ( a.backgroundStyle === 'pixel-wave' ? 'center' : ( a.backgroundStyle === 'flow-lines' ? 'horizontal' : 'right' ) ), options: a.backgroundStyle === 'pixel-wave' ? [ { label: __( '上', 'cni-blocks' ), value: 'top' }, { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '下', 'cni-blocks' ), value: 'bottom' } ] : ( a.backgroundStyle === 'flow-lines' ? [ { label: __( '横方向', 'cni-blocks' ), value: 'horizontal' }, { label: __( '斜め上', 'cni-blocks' ), value: 'up' }, { label: __( '斜め下', 'cni-blocks' ), value: 'down' } ] : [ { label: __( '左', 'cni-blocks' ), value: 'left' }, { label: __( '右', 'cni-blocks' ), value: 'right' }, { label: __( '上', 'cni-blocks' ), value: 'top' }, { label: __( '下', 'cni-blocks' ), value: 'bottom' } ] ), onChange: function( value ) { set( { patternPlacement: value } ); } } ) : null,
								characterConfig ? el( SelectControl, { label: characterConfig.label, value: a.generatedPatternCharacter || '', options: characterConfig.options, onChange: function( value ) { set( { generatedPatternCharacter: value } ); } } ) : null
							) : null,
							( a.backgroundStyle === 'grid' || a.backgroundStyle === 'waves' || a.backgroundStyle === 'geometry' ) ? el( RangeControl, { label: __( '角度（°）', 'cni-blocks' ), value: numberInRange( a.patternAngle, 0, 360, 45 ), min: 0, max: 360, step: 5, onChange: function( value ) { set( { patternAngle: numberInRange( value, 0, 360, 45 ) } ); } } ) : null, a.backgroundStyle === 'geometry' ? el( SelectControl, { label: __( '模様の種類', 'cni-blocks' ), value: a.geometryType || 'diagonal', options: [ { label: __( '斜線', 'cni-blocks' ), value: 'diagonal' }, { label: __( '三角形', 'cni-blocks' ), value: 'triangles' }, { label: __( '六角形', 'cni-blocks' ), value: 'hexagon' } ], onChange: function( value ) { set( { geometryType: value || 'diagonal' } ); } } ) : null ),
						isSpotStyle ? select( __( '強さ', 'cni-blocks' ), 'intensity', 'soft', [ { label: __( '淡い', 'cni-blocks' ), value: 'soft' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '濃い', 'cni-blocks' ), value: 'strong' } ] ) : null,
						isSpotStyle ? select( __( 'ぼかし感', 'cni-blocks' ), 'blurLevel', 'normal', [ { label: __( 'やわらかい', 'cni-blocks' ), value: 'soft' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( 'はっきり', 'cni-blocks' ), value: 'clear' } ] ) : null,
						isSpotStyle ? select( __( 'スポットサイズ', 'cni-blocks' ), 'spotSize', 'large', [ { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '大', 'cni-blocks' ), value: 'large' } ] ) : null
					),
					el( PanelBody, { title: __( '見た目の調整', 'cni-blocks' ), initialOpen: false },
						select( __( '明るさ', 'cni-blocks' ), 'brightness', 'normal', [ { label: __( '明るい', 'cni-blocks' ), value: 'light' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '暗い', 'cni-blocks' ), value: 'dark' } ] ),
						select( __( '彩度', 'cni-blocks' ), 'saturation', 'normal', [ { label: __( '落ち着いた', 'cni-blocks' ), value: 'muted' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '鮮やか', 'cni-blocks' ), value: 'vivid' } ] ),
						select( __( '中央の余白', 'cni-blocks' ), 'centerSpace', 'normal', [ { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '明るく抜く', 'cni-blocks' ), value: 'clear' }, { label: __( '色を広げる', 'cni-blocks' ), value: 'colored' } ] ),
						select( __( '可読性用の薄い幕', 'cni-blocks' ), 'contentOverlay', 'none', [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '明るくする', 'cni-blocks' ), value: 'light' }, { label: __( '暗くする', 'cni-blocks' ), value: 'dark' } ] )
					),
					el( PanelBody, { title: __( '背景モーション', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, { label: __( '動き', 'cni-blocks' ), value: a.backgroundMotion || 'none', options: motionOptions, help: __( '控えめな動きにし、本文の可読性を優先します。', 'cni-blocks' ), onChange: function( value ) { set( { backgroundMotion: value || 'none' } ); } } ),
						a.backgroundMotion && a.backgroundMotion !== 'none' ? el( element.Fragment, null,
							el( SelectControl, { label: __( '速度', 'cni-blocks' ), value: a.motionSpeed || 'slow', options: [ { label: __( 'ゆっくり', 'cni-blocks' ), value: 'slow' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( 'とてもゆっくり', 'cni-blocks' ), value: 'verySlow' } ], onChange: function( value ) { set( { motionSpeed: value || 'slow' } ); } } ),
							el( SelectControl, { label: __( '動きの大きさ', 'cni-blocks' ), value: a.motionStrength || 'subtle', options: [ { label: __( '控えめ', 'cni-blocks' ), value: 'subtle' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' } ], onChange: function( value ) { set( { motionStrength: value || 'subtle' } ); } } ),
							el( SelectControl, { label: __( 'モバイル', 'cni-blocks' ), value: a.motionMobile || 'static', options: [ { label: __( '静止表示（推奨）', 'cni-blocks' ), value: 'static' }, { label: __( '同じ動き', 'cni-blocks' ), value: 'same' } ], onChange: function( value ) { set( { motionMobile: value || 'static' } ); } } )
						) : null
					),
					usesPlacement ? el( PanelBody, { title: __( '配置', 'cni-blocks' ), initialOpen: false },
						isSpotStyle ? el( SelectControl, { label: __( '配置', 'cni-blocks' ), value: a.positionPreset || 'balanced', options: [ { label: __( 'バランス', 'cni-blocks' ), value: 'balanced' }, { label: __( '左寄り', 'cni-blocks' ), value: 'left' }, { label: __( '右寄り', 'cni-blocks' ), value: 'right' }, { label: __( '上寄り', 'cni-blocks' ), value: 'top' }, { label: __( '下寄り', 'cni-blocks' ), value: 'bottom' }, { label: __( 'ランダム', 'cni-blocks' ), value: 'random' } ], onChange: updatePlacement } ) : null,
						el( Button, { variant: 'secondary', onClick: function() { set( isBokehStyle ? { bokehDots: generatedBokehDots( a.bokehShape, a.bokehSizeVariation ) } : ( isGeneratedPatternStyle ? { patternSeed: generatedPatternSeed() } : { positionPreset: 'random', spotPositions: generatedPositions( 'random' ) } ) ); } }, __( '配置を再生成', 'cni-blocks' ) )
					) : null,
					el( PanelBody, { title: __( 'レイアウト', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, { label: __( '内側コンテンツの幅', 'cni-blocks' ), value: currentLayout.contentWidth > 0 ? 'limited' : 'full', options: [ { label: __( '幅制限なし', 'cni-blocks' ), value: 'full' }, { label: __( '内側最大幅を指定', 'cni-blocks' ), value: 'limited' } ], help: __( 'ブロック自体の通常幅・幅広・全幅は、ブロック上部の配置ツールから選択します。', 'cni-blocks' ), onChange: function( value ) { set( { useOuterContentWidth: true, innerContentWidth: value === 'limited' ? ( currentLayout.contentWidth || 1200 ) : 0 } ); } } ),
						currentLayout.contentWidth > 0 ? el( RangeControl, { label: __( '内側コンテンツ最大幅（px）', 'cni-blocks' ), value: currentLayout.contentWidth, min: 320, max: 1920, step: 10, onChange: function( value ) { set( { useOuterContentWidth: true, innerContentWidth: typeof value === 'number' ? value : 1200 } ); } } ) : null
					),
					el( PanelBody, { title: __( '区切り', 'cni-blocks' ), initialOpen: false },
						el( 'p', { className: 'cni-generated-background-plus__control-help' }, __( '隣接するセクションの背景色を指定すると、自然につながって見えます。', 'cni-blocks' ) ),
						dividerSettingsControl( 'top', a, set, colorPalette ),
						dividerSettingsControl( 'bottom', a, set, colorPalette )
					),
					el( PanelBody, { title: __( '内側余白', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'PC 上下余白（px）', 'cni-blocks' ), value: currentLayout.paddingVerticalPc, min: 0, max: 240, onChange: function( value ) { updatePadding( 'paddingVerticalPc', value ); } } ),
						el( RangeControl, { label: __( 'PC 左右余白（px）', 'cni-blocks' ), value: currentLayout.paddingHorizontalPc, min: 0, max: 160, onChange: function( value ) { updatePadding( 'paddingHorizontalPc', value ); } } ),
						el( RangeControl, { label: __( 'タブレット 上下余白（px）', 'cni-blocks' ), value: currentLayout.paddingVerticalTablet, min: 0, max: 240, onChange: function( value ) { updatePadding( 'paddingVerticalTablet', value ); } } ),
						el( RangeControl, { label: __( 'タブレット 左右余白（px）', 'cni-blocks' ), value: currentLayout.paddingHorizontalTablet, min: 0, max: 160, onChange: function( value ) { updatePadding( 'paddingHorizontalTablet', value ); } } ),
						el( RangeControl, { label: __( 'モバイル 上下余白（px）', 'cni-blocks' ), value: currentLayout.paddingVerticalMobile, min: 0, max: 240, onChange: function( value ) { updatePadding( 'paddingVerticalMobile', value ); } } ),
						el( RangeControl, { label: __( 'モバイル 左右余白（px）', 'cni-blocks' ), value: currentLayout.paddingHorizontalMobile, min: 0, max: 160, onChange: function( value ) { updatePadding( 'paddingHorizontalMobile', value ); } } )
					),
					el( PanelBody, { title: __( '最小高さ', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'PC 最小高さ（px・0で指定なし）', 'cni-blocks' ), value: currentLayout.minHeightPc, min: 0, max: 1200, step: 10, onChange: function( value ) { updateMinHeight( 'minHeightPc', value ); } } ),
						el( RangeControl, { label: __( 'タブレット 最小高さ（px・0で指定なし）', 'cni-blocks' ), value: currentLayout.minHeightTablet, min: 0, max: 1200, step: 10, onChange: function( value ) { updateMinHeight( 'minHeightTablet', value ); } } ),
						el( RangeControl, { label: __( 'モバイル 最小高さ（px・0で指定なし）', 'cni-blocks' ), value: currentLayout.minHeightMobile, min: 0, max: 1200, step: 10, onChange: function( value ) { updateMinHeight( 'minHeightMobile', value ); } } )
					),
					el( PanelBody, { title: __( '枠線・角丸', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, { label: __( '枠線の種類', 'cni-blocks' ), value: currentLayout.borderWidth > 0 ? currentLayout.borderStyle : 'none', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '直線', 'cni-blocks' ), value: 'solid' }, { label: __( '点線', 'cni-blocks' ), value: 'dotted' }, { label: __( '破線', 'cni-blocks' ), value: 'dashed' } ], onChange: function( value ) { updateBorder( value === 'none' ? { borderStyle: 'solid', borderWidth: 0 } : { borderStyle: value, borderWidth: currentLayout.borderWidth || 1 } ); } } ),
						currentLayout.borderWidth > 0 ? el( RangeControl, { label: __( '枠線の太さ（px）', 'cni-blocks' ), value: currentLayout.borderWidth, min: 1, max: 12, onChange: function( value ) { updateBorder( { borderWidth: value || 1 } ); } } ) : null,
						currentLayout.borderWidth > 0 ? el( ColorPalette, { colors: colorPalette, value: currentLayout.borderColor, clearable: false, onChange: function( value ) { updateBorder( { borderColor: value || '#dddddd' } ); } } ) : null,
						el( RangeControl, { label: __( '角丸（px）', 'cni-blocks' ), value: currentLayout.borderRadius, min: 0, max: 80, onChange: function( value ) { updateBorder( { outerBorderRadius: value || 0 } ); } } )
					),
				),
				el( 'section', propsFor( a, false ), el( 'div', { className: 'cni-generated-background-plus__background', 'aria-hidden': 'true' }, motionElements( a ) ), dividerElement( 'top', a ), el( 'div', { className: 'cni-generated-background-plus__inner' }, el( InnerBlocks, { templateLock: false, renderAppender: InnerBlocks.ButtonBlockAppender } ) ), dividerElement( 'bottom', a ) )
			);
		},
		save: function( props ) {
			const a = props.attributes;
			return el( 'section', propsFor( a, true ), el( 'div', { className: 'cni-generated-background-plus__background', 'aria-hidden': 'true' }, motionElements( a ) ), dividerElement( 'top', a ), el( 'div', { className: 'cni-generated-background-plus__inner' }, el( InnerBlocks.Content ) ), dividerElement( 'bottom', a ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

( function( blocks, element, blockEditor, components, data, i18n, richText ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useEffect, useState } = element;
	const { useSelect } = data;
	const { AlignmentToolbar, BlockControls, ColorPalette, InspectorControls, MediaUpload, MediaUploadCheck, RichText, RichTextToolbarButton, useBlockProps } = blockEditor;
	const { Button, ColorPicker, Modal, PanelBody, RangeControl, SelectControl, TextControl, ToolbarDropdownMenu, ToolbarGroup, ToolbarButton } = components;
	const { applyFormat, create, insert, registerFormatType, removeFormat } = richText;
	const inlineColorFormat = 'cni-blocks/heading-inline-color';
	const inlineSizeFormat = 'cni-blocks/heading-inline-size';
	const rubyFormat = 'cni-blocks/heading-ruby';
	const responsiveBreakFormat = 'cni-blocks/heading-responsive-break';
	const isLightning = !! ( window.cniBlocksHeadingPlusConfig && window.cniBlocksHeadingPlusConfig.isLightning );
	/* Kept separately so posts saved before Heading+ gained units, margins,
	 * writing modes, and inline images continue to validate byte-for-byte. */
	const legacyHeadingAttributes = {
		content: { type: 'string', source: 'html', selector: '.cni-heading-plus__text', default: '見出しを入力' }, level: { type: 'number', default: 2 }, fontFamily: { type: 'string', default: '' }, fontWeight: { type: 'string', default: '700' }, fontStyle: { type: 'string', default: 'normal' }, textTransform: { type: 'string', default: 'none' }, fontSizePc: { type: 'number', default: 40 }, fontSizeTablet: { type: 'number', default: 34 }, fontSizeMobile: { type: 'number', default: 28 }, lineHeight: { type: 'number', default: 1.3 }, letterSpacing: { type: 'number', default: 0 }, textColor: { type: 'string', default: '' }, backgroundColor: { type: 'string', default: '' }, alignment: { type: 'string', default: 'left' }, paddingVertical: { type: 'number', default: 0 }, paddingHorizontal: { type: 'number', default: 0 },
	};
	const googleFonts = [ '', 'Noto Sans JP', 'Noto Serif JP', 'M PLUS 1p', 'M PLUS Rounded 1c', 'Zen Kaku Gothic New', 'Zen Maru Gothic', 'Zen Old Mincho', 'Zen Kurenaido', 'Shippori Mincho', 'Kosugi Maru', 'Yuji Boku', 'Kiwi Maru', 'Kaisei Decol', 'Kaisei Opti', 'Mochiy Pop One', 'Klee One', 'Yomogi', 'Yusei Magic', 'Roboto', 'Lato', 'Montserrat', 'Poppins', 'Josefin Sans', 'Quicksand', 'Damion', 'Caveat', 'Cinzel', 'Dancing Script', 'Tangerine' ];
	const fontWeights = {
		'Zen Old Mincho': [ '400', '500', '600', '700', '800' ], 'Shippori Mincho': [ '400', '500', '600', '700', '800' ],
		'Kiwi Maru': [ '300', '400', '500' ], 'Kaisei Decol': [ '400', '500', '700' ], 'Kaisei Opti': [ '400', '500', '700' ],
		'Mochiy Pop One': [ '400' ], 'Zen Kurenaido': [ '400' ], 'Klee One': [ '400', '600' ], 'Yomogi': [ '400' ], 'Yusei Magic': [ '400' ],
		'Kosugi Maru': [ '400' ], 'Yuji Boku': [ '400' ], 'Lato': [ '300', '400', '700', '900' ],
		'Poppins': [ '100', '200', '300', '400', '500', '600', '700', '800', '900' ],
		'Josefin Sans': [ '300', '400', '500', '600', '700' ], 'Quicksand': [ '300', '400', '500', '600', '700' ],
		'Damion': [ '400' ], 'Caveat': [ '400', '500', '600', '700' ], 'Cinzel': [ '400', '500', '600', '700', '800', '900' ],
		'Dancing Script': [ '400', '500', '600', '700' ], 'Tangerine': [ '400', '700' ],
	};
	const loadedFonts = {};

	function numberOr( value, fallback ) { return typeof value === 'number' ? value : fallback; }
	function fontUnit( value ) { return [ 'px', 'rem', 'vh' ].indexOf( value ) !== -1 ? value : 'px'; }
	function fontSizeValue( value, unit, fallback ) { return numberOr( value, fallback ) + fontUnit( unit ); }
	function headingDefaultSizes( tag ) { return { h2: { pc: 32, tablet: 28, mobile: 21 }, h3: { pc: 24, tablet: 22, mobile: 17.5 }, h4: { pc: 20, tablet: 18, mobile: 15.75 }, p: { pc: 1, tablet: 1, mobile: 1 }, span: { pc: 1, tablet: 1, mobile: 1 } }[ tag ] || { pc: 32, tablet: 28, mobile: 21 }; }
	function fontRangeMaximum( unit ) { return unit === 'rem' ? 10 : ( unit === 'vh' ? 30 : 160 ); }
	function fontRangeStep( unit ) { return unit === 'px' ? 0.5 : 0.05; }
	function convertFontSizeUnit( value, fromUnit, toUnit, base ) { const current = numberOr( value, 0 ); if ( fromUnit === toUnit ) return current; const pixels = fromUnit === 'rem' ? current * base : ( fromUnit === 'vh' ? current * ( base === 14 ? 8 : 9 ) : current ); const converted = toUnit === 'rem' ? pixels / base : ( toUnit === 'vh' ? pixels / ( base === 14 ? 8 : 9 ) : pixels ); return Math.round( converted * 100 ) / 100; }
	/* RichText calls onSplit once for the original side and once for the new
	 * side. Return both blocks explicitly: Enter leaves Heading+ above and
	 * creates a standard Paragraph below; Shift+Enter remains a soft <br>. */
	function splitHeading( props, value, isOriginal ) {
		if ( isOriginal ) return blocks.createBlock( 'cni-blocks/heading-plus', Object.assign( {}, props.attributes, { content: value } ) );
		return blocks.createBlock( 'core/paragraph', { content: value } );
	}
	function replaceHeadingBlocks( props, replacementBlocks, indexToSelect, initialPosition ) {
		data.dispatch( 'core/block-editor' ).replaceBlocks( props.clientId, replacementBlocks, indexToSelect, initialPosition );
	}
	function textTag( attributes ) {
		const tag = attributes.tagName || '';
		if ( [ 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ].indexOf( tag ) !== -1 ) return tag;
		return 'h' + ( attributes.level || 2 );
	}
	function inlineImage( attributes ) {
		return attributes.inlineImageUrl ? el( 'img', { className: 'cni-heading-plus__inline-image', src: attributes.inlineImageUrl, alt: attributes.inlineImageAlt || '' } ) : null;
	}
	function loadFont( family ) {
		if ( ! family || loadedFonts[ family ] ) return;
		loadedFonts[ family ] = true;
		const available = fontWeights[ family ] || [ '300', '400', '500', '600', '700', '800', '900' ];
		const weights = available.length === 1 ? '' : ':wght@' + available.join( ';' );
		const link = document.createElement( 'link' );
		link.rel = 'stylesheet';
		link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent( family ).replace( /%20/g, '+' ) + weights + '&display=swap';
		document.head.appendChild( link );
	}
	function styleFor( a ) {
		const style = {
			'--cni-heading-font': a.fontFamily ? '"' + a.fontFamily + '", sans-serif' : 'inherit',
			'--cni-heading-weight': a.fontWeight || '700',
			'--cni-heading-style': a.fontStyle || 'normal',
			'--cni-heading-transform': a.textTransform || 'none',
			'--cni-heading-size-pc': fontSizeValue( a.fontSizePc, a.fontSizeUnitPc, 32 ),
			'--cni-heading-size-tablet': fontSizeValue( a.fontSizeTablet, a.fontSizeUnitTablet, 28 ),
			'--cni-heading-size-mobile': fontSizeValue( a.fontSizeMobile, a.fontSizeUnitMobile, 21 ),
			'--cni-heading-line-height': numberOr( a.lineHeight, 1.3 ),
			'--cni-heading-letter-spacing': numberOr( a.letterSpacing, 0 ) + 'px',
			'--cni-heading-color': a.textColor || 'inherit',
			'--cni-heading-background': a.backgroundColor || 'transparent',
			'--cni-heading-align': a.alignment || 'left',
			'--cni-heading-padding-y': numberOr( a.paddingVertical, 0 ) + 'px',
			'--cni-heading-padding-x': numberOr( a.paddingHorizontal, 0 ) + 'px',
			'--cni-heading-inline-image-size': numberOr( a.inlineImageSize, 1.05 ) + 'em',
			'--cni-heading-vertical-position': [ 'left', 'center', 'right' ].indexOf( a.verticalPosition ) !== -1 ? a.verticalPosition : 'right',
			'--cni-heading-vertical-height': numberOr( a.verticalHeight, 320 ) > 0 ? numberOr( a.verticalHeight, 320 ) + 'px' : 'auto',
		};
		if ( typeof a.marginTop === 'number' ) style[ '--cni-heading-margin-top' ] = a.marginTop + 'px';
		if ( typeof a.marginBottom === 'number' ) style[ '--cni-heading-margin-bottom' ] = a.marginBottom + 'px';
		return style;
	}
	function legacyStyleFor( a ) {
		return {
			'--cni-heading-font': a.fontFamily ? '"' + a.fontFamily + '", sans-serif' : 'inherit',
			'--cni-heading-weight': a.fontWeight || '700',
			'--cni-heading-style': a.fontStyle || 'normal',
			'--cni-heading-transform': a.textTransform || 'none',
			'--cni-heading-size-pc': numberOr( a.fontSizePc, 40 ) + 'px',
			'--cni-heading-size-tablet': numberOr( a.fontSizeTablet, 34 ) + 'px',
			'--cni-heading-size-mobile': numberOr( a.fontSizeMobile, 28 ) + 'px',
			'--cni-heading-line-height': numberOr( a.lineHeight, 1.3 ),
			'--cni-heading-letter-spacing': numberOr( a.letterSpacing, 0 ) + 'px',
			'--cni-heading-color': a.textColor || 'inherit',
			'--cni-heading-background': a.backgroundColor || 'transparent',
			'--cni-heading-align': a.alignment || 'left',
			'--cni-heading-padding-y': numberOr( a.paddingVertical, 0 ) + 'px',
			'--cni-heading-padding-x': numberOr( a.paddingHorizontal, 0 ) + 'px',
		};
	}
	function legacySave( props ) {
		const a = props.attributes;
		const legacyProps = { style: legacyStyleFor( a ) };
		if ( a.fontFamily ) legacyProps[ 'data-google-font' ] = a.fontFamily;
		return el( 'div', blockEditor.useBlockProps.save( legacyProps ), el( RichText.Content, { tagName: 'h' + ( a.level || 2 ), className: 'cni-heading-plus__text', value: a.content } ) );
	}
	function migrateLegacyHeading( attributes ) {
		return Object.assign( {}, attributes, {
			tagName: 'h' + ( attributes.level || 2 ),
			marginTop: 0,
			marginBottom: 0,
			fontSizeUnitPc: 'px',
			fontSizeUnitTablet: 'px',
			fontSizeUnitMobile: 'px',
			inlineImageId: 0,
			inlineImageUrl: '',
			inlineImageAlt: '',
			inlineImagePosition: 'before',
			inlineImageSize: 1.05,
			writingMode: 'horizontal-tb',
			mobileWritingMode: 'horizontal-tb',
			verticalOrientation: 'mixed',
			verticalPosition: 'right',
			verticalHeight: 320,
			legacyLayout: true,
			layoutVersion: 1,
		} );
	}
	function setMarginPreset( props, attribute, value ) { const next = {}; next[ attribute ] = value; if ( props.attributes.legacyLayout ) next.legacyLayout = false; next.layoutVersion = 2; props.setAttributes( next ); }
	function marginControls( props, attribute, label, icon ) {
		const presets = [ [ __( '標準', 'cni-blocks' ), undefined ], [ '0', 0 ], [ 'XXS', 4 ], [ 'XS', 8 ], [ 'S', 16 ], [ 'M', 24 ], [ 'L', 32 ], [ 'XL', 40 ], [ 'XXL', 56 ] ];
		const currentValue = typeof props.attributes[ attribute ] === 'number' ? props.attributes[ attribute ] : undefined;
		return el( ToolbarDropdownMenu, { icon: icon, label: label, controls: presets.map( function( preset ) { return { title: label + '：' + preset[ 0 ], isActive: currentValue === preset[ 1 ], onClick: function() { setMarginPreset( props, attribute, preset[ 1 ] ); } }; } ) } );
	}
	function ResponsiveBreakFormatControl( formatProps ) {
		const isOpenState = useState( false );
		const isOpen = isOpenState[ 0 ];
		const setIsOpen = isOpenState[ 1 ];
		const options = [ 'xs', 'sm', 'md', 'lg', 'xl', 'xxl' ];
		function addBreak( breakpoint ) {
			/* The RichText value retains the active caret. DOM Range objects do not
			 * survive Gutenberg re-renders, so never restore or modify one here. */
			formatProps.onChange( insert( formatProps.value, create( { text: '[br-' + breakpoint + ']' } ) ) );
			setIsOpen( false );
		}
		if ( ! isLightning ) return null;
		return el( element.Fragment, null,
			el( RichTextToolbarButton, { icon: 'editor-break', title: __( '画面幅で改行', 'cni-blocks' ), onClick: function() { setIsOpen( true ); } } ),
			isOpen ? el( Modal, { title: __( '画面幅で改行', 'cni-blocks' ), onRequestClose: function() { setIsOpen( false ); }, className: 'cni-heading-plus__responsive-break-modal' },
				el( 'p', null, __( '現在のカーソル位置にLightningの改行ショートコードを挿入します。', 'cni-blocks' ) ),
				el( 'div', { className: 'cni-heading-plus__responsive-break-options' }, options.map( function( breakpoint ) {
					return el( Button, { key: breakpoint, variant: 'secondary', onClick: function() { addBreak( breakpoint ); } }, '[br-' + breakpoint + ']' );
				} ) )
			) : null
		);
	}
	function propsFor( a, save, editorDevice ) {
		const props = { style: styleFor( a ) };
		if ( a.fontFamily ) props[ 'data-google-font' ] = a.fontFamily;
		if ( a.legacyLayout ) props[ 'data-cni-legacy-layout' ] = 'true';
		if ( ! a.legacyLayout && numberOr( a.layoutVersion, 2 ) >= 2 ) props[ 'data-cni-layout-version' ] = '2';
		if ( [ 'vertical-rl', 'vertical-lr' ].indexOf( a.writingMode ) !== -1 ) {
			props[ 'data-writing-mode' ] = a.writingMode;
			props[ 'data-vertical-position' ] = [ 'left', 'center', 'right' ].indexOf( a.verticalPosition ) !== -1 ? a.verticalPosition : 'right';
		}
		props[ 'data-heading-alignment' ] = a.alignment || 'left';
		if ( a.mobileWritingMode === 'horizontal-tb' ) props[ 'data-mobile-writing-mode' ] = 'horizontal-tb';
		if ( a.verticalOrientation === 'upright' ) props[ 'data-vertical-orientation' ] = 'upright';
		if ( ! save && editorDevice ) props[ 'data-editor-device' ] = editorDevice;
		return save ? blockEditor.useBlockProps.save( props ) : useBlockProps( props );
	}
	function palette( label, value, onChange ) {
		return el( element.Fragment, null, el( 'p', null, label ), el( ColorPalette, { value: value, onChange: onChange, clearable: true } ) );
	}
	/* A Modal is only mounted after a real toolbar button is pressed. Unlike the
	 * former Dropdown implementation, this never leaves empty dropdown elements
	 * in Paragraph or other RichText blocks. */
	function HeadingFormatControl( controlProps ) {
		const [ isOpen, setIsOpen ] = useState( false );

		return el( element.Fragment, null,
			el( RichTextToolbarButton, { icon: controlProps.icon, title: controlProps.title, isActive: controlProps.formatProps.isActive, onClick: function() { setIsOpen( true ); } } ),
			isOpen ? el( Modal, { title: controlProps.title, onRequestClose: function() { setIsOpen( false ); } }, controlProps.renderContent( function() { setIsOpen( false ); } ) ) : null
		);
	}

	registerFormatType( inlineColorFormat, {
		title: __( '部分文字色', 'cni-blocks' ),
		tagName: 'span',
		className: 'cni-heading-plus__inline-color',
		attributes: { style: 'style' },
		edit: function( props ) {
			const activeAttributes = props.activeAttributes || {};
			return el( HeadingFormatControl, { formatProps: props, title: __( '選択文字の色', 'cni-blocks' ), icon: 'art', renderContent: function( close ) {
				const currentColor = activeAttributes.style ? activeAttributes.style.replace( /^color:\s*/, '' ).replace( /;$/, '' ) : undefined;
				const applyColor = function( color, shouldClose ) {
					props.onChange( color ? applyFormat( props.value, { type: inlineColorFormat, attributes: { style: 'color:' + color } } ) : removeFormat( props.value, inlineColorFormat ) );
					if ( shouldClose ) close();
				};
				return el( 'div', { className: 'cni-heading-plus__format-popover' },
					el( ColorPalette, {
						value: currentColor,
						disableCustomColors: true,
						onChange: function( color ) { applyColor( color, true ); },
					} ),
					el( 'div', { className: 'cni-heading-plus__format-color-picker' },
						el( 'p', null, __( 'カスタムカラー', 'cni-blocks' ) ),
						el( ColorPicker, { color: currentColor || '#000000', enableAlpha: false, onChange: function( color ) { applyColor( color, false ); } } )
					),
					props.isActive ? el( Button, { variant: 'secondary', onClick: function() { props.onChange( removeFormat( props.value, inlineColorFormat ) ); close(); } }, __( '文字色を解除', 'cni-blocks' ) ) : null
				);
			} } );
		},
	} );

	registerFormatType( inlineSizeFormat, {
		title: __( '部分文字サイズ', 'cni-blocks' ),
		tagName: 'span',
		className: 'cni-heading-plus__inline-size',
		attributes: { size: 'data-cni-heading-size' },
		edit: function( props ) {
			const activeAttributes = props.activeAttributes || {};
			const sizes = [
				{ label: __( '小（75%）', 'cni-blocks' ), value: 'small' },
				{ label: __( '大（125%）', 'cni-blocks' ), value: 'large' },
				{ label: __( '特大（150%）', 'cni-blocks' ), value: 'x-large' },
			];
			return el( HeadingFormatControl, { formatProps: props, title: __( '選択文字のサイズ', 'cni-blocks' ), icon: 'editor-textcolor', renderContent: function( close ) {
				return el( 'div', { className: 'cni-heading-plus__format-popover cni-heading-plus__format-buttons' },
					sizes.map( function( size ) {
						return el( Button, { key: size.value, variant: activeAttributes.size === size.value ? 'primary' : 'secondary', onClick: function() { props.onChange( applyFormat( props.value, { type: inlineSizeFormat, attributes: { size: size.value } } ) ); close(); } }, size.label );
					} ),
					el( Button, { variant: 'secondary', onClick: function() { props.onChange( removeFormat( props.value, inlineSizeFormat ) ); close(); } }, __( '標準サイズに戻す', 'cni-blocks' ) )
				);
			} } );
		},
	} );

	registerFormatType( rubyFormat, {
		title: __( 'ルビ', 'cni-blocks' ),
		tagName: 'ruby',
		className: 'cni-heading-plus__ruby',
		attributes: { reading: 'data-cni-ruby', alignment: 'data-cni-ruby-alignment' },
		edit: function( props ) {
			const activeAttributes = props.activeAttributes || {};
			const [ reading, setReading ] = useState( activeAttributes.reading || '' );
			useEffect( function() { setReading( activeAttributes.reading || '' ); }, [ activeAttributes.reading ] );
			return el( HeadingFormatControl, { formatProps: props, title: __( '選択文字にルビ', 'cni-blocks' ), icon: 'editor-help', renderContent: function( close ) {
				return el( 'div', { className: 'cni-heading-plus__format-popover' },
					el( TextControl, { label: __( '読み仮名', 'cni-blocks' ), value: reading, onChange: setReading, __nextHasNoMarginBottom: true } ),
					el( 'div', { className: 'cni-heading-plus__format-actions' },
						el( Button, { variant: 'primary', disabled: ! reading.trim(), onClick: function() { const value = reading.trim(); const selectedText = props.value.text.slice( props.value.start, props.value.end ); const alignment = selectedText && Array.from( selectedText ).length === Array.from( value ).length ? 'character' : ( activeAttributes.alignment || 'group' ); if ( value ) { props.onChange( applyFormat( props.value, { type: rubyFormat, attributes: { reading: value, alignment: alignment } } ) ); close(); } } }, props.isActive ? __( 'ルビを変更', 'cni-blocks' ) : __( 'ルビを適用', 'cni-blocks' ) ),
						props.isActive ? el( Button, { variant: 'secondary', onClick: function() { props.onChange( removeFormat( props.value, rubyFormat ) ); setReading( '' ); close(); } }, __( 'ルビを解除', 'cni-blocks' ) ) : null
					)
				);
			} } );
		},
	} );

	/* This format only contributes the toolbar control. The inserted content is
	 * plain Lightning shortcode text, so saved posts remain theme-compatible. */
	registerFormatType( responsiveBreakFormat, {
		title: __( '画面幅で改行', 'cni-blocks' ),
		tagName: 'span',
		className: null,
		edit: ResponsiveBreakFormatControl,
	} );

	blocks.registerBlockType( 'cni-blocks/heading-plus', {
		apiVersion: 3,
		title: __( '見出し+', 'cni-blocks' ), icon: 'heading', category: 'cni-blocks',
		description: __( '端末別の文字サイズ、Google Fonts、字間、色を設定できる見出しです。', 'cni-blocks' ),
		attributes: {
			content: { type: 'string', source: 'html', selector: '.cni-heading-plus__text', default: '' }, level: { type: 'number', default: 2 }, tagName: { type: 'string', default: '' }, marginTop: { type: 'number' }, marginBottom: { type: 'number' }, legacyLayout: { type: 'boolean', default: false }, layoutVersion: { type: 'number', default: 2 }, inlineImageId: { type: 'number', default: 0 }, inlineImageUrl: { type: 'string', default: '' }, inlineImageAlt: { type: 'string', default: '' }, inlineImagePosition: { type: 'string', default: 'before' }, inlineImageSize: { type: 'number', default: 1.05 }, writingMode: { type: 'string', default: 'horizontal-tb' }, mobileWritingMode: { type: 'string', default: 'horizontal-tb' }, verticalOrientation: { type: 'string', default: 'mixed' }, verticalPosition: { type: 'string', default: 'right' }, verticalHeight: { type: 'number', default: 320 }, fontFamily: { type: 'string', default: '' }, fontWeight: { type: 'string', default: '700' }, fontStyle: { type: 'string', default: 'normal' }, textTransform: { type: 'string', default: 'none' }, fontSizePc: { type: 'number', default: 32 }, fontSizeTablet: { type: 'number', default: 28 }, fontSizeMobile: { type: 'number', default: 21 }, fontSizeUnitPc: { type: 'string', default: 'px' }, fontSizeUnitTablet: { type: 'string', default: 'px' }, fontSizeUnitMobile: { type: 'string', default: 'px' }, lineHeight: { type: 'number', default: 1.3 }, letterSpacing: { type: 'number', default: 0 }, textColor: { type: 'string', default: '' }, backgroundColor: { type: 'string', default: '' }, alignment: { type: 'string', default: 'left' }, paddingVertical: { type: 'number', default: 0 }, paddingHorizontal: { type: 'number', default: 0 },
		},
		deprecated: [ {
			attributes: legacyHeadingAttributes,
			save: legacySave,
			migrate: migrateLegacyHeading,
		} ],
		supports: { anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			const chooseInlineImage = function( media ) { if ( media && media.url ) props.setAttributes( { inlineImageId: media.id || 0, inlineImageUrl: media.url, inlineImageAlt: media.alt || '' } ); };
			const editorDevice = useSelect( function( select ) {
				const editorStore = select( 'core/editor' );
				return editorStore && editorStore.getDeviceType ? editorStore.getDeviceType() : 'Desktop';
			}, [] );
			useEffect( function() { loadFont( a.fontFamily ); }, [ a.fontFamily ] );
			return el( element.Fragment, null,
				el( BlockControls, null,
					el( AlignmentToolbar, { value: a.alignment || 'left', onChange: function( value ) { props.setAttributes( { alignment: value || 'left' } ); } } ),
					isLightning ? el( ToolbarGroup, null, marginControls( props, 'marginTop', __( '上の余白', 'cni-blocks' ), 'arrow-up-alt2' ), marginControls( props, 'marginBottom', __( '下の余白', 'cni-blocks' ), 'arrow-down-alt2' ) ) : null,
					el( ToolbarGroup, null,
						el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseInlineImage, allowedTypes: [ 'image' ], value: a.inlineImageId || 0, render: function( mediaProps ) { return el( ToolbarButton, { icon: 'format-image', label: __( 'インライン画像を追加・変更', 'cni-blocks' ), onClick: mediaProps.open } ); } } ) ),
						a.inlineImageUrl ? el( ToolbarButton, { icon: 'no-alt', label: __( 'インライン画像を削除', 'cni-blocks' ), onClick: function() { props.setAttributes( { inlineImageId: 0, inlineImageUrl: '', inlineImageAlt: '' } ); } } ) : null
					)
				),
				el( InspectorControls, null,
					el( PanelBody, { title: __( '見出し設定', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( 'HTML要素', 'cni-blocks' ), value: textTag( a ), options: [ { label: 'H1', value: 'h1' }, { label: 'H2', value: 'h2' }, { label: 'H3', value: 'h3' }, { label: 'H4', value: 'h4' }, { label: 'H5', value: 'h5' }, { label: 'H6', value: 'h6' }, { label: __( '段落（p）', 'cni-blocks' ), value: 'p' }, { label: __( 'インライン（span）', 'cni-blocks' ), value: 'span' } ], onChange: function( value ) { const tag = value || 'h2'; const defaults = headingDefaultSizes( tag ); const useDefaults = [ 'h2', 'h3', 'h4', 'p', 'span' ].indexOf( tag ) !== -1; props.setAttributes( Object.assign( { tagName: tag, level: /^h[1-6]$/.test( tag ) ? parseInt( tag.slice( 1 ), 10 ) : ( a.level || 2 ) }, useDefaults ? { fontSizePc: defaults.pc, fontSizeTablet: defaults.tablet, fontSizeMobile: defaults.mobile, fontSizeUnitPc: tag === 'p' || tag === 'span' ? 'rem' : 'px', fontSizeUnitTablet: tag === 'p' || tag === 'span' ? 'rem' : 'px', fontSizeUnitMobile: tag === 'p' || tag === 'span' ? 'rem' : 'px' } : {} ) ); } } ),
						a.inlineImageUrl ? el( SelectControl, { label: __( 'インライン画像の位置', 'cni-blocks' ), value: a.inlineImagePosition || 'before', options: [ { label: __( '文字の前', 'cni-blocks' ), value: 'before' }, { label: __( '文字の後', 'cni-blocks' ), value: 'after' } ], onChange: function( value ) { props.setAttributes( { inlineImagePosition: value === 'after' ? 'after' : 'before' } ); } } ) : null,
						a.inlineImageUrl ? el( TextControl, { label: __( 'インライン画像の代替テキスト', 'cni-blocks' ), value: a.inlineImageAlt || '', onChange: function( value ) { props.setAttributes( { inlineImageAlt: value } ); } } ) : null,
						a.inlineImageUrl ? el( RangeControl, { label: __( 'インライン画像のサイズ（文字サイズ比）', 'cni-blocks' ), value: numberOr( a.inlineImageSize, 1.05 ), min: 0.5, max: 4, step: 0.05, onChange: function( value ) { props.setAttributes( { inlineImageSize: value } ); } } ) : null,
						el( SelectControl, { label: __( '文字の向き', 'cni-blocks' ), value: a.writingMode === 'horizontal-tb' ? 'horizontal-tb' : 'vertical-rl', options: [ { label: __( '横書き', 'cni-blocks' ), value: 'horizontal-tb' }, { label: __( '縦書き（右から左）', 'cni-blocks' ), value: 'vertical-rl' } ], onChange: function( value ) { props.setAttributes( { writingMode: value || 'horizontal-tb' } ); } } ),
						[ 'vertical-rl', 'vertical-lr' ].indexOf( a.writingMode ) !== -1 ? el( SelectControl, { label: __( '縦書きの位置', 'cni-blocks' ), value: a.verticalPosition || 'right', options: [ { label: __( '右寄せ（標準）', 'cni-blocks' ), value: 'right' }, { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '左寄せ', 'cni-blocks' ), value: 'left' } ], onChange: function( value ) { props.setAttributes( { verticalPosition: [ 'left', 'center', 'right' ].indexOf( value ) !== -1 ? value : 'right' } ); } } ) : null,
						[ 'vertical-rl', 'vertical-lr' ].indexOf( a.writingMode ) !== -1 ? el( RangeControl, { label: __( '縦書きの高さ（px、0で自動）', 'cni-blocks' ), value: numberOr( a.verticalHeight, 320 ), min: 0, max: 800, step: 10, onChange: function( value ) { props.setAttributes( { verticalHeight: value } ); } } ) : null,
						[ 'vertical-rl', 'vertical-lr' ].indexOf( a.writingMode ) !== -1 ? el( SelectControl, { label: __( 'スマホ時の文字の向き', 'cni-blocks' ), value: a.mobileWritingMode || 'horizontal-tb', options: [ { label: __( '横書き（標準）', 'cni-blocks' ), value: 'horizontal-tb' }, { label: __( '縦書きを維持', 'cni-blocks' ), value: 'inherit' } ], onChange: function( value ) { props.setAttributes( { mobileWritingMode: value === 'inherit' ? 'inherit' : 'horizontal-tb' } ); } } ) : null,
						[ 'vertical-rl', 'vertical-lr' ].indexOf( a.writingMode ) !== -1 ? el( SelectControl, { label: __( '縦書き時の英数字', 'cni-blocks' ), value: a.verticalOrientation || 'mixed', options: [ { label: __( '横向き（自然）', 'cni-blocks' ), value: 'mixed' }, { label: __( '縦向き', 'cni-blocks' ), value: 'upright' } ], onChange: function( value ) { props.setAttributes( { verticalOrientation: value === 'upright' ? 'upright' : 'mixed' } ); } } ) : null,
						[ 'vertical-rl', 'vertical-lr' ].indexOf( a.writingMode ) !== -1 ? el( SelectControl, { label: __( '縦書きの方向（詳細）', 'cni-blocks' ), value: a.writingMode || 'vertical-rl', options: [ { label: __( '右から左（標準）', 'cni-blocks' ), value: 'vertical-rl' }, { label: __( '左から右', 'cni-blocks' ), value: 'vertical-lr' } ], onChange: function( value ) { props.setAttributes( { writingMode: value === 'vertical-lr' ? 'vertical-lr' : 'vertical-rl' } ); } } ) : null,
						el( SelectControl, { label: __( 'フォント', 'cni-blocks' ), help: __( 'Google Fontsを選ぶと編集画面と公開画面で必要なフォントだけを読み込みます。', 'cni-blocks' ), value: a.fontFamily || '', options: googleFonts.map( function( font ) { return { label: font || __( 'テーマのフォント', 'cni-blocks' ), value: font }; } ), onChange: function( value ) { const available = fontWeights[ value ] || [ '300', '400', '500', '600', '700', '800', '900' ]; props.setAttributes( { fontFamily: value, fontWeight: available.indexOf( a.fontWeight || '700' ) !== -1 ? ( a.fontWeight || '700' ) : ( available.indexOf( '400' ) !== -1 ? '400' : available[ 0 ] ) } ); } } ),
						el( SelectControl, { label: __( 'フォントの太さ', 'cni-blocks' ), value: a.fontWeight || '700', options: ( fontWeights[ a.fontFamily ] || [ '300', '400', '500', '600', '700', '800', '900' ] ).map( function( weight ) { return { label: weight, value: weight }; } ), onChange: function( value ) { props.setAttributes( { fontWeight: value } ); } } ),
						el( SelectControl, { label: __( '文字の変形', 'cni-blocks' ), value: a.textTransform || 'none', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '大文字', 'cni-blocks' ), value: 'uppercase' }, { label: __( '小文字', 'cni-blocks' ), value: 'lowercase' }, { label: __( '単語の先頭を大文字', 'cni-blocks' ), value: 'capitalize' } ], onChange: function( value ) { props.setAttributes( { textTransform: value } ); } } )
					),
					el( PanelBody, { title: __( 'サイズ・間隔', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, { label: __( '文字サイズ：PCの単位', 'cni-blocks' ), value: fontUnit( a.fontSizeUnitPc ), options: [ { label: 'px', value: 'px' }, { label: 'rem', value: 'rem' }, { label: 'vh', value: 'vh' } ], onChange: function( unit ) { const next = fontUnit( unit ); props.setAttributes( { fontSizePc: convertFontSizeUnit( a.fontSizePc, fontUnit( a.fontSizeUnitPc ), next, 16 ), fontSizeUnitPc: next } ); } } ),
						el( RangeControl, { label: __( '文字サイズ：PC', 'cni-blocks' ) + '（' + fontUnit( a.fontSizeUnitPc ) + '）', value: numberOr( a.fontSizePc, 32 ), min: 0.5, max: fontRangeMaximum( fontUnit( a.fontSizeUnitPc ) ), step: fontRangeStep( fontUnit( a.fontSizeUnitPc ) ), onChange: function( value ) { props.setAttributes( { fontSizePc: value } ); } } ),
						el( SelectControl, { label: __( '文字サイズ：タブレットの単位', 'cni-blocks' ), value: fontUnit( a.fontSizeUnitTablet ), options: [ { label: 'px', value: 'px' }, { label: 'rem', value: 'rem' }, { label: 'vh', value: 'vh' } ], onChange: function( unit ) { const next = fontUnit( unit ); props.setAttributes( { fontSizeTablet: convertFontSizeUnit( a.fontSizeTablet, fontUnit( a.fontSizeUnitTablet ), next, 16 ), fontSizeUnitTablet: next } ); } } ),
						el( RangeControl, { label: __( '文字サイズ：タブレット', 'cni-blocks' ) + '（' + fontUnit( a.fontSizeUnitTablet ) + '）', value: numberOr( a.fontSizeTablet, 28 ), min: 0.5, max: fontRangeMaximum( fontUnit( a.fontSizeUnitTablet ) ), step: fontRangeStep( fontUnit( a.fontSizeUnitTablet ) ), onChange: function( value ) { props.setAttributes( { fontSizeTablet: value } ); } } ),
						el( SelectControl, { label: __( '文字サイズ：モバイルの単位', 'cni-blocks' ), value: fontUnit( a.fontSizeUnitMobile ), options: [ { label: 'px', value: 'px' }, { label: 'rem', value: 'rem' }, { label: 'vh', value: 'vh' } ], onChange: function( unit ) { const next = fontUnit( unit ); props.setAttributes( { fontSizeMobile: convertFontSizeUnit( a.fontSizeMobile, fontUnit( a.fontSizeUnitMobile ), next, 14 ), fontSizeUnitMobile: next } ); } } ),
						el( RangeControl, { label: __( '文字サイズ：モバイル', 'cni-blocks' ) + '（' + fontUnit( a.fontSizeUnitMobile ) + '）', value: numberOr( a.fontSizeMobile, 21 ), min: 0.5, max: fontRangeMaximum( fontUnit( a.fontSizeUnitMobile ) ), step: fontRangeStep( fontUnit( a.fontSizeUnitMobile ) ), onChange: function( value ) { props.setAttributes( { fontSizeMobile: value } ); } } ),
						el( RangeControl, { label: __( '行の高さ', 'cni-blocks' ), value: numberOr( a.lineHeight, 1.3 ), min: 0.8, max: 3, step: 0.1, onChange: function( value ) { props.setAttributes( { lineHeight: value } ); } } ),
						el( RangeControl, { label: __( '文字間隔（px）', 'cni-blocks' ), value: numberOr( a.letterSpacing, 0 ), min: -5, max: 30, step: 0.5, onChange: function( value ) { props.setAttributes( { letterSpacing: value } ); } } ),
						el( RangeControl, { label: __( '上下の内側余白（px）', 'cni-blocks' ), value: numberOr( a.paddingVertical, 0 ), min: 0, max: 100, onChange: function( value ) { props.setAttributes( { paddingVertical: value } ); } } ),
						el( RangeControl, { label: __( '左右の内側余白（px）', 'cni-blocks' ), value: numberOr( a.paddingHorizontal, 0 ), min: 0, max: 100, onChange: function( value ) { props.setAttributes( { paddingHorizontal: value } ); } } )
					),
					el( PanelBody, { title: __( '色', 'cni-blocks' ), initialOpen: false }, palette( __( '文字色', 'cni-blocks' ), a.textColor, function( value ) { props.setAttributes( { textColor: value || '' } ); } ), palette( __( '背景色', 'cni-blocks' ), a.backgroundColor, function( value ) { props.setAttributes( { backgroundColor: value || '' } ); } ) )
				),
				el( 'div', propsFor( a, false, editorDevice ), a.inlineImageUrl ? el( 'div', { className: 'cni-heading-plus__inline-row' }, a.inlineImagePosition !== 'after' ? inlineImage( a ) : null, el( RichText, { tagName: textTag( a ), className: 'cni-heading-plus__text', value: a.content, allowedFormats: [ 'core/bold', 'core/italic', 'core/link', inlineColorFormat, inlineSizeFormat, rubyFormat, responsiveBreakFormat ], placeholder: __( '見出しを入力', 'cni-blocks' ), onChange: function( value ) { props.setAttributes( { content: value } ); }, onSplit: function( value, isOriginal ) { return splitHeading( props, value, isOriginal ); }, onReplace: function( replacementBlocks, indexToSelect, initialPosition ) { replaceHeadingBlocks( props, replacementBlocks, indexToSelect, initialPosition ); } } ), a.inlineImagePosition === 'after' ? inlineImage( a ) : null ) : el( RichText, { tagName: textTag( a ), className: 'cni-heading-plus__text', value: a.content, allowedFormats: [ 'core/bold', 'core/italic', 'core/link', inlineColorFormat, inlineSizeFormat, rubyFormat, responsiveBreakFormat ], placeholder: __( '見出しを入力', 'cni-blocks' ), onChange: function( value ) { props.setAttributes( { content: value } ); }, onSplit: function( value, isOriginal ) { return splitHeading( props, value, isOriginal ); }, onReplace: function( replacementBlocks, indexToSelect, initialPosition ) { replaceHeadingBlocks( props, replacementBlocks, indexToSelect, initialPosition ); } } ) )
			);
		},
		save: function( props ) {
			const a = props.attributes;
			return el( 'div', propsFor( a, true ), a.inlineImageUrl ? el( 'div', { className: 'cni-heading-plus__inline-row' }, a.inlineImagePosition !== 'after' ? inlineImage( a ) : null, el( RichText.Content, { tagName: textTag( a ), className: 'cni-heading-plus__text', value: a.content } ), a.inlineImagePosition === 'after' ? inlineImage( a ) : null ) : el( RichText.Content, { tagName: textTag( a ), className: 'cni-heading-plus__text', value: a.content } ) );
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.data, window.wp.i18n, window.wp.richText );

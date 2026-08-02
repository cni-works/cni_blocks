( function( blocks, element, blockEditor, components, i18n ) {
	const el = element.createElement;
	const useMemo = element.useMemo;

	const { __ } = i18n;
	const { useBlockProps, MediaUpload, MediaUploadCheck, InspectorControls } = blockEditor;
	const { Button, PanelBody, ToggleControl, SelectControl, RangeControl, ColorPalette, TextControl } = components;

	function getMain( images, selected ) {
		if ( ! images || ! images.length ) return null;
		const idx = Math.min( selected, images.length - 1 );
		return images[ idx ];
	}

	function ratioToCss( v ) {
		if ( ! v || v === 'auto' ) return '';
		const parts = v.split('/');
		if ( parts.length !== 2 ) return '';
		return parts[0].trim() + ' / ' + parts[1].trim();
	}


	function getThumbSizeValue( size ) {
		if ( size === 'small' ) return '56px';
		if ( size === 'large' ) return '96px';
		return '72px';
	}

	function getSideRatioVars( ratio ) {
		switch ( ratio ) {
			case '4-1': return { main: 4, thumbs: 1 };
			case '2-1': return { main: 2, thumbs: 1 };
			case '1-1': return { main: 1, thumbs: 1 };
			case '3-1':
			default: return { main: 3, thumbs: 1 };
		}
	}

	function stripHtml( s ) {
		if ( ! s ) return '';
		return String( s ).replace( /<[^>]*>/g, '' ).trim();
	}

	function getRenderedText( field ) {
		if ( ! field ) return '';
		if ( typeof field === 'string' ) return stripHtml( field );
		if ( typeof field === 'object' && field.rendered ) return stripHtml( field.rendered );
		return '';
	}

	function updateImageAt( images, index, changes ) {
		return images.map( function( image, imageIndex ) {
			return imageIndex === index ? Object.assign( {}, image, changes ) : image;
		} );
	}

	function getSafeLinkUrl( value ) {
		const url = String( value || '' ).trim();
		if ( ! url || /^\/\//.test( url ) ) return '';
		const scheme = url.match( /^([a-z][a-z0-9+.-]*):/i );
		if ( scheme && scheme[1].toLowerCase() !== 'http' && scheme[1].toLowerCase() !== 'https' ) return '';
		return url;
	}

	function getAutomaticArrowIconColor( backgroundColor ) {
		const value = String( backgroundColor || '' ).trim();
		const match = value.match( /^#([0-9a-f]{3}|[0-9a-f]{6})$/i );
		if ( ! match ) return '#111111';

		let hex = match[1];
		if ( hex.length === 3 ) hex = hex.replace( /./g, function( character ) { return character + character; } );

		const red = parseInt( hex.slice( 0, 2 ), 16 );
		const green = parseInt( hex.slice( 2, 4 ), 16 );
		const blue = parseInt( hex.slice( 4, 6 ), 16 );
		const brightness = ( ( red * 299 ) + ( green * 587 ) + ( blue * 114 ) ) / 1000;

		return brightness >= 150 ? '#111111' : '#ffffff';
	}

	function addArrowStyleVariables( style, attributes ) {
		const backgroundColor = attributes.arrowBackgroundColor || '';
		const iconMode = attributes.arrowIconColorMode || 'auto';
		let iconColor = '';

		if ( backgroundColor ) style[ '--cni-arrow-background' ] = backgroundColor;

		if ( iconMode === 'white' ) iconColor = '#ffffff';
		else if ( iconMode === 'black' ) iconColor = '#111111';
		else if ( iconMode === 'custom' ) iconColor = attributes.arrowIconColor || '#111111';
		else if ( backgroundColor ) iconColor = getAutomaticArrowIconColor( backgroundColor );

		if ( iconColor ) style[ '--cni-arrow-icon-color' ] = iconColor;

		return style;
	}

	function addArrowPositionData( props, attributes ) {
		const position = attributes.arrowPosition || 'inside';
		if ( position === 'edge' || position === 'outside' ) props[ 'data-arrow-position' ] = position;
		return props;
	}

	function renderLinkedImage( image, imageProps, key ) {
		const linkUrl = getSafeLinkUrl( image.linkUrl );
		if ( ! linkUrl ) return el( 'img', Object.assign( { key: key }, imageProps ) );
		const linkedImageProps = Object.assign( {}, imageProps, { className: 'cni-slide-image' } );

		return el(
			'a',
			{
				key: key,
				className: ( imageProps.className || '' ) + ' cni-slide-link',
				href: linkUrl,
				target: image.linkTarget ? '_blank' : undefined,
				rel: image.linkTarget ? 'noopener noreferrer' : undefined,
			},
			el( 'img', linkedImageProps )
		);
	}

	blocks.registerBlockType( 'cni-blocks/slide-gallery', {
		apiVersion: 3,
		title: __( 'スライドギャラリー', 'cni-blocks' ),
		icon: 'format-gallery',
		category: 'cni-blocks',
		description: __( '1枚表示または横並びカルーセルで、サムネイル、リンク、矢印、キャプションを設定できます。', 'cni-blocks' ),
		supports: {
			align: [ 'wide', 'full' ],
		},
		attributes: {
			images: { type: 'array', default: [] },
			selected: { type: 'number', default: 0 },
			loop: { type: 'boolean', default: true },
			showArrows: { type: 'boolean', default: true },
			arrowBackgroundColor: { type: 'string', default: '' },
			arrowIconColorMode: { type: 'string', default: 'auto' },
			arrowIconColor: { type: 'string', default: '' },
			arrowPosition: { type: 'string', default: 'inside' },
			transition: { type: 'string', default: 'fade' },
			fixedWidth: { type: 'number', default: 0 },
			fixedHeight: { type: 'number', default: 0 },
			aspectRatio: { type: 'string', default: '3/2' },
			layout: { type: 'string', default: 'below' },
			objectFit: { type: 'string', default: 'cover' },
			showCaption: { type: 'boolean', default: false },
			captionPosition: { type: 'string', default: 'below' }, // below|overlay
			captionStyle: { type: 'string', default: 'glass' },     // glass|dark|light
			sideRatio: { type: 'string', default: '3-1' },
			thumbnailSize: { type: 'string', default: 'medium' },
			showThumbnails: { type: 'boolean', default: true },
			galleryType: { type: 'string', default: 'single' },
			carouselColumnsPc: { type: 'number', default: 3 },
			carouselColumnsTablet: { type: 'number', default: 2 },
			carouselColumnsMobile: { type: 'number', default: 1 },
			carouselGap: { type: 'number', default: 16 },
			carouselAutoplay: { type: 'boolean', default: false },
			carouselAutoplayMode: { type: 'string', default: 'step' },
			carouselDirection: { type: 'string', default: 'left' },
			carouselInterval: { type: 'number', default: 4 },
			carouselTransitionDuration: { type: 'number', default: 500 },
			carouselContinuousSpeed: { type: 'number', default: 40 },
			carouselPauseOnHover: { type: 'boolean', default: true },
			carouselPauseOnFocus: { type: 'boolean', default: true },
		},

		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const images = attributes.images || [];
			const selected = typeof attributes.selected === 'number' ? attributes.selected : 0;

			const loop = attributes.loop !== false;
			const showArrows = attributes.showArrows !== false;
			const arrowBackgroundColor = attributes.arrowBackgroundColor || '';
			const arrowIconColorMode = attributes.arrowIconColorMode || 'auto';
			const arrowIconColor = attributes.arrowIconColor || '';
			const arrowPosition = attributes.arrowPosition || 'inside';
			const transition = attributes.transition || 'fade';
			const fixedWidth = typeof attributes.fixedWidth === 'number' ? attributes.fixedWidth : 0;
			const fixedHeight = typeof attributes.fixedHeight === 'number' ? attributes.fixedHeight : 0;
			const aspectRatio = ( ! attributes.aspectRatio || attributes.aspectRatio === 'auto' ) ? '3/2' : attributes.aspectRatio;
			const objectFit = attributes.objectFit || 'cover';
			const showCaption = !!attributes.showCaption;
			const captionPosition = attributes.captionPosition || 'below';
			const captionStyle = attributes.captionStyle || 'glass';
			const sideRatio = attributes.sideRatio || '3-1';
			const thumbnailSize = attributes.thumbnailSize || 'medium';
			const showThumbnails = attributes.showThumbnails !== false;
			const galleryType = attributes.galleryType || 'single';
			const carouselColumnsPc = typeof attributes.carouselColumnsPc === 'number' ? attributes.carouselColumnsPc : 3;
			const carouselColumnsTablet = typeof attributes.carouselColumnsTablet === 'number' ? attributes.carouselColumnsTablet : 2;
			const carouselColumnsMobile = typeof attributes.carouselColumnsMobile === 'number' ? attributes.carouselColumnsMobile : 1;
			const carouselGap = typeof attributes.carouselGap === 'number' ? attributes.carouselGap : 16;
			const carouselAutoplay = !!attributes.carouselAutoplay;
			const carouselAutoplayMode = attributes.carouselAutoplayMode || 'step';
			const carouselDirection = attributes.carouselDirection || 'left';
			const carouselInterval = typeof attributes.carouselInterval === 'number' ? attributes.carouselInterval : 4;
			const carouselTransitionDuration = typeof attributes.carouselTransitionDuration === 'number' ? attributes.carouselTransitionDuration : 500;
			const carouselContinuousSpeed = typeof attributes.carouselContinuousSpeed === 'number' ? attributes.carouselContinuousSpeed : 40;
			const carouselPauseOnHover = attributes.carouselPauseOnHover !== false;
			const carouselPauseOnFocus = attributes.carouselPauseOnFocus !== false;

			const main = useMemo( function() {
				return getMain( images, selected );
			}, [ images, selected ] );
			const selectedImage = images[ Math.min( selected, Math.max( 0, images.length - 1 ) ) ] || null;

			const onSelectImages = function( media ) {
				const previousById = {};
				images.forEach( function( image ) {
					if ( image.id ) previousById[ image.id ] = image;
				} );
				const normalized = ( media || [] ).map( function( m ) {
					const thumbUrl =
						( m && m.sizes && m.sizes.thumbnail && m.sizes.thumbnail.url ) ||
						( m && m.sizes && m.sizes.medium && m.sizes.medium.url ) ||
						( m && m.url ) ||
						'';

					const caption = getRenderedText( m && m.caption );
					const description = getRenderedText( m && m.description );
					const text = caption || description || '';

					const previous = previousById[ m.id ] || {};
					return {
						id: m.id,
						url: m.url,
						alt: m.alt || '',
						thumbUrl: thumbUrl,
						text: text,
						linkUrl: previous.linkUrl || '',
						linkTarget: !!previous.linkTarget,
					};
				} );

				setAttributes( {
					images: normalized,
					selected: 0,
				} );
			};

			const setSelected = function( idx ) {
				setAttributes( { selected: idx } );
			};

			const removeAll = function() {
				setAttributes( { images: [], selected: 0 } );
			};

			const hasFrame = true;
			const containerStyle = {};

			const viewportStyle = {};
			const cssRatio = ratioToCss( aspectRatio );
			if ( cssRatio ) viewportStyle.aspectRatio = cssRatio;

			const sideVars = getSideRatioVars( sideRatio );
			const blockStyleVars = addArrowStyleVariables( {
				'--cni-object-fit': objectFit,
				'--cni-side-main': sideVars.main + 'fr',
				'--cni-side-thumbs': sideVars.thumbs + 'fr',
				'--cni-thumb-size': getThumbSizeValue( thumbnailSize ),
				'--cni-carousel-columns-pc': carouselColumnsPc,
				'--cni-carousel-columns-tablet': carouselColumnsTablet,
				'--cni-carousel-columns-mobile': carouselColumnsMobile,
				'--cni-carousel-gap': carouselGap + 'px',
				'--cni-carousel-ratio': cssRatio || '3 / 2',
				'--cni-carousel-duration': carouselTransitionDuration + 'ms',
			}, attributes );
			const blockProps = useBlockProps( addArrowPositionData( { style: blockStyleVars }, attributes ) );

			const captionClass = 'cni-caption cni-caption--' + captionPosition + ' cni-caption--' + captionStyle;
			const isOverlay = ( captionPosition === 'overlay' );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( '表示オプション', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( '表示タイプ', 'cni-blocks' ),
							value: galleryType,
							options: [
								{ label: __( '1枚ずつ表示', 'cni-blocks' ), value: 'single' },
								{ label: __( '横並びカルーセル', 'cni-blocks' ), value: 'carousel' },
							],
							onChange: function( v ) { setAttributes( { galleryType: v || 'single' } ); },
						} ),
						el( ToggleControl, {
							label: __( '矢印を表示', 'cni-blocks' ),
							checked: showArrows,
							onChange: function( v ) { setAttributes( { showArrows: !!v } ); },
						} ),
						galleryType === 'carousel' && carouselAutoplay && carouselAutoplayMode === 'continuous' ?
							el( 'p', { className: 'cni-carousel-loop-note' }, __( '連続モードでは、無限ループで停止せず流れます。', 'cni-blocks' ) ) :
							el( ToggleControl, {
								label: __( '無限ループ', 'cni-blocks' ),
								help: __( '矢印で端まで進んだとき、先頭/末尾に戻します。', 'cni-blocks' ),
								checked: loop,
								onChange: function( v ) { setAttributes( { loop: !!v } ); },
							} ),
						galleryType === 'single' ? el( SelectControl, {
							label: __( '切り替え効果', 'cni-blocks' ),
							value: transition,
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( 'フェード', 'cni-blocks' ), value: 'fade' },
								{ label: __( 'スライド', 'cni-blocks' ), value: 'slide' },
							],
							help: hasFrame ? '' : __( 'スライド/トリミングを安定させるには「比率」を指定するのがおすすめです。', 'cni-blocks' ),
							onChange: function( v ) { setAttributes( { transition: v } ); },
						} ) : null,
						galleryType === 'single' && showThumbnails ? el( SelectControl, {
								label: __( 'レイアウト', 'cni-blocks' ),
								value: attributes.layout || 'below',
								options: [
									{ label: __( '下にサムネイル', 'cni-blocks' ), value: 'below' },
									{ label: __( '右にサムネイル（PC）', 'cni-blocks' ), value: 'side' },
								],
								help: __( 'PC表示（782px以上）で左右2カラムにします。スマホは縦積み。', 'cni-blocks' ),
								onChange: function( v ) { setAttributes( { layout: v } ); },
							} ) : null,
						galleryType === 'single' ? el( ToggleControl, {
							label: __( 'サムネイルを表示', 'cni-blocks' ),
							checked: showThumbnails,
							onChange: function( v ) { setAttributes( { showThumbnails: !!v } ); },
						} ) : null,
						el( SelectControl, {
							label: __( '画像の収まり', 'cni-blocks' ),
							value: objectFit,
							options: [
								{ label: __( 'トリミング（cover）', 'cni-blocks' ), value: 'cover' },
								{ label: __( '全体表示（contain）', 'cni-blocks' ), value: 'contain' },
							],
							help: hasFrame ? '' : __( 'coverは「高さ/比率」が固定されている時にトリミングされます。', 'cni-blocks' ),
							onChange: function( v ) { setAttributes( { objectFit: v } ); },
						} ),
						el( ToggleControl, {
							label: __( 'キャプションを表示', 'cni-blocks' ),
							help: __( 'メディアの「キャプション」または「説明」を表示します。※画像追加時に取り込みます', 'cni-blocks' ),
							checked: showCaption,
							onChange: function( v ) { setAttributes( { showCaption: !!v } ); },
						} ),
						showCaption ? el( SelectControl, {
							label: __( 'キャプション位置', 'cni-blocks' ),
							value: captionPosition,
							options: [
								{ label: __( '画像の下（外）', 'cni-blocks' ), value: 'below' },
								{ label: __( '画像内の下（横100%）', 'cni-blocks' ), value: 'overlay' },
							],
							onChange: function( v ) { setAttributes( { captionPosition: v } ); },
						} ) : null,
						showCaption ? el( SelectControl, {
							label: __( 'キャプションスタイル', 'cni-blocks' ),
							value: captionStyle,
							options: [
								{ label: __( 'すりガラス（透明）', 'cni-blocks' ), value: 'glass' },
								{ label: __( '黒帯＋白文字', 'cni-blocks' ), value: 'dark' },
								{ label: __( '白帯＋黒文字', 'cni-blocks' ), value: 'light' },
							],
							onChange: function( v ) { setAttributes( { captionStyle: v } ); },
						} ) : null
					),
					showArrows ? el(
						PanelBody,
						{ title: __( '矢印設定', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( '丸い背景部分の色', 'cni-blocks' ) ),
						el( ColorPalette, {
							value: arrowBackgroundColor || '#ffffff',
							onChange: function( value ) { setAttributes( { arrowBackgroundColor: value || '' } ); },
							clearable: true,
						} ),
						el( SelectControl, {
							label: __( '矢印アイコンの色', 'cni-blocks' ),
							value: arrowIconColorMode,
							options: [
								{ label: __( '自動（背景色に合わせる）', 'cni-blocks' ), value: 'auto' },
								{ label: __( '白', 'cni-blocks' ), value: 'white' },
								{ label: __( '黒', 'cni-blocks' ), value: 'black' },
								{ label: __( 'カスタム', 'cni-blocks' ), value: 'custom' },
							],
							onChange: function( value ) { setAttributes( { arrowIconColorMode: value || 'auto' } ); },
						} ),
						arrowIconColorMode === 'custom' ? el(
							element.Fragment,
							null,
							el( 'p', null, __( '矢印アイコンのカスタム色', 'cni-blocks' ) ),
							el( ColorPalette, {
								value: arrowIconColor || '#111111',
								onChange: function( value ) { setAttributes( { arrowIconColor: value || '' } ); },
								clearable: true,
							} )
						) : null,
						el( SelectControl, {
							label: __( '矢印の位置', 'cni-blocks' ),
							value: arrowPosition,
							options: [
								{ label: __( '画像の内側', 'cni-blocks' ), value: 'inside' },
								{ label: __( '画像の境界上', 'cni-blocks' ), value: 'edge' },
								{ label: __( '画像の外側', 'cni-blocks' ), value: 'outside' },
							],
							help: __( '外側は、テーマ側のコンテナに余裕がない場合に見切れることがあります。', 'cni-blocks' ),
							onChange: function( value ) { setAttributes( { arrowPosition: value || 'inside' } ); },
						} )
					) : null,
					el(
						PanelBody,
						{ title: __( 'サイズ・比率', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( 'メイン画像の比率', 'cni-blocks' ),
							value: aspectRatio,
							options: [
								{ label: '1:1', value: '1/1' },
								{ label: '4:3', value: '4/3' },
								{ label: '3:2（標準）', value: '3/2' },
								{ label: '16:9', value: '16/9' },
								{ label: '2:1', value: '2/1' },
								{ label: '21:9', value: '21/9' },
								{ label: '5:2', value: '5/2' },
								{ label: '3:1', value: '3/1' },
								{ label: '4:1', value: '4/1' },
								{ label: '3:4', value: '3/4' },
							],
							help: __( 'メイン画像の表示枠を固定します。初期値は3:2です。', 'cni-blocks' ),
							onChange: function( v ) { setAttributes( { aspectRatio: v || '3/2' } ); },
						} ),
						galleryType === 'single' && showThumbnails ? el( SelectControl, {
							label: __( '右サムネイル時のカラム比率', 'cni-blocks' ),
							value: sideRatio,
							options: [
								{ label: __( 'メイン広め（4:1）', 'cni-blocks' ), value: '4-1' },
								{ label: __( '標準（3:1）', 'cni-blocks' ), value: '3-1' },
								{ label: __( 'サムネイル広め（2:1）', 'cni-blocks' ), value: '2-1' },
								{ label: __( '半分ずつ（1:1）', 'cni-blocks' ), value: '1-1' },
							],
							help: __( '「右にサムネイル（PC）」を選んだ時だけ反映されます。', 'cni-blocks' ),
							onChange: function( v ) { setAttributes( { sideRatio: v || '3-1' } ); },
						} ) : null,
						galleryType === 'single' && showThumbnails ? el( SelectControl, {
							label: __( 'サムネイルサイズ', 'cni-blocks' ),
							value: thumbnailSize,
							options: [
								{ label: __( '小', 'cni-blocks' ), value: 'small' },
								{ label: __( '中', 'cni-blocks' ), value: 'medium' },
								{ label: __( '大', 'cni-blocks' ), value: 'large' },
							],
							onChange: function( v ) { setAttributes( { thumbnailSize: v || 'medium' } ); },
						} ) : null
					),
					galleryType === 'carousel' ? el(
						PanelBody,
						{ title: __( '横並びカルーセル', 'cni-blocks' ), initialOpen: true },
						el( RangeControl, { label: __( '表示枚数：PC', 'cni-blocks' ), value: carouselColumnsPc, min: 1, max: 6, onChange: function( v ) { setAttributes( { carouselColumnsPc: v || 1 } ); } } ),
						el( RangeControl, { label: __( '表示枚数：タブレット', 'cni-blocks' ), value: carouselColumnsTablet, min: 1, max: 4, onChange: function( v ) { setAttributes( { carouselColumnsTablet: v || 1 } ); } } ),
						el( RangeControl, { label: __( '表示枚数：モバイル', 'cni-blocks' ), value: carouselColumnsMobile, min: 1, max: 2, onChange: function( v ) { setAttributes( { carouselColumnsMobile: v || 1 } ); } } ),
						el( RangeControl, { label: __( '画像間の余白（px）', 'cni-blocks' ), value: carouselGap, min: 0, max: 64, onChange: function( v ) { setAttributes( { carouselGap: typeof v === 'number' ? v : 16 } ); } } ),
						el( ToggleControl, { label: __( '自動再生', 'cni-blocks' ), checked: carouselAutoplay, onChange: function( v ) { setAttributes( { carouselAutoplay: !!v } ); } } ),
						carouselAutoplay ? el( SelectControl, {
							label: __( '自動再生モード', 'cni-blocks' ),
							value: carouselAutoplayMode,
							options: [
								{ label: __( '1枚ずつ移動', 'cni-blocks' ), value: 'step' },
								{ label: __( '一定速度で連続して流す', 'cni-blocks' ), value: 'continuous' },
							],
							onChange: function( v ) { setAttributes( { carouselAutoplayMode: v || 'step' } ); },
						} ) : null,
						carouselAutoplay ? el( SelectControl, {
							label: __( '自動再生の方向', 'cni-blocks' ),
							value: carouselDirection,
							options: [ { label: __( '左へ流す', 'cni-blocks' ), value: 'left' }, { label: __( '右へ流す（逆方向）', 'cni-blocks' ), value: 'right' } ],
							onChange: function( v ) { setAttributes( { carouselDirection: v || 'left' } ); },
						} ) : null,
						carouselAutoplay && carouselAutoplayMode === 'step' ? el( RangeControl, { label: __( '切り替え間隔（秒）', 'cni-blocks' ), value: carouselInterval, min: 2, max: 15, step: 1, onChange: function( v ) { setAttributes( { carouselInterval: typeof v === 'number' ? v : 4 } ); } } ) : null,
						carouselAutoplay && carouselAutoplayMode === 'step' ? el( RangeControl, { label: __( '移動時間（ミリ秒）', 'cni-blocks' ), value: carouselTransitionDuration, min: 100, max: 2000, step: 100, onChange: function( v ) { setAttributes( { carouselTransitionDuration: typeof v === 'number' ? v : 500 } ); } } ) : null,
						carouselAutoplay && carouselAutoplayMode === 'continuous' ? el( RangeControl, { label: __( '連続スクロール速度', 'cni-blocks' ), help: __( '数値が大きいほど速く、停止せず流れ続けます。', 'cni-blocks' ), value: carouselContinuousSpeed, min: 10, max: 150, step: 5, onChange: function( v ) { setAttributes( { carouselContinuousSpeed: typeof v === 'number' ? v : 40 } ); } } ) : null,
						carouselAutoplay ? el( ToggleControl, { label: __( 'マウスを載せたら一時停止', 'cni-blocks' ), checked: carouselPauseOnHover, onChange: function( v ) { setAttributes( { carouselPauseOnHover: !!v } ); } } ) : null,
						carouselAutoplay ? el( ToggleControl, { label: __( 'キーボード操作中は一時停止', 'cni-blocks' ), checked: carouselPauseOnFocus, onChange: function( v ) { setAttributes( { carouselPauseOnFocus: !!v } ); } } ) : null
					) : null,
					images.length ? el(
						PanelBody,
						{ title: __( '画像ごとのリンク設定', 'cni-blocks' ), initialOpen: true },
						el( 'p', { className: 'cni-link-setting-help' }, __( '編集画面の画像、または下のサムネイルを選択してください。', 'cni-blocks' ) ),
						el(
							'div',
							{ className: 'cni-link-image-picker', 'aria-label': __( 'リンクを設定する画像', 'cni-blocks' ) },
							images.map( function( image, index ) {
								return el(
									'button',
									{
										key: image.id || index,
										type: 'button',
										className: 'cni-link-image-choice' + ( index === selected ? ' is-selected' : '' ),
										onClick: function() { setSelected( index ); },
										'aria-pressed': index === selected,
										'aria-label': __( '画像', 'cni-blocks' ) + ( index + 1 ) + ( image.linkUrl ? __( '、リンク設定済み', 'cni-blocks' ) : '' ),
									},
									el( 'img', { src: image.thumbUrl || image.url, alt: '' } ),
									el( 'span', { className: 'cni-link-image-number' }, index + 1 ),
									image.linkUrl ? el( 'span', { className: 'cni-link-image-status', 'aria-hidden': 'true' }, '🔗' ) : null
								);
							} )
						),
						el( 'p', { className: 'cni-selected-image-label' }, __( '画像', 'cni-blocks' ) + ( selected + 1 ) + __( 'を編集中', 'cni-blocks' ) ),
						el( TextControl, {
							label: __( 'リンク先URL', 'cni-blocks' ),
							help: __( 'http:// または https:// のURL、サイト内の相対URLを設定できます。', 'cni-blocks' ),
							value: selectedImage && selectedImage.linkUrl ? selectedImage.linkUrl : '',
							type: 'url',
							onChange: function( v ) { setAttributes( { images: updateImageAt( images, selected, { linkUrl: v } ) } ); },
						} ),
						el( ToggleControl, {
							label: __( '新しいタブで開く', 'cni-blocks' ),
							checked: !!( selectedImage && selectedImage.linkTarget ),
							disabled: !( selectedImage && selectedImage.linkUrl ),
							onChange: function( v ) { setAttributes( { images: updateImageAt( images, selected, { linkTarget: !!v } ) } ); },
						} )
					) : null
				),
				el(
					'div',
					blockProps,
					el(
						'div',
						{ className: 'cni-editor-toolbar' },
						el(
							MediaUploadCheck,
							null,
							el( MediaUpload, {
								onSelect: onSelectImages,
								allowedTypes: [ 'image' ],
								multiple: true,
								gallery: true,
								value: images.map( function( i ) { return i.id; } ).filter( Boolean ),
								render: function( obj ) {
									return el(
										Button,
										{ variant: 'primary', onClick: obj.open },
										images.length ? __( '画像を差し替える', 'cni-blocks' ) : __( '画像を追加', 'cni-blocks' )
									);
								},
							} )
						),
						images.length
							? el( Button, { variant: 'secondary', onClick: removeAll }, __( 'すべて削除', 'cni-blocks' ) )
							: null
					),

					! images.length
						? el( 'div', { className: 'cni-placeholder' }, __( '上のボタンから画像を複数選択してください', 'cni-blocks' ) )
						: galleryType === 'carousel' ? el(
							'div',
							{ className: 'cni-carousel' },
							el(
								'div',
								{ className: 'cni-carousel-viewport' },
								el(
									'div',
									{ className: 'cni-carousel-track' },
									images.map( function( img, i ) {
										return el(
											'div',
											{
												key: img.id || i,
												className: 'cni-carousel-item cni-carousel-item--editable' + ( i === selected ? ' is-selected' : '' ),
												role: 'button',
												tabIndex: 0,
												'aria-pressed': i === selected,
												'aria-label': __( '画像', 'cni-blocks' ) + ( i + 1 ) + __( 'のリンクを設定', 'cni-blocks' ),
												onClick: function() { setSelected( i ); },
												onKeyDown: function( event ) {
													if ( event.key === 'Enter' || event.key === ' ' ) {
														event.preventDefault();
														setSelected( i );
													}
												},
											},
											el( 'img', { src: img.url, alt: img.alt || '' } ),
											el( 'span', { className: 'cni-editor-image-number', 'aria-hidden': 'true' }, i + 1 ),
											img.linkUrl ? el( 'span', { className: 'cni-editor-link-status', 'aria-hidden': 'true' }, '🔗' ) : null,
											showCaption && img.text ? el( 'div', { className: captionClass }, img.text ) : null
										);
									} )
								)
							),
							showArrows ? el( 'button', { type: 'button', className: 'cni-carousel-arrow cni-carousel-arrow--prev', disabled: true, 'aria-label': __( '前へ', 'cni-blocks' ) }, '‹' ) : null,
							showArrows ? el( 'button', { type: 'button', className: 'cni-carousel-arrow cni-carousel-arrow--next', disabled: true, 'aria-label': __( '次へ', 'cni-blocks' ) }, '›' ) : null
						) : el(
								element.Fragment,
								null,
								el(
									'div',
									{ className: 'cni-main', style: containerStyle, 'data-layout': showThumbnails ? ( attributes.layout || 'below' ) : 'below' },
									el(
										'div',
										{ className: 'cni-main-viewport', style: viewportStyle },
										el( 'img', { className: 'cni-main-img', src: main.url, alt: main.alt || '' } ),
										showCaption && isOverlay && main && main.text ? el( 'div', { className: captionClass }, main.text ) : null,
										showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-prev', disabled: images.length < 2, 'aria-label': __( '前へ', 'cni-blocks' ) }, '‹' ) : null,
										showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-next', disabled: images.length < 2, 'aria-label': __( '次へ', 'cni-blocks' ) }, '›' ) : null
									),
									showThumbnails ? el(
										'div',
										{ className: 'cni-thumbs', role: 'list' },
										images.map( function( img, i ) {
											return el(
												'button',
												{
													key: img.id || i,
													type: 'button',
													className: 'cni-thumb' + ( i === selected ? ' is-active' : '' ),
													onClick: function() { setSelected( i ); },
													'aria-label': __( '画像', 'cni-blocks' ) + ( i + 1 ),
												},
												el( 'img', { src: img.thumbUrl || img.url, alt: '' } )
											);
										} )
									) : null
								),
								showCaption && !isOverlay && main && main.text ? el( 'div', { className: captionClass }, main.text ) : null
						  )
				)
			);
		},

		save: function( props ) {
			const { attributes } = props;
			const images = attributes.images || [];
			const selected = typeof attributes.selected === 'number' ? attributes.selected : 0;

			const loop = attributes.loop !== false;
			const showArrows = attributes.showArrows !== false;
			const transition = attributes.transition || 'fade';
			const fixedWidth = typeof attributes.fixedWidth === 'number' ? attributes.fixedWidth : 0;
			const fixedHeight = typeof attributes.fixedHeight === 'number' ? attributes.fixedHeight : 0;
			const aspectRatio = ( ! attributes.aspectRatio || attributes.aspectRatio === 'auto' ) ? '3/2' : attributes.aspectRatio;
			const objectFit = attributes.objectFit || 'cover';
			const showCaption = !!attributes.showCaption;
			const captionPosition = attributes.captionPosition || 'below';
			const captionStyle = attributes.captionStyle || 'glass';
			const sideRatio = attributes.sideRatio || '3-1';
			const thumbnailSize = attributes.thumbnailSize || 'medium';
			const showThumbnails = attributes.showThumbnails !== false;
			const galleryType = attributes.galleryType || 'single';
			const carouselColumnsPc = typeof attributes.carouselColumnsPc === 'number' ? attributes.carouselColumnsPc : 3;
			const carouselColumnsTablet = typeof attributes.carouselColumnsTablet === 'number' ? attributes.carouselColumnsTablet : 2;
			const carouselColumnsMobile = typeof attributes.carouselColumnsMobile === 'number' ? attributes.carouselColumnsMobile : 1;
			const carouselGap = typeof attributes.carouselGap === 'number' ? attributes.carouselGap : 16;
			const carouselAutoplay = !!attributes.carouselAutoplay;
			const carouselAutoplayMode = attributes.carouselAutoplayMode || 'step';
			const carouselDirection = attributes.carouselDirection || 'left';
			const carouselInterval = typeof attributes.carouselInterval === 'number' ? attributes.carouselInterval : 4;
			const carouselTransitionDuration = typeof attributes.carouselTransitionDuration === 'number' ? attributes.carouselTransitionDuration : 500;
			const carouselContinuousSpeed = typeof attributes.carouselContinuousSpeed === 'number' ? attributes.carouselContinuousSpeed : 40;
			const carouselPauseOnHover = attributes.carouselPauseOnHover !== false;
			const carouselPauseOnFocus = attributes.carouselPauseOnFocus !== false;

			if ( ! images.length ) return null;

			const idx = Math.min( selected, images.length - 1 );
			const hasFrame = true;
			const cssRatio = ratioToCss( aspectRatio );

			const blockProps = blockEditor.useBlockProps.save( addArrowPositionData( {
				'data-selected': idx,
				'data-loop': loop ? '1' : '0',
				'data-arrows': showArrows ? '1' : '0',
				'data-transition': transition,
				'data-has-frame': hasFrame ? '1' : '0',
				'data-show-caption': showCaption ? '1' : '0',
				'data-caption-position': captionPosition,
				'data-caption-style': captionStyle,
				'data-aspect-ratio': aspectRatio,
				'data-object-fit': objectFit,
				'data-layout': showThumbnails ? ( attributes.layout || 'below' ) : 'below',
				'data-side-ratio': sideRatio,
				'data-thumbnail-size': thumbnailSize,
				style: addArrowStyleVariables( {
					'--cni-object-fit': objectFit,
					'--cni-side-main': getSideRatioVars( sideRatio ).main + 'fr',
					'--cni-side-thumbs': getSideRatioVars( sideRatio ).thumbs + 'fr',
					'--cni-thumb-size': getThumbSizeValue( thumbnailSize ),
				}, attributes ),
			}, attributes ) );

			const containerStyle = {};

			const viewportStyle = {};
			if ( cssRatio ) viewportStyle.aspectRatio = cssRatio;

			const captionClass = 'cni-caption cni-caption--' + captionPosition + ' cni-caption--' + captionStyle;
			const isOverlay = ( captionPosition === 'overlay' );

			if ( galleryType === 'carousel' ) {
				const carouselProps = blockEditor.useBlockProps.save( addArrowPositionData( {
					className: 'cni-gallery-type-carousel',
					'data-gallery-type': 'carousel',
					'data-loop': loop ? '1' : '0',
					'data-columns-pc': carouselColumnsPc,
					'data-columns-tablet': carouselColumnsTablet,
					'data-columns-mobile': carouselColumnsMobile,
					'data-autoplay': carouselAutoplay ? '1' : '0',
					'data-autoplay-mode': carouselAutoplayMode,
					'data-direction': carouselDirection,
					'data-interval': carouselInterval,
					'data-continuous-speed': carouselContinuousSpeed,
					'data-pause-hover': carouselPauseOnHover ? '1' : '0',
					'data-pause-focus': carouselPauseOnFocus ? '1' : '0',
					style: addArrowStyleVariables( {
						'--cni-object-fit': objectFit,
						'--cni-carousel-columns-pc': carouselColumnsPc,
						'--cni-carousel-columns-tablet': carouselColumnsTablet,
						'--cni-carousel-columns-mobile': carouselColumnsMobile,
						'--cni-carousel-gap': carouselGap + 'px',
						'--cni-carousel-ratio': cssRatio || '3 / 2',
						'--cni-carousel-duration': carouselTransitionDuration + 'ms',
					}, attributes ),
				}, attributes ) );
				return el(
					'div', carouselProps,
					el( 'div', { className: 'cni-carousel' },
						el( 'div', { className: 'cni-carousel-viewport', role: 'region', 'aria-label': __( '画像カルーセル', 'cni-blocks' ) },
							el( 'div', { className: 'cni-carousel-track', role: 'list' },
								images.map( function( img, i ) {
									const image = el( 'img', { src: img.url, alt: img.alt || '', loading: i < carouselColumnsPc ? 'eager' : 'lazy', decoding: 'async' } );
									const linkUrl = getSafeLinkUrl( img.linkUrl );
									const media = linkUrl ? el( 'a', { className: 'cni-carousel-link', href: linkUrl, target: img.linkTarget ? '_blank' : undefined, rel: img.linkTarget ? 'noopener noreferrer' : undefined }, image ) : image;
									return el( 'div', { key: img.id || i, className: 'cni-carousel-item', role: 'listitem' }, media, showCaption && img.text ? el( 'div', { className: captionClass }, img.text ) : null );
								} )
							)
						),
						showArrows ? el( 'button', { type: 'button', className: 'cni-carousel-arrow cni-carousel-arrow--prev', 'aria-label': __( '前へ', 'cni-blocks' ) }, '‹' ) : null,
						showArrows ? el( 'button', { type: 'button', className: 'cni-carousel-arrow cni-carousel-arrow--next', 'aria-label': __( '次へ', 'cni-blocks' ) }, '›' ) : null
					)
				);
			}

			return el(
				'div',
				blockProps,
				el(
					'div',
					{ className: 'cni-main', style: containerStyle, 'data-layout': showThumbnails ? ( attributes.layout || 'below' ) : 'below' },
					el(
						'div',
						{ className: 'cni-main-viewport', style: viewportStyle },
						el(
							'div',
							{ className: 'cni-slides' },
							images.map( function( img, i ) {
								const cls = 'cni-slide' + ( i === idx ? ' is-active' : '' );
								const isFirst = i === idx;
								return renderLinkedImage( img, {
									className: cls,
									src: img.url,
									alt: img.alt || '',
									loading: isFirst ? 'eager' : 'lazy',
									decoding: 'async',
								}, img.id || i );
							} )
						),
						showCaption && isOverlay && images[ idx ] && images[ idx ].text ? el( 'div', { className: captionClass }, images[ idx ].text ) : null,
						showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-prev', 'aria-label': __( '前へ', 'cni-blocks' ) }, '‹' ) : null,
						showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-next', 'aria-label': __( '次へ', 'cni-blocks' ) }, '›' ) : null
					),
					el(
						'div',
						{ className: 'cni-thumbs', role: 'list', hidden: showThumbnails ? undefined : true, 'aria-hidden': showThumbnails ? undefined : 'true' },
						images.map( function( img, i ) {
							return el(
								'button',
								{
									key: img.id || i,
									type: 'button',
									className: 'cni-thumb' + ( i === idx ? ' is-active' : '' ),
									'data-index': i,
									'data-text': img.text || '',
									tabIndex: showThumbnails ? undefined : -1,
									'aria-label': __( '画像', 'cni-blocks' ) + ( i + 1 ),
								},
								el( 'img', { src: img.thumbUrl || img.url, alt: '' } )
							);
						} )
					)
				),
				showCaption && !isOverlay && images[ idx ] && images[ idx ].text ? el( 'div', { className: captionClass }, images[ idx ].text ) : null
			);
		},
	} );

blocks.registerBlockType( 'cni-blocks/tile-gallery', {
  apiVersion: 3,
  title: __('タイルギャラリー', 'cni-blocks'),
  icon: 'screenoptions',
  category: 'cni-blocks',
  description: __('表示タイプ選択・ライトボックス付きギャラリー。', 'cni-blocks'),
  attributes: {
    images: { type: 'array', default: [] },
    columnsSp: { type: 'number', default: 2 },
    columnsPc: { type: 'number', default: 4 },
    gap: { type: 'number', default: 8 },
    radius: { type: 'number', default: 0 },
    shadow: { type: 'boolean', default: false },
    showCaption: { type: 'boolean', default: false },
    displayType: { type: 'string', default: 'grid' },
    borderOn: { type: 'boolean', default: false },
    borderColor: { type: 'string', default: '#dddddd' },
    borderWidth: { type: 'number', default: 1 },
    lightbox: { type: 'boolean', default: true },
    previewDevice: { type: 'string', default: 'pc' },
    masonryColumnsSp: { type: 'number', default: 2 },
    masonryColumnsPc: { type: 'number', default: 3 }
  },
  edit: function (props) {
    const { attributes, setAttributes } = props;
    const images = attributes.images || [];
    const columnsSp = attributes.columnsSp || 2;
    const columnsPc = attributes.columnsPc || 4;
    const gap = typeof attributes.gap === 'number' ? attributes.gap : 8;
    const radius = typeof attributes.radius === 'number' ? attributes.radius : 0;
    const shadow = !!attributes.shadow;
    const showCaption = !!attributes.showCaption;
    const displayType = attributes.displayType || 'grid';
    const lightbox = attributes.lightbox !== false;
    const borderOn = !!attributes.borderOn;
    const borderColor = attributes.borderColor || '#dddddd';
    const borderWidth = typeof attributes.borderWidth === 'number' ? attributes.borderWidth : 1;
    const previewDevice = attributes.previewDevice || 'pc';
    const masonryColumnsSp = attributes.masonryColumnsSp || 2;
    const masonryColumnsPc = attributes.masonryColumnsPc || 3;

    const blockProps = useBlockProps({
      className: 'cni-tile-gallery cni-display-' + displayType + ' cni-editor-preview-' + previewDevice + (borderOn ? ' cni-has-border' : ''),
      'data-display-type': displayType,
      style: {
        '--cni-tile-cols-sp': columnsSp,
        '--cni-tile-cols-pc': columnsPc,
        '--cni-tile-gap': gap + 'px',
        '--cni-tile-radius': radius + 'px',
        '--cni-tile-border-color': borderColor,
        '--cni-tile-border-width': (borderOn ? borderWidth : 0) + 'px',
        '--cni-masonry-cols-sp': masonryColumnsSp,
        '--cni-masonry-cols-pc': masonryColumnsPc
      }
    });

    const editorCols = previewDevice === 'sp' ? columnsSp : columnsPc;
    const editorMasonryCols = previewDevice === 'sp' ? masonryColumnsSp : masonryColumnsPc;

    const tileGridStyle = {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + editorCols + ', minmax(0, 1fr))',
      gap: gap + 'px'
    };

    if (displayType === 'masonry') {
      tileGridStyle.display = 'block';
      tileGridStyle.columns = editorMasonryCols;
      tileGridStyle.columnGap = gap + 'px';
    } else if (displayType === 'justified') {
      tileGridStyle.display = 'flex';
      tileGridStyle.flexWrap = 'wrap';
    } else if (displayType === 'single-thumbnail') {
      tileGridStyle.display = 'block';
      delete tileGridStyle.gridTemplateColumns;
    }

    const getEditorItemStyle = function(index) {
      const itemStyle = { margin: 0 };

      if (displayType === 'masonry') {
        itemStyle.breakInside = 'avoid';
        itemStyle.marginBottom = gap + 'px';
      } else if (displayType === 'justified') {
        itemStyle.flex = '1 1 calc((100% - (' + gap + 'px * (' + editorCols + ' - 1))) / ' + editorCols + ')';
      } else if (displayType === 'portfolio' && index === 0) {
        itemStyle.gridColumn = '1 / -1';
      } else if (displayType === 'single-thumbnail' && index > 0) {
        itemStyle.display = 'none';
      }

      return itemStyle;
    };

    const tileImageStyle = {
      display: 'block',
      width: '100%',
      height: displayType === 'justified' ? '180px' : 'auto',
      objectFit: displayType === 'justified' ? 'cover' : undefined,
      borderRadius: radius + 'px',
      border: borderOn ? borderWidth + 'px solid ' + borderColor : '0',
      boxShadow: shadow ? '0 8px 20px rgba(0,0,0,.18)' : 'none'
    };

    const onSelectImages = function (media) {
      const normalized = (media || []).map(function (m) {
        return {
          id: m.id,
          url: m.url,
          alt: m.alt || '',
          caption: getRenderedText(m && m.caption)
        };
      });
      setAttributes({ images: normalized });
    };

    return el(
      element.Fragment,
      null,
      el(InspectorControls, null,
        el(PanelBody, { title: __('表示タイプ', 'cni-blocks'), initialOpen: true },
          el(SelectControl, {
            label: __('表示タイプ', 'cni-blocks'),
            value: displayType,
            options: [
              { label: 'grid', value: 'grid' },
              { label: 'justified', value: 'justified' },
              { label: 'masonry', value: 'masonry' },
              { label: 'portfolio', value: 'portfolio' },
              { label: 'single-thumbnail', value: 'single-thumbnail' }
            ],
            onChange: (v) => setAttributes({ displayType: v || 'grid' })
          }),
          el(SelectControl, {
            label: __('編集プレビュー', 'cni-blocks'),
            value: previewDevice,
            options: [
              { label: __('PC', 'cni-blocks'), value: 'pc' },
              { label: __('スマホ', 'cni-blocks'), value: 'sp' }
            ],
            onChange: (v) => setAttributes({ previewDevice: v || 'pc' })
          })
        ),
        el(PanelBody, { title: __('デザイン', 'cni-blocks'), initialOpen: false },
          el(RangeControl, { label: __('スマホ列数', 'cni-blocks'), value: columnsSp, min: 1, max: 3, onChange: (v) => setAttributes({ columnsSp: v || 1 }) }),
          el(RangeControl, { label: __('PC列数', 'cni-blocks'), value: columnsPc, min: 1, max: 6, onChange: (v) => setAttributes({ columnsPc: v || 1 }) }),
          el(RangeControl, { label: __('gap(px)', 'cni-blocks'), value: gap, min: 0, max: 40, onChange: (v) => setAttributes({ gap: v || 0 }) }),
          el(RangeControl, { label: __('角丸(px)', 'cni-blocks'), value: radius, min: 0, max: 40, onChange: (v) => setAttributes({ radius: v || 0 }) }),
          el(ToggleControl, { label: __('画像の外枠', 'cni-blocks'), checked: borderOn, onChange: (v) => setAttributes({ borderOn: !!v }) }),
          borderOn ? el(ColorPalette, {
            value: borderColor,
            onChange: (v) => setAttributes({ borderColor: v || '#dddddd' })
          }) : null,
          borderOn ? el(RangeControl, { label: __('外枠太さ(px)', 'cni-blocks'), value: borderWidth, min: 1, max: 12, onChange: (v) => setAttributes({ borderWidth: v || 1 }) }) : null,
          displayType === 'masonry' ? el(RangeControl, { label: __('Masonry列数(スマホ)', 'cni-blocks'), value: masonryColumnsSp, min: 1, max: 4, onChange: (v) => setAttributes({ masonryColumnsSp: v || 1 }) }) : null,
          displayType === 'masonry' ? el(RangeControl, { label: __('Masonry列数(PC)', 'cni-blocks'), value: masonryColumnsPc, min: 2, max: 6, onChange: (v) => setAttributes({ masonryColumnsPc: v || 2 }) }) : null,
          el(ToggleControl, { label: __('影をつける', 'cni-blocks'), checked: shadow, onChange: (v) => setAttributes({ shadow: !!v }) }),
          el(ToggleControl, { label: __('キャプション表示', 'cni-blocks'), checked: showCaption, onChange: (v) => setAttributes({ showCaption: !!v }) })
        ),
        el(PanelBody, { title: __('ライトボックス', 'cni-blocks'), initialOpen: false },
          el(ToggleControl, { label: __('画像クリックで拡大表示', 'cni-blocks'), checked: lightbox, onChange: (v) => setAttributes({ lightbox: !!v }) })
        )
      ),
      el('div', blockProps,
        el('div', { className: 'cni-editor-toolbar' },
          el(MediaUploadCheck, null,
            el(MediaUpload, {
              onSelect: onSelectImages,
              allowedTypes: ['image'],
              multiple: true,
              gallery: true,
              value: images.map((i) => i.id).filter(Boolean),
              render: (obj) => el(Button, { variant: 'primary', onClick: obj.open }, images.length ? __('画像を差し替える', 'cni-blocks') : __('画像を追加', 'cni-blocks'))
            })
          )
        ),
        el('div', { className: 'cni-tile-grid' + (shadow ? ' is-shadow' : ''), style: tileGridStyle },
          images.map((img, i) =>
            el('figure', { key: img.id || i, className: 'cni-tile-item', style: getEditorItemStyle(i) },
              el('img', { src: img.url, alt: img.alt || '', loading: 'lazy', decoding: 'async', style: tileImageStyle }),
              showCaption && img.caption ? el('figcaption', { className: 'cni-tile-cap' }, img.caption) : null
            )
          )
        )
      )
    );
  },
  save: function (props) {
    const { attributes } = props;
    const images = attributes.images || [];
    const displayType = attributes.displayType || 'grid';
    const lightbox = attributes.lightbox !== false;
    const borderOn = !!attributes.borderOn;
    const borderWidth = typeof attributes.borderWidth === 'number' ? attributes.borderWidth : 1;
    const borderColor = attributes.borderColor || '#dddddd';
    const blockProps = blockEditor.useBlockProps.save({
      className: 'cni-tile-gallery cni-display-' + displayType + (borderOn ? ' cni-has-border' : ''),
      'data-display-type': displayType,
      'data-lightbox': attributes.lightbox !== false ? '1' : '0',
      style: {
        '--cni-tile-cols-sp': attributes.columnsSp || 2,
        '--cni-tile-cols-pc': attributes.columnsPc || 4,
        '--cni-tile-gap': (typeof attributes.gap === 'number' ? attributes.gap : 8) + 'px',
        '--cni-tile-radius': (typeof attributes.radius === 'number' ? attributes.radius : 0) + 'px',
        '--cni-tile-border-color': borderColor,
        '--cni-tile-border-width': (borderOn ? borderWidth : 0) + 'px',
        '--cni-masonry-cols-sp': attributes.masonryColumnsSp || 2,
        '--cni-masonry-cols-pc': attributes.masonryColumnsPc || 3
      }
    });

    return el('div', blockProps,
      el('div', { className: 'cni-tile-grid' + (attributes.shadow ? ' is-shadow' : '') },
        images.map((img, i) =>
          el('figure', { key: img.id || i, className: 'cni-tile-item' },
            lightbox
              ? el('button', { type: 'button', className: 'cni-tile-trigger', 'data-index': i, 'aria-label': __('画像', 'cni-blocks') + (i + 1) },
                  el('img', { src: img.url, alt: img.alt || '', loading: 'lazy', decoding: 'async' })
                )
              : el('img', { src: img.url, alt: img.alt || '', loading: 'lazy', decoding: 'async' }),
            attributes.showCaption && img.caption ? el('figcaption', { className: 'cni-tile-cap' }, img.caption) : null
          )
        )
      )
    );
  }
});


} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

( function( blocks, element, blockEditor, components, i18n ) {
	const el = element.createElement;
	const useMemo = element.useMemo;

	const { __ } = i18n;
	const { useBlockProps, MediaUpload, MediaUploadCheck, InspectorControls } = blockEditor;
	const { Button, PanelBody, ToggleControl, SelectControl, RangeControl } = components;

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

	blocks.registerBlockType( 'cni-blocks/slide-gallery', {
		title: __( 'スライドギャラリー', 'cni-blocks' ),
		icon: 'format-gallery',
		category: 'media',
		description: __( 'メイン画像＋サムネ切替＋矢印＋アニメーション。キャプション表示も可能。', 'cni-blocks' ),
		attributes: {
			images: { type: 'array', default: [] },
			selected: { type: 'number', default: 0 },
			loop: { type: 'boolean', default: true },
			showArrows: { type: 'boolean', default: true },
			transition: { type: 'string', default: 'fade' },
			fixedWidth: { type: 'number', default: 0 },
			fixedHeight: { type: 'number', default: 0 },
			aspectRatio: { type: 'string', default: 'auto' },
			layout: { type: 'string', default: 'below' },
			objectFit: { type: 'string', default: 'cover' },
			showCaption: { type: 'boolean', default: false },
			captionPosition: { type: 'string', default: 'below' }, // below|overlay
			captionStyle: { type: 'string', default: 'glass' },     // glass|dark|light
		},

		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const images = attributes.images || [];
			const selected = typeof attributes.selected === 'number' ? attributes.selected : 0;

			const loop = attributes.loop !== false;
			const showArrows = attributes.showArrows !== false;
			const transition = attributes.transition || 'fade';
			const fixedWidth = typeof attributes.fixedWidth === 'number' ? attributes.fixedWidth : 0;
			const fixedHeight = typeof attributes.fixedHeight === 'number' ? attributes.fixedHeight : 0;
			const aspectRatio = attributes.aspectRatio || 'auto';
			const objectFit = attributes.objectFit || 'cover';
			const showCaption = !!attributes.showCaption;
			const captionPosition = attributes.captionPosition || 'below';
			const captionStyle = attributes.captionStyle || 'glass';

			const main = useMemo( function() {
				return getMain( images, selected );
			}, [ images, selected ] );

			const onSelectImages = function( media ) {
				const normalized = ( media || [] ).map( function( m ) {
					const thumbUrl =
						( m && m.sizes && m.sizes.thumbnail && m.sizes.thumbnail.url ) ||
						( m && m.sizes && m.sizes.medium && m.sizes.medium.url ) ||
						( m && m.url ) ||
						'';

					const caption = getRenderedText( m && m.caption );
					const description = getRenderedText( m && m.description );
					const text = caption || description || '';

					return {
						id: m.id,
						url: m.url,
						alt: m.alt || '',
						thumbUrl: thumbUrl,
						text: text,
					};
				} );

				setAttributes( {
					images: normalized,
					selected: normalized.length ? 0 : 0,
				} );
			};

			const setSelected = function( idx ) {
				setAttributes( { selected: idx } );
			};

			const removeAll = function() {
				setAttributes( { images: [], selected: 0 } );
			};

			const hasFrame = ( aspectRatio !== 'auto' ) || ( fixedHeight > 0 );
			const containerStyle = {};
			if ( fixedWidth > 0 ) containerStyle.maxWidth = fixedWidth + 'px';

			const viewportStyle = {};
			const cssRatio = ratioToCss( aspectRatio );
			if ( cssRatio ) viewportStyle.aspectRatio = cssRatio;
			if ( fixedHeight > 0 ) viewportStyle.height = fixedHeight + 'px';

			const blockStyleVars = { '--cni-object-fit': objectFit };
			const blockProps = useBlockProps( { style: blockStyleVars } );

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
						el( ToggleControl, {
							label: __( '矢印を表示', 'cni-blocks' ),
							checked: showArrows,
							onChange: function( v ) { setAttributes( { showArrows: !!v } ); },
						} ),
						el( ToggleControl, {
							label: __( '無限ループ', 'cni-blocks' ),
							help: __( '矢印で端まで進んだとき、先頭/末尾に戻します。', 'cni-blocks' ),
							checked: loop,
							onChange: function( v ) { setAttributes( { loop: !!v } ); },
						} ),
						el( SelectControl, {
							label: __( '切り替え効果', 'cni-blocks' ),
							value: transition,
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( 'フェード', 'cni-blocks' ), value: 'fade' },
								{ label: __( 'スライド', 'cni-blocks' ), value: 'slide' },
							],
							help: hasFrame ? '' : __( 'スライド/トリミングを安定させるには「比率」を指定するのがおすすめです。', 'cni-blocks' ),
							onChange: function( v ) { setAttributes( { transition: v } ); },
						} ),
							el( SelectControl, {
								label: __( 'レイアウト', 'cni-blocks' ),
								value: attributes.layout || 'below',
								options: [
									{ label: __( '下にサムネイル', 'cni-blocks' ), value: 'below' },
									{ label: __( '右にサムネイル（PC）', 'cni-blocks' ), value: 'side' },
								],
								help: __( 'PC表示（782px以上）で左右2カラムにします。スマホは縦積み。', 'cni-blocks' ),
								onChange: function( v ) { setAttributes( { layout: v } ); },
							} ),
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
					el(
						PanelBody,
						{ title: __( 'サイズ・比率', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, {
							label: __( '幅（0=自動）', 'cni-blocks' ),
							value: fixedWidth,
							min: 0,
							max: 1600,
							step: 10,
							onChange: function( v ) { setAttributes( { fixedWidth: v || 0 } ); },
						} ),
						el( SelectControl, {
							label: __( 'メイン画像の比率', 'cni-blocks' ),
							value: aspectRatio,
							options: [
								{ label: __( '自動（元画像に合わせる）', 'cni-blocks' ), value: 'auto' },
								{ label: '1:1', value: '1/1' },
								{ label: '4:3', value: '4/3' },
								{ label: '16:9', value: '16/9' },
								{ label: '3:2', value: '3/2' },
								{ label: '2:1', value: '2/1' },
								{ label: '21:9', value: '21/9' },
								{ label: '5:2', value: '5/2' },
								{ label: '3:1', value: '3/1' },
								{ label: '4:1', value: '4/1' },
								{ label: '3:4', value: '3/4' },
							],
							help: __( '比率を指定すると、縦横混在でも高さが揃い、coverが効きやすくなります。', 'cni-blocks' ),
							onChange: function( v ) { setAttributes( { aspectRatio: v } ); },
						} ),
						el( RangeControl, {
							label: __( '高さ（px / 0=自動）', 'cni-blocks' ),
							value: fixedHeight,
							min: 0,
							max: 1200,
							step: 10,
							help: __( '高さ固定は旧仕様です。できれば比率指定を推奨。', 'cni-blocks' ),
							onChange: function( v ) { setAttributes( { fixedHeight: v || 0 } ); },
						} )
					)
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
						: el(
								element.Fragment,
								null,
								el(
									'div',
									{ className: 'cni-main', style: containerStyle, 'data-layout': (attributes.layout || 'below') },
									showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-prev', disabled: images.length < 2 }, '?' ) : null,
									el(
										'div',
										{ className: 'cni-main-viewport', style: viewportStyle },
										el( 'img', { className: 'cni-main-img', src: main.url, alt: main.alt || '' } ),
										showCaption && isOverlay && main && main.text ? el( 'div', { className: captionClass }, main.text ) : null
									),
									showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-next', disabled: images.length < 2 }, '?' ) : null
								),
								showCaption && !isOverlay && main && main.text ? el( 'div', { className: captionClass }, main.text ) : null,
								el(
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
								)
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
			const aspectRatio = attributes.aspectRatio || 'auto';
			const objectFit = attributes.objectFit || 'cover';
			const showCaption = !!attributes.showCaption;
			const captionPosition = attributes.captionPosition || 'below';
			const captionStyle = attributes.captionStyle || 'glass';

			if ( ! images.length ) return null;

			const idx = Math.min( selected, images.length - 1 );
			const hasFrame = ( aspectRatio !== 'auto' ) || ( fixedHeight > 0 );
			const cssRatio = ratioToCss( aspectRatio );

			const blockProps = blockEditor.useBlockProps.save( {
				'data-selected': idx,
				'data-loop': loop ? '1' : '0',
				'data-arrows': showArrows ? '1' : '0',
				'data-transition': transition,
				'data-has-frame': hasFrame ? '1' : '0',
				'data-show-caption': showCaption ? '1' : '0',
				'data-caption-position': captionPosition,
				'data-caption-style': captionStyle,
				'data-fixed-width': fixedWidth || 0,
				'data-fixed-height': fixedHeight || 0,
				'data-aspect-ratio': aspectRatio,
				'data-object-fit': objectFit,
				'data-layout': (attributes.layout || 'below'),
				style: { '--cni-object-fit': objectFit },
			} );

			const containerStyle = {};
			if ( fixedWidth > 0 ) containerStyle.maxWidth = fixedWidth + 'px';

			const viewportStyle = {};
			if ( cssRatio ) viewportStyle.aspectRatio = cssRatio;
			if ( fixedHeight > 0 ) viewportStyle.height = fixedHeight + 'px';

			const captionClass = 'cni-caption cni-caption--' + captionPosition + ' cni-caption--' + captionStyle;
			const isOverlay = ( captionPosition === 'overlay' );

			return el(
				'div',
				blockProps,
				el(
					'div',
					{ className: 'cni-main', style: containerStyle, 'data-layout': (attributes.layout || 'below') },
					showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-prev', 'aria-label': __( '前へ', 'cni-blocks' ) }, '?' ) : null,
					el(
						'div',
						{ className: 'cni-main-viewport', style: viewportStyle },
						el(
							'div',
							{ className: 'cni-slides' },
							images.map( function( img, i ) {
								const cls = 'cni-slide' + ( i === idx ? ' is-active' : '' );
								const isFirst = i === idx;
								return el( 'img', {
									key: img.id || i,
									className: cls,
									src: img.url,
									alt: img.alt || '',
									loading: isFirst ? 'eager' : 'lazy',
									decoding: 'async',
								} );
							} )
						),
						showCaption && isOverlay && images[ idx ] && images[ idx ].text ? el( 'div', { className: captionClass }, images[ idx ].text ) : null
						,
						showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-prev', 'aria-label': __( '前へ', 'cni-blocks' ) }, '?' ) : null,
						showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-next', 'aria-label': __( '次へ', 'cni-blocks' ) }, '?' ) : null

					),
					showArrows ? el( 'button', { type: 'button', className: 'cni-arrow cni-arrow-next', 'aria-label': __( '次へ', 'cni-blocks' ) }, '?' ) : null
				),
				showCaption && !isOverlay && images[ idx ] && images[ idx ].text ? el( 'div', { className: captionClass }, images[ idx ].text ) : null,
				el(
					'div',
					{ className: 'cni-thumbs', role: 'list' },
					images.map( function( img, i ) {
						return el(
							'button',
							{
								key: img.id || i,
								type: 'button',
								className: 'cni-thumb' + ( i === idx ? ' is-active' : '' ),
								'data-index': i,
								'data-text': img.text || '',
								'aria-label': __( '画像', 'cni-blocks' ) + ( i + 1 ),
							},
							el( 'img', { src: img.thumbUrl || img.url, alt: '' } )
						);
					} )
				)
			);
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

blocks.registerBlockType('cni-blocks/tile-gallery', {
  title: __('タイルギャラリー', 'cni-blocks'),
  icon: 'screenoptions',
  category: 'media',
  description: __('通常ギャラリー向け。レスポンシブ列数とgap、角丸/影を設定可能。', 'cni-blocks'),
  attributes: {
    images: { type: 'array', default: [] },
    columnsSp: { type: 'number', default: 2 },
    columnsPc: { type: 'number', default: 4 },
    gap: { type: 'number', default: 8 },
    radius: { type: 'number', default: 0 },
    shadow: { type: 'boolean', default: false },
    showCaption: { type: 'boolean', default: false }
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

    const blockProps = useBlockProps({
      className: 'cni-tile-gallery',
      style: {
        '--cni-tile-cols-sp': columnsSp,
        '--cni-tile-cols-pc': columnsPc,
        '--cni-tile-gap': gap + 'px',
        '--cni-tile-radius': radius + 'px'
      }
    });

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
        el(PanelBody, { title: __('レイアウト', 'cni-blocks'), initialOpen: true },
          el(RangeControl, { label: __('スマホ列数', 'cni-blocks'), value: columnsSp, min: 1, max: 3, onChange: (v) => setAttributes({ columnsSp: v || 1 }) }),
          el(RangeControl, { label: __('PC列数', 'cni-blocks'), value: columnsPc, min: 2, max: 6, onChange: (v) => setAttributes({ columnsPc: v || 2 }) }),
          el(RangeControl, { label: __('gap(px)', 'cni-blocks'), value: gap, min: 0, max: 40, onChange: (v) => setAttributes({ gap: v || 0 }) }),
          el(RangeControl, { label: __('角丸(px)', 'cni-blocks'), value: radius, min: 0, max: 40, onChange: (v) => setAttributes({ radius: v || 0 }) }),
          el(ToggleControl, { label: __('影をつける', 'cni-blocks'), checked: shadow, onChange: (v) => setAttributes({ shadow: !!v }) }),
          el(ToggleControl, { label: __('キャプション表示', 'cni-blocks'), checked: showCaption, onChange: (v) => setAttributes({ showCaption: !!v }) })
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
        el('div', { className: 'cni-tile-grid' + (shadow ? ' is-shadow' : '') },
          images.map((img, i) =>
            el('figure', { key: img.id || i, className: 'cni-tile-item' },
              el('img', { src: img.url, alt: img.alt || '' }),
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
    const blockProps = blockEditor.useBlockProps.save({
      className: 'cni-tile-gallery',
      style: {
        '--cni-tile-cols-sp': attributes.columnsSp || 2,
        '--cni-tile-cols-pc': attributes.columnsPc || 4,
        '--cni-tile-gap': (typeof attributes.gap === 'number' ? attributes.gap : 8) + 'px',
        '--cni-tile-radius': (typeof attributes.radius === 'number' ? attributes.radius : 0) + 'px'
      }
    });

    return el('div', blockProps,
      el('div', { className: 'cni-tile-grid' + (attributes.shadow ? ' is-shadow' : '') },
        images.map((img, i) =>
          el('figure', { key: img.id || i, className: 'cni-tile-item' },
            el('img', { src: img.url, alt: img.alt || '' }),
            attributes.showCaption && img.caption ? el('figcaption', { className: 'cni-tile-cap' }, img.caption) : null
          )
        )
      )
    );
  }
});

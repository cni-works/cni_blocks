( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';
	const el = element.createElement;
	const { __ } = i18n;
	const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, TextareaControl, ToggleControl } = components;
	const { useRef, useState } = element;
	const attributes = {
		imageId: { type: 'number', default: 0 }, imageUrl: { type: 'string', default: '' }, imageAlt: { type: 'string', default: '' }, mobileImageId: { type: 'number', default: 0 }, mobileImageUrl: { type: 'string', default: '' }, mobileImageAlt: { type: 'string', default: '' }, mode: { type: 'string', default: 'hotspot' }, markers: { type: 'array', default: [] }, visualLinks: { type: 'array', default: [] },
		interaction: { type: 'string', default: 'click' }, markerStyle: { type: 'string', default: 'plus' }, markerColor: { type: 'string', default: '#1769aa' }, markerSize: { type: 'number', default: 38 }, markerPulse: { type: 'boolean', default: true }, cardPosition: { type: 'string', default: 'auto' }, cardDisplay: { type: 'string', default: 'card' }, modalPosition: { type: 'string', default: 'center' }, modalOffsetY: { type: 'number', default: 0 }
	};
	function clamp( value, min, max, fallback ) { const number = typeof value === 'number' ? value : fallback; return Math.max( min, Math.min( max, number ) ); }
	function markerId() { return 'point-' + Date.now().toString( 36 ) + '-' + Math.random().toString( 36 ).slice( 2, 7 ); }
	function visualLinkId() { return 'visual-link-' + Date.now().toString( 36 ) + '-' + Math.random().toString( 36 ).slice( 2, 7 ); }
	function responsiveNumber( item, key, isMobile, fallback ) { const mobileKey = 'mobile' + key.charAt( 0 ).toUpperCase() + key.slice( 1 ); return isMobile && typeof item[ mobileKey ] === 'number' ? item[ mobileKey ] : ( typeof item[ key ] === 'number' ? item[ key ] : fallback ); }
	function markerLabel( marker, index ) { return ( marker && marker.title ) || __( 'ポイント', 'cni-blocks' ) + ' ' + ( index + 1 ); }
	function markerIcon( style, index ) { return style === 'dot' ? '●' : ( style === 'number' ? String( index + 1 ) : '+' ); }
	function markerButton( marker, index, current, onClick, style, preview, pointerHandlers ) {
		return el( 'button', Object.assign( { type: 'button', className: 'cni-image-hotspot-plus__point' + ( current ? ' is-selected' : '' ), style: { left: clamp( marker.x, 0, 100, 50 ) + '%', top: clamp( marker.y, 0, 100, 50 ) + '%' }, onClick: onClick, 'aria-label': markerLabel( marker, index ) }, pointerHandlers || {} ), markerIcon( style, index ), preview ? el( 'span', { className: 'screen-reader-text' }, markerLabel( marker, index ) ) : null );
	}
	function visualLinkButton( link, index, current, isMobile, onClick, pointerHandlers ) {
		const x = responsiveNumber( link, 'x', isMobile, 50 ); const y = responsiveNumber( link, 'y', isMobile, 50 ); const width = responsiveNumber( link, 'width', isMobile, 30 );
		const hover = [ 'none', 'lift', 'scale', 'brighten', 'shadow', 'pulse', 'tada', 'jello', 'swing' ].indexOf( link.hoverEffect ) !== -1 ? link.hoverEffect : 'lift';
		const attention = [ 'none', 'pulse', 'tada', 'jello', 'swing' ].indexOf( link.attentionAnimation ) !== -1 ? link.attentionAnimation : 'none';
		return el( 'button', Object.assign( { type: 'button', className: 'cni-image-hotspot-plus__visual-link cni-image-hotspot-plus__visual-link--hover-' + hover + ' cni-image-hotspot-plus__visual-link--attention-' + attention + ( current ? ' is-selected' : '' ), style: { left: x + '%', top: y + '%', width: width + '%', '--cni-visual-link-delay': ( index * 0.55 ) + 's' }, onClick: onClick, 'aria-label': link.ariaLabel || link.imageAlt || __( '画像リンク', 'cni-blocks' ) + ' ' + ( index + 1 ) }, pointerHandlers || {} ), link.imageUrl ? el( 'img', { src: link.imageUrl, alt: '' } ) : null );
	}
	blocks.registerBlockType( 'cni-blocks/image-hotspot-plus', {
		apiVersion: 3, title: __( 'Image Hotspot+', 'cni-blocks' ), icon: 'location-alt', category: 'cni-blocks', description: __( '画像の好きな位置にポイントと、画像付きの詳細カードを配置します。', 'cni-blocks' ), keywords: [ 'hotspot', '画像', 'ポイント' ], attributes: attributes, supports: { align: [ 'wide', 'full' ], anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			const set = props.setAttributes;
			const visualMode = a.mode === 'visual-link';
			const markers = Array.isArray( a.markers ) ? a.markers : [];
			const visualLinks = Array.isArray( a.visualLinks ) ? a.visualLinks : [];
			const [ selectedId, setSelectedId ] = useState( markers[0] ? markers[0].id : '' );
			const [ selectedVisualId, setSelectedVisualId ] = useState( visualLinks[0] ? visualLinks[0].id : '' );
			const [ editingDevice, setEditingDevice ] = useState( 'desktop' );
			const draggingId = useRef( '' );
			const visualDrag = useRef( null );
			const selectedIndex = Math.max( 0, markers.findIndex( function( marker ) { return marker.id === selectedId; } ) );
			const selected = markers[ selectedIndex ] || null;
			const selectedVisual = visualLinks.find( function( link ) { return link.id === selectedVisualId; } ) || null;
			const editingMobile = editingDevice === 'mobile';
			const updateMarker = function( changes ) { if ( ! selected ) return; const next = markers.slice(); next[ selectedIndex ] = Object.assign( {}, selected, changes ); set( { markers: next } ); };
			const updateMarkerById = function( id, changes ) { set( { markers: markers.map( function( marker ) { return marker.id === id ? Object.assign( {}, marker, changes ) : marker; } ) } ); };
			const updateVisual = function( changes ) { if ( ! selectedVisual ) return; set( { visualLinks: visualLinks.map( function( link ) { return link.id === selectedVisual.id ? Object.assign( {}, link, changes ) : link; } ) } ); };
			const updateVisualById = function( id, changes ) { set( { visualLinks: visualLinks.map( function( link ) { return link.id === id ? Object.assign( {}, link, changes ) : link; } ) } ); };
			const markerPositionFromPointer = function( event ) { const rect = event.currentTarget.closest( '.cni-image-hotspot-plus__stage' ).getBoundingClientRect(); return { x: clamp( ( event.clientX - rect.left ) / rect.width * 100, 0, 100, 50 ), y: clamp( ( event.clientY - rect.top ) / rect.height * 100, 0, 100, 50 ) }; };
			const startDrag = function( event, marker ) { if ( event.button !== 0 ) return; event.preventDefault(); event.stopPropagation(); draggingId.current = marker.id; setSelectedId( marker.id ); if ( event.currentTarget.setPointerCapture ) event.currentTarget.setPointerCapture( event.pointerId ); updateMarkerById( marker.id, markerPositionFromPointer( event ) ); };
			const moveDrag = function( event, marker ) { if ( draggingId.current !== marker.id ) return; event.preventDefault(); updateMarkerById( marker.id, markerPositionFromPointer( event ) ); };
			const endDrag = function( event, marker ) { if ( draggingId.current !== marker.id ) return; draggingId.current = ''; if ( event.currentTarget.releasePointerCapture && event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture( event.pointerId ) ) event.currentTarget.releasePointerCapture( event.pointerId ); };
			const chooseImage = function( media ) { if ( media && media.url ) set( { imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '' } ); };
			const chooseMobileImage = function( media ) { if ( media && media.url ) set( { mobileImageId: media.id || 0, mobileImageUrl: media.url, mobileImageAlt: media.alt || '' } ); };
			const chooseCardImage = function( media ) { if ( media && media.url ) updateMarker( { imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '' } ); };
			const chooseVisualImage = function( media ) { if ( ! media || ! media.url ) return; const link = { id: visualLinkId(), imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '', linkUrl: '', ariaLabel: '', newTab: false, hoverEffect: 'lift', attentionAnimation: 'none', x: 50, y: 50, width: 30 }; set( { visualLinks: visualLinks.concat( link ) } ); setSelectedVisualId( link.id ); };
			const replaceVisualImage = function( media ) { if ( media && media.url ) updateVisual( { imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '' } ); };
			const addMarker = function() { const marker = { id: markerId(), x: 50, y: 50, title: __( '新しいポイント', 'cni-blocks' ), description: '', imageId: 0, imageUrl: '', imageAlt: '', linkUrl: '', linkLabel: '' }; set( { markers: markers.concat( marker ) } ); setSelectedId( marker.id ); };
			const removeMarker = function() { if ( ! selected ) return; const next = markers.filter( function( marker ) { return marker.id !== selected.id; } ); set( { markers: next } ); setSelectedId( next[0] ? next[0].id : '' ); };
			const removeVisual = function() { if ( ! selectedVisual ) return; const next = visualLinks.filter( function( link ) { return link.id !== selectedVisual.id; } ); set( { visualLinks: next } ); setSelectedVisualId( next[0] ? next[0].id : '' ); };
			const startVisualDrag = function( event, link ) { if ( event.button !== 0 ) return; event.preventDefault(); event.stopPropagation(); const pointer = markerPositionFromPointer( event ); draggingId.current = 'visual:' + link.id; visualDrag.current = { id: link.id, startX: event.clientX, startY: event.clientY, offsetX: responsiveNumber( link, 'x', editingMobile, 50 ) - pointer.x, offsetY: responsiveNumber( link, 'y', editingMobile, 50 ) - pointer.y }; setSelectedVisualId( link.id ); if ( event.currentTarget.setPointerCapture ) event.currentTarget.setPointerCapture( event.pointerId ); };
			const moveVisualDrag = function( event, link ) { const drag = visualDrag.current; if ( draggingId.current !== 'visual:' + link.id || ! drag || drag.id !== link.id ) return; if ( Math.abs( event.clientX - drag.startX ) < 4 && Math.abs( event.clientY - drag.startY ) < 4 ) return; event.preventDefault(); const pointer = markerPositionFromPointer( event ); const x = clamp( pointer.x + drag.offsetX, 0, 100, 50 ); const y = clamp( pointer.y + drag.offsetY, 0, 100, 50 ); updateVisualById( link.id, editingMobile ? { mobileX: x, mobileY: y } : { x: x, y: y } ); };
			const endVisualDrag = function( event, link ) { if ( draggingId.current !== 'visual:' + link.id ) return; draggingId.current = ''; visualDrag.current = null; if ( event.currentTarget.releasePointerCapture && event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture( event.pointerId ) ) event.currentTarget.releasePointerCapture( event.pointerId ); };
			const blockProps = useBlockProps( { className: 'cni-image-hotspot-plus cni-image-hotspot-plus--editor', style: { '--cni-hotspot-color': a.markerColor || '#1769aa', '--cni-hotspot-size': clamp( a.markerSize, 24, 64, 38 ) + 'px' } } );
			return el( element.Fragment, null,
				el( InspectorControls, null,
					el( PanelBody, { title: __( '表示モード', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, { label: __( 'モード', 'cni-blocks' ), value: visualMode ? 'visual-link' : 'hotspot', options: [ { label: __( 'ホットスポット', 'cni-blocks' ), value: 'hotspot' }, { label: __( 'ビジュアルリンク', 'cni-blocks' ), value: 'visual-link' } ], onChange: function( value ) { set( { mode: value === 'visual-link' ? 'visual-link' : 'hotspot' } ); } } ),
						el( SelectControl, { label: __( '編集用プレビュー', 'cni-blocks' ), value: editingDevice, options: [ { label: __( 'PC', 'cni-blocks' ), value: 'desktop' }, { label: __( 'モバイル', 'cni-blocks' ), value: 'mobile' } ], onChange: function( value ) { setEditingDevice( value === 'mobile' ? 'mobile' : 'desktop' ); } } )
					),
					el( PanelBody, { title: __( 'ベース画像', 'cni-blocks' ), initialOpen: true },
						el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseImage, allowedTypes: [ 'image' ], value: a.imageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'secondary', onClick: mediaProps.open }, a.imageUrl ? __( 'PC画像を変更', 'cni-blocks' ) : __( 'PC画像を選択', 'cni-blocks' ) ); } } ) ),
						a.imageUrl ? el( TextControl, { label: __( '代替テキスト', 'cni-blocks' ), value: a.imageAlt || '', onChange: function( value ) { set( { imageAlt: value } ); } } ) : null
						, el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseMobileImage, allowedTypes: [ 'image' ], value: a.mobileImageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'secondary', onClick: mediaProps.open }, a.mobileImageUrl ? __( 'モバイル画像を変更', 'cni-blocks' ) : __( 'モバイル画像を追加（任意）', 'cni-blocks' ) ); } } ) ), a.mobileImageUrl ? el( TextControl, { label: __( 'モバイル画像の代替テキスト', 'cni-blocks' ), value: a.mobileImageAlt || '', onChange: function( value ) { set( { mobileImageAlt: value } ); } } ) : null
					),
					! visualMode ? el( PanelBody, { title: __( 'ポイント', 'cni-blocks' ), initialOpen: true },
						el( Button, { variant: 'primary', onClick: addMarker }, __( 'ポイントを追加', 'cni-blocks' ) ),
						markers.length ? el( SelectControl, { label: __( '編集中のポイント', 'cni-blocks' ), value: selected ? selected.id : '', options: markers.map( function( marker, index ) { return { label: markerLabel( marker, index ), value: marker.id }; } ), onChange: setSelectedId } ) : el( 'p', null, __( '画像上の「＋」から説明ポイントを追加できます。', 'cni-blocks' ) ),
						selected ? el( element.Fragment, null,
							el( TextControl, { label: __( 'タイトル', 'cni-blocks' ), value: selected.title || '', onChange: function( value ) { updateMarker( { title: value } ); } } ),
							el( TextareaControl, { label: __( '説明', 'cni-blocks' ), value: selected.description || '', onChange: function( value ) { updateMarker( { description: value } ); } } ),
							el( RangeControl, { label: __( '横位置(%)', 'cni-blocks' ), value: clamp( selected.x, 0, 100, 50 ), min: 0, max: 100, onChange: function( value ) { updateMarker( { x: clamp( value, 0, 100, 50 ) } ); } } ),
							el( RangeControl, { label: __( '縦位置(%)', 'cni-blocks' ), value: clamp( selected.y, 0, 100, 50 ), min: 0, max: 100, onChange: function( value ) { updateMarker( { y: clamp( value, 0, 100, 50 ) } ); } } ),
							el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseCardImage, allowedTypes: [ 'image' ], value: selected.imageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'secondary', onClick: mediaProps.open }, selected.imageUrl ? __( 'カード画像を変更', 'cni-blocks' ) : __( 'カード画像を追加', 'cni-blocks' ) ); } } ) ),
							selected.imageUrl ? el( Button, { variant: 'tertiary', isDestructive: true, onClick: function() { updateMarker( { imageId: 0, imageUrl: '', imageAlt: '' } ); } }, __( 'カード画像を削除', 'cni-blocks' ) ) : null,
							el( TextControl, { label: __( 'リンクURL（任意）', 'cni-blocks' ), type: 'url', value: selected.linkUrl || '', onChange: function( value ) { updateMarker( { linkUrl: value } ); } } ),
							selected.linkUrl ? el( TextControl, { label: __( 'リンク文言', 'cni-blocks' ), value: selected.linkLabel || '', onChange: function( value ) { updateMarker( { linkLabel: value } ); } } ) : null,
							el( Button, { variant: 'tertiary', isDestructive: true, onClick: removeMarker }, __( 'このポイントを削除', 'cni-blocks' ) )
						) : null
					) : null,
					visualMode ? el( PanelBody, { title: __( 'ビジュアルリンク', 'cni-blocks' ), initialOpen: true },
						el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseVisualImage, allowedTypes: [ 'image' ], render: function( mediaProps ) { return el( Button, { variant: 'primary', onClick: mediaProps.open }, __( '画像リンクを追加', 'cni-blocks' ) ); } } ) ),
						selectedVisual ? el( element.Fragment, null,
							el( 'div', { className: 'cni-image-hotspot-plus__selected-visual' }, el( 'img', { src: selectedVisual.imageUrl || '', alt: '' } ), el( 'div', null, el( 'span', null, __( '編集中の画像リンク', 'cni-blocks' ) ), el( MediaUploadCheck, null, el( MediaUpload, { onSelect: replaceVisualImage, allowedTypes: [ 'image' ], value: selectedVisual.imageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'secondary', size: 'compact', onClick: mediaProps.open }, __( '画像を変更', 'cni-blocks' ) ); } } ) ) ) ),
							el( TextControl, { label: __( 'リンクURL', 'cni-blocks' ), type: 'url', value: selectedVisual.linkUrl || '', onChange: function( value ) { updateVisual( { linkUrl: value } ); } } ),
							el( TextControl, { label: __( 'aria-label', 'cni-blocks' ), value: selectedVisual.ariaLabel || '', onChange: function( value ) { updateVisual( { ariaLabel: value } ); } } ),
							el( ToggleControl, { label: __( '新しいタブで開く', 'cni-blocks' ), checked: !! selectedVisual.newTab, onChange: function( value ) { updateVisual( { newTab: !! value } ); } } ),
							el( SelectControl, { label: __( 'ホバー効果', 'cni-blocks' ), value: [ 'none', 'lift', 'scale', 'brighten', 'shadow', 'pulse', 'tada', 'jello', 'swing' ].indexOf( selectedVisual.hoverEffect ) !== -1 ? selectedVisual.hoverEffect : 'lift', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '浮き上がる', 'cni-blocks' ), value: 'lift' }, { label: __( '拡大', 'cni-blocks' ), value: 'scale' }, { label: __( '明るくする', 'cni-blocks' ), value: 'brighten' }, { label: __( '影を強調', 'cni-blocks' ), value: 'shadow' }, { label: 'Pulse', value: 'pulse' }, { label: 'Tada', value: 'tada' }, { label: 'Jello', value: 'jello' }, { label: 'Swing', value: 'swing' } ], onChange: function( value ) { updateVisual( { hoverEffect: value || 'none' } ); } } ),
							el( SelectControl, { label: __( '注目アニメーション', 'cni-blocks' ), help: __( '小さなイラストや鳥向け。案内板には「なし」を推奨します。', 'cni-blocks' ), value: [ 'none', 'pulse', 'tada', 'jello', 'swing' ].indexOf( selectedVisual.attentionAnimation ) !== -1 ? selectedVisual.attentionAnimation : 'none', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: 'Pulse', value: 'pulse' }, { label: 'Tada', value: 'tada' }, { label: 'Jello', value: 'jello' }, { label: 'Swing', value: 'swing' } ], onChange: function( value ) { updateVisual( { attentionAnimation: value || 'none' } ); } } ),
							el( RangeControl, { label: editingMobile ? __( 'モバイル横位置(%)', 'cni-blocks' ) : __( 'PC横位置(%)', 'cni-blocks' ), value: responsiveNumber( selectedVisual, 'x', editingMobile, 50 ), min: 0, max: 100, onChange: function( value ) { updateVisual( editingMobile ? { mobileX: clamp( value, 0, 100, 50 ) } : { x: clamp( value, 0, 100, 50 ) } ); } } ),
							el( RangeControl, { label: editingMobile ? __( 'モバイル縦位置(%)', 'cni-blocks' ) : __( 'PC縦位置(%)', 'cni-blocks' ), value: responsiveNumber( selectedVisual, 'y', editingMobile, 50 ), min: 0, max: 100, onChange: function( value ) { updateVisual( editingMobile ? { mobileY: clamp( value, 0, 100, 50 ) } : { y: clamp( value, 0, 100, 50 ) } ); } } ),
							el( RangeControl, { label: editingMobile ? __( 'モバイル幅(%)', 'cni-blocks' ) : __( 'PC幅(%)', 'cni-blocks' ), value: responsiveNumber( selectedVisual, 'width', editingMobile, 30 ), min: 5, max: 100, onChange: function( value ) { updateVisual( editingMobile ? { mobileWidth: clamp( value, 5, 100, 30 ) } : { width: clamp( value, 5, 100, 30 ) } ); } } ),
							el( Button, { variant: 'tertiary', isDestructive: true, onClick: removeVisual }, __( 'この画像リンクを削除', 'cni-blocks' ) )
						) : el( 'p', null, __( '画像上のリンクを選択すると、設定を編集できます。', 'cni-blocks' ) )
					) : null,
					! visualMode ? el( PanelBody, { title: __( '表示スタイル', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, { label: __( '開き方', 'cni-blocks' ), value: a.interaction || 'click', options: [ { label: __( 'クリック', 'cni-blocks' ), value: 'click' }, { label: __( 'ホバー / フォーカス', 'cni-blocks' ), value: 'hover' } ], onChange: function( value ) { set( { interaction: value === 'hover' ? 'hover' : 'click' } ); } } ),
						el( SelectControl, { label: __( 'ポイント形状', 'cni-blocks' ), value: a.markerStyle || 'plus', options: [ { label: '＋', value: 'plus' }, { label: __( 'ドット', 'cni-blocks' ), value: 'dot' }, { label: __( '番号', 'cni-blocks' ), value: 'number' } ], onChange: function( value ) { set( { markerStyle: value || 'plus' } ); } } ),
						el( RangeControl, { label: __( 'ポイントサイズ(px)', 'cni-blocks' ), value: clamp( a.markerSize, 24, 64, 38 ), min: 24, max: 64, onChange: function( value ) { set( { markerSize: clamp( value, 24, 64, 38 ) } ); } } ),
						el( ToggleControl, { label: __( 'ポイントをゆっくり強調', 'cni-blocks' ), checked: a.markerPulse !== false, onChange: function( value ) { set( { markerPulse: !!value } ); } } ),
						el( SelectControl, { label: __( 'カードの位置', 'cni-blocks' ), value: a.cardPosition || 'auto', options: [ { label: __( '自動', 'cni-blocks' ), value: 'auto' }, { label: __( '上', 'cni-blocks' ), value: 'top' }, { label: __( '下', 'cni-blocks' ), value: 'bottom' } ], onChange: function( value ) { set( { cardPosition: value || 'auto' } ); } } ),
						el( SelectControl, { label: __( 'コンテンツ表示', 'cni-blocks' ), value: a.cardDisplay || 'card', options: [ { label: __( '画像上のカード', 'cni-blocks' ), value: 'card' }, { label: __( '画面中央のポップアップ', 'cni-blocks' ), value: 'modal' } ], onChange: function( value ) { set( { cardDisplay: value === 'modal' ? 'modal' : 'card', interaction: value === 'modal' ? 'click' : ( a.interaction || 'click' ) } ); } } ),
						a.cardDisplay === 'modal' ? el( SelectControl, { label: __( 'ポップアップ位置', 'cni-blocks' ), value: a.modalPosition || 'center', options: [ { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '上', 'cni-blocks' ), value: 'top' }, { label: __( '下', 'cni-blocks' ), value: 'bottom' }, { label: __( '左', 'cni-blocks' ), value: 'left' }, { label: __( '右', 'cni-blocks' ), value: 'right' }, { label: __( '左上', 'cni-blocks' ), value: 'top-left' }, { label: __( '右上', 'cni-blocks' ), value: 'top-right' }, { label: __( '左下', 'cni-blocks' ), value: 'bottom-left' }, { label: __( '右下', 'cni-blocks' ), value: 'bottom-right' } ], onChange: function( value ) { set( { modalPosition: value || 'center' } ); } } ) : null,
						a.cardDisplay === 'modal' ? el( RangeControl, { label: __( '上下微調整（px）', 'cni-blocks' ), help: __( 'マイナスで上、プラスで下へ移動します。', 'cni-blocks' ), value: clamp( a.modalOffsetY, -180, 180, 0 ), min: -180, max: 180, step: 4, onChange: function( value ) { set( { modalOffsetY: clamp( value, -180, 180, 0 ) } ); } } ) : null,
						a.cardDisplay === 'modal' ? el( 'p', { className: 'components-base-control__help' }, __( 'ポップアップの外側、閉じるボタン、Escキーで閉じます。', 'cni-blocks' ) ) : null,
						el( 'p', null, __( 'ポイント色', 'cni-blocks' ) ), el( ColorPalette, { value: a.markerColor || '#1769aa', onChange: function( value ) { set( { markerColor: value || '#1769aa' } ); } } )
					) : null
				),
				el( 'div', blockProps,
					a.imageUrl ? el( 'div', { className: 'cni-image-hotspot-plus__stage' }, el( 'img', { src: editingMobile && a.mobileImageUrl ? a.mobileImageUrl : a.imageUrl, alt: editingMobile && a.mobileImageUrl ? ( a.mobileImageAlt || a.imageAlt || '' ) : ( a.imageAlt || '' ) } ), visualMode ? visualLinks.map( function( link, index ) { return visualLinkButton( link, index, selectedVisual && link.id === selectedVisual.id, editingMobile, function() { setSelectedVisualId( link.id ); }, { onPointerDown: function( event ) { startVisualDrag( event, link ); }, onPointerMove: function( event ) { moveVisualDrag( event, link ); }, onPointerUp: function( event ) { endVisualDrag( event, link ); }, onPointerCancel: function( event ) { endVisualDrag( event, link ); } } ); } ) : markers.map( function( marker, index ) { return markerButton( marker, index, selected && marker.id === selected.id, function() { setSelectedId( marker.id ); }, a.markerStyle || 'plus', true, { onPointerDown: function( event ) { startDrag( event, marker ); }, onPointerMove: function( event ) { moveDrag( event, marker ); }, onPointerUp: function( event ) { endDrag( event, marker ); }, onPointerCancel: function( event ) { endDrag( event, marker ); } } ); } ) ) : el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseImage, allowedTypes: [ 'image' ], value: a.imageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'primary', onClick: mediaProps.open }, __( 'ベース画像を選択', 'cni-blocks' ) ); } } ) )
				)
			);
		},
		save: function() { return null; }
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

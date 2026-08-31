( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';
	const el = element.createElement;
	const { __ } = i18n;
	const { InspectorControls, MediaUpload, MediaUploadCheck, useBlockProps } = blockEditor;
	const { Button, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, TextareaControl, ToggleControl } = components;
	const { useRef, useState } = element;
	const attributes = {
		imageId: { type: 'number', default: 0 }, imageUrl: { type: 'string', default: '' }, imageAlt: { type: 'string', default: '' }, markers: { type: 'array', default: [] },
		interaction: { type: 'string', default: 'click' }, markerStyle: { type: 'string', default: 'plus' }, markerColor: { type: 'string', default: '#1769aa' }, markerSize: { type: 'number', default: 38 }, markerPulse: { type: 'boolean', default: true }, cardPosition: { type: 'string', default: 'auto' }, cardDisplay: { type: 'string', default: 'card' }, modalPosition: { type: 'string', default: 'center' }, modalOffsetY: { type: 'number', default: 0 }
	};
	function clamp( value, min, max, fallback ) { const number = typeof value === 'number' ? value : fallback; return Math.max( min, Math.min( max, number ) ); }
	function markerId() { return 'point-' + Date.now().toString( 36 ) + '-' + Math.random().toString( 36 ).slice( 2, 7 ); }
	function markerLabel( marker, index ) { return ( marker && marker.title ) || __( 'ポイント', 'cni-blocks' ) + ' ' + ( index + 1 ); }
	function markerIcon( style, index ) { return style === 'dot' ? '●' : ( style === 'number' ? String( index + 1 ) : '+' ); }
	function markerButton( marker, index, current, onClick, style, preview, pointerHandlers ) {
		return el( 'button', Object.assign( { type: 'button', className: 'cni-image-hotspot-plus__point' + ( current ? ' is-selected' : '' ), style: { left: clamp( marker.x, 0, 100, 50 ) + '%', top: clamp( marker.y, 0, 100, 50 ) + '%' }, onClick: onClick, 'aria-label': markerLabel( marker, index ) }, pointerHandlers || {} ), markerIcon( style, index ), preview ? el( 'span', { className: 'screen-reader-text' }, markerLabel( marker, index ) ) : null );
	}
	blocks.registerBlockType( 'cni-blocks/image-hotspot-plus', {
		apiVersion: 3, title: __( 'Image Hotspot+', 'cni-blocks' ), icon: 'location-alt', category: 'cni-blocks', description: __( '画像の好きな位置にポイントと、画像付きの詳細カードを配置します。', 'cni-blocks' ), keywords: [ 'hotspot', '画像', 'ポイント' ], attributes: attributes, supports: { align: [ 'wide', 'full' ], anchor: true, html: false },
		edit: function( props ) {
			const a = props.attributes;
			const set = props.setAttributes;
			const markers = Array.isArray( a.markers ) ? a.markers : [];
			const [ selectedId, setSelectedId ] = useState( markers[0] ? markers[0].id : '' );
			const draggingId = useRef( '' );
			const selectedIndex = Math.max( 0, markers.findIndex( function( marker ) { return marker.id === selectedId; } ) );
			const selected = markers[ selectedIndex ] || null;
			const updateMarker = function( changes ) { if ( ! selected ) return; const next = markers.slice(); next[ selectedIndex ] = Object.assign( {}, selected, changes ); set( { markers: next } ); };
			const updateMarkerById = function( id, changes ) { set( { markers: markers.map( function( marker ) { return marker.id === id ? Object.assign( {}, marker, changes ) : marker; } ) } ); };
			const markerPositionFromPointer = function( event ) { const rect = event.currentTarget.closest( '.cni-image-hotspot-plus__stage' ).getBoundingClientRect(); return { x: clamp( ( event.clientX - rect.left ) / rect.width * 100, 0, 100, 50 ), y: clamp( ( event.clientY - rect.top ) / rect.height * 100, 0, 100, 50 ) }; };
			const startDrag = function( event, marker ) { if ( event.button !== 0 ) return; event.preventDefault(); event.stopPropagation(); draggingId.current = marker.id; setSelectedId( marker.id ); if ( event.currentTarget.setPointerCapture ) event.currentTarget.setPointerCapture( event.pointerId ); updateMarkerById( marker.id, markerPositionFromPointer( event ) ); };
			const moveDrag = function( event, marker ) { if ( draggingId.current !== marker.id ) return; event.preventDefault(); updateMarkerById( marker.id, markerPositionFromPointer( event ) ); };
			const endDrag = function( event, marker ) { if ( draggingId.current !== marker.id ) return; draggingId.current = ''; if ( event.currentTarget.releasePointerCapture && event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture( event.pointerId ) ) event.currentTarget.releasePointerCapture( event.pointerId ); };
			const chooseImage = function( media ) { if ( media && media.url ) set( { imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '' } ); };
			const chooseCardImage = function( media ) { if ( media && media.url ) updateMarker( { imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '' } ); };
			const addMarker = function() { const marker = { id: markerId(), x: 50, y: 50, title: __( '新しいポイント', 'cni-blocks' ), description: '', imageId: 0, imageUrl: '', imageAlt: '', linkUrl: '', linkLabel: '' }; set( { markers: markers.concat( marker ) } ); setSelectedId( marker.id ); };
			const removeMarker = function() { if ( ! selected ) return; const next = markers.filter( function( marker ) { return marker.id !== selected.id; } ); set( { markers: next } ); setSelectedId( next[0] ? next[0].id : '' ); };
			const blockProps = useBlockProps( { className: 'cni-image-hotspot-plus cni-image-hotspot-plus--editor', style: { '--cni-hotspot-color': a.markerColor || '#1769aa', '--cni-hotspot-size': clamp( a.markerSize, 24, 64, 38 ) + 'px' } } );
			return el( element.Fragment, null,
				el( InspectorControls, null,
					el( PanelBody, { title: __( 'ベース画像', 'cni-blocks' ), initialOpen: true },
						el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseImage, allowedTypes: [ 'image' ], value: a.imageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'secondary', onClick: mediaProps.open }, a.imageUrl ? __( '画像を変更', 'cni-blocks' ) : __( '画像を選択', 'cni-blocks' ) ); } } ) ),
						a.imageUrl ? el( TextControl, { label: __( '代替テキスト', 'cni-blocks' ), value: a.imageAlt || '', onChange: function( value ) { set( { imageAlt: value } ); } } ) : null
					),
					el( PanelBody, { title: __( 'ポイント', 'cni-blocks' ), initialOpen: true },
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
					),
					el( PanelBody, { title: __( '表示スタイル', 'cni-blocks' ), initialOpen: false },
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
					)
				),
				el( 'div', blockProps,
					a.imageUrl ? el( 'div', { className: 'cni-image-hotspot-plus__stage' }, el( 'img', { src: a.imageUrl, alt: a.imageAlt || '' } ), markers.map( function( marker, index ) { return markerButton( marker, index, selected && marker.id === selected.id, function() { setSelectedId( marker.id ); }, a.markerStyle || 'plus', true, { onPointerDown: function( event ) { startDrag( event, marker ); }, onPointerMove: function( event ) { moveDrag( event, marker ); }, onPointerUp: function( event ) { endDrag( event, marker ); }, onPointerCancel: function( event ) { endDrag( event, marker ); } } ); } ) ) : el( MediaUploadCheck, null, el( MediaUpload, { onSelect: chooseImage, allowedTypes: [ 'image' ], value: a.imageId || 0, render: function( mediaProps ) { return el( Button, { variant: 'primary', onClick: mediaProps.open }, __( 'ベース画像を選択', 'cni-blocks' ) ); } } ) )
				)
			);
		},
		save: function() { return null; }
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

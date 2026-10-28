( function( blocks, element, blockEditor, components, i18n, apiFetch, serverSideRender ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InspectorControls } = blockEditor;
	const { Button, CheckboxControl, ColorPalette, Notice, PanelBody, RangeControl, SelectControl, Spinner, TextControl, ToggleControl } = components;
	const ServerSideRender = serverSideRender.ServerSideRender || serverSideRender.default || serverSideRender;
	const settings = window.cniPostListSettings || {};
	const postTypes = Array.isArray( settings.postTypes ) && settings.postTypes.length
		? settings.postTypes
		: [ { label: __( '投稿', 'cni-blocks' ), value: 'post' } ];
	const taxonomiesByPostType = settings.taxonomies && typeof settings.taxonomies === 'object' ? settings.taxonomies : {};
	/*
	 * ServerSideRender sends one REST request per mounted block. On pages which
	 * contain many Post List+ instances, mounting every preview at once can make
	 * the latter requests fail on hosts that limit simultaneous REST requests.
	 * Start only the initial previews in a small shared queue. Once mounted,
	 * ServerSideRender continues to refresh the individual block normally when
	 * its attributes change.
	 */
	const previewQueue = [];
	let previewQueueTimer = null;
	const previewRequestInterval = 500;

	function enqueuePostListPreview( callback ) {
		previewQueue.push( callback );

		if ( previewQueueTimer !== null ) {
			return;
		}

		function runNextPreview() {
			const nextPreview = previewQueue.shift();
			if ( ! nextPreview ) {
				previewQueueTimer = null;
				return;
			}

			nextPreview();
			previewQueueTimer = window.setTimeout( runNextPreview, previewRequestInterval );
		}

		runNextPreview();
	}

	function PostListPreview( props ) {
		const readyState = element.useState( false );
		const isReady = readyState[0];
		const setIsReady = readyState[1];

		element.useEffect( function() {
			let isMounted = true;
			enqueuePostListPreview( function() {
				if ( isMounted ) {
					setIsReady( true );
				}
			} );

			return function() {
				isMounted = false;
			};
		}, [] );

		if ( ! isReady ) {
			return el(
				'div',
				{ className: 'cni-post-list__editor-loading', 'aria-live': 'polite' },
				__( '投稿リストのプレビューを読み込み中…', 'cni-blocks' )
			);
		}

		return el( ServerSideRender, {
			block: 'cni-blocks/post-list',
			attributes: props.attributes,
		} );
	}

	function numberOr( value, fallback ) {
		return typeof value === 'number' ? value : fallback;
	}

	blocks.registerBlockType( 'cni-blocks/post-list', {
		apiVersion: 3,
		title: __( '投稿リスト+', 'cni-blocks' ),
		description: __( '投稿やカスタム投稿をカードまたはテキストリストで表示します。', 'cni-blocks' ),
		icon: 'list-view',
		category: 'cni-blocks',
		attributes: {
			postType: { type: 'string', default: 'post' },
			filterTaxonomy: { type: 'string', default: '' },
			filterTermIds: { type: 'array', default: [] },
			postsPerPage: { type: 'number', default: 6 },
			postsPerPageMobile: { type: 'number', default: 0 },
			offset: { type: 'number', default: 0 },
			pinnedPostIds: { type: 'array', default: [] },
			sortOrder: { type: 'string', default: 'newest' },
			displayType: { type: 'string', default: 'card' },
			cardDesign: { type: 'string', default: 'standard' },
			showImage: { type: 'boolean', default: true },
			showCategory: { type: 'boolean', default: true },
			showDate: { type: 'boolean', default: true },
			showTitle: { type: 'boolean', default: true },
			showExcerpt: { type: 'boolean', default: true },
			excerptLength: { type: 'number', default: 55 },
			titleLevel: { type: 'number', default: 3 },
			titleFontSize: { type: 'number', default: 0 },
			minWidthPc: { type: 'number', default: 280 },
			minWidthTablet: { type: 'number', default: 0 },
			minWidthMobile: { type: 'number', default: 0 },
			gap: { type: 'number', default: 24 },
			cardPadding: { type: 'number', default: 16 },
			cardBackgroundColor: { type: 'string', default: '#ffffff' },
			cardRadius: { type: 'number', default: 8 },
			cardShadow: { type: 'boolean', default: false },
			cardBorder: { type: 'boolean', default: true },
			cardBorderWidth: { type: 'number', default: 1 },
			cardBorderColor: { type: 'string', default: '#dddddd' },
			imageRatio: { type: 'string', default: '16-9' },
			hoverEffect: { type: 'string', default: 'lift' },
			overlayColor: { type: 'string', default: '#000000' },
			overlayOpacity: { type: 'number', default: 78 },
			overlayHeight: { type: 'number', default: 75 },
			overlayTextColor: { type: 'string', default: '#ffffff' },
			dateCornerBackgroundColor: { type: 'string', default: '#ffffff' },
			dateCornerTextColor: { type: 'string', default: '#222222' },
			categoryBadgeColor: { type: 'string', default: '#087ea4' },
			compactTextLinkIcon: { type: 'string', default: 'arrow' },
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		edit: function( props ) {
			const { attributes, setAttributes } = props;
			const pinnedSearchState = element.useState( '' );
			const pinnedSearch = pinnedSearchState[0];
			const setPinnedSearch = pinnedSearchState[1];
			const pinnedResultsState = element.useState( [] );
			const pinnedResults = pinnedResultsState[0];
			const setPinnedResults = pinnedResultsState[1];
			const pinnedPostsState = element.useState( [] );
			const pinnedPosts = pinnedPostsState[0];
			const setPinnedPosts = pinnedPostsState[1];
			const pinnedSearchErrorState = element.useState( '' );
			const pinnedSearchError = pinnedSearchErrorState[0];
			const setPinnedSearchError = pinnedSearchErrorState[1];
			const pinnedSearchLoadingState = element.useState( false );
			const isPinnedSearchLoading = pinnedSearchLoadingState[0];
			const setPinnedSearchLoading = pinnedSearchLoadingState[1];
			const availableTaxonomies = Array.isArray( taxonomiesByPostType[ attributes.postType || 'post' ] ) ? taxonomiesByPostType[ attributes.postType || 'post' ] : [];
			const selectedTaxonomy = availableTaxonomies.find( function( taxonomy ) { return taxonomy.value === attributes.filterTaxonomy; } );
			const termOptions = selectedTaxonomy && Array.isArray( selectedTaxonomy.terms ) ? selectedTaxonomy.terms : [];
			const selectedTermIds = Array.isArray( attributes.filterTermIds ) ? attributes.filterTermIds.map( function( id ) { return parseInt( id, 10 ) || 0; } ).filter( function( id ) { return id > 0; } ) : [];
			const pinnedPostIds = Array.isArray( attributes.pinnedPostIds ) ? attributes.pinnedPostIds.map( function( id ) { return parseInt( id, 10 ) || 0; } ).filter( function( id, index, ids ) { return id > 0 && ids.indexOf( id ) === index; } ).slice( 0, 24 ) : [];
			const pinnedPostKey = pinnedPostIds.join( ',' );
			const displayType = attributes.displayType || 'card';
			const isGrid = displayType !== 'list';
			const isCard = displayType === 'card';
			const hasCardFrame = isCard || displayType === 'horizontal';
			const isOverlay = isCard && attributes.cardDesign === 'overlay';
			const isDateCorner = isCard && attributes.cardDesign === 'date-corner';
			const isCompactText = isCard && attributes.cardDesign === 'compact-text';
			const usesExcerpt = isOverlay || isDateCorner;
			const postSearchPath = function( query, includeIds ) {
				const params = [ 'post_type=' + encodeURIComponent( attributes.postType || 'post' ) ];
				if ( query ) params.push( 'q=' + encodeURIComponent( query ) );
				if ( includeIds && includeIds.length ) params.push( 'include=' + encodeURIComponent( includeIds.join( ',' ) ) );
				if ( attributes.filterTaxonomy && selectedTermIds.length ) {
					params.push( 'taxonomy=' + encodeURIComponent( attributes.filterTaxonomy ) );
					params.push( 'terms=' + encodeURIComponent( selectedTermIds.join( ',' ) ) );
				}
				return '/cni-blocks/v1/search-posts?' + params.join( '&' );
			};
			element.useEffect( function() {
				let active = true;
				if ( ! pinnedPostIds.length ) {
					setPinnedPosts( [] );
					return function() { active = false; };
				}
				apiFetch( { path: postSearchPath( '', pinnedPostIds ) } ).then( function( response ) {
					if ( active ) setPinnedPosts( Array.isArray( response ) ? response : [] );
				} ).catch( function() {
					if ( active ) setPinnedPosts( [] );
				} );
				return function() { active = false; };
			}, [ attributes.postType, attributes.filterTaxonomy, selectedTermIds.join( ',' ), pinnedPostKey ] );
			const searchPinnedPosts = function() {
				const query = pinnedSearch.trim();
				if ( query.length < 2 ) {
					setPinnedSearchError( __( '投稿タイトルを2文字以上入力してください。', 'cni-blocks' ) );
					setPinnedResults( [] );
					return;
				}
				setPinnedSearchLoading( true );
				setPinnedSearchError( '' );
				apiFetch( { path: postSearchPath( query, [] ) } ).then( function( response ) {
					setPinnedResults( Array.isArray( response ) ? response : [] );
					if ( ! response || ! response.length ) setPinnedSearchError( __( '一致する公開投稿が見つかりませんでした。', 'cni-blocks' ) );
				} ).catch( function() {
					setPinnedResults( [] );
					setPinnedSearchError( __( '投稿の検索に失敗しました。もう一度お試しください。', 'cni-blocks' ) );
				} ).finally( function() { setPinnedSearchLoading( false ); } );
			};
			const addPinnedPost = function( post ) {
				const id = parseInt( post && post.id, 10 ) || 0;
				if ( ! id || ! post || post.postType !== ( attributes.postType || 'post' ) || pinnedPostIds.indexOf( id ) !== -1 || pinnedPostIds.length >= 24 ) return;
				setAttributes( { pinnedPostIds: pinnedPostIds.concat( [ id ] ) } );
			};
			const removePinnedPost = function( id ) { setAttributes( { pinnedPostIds: pinnedPostIds.filter( function( postId ) { return postId !== id; } ) } ); };
			const movePinnedPost = function( index, direction ) {
				const target = index + direction;
				if ( target < 0 || target >= pinnedPostIds.length ) return;
				const next = pinnedPostIds.slice();
				const current = next[index];
				next[index] = next[target];
				next[target] = current;
				setAttributes( { pinnedPostIds: next } );
			};
			const pinnedPostById = pinnedPosts.reduce( function( map, post ) { map[post.id] = post; return map; }, {} );
			const blockProps = useBlockProps( {
				onClickCapture: function( event ) {
					if ( event.target && event.target.closest && event.target.closest( '.cni-post-list a' ) ) {
						event.preventDefault();
					}
				},
			} );

			return el(
				element.Fragment,
				null,
				el(
					InspectorControls,
					null,
					el(
						PanelBody,
						{ title: __( '投稿の取得', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( '投稿タイプ', 'cni-blocks' ),
							value: attributes.postType || 'post',
							options: postTypes,
							onChange: function( value ) { setPinnedResults( [] ); setPinnedPosts( [] ); setPinnedSearchError( '' ); setAttributes( { postType: value, filterTaxonomy: '', filterTermIds: [], pinnedPostIds: [] } ); },
						} ),
						availableTaxonomies.length ? el( SelectControl, {
							label: __( '絞り込む分類', 'cni-blocks' ),
							value: attributes.filterTaxonomy || '',
							options: [ { label: __( '指定しない（すべて表示）', 'cni-blocks' ), value: '' } ].concat( availableTaxonomies ),
							onChange: function( value ) { setAttributes( { filterTaxonomy: value || '', filterTermIds: [] } ); },
						} ) : null,
						selectedTaxonomy ? el( 'div', { className: 'cni-post-list__term-filter' },
							el( 'p', null, __( '表示する', 'cni-blocks' ) + ( selectedTaxonomy.label || __( '分類', 'cni-blocks' ) ) + __( '（複数選択可・未選択ですべて表示）', 'cni-blocks' ) ),
							termOptions.length ? termOptions.map( function( term ) {
								const termId = parseInt( term.value, 10 ) || 0;
								return el( CheckboxControl, {
									key: termId,
									label: term.label,
									checked: selectedTermIds.indexOf( termId ) !== -1,
									onChange: function( checked ) {
										const nextIds = checked ? selectedTermIds.concat( [ termId ] ) : selectedTermIds.filter( function( id ) { return id !== termId; } );
										setAttributes( { filterTermIds: nextIds } );
									},
								} );
							} ) : el( 'p', { className: 'components-base-control__help' }, __( '選択できる分類がありません。', 'cni-blocks' ) )
						) : null,
						el( RangeControl, {
							label: __( '表示件数（PC・タブレット）', 'cni-blocks' ),
							value: numberOr( attributes.postsPerPage, 6 ),
							min: 1,
							max: 24,
							onChange: function( value ) { setAttributes( { postsPerPage: numberOr( value, 6 ) } ); },
						} ),
						el( RangeControl, {
							label: __( '表示件数（スマホ・0でPCと同じ）', 'cni-blocks' ),
							help: __( 'タブレットはPC・タブレットの件数を使用します。', 'cni-blocks' ),
							value: numberOr( attributes.postsPerPageMobile, 0 ),
							min: 0,
							max: 24,
							onChange: function( value ) { setAttributes( { postsPerPageMobile: numberOr( value, 0 ) } ); },
						} ),
						el( RangeControl, {
							label: __( 'オフセット（先頭から除外する件数）', 'cni-blocks' ),
							value: numberOr( attributes.offset, 0 ),
							min: 0,
							max: 100,
							onChange: function( value ) { setAttributes( { offset: numberOr( value, 0 ) } ); },
						} ),
						el( SelectControl, {
							label: __( '並び順', 'cni-blocks' ),
							value: attributes.sortOrder || 'newest',
							options: [
								{ label: __( '新しい順', 'cni-blocks' ), value: 'newest' },
								{ label: __( '古い順', 'cni-blocks' ), value: 'oldest' },
								{ label: __( '更新日順', 'cni-blocks' ), value: 'modified' },
								{ label: __( 'ランダム', 'cni-blocks' ), value: 'random' },
							],
							onChange: function( value ) { setAttributes( { sortOrder: value } ); },
						} )
					),
					el(
						PanelBody,
						{ title: __( '固定表示する投稿', 'cni-blocks' ), initialOpen: false },
						el( 'p', { className: 'components-base-control__help' }, __( '選択した投稿を先頭に固定表示します。残りの枠には通常の並び順で投稿が表示されます。現在の投稿タイプと分類条件に一致する公開投稿だけが表示されます。', 'cni-blocks' ) ),
						pinnedPostIds.length ? el( 'ol', { className: 'cni-post-list__pinned-posts' }, pinnedPostIds.map( function( id, index ) {
							const post = pinnedPostById[id];
							return el( 'li', { key: id, className: 'cni-post-list__pinned-post' },
								el( 'span', null, post ? post.title : __( '表示できない投稿', 'cni-blocks' ) + ' #' + id ),
								el( Button, { icon: 'arrow-up-alt2', label: __( '上へ移動', 'cni-blocks' ), disabled: index === 0, onClick: function() { movePinnedPost( index, -1 ); } } ),
								el( Button, { icon: 'arrow-down-alt2', label: __( '下へ移動', 'cni-blocks' ), disabled: index === pinnedPostIds.length - 1, onClick: function() { movePinnedPost( index, 1 ); } } ),
								el( Button, { icon: 'no-alt', label: __( '固定を解除', 'cni-blocks' ), isDestructive: true, onClick: function() { removePinnedPost( id ); } } )
							);
						} ) ) : el( 'p', { className: 'components-base-control__help' }, __( '固定する投稿はまだ選択されていません。', 'cni-blocks' ) ),
						el( TextControl, { label: __( '投稿を検索', 'cni-blocks' ), value: pinnedSearch, onChange: setPinnedSearch, onKeyDown: function( event ) { if ( 'Enter' === event.key ) { event.preventDefault(); searchPinnedPosts(); } } } ),
						el( Button, { variant: 'secondary', icon: 'search', disabled: isPinnedSearchLoading || pinnedPostIds.length >= 24, onClick: searchPinnedPosts }, __( '投稿を検索', 'cni-blocks' ) ),
						isPinnedSearchLoading ? el( Spinner ) : null,
						pinnedSearchError ? el( Notice, { status: 'warning', isDismissible: false }, pinnedSearchError ) : null,
						pinnedResults.length ? el( 'ul', { className: 'cni-post-list__pinned-results' }, pinnedResults.map( function( post ) {
							const added = pinnedPostIds.indexOf( post.id ) !== -1;
							return el( 'li', { key: post.id }, el( 'span', null, post.title ), el( Button, { variant: added ? 'tertiary' : 'primary', disabled: added || pinnedPostIds.length >= 24, onClick: function() { addPinnedPost( post ); } }, added ? __( '追加済み', 'cni-blocks' ) : __( '追加', 'cni-blocks' ) ) );
						} ) ) : null
					),
					el(
						PanelBody,
						{ title: __( '表示形式', 'cni-blocks' ), initialOpen: true },
						el( SelectControl, {
							label: __( '表示タイプ', 'cni-blocks' ),
							value: attributes.displayType || 'card',
							options: [
								{ label: __( 'カード', 'cni-blocks' ), value: 'card' },
								{ label: __( 'カード（水平）', 'cni-blocks' ), value: 'horizontal' },
								{ label: __( 'カード（メディア）', 'cni-blocks' ), value: 'media' },
								{ label: __( 'テキストリスト（1カラム）', 'cni-blocks' ), value: 'list' },
							],
							onChange: function( value ) { setAttributes( { displayType: value } ); },
						} ),
						isCard ? el( SelectControl, {
							label: __( 'カードのデザイン', 'cni-blocks' ),
							value: attributes.cardDesign || 'standard',
							options: [
								{ label: __( '標準カード', 'cni-blocks' ), value: 'standard' },
								{ label: __( '画像全面＋下部オーバーレイ', 'cni-blocks' ), value: 'overlay' },
								{ label: __( '日付コーナー＋画像・本文', 'cni-blocks' ), value: 'date-corner' },
								{ label: __( 'コンパクトテキスト', 'cni-blocks' ), value: 'compact-text' },
							],
							onChange: function( value ) { setAttributes( { cardDesign: value } ); },
						} ) : null,
						isGrid && ! isCompactText ? el( ToggleControl, { label: __( 'アイキャッチを表示', 'cni-blocks' ), checked: attributes.showImage !== false, onChange: function( value ) { setAttributes( { showImage: !!value } ); } } ) : null,
						! isCompactText ? el( ToggleControl, { label: __( 'カテゴリーバッジを表示', 'cni-blocks' ), checked: attributes.showCategory !== false, onChange: function( value ) { setAttributes( { showCategory: !!value } ); } } ) : null,
						! isCompactText ? el( ToggleControl, { label: __( '投稿日を表示', 'cni-blocks' ), checked: attributes.showDate !== false, onChange: function( value ) { setAttributes( { showDate: !!value } ); } } ) : null,
						! isCompactText ? el( ToggleControl, { label: __( 'タイトルを表示', 'cni-blocks' ), checked: attributes.showTitle !== false, onChange: function( value ) { setAttributes( { showTitle: !!value } ); } } ) : null,
						usesExcerpt ? el( ToggleControl, { label: __( '本文の一部を表示', 'cni-blocks' ), checked: attributes.showExcerpt !== false, onChange: function( value ) { setAttributes( { showExcerpt: !!value } ); } } ) : null,
						usesExcerpt && attributes.showExcerpt !== false ? el( RangeControl, { label: __( '抜粋の長さ', 'cni-blocks' ), value: numberOr( attributes.excerptLength, 55 ), min: 10, max: 160, onChange: function( value ) { setAttributes( { excerptLength: numberOr( value, 55 ) } ); } } ) : null,
						( isCompactText || attributes.showTitle !== false ) ? el( SelectControl, {
							label: __( '見出しレベル', 'cni-blocks' ),
							value: numberOr( attributes.titleLevel, 3 ),
							options: [
								{ label: 'h2', value: 2 },
								{ label: 'h3', value: 3 },
								{ label: 'h4', value: 4 },
								{ label: 'h5', value: 5 },
							],
							onChange: function( value ) { setAttributes( { titleLevel: parseInt( value, 10 ) || 3 } ); },
						} ) : null,
						( isCompactText || attributes.showTitle !== false ) ? el( RangeControl, {
							label: __( '見出し文字サイズ（px・0でテーマ標準）', 'cni-blocks' ),
							value: numberOr( attributes.titleFontSize, 0 ),
							min: 0,
							max: 48,
							onChange: function( value ) { setAttributes( { titleFontSize: numberOr( value, 0 ) } ); },
						} ) : null,
						! isCompactText ? el( 'p', null, __( 'カテゴリーバッジ背景色（文字色は自動判定）', 'cni-blocks' ) ) : null,
						! isCompactText ? el( ColorPalette, { value: attributes.categoryBadgeColor || '#087ea4', clearable: false, onChange: function( value ) { setAttributes( { categoryBadgeColor: value || '#087ea4' } ); } } ) : null
					),
					isGrid ? el(
						PanelBody,
						{ title: __( 'カードのカラム', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'PC 最小幅（px）', 'cni-blocks' ), value: numberOr( attributes.minWidthPc, 280 ), min: 160, max: 600, step: 10, onChange: function( value ) { setAttributes( { minWidthPc: numberOr( value, 280 ) } ); } } ),
						el( RangeControl, { label: __( 'タブレット 最小幅（px・0でPCを継承）', 'cni-blocks' ), value: numberOr( attributes.minWidthTablet, 0 ), min: 0, max: 600, step: 10, onChange: function( value ) { setAttributes( { minWidthTablet: numberOr( value, 0 ) } ); } } ),
						el( RangeControl, { label: __( 'モバイル 最小幅（px・0で上位を継承）', 'cni-blocks' ), value: numberOr( attributes.minWidthMobile, 0 ), min: 0, max: 600, step: 10, onChange: function( value ) { setAttributes( { minWidthMobile: numberOr( value, 0 ) } ); } } ),
						el( RangeControl, { label: __( 'カード間隔（px）', 'cni-blocks' ), value: numberOr( attributes.gap, 24 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { gap: numberOr( value, 24 ) } ); } } )
					) : null,
					hasCardFrame ? el(
						PanelBody,
						{ title: __( 'カードデザイン', 'cni-blocks' ), initialOpen: false },
						el( RangeControl, { label: __( 'カード内余白（px）', 'cni-blocks' ), value: numberOr( attributes.cardPadding, 16 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { cardPadding: numberOr( value, 16 ) } ); } } ),
						el( 'p', null, __( 'カード背景色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.cardBackgroundColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { cardBackgroundColor: value || '#ffffff' } ); } } ),
						el( RangeControl, { label: __( '角丸（px）', 'cni-blocks' ), value: numberOr( attributes.cardRadius, 8 ), min: 0, max: 80, onChange: function( value ) { setAttributes( { cardRadius: numberOr( value, 8 ) } ); } } ),
						el( ToggleControl, { label: __( '影を表示', 'cni-blocks' ), checked: !!attributes.cardShadow, onChange: function( value ) { setAttributes( { cardShadow: !!value } ); } } ),
						el( ToggleControl, { label: __( '枠線を表示', 'cni-blocks' ), checked: attributes.cardBorder !== false, onChange: function( value ) { setAttributes( { cardBorder: !!value } ); } } ),
						attributes.cardBorder !== false ? el( RangeControl, { label: __( '枠線の太さ（px）', 'cni-blocks' ), value: numberOr( attributes.cardBorderWidth, 1 ), min: 1, max: 12, onChange: function( value ) { setAttributes( { cardBorderWidth: numberOr( value, 1 ) } ); } } ) : null,
						attributes.cardBorder !== false ? el( 'p', null, __( '枠線の色', 'cni-blocks' ) ) : null,
						attributes.cardBorder !== false ? el( ColorPalette, { value: attributes.cardBorderColor || '#dddddd', clearable: false, onChange: function( value ) { setAttributes( { cardBorderColor: value || '#dddddd' } ); } } ) : null
					) : null,
					isGrid ? el(
						PanelBody,
						{ title: __( '画像・マウスオーバー', 'cni-blocks' ), initialOpen: false },
						isCard && ! isCompactText ? el( SelectControl, {
							label: __( '画像比率', 'cni-blocks' ),
							value: attributes.imageRatio || '16-9',
							options: [
								{ label: '16:9', value: '16-9' },
								{ label: '4:3', value: '4-3' },
								{ label: '1:1', value: '1-1' },
								{ label: '3:4', value: '3-4' },
								{ label: '2:3', value: '2-3' },
							],
							onChange: function( value ) { setAttributes( { imageRatio: value } ); },
						} ) : null,
						el( SelectControl, {
							label: __( 'マウスオーバー時の動き', 'cni-blocks' ),
							value: attributes.hoverEffect || 'lift',
							options: isCompactText ? [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( 'カードを少し持ち上げる', 'cni-blocks' ), value: 'lift' },
							] : [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( '画像を暗くする', 'cni-blocks' ), value: 'darken' },
								{ label: __( '画像を拡大する', 'cni-blocks' ), value: 'zoom' },
								{ label: __( 'カードを少し持ち上げる', 'cni-blocks' ), value: 'lift' },
							],
							onChange: function( value ) { setAttributes( { hoverEffect: value } ); },
						} )
					) : null,
					isOverlay ? el(
						PanelBody,
						{ title: __( 'オーバーレイ設定', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( 'オーバーレイ色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.overlayColor || '#000000', clearable: false, onChange: function( value ) { setAttributes( { overlayColor: value || '#000000' } ); } } ),
						el( RangeControl, { label: __( 'オーバーレイの濃さ（%）', 'cni-blocks' ), value: numberOr( attributes.overlayOpacity, 78 ), min: 0, max: 100, onChange: function( value ) { setAttributes( { overlayOpacity: numberOr( value, 78 ) } ); } } ),
						el( RangeControl, { label: __( 'グラデーションの範囲（%）', 'cni-blocks' ), value: numberOr( attributes.overlayHeight, 75 ), min: 30, max: 100, onChange: function( value ) { setAttributes( { overlayHeight: numberOr( value, 75 ) } ); } } ),
						el( 'p', null, __( '文字と矢印の色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.overlayTextColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { overlayTextColor: value || '#ffffff' } ); } } )
					) : null,
					isDateCorner ? el(
						PanelBody,
						{ title: __( '日付コーナー設定', 'cni-blocks' ), initialOpen: false },
						el( 'p', null, __( '日付エリアの背景色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.dateCornerBackgroundColor || '#ffffff', clearable: false, onChange: function( value ) { setAttributes( { dateCornerBackgroundColor: value || '#ffffff' } ); } } ),
						el( 'p', null, __( '日付の文字色', 'cni-blocks' ) ),
						el( ColorPalette, { value: attributes.dateCornerTextColor || '#222222', clearable: false, onChange: function( value ) { setAttributes( { dateCornerTextColor: value || '#222222' } ); } } )
					) : null,
					isCompactText ? el(
						PanelBody,
						{ title: __( 'コンパクトテキスト設定', 'cni-blocks' ), initialOpen: false },
						el( SelectControl, {
							label: __( 'リンクアイコン', 'cni-blocks' ),
							value: attributes.compactTextLinkIcon || 'arrow',
							options: [
								{ label: __( 'なし', 'cni-blocks' ), value: 'none' },
								{ label: __( 'シンプル矢印', 'cni-blocks' ), value: 'arrow' },
								{ label: __( '山形', 'cni-blocks' ), value: 'chevron' },
								{ label: __( '丸囲み矢印', 'cni-blocks' ), value: 'circle-arrow' },
							],
							onChange: function( value ) { setAttributes( { compactTextLinkIcon: value } ); },
						} )
					) : null
				),
				el(
					'div',
					blockProps,
					el( PostListPreview, { attributes: attributes } )
				)
			);
		},
		save: function() {
			return null;
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n, window.wp.apiFetch, window.wp.serverSideRender );

( function( window ) {
	'use strict';

	/* Shared metadata for Heading+ and Image Text Layer. CSS owns the visual
	 * implementation; blocks store only these stable IDs and chosen colours. */
	window.cniBlocksTextDesigns = [
		{ id: 'simple-shadow', category: 'text', label: 'シンプルシャドウ', sample: '写真でも読みやすい', description: '写真背景の主見出しに', fontFamily: 'Noto Sans JP', fontWeight: '900', primaryColor: '#ffffff', accentColor: '#172033' },
		{ id: 'elegant-gradient', category: 'text', label: 'エレガントグラデーション', sample: '教材書', description: '上品なブランド訴求に', fontFamily: 'Noto Serif JP', fontWeight: '700', primaryColor: '#e91e63', highlightColor: '#e863a0', accentColor: '#6535aa' },
		{ id: 'pop-outline-shadow', category: 'text', label: 'ポップフチ＋影', sample: '高評価格！', description: '明るい訴求や写真背景に', fontFamily: 'M PLUS Rounded 1c', fontWeight: '900', primaryColor: '#ffffff', accentColor: '#7ba6d0' },
		{ id: 'sale-price', category: 'text', label: 'セール価格', sample: '198円', description: '価格・割引・キャンペーンに', fontFamily: 'Noto Sans JP', fontWeight: '900', primaryColor: '#e5002a', accentColor: '#a90020' },
		{ id: 'outline', category: 'text', label: 'アウトライン', sample: 'USER VOICE', description: '英字や大きな装飾見出しに', fontFamily: 'Montserrat', fontWeight: '700', primaryColor: '#8db7df', accentColor: '#ffffff' },
		{ id: 'gold-metal', category: 'text', label: 'ゴールドメタル', sample: '特別なご案内', description: '実績・受賞・高級感の演出に', fontFamily: 'Noto Serif JP', fontWeight: '700', primaryColor: '#f7db85', highlightColor: '#fff5c3', accentColor: '#926319' },
		{ id: 'marker-underline', category: 'text', label: 'マーカー下線', sample: '選ばれる理由', description: '文字そのものを強調するマーカー', fontFamily: 'Zen Kaku Gothic New', fontWeight: '700', primaryColor: '#19324f', accentColor: '#ffe464' },
		{ id: 'neon', category: 'text', label: 'ネオン調', sample: 'ネオン調', description: 'イベント・夜のビジュアル訴求に', fontFamily: 'M PLUS Rounded 1c', fontWeight: '900', primaryColor: '#ffffff', accentColor: '#df36df' },
		{ id: 'frame-label', category: 'heading', label: 'フレームラベル', sample: '高密度モーション', description: 'セクションの訴求見出しに', fontFamily: 'Zen Kaku Gothic New', fontWeight: '700', primaryColor: '#ffffff', accentColor: '#123d8a' },
		{ id: 'white-label', category: 'heading', label: '白背景ラベル', sample: '最新情報をチェック', description: '写真背景で文字を確実に読ませる', fontFamily: 'Zen Kaku Gothic New', fontWeight: '700', primaryColor: '#172033', accentColor: '#ffffff' },
		{ id: 'accent-underline', category: 'heading', label: '文字幅下線', sample: 'SEO対策のバイブル', description: '文字幅に合わせた基本の下線', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#49a4c8' },
		{ id: 'center-slash', category: 'heading', label: '左右スラッシュ', sample: '見出しタイトル', description: '中央配置の控えめな装飾に', fontFamily: 'Zen Kaku Gothic New', fontWeight: '700', primaryColor: '#273548', accentColor: '#6b7787' },
		{ id: 'left-bar', category: 'heading', label: '左アクセント線', sample: '見出しタイトル', description: '会社サイトで使いやすい基本形', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'left-bar-band', category: 'heading', label: '左線＋背景帯', sample: '見出しタイトル', description: '内容の区切りを明確にする', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'short-underline', category: 'heading', label: '左寄せ短線', sample: '見出しタイトル', description: '左端に短いアクセント線', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'center-underline', category: 'heading', label: '中央短線', sample: '見出しタイトル', description: '中央見出しの基本形', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'side-lines', category: 'heading', label: '左右ライン', sample: '見出しタイトル', description: '中央の見出しを穏やかに区切る', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#6b7787' },
		{ id: 'corner-frame', category: 'heading', label: '角フレーム', sample: '見出しタイトル', description: '囲みすぎない端部のフレーム', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'speech-underline', category: 'heading', label: '吹き出し風下線', sample: '見出しタイトル', description: '下線に小さな吹き出しの切り込み', fontFamily: 'Noto Sans JP', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'eyebrow-title', category: 'heading', label: '英字サブタイトル', sample: 'OUR SERVICE\n事業紹介', description: '小さな英字と主見出しを組み合わせる', fontFamily: 'Montserrat', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'number-title', category: 'heading', label: '番号付き見出し', sample: '01  見出しタイトル', description: '章や手順を明確に見せる', fontFamily: 'Montserrat', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
		{ id: 'backdrop-title', category: 'heading', label: '背面英字', sample: 'ABOUT\n私たちについて', description: '大きな英字を背景に敷く', fontFamily: 'Montserrat', fontWeight: '700', primaryColor: '#172033', accentColor: '#2998cf' },
	];

	window.cniBlocksGetTextDesign = function( id ) {
		return window.cniBlocksTextDesigns.filter( function( design ) { return design.id === id; } )[ 0 ] || null;
	};
} )( window );

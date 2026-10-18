( function( blocks, element, blockEditor, components, i18n ) {
	'use strict';

	const el = element.createElement;
	const { __ } = i18n;
	const { useBlockProps, InnerBlocks, InspectorControls, MediaUpload, MediaUploadCheck } = blockEditor;
	const { Button, ButtonGroup, ColorPalette, PanelBody, RangeControl, SelectControl, TextControl, ToggleControl } = components;
	const { useEffect, useState } = element;
	const FREE_IMAGE_LIMIT = 6;
	const SITE_THEME_COLOR = ( window.cniBlocksBackgroundDesignPlusConfig && window.cniBlocksBackgroundDesignPlusConfig.themeColor ) || '#2563eb';
	const FACTORY_PALETTE = { baseColor: '#f8fafc', color1: '#60a5fa', color2: '#c084fc', color3: '#f9a8d4', color4: '#fcd34d', color5: '#34d399' };
	const STYLE_OPTIONS = [
		{ label: __( 'ソフトメッシュ', 'cni-blocks' ), value: 'soft-mesh' },
		{ label: __( 'ソフトポリゴン', 'cni-blocks' ), value: 'soft-polygons' },
		{ label: __( '流体シェイプ', 'cni-blocks' ), value: 'fluid-shapes' },
		{ label: __( 'コンフェッティ', 'cni-blocks' ), value: 'confetti' },
		{ label: __( 'ブラースポット', 'cni-blocks' ), value: 'blur-spots' },
		{ label: __( 'ぼかしドット', 'cni-blocks' ), value: 'bokeh-dots' },
		{ label: __( 'ピクセルクラスタ', 'cni-blocks' ), value: 'pixel-wave' },
		{ label: __( 'パーティクルウェーブ', 'cni-blocks' ), value: 'particle-wave' },
		{ label: __( 'レイヤードパネル', 'cni-blocks' ), value: 'layered-panels' },
		{ label: __( '流線・曲線', 'cni-blocks' ), value: 'flow-lines' },
		{ label: __( 'メタボール', 'cni-blocks' ), value: 'metaballs' },
		{ label: __( 'ハーフトーン', 'cni-blocks' ), value: 'halftone' },
		{ label: __( 'グリッド', 'cni-blocks' ), value: 'grid' },
		{ label: __( 'レイヤードウェーブ', 'cni-blocks' ), value: 'waves' },
		{ label: __( '線画幾何学', 'cni-blocks' ), value: 'geometry' },
		{ label: __( 'リング／輪郭ドット', 'cni-blocks' ), value: 'rings' },
		{ label: __( 'タイル幾何学', 'cni-blocks' ), value: 'tile-geometry' },
		{ label: __( 'ドット', 'cni-blocks' ), value: 'dots' },
		{ label: __( 'ノイズ', 'cni-blocks' ), value: 'noise' },
	];
	/* Scale affects the object, while density remains an independent control.
	 * The top end is deliberately restrained: xlarge is a hero treatment, not a
	 * full-screen colour cover. */
	const SIZE_MAP = { small: .64, normal: 1, large: 1.38, xlarge: 1.78 };
	const STYLE_DEFAULTS = {
		'soft-mesh': { scale: 'normal', density: 46, variation: 52, opacity: 52, blur: 34, flow: 48, colorCount: 4, baseColor: '#f8fafc', color1: '#60a5fa', color2: '#c084fc', color3: '#f9a8d4', color4: '#fcd34d', motion: 'none' },
		'soft-polygons': { scale: 'normal', density: 38, variation: 56, opacity: 36, polygonShape: 'mixed', motion: 'none' },
		'fluid-shapes': { scale: 'normal', density: 42, variation: 52, opacity: 38, blur: 20, motion: 'none' },
		confetti: { scale: 'normal', density: 34, variation: 62, opacity: 46, confettiShape: 'mixed', motion: 'none' },
		'blur-spots': { scale: 'normal', density: 34, variation: 48, opacity: 38, blur: 42, spotShape: 'mixed', motion: 'none' },
		'bokeh-dots': { scale: 'normal', density: 42, variation: 48, opacity: 42, blur: 18, spotShape: 'mixed', motion: 'none' },
		'pixel-wave': { scale: 'normal', density: 48, variation: 42, opacity: 68, colorCount: 2, composition: 'right', motion: 'none' },
		'particle-wave': { scale: 'normal', density: 48, variation: 50, opacity: 42, composition: 'bottom', motion: 'none' },
		'layered-panels': { scale: 'normal', density: 38, variation: 50, opacity: 44, composition: 'full', motion: 'none' },
		'flow-lines': { scale: 'normal', density: 38, variation: 46, opacity: 42, lineDirection: 'right', motion: 'none' },
		metaballs: { scale: 'normal', density: 38, variation: 52, opacity: 38, blur: 22, metaCount: 5, motion: 'none' },
		halftone: { scale: 'normal', density: 44, variation: 48, opacity: 44, halftoneMode: 'diagonal', motion: 'none' },
		grid: { scale: 'normal', density: 36, variation: 32, opacity: 28, gridMode: 'cross', motion: 'none' },
		waves: { scale: 'normal', density: 38, variation: 42, opacity: 42, waveLayers: 3, composition: 'bottom', motion: 'none' },
		geometry: { scale: 'normal', density: 36, variation: 58, opacity: 40, motion: 'none' },
		rings: { scale: 'normal', density: 34, variation: 50, opacity: 42, ringCount: 5, ringAppearance: 'dots', motion: 'none' },
		'tile-geometry': { scale: 'normal', density: 38, variation: 38, opacity: 34, tilePattern: 'classic', tileGap: 0, motion: 'none' },
		dots: { scale: 'normal', density: 42, variation: 38, opacity: 34, motion: 'none' },
		noise: { scale: 'normal', density: 42, variation: 42, opacity: 18, textureAmount: 16, motion: 'none' }
	};
	const STYLE_PRESETS = {
		'soft-mesh': [
			[ 'classic', 'やわらかなパステル', {}, 'pastel' ],
			[ 'pastel', '淡い色面・白い余白', { opacity: 34, blur: 48, flow: 34 }, 'pastel' ],
			[ 'colorful', 'カラフル・大きな色面', { opacity: 66, colorCount: 5, flow: 70 }, 'vivid' ],
			[ 'dark', '夜の光・ダーク', { baseColor: '#111827', opacity: 60, color1: '#0ea5e9', color2: '#8b5cf6', color3: '#ec4899', color4: '#14b8a6' }, 'dark' ],
			[ 'sunrise', '朝焼け・暖色のにじみ', { scale: 'large', opacity: 54, flow: 65, blur: 44 }, 'sunrise' ],
			[ 'forest', '森林の光・右に文字', { composition: 'left', scale: 'large', opacity: 62, blur: 38 }, 'forest' ],
			[ 'ivory', 'アイボリー・紙の質感', { opacity: 38, colorCount: 3, texture: 'paper', textureOpacity: 14 }, 'ivory' ],
			[ 'moving-aurora', 'ゆっくり動くオーロラ', { opacity: 62, flow: 68, motion: 'flow', motionSpeed: 'standard', motionStrength: 'standard' }, 'aurora' ]
		],
		'soft-polygons': [
			[ 'classic', '浮遊するポリゴン', {}, 'blue' ],
			[ 'faceted', 'ブルー・連続ポリゴン', { polygonShape: 'faceted', density: 38, opacity: 48 }, 'blue' ],
			[ 'ruby', 'ルビー・連続ポリゴン', { polygonShape: 'faceted', baseColor: '#460d19', color1: '#9f1239', color2: '#e11d48', color3: '#be123c', color4: '#fb7185', color5: '#881337', opacity: 65 }, 'dark' ],
			[ 'paper-folds', '白い折り紙風・大きな面', { polygonShape: 'faceted', scale: 'large', density: 26, opacity: 64, texture: 'paper', textureOpacity: 9 }, 'paper' ],
			[ 'faceted-edge', '片側ローポリ・左に文字', { polygonShape: 'faceted', composition: 'right', scale: 'xlarge', opacity: 58 }, 'forest' ],
			[ 'pastel-confetti', '淡い三角形のコーナー', { polygonShape: 'triangle', composition: 'corners', scale: 'small', density: 62, opacity: 55 }, 'pastel' ],
			[ 'moving-polygons', 'ゆっくり漂う大きな図形', { scale: 'large', density: 20, opacity: 44, motion: 'gentle', motionSpeed: 'slow' }, 'warm' ]
		],
		'fluid-shapes': [
			[ 'classic', 'やわらかな流体', {}, 'pastel' ], [ 'soft', '淡いアクア・下側', { composition: 'bottom', opacity: 34, blur: 28 }, 'aqua' ], [ 'bold', 'ダーク・大きな流体', { scale: 'large', opacity: 60, density: 62 }, 'dark' ],
			[ 'peach-edge', 'ピーチ・片側の曲面', { composition: 'right', scale: 'xlarge', density: 22, blur: 8, opacity: 48 }, 'sunrise' ],
			[ 'organic-frame', '森林色・周囲の流体', { composition: 'surround', scale: 'large', density: 62, opacity: 50 }, 'forest' ],
			[ 'moving-fluid', 'ゆっくり動く形状変化', { scale: 'large', density: 28, blur: 10, opacity: 50, motion: 'flow', motionSpeed: 'slow' }, 'aqua' ]
		],
		confetti: [
			[ 'classic', 'パステルの紙吹雪', {}, 'pastel' ], [ 'soft', '小粒の淡い紙吹雪', { scale: 'small', opacity: 36, density: 30 }, 'pastel' ], [ 'bold', '夜色の紙吹雪', { opacity: 90, density: 62, scale: 'large' }, 'aurora' ],
			[ 'pop-corners', 'ポップな四角・対角コーナー', { confettiShape: 'square', composition: 'corners', opacity: 100, density: 100, scale: 'large' }, 'vivid' ],
			[ 'warm-pills', '暖色の短冊・下側', { confettiShape: 'pill', composition: 'bottom', scale: 'xlarge', density: 62, opacity: 85 }, 'warm' ],
			[ 'moving-confetti', 'ゆっくり浮遊する丸い紙吹雪', { confettiShape: 'circle', motion: 'flow', motionSpeed: 'standard', opacity: 90, density: 60, scale: 'large' }, 'aqua' ]
		],
		'blur-spots': [
			[ 'classic', 'やわらかな光の塊', {}, 'blue' ], [ 'corners', '対角コーナーの光', { composition: 'corners', density: 26, scale: 'large', opacity: 48 }, 'pastel' ], [ 'neon', 'ダーク・ネオンの光', { baseColor: '#111827', opacity: 58, blur: 28, color1: '#22d3ee', color2: '#a78bfa', color3: '#f472b6' }, 'dark' ],
			[ 'warm-light', '暖色の間接照明', { scale: 'large', density: 22, blur: 54, opacity: 48 }, 'warm' ],
			[ 'spotlight', '片側スポットライト・左に文字', { composition: 'right', spotShape: 'ellipse', scale: 'xlarge', density: 28, opacity: 58 }, 'aqua' ],
			[ 'moving-lights', 'ゆっくり漂う夜の光', { motion: 'flow', motionSpeed: 'slow', scale: 'large', density: 28, opacity: 60 }, 'aurora' ]
		],
		'bokeh-dots': [
			[ 'classic', 'ブルーのぼかしドット', {}, 'blue' ], [ 'soft', 'パステルの小さな光', { scale: 'small', opacity: 38, density: 30 }, 'pastel' ], [ 'bold', 'ダーク・大粒の光', { scale: 'large', density: 62, opacity: 60 }, 'dark' ],
			[ 'gold-bokeh', 'ゴールドの少数ドット', { scale: 'large', density: 14, opacity: 62, spotShape: 'circle', composition: 'right' }, 'gold' ],
			[ 'bokeh-frame', '淡い光のフレーム', { composition: 'surround', density: 72, scale: 'small', opacity: 56 }, 'aqua' ],
			[ 'moving-bokeh', 'ゆっくり揺らぐ暖色の光', { motion: 'gentle', motionSpeed: 'slow', density: 28, opacity: 56 }, 'sunrise' ]
		],
		'pixel-wave': [
			[ 'classic', 'ブルー＆グリーン・左に文字', { composition: 'right', colorCount: 2 }, 'green' ], [ 'signal', 'アクア・対角コーナー', { composition: 'corners', colorCount: 2, density: 95, opacity: 95, variation: 20, scale: 'small' }, 'aqua' ], [ 'minimal', '淡いデジタル・下側', { composition: 'bottom', density: 24, opacity: 36, scale: 'small' }, 'aqua' ],
			[ 'mono-digital', 'モノクロ・デジタル散布', { colorCount: 2, opacity: 65, density: 68, composition: 'left' }, 'ink' ],
			[ 'pixel-frame', '中央を空けたピクセルフレーム', { composition: 'surround', density: 76, opacity: 62, colorCount: 3 }, 'aqua' ],
			[ 'pop-pixels', '大粒のポップ・上下装飾', { composition: 'both', scale: 'xlarge', density: 100, variation: 20, opacity: 100, colorCount: 3 }, 'vivid' ],
			[ 'moving-pixels', 'ゆっくり浮遊するデジタル', { motion: 'flow', motionSpeed: 'slow', composition: 'right', colorCount: 2 }, 'green' ]
		],
		'particle-wave': [
			[ 'classic', 'ブルーの粒子・下側', {}, 'blue' ], [ 'soft', '淡い粒子・上側', { composition: 'top', opacity: 28, density: 35 }, 'pastel' ], [ 'bold', 'ダーク・データウェーブ', { composition: 'full', density: 68, opacity: 60 }, 'dark' ],
			[ 'fine-data', '白地の細かなデータ波', { scale: 'small', density: 76, variation: 32, opacity: 56, colorCount: 2 }, 'aqua' ],
			[ 'side-particles', '側面の粒子・右に文字', { composition: 'left', scale: 'large', density: 38, opacity: 60 }, 'blue' ],
			[ 'moving-particles', 'ゆっくり進む光の粒子', { motion: 'flow', motionSpeed: 'slow', opacity: 64, composition: 'bottom' }, 'aurora' ]
		],
		'layered-panels': [
			[ 'classic', 'ブルー・斜めパネル', {}, 'blue' ], [ 'soft', 'ホワイト・ペーパー', { opacity: 38, density: 28, texture: 'paper' }, 'paper' ], [ 'bold', 'ダーク・マット', { opacity: 65, texture: 'matte' }, 'dark' ],
			[ 'black-gold', 'ブラック＆ゴールド', { opacity: 68, density: 28, texture: 'matte', textureOpacity: 18 }, 'gold' ],
			[ 'warm-panels', '暖色のマット・右に文字', { composition: 'left', opacity: 62, scale: 'large', texture: 'matte' }, 'warm' ],
			[ 'white-panels', '大きな白い面・片側装飾', { composition: 'right', scale: 'xlarge', density: 18, opacity: 70, texture: 'paper', textureOpacity: 8 }, 'paper' ],
			[ 'moving-panels', 'ゆっくり動く斜めの光', { motion: 'flow', motionSpeed: 'slow', motionStrength: 'subtle', opacity: 58 }, 'aqua' ]
		],
		'flow-lines': [
			[ 'classic', 'ライトフロー', {}, 'blue' ], [ 'speed', '密度のあるスピードライン', { density: 58, opacity: 58, variation: 66, scale: 'large' }, 'pastel' ], [ 'calm', 'やわらかい流れ', { density: 24, opacity: 28, variation: 28 }, 'pastel' ],
			[ 'vertical-lines', '縦に流れるライン・片側', { lineDirection: 'down', composition: 'right', opacity: 62, density: 68 }, 'aqua' ],
			[ 'gold-lines', '夜色のゴールドライン', { density: 48, opacity: 64, variation: 64 }, 'gold' ],
			[ 'moving-lines', 'ゆっくり流れる曲線', { motion: 'flow', motionSpeed: 'slow', density: 56, opacity: 56 }, 'blue' ]
		],
		metaballs: [
			[ 'classic', 'ブルーの溶け合う流体', {}, 'blue' ], [ 'soft', 'パステルのやわらかな流体', { opacity: 32, density: 30 }, 'pastel' ], [ 'bold', 'ダーク・大きな流体', { opacity: 60, density: 62, scale: 'large' }, 'dark' ],
			[ 'organic-metaballs', '森林色の液体・左に文字', { composition: 'right', metaCount: 7, scale: 'large', opacity: 54, blur: 32 }, 'forest' ],
			[ 'warm-metaballs', '暖色の流体フレーム', { composition: 'surround', metaCount: 8, scale: 'large', opacity: 52 }, 'sunrise' ],
			[ 'moving-metaballs', 'ゆっくり溶け合う夜の流体', { motion: 'flow', motionSpeed: 'slow', metaCount: 6, scale: 'large', opacity: 62 }, 'aurora' ]
		],
		halftone: [
			[ 'classic', '斜めグラデーション', {}, 'blue' ], [ 'focus', '中央フォーカス', { halftoneMode: 'radial', opacity: 52 }, 'pastel' ], [ 'pop', '波状のポップ', { halftoneMode: 'wave', opacity: 62, density: 56 }, 'dark' ], [ 'mono', '夜色のモノクロ', { baseColor: '#111827', color1: '#f8fafc', opacity: 48, density: 38 }, 'mono' ],
			[ 'yellow-corners', '黄色のコーナーフレーム', { composition: 'corners', colorCount: 2, scale: 'large', density: 66, opacity: 78 }, 'lemon' ],
			[ 'large-pop', '大粒ドット・ポップな下側', { composition: 'bottom', scale: 'small', density: 72, variation: 76, opacity: 68, colorCount: 3 }, 'vivid' ],
			[ 'print-dots', 'モノクロ印刷風・中央に余白', { composition: 'surround', colorCount: 2, density: 68, opacity: 44, texture: 'grain', textureOpacity: 9 }, 'ink' ]
		],
		grid: [
			[ 'classic', 'ブルーの方眼', {}, 'blue' ], [ 'soft', '淡いパステル方眼', { opacity: 28, density: 30 }, 'pastel' ], [ 'bold', 'ダーク・大きな方眼', { opacity: 60, density: 20, scale: 'small' }, 'dark' ],
			[ 'fine-grid', '細かな設計用方眼', { gridMode: 'cross', scale: 'large', density: 82, variation: 12, opacity: 30 }, 'ink' ],
			[ 'vertical-grid', '縦線・右に文字', { gridMode: 'vertical', composition: 'left', scale: 'normal', density: 54, opacity: 44 }, 'aqua' ],
			[ 'diagonal-grid', 'ゴールドの斜線・片側', { gridMode: 'diagonal', composition: 'right', density: 64, opacity: 40 }, 'gold' ]
		],
		waves: [
			[ 'classic', 'ブルー・下側の波', {}, 'blue' ], [ 'layered', '両端のレイヤー', { composition: 'both', waveLayers: 5, opacity: 54, variation: 58 }, 'blue' ], [ 'quiet', '淡いアクア・右側', { composition: 'right', waveLayers: 2, opacity: 26, scale: 'small' }, 'aqua' ],
			[ 'sand-dunes', '砂丘・暖色のレイヤー', { composition: 'bottom', waveLayers: 4, scale: 'large', variation: 68, opacity: 58 }, 'sand' ],
			[ 'forest-waves', '森林色のカーブ・左に文字', { composition: 'right', waveLayers: 4, scale: 'large', opacity: 54 }, 'forest' ],
			[ 'sunset-waves', '夕暮れ・上下のフレーム', { composition: 'both', waveLayers: 3, variation: 68, opacity: 64 }, 'sunrise' ],
			[ 'moving-waves', 'ゆっくり進む海の波', { motion: 'flow', motionSpeed: 'slow', motionStrength: 'subtle', waveLayers: 4, opacity: 50 }, 'aqua' ]
		],
		geometry: [
			[ 'classic', 'ブルーの線画幾何学', {}, 'blue' ], [ 'soft', '淡いパステルの線画', { opacity: 28, density: 30 }, 'pastel' ], [ 'bold', 'ダーク・大きな線画', { opacity: 60, density: 62, scale: 'large' }, 'dark' ],
			[ 'technical-edge', '片側のテクニカル線画', { composition: 'right', scale: 'large', density: 58, opacity: 66, colorCount: 2 }, 'aqua' ],
			[ 'gold-frame', 'ゴールドの線画フレーム', { composition: 'surround', scale: 'large', density: 70, opacity: 60 }, 'gold' ],
			[ 'moving-geometry', 'ゆっくり揺らぐ線画', { motion: 'gentle', motionSpeed: 'slow', opacity: 58, density: 48 }, 'blue' ]
		],
		rings: [
			[ 'classic', 'ブルーのランダムドット', {}, 'blue' ], [ 'soft', '小粒のパステルドット', { scale: 'small', opacity: 28, density: 30 }, 'pastel' ], [ 'bold', 'ダーク・大粒のドット', { opacity: 60, density: 62, scale: 'large' }, 'dark' ],
			[ 'sparse-dots', '暖色の大粒ドット・少数', { ringAppearance: 'dots', scale: 'xlarge', density: 10, opacity: 60, variation: 78 }, 'sunrise' ],
			[ 'outline-frame', '中央を空けた輪郭リング', { ringAppearance: 'outline', ringCount: 9, composition: 'surround', scale: 'normal', opacity: 66 }, 'aqua' ],
			[ 'moving-ripples', 'ゆっくり広がる夜の波紋', { ringAppearance: 'outline', ringCount: 6, motion: 'flow', motionSpeed: 'slow', scale: 'large', opacity: 68 }, 'gold' ]
		],
		'tile-geometry': [
			[ 'classic', '旧版の三角タイル', { tilePattern: 'classic', tileGap: 0, tileFill: 'standard', opacity: 34 }, 'aqua' ], [ 'minimal', 'ミニマル・四角タイル', { tilePattern: 'square', opacity: 22, density: 28 }, 'paper' ], [ 'mosaic', '暖色モザイク', { tilePattern: 'mosaic', opacity: 48, density: 58 }, 'warm' ], [ 'architecture', '建築・斜め分割', { tilePattern: 'diagonal', opacity: 38, density: 34 }, 'blue' ],
			[ 'honeycomb', '隙間なしのハニカム', { tilePattern: 'hex', tileGap: 0, opacity: 48, colorCount: 2 }, 'forest' ],
			[ 'airy-hex', '余白のある六角形・コーナー', { tilePattern: 'hex', tileGap: 16, composition: 'corners', opacity: 68, colorCount: 2 }, 'aqua' ],
			[ 'paper-triangles', '淡い三角タイル・紙の質感', { tilePattern: 'classic', tileFill: 'sparse', tileGap: 0, scale: 'large', opacity: 52, texture: 'paper', textureOpacity: 10 }, 'paper' ],
			[ 'diamond-frame', 'ダイヤのフレーム・中央に余白', { tilePattern: 'diamond', tileGap: 3, composition: 'surround', opacity: 48 }, 'warm' ]
		],
		dots: [
			[ 'classic', 'ブルーのドット', {}, 'blue' ], [ 'soft', '淡いパステルドット', { opacity: 28, density: 30 }, 'pastel' ], [ 'bold', 'ダーク・ドット', { opacity: 60, density: 62, scale: 'large' }, 'dark' ],
			[ 'fine-dots', '細かなモノクロ・ドット', { scale: 'large', density: 84, opacity: 38, variation: 12 }, 'ink' ],
			[ 'pop-dots', '大粒のポップ・片側', { scale: 'small', density: 70, variation: 76, opacity: 65, composition: 'right' }, 'coral' ],
			[ 'dot-frame', 'アクアのドットフレーム', { composition: 'surround', density: 56, opacity: 46 }, 'aqua' ]
		],
		noise: [
			[ 'classic', 'ブルーの細かな質感', {}, 'blue' ], [ 'soft', 'パステルの淡い質感', { opacity: 28, density: 30 }, 'pastel' ], [ 'bold', 'ダーク・マットの質感', { opacity: 60, density: 62, scale: 'large' }, 'dark' ],
			[ 'warm-paper', 'アイボリー・ペーパー', { opacity: 28, textureAmount: 26, texture: 'paper', textureOpacity: 16 }, 'ivory' ],
			[ 'dark-grain', 'チャコール・細かな粒子', { opacity: 38, textureAmount: 35, texture: 'grain', textureOpacity: 18 }, 'charcoal' ]
		]
	};
	function hexToRgb( hex ) { const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec( hex || '' ); return match ? { r: parseInt( match[ 1 ], 16 ), g: parseInt( match[ 2 ], 16 ), b: parseInt( match[ 3 ], 16 ) } : null; }
	function rgbToHsl( rgb ) { const r = rgb.r / 255; const g = rgb.g / 255; const b = rgb.b / 255; const max = Math.max( r, g, b ); const min = Math.min( r, g, b ); const lightness = ( max + min ) / 2; const delta = max - min; let hue = 0; let saturation = 0; if ( delta ) { saturation = delta / ( 1 - Math.abs( 2 * lightness - 1 ) ); if ( max === r ) hue = ( ( g - b ) / delta + ( g < b ? 6 : 0 ) ) * 60; else if ( max === g ) hue = ( ( b - r ) / delta + 2 ) * 60; else hue = ( ( r - g ) / delta + 4 ) * 60; } return { h: hue, s: saturation * 100, l: lightness * 100 }; }
	function hslToHex( h, s, l ) { const saturation = s / 100; const lightness = l / 100; const chroma = ( 1 - Math.abs( 2 * lightness - 1 ) ) * saturation; const segment = ( ( h % 360 ) + 360 ) % 360 / 60; const x = chroma * ( 1 - Math.abs( segment % 2 - 1 ) ); const m = lightness - chroma / 2; const rgb = segment < 1 ? [ chroma, x, 0 ] : ( segment < 2 ? [ x, chroma, 0 ] : ( segment < 3 ? [ 0, chroma, x ] : ( segment < 4 ? [ 0, x, chroma ] : ( segment < 5 ? [ x, 0, chroma ] : [ chroma, 0, x ] ) ) ) ); return '#' + rgb.map( function( value ) { return Math.round( ( value + m ) * 255 ).toString( 16 ).padStart( 2, '0' ); } ).join( '' ); }
	function themePalette( color ) { const rgb = hexToRgb( color ) || hexToRgb( '#2563eb' ); const hsl = rgbToHsl( rgb ); const hue = hsl.h; const saturation = Math.max( 42, Math.min( 78, hsl.s || 62 ) ); return { baseColor: hslToHex( hue, Math.min( 30, saturation ), 97 ), color1: hslToHex( hue, saturation, 54 ), color2: hslToHex( hue + 24, Math.max( 36, saturation - 12 ), 64 ), color3: hslToHex( hue - 25, Math.max( 32, saturation - 18 ), 70 ), color4: hslToHex( hue + 52, Math.max( 38, saturation - 10 ), 68 ), color5: hslToHex( hue - 48, Math.max( 38, saturation - 8 ), 62 ) }; }
	function paletteChanges( color ) { return Object.assign( { paletteMode: 'theme', paletteThemeColor: color }, themePalette( color ) ); }
	function isFactoryPalette( attributes ) { return Object.keys( FACTORY_PALETTE ).every( function( key ) { return ( attributes[ key ] || '' ).toLowerCase() === FACTORY_PALETTE[ key ]; } ); }
	function usesThemePalette( attributes ) { return attributes.paletteMode === 'theme' || ( ! attributes.paletteMode && isFactoryPalette( attributes ) ); }
	function styleDefaults( style, attributes ) { const defaults = Object.assign( { composition: 'auto', texture: 'none', colorCount: 4, style: style, stylePreset: 'classic', motionSpeed: 'standard', motionStrength: 'standard', motionMobile: false }, STYLE_DEFAULTS[ style ] || {} ); if ( attributes && usesThemePalette( attributes ) ) return Object.assign( defaults, paletteChanges( SITE_THEME_COLOR ) ); if ( attributes && attributes.paletteMode === 'manual' ) Object.keys( FACTORY_PALETTE ).forEach( function( key ) { defaults[ key ] = attributes[ key ]; } ); return defaults; }
	function recommendedPalette( name ) {
		const palettes = {
			blue: [ '#f5f9fc', '#1e6091', '#3f93ba', '#86c5d8', '#b8dfe7', '#153c56' ],
			green: [ '#ffffff', '#2458ad', '#76ba65', '#59aeb6', '#bddb8d', '#9bcada' ],
			pastel: [ '#fffaf6', '#c6b7e2', '#eac2cf', '#a8d8d3', '#f2d5a4', '#b8cdef' ],
			aqua: [ '#f9ffff', '#219cab', '#64c0c7', '#a3d9db', '#d0eeea', '#387e97' ],
			dark: [ '#0b1525', '#164579', '#2377b3', '#36aabb', '#7c81c4', '#bed6e9' ],
			paper: [ '#f5f5f6', '#c5cad2', '#e0e4e9', '#b4bdc9', '#d4d8df', '#f0f1f3' ],
			warm: [ '#fffaf4', '#cc8d42', '#e9b87b', '#c45c57', '#edcf9e', '#916257' ],
			vivid: [ '#fffaf7', '#ef6a78', '#f4b74b', '#48b59e', '#8e79ce', '#5da7df' ],
			mono: [ '#111827', '#f8fafc', '#cbd5e1', '#94a3b8', '#64748b', '#e2e8f0' ],
			sunrise: [ '#fff8f1', '#e59379', '#efb78b', '#d87586', '#eecba7', '#b88ca9' ],
			forest: [ '#f7faf4', '#347b65', '#7aa583', '#b9cf9d', '#5c9294', '#d2dfbd' ],
			ivory: [ '#faf7ef', '#b5a88c', '#d3c6ac', '#e4d9c5', '#a9b5aa', '#c3b9a7' ],
			aurora: [ '#101c32', '#46b7c5', '#867cd3', '#64c6ad', '#b58acb', '#4795d1' ],
			gold: [ '#202126', '#d6b56d', '#ae8744', '#ecd8a8', '#8e7956', '#b6a893' ],
			ink: [ '#fafbfc', '#536477', '#8392a3', '#b2bbc6', '#d2d9e0', '#34485e' ],
			lemon: [ '#fffef7', '#ecc532', '#f4da6f', '#e2b021', '#f8e9a7', '#e8c069' ],
			sand: [ '#faf6ee', '#aa8963', '#c3a77f', '#dec8a6', '#8d7664', '#d8bb94' ],
			coral: [ '#fff9f5', '#d97368', '#eaa691', '#c48b81', '#f2c8ad', '#b57876' ],
			charcoal: [ '#262a31', '#66717e', '#929ba7', '#414c59', '#b2b8bf', '#788390' ]
		};
		const row = palettes[ name ] || palettes.blue; const result = { baseColor: row[ 0 ], colorCount: 4 };
		for ( let color = 1; color <= 5; color++ ) result[ 'color' + color ] = row[ color ];
		return result;
	}
	function presetsFor( style ) {
		const entries = STYLE_PRESETS[ style ] || [ [ 'classic', 'おすすめ', {}, 'blue' ] ];
		return entries.map( function( entry ) { return [ entry[ 0 ], entry[ 1 ], Object.assign( recommendedPalette( entry[ 3 ] ), entry[ 2 ] ) ]; } );
	}
	function presetSeed( style, key ) {
		let seed = 2166136261; const name = style + ':' + key;
		for ( let index = 0; index < name.length; index++ ) seed = Math.imul( seed ^ name.charCodeAt( index ), 16777619 ) >>> 0;
		return seed % 2147483646 + 1;
	}
	function presetChanges( style, key ) {
		const preset = presetsFor( style ).find( function( item ) { return item[ 0 ] === key; } ) || presetsFor( style )[ 0 ];
		// Reset background-only settings, not content layout or free-position images.
		return Object.assign( { composition: 'auto', texture: 'none', textureOpacity: 12, blur: 28, flow: 55, polygonShape: 'mixed', polygonRotation: 45, confettiShape: 'mixed', spotShape: 'mixed', lineDirection: 'right', gridMode: 'cross', tilePattern: 'diamond', tileGap: 8, tileFill: 'standard', halftoneMode: 'diagonal', waveLayers: 3, metaCount: 5, ringCount: 5, ringAppearance: 'dots', textureAmount: 18 }, styleDefaults( style ), preset[ 2 ], { stylePreset: preset[ 0 ], paletteMode: 'manual', seed: presetSeed( style, preset[ 0 ] ) } );
	}
	function tileControls( attributes, setAttributes ) {
		if ( attributes.style !== 'tile-geometry' ) return null;
		return el( element.Fragment, null,
			el( SelectControl, { label: __( 'タイルパターン', 'cni-blocks' ), value: attributes.tilePattern || 'diamond', options: [ { label: __( '旧版の三角タイル', 'cni-blocks' ), value: 'classic' }, { label: __( 'ダイヤ', 'cni-blocks' ), value: 'diamond' }, { label: __( '四角タイル', 'cni-blocks' ), value: 'square' }, { label: __( '斜め分割', 'cni-blocks' ), value: 'diagonal' }, { label: __( 'モザイク', 'cni-blocks' ), value: 'mosaic' }, { label: __( '六角形', 'cni-blocks' ), value: 'hex' } ], onChange: function( value ) { setAttributes( { tilePattern: value } ); } } ),
			attributes.tilePattern === 'classic' ? el( SelectControl, { label: __( '面の量', 'cni-blocks' ), value: attributes.tileFill || 'standard', options: [ { label: __( '少なめ', 'cni-blocks' ), value: 'sparse' }, { label: __( '標準', 'cni-blocks' ), value: 'standard' }, { label: __( '多め', 'cni-blocks' ), value: 'filled' } ], onChange: function( value ) { setAttributes( { tileFill: value } ); } } ) : el( RangeControl, { label: __( '図形間の余白（px）', 'cni-blocks' ), help: attributes.tilePattern === 'hex' ? __( '0にすると六角形同士が接します。', 'cni-blocks' ) : undefined, value: attributes.tileGap === undefined ? 8 : attributes.tileGap, min: 0, max: 28, onChange: function( value ) { setAttributes( { tileGap: value || 0 } ); } } )
		);
	}
	function compositionControls( attributes, setAttributes ) {
		return el( PanelBody, { title: __( '構図・質感', 'cni-blocks' ), initialOpen: true },
			el( SelectControl, { label: __( '図形を置く範囲', 'cni-blocks' ), help: __( '片側や周囲へ配置すると、文字を置く余白を作れます。', 'cni-blocks' ), value: attributes.composition || 'auto', options: [ [ 'auto', 'スタイルの標準' ], [ 'full', '全体' ], [ 'left', '左側（右に余白）' ], [ 'right', '右側（左に余白）' ], [ 'top', '上側' ], [ 'bottom', '下側' ], [ 'both', '上下（中央に余白）' ], [ 'corners', '対角コーナー' ], [ 'surround', '周囲（中央に余白）' ] ].map( function( option ) { return { value: option[ 0 ], label: __( option[ 1 ], 'cni-blocks' ) }; } ), onChange: function( value ) { setAttributes( { composition: value } ); } } ),
			el( SelectControl, { label: __( '重ねる質感', 'cni-blocks' ), value: attributes.texture || 'none', options: [ [ 'none', 'なし' ], [ 'grain', '細かな粒子' ], [ 'paper', 'ペーパー' ], [ 'matte', 'マット' ] ].map( function( option ) { return { value: option[ 0 ], label: __( option[ 1 ], 'cni-blocks' ) }; } ), onChange: function( value ) { setAttributes( { texture: value } ); } } ),
			attributes.texture && attributes.texture !== 'none' ? el( RangeControl, { label: __( '質感の濃さ', 'cni-blocks' ), value: attributes.textureOpacity === undefined ? 12 : attributes.textureOpacity, min: 0, max: 35, onChange: function( value ) { setAttributes( { textureOpacity: value || 0 } ); } } ) : null
		);
	}
	function compositionFor( attributes ) { const selected = attributes.composition || 'auto'; return selected === 'auto' ? ( attributes.style === 'pixel-wave' ? 'right' : ( attributes.style === 'waves' || attributes.style === 'particle-wave' ? 'bottom' : 'full' ) ) : selected; }
	function compositionWeight( placement, x, y ) {
		if ( placement === 'right' ) return Math.max( 0, ( x - .36 ) / .64 );
		if ( placement === 'left' ) return Math.max( 0, ( .64 - x ) / .64 );
		if ( placement === 'top' ) return Math.max( 0, ( .58 - y ) / .58 );
		if ( placement === 'bottom' ) return Math.max( 0, ( y - .42 ) / .58 );
		if ( placement === 'both' ) return Math.max( 0, ( Math.abs( y - .5 ) - .18 ) / .32 );
		if ( placement === 'corners' ) return Math.max( Math.max( 0, 1 - Math.hypot( x, y ) / .52 ), Math.max( 0, 1 - Math.hypot( 1 - x, 1 - y ) / .52 ) );
		if ( placement === 'surround' ) return Math.max( 0, ( Math.max( Math.abs( x - .5 ), Math.abs( y - .5 ) ) - .2 ) / .3 );
		return 1;
	}
	function compositionStyle( attributes ) {
		const position = compositionFor( attributes ); const mask = {
			left: 'linear-gradient(90deg,#000,transparent 68%)', right: 'linear-gradient(270deg,#000,transparent 68%)',
			top: 'linear-gradient(#000,transparent 62%)', bottom: 'linear-gradient(0deg,#000,transparent 62%)',
			both: 'linear-gradient(#000,transparent 35%,transparent 65%,#000)', surround: 'radial-gradient(ellipse,transparent 25%,#000 80%)',
			corners: 'linear-gradient(135deg,#000,transparent 32%,transparent 68%,#000)'
		}[ position ];
		return mask ? { maskImage: mask, WebkitMaskImage: mask } : {};
	}
	function designCanvas( attributes ) {
		const random = seededRandom( attributes.seed ); const colors = activeColors( attributes ); const scale = SIZE_MAP[ attributes.scale ] || 1;
		const density = clamp( attributes.density, 10, 100, 50 ); const variation = clamp( attributes.variation, 0, 100, 55 ) / 100; const opacity = clamp( attributes.opacity, 5, 100, 55 ) / 100; const placement = compositionFor( attributes ); const layers = [];
		const addLayer = function( markup, index ) { const dots = attributes.style === 'pixel-wave' || attributes.style === 'particle-wave'; layers.push( el( 'span', { key: index, className: 'cni-bg2__design-layer cni-bg2__design-layer--' + attributes.style, style: { backgroundImage: svgData( '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600" preserveAspectRatio="none">' + markup + '</svg>' ), backgroundSize: dots ? 'cover' : '100% 100%', backgroundPosition: dots ? ( placement === 'left' || placement === 'right' ? placement + ' center' : 'center ' + ( placement === 'top' ? 'top' : 'bottom' ) ) : 'center', opacity: opacity, '--layer-delay': ( -index * 2.3 ) + 's', '--layer-direction': index % 2 ? 'alternate-reverse' : 'alternate' } } ) ); };
		const orientation = placement === 'top' ? 'translate(0 600) scale(1 -1)' : ( placement === 'right' ? 'matrix(0 -.6 1.666667 0 0 600)' : ( placement === 'left' ? 'matrix(0 .6 -1.666667 0 1000 0)' : '' ) );
		if ( attributes.style === 'pixel-wave' ) {
			const cell = 26 * scale; const columns = Math.ceil( 1000 / cell ); const rows = Math.ceil( 600 / cell ); const buckets = [ [], [], [] ]; const centers = Array.from( { length: 3 }, function() { return { x: placement === 'right' ? .62 + random() * .38 : ( placement === 'left' ? random() * .38 : random() ), y: random() }; } );
			for ( let row = 0; row < rows; row++ ) for ( let column = 0; column < columns; column++ ) {
				const x = ( column + .5 ) / columns; const y = ( row + .5 ) / rows; const cluster = centers.reduce( function( value, center ) { return Math.max( value, Math.exp( -( ( x - center.x ) ** 2 + ( y - center.y ) ** 2 ) / .065 ) ); }, 0 );
				const chance = Math.min( .94, Math.sqrt( compositionWeight( placement, x, y ) ) * ( .15 + density / 80 ) * ( .32 + cluster * .85 ) ); const visible = random(); const sizeRandom = random(); const colorRandom = random(); if ( visible > chance ) continue;
				const side = cell * ( .92 - variation * sizeRandom * .66 ); const px = column * 1000 / columns + ( cell - side ) / 2; const py = row * 600 / rows + ( cell - side ) / 2;
				buckets[ ( row + column ) % 3 ].push( '<rect x="' + px.toFixed( 2 ) + '" y="' + py.toFixed( 2 ) + '" width="' + side.toFixed( 2 ) + '" height="' + side.toFixed( 2 ) + '" fill="' + colors[ Math.floor( colorRandom * colors.length ) ] + '" fill-opacity="' + ( .6 + sizeRandom * .4 ).toFixed( 2 ) + '"/>' );
			}
			buckets.forEach( function( bucket, index ) { addLayer( bucket.join( '' ), index ); } );
		} else if ( attributes.style === 'waves' ) {
			const count = clamp( attributes.waveLayers, 1, 5, 3 ); const seedPhase = random() * Math.PI * 2;
			for ( let index = 0; index < count; index++ ) {
				const band = ( placement === 'full' ? 325 : 475 ) - index * ( 25 + density * .32 ); const amplitude = ( 22 + variation * 55 ) * scale; const phase = seedPhase + index * .85; const points = [];
				for ( let x = -80; x <= 1080; x += 20 ) points.push( x + ' ' + ( band + Math.sin( x / 260 + phase ) * amplitude + Math.cos( x / 480 + phase ) * amplitude * .35 ).toFixed( 2 ) );
				const shape = '<path d="M' + points.join( 'L' ) + 'L1080 650H-80Z" fill="' + colors[ index % colors.length ] + '" fill-opacity=".65"/>';
				addLayer( '<g transform="' + orientation + '">' + shape + '</g>' + ( placement === 'both' ? '<g transform="translate(0 600) scale(1 -1)">' + shape + '</g>' : '' ), index );
			}
		} else if ( attributes.style === 'particle-wave' ) {
			const columns = Math.min( 72, Math.round( ( 32 + density * .34 ) / scale ) ); const rows = Math.min( 14, Math.round( 6 + density / 10 ) ); const buckets = [ [], [], [] ]; const phase = random() * Math.PI * 2;
			for ( let row = 0; row < rows; row++ ) for ( let column = 0; column < columns; column++ ) {
				const x = column / ( columns - 1 ) * 1000; const depth = row / ( rows - 1 ); const y = ( placement === 'full' ? 150 + depth * 405 : 320 + depth * 255 ) + Math.sin( x / 180 + phase + depth * 2 ) * ( 20 + variation * 65 ) * scale;
				buckets[ row % 3 ].push( '<circle cx="' + x.toFixed( 2 ) + '" cy="' + y.toFixed( 2 ) + '" r="' + ( ( 1.2 + depth * 3 ) * scale ).toFixed( 2 ) + '" fill="' + colors[ row % colors.length ] + '" fill-opacity="' + ( .2 + ( 1 - depth ) * .7 ).toFixed( 2 ) + '"/>' );
			}
			buckets.forEach( function( bucket, index ) { const shape = bucket.join( '' ); addLayer( '<g transform="' + orientation + '">' + shape + '</g>' + ( placement === 'both' ? '<g transform="translate(0 600) scale(1 -1)">' + shape + '</g>' : '' ), index ); } );
		} else if ( attributes.style === 'layered-panels' ) {
			const count = Math.round( 3 + density / 18 );
			for ( let index = 0; index < count; index++ ) {
				const x = index / count * 1200 - 140; const width = ( 200 + random() * 180 * variation ) * scale; const skew = 180 + variation * 190;
				addLayer( '<defs><linearGradient id="p"><stop stop-color="' + colors[ index % colors.length ] + '" stop-opacity=".12"/><stop offset="1" stop-color="' + colors[ index % colors.length ] + '" stop-opacity=".9"/></linearGradient></defs><path d="M' + x + ' -80H' + ( x + width ) + 'L' + ( x + width - skew ) + ' 680H' + ( x - skew ) + 'Z" fill="url(#p)" stroke="' + colors[ ( index + 1 ) % colors.length ] + '" stroke-opacity=".35" stroke-width="1.5"/>', index );
			}
		} else {
			// A shared vertex lattice creates continuous low-poly facets, rather
			// than overlapping floating polygons.
			const columns = Math.max( 3, Math.round( ( 5 + density / 18 ) / scale ) ); const rows = Math.max( 2, Math.round( columns * .6 ) ); const vertices = []; const shapes = [];
			for ( let row = 0; row <= rows; row++ ) for ( let column = 0; column <= columns; column++ ) vertices.push( [ column * 1000 / columns + ( column && column < columns ? ( random() - .5 ) * 1000 / columns * variation * .65 : 0 ), row * 600 / rows + ( row && row < rows ? ( random() - .5 ) * 600 / rows * variation * .65 : 0 ) ] );
			for ( let row = 0; row < rows; row++ ) for ( let column = 0; column < columns; column++ ) { const a = row * ( columns + 1 ) + column; [ [ a, a + 1, a + columns + 2 ], [ a, a + columns + 2, a + columns + 1 ] ].forEach( function( triangle ) { const color = colors[ Math.floor( random() * colors.length ) ]; shapes.push( '<polygon points="' + triangle.map( function( point ) { return vertices[ point ].map( function( value ) { return value.toFixed( 2 ); } ).join( ',' ); } ).join( ' ' ) + '" fill="' + color + '" stroke="' + color + '" stroke-width=".6" fill-opacity="' + ( .32 + random() * .55 ).toFixed( 2 ) + '"/>' ); } ); }
			addLayer( shapes.join( '' ), 0 );
		}
		return el( 'div', { className: 'cni-bg2__design cni-bg2__design--' + attributes.style, style: attributes.style === 'layered-panels' || attributes.style === 'soft-polygons' || [ 'surround', 'corners', 'both' ].indexOf( placement ) !== -1 ? compositionStyle( attributes ) : {} }, layers );
	}
	function textureCanvas( attributes ) {
		if ( ! attributes.texture || attributes.texture === 'none' ) return null;
		const frequency = { grain: .7, paper: .18, matte: .38 }[ attributes.texture ] || .7;
		const markup = '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="t"><feTurbulence type="fractalNoise" baseFrequency="' + frequency + '" numOctaves="2" seed="' + ( Math.abs( Math.floor( attributes.seed || 1 ) ) % 997 ) + '" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="160" height="160" filter="url(#t)"/></svg>';
		return el( 'span', { className: 'cni-bg2__texture', style: { backgroundImage: svgData( markup ), opacity: clamp( attributes.textureOpacity, 0, 35, 12 ) / 100 } } );
	}
	const SHAPES = {
		triangle: 'polygon(50% 0, 100% 100%, 0 100%)', square: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', pentagon: 'polygon(50% 0, 100% 38%, 81% 100%, 19% 100%, 0 38%)', hexagon: 'polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)', irregular: 'polygon(10% 12%, 75% 0, 100% 55%, 70% 95%, 13% 80%, 0 42%)'
	};

	function clamp( value, min, max, fallback ) { const next = typeof value === 'number' && Number.isFinite( value ) ? value : fallback; return Math.max( min, Math.min( max, next ) ); }
	function seededRandom( seed ) { let value = ( Math.abs( Math.floor( seed ) ) || 1 ) % 2147483647; return function() { value = value * 16807 % 2147483647; return ( value - 1 ) / 2147483646; }; }
	function activeColors( attributes ) { return [ attributes.color1, attributes.color2, attributes.color3, attributes.color4, attributes.color5 ].slice( 0, clamp( attributes.colorCount, 1, 5, 4 ) ).filter( Boolean ); }
	function colorSettings( attributes ) { const style = attributes.style; if ( style === 'noise' ) return { min: 0, max: 0, count: 0 }; if ( style === 'grid' || style === 'dots' ) return { min: 1, max: 1, count: 1 }; if ( style === 'tile-geometry' ) return { min: 2, max: 2, count: 2 }; if ( style === 'rings' && ( attributes.ringAppearance || 'dots' ) === 'outline' ) { const maximum = clamp( attributes.ringCount, 3, 5, 5 ); return { min: 1, max: maximum, count: clamp( attributes.colorCount, 1, maximum, maximum ) }; } if ( style === 'waves' ) { const maximum = clamp( attributes.waveLayers, 1, 5, 3 ); return { min: 1, max: maximum, count: clamp( attributes.colorCount, 1, maximum, maximum ) }; } return { min: 2, max: 5, count: clamp( attributes.colorCount, 2, 5, 4 ) }; }
	function uid() { return 'background-image-' + Date.now().toString( 36 ) + '-' + Math.random().toString( 36 ).slice( 2, 7 ); }
	function images( attributes ) { return Array.isArray( attributes.freeImages ) ? attributes.freeImages.slice( 0, FREE_IMAGE_LIMIT ).filter( function( image ) { return image && image.imageUrl; } ) : []; }
	function imageValue( image, key, device, fallback ) { const suffix = device === 'pc' ? key : device + key.charAt( 0 ).toUpperCase() + key.slice( 1 ); if ( typeof image[ suffix ] === 'number' ) return image[ suffix ]; if ( device === 'mobile' ) return imageValue( image, key, 'tablet', fallback ); return typeof image[ key ] === 'number' ? image[ key ] : fallback; }
	function imageVisible( image, device ) {
		// Unedited saved images retain the original per-device visibility markup.
		const order = image.responsiveVersion === 2 ? ( device === 'mobile' ? [ 'mobile', 'tablet', 'pc' ] : ( device === 'tablet' ? [ 'tablet', 'pc' ] : [ 'pc' ] ) ) : [ device ];
		for ( let index = 0; index < order.length; index++ ) { const key = imageFieldKey( 'visible', order[ index ] ); if ( typeof image[ key ] === 'boolean' ) return image[ key ]; }
		return true;
	}
	function imageFieldKey( key, device ) { return device === 'pc' ? key : device + key.charAt( 0 ).toUpperCase() + key.slice( 1 ); }
	function imageNumberText( value ) { return String( Math.round( value * 10 ) / 10 ); }
	function updatedFreeImage( image, changes ) {
		const responsive = Object.keys( changes ).some( function( key ) { return /^(x|y|width|visible|(tablet|mobile)(X|Y|Width|Visible))$/.test( key ); } );
		return Object.assign( {}, image, responsive ? { responsiveVersion: 2 } : {}, changes );
	}
	function FreeImageControls( props ) {
		const attributes = props.attributes; const selected = props.selected; const device = props.device; const list = images( attributes );
		const update = function( changes ) { if ( selected ) props.updateImage( selected.id, changes ); };
		const updateNumber = function( key, value ) { const changes = {}; changes[ imageFieldKey( key, device ) ] = clamp( typeof value === 'string' ? parseFloat( value ) : value, key === 'width' ? 5 : -30, key === 'width' ? 100 : 130, key === 'width' ? 30 : 50 ); update( changes ); };
		const inherited = function( key ) { return device !== 'pc' && typeof selected[ imageFieldKey( key, device ) ] === 'undefined'; };
		const positionFromPointer = function( event ) { const rect = event.currentTarget.getBoundingClientRect(); if ( ! rect.width || ! rect.height ) return; const changes = {}; changes[ imageFieldKey( 'x', device ) ] = clamp( ( event.clientX - rect.left ) / rect.width * 160 - 30, -30, 130, 50 ); changes[ imageFieldKey( 'y', device ) ] = clamp( ( event.clientY - rect.top ) / rect.height * 160 - 30, -30, 130, 50 ); update( changes ); };
		const releasePointer = function( event ) { if ( event.currentTarget.releasePointerCapture && event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture( event.pointerId ) ) event.currentTarget.releasePointerCapture( event.pointerId ); };
		return el( PanelBody, { title: __( '自由配置画像', 'cni-blocks' ), initialOpen: false },
			el( ToggleControl, { label: __( '自由配置画像を使用する', 'cni-blocks' ), checked: !! attributes.freeImagesEnabled, onChange: function( value ) { props.setAttributes( { freeImagesEnabled: !! value } ); } } ),
			attributes.freeImagesEnabled ? el( element.Fragment, null,
				el( 'p', { className: 'description' }, __( '編集画面では画像を直接ドラッグして移動できます。PC／Tablet／Mobileごとに位置・幅・表示を保存し、未設定の端末は上位の設定を使用します。画像ファイルは全端末で共通です。', 'cni-blocks' ) ),
				el( ButtonGroup, { className: 'cni-bg2__image-device-tabs', role: 'group', 'aria-label': __( '編集する端末', 'cni-blocks' ) }, [ 'pc', 'tablet', 'mobile' ].map( function( value ) { return el( Button, { key: value, variant: device === value ? 'primary' : 'secondary', isPressed: device === value, onClick: function() { props.setDevice( value ); } }, { pc: 'PC', tablet: 'Tablet', mobile: 'Mobile' }[ value ] ); } ) ),
				list.length ? el( 'div', { className: 'cni-bg2__image-list' }, list.map( function( image, index ) { return el( Button, { key: image.id, variant: selected && selected.id === image.id ? 'primary' : 'secondary', onClick: function() { props.select( image.id ); } }, ( index + 1 ) + '. ' + ( image.name || __( '画像', 'cni-blocks' ) ) ); } ) ) : null,
				el( MediaUploadCheck, null, el( MediaUpload, { allowedTypes: [ 'image' ], multiple: false, onSelect: function( media ) {
					if ( ! media || ! media.url || list.length >= FREE_IMAGE_LIMIT ) return;
					const image = { id: uid(), name: __( '画像', 'cni-blocks' ) + ( list.length + 1 ), imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '', layer: 'front', x: 50, y: 50, width: 30, visible: true, responsiveVersion: 2, rotation: 0, opacity: 100, flipX: false, imageMotion: 'none' };
					props.setAttributes( { freeImages: list.concat( image ) } ); props.select( image.id );
				}, render: function( upload ) { return el( Button, { variant: 'primary', disabled: list.length >= FREE_IMAGE_LIMIT, onClick: upload.open }, list.length >= FREE_IMAGE_LIMIT ? __( '画像は最大6枚です', 'cni-blocks' ) : __( '画像を追加', 'cni-blocks' ) ); } } ) ),
				selected ? el( 'div', { className: 'cni-bg2__image-settings' },
					selected.responsiveVersion !== 2 ? el( 'p', { className: 'description' }, __( '既存画像の表示を保持しています。位置・幅・表示を変更すると、Outer+と同じ端末別仕様へ切り替わります。', 'cni-blocks' ) ) : null,
					el( TextControl, { label: __( '管理用名称', 'cni-blocks' ), value: selected.name || '', onChange: function( value ) { update( { name: value } ); } } ),
					el( 'img', { className: 'cni-bg2__image-preview', src: selected.imageUrl, alt: '' } ),
					el( MediaUploadCheck, null, el( MediaUpload, { allowedTypes: [ 'image' ], value: selected.imageId || 0, onSelect: function( media ) { if ( media && media.url ) update( { imageId: media.id || 0, imageUrl: media.url, imageAlt: media.alt || '' } ); }, render: function( upload ) { return el( Button, { variant: 'secondary', onClick: upload.open }, __( '画像を変更', 'cni-blocks' ) ); } } ) ),
					el( TextControl, { label: __( '代替テキスト', 'cni-blocks' ), value: selected.imageAlt || '', onChange: function( value ) { update( { imageAlt: value } ); } } ),
					el( SelectControl, { label: __( '表示階層', 'cni-blocks' ), value: selected.layer || 'front', options: [ { label: __( 'コンテンツの背面', 'cni-blocks' ), value: 'back' }, { label: __( 'コンテンツの前面', 'cni-blocks' ), value: 'front' } ], onChange: function( value ) { update( { layer: value } ); } } ),
					el( ToggleControl, { label: { pc: 'PC', tablet: 'Tablet', mobile: 'Mobile' }[ device ] + __( 'で表示', 'cni-blocks' ), checked: imageVisible( selected, device ), help: inherited( 'visible' ) && selected.responsiveVersion === 2 ? __( '上位設定を継承中です。切り替えるとこの端末だけに保存します。', 'cni-blocks' ) : undefined, onChange: function( value ) { const changes = {}; changes[ imageFieldKey( 'visible', device ) ] = !! value; update( changes ); } } ),
					el( 'p', { className: 'cni-bg2__image-picker-label' }, __( '位置（背景生成+中央が50% / 50%）', 'cni-blocks' ) ),
					el( 'div', { className: 'cni-bg2__image-picker', 'aria-label': __( '自由配置画像の位置。数値入力でも調整できます。', 'cni-blocks' ), onPointerDown: function( event ) { if ( event.button !== 0 ) return; event.preventDefault(); positionFromPointer( event ); if ( event.currentTarget.setPointerCapture ) event.currentTarget.setPointerCapture( event.pointerId ); }, onPointerMove: function( event ) { if ( event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture( event.pointerId ) ) positionFromPointer( event ); }, onPointerUp: releasePointer, onPointerCancel: releasePointer }, el( 'span', { className: 'cni-bg2__image-picker-boundary' } ), el( 'span', { className: 'cni-bg2__image-picker-dot', style: { left: ( imageValue( selected, 'x', device, 50 ) + 30 ) / 160 * 100 + '%', top: ( imageValue( selected, 'y', device, 50 ) + 30 ) / 160 * 100 + '%' } } ) ),
					[ 'x', 'y' ].map( function( key ) { return el( TextControl, { key: key, type: 'number', step: '0.1', label: key.toUpperCase() + '（%）', value: imageNumberText( imageValue( selected, key, device, 50 ) ), help: inherited( key ) ? __( '上位設定を継承中です。入力するとこの端末だけに保存します。', 'cni-blocks' ) : undefined, onChange: function( value ) { updateNumber( key, value ); } } ); } ),
					el( 'div', { className: 'cni-bg2__image-width-control' },
						el( 'p', { className: 'cni-bg2__image-width-label' }, __( '幅（%）', 'cni-blocks' ) ),
						el( RangeControl, { label: __( '幅（%）', 'cni-blocks' ), hideLabelFromVision: true, className: 'cni-bg2__image-width-slider', value: imageValue( selected, 'width', device, 30 ), min: 5, max: 100, step: 1, help: inherited( 'width' ) ? __( '上位設定を継承中です。変更するとこの端末だけに保存します。', 'cni-blocks' ) : undefined, onChange: function( value ) { updateNumber( 'width', value ); } } ),
						el( TextControl, { type: 'number', step: '0.1', label: __( '幅（%）', 'cni-blocks' ), hideLabelFromVision: true, className: 'cni-bg2__image-width-number', value: imageNumberText( imageValue( selected, 'width', device, 30 ) ), onChange: function( value ) { updateNumber( 'width', value ); } } )
					),
					el( RangeControl, { label: __( '回転', 'cni-blocks' ), value: selected.rotation || 0, min: -180, max: 180, onChange: function( value ) { update( { rotation: value } ); } } ),
					el( RangeControl, { label: __( '透明度', 'cni-blocks' ), value: selected.opacity === undefined ? 100 : selected.opacity, min: 0, max: 100, onChange: function( value ) { update( { opacity: value } ); } } ),
					el( ToggleControl, { label: __( '左右反転', 'cni-blocks' ), checked: !! selected.flipX, onChange: function( value ) { update( { flipX: !! value } ); } } ),
					el( SelectControl, { label: __( '画像モーション', 'cni-blocks' ), value: selected.imageMotion || 'none', options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( '浮遊', 'cni-blocks' ), value: 'float' }, { label: __( '明滅', 'cni-blocks' ), value: 'pulse' } ], onChange: function( value ) { update( { imageMotion: value } ); } } ),
					el( Button, { variant: 'secondary', disabled: list.length >= FREE_IMAGE_LIMIT, onClick: function() { if ( list.length >= FREE_IMAGE_LIMIT ) return; const copy = Object.assign( {}, selected, { id: uid(), name: ( selected.name || __( '画像', 'cni-blocks' ) ) + __( ' コピー', 'cni-blocks' ), x: clamp( imageValue( selected, 'x', 'pc', 50 ) + 3, -30, 130, 50 ), y: clamp( imageValue( selected, 'y', 'pc', 50 ) + 3, -30, 130, 50 ) } ); props.setAttributes( { freeImages: list.concat( copy ) } ); props.select( copy.id ); } }, __( 'この画像を複製', 'cni-blocks' ) ),
					el( Button, { variant: 'tertiary', isDestructive: true, onClick: function() { const next = list.filter( function( image ) { return image.id !== selected.id; } ); props.setAttributes( { freeImages: next } ); props.select( next[ 0 ] ? next[ 0 ].id : '' ); } }, __( 'この画像を削除', 'cni-blocks' ) )
				) : el( 'p', null, __( '画像を追加してください。', 'cni-blocks' ) )
			) : null
		);
	}
	function motionValues( attributes, preview ) { const speed = preview ? 4 : ( { standard: 18, slow: 30, verySlow: 44 }[ attributes.motionSpeed ] || 18 ); const strength = { subtle: 6, standard: 13, dynamic: 23 }[ attributes.motionStrength ] || 13; return { '--cni-bg2-duration': speed + 's', '--cni-bg2-shift': strength + '%', '--cni-bg2-shift-negative': -strength + '%', '--cni-bg2-shift-up': -( strength * .5 ) + '%', '--cni-bg2-shift-down': strength * .4 + '%' }; }
	function visualItems( attributes ) {
		const random = seededRandom( attributes.seed ); const colors = activeColors( attributes ); const scale = SIZE_MAP[ attributes.scale ] || 1; const density = clamp( attributes.density, 10, 100, 50 ); const variation = clamp( attributes.variation, 0, 100, 55 ); const motionFactor = { subtle: .6, standard: 1, dynamic: 1.75 }[ attributes.motionStrength ] || 1;
		/* Larger objects deliberately consume more of the visual budget.  Density is
		 * still meaningful, but choosing xlarge never creates a field of tiny items. */
		const scaleCount = { small: 1.18, normal: 1, large: .76, xlarge: .54 }[ attributes.scale ] || 1;
		const count = Math.max( 3, Math.round( ( attributes.style === 'confetti' ? 10 + density * .62 : ( attributes.style === 'rings' ? 4 + density * .3 : 5 + density * .25 ) ) * scaleCount ) );
		const list = [];
		for ( let index = 0; index < count; index++ ) {
			const sizeBase = attributes.style === 'confetti' ? 5 + random() * 22 : 9 + random() * 31;
			const size = sizeBase * scale * ( 1 + ( random() - .5 ) * variation / 60 );
			/* A jittered grid keeps regenerated layouts visibly different without
			 * repeatedly clustering every item in one corner. */
			const columns = Math.ceil( Math.sqrt( count * 1.45 ) ); const rows = Math.ceil( count / columns ); const cellX = ( index % columns + .5 ) / columns * 100; const cellY = ( Math.floor( index / columns ) + .5 ) / rows * 100; const jitter = 7 + variation * .16; const x = clamp( cellX + ( random() - .5 ) * jitter * 2, 3, 97, 50 ); const y = clamp( cellY + ( random() - .5 ) * jitter * 2, 3, 97, 50 ); const rotation = Math.round( random() * 360 + ( attributes.polygonRotation || 0 ) );
			const color = colors[ index % colors.length ] || '#60a5fa';
			const shapeChoices = attributes.polygonShape === 'mixed' ? Object.keys( SHAPES ) : [ attributes.polygonShape || 'triangle' ];
			const confettiShape = attributes.confettiShape === 'mixed' ? [ 'pill', 'square', 'circle' ][ index % 3 ] : attributes.confettiShape;
			list.push( { x: x, y: y, size: size, rotation: rotation, color: color, alpha: .22 + random() * .58, clip: SHAPES[ shapeChoices[ index % shapeChoices.length ] ] || SHAPES.triangle, confettiShape: confettiShape, delay: ( random() * -12 ).toFixed( 2 ) + 's', driftX: ( random() * 2 - 1 ) * 12 * motionFactor + '%', driftY: ( random() * 2 - 1 ) * 12 * motionFactor + '%' } );
		}
		return list;
	}
	function svgData( markup ) { return 'url("data:image/svg+xml,' + encodeURIComponent( markup ).replace( /'/g, '%27' ) + '")'; }
	function svgCanvas( attributes, colors, scale, opacity ) {
		const random = seededRandom( attributes.seed ); const density = clamp( attributes.density, 10, 100, 50 ); const variation = clamp( attributes.variation, 0, 100, 55 ); const stroke = Math.max( .7, scale * ( .72 + density / 145 ) );
		let svg = ''; let size = '320px 180px'; let repeat = 'repeat';
		if ( attributes.style === 'flow-lines' ) { const paths = []; const count = Math.round( 3 + density / 16 ); for ( let index = 0; index < count; index++ ) { const y = 20 + index * 120 / ( count - 1 || 1 ); const bend = 12 + variation * .2; paths.push( '<path d="M0 ' + y + ' C100 ' + ( y - bend ) + ' 100 ' + ( y + bend ) + ' 200 ' + y + ' S300 ' + ( y - bend ) + ' 400 ' + y + '" fill="none" stroke="' + colors[ index % colors.length ] + '" stroke-width="' + ( stroke * ( 1 + index % 3 ) ).toFixed( 1 ) + '" stroke-linecap="round"/>' ); } svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 160">' + paths.join( '' ) + '</svg>'; size = Math.round( 400 / Math.max( .72, scale ) ) + 'px 180px'; }
		else if ( attributes.style === 'geometry' ) { const shapes = []; const count = Math.round( 5 + density / 11 ); const cols = Math.ceil( Math.sqrt( count * 1.65 ) ); const rows = Math.ceil( count / cols ); for ( let index = 0; index < count; index++ ) { const x = ( index % cols + .5 ) / cols * 1000 + ( random() - .5 ) * ( 50 + variation ); const y = ( Math.floor( index / cols ) + .5 ) / rows * 600 + ( random() - .5 ) * ( 38 + variation * .7 ); const radius = ( 30 + random() * ( 40 + variation * .65 ) ) * scale; const sides = 3 + index % 5; const points = []; for ( let point = 0; point < sides; point++ ) { const angle = -Math.PI / 2 + point * Math.PI * 2 / sides + random() * .26; points.push( ( x + Math.cos( angle ) * radius ).toFixed( 1 ) + ',' + ( y + Math.sin( angle ) * radius ).toFixed( 1 ) ); } shapes.push( '<polygon points="' + points.join( ' ' ) + '" fill="none" stroke="' + colors[ index % colors.length ] + '" stroke-width="' + stroke.toFixed( 1 ) + '"/>'); } svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" preserveAspectRatio="none">' + shapes.join( '' ) + '</svg>'; size = '100% 100%'; repeat = 'no-repeat'; }
		else if ( attributes.style === 'noise' ) { svg = '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".' + Math.round( 8 + density / 8 ) + '" numOctaves="' + ( variation > 55 ? 3 : 2 ) + '" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".' + Math.round( clamp( attributes.textureAmount, 0, 80, 18 ) ) + '"/></svg>'; size = '180px 180px'; }
		return { image: svgData( svg ), size: size, opacity: opacity, repeat: repeat };
	}
	function patternedCanvas( attributes, colors, scale, opacity ) {
		const density = clamp( attributes.density, 10, 100, 50 ); const variation = clamp( attributes.variation, 0, 100, 55 ); const primary = colors[ 0 ] || '#60a5fa'; const secondary = colors[ 1 ] || primary; const unit = Math.round( ( 154 - density ) / Math.max( .64, scale ) * ( .82 + variation / 230 ) ); const style = { opacity: opacity };
		if ( attributes.style === 'halftone' ) {
			/* Each dot is generated explicitly: unlike the former CSS mask, every
			 * selected accent colour is visible and the size gradient is real. */
			const direction = attributes.halftoneMode || 'diagonal'; const columns = Math.max( 7, Math.round( 7 + density / 17 ) ); const cell = 200 / columns; const dots = [];
			for ( let row = 0; row < columns; row++ ) { for ( let column = 0; column < columns; column++ ) { const x = ( column + .5 ) * cell; const y = ( row + .5 ) * cell; const diagonal = ( x + y ) / 400; const vertical = y / 200; const radial = Math.max( 0, 1 - Math.hypot( x - 100, y - 100 ) / 142 ); const wave = ( Math.sin( ( x + y ) / 30 ) + 1 ) / 2; const tone = direction === 'vertical' ? vertical : ( direction === 'radial' ? radial : ( direction === 'wave' ? wave : diagonal ) ); const radius = Math.max( .7, 1 + tone * cell * ( .28 + variation / 420 ) ); const colorIndex = Math.min( colors.length - 1, Math.floor( tone * colors.length ) ); dots.push( '<circle cx="' + x.toFixed( 2 ) + '" cy="' + y.toFixed( 2 ) + '" r="' + radius.toFixed( 2 ) + '" fill="' + ( colors[ colorIndex ] || primary ) + '"/>' ); } }
			style.backgroundImage = svgData( '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' + dots.join( '' ) + '</svg>' ); style.backgroundSize = Math.max( 120, unit * 2 ) + 'px ' + Math.max( 120, unit * 2 ) + 'px'; style.backgroundRepeat = 'repeat';
		}
		else if ( attributes.style === 'dots' ) { const radius = Math.max( 3, Math.round( 4 + density / 18 + variation * .055 ) ); style.backgroundImage = 'radial-gradient(circle, ' + primary + ' 0 ' + radius + 'px, transparent ' + ( radius + 1 ) + 'px)'; style.backgroundSize = unit + 'px ' + unit + 'px'; }
		else if ( attributes.style === 'grid' ) { const line = Math.max( 1, Math.round( scale * ( .7 + variation / 155 ) ) ); style.backgroundImage = attributes.gridMode === 'diagonal' ? 'repeating-linear-gradient(45deg, transparent 0 ' + ( unit - line ) + 'px, ' + primary + ' ' + ( unit - line ) + 'px ' + unit + 'px)' : ( attributes.gridMode === 'vertical' ? 'linear-gradient(90deg, ' + primary + ' ' + line + 'px, transparent ' + line + 'px)' : 'linear-gradient(90deg, ' + primary + ' ' + line + 'px, transparent ' + line + 'px), linear-gradient(' + primary + ' ' + line + 'px, transparent ' + line + 'px)' ); style.backgroundSize = unit + 'px ' + unit + 'px'; }
		else if ( attributes.style === 'tile-geometry' ) {
			const tile = attributes.tilePattern || 'diamond'; const gap = clamp( attributes.tileGap, 0, 28, 8 ); const base = attributes.baseColor || '#f8fafc'; const size = Math.max( 48, ( 154 - density ) * scale * ( .82 + variation / 230 ) * 1.28 ); const gapStroke = gap * 100 / size; let markup = '';
			/* SVG tiles make the silhouette of each option unambiguous.  The gap is
			 * a real separator (not a shifted gradient), so hexagonal patterns can
			 * range from touching tiles to airy outlined decoration. */
			if ( tile === 'classic' ) {
				// Restore the legacy triangular field, including seeded empty cells and
				// independently shaded halves; never repeat a small square motif.
				const random = seededRandom( attributes.seed ); const columns = Math.max( 3, Math.round( ( 4 + density / 14 ) / scale ) ); const rows = Math.max( 2, Math.round( ( 3 + density / 20 ) / scale ) ); const width = 1200 / columns; const height = 700 / rows; const amount = { sparse: .36, standard: .62, filled: .84 }[ attributes.tileFill ] || .62; const shapes = [];
				for ( let row = 0; row < rows; row++ ) for ( let column = 0; column < columns; column++ ) {
					const x = column * width; const y = row * height; const alpha = ( .34 + variation / 100 * .28 ) * ( .55 + random() * .7 ); const flipped = random() > .5; const visible = random() < amount;
					if ( visible ) shapes.push( '<path d="M' + x + ' ' + y + 'H' + ( x + width ) + 'L' + ( x + ( flipped ? width : 0 ) ) + ' ' + ( y + height ) + 'Z" fill="' + ( ( row + column ) % 2 ? secondary : primary ) + '" fill-opacity="' + alpha + '"/>' );
					if ( visible && random() < .48 + variation / 100 * .3 ) shapes.push( '<path d="M' + x + ' ' + ( y + height ) + 'H' + ( x + width ) + 'L' + ( x + ( flipped ? 0 : width ) ) + ' ' + y + 'Z" fill="' + ( ( row + column ) % 2 ? primary : secondary ) + '" fill-opacity="' + ( alpha * ( .48 + random() * .34 ) ) + '"/>' );
				}
				markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 700" preserveAspectRatio="none">' + shapes.join( '' ) + '</svg>';
				style.inset = 0;
			} else if ( tile === 'square' ) {
				const cells = [];
				for ( let row = 0; row < 2; row++ ) for ( let column = 0; column < 2; column++ ) cells.push( '<rect x="' + ( column * 50 + gapStroke / 2 ) + '" y="' + ( row * 50 + gapStroke / 2 ) + '" width="' + Math.max( 1, 50 - gapStroke ) + '" height="' + Math.max( 1, 50 - gapStroke ) + '" fill="' + ( ( row + column ) % 2 ? secondary : primary ) + '"/>' );
				markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' + cells.join( '' ) + '</svg>';
			} else if ( tile === 'diagonal' ) {
				markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100"><path d="M-20 88L88-20H120L12 100H-20Z" fill="' + primary + '"/><path d="M42 120L140 22V54L74 120Z" fill="' + secondary + '"/></svg>';
			} else if ( tile === 'mosaic' ) {
				const random = seededRandom( attributes.seed ); const x = 50 + ( random() - .5 ) * variation * .6; const y = 50 + ( random() - .5 ) * variation * .6; const pivot = x + ' ' + y;
				markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g stroke="' + base + '" stroke-width="' + gapStroke + '"><path d="M0 0H100L' + pivot + 'Z" fill="' + primary + '"/><path d="M100 0V100L' + pivot + 'Z" fill="' + secondary + '"/><path d="M100 100H0L' + pivot + 'Z" fill="' + primary + '" fill-opacity=".55"/><path d="M0 100V0L' + pivot + 'Z" fill="' + secondary + '" fill-opacity=".55"/></g></svg>';
			} else if ( tile === 'hex' ) {
				// Adjacent columns are staggered by half a tile. Include edge copies
				// so the 180 x 300 repeat tessellates at all four SVG boundaries.
				const shrink = Math.max( .08, 1 - gap * 180 / size / 100 ); const shapes = []; const first = hexToRgb( primary ); const second = hexToRgb( secondary ); const middle = first && second ? '#' + [ 'r', 'g', 'b' ].map( function( key ) { return Math.round( ( first[ key ] + second[ key ] ) / 2 ).toString( 16 ).padStart( 2, '0' ); } ).join( '' ) : primary;
				for ( let column = -1; column <= 3; column++ ) for ( let row = -1; row <= 3; row++ ) {
					const x = column * 90; const y = row * 100 + ( Math.abs( column % 2 ) ? 50 : 0 ); const fill = [ primary, secondary, middle ][ ( column - row + Math.floor( column / 2 ) + 30 ) % 3 ];
					const points = [ [ -60, 0 ], [ -30, -50 ], [ 30, -50 ], [ 60, 0 ], [ 30, 50 ], [ -30, 50 ] ].map( function( point ) { return ( x + point[ 0 ] * shrink ).toFixed( 3 ) + ',' + ( y + point[ 1 ] * shrink ).toFixed( 3 ); } ).join( ' ' );
					shapes.push( '<polygon points="' + points + '" fill="' + fill + '" stroke="' + fill + '" stroke-width="' + ( gap === 0 ? 1 : 0 ) + '"/>' );
				}
				markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 300">' + shapes.join( '' ) + '</svg>';
			} else {
				markup = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="' + secondary + '"/><g stroke="' + base + '" stroke-width="' + gapStroke + '"><path d="M50 0L100 50L50 100L0 50Z" fill="' + primary + '"/><path d="M0 0H50L0 50ZM100 0V50L50 0ZM100 100H50L100 50ZM0 100V50L50 100Z" fill="' + secondary + '"/></g></svg>';
			}
			if ( tile === 'diagonal' ) { style.backgroundImage = 'repeating-linear-gradient(45deg, ' + primary + ' 0 12%, transparent 12% 50%), repeating-linear-gradient(-45deg, transparent 0 38%, ' + secondary + ' 38% 50%)'; style.backgroundSize = size + 'px ' + size + 'px'; }
			else { style.backgroundImage = svgData( markup ); style.backgroundSize = tile === 'classic' ? '100% 100%' : ( tile === 'hex' ? size + 'px ' + ( size * 300 / 180 ) + 'px' : size + 'px ' + size + 'px' ); style.backgroundRepeat = tile === 'classic' ? 'no-repeat' : 'repeat'; }
			style.backgroundPosition = '0 0';
		}
		return el( 'div', { className: 'cni-bg2__pattern cni-bg2__pattern--' + attributes.style, style: style } );
	}
	function canvas( attributes ) {
		if ( [ 'pixel-wave', 'waves', 'particle-wave', 'layered-panels' ].indexOf( attributes.style ) !== -1 || ( attributes.style === 'soft-polygons' && attributes.polygonShape === 'faceted' ) ) return designCanvas( attributes );
		const colors = activeColors( attributes ); const scale = SIZE_MAP[ attributes.scale ] || 1; const opacity = clamp( attributes.opacity, 5, 100, 55 ) / 100; const items = visualItems( attributes );
		const common = { '--cni-bg2-opacity': opacity, '--cni-bg2-blur': clamp( attributes.blur, 0, 100, 28 ) + 'px' };
		if ( attributes.style === 'soft-mesh' ) {
			const random = seededRandom( attributes.seed );
			const anchors = [ [ 18, 21 ], [ 82, 24 ], [ 53, 82 ], [ 16, 77 ], [ 84, 73 ] ];
			colors.forEach( function( color, index ) { const anchor = anchors[ index ]; common[ '--cni-bg2-color-' + ( index + 1 ) ] = color; common[ '--cni-bg2-x' + ( index + 1 ) ] = clamp( anchor[ 0 ] + ( random() - .5 ) * 26, 4, 96, anchor[ 0 ] ) + '%'; common[ '--cni-bg2-y' + ( index + 1 ) ] = clamp( anchor[ 1 ] + ( random() - .5 ) * 26, 4, 96, anchor[ 1 ] ) + '%'; } );
			common[ '--cni-bg2-mesh-size' ] = Math.round( 44 * scale + clamp( attributes.flow, 0, 100, 55 ) * .38 ) + '%';
			return el( 'div', { className: 'cni-bg2__mesh', style: common } );
		}
		if ( attributes.style === 'fluid-shapes' ) return el( 'div', { className: 'cni-bg2__fluid', style: common }, items.slice( 0, Math.round( 4 + clamp( attributes.density, 10, 100, 50 ) / 18 ) ).map( function( item, index ) { return el( 'span', { key: index, className: 'cni-bg2__fluid-shape', style: { '--size': item.size * 1.55 + 'vw', '--radius': [ '54% 46% 62% 38% / 44% 56% 44% 56%', '36% 64% 44% 56% / 64% 40% 60% 36%', '62% 38% 47% 53% / 37% 54% 46% 63%' ][ index % 3 ], '--color': item.color, '--rotation': item.rotation + 'deg', '--delay': item.delay, '--drift-x': item.driftX, '--drift-y': item.driftY, left: item.x + '%', top: item.y + '%' } } ); } ) );
		if ( attributes.style === 'soft-polygons' ) return el( 'div', { className: 'cni-bg2__polygon', style: common }, items.map( function( item, index ) { return el( 'span', { key: index, className: 'cni-bg2__polygon-item', style: { '--size': item.size * 1.35 + 'vw', '--color': item.color, '--alpha': item.alpha * opacity, '--rotation': item.rotation + 'deg', '--clip': item.clip, '--delay': item.delay, '--drift-x': item.driftX, '--drift-y': item.driftY, left: item.x + '%', top: item.y + '%' } } ); } ) );
		if ( attributes.style === 'confetti' ) return el( 'div', { className: 'cni-bg2__confetti', style: common }, items.map( function( item, index ) { const shape = item.confettiShape || 'pill'; return el( 'span', { key: index, className: 'cni-bg2__confetti-item', style: { '--width': ( shape === 'pill' ? item.size * 2.6 : item.size ) + 'px', '--height': ( shape === 'pill' ? item.size * .65 : item.size ) + 'px', '--radius': shape === 'circle' ? '50%' : ( shape === 'pill' ? '999px' : '2px' ), '--color': item.color, '--alpha': item.alpha * opacity, '--rotation': item.rotation + 'deg', '--delay': item.delay, '--drift-x': item.driftX, '--drift-y': item.driftY, left: item.x + '%', top: item.y + '%' } } ); } ) );
		if ( attributes.style === 'blur-spots' || attributes.style === 'bokeh-dots' || attributes.style === 'metaballs' ) { const className = attributes.style === 'metaballs' ? 'cni-bg2__metaballs' : ( attributes.style === 'bokeh-dots' ? 'cni-bg2__bokeh' : 'cni-bg2__spots' ); const limit = attributes.style === 'metaballs' ? clamp( attributes.metaCount, 3, 10, 5 ) : Math.round( 3 + clamp( attributes.density, 10, 100, 50 ) / 14 ); return el( 'div', { className: className, style: common }, items.slice( 0, limit ).map( function( item, index ) { const spotShape = attributes.spotShape === 'ellipse' ? '42%' : ( attributes.spotShape === 'circle' ? '50%' : ( index % 2 ? '46% 54% 42% 58%' : '50%' ) ); return el( 'span', { key: index, className: 'cni-bg2__spot-item', style: { '--size': ( attributes.style === 'bokeh-dots' ? item.size * 1.25 : item.size * 2.1 ) + 'vw', '--stroke': Math.max( 1, Math.round( item.size * .055 ) ) + 'px', '--color': item.color, '--alpha': item.alpha * opacity, '--alpha-quiet': item.alpha * opacity * .8, '--radius': spotShape, '--rotation': item.rotation + 'deg', '--delay': item.delay, '--drift-x': item.driftX, '--drift-y': item.driftY, left: item.x + '%', top: item.y + '%' } } ); } ) ); }
		if ( attributes.style === 'rings' ) { const dotMode = ( attributes.ringAppearance || 'dots' ) === 'dots'; const count = dotMode ? Math.round( 4 + clamp( attributes.density, 10, 100, 34 ) * .3 ) : clamp( attributes.ringCount, 3, 12, 5 ); return el( 'div', { className: 'cni-bg2__rings', style: common }, items.slice( 0, count ).map( function( item, index ) { return el( 'span', { key: index, className: 'cni-bg2__ring-item' + ( dotMode ? ' cni-bg2__ring-item--dot' : '' ), style: { '--size': ( dotMode ? Math.max( 6, item.size * .92 ) : Math.max( 12, item.size * 1.65 ) ) + 'px', '--stroke': Math.max( 1, Math.round( item.size * .07 ) ) + 'px', '--color': item.color, '--alpha': item.alpha * opacity, '--alpha-quiet': item.alpha * opacity * .78, '--delay': item.delay, '--drift-x': item.driftX, '--drift-y': item.driftY, left: item.x + '%', top: item.y + '%' } } ); } ) ); }
		if ( [ 'halftone', 'grid', 'tile-geometry', 'dots' ].indexOf( attributes.style ) !== -1 ) return patternedCanvas( attributes, colors, scale, opacity );
		const svg = svgCanvas( attributes, colors, scale, opacity );
		return el( 'div', { className: 'cni-bg2__pattern cni-bg2__pattern--' + attributes.style, style: { backgroundImage: svg.image, backgroundSize: svg.size, backgroundRepeat: svg.repeat, opacity: svg.opacity } } );
	}
	function imageStyle( image ) { const imageOpacity = clamp( image.opacity, 0, 100, 100 ) / 100; const style = { '--x': imageValue( image, 'x', 'pc', 50 ) + '%', '--y': imageValue( image, 'y', 'pc', 50 ) + '%', '--width': imageValue( image, 'width', 'pc', 30 ) + '%', '--rotation': clamp( image.rotation, -180, 180, 0 ) + 'deg', '--opacity': imageOpacity, '--pulse-opacity': imageOpacity * .68, '--flip-x': image.flipX ? -1 : 1 }; [ 'tablet', 'mobile' ].forEach( function( device ) { [ 'x', 'y', 'width' ].forEach( function( key ) { const value = image[ device + key.charAt( 0 ).toUpperCase() + key.slice( 1 ) ]; if ( typeof value === 'number' ) style[ '--' + device + '-' + key ] = value + '%'; } ); } ); return style; }
	function freeImageElements( attributes, editor, handlers ) {
		if ( ! attributes.freeImagesEnabled ) return null;
		const all = images( attributes );
		return [ 'back', 'front' ].map( function( layer ) {
			const layerImages = all.filter( function( image ) { return ( image.layer || 'front' ) === layer; } );
			if ( ! layerImages.length ) return null;
			return el( 'div', { key: layer, className: 'cni-bg2__free-images cni-bg2__free-images--' + layer }, layerImages.map( function( image ) {
				const selected = editor && handlers && handlers.selectedId === image.id;
				return el( 'div', Object.assign( {
					key: image.id,
					className: 'cni-bg2__free-image' + ( selected ? ' is-selected' : '' ),
					style: imageStyle( image ),
					draggable: false,
					'data-cni-bg2-pc-visible': imageVisible( image, 'pc' ) ? 'true' : 'false',
					'data-cni-bg2-tablet-visible': imageVisible( image, 'tablet' ) ? 'true' : 'false',
					'data-cni-bg2-mobile-visible': imageVisible( image, 'mobile' ) ? 'true' : 'false',
					'data-cni-bg2-image-motion': image.imageMotion || 'none',
					onDragStart: editor ? function( event ) { event.preventDefault(); } : undefined,
					onPointerDown: editor ? function( event ) { handlers.startDrag( event, image ); } : undefined,
					onPointerMove: editor ? function( event ) { handlers.moveDrag( event, image ); } : undefined,
					onPointerUp: editor ? handlers.endDrag : undefined,
					onPointerCancel: editor ? handlers.endDrag : undefined,
					onClick: editor ? function( event ) { event.stopPropagation(); handlers.select( image.id ); } : undefined
				}, image.responsiveVersion === 2 ? { 'data-cni-bg2-responsive-image': 'true' } : {} ), el( 'span', { className: 'cni-bg2__free-image-visual' }, el( 'img', { src: image.imageUrl, alt: image.imageAlt || '', draggable: false } ) ) );
			} ) );
		} );
	}
	function rootStyle( attributes, preview ) { const alpha = clamp( attributes.opacity, 5, 100, 55 ) / 100; const has = function( key ) { return typeof attributes[ key ] === 'number' && Number.isFinite( attributes[ key ] ); }; const pcY = has( 'paddingVerticalPc' ) ? clamp( attributes.paddingVerticalPc, 0, 240, 88 ) : clamp( attributes.paddingY, 0, 240, 88 ); const pcX = has( 'paddingHorizontalPc' ) ? clamp( attributes.paddingHorizontalPc, 0, 160, 32 ) : clamp( attributes.paddingX, 0, 160, 32 ); const tabletY = has( 'paddingVerticalTablet' ) ? clamp( attributes.paddingVerticalTablet, 0, 240, 56 ) : Math.min( pcY, 56 ); const tabletX = has( 'paddingHorizontalTablet' ) ? clamp( attributes.paddingHorizontalTablet, 0, 160, 24 ) : Math.min( pcX, 24 ); const mobileY = has( 'paddingVerticalMobile' ) ? clamp( attributes.paddingVerticalMobile, 0, 240, 56 ) : Math.min( pcY, 56 ); const mobileX = has( 'paddingHorizontalMobile' ) ? clamp( attributes.paddingHorizontalMobile, 0, 160, 24 ) : Math.min( pcX, 24 ); return Object.assign( { '--cni-bg2-base': attributes.baseColor || '#f8fafc', '--cni-bg2-opacity': alpha, '--cni-bg2-opacity-quiet': alpha * .58, '--cni-bg2-soft-blur': Math.round( clamp( attributes.blur, 0, 100, 28 ) * .55 ) + 'px', '--cni-bg2-padding-y': pcY + 'px', '--cni-bg2-padding-x': pcX + 'px', '--cni-bg2-padding-y-tablet': tabletY + 'px', '--cni-bg2-padding-x-tablet': tabletX + 'px', '--cni-bg2-padding-y-mobile': mobileY + 'px', '--cni-bg2-padding-x-mobile': mobileX + 'px', '--cni-bg2-content-width': clamp( attributes.contentWidth, 480, 1920, 1200 ) + 'px', '--cni-bg2-min-height': clamp( attributes.minHeight, 0, 1200, 0 ) + 'px', '--cni-bg2-radius': clamp( attributes.borderRadius, 0, 80, 0 ) + 'px' }, motionValues( attributes, preview ) ); }
	function BackgroundMarkup( props ) { const attributes = props.attributes; const blockProps = Object.assign( {}, props.blockProps, { className: ( props.blockProps.className || '' ) + ( attributes.fixedBackground ? ' cni-bg2--fixed-background' : '' ) } ); return el( 'section', blockProps, el( 'div', { className: 'cni-bg2__canvas', 'aria-hidden': 'true', style: [ 'pixel-wave', 'waves', 'particle-wave', 'layered-panels' ].indexOf( attributes.style ) !== -1 || attributes.polygonShape === 'faceted' ? {} : compositionStyle( attributes ) }, canvas( attributes ), textureCanvas( attributes ) ), freeImageElements( attributes, props.editor, props.handlers ), el( 'div', { className: 'cni-bg2__inner' }, props.children ) ); }
	function register() {
		blocks.registerBlockType( 'cni-blocks/background-design-plus', {
			edit: function( props ) {
				const attributes = props.attributes; const setAttributes = props.setAttributes; const previewState = useState( false ); const preview = previewState[ 0 ]; const setPreview = previewState[ 1 ]; const selectedState = useState( '' ); const selectedId = selectedState[ 0 ]; const setSelectedId = selectedState[ 1 ]; const imageDeviceState = useState( 'pc' ); const imageDevice = imageDeviceState[ 0 ]; const setImageDevice = imageDeviceState[ 1 ]; const freeImageDragRef = element.useRef( null ); const previousStyle = element.useRef( attributes.style ); const selected = images( attributes ).find( function( image ) { return image.id === selectedId; } ) || images( attributes )[ 0 ] || null;
				useEffect( function() { if ( previousStyle.current === attributes.style ) return; previousStyle.current = attributes.style; setAttributes( styleDefaults( attributes.style, attributes ) ); }, [ attributes.style ] );
				useEffect( function() { if ( attributes.paletteMode === 'manual' || ( ! attributes.paletteMode && ! isFactoryPalette( attributes ) ) || ( attributes.paletteMode === 'theme' && attributes.paletteThemeColor === SITE_THEME_COLOR ) ) return; setAttributes( paletteChanges( SITE_THEME_COLOR ) ); }, [ attributes.paletteMode, attributes.paletteThemeColor, attributes.baseColor, attributes.color1, attributes.color2, attributes.color3, attributes.color4, attributes.color5 ] );
				useEffect( function() { if ( ! preview ) return undefined; const timer = window.setTimeout( function() { setPreview( false ); }, 4000 ); return function() { window.clearTimeout( timer ); }; }, [ preview ] );
				const imageKey = function( key ) { return imageDevice === 'pc' ? key : imageDevice + key.charAt( 0 ).toUpperCase() + key.slice( 1 ); }; const updateImage = function( id, changes ) { setAttributes( { freeImages: images( attributes ).map( function( image ) { return image.id === id ? updatedFreeImage( image, changes ) : image; } ) } ); };
				const pointFromBlock = function( event ) { const block = event.currentTarget.closest( '.wp-block-cni-blocks-background-design-plus' ); const rect = block ? block.getBoundingClientRect() : null; if ( ! rect || ! rect.width || ! rect.height ) return { x: 50, y: 50 }; return { x: clamp( ( event.clientX - rect.left ) / rect.width * 100, -30, 130, 50 ), y: clamp( ( event.clientY - rect.top ) / rect.height * 100, -30, 130, 50 ) }; };
				const startDrag = function( event, image ) { if ( event.button !== 0 ) return; event.preventDefault(); event.stopPropagation(); const point = pointFromBlock( event ); freeImageDragRef.current = { id: image.id, offsetX: imageValue( image, 'x', imageDevice, 50 ) - point.x, offsetY: imageValue( image, 'y', imageDevice, 50 ) - point.y }; setSelectedId( image.id ); if ( event.currentTarget.setPointerCapture ) event.currentTarget.setPointerCapture( event.pointerId ); };
				const moveDrag = function( event, image ) { const drag = freeImageDragRef.current; if ( ! drag || drag.id !== image.id ) return; event.preventDefault(); const point = pointFromBlock( event ); const changes = {}; changes[ imageKey( 'x' ) ] = clamp( point.x + drag.offsetX, -30, 130, 50 ); changes[ imageKey( 'y' ) ] = clamp( point.y + drag.offsetY, -30, 130, 50 ); updateImage( image.id, changes ); };
				const endDrag = function( event ) { freeImageDragRef.current = null; if ( event.currentTarget.releasePointerCapture && event.currentTarget.hasPointerCapture && event.currentTarget.hasPointerCapture( event.pointerId ) ) event.currentTarget.releasePointerCapture( event.pointerId ); };
				const handlers = { selectedId: selected ? selected.id : '', select: setSelectedId, startDrag: startDrag, moveDrag: moveDrag, endDrag: endDrag };
				const blockProps = useBlockProps( { className: 'cni-background-design-plus', style: rootStyle( attributes, preview ), 'data-cni-bg2-style': attributes.style, 'data-cni-bg2-motion': attributes.motion, 'data-cni-bg2-mobile-motion': attributes.motionMobile ? 'true' : 'false', 'data-cni-bg2-align': attributes.contentAlign, 'data-cni-bg2-direction': attributes.lineDirection, 'data-cni-bg2-image-editor-device': attributes.freeImagesEnabled ? imageDevice : undefined } );
				const colorControl = function( key, label ) { return el( 'div', { className: 'cni-bg2-color-control', key: key }, el( 'p', null, label ), el( ColorPalette, { value: attributes[ key ], onChange: function( color ) { const next = { paletteMode: 'manual' }; next[ key ] = color || '#ffffff'; setAttributes( next ); } } ) ); }; const visibleColors = colorSettings( attributes );
				return el( element.Fragment, null,
					el( InspectorControls, null,
						el( PanelBody, { title: __( '背景スタイル', 'cni-blocks' ), initialOpen: true }, el( SelectControl, { label: __( 'スタイル', 'cni-blocks' ), value: attributes.style, options: STYLE_OPTIONS, onChange: function( value ) { setAttributes( { style: value } ); } } ), tileControls( attributes, setAttributes ), el( SelectControl, { label: __( 'サイズ', 'cni-blocks' ), value: attributes.scale, options: [ { label: __( '小', 'cni-blocks' ), value: 'small' }, { label: __( '標準', 'cni-blocks' ), value: 'normal' }, { label: __( '大', 'cni-blocks' ), value: 'large' }, { label: __( '特大', 'cni-blocks' ), value: 'xlarge' } ], onChange: function( value ) { setAttributes( { scale: value } ); } } ), el( RangeControl, { label: __( '密度', 'cni-blocks' ), value: attributes.density, min: 10, max: 100, onChange: function( value ) { setAttributes( { density: value } ); } } ), el( RangeControl, { label: __( 'ばらつき', 'cni-blocks' ), value: attributes.variation, min: 0, max: 100, onChange: function( value ) { setAttributes( { variation: value } ); } } ), el( RangeControl, { label: __( '濃さ', 'cni-blocks' ), value: attributes.opacity, min: 5, max: 100, onChange: function( value ) { setAttributes( { opacity: value } ); } } ), attributes.style === 'soft-mesh' || attributes.style === 'fluid-shapes' ? el( RangeControl, { label: __( 'にじみ', 'cni-blocks' ), value: attributes.blur, min: 0, max: 100, onChange: function( value ) { setAttributes( { blur: value } ); } } ) : null, attributes.style === 'soft-mesh' ? el( RangeControl, { label: __( '流れの広がり', 'cni-blocks' ), value: attributes.flow, min: 0, max: 100, onChange: function( value ) { setAttributes( { flow: value } ); } } ) : null, attributes.style === 'soft-polygons' ? el( SelectControl, { label: __( '図形', 'cni-blocks' ), value: attributes.polygonShape, options: [ { label: __( '混在', 'cni-blocks' ), value: 'mixed' }, { label: __( '連続ポリゴン（ローポリ）', 'cni-blocks' ), value: 'faceted' } ].concat( Object.keys( SHAPES ).map( function( shape ) { return { label: shape, value: shape }; } ) ), onChange: function( value ) { setAttributes( { polygonShape: value } ); } } ) : null, attributes.style === 'confetti' ? el( SelectControl, { label: __( '形状', 'cni-blocks' ), value: attributes.confettiShape, options: [ { label: __( '混在', 'cni-blocks' ), value: 'mixed' }, { label: __( '短冊', 'cni-blocks' ), value: 'pill' }, { label: __( '四角', 'cni-blocks' ), value: 'square' }, { label: __( '丸', 'cni-blocks' ), value: 'circle' } ], onChange: function( value ) { setAttributes( { confettiShape: value } ); } } ) : null, el( Button, { variant: 'secondary', onClick: function() { setAttributes( { seed: Math.floor( Math.random() * 2147483000 ) + 1 } ); } }, __( '配置を再生成', 'cni-blocks' ) ) ),
						el( PanelBody, { title: __( 'スタイル別プリセット', 'cni-blocks' ), initialOpen: false },
							el( SelectControl, { label: __( 'おすすめプリセット', 'cni-blocks' ), value: attributes.stylePreset || 'classic', options: presetsFor( attributes.style ).map( function( item ) { return { label: __( item[ 1 ], 'cni-blocks' ), value: item[ 0 ] }; } ), onChange: function( value ) { setAttributes( presetChanges( attributes.style, value, attributes ) ); } } ),
							el( 'p', { className: 'description' }, __( '配色・構図・質感・配置・背景モーションをおすすめの状態へ切り替えます。サイト共通色には依存しません。本文・レイアウト・自由配置画像は保持します。', 'cni-blocks' ) ),
							el( Button, { variant: 'secondary', onClick: function() { setAttributes( presetChanges( attributes.style, attributes.stylePreset || 'classic' ) ); } }, __( 'このプリセットを適用', 'cni-blocks' ) )
						),
						compositionControls( attributes, setAttributes ),
						el( PanelBody, { title: __( 'カラー', 'cni-blocks' ), initialOpen: false }, el( 'p', { className: 'description' }, attributes.paletteMode === 'theme' ? __( 'サイト共通の基調色をもとにした配色です。個別に色を変更すると、このブロックだけの配色になります。', 'cni-blocks' ) : __( '個別配色です。サイト共通の基調色を適用すると、淡いベースと関連色へまとめて戻せます。', 'cni-blocks' ) ), el( Button, { variant: 'secondary', onClick: function() { setAttributes( paletteChanges( SITE_THEME_COLOR ) ); } }, __( 'サイト共通配色を適用', 'cni-blocks' ) ), colorControl( 'baseColor', __( 'ベースカラー', 'cni-blocks' ) ), visibleColors.max === 0 ? el( 'p', { className: 'description' }, __( 'ノイズはベースカラーに重ねる質感です。アクセントカラーは使用しません。', 'cni-blocks' ) ) : null, visibleColors.max > visibleColors.min ? el( RangeControl, { label: __( '使用色数', 'cni-blocks' ), value: visibleColors.count, min: visibleColors.min, max: visibleColors.max, onChange: function( value ) { setAttributes( { colorCount: value } ); } } ) : null, [ 'color1', 'color2', 'color3', 'color4', 'color5' ].slice( 0, visibleColors.count ).map( function( key, index ) { return colorControl( key, __( 'アクセントカラー ', 'cni-blocks' ) + ( index + 1 ) ); } ) ),
						el( PanelBody, { title: __( '背景モーション', 'cni-blocks' ), initialOpen: false }, el( SelectControl, { label: __( '動き', 'cni-blocks' ), value: attributes.motion, options: [ { label: __( 'なし', 'cni-blocks' ), value: 'none' }, { label: __( 'ゆらぎ', 'cni-blocks' ), value: 'gentle' }, { label: __( '流れ', 'cni-blocks' ), value: 'flow' } ], onChange: function( value ) { setAttributes( { motion: value } ); } } ), attributes.motion !== 'none' ? el( element.Fragment, null, el( SelectControl, { label: __( '速度', 'cni-blocks' ), value: attributes.motionSpeed, options: [ { label: __( '標準（約18秒）', 'cni-blocks' ), value: 'standard' }, { label: __( 'ゆっくり（約30秒）', 'cni-blocks' ), value: 'slow' }, { label: __( 'とてもゆっくり（約44秒）', 'cni-blocks' ), value: 'verySlow' } ], onChange: function( value ) { setAttributes( { motionSpeed: value } ); } } ), el( SelectControl, { label: __( '強さ', 'cni-blocks' ), value: attributes.motionStrength, options: [ { label: __( '控えめ', 'cni-blocks' ), value: 'subtle' }, { label: __( '標準', 'cni-blocks' ), value: 'standard' }, { label: __( 'ダイナミック', 'cni-blocks' ), value: 'dynamic' } ], onChange: function( value ) { setAttributes( { motionStrength: value } ); } } ), el( ToggleControl, { label: __( 'モバイルでも動かす', 'cni-blocks' ), checked: attributes.motionMobile, onChange: function( value ) { setAttributes( { motionMobile: !! value } ); } } ), el( Button, { variant: 'secondary', onClick: function() { setPreview( true ); } }, preview ? __( 'プレビュー再生中…', 'cni-blocks' ) : __( 'モーションをプレビュー（4秒）', 'cni-blocks' ) ) ) : null ),
						el( PanelBody, { title: __( 'レイアウト', 'cni-blocks' ), initialOpen: false }, el( RangeControl, { label: __( '最小の高さ', 'cni-blocks' ), value: attributes.minHeight, min: 0, max: 1000, onChange: function( value ) { setAttributes( { minHeight: value } ); } } ), el( RangeControl, { label: __( '内容幅', 'cni-blocks' ), value: attributes.contentWidth, min: 480, max: 1920, onChange: function( value ) { setAttributes( { contentWidth: value } ); } } ), el( SelectControl, { label: __( '内容の揃え', 'cni-blocks' ), value: attributes.contentAlign, options: [ { label: __( '左', 'cni-blocks' ), value: 'left' }, { label: __( '中央', 'cni-blocks' ), value: 'center' }, { label: __( '右', 'cni-blocks' ), value: 'right' } ], onChange: function( value ) { setAttributes( { contentAlign: value } ); } } ), el( RangeControl, { label: __( '角丸', 'cni-blocks' ), value: attributes.borderRadius, min: 0, max: 80, onChange: function( value ) { setAttributes( { borderRadius: value } ); } } ) ),
						el( FreeImageControls, { attributes: attributes, selected: selected, device: imageDevice, setDevice: setImageDevice, select: setSelectedId, updateImage: updateImage, setAttributes: setAttributes } )
					),
					el( InspectorControls, null, el( PanelBody, { title: __( 'スタイル詳細', 'cni-blocks' ), initialOpen: false },
						el( Button, { variant: 'tertiary', onClick: function() { setAttributes( styleDefaults( attributes.style, attributes ) ); } }, __( 'このスタイルの定番値に戻す', 'cni-blocks' ) ),
						[ 'blur-spots', 'bokeh-dots', 'metaballs' ].indexOf( attributes.style ) !== -1 ? el( element.Fragment, null,
							el( RangeControl, { label: __( 'にじみ', 'cni-blocks' ), value: attributes.blur, min: 0, max: 100, onChange: function( value ) { setAttributes( { blur: value } ); } } ),
							attributes.style !== 'metaballs' ? el( SelectControl, { label: __( 'スポット形状', 'cni-blocks' ), value: attributes.spotShape, options: [ { label: __( '混在', 'cni-blocks' ), value: 'mixed' }, { label: __( '円', 'cni-blocks' ), value: 'circle' }, { label: __( '楕円', 'cni-blocks' ), value: 'ellipse' } ], onChange: function( value ) { setAttributes( { spotShape: value } ); } } ) : el( RangeControl, { label: __( '液体数', 'cni-blocks' ), value: attributes.metaCount, min: 3, max: 10, onChange: function( value ) { setAttributes( { metaCount: value } ); } } )
						) : null,
						attributes.style === 'flow-lines' ? el( SelectControl, { label: __( '流れる方向', 'cni-blocks' ), value: attributes.lineDirection, options: [ { label: __( '右', 'cni-blocks' ), value: 'right' }, { label: __( '左', 'cni-blocks' ), value: 'left' }, { label: __( '縦', 'cni-blocks' ), value: 'down' } ], onChange: function( value ) { setAttributes( { lineDirection: value } ); } } ) : null,
						attributes.style === 'waves' ? el( RangeControl, { label: __( '波のレイヤー数', 'cni-blocks' ), value: attributes.waveLayers, min: 1, max: 5, onChange: function( value ) { setAttributes( { waveLayers: value } ); } } ) : null,
						attributes.style === 'grid' ? el( SelectControl, { label: __( 'グリッド形式', 'cni-blocks' ), value: attributes.gridMode, options: [ { label: __( '縦横', 'cni-blocks' ), value: 'cross' }, { label: __( '縦線', 'cni-blocks' ), value: 'vertical' }, { label: __( '斜線', 'cni-blocks' ), value: 'diagonal' } ], onChange: function( value ) { setAttributes( { gridMode: value } ); } } ) : null,
						attributes.style === 'rings' ? el( element.Fragment, null, el( SelectControl, { label: __( '表示形式', 'cni-blocks' ), value: attributes.ringAppearance || 'dots', options: [ { label: __( 'ランダムドット', 'cni-blocks' ), value: 'dots' }, { label: __( '輪郭リング', 'cni-blocks' ), value: 'outline' } ], onChange: function( value ) { setAttributes( { ringAppearance: value } ); } } ), ( attributes.ringAppearance || 'dots' ) === 'outline' ? el( RangeControl, { label: __( 'リング数', 'cni-blocks' ), value: attributes.ringCount, min: 3, max: 12, onChange: function( value ) { setAttributes( { ringCount: value } ); } } ) : el( 'p', { className: 'description' }, __( '密度・ばらつき・サイズで、ドットの量とランダムさを調整できます。', 'cni-blocks' ) ) ) : null,
						attributes.style === 'noise' ? el( RangeControl, { label: __( 'テクスチャの濃さ', 'cni-blocks' ), value: attributes.textureAmount, min: 0, max: 80, onChange: function( value ) { setAttributes( { textureAmount: value } ); } } ) : null,
						attributes.style === 'halftone' ? el( SelectControl, { label: __( '濃淡の方向', 'cni-blocks' ), value: attributes.halftoneMode || 'diagonal', options: [ { label: __( '斜め', 'cni-blocks' ), value: 'diagonal' }, { label: __( '縦', 'cni-blocks' ), value: 'vertical' }, { label: __( '中央から外側', 'cni-blocks' ), value: 'radial' }, { label: __( '波状', 'cni-blocks' ), value: 'wave' } ], onChange: function( value ) { setAttributes( { halftoneMode: value } ); } } ) : null
					) ),
					el( InspectorControls, null,
						el( PanelBody, { title: __( '内側余白', 'cni-blocks' ), initialOpen: false },
							el( RangeControl, { label: __( 'PC 上下余白（px）', 'cni-blocks' ), value: typeof attributes.paddingVerticalPc === 'number' ? attributes.paddingVerticalPc : attributes.paddingY, min: 0, max: 240, onChange: function( value ) { setAttributes( { paddingVerticalPc: value || 0 } ); } } ),
							el( RangeControl, { label: __( 'PC 左右余白（px）', 'cni-blocks' ), value: typeof attributes.paddingHorizontalPc === 'number' ? attributes.paddingHorizontalPc : attributes.paddingX, min: 0, max: 160, onChange: function( value ) { setAttributes( { paddingHorizontalPc: value || 0 } ); } } ),
							el( RangeControl, { label: __( 'タブレット 上下余白（px）', 'cni-blocks' ), value: typeof attributes.paddingVerticalTablet === 'number' ? attributes.paddingVerticalTablet : Math.min( typeof attributes.paddingVerticalPc === 'number' ? attributes.paddingVerticalPc : attributes.paddingY, 56 ), min: 0, max: 240, onChange: function( value ) { setAttributes( { paddingVerticalTablet: value || 0 } ); } } ),
							el( RangeControl, { label: __( 'タブレット 左右余白（px）', 'cni-blocks' ), value: typeof attributes.paddingHorizontalTablet === 'number' ? attributes.paddingHorizontalTablet : Math.min( typeof attributes.paddingHorizontalPc === 'number' ? attributes.paddingHorizontalPc : attributes.paddingX, 24 ), min: 0, max: 160, onChange: function( value ) { setAttributes( { paddingHorizontalTablet: value || 0 } ); } } ),
							el( RangeControl, { label: __( 'モバイル 上下余白（px）', 'cni-blocks' ), value: typeof attributes.paddingVerticalMobile === 'number' ? attributes.paddingVerticalMobile : Math.min( typeof attributes.paddingVerticalPc === 'number' ? attributes.paddingVerticalPc : attributes.paddingY, 56 ), min: 0, max: 240, onChange: function( value ) { setAttributes( { paddingVerticalMobile: value || 0 } ); } } ),
							el( RangeControl, { label: __( 'モバイル 左右余白（px）', 'cni-blocks' ), value: typeof attributes.paddingHorizontalMobile === 'number' ? attributes.paddingHorizontalMobile : Math.min( typeof attributes.paddingHorizontalPc === 'number' ? attributes.paddingHorizontalPc : attributes.paddingX, 24 ), min: 0, max: 160, onChange: function( value ) { setAttributes( { paddingHorizontalMobile: value || 0 } ); } } )
						),
						el( PanelBody, { title: __( '背景の固定', 'cni-blocks' ), initialOpen: false },
							el( ToggleControl, { label: __( 'セクション内で背景を固定', 'cni-blocks' ), checked: !! attributes.fixedBackground, help: __( 'スクロール中、図形をその場に留めて見せます。モバイルでは通常表示に切り替わります。', 'cni-blocks' ), onChange: function( value ) { setAttributes( { fixedBackground: !! value } ); } } )
						)
					),
					el( BackgroundMarkup, { attributes: attributes, blockProps: blockProps, editor: true, handlers: handlers }, el( InnerBlocks, { renderAppender: InnerBlocks.ButtonBlockAppender } ) )
				);
			},
			save: function( props ) { const attributes = props.attributes; const blockProps = blockEditor.useBlockProps.save( { className: 'cni-background-design-plus', style: rootStyle( attributes, false ), 'data-cni-bg2-style': attributes.style, 'data-cni-bg2-motion': attributes.motion, 'data-cni-bg2-mobile-motion': attributes.motionMobile ? 'true' : 'false', 'data-cni-bg2-align': attributes.contentAlign, 'data-cni-bg2-direction': attributes.lineDirection } ); return el( BackgroundMarkup, { attributes: attributes, blockProps: blockProps, editor: false }, el( InnerBlocks.Content ) ); }
		} );
	}
	register();
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor, window.wp.components, window.wp.i18n );

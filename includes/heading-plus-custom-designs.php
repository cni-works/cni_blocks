<?php
/**
 * Site-wide custom Heading+ designs.
 *
 * CSS designs deliberately use a small `&` template language. The ampersand
 * is replaced with a generated, per-design selector, so a design cannot leak
 * into the theme or another block.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION = 'cni_blocks_heading_custom_designs';
const CNI_BLOCKS_HEADING_PRESETS_OPTION = 'cni_blocks_heading_presets';

function cni_blocks_heading_custom_design_id( $value ) {
	$id = sanitize_key( (string) $value );
	return '' !== $id ? $id : '';
}

/**
 * Keep only simple, scoped CSS rules. `&` is the only allowed selector root.
 * Nested at-rules are intentionally outside the first release's contract.
 */
function cni_blocks_heading_custom_design_css( $css, $id ) {
	$css = trim( wp_strip_all_tags( (string) $css ) );
	$id  = cni_blocks_heading_custom_design_id( $id );

	if ( '' === $css || '' === $id || strlen( $css ) > 8000 || false !== strpos( $css, '@' ) || false !== stripos( $css, 'expression(' ) || false !== stripos( $css, 'javascript:' ) || false !== stripos( $css, 'behavior:' ) ) {
		return '';
	}

	$rules = array();
	$matched = preg_match_all( '/([^{}]+)\{([^{}]*)\}/', $css, $matches, PREG_SET_ORDER );
	if ( ! $matched ) {
		return '';
	}

	$without_rules = preg_replace( '/([^{}]+)\{([^{}]*)\}/', '', $css );
	if ( '' !== trim( $without_rules ) ) {
		return '';
	}

	$scope = '.cni-heading-custom--' . $id . ' .cni-heading-plus__custom-layer';
	foreach ( $matches as $match ) {
		$selectors = array_filter( array_map( 'trim', explode( ',', $match[1] ) ) );
		if ( empty( $selectors ) ) {
			return '';
		}
		foreach ( $selectors as $selector ) {
			if ( 0 !== strpos( $selector, '&' ) || ! preg_match( '/^&[a-zA-Z0-9_\-\s:\.>+~\[\]\(\)="\'\\\\#%]*$/', $selector ) ) {
				return '';
			}
		}
		$compiled_selectors = array_map(
			static function( $selector ) use ( $scope ) {
				return str_replace( '&', $scope, $selector );
			},
			$selectors
		);
		$rules[] = implode( ',', $compiled_selectors ) . '{' . trim( $match[2] ) . '}';
	}

	return implode( "\n", $rules );
}

function cni_blocks_heading_custom_design_declarations( $value ) {
	$value = trim( wp_strip_all_tags( (string) $value ) );
	if ( strlen( $value ) > 3000 || false !== strpos( $value, '{' ) || false !== strpos( $value, '}' ) || false !== strpos( $value, '@' ) || false !== stripos( $value, 'javascript:' ) || false !== stripos( $value, 'expression(' ) ) {
		return '';
	}
	return $value;
}

function cni_blocks_heading_custom_design_basic_css( $design ) {
	$scope = '.cni-heading-custom--' . $design['id'] . ' .cni-heading-plus__custom-layer';
	$rules = array();
	$base  = cni_blocks_heading_custom_design_declarations( $design['base_css'] ?? '' );
	$before = cni_blocks_heading_custom_design_declarations( $design['before_css'] ?? '' );
	$after  = cni_blocks_heading_custom_design_declarations( $design['after_css'] ?? '' );
	if ( ( '' !== $before || '' !== $after ) && false === stripos( $base, 'position:' ) ) {
		$base = 'position:relative;display:inline-block;' . $base;
	}
	if ( '' !== $base ) $rules[] = $scope . '{' . $base . '}';
	if ( '' !== $before ) $rules[] = $scope . '::before{' . $before . '}';
	if ( '' !== $after ) $rules[] = $scope . '::after{' . $after . '}';
	return implode( "\n", $rules );
}

function cni_blocks_heading_sanitize_custom_designs( $value ) {
	$clean = array();
	foreach ( is_array( $value ) ? $value : array() as $key => $design ) {
		if ( ! is_array( $design ) ) {
			continue;
		}
		if ( ! empty( $design['delete'] ) ) {
			continue;
		}
		$name = sanitize_text_field( $design['name'] ?? '' );
		$css  = trim( (string) ( $design['css'] ?? '' ) );
		$id   = cni_blocks_heading_custom_design_id( $design['id'] ?? '' );
		if ( '' === $id ) {
			$id = 'custom-' . substr( md5( $name . '|' . $css . '|' . $key ), 0, 10 );
		}
		$base_css   = cni_blocks_heading_custom_design_declarations( $design['base_css'] ?? '' );
		$before_css = cni_blocks_heading_custom_design_declarations( $design['before_css'] ?? '' );
		$after_css  = cni_blocks_heading_custom_design_declarations( $design['after_css'] ?? '' );
		if ( '' === $name || ( '' === $base_css && '' === $before_css && '' === $after_css && '' === cni_blocks_heading_custom_design_css( $css, $id ) ) ) {
			continue;
		}
		$clean[] = array(
			'id'       => $id,
			'name'     => $name,
			'css'      => $css,
			'base_css' => $base_css,
			'before_css' => $before_css,
			'after_css' => $after_css,
		);
	}
	return array_slice( $clean, 0, 30 );
}

function cni_blocks_heading_custom_designs() {
	$designs = get_option( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION, array() );
	return cni_blocks_heading_sanitize_custom_designs( $designs );
}

function cni_blocks_heading_preset_attribute_keys() {
	return array(
		'level', 'tagName', 'marginTop', 'marginBottom', 'legacyLayout', 'layoutVersion', 'inlineImageId', 'inlineImageUrl', 'inlineImageAlt', 'inlineImagePosition', 'inlineImageSize', 'writingMode', 'mobileWritingMode', 'verticalOrientation', 'verticalPosition', 'verticalHeight', 'fontFamily', 'fontWeight', 'fontStyle', 'textTransform', 'fontSizePc', 'fontSizeTablet', 'fontSizeMobile', 'fontSizeUnitPc', 'fontSizeUnitTablet', 'fontSizeUnitMobile', 'lineHeight', 'letterSpacing', 'textColor', 'backgroundColor', 'alignment', 'paddingVertical', 'paddingHorizontal', 'textDesign', 'textDesignPrimaryColor', 'textDesignHighlightColor', 'textDesignAccentColor', 'headingDesign', 'textDecoration', 'headingDesignPrimaryColor', 'headingDesignAccentColor', 'textDecorationPrimaryColor', 'textDecorationHighlightColor', 'textDecorationAccentColor', 'headingEyebrow', 'headingNumber', 'headingBackdropText', 'secondaryFontFamily', 'secondaryFontWeight', 'secondaryColor', 'secondarySizePc', 'secondarySizeMobile', 'secondaryLetterSpacing', 'secondaryLineHeight', 'secondaryGapPc', 'secondaryGapMobile', 'secondaryAlignment', 'numberVerticalAlignment', 'backgroundTextOpacity', 'backgroundTextX', 'backgroundTextY', 'backgroundTextXMobile', 'backgroundTextYMobile', 'headingDesignLineThickness'
	);
}

function cni_blocks_heading_sanitize_presets( $value ) {
	$presets = array();
	$keys    = array_flip( cni_blocks_heading_preset_attribute_keys() );
	foreach ( is_array( $value ) ? $value : array() as $key => $preset ) {
		if ( ! is_array( $preset ) ) {
			continue;
		}
		$name = sanitize_text_field( $preset['name'] ?? '' );
		$id   = cni_blocks_heading_custom_design_id( $preset['id'] ?? '' );
		if ( '' === $id ) {
			$id = 'preset-' . substr( md5( $name . '|' . $key ), 0, 10 );
		}
		if ( '' === $name ) {
			continue;
		}
		$attributes = array();
		foreach ( (array) ( $preset['attributes'] ?? array() ) as $attribute_key => $attribute_value ) {
			if ( isset( $keys[ $attribute_key ] ) && ( is_scalar( $attribute_value ) || null === $attribute_value ) ) {
				$attributes[ $attribute_key ] = $attribute_value;
			}
		}
		$presets[] = array(
			'id'         => $id,
			'name'       => $name,
			'category'   => sanitize_text_field( $preset['category'] ?? '' ),
			'attributes' => $attributes,
		);
	}
	return array_slice( $presets, 0, 30 );
}

function cni_blocks_heading_presets() {
	return cni_blocks_heading_sanitize_presets( get_option( CNI_BLOCKS_HEADING_PRESETS_OPTION, array() ) );
}

function cni_blocks_heading_custom_design_inline_css() {
	$css = array();
	foreach ( cni_blocks_heading_custom_designs() as $design ) {
		$compiled = array_filter( array( cni_blocks_heading_custom_design_basic_css( $design ), cni_blocks_heading_custom_design_css( $design['css'], $design['id'] ) ) );
		$css = array_merge( $css, $compiled );
	}
	return implode( "\n", $css );
}

function cni_blocks_heading_enqueue_custom_design_css() {
	$css = cni_blocks_heading_custom_design_inline_css();
	if ( '' !== $css ) {
		wp_enqueue_style( 'cni-blocks-heading-plus-style' );
		wp_add_inline_style( 'cni-blocks-heading-plus-style', $css );
	}
}
add_action( 'enqueue_block_assets', 'cni_blocks_heading_enqueue_custom_design_css', 20 );

function cni_blocks_heading_register_custom_design_settings() {
	register_setting(
		'cni_blocks_heading_custom_designs',
		CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION,
		array( 'type' => 'array', 'sanitize_callback' => 'cni_blocks_heading_sanitize_custom_designs', 'default' => array() )
	);
}
add_action( 'admin_init', 'cni_blocks_heading_register_custom_design_settings' );

function cni_blocks_heading_custom_design_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$designs = cni_blocks_heading_custom_designs();
	$designs[] = array( 'id' => '', 'name' => '', 'category' => '', 'css' => '', 'base_css' => '', 'before_css' => '', 'after_css' => '' );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'CNI Blocks｜見出し+ オリジナルデザイン', 'cni-blocks' ); ?></h1>
		<p><?php esc_html_e( 'ここで登録したデザインだけが、見出し+の「オリジナル」ライブラリに表示されます。通常のフォント・色・サイズは、デザイン選択後に見出し+の編集画面で調整します。ここには線・背景・影など、デザイン固有のCSSだけを登録してください。', 'cni-blocks' ); ?></p>
		<style>
			.cni-heading-custom-preview { display:flex; align-items:center; min-height:110px; margin:16px 0; padding:22px; overflow:hidden; background:#f6f7f7; border:1px solid #dcdcde; }
			.cni-heading-custom-preview .cni-heading-plus__custom-layer { position:relative; display:inline-block; font-size:32px; font-weight:700; line-height:1.35; color:#172033; }
			.cni-heading-custom-preview__label { display:block; margin-bottom:6px; color:#50575e; font-size:12px; }
			.cni-heading-custom-delete-note { margin:4px 0 14px 24px; color:#8a2424; }
		</style>
		<form method="post" action="options.php">
			<?php settings_fields( 'cni_blocks_heading_custom_designs' ); ?>
			<?php foreach ( $designs as $index => $design ) : ?>
				<details style="margin:16px 0;padding:12px;background:#fff;border:1px solid #ccd0d4" <?php echo $index === count( $designs ) - 1 ? 'open' : ''; ?>>
					<summary><strong><?php echo esc_html( $design['name'] ?: __( '新しいオリジナルデザイン', 'cni-blocks' ) ); ?></strong></summary>
					<input type="hidden" name="<?php echo esc_attr( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>[<?php echo esc_attr( $index ); ?>][id]" value="<?php echo esc_attr( $design['id'] ); ?>" />
					<span class="cni-heading-custom-preview__label"><?php esc_html_e( 'ライブラリ表示プレビュー', 'cni-blocks' ); ?></span>
					<div class="cni-heading-custom-preview cni-heading-custom-preview-<?php echo esc_attr( $index ); ?>" data-preview-index="<?php echo esc_attr( $index ); ?>"><span class="cni-heading-plus__custom-layer"><?php esc_html_e( '見出しデザイン', 'cni-blocks' ); ?></span></div>
					<p><label><?php esc_html_e( 'デザイン名', 'cni-blocks' ); ?><br /><input class="regular-text" name="<?php echo esc_attr( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>[<?php echo esc_attr( $index ); ?>][name]" value="<?php echo esc_attr( $design['name'] ); ?>" /></label></p>
					<p><label><input type="checkbox" name="<?php echo esc_attr( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>[<?php echo esc_attr( $index ); ?>][delete]" value="1" /> <?php esc_html_e( '保存時にこのデザインを削除する', 'cni-blocks' ); ?></label></p>
					<p class="cni-heading-custom-delete-note"><?php esc_html_e( '削除する場合はチェックして、ページ下部の「オリジナルデザインを保存」を押します。', 'cni-blocks' ); ?></p>
					<p><label><?php esc_html_e( '装飾CSS（任意）', 'cni-blocks' ); ?><br /><textarea class="large-text code" rows="5" name="<?php echo esc_attr( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>[<?php echo esc_attr( $index ); ?>][base_css]" placeholder="display: inline-block;&#10;padding: .3em .7em;&#10;border-bottom: 3px solid #2998cf;"><?php echo esc_textarea( $design['base_css'] ?? '' ); ?></textarea></label><br /><span class="description"><?php esc_html_e( '線・背景・余白・影などを記入します。色やフォントをここに書いた場合は、そのCSSが見出し+の通常設定より優先されます。セレクタや波括弧は不要です。', 'cni-blocks' ); ?></span></p>
					<details><summary><?php esc_html_e( 'Before装飾を追加', 'cni-blocks' ); ?></summary><p><label><?php esc_html_e( 'Before CSS', 'cni-blocks' ); ?><br /><textarea class="large-text code" rows="5" name="<?php echo esc_attr( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>[<?php echo esc_attr( $index ); ?>][before_css]"><?php echo esc_textarea( $design['before_css'] ?? '' ); ?></textarea></label></p></details>
					<details><summary><?php esc_html_e( 'After装飾を追加', 'cni-blocks' ); ?></summary><p><label><?php esc_html_e( 'After CSS', 'cni-blocks' ); ?><br /><textarea class="large-text code" rows="5" name="<?php echo esc_attr( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>[<?php echo esc_attr( $index ); ?>][after_css]"><?php echo esc_textarea( $design['after_css'] ?? '' ); ?></textarea></label></p></details>
					<details><summary><?php esc_html_e( '高度なCSS（制作者向け）', 'cni-blocks' ); ?></summary><p><label><?php esc_html_e( '高度なCSS', 'cni-blocks' ); ?><br /><textarea class="large-text code" rows="8" name="<?php echo esc_attr( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>[<?php echo esc_attr( $index ); ?>][css]" placeholder="&amp; { ... }&#10;&amp;::after { ... }"><?php echo esc_textarea( $design['css'] ); ?></textarea></label></p></details>
				</details>
			<?php endforeach; ?>
			<?php submit_button( __( 'オリジナルデザインを保存', 'cni-blocks' ) ); ?>
		</form>
		<script>
		(function() {
			var option = <?php echo wp_json_encode( CNI_BLOCKS_HEADING_CUSTOM_DESIGNS_OPTION ); ?>;
			function field(details, suffix) {
				return details.querySelector('[name^="' + option + '"][name$="' + suffix + '"]');
			}
			function value(details, suffix) {
				var input = field(details, suffix);
				return input ? input.value.trim() : '';
			}
			function update(details) {
				var preview = details.querySelector('.cni-heading-custom-preview');
				if (!preview) return;
				var index = preview.getAttribute('data-preview-index');
				var scope = '.cni-heading-custom-preview-' + index + ' .cni-heading-plus__custom-layer';
				var base = value(details, '[base_css]');
				var before = value(details, '[before_css]');
				var after = value(details, '[after_css]');
				var declarations = '';
				if ((before || after) && !/position\s*:/.test(base)) declarations = 'position:relative;display:inline-block;';
				var advanced = value(details, '[css]').replace(/&/g, scope);
				var css = scope + '{' + declarations + base + '}' + (before ? scope + '::before{' + before + '}' : '') + (after ? scope + '::after{' + after + '}' : '') + advanced;
				var style = document.getElementById('cni-heading-preview-style-' + index);
				if (!style) { style = document.createElement('style'); style.id = 'cni-heading-preview-style-' + index; document.head.appendChild(style); }
				style.textContent = css;
			}
			document.querySelectorAll('.cni-heading-custom-preview').forEach(function(preview) {
				var details = preview.closest('details');
				update(details);
				details.addEventListener('input', function() { update(details); });
			});
		}());
		</script>
	</div>
	<?php
}

function cni_blocks_heading_custom_design_menu() {
	add_options_page( __( 'CNI Blocks 見出し+', 'cni-blocks' ), __( 'CNI Blocks 見出し+', 'cni-blocks' ), 'manage_options', 'cni-blocks-heading-plus-designs', 'cni_blocks_heading_custom_design_settings_page' );
}
add_action( 'admin_menu', 'cni_blocks_heading_custom_design_menu' );

function cni_blocks_heading_custom_design_rest_routes() {
	register_rest_route(
		'cni-blocks/v1',
		'/heading-presets',
		array(
			array(
				'methods'             => WP_REST_Server::READABLE,
				'permission_callback' => static function() { return current_user_can( 'edit_posts' ); },
				'callback'            => static function() { return rest_ensure_response( cni_blocks_heading_presets() ); },
			),
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => static function() { return current_user_can( 'manage_options' ); },
				'callback'            => static function( WP_REST_Request $request ) {
					$presets = cni_blocks_heading_sanitize_presets( $request->get_param( 'presets' ) );
					update_option( CNI_BLOCKS_HEADING_PRESETS_OPTION, $presets, false );
					return rest_ensure_response( $presets );
				},
			),
		)
	);
}
add_action( 'rest_api_init', 'cni_blocks_heading_custom_design_rest_routes' );

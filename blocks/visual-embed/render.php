<?php
/**
 * Server-side rendering for Visual Embed+.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_visual_embed_editor_message( $message ) {
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return '<p class="cni-visual-embed__editor-note">' . esc_html( $message ) . '</p>';
	}

	return '';
}

function cni_blocks_visual_embed_allowed_url( $url ) {
	$url   = esc_url_raw( trim( (string) $url ), array( 'https' ) );
	$parts = $url ? wp_parse_url( $url ) : false;

	if ( ! is_array( $parts ) || empty( $parts['scheme'] ) || 'https' !== strtolower( $parts['scheme'] ) || empty( $parts['host'] ) || empty( $parts['path'] ) ) {
		return '';
	}

	$host = strtolower( $parts['host'] );
	$path = $parts['path'];
	if ( in_array( $host, array( 'www.google.com', 'google.com' ), true ) && 0 === strpos( $path, '/maps/embed' ) ) {
		return $url;
	}
	if ( 'maps.google.com' === $host && 0 === strpos( $path, '/maps' ) ) {
		return $url;
	}

	return '';
}

function cni_blocks_render_visual_embed( $attributes ) {
	$url = isset( $attributes['embedUrl'] ) ? cni_blocks_visual_embed_allowed_url( $attributes['embedUrl'] ) : '';
	if ( ! $url ) {
		return cni_blocks_visual_embed_editor_message( __( 'Googleマップの有効な埋め込みコードを貼り付けてください。', 'cni-blocks' ) );
	}

	$width         = isset( $attributes['width'] ) ? max( 20, min( 100, absint( $attributes['width'] ) ) ) : 100;
	$height_pc     = isset( $attributes['heightPc'] ) ? max( 120, min( 1000, absint( $attributes['heightPc'] ) ) ) : 450;
	$height_tablet = isset( $attributes['heightTablet'] ) ? max( 120, min( 1000, absint( $attributes['heightTablet'] ) ) ) : 400;
	$height_mobile = isset( $attributes['heightMobile'] ) ? max( 120, min( 1000, absint( $attributes['heightMobile'] ) ) ) : 320;
	$radius        = isset( $attributes['radius'] ) ? min( 80, absint( $attributes['radius'] ) ) : 0;
	$show_border   = ! empty( $attributes['showBorder'] );
	$border_width  = isset( $attributes['borderWidth'] ) ? max( 1, min( 12, absint( $attributes['borderWidth'] ) ) ) : 1;
	$border_color  = isset( $attributes['borderColor'] ) ? sanitize_hex_color( $attributes['borderColor'] ) : '#dddddd';
	$border_color  = $border_color ? $border_color : '#dddddd';
	$title         = isset( $attributes['title'] ) ? sanitize_text_field( $attributes['title'] ) : '';
	$title         = '' !== $title ? $title : __( '地図', 'cni-blocks' );
	$styles        = array(
		'--cni-visual-embed-width:' . $width . '%',
		'--cni-visual-embed-height-pc:' . $height_pc . 'px',
		'--cni-visual-embed-height-tablet:' . $height_tablet . 'px',
		'--cni-visual-embed-height-mobile:' . $height_mobile . 'px',
		'--cni-visual-embed-radius:' . $radius . 'px',
		'--cni-visual-embed-border-width:' . ( $show_border ? $border_width : 0 ) . 'px',
		'--cni-visual-embed-border-color:' . $border_color,
	);
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => 'cni-visual-embed',
			'style' => implode( ';', $styles ),
		)
	);
	$loading = ! isset( $attributes['lazyLoad'] ) || $attributes['lazyLoad'] ? 'lazy' : 'eager';

	return sprintf(
		'<div %1$s><iframe class="cni-visual-embed__frame" src="%2$s" title="%3$s" loading="%4$s" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>',
		$wrapper_attributes,
		esc_url( $url ),
		esc_attr( $title ),
		esc_attr( $loading )
	);
}

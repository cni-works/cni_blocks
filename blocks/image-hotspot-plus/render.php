<?php
/** Server-side rendering for Image Hotspot+. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_image_hotspot_plus_number( $value, $min, $max, $fallback ) {
	$value = is_numeric( $value ) ? (float) $value : $fallback;
	return max( $min, min( $max, $value ) );
}

function cni_blocks_render_image_hotspot_plus( $attributes ) {
	$image_url = isset( $attributes['imageUrl'] ) ? esc_url( $attributes['imageUrl'] ) : '';
	$image_alt = isset( $attributes['imageAlt'] ) ? (string) $attributes['imageAlt'] : '';
	if ( '' === $image_url ) {
		return '';
	}

	$display     = ( $attributes['cardDisplay'] ?? 'card' ) === 'modal' ? 'modal' : 'card';
	$interaction = 'modal' === $display ? 'click' : ( ( $attributes['interaction'] ?? 'click' ) === 'hover' ? 'hover' : 'click' );
	$style       = in_array( $attributes['markerStyle'] ?? '', array( 'plus', 'dot', 'number' ), true ) ? $attributes['markerStyle'] : 'plus';
	$color       = isset( $attributes['markerColor'] ) ? sanitize_hex_color( $attributes['markerColor'] ) : '';
	$color       = $color ?: '#1769aa';
	$size        = cni_blocks_image_hotspot_plus_number( $attributes['markerSize'] ?? 38, 24, 64, 38 );
	$position    = in_array( $attributes['cardPosition'] ?? '', array( 'auto', 'top', 'bottom' ), true ) ? $attributes['cardPosition'] : 'auto';
	$modal_position = in_array( $attributes['modalPosition'] ?? '', array( 'center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right' ), true ) ? $attributes['modalPosition'] : 'center';
	$modal_offset_y = cni_blocks_image_hotspot_plus_number( $attributes['modalOffsetY'] ?? 0, -180, 180, 0 );
	$markers     = isset( $attributes['markers'] ) && is_array( $attributes['markers'] ) ? $attributes['markers'] : array();
	$wrapper     = get_block_wrapper_attributes(
		array(
			'class' => 'cni-image-hotspot-plus',
			'style' => '--cni-hotspot-color:' . $color . ';--cni-hotspot-size:' . $size . 'px;--cni-hotspot-modal-offset-y:' . $modal_offset_y . 'px;',
		)
	);
	$output = '<div ' . $wrapper . ' data-interaction="' . esc_attr( $interaction ) . '" data-card-position="' . esc_attr( $position ) . '" data-card-display="' . esc_attr( $display ) . '" data-modal-position="' . esc_attr( $modal_position ) . '" data-pulse="' . ( ! empty( $attributes['markerPulse'] ) ? 'on' : 'off' ) . '">';
	if ( 'modal' === $display ) {
		$output .= '<button type="button" class="cni-image-hotspot-plus__modal-backdrop" aria-label="' . esc_attr__( '閉じる', 'cni-blocks' ) . '"></button>';
	}
	$output .= '<div class="cni-image-hotspot-plus__stage"><img src="' . $image_url . '" alt="' . esc_attr( $image_alt ) . '" loading="lazy" />';

	foreach ( $markers as $index => $marker ) {
		if ( ! is_array( $marker ) ) {
			continue;
		}
		$x          = cni_blocks_image_hotspot_plus_number( $marker['x'] ?? 50, 0, 100, 50 );
		$y          = cni_blocks_image_hotspot_plus_number( $marker['y'] ?? 50, 0, 100, 50 );
		$title      = isset( $marker['title'] ) ? trim( wp_strip_all_tags( (string) $marker['title'] ) ) : '';
		$description = isset( $marker['description'] ) ? trim( wp_strip_all_tags( (string) $marker['description'] ) ) : '';
		$label      = '' !== $title ? $title : sprintf( __( 'ポイント %d', 'cni-blocks' ), $index + 1 );
		$card_id    = wp_unique_id( 'cni-hotspot-card-' );
		$icon       = 'dot' === $style ? '●' : ( 'number' === $style ? (string) ( $index + 1 ) : '+' );
		$card_image = isset( $marker['imageUrl'] ) ? esc_url( $marker['imageUrl'] ) : '';
		$card_alt   = isset( $marker['imageAlt'] ) ? (string) $marker['imageAlt'] : '';
		$link_url   = isset( $marker['linkUrl'] ) ? esc_url( $marker['linkUrl'] ) : '';
		$link_label = isset( $marker['linkLabel'] ) ? trim( wp_strip_all_tags( (string) $marker['linkLabel'] ) ) : '';
		$output    .= '<button type="button" class="cni-image-hotspot-plus__point" style="left:' . esc_attr( $x ) . '%;top:' . esc_attr( $y ) . '%;" aria-controls="' . esc_attr( $card_id ) . '" aria-expanded="false" aria-label="' . esc_attr( $label ) . '">' . esc_html( $icon ) . '</button>';
		$output    .= '<section id="' . esc_attr( $card_id ) . '" class="cni-image-hotspot-plus__card" style="left:' . esc_attr( $x ) . '%;top:' . esc_attr( $y ) . '%;" aria-label="' . esc_attr( $label ) . '"' . ( 'modal' === $display ? ' role="dialog" aria-modal="true"' : '' ) . '><button type="button" class="cni-image-hotspot-plus__card-close" aria-label="' . esc_attr__( '閉じる', 'cni-blocks' ) . '">&times;</button>';
		if ( '' !== $card_image ) {
			$output .= '<img class="cni-image-hotspot-plus__card-image" src="' . $card_image . '" alt="' . esc_attr( $card_alt ) . '" loading="lazy" />';
		}
		if ( '' !== $title ) {
			$output .= '<h3 class="cni-image-hotspot-plus__card-title">' . esc_html( $title ) . '</h3>';
		}
		if ( '' !== $description ) {
			$output .= '<p class="cni-image-hotspot-plus__card-text">' . esc_html( $description ) . '</p>';
		}
		if ( '' !== $link_url ) {
			$output .= '<a class="cni-image-hotspot-plus__card-link" href="' . $link_url . '">' . esc_html( $link_label ?: __( '詳しく見る', 'cni-blocks' ) ) . '</a>';
		}
		$output .= '</section>';
	}

	return $output . '</div></div>';
}

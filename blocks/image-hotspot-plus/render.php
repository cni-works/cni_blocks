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
	$mobile_image_url = isset( $attributes['mobileImageUrl'] ) ? esc_url( $attributes['mobileImageUrl'] ) : '';
	if ( '' === $image_url ) {
		return '';
	}

	$mode        = ( $attributes['mode'] ?? 'hotspot' ) === 'visual-link' ? 'visual-link' : 'hotspot';
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
	$visual_links = isset( $attributes['visualLinks'] ) && is_array( $attributes['visualLinks'] ) ? $attributes['visualLinks'] : array();
	$wrapper     = get_block_wrapper_attributes(
		array(
			'class' => 'cni-image-hotspot-plus',
			'style' => '--cni-hotspot-color:' . $color . ';--cni-hotspot-size:' . $size . 'px;--cni-hotspot-modal-offset-y:' . $modal_offset_y . 'px;',
		)
	);
	$output = '<div ' . $wrapper . ' data-mode="' . esc_attr( $mode ) . '" data-interaction="' . esc_attr( $interaction ) . '" data-card-position="' . esc_attr( $position ) . '" data-card-display="' . esc_attr( $display ) . '" data-modal-position="' . esc_attr( $modal_position ) . '" data-pulse="' . ( ! empty( $attributes['markerPulse'] ) ? 'on' : 'off' ) . '">';
	if ( 'hotspot' === $mode && 'modal' === $display ) {
		$output .= '<button type="button" class="cni-image-hotspot-plus__modal-backdrop" aria-label="' . esc_attr__( '閉じる', 'cni-blocks' ) . '"></button>';
	}
	$output .= '<div class="cni-image-hotspot-plus__stage"><img class="cni-image-hotspot-plus__base-image cni-image-hotspot-plus__base-image--desktop" src="' . $image_url . '" alt="' . esc_attr( $image_alt ) . '" loading="lazy" />';
	if ( '' !== $mobile_image_url ) {
		$output .= '<img class="cni-image-hotspot-plus__base-image cni-image-hotspot-plus__base-image--mobile" src="' . esc_url( $mobile_image_url ) . '" alt="" loading="lazy" />';
	}

	if ( 'visual-link' === $mode ) {
		foreach ( $visual_links as $index => $visual_link ) {
			if ( ! is_array( $visual_link ) ) {
				continue;
			}
			$image = isset( $visual_link['imageUrl'] ) ? esc_url( $visual_link['imageUrl'] ) : '';
			$url = isset( $visual_link['linkUrl'] ) ? esc_url( $visual_link['linkUrl'] ) : '';
			if ( '' === $image ) {
				continue;
			}
			$x = cni_blocks_image_hotspot_plus_number( $visual_link['x'] ?? 50, 0, 100, 50 );
			$y = cni_blocks_image_hotspot_plus_number( $visual_link['y'] ?? 50, 0, 100, 50 );
			$width = cni_blocks_image_hotspot_plus_number( $visual_link['width'] ?? 30, 5, 100, 30 );
			$style = '--cni-visual-link-x:' . $x . '%;--cni-visual-link-y:' . $y . '%;--cni-visual-link-width:' . $width . '%;';
			foreach ( array( 'mobileX' => 'x', 'mobileY' => 'y', 'mobileWidth' => 'width' ) as $attribute => $label ) {
				if ( isset( $visual_link[ $attribute ] ) && is_numeric( $visual_link[ $attribute ] ) ) {
					$minimum = 'width' === $label ? 5 : 0;
					$style .= '--cni-visual-link-mobile-' . strtolower( $label ) . ':' . cni_blocks_image_hotspot_plus_number( $visual_link[ $attribute ], $minimum, 100, $minimum ) . '%;';
				}
			}
			$alt = isset( $visual_link['imageAlt'] ) ? (string) $visual_link['imageAlt'] : '';
			$label = isset( $visual_link['ariaLabel'] ) ? trim( wp_strip_all_tags( (string) $visual_link['ariaLabel'] ) ) : '';
			$label = $label ?: ( $alt ?: sprintf( __( '画像リンク %d', 'cni-blocks' ), $index + 1 ) );
			$hover = in_array( $visual_link['hoverEffect'] ?? '', array( 'none', 'lift', 'scale', 'brighten', 'shadow', 'pulse', 'tada', 'jello', 'swing' ), true ) ? $visual_link['hoverEffect'] : 'lift';
			$attention = in_array( $visual_link['attentionAnimation'] ?? '', array( 'none', 'pulse', 'tada', 'jello', 'swing' ), true ) ? $visual_link['attentionAnimation'] : 'none';
			$class = 'cni-image-hotspot-plus__visual-link cni-image-hotspot-plus__visual-link--hover-' . $hover . ' cni-image-hotspot-plus__visual-link--attention-' . $attention;
			$style .= '--cni-visual-link-delay:' . ( (int) $index * 0.55 ) . 's;';
			if ( '' !== $url ) {
				$target = ! empty( $visual_link['newTab'] ) ? ' target="_blank" rel="noopener noreferrer"' : '';
				$output .= '<a class="' . esc_attr( $class ) . '" href="' . esc_url( $url ) . '" style="' . esc_attr( $style ) . '" aria-label="' . esc_attr( $label ) . '"' . $target . '><img src="' . esc_url( $image ) . '" alt="" loading="lazy" /></a>';
			} else {
				$output .= '<span class="' . esc_attr( $class ) . '" style="' . esc_attr( $style ) . '" aria-hidden="true"><img src="' . esc_url( $image ) . '" alt="" loading="lazy" /></span>';
			}
		}
		return $output . '</div></div>';
	}

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

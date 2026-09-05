<?php
/** Server-side rendering for Image Text Layer. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_image_text_layer_number( $value, $min, $max, $fallback ) {
	$value = is_numeric( $value ) ? (float) $value : $fallback;
	return max( $min, min( $max, $value ) );
}

function cni_blocks_render_image_text_layer( $attributes ) {
	$image_url = isset( $attributes['imageUrl'] ) ? esc_url( $attributes['imageUrl'] ) : '';
	if ( '' === $image_url ) {
		return '';
	}
	$image_alt = isset( $attributes['imageAlt'] ) ? (string) $attributes['imageAlt'] : '';
	$mobile_image_url = isset( $attributes['mobileImageUrl'] ) ? esc_url( $attributes['mobileImageUrl'] ) : '';
	$layers = isset( $attributes['layers'] ) && is_array( $attributes['layers'] ) ? $attributes['layers'] : array();
	$wrapper = get_block_wrapper_attributes( array( 'class' => 'cni-image-text-layer' ) );
	$output = '<div ' . $wrapper . '><div class="cni-image-text-layer__stage">';
	$output .= '<img class="cni-image-text-layer__background cni-image-text-layer__background--desktop" src="' . $image_url . '" alt="' . esc_attr( $image_alt ) . '" loading="lazy" />';
	if ( '' !== $mobile_image_url ) {
		$output .= '<img class="cni-image-text-layer__background cni-image-text-layer__background--mobile" src="' . $mobile_image_url . '" alt="" loading="lazy" />';
	}
	foreach ( $layers as $index => $layer ) {
		if ( ! is_array( $layer ) ) {
			continue;
		}
		$type = ( $layer['type'] ?? 'text' ) === 'image' ? 'image' : 'text';
		$content = isset( $layer['content'] ) ? trim( (string) $layer['content'] ) : '';
		$image_url = isset( $layer['imageUrl'] ) ? esc_url( $layer['imageUrl'] ) : '';
		if ( ( 'text' === $type && '' === $content ) || ( 'image' === $type && '' === $image_url ) ) {
			continue;
		}
		$x = cni_blocks_image_text_layer_number( $layer['x'] ?? 50, 0, 100, 50 );
		$y = cni_blocks_image_text_layer_number( $layer['y'] ?? 50, 0, 100, 50 );
		$width = cni_blocks_image_text_layer_number( $layer['width'] ?? 30, 5, 100, 30 );
		$size = cni_blocks_image_text_layer_number( $layer['fontSize'] ?? 22, 8, 160, 22 );
		$line_height = cni_blocks_image_text_layer_number( $layer['lineHeight'] ?? 1.4, 0.8, 3, 1.4 );
		$color = sanitize_hex_color( $layer['color'] ?? '' ) ?: '#1f2937';
		$weight = in_array( (string) ( $layer['fontWeight'] ?? '' ), array( '400', '500', '600', '700', '800' ), true ) ? (string) $layer['fontWeight'] : ( ( $layer['role'] ?? 'heading' ) === 'body' ? '400' : '700' );
		$align = in_array( $layer['textAlign'] ?? '', array( 'left', 'center', 'right' ), true ) ? $layer['textAlign'] : 'left';
		$family = ( $layer['fontFamily'] ?? 'gothic' ) === 'mincho' ? 'mincho' : 'gothic';
		$custom_classes = isset( $layer['customClass'] ) ? preg_split( '/\s+/', trim( (string) $layer['customClass'] ) ) : array();
		$custom_classes = array_filter( array_map( 'sanitize_html_class', (array) $custom_classes ) );
		$style = '--cni-itl-x:' . $x . '%;--cni-itl-y:' . $y . '%;--cni-itl-width:' . $width . '%;--cni-itl-font-size:' . $size . 'px;--cni-itl-line-height:' . $line_height . ';--cni-itl-color:' . $color . ';--cni-itl-font-weight:' . $weight . ';--cni-itl-align:' . $align . ';';
		foreach ( array( 'mobileX' => 'x', 'mobileY' => 'y', 'mobileWidth' => 'width', 'mobileFontSize' => 'font-size' ) as $attribute => $name ) {
			if ( isset( $layer[ $attribute ] ) && is_numeric( $layer[ $attribute ] ) ) {
				$minimum = 'width' === $name ? 5 : ( 'font-size' === $name ? 8 : 0 );
				$maximum = 'font-size' === $name ? 160 : 100;
				$style .= '--cni-itl-mobile-' . $name . ':' . cni_blocks_image_text_layer_number( $layer[ $attribute ], $minimum, $maximum, $minimum ) . ( 'font-size' === $name ? 'px;' : '%;' );
			}
		}
		if ( 'image' === $type ) {
			$mobile_layer_image = isset( $layer['mobileImageUrl'] ) ? esc_url( $layer['mobileImageUrl'] ) : '';
			$image_alt = isset( $layer['imageAlt'] ) ? (string) $layer['imageAlt'] : '';
			$image_class = 'cni-image-text-layer__item cni-image-text-layer__item--image' . ( '' !== $mobile_layer_image ? ' cni-image-text-layer__item--has-mobile-image' : '' ) . ( empty( $custom_classes ) ? '' : ' ' . implode( ' ', $custom_classes ) );
			$image_html = '<img class="cni-image-text-layer__item-image cni-image-text-layer__item-image--desktop" src="' . $image_url . '" alt="' . esc_attr( $image_alt ) . '" loading="lazy" />';
			if ( '' !== $mobile_layer_image ) {
				$image_html .= '<img class="cni-image-text-layer__item-image cni-image-text-layer__item-image--mobile" src="' . $mobile_layer_image . '" alt="" loading="lazy" />';
			}
			$link_url = isset( $layer['linkUrl'] ) ? esc_url( $layer['linkUrl'] ) : '';
			if ( '' !== $link_url ) {
				$label = isset( $layer['ariaLabel'] ) ? trim( wp_strip_all_tags( (string) $layer['ariaLabel'] ) ) : '';
				$target = ! empty( $layer['newTab'] ) ? ' target="_blank" rel="noopener noreferrer"' : '';
				$image_html = '<a class="cni-image-text-layer__image-link" href="' . $link_url . '" aria-label="' . esc_attr( $label ?: $image_alt ) . '"' . $target . '>' . $image_html . '</a>';
			}
			$output .= '<div class="' . esc_attr( $image_class ) . '" style="' . esc_attr( $style ) . '" data-layer-index="' . esc_attr( (string) $index ) . '">' . $image_html . '</div>';
		} else {
			$output .= '<div class="cni-image-text-layer__item cni-image-text-layer__item--' . esc_attr( $family ) . ( empty( $custom_classes ) ? '' : ' ' . esc_attr( implode( ' ', $custom_classes ) ) ) . '" style="' . esc_attr( $style ) . '" data-layer-index="' . esc_attr( (string) $index ) . '">' . esc_html( $content ) . '</div>';
		}
	}
	return $output . '</div></div>';
}

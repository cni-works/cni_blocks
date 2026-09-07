<?php
/** Server-side rendering for Image Text Layer. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_image_text_layer_number( $value, $min, $max, $fallback ) {
	$value = is_numeric( $value ) ? (float) $value : $fallback;
	return max( $min, min( $max, $value ) );
}

function cni_blocks_image_text_layer_text_design( $value ) {
	$designs = array( 'simple-shadow', 'frame-label', 'white-label', 'elegant-gradient', 'pop-outline-shadow', 'sale-price', 'outline', 'gold-metal', 'marker-underline', 'neon', 'accent-underline', 'center-slash', 'left-bar', 'left-bar-band', 'short-underline', 'double-underline', 'center-underline', 'side-lines', 'corner-frame', 'speech-underline' );
	return in_array( $value, $designs, true ) ? $value : '';
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
		$text_design = cni_blocks_image_text_layer_text_design( (string) ( $layer['textDesign'] ?? '' ) );
		$tag_name = isset( $layer['tagName'] ) && in_array( $layer['tagName'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p' ), true ) ? $layer['tagName'] : ( ( $layer['role'] ?? 'heading' ) === 'body' ? 'p' : 'h2' );
		$custom_classes = isset( $layer['customClass'] ) ? preg_split( '/\s+/', trim( (string) $layer['customClass'] ) ) : array();
		$custom_classes = array_filter( array_map( 'sanitize_html_class', (array) $custom_classes ) );
		$style = '--cni-itl-x:' . $x . '%;--cni-itl-y:' . $y . '%;--cni-itl-width:' . $width . '%;--cni-itl-font-size:' . $size . 'px;--cni-itl-line-height:' . $line_height . ';--cni-itl-color:' . $color . ';--cni-itl-font-weight:' . $weight . ';--cni-itl-align:' . $align . ';';
		if ( '' !== $text_design ) {
			foreach ( array( 'textDesignPrimaryColor' => '--cni-heading-design-primary', 'textDesignHighlightColor' => '--cni-heading-design-highlight', 'textDesignAccentColor' => '--cni-heading-design-accent' ) as $attribute => $property ) {
				$design_color = sanitize_hex_color( $layer[ $attribute ] ?? '' );
				if ( $design_color ) {
					$style .= $property . ':' . $design_color . ';';
				}
			}
		}
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
			$text_class = 'cni-image-text-layer__item cni-image-text-layer__item--' . $family . ( '' !== $text_design ? ' cni-image-text-layer__item--text-design' : '' ) . ( empty( $custom_classes ) ? '' : ' ' . implode( ' ', $custom_classes ) );
			$data_design = '' !== $text_design ? ' data-cni-text-design="' . esc_attr( $text_design ) . '"' : '';
			$output .= '<div class="' . esc_attr( $text_class ) . '" style="' . esc_attr( $style ) . '" data-layer-index="' . esc_attr( (string) $index ) . '"' . $data_design . '><' . $tag_name . ' class="cni-image-text-layer__content' . ( '' !== $text_design ? ' cni-heading-plus__effect-target' : '' ) . '">' . esc_html( $content ) . '</' . $tag_name . '></div>';
		}
	}
	return $output . '</div></div>';
}

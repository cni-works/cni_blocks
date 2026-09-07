<?php
/**
 * Server-side rendering for Circle Image+.
 *
 * A server-generated SVG path ID prevents textPath collisions when several
 * blocks, including duplicated blocks, are displayed on the same page.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_circle_image_plus_separator( $separator ) {
	$separators = array(
		'dash'   => '—',
		'bullet'  => '•',
		'slash'  => '/',
		'none'   => '',
	);

	return $separators[ $separator ] ?? $separators['dash'];
}

function cni_blocks_circle_image_plus_repeated_text( $text, $separator ) {
	$text = trim( wp_strip_all_tags( (string) $text ) );
	if ( '' === $text ) {
		return '';
	}

	$joiner     = cni_blocks_circle_image_plus_separator( $separator );
	$unit       = '' !== $joiner ? $text . ' ' . $joiner . ' ' : $text . '  ';
	$characters = preg_split( '//u', $unit, -1, PREG_SPLIT_NO_EMPTY );
	$length     = is_array( $characters ) ? count( $characters ) : strlen( $unit );
	$repeats    = max( 1, min( 6, (int) ceil( 48 / max( 1, $length ) ) ) );

	return trim( str_repeat( $unit, $repeats ) );
}

function cni_blocks_render_circle_image_plus( $attributes ) {
	$size_options = array( 'small', 'medium', 'large', 'xlarge' );
	$alignments   = array( 'left', 'center', 'right' );
	$text_sizes   = array( 'small', 'normal', 'large' );
	$backgrounds  = array( 'none', 'white', 'black' );
	$gaps         = array( 'narrow', 'normal', 'wide' );
	$directions   = array( 'clockwise', 'counterclockwise' );
	$speeds       = array( 'slow', 'normal', 'fast' );

	$size       = in_array( $attributes['sizePreset'] ?? '', $size_options, true ) ? $attributes['sizePreset'] : 'medium';
	$alignment  = in_array( $attributes['alignment'] ?? '', $alignments, true ) ? $attributes['alignment'] : 'center';
	$text_size  = in_array( $attributes['textSize'] ?? '', $text_sizes, true ) ? $attributes['textSize'] : 'normal';
	$background = in_array( $attributes['ringBackground'] ?? '', $backgrounds, true ) ? $attributes['ringBackground'] : 'none';
	$gap        = in_array( $attributes['ringGap'] ?? '', $gaps, true ) ? $attributes['ringGap'] : 'normal';
	$direction  = in_array( $attributes['rotationDirection'] ?? '', $directions, true ) ? $attributes['rotationDirection'] : 'clockwise';
	$speed      = in_array( $attributes['rotationSpeed'] ?? '', $speeds, true ) ? $attributes['rotationSpeed'] : 'slow';
	$text       = cni_blocks_circle_image_plus_repeated_text( $attributes['ringText'] ?? '', $attributes['separator'] ?? 'dash' );
	$image_url  = isset( $attributes['mediaUrl'] ) ? esc_url( $attributes['mediaUrl'] ) : '';
	$image_alt  = isset( $attributes['mediaAlt'] ) ? (string) $attributes['mediaAlt'] : '';
	$link_url   = isset( $attributes['linkUrl'] ) ? esc_url( $attributes['linkUrl'] ) : '';
	$default_text_color = 'black' === $background ? '#ffffff' : ( 'white' === $background ? '#111111' : 'currentColor' );
	$text_color = isset( $attributes['textColor'] ) ? sanitize_hex_color( $attributes['textColor'] ) : '';
	$hover_color = isset( $attributes['hoverTextColor'] ) ? sanitize_hex_color( $attributes['hoverTextColor'] ) : '';
	$weight      = isset( $attributes['textWeight'] ) && in_array( (string) $attributes['textWeight'], array( '400', '500', '600', '700' ), true ) ? (string) $attributes['textWeight'] : '600';
	$spacing     = isset( $attributes['letterSpacing'] ) ? max( -2, min( 10, (float) $attributes['letterSpacing'] ) ) : 0;
	$path_id     = wp_unique_id( 'cni-circle-image-plus-path-' );
	$rotation    = ! empty( $attributes['rotationEnabled'] ) ? 'on' : 'off';
	$target      = ! empty( $attributes['linkTarget'] ) ? ' target="_blank" rel="noopener noreferrer"' : '';
	$aria_label  = trim( $image_alt ) ?: trim( wp_strip_all_tags( (string) ( $attributes['ringText'] ?? '' ) ) );
	$aria_label  = '' !== $aria_label ? $aria_label : __( 'サークル画像リンク', 'cni-blocks' );
	$style       = '--cni-circle-text-color:' . ( $text_color ?: $default_text_color ) . ';--cni-circle-hover-text-color:' . ( $hover_color ?: ( $text_color ?: $default_text_color ) ) . ';--cni-circle-text-weight:' . $weight . ';--cni-circle-letter-spacing:' . $spacing . 'px;';
	$wrapper     = get_block_wrapper_attributes( array( 'class' => 'cni-circle-image-plus', 'style' => $style ) );
	$image       = '' !== $image_url
		? '<img class="cni-circle-image-plus__image" src="' . $image_url . '" alt="' . esc_attr( $image_alt ) . '" loading="lazy" />'
		: '<span class="cni-circle-image-plus__placeholder" aria-hidden="true"></span>';
	$svg         = '<svg class="cni-circle-image-plus__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><path id="' . esc_attr( $path_id ) . '" d="M 50 5 a 45 45 0 1 1 0 90 a 45 45 0 1 1 0 -90" /></defs><text class="cni-circle-image-plus__text" textLength="282.74" lengthAdjust="spacing"><textPath href="#' . esc_attr( $path_id ) . '" startOffset="0%">' . esc_html( $text ) . '</textPath></text></svg>';
	$visual      = '<span class="cni-circle-image-plus__visual">' . $image . '<span class="cni-circle-image-plus__ring">' . $svg . '</span></span>';

	if ( '' !== $link_url ) {
		$visual = '<a class="cni-circle-image-plus__link" href="' . $link_url . '" aria-label="' . esc_attr( $aria_label ) . '"' . $target . '>' . $visual . '</a>';
	}

	return '<div ' . $wrapper . ' data-size="' . esc_attr( $size ) . '" data-alignment="' . esc_attr( $alignment ) . '" data-text-size="' . esc_attr( $text_size ) . '" data-ring-background="' . esc_attr( $background ) . '" data-ring-gap="' . esc_attr( $gap ) . '" data-rotation="' . esc_attr( $rotation ) . '" data-rotation-direction="' . esc_attr( $direction ) . '" data-rotation-speed="' . esc_attr( $speed ) . '">' . $visual . '</div>';
}

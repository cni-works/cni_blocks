<?php
/** Server-side rendering for Page Flip+. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_page_flip_pages( $pages ) {
	$valid_pages = array();
	foreach ( (array) $pages as $page ) {
		if ( ! is_array( $page ) ) {
			continue;
		}
		$id  = isset( $page['id'] ) ? absint( $page['id'] ) : 0;
		$url = isset( $page['url'] ) ? esc_url_raw( $page['url'] ) : '';
		if ( ! $id && '' === $url ) {
			continue;
		}
		$focus_areas = array();
		foreach ( (array) ( $page['focusAreas'] ?? array() ) as $area ) {
			if ( ! is_array( $area ) ) {
				continue;
			}
			$focus_areas[] = array(
				'id'     => isset( $area['id'] ) ? sanitize_key( $area['id'] ) : '',
				'x'      => cni_blocks_page_flip_number( $area['x'] ?? 50, 0, 100, 50 ),
				'y'      => cni_blocks_page_flip_number( $area['y'] ?? 50, 0, 100, 50 ),
				'width'  => cni_blocks_page_flip_number( $area['width'] ?? 30, 5, 100, 30 ),
				'height' => cni_blocks_page_flip_number( $area['height'] ?? 30, 5, 100, 30 ),
				'zoom'   => cni_blocks_page_flip_number( $area['zoom'] ?? 100, 60, 110, 100 ),
				'view'   => in_array( $area['view'] ?? '', array( 'auto', 'focus', 'overview' ), true ) ? $area['view'] : 'auto',
			);
		}
		$mobile_focus_areas = array();
		foreach ( (array) ( $page['mobileFocusAreas'] ?? array() ) as $area ) {
			if ( ! is_array( $area ) ) {
				continue;
			}
			$mobile_focus_areas[] = array(
				'id'     => isset( $area['id'] ) ? sanitize_key( $area['id'] ) : '',
				'x'      => cni_blocks_page_flip_number( $area['x'] ?? 50, 0, 100, 50 ),
				'y'      => cni_blocks_page_flip_number( $area['y'] ?? 50, 0, 100, 50 ),
				'width'  => cni_blocks_page_flip_number( $area['width'] ?? 30, 5, 100, 30 ),
				'height' => cni_blocks_page_flip_number( $area['height'] ?? 30, 5, 100, 30 ),
				'zoom'   => cni_blocks_page_flip_number( $area['zoom'] ?? 100, 60, 110, 100 ),
				'view'   => in_array( $area['view'] ?? '', array( 'auto', 'focus', 'overview' ), true ) ? $area['view'] : 'auto',
			);
		}
		$valid_pages[] = array(
			'id'  => $id,
			'url' => $url,
			'alt' => isset( $page['alt'] ) ? sanitize_text_field( $page['alt'] ) : '',
			'focusAreas' => $focus_areas,
			'mobileFocusAreas' => $mobile_focus_areas,
		);
	}
	return $valid_pages;
}

function cni_blocks_page_flip_number( $value, $minimum, $maximum, $fallback ) {
	$value = is_numeric( $value ) ? (float) $value : $fallback;
	return max( $minimum, min( $maximum, $value ) );
}

function cni_blocks_page_flip_image( $page, $index ) {
	$image_attributes = array(
		'class'         => 'cni-page-flip__image',
		'alt'           => $page['alt'],
		'loading'       => 0 === $index ? 'eager' : 'lazy',
		'decoding'      => 'async',
		'fetchpriority' => 0 === $index ? 'high' : 'auto',
	);
	if ( $page['id'] ) {
		$image = wp_get_attachment_image( $page['id'], 'large', false, $image_attributes );
		if ( $image ) {
			return $image;
		}
	}
	return '<img class="cni-page-flip__image" src="' . esc_url( $page['url'] ) . '" alt="' . esc_attr( $page['alt'] ) . '" loading="' . ( 0 === $index ? 'eager' : 'lazy' ) . '" decoding="async"' . ( 0 === $index ? ' fetchpriority="high"' : '' ) . ' />';
}

function cni_blocks_render_page_flip( $attributes ) {
	$pages = cni_blocks_page_flip_pages( $attributes['pages'] ?? array() );
	if ( empty( $pages ) ) {
		return '';
	}
	$binding       = ( $attributes['binding'] ?? 'rtl' ) === 'ltr' ? 'ltr' : 'rtl';
	$show_numbers  = ! isset( $attributes['showPageNumbers'] ) || ! empty( $attributes['showPageNumbers'] );
	$edge_click    = ! isset( $attributes['enableEdgeClick'] ) || ! empty( $attributes['enableEdgeClick'] );
	$guide_arrow_all_pages = ! empty( $attributes['showGuideArrowOnAllPages'] );
	$animation     = ! isset( $attributes['enableAnimation'] ) || ! empty( $attributes['enableAnimation'] );
	$scroll_assist  = ! empty( $attributes['scrollAssist'] );
	$scroll_position = in_array( $attributes['scrollAssistPosition'] ?? '', array( 'auto', 'top', 'center' ), true ) ? $attributes['scrollAssistPosition'] : 'auto';
	$scroll_strength = in_array( $attributes['scrollAssistStrength'] ?? '', array( 'gentle', 'normal', 'strong' ), true ) ? $attributes['scrollAssistStrength'] : 'normal';
	$focus_reader   = ! empty( $attributes['focusReader'] );
	$mobile_focus_reader = ! empty( $attributes['mobileFocusReader'] );
	$max_width     = cni_blocks_page_flip_number( $attributes['maxWidth'] ?? 650, 320, 1600, 650 );
	$stage_id      = wp_unique_id( 'cni-page-flip-pages-' );
	$wrapper       = get_block_wrapper_attributes( array( 'class' => 'cni-page-flip is-first-page', 'style' => '--cni-page-flip-max-width:' . $max_width . 'px;' ) );
	$count         = count( $pages );
	$has_focus_areas = false;
	foreach ( $pages as $page ) {
		if ( ! empty( $page['focusAreas'] ) || ( $mobile_focus_reader && ! empty( $page['mobileFocusAreas'] ) ) ) {
			$has_focus_areas = true;
			break;
		}
	}

	$output = '<div ' . $wrapper . ' data-binding="' . esc_attr( $binding ) . '" data-edge-click="' . ( $edge_click ? 'on' : 'off' ) . '" data-guide-arrow="' . ( $guide_arrow_all_pages ? 'all' : 'first' ) . '" data-animation="' . ( $animation ? 'on' : 'off' ) . '" data-scroll-assist="' . ( $scroll_assist ? 'on' : 'off' ) . '" data-scroll-position="' . esc_attr( $scroll_position ) . '" data-scroll-strength="' . esc_attr( $scroll_strength ) . '" data-mobile-focus-reader="' . ( $mobile_focus_reader ? 'on' : 'off' ) . '">';
	$output .= '<div id="' . esc_attr( $stage_id ) . '" class="cni-page-flip__stage" tabindex="0" role="group" aria-roledescription="' . esc_attr__( 'ページビューアー', 'cni-blocks' ) . '" aria-label="' . esc_attr__( 'ページを左右キーまたはスワイプで送れます', 'cni-blocks' ) . '">';
	$output .= '<button type="button" class="cni-page-flip__edge cni-page-flip__edge--previous" aria-label="' . esc_attr__( '前のページ', 'cni-blocks' ) . '"></button>';
	$output .= '<div class="cni-page-flip__pages">';
	foreach ( $pages as $index => $page ) {
		$focus_json = wp_json_encode( $page['focusAreas'] );
		$mobile_focus_json = wp_json_encode( $page['mobileFocusAreas'] );
		$output .= '<figure class="cni-page-flip__page' . ( 0 === $index ? ' is-active' : '' ) . '" data-page-index="' . esc_attr( (string) $index ) . '" data-focus-areas="' . esc_attr( $focus_json ) . '" data-mobile-focus-areas="' . esc_attr( $mobile_focus_json ) . '">' . cni_blocks_page_flip_image( $page, $index ) . '</figure>';
	}
	$output .= '</div>';
	$output .= '<button type="button" class="cni-page-flip__edge cni-page-flip__edge--next" aria-label="' . esc_attr__( '次のページ', 'cni-blocks' ) . '"></button>';
	$output .= '</div>';
	$output .= '<div class="cni-page-flip__controls">';
	$output .= '<button type="button" class="cni-page-flip__button cni-page-flip__button--previous" aria-controls="' . esc_attr( $stage_id ) . '">' . esc_html__( '前のページ', 'cni-blocks' ) . '</button>';
	if ( $show_numbers ) {
		$output .= '<output class="cni-page-flip__count" aria-live="polite">1 / ' . esc_html( (string) $count ) . '</output>';
	}
	$output .= '<button type="button" class="cni-page-flip__button cni-page-flip__button--next" aria-controls="' . esc_attr( $stage_id ) . '">' . esc_html__( '次のページ', 'cni-blocks' ) . '</button>';
	$output .= '</div>';
	if ( $focus_reader && $has_focus_areas ) {
		$output .= '<button type="button" class="cni-page-flip__focus-open" aria-haspopup="dialog">' . esc_html__( '専用ビューアーで読む', 'cni-blocks' ) . '</button>';
		$output .= '<div class="cni-manga-viewer" hidden role="dialog" aria-modal="true" aria-label="' . esc_attr__( 'コマ読みビューアー', 'cni-blocks' ) . '">';
		$output .= '<div class="cni-manga-viewer__header"><button type="button" class="cni-manga-viewer__close">× <span>' . esc_html__( '全体表示に戻る', 'cni-blocks' ) . '</span></button><output class="cni-manga-viewer__count" aria-live="polite"></output></div>';
		$output .= '<div class="cni-manga-viewer__stage"><button type="button" class="cni-manga-viewer__edge cni-manga-viewer__edge--previous" aria-label="' . esc_attr__( '前のコマ', 'cni-blocks' ) . '"></button><img class="cni-manga-viewer__image" alt="" /><button type="button" class="cni-manga-viewer__edge cni-manga-viewer__edge--next" aria-label="' . esc_attr__( '次のコマ', 'cni-blocks' ) . '"></button><p class="cni-manga-viewer__hint">' . esc_html__( '左右にスワイプしてコマを送れます', 'cni-blocks' ) . '</p></div>';
		$output .= '<div class="cni-manga-viewer__controls"><button type="button" class="cni-manga-viewer__next">' . esc_html__( '次のコマ', 'cni-blocks' ) . '</button><button type="button" class="cni-manga-viewer__overview">' . esc_html__( 'ページ全体', 'cni-blocks' ) . '</button><button type="button" class="cni-manga-viewer__previous">' . esc_html__( '前のコマ', 'cni-blocks' ) . '</button></div></div>';
	}
	return $output . '</div>';
}

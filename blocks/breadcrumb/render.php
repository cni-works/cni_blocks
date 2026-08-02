<?php
/**
 * Server-side rendering for Breadcrumb+.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_breadcrumb_add_term_items( &$items, $term ) {
	$taxonomy = get_taxonomy( $term->taxonomy );
	if ( $taxonomy && $taxonomy->hierarchical ) {
		$ancestor_ids = array_reverse( get_ancestors( $term->term_id, $term->taxonomy, 'taxonomy' ) );
		foreach ( $ancestor_ids as $ancestor_id ) {
			$ancestor = get_term( $ancestor_id, $term->taxonomy );
			if ( ! $ancestor || is_wp_error( $ancestor ) ) {
				continue;
			}
			$link = get_term_link( $ancestor );
			if ( ! is_wp_error( $link ) ) {
				$items[] = array( 'label' => $ancestor->name, 'url' => $link );
			}
		}
	}
}

function cni_blocks_breadcrumb_singular_items( $post ) {
	$items       = array();
	$post_type   = get_post_type_object( $post->post_type );
	$hierarchical = is_post_type_hierarchical( $post->post_type );

	if ( $hierarchical ) {
		if ( 'page' !== $post->post_type && $post_type && $post_type->has_archive ) {
			$archive_link = get_post_type_archive_link( $post->post_type );
			if ( $archive_link ) {
				$items[] = array( 'label' => $post_type->labels->name, 'url' => $archive_link );
			}
		}
		$ancestor_ids = array_reverse( get_post_ancestors( $post ) );
		foreach ( $ancestor_ids as $ancestor_id ) {
			$items[] = array(
				'label' => get_the_title( $ancestor_id ),
				'url'   => get_permalink( $ancestor_id ),
			);
		}
	} elseif ( 'post' === $post->post_type ) {
		$categories = get_the_category( $post->ID );
		if ( ! empty( $categories ) ) {
			$category = $categories[0];
			cni_blocks_breadcrumb_add_term_items( $items, $category );
			$link = get_term_link( $category );
			if ( ! is_wp_error( $link ) ) {
				$items[] = array( 'label' => $category->name, 'url' => $link );
			}
		}
	} elseif ( $post_type && $post_type->has_archive ) {
		$archive_link = get_post_type_archive_link( $post->post_type );
		if ( $archive_link ) {
			$items[] = array( 'label' => $post_type->labels->name, 'url' => $archive_link );
		}
	}

	$items[] = array( 'label' => get_the_title( $post->ID ), 'url' => '' );

	return $items;
}

function cni_blocks_breadcrumb_context_items( $block ) {
	$context_post_id = isset( $block->context['postId'] ) ? absint( $block->context['postId'] ) : 0;

	if ( $context_post_id ) {
		$post = get_post( $context_post_id );
		if ( $post ) {
			return cni_blocks_breadcrumb_singular_items( $post );
		}
	}

	if ( is_singular() ) {
		$post = get_post( get_queried_object_id() );
		return $post ? cni_blocks_breadcrumb_singular_items( $post ) : array();
	}

	$items = array();
	if ( is_home() ) {
		$posts_page_id = absint( get_option( 'page_for_posts' ) );
		$items[] = array(
			'label' => $posts_page_id ? get_the_title( $posts_page_id ) : __( '投稿', 'cni-blocks' ),
			'url'   => '',
		);
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$term = get_queried_object();
		if ( $term instanceof WP_Term ) {
			cni_blocks_breadcrumb_add_term_items( $items, $term );
			$items[] = array( 'label' => $term->name, 'url' => '' );
		}
	} elseif ( is_post_type_archive() ) {
		$post_type = get_queried_object();
		if ( $post_type instanceof WP_Post_Type ) {
			$items[] = array( 'label' => $post_type->labels->name, 'url' => '' );
		}
	} elseif ( is_year() ) {
		$items[] = array( 'label' => get_the_date( 'Y年' ), 'url' => '' );
	} elseif ( is_month() ) {
		$year = get_query_var( 'year' );
		$items[] = array( 'label' => $year . '年', 'url' => get_year_link( $year ) );
		$items[] = array( 'label' => get_the_date( 'n月' ), 'url' => '' );
	} elseif ( is_day() ) {
		$year  = get_query_var( 'year' );
		$month = get_query_var( 'monthnum' );
		$items[] = array( 'label' => $year . '年', 'url' => get_year_link( $year ) );
		$items[] = array( 'label' => $month . '月', 'url' => get_month_link( $year, $month ) );
		$items[] = array( 'label' => get_the_date( 'j日' ), 'url' => '' );
	} elseif ( is_search() ) {
		$items[] = array( 'label' => sprintf( __( '「%s」の検索結果', 'cni-blocks' ), get_search_query() ), 'url' => '' );
	} elseif ( is_author() ) {
		$author = get_queried_object();
		if ( $author instanceof WP_User ) {
			$items[] = array( 'label' => sprintf( __( '%sの投稿', 'cni-blocks' ), $author->display_name ), 'url' => '' );
		}
	} elseif ( is_404() ) {
		$items[] = array( 'label' => __( 'ページが見つかりません', 'cni-blocks' ), 'url' => '' );
	}

	return $items;
}

function cni_blocks_render_breadcrumb( $attributes, $content, $block ) {
	$show_home    = ! isset( $attributes['showHome'] ) || $attributes['showHome'];
	$show_current = ! isset( $attributes['showCurrent'] ) || $attributes['showCurrent'];
	$hide_front   = ! isset( $attributes['hideOnFront'] ) || $attributes['hideOnFront'];
	$is_rest      = defined( 'REST_REQUEST' ) && REST_REQUEST;
	$post_id      = isset( $block->context['postId'] ) ? absint( $block->context['postId'] ) : 0;
	$front_id     = absint( get_option( 'page_on_front' ) );
	$is_front     = is_front_page() || ( $front_id && $post_id === $front_id );

	if ( $hide_front && $is_front ) {
		return $is_rest ? '<p class="cni-breadcrumb__editor-note">' . esc_html__( 'トップページでは非表示になる設定です。', 'cni-blocks' ) . '</p>' : '';
	}

	$items = cni_blocks_breadcrumb_context_items( $block );
	if ( $show_home ) {
		array_unshift(
			$items,
			array(
				'label' => isset( $attributes['homeLabel'] ) && '' !== trim( $attributes['homeLabel'] ) ? sanitize_text_field( $attributes['homeLabel'] ) : __( 'ホーム', 'cni-blocks' ),
				'url'   => home_url( '/' ),
			)
		);
	}

	if ( ! $show_current && ! empty( $items ) ) {
		array_pop( $items );
	}

	if ( empty( $items ) ) {
		return $is_rest ? '<p class="cni-breadcrumb__editor-note">' . esc_html__( 'この画面ではパンくずのプレビューを作成できません。', 'cni-blocks' ) . '</p>' : '';
	}

	$separator_options = array(
		'chevron' => '›',
		'greater' => '>',
		'slash'   => '/',
		'double'  => '»',
	);
	$separator_key = isset( $attributes['separator'] ) ? sanitize_key( $attributes['separator'] ) : 'chevron';
	$separator     = isset( $separator_options[ $separator_key ] ) ? $separator_options[ $separator_key ] : $separator_options['chevron'];
	$text_align    = isset( $attributes['textAlign'] ) && in_array( $attributes['textAlign'], array( 'left', 'center', 'right' ), true ) ? $attributes['textAlign'] : 'left';
	$font_size     = isset( $attributes['fontSize'] ) ? max( 10, min( 32, absint( $attributes['fontSize'] ) ) ) : 14;
	$padding_top   = isset( $attributes['paddingTop'] ) ? min( 80, absint( $attributes['paddingTop'] ) ) : 8;
	$padding_bottom = isset( $attributes['paddingBottom'] ) ? min( 80, absint( $attributes['paddingBottom'] ) ) : 8;
	$text_color     = isset( $attributes['textColor'] ) ? sanitize_hex_color( $attributes['textColor'] ) : '#666666';
	$link_color     = isset( $attributes['linkColor'] ) ? sanitize_hex_color( $attributes['linkColor'] ) : '#2271b1';
	$separator_color = isset( $attributes['separatorColor'] ) ? sanitize_hex_color( $attributes['separatorColor'] ) : '#999999';
	$text_color      = $text_color ? $text_color : '#666666';
	$link_color      = $link_color ? $link_color : '#2271b1';
	$separator_color = $separator_color ? $separator_color : '#999999';

	$style = implode(
		';',
		array(
			'--cni-breadcrumb-font-size:' . $font_size . 'px',
			'--cni-breadcrumb-padding-top:' . $padding_top . 'px',
			'--cni-breadcrumb-padding-bottom:' . $padding_bottom . 'px',
			'--cni-breadcrumb-text-color:' . $text_color,
			'--cni-breadcrumb-link-color:' . $link_color,
			'--cni-breadcrumb-separator-color:' . $separator_color,
		)
	);
	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => 'cni-breadcrumb cni-breadcrumb--' . $text_align,
			'style' => $style,
		)
	);

	ob_start();
	?>
	<nav <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> aria-label="<?php esc_attr_e( 'パンくずリスト', 'cni-blocks' ); ?>">
		<ol class="cni-breadcrumb__list">
			<?php foreach ( $items as $index => $item ) : ?>
				<li class="cni-breadcrumb__item">
					<?php if ( $index > 0 ) : ?>
						<span class="cni-breadcrumb__separator" aria-hidden="true"><?php echo esc_html( $separator ); ?></span>
					<?php endif; ?>
					<?php if ( ! empty( $item['url'] ) ) : ?>
						<a href="<?php echo esc_url( $item['url'] ); ?>"><?php echo esc_html( $item['label'] ); ?></a>
					<?php else : ?>
						<span<?php echo $index === count( $items ) - 1 ? ' aria-current="page"' : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>><?php echo esc_html( $item['label'] ); ?></span>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ol>
	</nav>
	<?php

	return ob_get_clean();
}

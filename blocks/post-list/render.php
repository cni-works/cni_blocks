<?php
/**
 * Server-side rendering for Post List+.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_post_list_public_post_types() {
	$post_types = get_post_types( array( 'public' => true ), 'objects' );
	unset( $post_types['attachment'] );
	unset( $post_types['page'] );

	return $post_types;
}

function cni_blocks_post_list_first_term( $post_id, $post_type ) {
	$taxonomies = get_object_taxonomies( $post_type, 'objects' );

	foreach ( $taxonomies as $taxonomy ) {
		if ( empty( $taxonomy->public ) || empty( $taxonomy->hierarchical ) ) {
			continue;
		}

		$terms = get_the_terms( $post_id, $taxonomy->name );
		if ( is_array( $terms ) && ! empty( $terms ) ) {
			return $terms[0];
		}
	}

	return null;
}

function cni_blocks_post_list_term_badge( $term ) {
	if ( ! $term ) {
		return '';
	}

	$term_link = get_term_link( $term );
	if ( is_wp_error( $term_link ) ) {
		return '<span class="cni-post-list__badge">' . esc_html( $term->name ) . '</span>';
	}

	return '<a class="cni-post-list__badge" href="' . esc_url( $term_link ) . '">' . esc_html( $term->name ) . '</a>';
}

function cni_blocks_render_post_list( $attributes ) {
	$post_types = cni_blocks_post_list_public_post_types();
	$post_type  = isset( $attributes['postType'] ) ? sanitize_key( $attributes['postType'] ) : 'post';
	if ( ! isset( $post_types[ $post_type ] ) ) {
		$post_type = 'post';
	}

	$posts_per_page = isset( $attributes['postsPerPage'] ) ? absint( $attributes['postsPerPage'] ) : 6;
	$posts_per_page = max( 1, min( 24, $posts_per_page ) );
	$offset         = isset( $attributes['offset'] ) ? absint( $attributes['offset'] ) : 0;
	$offset         = min( 100, $offset );
	$sort_order     = isset( $attributes['sortOrder'] ) ? sanitize_key( $attributes['sortOrder'] ) : 'newest';
	$sort_options   = array(
		'newest'   => array( 'orderby' => 'date', 'order' => 'DESC' ),
		'oldest'   => array( 'orderby' => 'date', 'order' => 'ASC' ),
		'modified' => array( 'orderby' => 'modified', 'order' => 'DESC' ),
		'random'   => array( 'orderby' => 'rand', 'order' => 'DESC' ),
	);
	if ( ! isset( $sort_options[ $sort_order ] ) ) {
		$sort_order = 'newest';
	}

	$display_type = isset( $attributes['displayType'] ) && 'list' === $attributes['displayType'] ? 'list' : 'card';
	$show_image    = 'card' === $display_type && ( ! isset( $attributes['showImage'] ) || $attributes['showImage'] );
	$show_category = ! isset( $attributes['showCategory'] ) || $attributes['showCategory'];
	$show_date     = ! isset( $attributes['showDate'] ) || $attributes['showDate'];
	$show_title    = ! isset( $attributes['showTitle'] ) || $attributes['showTitle'];
	$title_level   = isset( $attributes['titleLevel'] ) ? absint( $attributes['titleLevel'] ) : 3;
	$title_level   = in_array( $title_level, array( 2, 3, 4, 5 ), true ) ? $title_level : 3;
	$title_tag     = 'h' . $title_level;
	$title_size    = isset( $attributes['titleFontSize'] ) ? min( 48, absint( $attributes['titleFontSize'] ) ) : 0;

	$min_width_pc     = isset( $attributes['minWidthPc'] ) ? absint( $attributes['minWidthPc'] ) : 280;
	$min_width_pc     = max( 160, min( 600, $min_width_pc ) );
	$min_width_tablet = isset( $attributes['minWidthTablet'] ) ? absint( $attributes['minWidthTablet'] ) : 0;
	$min_width_tablet = $min_width_tablet > 0 ? max( 160, min( 600, $min_width_tablet ) ) : $min_width_pc;
	$min_width_mobile = isset( $attributes['minWidthMobile'] ) ? absint( $attributes['minWidthMobile'] ) : 0;
	$min_width_mobile = $min_width_mobile > 0 ? max( 160, min( 600, $min_width_mobile ) ) : $min_width_tablet;
	$gap              = isset( $attributes['gap'] ) ? absint( $attributes['gap'] ) : 24;
	$gap              = min( 100, $gap );
	$card_padding     = isset( $attributes['cardPadding'] ) ? absint( $attributes['cardPadding'] ) : 16;
	$card_padding     = min( 80, $card_padding );
	$card_radius      = isset( $attributes['cardRadius'] ) ? absint( $attributes['cardRadius'] ) : 8;
	$card_radius      = min( 80, $card_radius );
	$card_background  = isset( $attributes['cardBackgroundColor'] ) ? sanitize_hex_color( $attributes['cardBackgroundColor'] ) : '#ffffff';
	$card_background  = $card_background ? $card_background : '#ffffff';
	$card_border      = ! isset( $attributes['cardBorder'] ) || $attributes['cardBorder'];
	$border_width     = isset( $attributes['cardBorderWidth'] ) ? absint( $attributes['cardBorderWidth'] ) : 1;
	$border_width     = $card_border ? max( 1, min( 12, $border_width ) ) : 0;
	$border_color     = isset( $attributes['cardBorderColor'] ) ? sanitize_hex_color( $attributes['cardBorderColor'] ) : '#dddddd';
	$border_color     = $border_color ? $border_color : '#dddddd';
	$card_shadow      = ! empty( $attributes['cardShadow'] );
	$image_ratio      = isset( $attributes['imageRatio'] ) && in_array( $attributes['imageRatio'], array( '16-9', '4-3', '1-1' ), true ) ? $attributes['imageRatio'] : '16-9';
	$hover_effect     = isset( $attributes['hoverEffect'] ) && in_array( $attributes['hoverEffect'], array( 'none', 'darken', 'zoom', 'lift' ), true ) ? $attributes['hoverEffect'] : 'lift';

	$query = new WP_Query(
		array(
			'post_type'           => $post_type,
			'post_status'         => 'publish',
			'posts_per_page'      => $posts_per_page,
			'offset'              => $offset,
			'orderby'             => $sort_options[ $sort_order ]['orderby'],
			'order'               => $sort_options[ $sort_order ]['order'],
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);

	$style = implode(
		';',
		array(
			'--cni-post-list-min-width-pc:' . $min_width_pc . 'px',
			'--cni-post-list-min-width-tablet:' . $min_width_tablet . 'px',
			'--cni-post-list-min-width-mobile:' . $min_width_mobile . 'px',
			'--cni-post-list-gap:' . $gap . 'px',
			'--cni-post-list-card-padding:' . $card_padding . 'px',
			'--cni-post-list-card-background:' . $card_background,
			'--cni-post-list-card-radius:' . $card_radius . 'px',
			'--cni-post-list-card-shadow:' . ( $card_shadow ? '0 8px 24px rgba(0,0,0,.12)' : 'none' ),
			'--cni-post-list-border-width:' . $border_width . 'px',
			'--cni-post-list-border-color:' . $border_color,
			'--cni-post-list-title-font-size:' . ( $title_size > 0 ? $title_size . 'px' : '1.05em' ),
		)
	);

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'            => 'cni-post-list cni-post-list--' . $display_type . ' cni-post-list--ratio-' . $image_ratio . ' cni-post-list--hover-' . $hover_effect,
			'style'            => $style,
			'data-hover-effect' => $hover_effect,
		)
	);

	ob_start();
	?>
	<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<?php if ( $query->have_posts() ) : ?>
			<div class="cni-post-list__items">
				<?php
				while ( $query->have_posts() ) :
					$query->the_post();
					$post_id        = get_the_ID();
					$permalink      = get_permalink( $post_id );
					$title          = get_the_title( $post_id );
					$term           = $show_category ? cni_blocks_post_list_first_term( $post_id, $post_type ) : null;
					$has_thumbnail  = $show_image && has_post_thumbnail( $post_id );
					$category_badge = cni_blocks_post_list_term_badge( $term );
					?>
					<article <?php post_class( 'cni-post-list__item', $post_id ); ?>>
						<?php if ( $has_thumbnail ) : ?>
							<div class="cni-post-list__media">
								<a class="cni-post-list__image-link" href="<?php echo esc_url( $permalink ); ?>" aria-label="<?php echo esc_attr( $title ); ?>">
									<?php echo get_the_post_thumbnail( $post_id, 'large', array( 'class' => 'cni-post-list__image', 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
								</a>
								<?php if ( $category_badge ) : ?>
									<div class="cni-post-list__media-badge"><?php echo $category_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
								<?php endif; ?>
							</div>
						<?php endif; ?>
						<div class="cni-post-list__content">
							<?php if ( 'list' === $display_type && $show_date ) : ?>
								<time class="cni-post-list__date" datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>"><?php echo esc_html( get_the_date( '', $post_id ) ); ?></time>
							<?php endif; ?>
							<?php if ( $category_badge && ! $has_thumbnail ) : ?>
								<div class="cni-post-list__category"><?php echo $category_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
							<?php endif; ?>
							<?php if ( 'card' === $display_type && $show_date ) : ?>
								<time class="cni-post-list__date" datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>"><?php echo esc_html( get_the_date( '', $post_id ) ); ?></time>
							<?php endif; ?>
							<?php if ( $show_title ) : ?>
								<<?php echo esc_attr( $title_tag ); ?> class="cni-post-list__title"><a href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $title ); ?></a></<?php echo esc_attr( $title_tag ); ?>>
							<?php endif; ?>
						</div>
					</article>
				<?php endwhile; ?>
			</div>
		<?php else : ?>
			<p class="cni-post-list__empty"><?php esc_html_e( '表示できる投稿がありません。', 'cni-blocks' ); ?></p>
		<?php endif; ?>
	</div>
	<?php
	wp_reset_postdata();

	return ob_get_clean();
}

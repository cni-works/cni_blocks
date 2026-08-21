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

function cni_blocks_post_list_contrast_color( $hex_color ) {
	$hex = ltrim( $hex_color, '#' );
	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}

	$channels = array_map( 'hexdec', str_split( $hex, 2 ) );
	$channels = array_map(
		static function( $channel ) {
			$value = $channel / 255;
			return $value <= 0.04045 ? $value / 12.92 : pow( ( $value + 0.055 ) / 1.055, 2.4 );
		},
		$channels
	);
	$luminance      = 0.2126 * $channels[0] + 0.7152 * $channels[1] + 0.0722 * $channels[2];
	$white_contrast = 1.05 / ( $luminance + 0.05 );
	$black_contrast = ( $luminance + 0.05 ) / 0.05;

	return $white_contrast >= $black_contrast ? '#ffffff' : '#000000';
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

	$display_type = isset( $attributes['displayType'] ) ? sanitize_key( $attributes['displayType'] ) : 'card';
	if ( ! in_array( $display_type, array( 'card', 'horizontal', 'media', 'list' ), true ) ) {
		$display_type = 'card';
	}
	$card_design  = isset( $attributes['cardDesign'] ) ? sanitize_key( $attributes['cardDesign'] ) : 'standard';
	if ( 'card' !== $display_type || ! in_array( $card_design, array( 'standard', 'overlay', 'date-corner', 'text-card' ), true ) ) {
		$card_design = 'standard';
	}
	$show_image    = 'list' !== $display_type && 'text-card' !== $card_design && ( ! isset( $attributes['showImage'] ) || $attributes['showImage'] );
	$show_category = ! isset( $attributes['showCategory'] ) || $attributes['showCategory'];
	$show_date     = ! isset( $attributes['showDate'] ) || $attributes['showDate'];
	$show_title    = ! isset( $attributes['showTitle'] ) || $attributes['showTitle'];
	$show_excerpt  = in_array( $card_design, array( 'overlay', 'date-corner', 'text-card' ), true ) && ( ! isset( $attributes['showExcerpt'] ) || $attributes['showExcerpt'] );
	$excerpt_length = isset( $attributes['excerptLength'] ) ? absint( $attributes['excerptLength'] ) : 55;
	$excerpt_length = max( 10, min( 160, $excerpt_length ) );
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
	$image_ratio      = isset( $attributes['imageRatio'] ) && in_array( $attributes['imageRatio'], array( '16-9', '4-3', '1-1', '3-4', '2-3' ), true ) ? $attributes['imageRatio'] : '16-9';
	$hover_effect     = isset( $attributes['hoverEffect'] ) && in_array( $attributes['hoverEffect'], array( 'none', 'darken', 'zoom', 'lift' ), true ) ? $attributes['hoverEffect'] : 'lift';
	$overlay_color    = isset( $attributes['overlayColor'] ) ? sanitize_hex_color( $attributes['overlayColor'] ) : '#000000';
	$overlay_color    = $overlay_color ? $overlay_color : '#000000';
	$overlay_hex      = ltrim( $overlay_color, '#' );
	if ( 3 === strlen( $overlay_hex ) ) {
		$overlay_hex = $overlay_hex[0] . $overlay_hex[0] . $overlay_hex[1] . $overlay_hex[1] . $overlay_hex[2] . $overlay_hex[2];
	}
	$overlay_rgb      = array_map( 'hexdec', str_split( $overlay_hex, 2 ) );
	$overlay_opacity  = isset( $attributes['overlayOpacity'] ) ? absint( $attributes['overlayOpacity'] ) : 78;
	$overlay_opacity  = max( 0, min( 100, $overlay_opacity ) );
	$overlay_height   = isset( $attributes['overlayHeight'] ) ? absint( $attributes['overlayHeight'] ) : 75;
	$overlay_height   = max( 30, min( 100, $overlay_height ) );
	$overlay_text     = isset( $attributes['overlayTextColor'] ) ? sanitize_hex_color( $attributes['overlayTextColor'] ) : '#ffffff';
	$overlay_text     = $overlay_text ? $overlay_text : '#ffffff';
	$date_corner_background = isset( $attributes['dateCornerBackgroundColor'] ) ? sanitize_hex_color( $attributes['dateCornerBackgroundColor'] ) : '#ffffff';
	$date_corner_background = $date_corner_background ? $date_corner_background : '#ffffff';
	$date_corner_text       = isset( $attributes['dateCornerTextColor'] ) ? sanitize_hex_color( $attributes['dateCornerTextColor'] ) : '#222222';
	$date_corner_text       = $date_corner_text ? $date_corner_text : '#222222';
	$category_badge_color   = isset( $attributes['categoryBadgeColor'] ) ? sanitize_hex_color( $attributes['categoryBadgeColor'] ) : '#087ea4';
	$category_badge_color   = $category_badge_color ? $category_badge_color : '#087ea4';
	$category_badge_text    = cni_blocks_post_list_contrast_color( $category_badge_color );
	$text_card_title_background = isset( $attributes['textCardTitleBackgroundColor'] ) ? sanitize_hex_color( $attributes['textCardTitleBackgroundColor'] ) : '';
	$text_card_title_background = $text_card_title_background ? $text_card_title_background : 'transparent';

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
			'--cni-post-list-overlay-rgb:' . implode( ',', $overlay_rgb ),
			'--cni-post-list-overlay-opacity:' . ( $overlay_opacity / 100 ),
			'--cni-post-list-overlay-height:' . $overlay_height . '%',
			'--cni-post-list-overlay-text:' . $overlay_text,
			'--cni-post-list-date-corner-background:' . $date_corner_background,
			'--cni-post-list-date-corner-text:' . $date_corner_text,
			'--cni-post-list-category-badge-background:' . $category_badge_color,
			'--cni-post-list-category-badge-text:' . $category_badge_text,
			'--cni-post-list-text-card-title-background:' . $text_card_title_background,
		)
	);
	$wrapper_class = 'cni-post-list cni-post-list--' . $display_type . ' cni-post-list--ratio-' . $image_ratio . ' cni-post-list--hover-' . $hover_effect;
	if ( 'overlay' === $card_design ) {
		$wrapper_class .= ' cni-post-list--design-overlay';
	} elseif ( 'date-corner' === $card_design ) {
		$wrapper_class .= ' cni-post-list--design-date-corner';
	} elseif ( 'text-card' === $card_design ) {
		$wrapper_class .= ' cni-post-list--design-text-card';
	}

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class'            => $wrapper_class,
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
					$excerpt        = $show_excerpt ? wp_trim_words( wp_strip_all_tags( get_the_excerpt( $post_id ) ), $excerpt_length, '…' ) : '';
					$item_class     = 'cni-post-list__item' . ( $has_thumbnail ? '' : ' cni-post-list__item--no-image' );
					?>
					<article <?php post_class( $item_class, $post_id ); ?>>
						<?php if ( 'overlay' === $card_design ) : ?>
							<a class="cni-post-list__overlay-link" href="<?php echo esc_url( $permalink ); ?>" aria-label="<?php echo esc_attr( $title ); ?>">
								<?php if ( $has_thumbnail ) : ?>
									<div class="cni-post-list__media">
										<?php echo get_the_post_thumbnail( $post_id, 'large', array( 'class' => 'cni-post-list__image', 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
									</div>
								<?php endif; ?>
								<div class="cni-post-list__content">
									<?php if ( $term || $show_date ) : ?>
										<div class="cni-post-list__overlay-meta">
											<?php if ( $term ) : ?><span class="cni-post-list__badge"><?php echo esc_html( $term->name ); ?></span><?php endif; ?>
											<?php if ( $show_date ) : ?><time class="cni-post-list__date" datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>"><?php echo esc_html( get_the_date( '', $post_id ) ); ?></time><?php endif; ?>
										</div>
									<?php endif; ?>
									<div class="cni-post-list__overlay-copy">
										<?php if ( $show_title ) : ?>
											<<?php echo esc_attr( $title_tag ); ?> class="cni-post-list__title"><?php echo esc_html( $title ); ?></<?php echo esc_attr( $title_tag ); ?>>
										<?php endif; ?>
										<?php if ( $excerpt ) : ?><p class="cni-post-list__excerpt"><?php echo esc_html( $excerpt ); ?></p><?php endif; ?>
									</div>
								<span class="cni-post-list__arrow" aria-hidden="true">→</span>
								</div>
							</a>
						<?php elseif ( 'date-corner' === $card_design ) : ?>
							<?php if ( $has_thumbnail ) : ?>
								<div class="cni-post-list__media">
									<a class="cni-post-list__image-link" href="<?php echo esc_url( $permalink ); ?>" aria-label="<?php echo esc_attr( $title ); ?>">
										<?php echo get_the_post_thumbnail( $post_id, 'large', array( 'class' => 'cni-post-list__image', 'loading' => 'lazy' ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
									</a>
									<?php if ( $show_date ) : ?>
										<time class="cni-post-list__date-corner" datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>">
											<span class="cni-post-list__date-corner-month"><?php echo esc_html( get_the_date( 'M', $post_id ) ); ?></span>
											<span class="cni-post-list__date-corner-day"><?php echo esc_html( get_the_date( 'd', $post_id ) ); ?></span>
											<span class="cni-post-list__date-corner-year"><?php echo esc_html( get_the_date( 'Y', $post_id ) ); ?></span>
										</time>
									<?php endif; ?>
									<?php if ( $category_badge ) : ?>
										<div class="cni-post-list__date-corner-category"><?php echo $category_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
									<?php endif; ?>
								</div>
							<?php endif; ?>
							<div class="cni-post-list__content">
								<?php if ( ! $has_thumbnail && $show_date ) : ?>
									<time class="cni-post-list__date-corner cni-post-list__date-corner--without-image" datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>">
										<span class="cni-post-list__date-corner-month"><?php echo esc_html( get_the_date( 'M', $post_id ) ); ?></span>
										<span class="cni-post-list__date-corner-day"><?php echo esc_html( get_the_date( 'd', $post_id ) ); ?></span>
										<span class="cni-post-list__date-corner-year"><?php echo esc_html( get_the_date( 'Y', $post_id ) ); ?></span>
									</time>
								<?php endif; ?>
								<?php if ( ! $has_thumbnail && $category_badge ) : ?>
									<div class="cni-post-list__date-corner-category cni-post-list__date-corner-category--without-image"><?php echo $category_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></div>
								<?php endif; ?>
								<?php if ( $show_title ) : ?>
									<<?php echo esc_attr( $title_tag ); ?> class="cni-post-list__title"><a href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $title ); ?></a></<?php echo esc_attr( $title_tag ); ?>>
								<?php endif; ?>
								<?php if ( $excerpt ) : ?><p class="cni-post-list__excerpt"><?php echo esc_html( $excerpt ); ?></p><?php endif; ?>
							</div>
						<?php elseif ( 'text-card' === $card_design ) : ?>
							<div class="cni-post-list__content">
								<?php if ( $term || $show_date ) : ?>
									<div class="cni-post-list__text-card-meta">
										<?php if ( $category_badge ) : ?><?php echo $category_badge; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?><?php endif; ?>
										<?php if ( $show_date ) : ?><time class="cni-post-list__date" datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>"><?php echo esc_html( get_the_date( '', $post_id ) ); ?></time><?php endif; ?>
									</div>
								<?php endif; ?>
								<?php if ( $show_title ) : ?>
									<<?php echo esc_attr( $title_tag ); ?> class="cni-post-list__title"><a href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $title ); ?></a></<?php echo esc_attr( $title_tag ); ?>>
								<?php endif; ?>
								<?php if ( $excerpt ) : ?><p class="cni-post-list__excerpt"><?php echo esc_html( $excerpt ); ?></p><?php endif; ?>
								<a class="cni-post-list__text-card-link" href="<?php echo esc_url( $permalink ); ?>" aria-label="<?php echo esc_attr( $title ); ?>"><span class="cni-post-list__arrow" aria-hidden="true">→</span></a>
							</div>
						<?php else : ?>
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
							<?php if ( in_array( $display_type, array( 'card', 'horizontal', 'media' ), true ) && $show_date ) : ?>
								<time class="cni-post-list__date" datetime="<?php echo esc_attr( get_the_date( DATE_W3C, $post_id ) ); ?>"><?php echo esc_html( get_the_date( '', $post_id ) ); ?></time>
							<?php endif; ?>
							<?php if ( $show_title ) : ?>
								<<?php echo esc_attr( $title_tag ); ?> class="cni-post-list__title"><a href="<?php echo esc_url( $permalink ); ?>"><?php echo esc_html( $title ); ?></a></<?php echo esc_attr( $title_tag ); ?>>
							<?php endif; ?>
						</div>
						<?php endif; ?>
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

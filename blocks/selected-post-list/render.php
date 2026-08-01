<?php
/**
 * Search and server-side rendering for Selected Post List+.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_selected_post_list_public_post_types() {
	$post_types = get_post_types( array( 'public' => true ), 'objects' );
	unset( $post_types['attachment'] );

	return $post_types;
}

function cni_blocks_selected_post_list_result( $post ) {
	$post_type = get_post_type_object( $post->post_type );

	return array(
		'id'        => (int) $post->ID,
		'postType'  => $post->post_type,
		'title'     => get_the_title( $post->ID ) ? get_the_title( $post->ID ) : __( 'タイトルなし', 'cni-blocks' ),
		'url'       => get_permalink( $post->ID ),
		'typeLabel' => $post_type ? $post_type->labels->singular_name : $post->post_type,
		'date'      => get_the_date( '', $post->ID ),
	);
}

function cni_blocks_selected_post_list_search( WP_REST_Request $request ) {
	$query      = trim( (string) $request->get_param( 'q' ) );
	$post_types = cni_blocks_selected_post_list_public_post_types();
	$results    = array();

	if ( '' === $query ) {
		return rest_ensure_response( $results );
	}

	if ( filter_var( $query, FILTER_VALIDATE_URL ) ) {
		$query_host = strtolower( (string) wp_parse_url( $query, PHP_URL_HOST ) );
		$home_host  = strtolower( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
		if ( $query_host !== $home_host ) {
			return rest_ensure_response( $results );
		}

		$post_id = url_to_postid( esc_url_raw( $query ) );
		$post    = $post_id ? get_post( $post_id ) : null;
		if ( $post && 'publish' === $post->post_status && isset( $post_types[ $post->post_type ] ) ) {
			$results[] = cni_blocks_selected_post_list_result( $post );
		}

		return rest_ensure_response( $results );
	}

	$search_query = new WP_Query(
		array(
			'post_type'           => array_keys( $post_types ),
			'post_status'         => 'publish',
			'posts_per_page'      => 10,
			's'                   => sanitize_text_field( $query ),
			'orderby'             => 'relevance',
			'ignore_sticky_posts' => true,
			'no_found_rows'       => true,
		)
	);

	foreach ( $search_query->posts as $post ) {
		$results[] = cni_blocks_selected_post_list_result( $post );
	}

	return rest_ensure_response( $results );
}

/**
 * Limit post searches to users who can edit site content.
 *
 * @return bool
 */
function cni_blocks_selected_post_list_can_search() {
	return current_user_can( 'edit_posts' );
}

/**
 * Reject unexpectedly large search values before running WP_Query.
 *
 * @param mixed $value Request value.
 * @return bool
 */
function cni_blocks_selected_post_list_validate_search_query( $value ) {
	return is_scalar( $value ) && strlen( (string) $value ) <= 500;
}

function cni_blocks_selected_post_list_register_rest_route() {
	register_rest_route(
		'cni-blocks/v1',
		'/search-posts',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'cni_blocks_selected_post_list_search',
			'permission_callback' => 'cni_blocks_selected_post_list_can_search',
			'args'                => array(
				'q' => array(
					'required'          => true,
					'validate_callback' => 'cni_blocks_selected_post_list_validate_search_query',
					'sanitize_callback' => 'sanitize_text_field',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'cni_blocks_selected_post_list_register_rest_route' );

function cni_blocks_render_selected_post_list( $attributes ) {
	$selected_posts = isset( $attributes['selectedPosts'] ) && is_array( $attributes['selectedPosts'] ) ? $attributes['selectedPosts'] : array();
	$public_types   = cni_blocks_selected_post_list_public_post_types();
	$post_ids       = array();

	foreach ( $selected_posts as $selected_post ) {
		$post_id   = isset( $selected_post['id'] ) ? absint( $selected_post['id'] ) : 0;
		$post_type = isset( $selected_post['postType'] ) ? sanitize_key( $selected_post['postType'] ) : '';
		$post       = $post_id ? get_post( $post_id ) : null;
		if ( $post && 'publish' === $post->post_status && $post_type === $post->post_type && isset( $public_types[ $post_type ] ) && ! in_array( $post_id, $post_ids, true ) ) {
			$post_ids[] = $post_id;
		}
	}

	$invalid_count = max( 0, count( $selected_posts ) - count( $post_ids ) );
	$is_rest       = defined( 'REST_REQUEST' ) && REST_REQUEST;

	if ( empty( $post_ids ) ) {
		return $is_rest && $invalid_count > 0
			? '<p class="cni-selected-post-list__invalid">' . esc_html__( '選択した投稿が削除されたか、非公開になっています。', 'cni-blocks' ) . '</p>'
			: '';
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
	$min_width_pc  = isset( $attributes['minWidthPc'] ) ? max( 160, min( 600, absint( $attributes['minWidthPc'] ) ) ) : 280;
	$min_tablet    = isset( $attributes['minWidthTablet'] ) ? absint( $attributes['minWidthTablet'] ) : 0;
	$min_tablet    = $min_tablet > 0 ? max( 160, min( 600, $min_tablet ) ) : $min_width_pc;
	$min_mobile    = isset( $attributes['minWidthMobile'] ) ? absint( $attributes['minWidthMobile'] ) : 0;
	$min_mobile    = $min_mobile > 0 ? max( 160, min( 600, $min_mobile ) ) : $min_tablet;
	$gap           = isset( $attributes['gap'] ) ? min( 100, absint( $attributes['gap'] ) ) : 24;
	$padding       = isset( $attributes['cardPadding'] ) ? min( 80, absint( $attributes['cardPadding'] ) ) : 16;
	$radius        = isset( $attributes['cardRadius'] ) ? min( 80, absint( $attributes['cardRadius'] ) ) : 8;
	$background    = isset( $attributes['cardBackgroundColor'] ) ? sanitize_hex_color( $attributes['cardBackgroundColor'] ) : '#ffffff';
	$background    = $background ? $background : '#ffffff';
	$border_on     = ! isset( $attributes['cardBorder'] ) || $attributes['cardBorder'];
	$border_width  = isset( $attributes['cardBorderWidth'] ) ? absint( $attributes['cardBorderWidth'] ) : 1;
	$border_width  = $border_on ? max( 1, min( 12, $border_width ) ) : 0;
	$border_color  = isset( $attributes['cardBorderColor'] ) ? sanitize_hex_color( $attributes['cardBorderColor'] ) : '#dddddd';
	$border_color  = $border_color ? $border_color : '#dddddd';
	$shadow        = ! empty( $attributes['cardShadow'] );
	$image_ratio   = isset( $attributes['imageRatio'] ) && in_array( $attributes['imageRatio'], array( '16-9', '4-3', '1-1' ), true ) ? $attributes['imageRatio'] : '16-9';
	$hover_effect  = isset( $attributes['hoverEffect'] ) && in_array( $attributes['hoverEffect'], array( 'none', 'darken', 'zoom', 'lift' ), true ) ? $attributes['hoverEffect'] : 'lift';

	$query = new WP_Query(
		array(
			'post_type'              => array_keys( $public_types ),
			'post_status'            => 'publish',
			'post__in'               => $post_ids,
			'posts_per_page'         => count( $post_ids ),
			'orderby'                => 'post__in',
			'ignore_sticky_posts'    => true,
			'no_found_rows'          => true,
		)
	);

	$style = implode(
		';',
		array(
			'--cni-post-list-min-width-pc:' . $min_width_pc . 'px',
			'--cni-post-list-min-width-tablet:' . $min_tablet . 'px',
			'--cni-post-list-min-width-mobile:' . $min_mobile . 'px',
			'--cni-post-list-gap:' . $gap . 'px',
			'--cni-post-list-card-padding:' . $padding . 'px',
			'--cni-post-list-card-background:' . $background,
			'--cni-post-list-card-radius:' . $radius . 'px',
			'--cni-post-list-card-shadow:' . ( $shadow ? '0 8px 24px rgba(0,0,0,.12)' : 'none' ),
			'--cni-post-list-border-width:' . $border_width . 'px',
			'--cni-post-list-border-color:' . $border_color,
			'--cni-post-list-title-font-size:' . ( $title_size > 0 ? $title_size . 'px' : '1.05em' ),
		)
	);

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'class' => 'cni-post-list cni-post-list--' . $display_type . ' cni-post-list--ratio-' . $image_ratio . ' cni-post-list--hover-' . $hover_effect,
			'style' => $style,
		)
	);

	ob_start();
	?>
	<?php if ( $is_rest && $invalid_count > 0 ) : ?>
		<p class="cni-selected-post-list__invalid"><?php esc_html_e( '削除または非公開になった投稿は表示から除外されています。', 'cni-blocks' ); ?></p>
	<?php endif; ?>
	<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<div class="cni-post-list__items">
			<?php
			while ( $query->have_posts() ) :
				$query->the_post();
				$post_id        = get_the_ID();
				$post_type      = get_post_type( $post_id );
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
	</div>
	<?php
	wp_reset_postdata();

	return ob_get_clean();
}

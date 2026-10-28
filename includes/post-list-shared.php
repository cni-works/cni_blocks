<?php
/** Taxonomy badge helpers used by both list blocks; no hooks or rendering initialization. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
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

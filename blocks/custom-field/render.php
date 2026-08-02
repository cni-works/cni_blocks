<?php
/**
 * Server-side rendering for Custom Field+.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function cni_blocks_custom_field_editor_message( $message ) {
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return '<p class="cni-custom-field__editor-note">' . esc_html( $message ) . '</p>';
	}

	return '';
}

function cni_blocks_render_custom_field( $attributes, $content, $block ) {
	$field_key = isset( $attributes['fieldKey'] ) ? trim( sanitize_text_field( $attributes['fieldKey'] ) ) : '';

	if ( '' === $field_key ) {
		return cni_blocks_custom_field_editor_message( __( 'カスタムフィールド名を入力してください。', 'cni-blocks' ) );
	}

	if ( ! preg_match( '/^[A-Za-z0-9_.:-]+$/', $field_key ) || '_' === substr( $field_key, 0, 1 ) || is_protected_meta( $field_key, 'post' ) ) {
		return cni_blocks_custom_field_editor_message( __( 'このカスタムフィールド名は表示できません。', 'cni-blocks' ) );
	}

	$post_id = isset( $block->context['postId'] ) ? absint( $block->context['postId'] ) : 0;
	if ( ! $post_id && is_singular() ) {
		$post_id = absint( get_queried_object_id() );
	}
	if ( ! $post_id ) {
		$post_id = absint( get_the_ID() );
	}

	if ( ! $post_id || 'revision' === get_post_type( $post_id ) ) {
		return cni_blocks_custom_field_editor_message( __( '表示対象の投稿を確認できません。', 'cni-blocks' ) );
	}

	$value = get_post_meta( $post_id, $field_key, true );
	if ( ! is_scalar( $value ) && null !== $value ) {
		return cni_blocks_custom_field_editor_message( __( '配列や画像などの複雑な値は初期版では表示できません。', 'cni-blocks' ) );
	}

	$value = null === $value ? '' : (string) $value;
	if ( '' === $value ) {
		$value = isset( $attributes['fallbackText'] ) ? (string) $attributes['fallbackText'] : '';
	}
	if ( '' === $value ) {
		return cni_blocks_custom_field_editor_message( __( 'このカスタムフィールドには表示できる値がありません。', 'cni-blocks' ) );
	}

	$allowed_tags = array( 'div', 'p', 'span' );
	$html_tag     = isset( $attributes['htmlTag'] ) && in_array( $attributes['htmlTag'], $allowed_tags, true ) ? $attributes['htmlTag'] : 'div';
	$text_align   = isset( $attributes['textAlign'] ) && in_array( $attributes['textAlign'], array( 'left', 'center', 'right' ), true ) ? $attributes['textAlign'] : 'left';
	$display_mode = isset( $attributes['displayMode'] ) && 'plain' === $attributes['displayMode'] ? 'plain' : 'linebreak';
	$font_size    = isset( $attributes['fontSize'] ) ? max( 0, min( 72, absint( $attributes['fontSize'] ) ) ) : 0;
	$text_color   = isset( $attributes['textColor'] ) ? sanitize_hex_color( $attributes['textColor'] ) : '';
	$styles       = array();

	if ( $font_size ) {
		$styles[] = '--cni-custom-field-font-size:' . $font_size . 'px';
	}
	if ( $text_color ) {
		$styles[] = '--cni-custom-field-text-color:' . $text_color;
	}

	$extra_attributes = array(
		'class' => 'cni-custom-field cni-custom-field--' . $text_align,
	);
	if ( ! empty( $styles ) ) {
		$extra_attributes['style'] = implode( ';', $styles );
	}
	$wrapper_attributes = get_block_wrapper_attributes( $extra_attributes );
	$escaped_value      = esc_html( $value );
	if ( 'linebreak' === $display_mode ) {
		$escaped_value = nl2br( $escaped_value );
	}

	return sprintf(
		'<%1$s %2$s>%3$s</%1$s>',
		$html_tag,
		$wrapper_attributes,
		$escaped_value
	);
}

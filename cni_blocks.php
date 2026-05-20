<?php
/**
 * Plugin Name: cni_blocks
 * Description: A small block pack. Currently includes a Slide Gallery block with clickable thumbnails and optional caption.
 * Version: 1.6.9
 * Author: Oishi Naoto
 * License: GPLv2 or later
 */

if ( ! defined( 'ABSPATH' ) ) exit;

function cni_blocks_register_blocks() {
	$dir_url  = plugin_dir_url( __FILE__ );
	$dir_path = plugin_dir_path( __FILE__ );

	wp_register_script(
		'cni-blocks-editor',
		$dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components' ),
		filemtime( $dir_path . 'index.js' )
	);

	wp_register_script(
		'cni-blocks-view',
		$dir_url . 'view.js',
		array(),
		filemtime( $dir_path . 'view.js' ),
		true
	);

	wp_register_style(
		'cni-blocks-style',
		$dir_url . 'style.css',
		array(),
		filemtime( $dir_path . 'style.css' )
	);

	register_block_type(
		$dir_path,
		array(
			'editor_script' => 'cni-blocks-editor',
			'script'        => 'cni-blocks-view',
			'style'         => 'cni-blocks-style',
		)
	);
register_block_type(
  'cni-blocks/tile-gallery',
  array(
    'editor_script' => 'cni-blocks-editor',
    'script'        => 'cni-blocks-view',
    'style'         => 'cni-blocks-style',
    'attributes'    => array(
      'images'      => array( 'type' => 'array', 'default' => array() ),
      'columnsSp'   => array( 'type' => 'number', 'default' => 2 ),
      'columnsPc'   => array( 'type' => 'number', 'default' => 4 ),
      'gap'         => array( 'type' => 'number', 'default' => 8 ),
      'radius'      => array( 'type' => 'number', 'default' => 0 ),
      'shadow'      => array( 'type' => 'boolean', 'default' => false ),
      'showCaption' => array( 'type' => 'boolean', 'default' => false ),
      'displayType' => array( 'type' => 'string', 'default' => 'grid' ),
      'borderOn'    => array( 'type' => 'boolean', 'default' => false ),
      'borderColor' => array( 'type' => 'string', 'default' => '#dddddd' ),
      'borderWidth' => array( 'type' => 'number', 'default' => 1 ),
      'lightbox'    => array( 'type' => 'boolean', 'default' => true ),
      'previewDevice' => array( 'type' => 'string', 'default' => 'pc' ),
      'masonryColumnsSp' => array( 'type' => 'number', 'default' => 2 ),
      'masonryColumnsPc' => array( 'type' => 'number', 'default' => 3 ),

    ),
  )
);
}
add_action( 'init', 'cni_blocks_register_blocks' );

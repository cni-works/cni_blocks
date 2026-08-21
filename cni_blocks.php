<?php
/**
 * Plugin Name: cni_blocks
 * Description: A small block pack with gallery and flexible container blocks.
 * Version: 1.34.1
 * Requires at least: 6.3
 * Requires PHP: 7.4
 * Update URI: https://github.com/cni-works/cni_blocks
 * Author: Oishi Naoto
 * License: GPLv2 or later
 * Text Domain: cni-blocks
 */

if ( ! defined( 'ABSPATH' ) ) exit;

$cni_blocks_updater_file = plugin_dir_path( __FILE__ ) . 'includes/updater/class-github-release-updater.php';

if ( is_readable( $cni_blocks_updater_file ) ) {
	require_once $cni_blocks_updater_file;

	$cni_blocks_updater_headers = get_file_data(
		__FILE__,
		array(
			'version'    => 'Version',
			'update_uri' => 'Update URI',
		),
		'plugin'
	);

	new \CniWorks\CniBlocks\Updater\GitHub_Release_Updater(
		array(
			'type'          => 'plugin',
			'owner'         => 'cni-works',
			'repository'    => 'cni_blocks',
			'slug'          => 'cni_blocks',
			'plugin_file'   => plugin_basename( __FILE__ ),
			'version'       => $cni_blocks_updater_headers['version'],
			'update_uri'    => $cni_blocks_updater_headers['update_uri'],
			'requires'      => '6.3',
			'requires_php'  => '7.4',
			'cache_hours'   => 12,
			'failure_hours' => 1,
			'timeout'       => 5,
		)
	);
}

require_once plugin_dir_path( __FILE__ ) . 'blocks/post-list/render.php';
require_once plugin_dir_path( __FILE__ ) . 'blocks/selected-post-list/render.php';
require_once plugin_dir_path( __FILE__ ) . 'blocks/breadcrumb/render.php';
require_once plugin_dir_path( __FILE__ ) . 'blocks/custom-field/render.php';
require_once plugin_dir_path( __FILE__ ) . 'blocks/visual-embed/render.php';

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

	$outer_dir_url  = $dir_url . 'blocks/outer/';
	$outer_dir_path = $dir_path . 'blocks/outer/';

	wp_register_script(
		'cni-blocks-outer-editor',
		$outer_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components' ),
		filemtime( $outer_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-outer-style',
		$outer_dir_url . 'style.css',
		array(),
		filemtime( $outer_dir_path . 'style.css' )
	);

	$auto_grid_dir_url  = $dir_url . 'blocks/auto-grid/';
	$auto_grid_dir_path = $dir_path . 'blocks/auto-grid/';
	$grid_card_dir_path = $dir_path . 'blocks/grid-card/';

	wp_register_script(
		'cni-blocks-auto-grid-editor',
		$auto_grid_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data' ),
		filemtime( $auto_grid_dir_path . 'index.js' )
	);

	wp_register_script(
		'cni-blocks-auto-grid-view',
		$auto_grid_dir_url . 'view.js',
		array(),
		filemtime( $auto_grid_dir_path . 'view.js' ),
		true
	);

	wp_register_style(
		'cni-blocks-auto-grid-style',
		$auto_grid_dir_url . 'style.css',
		array(),
		filemtime( $auto_grid_dir_path . 'style.css' )
	);

	$post_list_dir_url  = $dir_url . 'blocks/post-list/';
	$post_list_dir_path = $dir_path . 'blocks/post-list/';

	wp_register_script(
		'cni-blocks-post-list-editor',
		$post_list_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render' ),
		filemtime( $post_list_dir_path . 'index.js' )
	);

	$post_type_options = array();
	foreach ( cni_blocks_post_list_public_post_types() as $post_type ) {
		$post_type_options[] = array(
			'label' => $post_type->labels->singular_name,
			'value' => $post_type->name,
		);
	}

	wp_localize_script(
		'cni-blocks-post-list-editor',
		'cniPostListSettings',
		array( 'postTypes' => $post_type_options )
	);

	wp_register_style(
		'cni-blocks-post-list-style',
		$post_list_dir_url . 'style.css',
		array(),
		filemtime( $post_list_dir_path . 'style.css' )
	);

	$selected_post_list_dir_url  = $dir_url . 'blocks/selected-post-list/';
	$selected_post_list_dir_path = $dir_path . 'blocks/selected-post-list/';

	wp_register_script(
		'cni-blocks-selected-post-list-editor',
		$selected_post_list_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-api-fetch', 'wp-server-side-render' ),
		filemtime( $selected_post_list_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-selected-post-list-editor',
		$selected_post_list_dir_url . 'editor.css',
		array(),
		filemtime( $selected_post_list_dir_path . 'editor.css' )
	);

	$breadcrumb_dir_url  = $dir_url . 'blocks/breadcrumb/';
	$breadcrumb_dir_path = $dir_path . 'blocks/breadcrumb/';

	wp_register_script(
		'cni-blocks-breadcrumb-editor',
		$breadcrumb_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render' ),
		filemtime( $breadcrumb_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-breadcrumb-style',
		$breadcrumb_dir_url . 'style.css',
		array(),
		filemtime( $breadcrumb_dir_path . 'style.css' )
	);

	$custom_field_dir_url  = $dir_url . 'blocks/custom-field/';
	$custom_field_dir_path = $dir_path . 'blocks/custom-field/';

	wp_register_script(
		'cni-blocks-custom-field-editor',
		$custom_field_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render' ),
		filemtime( $custom_field_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-custom-field-style',
		$custom_field_dir_url . 'style.css',
		array(),
		filemtime( $custom_field_dir_path . 'style.css' )
	);

	$visual_embed_dir_url  = $dir_url . 'blocks/visual-embed/';
	$visual_embed_dir_path = $dir_path . 'blocks/visual-embed/';

	wp_register_script(
		'cni-blocks-visual-embed-editor',
		$visual_embed_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-server-side-render' ),
		filemtime( $visual_embed_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-visual-embed-style',
		$visual_embed_dir_url . 'style.css',
		array(),
		filemtime( $visual_embed_dir_path . 'style.css' )
	);

	$fixed_display_dir_url  = $dir_url . 'blocks/fixed-display/';
	$fixed_display_dir_path = $dir_path . 'blocks/fixed-display/';

	wp_register_script(
		'cni-blocks-fixed-display-editor',
		$fixed_display_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components' ),
		filemtime( $fixed_display_dir_path . 'index.js' )
	);

	wp_register_script(
		'cni-blocks-fixed-display-view',
		$fixed_display_dir_url . 'view.js',
		array(),
		filemtime( $fixed_display_dir_path . 'view.js' ),
		true
	);

	wp_register_style(
		'cni-blocks-fixed-display-style',
		$fixed_display_dir_url . 'style.css',
		array(),
		filemtime( $fixed_display_dir_path . 'style.css' )
	);

	$overlap_media_dir_url  = $dir_url . 'blocks/overlap-media/';
	$overlap_media_dir_path = $dir_path . 'blocks/overlap-media/';

	wp_register_script(
		'cni-blocks-overlap-media-editor',
		$overlap_media_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components' ),
		filemtime( $overlap_media_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-overlap-media-style',
		$overlap_media_dir_url . 'style.css',
		array(),
		filemtime( $overlap_media_dir_path . 'style.css' )
	);

	$heading_plus_dir_url  = $dir_url . 'blocks/heading-plus/';
	$heading_plus_dir_path = $dir_path . 'blocks/heading-plus/';
	$table_plus_dir_url    = $dir_url . 'blocks/table-plus/';
	$table_plus_dir_path   = $dir_path . 'blocks/table-plus/';
	$counter_plus_dir_url  = $dir_url . 'blocks/counter-plus/';
	$counter_plus_dir_path = $dir_path . 'blocks/counter-plus/';

	wp_register_script(
		'cni-blocks-heading-plus-editor',
		$heading_plus_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data', 'wp-rich-text' ),
		filemtime( $heading_plus_dir_path . 'index.js' )
	);

	wp_register_script(
		'cni-blocks-heading-plus-view',
		$heading_plus_dir_url . 'view.js',
		array(),
		filemtime( $heading_plus_dir_path . 'view.js' ),
		true
	);

	wp_register_style(
		'cni-blocks-heading-plus-style',
		$heading_plus_dir_url . 'style.css',
		array(),
		filemtime( $heading_plus_dir_path . 'style.css' )
	);

	wp_register_script(
		'cni-blocks-table-plus-editor',
		$table_plus_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components' ),
		filemtime( $table_plus_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-table-plus-style',
		$table_plus_dir_url . 'style.css',
		array(),
		filemtime( $table_plus_dir_path . 'style.css' )
	);

	wp_register_script(
		'cni-blocks-counter-plus-editor',
		$counter_plus_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components' ),
		filemtime( $counter_plus_dir_path . 'index.js' )
	);

	wp_register_script(
		'cni-blocks-counter-plus-view',
		$counter_plus_dir_url . 'view.js',
		array(),
		filemtime( $counter_plus_dir_path . 'view.js' ),
		true
	);

	wp_register_style(
		'cni-blocks-counter-plus-style',
		$counter_plus_dir_url . 'style.css',
		array(),
		filemtime( $counter_plus_dir_path . 'style.css' )
	);

	$step_dir_url       = $dir_url . 'blocks/step/';
	$step_dir_path      = $dir_path . 'blocks/step/';
	$step_item_dir_path = $dir_path . 'blocks/step-item/';

	wp_register_script(
		'cni-blocks-step-editor',
		$step_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data' ),
		filemtime( $step_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-step-style',
		$step_dir_url . 'style.css',
		array(),
		filemtime( $step_dir_path . 'style.css' )
	);

	$timeline_dir_url       = $dir_url . 'blocks/timeline/';
	$timeline_dir_path      = $dir_path . 'blocks/timeline/';
	$timeline_item_dir_path = $dir_path . 'blocks/timeline-item/';

	wp_register_script(
		'cni-blocks-timeline-editor',
		$timeline_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data' ),
		filemtime( $timeline_dir_path . 'index.js' )
	);

	wp_register_style(
		'cni-blocks-timeline-style',
		$timeline_dir_url . 'style.css',
		array(),
		filemtime( $timeline_dir_path . 'style.css' )
	);

	$tabs_dir_url       = $dir_url . 'blocks/tabs/';
	$tabs_dir_path      = $dir_path . 'blocks/tabs/';
	$tab_item_dir_path  = $dir_path . 'blocks/tab-item/';

	wp_register_script(
		'cni-blocks-tabs-editor',
		$tabs_dir_url . 'index.js',
		array( 'wp-blocks', 'wp-i18n', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data' ),
		filemtime( $tabs_dir_path . 'index.js' )
	);

	wp_register_script(
		'cni-blocks-tabs-view',
		$tabs_dir_url . 'view.js',
		array(),
		filemtime( $tabs_dir_path . 'view.js' ),
		true
	);

	wp_register_style(
		'cni-blocks-tabs-style',
		$tabs_dir_url . 'style.css',
		array(),
		filemtime( $tabs_dir_path . 'style.css' )
	);

	register_block_type(
		$dir_path,
		array(
			'editor_script' => 'cni-blocks-editor',
			'script'        => 'cni-blocks-view',
			'style'         => 'cni-blocks-style',
			'editor_style'  => 'cni-blocks-style',
		)
	);

	register_block_type(
		$outer_dir_path,
		array(
			'editor_script' => 'cni-blocks-outer-editor',
			'style'         => 'cni-blocks-outer-style',
			'editor_style'  => 'cni-blocks-outer-style',
		)
	);

	register_block_type(
		$grid_card_dir_path,
		array(
			'editor_script' => 'cni-blocks-auto-grid-editor',
			'style'         => 'cni-blocks-auto-grid-style',
			'editor_style'  => 'cni-blocks-auto-grid-style',
		)
	);

	register_block_type(
		$auto_grid_dir_path,
		array(
			'editor_script' => 'cni-blocks-auto-grid-editor',
			'view_script'   => 'cni-blocks-auto-grid-view',
			'style'         => 'cni-blocks-auto-grid-style',
			'editor_style'  => 'cni-blocks-auto-grid-style',
		)
	);

	register_block_type(
		$post_list_dir_path,
		array(
			'editor_script'   => 'cni-blocks-post-list-editor',
			'style'           => 'cni-blocks-post-list-style',
			'editor_style'    => 'cni-blocks-post-list-style',
			'render_callback' => 'cni_blocks_render_post_list',
		)
	);

	register_block_type(
		$selected_post_list_dir_path,
		array(
			'editor_script'   => 'cni-blocks-selected-post-list-editor',
			'style'           => 'cni-blocks-post-list-style',
			'editor_style'    => 'cni-blocks-selected-post-list-editor',
			'render_callback' => 'cni_blocks_render_selected_post_list',
		)
	);

	register_block_type(
		$breadcrumb_dir_path,
		array(
			'editor_script'   => 'cni-blocks-breadcrumb-editor',
			'style'           => 'cni-blocks-breadcrumb-style',
			'editor_style'    => 'cni-blocks-breadcrumb-style',
			'render_callback' => 'cni_blocks_render_breadcrumb',
		)
	);

	register_block_type(
		$custom_field_dir_path,
		array(
			'editor_script'   => 'cni-blocks-custom-field-editor',
			'style'           => 'cni-blocks-custom-field-style',
			'editor_style'    => 'cni-blocks-custom-field-style',
			'render_callback' => 'cni_blocks_render_custom_field',
		)
	);

	register_block_type(
		$visual_embed_dir_path,
		array(
			'editor_script'   => 'cni-blocks-visual-embed-editor',
			'style'           => 'cni-blocks-visual-embed-style',
			'editor_style'    => 'cni-blocks-visual-embed-style',
			'render_callback' => 'cni_blocks_render_visual_embed',
		)
	);

	register_block_type(
		$fixed_display_dir_path,
		array(
			'editor_script' => 'cni-blocks-fixed-display-editor',
			'view_script'   => 'cni-blocks-fixed-display-view',
			'style'         => 'cni-blocks-fixed-display-style',
			'editor_style'  => 'cni-blocks-fixed-display-style',
		)
	);

	register_block_type(
		$overlap_media_dir_path,
		array(
			'editor_script' => 'cni-blocks-overlap-media-editor',
			'style'         => 'cni-blocks-overlap-media-style',
			'editor_style'  => 'cni-blocks-overlap-media-style',
		)
	);

	register_block_type(
		$heading_plus_dir_path,
		array(
			'editor_script' => 'cni-blocks-heading-plus-editor',
			'view_script'   => 'cni-blocks-heading-plus-view',
			'style'         => 'cni-blocks-heading-plus-style',
			'editor_style'  => 'cni-blocks-heading-plus-style',
		)
	);

	register_block_type(
		$table_plus_dir_path,
		array(
			'editor_script' => 'cni-blocks-table-plus-editor',
			'style'         => 'cni-blocks-table-plus-style',
			'editor_style'  => 'cni-blocks-table-plus-style',
		)
	);

	register_block_type(
		$counter_plus_dir_path,
		array(
			'editor_script' => 'cni-blocks-counter-plus-editor',
			'view_script'   => 'cni-blocks-counter-plus-view',
			'style'         => 'cni-blocks-counter-plus-style',
			'editor_style'  => 'cni-blocks-counter-plus-style',
		)
	);

	register_block_type(
		$step_item_dir_path,
		array(
			'editor_script' => 'cni-blocks-step-editor',
			'style'         => 'cni-blocks-step-style',
			'editor_style'  => 'cni-blocks-step-style',
		)
	);

	register_block_type(
		$step_dir_path,
		array(
			'editor_script' => 'cni-blocks-step-editor',
			'style'         => 'cni-blocks-step-style',
			'editor_style'  => 'cni-blocks-step-style',
		)
	);

	register_block_type(
		$timeline_item_dir_path,
		array(
			'editor_script' => 'cni-blocks-timeline-editor',
			'style'         => 'cni-blocks-timeline-style',
			'editor_style'  => 'cni-blocks-timeline-style',
		)
	);

	register_block_type(
		$timeline_dir_path,
		array(
			'editor_script' => 'cni-blocks-timeline-editor',
			'style'         => 'cni-blocks-timeline-style',
			'editor_style'  => 'cni-blocks-timeline-style',
		)
	);

	register_block_type(
		$tab_item_dir_path,
		array(
			'editor_script' => 'cni-blocks-tabs-editor',
			'view_script'   => 'cni-blocks-tabs-view',
			'style'         => 'cni-blocks-tabs-style',
			'editor_style'  => 'cni-blocks-tabs-style',
		)
	);

	register_block_type(
		$tabs_dir_path,
		array(
			'editor_script' => 'cni-blocks-tabs-editor',
			'view_script'   => 'cni-blocks-tabs-view',
			'style'         => 'cni-blocks-tabs-style',
			'editor_style'  => 'cni-blocks-tabs-style',
		)
	);
register_block_type(
  'cni-blocks/tile-gallery',
  array(
    'api_version'   => 3,
    'title'         => 'タイルギャラリー',
    'description'   => '表示タイプ選択・ライトボックス付きギャラリー。',
    'category'      => 'cni-blocks',
    'icon'          => 'screenoptions',
    'editor_script' => 'cni-blocks-editor',
    'script'        => 'cni-blocks-view',
    'style'         => 'cni-blocks-style',
    'editor_style'  => 'cni-blocks-style',
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

add_filter( 'block_categories_all', function( $categories ) {
	foreach ( $categories as $category ) {
		if ( isset( $category['slug'] ) && 'cni-blocks' === $category['slug'] ) {
			return $categories;
		}
	}

	$categories[] = array(
		'slug'  => 'cni-blocks',
		'title' => 'cni-blocks',
		'icon'  => null,
	);

	return $categories;
}, 10 );

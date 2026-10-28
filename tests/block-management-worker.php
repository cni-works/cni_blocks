<?php
/** API-contract harness, not a substitute for a running WordPress installation. */
error_reporting( E_ALL );
set_error_handler( static function( $severity, $message, $file, $line ) { throw new ErrorException( $message, 0, $severity, $file, $line ); } );
$request = json_decode( base64_decode( $argv[1] ?? '' ), true ) ?: array();
$root = dirname( __DIR__ );
define( 'ABSPATH', $root . '/' );
class WP_REST_Server { const READABLE = 'GET'; const CREATABLE = 'POST'; }
$options = $request['options'] ?? array();
$before_options = $options;
$hooks = $scripts = $styles = $registered = $localized = $inline = $routes = $settings = $menus = $enqueued = $errors = array();
$term_queries = 0;
$init_started = false;
$early_translations = array();
function __( $text, $domain = '' ) { if ( ! $GLOBALS['init_started'] && 'cni-blocks' === $domain ) $GLOBALS['early_translations'][] = $text; return $text; }
function esc_html( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' ); }
function esc_attr( $value ) { return esc_html( $value ); }
function esc_url( $value ) { return esc_html( $value ); }
function esc_url_raw( $value ) { return $value; }
function absint( $value ) { return abs( (int) $value ); }
function esc_html_e( $value, $domain = '' ) { echo esc_html( $value ); }
function esc_attr_e( $value, $domain = '' ) { echo esc_attr( $value ); }
function esc_attr__( $value, $domain = '' ) { return esc_attr( $value ); }
function esc_html__( $value, $domain = '' ) { return esc_html( $value ); }
function checked( $value ) { if ( $value ) echo 'checked="checked"'; }
function get_option( $key, $default = false ) { return array_key_exists( $key, $GLOBALS['options'] ) ? $GLOBALS['options'][ $key ] : $default; }
function update_option( $key, $value, $autoload = null ) { $GLOBALS['options'][ $key ] = $value; }
function plugin_dir_path( $file ) { return dirname( $file ) . '/'; }
function plugin_dir_url( $file ) { return 'https://fixture.local/plugins/cni_blocks/'; }
function plugins_url( $file, $base ) { return 'https://fixture.local/plugins/cni_blocks/assets/admin/block-management.js'; }
function plugin_basename( $file ) { return 'cni_blocks/cni_blocks.php'; }
function get_file_data( $file, $headers, $context ) { return array( 'version' => '1.51.0', 'update_uri' => 'https://github.com/cni-works/cni_blocks' ); }
function wp_parse_args( $value, $defaults ) { return array_merge( $defaults, $value ); }
function wp_parse_url( $url, $component ) { return parse_url( $url, $component ); }
function untrailingslashit( $value ) { return rtrim( $value, '/\\' ); }
function wp_normalize_path( $path ) { return str_replace( '\\', '/', $path ); }
function wp_json_encode( $value ) { return json_encode( $value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ); }
function add_action( $name, $callback, $priority = 10, $args = 1 ) { $GLOBALS['hooks'][ $name ][ $priority ][] = $callback; }
function add_filter( $name, $callback, $priority = 10, $args = 1 ) { add_action( $name, $callback, $priority, $args ); }
function do_action( $name ) { if ( 'init' === $name ) $GLOBALS['init_started'] = true; $callbacks = $GLOBALS['hooks'][ $name ] ?? array(); ksort( $callbacks ); foreach ( $callbacks as $list ) { foreach ( $list as $callback ) { $callback(); } } }
function wp_register_script( $name, $src, $deps = array(), $version = false, $footer = false ) { $GLOBALS['scripts'][ $name ] = array( 'src' => $src, 'deps' => $deps, 'version' => $version, 'footer' => $footer ); return true; }
function wp_register_style( $name, $src, $deps = array(), $version = false ) { $GLOBALS['styles'][ $name ] = array( 'src' => $src, 'deps' => $deps, 'version' => $version ); return true; }
function wp_localize_script( $name, $key, $value ) { if ( ! isset( $GLOBALS['scripts'][ $name ] ) ) throw new Exception( 'Localizing unregistered script' ); $GLOBALS['localized'][ $name ][ $key ] = $value; }
function wp_add_inline_script( $name, $value, $position = 'after' ) { $GLOBALS['inline'][ $name ][] = array( $position, $value ); }
function wp_add_inline_style( $name, $value ) { $GLOBALS['inline'][ $name ][] = array( 'style', $value ); }
function wp_enqueue_style( $name ) { $GLOBALS['enqueued'][] = $name; }
function wp_enqueue_script( $name, $src = '', $deps = array(), $version = false, $footer = false ) { $GLOBALS['enqueued'][] = $name; }
function register_block_type( $path_or_name, $args ) {
	$meta = is_dir( $path_or_name ) ? json_decode( file_get_contents( rtrim( $path_or_name, '/\\' ) . '/block.json' ), true ) : array( 'name' => $path_or_name );
	$GLOBALS['registered'][ $meta['name'] ] = array( 'metadata' => $meta, 'args' => $args );
	return (object) $args;
}
function get_post_types( $args, $output ) { return array( 'post' => (object) array( 'name' => 'post', 'labels' => (object) array( 'singular_name' => 'Post' ) ) ); }
function get_object_taxonomies( $type, $output ) { return array( 'category' => (object) array( 'name' => 'category', 'public' => true, 'hierarchical' => true, 'labels' => (object) array( 'singular_name' => 'Category' ) ) ); }
function get_terms( $args ) { ++$GLOBALS['term_queries']; return array( (object) array( 'name' => 'News', 'term_id' => 8 ) ); }
function get_the_terms( $id, $taxonomy ) { return array( (object) array( 'name' => 'News', 'term_id' => 8 ) ); }
function get_term_link( $term ) { return 'https://fixture.local/category/news/'; }
function is_wp_error( $value ) { return false; }
function get_template() { return 'lightning'; }
function wp_get_global_settings( $path ) { return array( array( 'slug' => 'primary', 'color' => '#2563eb' ) ); }
function sanitize_hex_color( $value ) { return preg_match( '/^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i', $value ) ? $value : null; }
function sanitize_key( $value ) { return preg_replace( '/[^a-z0-9_\-]/', '', strtolower( $value ) ); }
function sanitize_text_field( $value ) { return strip_tags( $value ); }
function current_user_can( $capability ) { return $GLOBALS['request']['admin'] ?? true; }
function register_setting( $group, $name, $args ) { $GLOBALS['settings'][ $name ] = array( 'group' => $group, 'args' => $args ); }
function add_options_page( $title, $menu, $capability, $slug, $callback ) { $GLOBALS['menus'][ $slug ] = array( $title, $capability, $callback ); }
function register_rest_route( $namespace, $route, $args ) { $GLOBALS['routes'][] = $namespace . $route; }
function add_settings_error( $setting, $code, $message ) { $GLOBALS['errors'][] = $message; }
function settings_errors() {}
function settings_fields( $group ) { echo '<input name="option_page" value="' . esc_attr( $group ) . '" type="hidden"><input name="_wpnonce" value="fixture-nonce" type="hidden">'; }
function submit_button( $label = 'Save' ) { echo '<button type="submit">' . esc_html( $label ) . '</button>'; }
function is_admin() { return true; }
function is_singular() { return false; }
function is_feed() { return false; }
function wp_unique_id( $prefix ) { static $id = 0; return $prefix . ++$id; }
function get_block_wrapper_attributes( $attributes ) { $values = array(); foreach ( $attributes as $key => $value ) { $values[] = $key . '="' . esc_attr( $value ) . '"'; } return implode( ' ', $values ); }

if ( ! empty( $request['baseline'] ) ) {
	$source = file_get_contents( $request['baseline'] );
	eval( '?>' . str_replace( '__FILE__', var_export( $root . '/cni_blocks.php', true ), $source ) );
} else {
	require $root . '/cni_blocks.php';
}
do_action( 'init' );
do_action( 'admin_init' );
do_action( 'rest_api_init' );
do_action( 'admin_menu' );
do_action( 'enqueue_block_assets' );
$out = array( 'blocks' => $registered, 'scripts' => $scripts, 'styles' => $styles, 'localized' => $localized, 'inline' => $inline, 'routes' => $routes, 'termQueries' => $term_queries, 'enqueued' => $enqueued, 'menus' => $menus, 'earlyTranslations' => $early_translations, 'settingsNames' => array_keys( $settings ) );
if ( function_exists( 'cni_blocks_block_catalog' ) ) {
	$out['catalog'] = cni_blocks_block_catalog();
	$out['units'] = cni_blocks_block_units();
	$out['disabled'] = cni_blocks_disabled_blocks();
	if ( array_key_exists( 'sanitize', $request ) ) $out['sanitized'] = cni_blocks_sanitize_block_management( $request['sanitize'] );
	$out['setting'] = $settings[ CNI_BLOCKS_MANAGEMENT_OPTION ];
}
$out['functions'] = array();
foreach ( array( 'post_list', 'selected_post_list', 'breadcrumb', 'custom_field', 'visual_embed', 'circle_image_plus', 'image_hotspot_plus', 'image_text_layer', 'page_flip' ) as $slug ) {
	$out['functions'][ $slug ] = function_exists( 'cni_blocks_render_' . $slug );
}
$out['sharedPostBadge'] = function_exists( 'cni_blocks_post_list_first_term' ) ? cni_blocks_post_list_term_badge( cni_blocks_post_list_first_term( 1, 'post' ) ) : null;
$out['headingPhp'] = function_exists( 'cni_blocks_heading_custom_designs' );
$out['outerPreloadHook'] = in_array( 'cni_blocks_output_outer_hero_preloads', $hooks['wp_head'][1] ?? array(), true );
$out['includes'] = array_values( array_filter( get_included_files(), static function( $file ) use ( $root ) { return 0 === strpos( wp_normalize_path( $file ), wp_normalize_path( $root ) ); } ) );
if ( ! empty( $request['html'] ) ) {
	ob_start(); cni_blocks_render_background_design_settings_page(); $out['html'] = ob_get_clean();
}
if ( ! empty( $request['render'] ) ) {
	// Raw attachment URL avoids external requests and gives deterministic existing content.
	$attrs = array( 'pages' => array( array( 'url' => 'https://fixture.local/comic.jpg', 'alt' => 'Comic page', 'focusAreas' => array() ) ) );
	$out['rendered'] = function_exists( 'cni_blocks_render_page_flip' ) ? cni_blocks_render_page_flip( $attrs ) : null;
	$out['storedContent'] = '<!-- wp:cni-blocks/page-flip ' . wp_json_encode( $attrs ) . ' /-->';
}
$out['optionsUnchanged'] = $options === $before_options;
echo json_encode( $out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR );

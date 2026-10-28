<?php
/** Site-wide block availability. Only explicit, valid OFF entries disable blocks. */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const CNI_BLOCKS_MANAGEMENT_OPTION = 'cni_blocks_block_management';

/** Discover metadata even for disabled blocks; this list never depends on WP's registry. */
function cni_blocks_block_catalog() {
	static $catalog = null;
	if ( null !== $catalog ) {
		return $catalog;
	}
	$catalog = array();
	$root = dirname( __DIR__ );
	$files = array_merge( array( $root . '/block.json' ), glob( $root . '/blocks/*/block.json' ) ?: array() );
	foreach ( $files as $file ) {
		$metadata = json_decode( file_get_contents( $file ), true );
		if ( ! is_array( $metadata ) || ! isset( $metadata['name'] ) || ! is_string( $metadata['name'] ) || ! preg_match( '/^cni-blocks\/[a-z0-9_-]+$/', $metadata['name'] ) ) {
			continue;
		}
		$catalog[ $metadata['name'] ] = array(
			'title'   => $metadata['title'] ?? $metadata['name'],
			'path'    => dirname( $file ),
			'parents' => isset( $metadata['parent'] ) && is_array( $metadata['parent'] ) ? $metadata['parent'] : array(),
		);
	}
	// The original Tile Gallery intentionally has inline metadata in cni_blocks.php.
	// Availability is read while plugins load. Translate titles only when rendering the admin UI.
	$catalog['cni-blocks/tile-gallery'] = array( 'title' => 'タイルギャラリー', 'path' => '', 'parents' => array() );
	if ( isset( $catalog['cni-blocks/generated-background-plus'] ) ) {
		$catalog['cni-blocks/generated-background-plus']['title'] .= '（旧版・既存ページ用）';
	}
	return $catalog;
}

/** Parent/child block types form one functional unit (Grid, Step, Timeline, Tabs). */
function cni_blocks_block_units() {
	static $units = null;
	if ( null !== $units ) {
		return $units;
	}
	$catalog = cni_blocks_block_catalog();
	$units = array();
	foreach ( $catalog as $name => $block ) {
		$members = array( $name );
		foreach ( $block['parents'] as $parent ) {
			if ( isset( $catalog[ $parent ] ) ) {
				$members[] = $parent;
			}
		}
		foreach ( $units as $key => $unit ) {
			if ( array_intersect( $unit, $members ) ) {
				$members = array_merge( $members, $unit );
				unset( $units[ $key ] );
			}
		}
		$units[] = array_values( array_unique( $members ) );
	}
	foreach ( $units as &$unit ) {
		usort( $unit, static function( $a, $b ) use ( $catalog ) {
			return (int) ! empty( $catalog[ $a ]['parents'] ) <=> (int) ! empty( $catalog[ $b ]['parents'] );
		} );
	}
	unset( $unit );
	$units = array_values( $units );
	return $units;
}

/** Corrupt schemas/values fail open. Unknown names cannot disable another block. */
function cni_blocks_valid_disabled_blocks( $value ) {
	if ( ! is_array( $value ) || 1 !== ( $value['version'] ?? null ) || ! isset( $value['disabled'] ) || ! is_array( $value['disabled'] ) ) {
		return array();
	}
	if ( ! $value['disabled'] ) {
		return array();
	}
	$disabled = array();
	$catalog = cni_blocks_block_catalog();
	foreach ( $value['disabled'] as $key => $name ) {
		if ( ! is_int( $key ) || ! is_string( $name ) ) {
			return array();
		}
		if ( isset( $catalog[ $name ] ) ) {
			$disabled[] = $name;
		}
	}
	foreach ( cni_blocks_block_units() as $unit ) {
		if ( array_intersect( $unit, $disabled ) ) {
			$disabled = array_merge( $disabled, $unit );
		}
	}
	$disabled = array_values( array_unique( $disabled ) );
	sort( $disabled );
	return $disabled;
}

function cni_blocks_disabled_blocks() {
	static $disabled = null;
	if ( null === $disabled ) {
		$disabled = cni_blocks_valid_disabled_blocks( get_option( CNI_BLOCKS_MANAGEMENT_OPTION, array() ) );
	}
	return $disabled;
}

function cni_blocks_block_enabled( $name ) {
	return ! in_array( $name, cni_blocks_disabled_blocks(), true );
}

/** Shared assets stay registered as long as any consumer remains enabled. */
function cni_blocks_asset_owners( $handle ) {
	$shared = array(
		'cni-blocks-editor'             => array( 'cni-blocks/slide-gallery', 'cni-blocks/tile-gallery' ),
		'cni-blocks-view'               => array( 'cni-blocks/slide-gallery', 'cni-blocks/tile-gallery' ),
		'cni-blocks-style'              => array( 'cni-blocks/slide-gallery', 'cni-blocks/tile-gallery' ),
		'cni-blocks-text-designs'       => array( 'cni-blocks/heading-plus', 'cni-blocks/image-text-layer' ),
		'cni-blocks-heading-plus-style' => array( 'cni-blocks/heading-plus', 'cni-blocks/image-text-layer' ),
		'cni-blocks-heading-plus-view'  => array( 'cni-blocks/heading-plus', 'cni-blocks/image-text-layer' ),
		'cni-blocks-post-list-style'    => array( 'cni-blocks/post-list', 'cni-blocks/selected-post-list' ),
	);
	if ( isset( $shared[ $handle ] ) ) {
		return $shared[ $handle ];
	}
	if ( preg_match( '/^cni-blocks-(.+)-(editor|view|style|motion)$/', $handle, $matches ) ) {
		$name = 'cni-blocks/' . $matches[1];
		return isset( cni_blocks_block_catalog()[ $name ] ) ? array( $name ) : array();
	}
	return array();
}

function cni_blocks_asset_needed( $handle ) {
	if ( ! cni_blocks_disabled_blocks() ) {
		return true;
	}
	$owners = cni_blocks_asset_owners( $handle );
	if ( ! $owners ) {
		return true; // Future general-purpose handles must not be disabled accidentally.
	}
	foreach ( $owners as $name ) {
		if ( cni_blocks_block_enabled( $name ) ) {
			return true;
		}
	}
	return false;
}

function cni_blocks_register_script( $handle, $src, $deps = array(), $version = false, $footer = false ) {
	if ( ! cni_blocks_asset_needed( $handle ) ) {
		return false;
	}
	$result = wp_register_script( $handle, $src, $deps, $version, $footer );
	if ( cni_blocks_disabled_blocks() && in_array( $handle, array( 'cni-blocks-editor', 'cni-blocks-view', 'cni-blocks-heading-plus-view' ), true ) ) {
		wp_add_inline_script( $handle, 'window.cniBlocksDisabledBlocks = ' . wp_json_encode( cni_blocks_disabled_blocks() ) . ';', 'before' );
	}
	return $result;
}

function cni_blocks_register_style( $handle, $src, $deps = array(), $version = false ) {
	return cni_blocks_asset_needed( $handle ) ? wp_register_style( $handle, $src, $deps, $version ) : false;
}

function cni_blocks_register_block_type( $path_or_name, $args = array() ) {
	if ( ! cni_blocks_disabled_blocks() ) {
		return register_block_type( $path_or_name, $args );
	}
	$name = $path_or_name;
	foreach ( cni_blocks_block_catalog() as $block_name => $block ) {
		if ( $block['path'] && wp_normalize_path( rtrim( $path_or_name, '/\\' ) ) === wp_normalize_path( $block['path'] ) ) {
			$name = $block_name;
			break;
		}
	}
	return cni_blocks_block_enabled( $name ) ? register_block_type( $path_or_name, $args ) : false;
}

/** Settings API calls this twice when creating an option; canonical output is idempotent. */
function cni_blocks_sanitize_block_management( $value ) {
	if ( is_array( $value ) && '1' === ( $value['form'] ?? null ) ) {
		$enabled = array_key_exists( 'enabled', $value ) ? $value['enabled'] : array();
		if ( ! is_array( $enabled ) ) {
			add_settings_error( CNI_BLOCKS_MANAGEMENT_OPTION, 'invalid', __( '設定値が不正なため、すべてONとして扱います。', 'cni-blocks' ) );
			return array( 'version' => 1, 'disabled' => array() );
		}
		foreach ( $enabled as $name ) {
			if ( ! is_string( $name ) || ! isset( cni_blocks_block_catalog()[ $name ] ) ) {
				return array( 'version' => 1, 'disabled' => array() );
			}
		}
		foreach ( cni_blocks_block_units() as $unit ) {
			if ( array_intersect( $unit, $enabled ) ) {
				$enabled = array_merge( $enabled, $unit );
			}
		}
		$value = array( 'version' => 1, 'disabled' => array_values( array_diff( array_keys( cni_blocks_block_catalog() ), $enabled ) ) );
	}
	return array( 'version' => 1, 'disabled' => cni_blocks_valid_disabled_blocks( $value ) );
}

function cni_blocks_register_management_settings() {
	register_setting( 'cni_blocks_block_management', CNI_BLOCKS_MANAGEMENT_OPTION, array(
		'type' => 'array', 'default' => array( 'version' => 1, 'disabled' => array() ),
		'sanitize_callback' => 'cni_blocks_sanitize_block_management', 'show_in_rest' => false,
	) );
}
add_action( 'admin_init', 'cni_blocks_register_management_settings' );

/** Display units keep every registered type visible, including internal child/legacy blocks. */
function cni_blocks_render_management_settings() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$catalog = cni_blocks_block_catalog();
	$disabled = cni_blocks_disabled_blocks();
	wp_enqueue_script( 'cni-blocks-management-admin', plugins_url( 'assets/admin/block-management.js', dirname( __DIR__ ) . '/cni_blocks.php' ), array(), filemtime( dirname( __DIR__ ) . '/assets/admin/block-management.js' ), true );
	?>
	<hr />
	<form action="options.php" method="post" id="cni-blocks-management">
		<?php settings_fields( 'cni_blocks_block_management' ); ?>
		<input type="hidden" name="cni_blocks_block_management[form]" value="1" />
		<h2><?php esc_html_e( '使用するブロック', 'cni-blocks' ); ?></h2>
		<p><?php esc_html_e( '使用しないブロックをOFFにすると、対象ブロックの登録や専用ファイルの読み込みが停止されます。共通ファイルは、ほかのONのブロックで必要な場合に残ります。', 'cni-blocks' ); ?></p>
		<div class="notice notice-warning inline"><p><?php esc_html_e( 'すでに使用しているブロックをOFFにすると、ページの表示や編集に影響する場合があります。OFFにしても保存済みのブロックデータは削除されません。再びONにすると、保存済みのデータを読み込める状態に戻ります。ただし、OFF中に対象ブロックを含むページを編集・保存した場合、元の状態に戻せない可能性があります。', 'cni-blocks' ); ?></p></div>
		<p><?php esc_html_e( 'Grid+・ステップ+・タイムライン+・タブ+は、動作に必要な親子ブロックを同時に切り替えます。旧背景生成+は既存ページ用として個別に管理できます。変更は「設定を保存」で反映されます。', 'cni-blocks' ); ?></p>
		<p>
			<button type="button" class="button" data-cni-blocks-all="on"><?php esc_html_e( 'すべてON', 'cni-blocks' ); ?></button>
			<button type="button" class="button" data-cni-blocks-all="off" data-confirm="<?php esc_attr_e( 'すべてのブロックをOFFにしますか？既存ページの表示や編集に影響する場合があります。設定を保存するまでは反映されません。', 'cni-blocks' ); ?>"><?php esc_html_e( 'すべてOFF', 'cni-blocks' ); ?></button>
		</p>
		<p role="status" aria-live="polite" data-cni-blocks-summary><?php echo esc_html( sprintf( __( '現在の設定：ON %1$d ／ OFF %2$d（全%3$dブロック）', 'cni-blocks' ), count( $catalog ) - count( $disabled ), count( $disabled ), count( $catalog ) ) ); ?></p>
		<table class="widefat striped">
			<thead><tr><th scope="col"><?php esc_html_e( 'ブロック名', 'cni-blocks' ); ?></th><th scope="col"><?php esc_html_e( '使用する', 'cni-blocks' ); ?></th><th scope="col"><?php esc_html_e( '状態', 'cni-blocks' ); ?></th></tr></thead>
			<tbody>
			<?php foreach ( cni_blocks_block_units() as $index => $unit ) : ?>
				<tr>
					<th scope="row"><label for="cni-blocks-unit-<?php echo esc_attr( $index ); ?>"><?php
						$names = array_map( static function( $name ) use ( $catalog ) { return __( $catalog[ $name ]['title'], 'cni-blocks' ); }, $unit );
						echo esc_html( implode( ' ／ ', $names ) );
					?></label><br /><small><?php echo esc_html( implode( ', ', $unit ) ); ?></small></th>
					<td><input type="checkbox" id="cni-blocks-unit-<?php echo esc_attr( $index ); ?>" name="cni_blocks_block_management[enabled][]" value="<?php echo esc_attr( $unit[0] ); ?>" data-cni-blocks-unit="<?php echo esc_attr( $index ); ?>" data-cni-blocks-count="<?php echo esc_attr( count( $unit ) ); ?>" <?php checked( cni_blocks_block_enabled( $unit[0] ) ); ?> /></td>
					<td data-cni-blocks-state><?php echo cni_blocks_block_enabled( $unit[0] ) ? 'ON' : 'OFF'; ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
		<?php submit_button( __( '設定を保存', 'cni-blocks' ) ); ?>
	</form>
	<?php
}

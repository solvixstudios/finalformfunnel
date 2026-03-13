<?php
/**
 * Plugin Name: Final Form for WooCommerce
 * Plugin URI: https://finalform.app
 * Description: Connect your WooCommerce store to Final Form — the premium order form builder for e-commerce.
 * Version: 1.4.5
 * Author: Solvix Studios
 * Author URI: https://solvixstudios.com
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: finalform-woocommerce
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// ─── Constants ───────────────────────────────────────────────────────────────
define( 'FINALFORM_WC_VERSION', '1.4.5' );
define( 'FINALFORM_WC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'FINALFORM_WC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'FINALFORM_WC_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// ─── Dependency check ────────────────────────────────────────────────────────
function finalform_wc_check_woocommerce() {
    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', function () {
            echo '<div class="notice notice-error"><p>';
            echo '<strong>Final Form for WooCommerce</strong> requires WooCommerce to be installed and activated.';
            echo '</p></div>';
        } );
        return false;
    }
    return true;
}

// ─── Plugin init ─────────────────────────────────────────────────────────────
function finalform_wc_init() {
    if ( ! finalform_wc_check_woocommerce() ) {
        return;
    }

    // Load Plugin Update Checker
    require_once FINALFORM_WC_PLUGIN_DIR . 'plugin-update-checker/plugin-update-checker.php';

    $myUpdateChecker = \YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://finalform.app/plugin-info.json',
        __FILE__,
        'finalform-woocommerce'
    );

    // Load components
    require_once FINALFORM_WC_PLUGIN_DIR . 'includes/class-settings.php';
    require_once FINALFORM_WC_PLUGIN_DIR . 'includes/class-api.php';
    require_once FINALFORM_WC_PLUGIN_DIR . 'includes/class-script-loader.php';

    // Initialize
    FinalForm_WC_Settings::init();
    FinalForm_WC_API::init();
    FinalForm_WC_Script_Loader::init();
}
add_action( 'plugins_loaded', 'finalform_wc_init' );

// ─── Activation hook ─────────────────────────────────────────────────────────
register_activation_hook( __FILE__, function () {
    // Set default options
    add_option( 'finalform_installation_key', '' );
    add_option( 'finalform_loader_active', false );
    add_option( 'finalform_connection_status', 'disconnected' ); // disconnected | connected
    add_option( 'finalform_store_domain', '' ); // Filled by backend on verify
} );

// ─── Deactivation hook ──────────────────────────────────────────────────────
register_deactivation_hook( __FILE__, function () {
    // Optionally clean up — keep options so re-activation is seamless
} );

// ─── Uninstall hook (static, in separate file or inline) ────────────────────
register_uninstall_hook( __FILE__, 'finalform_wc_uninstall' );
function finalform_wc_uninstall() {
    delete_option( 'finalform_installation_key' );
    delete_option( 'finalform_loader_active' );
    delete_option( 'finalform_connection_status' );
    delete_option( 'finalform_store_domain' );
}

// ─── Action links on plugins page ────────────────────────────────────────────
add_filter( 'plugin_action_links_' . FINALFORM_WC_PLUGIN_BASENAME, function ( $links ) {
    $settings_link = '<a href="' . admin_url( 'admin.php?page=finalform-settings' ) . '">Settings</a>';
    array_unshift( $links, $settings_link );
    return $links;
} );

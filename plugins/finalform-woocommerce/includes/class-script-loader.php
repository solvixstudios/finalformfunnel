<?php
/**
 * Final Form WooCommerce — Script Loader
 *
 * Injects the Final Form loader script on WooCommerce product pages
 * when the connection is active. Always enabled — no toggle needed.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FinalForm_WC_Script_Loader {

    /** Loader URL — injected at build time from VITE_APP_URL in .env */
    const LOADER_URL = '%%FINALFORM_APP_URL%%/finalform-loader.js';

    public static function init() {
        add_action( 'wp_head', [ __CLASS__, 'maybe_inject_loader' ], 99 );
    }

    /**
     * Conditionally inject the Final Form loader script.
     * Active automatically when connected — no user toggle required.
     */
    public static function maybe_inject_loader() {
        // Must have an installation key
        $key = get_option( 'finalform_installation_key', '' );
        if ( empty( $key ) ) {
            return;
        }

        // Must be connected
        $status = get_option( 'finalform_connection_status', 'disconnected' );
        if ( $status !== 'connected' ) {
            return;
        }

        // Only on WooCommerce product pages
        if ( ! function_exists( 'is_product' ) || ! is_product() ) {
            return;
        }

        $domain = parse_url( site_url(), PHP_URL_HOST );

        // Output the loader script tag
        printf(
            '<script src="%s" data-store="%s" data-platform="woocommerce" defer></script>' . "\n",
            esc_url( self::LOADER_URL ),
            esc_attr( $domain )
        );
    }
}

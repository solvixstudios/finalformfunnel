<?php
/**
 * Final Form WooCommerce — Settings Page
 *
 * Clean, focused admin UI. No loader toggle (always active).
 * Supports Connect + Disconnect flow synced with the Final Form app.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FinalForm_WC_Settings {

    public static function init() {
        add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_styles' ] );
        add_action( 'update_option_finalform_installation_key', [ __CLASS__, 'on_key_update' ], 10, 2 );
        add_action( 'admin_post_finalform_disconnect', [ __CLASS__, 'handle_disconnect' ] );
    }

    /**
     * Register the admin menu item as a top-level sidebar menu
     */
    public static function register_menu() {
        $icon_svg = 'data:image/svg+xml;base64,' . base64_encode(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>'
        );

        add_menu_page(
            'Final Form',
            'Final Form',
            'manage_woocommerce',
            'finalform-settings',
            [ __CLASS__, 'render_page' ],
            $icon_svg,
            56
        );
    }

    /**
     * Register settings
     */
    public static function register_settings() {
        register_setting( 'finalform_settings', 'finalform_installation_key', [
            'type'              => 'string',
            'sanitize_callback' => 'sanitize_text_field',
        ] );
    }

    /**
     * Triggered when the installation key is saved/updated.
     * Fires a webhook to Final Form backend to verify the connection.
     */
    public static function on_key_update( $old_value, $new_value ) {
        if ( empty( $new_value ) ) {
            update_option( 'finalform_connection_status', 'disconnected' );
            delete_option( 'finalform_connection_error' );
            return;
        }

        if ( $old_value === $new_value && get_option( 'finalform_connection_status' ) === 'connected' ) {
            return;
        }

        if ( strpos( $new_value, 'ff_wc_' ) !== 0 ) {
            update_option( 'finalform_connection_status', 'failed' );
            update_option( 'finalform_connection_error', 'Invalid key format. Keys must start with ff_wc_.' );
            return;
        }

        $domain = parse_url( site_url(), PHP_URL_HOST );
        
        $payload = [
            'key'            => $new_value,
            'domain'         => $domain,
            'wc_version'     => defined( 'WC_VERSION' ) ? WC_VERSION : '',
            'wp_version'     => get_bloginfo( 'version' ),
            'plugin_version' => FINALFORM_WC_VERSION,
        ];

        $webhook_url = '%%FINALFORM_BACKEND_URL%%/webhook/woocommerce/verify'; 
        
        $response = wp_remote_post( $webhook_url, [
            'method'      => 'POST',
            'timeout'     => 20,
            'redirection' => 5,
            'httpversion' => '1.1',
            'blocking'    => true,
            'headers'     => [
                'Content-Type' => 'application/json',
                'Accept'       => 'application/json',
            ],
            'body'        => wp_json_encode( $payload ),
            'cookies'     => []
        ] );

        if ( is_wp_error( $response ) ) {
            update_option( 'finalform_connection_status', 'failed' );
            update_option( 'finalform_connection_error', 'Could not reach Final Form servers: ' . $response->get_error_message() );
            return;
        }

        $http_code = wp_remote_retrieve_response_code( $response );
        $body = wp_remote_retrieve_body( $response );
        $data = json_decode( $body, true );

        if ( $http_code >= 200 && $http_code < 300 && isset( $data['status'] ) && $data['status'] === 'ok' ) {
            update_option( 'finalform_connection_status', 'connected' );
            delete_option( 'finalform_connection_error' );
            if ( ! empty( $data['domain'] ) ) {
                update_option( 'finalform_store_domain', $data['domain'] );
            }
        } else {
            update_option( 'finalform_connection_status', 'failed' );
            $error_msg = ! empty( $data['message'] ) ? $data['message'] : "Server returned HTTP $http_code.";
            update_option( 'finalform_connection_error', $error_msg );
        }
    }

    /**
     * Handle the disconnect action (form POST from admin)
     */
    public static function handle_disconnect() {
        if ( ! current_user_can( 'manage_woocommerce' ) ) {
            wp_die( 'Unauthorized.' );
        }

        check_admin_referer( 'finalform_disconnect_action' );

        $key    = get_option( 'finalform_installation_key', '' );
        $domain = parse_url( site_url(), PHP_URL_HOST );

        // Ping the backend to remove the store from Firestore
        if ( ! empty( $key ) ) {
            $webhook_url = '%%FINALFORM_BACKEND_URL%%/webhook/woocommerce/disconnect';

            wp_remote_post( $webhook_url, [
                'method'      => 'POST',
                'timeout'     => 15,
                'httpversion' => '1.1',
                'blocking'    => true,
                'headers'     => [
                    'Content-Type' => 'application/json',
                    'Accept'       => 'application/json',
                ],
                'body'        => wp_json_encode( [
                    'key'    => $key,
                    'domain' => $domain,
                ] ),
                'cookies'     => [],
            ] );
        }

        // Clear local options
        update_option( 'finalform_installation_key', '' );
        update_option( 'finalform_connection_status', 'disconnected' );
        delete_option( 'finalform_connection_error' );
        delete_option( 'finalform_store_domain' );

        // Redirect back with a success message
        wp_redirect( add_query_arg( [
            'page' => 'finalform-settings',
            'ff_disconnected' => '1',
        ], admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Enqueue admin styles only on our settings page
     */
    public static function enqueue_styles( $hook ) {
        if ( $hook !== 'toplevel_page_finalform-settings' ) {
            return;
        }

        wp_enqueue_style( 'dashicons' );
        
        wp_enqueue_style(
            'finalform-admin',
            FINALFORM_WC_PLUGIN_URL . 'assets/admin.css',
            [],
            FINALFORM_WC_VERSION
        );
    }

    /**
     * Render the settings page
     */
    public static function render_page() {
        $key               = get_option( 'finalform_installation_key', '' );
        $connection_status = get_option( 'finalform_connection_status', 'disconnected' );
        $connection_error  = get_option( 'finalform_connection_error', '' );
        $store_domain      = get_option( 'finalform_store_domain', '' );
        $just_disconnected = isset( $_GET['ff_disconnected'] ) && $_GET['ff_disconnected'] === '1';
        
        $is_connected = ( $connection_status === 'connected' && ! empty( $key ) );
        ?>
        <div class="wrap finalform-settings">
            
            <div class="finalform-header">
                <div class="finalform-header__main">
                    <span class="finalform-logo">⚡</span>
                    <h1>Final Form</h1>
                    <span class="finalform-version">v<?php echo esc_html( FINALFORM_WC_VERSION ); ?></span>
                </div>
            </div>

            <?php if ( $just_disconnected ) : ?>
                <div class="finalform-alert finalform-alert--disconnected" style="margin-bottom: 24px;">
                    <div class="finalform-alert__icon">
                        <span class="dashicons dashicons-yes-alt"></span>
                    </div>
                    <div class="finalform-alert__content">
                        <h3>Disconnected</h3>
                        <p>Your store has been unlinked from Final Form. You can reconnect at any time.</p>
                    </div>
                </div>
            <?php endif; ?>

            <?php if ( $is_connected ) : ?>
                <!-- ═══ CONNECTED STATE ═══ -->
                <div class="finalform-container">
                    <div class="finalform-col-main">

                        <div class="finalform-alert finalform-alert--connected">
                            <div class="finalform-alert__icon">
                                <span class="dashicons dashicons-yes-alt"></span>
                            </div>
                            <div class="finalform-alert__content">
                                <h3>Connected to Final Form</h3>
                                <p>
                                    <?php if ( $store_domain ) : ?>
                                        <strong><?php echo esc_html( $store_domain ); ?></strong> is securely linked.
                                    <?php else : ?>
                                        Your store is securely linked.
                                    <?php endif; ?>
                                    Custom checkout forms are active on your storefront.
                                </p>
                            </div>
                        </div>

                        <div class="finalform-card">
                            <div class="finalform-card__header">
                                <span class="dashicons dashicons-admin-network text-ff-primary"></span>
                                <h2>Connection Details</h2>
                            </div>
                            <div class="finalform-card__body">
                                <table class="finalform-info-table">
                                    <tbody>
                                        <tr>
                                            <td><strong>Store</strong></td>
                                            <td><?php echo esc_html( $store_domain ?: parse_url( site_url(), PHP_URL_HOST ) ); ?></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Status</strong></td>
                                            <td><span class="finalform-badge finalform-badge--green">● Connected</span></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Loader</strong></td>
                                            <td><span class="finalform-badge finalform-badge--green">● Active</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="finalform-card__footer">
                                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display: inline;">
                                    <input type="hidden" name="action" value="finalform_disconnect" />
                                    <?php wp_nonce_field( 'finalform_disconnect_action' ); ?>
                                    <button type="submit" class="finalform-btn-disconnect" onclick="return confirm('Are you sure you want to disconnect this store from Final Form?');">
                                        <span class="dashicons dashicons-no-alt"></span> Disconnect Store
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>

                    <!-- Sidebar -->
                    <div class="finalform-col-side">
                        <div class="finalform-card finalform-card--info">
                            <div class="finalform-card__header">
                                <span class="dashicons dashicons-info-outline"></span>
                                <h2>Environment</h2>
                            </div>
                            <div class="finalform-card__body p-0">
                                <table class="finalform-info-table">
                                    <tbody>
                                        <tr><td><strong>WooCommerce</strong></td><td><?php echo esc_html( defined( 'WC_VERSION' ) ? WC_VERSION : 'N/A' ); ?></td></tr>
                                        <tr><td><strong>WordPress</strong></td><td><?php echo esc_html( get_bloginfo( 'version' ) ); ?></td></tr>
                                        <tr><td><strong>Plugin</strong></td><td><?php echo esc_html( FINALFORM_WC_VERSION ); ?></td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="finalform-card__footer text-center">
                                <a href="https://finalform.app/help" target="_blank" rel="noopener" class="finalform-link">Need assistance?</a>
                            </div>
                        </div>
                    </div>
                </div>

            <?php else : ?>
                <!-- ═══ DISCONNECTED STATE ═══ -->
                <div class="finalform-container">
                    <div class="finalform-col-main">

                        <?php if ( $connection_status === 'failed' ) : ?>
                            <div class="finalform-alert finalform-alert--failed">
                                <div class="finalform-alert__icon">
                                    <span class="dashicons dashicons-no"></span>
                                </div>
                                <div class="finalform-alert__content">
                                    <h3>Connection Failed</h3>
                                    <p>
                                        <?php if ( $connection_error ) : ?>
                                            <?php echo esc_html( $connection_error ); ?>
                                        <?php else : ?>
                                            We couldn't verify your key. Please generate a new key in your <a href="https://app.finalform.app/dashboard/integrations">Final Form dashboard</a> and try again.
                                        <?php endif; ?>
                                    </p>
                                </div>
                            </div>
                        <?php elseif ( ! $just_disconnected ) : ?>
                            <div class="finalform-alert finalform-alert--disconnected">
                                <div class="finalform-alert__icon">
                                    <span class="dashicons dashicons-warning"></span>
                                </div>
                                <div class="finalform-alert__content">
                                    <h3>Not Connected</h3>
                                    <p>Paste your installation key below and click <strong>Save Settings</strong> to link your store.</p>
                                </div>
                            </div>
                        <?php endif; ?>

                        <form method="post" action="options.php" class="finalform-form">
                            <?php settings_fields( 'finalform_settings' ); ?>

                            <div class="finalform-card">
                                <div class="finalform-card__header">
                                    <span class="dashicons dashicons-admin-network text-ff-primary"></span>
                                    <h2>Installation Key</h2>
                                </div>
                                <div class="finalform-card__body">
                                    <p class="description">
                                        Copy the installation key from the WooCommerce setup wizard inside your 
                                        <a href="https://app.finalform.app/dashboard/integrations" target="_blank" rel="noopener">Final Form dashboard</a>
                                        and paste it below.
                                    </p>
                                    <input
                                        type="text"
                                        name="finalform_installation_key"
                                        id="finalform_installation_key"
                                        value="<?php echo esc_attr( $key ); ?>"
                                        class="finalform-input"
                                        placeholder="ff_wc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        autocomplete="off"
                                        spellcheck="false"
                                    />
                                    <?php if ( ! empty( $key ) && $connection_status === 'failed' ) : ?>
                                        <p class="finalform-input-hint finalform-input-hint--error">
                                            <span class="dashicons dashicons-no"></span> This key failed verification. Check the error above.
                                        </p>
                                    <?php endif; ?>
                                </div>
                            </div>

                            <div class="finalform-submit-row">
                                <?php submit_button( 'Save Settings', 'primary', 'submit', false, [ 'class' => 'finalform-btn-primary' ] ); ?>
                            </div>
                        </form>
                    </div>

                    <!-- Sidebar -->
                    <div class="finalform-col-side">
                        <div class="finalform-card finalform-card--info">
                            <div class="finalform-card__header">
                                <span class="dashicons dashicons-info-outline"></span>
                                <h2>Environment</h2>
                            </div>
                            <div class="finalform-card__body p-0">
                                <table class="finalform-info-table">
                                    <tbody>
                                        <tr><td><strong>Domain</strong></td><td><?php echo esc_html( parse_url( site_url(), PHP_URL_HOST ) ); ?></td></tr>
                                        <tr><td><strong>WooCommerce</strong></td><td><?php echo esc_html( defined( 'WC_VERSION' ) ? WC_VERSION : 'N/A' ); ?></td></tr>
                                        <tr><td><strong>WordPress</strong></td><td><?php echo esc_html( get_bloginfo( 'version' ) ); ?></td></tr>
                                        <tr><td><strong>Plugin</strong></td><td><?php echo esc_html( FINALFORM_WC_VERSION ); ?></td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="finalform-card__footer text-center">
                                <a href="https://finalform.app/help" target="_blank" rel="noopener" class="finalform-link">Need assistance?</a>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

        </div>
        <?php
    }
}

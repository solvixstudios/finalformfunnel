<?php
/**
 * Final Form WooCommerce — Settings Page
 *
 * Renders the admin settings page where the store owner pastes their
 * installation key and manages the connection to Final Form.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FinalForm_WC_Settings {

    public static function init() {
        add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
        add_action( 'admin_init', [ __CLASS__, 'register_settings' ] );
        add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_styles' ] );
    }

    /**
     * Register the admin menu item under WooCommerce
     */
    public static function register_menu() {
        add_submenu_page(
            'woocommerce',
            'Final Form',
            'Final Form',
            'manage_woocommerce',
            'finalform-settings',
            [ __CLASS__, 'render_page' ]
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
        register_setting( 'finalform_settings', 'finalform_loader_active', [
            'type'              => 'boolean',
            'sanitize_callback' => 'rest_sanitize_boolean',
        ] );
    }

    /**
     * Enqueue admin styles only on our settings page
     */
    public static function enqueue_styles( $hook ) {
        if ( $hook !== 'woocommerce_page_finalform-settings' ) {
            return;
        }
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
        $key              = get_option( 'finalform_installation_key', '' );
        $loader_active    = get_option( 'finalform_loader_active', false );
        $connection_status = get_option( 'finalform_connection_status', 'disconnected' );
        $store_domain     = get_option( 'finalform_store_domain', site_url() );

        $is_connected = ( $connection_status === 'connected' && ! empty( $key ) );
        ?>
        <div class="wrap finalform-settings">
            <h1>
                <span class="finalform-logo">⚡</span>
                Final Form
                <span class="finalform-version">v<?php echo esc_html( FINALFORM_WC_VERSION ); ?></span>
            </h1>

            <?php if ( $is_connected ) : ?>
                <div class="finalform-status finalform-status--connected">
                    <span class="finalform-status__dot"></span>
                    Connected to Final Form
                </div>
            <?php else : ?>
                <div class="finalform-status finalform-status--disconnected">
                    <span class="finalform-status__dot"></span>
                    Not connected
                </div>
            <?php endif; ?>

            <form method="post" action="options.php">
                <?php settings_fields( 'finalform_settings' ); ?>

                <div class="finalform-card">
                    <h2>Installation Key</h2>
                    <p class="description">
                        Paste the installation key from your
                        <a href="https://app.finalform.app/dashboard/integrations" target="_blank" rel="noopener">Final Form dashboard</a>.
                    </p>
                    <input
                        type="text"
                        name="finalform_installation_key"
                        id="finalform_installation_key"
                        value="<?php echo esc_attr( $key ); ?>"
                        class="finalform-input"
                        placeholder="ff_wc_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        autocomplete="off"
                    />
                </div>

                <div class="finalform-card">
                    <h2>Form Loader</h2>
                    <p class="description">
                        When enabled, the Final Form script will be injected on your product pages,
                        replacing the default WooCommerce add-to-cart form with your custom form.
                    </p>
                    <label class="finalform-toggle">
                        <input
                            type="checkbox"
                            name="finalform_loader_active"
                            value="1"
                            <?php checked( $loader_active ); ?>
                        />
                        <span class="finalform-toggle__slider"></span>
                        <span class="finalform-toggle__label">
                            <?php echo $loader_active ? 'Active' : 'Inactive'; ?>
                        </span>
                    </label>
                </div>

                <?php submit_button( 'Save Settings' ); ?>
            </form>

            <?php if ( ! empty( $key ) ) : ?>
                <div class="finalform-card">
                    <h2>Test Connection</h2>
                    <p class="description">
                        Verify that your store can communicate with Final Form.
                    </p>
                    <button type="button" id="finalform-test-connection" class="button button-secondary">
                        Test Connection
                    </button>
                    <span id="finalform-test-result" style="margin-left: 12px;"></span>
                </div>

                <script>
                    document.getElementById('finalform-test-connection').addEventListener('click', async function() {
                        const btn = this;
                        const result = document.getElementById('finalform-test-result');
                        btn.disabled = true;
                        result.textContent = 'Testing...';
                        result.style.color = '#666';

                        try {
                            const response = await fetch('<?php echo esc_url( rest_url( 'finalform/v1/verify' ) ); ?>', {
                                headers: {
                                    'X-FinalForm-Key': '<?php echo esc_js( $key ); ?>',
                                    'X-WP-Nonce': '<?php echo wp_create_nonce( 'wp_rest' ); ?>'
                                }
                            });
                            const data = await response.json();

                            if (response.ok && data.status === 'ok') {
                                result.textContent = '✅ Connection successful!';
                                result.style.color = '#16a34a';
                            } else {
                                result.textContent = '❌ ' + (data.message || 'Connection failed');
                                result.style.color = '#dc2626';
                            }
                        } catch (err) {
                            result.textContent = '❌ Network error: ' + err.message;
                            result.style.color = '#dc2626';
                        } finally {
                            btn.disabled = false;
                        }
                    });
                </script>
            <?php endif; ?>

            <div class="finalform-card finalform-card--info">
                <h2>Store Info</h2>
                <table class="finalform-info-table">
                    <tr>
                        <td><strong>Domain</strong></td>
                        <td><?php echo esc_html( parse_url( site_url(), PHP_URL_HOST ) ); ?></td>
                    </tr>
                    <tr>
                        <td><strong>WooCommerce</strong></td>
                        <td><?php echo esc_html( defined( 'WC_VERSION' ) ? WC_VERSION : 'N/A' ); ?></td>
                    </tr>
                    <tr>
                        <td><strong>Plugin Version</strong></td>
                        <td><?php echo esc_html( FINALFORM_WC_VERSION ); ?></td>
                    </tr>
                </table>
            </div>
        </div>
        <?php
    }
}

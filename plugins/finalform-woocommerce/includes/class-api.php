<?php
/**
 * Final Form WooCommerce — REST API Endpoints
 *
 * Provides REST endpoints that the Final Form backend uses to:
 * 1. Verify the connection (GET /finalform/v1/verify)
 * 2. Fetch WooCommerce products (GET /finalform/v1/products)
 *
 * All endpoints validate the installation key via X-FinalForm-Key header.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class FinalForm_WC_API {

    /** @var int Rate limit: max requests per minute per IP */
    const RATE_LIMIT = 30;

    public static function init() {
        add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
    }

    /**
     * Register REST routes
     */
    public static function register_routes() {
        register_rest_route( 'finalform/v1', '/verify', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_verify' ],
            'permission_callback' => [ __CLASS__, 'validate_key' ],
        ] );

        register_rest_route( 'finalform/v1', '/products', [
            'methods'             => 'GET',
            'callback'            => [ __CLASS__, 'handle_products' ],
            'permission_callback' => [ __CLASS__, 'validate_key' ],
            'args'                => [
                'page'     => [
                    'default'           => 1,
                    'sanitize_callback' => 'absint',
                ],
                'per_page' => [
                    'default'           => 50,
                    'sanitize_callback' => 'absint',
                ],
            ],
        ] );

        register_rest_route( 'finalform/v1', '/orders', [
            'methods'             => 'POST',
            'callback'            => [ __CLASS__, 'handle_create_order' ],
            'permission_callback' => [ __CLASS__, 'validate_key' ],
        ] );
    }

    /**
     * Validate the installation key from the request header
     *
     * @param WP_REST_Request $request
     * @return bool|WP_Error
     */
    public static function validate_key( $request ) {
        // Rate limiting
        $ip = self::get_client_ip();
        $transient_key = 'finalform_rate_' . md5( $ip );
        $count = (int) get_transient( $transient_key );

        if ( $count >= self::RATE_LIMIT ) {
            return new WP_Error(
                'rate_limited',
                'Too many requests. Please try again later.',
                [ 'status' => 429 ]
            );
        }

        set_transient( $transient_key, $count + 1, 60 ); // 60 seconds window

        // Key validation
        $provided_key = $request->get_header( 'X-FinalForm-Key' );
        $stored_key   = get_option( 'finalform_installation_key', '' );

        if ( empty( $stored_key ) ) {
            return new WP_Error(
                'no_key_configured',
                'No installation key configured. Please add your key in Final Form settings.',
                [ 'status' => 403 ]
            );
        }

        if ( empty( $provided_key ) || ! hash_equals( $stored_key, $provided_key ) ) {
            return new WP_Error(
                'invalid_key',
                'Invalid installation key.',
                [ 'status' => 401 ]
            );
        }

        return true;
    }

    /**
     * GET /finalform/v1/verify
     * Returns store info to confirm the plugin is alive and the key is valid.
     */
    public static function handle_verify( $request ) {
        // Since this endpoint requires a valid key (validate_key), reaching here
        // means the connection from the App was successful. We mark it locally.
        update_option( 'finalform_connection_status', 'connected' );

        return rest_ensure_response( [
            'status'     => 'ok',
            'domain'     => parse_url( site_url(), PHP_URL_HOST ),
            'site_url'   => site_url(),
            'site_name'  => get_bloginfo( 'name' ),
            'wc_version' => defined( 'WC_VERSION' ) ? WC_VERSION : null,
            'plugin_version' => FINALFORM_WC_VERSION,
            'loader_active'  => (bool) get_option( 'finalform_loader_active', false ),
        ] );
    }

    /**
     * GET /finalform/v1/products
     * Returns paginated WooCommerce products in a format compatible with Final Form.
     */
    public static function handle_products( $request ) {
        $page     = max( 1, $request->get_param( 'page' ) );
        $per_page = min( 250, max( 1, $request->get_param( 'per_page' ) ) );

        $args = [
            'status'   => 'publish',
            'limit'    => $per_page,
            'page'     => $page,
            'orderby'  => 'name',
            'order'    => 'ASC',
            'return'   => 'objects',
        ];

        $products_query = wc_get_products( $args );

        // Get total count for pagination
        $count_args = [
            'status' => 'publish',
            'limit'  => -1,
            'return' => 'ids',
        ];
        $total = count( wc_get_products( $count_args ) );

        $products = [];
        foreach ( $products_query as $product ) {
            $products[] = self::format_product( $product );
        }

        return rest_ensure_response( [
            'products'   => $products,
            'total'      => $total,
            'page'       => $page,
            'per_page'   => $per_page,
            'total_pages' => ceil( $total / $per_page ),
        ] );
    }

    /**
     * POST /finalform/v1/orders
     * Creates a native WooCommerce order from a Final Form submission.
     */
    public static function handle_create_order( $request ) {
        $params = $request->get_json_params();

        if ( empty( $params ) ) {
            return new WP_Error( 'invalid_data', 'No order data provided.', [ 'status' => 400 ] );
        }

        try {
            // Create a new empty order
            $order = wc_create_order();

            // 1. Customer Details (Billing/Shipping)
            $address = [
                'first_name' => sanitize_text_field( $params['firstName'] ?? 'Guest' ),
                'last_name'  => sanitize_text_field( $params['lastName'] ?? '.' ),
                'address_1'  => sanitize_text_field( $params['address'] ?? 'N/A' ),
                'city'       => sanitize_text_field( $params['commune'] ?? $params['wilaya'] ?? 'Algeria' ),
                'state'      => sanitize_text_field( $params['wilaya'] ?? '' ),
                'country'    => 'DZ',
                'email'      => sanitize_email( $params['email'] ?? '' ),
                'phone'      => sanitize_text_field( $params['phone'] ?? '' ),
            ];

            $order->set_address( $address, 'billing' );
            $order->set_address( $address, 'shipping' );

            // 2. Add Line Items
            // params.items = [{ title, quantity, price, variantId, sku }]
            if ( ! empty( $params['items'] ) && is_array( $params['items'] ) ) {
                foreach ( $params['items'] as $item ) {
                    $product_id = isset( $item['productId'] ) ? (int) $item['productId'] : 0;
                    $variant_id = isset( $item['variantId'] ) ? (int) $item['variantId'] : 0;
                    $quantity   = isset( $item['quantity'] ) ? (int) $item['quantity'] : 1;

                    // Support adding by ID if it maps directly to a WP object, otherwise add as generic fee/item
                    if ( $variant_id > 0 ) {
                        $product = wc_get_product( $variant_id );
                    } elseif ( $product_id > 0 ) {
                        $product = wc_get_product( $product_id );
                    } else {
                        $product = null;
                    }

                    if ( $product ) {
                        $item_id = $order->add_product( $product, $quantity );
                        // Override title if variant name differs or if it's an offer bundle
                        $order_item = $order->get_item( $item_id );
                        if ( isset($item['title']) ) {
                            $order_item->set_name( sanitize_text_field( $item['title'] ) );
                            $order_item->save();
                        }
                    } else {
                        // Fallback generic line item if IDs somehow don't map (or deleted product)
                        $item_obj = new WC_Order_Item_Product();
                        $item_obj->set_name( sanitize_text_field( $item['title'] ?? 'Generic Product' ) );
                        $item_obj->set_quantity( $quantity );
                        $item_obj->set_subtotal( (float) ( $item['price'] ?? 0 ) * $quantity );
                        $item_obj->set_total( (float) ( $item['price'] ?? 0 ) * $quantity );
                        $order->add_item( $item_obj );
                    }
                }
            }

            // 3. Add Shipping
            $shipping_cost = isset( $params['shippingPrice'] ) ? (float) $params['shippingPrice'] : 0;
            if ( $shipping_cost > 0 ) {
                $shipping_title = ( isset( $params['shippingType'] ) && $params['shippingType'] === 'desk' ) ? 'Stop Desk' : 'Home Delivery';
                
                $item_fee = new WC_Order_Item_Shipping();
                $item_fee->set_method_title( $shipping_title );
                $item_fee->set_total( $shipping_cost );
                $order->add_item( $item_fee );
            }

            // 4. Add Order Notes
            if ( ! empty( $params['note'] ) ) {
                $order->set_customer_note( sanitize_text_field( $params['note'] ) );
            }

            // 5. Custom Meta Data
            $order->update_meta_data( 'is_finalform', 'yes' );
            if ( ! empty( $params['formId'] ) ) {
                $order->update_meta_data( 'finalform_id', sanitize_text_field( $params['formId'] ) );
            }
            if ( ! empty( $params['wilaya'] ) ) {
                $order->update_meta_data( 'Wilaya', sanitize_text_field( $params['wilaya'] ) );
            }
            if ( ! empty( $params['commune'] ) ) {
                $order->update_meta_data( 'Commune', sanitize_text_field( $params['commune'] ) );
            }

            // 6. Calculate Totals & Save
            $order->calculate_totals();
            
            // Allow WooCommerce status auto-transitions or force to 'processing'
            $order->update_status( 'processing', 'Imported from Final Form checkout.' );

            return rest_ensure_response( [
                'status'   => 'success',
                'order_id' => $order->get_id(),
                'message'  => 'Order created successfully.',
            ] );

        } catch ( Exception $e ) {
            return new WP_Error( 'creation_failed', $e->getMessage(), [ 'status' => 500 ] );
        }
    }

    /**
     * Format a WC_Product into the shape Final Form expects
     * (compatible with the Shopify product shape for adapter consistency)
     */
    private static function format_product( $product ) {
        $variants = [];
        $images   = [];

        if ( $product->is_type( 'variable' ) ) {
            $variation_ids = $product->get_children();
            $position = 1;
            foreach ( $variation_ids as $var_id ) {
                $variation = wc_get_product( $var_id );
                if ( ! $variation ) continue;

                $attributes = $variation->get_attributes();
                $title_parts = [];
                foreach ( $attributes as $attr_name => $attr_value ) {
                    $title_parts[] = ucfirst( str_replace( '-', ' ', $attr_value ) );
                }

                $variants[] = [
                    'id'               => $variation->get_id(),
                    'product_id'       => $product->get_id(),
                    'title'            => implode( ' / ', $title_parts ) ?: $variation->get_name(),
                    'price'            => $variation->get_price(),
                    'sku'              => $variation->get_sku() ?: null,
                    'position'         => $position++,
                    'compare_at_price' => $variation->get_regular_price() !== $variation->get_sale_price()
                        ? $variation->get_regular_price()
                        : null,
                ];
            }
        } else {
            // Simple product — single "default" variant
            $variants[] = [
                'id'               => $product->get_id(),
                'product_id'       => $product->get_id(),
                'title'            => 'Default',
                'price'            => $product->get_price(),
                'sku'              => $product->get_sku() ?: null,
                'position'         => 1,
                'compare_at_price' => $product->get_regular_price() !== $product->get_sale_price()
                    ? $product->get_regular_price()
                    : null,
            ];
        }

        // Product images
        $image_id = $product->get_image_id();
        if ( $image_id ) {
            $images[] = [
                'id'         => $image_id,
                'product_id' => $product->get_id(),
                'src'        => wp_get_attachment_url( $image_id ),
                'alt'        => get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ?: null,
            ];
        }

        // Gallery images
        foreach ( $product->get_gallery_image_ids() as $gallery_id ) {
            $images[] = [
                'id'         => $gallery_id,
                'product_id' => $product->get_id(),
                'src'        => wp_get_attachment_url( $gallery_id ),
                'alt'        => get_post_meta( $gallery_id, '_wp_attachment_image_alt', true ) ?: null,
            ];
        }

        $main_image = ! empty( $images ) ? $images[0] : null;

        return [
            'id'           => $product->get_id(),
            'title'        => $product->get_name(),
            'body_html'    => $product->get_description(),
            'vendor'       => '', // WooCommerce doesn't have vendor by default
            'product_type' => implode( ', ', wp_get_post_terms( $product->get_id(), 'product_cat', [ 'fields' => 'names' ] ) ),
            'handle'       => $product->get_slug(),
            'status'       => $product->get_status(),
            'tags'         => implode( ', ', wp_get_post_terms( $product->get_id(), 'product_tag', [ 'fields' => 'names' ] ) ),
            'variants'     => $variants,
            'images'       => $images,
            'image'        => $main_image,
            'created_at'   => $product->get_date_created() ? $product->get_date_created()->format( 'c' ) : '',
            'updated_at'   => $product->get_date_modified() ? $product->get_date_modified()->format( 'c' ) : '',
            'price'        => $product->get_price(),
        ];
    }

    /**
     * Get client IP for rate limiting
     */
    private static function get_client_ip() {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ( $headers as $header ) {
            if ( ! empty( $_SERVER[ $header ] ) ) {
                $ips = explode( ',', $_SERVER[ $header ] );
                return trim( $ips[0] );
            }
        }

        return '127.0.0.1';
    }
}

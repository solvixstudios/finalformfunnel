<?php
/**
 * WooCommerce Stubs for IDE autocompletion
 * This file is NOT loaded at runtime — it only helps the IDE
 * recognize WooCommerce functions and constants.
 *
 * @noinspection ALL
 */

// ─── WooCommerce Constants ──────────────────────────────────────────────────

define('WC_VERSION', '');

// ─── WooCommerce Product Functions ──────────────────────────────────────────

/**
 * @param array $args
 * @return WC_Product[]|int[]
 */
function wc_get_products($args = []) { return []; }

/**
 * @param int|WC_Product $product_id
 * @return WC_Product|null|false
 */
function wc_get_product($product_id) { return null; }

// ─── WooCommerce Conditional Tags ───────────────────────────────────────────

/**
 * @return bool
 */
function is_product() { return false; }

/**
 * @return bool
 */
function is_shop() { return false; }

/**
 * @return bool
 */
function is_product_category() { return false; }

-- Database indexes for performance optimization
-- Run this on your PostgreSQL database

-- Index for products
CREATE INDEX IF NOT EXISTS idx_product_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_product_slug ON products(slug);

-- Index for variants
CREATE INDEX IF NOT EXISTS idx_variant_stock ON variants(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_variant_product ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variant_price ON variants(price);

-- Index for cart items
CREATE INDEX IF NOT EXISTS idx_cartitem_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cartitem_variant ON cart_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_cartitem_product ON cart_items(product_id);

-- Index for carts
CREATE INDEX IF NOT EXISTS idx_cart_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_customer ON carts(customer_id);

-- Index for product images
CREATE INDEX IF NOT EXISTS idx_productimage_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_productimage_primary ON product_images(is_primary);

-- Index for orders
CREATE INDEX IF NOT EXISTS idx_order_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON orders(created_at);

-- Index for order items
CREATE INDEX IF NOT EXISTS idx_orderitem_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orderitem_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orderitem_variant ON order_items(variant_id);

-- Index for payments
CREATE INDEX IF NOT EXISTS idx_payment_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_provider_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payments(status);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('products', 'variants', 'cart_items', 'carts', 'product_images', 'orders', 'order_items', 'payments')
ORDER BY tablename, indexname;

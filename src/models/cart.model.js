// src/models/cart.model.js
import { db } from '../db/index.js'

export const addToCart = async ({ user_id, product_variant_id, quantity = 1 }) => {
    try {
        // Check if item already exists in cart
        const [existing] = await db().query(`SELECT * FROM cart WHERE user_id = ? AND product_variant_id = ?`,[user_id, product_variant_id])

        if (existing.length > 0) {
            // Update quantity if item exists
            const newQuantity = existing[0].quantity + quantity
            const [result] = await db().query(`
                UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND product_variant_id = ?`,
                [newQuantity, user_id, product_variant_id]
            )
            return { updated: true, cartId: existing[0].id, quantity: newQuantity }
        } else {
            // Add new item to cart
            const [result] = await db().query(`
                INSERT INTO cart (user_id, product_variant_id, quantity) 
                VALUES (?, ?, ?)`,
                [user_id, product_variant_id, quantity]
            )
            return { added: true, cartId: result.insertId, quantity }
        }
    } catch (error) {
        throw error
    }
}

export const getCartByUserId = async (user_id) => {
    const [rows] = await db().query(`
        SELECT 
            c.*,
            pv.variant_name,
            pv.price,
            pv.stock,
            pv.description as variant_description,
            p.name as product_name,
            p.description as product_description,
            cat.name as category_name,
            sc.name as subcategory_name
        FROM cart c
        JOIN product_variants pv ON c.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        LEFT JOIN categories cat ON p.category_id = cat.id
        LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC`,
        [user_id]
    )
    return rows
}

export const updateCartQuantity = async (user_id, product_variant_id, quantity) => {
    if (quantity <= 0) {
        return await removeFromCart(user_id, product_variant_id)
    }
    
    const [result] = await db().query(`
        UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND product_variant_id = ?`,
        [quantity, user_id, product_variant_id]
    )
    return result.affectedRows
}

export const removeFromCart = async (user_id, product_variant_id) => {
    const [result] = await db().query(`
        DELETE FROM cart WHERE user_id = ? AND product_variant_id = ?`,
        [user_id, product_variant_id]
    )
    return result.affectedRows
}

export const clearCart = async (user_id) => {
    const [result] = await db().query('DELETE FROM cart WHERE user_id = ?', [user_id])
    return result.affectedRows
}

export const getCartItemCount = async (user_id) => {
    const [rows] = await db().query(`
        SELECT SUM(quantity) as total_items FROM cart WHERE user_id = ?`,
        [user_id]
    )
    return rows[0]?.total_items || 0
}

export const getCartTotal = async (user_id) => {
    const [rows] = await db().query(`
        SELECT 
            SUM(c.quantity * pv.price) as subtotal,
            SUM(c.quantity) as total_items
        FROM cart c
        JOIN product_variants pv ON c.product_variant_id = pv.id
        WHERE c.user_id = ?`,
        [user_id]
    )
    return {
        subtotal: rows[0]?.subtotal || 0,
        total_items: rows[0]?.total_items || 0
    }
}

export const validateCartStock = async (user_id) => {
    const [rows] = await db().query(`
        SELECT 
            c.quantity,
            pv.stock,
            pv.variant_name,
            p.name as product_name
        FROM cart c
        JOIN product_variants pv ON c.product_variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE c.user_id = ? AND c.quantity > pv.stock`,
        [user_id]
    )
    return rows
}

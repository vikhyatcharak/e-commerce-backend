import { db } from '../db/index.js'

export const addOrderItem = async ({ order_id, product_variant_id, quantity, price }) => {
  const [result] = await db().query(
    `INSERT INTO order_items (order_id, product_variant_id, quantity, price)VALUES (?, ?, ?, ?)`,
    [order_id, product_variant_id, quantity, price])//price=quantity*price of product_variant
  return result.insertId
}
//submit before payment so quantity doesn't change so no need to update regularly
export const getItemsByOrderId = async (order_id) => {
  const [rows] = await db().query(`
    SELECT 
      oi.*, 
      p.name AS product_name, 
      p.sku, 
      p.hsn, 
      p.tax 
    FROM order_items oi
    LEFT JOIN product_variants pv ON oi.product_variant_id = pv.id
    LEFT JOIN products p ON pv.product_id = p.id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at DESC
  `, [order_id])

  return rows
}


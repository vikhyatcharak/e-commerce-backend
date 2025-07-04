import { db } from '../db/index.js'

export const addOrderItem = async ({order_id, product_variant_id, quantity, price }) => {
  const [result] = await db().query(
    `INSERT INTO order_items (order_id, product_variant_id, quantity, price)VALUES (?, ?, ?, ?)`,
    [order_id, product_variant_id, quantity, price] )//price=quantity*price of product_variant
  return result.insertId
}
//submit before payment so quantity doesn't change so no need to update regularly
export const getItemsByOrderId = async (order_id) => {//the current order made by user
  const [rows] = await db().query('SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at DESC', [order_id])
  return rows
}

import { db } from '../db/index.js'
export const createOrder = async ({ user_id, customer_address_id, total, tax, discount, final_total, coupon_id, payment_mode, payment_status, delivery_status
}) => {
  const [result] = await db().query(
    `INSERT INTO orders (user_id, customer_address_id, total, tax, discount, final_total, coupon_id, payment_mode, payment_status, delivery_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user_id, customer_address_id, total, tax, discount, final_total, coupon_id, payment_mode, payment_status, delivery_status]
  )
  return result.insertId
}

export const getAllOrders = async () => {
  const [rows] = await db().query(`SELECT * FROM orders ORDER BY created_at DESC`)
  return rows
}
export const getOrderById = async (id) => {
  const [rows] = await db().query('SELECT * FROM orders WHERE id = ?', [id])
  return rows[0]
}

export const getOrdersByUserId = async (user_id) => {
  const [rows] = await db().query('SELECT * FROM orders WHERE user_id = ?', [user_id])
  return rows
}

export const updateOrderPaymentStatus = async (id, { payment_status }) => {
  const [result] = await db().query(`UPDATE orders SET payment_status= ? WHERE id = ?`, [payment_status, id])
  return result.affectedRows
}

export const updateOrderDeliveryStatus = async (id, { delivery_status }) => {
  const [result] = await db().query(`UPDATE orders SET payment_status= ? WHERE id = ?`, [delivery_status, id])
  return result.affectedRows
}

export async function updateOrderShippingDetails(orderId, shippingData) {
  let fields = []
  let params = []

  for (const [key, value] of Object.entries(shippingData)) {
    fields.push(`${key} = ?`)
    params.push(value)
  }
  params.push(orderId)

  const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`
  const [result] = await db().query(sql, params)
  return result.affectedRows
}

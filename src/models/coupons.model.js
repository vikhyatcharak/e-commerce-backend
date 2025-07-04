import { db } from "../db/index.js"
export const createCoupon = async ({ code, description, flat_discount, percentage_discount, quantity, valid_from_date, valid_to_date, start_time, end_time }) => {
  const [result] = await db().query(
    `INSERT INTO coupons (code, description, flat_discount, percentage_discount, quantity, valid_from_date, valid_to_date, start_time, end_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, description, flat_discount, percentage_discount, quantity, valid_from_date, valid_to_date, start_time, end_time]
  )
  return result.insertId
}
export const updateCoupon = async (id, updateFields) => {
  let setClauses = []
  let params = []

  for (const [key, value] of Object.entries(updateFields)) {
    setClauses.push(`${key} = ?`)
    params.push(value)
  }
  params.push(id)

  const sql = `UPDATE coupons SET ${setClauses.join(', ')} WHERE id = ?`
  const [result] = await db().query(sql, params)
  return result.affectedRows
}


export const getCouponByCode = async (code) => {
  const [rows] = await db().query('SELECT * FROM coupons WHERE code = ?', [code])
  return rows[0]
}
export const getCouponById = async (id) => {
  const [rows] = await db().query('SELECT * FROM coupons WHERE id = ?', [id])
  return rows[0]
}

export const getAllCoupons = async () => {
  const [rows] = await db().query('SELECT * FROM coupons ORDER BY created_at DESC')
  return rows
}

export const deleteCoupon = async (id) => {// delete coupon after end_time and valid_to_date
  const [result] = await db().query('DELETE FROM coupons WHERE id = ?', [id])
  return result.affectedRows
}

export const getPaginatedCoupons = async ({ page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' }) => {
  const offset = (page - 1) * limit
  const params = []
  let whereClause = `WHERE 1`

  if (search) {
    whereClause += ` AND name LIKE ?`
    params.push(`%${search}%`)
  }
  
  const allowedSortBy = ['code','flat_discount','percentage_discount','quantity', 'created_at', 'updated_at']
  const allowedSortOrder = ['ASC', 'DESC']
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at'
  const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  const [data] = await db().query(
    `SELECT * FROM coupons ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  )

  const [[{ total }]] = await db().query(
    `SELECT COUNT(*) AS total FROM coupons ${whereClause}`,
    params
  )

  return { data, total }
}

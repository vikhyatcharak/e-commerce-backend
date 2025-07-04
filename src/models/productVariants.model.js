import { db } from '../db/index.js'
export const createProductVariant = async ({ product_id, variant_name, description, price, stock }) => {
  const [result] = await db().query(
    `INSERT INTO product_variants (product_id, variant_name, description, price, stock) VALUES (?, ?, ?, ?, ?)`,
    [product_id, variant_name, description, price, stock])
  return result.insertId
}

export const getProductVariantsByProductId = async (product_id) => {
  const [rows] = await db().query('SELECT * FROM product_variants WHERE product_id = ? ORDER BY created_at DESC', [product_id])
  return rows
}

export const getProductVariantById = async (id) => {
  const [rows] = await db().query(`SELECT * FROM product_variants WHERE id=?`, [id])
  return rows[0]
}

export const updateProductVariant = async (id, updateData) => {
  let fields = []
  let params = []

  for (const [key, value] of Object.entries(updateData)) {
    fields.push(`${key} = ?`)
    params.push(value)
  }
  params.push(id)

  const sql = `UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?`
  const [result] = await db().query(sql, params)
  return result.affectedRows
}

export const updateStock = async (id, { stock }) => {
  const [result] = await db().query(`UPDATE product_variants SET stock=? WHERE id=?`, [stock, id])
  return result.affectedRows
}

export const updatePrice = async (id, { price }) => {
  const [result] = await db().query(`UPDATE product_variants SET price=? WHERE id=?`, [price, id])
  return result.affectedRows
}

export const deleteProductVariant = async (id) => {
  const [result] = await db().query('DELETE FROM product_variants WHERE id = ?', [id])
  return result.affectedRows
}


export const getPaginatedVariantsByProductId = async ({ product_id, page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' }) => {
  const offset = (page - 1) * limit
  const params = [product_id]
  let whereClause = `product_id = ?`

  if (search) {
    whereClause += ` AND variant_name LIKE ?`
    params.push(`%${search}%`)
  }

  const allowedSortBy = ['variant_name', 'price', 'stock', 'created_at', 'updated_at']
  const allowedSortOrder = ['ASC', 'DESC']
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at'
  const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  const [data] = await db().query(
    `SELECT * FROM product_variants WHERE ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  )

  const [[{ total }]] = await db().query(
    `SELECT COUNT(*) AS total FROM product_variants WHERE ${whereClause}`,
    params
  )

  return { data, total }
}

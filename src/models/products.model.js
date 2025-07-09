import { db } from '../db/index.js'

export const createProduct = async (name, sku, hsn, return_period, product_type, tax, discount, description, category_id, subcategory_id) => {
  const [result] = await db().query(
    `INSERT INTO products (name, sku, hsn, return_period, product_type, tax, discount, description, category_id, subcategory_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, sku, hsn, return_period, product_type, tax, discount, description, category_id, subcategory_id]
  )
  return result.insertId
}

export const getProductById = async (id) => {
  const [rows] = await db().query('SELECT * FROM products WHERE id = ?', [id])
  return rows[0]
}


export const getAllProducts = async () => {
  const [rows] = await db().query('SELECT * FROM products ORDER BY created_at DESC')
  return rows
}

export const getProductsByCategoryId = async (category_id) => {
  const [rows] = await db().query(`SELECT * FROM products WHERE category_id=? ORDER BY created_at DESC`, [category_id])
  return rows
}

export const getProductsBySubcategoryId = async (subcategory_id) => {
  const [rows] = await db().query(`SELECT * FROM products WHERE subcategory_id=? ORDER BY created_at DESC`, [subcategory_id])
  return rows
}

export const updateProduct = async (id, updateData) => {
  let fields = []
  let params = []

  for (const [key, value] of Object.entries(updateData)) {
    fields.push(`${key} = ?`)
    params.push(value)
  }
  params.push(id)

  const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`
  const [result] = await db().query(sql, params)
  return result.affectedRows
}

export const deleteProduct = async (id) => {
  const [result] = await db().query('DELETE FROM products WHERE id = ?', [id])
  return result.affectedRows
}


export const getPaginatedProducts = async ({ page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC', category_id, subcategory_id, }) => {
  const offset = (page - 1) * limit
  const params = []
  let whereClause = ''

  // Add filters
  if (search) {
    whereClause += 'AND name LIKE ? '
    params.push(`%${search}%`)
  }

  if (category_id) {
    whereClause += 'AND category_id = ? '
    params.push(Number(category_id))
  }

  if (subcategory_id) {
    whereClause += 'AND subcategory_id = ? '
    params.push(Number(subcategory_id))
  }

  // Whitelist safe values for sorting
  const allowedSortBy = ['name', 'created_at', 'updated_at']
  const allowedSortOrder = ['ASC', 'DESC']
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at'
  const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  // Fetch filtered, sorted, paginated products

  const [data] = await db().query(
    `SELECT * FROM products WHERE 1=1 ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  )

  // Get total count for pagination
  const [[{ total }]] = await db().query(
    `SELECT COUNT(*) as total FROM products WHERE 1=1 ${whereClause}`,
    params
  )

  return { data, total }
}



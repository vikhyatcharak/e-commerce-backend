import { db } from "../db/index.js"

export const createCategory= async (name )=>{
    const [result]= await db().query (`INSERT INTO categories(name) VALUES(?)`, [name])
    return result.insertId
}

export const updateCategory= async(id,{name})=>{
    const [result]= await db().query(`UPDATE categories SET name=? WHERE id=?`,[name,id])
    return result.affectedRows
}

export const getAllCategories = async()=>{
    const [rows]=await db().query(`SELECT * FROM categories ORDER BY created_at DESC`)
    return rows
}


export const getCategoryById = async(id)=>{
    const [rows]= await db().query(`SELECT * FROM categories WHERE id=?`,[id])
    return rows[0]
}

export const deleteCategory = async (id) => {
    const [result]= await db().query('DELETE FROM categories WHERE id = ?', [id])
    return result.affectedRows
}

export const getPaginatedCategories = async ({page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' }) => {
  const offset = (page - 1) * limit
  const params = []
  let whereClause = `WHERE 1`

  if (search) {
    whereClause += ` AND name LIKE ?`
    params.push(`%${search}%`)
  }

  const allowedSortBy = ['name', 'created_at', 'updated_at']
  const allowedSortOrder = ['ASC', 'DESC']
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at'
  const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  const [data] = await db().query(
    `SELECT * FROM categories ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  )

  const [[{ total }]] = await db().query(
    `SELECT COUNT(*) AS total FROM categories ${whereClause}`,
    params
  )

  return { data, total }
}

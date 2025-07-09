import {db} from "../db/index.js"

export const createSubcategory= async(category_id,name)=>{
    const [result]= await db().query(`INSERT INTO subcategories (category_id,name) VALUES(?,?)`,[category_id,name])
    return result.insertId
}

export const getSubcategoryById = async(id)=>{
    const [rows]= await db().query(`SELECT * FROM subcategories WHERE id=?`,[id])
    return rows[0]
}

export const getAllSubcategoriesByCategoryId = async(category_id)=>{
    const [rows]=await db().query(`SELECT * FROM subcategories WHERE category_id=? ORDER BY created_at DESC`,[category_id])
    return rows
}

export const updateSubcategory= async(id,{name})=>{
    const [result]= await db().query(`UPDATE subcategories SET name=? WHERE id=?`,[name,id])
    return result.affectedRows
}

export const deleteSubcategory = async (id) => {
    const [result]= await db().query('DELETE FROM subcategories WHERE id = ?', [id])
    return result.affectedRows
}

export const getAllSubcategories = async()=>{
    const [rows]= await db().query(`SELECT * FROM subcategories ORDER BY created_at DESC`)
    return rows
}

export const getPaginatedSubcategories = async ({ category_id, page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC' }) => {
  const offset = (page - 1) * limit
  const params = []
  let whereClause = `WHERE 1`

  if (category_id) {
    whereClause += ' AND category_id = ?'
    params.push(Number(category_id))
  }

  if (search) {
    whereClause += ` AND name LIKE ?`
    params.push(`%${search}%`)
  }

  const allowedSortBy = ['name', 'created_at', 'updated_at']
  const allowedSortOrder = ['ASC', 'DESC']
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at'
  const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

  const [data] = await db().query(
    `SELECT * FROM subcategories ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  )

  const [[{ total }]] = await db().query(
    `SELECT COUNT(*) AS total FROM subcategories ${whereClause}`,
    params
  )

  return { data, total }
}
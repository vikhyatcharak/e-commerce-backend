import { db } from '../db/index.js'

export const createEmailTemplate = async (data) => {
    const { type, subject, message } = data
    const [result] = await db().query(
        `INSERT INTO email_templates (type, subject, message) VALUES (?, ?, ?)`,
        [type, subject, message]
    )
    return { id: result.insertId, ...data }
}

export const getPaginatedEmailTemplates = async ({ page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC'  }) => {
    const offset = (page - 1) * limit
    const params = []
    let whereClause = `WHERE 1`

    if (search) {
        whereClause += ` AND (type LIKE ? OR subject LIKE ?)`
        params.push(`%${search}%`, `%${search}%`)
    }

  const allowedSortBy = ['type', 'created_at', 'updated_at']
  const allowedSortOrder = ['ASC', 'DESC']
  const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'created_at'
  const safeSortOrder = allowedSortOrder.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC'

    const [data] = await db().query(
        `SELECT * FROM email_templates ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), parseInt(offset)]
    )

    const [[{ total }]] = await db().query(
        `SELECT COUNT(*) as total FROM email_templates ${whereClause}`,
        params
    )

    return { data, total }
}

export const updateEmailTemplate = async (id, updateFields) => {
    let setClauses = []
    let params = []

    for (const [key, value] of Object.entries(updateFields)) {
        setClauses.push(`${key} = ?`)
        params.push(value)
    }
    params.push(id)

    const sql = `UPDATE email_templates SET ${setClauses.join(', ')} WHERE id = ?`
    const [result] = await db().query(sql, params)
    return result.affectedRows
}

export const deleteEmailTemplate = async (id) => {
    const [result] = await db().query('DELETE FROM email_templates WHERE id = ?', [id])
    return result.affectedRows
}

export const getEmailTemplateById = async (id) => {
    const [rows] = await db().query('SELECT * FROM email_templates WHERE id = ?', [id])
    return rows[0] || null
}
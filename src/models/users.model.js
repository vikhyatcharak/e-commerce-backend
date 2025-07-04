import { db } from '../db/index.js'

export const createUser = async ({name, email, phone, address, dob, gender, is_guest = true }) => {
    const [result] = await db().query(`
        INSERT INTO users (name, email, phone, address, dob, gender, is_guest) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone, address, dob, gender, is_guest]
    )
    return result.insertId
}

export const getUserById = async (id) => {
    const [rows] = await db().query('SELECT * FROM users WHERE id = ?', [id])
    return rows[0]
}


export const getUserByEmail = async (email) => {
    const [rows] = await db().query('SELECT * FROM users WHERE email = ?', [email])
    return rows[0]
}


export const getUserByPhone = async (phone) => {
    const [rows] = await db().query('SELECT * FROM users WHERE phone = ?', [phone])
    return rows[0]
}


export const updateUser = async (id, updateData) => {
  let fields = []
  let params = []

  for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = ?`)
      params.push(value)
  }
  params.push(id)

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`
  const [result] = await db().query(sql, params)
  return result.affectedRows
}


export const deleteUser = async (id) => {
    const [result]= await db().query('DELETE FROM users WHERE id = ?', [id])
    return result.affectedRows
}


export const getAllUsers = async () => {
    const [rows] = await db().query('SELECT * FROM users ORDER BY created_at DESC')
    return rows
}

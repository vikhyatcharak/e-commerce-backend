import { db } from '../db/index.js'
import bcrypt from "bcrypt"

export const createAdmin = async ({ name, email, username, password}) => {
    const hashedPassword = await bcrypt.hash(password, 10)
    const [result] = await db().query(`
        INSERT INTO admin (name, email, username, password) VALUES (?, ?, ?, ?)`,
        [name, email, username,hashedPassword]
    )
    return result.insertId
}

export const getAdminById = async (id) => {
    const [rows] = await db().query('SELECT * FROM admin WHERE id = ?', [id])
    return rows[0]
}

export const getAdminByEmail = async (email) => {
    const [rows] = await db().query('SELECT * FROM admin WHERE email = ?', [email])
    return rows[0]
}

export const getAdminBYUsername = async(username)=>{
    const [rows] = await db().query('SELECT * FROM admin WHERE username = ?', [username])
    return rows[0]
}

export const verifyPassword = async (id, password) => {
  const [rows] = await db().query('SELECT * FROM admin WHERE id = ?',[id])

  if (rows.length === 0) return false;

  const hashedPassword = rows[0].password;
  const match = await bcrypt.compare(password, hashedPassword);
  return match
}

export const updatePassword = async(id, newPass)=>{
    const hashedPassword = await bcrypt.hash(newPass, 10)
    const [result]= await db().query(`UPDATE admin SET password=? WHERE id=?`,[hashedPassword,id])
    return result.affectedRows
}

export const updateDetails = async(id, {name, email, username} )=>{
    const [result]= await db().query(`UPDATE admin SET name = COALESCE(?, name), email = COALESCE(?, email), username = COALESCE(?, username) WHERE id = ?`,[name, email, username, id])
    return result.affectedRows
}


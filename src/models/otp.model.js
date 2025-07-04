import { db } from '../db/index.js'

export const createOtp = async ({ phone, otp, expires_at }) => {
  const [result] = await db().query('INSERT INTO otp_sessions (phone, otp, expires_at) VALUES (?, ?, ?)',[phone, otp, expires_at])
  return result.insertId
}

export const getOtpByPhone = async (phone) => {
  const [rows] = await db().query('SELECT * FROM otp_sessions WHERE phone = ? ORDER BY created_at DESC LIMIT 1',[phone])
  return rows[0]
}

export const verifyOtp = async (phone, otp) => {
  const [rows] = await db().query('SELECT * FROM otp_sessions WHERE phone = ? AND otp = ? AND expires_at > NOW() AND verified = FALSE',[phone, otp] )

  if (rows.length > 0) {
    await db().query('UPDATE otp_sessions SET verified = TRUE WHERE id = ?',[rows[0].id])
    return true
  }

  return false
}

export const deleteOtpsByPhone = async (phone) => {// delete after the controller which will call for verification is complete
  const [result]=await db().query('DELETE FROM otp_sessions WHERE phone = ?', [phone])
  return result.affectedRows
}


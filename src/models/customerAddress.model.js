import { db } from '../db/index.js'

export const createAddress = async ({ user_id, address, city, state, pincode, country = 'India', is_default = false }) => {
    // If this is set as default, unset all other addresses for this user
    if (is_default) {
        await db().query('UPDATE customer_addresses SET is_default = FALSE WHERE user_id = ?', [user_id])
    }
    
    const [result] = await db().query(`
        INSERT INTO customer_addresses (user_id, address, city, state, pincode, country, is_default) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user_id, address, city, state, pincode, country, is_default]
    )
    return result.insertId
}

export const getAddressesByUserId = async (user_id) => {
    const [rows] = await db().query('SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [user_id])
    return rows
}

export const getAddressById = async (id) => {
    const [rows] = await db().query('SELECT * FROM customer_addresses WHERE id = ?', [id])
    return rows[0]
}

export const updateAddress = async (id, updateData) => {
    const { user_id, ...addressData } = updateData
    
    // If setting as default, unset all other addresses for this user
    if (addressData.is_default) {
        await db().query('UPDATE customer_addresses SET is_default = FALSE WHERE user_id = ?', [user_id])
    }
    
    let fields = []
    let params = []

    for (const [key, value] of Object.entries(addressData)) {
        fields.push(`${key} = ?`)
        params.push(value)
    }
    params.push(id)

    const sql = `UPDATE customer_addresses SET ${fields.join(', ')} WHERE id = ?`
    const [result] = await db().query(sql, params)
    return result.affectedRows
}

export const deleteAddress = async (id) => {
    const [result] = await db().query('DELETE FROM customer_addresses WHERE id = ?', [id])
    return result.affectedRows
}

export const getDefaultAddress = async (user_id) => {
    const [rows] = await db().query('SELECT * FROM customer_addresses WHERE user_id = ? AND is_default = TRUE', [user_id])
    return rows[0]
}

export const setDefaultAddress = async (id, user_id) => {
    // First unset all defaults for this user
    await db().query('UPDATE customer_addresses SET is_default = FALSE WHERE user_id = ?', [user_id])
    
    // Set the specified address as default
    const [result] = await db().query('UPDATE customer_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?', [id, user_id])
    return result.affectedRows
}

// src/models/pickupLocations.model.js
import { db } from '../db/index.js'

export const createPickupLocation = async ({ location_name, address, city, state,country, pincode,contact_person, phone, email, is_default = false }) => {
    // If this is set as default, unset all other pickup locations
    if (is_default) {
        await db().query('UPDATE pickup_locations SET is_default = FALSE')
    }
    
    const [result] = await db().query(`
        INSERT INTO pickup_locations (location_name, address, city, state, country, pincode,contact_person, phone, email, is_default) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [location_name, address, city, state, country, pincode, contact_person, phone, email, is_default?1:0]
    )
    return result.insertId
}

export const getAllPickupLocations = async () => {
    const [rows] = await db().query('SELECT * FROM pickup_locations ORDER BY is_default DESC, created_at DESC')
    return rows
}

export const getPickupLocationById = async (id) => {
    const [rows] = await db().query('SELECT * FROM pickup_locations WHERE id = ?', [id])
    return rows[0]
}

export const getDefaultPickupLocation = async () => {
    const [rows] = await db().query('SELECT * FROM pickup_locations WHERE is_default = TRUE LIMIT 1')
    return rows[0]
}

// export const updatePickupLocation = async (id, updateData) => {
//     // If setting as default, unset all other pickup locations
//     if (updateData.is_default) {
//         await db().query('UPDATE pickup_locations SET is_default = FALSE')
//     }
    
//     let fields = []
//     let params = []

//     for (const [key, value] of Object.entries(updateData)) {
//         fields.push(`${key} = ?`)
//         params.push(value)
//     }
//     params.push(id)

//     const sql = `UPDATE pickup_locations SET ${fields.join(', ')} WHERE id = ?`
//     const [result] = await db().query(sql, params)
//     return result.affectedRows
// }

// export const deletePickupLocation = async (id) => {
//     // Check if this is the default location
//     const location = await getPickupLocationById(id)
    
//     const [result] = await db().query('DELETE FROM pickup_locations WHERE id = ?', [id])
    
//     // If we deleted the default location, set another one as default
//     if (location?.is_default && result.affectedRows > 0) {
//         const [remainingLocations] = await db().query('SELECT id FROM pickup_locations LIMIT 1')
//         if (remainingLocations.length > 0) {
//             await db().query('UPDATE pickup_locations SET is_default = TRUE WHERE id = ?', [remainingLocations[0].id])
//         }
//     }
    
//     return result.affectedRows
// }
//cannot edit or delete in shiprocket

export const setDefaultPickupLocation = async (id) => {
    // First unset all defaults
    await db().query('UPDATE pickup_locations SET is_default = FALSE')
    
    // Set the specified location as default
    const [result] = await db().query('UPDATE pickup_locations SET is_default = TRUE WHERE id = ?', [id])
    return result.affectedRows
}

export const getPickupLocationByCity = async (city) => {
    const [rows] = await db().query('SELECT * FROM pickup_locations WHERE city = ? ORDER BY is_default DESC', [city])
    return rows
}

export const getPickupLocationsByState = async (state) => {
    const [rows] = await db().query('SELECT * FROM pickup_locations WHERE state = ? ORDER BY is_default DESC', [state])
    return rows
}

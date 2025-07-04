import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { createUser,getUserById,getUserByEmail,getUserByPhone,updateUser,deleteUser,getAllUsers} from "../models/users.model.js"

const createUsr = asyncHandler(async (req, res) => {
    const { name,email,phone,address,dob,gender} = req.body

    const {is_guest}=req.params//use as guest or register/signIn

    if (!name?.trim()) throw new ApiError(400, "Name is required")
    if (!email?.trim()) throw new ApiError(400, "Email is required")
    if (!phone?.trim()) throw new ApiError(400, "Phone is required")
    if (!address?.trim()) throw new ApiError(400, "Address is required")

    // Additional validation for registered users
    if (!is_guest) {
        if (!dob) throw new ApiError(400, "Date of birth is required for registered users")
        if (!gender) throw new ApiError(400, "Gender is required for registered users")
    }

    const userData = {
        name: name?.trim(),
        email: email?.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
        dob: dob || null,
        gender: gender || null,
        is_guest
    }

    const userId = await createUser(userData)
    if (!userId) throw new ApiError(500, "Failed to create user")

    const newUser = await getUserById(userId)
    return res.status(200)
    .json(new ApiResponse(200, newUser, "User created successfully"))
})

const getUsr = asyncHandler(async (req, res) => {
    const { id, email, phone } = req.body

    let user
    if (id) {
        const userId = Number(id)
        if (!userId) throw new ApiError(400, "Invalid user ID")
        user = await getUserById(userId)
    } else if (email) {
        if(!email?.trim()) throw new ApiError(400,"Invalid email")
        user = await getUserByEmail(email?.trim())
    } else {
        if(!phone?.trim()) throw new ApiError(400,"Invalid phone")
        user = await getUserByPhone(phone)
    }

    if (!user) throw new ApiError(404, "User not found")
    return res.status(200)
    .json(new ApiResponse(200, user, "User retrieved successfully"))
})

const getAllUsr = asyncHandler(async (req, res) => {
    const users = await getAllUsers()
    return res.status(200)
    .json(new ApiResponse(200, users, "All users retrieved successfully"))
})

const updateUsr = asyncHandler(async (req, res) => {
    const { id: rawId, ...updateData } = req.body
    
    if (!rawId) throw new ApiError(400, "User ID is required")
    const userId = Number(rawId)
    if (!userId) throw new ApiError(400, "Invalid user ID")

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No update data provided")
    }

    // Additional validation for registered users
    if (updateData.is_guest === false) {
        if (!updateData.dob) throw new ApiError(400, "Date of birth required when converting to registered user")
        if (!updateData.gender) throw new ApiError(400, "Gender required when converting to registered user")
    }

    const affectedRows = await updateUser(userId, {
        ...updateData,
        ...(updateData.name && { name: updateData.name?.trim() }),
        ...(updateData.email && { email: updateData.email?.trim() }),
        ...(updateData.phone && { phone: updateData.phone?.trim() }),
        ...(updateData.address && { address: updateData.address?.trim() })
    })

    if (!affectedRows) throw new ApiError(404, "User not found or no changes made")
    
    const updatedUser = await getUserById(userId)
    return res.status(200)
    .json(new ApiResponse(200, updatedUser, "User updated successfully"))
})

const deleteUsr = asyncHandler(async (req, res) => {
    const { id: rawId } = req.query
    if (!rawId) throw new ApiError(400, "User ID is required")
    
    const userId = Number(rawId)
    if (!userId) throw new ApiError(400, "Invalid user ID")

    // Check if user exists
    const user = await getUserById(userId)
    if (!user) throw new ApiError(404, "User not found")

    // Delete user
    const affectedRows = await deleteUser(userId)
    if (!affectedRows) throw new ApiError(500, "Failed to delete user")

    return res.status(200)
        .json(new ApiResponse(200, { deleted: true }, "User deleted successfully"))
})

export {
    createUsr,
    getUsr,
    getAllUsr,
    updateUsr,
    deleteUsr
}

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { createUser, getUserById, getUserByEmail, getUserByPhone, updateUser } from "../models/users.model.js"
import { createOtp, verifyOtp, deleteOtpsByPhone } from "../models/otp.model.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await getUserById(userId)
        const accessToken = jwt.sign(
            { id: user.id, email: user.email, phone: user.phone },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        )

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
        )

        await updateUser(userId, { refresh_token: refreshToken })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString()

// Send OTP for customer authentication
const sendCustomerOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body

    if (!phone?.trim()) throw new ApiError(400, "Phone number is required")

    const otp = generateOtpCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const otpId = await createOtp({ phone: phone?.trim(), otp, expires_at: expiresAt })
    if (!otpId) throw new ApiError(500, "Failed to generate OTP")

    // TODO: Integrate with SMS service
    console.log(`Customer OTP for ${phone}: ${otp}`)

    return res.status(200)
        .json(new ApiResponse(200, { phone }, "OTP sent successfully"))
})

// Verify OTP and login/register customer
const verifyCustomerOtp = asyncHandler(async (req, res) => {
    const { phone, otp, name, email } = req.body

    if (!phone?.trim()) throw new ApiError(400, "Phone number is required")
    if (!otp?.trim()) throw new ApiError(400, "OTP is required")

    const isValidOtp = await verifyOtp(phone?.trim(), otp?.trim())
    if (!isValidOtp) throw new ApiError(401, "Invalid OTP or expired")

    // Check if user exists
    let user = await getUserByPhone(phone?.trim())

    if (!user) {
        // Create new user if doesn't exist
        if (!name?.trim()) throw new ApiError(400, "Name is required for new users")

        const userData = {
            name: name.trim(),
            email: email?.trim() || null,
            phone: phone.trim(),
            is_guest: true
        }

        const userId = await createUser(userData)
        user = await getUserById(userId)
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id)

    // Clean up OTP
    await deleteOtpsByPhone(phone?.trim())

    const { password, refresh_token, ...safeUser } = user

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: safeUser, accessToken, refreshToken }, "Login successful"))
})

// Register customer with email/password
const registerCustomer = asyncHandler(async (req, res) => {
    const { name, email, phone, password, dob, gender } = req.body

    if (!name?.trim()) throw new ApiError(400, "Name is required")
    if (!email?.trim()) throw new ApiError(400, "Email is required")
    if (!phone?.trim()) throw new ApiError(400, "Phone is required")
    if (!password?.trim()) throw new ApiError(400, "Password is required")

    // Check if user exists
    const existingUserByEmail = await getUserByEmail(email?.trim())
    if (existingUserByEmail) throw new ApiError(409, "User with email already exists")

    const existingUserByPhone = await getUserByPhone(phone?.trim())
    if (existingUserByPhone) throw new ApiError(409, "User with phone already exists")

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const userData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        dob: dob || null,
        gender: gender || null,
        is_guest: false
    }

    const userId = await createUser(userData)
    const user = await getUserById(userId)

    // Generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userId)

    const { password: _, refresh_token, ...safeUser } = user

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(201, { user: safeUser, accessToken, refreshToken }, "User registered successfully"))
})

// Login customer with email/password
const loginCustomer = asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body

    if (!(email || phone)) throw new ApiError(400, "Email or phone is required")
    if (!password) throw new ApiError(400, "Password is required")
    let user
    if (email) {
        user = await getUserByEmail(email.trim())
    } else {
        user = await getUserByPhone(phone.trim())
    }

    if (!user) throw new ApiError(404, "User not found")
    if (!user.password) throw new ApiError(400, "Please use OTP login for this account")

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) throw new ApiError(401, "Invalid credentials")

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id)

    const { password: _, refresh_token, ...safeUser } = user

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: safeUser, accessToken, refreshToken }, "Login successful"))
})

// Logout customer
const logoutCustomer = asyncHandler(async (req, res) => {
    await updateUser(req.customer.id, { refresh_token: null })

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request")

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await getUserById(decodedToken?.id)

        if (!user) throw new ApiError(401, "Invalid refresh token")
        if (incomingRefreshToken !== user?.refresh_token) throw new ApiError(401, "Refresh token is expired or used")

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id)

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

// Get current customer profile
const getCurrentCustomer = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiResponse(200, req.customer, "Customer profile retrieved successfully"))
})

// Update customer profile
const updateCustomerProfile = asyncHandler(async (req, res) => {
    const { name, email, dob, gender, phone } = req.body

    const updateData = {}
    if (name?.trim()) updateData.name = name.trim()
    if (email?.trim()) updateData.email = email.trim()
    if (dob) updateData.dob = dob
    if (gender) updateData.gender = gender
    if (phone) updateData.phone = phone
    if(gender && dob && req.customer.is_guest) updateData.is_guest=0

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No update data provided")
    }

    const affectedRows = await updateUser(req.customer.id, updateData)
    if (!affectedRows) throw new ApiError(500, "Failed to update profile")

    const updatedUser = await getUserById(req.customer.id)
    const { password, refresh_token, ...safeUser } = updatedUser

    return res.status(200)
        .json(new ApiResponse(200, safeUser, "Profile updated successfully"))
})

// Change password
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) throw new ApiError(400, "Old password and new password are required")

    const user = await getUserById(req.customer.id)
    if (!user.password) throw new ApiError(400, "Password not set for this account")

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isPasswordValid) throw new ApiError(400, "Invalid old password")

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await updateUser(req.customer.id, { password: hashedPassword })

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

export {
    sendCustomerOtp,
    verifyCustomerOtp,
    registerCustomer,
    loginCustomer,
    logoutCustomer,
    refreshAccessToken,
    getCurrentCustomer,
    updateCustomerProfile,
    changePassword
}

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { createOtp, getOtpByPhone, verifyOtp, deleteOtpsByPhone } from "../models/otp.model.js"

const generateOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString()

const sendOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body
    
    if (!phone?.trim()) throw new ApiError(400, "Phone number is required")
    
    const otp = generateOtpCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) 

    const otpId = await createOtp({phone: phone?.trim(),otp,expires_at: expiresAt})

    if (!otpId) throw new ApiError(500, "Failed to generate OTP")

    console.log(`OTP for ${phone}: ${otp}`) // sms logic?

    return res.status(200)
    .json(new ApiResponse(200, { phone }, "OTP sent successfully"))
})

const verifyOtpController = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body

    if (!phone?.trim()) throw new ApiError(400, "Phone number is required")
    if (!otp?.trim()) throw new ApiError(400, "OTP is required")

    const otpEntry = await getOtpByPhone(phone?.trim());
    if (!otpEntry) throw new ApiError(404, "No OTP found")
    
    const isValid = await verifyOtp(phone?.trim(), otp?.trim())
    if (!isValid) throw new ApiError(401, "Invalid OTP or expired")
    

    await deleteOtpsByPhone(phone?.trim())

    return res.status(200)
    .json(new ApiResponse(200, { verified: true }, "OTP verified successfully"))
})

export {
    sendOtp,
    verifyOtpController
}

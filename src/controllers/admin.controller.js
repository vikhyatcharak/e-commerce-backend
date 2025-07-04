import { db } from '../db/index.js'
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { generateAdminAccessToken, generateAdminRefreshToken } from "../constants.js"
import { createAdmin, getAdminByEmail, getAdminById, getAdminBYUsername, updateDetails, updatePassword, verifyPassword } from "../models/admin.model.js"

const generateTokens=async(adminId)=>{
    try {
        const admin= await getAdminById(adminId)
        if (!admin) throw new ApiError(404, "Admin not found")

        const accessToken= generateAdminAccessToken(admin)
        const refreshToken= generateAdminRefreshToken(admin)

        await db().query(`UPDATE admin SET refresh_token = ? WHERE id = ?`, [refreshToken, adminId])

        return {accessToken, refreshToken}
    } catch (error) {
        console.error("Actual DB/token error:", error)
        throw new ApiError(501, "Something went wrong while generating tokens")
    }
}


const registerAdmin=asyncHandler(async(req,res)=>{
    const{name, email, username, password} = req.body

    if ([name, email, username, password].some(field => field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    const existingByEmail = await getAdminByEmail(email);
    const existingByUsername = await getAdminBYUsername(username);

    if (existingByEmail || existingByUsername) {
    throw new ApiError(409, "Admin already exists with same email or username");
    }

    const adminId= await createAdmin({name,email,username,password})
    if (!adminId) throw new ApiError(500, "Failed to register admin")
    
        const newAdmin = await getAdminById(adminId)
        if (!newAdmin) {
        throw new ApiError(404, "Failed to fetch newly created admin")
        }
        const { password: _, refresh_token, ...safeAdmin } = newAdmin

        return res
        .status(200)
        .json(new ApiResponse(200, safeAdmin, "Admin registered successfully"))
})

const logInAdmin= asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body
    if(!(email?.trim()|| username?.trim())) throw new ApiError(400,"email or username is required")
    let admin
    if(!email?.trim()){
        admin = await getAdminBYUsername(username?.trim())
        if(!admin)throw new ApiError(404, "admin not found")
    }
    if(!username?.trim()){
        admin = await getAdminByEmail(email?.trim())
        if(!admin)throw new ApiError(404, "admin not found")
    }
    const isPassCorrect=await verifyPassword(admin.id,password)
    if(!isPassCorrect) throw new ApiError(400,"Invalid admin credentials")
    const {accessToken, refreshToken}= await generateTokens(admin.id)
    const loggedInAdmin= await getAdminById(admin.id)
    if (!loggedInAdmin) throw new ApiError(404, "Failed to fetch admin")

    const { password: _, refresh_token, ...safeAdmin } = loggedInAdmin
    

    const options={
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(
        200,
        {
            admin: safeAdmin,
            accessToken: accessToken,
            refreshToken: refreshToken
        },
        "admin logged in successfully"
    ))
})

const logOutAdmin= asyncHandler(async(req,res)=>{
    const adminId=Number(req.admin?.id)
    if (isNaN(adminId)) throw new ApiError(400, "Invalid admin ID")
    await db().query(`UPDATE admin SET refresh_token=? WHERE id=?`,[null,adminId])

    const options ={
        httpOnly: true,
        secure: true
    }
    return res.status(202)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(202,{},"admin logged out successfully"))

})

const refreshAccessToken= asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies?.refreshToken || req.body?.refreshToken
    if(!incomingRefreshToken){throw new ApiError(401, "unauthorized request")}

    const decodedToken= jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    const admin= await getAdminById(decodedToken.id)

    if(incomingRefreshToken != admin?.refresh_token)throw new ApiError(401,"refresh token is expired or used")
    
    const {accessToken,newRefreshToken}=await generateTokens(admin?.id)

    const options={
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(
        200,
        {
            "accessToken":accessToken,
            "refreshToken":newRefreshToken
        },
        "Access token refreshed"
    ))
})

const changeCurrentPassword= asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword}=req.body
    if (oldPassword === newPassword)throw new ApiError(400, "New password must be different from old password");
    const adminId=Number(req.admin?.id)
    if (isNaN(adminId)) throw new ApiError(400, "Invalid admin ID")
    const admin = await getAdminById(adminId)
    if(!admin)throw new ApiError(404,"admin not found")
    const isPasswordCorrect=await verifyPassword(admin.id,oldPassword)
    if(!isPasswordCorrect) throw new ApiError(400,"Invalid Old Password")
    const affectedRows=await updatePassword(admin.id,newPassword)
    if(!affectedRows) throw new ApiError(400,"Password update failed")
    await db().query(`UPDATE admin SET refresh_token = NULL WHERE id = ?`, [admin.id])
    return res.status(200).json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentAdmin= asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.admin,"User retrieved successfully"))
})

const updateAdmin= asyncHandler(async(req,res)=>{
    const {name, email, username}=req.body
    if(!(email?.trim() || name?.trim() || username?.trim())) {
        throw new ApiError(400,"At least one field is required")
    }

    const affectedRows= await updateDetails(req.admin?.id,{name:name?.trim(),email:email?.trim(),username:username?.trim()})
    if(!affectedRows)throw new ApiError(400,"Admin update failed")
    const updatedAdmin=await getAdminById(req.admin?.id)
    if (!updatedAdmin) throw new ApiError(404, "Failed to fetch admin")

    const { password: _, refresh_token, ...safeAdmin } = updatedAdmin
    return res.status(200).
    json(new ApiResponse(
        200,
        safeAdmin,
        "User updated successfully"
    ))
})

export {
    registerAdmin,
    logInAdmin,
    logOutAdmin,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentAdmin,
    updateAdmin
}
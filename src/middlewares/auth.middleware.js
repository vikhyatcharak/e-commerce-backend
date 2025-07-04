import { getAdminById } from "../models/admin.model.js"
import { getUserById }  from '../models/users.model.js'
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt from "jsonwebtoken"

export const verifyJwt= asyncHandler(async(req,_,next)=>{
    const token= req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    if(!token){
        throw new ApiError(401,"Unauthorized request")
    }
    const decodedToken= jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const admin= await getAdminById(decodedToken.id)
    if(!admin){
        throw new ApiError(401,"invalid Access Token")
    }
    const { password, refresh_token, ...safeAdmin } = admin
    req.admin=safeAdmin
    next()
})

export const verifyCustomerJwt = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '')

  if (!token) throw new ApiError(401, 'Unauthorized request – token missing')

  let decoded
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token')
  }

  const customer = await getUserById(decoded.id)
  if (!customer) throw new ApiError(401, 'Customer for this token no longer exists')

  const { password, refresh_token, ...safeCustomer } = customer
  req.customer = safeCustomer
  next()
})

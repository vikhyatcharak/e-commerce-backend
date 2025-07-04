import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import {getPaginatedCoupons, createCoupon, getCouponByCode, getAllCoupons, deleteCoupon, updateCoupon, getCouponById } from "../models/coupons.model.js"

const createCoup = asyncHandler(async (req, res) => {
    const {
        code, description,
        flat_discount, percentage_discount,
        quantity, valid_from_date, valid_to_date,
        start_time, end_time
    } = req.body

    if (!code?.trim()) throw new ApiError(400, "Coupon code is required")
    if (!quantity || isNaN(quantity) || Number(quantity) <= 0)
        throw new ApiError(400, "Quantity must be a positive number")

    if (!valid_from_date) throw new ApiError(400, "Valid from date is required")
    if (!valid_to_date) throw new ApiError(400, "Valid to date is required")

    const fromDate = new Date(valid_from_date)
    const toDate = new Date(valid_to_date)
    if (fromDate > toDate)
        throw new ApiError(400, "Valid from date cannot be after valid to date")

    const hasFlat = flat_discount !== null && flat_discount !== ''
    const hasPercent = percentage_discount !== null && percentage_discount !== ''

    if (!hasFlat && !hasPercent)
        throw new ApiError(400, "Either flat or percentage discount must be provided")
    if (hasFlat && hasPercent)
        throw new ApiError(400, "Cannot provide both flat and percentage discounts")

    if (hasFlat) {
        const flat = Number(flat_discount)
        if (isNaN(flat) || flat <= 0)
            throw new ApiError(400, "Flat discount must be a positive number")
    }

    if (hasPercent) {
        const percent = Number(percentage_discount)
        if (isNaN(percent) || percent <= 0 || percent > 100)
            throw new ApiError(400, "Percentage discount must be between 1 and 100")
    }

    const couponData = {
        code: code.trim(),
        description: description?.trim() || "",
        flat_discount: hasFlat ? Number(flat_discount) : null,
        percentage_discount: hasPercent ? Number(percentage_discount) : null,
        quantity: Number(quantity),
        valid_from_date,
        valid_to_date,
        start_time: start_time || null,
        end_time: end_time || null
    }

    const couponId = await createCoupon(couponData)
    if (!couponId) throw new ApiError(500, "Failed to create coupon")

    const newCoupon = await getCouponByCode(code.trim())
    return res.status(200).json(new ApiResponse(200, newCoupon, "Coupon created successfully"))
})


const getAllCoup = asyncHandler(async (req, res) => {
    const coupons = await getAllCoupons()
    return res.status(200)
        .json(new ApiResponse(200, coupons, "All coupons retrieved successfully"))
})

const getCoupById = asyncHandler(async (req, res) => {
    const { id: raw_id } = req.params
    if (!raw_id?.trim()) throw new ApiError(400, "Id is required")

    const id = Number(raw_id)
    const coupon = await getCouponById(id)
    if (!coupon) throw new ApiError(404, "Coupon not found")

    return res.status(200)
        .json(new ApiResponse(200, coupon, "Coupon details retrieved successfully"))
})

const getCoupByCode = asyncHandler(async (req, res) => {
    const { code } = req.params
    if (!code?.trim()) throw new ApiError(400, "Coupon code is required")

    const coupon = await getCouponByCode(code?.trim())
    if (!coupon) throw new ApiError(404, "Coupon not found")

    return res.status(200)
        .json(new ApiResponse(200, coupon, "Coupon details retrieved successfully"))
})

const deleteCoup = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params

    if (!rawId || isNaN(rawId)) throw new ApiError(400, "Valid Coupon ID is required")

    const couponId = Number(rawId)

    const affectedRows = await deleteCoupon(couponId)
    if (!affectedRows) throw new ApiError(404, "Coupon not found or already deleted")

    return res.status(200)
        .json(new ApiResponse(200, { deleted: true }, "Coupon deleted successfully"))
})

const updateCoup = asyncHandler(async (req, res) => {
    const { id, code, description, flat_discount, percentage_discount, quantity, valid_from_date, valid_to_date, start_time, end_time } = req.body
    if (flat_discount && percentage_discount) {
        throw new ApiError(400, "Cannot provide both flat and percentage discounts")
    }
    const updateFields = {}
    if (typeof code === 'string' && code?.trim()) updateFields.code = code?.trim()
    if (typeof description === 'string' && description?.trim()) updateFields.description = description?.trim()
    if (flat_discount !== undefined && flat_discount !== null) {
        updateFields.flat_discount = flat_discount
        updateFields.percentage_discount = null
    }
    if (percentage_discount !== undefined && percentage_discount !== null) {
        updateFields.percentage_discount = percentage_discount
        updateFields.flat_discount = null
    }
    if (flat_discount != null && flat_discount !== '') {
        updateFields.flat_discount = Number(flat_discount)
        updateFields.percentage_discount = null
    }
    if (percentage_discount != null && percentage_discount !== '') {
        updateFields.percentage_discount = Number(percentage_discount)
        updateFields.flat_discount = null
    }

    if (quantity !== undefined && quantity !== null) updateFields.quantity = quantity
    if (typeof valid_from_date === 'string' && valid_from_date?.trim()) updateFields.valid_from_date = valid_from_date?.trim()
    if (typeof valid_to_date === 'string' && valid_to_date?.trim()) updateFields.valid_to_date = valid_to_date?.trim()
    if (typeof start_time === 'string' && start_time?.trim()) updateFields.start_time = start_time?.trim()
    if (typeof end_time === 'string' && end_time?.trim()) updateFields.end_time = end_time?.trim()

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field is required")
    }


    const affectedRows = await updateCoupon(id, updateFields)
    if (!affectedRows) throw new ApiError(400, "coupon update failed")
    const updatedCoupon = await getCouponById(id)
    if (!updatedCoupon) throw new ApiError(404, "Failed to fetch coupon")

    return res.status(200).
        json(new ApiResponse(
            200,
            updatedCoupon,
            "Coupon updated successfully"
        ))
})

const getPaginatedCoup = asyncHandler(async (req, res) => {
    const {page = 1,limit = 10,search = '',sortBy = 'created_at',sortOrder = 'DESC'} = req.query

    const result = await getPaginatedCoupons({page: Number(page),limit: Number(limit),search,sortBy,sortOrder})

    return res.status(200).json(new ApiResponse(200, result, "Paginated coupons fetched"))
})


export {
    createCoup,
    getAllCoup,
    getCoupByCode,
    deleteCoup,
    updateCoup,
    getCoupById,
    getPaginatedCoup
}
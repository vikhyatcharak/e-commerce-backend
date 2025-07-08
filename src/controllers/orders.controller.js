import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { createOrder, getAllOrders, getOrderById, getOrdersByUserId, updateOrderPaymentStatus, updateOrderDeliveryStatus } from "../models/orders.model.js"

// const createOrdr = asyncHandler(async (req, res) => {
//     const {user_id,customer_address_id, total, tax, discount = 0, final_total, coupon_id, payment_mode, payment_status, delivery_status} = req.body
    
//     if (!user_id) throw new ApiError(400, 'User ID is required')
//     if (!customer_address_id) throw new ApiError(400, 'customer_address ID is required')
//     if (!total || isNaN(total)) throw new ApiError(400, 'Valid total amount is required')
//     if (!tax || isNaN(tax)) throw new ApiError(400, 'Valid tax amount is required')
//     if (!final_total || isNaN(final_total)) throw new ApiError(400, 'Valid final total is required')
//     if (!payment_mode?.trim()) throw new ApiError(400, 'Payment mode is required')
//     if (!payment_status?.trim()) throw new ApiError(400, 'Payment status is required')
//     if (!delivery_status?.trim()) throw new ApiError(400, 'Delivery status is required')

//     const orderData = {
//         user_id: Number(user_id),
//         customer_address_id:Number(customer_address_id),
//         total: Number(total),
//         tax: Number(tax),
//         discount: Number(discount) || 0,
//         final_total: Number(final_total),
//         coupon_id: coupon_id ? Number(coupon_id) : null,
//         payment_mode: payment_mode.trim(),
//         payment_status: payment_status.trim(),
//         delivery_status: delivery_status.trim()
//     }

//     const orderId = await createOrder(orderData)
//     if (!orderId) throw new ApiError(500, 'Failed to create order')

//     const newOrder = await getOrderById(orderId)

//     return res.status(201).json(new ApiResponse(201, {
//         orderId: newOrder.id,
//     }, 'Order created successfully'))
// })

const getAllOrdr = asyncHandler(async (req, res) => {
    const orders = await getAllOrders()
    return res.status(200)
        .json(new ApiResponse(200, orders, "orders retrieved successfully"))
})

const getOrdrById = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Order ID is required")

    const orderId = Number(rawId)
    if (!orderId || isNaN(orderId)) throw new ApiError(400, "Invalid order ID")

    const order = await getOrderById(orderId)
    if (!order) throw new ApiError(404, "Order not found")

    return res.status(200)
        .json(new ApiResponse(200, order, "Order details retrieved successfully"))
})

const getOrdrByUserId = asyncHandler(async (req, res) => {
    const { user_id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "User ID is required")

    const userId = Number(rawId)
    if (!userId || isNaN(userId)) throw new ApiError(400, "Invalid user ID")
    console.log(userId)
    const orders = await getOrdersByUserId(userId)
    return res.status(200)
        .json(new ApiResponse(200, orders, "User orders retrieved successfully"))
})

const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id: rawId, payment_status } = req.body

    if (!rawId) throw new ApiError(400, "Order ID is required")
    if (!payment_status?.trim()) throw new ApiError(400, "Payment status is required")

    const orderId = Number(rawId)
    if (!orderId || isNaN(orderId)) throw new ApiError(400, "Invalid order ID")

    const affectedRows = await updateOrderPaymentStatus(orderId, { payment_status })
    if (!affectedRows) throw new ApiError(404, "Order not found or no changes made")

    const updatedOrder = await getOrderById(orderId)
    return res.status(200)
        .json(new ApiResponse(200, updatedOrder, "Payment status updated successfully"))
})

const updateDeliveryStatus = asyncHandler(async (req, res) => {
    const { id: rawId, delivery_status } = req.body

    if (!rawId) throw new ApiError(400, "Order ID is required")
    if (!delivery_status?.trim()) throw new ApiError(400, "Delivery status is required")

    const orderId = Number(rawId)
    if (!orderId || isNaN(orderId)) throw new ApiError(400, "Invalid order ID")

    const affectedRows = await updateOrderDeliveryStatus(orderId, { delivery_status })
    if (!affectedRows) throw new ApiError(404, "Order not found or no changes made")

    const updatedOrder = await getOrderById(orderId)
    return res.status(200)
        .json(new ApiResponse(200, updatedOrder, "Delivery status updated successfully"))
})




export {
    // createOrdr,
    getAllOrdr,
    getOrdrById,
    getOrdrByUserId,
    updatePaymentStatus,
    updateDeliveryStatus}

import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { addOrderItem, getItemsByOrderId } from "../models/orderItems.model.js"

const addOrderItm = asyncHandler(async (req, res) => {
    const{order_id}=req.params
    const { product_variant_id, quantity, price } = req.body

    if (!order_id) throw new ApiError(400, "Order ID is required")
    if (!product_variant_id) throw new ApiError(400, "Product variant ID is required")
    if (!quantity || isNaN(quantity)) throw new ApiError(400, "Valid quantity is required")
    if (!price || isNaN(price)) throw new ApiError(400, "Valid price is required")

    const data = {
        order_id: Number(order_id),
        product_variant_id: Number(product_variant_id),
        quantity: Number(quantity),
        price: Number(price)
    }

    if (data.quantity <= 0) throw new ApiError(400, "Quantity must be positive")
    if (data.price <= 0) throw new ApiError(400, "Price must be positive")

    const itemId = await addOrderItem(data)
    if (!itemId) throw new ApiError(500, "Failed to add order item")

    return res.status(200)
    .json(new ApiResponse(200, { itemId }, "Order item added successfully"))
})

const getOrderItm = asyncHandler(async (req, res) => {
    const { order_id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Order ID is required")
    
    const orderId = Number(rawId)
    if (!orderId || isNaN(orderId)) throw new ApiError(400, "Invalid order ID")

    const items = await getItemsByOrderId(orderId)
    return res.status(200)
    .json(new ApiResponse(200, items, "Order items retrieved successfully"))
})

export {
    addOrderItm,
    getOrderItm
}

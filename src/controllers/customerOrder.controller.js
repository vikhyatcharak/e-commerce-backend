import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { createOrder, getOrderById, getOrdersByUserId, updateOrderShippingDetails } from "../models/orders.model.js"
import { addOrderItem, getItemsByOrderId } from "../models/orderItems.model.js"
import { getCartByUserId, clearCart, validateCartStock } from "../models/cart.model.js"
import { getDefaultAddress, getAddressById } from "../models/customerAddress.model.js"
import shiprocketService from '../services/shiprocketService.js'
// Create order from cart
const createCustomerOrder = asyncHandler(async (req, res) => {
    const {
        address_id,
        payment_mode = 'cod',
        coupon_id
    } = req.body
    const user_id = req.customer.id

    // Validate cart
    const cartItems = await getCartByUserId(user_id)
    if (!cartItems || cartItems.length === 0) {
        throw new ApiError(400, "Cart is empty")
    }

    // Validate stock
    const outOfStockItems = await validateCartStock(user_id)
    if (outOfStockItems.length > 0) {
        throw new ApiError(400, "Some items are out of stock", outOfStockItems)
    }

    // Get shipping address
    let shippingAddress
    if (address_id) {
        shippingAddress = await getAddressById(address_id)
        if (!shippingAddress || shippingAddress.user_id !== user_id) {
            throw new ApiError(404, "Address not found")
        }
    } else {
        shippingAddress = await getDefaultAddress(user_id)
        if (!shippingAddress) {
            throw new ApiError(400, "No default address found. Please provide address_id")
        }
    }

    // Calculate totals
    let subtotal = 0
    let totalWeight = 0
    const orderItems = []

    cartItems.forEach(item => {
        const itemTotal = item.quantity * item.price
        subtotal += itemTotal
        totalWeight += (item.weight || 1) * item.quantity // Default 1kg per item

        orderItems.push({
            name: item.product_name + (item.variant_name ? ` - ${item.variant_name}` : ''),
            sku: item.sku || `ITEM-${item.product_variant_id}`,
            units: item.quantity,
            selling_price: item.price,
            discount: 0,
            tax: 0,
            hsn: item.hsn || ''
        })
    })

    // Calculate tax and discount (implement your logic)
    const taxRate = 0.18 // 18% GST
    const tax = subtotal * taxRate
    const discount = coupon_id ? 0 : 0 // Implement coupon logic
    const finalTotal = subtotal + tax - discount

    // Create order in database
    const orderData = {
        user_id,
        customer_address_id:shippingAddress.id,
        total: subtotal,
        tax,
        discount,
        final_total: finalTotal,
        coupon_id: coupon_id || null,
        payment_mode,
        payment_status: payment_mode === 'cod' ? 'pending' : 'pending',
        delivery_status: 'pending'
    }

    const orderId = await createOrder(orderData)
    if (!orderId) throw new ApiError(500, "Failed to create order")

    // Add order items
    for (const cartItem of cartItems) {
        await addOrderItem({
            order_id: orderId,
            product_variant_id: cartItem.product_variant_id,
            quantity: cartItem.quantity,
            price: cartItem.price * cartItem.quantity
        })
    }
    // Clear cart after successful order
    await clearCart(user_id)
    const newOrder = await getOrderById(orderId)

    return res.status(201).json(new ApiResponse(201, {
        order: newOrder,
    }, "Order created successfully"))
})

// Get customer's orders
const getCustomerOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query
    const user_id = req.customer.id

    let orders = await getOrdersByUserId(user_id)

    // Filter by status if provided
    if (status) {
        orders = orders.filter(order =>
            order.delivery_status === status || order.payment_status === status
        )
    }

    // Simple pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + parseInt(limit)
    const paginatedOrders = orders.slice(startIndex, endIndex)

    return res.status(200).json(new ApiResponse(200, {
        orders: paginatedOrders,
        pagination: {
            currentPage: parseInt(page),
            totalOrders: orders.length,
            totalPages: Math.ceil(orders.length / limit),
            hasNext: endIndex < orders.length,
            hasPrev: startIndex > 0
        }
    }, "Orders retrieved successfully"))
})

// Get specific order details
const getCustomerOrderById = asyncHandler(async (req, res) => {
    const { id } = req.params
    const user_id = req.customer.id

    if (!id) throw new ApiError(400, "Order ID is required")

    const order = await getOrderById(id)
    if (!order) throw new ApiError(404, "Order not found")

    // Check if order belongs to customer
    if (order.user_id !== user_id) {
        throw new ApiError(403, "Access denied - Order does not belong to you")
    }

    // Get order items
    const orderItems = await getItemsByOrderId(id)

    return res.status(200).json(new ApiResponse(200, {
        order,
        items: orderItems
    }, "Order details retrieved successfully"))
})

// Track order
const trackCustomerOrder = asyncHandler(async (req, res) => {
    const { id } = req.params
    const user_id = req.customer.id

    const order = await getOrderById(id)
    if (!order) throw new ApiError(404, "Order not found")
    if (order.user_id !== user_id) {
        throw new ApiError(403, "Access denied")
    }

    if (!order.shiprocket_order_id) {
        throw new ApiError(400, "Tracking not available for this order, shipping in progress")
    }

    try {
        const trackingData = await shiprocketService.trackShipment(order.shiprocket_order_id)

        return res.status(200).json(new ApiResponse(200, {
            order: {
                id: order.id,
                status: order.delivery_status,
                payment_status: order.payment_status
            },
            tracking: trackingData
        }, "Order tracking retrieved successfully"))
    } catch (error) {
        throw new ApiError(500, "Failed to fetch tracking information")
    }
})

// Cancel order (if allowed)
const cancelCustomerOrder = asyncHandler(async (req, res) => {
    const { id } = req.params
    const user_id = req.customer.id

    const order = await getOrderById(id)
    if (!order) throw new ApiError(404, "Order not found")
    if (order.user_id !== user_id) {
        throw new ApiError(403, "Access denied")
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'processing']
    if (!cancellableStatuses.includes(order.delivery_status)) {
        throw new ApiError(400, "Order cannot be cancelled at this stage")
    }

    try {
        // Cancel in Shiprocket if exists
        if (order.shiprocket_order_id) {
            await shiprocketService.cancelShipment(id, order.shiprocket_order_id)
        } else{
            await updateOrderShippingDetails(id,{delivery_status: "cancelled"})
        }

        const updatedOrder = await getOrderById(id)

        return res.status(200).json(new ApiResponse(200, updatedOrder, "Order cancelled successfully"))
    } catch (error) {
        throw new ApiError(500, "Failed to cancel order")
    }
})

export {
    createCustomerOrder,
    getCustomerOrders,
    getCustomerOrderById,
    trackCustomerOrder,
    cancelCustomerOrder
}

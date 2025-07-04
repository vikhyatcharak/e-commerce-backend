// src/controllers/customerCart.controller.js
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import {
    addToCart,
    getCartByUserId,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    getCartTotal,
    validateCartStock
} from "../models/cart.model.js"

// Add item to cart
const addItemToCart = asyncHandler(async (req, res) => {
    const { product_variant_id, quantity = 1 } = req.body
    const user_id = req.customer.id

    if (!product_variant_id) throw new ApiError(400, "Product variant ID is required")
    if (!quantity || isNaN(quantity) || quantity <= 0) {
        throw new ApiError(400, "Valid quantity is required")
    }

    const result = await addToCart({
        user_id,
        product_variant_id: Number(product_variant_id),
        quantity: Number(quantity)
    })

    const message = result.updated ? "Cart item updated successfully" : "Item added to cart successfully"

    return res.status(200)
        .json(new ApiResponse(200, result, message))
})

// Get customer's cart
const getCustomerCart = asyncHandler(async (req, res) => {
    const user_id = req.customer.id
    const cartItems = await getCartByUserId(user_id)
    const cartSummary = await getCartTotal(user_id)

    return res.status(200)
        .json(new ApiResponse(200, {
            items: cartItems,
            summary: cartSummary
        }, "Cart retrieved successfully"))
})

// Update item quantity in cart
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { product_variant_id, quantity } = req.body
    const user_id = req.customer.id

    if (!product_variant_id) throw new ApiError(400, "Product variant ID is required")
    if (!quantity || isNaN(quantity) || quantity < 0) {
        throw new ApiError(400, "Valid quantity is required")
    }

    const affectedRows = await updateCartQuantity(
        user_id,
        Number(product_variant_id),
        Number(quantity)
    )

    if (!affectedRows) throw new ApiError(404, "Cart item not found")

    const message = quantity === 0 ? "Item removed from cart" : "Cart quantity updated successfully"

    return res.status(200)
        .json(new ApiResponse(200, { updated: true }, message))
})

// Remove item from cart
const removeItemFromCart = asyncHandler(async (req, res) => {
    const { product_variant_id } = req.body
    const user_id = req.customer.id

    if (!product_variant_id) throw new ApiError(400, "Product variant ID is required")

    const affectedRows = await removeFromCart(user_id, Number(product_variant_id))
    if (!affectedRows) throw new ApiError(404, "Cart item not found")

    return res.status(200)
        .json(new ApiResponse(200, { removed: true }, "Item removed from cart successfully"))
})

// Clear entire cart
const clearCustomerCart = asyncHandler(async (req, res) => {
    const user_id = req.customer.id

    const affectedRows = await clearCart(user_id)

    return res.status(200)
        .json(new ApiResponse(200, {
            cleared: true,
            itemsRemoved: affectedRows
        }, "Cart cleared successfully"))
})

// Get cart item count
const getCustomerCartCount = asyncHandler(async (req, res) => {
    const user_id = req.customer.id
    const itemCount = await getCartItemCount(user_id)

    return res.status(200)
        .json(new ApiResponse(200, { itemCount }, "Cart count retrieved successfully"))
})

// Get cart total/summary
const getCustomerCartSummary = asyncHandler(async (req, res) => {
    const user_id = req.customer.id
    const summary = await getCartTotal(user_id)

    return res.status(200)
        .json(new ApiResponse(200, summary, "Cart summary retrieved successfully"))
})

// Validate cart stock before checkout
const validateCustomerCartStock = asyncHandler(async (req, res) => {
    const user_id = req.customer.id
    const outOfStockItems = await validateCartStock(user_id)

    const isValid = outOfStockItems.length === 0

    return res.status(200)
        .json(new ApiResponse(200, {
            isValid,
            outOfStockItems,
            message: isValid ? "Cart is ready for checkout" : "Some items are out of stock"
        }, "Cart validation completed"))
})

export {
    addItemToCart,
    getCustomerCart,
    updateCartItemQuantity,
    removeItemFromCart,
    clearCustomerCart,
    getCustomerCartCount,
    getCustomerCartSummary,
    validateCustomerCartStock
}

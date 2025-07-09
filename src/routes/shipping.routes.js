import express from 'express'
import shiprocketService from '../services/shiprocketService.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { verifyJwt } from '../middlewares/auth.middleware.js'

const router = express.Router()

// Calculate shipping rates
router.post('/calculate-rates', asyncHandler(async (req, res) => {
    const { pickup_postcode, delivery_postcode, weight, cod, declared_value } = req.body

    if (!pickup_postcode || !delivery_postcode || !weight || declared_value === undefined || cod === undefined) throw new ApiError(400, "All fields (pickup_postcode, delivery_postcode, weight, cod, declared_value) are required")

    const result = await shiprocketService.calculateShippingRate({ pickupPostcode: pickup_postcode, deliveryPostcode: delivery_postcode, weight, cod: cod || 0, declaredValue: declared_value || 0 })

    res.status(200).json(new ApiResponse(200, result, "Shipping rates calculated successfully"))
}))

// Create shipping order
router.post('/create-order', verifyJwt, asyncHandler(async (req, res) => {
    const orderData = req.body

    if (!orderData.orderId || !orderData.customerName || !orderData.items) throw new ApiError(400, "Order ID, customer name, and items are required")
    if (typeof orderData.items === 'string') orderData.items = JSON.parse(orderData.items)
    const result = await shiprocketService.createOrder(orderData)

    res.status(201).json(new ApiResponse(201, result, "Shipping order created successfully"))
}))

// Assign courier
router.post('/assign-courier', verifyJwt, asyncHandler(async (req, res) => {
    const orderData = req.body
    if (!orderData.shipmentId || !orderData.courierId) throw new ApiError(400, "Shipment ID and courier ID are required")

    const result = await shiprocketService.assignCourier(orderData)

    res.status(200).json(new ApiResponse(200, result, "Courier assigned successfully"))
}))

// Generate pickup
router.post('/generate-pickup', verifyJwt, asyncHandler(async (req, res) => {
    const {shipmentId} = req.body

    if (!shipmentId) throw new ApiError(400, "Shipment ID is required")

    const result = await shiprocketService.generatePickup(shipmentId)

    res.status(200).json(new ApiResponse(200, result, "Pickup generated successfully"))
}))

// Track shipment
router.get('/track', verifyJwt, asyncHandler(async (req, res) => {
    const { orderId } = req.query

    if (!orderId) throw new ApiError(400, "Order ID is required")

    const result = await shiprocketService.trackShipment(orderId)

    res.status(200).json(new ApiResponse(200, result, "Shipment tracking retrieved successfully"))
}))

// Cancel shipment
router.post('/cancel-shipment', verifyJwt, asyncHandler(async (req, res) => {
    const  orderIds  = req.body

    if (!orderIds || (Array.isArray(orderIds) && orderIds.length === 0)) throw new ApiError(400, "Order IDs are required")

    const result = await shiprocketService.cancelShipment(orderIds)

    res.status(200).json(new ApiResponse(200, result, "Shipment cancelled successfully"))
}))

// Generate manifest
router.post('/manifest', verifyJwt, asyncHandler(async (req, res) => {
    const { shipmentIds, orderId } = req.body

    if (!shipmentIds || (Array.isArray(shipmentIds) && shipmentIds.length === 0)) {
        throw new ApiError(400, "Shipment IDs are required")
    }

    const result = await shiprocketService.generateManifest(shipmentIds, orderId)

    res.status(200).json(new ApiResponse(200, result, "Manifest generated successfully"))
}))

// Download shipping labels
router.post('/label', verifyJwt, asyncHandler(async (req, res) => {
    const { orderIds, orderId } = req.body

    if (!orderIds || (Array.isArray(orderIds) && orderIds.length === 0)) {
        throw new ApiError(400, "Order IDs are required")
    }

    const result = await shiprocketService.downloadLabel(orderIds, orderId)

    res.status(200).json(new ApiResponse(200, result, "Labels generated successfully"))
}))

// Download invoices
router.post('/invoice', verifyJwt, asyncHandler(async (req, res) => {
    const { orderIds, orderId } = req.body

    if (!orderIds || (Array.isArray(orderIds) && orderIds.length === 0)) {
        throw new ApiError(400, "Order IDs are required")
    }

    const result = await shiprocketService.downloadInvoice(orderIds, orderId)

    res.status(200).json(new ApiResponse(200, result, "Invoices generated successfully"))
}))

// Get shipment details
router.get('/shipment/:shipmentId', verifyJwt, asyncHandler(async (req, res) => {
    const { shipmentId } = req.params

    if (!shipmentId) {
        throw new ApiError(400, "Shipment ID is required")
    }

    const result = await shiprocketService.getShipmentDetails(shipmentId)

    res.status(200).json(new ApiResponse(200, result, "Shipment details retrieved successfully"))
}))

// Create return order
router.post('/return-order', verifyJwt, asyncHandler(async (req, res) => {
    const { id: orderId, returnData, reason } = req.body

    if (!returnData.orderId || !returnData.pickupCustomerName || !returnData.items) {
        throw new ApiError(400, "Order ID, pickup customer name, and items are required")
    }

    const result = await shiprocketService.generateReturnOrder(orderId, returnData, reason)

    res.status(201).json(new ApiResponse(201, result, "Return order created successfully"))
}))

export default router

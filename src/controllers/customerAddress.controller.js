import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import {
    createAddress,
    getAddressesByUserId,
    getAddressById,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
    setDefaultAddress
} from "../models/customerAddress.model.js"

// Create new address for customer
const createCustomerAddress = asyncHandler(async (req, res) => {
    const { address, city, state, pincode, country, is_default } = req.body
    const user_id = req.customer.id

    if (!address?.trim()) throw new ApiError(400, "Address is required")
    if (!city?.trim()) throw new ApiError(400, "City is required")
    if (!state?.trim()) throw new ApiError(400, "State is required")
    if (!pincode?.trim()) throw new ApiError(400, "Pincode is required")

    const addressData = {
        user_id,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country?.trim() || 'India',
        is_default: is_default || false
    }

    const addressId = await createAddress(addressData)
    if (!addressId) throw new ApiError(500, "Failed to create address")

    const newAddress = await getAddressById(addressId)
    return res.status(201)
        .json(new ApiResponse(201, newAddress, "Address created successfully"))
})

// Get all addresses for customer
const getCustomerAddresses = asyncHandler(async (req, res) => {
    const user_id = req.customer.id
    const addresses = await getAddressesByUserId(user_id)

    return res.status(200)
        .json(new ApiResponse(200, addresses, "Addresses retrieved successfully"))
})

// Get specific address by ID
const getCustomerAddressById = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) throw new ApiError(400, "Address ID is required")

    const address = await getAddressById(id)
    if (!address) throw new ApiError(404, "Address not found")


    return res.status(200)
        .json(new ApiResponse(200, address, "Address retrieved successfully"))
})

// Update customer address
const updateCustomerAddress = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { address, city, state, pincode, country, is_default } = req.body
    const user_id = req.customer.id

    if (!id) throw new ApiError(400, "Address ID is required")

    // Check if address exists and belongs to customer
    const existingAddress = await getAddressById(id)
    if (!existingAddress) throw new ApiError(404, "Address not found")
    if (existingAddress.user_id !== user_id) {
        throw new ApiError(403, "Access denied - Address does not belong to you")
    }

    const updateData = { user_id }
    if (address?.trim()) updateData.address = address.trim()
    if (city?.trim()) updateData.city = city.trim()
    if (state?.trim()) updateData.state = state.trim()
    if (pincode?.trim()) updateData.pincode = pincode.trim()
    if (country?.trim()) updateData.country = country.trim()
    if (typeof is_default === 'boolean') updateData.is_default = is_default?1:0

    if (Object.keys(updateData).length === 1) { // Only user_id
        throw new ApiError(400, "No update data provided")
    }

    const affectedRows = await updateAddress(id, updateData)
    if (!affectedRows) throw new ApiError(500, "Failed to update address")

    const updatedAddress = await getAddressById(id)
    return res.status(200)
        .json(new ApiResponse(200, updatedAddress, "Address updated successfully"))
})

// Delete customer address
const deleteCustomerAddress = asyncHandler(async (req, res) => {
    const { id } = req.params
    const user_id = req.customer.id

    if (!id) throw new ApiError(400, "Address ID is required")

    // Check if address exists and belongs to customer
    const existingAddress = await getAddressById(id)
    if (!existingAddress) throw new ApiError(404, "Address not found")
    if (existingAddress.user_id !== user_id) {
        throw new ApiError(403, "Access denied - Address does not belong to you")
    }

    const affectedRows = await deleteAddress(id)
    if (!affectedRows) throw new ApiError(500, "Failed to delete address")

    return res.status(200)
        .json(new ApiResponse(200, { deleted: true }, "Address deleted successfully"))
})

// Get customer's default address
const getCustomerDefaultAddress = asyncHandler(async (req, res) => {
    const user_id = req.customer.id
    const defaultAddress = await getDefaultAddress(user_id)

    if (!defaultAddress) {
        throw new ApiError(404, "No default address found")
    }

    return res.status(200)
        .json(new ApiResponse(200, defaultAddress, "Default address retrieved successfully"))
})

// Set address as default
const setCustomerDefaultAddress = asyncHandler(async (req, res) => {
    const { id } = req.params
    const user_id = req.customer.id

    if (!id) throw new ApiError(400, "Address ID is required")

    // Check if address exists and belongs to customer
    const address = await getAddressById(id)
    if (!address) throw new ApiError(404, "Address not found")
    if (address.user_id !== user_id) {
        throw new ApiError(403, "Access denied - Address does not belong to you")
    }

    const affectedRows = await setDefaultAddress(id, user_id)
    if (!affectedRows) throw new ApiError(500, "Failed to set default address")

    const updatedAddress = await getAddressById(id)
    return res.status(200)
        .json(new ApiResponse(200, updatedAddress, "Default address set successfully"))
})

export {
    createCustomerAddress,
    getCustomerAddresses,
    getCustomerAddressById,
    updateCustomerAddress,
    deleteCustomerAddress,
    getCustomerDefaultAddress,
    setCustomerDefaultAddress
}

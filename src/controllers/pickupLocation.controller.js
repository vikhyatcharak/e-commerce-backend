// src/controllers/pickupLocation.controller.js
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { createPickupLocation, getAllPickupLocations, getPickupLocationById, getDefaultPickupLocation, updatePickupLocation, deletePickupLocation, setDefaultPickupLocation, getPickupLocationByCity, getPickupLocationsByState } from "../models/pickupLocations.model.js"
import shiprocketService from "../services/shiprocketService.js"

// Create pickup location (Admin only)
const createPickupLoc = asyncHandler(async (req, res) => {
    const { location_name, address, city, state, country, pincode, contact_person, phone, email, is_default } = req.body

    if (!location_name?.trim()) throw new ApiError(400, "Location name is required")
    if (!address?.trim()) throw new ApiError(400, "Address is required")
    if (!city?.trim()) throw new ApiError(400, "City is required")
    if (!state?.trim()) throw new ApiError(400, "State is required")
    if (!country?.trim()) throw new ApiError(400, "Country is required")
    if (!pincode?.trim()) throw new ApiError(400, "Pincode is required")
    if (!email?.trim()) throw new ApiError(400, "email is required")
    if (!contact_person?.trim()) throw new ApiError(400, "Contact Person is required")

    const locationData = {
        location_name: location_name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country:country.trim(),
        pincode: pincode.trim(),
        contact_person:contact_person.trim(),
        phone: phone?.trim() || null,
        email:email?.trim(),
        is_default: is_default || false
    }
    await shiprocketService.createPickupLocation(locationData)
    
    const locationId = await createPickupLocation(locationData)
    if (!locationId) throw new ApiError(500, "Failed to create pickup location")
    

    const newLocation = await getPickupLocationById(locationId)
    return res.status(201)
        .json(new ApiResponse(201, newLocation, "Pickup location created successfully"))
})

// Get all pickup locations
const getAllPickupLoc = asyncHandler(async (req, res) => {
    const locations = await getAllPickupLocations()
    return res.status(200)
        .json(new ApiResponse(200, locations, "Pickup locations retrieved successfully"))
})

// Get pickup location by ID
const getPickupLocById = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) throw new ApiError(400, "Location ID is required")

    const location = await getPickupLocationById(id)
    if (!location) throw new ApiError(404, "Pickup location not found")

    return res.status(200)
        .json(new ApiResponse(200, location, "Pickup location retrieved successfully"))
})

// Get default pickup location
const getDefaultPickupLoc = asyncHandler(async (req, res) => {
    const location = await getDefaultPickupLocation()
    if (!location) throw new ApiError(404, "No default pickup location found")

    return res.status(200)
        .json(new ApiResponse(200, location, "Default pickup location retrieved successfully"))
})

// Update pickup location (Admin only)
const updatePickupLoc = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { location_name, address, city, state, country, pincode, phone,contact_person, is_default } = req.body

    if (!id) throw new ApiError(400, "Location ID is required")

    const existingLocation = await getPickupLocationById(id)
    if (!existingLocation) throw new ApiError(404, "Pickup location not found")

    const updateData = {}
    if (location_name?.trim()) updateData.location_name = location_name.trim()
    if (address?.trim()) updateData.address = address.trim()
    if (city?.trim()) updateData.city = city.trim()
    if (state?.trim()) updateData.state = state.trim()
    if (country?.trim()) updateData.country = country.trim()
    if (pincode?.trim()) updateData.pincode = pincode.trim()
    if (phone?.trim()) updateData.phone = phone.trim()
    if (email?.trim()) updateData.email = email.trim()
    if (contact_person?.trim()) updateData.contact_person = contact_person.trim()
    if (typeof is_default === 'boolean') updateData.is_default = is_default

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No update data provided")
    }
    
    await shiprocketService.updatePickupLocation(location_name?.trim(),{updateData})

    const affectedRows = await updatePickupLocation(id, updateData)
    if (!affectedRows) throw new ApiError(500, "Failed to update pickup location")


    const updatedLocation = await getPickupLocationById(id)
    return res.status(200)
        .json(new ApiResponse(200, updatedLocation, "Pickup location updated successfully"))
})

// Delete pickup location (Admin only)
const deletePickupLoc = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) throw new ApiError(400, "Location ID is required")

    const location = await getPickupLocationById(id)
    if (!location) throw new ApiError(404, "Pickup location not found")
    
    await shiprocketService.deletePickupLocation(location.location_name)

    const affectedRows = await deletePickupLocation(id)
    if (!affectedRows) throw new ApiError(500, "Failed to delete pickup location")

    return res.status(200)
        .json(new ApiResponse(200, { deleted: true }, "Pickup location deleted successfully"))
})

// Set default pickup location (Admin only)
const setDefaultPickupLoc = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) throw new ApiError(400, "Location ID is required")

    const location = await getPickupLocationById(id)
    if (!location) throw new ApiError(404, "Pickup location not found")

    const affectedRows = await setDefaultPickupLocation(id)
    if (!affectedRows) throw new ApiError(500, "Failed to set default pickup location")

    const updatedLocation = await getPickupLocationById(id)
    return res.status(200)
        .json(new ApiResponse(200, updatedLocation, "Default pickup location set successfully"))
})

// Get pickup locations by city
const getPickupLocByCity = asyncHandler(async (req, res) => {
    const { city } = req.params

    if (!city?.trim()) throw new ApiError(400, "City is required")

    const locations = await getPickupLocationByCity(city.trim())
    return res.status(200)
        .json(new ApiResponse(200, locations, `Pickup locations in ${city} retrieved successfully`))
})

// Get pickup locations by state
const getPickupLocByState = asyncHandler(async (req, res) => {
    const { state } = req.params

    if (!state?.trim()) throw new ApiError(400, "State is required")

    const locations = await getPickupLocationsByState(state.trim())
    return res.status(200)
        .json(new ApiResponse(200, locations, `Pickup locations in ${state} retrieved successfully`))
})

export {
    createPickupLoc,
    getAllPickupLoc,
    getPickupLocById,
    getDefaultPickupLoc,
    updatePickupLoc,
    deletePickupLoc,
    setDefaultPickupLoc,
    getPickupLocByCity,
    getPickupLocByState
}

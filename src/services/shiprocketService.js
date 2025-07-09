import axios from 'axios'
import shiprocketAuth from './shiprocketAuth.js'
import { getDefaultPickupLocation } from '../models/pickupLocations.model.js'
import { updateOrderShippingDetails } from '../models/orders.model.js'

class ShiprocketService {
    constructor() {
        this.baseURL = process.env.SHIPROCKET_URL
        this.maxRetries = 2
    }

    async makeRequest(method, endpoint, data = null, retryCount = 0) {
        try {
            const headers = await shiprocketAuth.getAuthHeaders()

            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers,
                timeout: 30000
            }

            if (data) {
                if (method.toLowerCase() === 'get') {
                    config.params = data
                } else {
                    config.data = data
                }
            }
            console.log(config)
            const response = await axios(config)
            return response.data
        } catch (error) {
            // Check if error is due to authentication
            if (this.isAuthError(error) && retryCount < this.maxRetries) {
                console.log(`${error} error detected, refreshing token and retrying (attempt ${retryCount + 1})`)

                try {
                    // Force token refresh
                    await shiprocketAuth.getAuthToken(true)

                    // Retry the request
                    return await this.makeRequest(method, endpoint, data, retryCount + 1)
                } catch (refreshError) {
                    throw refreshError
                }
            }
            throw error
        }
    }

    isAuthError(error) {
        const authErrorCodes = [401, 403]
        const authErrorMessages = [
            'unauthorized',
            'invalid token',
            'token expired',
            'authentication failed'
        ]

        if (error.response && authErrorCodes.includes(error.response.status)) {
            return true
        }

        const errorMessage = (error.response?.data?.message || error.message || '').toLowerCase()
        return authErrorMessages.some(msg => errorMessage.includes(msg))
    }

    async calculateShippingRate(shippingData) {
        try {
            const params = {
                pickup_postcode: shippingData.pickupPostcode,
                delivery_postcode: shippingData.deliveryPostcode,
                weight: shippingData.weight,
                cod: shippingData.cod || 0,
                declared_value: shippingData.declaredValue
            }

            const response = await this.makeRequest('get', 'courier/serviceability/', params)

            return {
                success: true,
                data: response?.data,
                availableCouriers: response.data?.available_courier_companies
            }
        } catch (error) {
            throw new Error(`Rate calculation failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async createOrder(orderData) {
        try {
            let pickupLocation = orderData.pickupLocation
            if (!pickupLocation) {
                const defaultLocation = await getDefaultPickupLocation()
                if (defaultLocation) {
                    pickupLocation = defaultLocation.location_name
                }
            }
            const shiprocketOrder = {
                order_id: Number(orderData.orderId),
                order_date: orderData.orderDate,
                pickup_location: pickupLocation,
                billing_customer_name: orderData.customerName,
                billing_last_name: orderData.customerLastName || '',
                billing_address: orderData.billingAddress,
                billing_address_2: orderData.billingAddress2 || '',
                billing_city: orderData.billingCity,
                billing_pincode: Number(orderData.billingPincode),
                billing_state: orderData.billingState,
                billing_country: orderData.billingCountry,
                billing_email: orderData.email,
                billing_phone: orderData.phone?.toString(),
                billing_alternate_phone: orderData.billingAlternatePhone || '',
                shipping_is_billing: orderData.shippingIsBilling ?? true,
                // latitude: parseFloat(orderData.latitude),
                // longitude: parseFloat(orderData.longitude),
                order_items: orderData.items.map(item => ({
                    name: item.product_name,
                    sku: item.sku,
                    units: Number(item.quantity),
                    selling_price: Number(item.price),
                    tax: parseFloat(item.tax || 0),
                    hsn: item.hsn
                })),
                payment_method: orderData.paymentMethod,
                sub_total: Number(orderData.subTotal),
                length: orderData.dimensions?.length || 10,
                breadth: orderData.dimensions?.breadth || 10,
                height: orderData.dimensions?.height || 10,
                weight: Number(orderData.weight || 1),
                // shipping_method: orderData.shipping_method || 'SR_STANDARD'
            }
            const response = await this.makeRequest('post', 'orders/create/adhoc', shiprocketOrder)
            await updateOrderShippingDetails(orderData.orderId, { shiprocket_order_id: response.order_id, shipment_id: response.shipment_id, pickup_location_id:orderData.pickupLocationId })
            return {
                success: true,
                shiprocketOrderId: response.order_id,
                shipmentId: response.shipment_id,
                data: response
            }
        } catch (error) {
            throw new Error(`Order creation failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async assignCourier(orderData) {
        try {
            const response = await this.makeRequest('post', 'courier/assign/awb', {
                shipment_id: orderData.shipmentId,
                courier_id: orderData.courierId
            })
            const data = response.response?.data
            await updateOrderShippingDetails(orderData.orderId, { awb_code: orderData.awb_code, courier_company_id: orderData.courier_company_id, courier_name: orderData.courier_name, shipping_cost: orderData.shipping_cost, estimated_delivery_days: orderData.estimated_delivery_days, })
            return {
                success: true,
                awbCode: data.awb_code,
                courierName: data.courier_name,
                data: response
            }
        } catch (error) {
            throw new Error(`Courier assignment failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async generatePickup(shipmentId) {
        try {
            const response = await this.makeRequest('post', 'courier/generate/pickup', {
                shipment_id: [shipmentId]
            })

            return {
                success: true,
                pickupScheduled: true,
                data: response
            }
        } catch (error) {
            throw new Error(`Pickup generation failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async trackShipment(orderId) {
        try {
            const response = await this.makeRequest('get', 'courier/track', { order_id: orderId })
            await updateOrderShippingDetails(orderId, { tracking_url: response.tracking_data.track_url })
            return {
                success: true,
                trackingData: response.tracking_data,
                shipmentStatus: response.shipment_status
            }
        } catch (error) {
            throw new Error(`Tracking failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async cancelShipment(id, orderIds) {
        try {
            const response = await this.makeRequest('post', 'orders/cancel', {
                ids: Array.isArray(orderIds) ? orderIds : [orderIds]
            })
            await updateOrderShippingDetails(id, { delivery_status: "cancelled" })
            return {
                success: true,
                data: response
            }
        } catch (error) {
            throw new Error(`Shipment cancellation failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async generateManifest(shipmentIds, orderId) {
        try {
            const response = await this.makeRequest('post', 'manifests/generate', {
                shipment_id: Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds]
            })
            await updateOrderShippingDetails(orderId, { manifest_url: response.manifest_url })
            return {
                success: true,
                manifestUrl: response.manifest_url,
                manifestId: response.manifest_id,
                data: response
            }
        } catch (error) {
            throw new Error(`Manifest generation failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async downloadLabel(orderIds, orderId) {
        try {
            const response = await this.makeRequest('post', 'orders/print/label', {
                ids: Array.isArray(orderIds) ? orderIds : [orderIds]
            })
            await updateOrderShippingDetails(orderId, { label_url: response.label_url })

            return {
                success: true,
                labelUrl: response.label_url,
                data: response
            }
        } catch (error) {
            throw new Error(`Label download failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async downloadInvoice(orderIds, orderId) {
        try {
            const response = await this.makeRequest('post', 'orders/print/invoice', {
                ids: Array.isArray(orderIds) ? orderIds : [orderIds]
            })
            await updateOrderShippingDetails(orderId, { invoice_url: response.invoice_url })

            return {
                success: true,
                invoiceUrl: response.invoice_url,
                data: response
            }
        } catch (error) {
            throw new Error(`Invoice download failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async getShipmentDetails(shipmentId) {
        try {
            const response = await this.makeRequest('get', `shipments/show/${shipmentId}`)

            return {
                success: true,
                shipmentData: response.data,
                awbCode: response.data?.awb_code,
                courierName: response.data?.courier_name,
                status: response.data?.status,
                data: response
            }
        } catch (error) {
            throw new Error(`Shipment details retrieval failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async generateReturnOrder(orderId, returnData, reason) {
        try {
            const returnOrder = {
                order_id: returnData.orderId,
                order_date: returnData.orderDate || new Date().toISOString(),
                channel_id: returnData.channelId || '',
                pickup_customer_name: returnData.pickupCustomerName,
                pickup_last_name: returnData.pickupLastName || '',
                pickup_address: returnData.pickupAddress,
                pickup_city: returnData.pickupCity,
                pickup_state: returnData.pickupState,
                pickup_country: returnData.pickupCountry || 'India',
                pickup_pincode: returnData.pickupPincode,
                pickup_email: returnData.pickupEmail,
                pickup_phone: returnData.pickupPhone,
                shipping_customer_name: returnData.shippingCustomerName,
                shipping_last_name: returnData.shippingLastName || '',
                shipping_address: returnData.shippingAddress,
                shipping_city: returnData.shippingCity,
                shipping_state: returnData.shippingState,
                shipping_country: returnData.shippingCountry || 'India',
                shipping_pincode: returnData.shippingPincode,
                shipping_email: returnData.shippingEmail,
                shipping_phone: returnData.shippingPhone,
                order_items: returnData.items.map(item => ({
                    name: item.name,
                    sku: item.sku,
                    units: item.quantity,
                    selling_price: item.price,
                    discount: item.discount || 0,
                    tax: item.tax || 0,
                    hsn: item.hsn || ''
                })),
                payment_method: returnData.paymentMethod || 'Prepaid',
                sub_total: returnData.subTotal,
                length: returnData.dimensions?.length || 10,
                breadth: returnData.dimensions?.breadth || 10,
                height: returnData.dimensions?.height || 10,
                weight: returnData.weight
            }

            const response = await this.makeRequest('post', 'orders/create/return', returnOrder)

            await updateOrderShippingDetails(orderId, { return_shipment_id: response.returnShipmentId, return_order_id: response.returnOrderId, return_reason: reason })
            return {
                success: true,
                returnOrderId: response.order_id,
                returnShipmentId: response.shipment_id,
                data: response
            }
        } catch (error) {
            throw new Error(`Return order creation failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async createPickupLocation(pickupLocationData) {
        try {
            const payload = {
                pickup_location: pickupLocationData.location_name,
                name: pickupLocationData.contact_person,
                email: pickupLocationData.email,
                phone: pickupLocationData.phone,
                address: pickupLocationData.address,
                address_2: pickupLocationData.address2 || '',
                city: pickupLocationData.city,
                state: pickupLocationData.state,
                country: pickupLocationData.country || 'India',
                pin_code: pickupLocationData.pincode
            }

            const response = await this.makeRequest('post', 'settings/company/addpickup', payload)

            return {
                success: true,
                message: response.message || 'Pickup location created successfully',
                data: response
            }
        } catch (error) {
            throw new Error(`Pickup location creation failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async deletePickupLocation(locationName) {
        try {
            const response = await this.makeRequest('post', 'settings/company/removepickup', {
                pickup_location: locationName
            })

            return {
                success: true,
                message: response.message || 'Pickup location deleted successfully',
                data: response
            }
        } catch (error) {
            throw new Error(`Pickup location deletion failed: ${error.response?.data?.message || error.message}`)
        }
    }

    async updatePickupLocation(locationName, updatedData) {
        try {
            const payload = {
                pickup_location: locationName,
                name: updatedData.contact_person,
                email: updatedData.email,
                phone: updatedData.phone,
                address: updatedData.address,
                address_2: updatedData.address2 || '',
                city: updatedData.city,
                state: updatedData.state,
                country: updatedData.country || 'India',
                pin_code: updatedData.pincode
            }

            const response = await this.makeRequest('post', 'settings/company/updatepickup', payload)

            return {
                success: true,
                message: response.message || 'Pickup location updated successfully',
                data: response
            }
        } catch (error) {
            throw new Error(`Pickup location update failed: ${error.response?.data?.message || error.message}`)
        }
    }



}

export default new ShiprocketService()

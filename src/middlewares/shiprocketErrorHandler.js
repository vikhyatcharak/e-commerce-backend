export const shiprocketErrorHandler = (error, req, res, next) => {
    console.error('Shiprocket API Error:', {
        endpoint: req.originalUrl,
        method: req.method,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    })

    if (error.message.includes('Authentication failed')) {
        return res.status(401).json({
            success: false,
            message: 'Shiprocket authentication failed. Please check API credentials.',
            error: 'SHIPROCKET_AUTH_ERROR'
        })
    }

    if (error.message.includes('Rate calculation failed')) {
        return res.status(400).json({
            success: false,
            message: 'Unable to calculate shipping rates. Please check the provided addresses.',
            error: 'SHIPROCKET_RATE_ERROR'
        })
    }

    return res.status(500).json({
        success: false,
        message: 'Shipping service temporarily unavailable. Please try again later.',
        error: 'SHIPROCKET_SERVICE_ERROR'
    })
}

const errorMiddleware = (err, req, res, next) => {
    const statusCode = err.statusCode || 500

    return res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        errors: err.errors || [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
}

export { errorMiddleware }

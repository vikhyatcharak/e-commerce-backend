import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { ApiResponse } from "./utils/ApiResponse.js"
import { errorMiddleware } from './middlewares/error.middleware.js'

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())


// routes import
import categoriesRouter from "./routes/categories.routes.js"
import subCategoriesRouter from "./routes/subCategories.routes.js"
import couponsRouter from "./routes/coupons.routes.js"
import ordersRouter from "./routes/orders.routes.js"
import productsRouter from "./routes/products.routes.js"
import productVariantsRouter from "./routes/productVariants.routes.js"
import usersRouter from "./routes/users.routes.js"
import adminRouter from "./routes/admin.routes.js"
import emailTemplateRouter from "./routes/email_templates.route.js"
import shippingRouter from "./routes/shipping.routes.js"
import pickupLocationRouter from "./routes/pickupLocation.routes.js"

import customerRouter from "./routes/customer.routes.js"
//routes declaration

//admin routes
app.use("/api/admin", adminRouter)
app.use("/api/admin/users", usersRouter)
app.use("/api/admin/categories", categoriesRouter)
app.use("/api/admin/subCategories", subCategoriesRouter)
app.use("/api/admin/products", productsRouter)
app.use("/api/admin/productVariants", productVariantsRouter)
app.use("/api/admin/coupons", couponsRouter)
app.use("/api/admin/orders", ordersRouter)
app.use("/api/admin/emailTemplates", emailTemplateRouter)
app.use("/api/admin/shiprocket", shippingRouter)
app.use("/api/admin/pickup-locations", pickupLocationRouter)

//customer routes
app.use("/api/customer", customerRouter)


//HealthCheckpoint
app.get("/api/admin/health", (req, res) => {
    res.status(200).json(new ApiResponse(200, [], "Server is running"))
})
app.get("/api/customer/health", (req, res) => {
    res.status(200).json(new ApiResponse(200, [], "Server is running"))
})
app.get("/api/admin/health/shiprocket", async (req, res) => {
    try {
        const tokenInfo = await shiprocketAuth.getTokenInfo()

        const health = {
            shiprocket: {status: tokenInfo.valid ? 'healthy' : 'unhealthy',tokenExists: tokenInfo.exists,tokenValid: tokenInfo.valid,needsRefresh: tokenInfo.needsRefresh,expiryTime: tokenInfo.expiryTime,timeUntilExpiry: tokenInfo.timeUntilExpiry}
        }

        const statusCode = tokenInfo.valid ? 200 : 503
        res.status(statusCode).json(new ApiResponse(statusCode, health, "Shiprocket health check"))
    } catch (error) {
        res.status(503).json(new ApiResponse(503, {
            shiprocket: {
                status: 'error',
                error: error.message
            }
        }, "Shiprocket health check failed"))
    }
})

app.use(errorMiddleware)


export { app }
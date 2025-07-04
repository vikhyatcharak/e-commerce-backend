import 'dotenv/config'
import { connectDB } from './db/index.js'
import { app } from './app.js'
import { initializeTables } from './models/schemaSetup.js'
import shiprocketAuth from './services/shiprocketAuth.js'


async function initializeServices() {
    try {
        // Pre-warm the Shiprocket token
        await shiprocketAuth.getAuthToken()
        console.log('Shiprocket authentication service ready')

        // Log token refresh events
        shiprocketAuth.on('tokenRefreshed', ({ expiryTime }) => {
            console.log('Shiprocket token refreshed successfully; expires at', expiryTime)
        })
    } catch (error) {
        console.error('Failed to initialize Shiprocket auth service:', error)
        // If you can’t get a token, it’s safer to exit than to run in degraded mode
        process.exit(1)
    }
}

function setupGracefulShutdown() {
    const shutdown = async () => {
        console.log('Shutting down gracefully…')
        try {
            await shiprocketAuth.cleanup()
            // close DB connection if you have a disconnect method
            // await disconnectDB()
        } catch (err) {
            console.error('Error during shutdown:', err)
        }
        process.exit(0)
    }

    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
}

async function startServer() {
    await initializeServices()
    setupGracefulShutdown()

    try {
        await connectDB()
        console.log('MySQL connected')

        await initializeTables()
        console.log('Database schema ensured')

        const port = process.env.PORT || 8000
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`)
        })
    } catch (err) {
        console.error('Startup failed:', err)
        process.exit(1)
    }
}

startServer()

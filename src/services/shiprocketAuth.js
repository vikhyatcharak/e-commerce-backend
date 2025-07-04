import axios from 'axios'
import redis from 'redis'
import { EventEmitter } from 'events'

class ShiprocketAuth extends EventEmitter {
    constructor() {
        super()
        this.baseURL = process.env.SHIPROCKET_URL
        this.apiUser = process.env.SHIPROCKET_USER
        this.apiPassword = process.env.SHIPROCKET_PASSWORD
        this.redisClient = redis.createClient()
        this.tokenKey = `${process.env.REDIS_BASE_PREFIX}${process.env.REDIS_SHIPROCKET_KEY}`
        this.tokenExpiryKey = `${this.tokenKey}:expiry`
        this.isRefreshing = false
        this.refreshPromise = null
        this.maxRetries = 3
        this.refreshBuffer = 3600 // Refresh 1 hour before expiry

        // Initialize Redis connection
        this.initializeRedis()

        // Start background refresh checker
        this.startBackgroundRefresh()
    }

    async initializeRedis() {
        try {
            await this.redisClient.connect()
            console.log('Redis connected for Shiprocket auth')
        } catch (error) {
            console.error('Redis connection failed:', error)
        }
    }

    async getAuthToken(forceRefresh = false) {
        try {
            // If already refreshing, wait for current refresh to complete
            if (this.isRefreshing && this.refreshPromise) {
                await this.refreshPromise
            }

            // Check if token exists and is still valid
            if (!forceRefresh) {
                const cachedToken = await this.redisClient.get(this.tokenKey)
                const tokenExpiry = await this.redisClient.get(this.tokenExpiryKey)

                if (cachedToken && tokenExpiry) {
                    const expiryTime = parseInt(tokenExpiry)
                    const currentTime = Math.floor(Date.now() / 1000)
                    const timeUntilExpiry = expiryTime - currentTime

                    // Return cached token if it has more than 1 hour remaining
                    if (timeUntilExpiry > this.refreshBuffer) {
                        return cachedToken
                    }

                    // Token expires soon, trigger background refresh but return current token
                    if (timeUntilExpiry > 0) {
                        this.refreshTokenInBackground()
                        return cachedToken
                    }
                }
            }

            // Token doesn't exist or has expired, refresh now
            return await this.refreshToken()
        } catch (error) {
            throw new Error(`Authentication failed: ${error.message}`)
        }
    }

    async refreshToken() {
        if (this.isRefreshing) {
            return this.refreshPromise
        }

        this.isRefreshing = true
        this.refreshPromise = await this._performTokenRefresh()

        try {
            const token = await this.refreshPromise
            return token
        } finally {
            this.isRefreshing = false
            this.refreshPromise = null
        }
    }

    async _performTokenRefresh() {
        let lastError

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`Attempting token refresh (attempt ${attempt}/${this.maxRetries})`)

                const response = await axios.post(`${this.baseURL}auth/login`, {
                    email: this.apiUser,
                    password: this.apiPassword
                }, {
                    timeout: 10000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })

                const token = response.data?.token

                if (!token) {
                    throw new Error('No token received from Shiprocket API')
                }

                // Calculate expiry time (240 hours = 864000 seconds)
                const expiryTime = Math.floor(Date.now() / 1000) + 864000

                // Cache token for 9.5 days (slightly less than 10-day expiry for safety)
                const cacheTime = 820800

                await Promise.all([
                    this.redisClient.setEx(this.tokenKey, cacheTime, token),
                    this.redisClient.setEx(this.tokenExpiryKey, cacheTime, expiryTime.toString())
                ])

                console.log('Token refreshed successfully')
                this.emit('tokenRefreshed', { token, expiryTime })

                return token
            } catch (error) {
                lastError = error
                console.error(`Token refresh attempt ${attempt} failed:`, error.message)

                if (attempt < this.maxRetries) {
                    const delay = Math.pow(2, attempt) * 1000
                    await new Promise(resolve => setTimeout(resolve, delay))
                }
            }
        }

        throw new Error(`Token refresh failed after ${this.maxRetries} attempts: ${lastError.message}`)
    }

    async refreshTokenInBackground() {
        if (this.isRefreshing) {
            return
        }

        try {
            console.log('Starting background token refresh')
            await this.refreshToken()
        } catch (error) {
            console.error('Background token refresh failed:', error)
        }
    }

    startBackgroundRefresh() {
        // Check every 30 minutes if token needs refresh
        setInterval(async () => {
            try {
                const tokenExpiry = await this.redisClient.get(this.tokenExpiryKey)

                if (tokenExpiry) {
                    const expiryTime = parseInt(tokenExpiry)
                    const currentTime = Math.floor(Date.now() / 1000)
                    const timeUntilExpiry = expiryTime - currentTime

                    // Refresh if token expires within the next hour
                    if (timeUntilExpiry <= this.refreshBuffer && timeUntilExpiry > 0) {
                        console.log('Token expires soon, refreshing in background')
                        await this.refreshTokenInBackground()
                    }
                }
            } catch (error) {
                console.error('Background refresh check failed:', error)
            }
        }, 30 * 60 * 1000) // 30 minutes
    }

    async getTokenInfo() {
        try {
            const token = await this.redisClient.get(this.tokenKey)
            const tokenExpiry = await this.redisClient.get(this.tokenExpiryKey)

            if (!token || !tokenExpiry) {
                return {
                    exists: false,
                    valid: false,
                    needsRefresh: true,
                    timeUntilExpiry: 0
                }
            }

            const expiryTime = parseInt(tokenExpiry)
            const currentTime = Math.floor(Date.now() / 1000)
            const timeUntilExpiry = expiryTime - currentTime

            return {
                exists: true,
                valid: timeUntilExpiry > 0,
                needsRefresh: timeUntilExpiry <= this.refreshBuffer,
                expiryTime: new Date(expiryTime * 1000).toISOString(),
                timeUntilExpiry: Math.max(0, timeUntilExpiry)
            }
        } catch (error) {
            return {
                exists: false,
                valid: false,
                needsRefresh: true,
                error: error.message
            }
        }
    }

    async getAuthHeaders() {
        const token = await this.getAuthToken()
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }

    async cleanup() {
        try {
            await this.redisClient.quit()
        } catch (error) {
            console.error('Error cleaning up Redis connection:', error)
        }
    }
}

export default new ShiprocketAuth()

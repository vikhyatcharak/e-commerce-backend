# 🛍️ E-Commerce Backend

This is the backend for an e-commerce platform that supports both store managers and customers. It features user authentication, product and order management, email notifications, shipping via ShipRocket, and token handling using Redis.

## 🚀 Features

- MySQL database integration
- JWT-based authentication (access & refresh tokens)
- Nodemailer for sending emails
- ShipRocket API integration for order shipping
- Redis for caching and token management
- Environment-based configuration

## 🧰 Tech Stack

- Node.js
- Express.js
- MySQL
- Redis
- JWT
- Nodemailer
- ShipRocket API

---

## 📦 Getting Started

### 1. Clone the Repository

```
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```
npm install
```

### 3. Configure Environment Variables

- given in sample.env
```
PORT=8000

# MySQL Configuration
MYSQL_PASSWORD=your_mysql_password
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_DATABASE=e-commerce

# CORS
CORS_ORIGIN=*

# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# Email (Nodemailer)
MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password

# ShipRocket API
SHIPROCKET_URL=https://apiv2.shiprocket.in/v1/external/
SHIPROCKET_USER=your_shiprocket_email
SHIPROCKET_PASSWORD=your_shiprocket_password

# Redis
REDIS_BASE_PREFIX=shiprocket-api:
REDIS_SHIPROCKET_KEY=auth-token
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Country
COUNTRY_CODE=IN
```
⚠️ Replace all placeholder values with your actual credentials and secrets.

### 4. Start the Server

```
npm start

```

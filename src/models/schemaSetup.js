// src/models/schemaSetup.js
import { db } from '../db/index.js'

export const initializeTables = async () => {
  try {

    //admin
    await db().query(`
      CREATE TABLE IF NOT EXISTS admin(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(500) NOT NULL,
        email VARCHAR(500) UNIQUE NOT NULL,
        username VARCHAR(500) UNIQUE NOT NULL, 
        password VARCHAR(500) NOT NULL,
        refresh_token VARCHAR(1000) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Users table
    await db().query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(500),
        email VARCHAR(500) UNIQUE,
        phone VARCHAR(20) UNIQUE,
        dob DATE,
        gender ENUM('male', 'female', 'other'),
        is_guest BOOLEAN DEFAULT TRUE,
        password VARCHAR(500),
        refresh_token VARCHAR(1000) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    //customer addresses
    await db().query(`
      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        country VARCHAR(100) DEFAULT 'India',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    //categories
    await db().query(` 
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(500) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    //subCategories
    await db().query(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT,
        name VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `)

    // Products table
    await db().query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(300),
        sku VARCHAR(300) UNIQUE,
        hsn VARCHAR(300),
        return_period INT COMMENT 'In days',
        product_type VARCHAR(300),
        tax DECIMAL(5,2),
        discount DECIMAL(10,2),
        description TEXT,
        category_id INT,
        subcategory_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
      )
    `)

    // Product Variants
    await db().query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT,
        variant_name VARCHAR(300),
        description TEXT,
        price DECIMAL(10,2),
        stock INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `)

    // Coupons
    await db().query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(200) UNIQUE,
        description TEXT,
        flat_discount DECIMAL(10,2),
        percentage_discount DECIMAL(5,2),
        quantity INT,
        valid_from_date DATE,
        valid_to_date DATE,
        start_time TIME DEFAULT '00:00:00',
        end_time TIME DEFAULT '00:00:00',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Orders
    await db().query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        customer_address_id INT,
        total DECIMAL(10,2),
        tax DECIMAL(10,2),
        discount DECIMAL(10,2),
        final_total DECIMAL(10,2),
        coupon_id INT,
        payment_mode VARCHAR(50),
        payment_status VARCHAR(50),
        delivery_status VARCHAR(50),
        pickup_location_id INT,
        shiprocket_order_id VARCHAR(100),
        shipment_id VARCHAR(100),
        awb_code VARCHAR(100),
        courier_company_id INT,
        courier_name VARCHAR(200),
        shipping_cost DECIMAL(10,2),
        estimated_delivery_days INT,
        tracking_url TEXT,
        label_url TEXT,
        invoice_url TEXT,
        manifest_url TEXT,
        return_order_id VARCHAR(100),
        return_shipment_id VARCHAR(100),
        return_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
        FOREIGN KEY (customer_address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL
        
      )
    `)

    // Pickup Locations
    await db().query(`
      CREATE TABLE IF NOT EXISTS pickup_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        location_name VARCHAR(300) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        country VARCHAR(100) NOT NULL,
        pincode VARCHAR(10) NOT NULL,
        contact_person VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(500),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

      )
    `)

    // Order Items
    await db().query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_variant_id INT,
        quantity INT,
        price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
      )
    `)

    // OTP sessions
    await db().query(`
    CREATE TABLE IF NOT EXISTS otp_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    //email templates
    await db().query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(300) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    //shopping cart
    await db().query(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_variant_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_variant (user_id, product_variant_id)
      )
    `)


    console.log("Database initialized successfully.")
  } catch (error) {
    console.error("Error initializing database:", error)
  }
}

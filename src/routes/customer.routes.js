// src/routes/customer.routes.js
import { Router } from "express"
import { verifyCustomerJwt } from "../middlewares/auth.middleware.js"

// Import controllers
import {sendCustomerOtp,verifyCustomerOtp,registerCustomer,loginCustomer,logoutCustomer,refreshAccessToken,getCurrentCustomer,updateCustomerProfile,changePassword} from "../controllers/customer.controller.js"

import {createCustomerAddress,getCustomerAddresses,getCustomerAddressById,updateCustomerAddress,deleteCustomerAddress,getCustomerDefaultAddress,setCustomerDefaultAddress} from "../controllers/customerAddress.controller.js"

import {addItemToCart,getCustomerCart,updateCartItemQuantity,removeItemFromCart,clearCustomerCart,getCustomerCartCount,getCustomerCartSummary,validateCustomerCartStock} from "../controllers/customerCart.controller.js"

import {createCustomerOrder,getCustomerOrders,getCustomerOrderById,trackCustomerOrder,cancelCustomerOrder} from "../controllers/customerOrder.controller.js"

import { getAllProd, getPaginatedProd, getProdByCategory, getProdById, getProdBySubcategory } from "../controllers/products.controller.js"

import { getVariantsByProduct } from "../controllers/productVariants.controller.js"

import { getAllCat, getCatById, getPaginatedCat } from "../controllers/categories.controller.js"

import { getAllSubcat, getAllSubcatByCategoryId, getPaginatedSubcat } from "../controllers/subcategories.controller.js"

const router = Router()

// Auth routes (no authentication required)
router.post("/auth/send-otp", sendCustomerOtp)
router.post("/auth/verify-otp", verifyCustomerOtp)
router.post("/auth/register", registerCustomer)
router.post("/auth/login", loginCustomer)

// Protected routes (authentication required)
router.use(verifyCustomerJwt) // Apply middleware to all routes below

// Profile routes
router.get("/profile", getCurrentCustomer)
router.patch("/profile", updateCustomerProfile)
router.post("/auth/logout", logoutCustomer)
router.post("/auth/change-password", changePassword)
router.post("/auth/refresh-token", refreshAccessToken)

// Address routes
router.route("/addresses")
    .get(getCustomerAddresses)
    .post(createCustomerAddress)

router.get("/addresses/default", getCustomerDefaultAddress)

router.patch("/addresses/set-default/:id", setCustomerDefaultAddress)

router.route("/addresses/:id")
    .get(getCustomerAddressById)
    .patch(updateCustomerAddress)
    .delete(deleteCustomerAddress)


// Cart routes
router.route("/cart")
    .get(getCustomerCart)
    .post(addItemToCart)
    .delete(clearCustomerCart)

router.get("/cart/count", getCustomerCartCount)
router.get("/cart/summary", getCustomerCartSummary)
router.post("/cart/validate", validateCustomerCartStock)
router.patch("/cart/update", updateCartItemQuantity)
router.delete("/cart/remove", removeItemFromCart)

// Order routes
router.route("/orders")
    .get(getCustomerOrders)
    .post(createCustomerOrder)

router.get("/orders/track/:id", trackCustomerOrder)
router.post("/orders/cancel/:id", cancelCustomerOrder)
router.get("/orders/:id", getCustomerOrderById)

//get routes
//products
router.route("/products").get(getAllProd)
router.route('/products/paginated').get(getPaginatedProd)
router.route("/products/variant/:product_id").get(getVariantsByProduct)
router.route("/products/:id").get(getProdById)
//categories
router.route("/categories").get(getAllCat)
router.route("/categories/category").get(getCatById)//query
router.route("/categories/paginated").get(getPaginatedCat)
router.route("/categories/subcategories/:category_id").get(getAllSubcatByCategoryId)
router.route("/categories/products/:category_id").get(getProdByCategory)
//subcategories
router.route("/subcategories").get(getAllSubcat)
router.route("/subcategories/paginated").get(getPaginatedSubcat)
router.route("/subcategories/products/:subcategory_id").get(getProdBySubcategory)










export default router

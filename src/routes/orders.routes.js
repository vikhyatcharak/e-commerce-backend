import { Router } from "express"
import {getAllOrdr, getOrdrById, updateDeliveryStatus, updatePaymentStatus } from "../controllers/orders.controller.js"
import { getOrderItm } from "../controllers/orderItems.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { getCustomerAddressById } from "../controllers/customerAddress.controller.js"

const router=Router()

router.route("/").get(verifyJwt,getAllOrdr)

router.patch("/payment",verifyJwt,updatePaymentStatus)
router.patch("/delivery",verifyJwt,updateDeliveryStatus)

router.route('/customer-address').get(verifyJwt,getCustomerAddressById)

router.route("/:id").get(verifyJwt,getOrdrById)

router.route("/:id/items").get(verifyJwt,getOrderItm)

export default router
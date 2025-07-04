import { Router } from "express"
import {getPaginatedVariants, createVariant, deleteVariant, getVariant, updateVariant, updateVariantPrice, updateVariantStock } from "../controllers/productVariants.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/").post(verifyJwt,createVariant)
                .patch(verifyJwt,updateVariant)

router.route("/stock").patch(verifyJwt,updateVariantStock)
router.route("/price").patch(verifyJwt,updateVariantPrice)
router.route('/paginated').get(getPaginatedVariants)

router.route("/:id").get(verifyJwt,getVariant)
                    .delete(verifyJwt,deleteVariant)

export default router
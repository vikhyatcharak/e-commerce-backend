import { Router } from "express"
import { createProd, deleteProd, getAllProd, getProdById, updateProd, getPaginatedProd } from "../controllers/products.controller.js"
import { getVariantsByProduct } from "../controllers/productVariants.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/").get(verifyJwt,getAllProd)
                .post(verifyJwt,createProd)
                .patch(verifyJwt,updateProd)
                
router.route('/paginated').get(verifyJwt,getPaginatedProd)

router.route("/:id").get(verifyJwt,getProdById)
                    .delete(verifyJwt,deleteProd)

router.route("/:product_id/variant").get(verifyJwt,getVariantsByProduct)

export default router
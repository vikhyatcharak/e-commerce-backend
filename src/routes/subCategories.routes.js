import { Router } from "express"
import { createSubcat, deleteSubcat, getAllSubcat, updateSubcat, getPaginatedSubcat } from "../controllers/subcategories.controller.js"
import { getProdBySubcategory } from "../controllers/products.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/").get(verifyJwt,getAllSubcat)
                .put(verifyJwt,updateSubcat)
                .post(verifyJwt,createSubcat)


router.route("/paginated").get(verifyJwt,getPaginatedSubcat)

router.route("/:id").delete(verifyJwt,deleteSubcat)
router.route("/:subcategory_id/products").get(verifyJwt,getProdBySubcategory)

export default router
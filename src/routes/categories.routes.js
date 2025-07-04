import { Router } from "express"
import {getPaginatedCat, createCat, deleteCat, getAllCat, updateCat, getCatById } from "../controllers/categories.controller.js"
import { getAllSubcatByCategoryId } from "../controllers/subcategories.controller.js"
import { getProdByCategory } from "../controllers/products.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/").get(verifyJwt,getAllCat)
                .post(verifyJwt,createCat)
                .put(verifyJwt,updateCat)
                
router.route("/category").get(verifyJwt,getCatById)
router.route("/paginated").get(verifyJwt,getPaginatedCat)

router.route("/:category_id").delete(verifyJwt,deleteCat)
                    .get(verifyJwt,getAllSubcatByCategoryId)

router.route("/:category_id/products").get(verifyJwt,getProdByCategory)

export default router
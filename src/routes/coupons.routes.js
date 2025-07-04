import { Router } from "express"
import { createCoup, deleteCoup, getAllCoup, getCoupByCode, getCoupById, getPaginatedCoup, updateCoup } from "../controllers/coupons.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router=Router()

router.route("/").get(verifyJwt,getAllCoup)
                .post(verifyJwt,createCoup)
                .patch(verifyJwt,updateCoup)

router.route("/paginated").get(verifyJwt,getPaginatedCoup)
router.route("/code/:code").get(verifyJwt,getCoupByCode)
router.route("/id/:id").get(verifyJwt,getCoupById)
                    .delete(verifyJwt,deleteCoup)


export default router
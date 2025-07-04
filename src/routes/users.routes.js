import { Router } from "express"
import { getOrdrByUserId } from "../controllers/orders.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { getAllUsr, getUsr } from "../controllers/users.controller.js"

const router=Router()

router.get('/',verifyJwt,getAllUsr)
router.route("/:id/orders").get(verifyJwt,getOrdrByUserId)
router.get('/:id',verifyJwt,getUsr)

export default router
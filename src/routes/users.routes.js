import { Router } from "express"
import { getOrdrByUserId } from "../controllers/orders.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { getAllUsr, getUsr } from "../controllers/users.controller.js"

const router=Router()

router.get('/',verifyJwt,getAllUsr)
router.post('/lookup',verifyJwt,getUsr)
router.get('/lookup/:id',verifyJwt,getUsr)
router.route("/:user_id/orders").get(verifyJwt,getOrdrByUserId)

export default router
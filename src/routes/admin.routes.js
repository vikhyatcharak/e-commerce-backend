import { Router } from "express"
import {verifyJwt} from "../middlewares/auth.middleware.js"
import { changeCurrentPassword, getCurrentAdmin, logInAdmin, logOutAdmin, refreshAccessToken, registerAdmin, updateAdmin } from "../controllers/admin.controller.js"

const router=Router()

router.route("/register").post(registerAdmin)
router.route("/login").post(logInAdmin)
router.route("/logout").post(verifyJwt,logOutAdmin)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJwt,changeCurrentPassword)
router.route("/current-admin").get(verifyJwt,getCurrentAdmin)
router.route("/update-account").patch(verifyJwt,updateAdmin)

export default router
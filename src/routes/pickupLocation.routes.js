import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import {createPickupLoc,getAllPickupLoc,getPickupLocById,getDefaultPickupLoc,/*updatePickupLoc,deletePickupLoc,*/setDefaultPickupLoc,getPickupLocByCity,getPickupLocByState} from "../controllers/pickupLocation.controller.js"

const router = Router()

// All pickup location routes require admin authentication
router.use(verifyJwt)

router.route("/")
    .get(getAllPickupLoc)
    .post(createPickupLoc)

router.get("/default", getDefaultPickupLoc)
router.get("/city/:city", getPickupLocByCity)
router.get("/state/:state", getPickupLocByState)

router.route("/:id")
    .get(getPickupLocById)
    // .patch(updatePickupLoc)
    // .delete(deletePickupLoc)
    //cannot edit or delete in shiprocket

router.patch("/:id/set-default", setDefaultPickupLoc)

export default router

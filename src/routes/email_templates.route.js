import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { createTemplate, deleteTemplate, getPaginatedTemplates, updateTemplate } from "../controllers/email_templates.controller.js"
import { sendEmailToUser } from '../controllers/email.controller.js'


const router=Router()

router.use(verifyJwt)

router.route('/').get(getPaginatedTemplates)
                 .post(createTemplate)
                 .patch(updateTemplate)

router.route('/send').post(sendEmailToUser)
router.route('/delete/:id').delete(deleteTemplate)

export default router
import {asyncHandler} from '../utils/asyncHandler.js'
import { sendMail } from '../utils/Mailer.js'
import {ApiError} from '../utils/ApiError.js'
import {ApiResponse} from '../utils/ApiResponse.js'

export const sendEmailToUser = asyncHandler(async (req, res) => {
  const { to, subject, message } = req.body

  if (!to || !subject || !message) {
    throw new ApiError(400, 'To, Subject, and Message are required')
  }

  await sendMail({ to, subject, html: message })

  return res.status(200).json(new ApiResponse(200, {}, 'Email sent successfully'))
})

import {asyncHandler} from '../utils/asyncHandler.js'
import { createEmailTemplate, getPaginatedEmailTemplates, updateEmailTemplate, deleteEmailTemplate, getEmailTemplateById } from '../models/email_templates.model.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {ApiError} from '../utils/ApiError.js'

export const createTemplate = asyncHandler(async (req, res) => {
    const { type, subject, message } = req.body
    if (!type.trim() || !subject.trim() || !message.trim()) {
        throw new ApiError(400,'All fields are required')
    }

    const result = await createEmailTemplate({ type:type.trim(), subject:subject.trim(), message:message.trim() })
    return res.status(201).json(new ApiResponse(201, result, 'Template created successfully'))
})

export const getPaginatedTemplates = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '',sortBy = 'created_at',sortOrder = 'DESC' } = req.query
    const result = await getPaginatedEmailTemplates({ page, limit, search,sortBy,sortOrder })
    return res.status(200).json(new ApiResponse(200, result, 'Templates fetched'))
})

export const updateTemplate = asyncHandler(async (req, res) => {
    const { id, type, subject, message } = req.body

    const updateFields = {}
    if (typeof type === 'string' && type.trim()) updateFields.type = type.trim()
    if (typeof subject === 'string' && subject.trim()) updateFields.subject = subject.trim()
    if (typeof message === 'string' && message.trim()) updateFields.message = message.trim()

    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field is required")
    }

    const affectedRows = await updateEmailTemplate(id, updateFields)
    if (!affectedRows) throw new ApiError(400, "Template update failed")

    const updatedTemplate = await getEmailTemplateById(id)
    if (!updatedTemplate) throw new ApiError(404, "Failed to fetch template")

    return res.status(200).json(new ApiResponse(200, updatedTemplate, "Template updated successfully"))
})

export const deleteTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id || isNaN(id)) throw new ApiError(400, "Valid template ID is required")

    const affectedRows = await deleteEmailTemplate(Number(id))
    if (!affectedRows) throw new ApiError(404, "Template not found or already deleted")

    return res.status(200).json(new ApiResponse(200, { deleted: true }, "Template deleted successfully"))
})

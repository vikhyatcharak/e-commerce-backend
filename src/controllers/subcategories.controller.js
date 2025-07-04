import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { getPaginatedSubcategories, createSubcategory, updateSubcategory, getAllSubcategoriesByCategoryId, getSubcategoryById, deleteSubcategory, getAllSubcategories } from "../models/subcategories.model.js"
import { getCategoryById } from "../models/categories.model.js"

const createSubcat = asyncHandler(async (req, res) => {
    const { category_id: rawId, name } = req.body
    if (!rawId) {
        throw new ApiError(400, "categoryId is required")
    }
    if (!name || name?.trim().length === 0) {
        throw new ApiError(400, "name is required")
    }
    const category_id = Number(rawId)
    if (!category_id || isNaN(category_id)) throw new ApiError(400, "Valid categoryId is required")

    const categoryExists = await getCategoryById(category_id)
    if (!categoryExists) {
        throw new ApiError(404, "Category not found with the provided ID")
    }
    const subcategoryId = await createSubcategory(category_id, name?.trim())
    if (!subcategoryId) {
        throw new ApiError(500, "failed to create subCategory")
    }
    const newSubcategory = await getSubcategoryById(subcategoryId)
    return res.status(200)
        .json(new ApiResponse(200, { newSubcategory }, "subcategory created successfully "))
})

const updateSubcat = asyncHandler(async (req, res) => {
    const { id: rawId, name } = req.body//send id through form also (do not let the value of id change)
    if (!rawId) {
        throw new ApiError(400, "id is required")
    }
    const id = Number(rawId)
    if (!id || isNaN(id)) {
        throw new ApiError(400, "Valid id is required")
    }
    if (!name || name?.trim().length === 0) {
        throw new ApiError(400, "name is required")
    }

    const updated = await updateSubcategory(id, { name: name?.trim() })
    if (!updated) { throw new ApiError(500, "Failed to update subcategory or no changes made") }

    return res.status(200)
        .json(new ApiResponse(200, { updated: true }, "subcategory updated successfully"))
})

const getAllSubcatByCategoryId = asyncHandler(async (req, res) => {
    const { category_id: rawId } = req.params
    if (!rawId) {
        throw new ApiError(400, "category_id is required")
    }
    const category_id = Number(rawId)
    if (!category_id || isNaN(category_id)) {
        throw new ApiError(400, "Valid category_id is required")
    }
    const subcategories = await getAllSubcategoriesByCategoryId(category_id)
    return res.status(200)
        .json(new ApiResponse(200, { subcategories }, "subcategories retrieved successfully"))
})

const deleteSubcat = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params

    if (!rawId) {
        throw new ApiError(400, "id is required")
    }
    const id = Number(rawId)
    if (!id || isNaN(id)) {
        throw new ApiError(400, "valid id required")
    }
    const subcategory = await getSubcategoryById(id)
    if (!subcategory) {
        throw new ApiError(404, "subcategory not found")
    }
    const deleted = await deleteSubcategory(id)
    if (!deleted) {
        throw new ApiError(500, "failed to delete product")
    }
    return res.status(200)
        .json(new ApiResponse(200, { deleted: true }, "subcategory deleted successfully "))
})

const getAllSubcat = asyncHandler(async (req, res) => {
    const subcategories = await getAllSubcategories()
    if (!subcategories) {
        throw new ApiError(500, "something went wrong while getting categories")
    }

    return res.status(200)
        .json(new ApiResponse(200, { subcategories }, "Categories retrieved successfully"))
})

const getPaginatedSubcat = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', sortBy = 'created_at', sortOrder = 'DESC', category_id } = req.query

    let categoryId = null
    if (category_id) {
        categoryId = Number(category_id)
        if (isNaN(categoryId)) throw new ApiError(400, "Invalid category ID")
    }

    const result = await getPaginatedSubcategories({
        category_id: categoryId,
        page: Number(page),
        limit: Number(limit),
        search,
        sortBy,
        sortOrder
    })

    return res.status(200).json(new ApiResponse(200, result, "Paginated subcategories fetched"))
})

export {
    createSubcat,
    updateSubcat,
    getAllSubcatByCategoryId,
    deleteSubcat,
    getAllSubcat,
    getPaginatedSubcat
}
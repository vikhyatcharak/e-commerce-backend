import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {getPaginatedCategories, createCategory, updateCategory, getAllCategories, getCategoryById, deleteCategory} from "../models/categories.model.js"

const createCat = asyncHandler(async (req,res)=>{
    const{name} = req.body
    if(!name || name?.trim().length===0){
        throw new ApiError(400,"name is required")
    }

    const categoryId= await createCategory(name?.trim())

    if(!categoryId){
        throw new ApiError(500,"failed to create category")
    }

    const newCategory= await getCategoryById(categoryId)
    return res.status(200)
    .json(new ApiResponse(200,{newCategory},"category created successfully"))
})

const updateCat = asyncHandler(async(req,res)=>{
    const {id:rawId,name} = req.body//send id through form also (do not let the value of id change)
    if(!rawId){
        throw new ApiError(400, "id is required")
    }
    const id=Number(rawId)
    if(!id || isNaN(id)){
        throw new ApiError(400,"Valid id is required")
    }
    if(!name?.trim()){
        throw new ApiError(400,"name is required")
    }

    const affectedRows= await updateCategory(id,{name:name?.trim()})
    if(!affectedRows){throw new ApiError(500,"something went wrong while updating the category")}

    return res.status(200)
    .json(new ApiResponse(200,{updated:true},"category updated successfully"))
})

const getAllCat= asyncHandler(async(req,res)=>{
    const categories= await getAllCategories()
    if(!categories){
        throw new ApiError(500,"something went wrong while getting categories")
    }

    return res.status(200)
    .json(new ApiResponse(200,{categories},"Categories retrieved successfully"))
})

const deleteCat = asyncHandler(async(req,res)=>{
    const {category_id:rawId}=req.params
    if(!rawId){
        throw new ApiError(400, "id is required")
    }
    const category_id=Number(rawId)
    if(!category_id || isNaN(category_id)){
        throw new ApiError(400,"valid id required")
    }
    const category=await getCategoryById(category_id)
    if(!category){
        throw new ApiError(404,"Category not found")
    }
    const affectedRows= await deleteCategory(category_id)
    if(!affectedRows){
        throw new ApiError(500,"Failed to delete product")
    }
    return res.status(200)
    .json(new ApiResponse(200,{deleted:true},"Category deleted successfully "))
})

const getCatById= asyncHandler(async(req,res)=>{
    const{id}=req?.query
    const category= await getCategoryById(id)
    if(!category){
        throw new ApiError(500,"something went wrong while getting categories")
    }

    return res.status(200)
    .json(new ApiResponse(200,{category},"Categories retrieved successfully"))
})

const getPaginatedCat = asyncHandler(async (req, res) => {
    const {page = 1,limit = 10,search = '',sortBy = 'created_at',sortOrder = 'DESC'} = req.query

    const result = await getPaginatedCategories({
        page: Number(page),
        limit: Number(limit),
        search,
        sortBy,
        sortOrder
    })

    return res.status(200).json(new ApiResponse(200, result, "Paginated categories fetched"))
})

export {
    createCat,
    updateCat,
    getAllCat,
    deleteCat,
    getCatById,
    getPaginatedCat
}
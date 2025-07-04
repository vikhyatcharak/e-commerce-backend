import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { getPaginatedProducts, createProduct, getProductById, getAllProducts, updateProduct, deleteProduct, getProductsByCategoryId, getProductsBySubcategoryId } from "../models/products.model.js"

const createProd = asyncHandler(async (req, res) => {
    const { name, sku, hsn, return_period, product_type, tax, discount, description, category_id, subcategory_id } = req.body
    if (!name?.trim()) throw new ApiError(400, "Product name is required")
    if (!sku?.trim()) throw new ApiError(400, "SKU is required")
    if (!category_id) throw new ApiError(400, "Category ID is required")
    if (!subcategory_id) throw new ApiError(400, "Subcategory ID is required")
    if (tax && isNaN(tax)) throw new ApiError(400, "Tax must be a number")
    if (discount && isNaN(discount)) throw new ApiError(400, "Discount must be a number")

    const productId = await createProduct(name?.trim(), sku?.trim(), hsn?.trim(), return_period, product_type?.trim(), tax || 0, discount || 0, description?.trim() || "", Number(category_id), Number(subcategory_id))

    if (!productId) throw new ApiError(500, "Failed to create product")

    const newProduct = await getProductById(productId)
    return res.status(200)
        .json(new ApiResponse(200, newProduct, "Product created successfully"))
})

const updateProd = asyncHandler(async (req, res) => {
    const { id: rawId, ...updateData } = req.body
    if (!rawId) throw new ApiError(400, "Product ID is required")
    const id = Number(rawId)
    if (!id || isNaN(id)) throw new ApiError(400, "Invalid product ID")

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No fields provided to update");
    }
    if (updateData.tax && (isNaN(updateData.tax) || updateData.tax < 0)) throw new ApiError(400, "Tax must be a non-negative number");
    if (updateData.discount && (isNaN(updateData.discount) || updateData.discount < 0)) throw new ApiError(400, "Discount must be a non-negative number");


    const affectedRows = await updateProduct(id, {
        ...updateData,
        ...(updateData.name && { name: updateData.name?.trim() }),
        ...(updateData.sku && { sku: updateData.sku?.trim() }),
        ...(updateData.description && { description: updateData.description?.trim() })
    })

    if (!affectedRows) throw new ApiError(404, "Product not found or no changes made")

    const updatedProduct = await getProductById(id)
    return res.status(200)
        .json(new ApiResponse(200, updatedProduct, "Product updated successfully"))
})

const getAllProd = asyncHandler(async (req, res) => {
    const products = await getAllProducts()
    return res.status(200)
        .json(new ApiResponse(200, products, "Products retrieved successfully"))
})

const getProdById = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Product ID is required")

    const id = Number(rawId)
    if (!id || isNaN(id)) throw new ApiError(400, "Invalid product ID")

    const product = await getProductById(id)
    if (!product) throw new ApiError(404, "Product not found")

    return res.status(200)
        .json(new ApiResponse(200, product, "Product retrieved successfully"))
})

const getProdByCategory = asyncHandler(async (req, res) => {
    const { category_id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Category ID is required")

    const categoryId = Number(rawId)
    if (!categoryId || isNaN(categoryId)) throw new ApiError(400, "Invalid category ID")

    const products = await getProductsByCategoryId(categoryId)
    return res.status(200)
        .json(new ApiResponse(200, products, "Products by category retrieved successfully"))
})

const getProdBySubcategory = asyncHandler(async (req, res) => {
    const { subcategory_id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Subcategory ID is required")

    const subcategoryId = Number(rawId)
    if (!subcategoryId || isNaN(subcategoryId)) throw new ApiError(400, "Invalid subcategory ID")

    const products = await getProductsBySubcategoryId(subcategoryId)
    return res.status(200)
        .json(new ApiResponse(200, products, "Products by subcategory retrieved successfully"))
})

const deleteProd = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Product ID is required")

    const id = Number(rawId)
    if (!id || isNaN(id)) throw new ApiError(400, "Invalid product ID")

    const product = await getProductById(id)
    if (!product) throw new ApiError(404, "Product not found")

    const affectedRows = await deleteProduct(id)
    if (!affectedRows) throw new ApiError(500, "Failed to delete product")

    return res.status(200)
        .json(new ApiResponse(200, { deleted: true }, "Product deleted successfully"))
})


const getPaginatedProd = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'created_at',
        sortOrder = 'DESC',
        category_id,
        subcategory_id,
    } = req.query

    const result = await getPaginatedProducts({
        page: Number(page),
        limit: Number(limit),
        search,
        sortBy,
        sortOrder,
        category_id: category_id ? Number(category_id) : null,
        subcategory_id: subcategory_id ? Number(subcategory_id) : null,
    })

    return res.status(200).json(new ApiResponse(200, result, 'Paginated products fetched'))
})


export {
    createProd,
    updateProd,
    getAllProd,
    getProdById,
    getProdByCategory,
    getProdBySubcategory,
    deleteProd,
    getPaginatedProd
}
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { getPaginatedVariantsByProductId, createProductVariant, getProductVariantsByProductId, getProductVariantById, updateProductVariant, updateStock, updatePrice, deleteProductVariant } from "../models/productVariants.model.js"

const createVariant = asyncHandler(async (req, res) => {

    const { product_id, variant_name, description, price, stock } = req.body

    if (!product_id) throw new ApiError(400, "Product ID is required")
    if (!variant_name?.trim()) throw new ApiError(400, "Variant name is required")
    if (!price || isNaN(price)) throw new ApiError(400, "Valid price is required")
    if (!stock || isNaN(stock)) throw new ApiError(400, "Valid stock quantity is required")

    const variantData = {
        product_id: Number(product_id),
        variant_name: variant_name?.trim(),
        description: description?.trim(),
        price: Number(price),
        stock: Number(stock)
    }

    const variantId = await createProductVariant(variantData)
    if (!variantId) throw new ApiError(500, "Failed to create product variant")

    const newVariant = await getProductVariantById(variantId)
    return res.status(200)
        .json(new ApiResponse(200, newVariant, "Product variant created successfully"))
})

const getVariantsByProduct = asyncHandler(async (req, res) => {
    const { product_id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Product ID is required")

    const productId = Number(rawId)
    if (!productId || isNaN(productId)) throw new ApiError(400, "Invalid product ID")

    const variants = await getProductVariantsByProductId(productId)
    return res.status(200)
        .json(new ApiResponse(200, {variants}, "Product variants retrieved successfully"))
})

const getVariant = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params
    if (!rawId) throw new ApiError(400, "Variant ID is required")

    const variantId = Number(rawId)
    if (!variantId || isNaN(variantId)) throw new ApiError(400, "Invalid variant ID")

    const variant = await getProductVariantById(variantId)
    if (!variant) throw new ApiError(404, "Variant not found")

    return res.status(200)
        .json(new ApiResponse(200, variant, "Variant retrieved successfully"))
})

const updateVariant = asyncHandler(async (req, res) => {
    const { id: rawId, ...updateData } = req.body


    if (!rawId) throw new ApiError(400, "Variant ID is required")
    const variantId = Number(rawId)
    if (!variantId || isNaN(variantId)) throw new ApiError(400, "Invalid variant ID")

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No update data provided")
    }

    if (updateData.price && isNaN(updateData.price)) {
        throw new ApiError(400, "Price must be a number")
    }
    if (updateData.stock && isNaN(updateData.stock)) {
        throw new ApiError(400, "Stock must be a number")
    }

    const updated = await updateProductVariant(variantId, {
        ...updateData,
        ...(updateData.variant_name && { variant_name: updateData.variant_name?.trim() }),
        ...(updateData.description && { description: updateData.description?.trim() })
    })

    if (!updated) throw new ApiError(404, "Variant not found or no changes made")

    const updatedVariant = await getProductVariantById(variantId)
    return res.status(200)
        .json(new ApiResponse(200, updatedVariant, "Variant updated successfully"))
})

const updateVariantStock = asyncHandler(async (req, res) => {
    const { id: rawId, stock: rawStock } = req.body

    if (!rawId) throw new ApiError(400, "Variant ID is required")
    if (!rawStock) throw new ApiError(400, "Stock value is required")

    const variantId = Number(rawId)
    const stock = Number(rawStock)

    if (!variantId || isNaN(variantId)) throw new ApiError(400, "Invalid variant ID")
    if (isNaN(stock)) throw new ApiError(400, "Invalid stock value")

    const affectedRows = await updateStock(variantId, { stock })
    if (!affectedRows) throw new ApiError(404, "Variant not found")

    const updatedVariant = await getProductVariantById(variantId)
    return res.status(200)
        .json(new ApiResponse(200, updatedVariant, "Stock updated successfully"))
})

const updateVariantPrice = asyncHandler(async (req, res) => {
    const { id: rawId, price: rawPrice } = req.body

    if (!rawId) throw new ApiError(400, "Variant ID is required")
    if (!rawPrice) throw new ApiError(400, "price value is required")

    const variantId = Number(rawId)
    const price = Number(rawPrice)

    if (!variantId || isNaN(variantId)) throw new ApiError(400, "Invalid variant ID")
    if (isNaN(price)) throw new ApiError(400, "Invalid price value")

    const affectedRows = await updatePrice(variantId, { price })
    if (!affectedRows) throw new ApiError(404, "Variant not found")

    const updatedVariant = await getProductVariantById(variantId)
    return res.status(200)
        .json(new ApiResponse(200, updatedVariant, "price updated successfully"))
})

const deleteVariant = asyncHandler(async (req, res) => {
    const { id: rawId } = req.params

    if (!rawId) throw new ApiError(400, "Variant ID is required")

    const variantId = Number(rawId)
    if (!variantId || isNaN(variantId)) throw new ApiError(400, "Invalid variant ID")

    const variant = await getProductVariantById(variantId)
    if (!variant) throw new ApiError(404, "Variant not found")


    const affectedRows = await deleteProductVariant(variantId)
    if (!affectedRows) throw new ApiError(500, "Failed to delete variant")

    return res.status(200)
        .json(new ApiResponse(200, { deleted: true }, "Variant deleted successfully"))
})

const getPaginatedVariants = asyncHandler(async (req, res) => {
    const {page = 1,limit = 10,search = '',sortBy = 'created_at',sortOrder = 'DESC',product_id} = req.query

    if (!product_id) throw new ApiError(400, "Product ID is required")
    const productId = Number(product_id)
    if (!productId || isNaN(productId)) throw new ApiError(400, "Invalid Product ID")

    const result = await getPaginatedVariantsByProductId({
        product_id: productId,
        page: Number(page),
        limit: Number(limit),
        search,
        sortBy,
        sortOrder
    })

    return res.status(200).json(new ApiResponse(200, result, "Paginated product variants fetched"))
})

export {
    createVariant,
    getVariantsByProduct,
    getVariant,
    updateVariant,
    updateVariantStock,
    updateVariantPrice,
    deleteVariant,
    getPaginatedVariants
}
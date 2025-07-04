export const sendInvoice = (order) => {
  console.log('------- Invoice -------')
  console.log(`Order ID: ${order.orderId}`)
  console.log(`User ID: ${order.userId}`)
  console.log('Items:')
  order.items.forEach(item => {
    console.log(`- Variant ID: ${item.variantId}, Quantity: ${item.quantity}`)
  })
  console.log(`Total: ${order.total}`)
  console.log(`Tax: ${order.tax}`)
  console.log(`Discount: ${order.discount}`)
  console.log(`Final Total: ${order.finalTotal}`)
  console.log('-----------------------')
}
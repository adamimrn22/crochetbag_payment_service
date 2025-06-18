function calculateTotal(orders) {
  if (!Array.isArray(orders)) {
    throw new Error("Orders must be an array");
  }

  return orders.reduce((total, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return total + price * quantity;
  }, 0);
}

module.exports = calculateTotal;

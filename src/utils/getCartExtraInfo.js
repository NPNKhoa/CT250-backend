export const getTotalPrice = (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return 0;
  }

  const totalPrice = cartItems.reduce((acc, item) => item.itemPrice + acc, 0);
  return totalPrice;
};

export const getTotalItems = (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return 0;
  }

  const totalItems = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return totalItems;
};

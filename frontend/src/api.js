const BASE_URL = "http://127.0.0.1:8000"

export const api = {
  // Получить все кроссовки
  getProducts: async () => {
    const response = await fetch(`${BASE_URL}/sneakers/`)
    if (!response.ok) {
      throw new Error("Ошибка загрузки товаров")
    }
    const data = await response.json()
    return data.map((item) => ({
      id: item.id,
      title: item.name,
      price: item.price,
      imageUrl: `/img/sneakers/${item.id}.png`, // Всегда формируем путь по id!
      gender: item.gender,
      category: item.category,
      season: item.season || "",
      color: item.color || "",
      sizes: item.sizes || {},
    }))
  },

  // Логин
  login: async (email, password) => {
    const response = await fetch(`${BASE_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Ошибка входа")
    }
    return await response.json()
  },

  // Регистрация
  register: async (username, email, password) => {
    const response = await fetch(`${BASE_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Ошибка регистрации")
    }
    return await response.json()
  },

  // Получить корзину пользователя
  getCart: async (userId) => {
    const response = await fetch(`${BASE_URL}/orders/${userId}/`)
    if (!response.ok) {
      throw new Error("Ошибка загрузки корзины")
    }
    return await response.json()
  },

  // Обновить корзину пользователя
  updateCart: async (cartId, cartItems) => {
    const response = await fetch(`${BASE_URL}/orders/${cartId}/update/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartItems }),
    })
    if (!response.ok) {
      throw new Error("Ошибка обновления корзины")
    }
    return await response.json()
  },
  // Создать новый заказ (корзину)
  createOrder: async (userId, cartItems) => {
    const response = await fetch(`${BASE_URL}/orders/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, items: cartItems }),
    })

    if (!response.ok) {
      throw new Error("Ошибка оформления заказа")
    }
    return await response.json()
  },

  // Удалить заказ
  deleteOrder: async (cartId) => {
    const response = await fetch(
      `${BASE_URL}/sneakers/orders/delete/${cartId}/`,
      {
        method: "DELETE",
      }
    )
    if (!response.ok) {
      throw new Error("Ошибка удаления заказа")
    }
    return await response.json()
  },
}

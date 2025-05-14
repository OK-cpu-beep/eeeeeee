import React, { useCallback, useMemo, useEffect, useState } from "react"
import { Route, Routes, Navigate } from "react-router-dom"
import Header from "./components/Header"
import Drawer from "./components/Drawer"
import ThemeToggle from "./components/ThemeToggle"
import AppContext from "./context"
import { ParallaxProvider } from "react-scroll-parallax"
import NeonParallaxBackground from "./components/NeonParallaxBackground"
import { api } from "./api"

import Home from "./pages/Home"
import Favorites from "./pages/Favorites"
import Orders from "./pages/Orders"
import Product from "./pages/Product"
import Registration from "./pages/Registration"
import PromoRoulettePage from "./pages/PromoRoulettePage"

function App() {
  const [items, setItems] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [cartId, setCartId] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [searchValue, setSearchValue] = useState("")
  const [cartOpened, setCartOpened] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)

  // Загрузка товаров
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true)
        const products = await api.getProducts()
        setItems(products)
      } catch (error) {
        console.error("Failed to load products:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Проверка аутентификации и загрузка корзины из localStorage (для гостя)
  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated")
    const user = localStorage.getItem("currentUser")
    if (auth === "true" && user) {
      setIsAuthenticated(true)
      setCurrentUser(JSON.parse(user))
    } else {
      // Для гостя - только localStorage
      const savedCart = localStorage.getItem("cartItems")
      if (savedCart) {
        setCartItems(JSON.parse(savedCart))
      }
    }
  }, [])

  // Получение/создание корзины на сервере после логина/регистрации/обновления страницы
  // App.jsx
  useEffect(() => {
    const fetchCartForUser = async () => {
      if (isAuthenticated && currentUser && currentUser.id) {
        try {
          const carts = await api.getCart(currentUser.id)

          // Ищем активную корзину
          let activeCart = carts.find((c) => !c.is_paid) || carts[0] || null

          if (!activeCart) {
            activeCart = await api.createOrder(currentUser.id, [])
          }

          setCartId(activeCart.id)

          // Проверяем наличие items
          if (activeCart.items && activeCart.items.length > 0) {
            const newCartItems = activeCart.items.map((item) => ({
              id: item.id,
              parentId: item.sneaker.id,
              title: item.sneaker.name,
              imageUrl: `/img/sneakers/${item.sneaker.id}.png`,
              price: item.sneaker.price,
              size: item.size,
              quantity: item.quantity,
            }))

            setCartItems(newCartItems)
            localStorage.setItem("cartItems", JSON.stringify(newCartItems))
          } else {
            setCartItems([])
          }
        } catch (error) {
          console.error("Ошибка загрузки или создания корзины:", error)
        }
      } else {
        setCartId(null)
      }
    }

    fetchCartForUser()
  }, [isAuthenticated, currentUser])

  // Синхронизация корзины с сервером (только для авторизованного)
  useEffect(() => {
    const syncCart = async () => {
      if (isAuthenticated && currentUser && cartId) {
        try {
          await api.updateCart(
            cartId,
            cartItems.map((item) => ({
              sneaker_id: item.parentId,
              size: item.size,
              quantity: item.quantity,
            }))
          )
        } catch (error) {
          console.error("Ошибка обновления корзины на сервере:", error)
        }
      }
      // Для гостя корзина всегда в localStorage
      if (!isAuthenticated) {
        localStorage.setItem("cartItems", JSON.stringify(cartItems))
      }
    }
    syncCart()
    // eslint-disable-next-line
  }, [cartItems, isAuthenticated, currentUser, cartId])
  const handleLogin = async (email, password) => {
    try {
      const user = await api.login(email, password)
      setIsAuthenticated(true)
      setCurrentUser(user)
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("currentUser", JSON.stringify(user))

      // Передаем гостевую корзину
      const guestCart = JSON.parse(localStorage.getItem("cartItems")) || []
      if (guestCart.length > 0) {
        const carts = await api.getCart(user.id)
        let activeCart = carts.find((c) => !c.is_paid) || null

        if (!activeCart) {
          activeCart = await api.createOrder(user.id, [])
        }

        const mergedItems = [...guestCart].reduce((acc, item) => {
          const key = `${item.parentId}-${item.size}`
          if (acc[key]) {
            acc[key].quantity += item.quantity
          } else {
            acc[key] = { ...item }
          }
          return acc
        }, {})

        await api.updateCart(activeCart.id, Object.values(mergedItems))
        setCartItems(Object.values(mergedItems))
      }

      return { success: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
  const handleRegister = async (username, email, password) => {
    try {
      const user = await api.register(username, email, password)
      setIsAuthenticated(true)
      setCurrentUser(user)
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("currentUser", JSON.stringify(user))
      return { success: true }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentUser(null)
    setCartId(null)
    setCartItems([])
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("currentUser")
    localStorage.removeItem("cartItems")
  }

  // Корзина и избранное
  const onAddToCart = useCallback(
    (obj) => {
      const findItem = cartItems.find(
        (item) =>
          Number(item.parentId) === Number(obj.id) &&
          item.size === (obj.size || "default")
      )
      if (findItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            Number(item.parentId) === Number(obj.id) &&
            item.size === (obj.size || "default")
              ? {
                  ...item,
                  quantity: item.quantity + (obj.quantity || 1),
                }
              : item
          )
        )
      } else {
        setCartItems((prev) => [
          ...prev,
          {
            ...obj,
            id: Date.now(),
            parentId: obj.id,
            size: obj.size || "default",
            quantity: obj.quantity || 1,
          },
        ])
      }
    },
    [cartItems]
  )

  const onRemoveItem = useCallback((id) => {
    setCartItems((prev) =>
      prev.filter((item) => Number(item.id) !== Number(id))
    )
  }, [])

  const onAddToFavorite = useCallback(
    (obj) => {
      const exists = favorites.find((fav) => fav.id === obj.id)
      if (exists) {
        setFavorites((prev) => prev.filter((fav) => fav.id !== obj.id))
      } else {
        setFavorites((prev) => [...prev, obj])
      }
    },
    [favorites]
  )

  const onChangeSearchInput = useCallback((event) => {
    setSearchValue(event.target.value)
  }, [])

  const isItemAdded = useCallback(
    (id, size = "default") => {
      return cartItems.some(
        (obj) => Number(obj.parentId) === Number(id) && obj.size === size
      )
    },
    [cartItems]
  )

  const contextValue = useMemo(
    () => ({
      items,
      cartItems,
      favorites,
      isItemAdded,
      onAddToFavorite,
      onAddToCart,
      setCartOpened,
      setCartItems,
      isAuthenticated,
      setIsAuthenticated,
      onRemoveItem,
      currentUser,
      handleLogin,
      handleRegister,
      handleLogout,
    }),
    [
      items,
      cartItems,
      favorites,
      isItemAdded,
      onAddToFavorite,
      onAddToCart,
      isAuthenticated,
      onRemoveItem,
      currentUser,
    ]
  )

  return (
    <ParallaxProvider>
      <NeonParallaxBackground />
      <AppContext.Provider value={contextValue}>
        <div className="wrapper clear">
          <ThemeToggle />
          <Drawer
            items={cartItems}
            onClose={() => setCartOpened(false)}
            onRemove={onRemoveItem}
            opened={cartOpened}
          />

          <Header onClickCart={() => setCartOpened(true)} />

          <Routes>
            <Route
              path="/"
              element={
                <Home
                  items={items}
                  cartItems={cartItems}
                  searchValue={searchValue}
                  setSearchValue={setSearchValue}
                  onChangeSearchInput={onChangeSearchInput}
                  onAddToFavorite={onAddToFavorite}
                  onAddToCart={onAddToCart}
                  isLoading={isLoading}
                />
              }
            />
            <Route path="/favorites" element={<Favorites />} />
            <Route
              path="/orders"
              element={
                isAuthenticated ? (
                  <Orders />
                ) : (
                  <Navigate to="/auth" state={{ from: "/orders" }} replace />
                )
              }
            />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/auth" element={<Registration />} />
            <Route
              path="/promo-roulette"
              element={
                isAuthenticated ? (
                  <PromoRoulettePage />
                ) : (
                  <Navigate
                    to="/auth"
                    state={{ from: "/promo-roulette" }}
                    replace
                  />
                )
              }
            />
          </Routes>
        </div>
      </AppContext.Provider>
    </ParallaxProvider>
  )
}

export default App

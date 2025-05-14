import React, { useContext, useState } from "react"
import AppContext from "../context"
import { useCart } from "../hooks/useCart"
import { api } from "../api"

function Orders() {
  const { cartItems, setCartItems, onRemoveItem, currentUser } =
    useContext(AppContext)
  const { totalPrice } = useCart()
  const [orderStatus, setOrderStatus] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [promoError, setPromoError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [deliveryMethod, setDeliveryMethod] = useState("krasnodar")

  const PROMO_CODES = [
    { code: "SALE10", discount: 10 },
    { code: "SALE5", discount: 5 },
    { code: "SALE15", discount: 15 },
    { code: "SALE20", discount: 20 },
  ]

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      onRemoveItem(id)
    } else if (newQuantity <= 10) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      )
    }
  }

  const handlePromoCode = () => {
    const found = PROMO_CODES.find(
      (promo) => promo.code.toLowerCase() === promoCode.trim().toLowerCase()
    )
    if (found) {
      setDiscount(found.discount)
      setPromoError("")
    } else {
      setPromoError("Неверный промокод")
      setDiscount(0)
    }
  }

  const handleOrder = async () => {
    if (!currentUser || !currentUser.id) {
      setOrderStatus("Ошибка: пользователь не найден")
      return
    }
    if (cartItems.length === 0) {
      setOrderStatus("Корзина пуста")
      return
    }
    try {
      // Создаём заказ на сервере
      await api.createOrder(
        currentUser.id,
        cartItems.map((item) => ({
          sneaker_id: item.parentId,
          size: item.size,
          quantity: item.quantity,
        }))
      )
      setOrderStatus("Заказ оформлен!")
      setCartItems([])
      localStorage.removeItem("cartItems")
    } catch (error) {
      setOrderStatus("Ошибка оформления заказа")
    }
  }

  const deliveryCost =
    totalPrice >= 20000 ? 0 : deliveryMethod === "krasnodar" ? 0 : 400
  const discountedPrice = totalPrice * (1 - discount / 100)
  const finalPrice = discountedPrice + deliveryCost

  return (
    <div className="content p-40">
      <div className="d-flex align-center justify-between mb-40">
        <h1>Мои заказы</h1>
      </div>

      <div className="cartItems">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <h3>Корзина пуста</h3>
            <p>Добавьте товары, чтобы оформить заказ.</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div key={item.id} className="cartItem d-flex align-center mb-20">
              <div
                style={{ backgroundImage: `url(${item.imageUrl})` }}
                className="cartItemImg"
              ></div>
              <div className="mr-20 flex">
                <p className="mb-5">{item.title}</p>
                {item.size !== "default" && (
                  <p className="mb-5">Размер: {item.size}</p>
                )}
                <b>
                  {(item.price * item.quantity).toFixed(2)} руб. (x
                  {item.quantity})
                </b>
              </div>
              <div className="cart-item-quantity d-flex align-center">
                <button
                  className="quantity-button minus"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-value">{item.quantity}</span>
                <button
                  className="quantity-button plus"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= 10}
                >
                  +
                </button>
                <button
                  className="remove-button"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <img src="/img/btn-remove.svg" alt="Remove" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <>
          <div className="order-options mb-30">
            <div className="promo-section mb-20">
              <h3>Промокод</h3>
              <div className="d-flex align-center">
                <input
                  type="text"
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="promo-input"
                />
                <button onClick={handlePromoCode} className="promo-button">
                  Применить
                </button>
              </div>
              {promoError && <div className="promo-error">{promoError}</div>}
              {discount > 0 && (
                <div className="promo-success">
                  Промокод применен! Скидка {discount}%
                </div>
              )}
            </div>

            <div className="delivery-section mb-20">
              <h3>Способ доставки</h3>
              <div className="delivery-options">
                <label className="delivery-option">
                  <input
                    type="radio"
                    name="delivery"
                    value="krasnodar"
                    checked={deliveryMethod === "krasnodar"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                  />
                  <span>По Краснодару (бесплатно)</span>
                </label>
                <label className="delivery-option">
                  <input
                    type="radio"
                    name="delivery"
                    value="russia"
                    checked={deliveryMethod === "russia"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                  />
                  <span>По России (400 руб.)</span>
                </label>
              </div>
            </div>

            <div className="payment-section">
              <h3>Способ оплаты</h3>
              <div className="payment-options">
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Оплата картой</span>
                </label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Наличными при получении</span>
                </label>
              </div>
            </div>
          </div>

          <div className="cartTotalBlock">
            <ul>
              <li>
                <span>Итого:</span>
                <div></div>
                <b>{totalPrice.toFixed(2)} руб.</b>
              </li>
              {discount > 0 && (
                <li>
                  <span>Скидка {discount}%:</span>
                  <div></div>
                  <b>-{(totalPrice - discountedPrice).toFixed(2)} руб.</b>
                </li>
              )}
              {deliveryCost > 0 && (
                <li>
                  <span>Доставка:</span>
                  <div></div>
                  <b>{deliveryCost.toFixed(2)} руб.</b>
                </li>
              )}
              <li>
                <span>К оплате:</span>
                <div></div>
                <b>{finalPrice.toFixed(2)} руб.</b>
              </li>
            </ul>
            <button
              onClick={handleOrder}
              className="greenButton"
              disabled={cartItems.length === 0}
            >
              Оформить заказ <img src="/img/arrow.svg" alt="Arrow" />
            </button>
            {orderStatus && <div className="notification">{orderStatus}</div>}
          </div>
        </>
      )}
    </div>
  )
}

export default Orders

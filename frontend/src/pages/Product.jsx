import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import AppContext from "../context"

function Product() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, onAddToCart, isItemAdded } = React.useContext(AppContext)
  const [selectedSize, setSelectedSize] = useState(null)
  const [showNotification, setShowNotification] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const product = items.find((item) => item.id === Number(id))

  if (!product) {
    return <div>Товар не найден</div>
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Пожалуйста, выберите размер")
      return
    }

    onAddToCart({
      ...product,
      parentId: product.id,
      size: selectedSize,
      quantity: quantity,
    })

    setShowNotification(true)
    setTimeout(() => setShowNotification(false), 3000)
  }

  const increaseQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 10))
  }

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="product">
      <div className="product__header">
        <button onClick={() => navigate(-1)} className="product__back">
          <img src="/img/btn-remove.svg" alt="Back" />
        </button>
        <h1>{product.title}</h1>
      </div>

      <div className="product__content">
        <div className="product__image">
          <img src={product.imageUrl} alt={product.title} />
        </div>

        <div className="product__info">
          <div className="product__price">{product.price} руб.</div>

          <div className="product__section">
            <h3>Размер</h3>
            <div className="product__sizes">
              {[38, 39, 40, 41, 42, 43, 44, 45].map((size) => (
                <button
                  key={size}
                  className={`product__size ${
                    selectedSize === size ? "active" : ""
                  } ${isItemAdded(product.id, size) ? "added" : ""}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="product__section">
            <h3>Пол</h3>
            <p>
              {product.gender === "male"
                ? "Мужской"
                : product.gender === "female"
                ? "Женский"
                : "Унисекс"}
            </p>
          </div>

          <div className="product__section">
            <h3>Тип</h3>
            <p>
              {product.category === "sport" ? "Спортивные" : "Повседневные"}
            </p>
          </div>

          <div className="product__section">
            <h3>Сезонность</h3>
            <p>Всесезонные</p>
          </div>
          <div className="product__section">
            <h3>Количество</h3>
            <div className="quantity-selector">
              <button
                className="quantity-button minus"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-value">{quantity}</span>
              <button
                className="quantity-button plus"
                onClick={increaseQuantity}
                disabled={quantity >= 10}
              >
                +
              </button>
            </div>
          </div>

          <button
            className="greenButton"
            onClick={handleAddToCart}
            disabled={isItemAdded(product.id, selectedSize)}
          >
            {isItemAdded(product.id, selectedSize)
              ? "В корзине"
              : "Добавить в корзину"}
          </button>
        </div>
      </div>

      {showNotification && (
        <div className="notification">Товар добавлен в корзину!</div>
      )}
    </div>
  )
}

export default Product

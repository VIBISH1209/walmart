import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, 
  FaShoppingCart, 
  FaShoppingBag, 
  FaComments, 
  FaPaperPlane,
  FaStar,
  FaRegStar,
  FaBox,
  FaStore,
  FaTag
} from 'react-icons/fa';
import { io } from 'socket.io-client';

const ProductDetails = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [predictedLabel, setPredictedLabel] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const navigate = useNavigate();
  const userId = localStorage.getItem("Id");

  const socketRef = useRef();

  // ✅ Initialize socket
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');

    // ✅ Join buyer room
    socketRef.current.emit("joinRoom", userId);

    socketRef.current.on('receiveMessage', (message) => {
      if (
        product &&
        (
          (message.senderId === product.sellerId && message.receiverId === userId && message.productId === id) ||
          (message.senderId === userId && message.receiverId === product.sellerId && message.productId === id)
        )
      ) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [userId, id, product?.sellerId]);

  // ✅ Fetch messages when product is loaded
  useEffect(() => {
    if (!product) return;
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/messages/${userId}/${product.sellerId}/${id}`
        );
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };
    fetchMessages();
  }, [product, userId, id]);

  // ✅ Send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !product) return;

    const messageData = {
      senderId: userId,
      receiverId: product.sellerId,
      productId: id,
      message: newMessage
    };

    socketRef.current.emit('sendMessage', messageData);
    setNewMessage('');
  };

  // ✅ Fetch product + recommendations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/pro/all-products");
        const prod = data.find(p => p._id === id);
        setProduct(prod);
        setLoading(false);

        if (prod?._id) {
          const recRes = await axios.get(`http://localhost:8000/recommend/${id}`);
          setRecommended(Array.isArray(recRes.data) ? recRes.data : []);
        }

        if (prod?.productName) {
          const labelRes = await axios.post("http://localhost:8000/predict-label", {
            productName: prod.productName
          });
          setPredictedLabel(labelRes.data.predictedLabel);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ✅ Add to Cart
  const handleAddToCart = async () => {
    if (!userId) {
      alert("Please log in to add items to cart.");
      return;
    }

    if (quantity > product.stock) {
      setAddedMessage(`Only ${product.stock} item(s) available in stock.`);
      setTimeout(() => setAddedMessage(''), 3000);
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/cart/cartItems", {
        id: userId,
        productName: product.productName,
        price: product.price,
        image: product.image,
        quantity: quantity,
        productId: product._id,
        sellerId: product.sellerId
      });

      setAddedMessage(`Added ${quantity} item(s) to cart successfully!`);
      setTimeout(() => setAddedMessage(''), 3000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      setAddedMessage("Failed to add item to cart.");
      setTimeout(() => setAddedMessage(''), 3000);
    }
  };

  const renderStars = (rating) => {
    return (
      <span className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map(i =>
          i <= rating
            ? <FaStar key={i} className="text-warning" />
            : <FaRegStar key={i} className="text-muted" />
        )}
      </span>
    );
  };

  if (loading || !product) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <h4 className="text-muted">Loading product details...</h4>
      </div>
    );
  }

  return (
    <div className="min-vh-100">
      {/* Header */}
      <div className="sticky-top shadow-lg bg-primary text-white py-3">
        <div className="container d-flex align-items-center">
          <button onClick={() => window.history.back()} className="btn btn-light me-3 rounded-pill shadow-sm">
            <FaArrowLeft className="me-2" />
            Back
          </button>
          <h4 className="mb-0">{product.productName}</h4>
        </div>
      </div>

      <div className="container py-5">
        <div className="row g-5 mb-5">
          {/* Product Image */}
          <div className="col-lg-6">
            <img
              src={product.image?.[selectedImage] || product.image?.[0]}
              alt={product.productName}
              className="img-fluid rounded-4 shadow-lg"
            />
          </div>

          {/* Product Info */}
          <div className="col-lg-6">
            <h1>{product.productName}</h1>
            <h2>₹{product.price}</h2>
            <p>Sold by: <strong>{product.sellerName}</strong></p>

            <div className="mb-3">
              <label>Quantity:</label>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="form-control w-50"
              />
            </div>

            <button onClick={handleAddToCart} className="btn btn-primary me-2">
              <FaShoppingCart className="me-2" /> Add to Cart
            </button>
            <button onClick={() => navigate('/cart')} className="btn btn-outline-primary">
              <FaShoppingBag className="me-2" /> Go to Cart
            </button>

            {addedMessage && (
              <div className="alert mt-3">
                {addedMessage}
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="card shadow-lg rounded-4 mb-5">
          <div className="card-header">
            <FaComments className="me-2" /> Message Seller
          </div>
          <div className="card-body">
            <div className="mb-3 d-flex">
              <textarea
                rows="2"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="form-control me-2"
              />
              <button
                onClick={handleSendMessage}
                className="btn btn-primary"
                disabled={!newMessage.trim()}
              >
                <FaPaperPlane /> Send
              </button>
            </div>

            <div className="chat-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`d-flex mb-2 ${msg.senderId === userId ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className={`p-2 rounded-3 ${msg.senderId === userId ? 'bg-primary text-white' : 'bg-light'}`}
                  >
                    <p className="mb-1">{msg.message}</p>
                    {/* ✅ Use createdAt from backend */}
                    <small>{new Date(msg.createdAt).toLocaleTimeString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="card shadow-lg rounded-4 mb-5">
          <div className="card-header">
            <FaStar className="text-warning me-2" /> Reviews
          </div>
          <div className="card-body">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((review, i) => (
                <div key={i} className="mb-3">
                  <strong>{review.userName}</strong>
                  {renderStars(review.rating)}
                  <p>{review.comment}</p>
                </div>
              ))
            ) : (
              <p>No reviews yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;

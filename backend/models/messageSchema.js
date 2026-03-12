const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Products',
  },
  message: {
    type: String,
    required: true,
  },
}, { timestamps: true }); 


module.exports = mongoose.model('Message', messageSchema);

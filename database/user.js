const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true
  },
  emailId: {
    type: String,
    required: true,
    unique: true
  },
  types: {
    type: String,
  },
  contacts: 
  [
    {
      id: {
        type: String,
      },
      name: {
        type: String,
      }
    },
  ]
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

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
  contacts: {
    type: Map,
    of:{
      your_name: {type: String},
      last_reciever_name: {type: String},
      last_sender_name: {type: String},
      last_sender: { type: String },           
      last_message: { type: String },   
      last_time: { type: Date }         
    },
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);

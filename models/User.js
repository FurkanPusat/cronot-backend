const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  phone: { type: String },
  bio: { type: String },
  date: { type: Date, default: Date.now },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }

});

module.exports = mongoose.model("User", UserSchema);

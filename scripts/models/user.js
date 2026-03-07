const bcrypt = require('bcryptjs');
const { Schema, model } = require("mongoose");

const UserSchema = new Schema({
  email: String,
  password: String,
  name: String,
}, {timestamps: true});

UserSchema.pre('save', async function (next) {
  const thisUser = this;
  if (!thisUser.isModified('password') || !thisUser.password)
    return next();
  const salt = await bcrypt.genSalt(5);
  const hash = await bcrypt.hash(thisUser.password, salt);
  thisUser.password = hash;
  next();
});

module.exports = model('User', UserSchema);
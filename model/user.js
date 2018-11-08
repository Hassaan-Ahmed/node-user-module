const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
   name: {type: String, required: true },
   email: {type: String, required: true },
   password: {type: String, required: true },
   // profile_picture: {type: String, required: true },
   // contact_no: {type: Integer, required: true },
   // designation: {type: String, required: true },
   // status: {type: Boolean, required: true },
   // role: {type: String, required: true },
   // createdAt: {type: timestamp, required: true },
   // updatedAt: {type: timestamp, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});
const User = mongoose.model('user',UserSchema);
module.exports = User;

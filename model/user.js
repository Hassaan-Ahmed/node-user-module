const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
   firstName: {type: String, required: true },
   lastName: {type: String, required: true },
   email: {type: String, required: true },
   password: {type: String, required: true },
   profilePicture: {type: String, required: false },
   contactNumber: {type: Number , required: false },
   analyticsId: {type: Number , required: false },
   designation: {type: String, required: false },
   status: {type: Boolean, required: false },
   role: {type: String, required: false }, //Admin || User
   createdAt: {type: Date , required: false },
   updatedAt: {type: Date , required: false },
   isDeleted: { type: Boolean, default: false },
   resetPasswordToken: String,
   resetPasswordExpires: Date
});
const User = mongoose.model('user',UserSchema);
module.exports = User;

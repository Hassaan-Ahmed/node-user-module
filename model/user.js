const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
   firstName: {type: String, required: true },
   lastName: {type: String, required: false },
   email: {type: String, required: true },
   password: {type: String, required: true },
   profilePicture: {type: String, required: false },
   contactNumber: {type: Number , required: false },
   isECommerce: {type: Number , required: false }, //'1=yes,0=no'
   analyticsId: {type: Number , required: false },
   platformId: {type: Number , required: false }, //'1=magento 1.x, 2=magento 2.x, 3=wordpress, 4=shopify'
   designation: {type: String, required: false },
   status: {type: Number, required: false }, //' 0=in-active, 1=active, 2=deleted, '
   role: {type: String, required: false }, //Admin || User
   memberSince: {type: Date , required: false },
   createdAt: {type: Date , required: false },
   updatedAt: {type: Date , required: false },
   isDeleted: { type: Boolean, default: false },
   resetPasswordToken: String,
   resetPasswordExpires: Date
});
const User = mongoose.model('user',UserSchema);
module.exports = User;

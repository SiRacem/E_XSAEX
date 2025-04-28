// models/User.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    fullName: { type: String, trim: true },
    email: { type: String, unique: true, lowercase: true, trim: true }, // جعل الإيميل فريداً
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    password: { type: String, required: true }, // كلمة المرور يجب أن تكون مطلوبة
    userRole: { type: String, enum: ['User', 'Vendor', 'Admin'], default: 'User' }, // تحديد الأدوار المسموحة
    registerDate: { type: Date, default: Date.now },
    balance: { type: Number, required: true, default: 0, min: 0 }, // التأكد من أن الرصيد لا يكون سالباً
    sellerAvailableBalance: { type: Number, default: 0, min: 0 },
    sellerPendingBalance: { type: Number, default: 0, min: 0 },
    depositBalance: { type: Number, default: 0, min: 0 },
    withdrawalBalance: { type: Number, default: 0, min: 0 },
    blocked: { type: Boolean, default: false },
    avatarUrl: { type: String, default: null }, // حقل اختياري لصورة الأفاتار

    // --- [!] حقول جديدة للإحصائيات المجمعة ---
    positiveRatings: { // عدد اللايكات التي تلقاها
        type: Number,
        default: 0,
        min: 0 // لا يجب أن يكون سالباً
    },
    negativeRatings: { // عدد الديسلايكات التي تلقاها
        type: Number,
        default: 0,
        min: 0
    },
    productsSoldCount: { // عدد المنتجات التي باعها (اختياري)
        type: Number,
        default: 0,
        min: 0
    }
    // -----------------------------------------
}, { timestamps: true }); // إضافة createdAt و updatedAt

module.exports = mongoose.model("User", UserSchema);
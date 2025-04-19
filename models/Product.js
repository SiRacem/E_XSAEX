// models/Product.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// --- تعريف Schema فرعي للمزايدات (يبقى كما هو) ---
const BidSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Bid amount must be positive']
    },
    currency: {
        type: String,
        required: true,
        enum: ['USD', 'TND'],
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });
// --------------------------------------

const ProductSchema = new Schema({
    title: { type: String, required: [true, "Product title is required"], trim: true },
    imageUrls: {
        type: [String], required: [true, "Product must have at least one image"],
        validate: {
            validator: (arr) => arr && arr.length > 0,
            message: "Product must have at least one image URL."
        }
    },
    description: { type: String, required: [true, "Product description is required"], trim: true },
    linkType: {
        type: String, required: [true, "Account link type is required"],
        enum: {
            values: ["Konami ID ✅ Gmail ❌ Mail ✅", "Konami ID ✅ Gmail ❌ Mail ❌", "Konami ID ✅ Gmail ✅ Mail ✅", "Konami ID ✅ Gmail ✅ Mail ❌", "Konami ID ❌ Gmail ✅ Mail ✅", "Konami ID ❌ Gmail ✅ Mail ❌"],
            message: '{VALUE} is not a supported link type'
        }
    },
    price: { type: Number, required: [true, "Price is required"], min: [0, "Price cannot be negative"] },
    currency: {
        type: String, required: [true, "Currency is required"],
        enum: { values: ['USD', 'TND'], message: '{VALUE} is not a supported currency' },
        default: 'TND'
    },
    quantity: { type: Number, required: [true, "Quantity is required"], min: [0], default: 1 }, // السماح بكمية 0
    date_added: { type: Date, default: Date.now },
    status: {
        type: String,
        // --- [!] إضافة حالة 'sold' ---
        enum: ['pending', 'approved', 'rejected', 'sold'],
        // -----------------------------
        default: 'pending',
        index: true // إضافة index للحالة لتحسين البحث
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // البائع
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    bids: { type: [BidSchema], default: [] },

    // --- [!] حقول جديدة لتتبع البيع ---
    sold: { // هل تم بيع المنتج؟
        type: Boolean,
        default: false,
        index: true // Index لتسهيل جلب المنتجات المباعة/غير المباعة
    },
    buyer: { // معرف المستخدم المشتري (اختياري)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // القيمة الافتراضية null
    },
    soldAt: { // تاريخ ووقت البيع (اختياري)
        type: Date
    }
    // ---------------------------------

}, { timestamps: true }); // لإضافة createdAt و updatedAt تلقائياً

// الفهارس (Indexes) لتحسين البحث
ProductSchema.index({ user: 1, status: 1 }); // للبحث عن منتجات مستخدم بحالة معينة
ProductSchema.index({ likes: 1 });
ProductSchema.index({ "bids.user": 1 });
ProductSchema.index({ "bids.createdAt": -1 });

module.exports = mongoose.model("Product", ProductSchema);
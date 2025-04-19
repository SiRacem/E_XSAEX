// models/Rating.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RatingSchema = new Schema({
    rater: { // المستخدم الذي يقيّم (المشتري)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Rater user ID is required."],
        index: true
    },
    ratedUser: { // المستخدم الذي يتم تقييمه (البائع)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Rated user ID is required."],
        index: true
    },
    ratingType: { // نوع التقييم: 'like' أو 'dislike'
        type: String,
        required: [true, "Rating type ('like' or 'dislike') is required."],
        enum: ['like', 'dislike']
    },
    comment: { // تعليق اختياري
        type: String,
        trim: true,
        maxlength: [500, "Comment cannot exceed 500 characters."] // تحديد أقصى طول للتعليق
    },
    product: { // ربط التقييم بالمنتج المباع (اختياري لكن مفيد)
        type: Schema.Types.ObjectId,
        ref: 'Product',
        // يمكنك جعله مطلوباً إذا أردت ربط كل تقييم بمنتج
        // required: true
    },
    // يمكنك إضافة حقل orderId إذا كان لديك نظام طلبات منفصل
    // order: { type: Schema.Types.ObjectId, ref: 'Order' }

}, { timestamps: true }); // لإضافة createdAt و updatedAt

// فهارس (Indexes) لتحسين أداء الاستعلامات
RatingSchema.index({ ratedUser: 1, ratingType: 1 }); // للبحث عن تقييمات مستخدم حسب النوع
// منع المستخدم من تقييم نفس المنتج/الطلب أكثر من مرة
RatingSchema.index({ rater: 1, ratedUser: 1, product: 1 }, { unique: true, sparse: true }); // sparse يتجاهل المستندات التي لا تحتوي على product
// RatingSchema.index({ rater: 1, ratedUser: 1, order: 1 }, { unique: true, sparse: true }); // إذا استخدمت order

module.exports = mongoose.model("Rating", RatingSchema);
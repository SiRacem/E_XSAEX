// models/Transaction.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function() { return this.type !== 'DEPOSIT'; } // المرسل مطلوب إلا في الإيداع
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
         required: function() { return this.type !== 'WITHDRAWAL'; } // المستلم مطلوب إلا في السحب
    },
    amount: {
        type: Number,
        required: true,
        min: [0.01, 'Transaction amount must be positive'] // يجب أن يكون المبلغ إيجابياً
    },
    currency: {
        type: String,
        required: true,
        enum: ['TND', 'USD'], // حدد العملات المسموح بها
        default: 'TND'
    },
    type: {
        type: String,
        required: true,
        enum: [
            'TRANSFER',     // إرسال من مستخدم لآخر
            'DEPOSIT',      // إيداع في الحساب
            'WITHDRAWAL',   // سحب من الحساب
            'PRODUCT_PURCHASE', // شراء منتج
            'PRODUCT_SALE'    // بيع منتج (تسوية للبائع)
            // أضف أنواع أخرى حسب الحاجة
        ]
    },
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    description: { // وصف اختياري
        type: String,
        trim: true
    },
    relatedEntity: { // لربط المعاملة بكيان آخر (مثل طلب أو منتج)
        id: { type: Schema.Types.ObjectId },
        modelName: { type: String }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // timestamps يضيف createdAt و updatedAt تلقائياً

// إضافة index لتحسين البحث عن معاملات مستخدم معين
TransactionSchema.index({ sender: 1, createdAt: -1 });
TransactionSchema.index({ recipient: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
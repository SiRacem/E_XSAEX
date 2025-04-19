// models/Notification.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // المستخدم الذي سيتلقى الإشعار (البائع في حالة المزايدة)
    type: {
        type: String,
        enum: [
            'PRODUCT_DELETED',
            'PRODUCT_APPROVED',
            'PRODUCT_REJECTED',
            'NEW_PRODUCT_PENDING',
            'ORDER_STATUS_UPDATE',
            'NEW_MESSAGE',
            'PRODUCT_UPDATE_PENDING',
            'ADMIN_BALANCE_ADJUSTMENT',
            'USER_BALANCE_ADJUSTED',
            'FUNDS_SENT',
            'FUNDS_RECEIVED',
            // --- [!] إضافة نوع جديد للمزايدة ---
            'NEW_BID' // إشعار للبائع عند وجود مزايدة جديدة
            // ----------------------------------
        ],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedEntity: {
        // في حالة NEW_BID:
        // id: معرف المنتج الذي تمت المزايدة عليه
        // modelName: 'Product'
        // يمكن إضافة حقل آخر هنا لتمرير معرف المزايد إذا لزم الأمر لعرضه في الإشعار
        id: { type: Schema.Types.ObjectId },
        modelName: { type: String }
        // bidder: { type: Schema.Types.ObjectId, ref: 'User' } // مثال إضافي (اختياري)
    },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", NotificationSchema);
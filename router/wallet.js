// router/wallet.js

const express = require('express');
const router = express.Router();
const { verifyAuth } = require('../middlewares/verifyAuth'); // حماية المسارات

// --- استيراد دوال وحدة تحكم المحفظة (ستحتاج لإنشائها) ---
// افترض أن لديك ملف controllers/wallet.controller.js
const {
    sendFundsController,
    getTransactionsController // <-- استيراد الدالة الجديدة
} = require('../controllers/wallet.controller');
// ---------------------------------------------------------

// --- تعريف المسارات ---

// POST /wallet/send - لتنفيذ عملية إرسال الرصيد
// verifyAuth يحمي المسار ويتأكد أن المستخدم مسجل دخول
// sendFundsController هي الدالة التي ستحتوي على منطق التحويل في الواجهة الخلفية
router.post('/send', verifyAuth, sendFundsController);
router.get('/transactions', verifyAuth, getTransactionsController);
// --- يمكنك إضافة مسارات أخرى للمحفظة هنا ---
// مثل:
// GET /wallet/transactions - لجلب سجل المعاملات
// POST /wallet/deposit - لبدء عملية إيداع
// POST /wallet/withdraw - لبدء عملية سحب

// --- نهاية تعريف المسارات ---

module.exports = router;
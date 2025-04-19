const express = require('express');
const { verifyAuth } = require('../middlewares/verifyAuth');
const { isAdmin } = require('../middlewares/roleCheck');

const {
    addProduct,
    getProducts,
    getOneProduct,
    updateProducts,
    deleteProducts,
    getProductCountsByUser,
    getUserById,
    getPendingProducts,
    approveProduct,
    rejectProduct,
    toggleLikeProduct,
    placeBidOnProduct,
    getProductBids,
    markProductAsSold,
} = require('../controllers/product.controller');

const router = express.Router();

// --- مسارات عامة ---
router.get('/get_products', getProducts);       // جلب كل المنتجات
router.get('/get_products/:id', getOneProduct); // جلب منتج واحد
router.get("/get_user/:id", getUserById);       // جلب بيانات مستخدم
router.get('/:productId/bids', getProductBids); // جلب مزايدات منتج

// --- مسارات تحتاج تسجيل دخول ---
router.post('/add_product', verifyAuth, addProduct);        // إضافة منتج
router.put('/update_products/:id', verifyAuth, updateProducts); // تحديث منتج
router.delete('/delete_products/:id', verifyAuth, deleteProducts); // حذف منتج
router.get('/get_product_counts/:userId', verifyAuth, getProductCountsByUser); // إحصائيات منتجات مستخدم
router.put('/:productId/like', verifyAuth, toggleLikeProduct); // تبديل الإعجاب بمنتج
router.post('/:productId/bids', verifyAuth, placeBidOnProduct); // وضع مزايدة على منتج

// --- [!] إضافة مسار تحديد المنتج كمباع (يحتاج تسجيل دخول البائع) ---
router.put('/:productId/sell', verifyAuth, markProductAsSold);

// --- مسارات الأدمن ---
router.get('/pending', verifyAuth, isAdmin, getPendingProducts); // جلب المنتجات المعلقة
router.put('/approve/:id', verifyAuth, isAdmin, approveProduct); // الموافقة على منتج
router.put('/reject/:id', verifyAuth, isAdmin, rejectProduct);   // رفض منتج

module.exports = router;
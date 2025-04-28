// router/user.js
const express = require('express');
// --- تأكد من استيراد checkEmailExists هنا ---
const {
    Register, Login, Auth,
    getUsers, updateUsers, deleteUsers,
    checkEmailExists, // <-- تأكد من وجودها هنا
    getUserPublicProfile // <-- [!] إضافة الدالة الجديدة
} = require('../controllers/user.controller'); // <-- تأكد من المسار الصحيح
// -------------------------------------------
const { registerRules, validatorMiddleware } = require('../middlewares/validator');
const { verifyAuth } = require('../middlewares/verifyAuth');

const router = express.Router();

// -- Auth Routes --
router.post("/register", registerRules(), validatorMiddleware, Register);
router.post("/login", Login);
router.get("/auth", verifyAuth, Auth);

// --- *** تأكد من وجود هذا السطر بالضبط *** ---
// يستخدم POST، محمي بـ verifyAuth، ويستدعي checkEmailExists
router.post("/check-email", verifyAuth, checkEmailExists);

// -- Public Profile Route --
router.get('/profile/:userId', getUserPublicProfile);

// -- User Management Routes --
router.get("/get_users", verifyAuth, /* isAdmin, */ getUsers);
router.put('/update_users/:id', verifyAuth, /* isAdminOrSelf, */ updateUsers);
router.delete('/delete_users/:id', verifyAuth, /* isAdmin, */ deleteUsers);

module.exports = router;
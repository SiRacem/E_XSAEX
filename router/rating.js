// router/rating.js
const express = require('express');
const { verifyAuth } = require('../middlewares/verifyAuth'); // المصادقة مطلوبة للتقييم
const { submitRating } = require('../controllers/rating.controller');

const router = express.Router();

// POST /ratings - لإرسال تقييم جديد
router.post('/', verifyAuth, submitRating);

module.exports = router;
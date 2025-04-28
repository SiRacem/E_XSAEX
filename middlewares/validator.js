const { check, validationResult } = require("express-validator");

exports.registerRules = () => [
    // استخدام fullName
    check("fullName", "Full Name is required").notEmpty().trim().escape(),
    check("email", "Please include a valid email").isEmail().normalizeEmail(),
    // إضافة التحقق لـ phone و address إذا كانت مطلوبة
    check("phone", "Phone number is required").notEmpty().trim().escape(),
    check("address", "Address is required").notEmpty().trim().escape(),
    // التحقق من كلمة المرور
    check("password", "Password is required").notEmpty(),
    check("password", "Password must be at least 6 characters long").isLength({ min: 6 }),
    // يمكن إضافة تحقق لـ userRole إذا لزم الأمر
    check("userRole", "User role is required").isIn(['User', 'Vendor']).withMessage('Invalid user role'),
];

exports.validatorMiddleware = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // إرجاع الأخطاء بشكل منظم أكثر
        return res.status(400).json({ errors: errors.array() }); // استخدام 400 لـ Bad Request
    }
    next(); // المتابعة إذا لم تكن هناك أخطاء
};
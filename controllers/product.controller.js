// controllers/product.controller.js
const Product = require("../models/Product");
const User = require("../models/User");
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// تعريف سعر الصرف (يمكن جلبه من مكان آخر)
const TND_TO_USD_RATE = 3.0;
const MINIMUM_BALANCE_TO_PARTICIPATE = 6; // الحد الأدنى للمشاركة


// --- Add Product ---
exports.addProduct = async (req, res) => {
    const userId = req.user?._id;
    const userRole = req.user?.userRole;
    console.log(`--- Controller: addProduct by User: ${userId} (${userRole}) ---`);

    if (!userId) {
        return res.status(401).json({ msg: "Unauthorized: User ID missing." });
    }

    // استخراج البيانات من req.body بناءً على المودل الجديد
    const {
        title, description, imageUrls, // مصفوفة الروابط
        linkType, category, price, currency, quantity // الحقول الجديدة/المعدلة
    } = req.body;

    // التحقق من الحقول المطلوبة الأساسية (يمكن إضافة تحقق أفضل هنا أو باستخدام middleware)
    if (!title || !description || !imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0 || !linkType || !price || !currency) {
        return res.status(400).json({ msg: "Missing required fields or invalid image data." });
    }

    try {
        const parsedPrice = parseFloat(price);
        const parsedQuantity = parseInt(quantity, 10) || 1; // الافتراضي 1

        if (isNaN(parsedPrice) || parsedPrice < 0) {
            return res.status(400).json({ msg: "Invalid price format." });
        }
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            return res.status(400).json({ msg: "Invalid quantity format." });
        }

        // تحديد الحالة الافتراضية بناءً على الدور
        const defaultStatus = userRole === 'Admin' ? 'approved' : 'pending';

        const newProduct = new Product({
            title,
            description,
            imageUrls, // استخدام المصفوفة مباشرة
            linkType,
            category, // اختياري
            price: parsedPrice,
            currency,
            quantity: parsedQuantity,
            user: userId,
            // Set status: Use status from body if Admin sent it and it's valid, otherwise use default
            status: (userRole === 'Admin' && ['pending', 'approved', 'rejected'].includes(req.body.status))
                ? req.body.status
                : defaultStatus,
            // إذا كان الأدمن يضيف ويوافق مباشرة
            approvedBy: (userRole === 'Admin' && defaultStatus === 'approved') ? userId : undefined,
            approvedAt: (userRole === 'Admin' && defaultStatus === 'approved') ? Date.now() : undefined,
        });

        const savedProduct = await newProduct.save();
        console.log(`Product ${savedProduct._id} saved with status: ${savedProduct.status}`);

        // Populate user details for the response (استخدام fullName)
        const populatedProduct = await Product.findById(savedProduct._id)
            .populate('user', 'fullName email') // <-- استخدام fullName
            .lean();

        // --- إرسال إشعار للمسؤولين إذا أضاف البائع منتجًا معلقًا ---
        if (savedProduct.status === 'pending' && userRole === 'Vendor') {
            try {
                const admins = await User.find({ userRole: 'Admin' }).select('_id').lean();
                if (admins.length > 0) {
                    const notifications = admins.map(admin => ({
                        user: admin._id,
                        type: 'NEW_PRODUCT_PENDING',
                        title: 'New Product Pending Approval',
                        message: `Vendor "${req.user.fullName || 'Unknown'}" submitted a new product "${savedProduct.title || 'Untitled'}" for approval.`, // <-- استخدام fullName
                        relatedEntity: { id: savedProduct._id, modelName: 'Product' }
                    }));
                    await Notification.insertMany(notifications);
                    console.log(`Sent ${notifications.length} pending product notifications to admins.`);
                }
            } catch (notifyError) {
                console.error("Error creating admin notifications for new product:", notifyError);
            }
        }
        // --- نهاية إشعار المسؤولين ---

        res.status(201).json(populatedProduct || savedProduct.toObject());

    } catch (error) {
        console.error("Error adding product:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ errors: error.message });
        }
        if (!res.headersSent) {
            res.status(500).json({ errors: "Failed to add product due to server error." });
        }
    }
};

// --- Get ALL Products (Populate fullName) ---
exports.getProducts = async (req, res) => {
    console.log("--- Controller: getProducts ---");
    try {
        const products = await Product.find()
            .sort({ date_added: -1 })
            .populate('user', 'fullName email'); // <-- استخدام fullName
        console.log(`Fetched ${products.length} products.`);
        res.status(200).json(products);
    } catch (error) {
        console.error("Error in getProducts:", error);
        res.status(500).json({ errors: "Failed to retrieve products." });
    }
};

// --- Get ONE Product by ID (Populate fullName) ---
exports.getOneProduct = async (req, res) => {
    const productId = req.params.id;
    console.log(`--- Controller: getOneProduct for ID: ${productId} ---`);
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ errors: "Invalid Product ID format" });
    }
    try {
        const product = await Product.findById(productId)
            .populate('user', 'fullName email'); // <-- استخدام fullName
        if (!product) {
            console.log(`Product ${productId} not found.`);
            return res.status(404).json({ errors: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
        res.status(500).json({ errors: "Failed to retrieve product." });
    }
};

// --- Update Product (Adapted for New Schema) ---
exports.updateProducts = async (req, res) => {
    const productId = req.params.id;
    const currentUserId = req.user?._id;
    const currentUserRole = req.user?.userRole;
    console.log(`--- Controller: updateProducts for ID: ${productId} by User: ${currentUserId} (${currentUserRole}) ---`);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ msg: "Invalid Product ID format." });
    }
    if (!currentUserId) {
        return res.status(401).json({ msg: "Unauthorized: User ID missing." });
    }

    // استخراج البيانات المسموح بتحديثها
    const { title, description, imageUrls, linkType, category, price, currency, quantity, status } = req.body;
    let updateData = {};

    // بناء كائن التحديث فقط بالحقول الموجودة في الطلب
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrls !== undefined) {
        if (!Array.isArray(imageUrls) || imageUrls.length === 0) return res.status(400).json({ msg: "Invalid image data." });
        updateData.imageUrls = imageUrls;
    }
    if (linkType !== undefined) updateData.linkType = linkType;
    if (category !== undefined) updateData.category = category; // السماح بتحديث الفئة
    if (price !== undefined) {
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) return res.status(400).json({ msg: "Invalid price format." });
        updateData.price = parsedPrice;
    }
    if (currency !== undefined) updateData.currency = currency;
    if (quantity !== undefined) {
        const parsedQuantity = parseInt(quantity, 10);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) return res.status(400).json({ msg: "Invalid quantity format." });
        updateData.quantity = parsedQuantity;
    }
    // التعامل مع الحالة بشكل منفصل أدناه

    let statusChangedToPending = false;

    try {
        const product = await Product.findById(productId);
        if (!product) { return res.status(404).json({ msg: "Product not found" }); }

        // --- فحص الملكية/الصلاحية ---
        if (currentUserRole !== 'Admin' && product.user.toString() !== currentUserId.toString()) {
            return res.status(403).json({ msg: "Forbidden: You can only update your own products." });
        }

        // --- منطق تحديث الحالة ---
        if (currentUserRole === 'Admin' && status !== undefined) {
            // الأدمن يمكنه تغيير الحالة مباشرة (pending, approved, rejected)
            if (!['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({ msg: "Invalid status value." });
            }
            updateData.status = status;
            // إذا وافق الأدمن مباشرة
            if (status === 'approved' && product.status !== 'approved') {
                updateData.approvedBy = currentUserId;
                updateData.approvedAt = Date.now();
            }
        } else if (currentUserRole === 'Vendor') {
            // البائع عند تحديث منتج موافق عليه، يعود للحالة المعلقة
            if (product.status === 'approved') {
                console.log(`Vendor update on approved product. Resetting status to 'pending'.`);
                updateData.status = 'pending';
                // مسح معلومات الموافقة السابقة
                updateData.approvedBy = undefined;
                updateData.approvedAt = undefined;
                statusChangedToPending = true;
            }
            // لا يمكن للبائع تغيير الحالة بنفسه إذا كانت معلقة أو مرفوضة
        }
        // --- نهاية منطق الحالة ---

        // منع البائع من تغيير المالك
        if (currentUserRole === 'Vendor') {
            delete updateData.user;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId, { $set: updateData }, { new: true, runValidators: true }
        ).populate('user', 'fullName email').lean(); // <-- استخدام fullName

        if (!updatedProduct) { return res.status(404).json({ msg: "Product update failed (maybe validation error)." }); }

        console.log(`Product ${productId} updated. New status: ${updatedProduct.status}`);

        // --- إرسال إشعار للمسؤولين إذا أعاد البائع المنتج للحالة المعلقة ---
        if (statusChangedToPending) {
            try {
                const admins = await User.find({ userRole: 'Admin' }).select('_id').lean();
                if (admins.length > 0) {
                    const notifications = admins.map(admin => ({
                        user: admin._id, type: 'PRODUCT_UPDATE_PENDING',
                        title: 'Product Update Requires Re-Approval',
                        message: `Vendor "${req.user.fullName || 'Unknown'}" updated an approved product "${updatedProduct.title}". It is now pending re-approval.`, // <-- fullName
                        relatedEntity: { id: updatedProduct._id, modelName: 'Product' }
                    }));
                    await Notification.insertMany(notifications);
                    console.log("Sent updated product pending notifications to admins.");
                }
            } catch (notifyError) { console.error("Error creating admin notifications for updated product:", notifyError); }
        }
        // --- نهاية إشعار المسؤولين ---

        res.status(200).json(updatedProduct);

    } catch (error) {
        console.error("Error updating product:", error);
        if (error.name === 'ValidationError') return res.status(400).json({ errors: error.message });
        if (!res.headersSent) res.status(500).json({ errors: "Failed to update product." });
    }
};

// --- Delete Product (Adapted - Populate fullName for notification, Safe reason handling) ---
exports.deleteProducts = async (req, res) => {
    const productId = req.params.id;
    const currentUserId = req.user?._id;
    const currentUserRole = req.user?.userRole;

    // --- تعديل طريقة قراءة السبب ---
    // تحقق أولاً إذا كان req.body موجودًا قبل محاولة الوصول إليه
    const reason = req.body?.reason; // استخدم Optional Chaining (?.)
    // الآن reason سيكون إما قيمة النص أو undefined إذا لم يكن req.body أو req.body.reason موجودًا
    // --- نهاية التعديل ---


    console.log(`--- Controller: deleteProducts for ID: ${productId} by User: ${currentUserId} (${currentUserRole}) ---`);
    // طباعة السبب فقط إذا كان موجودًا
    if (reason) {
        console.log("Reason provided:", reason);
    } else {
        console.log("No reason provided in request body."); // توضيح
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) { return res.status(400).json({ msg: "Invalid Product ID." }); }
    if (!currentUserId) { return res.status(401).json({ msg: "Unauthorized" }); }

    try {
        const product = await Product.findById(productId).populate('user', 'fullName'); // <-- fullName
        if (!product) { return res.status(404).json({ msg: "Product not found" }); }

        // --- فحص الملكية/الصلاحية ---
        if (currentUserRole !== 'Admin' && product.user._id.toString() !== currentUserId.toString()) {
            return res.status(403).json({ msg: "Forbidden: You can only delete your own products." });
        }

        await Product.findByIdAndDelete(productId);
        console.log("Product deleted successfully from database.");

        // --- إنشاء إشعار للمالك (إذا حذف المسؤول منتج البائع) ---
        const productOwner = product.user;
        if (currentUserRole === 'Admin' && productOwner && productOwner._id.toString() !== currentUserId.toString()) {
            console.log(`Admin deletion detected. Creating notification for user: ${productOwner._id}`);
            try {
                const newNotification = new Notification({
                    user: productOwner._id,
                    type: 'PRODUCT_DELETED',
                    title: `Product Deleted: ${product.title}`,
                    // استخدام reason بأمان هنا، مع قيمة افتراضية
                    message: `Your product "${product.title}" was deleted by administrator "${req.user.fullName}". Reason: ${reason || 'No specific reason provided.'}`,
                    relatedEntity: { id: productId, modelName: 'Product' }
                });
                await newNotification.save();
                console.log("Deletion notification created successfully.");
            } catch (notifyError) { console.error("Error creating deletion notification:", notifyError); }
        }
        // --- نهاية الإشعار ---

        res.status(200).json({ msg: "Product deleted successfully.", productId: productId });

    } catch (error) {
        console.error("Error in deleteProducts controller:", error);
        if (!res.headersSent) res.status(500).json({ errors: "Failed to delete product." });
    }
};

// --- Get Pending Products (Populate fullName) ---
exports.getPendingProducts = async (req, res) => {
    console.log("--- Controller: getPendingProducts (Admin) ---");
    try {
        const pendingProducts = await Product.find({ status: 'pending' }) // استخدام 'pending'
            .sort({ date_added: 1 })
            .populate('user', 'fullName email'); // <-- fullName
        console.log(`Found ${pendingProducts.length} pending products.`);
        res.status(200).json(pendingProducts);
    } catch (error) {
        console.error("Error fetching pending products:", error);
        res.status(500).json({ errors: "Failed to retrieve pending products." });
    }
};

// --- Approve Product (Populate fullName, use status string) ---
exports.approveProduct = async (req, res) => {
    const productId = req.params.id;
    const adminUserId = req.user?._id; // معرف الأدمن الذي يقوم بالموافقة
    const adminFullName = req.user?.fullName; // اسم الأدمن للإشعار

    console.log(`--- Controller: approveProduct for ID: ${productId} by Admin: ${adminUserId} ---`);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ msg: "Invalid Product ID." });
    }
    if (!adminUserId || !adminFullName) {
        // التحقق من وجود بيانات الأدمن في req.user (من verifyAuth)
        console.error("Admin user data missing in request after authentication.");
        return res.status(401).json({ msg: "Unauthorized or missing admin details." });
    }

    try {
        // 1. البحث عن المنتج
        const product = await Product.findById(productId);

        if (!product) {
            console.log(`Product ${productId} not found.`);
            return res.status(404).json({ msg: `Product with ID ${productId} not found.` });
        }

        console.log(`Found product. Current status: ${product.status}`);

        // 2. التأكد من أن المنتج في حالة 'pending'
        if (product.status !== 'pending') {
            console.log(`Product status is not 'pending'. Aborting approval.`);
            return res.status(400).json({ msg: `Product is already processed (Current status: ${product.status}).` });
        }

        // 3. تحديث حالة المنتج وبيانات الموافقة
        product.status = 'approved';
        product.approvedBy = adminUserId;
        product.approvedAt = Date.now();

        // 4. حفظ التغييرات في قاعدة البيانات
        const updatedProduct = await product.save();
        console.log(`Product saved. New status: ${updatedProduct.status}`);

        // --- [!] إنشاء إشعار للبائع ---
        const sellerId = updatedProduct.user; // الحصول على معرف البائع من المنتج

        // التحقق من وجود معرف البائع وأنه ليس هو نفس الأدمن
        if (sellerId && sellerId.toString() !== adminUserId.toString()) {
            try {
                const approvalNotification = new Notification({
                    user: sellerId, // معرف البائع الذي سيستلم الإشعار
                    type: 'PRODUCT_APPROVED',  // نوع الإشعار
                    title: `Product Approved: ${updatedProduct.title}`, // عنوان الإشعار
                    // رسالة الإشعار توضح المنتج والأدمن الذي وافق
                    message: `Congratulations! Your product "${updatedProduct.title || 'Untitled'}" has been approved by administrator "${adminFullName}".`,
                    relatedEntity: { id: updatedProduct._id, modelName: 'Product' } // ربط الإشعار بالمنتج
                });
                await approvalNotification.save(); // حفظ الإشعار
                console.log(`Approval notification created successfully for user ${sellerId}.`);
            } catch (notifyError) {
                // تسجيل الخطأ في حالة فشل إنشاء الإشعار
                console.error(`Error creating approval notification for user ${sellerId}:`, notifyError);
                // يمكنك إضافة نظام تسجيل أخطاء أكثر تفصيلاً هنا إذا أردت
            }
        } else if (sellerId && sellerId.toString() === adminUserId.toString()) {
            console.log("Skipping notification: Admin approved their own product.");
        } else {
            console.log("Skipping notification: Seller ID not found on the product.");
        }
        // --- نهاية إنشاء الإشعار ---

        // 5. إعادة جلب المنتج مع بيانات المستخدم (البائع) للاستجابة
        //    نستخدم .lean() لتحسين الأداء إذا كنا سنرسل JSON فقط
        const populatedProduct = await Product.findById(updatedProduct._id)
            .populate('user', 'fullName email') // جلب اسم وإيميل البائع
            .lean(); // الحصول على كائن جافاسكربت بسيط

        // 6. إرسال الاستجابة بنجاح مع المنتج المحدث
        res.status(200).json(populatedProduct || updatedProduct.toObject()); // استخدام populated إن وجد

    } catch (error) {
        console.error("Error approving product:", error);
        // التعامل مع الأخطاء المحتملة (مثل أخطاء قاعدة البيانات)
        if (!res.headersSent) { // التأكد من عدم إرسال استجابة سابقة
            res.status(500).json({ errors: "Failed to approve product due to a server error." });
        }
    }
};

// --- Reject Product (Use status string, Populate fullName) ---
exports.rejectProduct = async (req, res) => {
    const productId = req.params.id;
    const adminUserId = req.user?._id;
    const { reason } = req.body;
    console.log(`--- Controller: rejectProduct ID: ${productId} by Admin: ${adminUserId} ---`);
    console.log("Reason:", reason);

    if (!mongoose.Types.ObjectId.isValid(productId)) { return res.status(400).json({ msg: "Invalid Product ID." }); }
    if (!reason || reason.trim() === '') { return res.status(400).json({ msg: "Rejection reason is required." }); }

    try {
        // تغيير الحالة إلى 'rejected' بدلاً من الحذف
        const rejectedProduct = await Product.findOneAndUpdate(
            { _id: productId, status: 'pending' }, // البحث عن المعلق فقط
            { $set: { status: 'rejected' } }, // تغيير الحالة
            { new: true }
        ).populate('user', 'fullName email'); // <-- fullName للبائع

        if (!rejectedProduct) {
            const existing = await Product.findById(productId).lean();
            if (existing && (existing.status === 'approved' || existing.status === 'rejected')) return res.status(400).json({ msg: "Product already processed (approved or rejected)." });
            return res.status(404).json({ msg: "Pending product not found." });
        }
        console.log(`Product ${productId} status updated to 'rejected'.`);

        // --- إنشاء إشعار للبائع ---
        if (rejectedProduct.user?._id) {
            try {
                const rejectionNotification = new Notification({
                    user: rejectedProduct.user._id, type: 'PRODUCT_REJECTED',
                    title: `Product Rejected: ${rejectedProduct.title}`,
                    message: `Unfortunately, your product "${rejectedProduct.title}" was rejected by administrator "${req.user.fullName}". Reason: ${reason}`, // <-- fullName للأدمن
                    relatedEntity: { id: productId, modelName: 'Product' }
                });
                await rejectionNotification.save();
                console.log("Rejection notification saved.");
            } catch (notifyError) { console.error("Error creating rejection notification:", notifyError); }
        }
        // --- نهاية الإشعار ---

        res.status(200).json({ msg: "Product status updated to rejected.", product: rejectedProduct.toObject() });

    } catch (error) {
        console.error("Error rejecting product:", error);
        if (!res.headersSent) res.status(500).json({ errors: "Failed to reject product." });
    }
};


// --- Get Product Counts by User (Added Authorization) ---
exports.getProductCountsByUser = async (req, res) => {
    const targetUserId = req.params.userId; // المستخدم المستهدف
    const requesterUserId = req.user?._id; // المستخدم الذي يطلب البيانات
    const requesterUserRole = req.user?.userRole;

    console.log(`--- Controller: getProductCountsByUser for User: ${targetUserId} (Requested by: ${requesterUserId}) ---`);
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) { return res.status(400).json({ errors: "Invalid User ID format" }); }

    // --- التحقق من الصلاحية ---
    if (requesterUserRole !== 'Admin' && requesterUserId.toString() !== targetUserId.toString()) {
        console.warn(`Forbidden access attempt: User ${requesterUserId} tried to get counts for user ${targetUserId}.`);
        return res.status(403).json({ errors: "Forbidden: You can only view your own product counts." });
    }
    // --- نهاية التحقق ---

    try {
        // استخدام status strings
        const approvedCount = await Product.countDocuments({ user: targetUserId, status: 'approved' });
        const pendingCount = await Product.countDocuments({ user: targetUserId, status: 'pending' });
        const rejectedCount = await Product.countDocuments({ user: targetUserId, status: 'rejected' }); // إضافة عدد المرفوضة

        console.log(`Counts for ${targetUserId}: Approved: ${approvedCount}, Pending: ${pendingCount}, Rejected: ${rejectedCount}`);
        res.status(200).json({ approvedCount, pendingCount, rejectedCount });
    } catch (error) {
        console.error(`Error getting counts for user ${targetUserId}:`, error);
        res.status(500).json({ errors: "Failed to retrieve product counts." });
    }
};

// --- Get User By ID (No changes needed, uses select('-password')) ---
exports.getUserById = async (req, res) => {
    const userId = req.params.id;
    console.log(`--- Controller: getUserById for ID: ${userId} ---`);
    if (!mongoose.Types.ObjectId.isValid(userId)) { return res.status(400).json({ errors: "Invalid User ID format" }); }
    try {
        const user = await User.findById(userId).select('-password'); // جيد
        if (!user) { return res.status(404).json({ message: "User not found" }); }
        res.status(200).json(user);
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        res.status(500).json({ errors: "Failed to retrieve user." });
    }
};

// --- دالة تبديل الإعجاب (تبقى كما هي من التعديل السابق) ---
exports.toggleLikeProduct = async (req, res) => {
    const productId = req.params.productId;
    const userId = req.user._id;
    console.log(`--- Controller: toggleLikeProduct for Product: ${productId} by User: ${userId} ---`);
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ msg: "Invalid Product ID format." });

    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ msg: "Product not found." });

        const isLiked = product.likes.some(likeId => likeId.equals(userId));
        let updateOperation;
        let successMessage;

        if (isLiked) {
            updateOperation = { $pull: { likes: userId } };
            successMessage = "Product unliked successfully.";
            console.log(`User ${userId} unliked product ${productId}`);
        } else {
            updateOperation = { $addToSet: { likes: userId } };
            successMessage = "Product liked successfully.";
            console.log(`User ${userId} liked product ${productId}`);
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId, updateOperation, { new: true }
        ).select('likes');

        res.status(200).json({
            msg: successMessage,
            likesCount: updatedProduct.likes.length,
            userLiked: !isLiked
        });

    } catch (error) {
        console.error("Error toggling product like:", error);
        if (!res.headersSent) res.status(500).json({ errors: "Server error while updating like status." });
    }
};


// --- [!] دالة وضع مزايدة جديدة (بالقواعد النهائية: حرية المبلغ) ---
exports.placeBidOnProduct = async (req, res) => {
    const productId = req.params.productId;
    const bidderId = req.user._id;
    const bidderFullName = req.user.fullName;
    const { amount } = req.body;

    console.log(`--- Controller: placeBidOnProduct (Free Amount Rules) on Product: ${productId} by User: ${bidderId} for Amount: ${amount} ---`);

    // 1. التحقق الأولي للمدخلات
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ msg: "Invalid Product ID format." });
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ msg: 'Invalid bid amount specified (must be a positive number).' });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. جلب المنتج والمستخدم المزايد
        const product = await Product.findById(productId).session(session);
        const bidder = await User.findById(bidderId).session(session);

        if (!product) throw new Error('Product not found.');
        if (!bidder) throw new Error('Bidder (User) not found.');

        // 3. التحقق من القواعد الأساسية وقاعدة الحد الأدنى للمشاركة
        if (product.user.equals(bidderId)) throw new Error('You cannot bid on your own product.');
        if (product.status !== 'approved') throw new Error('Bids can only be placed on approved products.');

        // --- التحقق من الحد الأدنى للرصيد للمشاركة (بالدينار TND) ---
        if (bidder.balance < MINIMUM_BALANCE_TO_PARTICIPATE) {
            const requiredCurrency = bidder.currency || 'TND';
            throw new Error(`You need at least ${MINIMUM_BALANCE_TO_PARTICIPATE.toFixed(2)} ${requiredCurrency} in your balance to place any bid.`);
        }
        // -----------------------------------------------------------

        // --- تحويل مبلغ المزايدة إلى TND للمقارنة مع الرصيد ---
        const bidCurrency = product.currency;
        let bidAmountInTND;
        if (bidCurrency === 'USD') {
            bidAmountInTND = numericAmount * TND_TO_USD_RATE;
        } else {
            bidAmountInTND = numericAmount;
        }
        console.log(`Bid amount (${numericAmount} ${bidCurrency}) converted to TND for checks: ${bidAmountInTND.toFixed(2)} TND`);
        // -------------------------------------------------------

        // --- التحقق الأساسي: الرصيد يجب أن يغطي مبلغ المزايدة الحالية ---
        if (bidder.balance < bidAmountInTND) {
            throw new Error(`Insufficient balance. You need ${bidAmountInTND.toFixed(2)} TND to cover this ${numericAmount.toFixed(2)} ${bidCurrency} bid, but you only have ${bidder.balance.toFixed(2)} TND.`);
        }
        // -----------------------------------------------------------------

        // --- [!] تم حذف التحقق من سعر المنتج وأعلى مزايدة ---

        // 4. إنشاء كائن المزايدة
        const newBid = {
            user: bidderId,
            amount: numericAmount,   // المبلغ كما أدخله المستخدم
            currency: bidCurrency, // عملة المنتج
            createdAt: new Date()
        };

        // 5. إضافة المزايدة (الفرز حسب المبلغ أو التاريخ مفيد للعرض)
        product.bids.push(newBid);
        product.bids.sort((a, b) => b.amount - a.amount); // الفرز حسب الأعلى مبلغًا

        // 6. حفظ التغييرات
        await product.save({ session });
        console.log(`Bid placed successfully by ${bidderId} on product ${productId}`);

        // 7. إنشاء إشعار للبائع
        if (product.user) {
            const notificationMessage = `User "${bidderFullName}" placed a bid of ${numericAmount.toFixed(2)} ${bidCurrency} on your product "${product.title}".`;
            await Notification.create([{
                user: product.user,
                type: 'NEW_BID',
                title: 'New Bid Received!',
                message: notificationMessage,
                relatedEntity: { id: productId, modelName: 'Product' }
            }], { session });
            console.log(`Notification created for seller ${product.user}`);
        }

        // 8. إتمام المعاملة
        await session.commitTransaction();
        console.log("Bid transaction committed.");

        // 9. إرجاع استجابة ناجحة
        const updatedProductWithBids = await Product.findById(productId)
            .select('bids')
            .populate('bids.user', 'fullName email'); // جلب بيانات المزايدين
        res.status(201).json({
            msg: "Bid placed successfully!",
            bids: updatedProductWithBids.bids
        });

    } catch (error) {
        // 10. إلغاء المعاملة ومعالجة الأخطاء
        await session.abortTransaction();
        console.error("Error placing bid:", error.message);
        // رسائل خطأ واضحة للمستخدم
        let userFriendlyError = 'Failed to place bid. Please try again later.';
        if (error.message.includes('Insufficient balance')) {
            userFriendlyError = error.message;
        } else if (error.message.includes('need at least')) {
             userFriendlyError = error.message;
        } // أزل الشروط الأخرى المتعلقة بقيمة المزايدة
        else if (error.message === 'Product not found.' || error.message === 'Bidder (User) not found.') {
             userFriendlyError = 'An error occurred. Please try again.';
        } else if (error.message === 'You cannot bid on your own product.' || error.message === 'Bids can only be placed on approved products.'){
             userFriendlyError = error.message;
        }
        res.status(400).json({ msg: userFriendlyError });
    } finally {
        // 11. إنهاء الجلسة
        session.endSession();
        console.log("Bid session ended.");
    }
};


// --- دالة جلب المزايدات (تبقى كما هي من التعديل السابق) ---
exports.getProductBids = async (req, res) => {
    const productId = req.params.productId;
    console.log(`--- Controller: getProductBids for Product: ${productId} ---`);
    if (!mongoose.Types.ObjectId.isValid(productId)) return res.status(400).json({ msg: "Invalid Product ID format." });

    try {
        const product = await Product.findById(productId)
            .select('bids')
            .populate('bids.user', 'fullName email'); // جلب بيانات المستخدمين مع المزايدات

        if (!product) return res.status(404).json({ msg: "Product not found." });

        // الفرز هنا إذا لم يكن مضموناً عند الحفظ
        product.bids.sort((a, b) => b.amount - a.amount); // فرز حسب الأعلى مبلغًا

        res.status(200).json(product.bids);

    } catch (error) {
        console.error("Error fetching product bids:", error);
        if (!res.headersSent) res.status(500).json({ errors: "Server error while fetching bids." });
    }
};

// --- [!] دالة تحديد المنتج كمباع ---
exports.markProductAsSold = async (req, res) => {
    const { productId } = req.params;
    const sellerId = req.user._id; // البائع الحالي
    const { buyerId } = req.body; // معرف المشتري يجب أن يأتي من الطلب

    console.log(`--- Controller: markProductAsSold for Product: ${productId} by Seller: ${sellerId} to Buyer: ${buyerId} ---`);

    // 1. التحقق
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(buyerId)) {
        return res.status(400).json({ msg: "Invalid Product or Buyer ID format." });
    }

    try {
        // 2. البحث عن المنتج والتأكد أن المستخدم الحالي هو البائع وأنه لم يتم بيعه بعد
        const product = await Product.findOne({
            _id: productId,
            user: sellerId, // التأكد أن المستخدم الحالي هو البائع
            sold: false,    // التأكد أنه لم يتم بيعه من قبل
            status: 'approved' // التأكد أنه معتمد (أو حسب منطقك)
        });

        if (!product) {
            return res.status(404).json({ msg: "Product not found, already sold, or you are not the seller." });
        }

        // 3. تحديث المنتج
        product.sold = true;
        product.status = 'sold'; // تحديث الحالة أيضاً
        product.buyer = buyerId;
        product.soldAt = new Date();
        product.quantity = 0; // تعيين الكمية إلى صفر (أو خصم واحد إذا كانت متعددة)

        await product.save(); // لا نحتاج لـ transaction هنا عادةً لهذه العملية البسيطة

        // 4. (اختياري) تحديث عداد المبيعات للبائع
        await User.findByIdAndUpdate(sellerId, { $inc: { productsSoldCount: 1 } });

        // 5. (اختياري) إرسال إشعار للمشتري بأنه يمكنه الآن التقييم
        // ... (Notification.create(...)) ...

        console.log(`Product ${productId} marked as sold to ${buyerId}`);
        res.status(200).json({ msg: "Product marked as sold successfully.", product });

    } catch (error) {
        console.error(`Error marking product ${productId} as sold:`, error);
        if (!res.headersSent) {
            res.status(500).json({ msg: "Server error marking product as sold." });
        }
    }
};
// controllers/rating.controller.js
const Rating = require('../models/Rating');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

exports.submitRating = async (req, res) => {
    const raterId = req.user._id; // المستخدم الذي يقيم (المشتري)
    const { ratedUserId, ratingType, comment, productId } = req.body; // بيانات التقييم من الطلب

    console.log(`--- Controller: submitRating by Rater: ${raterId} for User: ${ratedUserId} (Type: ${ratingType}) Product: ${productId || 'N/A'} ---`);

    // 1. التحقق الأساسي من المدخلات
    if (!ratedUserId || !ratingType) {
        return res.status(400).json({ msg: "Rated user ID and rating type ('like' or 'dislike') are required." });
    }
    if (!mongoose.Types.ObjectId.isValid(ratedUserId)) {
        return res.status(400).json({ msg: "Invalid rated user ID format." });
    }
    if (ratingType !== 'like' && ratingType !== 'dislike') {
        return res.status(400).json({ msg: "Invalid rating type. Must be 'like' or 'dislike'." });
    }
    if (raterId.equals(ratedUserId)) {
        return res.status(400).json({ msg: "You cannot rate yourself." });
    }
    // التحقق من طول التعليق (اختياري)
    if (comment && comment.length > 500) {
         return res.status(400).json({ msg: "Comment cannot exceed 500 characters." });
    }
    // التحقق من productId إذا كان موجوداً
    if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
         return res.status(400).json({ msg: "Invalid product ID format provided." });
    }

    // بدء جلسة معاملة لضمان التناسق (تحديث التقييم وتحديث عداد المستخدم)
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. (الأهم) التحقق من أهلية المشتري للتقييم (يجب تعديل هذا حسب منطق تطبيقك)
        //    - هل اشترى هذا المستخدم بالفعل هذا المنتج المحدد (productId) من البائع (ratedUserId)؟
        //    - أو هل أكمل طلبًا يتضمن هذا البائع؟
        //    - هذا يتطلب وجود موديل Order أو طريقة أخرى لتتبع المبيعات.
        //    - **مثال افتراضي بسيط:** (يجب استبداله بمنطق التحقق الحقيقي)
        if (productId) {
            const product = await Product.findOne({ _id: productId, user: ratedUserId, buyer: raterId, sold: true }).session(session);
            if (!product) {
                // إذا لم نجد المنتج المحدد بهذه الشروط، نمنع التقييم
                 throw new Error("Rating failed: You can only rate sellers for products you have purchased from them and marked as received/sold.");
            }
            console.log(`Verification successful: Rater ${raterId} purchased product ${productId} from seller ${ratedUserId}`);
        } else {
            // إذا لم يتم توفير productId، يمكنك تطبيق منطق تحقق أعم (مثل البحث في الطلبات)
            // أو منع التقييم إذا كان productId مطلوبًا دائمًا.
             console.warn("Rating submitted without specific product ID. Verification might be incomplete.");
             // throw new Error("Product ID is required to submit a rating."); // يمكنك تفعيل هذا إذا أردت
        }
         // --- نهاية التحقق من الأهلية (مثال) ---


        // 3. التحقق مما إذا كان المستخدم قد قيّم هذا المنتج/الطلب بالفعل
        const existingRating = await Rating.findOne({
            rater: raterId,
            ratedUser: ratedUserId,
            product: productId || undefined // ابحث بالمنتج فقط إذا تم توفيره
        }).session(session);

        if (existingRating) {
             // يمكنك السماح بتحديث التقييم أو منع التقييم المكرر
             throw new Error("You have already rated this transaction/seller.");
             // أو:
             // existingRating.ratingType = ratingType;
             // existingRating.comment = comment || existingRating.comment;
             // await existingRating.save({ session });
             // ... (تحديث عدادات المستخدم إذا تغير النوع) ...
             // throw new Error("Rating updated."); // لإيقاف إنشاء سجل جديد
        }


        // 4. إنشاء سجل التقييم الجديد
        const newRating = new Rating({
            rater: raterId,
            ratedUser: ratedUserId,
            ratingType: ratingType,
            comment: comment || undefined, // لا تحفظ التعليق إذا كان فارغاً
            product: productId || undefined
        });
        await newRating.save({ session });
        console.log("New rating saved:", newRating._id);

        // 5. تحديث عدادات التقييم في موديل المستخدم (البائع)
        const updateField = ratingType === 'like' ? 'positiveRatings' : 'negativeRatings';
        await User.findByIdAndUpdate(ratedUserId, { $inc: { [updateField]: 1 } }, { session, new: true }); // $inc يزيد العداد بواحد
        console.log(`Updated ${updateField} count for user ${ratedUserId}`);

        // 6. إتمام المعاملة
        await session.commitTransaction();
        console.log("Rating transaction committed successfully.");
        res.status(201).json({ msg: "Rating submitted successfully!", rating: newRating });

    } catch (error) {
        await session.abortTransaction();
        console.error("Error submitting rating:", error.message);
        // إرجاع رسالة خطأ واضحة
        res.status(400).json({ msg: error.message || 'Failed to submit rating.' });
    } finally {
        session.endSession();
        console.log("Rating session ended.");
    }
};
const User = require('../models/User'); // لاسترداد وتحديث بيانات المستخدمين
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// --- دالة إرسال الرصيد ---
exports.sendFundsController = async (req, res) => {
    const senderId = req.user._id;
    const { recipientId, amount, currency } = req.body;

    console.log(`[WalletCtrl] Attempting to send funds: Sender=${senderId}, Recipient=${recipientId}, Amount=${amount} ${currency}`);

    // --- التحقق الأساسي (يبقى كما هو) ---
    if (!recipientId || !amount || !currency) return res.status(400).json({ msg: 'Recipient ID, amount, and currency are required.' });
    if (senderId.toString() === recipientId.toString()) return res.status(400).json({ msg: 'Cannot send funds to yourself.' });
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ msg: 'Invalid amount specified.' });
    // --- يمكنك إضافة التحقق من العملة إذا أردت ---
    // const supportedCurrencies = ['TND', 'USD']; // مثال
    // if (!supportedCurrencies.includes(currency)) {
    //     return res.status(400).json({ msg: 'Unsupported currency.' });
    // }
    // --- نهاية التحقق ---

    const session = await mongoose.startSession();
    session.startTransaction();

    let newTransaction; // لتعريف المعاملة خارج ال try لتستخدمها في الإشعارات

    try {
        // --- تحديث رصيد المرسل (يبقى كما هو) ---
        const sender = await User.findById(senderId).session(session);
        if (!sender) throw new Error('Sender not found.');
        if (sender.balance < numericAmount) throw new Error('Insufficient balance.');
        sender.balance -= numericAmount;
        await sender.save({ session });
        console.log(`[WalletCtrl] Sender balance updated: ${sender.balance}`);

        // --- تحديث رصيد المستلم (يبقى كما هو) ---
        const recipient = await User.findById(recipientId).session(session);
        if (!recipient) throw new Error('Recipient not found.');
        recipient.balance += numericAmount;
        await recipient.save({ session });
        console.log(`[WalletCtrl] Recipient balance updated: ${recipient.balance}`);

        // --- [!] خطوة 1: تسجيل المعاملة في السجل ---
        newTransaction = new Transaction({
            sender: senderId,
            recipient: recipientId,
            amount: numericAmount,
            currency: currency,
            type: 'TRANSFER', // نوع المعاملة: تحويل
            status: 'COMPLETED', // الحالة: مكتملة لأننا سنؤكدها
            description: `Transfer from ${sender.fullName} to ${recipient.fullName}` // وصف بسيط
        });
        await newTransaction.save({ session }); // حفظ المعاملة داخل الجلسة
        console.log("[WalletCtrl] Transaction logged successfully. ID:", newTransaction._id);
        // --------------------------------------------

        // --- [!] خطوة 2: إنشاء الإشعارات للطرفين ---
        // إنشاء رسائل واضحة
        const senderMsg = `You successfully sent ${numericAmount.toFixed(2)} ${currency} to ${recipient.fullName}.`;
        const recipientMsg = `You received ${numericAmount.toFixed(2)} ${currency} from ${sender.fullName}.`;

        // إنشاء الإشعارين (نستخدم Promise.all للسرعة)
        await Promise.all([
            Notification.create([{ // نستخدم .create لإنشاء متعدد
                user: senderId, // إشعار للمرسل
                type: 'FUNDS_SENT',
                title: 'Funds Sent Successfully',
                message: senderMsg,
                relatedEntity: { id: newTransaction._id, modelName: 'Transaction' } // ربط بالمعاملة
            }], { session }), // تمرير الجلسة لـ create
            Notification.create([{
                user: recipientId, // إشعار للمستلم
                type: 'FUNDS_RECEIVED',
                title: 'Funds Received',
                message: recipientMsg,
                relatedEntity: { id: newTransaction._id, modelName: 'Transaction' } // ربط بالمعاملة
            }], { session }) // تمرير الجلسة لـ create
        ]);
        console.log("[WalletCtrl] Sender and Recipient notifications created.");
        // --------------------------------------------

        // --- إتمام المعاملة بنجاح ---
        await session.commitTransaction();
        console.log("[WalletCtrl] Transaction committed successfully.");
        res.status(200).json({
            msg: `Successfully sent ${numericAmount.toFixed(2)} ${currency} to ${recipient.fullName}.`,
            newSenderBalance: sender.balance,
            transactionId: newTransaction._id // إرجاع معرف المعاملة (اختياري)
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("[WalletCtrl] Transaction aborted due to error:", error.message);
        // كن حذرًا في إرجاع رسائل الخطأ للمستخدم
        let userFriendlyError = 'Transaction failed. Please try again later.';
        if (error.message === 'Insufficient balance.') {
            userFriendlyError = error.message;
        } else if (error.message === 'Sender not found.' || error.message === 'Recipient not found.') {
             userFriendlyError = 'User not found. Please check the recipient details.';
        }
        res.status(400).json({ msg: userFriendlyError });

    } finally {
        session.endSession();
        console.log("[WalletCtrl] Session ended.");
    }
};

exports.getTransactionsController = async (req, res) => {
    const userId = req.user._id; // ID المستخدم الحالي (من verifyAuth)
    console.log(`[WalletCtrl] Fetching transactions for User ID: ${userId}`);

    try {
        // البحث عن المعاملات حيث المستخدم هو المرسل أو المستلم
        const transactions = await Transaction.find({
            $or: [{ sender: userId }, { recipient: userId }]
        })
        .populate('sender', 'fullName email') // جلب بيانات المرسل الأساسية
        .populate('recipient', 'fullName email') // جلب بيانات المستلم الأساسية
        .sort({ createdAt: -1 }) // ترتيب من الأحدث للأقدم
        .limit(20); // جلب آخر 20 معاملة كمثال (يمكن إضافة pagination لاحقًا)

        console.log(`[WalletCtrl] Found ${transactions.length} transactions.`);
        res.status(200).json(transactions);

    } catch (error) {
        console.error("[WalletCtrl] Error fetching transactions:", error);
        res.status(500).json({ msg: "Failed to retrieve transactions." });
    }
};

// --- يمكنك إضافة دوال أخرى هنا لمعالجة الإيداع والسحب وجلب المعاملات ---
// exports.depositFundsController = async (req, res) => { ... };
// exports.withdrawFundsController = async (req, res) => { ... };
// --------------------------------------------------------------------
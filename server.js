const express = require('express');
const http = require('http'); // استيراد http
const { Server } = require("socket.io"); // استيراد Server من socket.io
const cors = require('cors');
const user = require('./router/user');
const product = require('./router/product')
const cart = require('./router/cart')
const config = require('config')
const notification = require('./router/notification');
const wallet = require('./router/wallet');
const ratingRoute = require('./router/rating');

const connectDB = require('./config/connectDB');

const PORT = config.get('PORT');
const app = express();
const server = http.createServer(app); // إنشاء خادم http من تطبيق express

// إعداد CORS لـ Socket.IO أيضاً
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // أو رابط الواجهة الأمامية الخاصة بك
        methods: ["GET", "POST"]
    }
});

app.use(cors()); // CORS لـ Express
app.use(express.json());
connectDB();

// --- تخزين المستخدمين المتصلين (مثال بسيط) ---
let onlineUsers = {}; // { userId: socketId }

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // استقبال userId عند اتصال المستخدم وتخزينه
    socket.on('registerUser', (userId) => {
        if (userId) {
            onlineUsers[userId] = socket.id;
            console.log('Registered user:', userId, 'with socket:', socket.id);
            // يمكنك إرسال تأكيد أو حالة الاتصال إذا أردت
            // io.emit('getOnlineUsers', Object.keys(onlineUsers)); // إرسال قائمة المتصلين للجميع (اختياري)
        }
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
        // إزالة المستخدم من القائمة عند قطع الاتصال
        for (const userId in onlineUsers) {
            if (onlineUsers[userId] === socket.id) {
                delete onlineUsers[userId];
                break;
            }
        }
         // io.emit('getOnlineUsers', Object.keys(onlineUsers)); // تحديث قائمة المتصلين (اختياري)
    });

    // يمكنك إضافة مستمعين لأحداث أخرى هنا (مثل الدردشة)
});

// --- تمرير io و onlineUsers إلى مساراتك (أو استخدام طريقة أخرى للوصول إليها) ---
// طريقة بسيطة: جعلها متاحة عبر middleware أو req object
app.use((req, res, next) => {
    req.io = io;
    req.onlineUsers = onlineUsers;
    next();
});
// ----------------------------------------------------------------

// -------------- REQUEST CATEGORIES --------------
app.use("/user", user);
app.use('/product', product);
app.use('/cart', cart);
app.use('/notifications', notification);
app.use('/wallet', wallet);
app.use('/ratings', ratingRoute);

// --- تشغيل الخادم باستخدام server بدلاً من app ---
const userPORT = PORT || 5000;
server.listen(userPORT, (err) => err ? console.log(err) :
    console.log(`Server (with Socket.IO) listening on port ${userPORT}!`)
);
// src/App.js
import React, { useState, useEffect, useRef } from 'react'; // استيراد Hooks اللازمة
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'; // استيراد مكونات React Router
import { useSelector, useDispatch } from 'react-redux'; // استيراد Hooks الخاصة بـ Redux
import io from 'socket.io-client'; // استيراد مكتبة Socket.IO Client
import { getProfile, logoutUser } from './redux/actions/userAction'; // استيراد actions المستخدم
import { Alert, Spinner } from 'react-bootstrap'; // استيراد مكونات React Bootstrap
import { ToastContainer, toast } from 'react-toastify'; // استيراد React Toastify

// --- استيراد الصفحات والمكونات ---
import NotFound from './pages/NotFound';
import CommandsListVendor from './components/vendor/CommandsListVendor';
import ProductListVendor from './components/vendor/ProductListVendor';
import CommandsListAd from './components/admin/CommandsListAd';
import UserListAd from './components/admin/UserListAd';
import ProductListAdmin from './components/admin/ProductListAdmin';
import NotificationsPage from './pages/NotificationsPage';
import Support from './pages/Support';
import Profile from './components/commun/Profile';
import Comptes from './pages/Comptes';
import Wallet from './pages/Wallet';
import MainDashboard from './pages/MainDashboard';
import OfflineProd from './components/commun/OfflineProd';
import Register from './components/commun/Register';
import Login from './components/commun/Login';
import UserProfilePage from './pages/UserProfilePage';
import Sidebar from './components/layout/Sidebar'; // استيراد الشريط الجانبي

// --- استيراد ملفات CSS ---
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import 'react-toastify/dist/ReactToastify.css'; // React Toastify CSS
import './App.css'; // ملف CSS الرئيسي للتطبيق
import './components/layout/Sidebar.css'; // CSS للشريط الجانبي
import './pages/MainDashboard.css'; // CSS لـ MainDashboard

// --- تعريف ثابت رابط خادم Socket.IO ---
const SOCKET_SERVER_URL = "http://localhost:8000"; // تأكد من تطابق هذا مع منفذ الخادم الخلفي

// --- مكون مساعد: مسار محمي يتطلب تسجيل الدخول ---
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  const user = useSelector(state => state.userReducer?.user);
  const allowedBlockedPaths = ['/dashboard/profile', '/dashboard/support']; // المسارات المسموحة للمستخدم المحظور

  if (!isAuth) {
    // إذا لم يكن مسجلاً، أعد توجيهه لصفحة الدخول مع حفظ المسار الأصلي
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.blocked) {
    // إذا كان المستخدم محظورًا
    if (allowedBlockedPaths.includes(location.pathname)) {
      // اسمح بالوصول للمسارات المحددة
      return children;
    } else {
      // أعد توجيهه لملفه الشخصي
      return <Navigate to="/dashboard/profile" replace />;
    }
  }
  // إذا كان مسجلاً وغير محظور، اسمح بالوصول للمكون المطلوب
  return children;
};

// --- مكون مساعد: مسار محمي يتطلب دور الأدمن ---
const AdminRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  const user = useSelector(state => state.userReducer?.user);

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.userRole !== 'Admin') {
    // إذا لم يكن أدمن، أعد توجيهه للوحة التحكم الرئيسية
    return <Navigate to="/dashboard" replace />;
  }
  if (user?.blocked) {
    // إذا كان الأدمن محظورًا، أعد توجيهه لملفه الشخصي (نادر الحدوث ولكن للاحتياط)
    return <Navigate to="/dashboard/profile" replace />;
  }
  // إذا كان أدمن وغير محظور، اسمح بالوصول
  return children;
};

// --- مكون مساعد: مسار محمي يتطلب دور البائع ---
const VendorRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  const user = useSelector(state => state.userReducer?.user);
  const allowedBlockedPaths = ['/dashboard/profile', '/dashboard/support'];

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.userRole !== 'Vendor') {
    // إذا لم يكن بائعًا، أعد توجيهه للوحة التحكم الرئيسية
    return <Navigate to="/dashboard" replace />;
  }
  if (user?.blocked) {
    if (allowedBlockedPaths.includes(location.pathname)) {
      return children;
    } else {
      return <Navigate to="/dashboard/profile" replace />;
    }
  }
  // إذا كان بائعًا وغير محظور، اسمح بالوصول
  return children;
};

// --- مكون مساعد: عرض تحذير للمستخدم المحظور ---
const BlockedWarning = ({ isAuth, user }) => {
  const dispatch = useDispatch();

  // دالة تسجيل الخروج
  const handleLogoutClick = (e) => {
    e.preventDefault(); // منع السلوك الافتراضي للرابط
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logoutUser());
    }
  };

  // لا تعرض شيئًا إذا لم يكن مسجلاً أو غير محظور
  if (!isAuth || !user?.blocked) {
    return null;
  }

  // عرض رسالة التحذير
  return (
    <Alert variant="danger" className="blocked-warning-banner m-3">
      <Alert.Heading>Account Suspended</Alert.Heading>
      Your account is currently blocked. Some features may be unavailable.
      If you believe this is an error, please{' '}
      <Alert.Link as={Link} to="/dashboard/support">contact support</Alert.Link>
      {' OR '}
      <Alert.Link
        href="#"
        onClick={handleLogoutClick}
        style={{ cursor: 'pointer', fontWeight: 'bold' }}
      >
        Logout
      </Alert.Link>
    </Alert>
  );
};

// --- المكون الرئيسي للتطبيق ---
function App() {
  // --- State ---
  const [search, setSearch] = useState(""); // حالة البحث (إذا استخدمتها في Sidebar)

  // --- Redux Hooks ---
  const dispatch = useDispatch();
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false); // هل المستخدم مسجل؟
  const authChecked = useSelector(state => state.userReducer?.authChecked ?? false); // هل تم التحقق من المصادقة الأولية؟
  const user = useSelector(state => state.userReducer?.user); // بيانات المستخدم المسجل
  const loading = useSelector(state => state.userReducer?.loading ?? false); // هل عملية المصادقة قيد التحميل؟
  const token = localStorage.getItem('token'); // جلب التوكن من التخزين المحلي

  // --- useRef لتخزين مرجع Socket.IO ---
  const socketRef = useRef();

  // --- useEffect: جلب بيانات المستخدم عند تحميل التطبيق إذا كان التوكن موجودًا ---
  useEffect(() => {
    // فقط إذا كان هناك توكن ولم يتم التحقق بعد وليست هناك عملية تحميل جارية
    if (token && !authChecked && !loading) {
      console.log("App Effect (Mount/Auth Check): Calling getProfile...");
      dispatch(getProfile());
    } else if (!token && !authChecked) {
      // إذا لم يكن هناك توكن، اعتبر التحقق قد تم (لا يوجد مستخدم مسجل)
      dispatch({ type: 'AUTH_CHECK_COMPLETE' });
    }
  }, [dispatch, token, authChecked, loading]); // الاعتماديات

  // --- useEffect: إدارة اتصال Socket.IO ---
  useEffect(() => {
    // فقط إذا كان المستخدم مسجلاً ولديه ID
    if (isAuth && user?._id) {
      // تحقق إذا كان الاتصال غير موجود أو مقطوع
      if (!socketRef.current || !socketRef.current.connected) {
        console.log("App Effect (Socket): Setting up Socket.IO connection...");
        // إنشاء اتصال جديد
        socketRef.current = io(SOCKET_SERVER_URL, {
          reconnectionAttempts: 5, // محاولة إعادة الاتصال 5 مرات
          reconnectionDelay: 1000, // تأخير 1 ثانية بين المحاولات
        });

        // --- مستمع: عند نجاح الاتصال ---
        socketRef.current.on('connect', () => {
          console.log('Socket connected:', socketRef.current.id);
          // أرسل ID المستخدم للخادم لتسجيله
          socketRef.current.emit('registerUser', user._id);
        });

        // --- مستمع: عند استقبال إشعار جديد ---
        socketRef.current.on('new_notification', (notification) => {
          console.log('Socket event received: new_notification', notification);
          toast.info(`🔔 ${notification.title || 'New Notification!'}`, {
            icon: false, // يمكنك تخصيص الأيقونة أو إزالتها
          });

          dispatch({ type: 'ADD_NOTIFICATION_REALTIME', payload: notification });
        });

        // --- مستمع: عند قطع الاتصال ---
        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected. Reason:', reason);
          // يمكنك إضافة منطق هنا إذا أردت، مثل إظهار رسالة للمستخدم
        });

        // --- مستمع: عند حدوث خطأ في الاتصال ---
        socketRef.current.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
          // يمكنك عرض رسالة خطأ للمستخدم أو محاولة إعادة الاتصال يدويًا
        });
      }

    } else {
      // إذا لم يكن المستخدم مسجلاً، أو قام بتسجيل الخروج
      // تأكد من قطع الاتصال إذا كان موجودًا
      if (socketRef.current && socketRef.current.connected) {
        console.log("App Effect (Socket): User logged out or not authenticated. Disconnecting Socket.IO...");
        socketRef.current.disconnect();
      }
    }

    // --- دالة التنظيف (Cleanup Function) ---
    // يتم استدعاؤها عند إزالة المكون أو قبل إعادة تشغيل الـ Effect
    return () => {
      if (socketRef.current) {
        console.log("App Cleanup: Disconnecting Socket.IO and removing listeners...");
        // إزالة المستمعين لمنع تسرب الذاكرة عند إعادة إنشاء الاتصال
        socketRef.current.off('connect');
        socketRef.current.off('new_notification');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        // قطع الاتصال
        socketRef.current.disconnect();
        // يمكنك إلغاء تعيين المرجع إذا أردت (اختياري)
        // socketRef.current = null;
      }
    };
  }, [isAuth, user?._id, dispatch]); // الاعتماديات: أعد تشغيل الـ Effect إذا تغيرت حالة المصادقة أو ID المستخدم

  // --- عرض مؤشر التحميل أثناء التحقق الأولي ---
  if (!authChecked && token) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <span className="ms-3 text-muted">Loading session...</span>
      </div>
    );
  }

  // --- دوال مساعدة ---
  const handleSearchChange = (newSearchTerm) => { setSearch(newSearchTerm); };
  // دالة لتمرير خاصية البحث للمكونات التي تحتاجها
  const renderComponentWithSearch = (Component) => <Component search={search} />;

  // --- دالة زر اختبار الصوت ---
  const playTestSound = () => {
    try {
      console.log("Test button clicked - Attempting sound play");
      const testAudio = new Audio('/notification.wav'); // استخدم نفس المسار
      testAudio.play()
        .then(() => console.log("Test sound played successfully via button."))
        .catch(error => console.error("Test sound play failed via button:", error));
    } catch (err) {
      console.error("Failed to load test sound via button:", err);
    }
  };

  // --- JSX: بنية التطبيق ---
  return (
    // الحاوية الرئيسية للتطبيق، قد يتم تغيير الـ class بناءً على حالة المصادقة لتطبيق أنماط مختلفة
    <div className={`app-container ${isAuth ? 'layout-authenticated' : 'layout-public'}`}>

      {/* حاوية رسائل التنبيه (Toast) */}
      <ToastContainer
        position="top-center" // موقع ظهور الرسائل
        autoClose={5000}       // مدة بقاء الرسالة (5 ثواني)
        hideProgressBar={false} // إظهار شريط التقدم
        newestOnTop={true}    // الرسائل الأحدث تظهر في الأعلى
        closeOnClick           // إغلاق الرسالة عند النقر عليها
        rtl={false}            // اتجاه النص (من اليسار لليمين)
        pauseOnFocusLoss     // إيقاف المؤقت عند فقدان التركيز على النافذة
        draggable              // إمكانية سحب الرسالة
        pauseOnHover           // إيقاف المؤقت عند مرور الفأرة فوق الرسالة
        theme="colored"        // استخدام الثيم الملون (أو "light", "dark")
      />

      {/* عرض الشريط الجانبي فقط إذا كان المستخدم مسجلاً */}
      {isAuth && <Sidebar onSearchChange={handleSearchChange} />}

      {/* منطقة المحتوى الرئيسية */}
      <main className={`main-content-area flex-grow-1 ${isAuth ? 'content-authenticated' : 'content-public'}`}>
        {/* عرض تحذير الحظر إذا كان المستخدم مسجلاً ومحظورًا */}
        <BlockedWarning isAuth={isAuth} user={user} />

        {/* نظام التوجيه (Routing) */}
        <Routes>
          {/* المسارات العامة (يمكن الوصول إليها بدون تسجيل دخول) */}
          {/* إذا حاول مستخدم مسجل الوصول إليها، يتم توجيهه للوحة التحكم */}
          <Route path="/login" element={!isAuth ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!isAuth ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="/" element={<OfflineProd />} /> {/* الصفحة الرئيسية أو صفحة المنتجات غير المتصلة */}

          {/* المسارات المحمية (تتطلب تسجيل الدخول) */}
          <Route path="/dashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/dashboard/comptes" element={<ProtectedRoute><Comptes /></ProtectedRoute>} /> {/* صفحة "My Accounts" */}
          <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          {/* مسارات الأدمن (تتطلب دور الأدمن) */}
          <Route path="/dashboard/admin/products" element={<AdminRoute>{renderComponentWithSearch(ProductListAdmin)}</AdminRoute>} />
          <Route path="/dashboard/admin/users" element={<AdminRoute><UserListAd search={search} /></AdminRoute>} />
          <Route path="/dashboard/admin/orders" element={<AdminRoute>{renderComponentWithSearch(CommandsListAd)}</AdminRoute>} />

          {/* مسارات البائع (تتطلب دور البائع) */}
          <Route path="/dashboard/vendor/products" element={<VendorRoute>{renderComponentWithSearch(ProductListVendor)}</VendorRoute>} />
          <Route path="/dashboard/vendor/orders" element={<VendorRoute>{renderComponentWithSearch(CommandsListVendor)}</VendorRoute>} />

          {/* مسار صفحة ملف تعريف مستخدم آخر (يمكن الوصول إليه من الجميع ربما) */}
          <Route path="/profile/:userId" element={<UserProfilePage />} />

          {/* مسار الصفحة غير موجودة (404) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

// تصدير المكون الرئيسي
export default App;
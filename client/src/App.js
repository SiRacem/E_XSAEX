// src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
// --- [!] استيراد useDispatch و logoutUser ---
import { useSelector, useDispatch } from 'react-redux';
import { getProfile, logoutUser } from './redux/actions/userAction'; // <-- إضافة logoutUser
// --- الأسطر الصحيحة لـ Bootstrap و react-toastify ---
import { Alert, Spinner } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
// --- Pages & Components ---
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

// --- CSS Imports ---
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './components/layout/Sidebar.css';
import './pages/MainDashboard.css'; // <-- استيراد CSS هنا

// --- Layout Component ---
import Sidebar from './components/layout/Sidebar';

// --- مكون مساعد للحماية والتوجيه للمستخدم المحظور (يبقى كما هو) ---
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  // --- تعديل بسيط في useSelector هنا لتحسين الأداء (اختياري) ---
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  const user = useSelector(state => state.userReducer?.user);
  // ---------------------------------------------------------

  const allowedBlockedPaths = ['/dashboard/profile', '/dashboard/support'];

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.blocked) {
    if (allowedBlockedPaths.includes(location.pathname)) {
      return children;
    } else {
      return <Navigate to="/dashboard/profile" replace />;
    }
  }
  return children;
};
// ---------------------------------------------------

// --- مكون مساعد للحماية والتوجيه لمسارات الأدمن (يبقى كما هو) ---
const AdminRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  const user = useSelector(state => state.userReducer?.user);

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.userRole !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (user?.blocked) {
    return <Navigate to="/dashboard/profile" replace />;
  }
  return children;
};
// ------------------------------------------------

// --- مكون مساعد للحماية والتوجيه لمسارات البائع (يبقى كما هو) ---
const VendorRoute = ({ children }) => {
  const location = useLocation();
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  const user = useSelector(state => state.userReducer?.user);
  const allowedBlockedPaths = ['/dashboard/profile', '/dashboard/support'];

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user?.userRole !== 'Vendor') {
    return <Navigate to="/dashboard" replace />;
  }
  if (user?.blocked) {
    if (allowedBlockedPaths.includes(location.pathname)) {
      return children;
    } else {
      return <Navigate to="/dashboard/profile" replace />;
    }
  }
  return children;
};
// ----------------------------------------------


// --- [!] مكون التحذير للمستخدم المحظور مع رابط Logout ---
const BlockedWarning = ({ isAuth, user }) => { // استقبال Props
  const dispatch = useDispatch(); // <-- استخدام Hook للحصول على dispatch

  const handleLogoutClick = (e) => {
    e.preventDefault(); // منع السلوك الافتراضي للرابط
    // إضافة تأكيد قبل الخروج
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logoutUser());
    }
  };

  // لا تعرض شيئًا إذا لم يكن المستخدم مسجلاً أو غير محظور
  if (!isAuth || !user?.blocked) {
    return null;
  }

  return (
    <Alert variant="danger" className="blocked-warning-banner m-3">
      <Alert.Heading>Account Suspended</Alert.Heading>
      Your account is currently blocked. Some features may be unavailable.
      If you believe this is an error, please{' '}
      <Alert.Link as={Link} to="/dashboard/support">contact support</Alert.Link>
      {/* --- إضافة رابط تسجيل الخروج --- */}
      {' OR '}
      <Alert.Link
        href="#" // href="#" لمنع التوجيه الفعلي
        onClick={handleLogoutClick} // استدعاء الدالة عند النقر
        style={{ cursor: 'pointer', fontWeight: 'bold' }} // تنسيق إضافي بسيط
      >
        Logout
      </Alert.Link>
      {/* --- نهاية الإضافة --- */}
    </Alert>
  );
};
// --- نهاية مكون التحذير ---


function App() {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch(); // <-- dispatch متاح هنا بالفعل

  // --- استخدام selectors بشكل منفصل لتحسين الأداء ---
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false);
  const authChecked = useSelector(state => state.userReducer?.authChecked ?? false);
  const user = useSelector(state => state.userReducer?.user);
  const loading = useSelector(state => state.userReducer?.loading ?? false);
  const token = localStorage.getItem('token');
  // ----------------------------------------------------

  useEffect(() => {
    // استدعاء getProfile فقط إذا كان هناك توكن ولم يتم التحقق بعد
    if (token && !authChecked && !loading) {
      console.log("App Effect: Calling getProfile...");
      dispatch(getProfile());
    } else if (!token && !authChecked) {
      // إذا لم يكن هناك توكن، نعتبر التحقق قد تم
      dispatch({ type: 'AUTH_CHECK_COMPLETE' });
    }
  }, [dispatch, token, authChecked, loading]);

  // --- عرض مؤشر التحميل أثناء جلب البروفايل الأولي ---
  if (!authChecked && token) {
    return (
      <div className="vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading session...</span>
      </div>
    );
  }
  // --------------------------------------------------

  const handleSearchChange = (newSearchTerm) => { setSearch(newSearchTerm); };
  const renderComponentWithSearch = (Component) => <Component search={search} />;

  return (
    <div className={`app-container ${isAuth ? 'layout-authenticated' : 'layout-public'}`}>
      {/* حاوية الرسائل المنبثقة */}
      <ToastContainer position="top-center" autoClose={4000} theme="colored" />

      {/* الشريط الجانبي (يظهر فقط للمستخدم المسجل) */}
      {isAuth && <Sidebar onSearchChange={handleSearchChange} />}

      {/* منطقة المحتوى الرئيسية */}
      <main className={`main-content-area flex-grow-1 ${isAuth ? 'content-authenticated' : 'content-public'}`}>
        {/* --- [!] تمرير Props إلى BlockedWarning --- */}
        <BlockedWarning isAuth={isAuth} user={user} />
        {/* ----------------------------------- */}

        {/* تعريف المسارات */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!isAuth ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!isAuth ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="/" element={<OfflineProd /> } />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/dashboard/comptes" element={<ProtectedRoute><Comptes /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/dashboard/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/dashboard/admin/products" element={<AdminRoute>{renderComponentWithSearch(ProductListAdmin)}</AdminRoute>} />
          <Route path="/dashboard/admin/users" element={<AdminRoute><UserListAd search={search} /></AdminRoute>} />
          <Route path="/dashboard/admin/orders" element={<AdminRoute>{renderComponentWithSearch(CommandsListAd)}</AdminRoute>} />

          {/* Vendor Routes */}
          <Route path="/dashboard/vendor/products" element={<VendorRoute>{renderComponentWithSearch(ProductListVendor)}</VendorRoute>} />
          <Route path="/dashboard/vendor/orders" element={<VendorRoute>{renderComponentWithSearch(CommandsListVendor)}</VendorRoute>} />

          {/* User Profile Page */}
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          {/* NotFound */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

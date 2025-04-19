import React, { useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import {
  FaWallet, FaUserCircle, FaBell, FaComments, FaNewspaper, FaHeadset, FaSignOutAlt, FaBalanceScale, FaHourglassHalf,
} from "react-icons/fa";
import { logoutUser } from "../redux/actions/userAction";
import { getNotifications } from "../redux/actions/notificationAction";
import {
  Badge, Spinner, Card, Container, Row, Col, Alert, ListGroup,
} from "react-bootstrap";

const MainDashboard = () => {
  const dispatch = useDispatch();

  // --- [!] Selectors محسّنة ومفصولة ---
  const user = useSelector(state => state.userReducer?.user); // الكائن يمكن تركه
  const isAuth = useSelector(state => state.userReducer?.isAuth ?? false); // قيمة أولية
  const unreadCount = useSelector(state => state.notificationReducer?.unreadCount ?? 0); // قيمة أولية
  const notificationsLoading = useSelector(state => state.notificationReducer?.loading ?? false); // قيمة أولية
  const notificationError = useSelector(state => state.notificationReducer?.error ?? null); // قيمة أولية
  // ------------------------------------

  // دالة تسجيل الخروج (تبقى كما هي)
  const handleLogout = useCallback(() => {
    if (window.confirm("Are you sure you want to logout?")) {
      dispatch(logoutUser());
    }
  }, [dispatch]);

  // جلب الإشعارات (تبقى كما هي)
  useEffect(() => {
    if (isAuth) {
      // console.log("[MainDashboard Effect] Fetching notifications...");
      dispatch(getNotifications());
    }
  }, [dispatch, isAuth]);

  // دالة تنسيق العملة (تبقى كما هي)
  const formatCurrency = useMemo(() => (amount, currencyCode = "TND") => {
        const num = Number(amount);
        return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode, minimumFractionDigits: 2 }).format(isNaN(num) ? 0 : num);
  }, []);

  // --- التحقق الأساسي قبل العرض ---
  // App.js يضمن أننا لن نصل هنا إلا إذا كان isAuth=true, ولكن user قد يكون null للحظات
  if (!user) {
    // عرض مؤشر تحميل بسيط أو رسالة انتظار
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading user data...</span>
      </Container>
    );
  }
  // --- نهاية التحقق الأساسي ---

  return (
    <div className="dashboard-container container-fluid py-4">
      {/* عرض خطأ الإشعارات إن وجد */}
      {notificationError && (
        <Alert variant="warning" dismissible>
          Failed to load notifications: {notificationError}
        </Alert>
      )}

      {/* الصف العلوي - صناديق المعلومات */}
      <Row className="g-4 mb-4">
        {/* صندوق الرصيد الرئيسي */}
        <Col lg={4} md={6}>
          <Card className="info-box balance-box text-white p-3 rounded shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Balance Principal</h5>
                <FaWallet size={24} />
              </div>
              <h3 className="display-6 fw-bold mb-3">
                {" "}
                {formatCurrency(user.balance)}{" "}
              </h3>
              <div className="d-flex align-items-center mt-auto">
                <FaUserCircle size={20} className="me-2" />
                <span className="fw-bold username">{user.fullName}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* صندوق رصيد البائع (مشروط) */}
        {(user.userRole === "Vendor" || user.userRole === "Admin") && (
          <Col lg={4} md={6}>
            <Card className="info-box seller-box text-white p-3 rounded shadow-sm h-100">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Seller Balance</h5>
                  <FaBalanceScale size={24} />
                </div>
                <h4 className="fw-bold mb-3">
                  {formatCurrency(user.sellerAvailableBalance)}
                </h4>
                <hr className="border-light opacity-50" />
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="mb-0">On Hold Balance</h5>
                  <FaHourglassHalf size={20} />
                </div>
                <h4 className="fw-bold">
                  {formatCurrency(user.sellerPendingBalance)}
                </h4>
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* صندوق الإشعارات/الرسائل */}
        <Col
          lg={4}
          md={user.userRole === "Vendor" || user.userRole === "Admin" ? 12 : 6}
        >
          {" "}
          {/* تعديل حجم العمود */}
          <Card className="info-box comms-box p-3 rounded shadow-sm h-100">
            <Card.Body>
              {/* رابط الإشعارات مع Badge */}
              <Link
                to="/dashboard/notifications"
                className="comms-link d-flex align-items-center text-decoration-none mb-3 position-relative"
              >
                <FaBell size={22} className="me-3 text-primary icon" />
                <span className="link-text">Notifications</span>
                {!notificationsLoading && unreadCount > 0 && (
                  <Badge pill bg="danger" className="notification-link-badge">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                {notificationsLoading && (
                  <Spinner
                    animation="border"
                    size="sm"
                    variant="secondary"
                    className="ms-2"
                  />
                )}
              </Link>
              <hr className="my-2" />
              {/* رابط الرسائل */}
              <Link
                to="/dashboard/messages"
                className="comms-link d-flex align-items-center text-decoration-none mt-3"
              >
                <FaComments size={22} className="me-3 text-success icon" />
                <span className="link-text">Messages</span>
                {/* يمكنك إضافة badge للرسائل غير المقروءة هنا أيضًا */}
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* المعاملات الأخيرة */}
        <Col lg={8}>
          <Card className="shadow-sm mb-4 transaction-card">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-secondary">Recent Transactions</h5>
              <span className="text-muted small">View 0 From 0</span>
            </Card.Header>
            <Card.Body style={{ minHeight: "250px" }}>
              <div className="d-flex justify-content-center align-items-center h-100">
                <p className="text-center text-muted">
                  No Transaction Data Available
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* الخيارات */}
        <Col lg={4}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white text-center">
              {" "}
              <h5 className="mb-0">Options</h5>{" "}
            </Card.Header>
            <ListGroup variant="flush">
              {" "}
              {/* استخدام ListGroup */}
              <ListGroup.Item
                action
                as={Link}
                to="/dashboard/latest-news"
                className="d-flex align-items-center"
              >
                <FaNewspaper size={20} className="me-3 text-primary icon" />{" "}
                Latest News
              </ListGroup.Item>
              <ListGroup.Item
                action
                as={Link}
                to="/dashboard/support"
                className="d-flex align-items-center"
              >
                <FaHeadset size={20} className="me-3 text-success icon" />{" "}
                Technical Support
              </ListGroup.Item>
              {/* زر تسجيل الخروج */}
              <ListGroup.Item
                action
                onClick={handleLogout}
                className="d-flex align-items-center text-danger logout-button-dashboard"
                style={{ cursor: "pointer" }}
              >
                {" "}
                {/* تغيير لـ ListGroup.Item */}
                <FaSignOutAlt size={20} className="me-3 icon" /> Logout
              </ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MainDashboard;

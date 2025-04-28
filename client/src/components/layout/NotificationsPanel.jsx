// src/components/layout/NotificationsPanel.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Dropdown, Badge, ListGroup, Spinner } from "react-bootstrap"; // إزالة Button غير المستخدم هنا
import { FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import {
  getNotifications,
  markNotificationsRead,
} from "../../redux/actions/notificationAction"; // تأكد من المسار
import "./NotificationsPanel.css"; // تأكد من المسار

const NotificationsPanel = () => {
  const dispatch = useDispatch();
  // الوصول الآمن للحالة
  const { notifications, unreadCount, loading, loadingMarkRead } = useSelector(
    (state) => {
      // إضافة loadingMarkRead
      const notifState = state.notificationReducer || {
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
        loadingMarkRead: false,
      };
      return {
        notifications: Array.isArray(notifState.notifications)
          ? notifState.notifications
          : [],
        unreadCount: notifState.unreadCount ?? 0,
        loading: notifState.loading ?? false,
        error: notifState.error ?? null, // يمكنك عرض الخطأ إذا أردت
        loadingMarkRead: notifState.loadingMarkRead ?? false,
      };
    }
  );
  const [isOpen, setIsOpen] = useState(false);

  // جلب الإشعارات عند تحميل المكون أو عند تغير المستخدم (إذا كان مرتبطًا بالمستخدم)
  useEffect(() => {
    dispatch(getNotifications());
  }, [dispatch]);

  const toggleDropdown = (nextOpenState, event, metadata) => {
    // منع الإغلاق عند النقر داخل القائمة
    if (metadata.source === "select" || metadata.source === "click") {
      if (isOpen && event?.target?.closest(".dropdown-menu")) {
        setIsOpen(true);
        return;
      }
      // تمييز الإشعارات كمقروءة عند فتح القائمة (فقط غير المقروءة)
      if (nextOpenState && unreadCount > 0) {
        const unreadIds = notifications
          .filter((n) => !n.isRead)
          .map((n) => n._id);
        if (unreadIds.length > 0 && !loadingMarkRead) {
          // تحقق من عدم التحميل
          dispatch(markNotificationsRead(unreadIds));
        }
      }
    }
    setIsOpen(nextOpenState);
  };

  return (
    <Dropdown
      show={isOpen}
      onToggle={toggleDropdown}
      align="end"
      className="notifications-dropdown me-2"
    >
      <Dropdown.Toggle
        variant="link"
        id="dropdown-notifications"
        className="p-0 border-0 position-relative bell-icon"
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge
            pill
            bg="danger"
            className="position-absolute top-0 start-100 translate-middle notification-badge"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu
        className="notifications-menu shadow-lg"
        style={{ minWidth: "300px", maxHeight: "400px", overflowY: "auto" }}
      >
        <Dropdown.Header className="d-flex justify-content-between align-items-center">
          <span>Notifications</span>
          {/* مؤشر تحميل لتمييز القراءة */}
          {loadingMarkRead && (
            <Spinner animation="border" size="sm" variant="primary" />
          )}
        </Dropdown.Header>
        <ListGroup variant="flush">
          {loading ? (
            <ListGroup.Item className="text-center">
              <Spinner animation="border" size="sm" />
            </ListGroup.Item>
          ) : notifications.length > 0 ? (
            // عرض آخر 5 إشعارات مثلاً
            notifications.slice(0, 5).map((notif) => (
              <ListGroup.Item
                key={notif._id}
                as={Link}
                // --- *** تعديل الرابط هنا ليكون أكثر عمومية *** ---
                to={
                  notif.relatedEntity?.id && notif.relatedEntity?.modelName
                    ? `/dashboard/${notif.relatedEntity.modelName.toLowerCase()}/${
                        notif.relatedEntity.id
                      }`
                    : "/dashboard/notifications"
                } // مثال: /dashboard/product/123
                // -----------------------------------------------
                className={`notification-item ${!notif.isRead ? "unread" : ""}`}
                onClick={() => setIsOpen(false)} // أغلق القائمة عند النقر
              >
                <div className="fw-bold small text-truncate">
                  {notif.title || "Notification"}
                </div>{" "}
                {/* text-truncate لاختصار العنوان الطويل */}
                <div className="text-muted small mb-1 text-truncate">
                  {notif.message}
                </div>{" "}
                {/* اختصار الرسالة */}
                <div className="text-muted extra-small">
                  {new Date(notif.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>{" "}
                {/* عرض الوقت فقط */}
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="text-center text-muted small py-3">
              No new notifications.
            </ListGroup.Item>
          )}
        </ListGroup>
        <Dropdown.Divider />
        <Dropdown.Item
          as={Link}
          to="/dashboard/notifications"
          className="text-center small view-all-link"
          onClick={() => setIsOpen(false)}
        >
          View All Notifications
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationsPanel;

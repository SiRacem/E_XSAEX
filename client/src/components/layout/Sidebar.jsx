// src/components/layout/Sidebar.jsx
// *** نسخة نهائية مُعاد كتابتها للإصلاح ***

import React, { useState, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FaHome,
  FaWallet,
  FaImages,
  FaUserCircle,
  FaSignOutAlt,
  FaSearch,
  FaUsers,
  FaClipboardList,
  FaTasks,
  FaHeadset,
} from "react-icons/fa";
import { useSelector, useDispatch } from "react-redux";
import { Form } from "react-bootstrap";
import { logoutUser } from "../../redux/actions/userAction";
import "./Sidebar.css"; // تأكد من وجود هذا الملف

// --- المسار المؤقت للشعار ---
// const logoUrl = "/images/logo.png"; // استخدم هذا إذا وضعت الشعار في public/images
const logoUrl =
  "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"; // استخدم رابطًا خارجيًا مؤقتًا للتأكد

const Sidebar = ({ onSearchChange }) => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const userRole = useSelector((state) => state.userReducer.user?.userRole);

  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
  }, [dispatch]);
  const handleSearch = useCallback(
    (e) => {
      setSearchTerm(e.target.value);
      if (onSearchChange) {
        onSearchChange(e.target.value);
      }
    },
    [onSearchChange]
  );

  return (
    <div className="unified-sidebar">
      {" "}
      {/* تم تبسيط الكلاسات هنا */}
      {/* Header section for logo and search (on larger screens) */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo-link">
          <img src={logoUrl} alt="Logo" className="sidebar-logo" />
        </Link>
        <div className="sidebar-search-container">
          <Form
            className="d-flex sidebar-search-form"
            onSubmit={(e) => e.preventDefault()}
          >
            <Form.Control
              type="search"
              placeholder="Search..."
              aria-label="Search"
              className="form-control-sm search-input"
              value={searchTerm}
              onChange={handleSearch}
            />
          </Form>
        </div>
      </div>
      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {/* --- روابط مشتركة --- */}
        <NavLink className="sidebar-link" to="/dashboard" end title="Dashboard">
          {" "}
          <FaHome className="icon" /> <span className="link-text">Main</span>{" "}
        </NavLink>
        <NavLink className="sidebar-link" to="/dashboard/wallet" title="Wallet">
          {" "}
          <FaWallet className="icon" />{" "}
          <span className="link-text">Wallet</span>{" "}
        </NavLink>
        <NavLink
          className="sidebar-link"
          to="/dashboard/profile"
          title="Profile"
        >
          {" "}
          <FaUserCircle className="icon" />{" "}
          <span className="link-text">Profile</span>{" "}
        </NavLink>
        <NavLink
          className="sidebar-link"
          to="/dashboard/support"
          title="Support"
        >
          {" "}
          <FaHeadset className="icon" />{" "}
          <span className="link-text">Support</span>{" "}
        </NavLink>

        {/* --- روابط البائع --- */}
        {userRole === "Vendor" && (
          <>
            <NavLink
              className="sidebar-link"
              to="/dashboard/comptes"
              title="My Accounts"
            >
              {" "}
              <FaImages className="icon" />{" "}
              <span className="link-text">My Accounts</span>{" "}
            </NavLink>
            {/* <NavLink className="sidebar-link" to="/dashboard/vendor/orders" title="My Orders"> <FaClipboardList className="icon" /> <span className="link-text">My Orders</span> </NavLink> */}
          </>
        )}

        {/* --- روابط الأدمن --- */}
        {userRole === "Admin" && (
          <>
            <NavLink
              className="sidebar-link"
              to="/dashboard/admin/products"
              title="Manage Products"
            >
              {" "}
              <FaTasks className="icon" />{" "}
              <span className="link-text">Products</span>{" "}
            </NavLink>
            <NavLink
              className="sidebar-link"
              to="/dashboard/admin/users"
              title="Manage Users"
            >
              {" "}
              <FaUsers className="icon" />{" "}
              <span className="link-text">Users</span>{" "}
            </NavLink>
            {/* <NavLink className="sidebar-link" to="/dashboard/admin/orders" title="Manage Orders"> <FaClipboardList className="icon" /> <span className="link-text">All Orders</span> </NavLink> */}
          </>
        )}

        {/* --- روابط المستخدم العادي --- */}
        {userRole === "User" && (
          <>
            {/* <NavLink className="sidebar-link" to="/dashboard/orders" title="My Orders"> <FaClipboardList className="icon" /> <span className="link-text">My Orders</span> </NavLink> */}
          </>
        )}
      </nav>
      {/* Logout Button (on larger screens) */}
      <div className="sidebar-footer">
        <button
          className="sidebar-link logout-button"
          onClick={handleLogout}
          title="Logout"
        >
          <FaSignOutAlt className="icon" />{" "}
          <span className="link-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

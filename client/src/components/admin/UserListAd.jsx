// src/components/admin/UserListAd.jsx
// *** نسخة كاملة ومصححة لتحذيرات useSelector - بدون اختصارات ***

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Table,
  Button,
  Modal,
  Form,
  Spinner,
  Alert,
  Badge,
  Image,
  Container,
  Row,
  Col,
  ListGroup,
  InputGroup,
  FloatingLabel,
  Card,
} from "react-bootstrap";
import {
  FaEye,
  FaUserLock,
  FaUserCheck,
  FaUserEdit,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUserTag,
  FaDollarSign,
  FaBalanceScale,
  FaHourglassHalf,
  FaPiggyBank,
  FaUniversity,
  FaSearch,
  FaUserCircle,
} from "react-icons/fa";
import {
  adminGetAllUsers,
  adminUpdateUserStatus,
  adminUpdateUserData,
} from "../../redux/actions/adminUserActions"; // تأكد من المسار الصحيح
import { getProfile } from "../../redux/actions/userAction";
import "./UserListAd.css"; // تأكد من المسار الصحيح

// --- تعريف الصور البديلة كثوابت خارج المكون ---
const FALLBACK_IMAGE_URL =
  'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14px" fill="%23ffffff">X</text></svg>';
const NO_IMAGE_URL =
  'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23eeeeee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14px" fill="%23aaaaaa">?</text></svg>';
// ----------------------------------------------------

// --- مكون مودال تفاصيل المستخدم ---
const UserDetailsModal = ({ show, onHide, user }) => {
  const formatCurrency = useCallback((amount, currencyCode = "TND") => {
    const num = Number(amount);
    if (isNaN(num)) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(num);
  }, []);

  const handleImageError = (e) => {
    if (e.target.src !== FALLBACK_IMAGE_URL) {
      e.target.onerror = null;
      e.target.src = FALLBACK_IMAGE_URL;
    }
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <Image
            src={user.avatarUrl || `https://i.pravatar.cc/40?u=${user.email}`}
            onError={handleImageError}
            roundedCircle
            width={40}
            height={40}
            className="me-2 bg-light"
          />
          User Details: {user.fullName}
          <Badge
            bg={user.blocked ? "danger" : "success"}
            className="ms-2 align-middle"
          >
            {user.blocked ? "Blocked" : "Active"}
          </Badge>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={6}>
            <h5 className="mb-3">User Information</h5>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <FaUserCircle className="me-2 text-primary" />{" "}
                <strong>ID:</strong>{" "}
                <code className="user-select-all">{user._id}</code>
              </ListGroup.Item>
              <ListGroup.Item>
                <FaEnvelope className="me-2 text-primary" />{" "}
                <strong>Email:</strong> {user.email}
              </ListGroup.Item>
              <ListGroup.Item>
                <FaPhone className="me-2 text-primary" />{" "}
                <strong>Phone:</strong> {user.phone || "N/A"}
              </ListGroup.Item>
              <ListGroup.Item>
                <FaMapMarkerAlt className="me-2 text-primary" />{" "}
                <strong>Address:</strong> {user.address || "N/A"}
              </ListGroup.Item>
              <ListGroup.Item>
                <FaUserTag className="me-2 text-primary" />{" "}
                <strong>Role:</strong> {user.userRole}
              </ListGroup.Item>
              <ListGroup.Item>
                <FaCalendarAlt className="me-2 text-primary" />{" "}
                <strong>Registered:</strong>{" "}
                {new Date(user.registerDate).toLocaleString()}
              </ListGroup.Item>
            </ListGroup>
          </Col>
          <Col md={6}>
            <h5 className="mt-3 mt-md-0 mb-3 text-center">Balances</h5>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between">
                <span>
                  <FaPiggyBank className="me-1 text-success" /> Principal:
                </span>{" "}
                <strong>{formatCurrency(user.balance)}</strong>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between">
                <span>
                  <FaUniversity className="me-1 text-info" /> Deposit:
                </span>{" "}
                <strong>{formatCurrency(user.depositBalance)}</strong>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between">
                <span>
                  <FaDollarSign className="me-1 text-danger" /> Withdrawal:
                </span>{" "}
                <strong>{formatCurrency(user.withdrawalBalance)}</strong>
              </ListGroup.Item>
              {(user.userRole === "Vendor" || user.userRole === "Admin") && (
                <>
                  <ListGroup.Item className="d-flex justify-content-between mt-2 border-top pt-2">
                    <span>
                      <FaBalanceScale className="me-1 text-success" /> Seller
                      Available:
                    </span>{" "}
                    <strong>
                      {formatCurrency(user.sellerAvailableBalance)}
                    </strong>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <span>
                      <FaHourglassHalf className="me-1 text-warning" /> Seller
                      On Hold:
                    </span>{" "}
                    <strong>{formatCurrency(user.sellerPendingBalance)}</strong>
                  </ListGroup.Item>
                </>
              )}
            </ListGroup>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// --- مودال تعديل بيانات المستخدم ---
const EditUserModal = ({ show, onHide, user, onSave }) => {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  // --- [!] Selector مفصول ---
  const loadingSpecificUser = useSelector(
    (state) => state.adminUserReducer?.loadingDataChange?.[user?._id] ?? false
  );
  // -------------------------

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phone: user.phone || "",
        address: user.address || "",
        balance: user.balance ?? 0,
        sellerAvailableBalance: user.sellerAvailableBalance ?? 0,
        sellerPendingBalance: user.sellerPendingBalance ?? 0,
        depositBalance: user.depositBalance ?? 0,
        withdrawalBalance: user.withdrawalBalance ?? 0,
      });
      setSaveError(null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const dataToSave = {
        ...formData,
        balance: Number(formData.balance) || 0,
        sellerAvailableBalance: Number(formData.sellerAvailableBalance) || 0,
        sellerPendingBalance: Number(formData.sellerPendingBalance) || 0,
        depositBalance: Number(formData.depositBalance) || 0,
        withdrawalBalance: Number(formData.withdrawalBalance) || 0,
      };
      if (typeof onSave === "function") {
        await onSave(user._id, dataToSave);
        onHide();
      } else {
        throw new Error("onSave handler is missing.");
      }
    } catch (error) {
      setSaveError(error?.message || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Edit User: {user.fullName}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {saveError && (
          <Alert
            variant="danger"
            onClose={() => setSaveError(null)}
            dismissible
          >
            {saveError}
          </Alert>
        )}
        <Form>
          <Row>
            <Col md={6}>
              <FloatingLabel
                controlId="editFullName"
                label="Full Name"
                className="mb-3"
              >
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName || ""}
                  onChange={handleInputChange}
                />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel
                controlId="editEmail"
                label="Email (Read Only)"
                className="mb-3"
              >
                <Form.Control
                  type="email"
                  value={user.email || ""}
                  readOnly
                  disabled
                />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel
                controlId="editPhone"
                label="Phone"
                className="mb-3"
              >
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel
                controlId="editAddress"
                label="Address"
                className="mb-3"
              >
                <Form.Control
                  type="text"
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                />
              </FloatingLabel>
            </Col>
            <hr className="my-3" />
            <h5 className="mb-3 text-center text-muted">
              Edit Balances (Use with caution!)
            </h5>
            <Col md={6}>
              <FloatingLabel
                controlId="editBalance"
                label="Principal Balance"
                className="mb-3"
              >
                <Form.Control
                  type="number"
                  step="0.01"
                  name="balance"
                  value={formData.balance ?? ""}
                  onChange={handleInputChange}
                />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel
                controlId="editDepositBalance"
                label="Deposit Balance"
                className="mb-3"
              >
                <Form.Control
                  type="number"
                  step="0.01"
                  name="depositBalance"
                  value={formData.depositBalance ?? ""}
                  onChange={handleInputChange}
                />
              </FloatingLabel>
            </Col>
            <Col md={6}>
              <FloatingLabel
                controlId="editWithdrawalBalance"
                label="Withdrawal Balance"
                className="mb-3"
              >
                <Form.Control
                  type="number"
                  step="0.01"
                  name="withdrawalBalance"
                  value={formData.withdrawalBalance ?? ""}
                  onChange={handleInputChange}
                />
              </FloatingLabel>
            </Col>
            {(user.userRole === "Vendor" || user.userRole === "Admin") && (
              <>
                <Col md={6}>
                  <FloatingLabel
                    controlId="editSellerAvailableBalance"
                    label="Seller Available"
                    className="mb-3"
                  >
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="sellerAvailableBalance"
                      value={formData.sellerAvailableBalance ?? ""}
                      onChange={handleInputChange}
                    />
                  </FloatingLabel>
                </Col>
                <Col md={6}>
                  <FloatingLabel
                    controlId="editSellerPendingBalance"
                    label="Seller On Hold"
                    className="mb-3"
                  >
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="sellerPendingBalance"
                      value={formData.sellerPendingBalance ?? ""}
                      onChange={handleInputChange}
                    />
                  </FloatingLabel>
                </Col>
              </>
            )}
          </Row>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loadingSpecificUser || isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loadingSpecificUser || isSaving}
        >
          {loadingSpecificUser || isSaving ? (
            <Spinner size="sm" animation="border" />
          ) : (
            "Save Changes"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// --- المكون الرئيسي لصفحة إدارة المستخدمين ---
const UserListAd = ({ search }) => {
  const dispatch = useDispatch();

  // --- [!] Selectors محسّنة ومفصولة ---
  const users = useSelector((state) => state.adminUserReducer?.users ?? []);
  const loading = useSelector(
    (state) => state.adminUserReducer?.loading ?? false
  );
  const error = useSelector((state) => state.adminUserReducer?.error ?? null);
  const loadingStatusChange = useSelector(
    (state) => state.adminUserReducer?.loadingStatusChange || {}
  );
  const loadingDataChange = useSelector(
    (state) => state.adminUserReducer?.loadingDataChange || {}
  );
  const currentUser = useSelector((state) => state.userReducer?.user);
  // ------------------------------------

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const currentSearch = search !== undefined ? search : "";

  useEffect(() => {
    dispatch(adminGetAllUsers());
  }, [dispatch]);

  // --- Handlers ---
  const handleShowDetails = useCallback((user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  }, []);
  const handleCloseDetails = useCallback(() => setShowDetailsModal(false), []);
  const handleShowEdit = useCallback((user) => {
    setSelectedUser(user);
    setShowEditUserModal(true);
  }, []);
  const handleCloseEdit = useCallback(() => setShowEditUserModal(false), []);
  const handleToggleBlock = useCallback(
    (userId, currentBlockedStatus) => {
      if (loadingStatusChange[userId]) return;
      const action = currentBlockedStatus ? "unblock" : "block";
      if (window.confirm(`Are you sure you want to ${action} this user?`)) {
        dispatch(adminUpdateUserStatus(userId, !currentBlockedStatus));
      }
    },
    [dispatch, loadingStatusChange]
  );
  const handleSaveUserChanges = useCallback(
    async (userId, updatedData) => {
      console.log("Attempting to save changes for user:", userId, updatedData);
      try {
        await dispatch(adminUpdateUserData(userId, updatedData));
        if (currentUser?._id === userId) {
          dispatch(getProfile());
        }
      } catch (error) {
        console.error("Error saving user (caught in component):", error);
        throw error; // Re-throw to allow modal to catch it
      }
    },
    [dispatch, currentUser?._id]
  );

  // الفلترة
  const filteredUsers = useMemo(() => {
    if (!currentSearch) return users;
    const searchTerm = currentSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(searchTerm) ||
        u.email?.toLowerCase().includes(searchTerm) ||
        u.userRole?.toLowerCase().includes(searchTerm)
    );
  }, [users, currentSearch]);

  // معالج خطأ الصورة للجدول
  const handleTableImageError = (e) => {
    if (e.target.src !== FALLBACK_IMAGE_URL) {
      e.target.onerror = null;
      e.target.src = FALLBACK_IMAGE_URL;
    }
  };

  return (
    <Container fluid className="user-list-admin py-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2 className="page-title mb-0">
            User Management{" "}
            <Badge bg="secondary" pill>
              {filteredUsers.length}
            </Badge>
          </h2>
        </Col>
      </Row>

      {loading && (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading users...</p>
        </div>
      )}
      {!loading && error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <Table striped hover responsive className="admin-user-table mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th style={{ width: "60px" }}>Avatar</th>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, index) => {
                    const isChangingStatus = loadingStatusChange[u._id];
                    const isChangingData = loadingDataChange[u._id];
                    return (
                      <tr key={u._id} className="align-middle">
                        <td>{index + 1}</td>
                        <td>
                          <Image
                            src={
                              u.avatarUrl ||
                              `https://i.pravatar.cc/30?u=${u.email}`
                            }
                            onError={handleTableImageError}
                            roundedCircle
                            width={30}
                            height={30}
                          />
                        </td>
                        <td>
                          <span className="fw-bold">{u.fullName}</span>
                          <br />
                          <span className="text-muted small">{u.email}</span>
                        </td>
                        <td>
                          <Badge
                            pill
                            bg={
                              u.userRole === "Admin"
                                ? "info"
                                : u.userRole === "Vendor"
                                ? "primary"
                                : "secondary"
                            }
                          >
                            {u.userRole}
                          </Badge>
                        </td>
                        <td>
                          <Badge pill bg={u.blocked ? "danger" : "success"}>
                            {u.blocked ? "Blocked" : "Active"}
                          </Badge>
                        </td>
                        <td>{new Date(u.registerDate).toLocaleDateString()}</td>
                        <td className="text-center action-cell-users">
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-1 action-btn"
                            onClick={() => handleShowDetails(u)}
                            title="View Details"
                            disabled={isChangingStatus || isChangingData}
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            className="me-1 action-btn"
                            onClick={() => handleShowEdit(u)}
                            title="Edit User"
                            disabled={isChangingStatus || isChangingData}
                          >
                            <FaUserEdit />
                          </Button>
                          <Button
                            variant={
                              u.blocked ? "outline-success" : "outline-danger"
                            }
                            size="sm"
                            className="action-btn"
                            onClick={() => handleToggleBlock(u._id, u.blocked)}
                            disabled={isChangingStatus || isChangingData}
                            title={u.blocked ? "Unblock User" : "Block User"}
                          >
                            {isChangingStatus ? (
                              <Spinner size="sm" animation="border" />
                            ) : u.blocked ? (
                              <FaUserCheck />
                            ) : (
                              <FaUserLock />
                            )}
                            {/* ملاحظة: isChangingData قد لا يكون مرتبطًا مباشرة بزر الحظر */}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
      <UserDetailsModal
        show={showDetailsModal}
        onHide={handleCloseDetails}
        user={selectedUser}
      />
      <EditUserModal
        show={showEditUserModal}
        onHide={handleCloseEdit}
        user={selectedUser}
        onSave={handleSaveUserChanges}
      />
    </Container>
  );
};
export default UserListAd;

// src/pages/UserProfilePage.jsx
// *** نسخة كاملة بتصميم مُحسّن واحترافي - بدون اختصارات ***

import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Image,
  Badge,
  ListGroup,
  Button,
} from "react-bootstrap"; // إضافة Button
import {
  FaUserCircle,
  FaCalendarAlt,
  FaTag,
  FaBoxOpen,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaStore,
} from "react-icons/fa";
import "./UserProfilePage.css"; // تأكد من وجود هذا الملف

// Default avatar SVG
const defaultAvatar =
  'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23cccccc"/><text x="50%" y="55%" fill="%23ffffff" font-size="50" font-family="sans-serif" text-anchor="middle">?</text></svg>';

// Helper function to format currency (يمكن نقلها لملف helpers)
const formatCurrencyInternal = (amount, currencyCode = "TND") => {
  const num = Number(amount);
  if (isNaN(num)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(num);
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // استخدام useCallback هنا لأنها مستخدمة في useEffect dependency array
  const fetchProfile = useCallback(async () => {
    if (
      !userId ||
      userId === "undefined" ||
      userId === "null" ||
      !/^[0-9a-fA-F]{24}$/.test(userId)
    ) {
      setError("Invalid or missing User ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`Fetching public profile for user ID: ${userId}`);
    const apiUrl = `/user/profile/${userId}`; // تأكد من المسار الصحيح

    try {
      const { data } = await axios.get(apiUrl);
      console.log("Profile data received:", data);
      // --- Simulate Rating Data (REMOVE WHEN BACKEND IS READY) ---
      if (data && !data.hasOwnProperty("positiveRatings")) {
        data.positiveRatings = Math.floor(Math.random() * 100);
      }
      if (data && !data.hasOwnProperty("negativeRatings")) {
        data.negativeRatings = Math.floor(Math.random() * 10);
      }
      // --- End Simulation ---
      setProfileData(data);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      const status = err.response?.status || "unknown";
      const errorMsgFromServer = err.response?.data?.msg;
      const genericMessage = `Could not load profile data. Please check the ID or try again later.`;
      setError(
        `Error: Request failed with status code ${status}. ${
          errorMsgFromServer || genericMessage
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [userId]); // الاعتماد على userId فقط

  useEffect(() => {
    fetchProfile(); // استدعاء الدالة من داخل useEffect
  }, [fetchProfile]); // الاعتماد على الدالة المعرفة بـ useCallback

  // --- Render loading state ---
  if (loading) {
    return (
      <Container className="text-center py-5 loading-placeholder">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2 text-muted">Loading Profile...</p>
      </Container>
    );
  }

  // --- Render error state ---
  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center shadow-sm">
          <Alert.Heading>Error Loading Profile</Alert.Heading>
          <p>{error}</p>
          <Button as={Link} to="/" variant="outline-danger" size="sm">
            Go Home
          </Button>
        </Alert>
      </Container>
    );
  }

  // --- Render profile data ---
  if (!profileData) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          Profile data unavailable.
        </Alert>
      </Container>
    );
  }

  // Calculate rating percentage
  const totalRatings =
    (profileData.positiveRatings ?? 0) + (profileData.negativeRatings ?? 0);
  const positivePercentage =
    totalRatings > 0
      ? Math.round(((profileData.positiveRatings ?? 0) / totalRatings) * 100)
      : 0;

  return (
    <Container className="user-profile-page py-4 py-md-5">
      <Row className="justify-content-center">
        <Col lg={10} xl={9}>
          <Card className="shadow-sm profile-card-main overflow-hidden">
            {/* Profile Header */}
            <Card.Header className="profile-header bg-light p-4 text-md-start text-center border-0">
              <Row className="align-items-center gy-3">
                <Col xs={12} md={2} className="text-center">
                  <Image
                    src={profileData.avatarUrl || defaultAvatar}
                    roundedCircle
                    className="profile-avatar"
                    alt={`${profileData.fullName}'s avatar`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultAvatar;
                    }} // Fallback for avatar load error
                  />
                </Col>
                <Col xs={12} md={10}>
                  <div className="d-flex flex-column flex-md-row align-items-center justify-content-between mb-2">
                    <h2 className="profile-name mb-1 mb-md-0 me-md-3">
                      {profileData.fullName}
                    </h2>
                    <Badge
                      pill
                      bg="info"
                      text="dark"
                      className="profile-role align-self-center align-self-md-auto"
                    >
                      <FaTag className="me-1" /> {profileData.role || "User"}
                    </Badge>
                  </div>
                  <p className="text-muted small mb-0">
                    <FaCalendarAlt size={14} className="me-1 opacity-75" />
                    Member since:{" "}
                    {new Date(profileData.memberSince).toLocaleDateString()}
                  </p>
                </Col>
              </Row>
            </Card.Header>

            {/* Profile Body */}
            <Card.Body className="p-4">
              <Row>
                {/* User Stats */}
                <Col md={6} className="mb-4 mb-md-0">
                  <h5 className="mb-3 section-sub-title">User Statistics</h5>
                  <ListGroup variant="flush" className="stats-list">
                    <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                      <span>
                        <FaBoxOpen className="me-2 text-primary icon" /> Active
                        Listings
                      </span>
                      <Badge bg="light" text="dark" className="stat-badge">
                        {profileData.approvedProducts ?? 0}
                      </Badge>
                    </ListGroup.Item>
                    {/* Uncomment and adjust when backend provides sold count */}
                    {/* <ListGroup.Item className="d-flex justify-content-between align-items-center px-0">
                                            <span><FaCheckCircle className="me-2 text-success icon" /> Products Sold</span>
                                            <Badge bg="light" text="dark" className="stat-badge">{profileData.soldProducts ?? 0}</Badge>
                                        </ListGroup.Item> */}
                  </ListGroup>
                </Col>

                {/* Seller Ratings */}
                <Col md={6}>
                  <h5 className="mb-3 section-sub-title">Seller Rating</h5>
                  {totalRatings > 0 ? (
                    <div className="rating-box text-center p-3 bg-light rounded border">
                      {" "}
                      {/* Added border */}
                      <div
                        className={`rating-percentage display-6 fw-bold mb-2 ${
                          positivePercentage >= 75
                            ? "text-success"
                            : positivePercentage >= 50
                            ? "text-warning"
                            : "text-danger"
                        }`}
                      >
                        {positivePercentage}%
                      </div>
                      <div className="rating-text small text-muted mb-2">
                        Positive Rating
                      </div>
                      <div className="d-flex justify-content-center small">
                        <span className="me-3 rating-count positive">
                          <FaThumbsUp className="me-1" />{" "}
                          {profileData.positiveRatings ?? 0}
                        </span>
                        <span className="rating-count negative">
                          <FaThumbsDown className="me-1" />{" "}
                          {profileData.negativeRatings ?? 0}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted p-3 bg-light rounded border">
                      {" "}
                      {/* Added border */}
                      <small>No ratings available yet for this user.</small>
                    </div>
                  )}
                </Col>
              </Row>

              {/* Placeholder for future user products section */}
              {/* <hr className="my-4"/>
                             <h5 className="mb-3 section-sub-title">Products from {profileData.fullName}</h5>
                             <p className="text-muted text-center"> User's products will be displayed here.</p>
                             <Row> ... Fetch and display products ... </Row> */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserProfilePage;

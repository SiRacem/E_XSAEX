import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Image,
  Badge,
} from "react-bootstrap"; // Import Image and Badge
import { getProfile } from "../../redux/actions/userAction"; // Adjust path
import './ProfileRedesigned.css';

// أيقونات اختيارية
import {
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaPiggyBank,
  FaUniversity,
  FaBalanceScale,
  FaHourglassHalf,
} from "react-icons/fa";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading, isAuth } = useSelector((state) => state.userReducer);

  useEffect(() => {
    if (isAuth && !user) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuth, user]);

  const formatCurrency = (amount, currencyCode = "TND") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading || !user) {
    return (
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <Spinner animation="border" variant="primary" /> {" "}
      </Container>
    );
  }

  return (
    <Container fluid className="profile-page-redesigned py-4">
      <Row className="justify-content-center">
        <Col xl={10}>
          <Card className="shadow-sm profile-card-main">
            <Card.Header className="profile-header bg-light p-4">
              <Row className="align-items-center">
                <Col xs={12} md={2}>
                  <Image
                    src={
                      user.avatarUrl ||
                      "https://bootdey.com/img/Content/avatar/avatar7.png"
                    } // Placeholder
                    roundedCircle
                    width={100}
                    height={100}
                    className="profile-avatar"
                  />
                </Col>
                <Col xs={12} md={10}>
                  <h2 className="profile-name mb-1">{user.fullName}</h2>
                  <p className="text-muted mb-1">{user.email}</p>
                  <p className="text-muted mb-2">
                    <FaMapMarkerAlt size={14} className="me-1 opacity-75" />
                    {user.address || "Address not set"}
                  </p>
                  <Badge
                    pill
                    bg={user.blocked ? "danger" : "success"}
                    className="profile-status"
                  >
                    {user.blocked ? (
                      <FaTimesCircle className="me-1" />
                    ) : (
                      <FaCheckCircle className="me-1" />
                    )}
                    {user.blocked ? "Blocked" : "Active"}
                  </Badge>
                </Col>
              </Row>
            </Card.Header>

            <Card.Body className="p-4">
              <h4 className="mb-4 section-title">Account Balances</h4>
              <Row className="g-3 text-center">
                {/* g-3 for gap */}
                <Col sm={6} lg={4}>
                  <div className="balance-info-box">
                    <FaPiggyBank size={28} className="text-primary mb-2 icon" />
                    <span className="label">Principal</span>
                    <span className="value">
                      {formatCurrency(user.balance)}
                    </span>
                  </div>
                </Col>
                <Col sm={6} lg={4}>
                  <div className="balance-info-box">
                    <FaUniversity size={28} className="text-info mb-2 icon" />
                    <span className="label">Deposit</span>
                    <span className="value">
                      {formatCurrency(user.depositBalance)}
                    </span>
                  </div>
                </Col>
                <Col sm={6} lg={4}>
                  <div className="balance-info-box">
                    <FaDollarSign size={28} className="text-danger mb-2 icon" />
                    <span className="label">Withdrawal</span>
                    <span className="value">
                      {formatCurrency(user.withdrawalBalance)}
                    </span>
                  </div>
                </Col>
                {/* Seller Balances */}
                {(user.userRole === "Vendor" || user.userRole === "Admin") && (
                  <>
                    <Col sm={6} lg={6}>
                      {/* Take half width on large screens */}
                      <div className="balance-info-box seller">
                        <FaBalanceScale
                          size={28}
                          className="text-success mb-2 icon"
                        />
                        <span className="label">Seller Available</span>
                        <span className="value">
                          {formatCurrency(user.sellerAvailableBalance)}
                        </span>
                      </div>
                    </Col>
                    <Col sm={6} lg={6}>
                      {/* Take half width on large screens */}
                      <div className="balance-info-box seller">
                        <FaHourglassHalf
                          size={28}
                          className="text-warning mb-2 icon"
                        />
                        <span className="label">Seller On Hold</span>
                        <span className="value">
                          {formatCurrency(user.sellerPendingBalance)}
                        </span>
                      </div>
                    </Col>
                  </>
                )}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;

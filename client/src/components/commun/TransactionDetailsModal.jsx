// src/components/commun/TransactionDetailsModal.jsx
// *** Complete Code for Transaction Details Modal ***

import React, { useCallback } from "react"; // Import useCallback if needed, otherwise just React
import { Modal, Button, Row, Col, Badge, ListGroup } from "react-bootstrap";
import {
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaHashtag,
  FaDollarSign,
  FaInfoCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom"; // To link to user profiles

// Helper function to format currency
const formatCurrencyInternal = (amount, currencyCode = "TND") => {
  const num = Number(amount);
  if (isNaN(num)) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(num);
};

const TransactionDetailsModal = ({
  show,
  onHide,
  transaction,
  currentUserId,
}) => {
  // Don't render if no transaction is selected
  if (!transaction) {
    return null;
  }

  // Determine transaction details based on type and relation to current user
  const isSender = transaction.sender?._id === currentUserId;
  const isReceiver = transaction.recipient?._id === currentUserId;
  const transactionType = transaction.type || "UNKNOWN"; // Default type
  let title = "Transaction Details";
  let icon = <FaExchangeAlt className="text-muted" />;
  let amountColor = "text-dark";
  let amountPrefix = "";
  let peerUser = null; // The other user involved
  let description = transaction.description || ""; // Use provided description or calculate default

  switch (transactionType) {
    case "TRANSFER":
      if (isSender) {
        title = "Funds Sent";
        icon = <FaArrowUp className="text-danger" />;
        amountColor = "text-danger";
        amountPrefix = "- ";
        peerUser = transaction.recipient;
        description =
          description ||
          `You sent funds to ${peerUser?.fullName || "another user"}.`;
      } else if (isReceiver) {
        title = "Funds Received";
        icon = <FaArrowDown className="text-success" />;
        amountColor = "text-success";
        amountPrefix = "+ ";
        peerUser = transaction.sender;
        description =
          description ||
          `You received funds from ${peerUser?.fullName || "another user"}.`;
      } else {
        // Case where current user is neither sender nor receiver (e.g., admin view)
        title = "Fund Transfer";
        icon = <FaExchangeAlt className="text-primary" />;
        description =
          description ||
          `Transfer from ${transaction.sender?.fullName || "?"} to ${
            transaction.recipient?.fullName || "?"
          }.`;
      }
      break;
    case "DEPOSIT":
      title = "Deposit";
      icon = <FaArrowDown className="text-success" />;
      amountColor = "text-success";
      amountPrefix = "+ ";
      description = description || "Funds deposited into your account.";
      break;
    case "WITHDRAWAL":
      title = "Withdrawal";
      icon = <FaArrowUp className="text-danger" />;
      amountColor = "text-danger";
      amountPrefix = "- ";
      description = description || "Funds withdrawn from your account.";
      break;
    // Add cases for PRODUCT_PURCHASE, PRODUCT_SALE etc. if needed
    // case 'PRODUCT_PURCHASE': ... break;
    // case 'PRODUCT_SALE': ... break;
    default:
      // Keep generic title for unknown or other types
      title = `Transaction (${transactionType})`;
      // You might assign a default icon or color based on amount sign if possible
      if (transaction.amount < 0) {
        // Example check (adjust based on your data)
        icon = <FaArrowUp className="text-warning" />;
        amountColor = "text-warning";
      } else {
        icon = <FaArrowDown className="text-info" />;
        amountColor = "text-info";
      }
      break;
  }

  // Fallback description if still empty
  if (!description) {
    description = "Details for this transaction type are not fully specified.";
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <span className="modal-icon-wrapper me-2">{icon}</span>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          {/* Left Side: Key Details */}
          <Col md={6} className="mb-3 mb-md-0">
            <h5 className="mb-3 text-muted fw-light">Summary</h5>
            <ListGroup variant="flush">
              <ListGroup.Item className="px-0 py-2">
                <Row>
                  <Col xs={4} sm={3} className="text-muted small">
                    Status:
                  </Col>
                  <Col xs={8} sm={9}>
                    <Badge
                      pill
                      bg={
                        transaction.status === "COMPLETED"
                          ? "success"
                          : transaction.status === "PENDING"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {transaction.status || "UNKNOWN"}
                    </Badge>
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item className="px-0 py-2">
                <Row>
                  <Col xs={4} sm={3} className="text-muted small">
                    Amount:
                  </Col>
                  <Col xs={8} sm={9} className={`fw-bold fs-5 ${amountColor}`}>
                    {amountPrefix}
                    {formatCurrencyInternal(
                      transaction.amount,
                      transaction.currency
                    )}
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item className="px-0 py-2">
                <Row>
                  <Col xs={4} sm={3} className="text-muted small">
                    Date:
                  </Col>
                  <Col xs={8} sm={9}>
                    {transaction.createdAt
                      ? new Date(transaction.createdAt).toLocaleString()
                      : "N/A"}
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item className="px-0 py-2">
                <Row>
                  <Col xs={4} sm={3} className="text-muted small">
                    ID:
                  </Col>
                  <Col xs={8} sm={9}>
                    <code className="small user-select-all">
                      {transaction._id || "N/A"}
                    </code>
                  </Col>
                </Row>
              </ListGroup.Item>
            </ListGroup>
          </Col>

          {/* Right Side: Parties Involved & Description */}
          <Col md={6}>
            <h5 className="mb-3 text-muted fw-light">Details</h5>
            <ListGroup variant="flush">
              {/* Conditionally render Sender */}
              {transaction.sender && (
                <ListGroup.Item className="px-0 py-2 d-flex align-items-center">
                  <FaArrowUp className="me-2 text-danger opacity-75 flex-shrink-0" />
                  <div className="w-100">
                    <span className="text-muted small d-block">Sender</span>
                    {isSender ? (
                      <strong>You</strong>
                    ) : transaction.sender._id ? (
                      <Link
                        to={`/profile/${transaction.sender._id}`}
                        onClick={onHide}
                        className="fw-medium text-decoration-none profile-link"
                      >
                        {transaction.sender.fullName || "Unknown User"}
                      </Link>
                    ) : (
                      <span>
                        {transaction.sender.fullName || "Unknown User"}
                      </span> // Display name if no ID
                    )}
                    {transaction.sender.email && (
                      <small className="d-block text-muted">
                        {transaction.sender.email}
                      </small>
                    )}
                  </div>
                </ListGroup.Item>
              )}
              {/* Conditionally render Recipient */}
              {transaction.recipient && (
                <ListGroup.Item className="px-0 py-2 d-flex align-items-center">
                  <FaArrowDown className="me-2 text-success opacity-75 flex-shrink-0" />
                  <div className="w-100">
                    <span className="text-muted small d-block">Recipient</span>
                    {isReceiver ? (
                      <strong>You</strong>
                    ) : transaction.recipient._id ? (
                      <Link
                        to={`/profile/${transaction.recipient._id}`}
                        onClick={onHide}
                        className="fw-medium text-decoration-none profile-link"
                      >
                        {transaction.recipient.fullName || "Unknown User"}
                      </Link>
                    ) : (
                      <span>
                        {transaction.recipient.fullName || "Unknown User"}
                      </span>
                    )}
                    {transaction.recipient.email && (
                      <small className="d-block text-muted">
                        {transaction.recipient.email}
                      </small>
                    )}
                  </div>
                </ListGroup.Item>
              )}
              {/* Description */}
              <ListGroup.Item className="px-0 py-2 d-flex align-items-start">
                <FaInfoCircle className="me-2 text-info opacity-75 flex-shrink-0 mt-1" />
                <div>
                  <span className="text-muted small d-block">Description</span>
                  {description}
                </div>
              </ListGroup.Item>
              {/* You could add relatedEntity details here if needed */}
              {/* {transaction.relatedEntity && transaction.relatedEntity.id && (
                                <ListGroup.Item className="px-0 py-2 d-flex align-items-start"> ... </ListGroup.Item>
                             )} */}
            </ListGroup>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TransactionDetailsModal;

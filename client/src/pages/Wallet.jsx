// src/pages/Wallet.jsx
// *** Complete version with Transaction Details Modal integration ***

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  InputGroup,
  Spinner,
  Alert,
  ListGroup,
  FloatingLabel,
  Tooltip,
  OverlayTrigger,
  Container,
} from "react-bootstrap";
import {
  FaArrowDown,
  FaArrowUp,
  FaPaperPlane,
  FaReceipt,
  FaCheckCircle,
  FaExclamationCircle,
  FaArrowRight,
  FaArrowLeft,
  FaSearch,
  FaWallet,
  FaUserCircle,
  FaBalanceScale,
  FaHourglassHalf,
  FaCopy,
  FaCheck,
} from "react-icons/fa"; // Removed unused icons if any
import axios from "axios";
import { getProfile } from "../redux/actions/userAction";
import { getTransactions } from "../redux/actions/transactionAction";
import { toast } from "react-toastify";
import TransactionDetailsModal from "../components/commun/TransactionDetailsModal"; // <-- Import the modal
import "../components/commun/TransactionDetailsModal.css"; // <-- Import the modal CSS
import "./Wallet.css"; // Ensure Wallet.css is imported

// Constants
const TND_TO_USD_RATE = 3.0;
const MIN_SEND_AMOUNT_TND = 6.0;
const fallbackImageUrl = "..."; // Keep original placeholders
const noImageUrl = "...";

const Wallet = () => {
  const dispatch = useDispatch();

  // --- Selectors ---
  const user = useSelector((state) => state.userReducer?.user);
  const userLoading = useSelector(
    (state) => state.userReducer?.loading ?? false
  );
  const transactions = useSelector(
    (state) => state.transactionReducer?.transactions ?? []
  );
  const transactionsLoading = useSelector(
    (state) => state.transactionReducer?.loading ?? false
  );
  const transactionsError = useSelector(
    (state) => state.transactionReducer?.error ?? null
  );

  // --- State ---
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientUser, setRecipientUser] = useState(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState(null);
  const [sendAmountTND, setSendAmountTND] = useState("");
  const [amountError, setAmountError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  // --- [!] State for Transaction Details Modal ---
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  // -------------------------------------------

  // --- Handlers ---
  const handleCloseSendModal = useCallback(() => {
    setShowSendModal(false);
    setTimeout(() => {
      setModalStep(1);
      setRecipientEmail("");
      setRecipientUser(null);
      setEmailCheckError(null);
      setSendAmountTND("");
      setAmountError(null);
      setSendError(null);
      setSendSuccess(null);
      setIsCheckingEmail(false);
      setIsSending(false);
    }, 300);
  }, []);

  const handleShowSendModal = useCallback(() => {
    setEmailCheckError(null);
    setAmountError(null);
    setSendError(null);
    setSendSuccess(null);
    setRecipientEmail("");
    setRecipientUser(null);
    setSendAmountTND("");
    setModalStep(1);
    setShowSendModal(true);
  }, []);

  const formatCurrency = useCallback((amount, currencyCode = "TND") => {
    const num = Number(amount);
    if (isNaN(num)) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(num);
  }, []);

  const handleCheckEmail = useCallback(async () => {
    if (!recipientEmail || !/\S+@\S+\.\S+/.test(recipientEmail)) {
      setEmailCheckError("Please enter a valid email address.");
      return;
    }
    setEmailCheckError(null);
    setIsCheckingEmail(true);
    setRecipientUser(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not found.");
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post(
        "/user/check-email",
        { email: recipientEmail },
        config
      ); // Adjust API path if needed
      if (data && data._id) {
        if (data._id === user?._id) {
          setEmailCheckError("Cannot send to yourself.");
          setRecipientUser(null);
        } else {
          setRecipientUser(data);
          setEmailCheckError(null);
        }
      } else {
        setEmailCheckError("User not found.");
        setRecipientUser(null);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setEmailCheckError("User with this email not found.");
      } else if (error.response && error.response.status === 401) {
        setEmailCheckError("Authorization error.");
      } else {
        setEmailCheckError("Error checking email.");
      }
      setRecipientUser(null);
    } finally {
      setIsCheckingEmail(false);
    }
  }, [recipientEmail, user?._id]);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setSendAmountTND(value);
      setAmountError(null);
      if (value !== "") {
        const amountNum = parseFloat(value);
        if (isNaN(amountNum)) return;
        if (amountNum < MIN_SEND_AMOUNT_TND) {
          setAmountError(`Min ${MIN_SEND_AMOUNT_TND} TND`);
        } else if (user && amountNum > user.balance) {
          setAmountError("Insufficient balance");
        }
      }
    }
  };

  const calculatedUSD = useMemo(() => {
    const amountNum = parseFloat(sendAmountTND);
    if (!isNaN(amountNum) && amountNum >= MIN_SEND_AMOUNT_TND) {
      return (amountNum / TND_TO_USD_RATE).toFixed(2);
    }
    return "0.00";
  }, [sendAmountTND]);

  const handleSendConfirm = useCallback(async () => {
    if (
      isSending ||
      !recipientUser ||
      !sendAmountTND ||
      amountError ||
      parseFloat(sendAmountTND) < MIN_SEND_AMOUNT_TND
    )
      return;
    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);
    try {
      const amountToSend = parseFloat(sendAmountTND);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authorization token not found.");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.post(
        "/wallet/send",
        {
          recipientId: recipientUser._id,
          amount: amountToSend,
          currency: "TND",
        },
        config
      ); // Adjust API path if needed
      setSendSuccess(data.msg || `Successfully sent funds!`);
      toast.success("Funds sent successfully!");
      dispatch(getProfile());
      dispatch(getTransactions());
      setTimeout(handleCloseSendModal, 2500);
    } catch (error) {
      const message =
        error.response?.data?.msg || error?.message || "Failed to send funds.";
      setSendError(message);
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  }, [
    dispatch,
    recipientUser,
    sendAmountTND,
    amountError,
    isSending,
    handleCloseSendModal,
    formatCurrency,
  ]);

  const goToNextStep = useCallback(() => {
    if (modalStep === 1 && recipientUser) setModalStep(2);
    if (
      modalStep === 2 &&
      !amountError &&
      parseFloat(sendAmountTND) >= MIN_SEND_AMOUNT_TND
    )
      setModalStep(3);
  }, [modalStep, recipientUser, amountError, sendAmountTND]);

  const goToPrevStep = useCallback(() => {
    if (modalStep === 3) setModalStep(2);
    if (modalStep === 2) {
      setModalStep(
        1
      ); /* setSendAmountTND(""); setAmountError(null); // Optional: clear amount on back */
    }
  }, [modalStep]);

  const handleShowReceiveModal = useCallback(() => {
    setIsCopied(false);
    setShowReceiveModal(true);
  }, []);
  const handleCloseReceiveModal = useCallback(
    () => setShowReceiveModal(false),
    []
  );
  const copyToClipboard = useCallback(() => {
    /* ... (copy logic) ... */
  }, [user?.email, isCopied]);

  // --- [!] Handlers for Transaction Details Modal ---
  const handleShowTransactionDetails = useCallback((transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  }, []);

  const handleCloseTransactionDetails = useCallback(() => {
    setShowTransactionModal(false);
    setSelectedTransaction(null);
  }, []);
  // --------------------------------------------------

  // --- useEffect for fetching transactions ---
  useEffect(() => {
    if (user?._id) {
      dispatch(getTransactions());
    }
  }, [dispatch, user?._id]);

  // --- Loading/Error checks ---
  if (userLoading && !user) {
    return (
      <Container
        fluid
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading Wallet...</span>
      </Container>
    );
  }
  if (!user) {
    return (
      <Container fluid className="py-4">
        <Alert variant="danger" className="text-center">
          Error: Could not load user data.
        </Alert>
      </Container>
    );
  }

  // --- Render ---
  return (
    <div className="wallet-page container-fluid py-4">
      <h2 className="page-title mb-4">My Wallet</h2>
      <Row className="g-4">
        {/* Left Column */}
        <Col lg={8}>
          {/* Action Buttons */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Button
                variant="success"
                className="action-button w-100 shadow-sm"
                disabled
              >
                <FaArrowDown className="me-1" /> Deposit
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button
                variant="danger"
                className="action-button w-100 shadow-sm"
                disabled
              >
                <FaArrowUp className="me-1" /> Withdraw
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button
                variant="primary"
                className="action-button w-100 shadow-sm"
                onClick={handleShowSendModal}
              >
                <FaPaperPlane className="me-1" /> Send
              </Button>
            </Col>
            <Col xs={6} md={3}>
              <Button
                variant="info"
                className="action-button w-100 shadow-sm"
                onClick={handleShowReceiveModal}
              >
                <FaReceipt className="me-1" /> Receive
              </Button>
            </Col>
          </Row>

          {/* Recent Transactions Card */}
          <Card className="shadow-sm mb-4 transaction-card">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-secondary">Recent Transactions</h5>
              {!transactionsLoading && !transactionsError && (
                <span className="text-muted small">
                  Showing {transactions.length}
                </span>
              )}
            </Card.Header>
            <Card.Body className="p-0">
              {" "}
              {/* Removed padding for flush list */}
              {transactionsLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading transactions...</p>
                </div>
              ) : transactionsError ? (
                <Alert variant="danger" className="text-center m-3">
                  Error fetching transactions: {transactionsError}
                </Alert>
              ) : transactions && transactions.length > 0 ? (
                <ListGroup variant="flush" className="transaction-list">
                  {transactions.map((tx) => {
                    const isSender = tx.sender?._id === user._id;
                    const peerUser = isSender ? tx.recipient : tx.sender;
                    return (
                      <ListGroup.Item
                        key={tx._id}
                        action
                        onClick={() => handleShowTransactionDetails(tx)}
                        className="transaction-item d-flex justify-content-between align-items-center px-3 py-3"
                      >
                        <div className="d-flex align-items-center">
                          <div
                            className={`transaction-icon me-3 ${
                              isSender ? "sent" : "received"
                            }`}
                          >
                            {isSender ? <FaArrowUp /> : <FaArrowDown />}
                          </div>
                          <div>
                            <div className="transaction-type-peer fw-bold">
                              {tx.type === "TRANSFER" && (
                                <>
                                  {isSender ? "Sent to" : "Received from"}{" "}
                                  {peerUser?.fullName || "Unknown User"}
                                </>
                              )}
                              {tx.type !== "TRANSFER" && tx.type}
                            </div>
                            <div className="transaction-date text-muted small mt-1">
                              {new Date(tx.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`transaction-amount fw-bold fs-6 ${
                            isSender ? "text-danger" : "text-success"
                          }`}
                        >
                          {isSender ? "-" : "+"}
                          {formatCurrency(tx.amount, tx.currency)}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
              ) : (
                <div
                  className="no-transactions-placeholder d-flex justify-content-center align-items-center flex-column text-center py-5"
                  style={{ minHeight: "200px" }}
                >
                  <FaReceipt size={40} className="text-light-emphasis mb-3" />
                  <h6 className="text-muted">No Transactions Yet</h6>
                  <p className="text-muted small mb-0">
                    Your transaction history will appear here.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column (Balance Cards) */}
        <Col lg={4}>
          <Row className="g-4">
            <Col xs={12}>
              <Card className="shadow-sm balance-card balance-card-principal text-white h-100">
                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Subtitle className="mb-1 text-white-75">
                        Principal Balance
                      </Card.Subtitle>
                      <Card.Title className="balance-amount display-5">
                        {formatCurrency(user.balance)}
                      </Card.Title>
                    </div>
                    <FaWallet size={30} className="card-icon-bg" />{" "}
                    {/* Added class for potential CSS targeting */}
                  </div>
                  <div className="d-flex align-items-center user-info-wallet mt-auto">
                    <FaUserCircle size={18} className="me-2" />
                    <span className="fw-light small">{user.fullName}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            {(user.userRole === "Vendor" || user.userRole === "Admin") && (
              <>
                <Col xs={12} sm={6} lg={12}>
                  <Card className="shadow-sm balance-card balance-card-seller text-white h-100">
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <Card.Subtitle className="mb-1 text-white-75">
                            Seller Available
                          </Card.Subtitle>
                          <Card.Title className="balance-amount fs-3">
                            {formatCurrency(user.sellerAvailableBalance)}
                          </Card.Title>
                        </div>
                        <FaBalanceScale size={26} className="card-icon-bg" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={12} sm={6} lg={12}>
                  <Card className="shadow-sm balance-card balance-card-hold text-white h-100">
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <Card.Subtitle className="mb-1 text-white-75">
                            On Hold
                          </Card.Subtitle>
                          <Card.Title className="balance-amount fs-3">
                            {formatCurrency(user.sellerPendingBalance)}
                          </Card.Title>
                        </div>
                        <FaHourglassHalf size={24} className="card-icon-bg" />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </Col>
      </Row>

      {/* Send Balance Modal */}
      <Modal
        show={showSendModal}
        onHide={handleCloseSendModal}
        centered
        backdrop="static"
        className="send-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalStep === 1 && "Send Funds - Step 1: Recipient"}
            {modalStep === 2 && "Send Funds - Step 2: Amount"}
            {modalStep === 3 && "Send Funds - Step 3: Confirm"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Step 1: Enter Email */}
          {modalStep === 1 && (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckEmail();
              }}
            >
              <Form.Group controlId="recipientEmailInput" className="mb-3">
                <FloatingLabel
                  controlId="recipientEmailFloat"
                  label="Recipient's Email Address"
                >
                  <Form.Control
                    type="email"
                    placeholder="name@example.com"
                    value={recipientEmail}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      setRecipientUser(null);
                      setEmailCheckError(null);
                    }}
                    required
                    isInvalid={!!emailCheckError}
                    isValid={!!recipientUser && !emailCheckError}
                    autoFocus
                  />
                </FloatingLabel>
                <Form.Text
                  className={`d-block mt-1 ms-1 ${
                    emailCheckError ? "text-danger" : "text-success"
                  }`}
                >
                  {isCheckingEmail ? (
                    <Spinner
                      animation="border"
                      size="sm"
                      as="span"
                      role="status"
                      aria-hidden="true"
                      className="me-1"
                    />
                  ) : emailCheckError ? (
                    <>
                      <FaExclamationCircle className="me-1" /> {emailCheckError}
                    </>
                  ) : recipientUser ? (
                    <>
                      <FaCheckCircle className="me-1" />{" "}
                      {recipientUser.fullName}
                    </>
                  ) : (
                    <>​</> /* Zero-width space for spacing */
                  )}
                </Form.Text>
              </Form.Group>
              <Button
                variant="secondary"
                onClick={handleCheckEmail}
                disabled={isCheckingEmail || !recipientEmail}
                className="w-100 check-email-btn"
              >
                {isCheckingEmail ? (
                  "Checking..."
                ) : (
                  <>
                    <FaSearch className="me-1" /> Check Email
                  </>
                )}
              </Button>
            </Form>
          )}
          {/* Step 2: Enter Amount */}
          {modalStep === 2 && recipientUser && (
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                goToNextStep();
              }}
            >
              <Alert
                variant="light"
                className="text-center mb-3 recipient-info"
              >
                Sending to: <strong>{recipientUser.fullName}</strong> (
                {recipientUser.email})
              </Alert>
              <Form.Group className="mb-3">
                <Form.Label>Available Balance</Form.Label>
                <Form.Control
                  type="text"
                  value={formatCurrency(user.balance)}
                  readOnly
                  disabled
                />
              </Form.Group>
              <Form.Group controlId="sendAmountInput">
                <FloatingLabel
                  controlId="sendAmountFloat"
                  label={`Amount (Min ${formatCurrency(MIN_SEND_AMOUNT_TND)})`}
                  className="mb-1"
                >
                  <InputGroup>
                    <Form.Control
                      type="number"
                      placeholder="0.00"
                      value={sendAmountTND}
                      onChange={handleAmountChange}
                      required
                      min={MIN_SEND_AMOUNT_TND}
                      step="0.01"
                      isInvalid={!!amountError}
                      autoFocus
                    />
                    <InputGroup.Text>TND</InputGroup.Text>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid">
                    {amountError}
                  </Form.Control.Feedback>
                </FloatingLabel>
                <Form.Text className="text-muted d-block text-end">
                  ~ {formatCurrency(calculatedUSD, "USD")}
                </Form.Text>
              </Form.Group>
            </Form>
          )}
          {/* Step 3: Confirmation */}
          {modalStep === 3 && recipientUser && (
            <div className="confirmation-details">
              <h5 className="text-center mb-3">Confirm Transaction:</h5>
              {sendError && <Alert variant="danger">{sendError}</Alert>}
              {sendSuccess && <Alert variant="success">{sendSuccess}</Alert>}
              <ListGroup variant="flush" className="mb-3">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>To:</span>
                  <strong>
                    {recipientUser.fullName} ({recipientUser.email})
                  </strong>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Amount (TND):</span>
                  <strong>{formatCurrency(sendAmountTND)}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Approx. USD:</span>
                  <strong>~ {formatCurrency(calculatedUSD, "USD")}</strong>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between total-amount pt-3 mt-2 border-top">
                  <span>Total Deducted:</span>
                  <strong className="fs-5 text-danger">
                    {formatCurrency(sendAmountTND)}
                  </strong>
                </ListGroup.Item>
              </ListGroup>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          {modalStep > 1 && (
            <Button
              variant="outline-secondary"
              onClick={goToPrevStep}
              disabled={isSending}
            >
              <FaArrowLeft className="me-1" /> Back
            </Button>
          )}
          {(modalStep === 1 || (modalStep === 3 && !sendSuccess)) && (
            <Button
              variant="secondary"
              onClick={handleCloseSendModal}
              disabled={isSending}
            >
              Close
            </Button>
          )}
          {modalStep === 1 && (
            <Button
              variant="primary"
              onClick={goToNextStep}
              disabled={!recipientUser || isCheckingEmail}
            >
              Next <FaArrowRight className="ms-1" />
            </Button>
          )}
          {modalStep === 2 && (
            <Button
              variant="primary"
              onClick={goToNextStep}
              disabled={
                !!amountError ||
                !sendAmountTND ||
                parseFloat(sendAmountTND) < MIN_SEND_AMOUNT_TND
              }
            >
              Next <FaArrowRight className="ms-1" />
            </Button>
          )}
          {modalStep === 3 && (
            <Button
              variant="success"
              onClick={handleSendConfirm}
              disabled={isSending || !!sendSuccess}
            >
              {isSending ? (
                <>
                  <Spinner size="sm" animation="border" /> Sending...
                </>
              ) : (
                "Confirm & Send"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Receive Modal */}
      <Modal show={showReceiveModal} onHide={handleCloseReceiveModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaReceipt className="me-2" /> Receive Funds
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="mb-3">Share your email address with the sender:</p>
          <InputGroup className="mb-3 receive-email-group">
            <Form.Control
              type="email"
              value={user.email}
              readOnly
              className="receive-email-input"
              aria-label="Your email address"
            />
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="copy-tooltip">
                  {isCopied ? "Copied!" : "Copy Email"}
                </Tooltip>
              }
            >
              <span className="d-inline-block">
                <Button
                  variant={isCopied ? "success" : "outline-secondary"}
                  onClick={copyToClipboard}
                  className="copy-button"
                  disabled={isCopied}
                  style={isCopied ? { pointerEvents: "none" } : {}}
                >
                  {isCopied ? <FaCheck /> : <FaCopy />}
                </Button>
              </span>
            </OverlayTrigger>
          </InputGroup>
          <p className="text-muted small">
            Registered users can send funds to this email.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseReceiveModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* --- [!] Render Transaction Details Modal --- */}
      <TransactionDetailsModal
        show={showTransactionModal}
        onHide={handleCloseTransactionDetails}
        transaction={selectedTransaction}
        currentUserId={user?._id}
      />
      {/* ----------------------------------------- */}
    </div>
  );
};

export default Wallet;

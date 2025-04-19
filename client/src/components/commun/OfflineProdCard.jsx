// src/components/commun/OfflineProdCard.jsx
// *** نسخة كاملة ومصححة للتحديث الفوري للإعجاب - بدون اختصارات ***

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Button,
  Card,
  Modal,
  Image,
  Badge,
  Spinner,
  Form,
  InputGroup,
  FloatingLabel,
  OverlayTrigger,
  Tooltip,
  ListGroup,
  Alert,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  FaHeart,
  FaRegHeart,
  FaGavel,
  FaCheck,
  FaCopy,
  FaInfoCircle,
  FaExclamationTriangle,
  FaWallet,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import { BsCartPlus, BsImage } from "react-icons/bs";
import Carousel from "react-bootstrap/Carousel";
import { addToCart } from "../../redux/actions/shopCartActions"; // تأكد من المسار
import {
  toggleLikeProduct,
  placeBid,
  clearProductError,
} from "../../redux/actions/productAction"; // Actions جديدة
import { getProfile } from "../../redux/actions/userAction"; // لتحديث البروفايل بعد المزايدة
import { toast } from "react-toastify";
import "./OfflineProdCard.css"; // تأكد من وجود الأنماط الجديدة هنا

// --- Constants ---
const TND_TO_USD_RATE = 3.0;
const MINIMUM_BALANCE_TO_PARTICIPATE_BID = 6.0;

// --- Placeholder Images ---
const fallbackImageUrl =
  'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14px" fill="%236c757d">Error</text></svg>';
const noImageUrl =
  'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f8f9fa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14px" fill="%23adb5bd">No Image</text></svg>';

const OfflineProdCard = ({ el: product }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- Selectors ---
  const isAuth = useSelector((state) => state.userReducer?.isAuth ?? false);
  const loggedInUser = useSelector((state) => state.userReducer?.user);
  const cartLoading = useSelector(
    (state) => state.cartReducer?.cartLoading ?? false
  );
  const isLiking = useSelector(
    (state) => state.productReducer?.productLiking?.[product?._id] ?? false
  );
  const isLoadingOther = useSelector(
    (state) => state.productReducer?.productLoading?.[product?._id] ?? false
  );
  const error = useSelector(
    (state) => state.productReducer?.productErrors?.[product?._id] ?? null
  );

  // --- State ---
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidAmountError, setBidAmountError] = useState(null);

  // --- حالة الإعجاب والعدد المحلية (محسوبة + useEffect للمزامنة) ---
  // استخدام useMemo لتهيئة الحالة الأولية بشكل صحيح
  const initialLikedState = useMemo(
    () =>
      product?.likes?.some((id) => String(id) === loggedInUser?._id) ?? false,
    [product?.likes, loggedInUser?._id]
  );
  const initialLikeCount = useMemo(
    () => product?.likes?.length ?? 0,
    [product?.likes]
  );

  const [isLiked, setIsLiked] = useState(initialLikedState);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  // --- Derived State & Variables ---
  const sellerId = product?.user?._id || product?.user;
  const isOwner = isAuth && loggedInUser?._id === sellerId;
  const isOutOfStock = product?.quantity <= 0;
  const images =
    Array.isArray(product?.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls
      : [noImageUrl];
  const highestBid =
    product?.bids?.reduce((max, bid) => (bid.amount > max.amount ? bid : max), {
      amount: 0,
    }) || null;

  // --- Effects ---
  // [!] useEffect للمزامنة مع Redux (يعمل عند تغير المصدر الأساسي)
  useEffect(() => {
    // حساب القيم من الـ props/redux state
    const likedFromRedux =
      product?.likes?.some((id) => String(id) === loggedInUser?._id) ?? false;
    const countFromRedux = product?.likes?.length ?? 0;
    // تحديث الحالة المحلية فقط إذا اختلفت القيم بالفعل
    setIsLiked(likedFromRedux);
    setLikeCount(countFromRedux);
    // لا تعتمد على isLiked أو likeCount المحليين هنا
  }, [product?.likes, loggedInUser?._id]); // يعتمد فقط على البيانات من Redux/props

  // معالج الأخطاء العامة للمنتج
  useEffect(() => {
    if (error && !isLoadingOther && !isLiking) {
      toast.error(`${error}`);
      const timer = setTimeout(
        () => dispatch(clearProductError(product._id)),
        5000
      );
      return () => clearTimeout(timer);
    }
  }, [error, isLoadingOther, isLiking, dispatch, product?._id]);

  // --- Handlers ---
  const handleShowImageModal = (index = 0) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };
  const handleCloseImageModal = () => setShowImageModal(false);

  const handleShowBidModal = (e) => {
    e.stopPropagation();
    if (!isAuth) {
      toast.info("Please login to place a bid.");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (
      !loggedInUser ||
      loggedInUser.balance < MINIMUM_BALANCE_TO_PARTICIPATE_BID
    ) {
      toast.warn(
        <div>
          You need at least {formatCurrency(MINIMUM_BALANCE_TO_PARTICIPATE_BID)}{" "}
          in your balance to bid.{" "}
          <Button
            as={Link}
            to="/dashboard/wallet"
            variant="link"
            size="sm"
            className="p-0 ms-2"
          >
            Add Funds?
          </Button>
        </div>,
        { autoClose: 5000 }
      );
      return;
    }
    setBidAmount("");
    setBidAmountError(null);
    setShowBidModal(true);
  };
  const handleCloseBidModal = () => setShowBidModal(false);

  // --- [!] معالج الإعجاب بالتحديث المتفائل ---
  const handleLikeToggle = (e) => {
    e.stopPropagation();
    if (!isAuth || !loggedInUser) {
      toast.info("Please login to like products.");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (isLiking) return; // منع النقر المتعدد

    // حفظ الحالة السابقة للإعادة عند الفشل
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    // 1. التحديث البصري الفوري (Optimistic)
    const newState = !previousIsLiked;
    const newCount = newState
      ? previousLikeCount + 1
      : Math.max(0, previousLikeCount - 1);
    setIsLiked(newState);
    setLikeCount(newCount);

    // 2. إرسال الطلب
    // تأكد من أن الـ action يمرر userId (تم التعديل في الرد السابق)
    dispatch(toggleLikeProduct(product._id)) // افترض أن action يحصل على userId من getState
      .catch((error) => {
        // 3. إعادة الحالة عند الفشل
        console.error("Failed to toggle like, reverting UI.", error);
        toast.error("Could not update like status.");
        setIsLiked(previousIsLiked);
        setLikeCount(previousLikeCount);
      });
  };
  // ----------------------------------------------

  const handleBidAmountChange = (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
      setBidAmount(value);
      setBidAmountError(null);
      if (value !== "") {
        const amountNum = parseFloat(value);
        if (isNaN(amountNum) || amountNum <= 0) {
          setBidAmountError("Amount must be positive.");
        } else if (loggedInUser && amountNum > loggedInUser.balance) {
          setBidAmountError("Insufficient balance for this bid.");
        }
      } else {
        setBidAmountError("Please enter a bid amount.");
      }
    }
  };

  const handleConfirmBid = async () => {
    const amountNum = parseFloat(bidAmount);
    let currentError = null;
    if (!bidAmount || isNaN(amountNum) || amountNum <= 0) {
      currentError = "Please enter a valid positive amount.";
    } else if (!loggedInUser || loggedInUser.balance < amountNum) {
      currentError = "Insufficient balance.";
    } else if (
      !loggedInUser ||
      loggedInUser.balance < MINIMUM_BALANCE_TO_PARTICIPATE_BID
    ) {
      currentError = `Minimum balance of ${formatCurrency(
        MINIMUM_BALANCE_TO_PARTICIPATE_BID
      )} required.`;
    }
    // لا يوجد تحقق من أعلى مزايدة هنا

    if (currentError) {
      setBidAmountError(currentError);
      return;
    }

    try {
      await dispatch(placeBid(product._id, amountNum));
      toast.success("Bid placed successfully!");
      handleCloseBidModal();
      setTimeout(() => dispatch(getProfile()), 1000);
    } catch (caughtError) {
      setBidAmountError(
        caughtError.message || "An unknown error occurred placing bid."
      );
      console.error("Failed to place bid:", caughtError);
    }
  };

  const formatCurrency = useCallback((amount, currencyCode = "TND") => {
    const num = Number(amount);
    if (isNaN(num)) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(num);
  }, []);

  const handleImageError = useCallback(
    (e) => {
      if (e.target.src !== fallbackImageUrl) {
        e.target.onerror = null;
        e.target.src = fallbackImageUrl;
      }
    },
    [fallbackImageUrl]
  );

  const handleAddToCart = useCallback(() => {
    if (!isAuth) {
      toast.info("Please login to add items to your cart.");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (isOwner) {
      toast.warn("You cannot add your own product to the cart.");
      return;
    }
    if (!isOutOfStock && product?._id && !cartLoading) {
      dispatch(addToCart(product._id, 1));
    }
  }, [
    dispatch,
    product?._id,
    cartLoading,
    isOutOfStock,
    isOwner,
    isAuth,
    navigate,
  ]);

  const calculateUSD = (amountTND) => {
    if (!amountTND || isNaN(Number(amountTND))) return "0.00";
    return (Number(amountTND) / TND_TO_USD_RATE).toFixed(2);
  };

  // --- Render Guard ---
  if (
    !product ||
    !product._id ||
    !product.title ||
    product.price == null ||
    !sellerId
  ) {
    return (
      <Card className="product-card-v3 border-danger shadow-sm h-100 w-100 overflow-hidden d-flex flex-column align-items-center justify-content-center text-center p-3">
        <FaExclamationTriangle className="text-danger mb-2" size={30} />
        <small className="text-danger">Product data unavailable</small>
      </Card>
    );
  }

  // --- العرض ---
  return (
    <>
      <Card className="product-card-v3 border-0 shadow-sm h-100 w-100 overflow-hidden d-flex flex-column">
        {/* Image Area */}
        <div className="product-img-wrapper position-relative">
          <Carousel
            interval={null}
            indicators={images.length > 1}
            controls={images.length > 1}
            fade={false}
          >
            {images.map((imgUrl, index) => (
              <Carousel.Item key={index} className="product-carousel-item">
                <Image
                  src={imgUrl || noImageUrl}
                  className="product-img"
                  alt={`${product.title} - image ${index + 1}`}
                  onError={handleImageError}
                  fluid
                />
              </Carousel.Item>
            ))}
          </Carousel>
          <Button
            variant="dark"
            onClick={() => handleShowImageModal(0)}
            className="view-gallery-btn"
          >
            <BsImage /> View Gallery
          </Button>
          {isOutOfStock && (
            <Badge bg="dark" text="light" className="stock-badge">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Card Body */}
        <Card.Body className="p-3 d-flex flex-column flex-grow-1">
          <Card.Title className="product-title mb-1" title={product.title}>
            {product.title}
          </Card.Title>
          <Card.Text className="product-seller small mb-2">
            Sold by:{" "}
            {sellerId ? (
              <Link
                to={`/profile/${sellerId}`}
                onClick={(e) => e.stopPropagation()}
                className="text-decoration-none fw-medium seller-link"
              >
                {product.user?.fullName || "Seller"}
              </Link>
            ) : (
              <span className="text-muted">Unknown Seller</span>
            )}
          </Card.Text>
          <div className="product-price-section mb-3">
            <div className="price-current fw-bold">
              {formatCurrency(product.price, product.currency)}
              {highestBid && (
                <span
                  className="text-success ms-2 highest-bid-info"
                  title={`Highest bid: ${formatCurrency(
                    highestBid.amount,
                    product.currency
                  )}`}
                >
                  {" "}
                  (<FaGavel size={12} />{" "}
                  {formatCurrency(highestBid.amount, product.currency)}){" "}
                </span>
              )}
            </div>
          </div>
          <div className="mt-auto d-flex justify-content-between align-items-center actions-row">
            <div className="d-flex align-items-center">
              {/* Like Button */}
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{isLiked ? "Unlike" : "Like"}</Tooltip>}
              >
                <Button
                  variant="link"
                  className={`action-btn like-btn ${isLiked ? "liked" : ""}`}
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                >
                  {isLiking ? (
                    <Spinner
                      animation="border"
                      size="sm"
                      variant={isLiked ? "danger" : "secondary"}
                    />
                  ) : isLiked ? (
                    <FaHeart />
                  ) : (
                    <FaRegHeart />
                  )}
                  <span className="action-count">{likeCount}</span>
                  {/* <-- استخدام العداد المحلي */}
                </Button>
              </OverlayTrigger>
              {/* Bidders Count */}
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Bidders</Tooltip>}
              >
                <span className="action-btn text-muted ms-2">
                  <FaUsers />
                  <span className="action-count">
                    {product.bids?.length ?? 0}
                  </span>
                </span>
              </OverlayTrigger>
            </div>
            <div className="d-flex">
              {/* Bid Button */}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    {isOwner
                      ? "Your item"
                      : isOutOfStock
                      ? "Out of stock"
                      : "Place a Bid"}
                  </Tooltip>
                }
              >
                <span className="d-inline-block me-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleShowBidModal}
                    disabled={isLoadingOther || isOwner || isOutOfStock}
                    className="action-btn bid-btn"
                    style={
                      isOwner || isOutOfStock ? { pointerEvents: "none" } : {}
                    }
                  >
                    <FaGavel /> Bid
                  </Button>
                </span>
              </OverlayTrigger>
              {/* Cart Button */}
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    {isOwner
                      ? "Your item"
                      : isOutOfStock
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </Tooltip>
                }
              >
                <span className="d-inline-block">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart();
                    }}
                    disabled={cartLoading || isOutOfStock || isOwner}
                    className="action-btn cart-btn"
                    style={
                      isOwner || isOutOfStock ? { pointerEvents: "none" } : {}
                    }
                  >
                    {cartLoading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <BsCartPlus size={18} />
                    )}
                  </Button>
                </span>
              </OverlayTrigger>
            </div>
          </div>
        </Card.Body>

        {/* Bids Footer */}
        {product.bids && product.bids.length > 0 && (
          <Card.Footer className="bg-light p-2 bids-footer">
            <div className="d-flex align-items-center justify-content-between">
              <small className="text-muted">Bids:</small>
              <ListGroup horizontal className="bids-list-horizontal ms-auto">
                {product.bids.slice(0, 4).map((bid, index) => {
                  const bidderId = bid?.user?._id || bid?.user;
                  const uniqueBidKey = `${bidderId || "unknown"}-${
                    bid.amount
                  }-${index}`;
                  return (
                    <ListGroup.Item
                      key={uniqueBidKey}
                      className="bid-item p-0 border-0 bg-transparent"
                    >
                      {bidderId ? (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              {bid.user?.fullName || "Bidder"} -{" "}
                              {formatCurrency(bid.amount, bid.currency)}
                            </Tooltip>
                          }
                        >
                          <Link
                            to={`/profile/${bidderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-decoration-none"
                          >
                            <span
                              className="bidder-avatar"
                              title={bid.user?.fullName}
                            >
                              {bid.user?.fullName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || <FaUserCircle />}
                            </span>
                          </Link>
                        </OverlayTrigger>
                      ) : (
                        <OverlayTrigger
                          placement="top"
                          overlay={
                            <Tooltip>
                              Unknown Bidder -{" "}
                              {formatCurrency(bid.amount, bid.currency)}
                            </Tooltip>
                          }
                        >
                          {" "}
                          <span
                            className="bidder-avatar unknown-bidder"
                            title="Unknown Bidder"
                          >
                            ?
                          </span>{" "}
                        </OverlayTrigger>
                      )}
                    </ListGroup.Item>
                  );
                })}
                {product.bids.length > 4 && (
                  <ListGroup.Item className="bid-item p-0 border-0 bg-transparent text-muted small align-self-center ms-1 more-bids">
                    +{product.bids.length - 4}
                  </ListGroup.Item>
                )}
              </ListGroup>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Modals */}
      <Modal
        show={showImageModal}
        onHide={handleCloseImageModal}
        centered
        size="lg"
        dialogClassName="lightbox-modal"
      >
        <Modal.Body className="p-0 text-center bg-dark position-relative">
          {images.length > 0 ? (
            <Carousel
              activeIndex={currentImageIndex}
              onSelect={(selectedIndex) => setCurrentImageIndex(selectedIndex)}
              interval={null}
              indicators={images.length > 1}
            >
              {images.map((imgUrl, index) => (
                <Carousel.Item key={index}>
                  {" "}
                  <Image
                    src={imgUrl || fallbackImageUrl}
                    fluid
                    className="lightbox-image"
                    onError={handleImageError}
                    alt={`Product Image ${index + 1}`}
                  />{" "}
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <Alert variant="dark" className="m-5">
              Image not available.
            </Alert>
          )}
          <Button
            variant="light"
            onClick={handleCloseImageModal}
            className="position-absolute top-0 end-0 m-2 close-lightbox-btn"
            aria-label="Close"
          >
            ×
          </Button>
        </Modal.Body>
      </Modal>

      <Modal
        show={showBidModal}
        onHide={handleCloseBidModal}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          {" "}
          <Modal.Title>
            <FaGavel className="me-2" />
            Place Your Bid
          </Modal.Title>{" "}
        </Modal.Header>
        <Modal.Body>
          <Alert
            variant="secondary"
            className="d-flex align-items-center small p-2 mb-3"
          >
            <FaInfoCircle className="me-2 flex-shrink-0" size={20} />
            <div>
              <strong>{product.title}</strong>
              <br />
              <span className="text-muted">Base Price:</span>{" "}
              {formatCurrency(product.price, product.currency)}
              {highestBid && (
                <>
                  {" "}
                  <span className="text-muted ms-2">Highest Bid:</span>{" "}
                  {formatCurrency(highestBid.amount, product.currency)}{" "}
                </>
              )}
            </div>
          </Alert>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              handleConfirmBid();
            }}
          >
            <Form.Group controlId="bidAmountInput">
              <FloatingLabel
                controlId="bidAmountFloat"
                label={`Your Bid Amount (${product.currency})`}
                className="mb-1"
              >
                <InputGroup>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    value={bidAmount}
                    onChange={handleBidAmountChange}
                    required
                    min="0.01"
                    step="0.01"
                    isInvalid={!!bidAmountError}
                    autoFocus
                  />
                  <InputGroup.Text>{product.currency}</InputGroup.Text>
                </InputGroup>
                {bidAmountError && (
                  <small className="text-danger mt-1 d-block">
                    {bidAmountError}
                  </small>
                )}
              </FloatingLabel>
              <Form.Text className="text-muted d-block text-end mb-3">
                {product.currency === "TND" &&
                  `~ ${calculateUSD(bidAmount)} USD`}
                {product.currency === "USD" &&
                  `~ ${(Number(bidAmount || 0) * TND_TO_USD_RATE).toFixed(
                    2
                  )} TND`}
              </Form.Text>
            </Form.Group>
            <Alert
              variant="light"
              className="small p-2 mt-3 border d-flex align-items-center"
            >
              <FaWallet className="me-2 text-primary flex-shrink-0" />
              <div>
                Your current balance:{" "}
                <strong>{formatCurrency(loggedInUser?.balance, "TND")}</strong>.
                <span className="d-block text-muted">
                  (Min. {formatCurrency(MINIMUM_BALANCE_TO_PARTICIPATE_BID)}{" "}
                  required to bid)
                </span>
              </div>
            </Alert>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseBidModal}
            disabled={isLoadingOther || isLiking}
          >
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleConfirmBid}
            disabled={
              isLoadingOther ||
              isLiking ||
              !!bidAmountError ||
              !bidAmount ||
              parseFloat(bidAmount) <= 0
            }
          >
            {isLoadingOther ? (
              <>
                <Spinner size="sm" animation="border" /> Placing...
              </>
            ) : (
              "Confirm Bid"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default OfflineProdCard;

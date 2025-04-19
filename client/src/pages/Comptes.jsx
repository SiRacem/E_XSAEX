// src/pages/Comptes.jsx
// *** النسخة النهائية الكاملة المصححة والمحدثة ***

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Button,
  Row,
  Col,
  Card,
  Form,
  FloatingLabel,
  Alert,
  Spinner,
  Modal,
  Carousel,
  Image,
} from "react-bootstrap";
import {
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaEdit,
  FaRegTrashAlt,
  FaEye,
} from "react-icons/fa";
import axios from "axios"; // <-- استيراد axios لرفع الصور
import {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct,
} from "../redux/actions/productAction"; // تأكد من المسار الصحيح
import "./Comptes.css"; // تأكد من المسار الصحيح وأنماط المعاينة موجودة

// --- مكون بطاقة الحساب (محسن ومعالج خطأ الصور) ---
const AccountCard = React.memo(({ product, onDelete, onEdit }) => {
  // تعريف الصور البديلة مباشرة هنا أو تمريرها كـ props إذا أردت
  const fallbackImageUrl = useMemo(
    () =>
      'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14px" fill="%23ffffff">Error</text></svg>',
    []
  );
  const noImageUrl = useMemo(
    () =>
      'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23eeeeee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14px" fill="%23aaaaaa">No Image</text></svg>',
    []
  );

  // دالة تنسيق العملة (بدون useCallback هنا)
  const formatCurrency = (amount, currencyCode = "TND") => {
    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      return "N/A";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(numericAmount);
  };

  // معالج خطأ تحميل الصورة (بدون useCallback هنا)
  const handleImageError = (e) => {
    if (e.target.src !== fallbackImageUrl) {
      console.warn(
        `Image failed: ${e.target.currentSrc || e.target.src}. Using fallback.`
      );
      e.target.onerror = null; // مهم لمنع الحلقة
      e.target.src = fallbackImageUrl;
    }
  };

  // الدوال الممررة من الأب
  const triggerEdit = () => onEdit(product);
  const triggerDelete = () => onDelete(product?._id);

  if (!product || !product._id) {
    return null;
  } // حماية

  const images = Array.isArray(product.imageUrls) ? product.imageUrls : [];

  return (
    <Col md={6} lg={4} className="mb-4">
      <Card className={`shadow-sm h-100 status-${product.status || "unknown"}`}>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 card-title-truncate">
            {product.title || "Untitled"}
          </h5>
          <span>
            {" "}
            {/* Status Icons */}
            {product.status === "approved" && (
              <FaCheckCircle className="text-success" title="Approved" />
            )}
            {product.status === "pending" && (
              <FaHourglassHalf className="text-warning" title="Pending" />
            )}
            {product.status === "rejected" && (
              <FaTimesCircle className="text-danger" title="Rejected" />
            )}
          </span>
        </Card.Header>
        {/* Carousel */}
        {images.length > 0 ? (
          <Carousel
            interval={null}
            indicators={images.length > 1}
            controls={images.length > 1}
            className="account-card-carousel"
          >
            {images.map((url, index) => (
              <Carousel.Item key={`${product._id}-img-${index}`}>
                <img
                  className="d-block w-100 account-card-img"
                  src={url || noImageUrl} // استخدام البديل المحلي
                  alt={`${product.title || "Account"} - Slide ${index + 1}`}
                  onError={handleImageError} // <-- استخدام المعالج المحلي
                />
              </Carousel.Item>
            ))}
          </Carousel>
        ) : (
          <Card.Img
            variant="top"
            src={noImageUrl}
            className="account-card-img"
          />
        )}{" "}
        {/* استخدام البديل المحلي */}
        <Card.Body className="d-flex flex-column">
          <Card.Text className="text-muted small flex-grow-1 mb-2">
            {product.description || "No description"}
          </Card.Text>
          <p className="small mb-1">
            <strong>Link:</strong> {product.linkType || "N/A"}
          </p>
          <p className="fw-bold mb-0">
            {formatCurrency(product.price, product.currency)}
          </p>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end bg-light border-top-0 pt-2">
          <Button
            variant="outline-secondary"
            size="sm"
            className="me-2 action-btn"
            onClick={triggerEdit}
            title="Edit Account"
          >
            <FaEdit />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            className="action-btn"
            onClick={triggerDelete}
            title="Delete Account"
          >
            <FaTrash />
          </Button>
        </Card.Footer>
      </Card>
    </Col>
  );
}); // نهاية AccountCard

// --- المكون الرئيسي للصفحة ---
const Comptes = () => {
  // --- State ---
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editImageFiles, setEditImageFiles] = useState([]); // ملفات جديدة للتعديل
  const [editImagePreviews, setEditImagePreviews] = useState([]); // كل المعاينات للتعديل (جديدة وقديمة)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    linkType: "Konami ID ✅ Gmail ❌ Mail ❌",
    price: "",
    currency: "TND",
    quantity: 1,
  });
  const [imageFiles, setImageFiles] = useState([]); // ملفات الإضافة
  const [imagePreviews, setImagePreviews] = useState([]); // معاينات الإضافة
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageToShow, setImageToShow] = useState("");

  const CLOUD_NAME = "draghygoj"; // <-- !! تم التحديث من الصورة !!
  const UPLOAD_PRESET = "react_upload_images"; // <-- !! تم التحديث من الصورة !!
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  // --- *** --------------------------------------------- *** ---

  // --- الصور البديلة على مستوى المكون الرئيسي ---
  const fallbackImageUrl = useMemo(
    () =>
      'data:image/svg+xml;charset=UTF8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23cccccc"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14px" fill="%23ffffff">Error</text></svg>',
    []
  );
  // -----------------------------------------------------

  // --- Redux ---
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.userReducer);
  const {
    Products,
    loading: productsLoading,
    errors: productErrors,
  } = useSelector((state) => {
    const productState = state.productReducer || {
      Products: [],
      loading: false,
      errors: null,
    };
    return {
      Products: Array.isArray(productState.Products)
        ? productState.Products
        : [],
      loading: productState.loading ?? false,
      errors: productState.errors ?? null,
    };
  });

  // --- Effects ---
  useEffect(() => {
    if (user?._id) {
      dispatch(getProducts());
    }
  }, [dispatch, user?._id]);
  useEffect(() => {
    // Cleanup object URLs
    const urlsToRevoke = [...imagePreviews, ...editImagePreviews]
      .map((p) => p.url)
      .filter((url) => typeof url === "string" && url.startsWith("blob:"));
    // eslint-disable-next-line no-return-assign
    return () => {
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews, editImagePreviews]);

  // --- Filtering Products ---
  const userProducts = useMemo(
    () => Products.filter((p) => p?.user?._id === user?._id),
    [Products, user?._id]
  );
  const pendingProducts = useMemo(
    () => userProducts.filter((p) => p?.status === "pending"),
    [userProducts]
  );
  const approvedProducts = useMemo(
    () => userProducts.filter((p) => p?.status === "approved"),
    [userProducts]
  );
  const rejectedProducts = useMemo(
    () => userProducts.filter((p) => p?.status === "rejected"),
    [userProducts]
  );

  // --- *** دالة رفع الصور (مشتركة للإضافة والتعديل) *** ---
  const uploadImages = useCallback(
    async (filesToUpload) => {
      if (!filesToUpload || filesToUpload.length === 0) return [];
      console.log(`Uploading ${filesToUpload.length} images to Cloudinary...`);
      // استخدام map لإنشاء مصفوفة من الـ Promises
      const uploadPromises = filesToUpload.map((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);
        // إرجاع الـ Promise الخاص بطلب axios
        return axios
          .post(CLOUDINARY_URL, formData)
          .then((response) => {
            console.log(`Uploaded ${file.name}: ${response.data.secure_url}`);
            return response.data.secure_url; // إرجاع الرابط الآمن عند النجاح
          })
          .catch((uploadError) => {
            console.error(
              `Error uploading ${file.name}:`,
              uploadError.response?.data || uploadError.message
            );
            setFormError(
              `Failed to upload ${file.name}. ${
                uploadError.response?.data?.error?.message || ""
              }`
            );
            return null; // إرجاع null عند الفشل
          });
      });
      // انتظار جميع الـ Promises
      const results = await Promise.all(uploadPromises);
      // فلترة الـ nulls (الصور التي فشل رفعها)
      const successfulUrls = results.filter((url) => url !== null);
      console.log("Successfully uploaded URLs:", successfulUrls);
      return successfulUrls;
    },
    [CLOUDINARY_URL, UPLOAD_PRESET]
  ); // الاعتماديات
  // --- *** نهاية دالة الرفع *** ---

  // --- Add Form Handlers ---
  const handleInputChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);
  const handleImageChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      const uniqueNewFiles = files.filter(
        (file) =>
          !imageFiles.some((f) => f.name === file.name && f.size === file.size)
      );
      if (uniqueNewFiles.length === 0 && files.length > 0) {
        alert("One or more selected files are already added.");
        e.target.value = null;
        return;
      }
      setImageFiles((prev) => [...prev, ...uniqueNewFiles]);
      const newPreviews = uniqueNewFiles.map((file) => ({
        url: URL.createObjectURL(file),
        fileObject: file,
      }));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
      e.target.value = null;
    },
    [imageFiles]
  );
  const handleRemoveImagePreview = useCallback(
    (indexToRemove) => {
      if (window.confirm("Remove this image preview?")) {
        const removed = imagePreviews[indexToRemove];
        if (removed.url.startsWith("blob:")) URL.revokeObjectURL(removed.url);
        setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
        setImageFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
      }
    },
    [imagePreviews]
  ); // تم تحديث الاعتمادية

  const handleAddSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (imageFiles.length === 0) {
        setFormError("Please select at least one image.");
        return;
      }
      setFormError(null);
      setFormSuccess(null);
      setIsSubmittingAdd(true);

      try {
        // --- *** 1. رفع الصور المختارة (imageFiles) *** ---
        const uploadedImageUrls = await uploadImages(imageFiles);
        // ---------------------------------------------

        if (uploadedImageUrls.length === 0) {
          // التحقق إذا فشل رفع كل الصور
          throw new Error(
            "Image upload failed completely. Please check console/network tab for details."
          );
        }
        if (uploadedImageUrls.length < imageFiles.length) {
          setFormError(
            "Some images failed to upload. Only successfully uploaded images will be saved."
          );
          // استمر بالصور التي نجحت
        }

        // 2. تجهيز بيانات المنتج بالروابط الصحيحة
        const productData = {
          ...formData,
          imageUrls: uploadedImageUrls,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity, 10) || 1,
        };

        // 3. التحقق وإرسال للواجهة الخلفية
        if (
          !productData.title ||
          !productData.description ||
          !productData.linkType ||
          isNaN(productData.price) ||
          !productData.currency
        ) {
          throw new Error("Please fill all required fields correctly.");
        }
        console.log("Submitting Add Data:", productData);
        await dispatch(addProduct(productData));

        // 4. إعادة التعيين والنجاح
        setFormSuccess("Account submitted successfully! Pending approval.");
        setFormData({
          title: "",
          description: "",
          linkType: "Konami ID ✅ Gmail ❌ Mail ❌",
          price: "",
          currency: "TND",
          quantity: 1,
        });
        setImageFiles([]);
        setImagePreviews([]);
        setShowAddForm(false);
      } catch (error) {
        console.error("Error during Add submission:", error);
        // عرض الخطأ القادم من رفع الصور أو من Redux action
        setFormError(
          error?.message || productErrors || "Error submitting account."
        );
      } finally {
        setIsSubmittingAdd(false);
      }
    },
    [dispatch, formData, imageFiles, productErrors, uploadImages]
  ); // إضافة uploadImages وتحديث الاعتماديات

  // --- Edit Modal Handlers ---
  const handleEditClick = useCallback((product) => {
    if (!product || !product._id) {
      console.error("Invalid product data for edit");
      return;
    }
    setEditingProduct(product);
    setEditFormData({
      _id: product._id,
      title: product.title,
      description: product.description,
      linkType: product.linkType,
      price: product.price,
      currency: product.currency,
    });
    setEditImagePreviews(
      Array.isArray(product.imageUrls)
        ? product.imageUrls.map((url) => ({ url, isExisting: true }))
        : []
    );
    setEditImageFiles([]);
    setFormError(null);
    setShowEditModal(true);
  }, []);
  const handleEditModalClose = useCallback(() => {
    setShowEditModal(false);
    setEditingProduct(null);
    setEditImagePreviews([]);
    setEditImageFiles([]);
  }, []);
  const handleEditInputChange = useCallback((e) => {
    setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);
  const handleEditImageChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      const uniqueNewFiles = files.filter(
        (file) =>
          !editImageFiles.some(
            (f) => f.name === file.name && f.size === file.size
          ) &&
          !editImagePreviews.some(
            (p) =>
              p.fileObject?.name === file.name &&
              p.fileObject?.size === file.size
          )
      );
      if (uniqueNewFiles.length === 0 && files.length > 0) {
        alert("One or more selected files are already in the list.");
        e.target.value = null;
        return;
      }
      setEditImageFiles((prev) => [...prev, ...uniqueNewFiles]);
      const newPreviews = uniqueNewFiles.map((file) => ({
        url: URL.createObjectURL(file),
        fileObject: file,
        isNew: true,
      }));
      setEditImagePreviews((prev) => [
        ...prev.filter((p) => p.isExisting),
        ...newPreviews,
      ]); // عرض الموجود + الجديد
      e.target.value = null;
    },
    [editImageFiles, editImagePreviews]
  );
  const handleRemoveEditImagePreview = useCallback(
    (indexToRemove) => {
      if (window.confirm("Remove this image?")) {
        const previews = [...editImagePreviews];
        const removedPreview = previews.splice(indexToRemove, 1)[0];
        setEditImagePreviews(previews);
        if (removedPreview.isNew && removedPreview.url.startsWith("blob:")) {
          URL.revokeObjectURL(removedPreview.url);
        }
        if (removedPreview.isNew) {
          setEditImageFiles((prev) =>
            prev.filter((file) => file !== removedPreview.fileObject)
          );
        }
      }
    },
    [editImagePreviews]
  ); // تم تحديث الاعتمادية
  const handleEditSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError(null);
      setIsSubmittingEdit(true);

      try {
        // 1. الصور الموجودة المتبقية
        const keptExistingUrls = editImagePreviews
          .filter((p) => p.isExisting)
          .map((p) => p.url);

        // 2. رفع الصور الجديدة فقط (editImageFiles)
        let newlyUploadedUrls = [];
        if (editImageFiles.length > 0) {
          // --- *** رفع الصور الجديدة باستخدام دالة الرفع *** ---
          newlyUploadedUrls = await uploadImages(editImageFiles);
          if (newlyUploadedUrls.length !== editImageFiles.length) {
            console.warn("Some new images failed to upload during edit.");
            // يمكنك اختيار إيقاف العملية أو المتابعة
            if (
              newlyUploadedUrls.length === 0 &&
              keptExistingUrls.length === 0
            ) {
              throw new Error(
                "Image upload failed and no existing images kept."
              );
            }
            setFormError("Warning: Some new images failed to upload."); // عرض تحذير
          }
          // -----------------------------------------------
        }

        // 3. دمج الروابط النهائية
        const finalImageUrls = [...keptExistingUrls, ...newlyUploadedUrls];
        if (finalImageUrls.length === 0) {
          throw new Error("Product must have at least one image.");
        }

        // 4. تجهيز بيانات التحديث وإرسالها
        const price = parseFloat(editFormData.price);
        if (isNaN(price)) {
          throw new Error("Price must be a valid number.");
        }
        const updateData = {
          ...editFormData,
          imageUrls: finalImageUrls,
          price,
        };
        const { _id, ...dataToSend } = updateData;
        if (
          !_id ||
          !dataToSend.title ||
          !dataToSend.description ||
          !dataToSend.linkType ||
          !dataToSend.currency
        ) {
          throw new Error("Please fill all required fields for update.");
        }
        console.log("Submitting Update Data:", dataToSend);
        await dispatch(updateProduct(_id, dataToSend));
        handleEditModalClose();
      } catch (error) {
        console.error("Error during Update submission:", error);
        setFormError(
          error?.message || productErrors || "Failed to update account."
        );
      } finally {
        setIsSubmittingEdit(false);
      }
    },
    [
      dispatch,
      editingProduct,
      editFormData,
      editImageFiles,
      editImagePreviews,
      handleEditModalClose,
      productErrors,
      uploadImages,
    ]
  ); // إضافة uploadImages وتحديث الاعتماديات

  // --- Delete Handler ---
  const handleDelete = useCallback(
    (productId) => {
      if (!productId) return;
      if (window.confirm("Delete this account permanently?")) {
        dispatch(deleteProduct(productId));
      }
    },
    [dispatch]
  );

  // --- Image Modal Handlers ---
  const handleShowImageModal = useCallback((imageUrl) => {
    setImageToShow(imageUrl);
    setShowImageModal(true);
  }, []);
  const handleCloseImageModal = useCallback(() => setShowImageModal(false), []);

  // --- Toggle Add Form ---
  const toggleAddForm = useCallback(() => {
    const isOpening = !showAddForm;
    setShowAddForm(isOpening);
    setFormError(null);
    setFormSuccess(null);
    if (isOpening) {
      setFormData({
        title: "",
        description: "",
        linkType: "Konami ID ✅ Gmail ❌ Mail ❌",
        price: "",
        currency: "TND",
        quantity: 1,
      });
      setImageFiles([]);
      setImagePreviews([]);
    }
  }, [showAddForm]);

  // --- JSX ---
  return (
    <div className="comptes-page container-fluid py-4">
      {/* Header and Add Button */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <h2 className="page-title mb-0">My Accounts ({userProducts.length})</h2>
        <Button
          variant="primary"
          onClick={toggleAddForm}
          className="add-account-btn shadow-sm"
        >
          <FaPlus className="me-1" />{" "}
          {showAddForm ? "Cancel Add" : "Add Account"}
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="shadow-sm mb-4 add-form-card">
          <Card.Body>
            <h4 className="mb-3 text-center">Add New Account Details</h4>
            {formError && (
              <Alert
                variant="danger"
                onClose={() => setFormError(null)}
                dismissible
              >
                {formError}
              </Alert>
            )}
            {formSuccess && <Alert variant="success">{formSuccess}</Alert>}
            <Form onSubmit={handleAddSubmit}>
              <Row>
                {/* Title */}
                <Col md={6}>
                  {" "}
                  <FloatingLabel
                    controlId="titleInput"
                    label="Account Title"
                    className="mb-3"
                  >
                    {" "}
                    <Form.Control
                      type="text"
                      placeholder="."
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />{" "}
                  </FloatingLabel>{" "}
                </Col>
                {/* Images */}
                <Col md={6}>
                  {" "}
                  <Form.Group controlId="imageInput" className="mb-3">
                    {" "}
                    <Form.Label>Images</Form.Label>{" "}
                    <Form.Control
                      type="file"
                      multiple
                      onChange={handleImageChange}
                      accept="image/*"
                    />{" "}
                    <div className="image-preview-container large-preview mt-2">
                      {" "}
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={`add-preview-${index}`}
                          className="preview-item"
                        >
                          {" "}
                          <img
                            src={preview.url}
                            alt={`Preview ${index + 1}`}
                            className="preview-image-lg"
                          />{" "}
                          <Button
                            variant="outline-light"
                            size="sm"
                            className="view-preview-btn"
                            title="View Image"
                            onClick={() => handleShowImageModal(preview.url)}
                          >
                            <FaEye />
                          </Button>{" "}
                          <Button
                            variant="danger"
                            size="sm"
                            className="remove-preview-btn"
                            title="Remove Image"
                            onClick={() => handleRemoveImagePreview(index)}
                          >
                            <FaRegTrashAlt />
                          </Button>{" "}
                        </div>
                      ))}{" "}
                      {imagePreviews.length === 0 && (
                        <div className="text-muted p-3 fst-italic small">
                          Select one or more images.
                        </div>
                      )}{" "}
                    </div>{" "}
                  </Form.Group>{" "}
                </Col>
                {/* Description */}
                <Col md={12}>
                  {" "}
                  <FloatingLabel
                    controlId="descriptionInput"
                    label="Account Description"
                    className="mb-3"
                  >
                    {" "}
                    <Form.Control
                      as="textarea"
                      placeholder="."
                      style={{ height: "100px" }}
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                    />{" "}
                  </FloatingLabel>{" "}
                </Col>
                {/* Link Type */}
                <Col md={12}>
                  {" "}
                  <Form.Group className="mb-3">
                    {" "}
                    <Form.Label>Account Link Type</Form.Label>{" "}
                    {[
                      "Konami ID ✅ Gmail ❌ Mail ✅",
                      "Konami ID ✅ Gmail ❌ Mail ❌",
                      "Konami ID ✅ Gmail ✅ Mail ✅",
                      "Konami ID ✅ Gmail ✅ Mail ❌",
                      "Konami ID ❌ Gmail ✅ Mail ✅",
                      "Konami ID ❌ Gmail ✅ Mail ❌",
                    ].map((linkValue, idx) => (
                      <Form.Check
                        key={`add-link-${idx}`}
                        type="radio"
                        id={`link${idx + 1}`}
                        name="linkType"
                        label={linkValue}
                        value={linkValue}
                        checked={formData.linkType === linkValue}
                        onChange={handleInputChange}
                        required
                      />
                    ))}{" "}
                  </Form.Group>{" "}
                </Col>
                {/* Price & Currency */}
                <Col md={6}>
                  {" "}
                  <FloatingLabel
                    controlId="priceInput"
                    label="Price"
                    className="mb-3"
                  >
                    {" "}
                    <Form.Control
                      type="number"
                      placeholder="."
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                    />{" "}
                  </FloatingLabel>{" "}
                </Col>
                <Col md={6}>
                  {" "}
                  <FloatingLabel
                    controlId="currencyInput"
                    label="Currency"
                    className="mb-3"
                  >
                    {" "}
                    <Form.Select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      required
                    >
                      {" "}
                      <option value="TND">TND</option>
                      <option value="USD">USD</option>{" "}
                    </Form.Select>{" "}
                  </FloatingLabel>{" "}
                </Col>
              </Row>
              <Button
                type="submit"
                variant="success"
                className="w-100 mt-2"
                disabled={isSubmittingAdd}
              >
                {" "}
                {isSubmittingAdd ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" />{" "}
                    Submitting...
                  </>
                ) : (
                  "Submit Account"
                )}{" "}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      )}

      {/* Product Lists */}
      {productsLoading && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" /> Loading accounts...
        </div>
      )}
      {!productsLoading && productErrors && (
        <Alert variant="danger" className="text-center">
          {productErrors}
        </Alert>
      )}
      {!productsLoading && !productErrors && (
        <>
          {/* Pending */}
          <div className="account-section mb-4">
            <h4 className="section-title pending-title">
              Pending Approval ({pendingProducts.length})
            </h4>
            <Row className="g-4">
              {pendingProducts.length > 0 ? (
                pendingProducts.map((p) => (
                  <AccountCard
                    key={p._id}
                    product={p}
                    onDelete={handleDelete}
                    onEdit={handleEditClick}
                  />
                ))
              ) : (
                <Col>
                  <Alert variant="info" className="text-center py-2">
                    No accounts pending.
                  </Alert>
                </Col>
              )}
            </Row>
          </div>
          {/* Approved */}
          <div className="account-section mb-4">
            <h4 className="section-title approved-title">
              Approved Accounts ({approvedProducts.length})
            </h4>
            <Row className="g-4">
              {approvedProducts.length > 0 ? (
                approvedProducts.map((p) => (
                  <AccountCard
                    key={p._id}
                    product={p}
                    onDelete={handleDelete}
                    onEdit={handleEditClick}
                  />
                ))
              ) : (
                <Col>
                  <Alert variant="secondary" className="text-center py-2">
                    No approved accounts.
                  </Alert>
                </Col>
              )}
            </Row>
          </div>
          {/* Rejected */}
          <div className="account-section">
            <h4 className="section-title rejected-title">
              Rejected Accounts ({rejectedProducts.length})
            </h4>
            <Row className="g-4">
              {rejectedProducts.length > 0 ? (
                rejectedProducts.map((p) => (
                  <AccountCard
                    key={p._id}
                    product={p}
                    onDelete={handleDelete}
                    onEdit={handleEditClick}
                  />
                ))
              ) : (
                <Col>
                  <Alert
                    variant="light"
                    className="text-center text-muted py-2"
                  >
                    No rejected accounts.
                  </Alert>
                </Col>
              )}
            </Row>
          </div>
        </>
      )}

      {/* Edit Modal */}
      <Modal
        show={showEditModal}
        onHide={handleEditModalClose}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Account: {editingProduct?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && (
            <Alert
              variant="danger"
              onClose={() => setFormError(null)}
              dismissible
            >
              {formError}
            </Alert>
          )}
          <Form onSubmit={handleEditSubmit}>
            <Row>
              {/* Edit Title */}
              <Col md={6}>
                {" "}
                <FloatingLabel
                  controlId="editTitleInput"
                  label="Account Title"
                  className="mb-3"
                >
                  {" "}
                  <Form.Control
                    type="text"
                    placeholder="."
                    name="title"
                    value={editFormData.title || ""}
                    onChange={handleEditInputChange}
                    required
                  />{" "}
                </FloatingLabel>{" "}
              </Col>
              {/* Edit Images */}
              <Col md={6}>
                {" "}
                <Form.Group controlId="editImageInput" className="mb-3">
                  {" "}
                  <Form.Label>Images (Add new or remove)</Form.Label>{" "}
                  <Form.Control
                    type="file"
                    multiple
                    onChange={handleEditImageChange}
                    accept="image/*"
                  />{" "}
                  <div className="image-preview-container large-preview mt-2">
                    {" "}
                    {editImagePreviews.map((preview, index) => (
                      <div
                        key={
                          preview.isExisting
                            ? `existing-${index}`
                            : `new-${index}`
                        }
                        className="preview-item"
                      >
                        {" "}
                        <img
                          src={preview.url}
                          alt={`Preview ${index + 1}`}
                          className="preview-image-lg"
                          onError={(e) => (e.target.src = fallbackImageUrl)}
                        />{" "}
                        <Button
                          variant="outline-light"
                          size="sm"
                          className="view-preview-btn"
                          title="View Image"
                          onClick={() => handleShowImageModal(preview.url)}
                        >
                          <FaEye />
                        </Button>{" "}
                        <Button
                          variant="danger"
                          size="sm"
                          className="remove-preview-btn"
                          title="Remove Image"
                          onClick={() => handleRemoveEditImagePreview(index)}
                        >
                          <FaRegTrashAlt />
                        </Button>{" "}
                        {preview.isExisting && (
                          <span className="existing-badge">Current</span>
                        )}{" "}
                      </div>
                    ))}{" "}
                    {editImagePreviews.length === 0 && (
                      <div className="text-muted p-3 fst-italic small">
                        No images. Add at least one.
                      </div>
                    )}{" "}
                  </div>{" "}
                </Form.Group>{" "}
              </Col>
              {/* Edit Description */}
              <Col md={12}>
                {" "}
                <FloatingLabel
                  controlId="editDescriptionInput"
                  label="Account Description"
                  className="mb-3"
                >
                  {" "}
                  <Form.Control
                    as="textarea"
                    placeholder="."
                    style={{ height: "100px" }}
                    name="description"
                    value={editFormData.description || ""}
                    onChange={handleEditInputChange}
                    required
                  />{" "}
                </FloatingLabel>{" "}
              </Col>
              {/* Edit Link Type */}
              <Col md={12}>
                {" "}
                <Form.Group className="mb-3">
                  {" "}
                  <Form.Label>Account Link Type</Form.Label>{" "}
                  {[
                    "Konami ID ✅ Gmail ❌ Mail ✅",
                    "Konami ID ✅ Gmail ❌ Mail ❌",
                    "Konami ID ✅ Gmail ✅ Mail ✅",
                    "Konami ID ✅ Gmail ✅ Mail ❌",
                    "Konami ID ❌ Gmail ✅ Mail ✅",
                    "Konami ID ❌ Gmail ✅ Mail ❌",
                  ].map((linkValue, idx) => (
                    <Form.Check
                      key={`edit-link-${idx}`}
                      type="radio"
                      id={`editLink${idx + 1}`}
                      name="linkType"
                      label={linkValue}
                      value={linkValue}
                      checked={editFormData.linkType === linkValue}
                      onChange={handleEditInputChange}
                      required
                    />
                  ))}{" "}
                </Form.Group>{" "}
              </Col>
              {/* Edit Price & Currency */}
              <Col md={6}>
                {" "}
                <FloatingLabel
                  controlId="editPriceInput"
                  label="Price"
                  className="mb-3"
                >
                  {" "}
                  <Form.Control
                    type="number"
                    placeholder="."
                    name="price"
                    value={editFormData.price || ""}
                    onChange={handleEditInputChange}
                    required
                    min="0"
                    step="0.01"
                  />{" "}
                </FloatingLabel>{" "}
              </Col>
              <Col md={6}>
                {" "}
                <FloatingLabel
                  controlId="editCurrencyInput"
                  label="Currency"
                  className="mb-3"
                >
                  {" "}
                  <Form.Select
                    name="currency"
                    value={editFormData.currency || "TND"}
                    onChange={handleEditInputChange}
                    required
                  >
                    {" "}
                    <option value="TND">TND</option>
                    <option value="USD">USD</option>{" "}
                  </Form.Select>{" "}
                </FloatingLabel>{" "}
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-3 border-top pt-3">
              <Button
                variant="secondary"
                onClick={handleEditModalClose}
                className="me-2"
                disabled={isSubmittingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmittingEdit}
              >
                {" "}
                {isSubmittingEdit ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}{" "}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        show={showImageModal}
        onHide={handleCloseImageModal}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <Image
            src={imageToShow}
            fluid
            rounded
            onError={(e) => (e.target.src = fallbackImageUrl)}
          />
        </Modal.Body>
      </Modal>
    </div> // End comptes-page
  );
};

export default Comptes;

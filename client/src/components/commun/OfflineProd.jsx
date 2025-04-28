// src/components/commun/OfflineProd.jsx
// *** نسخة كاملة ومصححة للحلقة اللانهائية واستخدام useSelector الآمن ***

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Spinner,
  Alert,
  Container,
  Row,
  Col,
  Form,
  Dropdown,
} from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";
import OfflineHeader from "./OfflineHeader"; // تأكد من المسار الصحيح
import OfflineProdCard from "./OfflineProdCard"; // تأكد من المسار الصحيح
import { getProducts } from "../../redux/actions/productAction"; // تأكد من المسار الصحيح
import "./OfflineProd.css"; // تأكد من المسار الصحيح

// تعريف سعر الصرف (يفضل وضعه في ملف config أو متغير بيئة)
const TND_TO_USD_RATE = 3.0;

const OfflineProd = () => {
  const dispatch = useDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedSort, setSelectedSort] = useState("newest");
  const productsFetched = useRef(false); // Flag لمنع الجلب المتكرر

  // --- [!] Selectors محسّنة ومفصولة ---
  const Products = useSelector((state) => state.productReducer?.Products ?? []);
  const loading = useSelector(
    (state) => state.productReducer?.loading ?? false
  );
  const errors = useSelector((state) => state.productReducer?.errors ?? null);
  // ----------------------------------

  // --- useEffect لجلب المنتجات مرة واحدة فقط عند التحميل ---
  useEffect(() => {
    // التحقق من الفلاغ أولاً. إذا لم يتم الجلب من قبل، قم بالجلب.
    if (!productsFetched.current) {
      // console.log("[OfflineProd Effect - useRef Guard] Attempting initial product fetch."); // للـ Debugging فقط
      dispatch(getProducts());
      productsFetched.current = true; // <-- تعيين الفلاغ بعد إرسال الطلب الأول مباشرة
    }
    // لا توجد اعتماديات متغيرة هنا، سيعمل مرة واحدة بعد المونت
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // الاعتماد فقط على dispatch المستقر

  // --- دالة البحث ---
  const handleSearch = (term) => setSearchTerm(term);

  // --- الحصول على أنواع الربط المتاحة للفلترة ---
  const availableLinkTypes = useMemo(() => {
    if (!Array.isArray(Products)) return [];
    const types = Products.filter(
      (p) => p?.status === "approved" && p.linkType
    ).map((p) => p.linkType);
    return [...new Set(types)].sort(); // فرز الأنواع أبجديًا
  }, [Products]);

  // --- الفلترة والفرز باستخدام useMemo ---
  const filteredAndSortedProducts = useMemo(() => {
    if (!Array.isArray(Products)) return [];

    const upperSearchTerm = searchTerm?.toUpperCase().trim() || "";

    let filtered = Products.filter(
      (product) =>
        product &&
        product._id &&
        product.title &&
        product.price != null &&
        product.user?._id &&
        product.currency
    ) // التأكد من وجود العملة
      .filter((product) => product.status === "approved");

    // تطبيق فلتر البحث
    if (upperSearchTerm) {
      filtered = filtered.filter((product) =>
        product.title?.toUpperCase().includes(upperSearchTerm)
      );
    }

    // تطبيق فلتر نوع الربط
    if (selectedFilter) {
      filtered = filtered.filter(
        (product) => product.linkType === selectedFilter
      );
    }

    // --- دالة مساعدة لتحويل السعر إلى TND ---
    const getPriceInTND = (product) => {
      if (!product || product.price == null || !product.currency) return 0;
      if (product.currency === "USD") {
        return product.price * TND_TO_USD_RATE;
      }
      return product.price;
    };
    // -------------------------------------------

    // تطبيق الفرز مع التحويل
    const sorted = [...filtered]; // إنشاء نسخة جديدة للفرز
    switch (selectedSort) {
      case "price_asc":
        sorted.sort((a, b) => getPriceInTND(a) - getPriceInTND(b));
        break;
      case "price_desc":
        sorted.sort((a, b) => getPriceInTND(b) - getPriceInTND(a));
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.date_added || b.createdAt || 0) -
            new Date(a.date_added || a.createdAt || 0)
        ); // إضافة 0 كاحتياط
        break;
    }
    return sorted;
  }, [Products, searchTerm, selectedFilter, selectedSort]); // الاعتماديات الصحيحة

  // --- تحديد المحتوى للعرض ---
  let content;
  if (loading && !productsFetched.current) {
    // عرض التحميل فقط عند الجلب الأولي
    content = (
      <Col xs={12} className="text-center mt-5 pt-5 loading-placeholder">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Loading products...</p>
      </Col>
    );
  } else if (errors) {
    content = (
      <Col xs={12}>
        <Alert
          variant="danger"
          className="w-75 mt-4 mx-auto text-center shadow-sm"
        >
          <h4>Error Loading Products</h4>
          <p>{typeof errors === "string" ? errors : JSON.stringify(errors)}</p>
        </Alert>
      </Col>
    );
  } else if (filteredAndSortedProducts.length > 0) {
    content = filteredAndSortedProducts.map((product) => (
      <Col
        key={product._id}
        xs={12}
        sm={6}
        md={6}
        lg={4}
        xl={3}
        className="mb-4 d-flex align-items-stretch product-grid-item"
      >
        <OfflineProdCard el={product} /> {/* تمرير المنتج للبطاقة */}
      </Col>
    ));
  } else if (productsFetched.current && !loading) {
    // عرض "لا يوجد" فقط إذا اكتمل الجلب ولم يكن هناك تحميل
    content = (
      <Col xs={12}>
        <Alert
          variant="secondary"
          className="mt-4 text-center no-results-alert"
        >
          {searchTerm || selectedFilter
            ? `No products found matching your criteria.`
            : "No products currently available."}
        </Alert>
      </Col>
    );
  } else {
    content = null; // لا تعرض شيئاً إذا كان التحميل جارياً بعد عرض المنتجات الأولية
  }

  return (
    <div className="offline-page">
      {" "}
      {/* كلاس للحاوية الرئيسية */}
      <OfflineHeader onSearch={handleSearch} /> {/* تمرير دالة البحث للهيدر */}
      {/* --- Hero Section --- */}
      <section className="hero-section text-center text-white py-5">
        <Container>
          <h1 className="display-4 fw-bold mb-3 hero-title">
            Find Your Next Favorite
          </h1>
          <p className="lead col-lg-8 mx-auto mb-4 hero-subtitle">
            Explore a wide range of unique products offered by our community.
            Secure transactions and great deals await.
          </p>
        </Container>
      </section>
      {/* --- نهاية Hero Section --- */}
      <Container fluid="xl" className="py-4 py-md-5 products-section">
        {/* --- صف الفلترة والفرز --- */}
        <Row className="mb-4 align-items-center filter-sort-row">
          <Col md={6} lg={4} className="mb-3 mb-md-0">
            <Form.Group controlId="filterLinkType">
              <Form.Label className="visually-hidden">
                Filter by Link Type
              </Form.Label>
              <Form.Select
                aria-label="Filter by Link Type"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                size="sm"
                className="filter-select"
              >
                <option value="">All Link Types</option>
                {availableLinkTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col
            md={6}
            lg={{ span: 4, offset: 4 }}
            className="d-flex justify-content-md-end"
          >
            <Form.Group
              controlId="sortProducts"
              className="d-flex align-items-center"
            >
              <Form.Label className="me-2 mb-0 text-muted small text-nowrap">
                Sort by:
              </Form.Label>
              <Form.Select
                aria-label="Sort products"
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                size="sm"
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        {/* --- نهاية صف الفلترة والفرز --- */}
        {/* عرض المنتجات */}
        <Row className="g-4">{content}</Row> {/* استخدام g-4 للمسافات */}
      </Container>
    </div>
  );
};

export default OfflineProd;

// src/redux/actionTypes/productActionType.js

// --- GET ALL PRODUCTS ---
export const GET_PRODUCTS_REQUEST = 'GET_PRODUCTS_REQUEST';
export const GET_PRODUCTS_SUCCESS = 'GET_PRODUCTS_SUCCESS';
export const GET_PRODUCTS_FAIL = 'GET_PRODUCTS_FAIL';

// --- ADD PRODUCT ---
export const ADD_PRODUCT_REQUEST = 'ADD_PRODUCT_REQUEST';
export const ADD_PRODUCT_SUCCESS = 'ADD_PRODUCT_SUCCESS';
export const ADD_PRODUCT_FAIL = 'ADD_PRODUCT_FAIL';

// --- UPDATE PRODUCT ---
export const UPDATE_PRODUCT_REQUEST = "UPDATE_PRODUCT_REQUEST";
export const UPDATE_PRODUCT_SUCCESS = "UPDATE_PRODUCT_SUCCESS"; // تأكد من وجوده
export const UPDATE_PRODUCT_FAIL = "UPDATE_PRODUCT_FAIL";

// --- DELETE PRODUCT ---
export const DELETE_PRODUCT_REQUEST = "DELETE_PRODUCT_REQUEST";
export const DELETE_PRODUCT_SUCCESS = "DELETE_PRODUCT_SUCCESS"; // تأكد من وجوده
export const DELETE_PRODUCT_FAIL = "DELETE_PRODUCT_FAIL";

// --- ADMIN ACTIONS (Approve/Reject/Get Pending) ---
// يمكنك تفعيلها عند الحاجة لإنشاء actions لها
export const GET_PENDING_PRODUCTS_REQUEST = "GET_PENDING_PRODUCTS_REQUEST";
export const GET_PENDING_PRODUCTS_SUCCESS = "GET_PENDING_PRODUCTS_SUCCESS";
export const GET_PENDING_PRODUCTS_FAIL = "GET_PENDING_PRODUCTS_FAIL";

export const APPROVE_PRODUCT_REQUEST = "APPROVE_PRODUCT_REQUEST";
export const APPROVE_PRODUCT_SUCCESS = "APPROVE_PRODUCT_SUCCESS"; // تأكد من وجوده
export const APPROVE_PRODUCT_FAIL = "APPROVE_PRODUCT_FAIL";

export const REJECT_PRODUCT_REQUEST = "REJECT_PRODUCT_REQUEST";
export const REJECT_PRODUCT_SUCCESS = "REJECT_PRODUCT_SUCCESS"; // تأكد من وجوده
export const REJECT_PRODUCT_FAIL = "REJECT_PRODUCT_FAIL";

// --- RESET ERRORS (Optional) ---
// export const RESET_PRODUCT_ERRORS = 'RESET_PRODUCT_ERRORS';

// src/redux/actionTypes/productActionType.js
// ... (أنواع سابقة مثل GET_PRODUCTS_REQUEST/SUCCESS/FAIL) ...

// أنواع الإعجاب
export const TOGGLE_LIKE_PRODUCT_REQUEST = 'TOGGLE_LIKE_PRODUCT_REQUEST';
export const TOGGLE_LIKE_PRODUCT_SUCCESS = 'TOGGLE_LIKE_PRODUCT_SUCCESS';
export const TOGGLE_LIKE_PRODUCT_FAIL = 'TOGGLE_LIKE_PRODUCT_FAIL';

// أنواع المزايدة
export const PLACE_BID_REQUEST = 'PLACE_BID_REQUEST';
export const PLACE_BID_SUCCESS = 'PLACE_BID_SUCCESS';
export const PLACE_BID_FAIL = 'PLACE_BID_FAIL';

// (اختياري) أنواع جلب المزايدات بشكل منفصل (قد لا نحتاجه إذا جاءت مع المنتج)
// export const GET_BIDS_REQUEST = 'GET_BIDS_REQUEST';
// export const GET_BIDS_SUCCESS = 'GET_BIDS_SUCCESS';
// export const GET_BIDS_FAIL = 'GET_BIDS_FAIL';

// مسح حالة الخطأ للمنتج
export const CLEAR_PRODUCT_ERROR = 'CLEAR_PRODUCT_ERROR';
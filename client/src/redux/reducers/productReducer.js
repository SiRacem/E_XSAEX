// src/redux/reducers/productReducer.js
// *** نسخة كاملة ومصححة لتحديث الإعجابات بشكل موثوق - بدون اختصارات ***

import {
    GET_PRODUCTS_REQUEST, GET_PRODUCTS_SUCCESS, GET_PRODUCTS_FAIL,
    ADD_PRODUCT_REQUEST, ADD_PRODUCT_SUCCESS, ADD_PRODUCT_FAIL,
    UPDATE_PRODUCT_REQUEST, UPDATE_PRODUCT_SUCCESS, UPDATE_PRODUCT_FAIL,
    DELETE_PRODUCT_REQUEST, DELETE_PRODUCT_SUCCESS, DELETE_PRODUCT_FAIL,
    GET_PENDING_PRODUCTS_REQUEST, GET_PENDING_PRODUCTS_SUCCESS, GET_PENDING_PRODUCTS_FAIL,
    APPROVE_PRODUCT_REQUEST, APPROVE_PRODUCT_SUCCESS, APPROVE_PRODUCT_FAIL,
    REJECT_PRODUCT_REQUEST, REJECT_PRODUCT_SUCCESS, REJECT_PRODUCT_FAIL,
    TOGGLE_LIKE_PRODUCT_REQUEST, TOGGLE_LIKE_PRODUCT_SUCCESS, TOGGLE_LIKE_PRODUCT_FAIL,
    PLACE_BID_REQUEST, PLACE_BID_SUCCESS, PLACE_BID_FAIL,
    CLEAR_PRODUCT_ERROR
} from '../actionTypes/productActionType'; // تأكد من المسار الصحيح

const initialState = {
    Products: [],
    pendingProducts: [],
    loading: false,
    loadingPending: false,
    errors: null,
    productLoading: {},
    productErrors: {},
    loadingAdd: false,
    loadingUpdate: {},
    loadingDelete: {},
    loadingApprove: {},
    loadingReject: {},
    productLiking: {}, // حالة تحميل منفصلة للإعجاب
};

// --- دالة مساعدة لتحديث مصفوفة الإعجابات ---
function calculateUpdatedLikes(currentLikes = [], userId, userLiked) {
    if (!userId) {
        console.warn("calculateUpdatedLikes: userId is missing, cannot update likes.");
        return currentLikes;
    }
    const likesSet = new Set(currentLikes.map(id => String(id)));
    const userIdString = String(userId);

    if (userLiked) {
        likesSet.add(userIdString);
    } else {
        likesSet.delete(userIdString);
    }
    return Array.from(likesSet);
}
// -----------------------------------------

const productReducer = (state = initialState, { type, payload }) => {
    // console.log("--- PRODUCT REDUCER --- Action:", type);

    switch (type) {
        // --- جلب قائمة المنتجات ---
        case GET_PRODUCTS_REQUEST:
            console.log("REDUCER: GET_PRODUCTS_REQUEST - Setting loading to true");
            return { ...state, loading: true, errors: null };
        case GET_PRODUCTS_SUCCESS:
            console.log("REDUCER: GET_PRODUCTS_SUCCESS - Replacing Products. Payload length:", payload?.length);
            return { ...state, loading: false, Products: Array.isArray(payload) ? payload : [], errors: null };
        case GET_PRODUCTS_FAIL:
            console.error("REDUCER: GET_PRODUCTS_FAIL - Setting error:", payload);
            return { ...state, loading: false, errors: payload, Products: [] };

        // --- إضافة منتج ---
        case ADD_PRODUCT_REQUEST:
            return { ...state, loadingAdd: true, errors: null };
        case ADD_PRODUCT_SUCCESS:
            const newProductsAdd = [payload, ...state.Products.filter(p => p._id !== payload._id)];
            const newPendingAdd = payload.status === 'pending'
                ? [payload, ...(state.pendingProducts || []).filter(p => p._id !== payload._id)]
                : state.pendingProducts;
            // فرز pendingProducts بعد الإضافة (اختياري)
            if (payload.status === 'pending') {
                newPendingAdd.sort((a, b) => new Date(a.date_added || a.createdAt || 0) - new Date(b.date_added || b.createdAt || 0));
            }
            return { ...state, loadingAdd: false, Products: newProductsAdd, pendingProducts: newPendingAdd, errors: null };
        case ADD_PRODUCT_FAIL:
            return { ...state, loadingAdd: false, errors: payload };

        // --- المنتجات المعلقة ---
        case GET_PENDING_PRODUCTS_REQUEST:
            return { ...state, loadingPending: true, errors: null };
        case GET_PENDING_PRODUCTS_SUCCESS:
            return { ...state, loadingPending: false, pendingProducts: Array.isArray(payload) ? payload : [], errors: null };
        case GET_PENDING_PRODUCTS_FAIL:
            return { ...state, loadingPending: false, errors: payload, pendingProducts: [] };


        // --- تحديث المنتج ---
        case UPDATE_PRODUCT_REQUEST:
            return { ...state, loadingUpdate: { ...state.loadingUpdate, [payload.productId]: true }, productErrors: { ...state.productErrors, [payload.productId]: null } };
        case UPDATE_PRODUCT_SUCCESS:
            const updatedProduct = payload;
            const updatedPending = updatedProduct.status === 'pending'
                ? [updatedProduct, ...(state.pendingProducts || []).filter(p => p._id !== updatedProduct._id)].sort((a, b) => new Date(a.date_added || a.createdAt || 0) - new Date(b.date_added || b.createdAt || 0))
                : (state.pendingProducts || []).filter(p => p._id !== updatedProduct._id);
            return {
                ...state,
                loadingUpdate: { ...state.loadingUpdate, [updatedProduct._id]: false },
                Products: state.Products.map(p => p._id === updatedProduct._id ? updatedProduct : p),
                pendingProducts: updatedPending,
                errors: null
            };
        case UPDATE_PRODUCT_FAIL:
            return { ...state, loadingUpdate: { ...state.loadingUpdate, [payload.productId]: false }, productErrors: { ...state.productErrors, [payload.productId]: payload.error } };

        // --- الموافقة على المنتج ---
        case APPROVE_PRODUCT_REQUEST:
            return { ...state, loadingApprove: { ...state.loadingApprove, [payload.productId]: true }, productErrors: { ...state.productErrors, [payload.productId]: null } };
        case APPROVE_PRODUCT_SUCCESS:
            return { ...state, loadingApprove: { ...state.loadingApprove, [payload.productId]: false }, pendingProducts: (state.pendingProducts || []).filter(p => p._id !== payload.productId), errors: null };
        case APPROVE_PRODUCT_FAIL:
            return { ...state, loadingApprove: { ...state.loadingApprove, [payload.productId]: false }, productErrors: { ...state.productErrors, [payload.productId]: payload.error } };

        // --- رفض المنتج ---
        case REJECT_PRODUCT_REQUEST:
            return { ...state, loadingReject: { ...state.loadingReject, [payload.productId]: true }, productErrors: { ...state.productErrors, [payload.productId]: null } };
        case REJECT_PRODUCT_SUCCESS:
            return { ...state, loadingReject: { ...state.loadingReject, [payload.productId]: false }, pendingProducts: (state.pendingProducts || []).filter(p => p._id !== payload.productId), errors: null };
        case REJECT_PRODUCT_FAIL:
            return { ...state, loadingReject: { ...state.loadingReject, [payload.productId]: false }, productErrors: { ...state.productErrors, [payload.productId]: payload.error } };

        // --- حذف المنتج ---
        case DELETE_PRODUCT_REQUEST:
            return { ...state, loadingDelete: { ...state.loadingDelete, [payload.productId]: true }, productErrors: { ...state.productErrors, [payload.productId]: null } };
        case DELETE_PRODUCT_SUCCESS:
            console.log("REDUCER: DELETE_PRODUCT_SUCCESS for", payload.productId);
            return {
                ...state,
                loadingDelete: { ...state.loadingDelete, [payload.productId]: false },
                Products: state.Products.filter(p => p._id !== payload.productId),
                pendingProducts: (state.pendingProducts || []).filter(p => p._id !== payload.productId),
                errors: null
            };
        case DELETE_PRODUCT_FAIL:
            return { ...state, loadingDelete: { ...state.loadingDelete, [payload.productId]: false }, productErrors: { ...state.productErrors, [payload.productId]: payload.error } };


        // --- حالات الإعجاب ---
        case TOGGLE_LIKE_PRODUCT_REQUEST:
            return {
                ...state,
                productLiking: { ...state.productLiking, [payload.productId]: true }, // <-- استخدام productLiking
                productErrors: { ...state.productErrors, [payload.productId]: null }
            };
        case TOGGLE_LIKE_PRODUCT_SUCCESS:
            // payload يجب أن يحتوي على: productId, userLiked, userId
            if (!payload.userId) {
                console.error("REDUCER: TOGGLE_LIKE_SUCCESS - Missing userId in payload!");
            }
            return {
                ...state,
                productLiking: { ...state.productLiking, [payload.productId]: false }, // <-- استخدام productLiking
                Products: state.Products.map(product => {
                    if (product._id === payload.productId) {
                        // تحديث مصفوفة likes باستخدام الدالة المساعدة
                        const updatedLikes = calculateUpdatedLikes(product.likes, payload.userId, payload.userLiked);
                        console.log(`REDUCER: Updating likes for ${payload.productId}. New likes:`, updatedLikes); // Log للتأكيد
                        return {
                            ...product,
                            likes: updatedLikes, // <-- استخدام المصفوفة المحدثة
                            // تحديث العدد أيضاً بناءً على المصفوفة الجديدة
                            likesCount: updatedLikes.length
                        };
                    }
                    return product;
                })
            };
        case TOGGLE_LIKE_PRODUCT_FAIL:
            return {
                ...state,
                productLiking: { ...state.productLiking, [payload.productId]: false }, // <-- استخدام productLiking
                productErrors: { ...state.productErrors, [payload.productId]: payload.error }
            };

        // --- حالات المزايدة ---
        case PLACE_BID_REQUEST:
            return { ...state, productLoading: { ...state.productLoading, [payload.productId]: true }, productErrors: { ...state.productErrors, [payload.productId]: null } };
        case PLACE_BID_SUCCESS:
            return {
                ...state,
                productLoading: { ...state.productLoading, [payload.productId]: false },
                Products: state.Products.map(product =>
                    product._id === payload.productId
                        ? { ...product, bids: Array.isArray(payload.bids) ? payload.bids : [] } // استبدال بالمزايدات الجديدة
                        : product
                )
            };
        case PLACE_BID_FAIL:
            return { ...state, productLoading: { ...state.productLoading, [payload.productId]: false }, productErrors: { ...state.productErrors, [payload.productId]: payload.error } };

        // --- مسح الخطأ ---
        case CLEAR_PRODUCT_ERROR:
            const newErrors = { ...state.productErrors };
            delete newErrors[payload.productId];
            return { ...state, productErrors: newErrors };

        default:
            return state;
    }
};

export default productReducer;
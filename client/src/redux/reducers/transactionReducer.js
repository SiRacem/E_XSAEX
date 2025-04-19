// src/redux/reducers/transactionReducer.js
import {
    GET_TRANSACTIONS_REQUEST,
    GET_TRANSACTIONS_SUCCESS,
    GET_TRANSACTIONS_FAIL,
    CLEAR_TRANSACTIONS
} from '../actionTypes/transactionActionTypes';

const initialState = {
    transactions: [],
    loading: false,
    error: null,
};

const transactionReducer = (state = initialState, { type, payload }) => {
    switch (type) {
        case GET_TRANSACTIONS_REQUEST:
            return { ...state, loading: true, error: null };
        case GET_TRANSACTIONS_SUCCESS:
            return { ...state, loading: false, transactions: payload, error: null };
        case GET_TRANSACTIONS_FAIL:
            return { ...state, loading: false, error: payload, transactions: [] }; // مسح المعاملات عند الفشل
        case CLEAR_TRANSACTIONS:
            return { ...initialState }; // إعادة للحالة الأولية
        default:
            return state;
    }
};

export default transactionReducer;
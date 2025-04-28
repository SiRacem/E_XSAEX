// src/redux/reducers/walletReducer.js
import { SEND_BALANCE_REQUEST, SEND_BALANCE_SUCCESS, SEND_BALANCE_FAIL } from '../actionTypes/walletActionType';

const initialState = { loadingSend: false, errorSend: null, lastSendSuccessData: null };

const walletReducer = (state = initialState, action) => {
    const { type, payload } = action;
    switch (type) {
        case SEND_BALANCE_REQUEST: return { ...state, loadingSend: true, errorSend: null, lastSendSuccessData: null };
        case SEND_BALANCE_SUCCESS: return { ...state, loadingSend: false, errorSend: null, lastSendSuccessData: payload };
        case SEND_BALANCE_FAIL: return { ...state, loadingSend: false, errorSend: payload };
        // أضف حالات للمعاملات لاحقًا
        default: return state;
    }
};
export default walletReducer;
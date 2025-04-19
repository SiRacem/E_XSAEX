import axios from 'axios';
import { SEND_BALANCE_REQUEST, SEND_BALANCE_SUCCESS, SEND_BALANCE_FAIL } from '../actionTypes/walletActionType';
import { getProfile } from './userAction'; // لجلب البروفايل وتحديث الرصيد

// Helper للحصول على التوكن (يمكن استيراده من ملف مشترك إذا أردت)
const getTokenConfig = () => {
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') return null;
    return { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } };
};

export const sendBalance = (sendData) => async (dispatch) => {
    dispatch({ type: SEND_BALANCE_REQUEST });
    const config = getTokenConfig();
    if (!config) {
        const errorMsg = 'Token required.'; dispatch({ type: SEND_BALANCE_FAIL, payload: errorMsg });
        return Promise.reject(new Error(errorMsg));
    }
    try {
        const { data } = await axios.post('/wallet/send', sendData, config); // تأكد من مسار الواجهة الخلفية
        dispatch({ type: SEND_BALANCE_SUCCESS, payload: data }); // data قد تحتوي رسالة نجاح
        dispatch(getProfile()); // ** الأهم: تحديث رصيد المرسل **
        return data;
    } catch (error) {
        const message = error.response?.data?.msg || error.message || 'Failed to send funds';
        console.error("Send Balance Action Error:", message, error.response?.data);
        dispatch({ type: SEND_BALANCE_FAIL, payload: message }); throw error;
    }
};
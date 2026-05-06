import Axios from 'axios';

// baseURLやCookieの設定をあらかじめ済ませた「専用のaxios」を作る
const axios = Axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost/api',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true, // 必須：Cookieの通行証を送受信する

    //（クロスオリジンでもCSRFトークンをヘッダーに付与する許可）
    withXSRFToken: true,
});

export default axios;
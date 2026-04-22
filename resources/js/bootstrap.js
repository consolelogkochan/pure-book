import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// (Sanctum認証でCookieの通行証を送受信するために必須)
window.axios.defaults.withCredentials = true;

// (APIの通信先をLaravelの住所に固定する)
window.axios.defaults.baseURL = 'http://localhost';
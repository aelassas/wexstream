import axios from 'axios'
import { API_HOST, DEFAULT_LANGUAGE, PAGE_SIZE } from '../config/env'
import { googleLogout } from '../auth/google'
import { facebookLogout } from '../auth/facebook'

export const authHeader = () => {
    const user = JSON.parse(localStorage.getItem('ws-user'))

    if (user && user.accessToken) {
        return { 'x-access-token': user.accessToken }
    } else {
        return {}
    }
}

export const signup = data => (
    axios.post(API_HOST + '/api/sign-up', data)
        .then(res => res.status)
)

export const validateEmail = data => (
    axios.post(API_HOST + '/api/validate-email', data)
        .then(exist => exist.status)
)

export const googleAuth = data => (
    axios.post(API_HOST + '/api/google-auth', data)
        .then(res => {
            if (res.data.accessToken) {
                localStorage.setItem('ws-auth', 'google')
                localStorage.setItem('ws-user', JSON.stringify(res.data))
            }
            return { status: res.status, data: res.data }
        })
)

export const facebookAuth = data => (
    axios.post(API_HOST + '/api/facebook-auth', data)
        .then(res => {
            if (res.data.accessToken) {
                localStorage.setItem('ws-auth', 'facebook')
                localStorage.setItem('ws-user', JSON.stringify(res.data))
            }
            return { status: res.status, data: res.data }
        })
)

export const signin = data => (
    axios.post(API_HOST + '/api/sign-in', data)
        .then(res => {
            if (res.data.accessToken) {
                localStorage.setItem('ws-auth', 'email')
                localStorage.setItem('ws-user', JSON.stringify(res.data))
            }
            return { status: res.status, data: res.data }
        })
)

export const getAuthType = () => {
    return localStorage.getItem('ws-auth')
}

export const signout = (redirect = true) => {

    const _signout = () => {
        const deleteAllCookies = () => {
            var cookies = document.cookie.split("")

            for (var i = 0; i < cookies.length; i++) {
                var cookie = cookies[i]
                var eqPos = cookie.indexOf("=")
                var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie
                document.cookie = name + "=expires=Thu, 01 Jan 1970 00:00:00 GMT"
            }
        }

        sessionStorage.clear()
        localStorage.removeItem('ws-auth')
        localStorage.removeItem('ws-user')
        localStorage.removeItem('jitsiLocalStorage')
        deleteAllCookies()

        if (redirect) {
            window.location.href = '/sign-in' + window.location.search
        }
    }

    const authType = getAuthType()

    if (authType === 'google') {
        if (window.android && window.android.googleSignout) {
            try {
                window.android.googleSignout()
                _signout()
            } catch (err) {
                _signout()
            }
        } else {
            googleLogout(() => {
                _signout()
            })
        }
    } else if (authType === 'facebook') {
        if (window.android && window.android.facebookSignout) {
            try {
                window.android.facebookSignout()
                _signout()
            } catch (err) {
                _signout()
            }
        } else {
            facebookLogout(() => {
                _signout()
            })
        }
    } else if (authType === 'email') {
        _signout()
    } else {
        _signout()
    }
}

export const validateAccessToken = () => (
    axios.post(API_HOST + '/api/validate-access-token', null, { headers: authHeader() })
        .then(res => res.status)
)

export const confirmEmail = (email, token) => (
    axios.post(API_HOST + '/api/confirm-email/' + encodeURIComponent(email) + '/' + encodeURIComponent(token))
        .then(res => {
            return res.status
        })
)

export const resendLink = (data) => (
    axios.post(API_HOST + '/api/resend-link', data, { headers: authHeader() })
        .then(res => {
            return res.status
        })
)

export const getUsername = () => {
    const user = JSON.parse(localStorage.getItem('ws-user'))

    if (user && user.fullName) {
        return user.fullName
    } else {
        return ''
    }
}

export const getLanguage = () => {
    const user = JSON.parse(localStorage.getItem('ws-user'))

    if (user && user.language) {
        return user.language
    } else {
        const lang = localStorage.getItem('ws-language')
        if (lang && lang.length === 2) {
            return lang
        }
        return DEFAULT_LANGUAGE
    }
}

export const getQueryLanguage = () => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('l')) {
        return params.get('l')
    }
    return ''
}

export const getUserId = () => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('u')) {
        return params.get('u')
    }
    return ''
}

export const getSearchKeyword = () => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('s')) {
        return params.get('s')
    }
    return ''
}

export const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('ws-user'))
    if (user && user.accessToken) {
        return user
    }
    return null
}

export const getUser = (id) => (
    axios.get(API_HOST + '/api/user/' + encodeURIComponent(id), { headers: authHeader() })
        .then(res => res.data)
)

export const getUserById = (userId) => (
    axios.get(API_HOST + '/api/get-user/' + encodeURIComponent(userId), { headers: authHeader() })
        .then(res => res.data)
)

export const updateUser = (data) => (
    axios.post(API_HOST + '/api/update-user', data, { headers: authHeader() })
        .then(res => res.status)
)

export const updateLanguage = (data) => (
    axios.post(API_HOST + '/api/update-language', data, { headers: authHeader() })
        .then(res => {
            if (res.status === 200) {
                const user = JSON.parse(localStorage.getItem('ws-user'))
                user.language = data.language
                localStorage.setItem('ws-user', JSON.stringify(user))
            }
            return res.status
        })
)

export const updateEmailNotifications = (data) => (
    axios.post(API_HOST + '/api/update-email-notifications', data, { headers: authHeader() })
        .then(res => {
            if (res.status === 200) {
                const user = JSON.parse(localStorage.getItem('ws-user'))
                user.enableEmailNotifications = data.enableEmailNotifications
                localStorage.setItem('ws-user', JSON.stringify(user))
            }
            return res.status
        })
)

export const updatePrivateMessages = (data) => (
    axios.post(API_HOST + '/api/update-private-messages', data, { headers: authHeader() })
        .then(res => {
            if (res.status === 200) {
                const user = JSON.parse(localStorage.getItem('ws-user'))
                user.enablePrivateMessages = data.enablePrivateMessages
                localStorage.setItem('ws-user', JSON.stringify(user))
            }
            return res.status
        })
)

export const compare = async (userId, password) => {
    const data = { userId, password }
    const { status } = await axios.get(API_HOST + '/api/compare-password', data, { headers: authHeader() })
    return status === 200
}

export const resetPassword = async (data) => {
    const { status } = await axios.post(API_HOST + '/api/reset-password', data, { headers: authHeader() })
    return status
}

export const setLanguage = (lang) => {
    localStorage.setItem('ws-language', lang)
}

export const deleteUser = (id) => (
    axios.post(API_HOST + '/api/delete-user/' + encodeURIComponent(id), null, { headers: authHeader() })
        .then(res => res.status)
)

export const updateAvatar = (userId, file) => {
    const user = JSON.parse(localStorage.getItem('ws-user'))
    var formData = new FormData()
    formData.append('image', file)
    return axios.post(API_HOST + '/api/update-avatar/' + encodeURIComponent(userId), formData,
        user && user.accessToken ? { headers: { 'x-access-token': user.accessToken, 'Content-Type': 'multipart/form-data' } }
            : { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(res => res.status)
}

export const deleteAvatar = (userId) => (
    axios.post(API_HOST + '/api/delete-avatar/' + encodeURIComponent(userId), null, { headers: authHeader() })
        .then(res => res.status)
)

export const searchUsers = (userId, keyword, messages, page) => (
    axios.get(API_HOST + `/api/search-users/${encodeURIComponent(userId)}/${messages}/${page}/${PAGE_SIZE}?s=${encodeURIComponent(keyword)}`, { headers: authHeader() })
        .then(res => res.data)
)

export const reportUser = (data) => (
    axios.post(API_HOST + '/api/report', data, { headers: authHeader() })
        .then(res => res.status)
)

export const checkBlockedUser = (userId, blockedUserId) => (
    axios.get(API_HOST + '/api/check-blocked-user/' + encodeURIComponent(userId) + '/' + encodeURIComponent(blockedUserId), { headers: authHeader() })
        .then(res => res.status)
)

export const blockUser = (userId, blockedUserId) => (
    axios.post(API_HOST + '/api/block/' + encodeURIComponent(userId) + '/' + encodeURIComponent(blockedUserId), null, { headers: authHeader() })
        .then(res => res.status)
)

export const unblockUser = (userId, blockedUserId) => (
    axios.post(API_HOST + '/api/unblock/' + encodeURIComponent(userId) + '/' + encodeURIComponent(blockedUserId), null, { headers: authHeader() })
        .then(res => res.status)
)
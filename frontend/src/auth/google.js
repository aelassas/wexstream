export const loadGoogleSdk = (onload) => {
    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/platform.js'
    script.setAttribute('defer', 'defer')
    script.onload = () => {
        window.gapi.load("auth2", async () => {
            await window.gapi.auth2.init({
                client_id: process.env.REACT_APP_WS_GOOGLE_CLIENT_ID
            })
            if (onload) {
                onload()
            }
        })
    }
    document.body.appendChild(script)
}

export const googleLogin = (onSuccess, onFailure) => {
    const auth2 = window.gapi.auth2.getAuthInstance()

    auth2.signIn()
        .then((res) => {
            if (onSuccess) {
                const basicProfile = res.getBasicProfile()
                const data = {
                    googleId: basicProfile.getId(),
                    email: basicProfile.getEmail(),
                    fullName: basicProfile.getGivenName() + ' ' + basicProfile.getFamilyName(),
                    avatar: basicProfile.getImageUrl()
                }
                onSuccess(data)
            }
        }, err => {
            if (onFailure) {
                onFailure(err)
            }
        })

}

export const googleLogout = (callback) => {
    const logout = () => {
        const auth2 = window.gapi.auth2.getAuthInstance()

        if (auth2.isSignedIn.get()) {
            auth2.signOut()
                .then(() => {
                    auth2.disconnect()
                    if (callback) {
                        callback()
                    }
                })
        } else {
            if (callback) {
                callback()
            }
        }
    }

    if (window.gapi) {
        logout()
    } else {
        loadGoogleSdk(logout)
    }
}
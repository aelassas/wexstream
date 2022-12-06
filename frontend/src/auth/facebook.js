export const loadFacebookSdk = (onload) => {
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/all.js';
    script.setAttribute('defer', 'defer');
    script.onload = () => {
        const params = {
            appId: process.env.REACT_APP_WS_FACEBOOK_APP_ID,
            xfbml: true,
            status: true,
            cookie: true,
            version: 'v11.0'
        };
        window.FB.init(params);
        window.FB.getLoginStatus(response => {
            if (onload) {
                onload(response);
            }
        });
    };
    document.body.appendChild(script);
};

export const facebookLogin = (callback) => {
    window.FB.getLoginStatus((response) => {

        const facebookAuth = () => {
            window.FB.api('/me?fields=id,email,first_name,last_name,picture.type(large)', (profileResponse) => {
                const data = {
                    facebookId: profileResponse.id,
                    email: profileResponse.email,
                    fullName: profileResponse.first_name + ' ' + profileResponse.last_name,
                    avatar: profileResponse.picture.data.url
                }

                if (callback) {
                    callback(data);
                }
            });
        };

        if (response && response.status === 'connected') {
            facebookAuth();
            return;
        }

        window.FB.login((response) => {
            if (response && response.authResponse) {
                facebookAuth();
            }
        }, { scope: 'email,public_profile' });
    });
};

export const facebookLogout = (callback) => {

    const logout = (response) => {
        if (response && response.status === 'connected') {
            window.FB.logout(() => {
                if (callback) {
                    callback();
                }
            });
        } else {
            callback();
        }
    };

    if (window.FB) {
        window.FB.getLoginStatus(response => {
            logout(response);
        });
    } else {
        loadFacebookSdk((response) => {
            logout(response);
        });
    }
};
import React, { Component } from 'react';
import Header from './Header';
import { strings } from '../config/app.config';
import { validateAccessToken, getCurrentUser, getUser, getLanguage, getQueryLanguage } from '../services/user-service';
import { Link } from '@material-ui/core';
import PayPal from '../assets/img/paypal.png';
import Patreon from '../assets/img/patreon.png';
import BuyMeACoffee from '../assets/img/buymeacoffee.png';
import Liberapay from '../assets/img/liberapay.svg';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../config/env.config';
import { renderReactDom } from '../common/helper';

class Donate extends Component {

    constructor(props) {
        super(props);
        this.state = {
            language: DEFAULT_LANGUAGE,
            user: null
        }
    }

    componentDidMount() {
        let language = getQueryLanguage();

        if (!LANGUAGES.includes(language)) {
            language = getLanguage();
        }
        strings.setLanguage(language);
        this.setState({ language });

        const currentUser = getCurrentUser();
        if (currentUser) {
            validateAccessToken().then(status => {
                if (status === 200) {
                    getUser(currentUser.id).then(user => {
                        if (user) {
                            this.setState({ user });
                        } else {
                            this.setState({ user: null });
                        }
                    }).catch(err => {
                        this.setState({ user: null });
                    });
                }
            }).catch(err => {
                this.setState({ user: null });
            });
        } else {
            this.setState({ user: null });
        }
    }

    render() {
        const { language, user } = this.state;
        return renderReactDom(
            <div>
                <Header user={user} />
                <div className="content">
                    <div className="donate">
                        <h1>{strings.DONATE_TITLE}</h1>
                        {/* <p>
                            <Link href={language === 'fr' ? "https://teradev.ma/" : "https://teradev.ma/en.html"} >{strings.TERADEV}</Link>{strings.DONATE_1}
                        </p>
                        <p>
                            {strings.DONATE_2}
                        </p>
                        <p>
                            {strings.DONATE_3}
                        </p> */}
                        <p>
                            {strings.DONATE}
                        </p>
                        <h1>{strings.PAYPAL}</h1>
                        <p>
                            <Link href="https://paypal.me/TeradevMA"><img alt="" src={PayPal.src ? PayPal.src : PayPal} /></Link>
                        </p>

                        <h1>{strings.PATREON}</h1>
                        <p>
                            <Link href="https://www.patreon.com/TeradevMA"><img alt="" src={Patreon.src ? Patreon.src : Patreon} /></Link>
                        </p>

                        <h1>{strings.BUY_ME_A_COFFEE}</h1>
                        <p>
                            <Link href="https://www.buymeacoffee.com/TeradevMA"><img alt="" src={BuyMeACoffee.src ? BuyMeACoffee.src : BuyMeACoffee} /></Link>
                        </p>

                        <h1>{strings.LIBERAPAY}</h1>
                        <p>
                            <Link href={`https://${language === 'fr' ? 'fr' : 'en'}.liberapay.com/teradev.ma/donate`}><img alt="" src={Liberapay.src ? Liberapay.src : Liberapay} /></Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}

export default Donate;
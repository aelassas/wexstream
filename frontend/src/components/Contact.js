import React, { Component } from 'react';
import Header from './Header';
import { strings } from '../config/app.config';
import { LANGUAGES } from '../config/env.config';
import { validateAccessToken, getCurrentUser, getUser, getLanguage, getQueryLanguage } from '../services/user-service';
import { renderReactDom } from '../common/helper';

class Contact extends Component {

    constructor(props) {
        super(props);
        this.state = {
            user: null
        }
    }

    componentDidMount() {
        let language = getQueryLanguage();

        if (!LANGUAGES.includes(language)) {
            language = getLanguage();
        }
        strings.setLanguage(language);
        this.setState({});

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
        const { user } = this.state;
        return renderReactDom(
            <div>
                <Header user={user} />
                <div className="content">
                    <div className="contact">
                        <h1>{strings.TECHNICAL_ISSUES_TITLE}</h1>
                        <p>{strings.TECHNICAL_ISSUES}</p>

                        <h1>{strings.OTHER_REQUESTS_TITLE}</h1>
                        <p>{strings.OTHER_REQUESTS}</p>

                    </div>
                </div>
            </div>
        );
    }
}

export default Contact;
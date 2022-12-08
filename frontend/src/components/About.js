import React, { Component } from 'react';
import Header from './Header';
import { strings } from '../config/app.config';
import { LANGUAGES } from '../config/env.config';
import { validateAccessToken, getCurrentUser, getUser, getLanguage, getQueryLanguage } from '../services/UserService';
import { renderReactDom } from '../common/helper';

class About extends Component {

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
                <div className="content-taspr">
                    <div className="about">
                        <h1>{strings.ABOUT_TITLE}</h1>
                        <p>{strings.TOS_PREAMBLE_P1}</p>
                        <p>{strings.TOS_PREAMBLE_P2}</p>

                        <ul>
                            <li>{strings.TOS_PREAMBLE_1}</li>
                            <li>{strings.TOS_PREAMBLE_2}</li>
                            <li>{strings.TOS_PREAMBLE_3}</li>
                            <li>{strings.TOS_PREAMBLE_4}</li>
                            <li>{strings.TOS_PREAMBLE_5}</li>
                            <li>{strings.TOS_PREAMBLE_6}</li>
                            <li>{strings.TOS_PREAMBLE_7}</li>
                            <li>{strings.TOS_PREAMBLE_8}</li>
                            <li>{strings.TOS_PREAMBLE_9}</li>
                            <li>{strings.TOS_PREAMBLE_10}</li>
                            <li>{strings.TOS_PREAMBLE_11}</li>
                        </ul>

                        <h1>{strings.ABOUT_USER_FRIENDLY_TITLE}</h1>
                        <p>{strings.ABOUT_USER_FRIENDLY_1}</p>
                        <p>{strings.ABOUT_USER_FRIENDLY_2}</p>
                        <p>{strings.TOS_SERVICES_1}</p>
                        <ul>
                            <li>{strings.TOS_SERVICES_2}</li>
                            <li>{strings.TOS_SERVICES_3}</li>
                            <li>{strings.TOS_SERVICES_4}</li>
                        </ul>
                        <p>{strings.TOS_SERVICES_5}</p>
                        <ol>
                            <li>{strings.TOS_SERVICES_6}</li>
                            <li>{strings.TOS_SERVICES_7}</li>
                            <li>{strings.TOS_SERVICES_8}</li>
                            <li>{strings.TOS_SERVICES_9}</li>
                        </ol>

                        <h1>{strings.ABOUT_SECURE_TITLE}</h1>
                        <p>{strings.TOS_PRIVACY_1}</p>
                        <p>{strings.TOS_PRIVACY_2}</p>
                        <p>{strings.TOS_PRIVACY_3}</p>
                        <p>{strings.TOS_PRIVACY_4}</p>


                        <h1>{strings.ABOUT_CONTENT_TITLE}</h1>
                        <p>{strings.TOS_RESPONSIBILITY_3}</p>
                    </div>
                </div>
            </div>
        );
    }
}

export default About;

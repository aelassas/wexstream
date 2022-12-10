import React from 'react';
import { strings } from '../config/app.config';
import Master from '../elements/Master.js';


const Contact = () => (
    <Master>
        <div className="content">
            <div className="contact">
                <h1>{strings.TECHNICAL_ISSUES_TITLE}</h1>
                <p>{strings.TECHNICAL_ISSUES}</p>

                <h1>{strings.OTHER_REQUESTS_TITLE}</h1>
                <p>{strings.OTHER_REQUESTS}</p>
            </div>
        </div>
    </Master>
);

export default Contact;
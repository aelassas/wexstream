import React from 'react';
import { strings } from '../config/app.config';
import Master from '../elements/Master.js';

const ToS = () => (
    <Master>
        <div className="content-taspr">
            <div className="tos">
                <h1>{strings.TOS_PREAMBLE_TITLE}</h1>
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

                <h1>{strings.TOS_SUBSCRIBING_TITLE}</h1>
                <p>{strings.TOS_SUBSCRIBING_1}</p>
                <p>{strings.TOS_SUBSCRIBING_2}</p>
                <p>{strings.TOS_SUBSCRIBING_3}</p>
                <p>{strings.TOS_SUBSCRIBING_4}</p>

                <h1>{strings.TOS_SERVICES_TITLE}</h1>
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

                <h1>{strings.TOS_ACCESS_TITLE}</h1>
                <p>{strings.TOS_ACCESS_1}</p>
                <p>{strings.TOS_ACCESS_2}</p>

                <h1>{strings.TOS_LITIGATIONS_TITLE}</h1>
                <p>{strings.TOS_LITIGATIONS}</p>

                <h1>{strings.TOS_COMMITMENTS_TITLE}</h1>
                <p>{strings.TOS_COMMITMENTS}</p>

                <h1>{strings.TOS_RESPONSIBILITY_TITLE}</h1>
                <p>{strings.TOS_RESPONSIBILITY_1}</p>
                <p>{strings.TOS_RESPONSIBILITY_2}</p>
                <p>{strings.TOS_RESPONSIBILITY_3}</p>

                <h1>{strings.TOS_PRIVACY_TITLE}</h1>
                <p>{strings.TOS_PRIVACY_1}</p>
                <p>{strings.TOS_PRIVACY_2}</p>
                <p>{strings.TOS_PRIVACY_3}</p>
                <p>{strings.TOS_PRIVACY_4}</p>

                <h1>{strings.TOS_SANCTIONS_TITLE}</h1>
                <p>{strings.TOS_SANCTIONS_1}</p>
                <p>{strings.TOS_SANCTIONS_2}</p>

                <h1>{strings.TOS_MODIFICATION_TITLE}</h1>
                <p>{strings.TOS_MODIFICATION_1}</p>
                <p>{strings.TOS_MODIFICATION_2}</p>

                <h1>{strings.TOS_LAW_TITLE}</h1>
                <p>{strings.TOS_LAW}</p>
            </div>
        </div>
    </Master>
);

export default ToS;
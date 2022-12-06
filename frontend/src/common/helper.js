import { validateAccessToken, updateLanguage, setLanguage, getQueryLanguage } from '../services/user-service';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../config/env.config';
import { createTheme } from '@material-ui/core/styles';
import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import Rtl from '../components/Rtl';
import { ToastContainer, toast } from 'react-toastify';
import { strings } from '../config/app.config';
import 'react-toastify/dist/ReactToastify.css';

export const renderReactDom = (component) => {
    if (process.env.REACT_APP_NODE_ENV === 'production') {
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = function () { };
        }
    }

    let language = DEFAULT_LANGUAGE;
    const user = JSON.parse(localStorage.getItem('ws-user'));
    let lang = getQueryLanguage();

    if (!LANGUAGES.includes(lang)) {
        lang = localStorage.getItem('ws-language');
    }

    if (user) {
        language = user.language;
        if (lang && lang.length === 2 && user.language !== lang) {
            const data = {
                id: user.id,
                language: lang
            }

            validateAccessToken().then(async status => {
                if (status === 200) {
                    const status = await updateLanguage(data);
                    if (status !== 200) {
                        toast(strings.CHANGE_LANGUAGE_ERROR, { type: 'error' });
                    }
                }
            });
            language = lang;
        }
    } else if (lang) {
        language = lang;
    }
    setLanguage(language);
    strings.setLanguage(language);

    const isAr = language === 'ar';

    const html = document.getElementsByTagName('html')[0];
    if (isAr) {
        html.setAttribute('dir', 'rtl');
    }
    html.setAttribute('lang', language);

    document.title = strings.APP_TITLE;

    const metaLang = document.querySelector("meta[name='language']");
    metaLang.setAttribute('content', language);

    const desc = document.querySelector("meta[name='description']");
    desc.setAttribute('content', strings.APP_DESCRIPTION);

    const theme = createTheme({
        direction: isAr ? 'rtl' : 'ltr',
        typography: {
            fontFamily: [
                '-apple-system',
                'BlinkMacSystemFont',
                '"Segoe UI"',
                'Roboto',
                '"Helvetica Neue"',
                'Arial',
                'sans-serif',
                '"Apple Color Emoji"',
                '"Segoe UI Emoji"',
                '"Segoe UI Symbol"',
            ].join(','),
        },
    });

    return isAr ?
        <Rtl>
            <MuiThemeProvider theme={theme}>
                <CssBaseline>
                    {component}
                    <ToastContainer
                        position="bottom-left"
                        autoClose={5000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={language === 'ar'}
                        pauseOnFocusLoss={false}
                        draggable={false}
                        pauseOnHover={false}
                        toastStyle={{ backgroundColor: "#131519", color: "#DDDDDD" }}
                    />
                </CssBaseline>
            </MuiThemeProvider>
        </Rtl>
        :
        <MuiThemeProvider theme={theme}>
            <CssBaseline>
                {component}
                <ToastContainer
                    position="bottom-left"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={language === 'ar'}
                    pauseOnFocusLoss={false}
                    draggable={false}
                    pauseOnHover={false}
                    toastStyle={{ backgroundColor: "#131519", color: "#DDDDDD" }}
                />
            </CssBaseline>
        </MuiThemeProvider>;
};

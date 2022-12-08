import React, { Component } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../config/env.config';
import { strings } from '../config/app.config';
import {
  getLanguage, getUser, signin, googleAuth,
  facebookAuth, getCurrentUser, validateAccessToken,
  signout, getUserId, getQueryLanguage
} from '../services/UserService';
import { getMessageId } from '../services/MessageService';
import { getConferenceId } from '../services/ConferenceService';
import Error from '../elements/Error';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Header from './Header';
import {
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Input,
  IconButton,
  Link
} from '@material-ui/core';
import {
  Videocam,
  Security,
  VerifiedUser,
  Close
} from '@material-ui/icons';
import { loadFacebookSdk, facebookLogin } from '../auth/facebook';
import { loadGoogleSdk, googleLogin } from '../auth/google';
import GooglePlay from '../assets/img/google-play.png';


class SignIn extends Component {

  constructor(props) {
    super(props);

    this.state = {
      language: DEFAULT_LANGUAGE,
      email: '',
      password: '',
      error: false,
      conferenceId: '',
      messageId: '',
      userId: '',
      showPassword: false,
      visible: false,
      isBlacklisted: false,
      openEmailAuthDialog: false,
      emailAuthError: false,
      isGoogleSdkLoaded: false,
      isFacebookSdkLoaded: false
    };
  }

  handleGoogleAuth = (event, _data) => {
    const auth = (data) => {
      googleAuth(data).then(res => {
        if (res.status === 200) {
          if (res.data.isBlacklisted) {
            signout(false);
            this.setState({
              error: false,
              isBlacklisted: true,
              loginSuccess: false
            });
          } else {
            this.setState({
              error: false,
              conferenceId: getConferenceId(),
              messageId: getMessageId(),
              userId: getUserId()
            }, () => {
              const { conferenceId, messageId, userId } = this.state;

              if (conferenceId !== '') {
                window.location.href = `/conference?c=${encodeURIComponent(conferenceId)}`;
              } else if (messageId !== '') {
                window.location.href = `/messages?m=${encodeURIComponent(messageId)}`;
              } else if (userId !== '') {
                window.location.href = `/profile?u=${encodeURIComponent(userId)}`;
              } else {
                window.location = '/home' + window.location.search;
              }
            });
          }
        } else {
          this.setState({
            error: true,
            isBlacklisted: false,
            loginSuccess: false
          });
        }
      })
        .catch(() => {
          this.setState({
            error: true,
            isBlacklisted: false,
            loginSuccess: false
          });
        });
    };

    if (event) {
      googleLogin((data) => {
        data.language = getLanguage();
        auth(data);
      }, (err) => {
        if (err.error === 'popup_closed_by_user') {
          return;
        }

        this.setState({
          error: true,
          isBlacklisted: false,
          loginSuccess: false
        });
      });
    } else {
      const data = _data;
      data.language = getLanguage();
      auth(data);
    }
  };

  handleGoogleAuthFailure = () => {
    this.setState({
      error: true,
      isBlacklisted: false,
      loginSuccess: false
    });
  };

  handleFacebookAuth = (event, _data) => {
    const auth = (data) => {
      facebookAuth(data).then(res => {
        if (res.status === 200) {
          if (res.data.isBlacklisted) {
            signout(false);
            this.setState({
              error: false,
              isBlacklisted: true,
              loginSuccess: false
            });
          } else {
            this.setState({
              error: false,
              conferenceId: getConferenceId(),
              messageId: getMessageId(),
              userId: getUserId()
            }, () => {
              const { conferenceId, messageId, userId } = this.state;

              if (conferenceId !== '') {
                window.location.href = `/conference?c=${encodeURIComponent(conferenceId)}`;
              } else if (messageId !== '') {
                window.location.href = `/messages?m=${encodeURIComponent(messageId)}`;
              } else if (userId !== '') {
                window.location.href = `/profile?u=${encodeURIComponent(userId)}`;
              } else {
                window.location = '/home' + window.location.search;
              }
            });
          }
        } else {
          this.setState({
            error: true,
            isBlacklisted: false,
            loginSuccess: false
          });
        }
      })
        .catch(() => {
          this.setState({
            error: true,
            isBlacklisted: false,
            loginSuccess: false
          });
        });
    };

    if (event) {
      facebookLogin((data) => {
        data.language = getLanguage();
        auth(data);
      });
    } else {
      const data = _data;
      data.language = getLanguage();
      auth(data);
    }
  };

  handleFacebookAuthFailure = () => {
    this.setState({
      error: true,
      isBlacklisted: false,
      loginSuccess: false
    });
  };

  handleEmailAuth = () => {
    this.setState({ openEmailAuthDialog: true });
  };

  handleEmailAuthClose = () => {
    this.setState({ openEmailAuthDialog: false });
  }

  handleOnChangeEmail = (e) => {
    this.setState({
      email: e.target.value
    });
  };

  handleOnChangePassword = (e) => {
    this.setState({
      password: e.target.value
    });
  };

  handleOnPasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      this.handleSubmit(e);
    }
  };

  handleSubmit = (e) => {
    e.preventDefault();

    if (window.android && window.android.setAuthType) {
      window.android.setAuthType('email');
    }

    const { email, password } = this.state;
    const data = { email, password };

    signin(data)
      .then(res => {
        if (res.status === 200) {
          if (res.data.isBlacklisted) {
            signout(false);
            this.setState({
              emailAuthError: false,
              isBlacklisted: true,
              loginSuccess: false
            });
          } else {
            this.setState({
              emailAuthError: false,
              conferenceId: getConferenceId(),
              messageId: getMessageId(),
              userId: getUserId()
            }, () => {
              const { conferenceId, messageId, userId } = this.state;

              if (conferenceId !== '') {
                window.location.href = `/conference?c=${encodeURIComponent(conferenceId)}`;
              } else if (messageId !== '') {
                window.location.href = `/messages?m=${encodeURIComponent(messageId)}`;
              } else if (userId !== '') {
                window.location.href = `/profile?u=${encodeURIComponent(userId)}`;
              } else {
                window.location = '/home' + window.location.search;
              }
            });
          }
        } else {
          this.setState({
            emailAuthError: true,
            isBlacklisted: false,
            loginSuccess: false
          });
        }
      })
      .catch(() => {
        this.setState({
          emailAuthError: true,
          isBlacklisted: false,
          loginSuccess: false
        });
      });
  };

  componentDidMount() {
    loadGoogleSdk(() => this.setState({ isGoogleSdkLoaded: true }));
    loadFacebookSdk(() => this.setState({ isFacebookSdkLoaded: true }));

    const queryLanguage = getQueryLanguage();

    if (LANGUAGES.includes(queryLanguage)) {
      strings.setLanguage(queryLanguage);
      this.setState({ language: queryLanguage });
    } else {
      const language = getLanguage();
      strings.setLanguage(language);
      this.setState({ language });
    }

    if (window.android) {
      window.androidGoogleAuthSuccess = (data) => {
        this.handleGoogleAuth(null, JSON.parse(data));
      }

      window.androidGoogleAuthFailure = () => {
        this.handleGoogleAuthFailure();
      };

      window.androidFacebookAuthSuccess = (data) => {
        this.handleFacebookAuth(null, JSON.parse(data));
      }

      window.androidFacebookAuthFailure = () => {
        this.handleFacebookAuthFailure();
      };
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      validateAccessToken().then(status => {
        if (status === 200) {
          getUser(currentUser.id).then(user => {
            if (user) {
              window.location.href = '/home' + window.location.search;
            } else {
              signout();
            }
          }).catch(err => {
            signout();
          });
        }
      }).catch(err => {
        signout();
      });
    } else {
      this.setState({ visible: true });
    }
  }

  render() {
    const { visible, error, emailAuthError, language, isBlacklisted, openEmailAuthDialog, isGoogleSdkLoaded, isFacebookSdkLoaded } = this.state;
    const rtl = language === 'ar';
    const authBtnStyle = { width: language === 'fr' ? 240 : 190 };

    return (
      <div>
        <Header />
        <div className="signin-content" style={visible ? null : { display: 'none' }}>
          <div className={rtl ? 'signin-header-rtl' : 'signin-header'} >
            <Card variant="outlined" className="signin-card">
              <CardContent>
                <div className="signin-icon"><Videocam fontSize="large" color="primary" /></div>
                <Typography color="textSecondary" className="signin-cc">
                  {strings.SIGNIN_VIDEO_CONFERENCING}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" className="signin-card">
              <CardContent>
                <div className="signin-icon"><Security fontSize="large" color="primary" /></div>
                <Typography color="textSecondary" className="signin-cc">
                  {strings.SIGNIN_PRIVACY}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" className="signin-card">
              <CardContent>
                <div className="signin-icon"><VerifiedUser fontSize="large" color="primary" /></div>
                <Typography color="textSecondary" className="signin-cc">
                  {strings.SIGNIN_PROTECTION}
                </Typography>
              </CardContent>
            </Card>
          </div>
          <Paper className={rtl ? 'signin-form-rtl' : 'signin-form'} elevation={0}>
            <div>
              <h1 className="signin-form-title">{strings.SIGN_IN_HEADING}</h1>
              <div className="auth" style={{ width: language === 'fr' ? 240 : 190 }}>
                <Button
                  onClick={
                    (event) => {
                      if (window.android && window.android.googleSignin) {
                        window.android.googleSignin();
                      } else {
                        this.handleGoogleAuth(event);
                      }
                    }
                  }
                  variant="contained"
                  color="secondary"
                  size="small"
                  disabled={!isGoogleSdkLoaded}
                  style={authBtnStyle}
                >
                  {strings.SIGN_IN_WITH_GOOGLE}
                </Button>
                <Button
                  onClick={
                    (event) => {
                      if (window.android && window.android.facebookSignin) {
                        window.android.facebookSignin();
                      } else {
                        this.handleFacebookAuth(event);
                      }
                    }
                  }
                  variant="contained"
                  color="primary"
                  size="small"
                  disabled={!isFacebookSdkLoaded}
                  style={authBtnStyle}
                >
                  {strings.SIGN_IN_WITH_FACEBOOK}
                </Button>
                <Button
                  onClick={this.handleEmailAuth}
                  variant="contained"
                  color="default"
                  size="small"
                  style={authBtnStyle}
                >
                  {strings.SIGN_IN_WITH_EMAIL}
                </Button>
              </div>
              <div className="form-error">
                {error && <Error message={strings.ERROR_IN_SIGN_IN} />}
                {isBlacklisted && <Error message={strings.IS_BLACKLISTED} />}
              </div>
            </div>
          </Paper>
          <div className={`signin-footer${rtl ? '-rtl' : ''}`} style={window.android ? { display: 'none' } : null}>
            <Link href={process.env.REACT_APP_WS_GOOGLE_PLAY + '&hl=' + language}><img alt="" src={GooglePlay.src ? GooglePlay.src : GooglePlay} /></Link>
          </div>
          <Dialog
            disableEscapeKeyDown
            maxWidth="xs"
            open={openEmailAuthDialog}
          >
            <DialogTitle disableTypography>
              <div>
                <Typography variant="h5" className="email-auth-close-title">{strings.SIGN_IN_HEADING}</Typography>
                <IconButton aria-label="close" className={`email-auth-close-btn${rtl ? '-rtl' : ''}`} onClick={this.handleEmailAuthClose}>
                  <Close />
                </IconButton>
              </div>
            </DialogTitle>
            <DialogContent>
              <form onSubmit={this.handleSubmit}>
                <FormControl fullWidth margin="dense">
                  <InputLabel htmlFor="email">{strings.EMAIL}</InputLabel>
                  <Input
                    id="email"
                    type="text"
                    name="Email"
                    onChange={this.handleOnChangeEmail}
                    autoComplete="email"
                    required
                  />
                </FormControl>
                <FormControl fullWidth margin="dense">
                  <InputLabel htmlFor="password">{strings.PASSWORD}</InputLabel>
                  <Input
                    id="password"
                    name="Password"
                    onChange={this.handleOnChangePassword}
                    onKeyDown={this.handleOnPasswordKeyDown}
                    autoComplete="password"
                    type="password"
                    required
                  />
                </FormControl>
                <div className={'signin-buttons ' + (rtl ? 'buttons-rtl' : 'buttons')}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    {strings.SIGN_IN}
                  </Button>
                  <Button
                    variant="contained"
                    color="default"
                    size="small"
                    href="/sign-up"
                  >
                    {strings.SIGN_UP}
                  </Button>
                </div>
                <div className="form-error">
                  {emailAuthError && <Error message={strings.ERROR_IN_SIGN_IN} />}
                  {isBlacklisted && <Error message={strings.IS_BLACKLISTED} />}
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div >
    );
  }
}

export default SignIn;
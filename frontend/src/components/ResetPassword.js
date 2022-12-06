import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { strings } from '../config/app.config';
import { getLanguage, getUser, validateAccessToken, resendLink, getCurrentUser, signout, compare, resetPassword, getQueryLanguage } from '../services/user-service';
import Header from './Header';
import Error from '../elements/Error';
import Paper from '@material-ui/core/Paper';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Button from '@material-ui/core/Button';
import { toast } from 'react-toastify';
import Backdrop from './SimpleBackdrop';
import { renderReactDom } from '../common/helper';
import { LANGUAGES } from '../config/env.config';

class PasswordReset extends Component {

    constructor(props) {
        super(props);
        this.state = {
            user: null,
            email: '',
            password: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            error: false,
            passwordLengthError: false,
            currentPasswordError: false,
            newPasswordRequiredError: false,
            confirmPasswordError: false,
            isAuthenticating: true,
            isTokenValidated: false,
            isVerified: false,
            showCurrentPassword: false,
            showNewPassword: false,
            showConfirmPassword: false
        };
    }

    handleResend = (e) => {
        e.preventDefault();
        const data = { email: this.state.email };

        resendLink(data)
            .then(status => {
                if (status === 200) {
                    toast(strings.VALIDATION_EMAIL_SENT, { type: 'info' });
                } else {
                    toast(strings.VALIDATION_EMAIL_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                toast(strings.VALIDATION_EMAIL_ERROR, { type: 'error' });
            });
    }

    handleCurrentPasswordChange = (e) => {
        e.preventDefault();
        this.setState({ currentPassword: e.target.value });
    };

    handleNewPasswordChange = (e) => {
        e.preventDefault();
        this.setState({ newPassword: e.target.value });
    };

    handleConfirmPasswordChange = (e) => {
        e.preventDefault();
        this.setState({ confirmPassword: e.target.value });
    };

    handleSubmit = (e) => {
        e.preventDefault();

        compare(this.state.currentPassword, this.state.password).then((passwordMatch) => {
            this.setState({ currentPasswordError: !passwordMatch });

            if (passwordMatch) {
                if (this.state.newPassword.length === 0) {
                    this.setState({
                        newPasswordRequiredError: true,
                        passwordLengthError: false,
                        confirmPasswordError: false
                    });
                    return;
                } else {
                    this.setState({
                        newPasswordRequiredError: false
                    });
                }

                if (this.state.newPassword.length < 6) {
                    this.setState({
                        passwordLengthError: true,
                        confirmPasswordError: false
                    });
                    return;
                } else {
                    this.setState({
                        passwordLengthError: false
                    });
                }

                if (this.state.newPassword !== this.state.confirmPassword) {
                    this.setState({
                        confirmPasswordError: true
                    });
                    return;
                } else {
                    this.setState({
                        confirmPasswordError: false
                    });
                }

                const data = {
                    email: this.state.email,
                    password: this.state.password,
                    newPassword: this.state.newPassword
                };

                resetPassword(data)
                    .then(status => {
                        if (status === 200) {
                            getUser(this.state.user._id).then(user => {
                                this.setState({
                                    user,
                                    password: user.password,
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: '',
                                    showCurrentPassword: false,
                                    showNewPassword: false,
                                    showConfirmPassword: false
                                });
                                toast(strings.PASSWORD_UPDATE, { type: 'info' });
                            }).catch(err => {
                                this.setState({ isVerified: false, isAuthenticating: false, isTokenValidated: false });
                            });
                        } else {
                            this.setState({ error: true });
                            toast(strings.PASSWORD_UPDATE_ERROR, { type: 'error' });
                        }
                    })
                    .catch(err => {
                        this.setState({ error: true });
                        toast(strings.PASSWORD_UPDATE_ERROR, { type: 'error' });
                    });
            }
        });

    };

    handleOnConfirmPasswordKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.handleSubmit(e);
        }
    }

    handleMouseDownPassword = (e) => {
        e.preventDefault();
    };

    handleClickShowCurrentPassword = (e) => {
        this.setState({ showCurrentPassword: !this.state.showCurrentPassword });
    };

    handleClickShowNewPassword = (e) => {
        this.setState({ showNewPassword: !this.state.showNewPassword });
    };

    handleClickShowConfirmPassword = (e) => {
        this.setState({ showConfirmPassword: !this.state.showConfirmPassword });
    };

    handleChange = (e) => {
        e.preventDefault();
    };

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
                getUser(currentUser.id).then(user => {
                    if (user) {
                        this.setState({ user, email: user.email, isVerified: user.isVerified, password: user.password, isAuthenticating: false, isTokenValidated: status === 200 });
                    } else {
                        signout();
                    }
                }).catch(err => {
                    this.setState({ isVerified: false, isAuthenticating: false, isTokenValidated: false });
                    signout();
                });
            }).catch(err => {
                this.setState({ isAuthenticating: false, isTokenValidated: false });
                signout();
            });
        } else {
            this.setState({ isVerified: false, isAuthenticating: false, isTokenValidated: false });
            signout();
        }
    }

    render() {
        const { isAuthenticating } = this.state;
        if (!isAuthenticating) {
            const { isTokenValidated } = this.state;
            if (isTokenValidated) {
                const { isVerified, error, currentPassword, newPassword, confirmPassword,
                    currentPasswordError, passwordLengthError, newPasswordRequiredError,
                    confirmPasswordError, showCurrentPassword, showNewPassword, showConfirmPassword, user } = this.state;
                return renderReactDom(
                    <div>
                        <Header user={user} />
                        {isVerified ? (
                            <div className="password-reset content-taspr">
                                <Paper className="password-reset-form password-reset-form-wrapper" elevation={10}>
                                    <h1 className="password-reset-form-title"> {strings.SPASSWORD_RESET_HEADING} </h1>
                                    <form className="form" onSubmit={this.handleSubmit}>
                                        <FormControl fullWidth margin="dense">
                                            <InputLabel
                                                htmlFor="password-current"
                                                error={currentPasswordError}
                                            >
                                                {strings.CURRENT_PASSWORD}
                                            </InputLabel>
                                            <Input
                                                id="password-current"
                                                name="currentPass"
                                                onChange={this.handleCurrentPasswordChange}
                                                value={currentPassword}
                                                error={currentPasswordError}
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                required
                                            />
                                            <FormHelperText
                                                error={currentPasswordError}
                                            >
                                                {currentPasswordError
                                                    ? strings.CURRENT_PASSWORD_ERROR
                                                    : ''}
                                            </FormHelperText>
                                        </FormControl>
                                        <FormControl
                                            fullWidth
                                            margin="dense"
                                            error={newPasswordRequiredError}
                                        >
                                            <InputLabel
                                                htmlFor="password-new"
                                                error={newPasswordRequiredError}
                                            >
                                                {strings.NEW_PASSWORD}
                                            </InputLabel>
                                            <Input
                                                id="password-new"
                                                name="newPass"
                                                onChange={this.handleNewPasswordChange}
                                                value={newPassword}
                                                error={newPasswordRequiredError}
                                                type={showNewPassword ? 'text' : 'password'}
                                                required
                                            />
                                            <FormHelperText
                                                error={newPasswordRequiredError}
                                            >
                                                {newPasswordRequiredError ? strings.NEW_PASSWORD_REQUIRED_ERROR : ''}
                                            </FormHelperText>
                                        </FormControl>
                                        <FormControl
                                            fullWidth
                                            margin="dense"
                                            error={confirmPasswordError}
                                        >
                                            <InputLabel
                                                htmlFor="password-confirm"
                                                error={confirmPasswordError}
                                            >
                                                {strings.CONFIRM_PASSWORD}
                                            </InputLabel>
                                            <Input
                                                id="password-confirm"
                                                name="confirmPass"
                                                onChange={this.handleConfirmPasswordChange}
                                                onKeyDown={this.handleOnConfirmPasswordKeyDown}
                                                value={confirmPassword}
                                                error={confirmPasswordError || passwordLengthError}
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                            />
                                            <FormHelperText
                                                error={confirmPasswordError || passwordLengthError}
                                            >
                                                {confirmPasswordError
                                                    ? strings.PASSWORDS_DONT_MATCH
                                                    : (passwordLengthError ? strings.ERROR_IN_PASSWORD : '')}
                                            </FormHelperText>
                                        </FormControl>
                                        <div className={user.language === 'ar' ? 'buttons-rtl' : 'buttons'}>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                            >
                                                {strings.RESET_PASSWORD}
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="default"
                                                size="small"
                                                href="/home"> {strings.CANCEL}
                                            </Button>
                                        </div>
                                        <div className="form-error">
                                            {error && <Error message={strings.PASSWORD_UPDATE_ERROR} />}
                                        </div>
                                    </form>
                                </Paper>
                            </div>)
                            :
                            (<div className="validate-email">
                                <span>{strings.VALIDATE_EMAIL}</span>
                                <Button
                                    type="button"
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    className="btn-resend"
                                    onClick={this.handleResend}
                                >{strings.RESEND}</Button>
                            </div>)}
                    </div>
                );
            } else {
                return (<Navigate to={'/sign-in' + window.location.search} />);
            }
        } else {
            return renderReactDom(<Backdrop text={strings.AUTHENTICATING} />);
        }
    }
}

export default PasswordReset;
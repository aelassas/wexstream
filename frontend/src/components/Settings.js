import React, { Component } from 'react';
import { strings } from '../config/app.config';
import Header from './Header';
import { toast } from 'react-toastify';
import {
    getLanguage, getUser, updateEmailNotifications, updatePrivateMessages,
    validateAccessToken, resendLink, getCurrentUser, signout, getQueryLanguage
} from '../services/UserService';
import { LANGUAGES } from '../config/env.config';
import Button from '@mui/material/Button';
import Backdrop from '../elements/SimpleBackdrop';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormLabel from '@mui/material/FormLabel';
import { updateUser, deleteUser } from '../services/UserService';
import Error from '../elements/Error';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormHelperText from '@mui/material/FormHelperText';
import { Avatar } from '../elements/Avatar';
import validator from 'validator';


class Settings extends Component {

    constructor(props) {
        super(props);

        this.state = {
            user: null,
            websiteError: false,
            error: false,
            isAuthenticating: true,
            isTokenValidated: false,
            verified: false,
            openDialog: false,
            isLoading: false,
            isDeleting: false
        };
    }

    handleResend = (e) => {
        e.preventDefault();
        const data = { email: this.state.user.email };

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
    };

    handleOnChangeFullName = (e) => {
        e.preventDefault();
        const { user } = this.state;
        user.fullName = e.target.value;
        this.setState({ user });
    };

    handleOnChangeBio = (e) => {
        e.preventDefault();
        const { user } = this.state;
        user.bio = e.target.value;
        this.setState({ user });
    };

    handleOnChangeLocation = (e) => {
        e.preventDefault();
        const { user } = this.state;
        user.location = e.target.value;
        this.setState({ user });
    };

    handleOnChangeWebsite = (e) => {
        e.preventDefault();
        const { user } = this.state;
        user.website = e.target.value;
        this.setState({ user });
    };

    handleOnBlurWebsite = (e) => {
        this.setState({ websiteError: e.target.value !== '' && !validator.isURL(e.target.value, { require_tld: true, require_protocol: false }) });
    };

    handleSubmit = (e) => {
        e.preventDefault();

        const { email, fullName, bio, location, website } = this.state.user;
        const data = {
            email,
            fullName,
            bio,
            location,
            website
        };

        updateUser(data)
            .then(status => {
                if (status === 200) {
                    toast(strings.USER_UPDATE, { type: 'info' });
                } else {
                    toast(strings.USER_UPDATE_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                toast(strings.USER_UPDATE_ERROR, { type: 'error' });
            });
    };

    openDialog = () => {
        this.setState({ openDialog: true });
    };

    deleteAccount = (e) => {
        e.preventDefault();
        this.openDialog();
    };

    closeDialog = () => {
        this.setState({ openDialog: false });
    };

    handleCancelDelete = (e) => {
        this.closeDialog();
    };

    handleDelete = (e) => {
        this.closeDialog();
        this.setState({ isDeleting: true });
        deleteUser(this.state.user._id)
            .then(status => {
                if (status === 200) {
                    signout();
                } else {
                    this.setState({ isDeleting: false });
                    toast(strings.DELETE_ACCOUNT_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                this.setState({ isDeleting: false });
                toast(strings.DELETE_ACCOUNT_ERROR, { type: 'error' });
            });
    };

    handleEmailNotificationsChange = (e) => {
        const { user } = this.state;
        user.enableEmailNotifications = e.target.checked;
        updateEmailNotifications(user)
            .then(status => {
                if (status === 200) {
                    this.setState({ user });
                    toast(strings.SETTING_UPDATED, { type: 'info' });
                }
            })
            .catch(err => {
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
    };

    handlePrivateMessagesChange = (e) => {
        const { user } = this.state;
        user.enablePrivateMessages = e.target.checked;
        updatePrivateMessages(user)
            .then(status => {
                if (status === 200) {
                    this.setState({ user });
                    toast(strings.SETTING_UPDATED, { type: 'info' });
                }
            })
            .catch(err => {
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
    };

    onBeforeUpload = () => {
        this.setState({ isLoading: true });
    };

    onAvatarChange = (user) => {
        this.setState({ isLoading: false, user });
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

                        if (user.blacklisted) {
                            signout();
                            return;
                        }

                        this.setState({ user, verified: user.verified, isAuthenticating: false, isTokenValidated: status === 200 });
                    } else {
                        signout();
                    }
                }).catch(err => {
                    signout();
                });
            }).catch(err => {
                signout();
            });
        } else {
            signout();
        }
    }

    render() {
        const { isAuthenticating } = this.state;
        if (!isAuthenticating) {
            const { isTokenValidated } = this.state;
            if (isTokenValidated) {
                const { verified, user, error, openDialog, websiteError, isLoading, isDeleting } = this.state;
                return (
                    <div>
                        <Header user={user} />
                        {verified ? (
                            <div className="settings content-taspr">
                                <Paper className="profile-form profile-form-wrapper" elevation={10}>
                                    <div>
                                        <h1 className="profile-form-title"> {strings.PROFILE_SETTINGS} </h1>
                                        <form onSubmit={this.handleSubmit}>
                                            <Avatar loggedUser={user}
                                                user={user}
                                                size="large"
                                                readonly={false}
                                                onBeforeUpload={this.onBeforeUpload}
                                                onChange={this.onAvatarChange}
                                                color="disabled"
                                                className={user.language === 'ar' ? 'profile-avatar-settings-rtl' : 'profile-avatar-settings'} />
                                            <FormControl fullWidth margin="dense">
                                                <InputLabel htmlFor="full-name">{strings.FULL_NAME}</InputLabel>
                                                <Input
                                                    id="full-name"
                                                    type="text"
                                                    value={user.fullName}
                                                    name="FullName"
                                                    onChange={this.handleOnChangeFullName}
                                                    required
                                                />
                                            </FormControl>
                                            <FormControl fullWidth margin="dense">
                                                <InputLabel htmlFor="bio">{strings.BIO}</InputLabel>
                                                <Input
                                                    id="bio"
                                                    type="text"
                                                    value={user.bio || ''}
                                                    name="Bio"
                                                    multiline
                                                    maxRows={3}
                                                    inputProps={{ maxLength: 100 }}
                                                    onChange={this.handleOnChangeBio}
                                                />
                                            </FormControl>
                                            <FormControl fullWidth margin="dense">
                                                <InputLabel htmlFor="location">{strings.LOCATION}</InputLabel>
                                                <Input
                                                    id="location"
                                                    type="text"
                                                    value={user.location || ''}
                                                    name="Location"
                                                    onChange={this.handleOnChangeLocation}
                                                />
                                            </FormControl>
                                            <FormControl fullWidth margin="dense">
                                                <InputLabel htmlFor="website">{strings.WEBSITE}</InputLabel>
                                                <Input
                                                    id="website"
                                                    type="text"
                                                    value={user.website || ''}
                                                    name="Website"
                                                    onChange={this.handleOnChangeWebsite}
                                                    onBlur={this.handleOnBlurWebsite}
                                                    error={websiteError}
                                                />
                                                <FormHelperText error={websiteError}>
                                                    {websiteError ? strings.INVALID_URL : ''}
                                                </FormHelperText>
                                            </FormControl>
                                            <FormControl fullWidth margin="dense">
                                                <InputLabel htmlFor="email">{strings.EMAIL}</InputLabel>
                                                <Input
                                                    id="email"
                                                    type="text"
                                                    name="Email"
                                                    onBlur={this.handleOnBlur}
                                                    onChange={this.handleOnChangeEmail}
                                                    autoComplete="Email"
                                                    disabled
                                                    value={user.email}
                                                />
                                            </FormControl>
                                            <div className={user.language === 'ar' ? 'buttons-rtl' : 'buttons'} >
                                                <Button
                                                    type="submit"
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    disabled={websiteError}
                                                >
                                                    {strings.SAVE}
                                                </Button>
                                                {
                                                    user.password && <Button
                                                        variant="contained"
                                                        color="default"
                                                        size="small"
                                                        href="/reset-password"
                                                        className="reset-password-btn">
                                                        {strings.RESET_PASSWORD}
                                                    </Button>
                                                }
                                            </div>
                                        </form>
                                        <Dialog
                                            disableEscapeKeyDown
                                            maxWidth="xs"
                                            open={openDialog}
                                        >
                                            <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                                            <DialogContent>{strings.DELETE_ACCOUNT_CONFIRM}</DialogContent>
                                            <DialogActions>
                                                <Button onClick={this.handleCancelDelete} color="default">{strings.CANCEL}</Button>
                                                <Button onClick={this.handleDelete} color="secondary">{strings.DELETE_ACCOUNT}</Button>
                                            </DialogActions>
                                        </Dialog>
                                        {error && <div className="form-error"><Error message={strings.ERROR_IN_PROFILE} /></div>}
                                    </div>
                                </Paper>
                                <Paper className="net-settings-form net-settings-form-wrapper" elevation={10}>
                                    <div className="net-settings-ctn">
                                        <h1 className="net-settings-form-title"> {strings.NETWORK_SETTINGS} </h1>
                                        <FormControl component="fieldset">
                                            <FormGroup>
                                                <FormControlLabel
                                                    control={<Switch checked={user.enableEmailNotifications} onChange={this.handleEmailNotificationsChange} name="emailNotifications" color="primary" />}
                                                    label={strings.SETTINGS_EMAIL_NOTIFICATIONS}
                                                />
                                                <FormControlLabel
                                                    control={<Switch checked={user.enablePrivateMessages} onChange={this.handlePrivateMessagesChange} name="privateMessages" color="primary" />}
                                                    label={strings.SETTINGS_PRIVATE_MESSAGES}
                                                />
                                            </FormGroup>
                                        </FormControl>
                                    </div>
                                </Paper>
                                <Paper className="dz-settings-form dz-settings-form-wrapper" elevation={10}>
                                    <div className="dz-settings-ctn">
                                        <h1 className="dz-settings-form-title"> {strings.DELETE_ACCOUNT} </h1>
                                        <FormControl component="fieldset">
                                            <FormGroup>
                                                <FormLabel className="dz-da-label">{strings.DZ_DELETE_ACCOUNT}</FormLabel>
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    size="small"
                                                    onClick={this.deleteAccount}> {strings.DELETE_ACCOUNT}
                                                </Button>
                                            </FormGroup>
                                        </FormControl>
                                    </div>
                                </Paper>
                                {(isLoading || isDeleting) && <Backdrop text={strings.PLEASE_WAIT} />}
                            </div>
                        ) :
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
                            </div>)
                        }
                    </div>
                );
            } else {
                signout();
                return null;
            }
        } else {
            return (<Backdrop text={strings.AUTHENTICATING} />);
        }
    }
}

export default Settings;
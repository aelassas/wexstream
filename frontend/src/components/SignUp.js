import React, { useEffect, useState } from 'react';
import { strings } from '../config/app.config';
import * as UserService from '../services/UserService';
import * as Helper from '../common/Helper';
import Backdrop from '../elements/SimpleBackdrop';
import Error from '../elements/Error';
import {
    Input,
    InputLabel,
    FormControl,
    FormHelperText,
    Button,
    Paper,
    Checkbox,
    Link
} from '@mui/material';

const SignUp = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tosChecked, setTosChecked] = useState(false);
    const [error, setError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [passwordsDontMatch, setPasswordsDontMatch] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleOnChangeFullName = (e) => {
        setFullName(e.target.value);
    };

    const handleOnChangeEmail = (e) => {
        setEmail(e.target.value);
    };

    const handleOnChangePassword = (e) => {
        setPassword(e.target.value);
    };

    const handleOnChangeConfirmPassword = (e) => {
        setConfirmPassword(e.target.value);
    };

    const handleOnBlur = (e) => {
        setEmail(e.target.value);

        const data = {
            email: email
        };

        UserService.validateEmail(data)
            .then(status => {
                if (status === 204) {
                    setEmailError(true);
                } else {
                    setEmailError(false);
                }
            }).catch(err => {
                setEmailError(false);
                Helper.error(null, err);
            });
    };

    const preventDefault = (e) => {
        e.preventDefault();
    }

    const handleTosChange = (e) => {
        setTosChecked(e.target.checked);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const emailData = {
            email: email
        };

        UserService.validateEmail(emailData)
            .then(emailStatus => {
                if (emailStatus === 204) {
                    setEmailError(true);
                } else {
                    setEmailError(false);

                    if (password.length < 6) {
                        setPasswordError(true);
                        setPasswordsDontMatch(false);
                        setError(false);
                        return;
                    }

                    if (password !== confirmPassword) {
                        setPasswordError(false);
                        setPasswordsDontMatch(true);
                        setError(false);
                        return;
                    }

                    setLoading(true);

                    const data = {
                        email: email,
                        password: password,
                        fullName: fullName,
                        language: UserService.getLanguage()
                    };

                    UserService.signup(data)
                        .then(
                            registerStatus => {
                                if (registerStatus === 200) {
                                    UserService.signin({
                                        email: email,
                                        password: password
                                    })
                                        .then(signInResult => {
                                            if (signInResult.status === 200) {
                                                window.location = '/home' + window.location.search;
                                            } else {
                                                setError(true);
                                                setPasswordError(false);
                                                setPasswordsDontMatch(false);
                                                setLoading(false);
                                            }
                                        })
                                        .catch((err) => {
                                            setError(true);
                                            setPasswordError(false);
                                            setPasswordsDontMatch(false);
                                            setLoading(false);
                                        });
                                } else
                                    setError(true);
                                setPasswordError(false);
                                setPasswordsDontMatch(false);
                                setLoading(false);
                            })
                        .catch((err) => {
                            setError(true);
                            setPasswordError(false);
                            setPasswordsDontMatch(false);
                            setLoading(false);
                        });
                }

            }).catch((err) => {
                setEmailError(true);
            })
    };

    const onLoad = (user) => {
        if (user) {
            window.location.href = '/home';
        } else {
            setVisible(true);
        }
    };

    useEffect(() => {
        const currentUser = UserService.getCurrentUser();
        if (currentUser) {
            UserService.validateAccessToken().then(status => {
                UserService.getUser(currentUser.id).then(user => {
                    if (user) {
                        window.location.href = '/home';
                    } else {
                        UserService.signout();
                    }
                }).catch(() => {
                    UserService.signout();
                });
            }).catch(() => {
                UserService.signout();
            });
        } else {
            setVisible(true);
        }
    }, []);

    return (
        <div>
            <Header />
            {visible &&
                <Paper className="UserService.signup-form UserService.signup-form-wrapper" elevation={10}>
                    <div className="UserService.signup">
                        <h1 className="UserService.signup-form-title"> {strings.SIGN_UP_HEADING} </h1>
                        <form onSubmit={handleSubmit}>
                            <div>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="full-name">{strings.FULL_NAME}</InputLabel>
                                    <Input
                                        id="full-name"
                                        type="text"
                                        value={fullName}
                                        name="FullName"
                                        required
                                        onChange={handleOnChangeFullName}
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="email">{strings.EMAIL}</InputLabel>
                                    <Input
                                        id="email"
                                        type="text"
                                        error={emailError}
                                        value={email}
                                        name="Email"
                                        onBlur={handleOnBlur}
                                        onChange={handleOnChangeEmail}
                                        autoComplete="Email"
                                        required
                                    />
                                    <FormHelperText error={emailError}>
                                        {emailError ? strings.INVALID_EMAIL : ''}
                                    </FormHelperText>
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="password">{strings.PASSWORD}</InputLabel>
                                    <Input
                                        id="password"
                                        value={password}
                                        name="Password"
                                        onChange={handleOnChangePassword}
                                        autoComplete="password"
                                        required
                                        type="password"
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="confirm-password">{strings.CONFIRM_PASSWORD}</InputLabel>
                                    <Input
                                        id="confirm-password"
                                        value={confirmPassword}
                                        name="ConfirmPassword"
                                        onChange={handleOnChangeConfirmPassword}
                                        autoComplete="password"
                                        required
                                        type="password"
                                    />
                                </FormControl>
                                <div className="UserService.signup-tos">
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <Checkbox
                                                        checked={tosChecked}
                                                        onChange={handleTosChange}
                                                        name="tosChecked"
                                                        color="primary"
                                                    />
                                                </td>
                                                <td>
                                                    <Link href="/tos" onClick={preventDefault}>{strings.TOS_SIGN_UP}</Link>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="buttons">
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        disabled={emailError || !tosChecked}
                                    >
                                        {strings.SIGN_UP}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="default"
                                        size="small"
                                        href="/sign-in"
                                    >
                                        {strings.CANCEL}
                                    </Button>
                                </div>
                            </div>
                            <div className="form-error">
                                {(passwordError || passwordsDontMatch || error) &&
                                    <div>
                                        {passwordError && <Error message={strings.ERROR_IN_PASSWORD} />}
                                        {passwordsDontMatch && <Error message={strings.PASSWORDS_DONT_MATCH} />}
                                        {error && <Error message={strings.ERROR_IN_SIGN_UP} />}
                                    </div>
                                }
                            </div>
                        </form>
                    </div>
                </Paper>
            }
            {loading && <Backdrop text={strings.PLEASE_WAIT} />}
        </div>
    );
};

export default SignUp;
import React, { useState } from 'react'
import { strings } from '../config/lang'
import { getUser, compare, resetPassword } from '../services/UserService'
import {
    Paper,
    FormControl,
    FormHelperText,
    InputLabel,
    Input,
    Button
} from '@mui/material'
import Error from '../components/Error'
import Master from '../components/Master'
import * as Helper from '../common/Helper'

const ResetPassword = () => {
    const [user, setUser] = useState()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState(false)
    const [passwordLengthError, setPasswordLengthError] = useState(false)
    const [currentPasswordError, setCurrentPasswordError] = useState(false)
    const [newPasswordRequiredError, setNewPasswordRequiredError] = useState(false)
    const [confirmPasswordError, setConfirmPasswordError] = useState(false)

    const handleCurrentPasswordChange = (e) => {
        setCurrentPassword(e.target.value)
    }

    const handleNewPasswordChange = (e) => {
        setNewPassword(e.target.value)
    }

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value)
    }

    const handleOnConfirmPasswordKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const passwordMatch = await compare(user._id, currentPassword)
        setCurrentPasswordError(!passwordMatch)

        if (passwordMatch) {
            if (newPassword.length === 0) {
                setNewPasswordRequiredError(true)
                setPasswordLengthError(false)
                setConfirmPasswordError(false)
                return
            } else {
                setNewPasswordRequiredError(false)
            }

            if (newPassword.length < 6) {
                setPasswordLengthError(true)
                setConfirmPasswordError(false)
                return
            } else {
                setPasswordLengthError(false)
            }

            if (newPassword !== confirmPassword) {
                setConfirmPasswordError(true)
                return
            } else {
                setConfirmPasswordError(false)
            }

            const data = {
                userId: user._id,
                password: currentPassword,
                newPassword: newPassword
            }

            resetPassword(data)
                .then(status => {
                    if (status === 200) {
                        getUser(user._id)
                            .then(user => {
                                setUser(user)
                                setCurrentPassword('')
                                setNewPassword('')
                                setConfirmPassword('')
                                Helper.info(strings.PASSWORD_UPDATE)
                            })
                            .catch(err => {
                                Helper.error(null, err)
                            })
                    } else {
                        setError(true)
                        Helper.error(strings.PASSWORD_UPDATE_ERROR)
                    }
                })
                .catch(err => {
                    setError(true)
                    Helper.error(strings.PASSWORD_UPDATE_ERROR, err)
                })
        }
    }

    const onLoad = (user) => {
        setUser(user)
    }

    return (
        <Master onLoad={onLoad} strict>
            <div className="password-reset content-taspr">
                <Paper className="password-reset-form password-reset-form-wrapper" elevation={10}>
                    <h1 className="password-reset-form-title"> {strings.SPASSWORD_RESET_HEADING} </h1>
                    <form className="form" onSubmit={handleSubmit}>
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
                                onChange={handleCurrentPasswordChange}
                                value={currentPassword}
                                error={currentPasswordError}
                                type="password"
                                required
                            />
                            <FormHelperText error={currentPasswordError}>
                                {(currentPasswordError && strings.CURRENT_PASSWORD_ERROR) || ''}
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
                                onChange={handleNewPasswordChange}
                                value={newPassword}
                                error={newPasswordRequiredError}
                                type="password"
                                required
                            />
                            <FormHelperText error={newPasswordRequiredError}>
                                {(newPasswordRequiredError && strings.NEW_PASSWORD_REQUIRED_ERROR) || ''}
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
                                onChange={handleConfirmPasswordChange}
                                onKeyDown={handleOnConfirmPasswordKeyDown}
                                value={confirmPassword}
                                error={confirmPasswordError || passwordLengthError}
                                type="password"
                                required
                            />
                            <FormHelperText error={confirmPasswordError || passwordLengthError}>
                                {(confirmPasswordError && strings.PASSWORDS_DONT_MATCH) || (passwordLengthError && strings.ERROR_IN_PASSWORD) || ''}
                            </FormHelperText>
                        </FormControl>
                        <div className="buttons">
                            <Button
                                type="submit"
                                variant="contained"
                                color="info"
                                size="small"
                            >
                                {strings.RESET_PASSWORD}
                            </Button>
                            <Button
                                variant="contained"
                                color="inherit"
                                size="small"
                                href="/home"
                            >
                                {strings.CANCEL}
                            </Button>
                        </div>
                        <div className="form-error">
                            {error && <Error message={strings.PASSWORD_UPDATE_ERROR} />}
                        </div>
                    </form>
                </Paper>
            </div>
        </Master>
    )
}

export default ResetPassword
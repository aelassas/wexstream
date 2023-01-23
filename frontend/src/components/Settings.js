import React, { useState } from 'react'
import { strings } from '../config/app.config'
import {
    updateEmailNotifications,
    updatePrivateMessages,
    updateUser,
    deleteUser,
    signout
} from '../services/UserService'
import {
    Button,
    FormControl,
    FormGroup,
    FormControlLabel,
    FormLabel,
    FormHelperText,
    Switch,
    Input,
    InputLabel,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material'
import Backdrop from '../elements/SimpleBackdrop'
import Avatar from '../elements/Avatar'
import validator from 'validator'
import Master from '../elements/Master'
import * as Helper from '../common/Helper'

const Settings = () => {
    const [user, setUser] = useState()
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [location, setLoaction] = useState('')
    const [website, setWebsite] = useState('')
    const [websiteError, setWebsiteError] = useState(false)
    const [enableEmailNotifications, setEnableEmailNotifications] = useState()
    const [enablePrivateMessages, setEnablePrivateMessages] = useState()
    const [openDialog, setOpenDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleOnChangeFullName = (e) => {
        setFullName(e.target.value)
    }

    const handleOnChangeBio = (e) => {
        setBio(e.target.value)
    }

    const handleOnChangeLocation = (e) => {
        setLoaction(e.target.value)
    }

    const handleOnChangeWebsite = (e) => {
        setWebsite(e.target.value)
    }

    const handleOnBlurWebsite = (e) => {
        const websiteError = e.target.value !== '' && !validator.isURL(e.target.value, { require_tld: true, require_protocol: false })
        setWebsiteError(websiteError)
    }

    const _openDialog = () => {
        setOpenDialog(true)
    }

    const _closeDialog = () => {
        setOpenDialog(false)
    }

    const deleteAccount = (e) => {
        e.preventDefault()
        _openDialog()
    }

    const handleCancelDelete = (e) => {
        _closeDialog()
    }

    const handleDelete = () => {
        _closeDialog()
        setDeleting(true)

        deleteUser(user._id)
            .then(status => {
                if (status === 200) {
                    signout()
                } else {
                    setDeleting(false)
                    Helper.error(strings.DELETE_ACCOUNT_ERROR)
                }
            })
            .catch((err) => {
                setDeleting(false)
                Helper.error(strings.DELETE_ACCOUNT_ERROR, err)
            })
    }

    const handleEmailNotificationsChange = (e) => {
        setEnableEmailNotifications(e.target.checked)
        user.enableEmailNotifications = e.target.checked

        updateEmailNotifications(user)
            .then(status => {
                if (status === 200) {
                    setUser(user)
                    Helper.info(strings.SETTING_UPDATED)
                } else {
                    setEnableEmailNotifications(!e.target.checked)
                    Helper.error()
                }
            })
            .catch((err) => {
                setEnableEmailNotifications(!e.target.checked)
                Helper.error(null, err)
            })
    }

    const handlePrivateMessagesChange = (e) => {
        setEnablePrivateMessages(e.target.checked)
        user.enablePrivateMessages = e.target.checked

        updatePrivateMessages(user)
            .then(status => {
                if (status === 200) {
                    setUser(user)
                    Helper.info(strings.SETTING_UPDATED)
                } else {
                    setEnablePrivateMessages(!e.target.checked)
                    Helper.error()
                }
            })
            .catch((err) => {
                setEnablePrivateMessages(!e.target.checked)
                Helper.error(null, err)
            })
    }

    const onBeforeUpload = () => {
        setLoading(true)
    }

    const onAvatarChange = (user) => {
        setLoading(false)
        setUser(Helper.clone(user))
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        const data = {
            email: user.email,
            fullName,
            bio,
            location,
            website
        }

        updateUser(data)
            .then(status => {
                if (status === 200) {
                    Helper.info(strings.USER_UPDATE)
                } else {
                    Helper.error(strings.USER_UPDATE_ERROR)
                }
            })
            .catch((err) => {
                Helper.error(strings.USER_UPDATE_ERROR, err)
            })
    }

    const onLoad = (user) => {
        setUser(user)
        setFullName(user.fullName)
        setBio(user.bio || '')
        setLoaction(user.location || '')
        setWebsite(user.website || '')
        setEnableEmailNotifications(user.enableEmailNotifications)
        setEnablePrivateMessages(user.enablePrivateMessages)
    }

    return (
        <Master user={user} onLoad={onLoad} strict>
            {
                user &&
                <div className="settings content-taspr">
                    <Paper className="profile-form profile-form-wrapper" elevation={10}>
                        <div>
                            <h1 className="profile-form-title"> {strings.PROFILE_SETTINGS} </h1>
                            <form onSubmit={handleSubmit}>
                                <Avatar loggedUser={user}
                                    user={user}
                                    size="large"
                                    readonly={false}
                                    onBeforeUpload={onBeforeUpload}
                                    onChange={onAvatarChange}
                                    color="disabled"
                                    className="profile-avatar-settings" />
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="full-name">{strings.FULL_NAME}</InputLabel>
                                    <Input
                                        id="full-name"
                                        type="text"
                                        value={fullName}
                                        name="FullName"
                                        onChange={handleOnChangeFullName}
                                        required
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="bio">{strings.BIO}</InputLabel>
                                    <Input
                                        id="bio"
                                        type="text"
                                        value={bio}
                                        name="Bio"
                                        multiline
                                        maxRows={3}
                                        inputProps={{ maxLength: 100 }}
                                        onChange={handleOnChangeBio}
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="location">{strings.LOCATION}</InputLabel>
                                    <Input
                                        id="location"
                                        type="text"
                                        value={location}
                                        name="Location"
                                        onChange={handleOnChangeLocation}
                                    />
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="website">{strings.WEBSITE}</InputLabel>
                                    <Input
                                        id="website"
                                        type="text"
                                        value={website}
                                        name="Website"
                                        onChange={handleOnChangeWebsite}
                                        onBlur={handleOnBlurWebsite}
                                        error={websiteError}
                                    />
                                    <FormHelperText error={websiteError}>
                                        {(websiteError && strings.INVALID_URL) || ''}
                                    </FormHelperText>
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel htmlFor="email">{strings.EMAIL}</InputLabel>
                                    <Input
                                        id="email"
                                        type="text"
                                        name="Email"
                                        autoComplete="Email"
                                        disabled
                                        value={user.email}
                                    />
                                </FormControl>
                                <div className="buttons">
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
                                    <Button onClick={handleCancelDelete} color="default">{strings.CANCEL}</Button>
                                    <Button onClick={handleDelete} color="secondary">{strings.DELETE_ACCOUNT}</Button>
                                </DialogActions>
                            </Dialog>
                        </div>
                    </Paper>
                    <Paper className="net-settings-form net-settings-form-wrapper" elevation={10}>
                        <div className="net-settings-ctn">
                            <h1 className="net-settings-form-title"> {strings.NETWORK_SETTINGS} </h1>
                            <FormControl component="fieldset">
                                <FormGroup>
                                    <FormControlLabel
                                        control={<Switch checked={enableEmailNotifications} onChange={handleEmailNotificationsChange} name="emailNotifications" color="primary" />}
                                        label={strings.SETTINGS_EMAIL_NOTIFICATIONS}
                                    />
                                    <FormControlLabel
                                        control={<Switch checked={enablePrivateMessages} onChange={handlePrivateMessagesChange} name="privateMessages" color="primary" />}
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
                                        onClick={deleteAccount}> {strings.DELETE_ACCOUNT}
                                    </Button>
                                </FormGroup>
                            </FormControl>
                        </div>
                    </Paper>
                    {(loading || deleting) && <Backdrop text={strings.PLEASE_WAIT} />}
                </div>
            }
        </Master>
    )
}

export default Settings
import React, { useState, useEffect } from 'react'
import { strings } from '../config/lang'
import { getLanguage, searchUsers, getUserById } from '../services/UserService'
import { TextField, Button } from "@mui/material"
import MultipleSelect from "./MultipleSelect"
import { toast } from 'react-toastify'
import { sendMessage } from '../services/MessageService'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import CloseIcon from '@mui/icons-material/Close'
import Slide from '@mui/material/Slide'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { PAGE_FETCH_OFFSET } from '../config/env'

const classes = {
    appBar: {
        position: 'relative',
    },
    title: theme => ({
        marginLeft: theme.spacing(2),
        flex: 1,
    })
}

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />
})

const MessageForm = (props) => {
    const [isSignedIn, setIsSignedIn] = useState(false)
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState([])
    const [to, setTo] = useState([])
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [page, setPage] = useState(1)
    const [fetch, setFetch] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [init, setInit] = useState(false)
    const [keyword, setKeyword] = useState('')

    const handleSubject = (event) => {
        setSubject(event.target.value)
    }

    const handleBody = (event) => {
        setBody(event.target.value)
    }

    const handleTo = (to, key, reference) => {
        setTo(to)
        setKeyword('')
    }

    const handleNewMessage = () => {
        setOpen(true)
    }

    const handleClose = (e) => {
        setTo([])
        setOpen(false)
        if (props.onClose) {
            props.onClose(e)
        }
    }

    const handleSend = (event) => {
        event.preventDefault()

        const data = {
            from: props.user,
            to: to,
            subject: subject,
            body: body
        }

        if (to.length > 0) {
            sendMessage(data)
                .then(status => {
                    if (status === 200) {
                        toast(strings.MESSAGE_SENT, { type: 'info' })
                        handleClose(event)
                    } else {
                        toast(strings.GENERIC_ERROR, { type: 'error' })
                    }
                })
                .catch(err => {
                    toast(strings.GENERIC_ERROR, { type: 'error' })
                })
        } else {
            toast(strings.GENERIC_ERROR, { type: 'error' })
        }
    }

    useEffect(() => {
        if (!init) {
            const language = getLanguage()
            strings.setLanguage(language)

            if (props.user) {
                setIsSignedIn(true)

                if (props.to) {
                    getUserById(props.to)
                        .then(to => {
                            if (to) {
                                setTo([to])
                            }
                        })
                        .catch(err => {
                            toast(strings.GENERIC_ERROR, { type: 'error' })
                        })
                }
            }
        }
    }, [props.user, props.open, props.to, keyword, page, init])

    return (
        isSignedIn
            ?
            <div className="message-form">
                {props.hideButton
                    ? null
                    : <Button variant="contained" color="primary" onClick={handleNewMessage}>
                        {strings.NEW_MESSAGE}
                    </Button>
                }
                <Dialog fullScreen open={props.open || open} onClose={handleClose} aria-labelledby="message-form-dialog" TransitionComponent={Transition}>
                    <AppBar sx={classes.appBar}>
                        <Toolbar>
                            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                                <CloseIcon />
                            </IconButton>
                            <Typography variant="h6" sx={classes.title}>
                                {strings.NEW_MESSAGE}
                            </Typography>
                        </Toolbar>
                    </AppBar>
                    <DialogContent>
                        <form autoComplete="off" onSubmit={handleSend} className="message-frm">
                            <MultipleSelect
                                loading={isLoading}
                                label={strings.TO}
                                selectedUsers={to}
                                callbackFromMultipleSelect={handleTo}
                                options={users}
                                required
                                ListboxProps={{
                                    onScroll: (event) => {
                                        const listboxNode = event.currentTarget
                                        if (fetch && !isLoading && (listboxNode.scrollTop + listboxNode.clientHeight >= (listboxNode.scrollHeight - PAGE_FETCH_OFFSET))) {
                                            const p = page + 1
                                            setIsLoading(true)
                                            searchUsers(props.user._id, keyword, true, p)
                                                .then(data => {
                                                    const _users = [...users, ...data]
                                                    setUsers(_users)
                                                    setIsLoading(false)
                                                    setFetch(data.length > 0)
                                                    setPage(p)
                                                })
                                                .catch(err => {
                                                    toast(strings.GENERIC_ERROR, { type: 'error' })
                                                })
                                        }
                                    }
                                }}
                                onFocus={
                                    (event) => {
                                        if (!init) {
                                            setUsers([])
                                            const p = 1
                                            setIsLoading(true)
                                            searchUsers(props.user._id, keyword, true, p)
                                                .then(users => {
                                                    setUsers(users)
                                                    setIsLoading(false)
                                                    setFetch(users.length > 0)
                                                    setPage(p)
                                                    setInit(true)
                                                })
                                                .catch(err => {
                                                    toast(strings.GENERIC_ERROR, { type: 'error' })
                                                })
                                        }
                                    }
                                }
                                onInputChange={
                                    (event) => {
                                        const value = (event && event.target ? event.target.value : null) || ''

                                        if (value !== keyword) {
                                            setUsers([])
                                            setKeyword(value)

                                            const p = 1
                                            setIsLoading(true)
                                            searchUsers(props.user._id, value, true, p)
                                                .then(users => {
                                                    setUsers(users)
                                                    setIsLoading(false)
                                                    setFetch(users.length > 0)
                                                    setPage(p)
                                                })
                                                .catch(err => {
                                                    toast(strings.GENERIC_ERROR, { type: 'error' })
                                                })
                                        }
                                    }
                                }
                                onClear={
                                    (event) => {
                                        setUsers([])

                                        const p = 1
                                        setIsLoading(true)
                                        setKeyword('')
                                        searchUsers(props.user._id, '', true, p)
                                            .then(users => {
                                                setUsers(users)
                                                setIsLoading(false)
                                                setFetch(users.length > 0)
                                                setPage(p)
                                            })
                                            .catch(err => {
                                                toast(strings.GENERIC_ERROR, { type: 'error' })
                                            })
                                    }
                                }
                            />
                            <TextField
                                onChange={handleSubject}
                                name="subject"
                                label={strings.MESSAGE_SUBJECT}
                                fullWidth
                                autoComplete="off"
                                required
                                className="msg-input"
                            />
                            <TextField
                                onChange={handleBody}
                                name="body"
                                label={strings.MESSAGE_BODY}
                                multiline
                                rows={15}
                                fullWidth
                                required
                                className="msg-input"
                            />
                            <div className="message-form-actions">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                >
                                    {strings.SEND}
                                </Button>
                                <Button
                                    variant="contained"
                                    color="default"
                                    onClick={handleClose}
                                    className="message-form-cancel"
                                >
                                    {strings.CANCEL}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            :
            null
    )
}

export default MessageForm
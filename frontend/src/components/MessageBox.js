import React, { useState, useEffect } from 'react'
import { strings } from '../config/lang'
import { getLanguage } from '../services/UserService'
import { TextField } from "@mui/material"
import TextareaAutosize from '@mui/material/TextareaAutosize'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import CloseIcon from '@mui/icons-material/Close'
import Slide from '@mui/material/Slide'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import { useNavigate } from 'react-router-dom'

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

const MessageBox = (props) => {
    const navigate = useNavigate()
    const [isSignedIn, setIsSignedIn] = useState(false)

    const handleClose = (e) => {
        if (props.onClose) {
            props.onClose(e)
        }
    }

    const handleFromClick = (event) => {
        const id = event.currentTarget.getAttribute('data-id')
        navigate(`/profile?u=${id}`)
    }

    const handleFromMouseDown = (event) => {
        if (event.button === 1) {
            const id = event.currentTarget.getAttribute('data-id')
            window.open(`/profile?u=${id}`, '_blank').focus()
        }
    }

    useEffect(() => {
        const language = getLanguage()
        strings.setLanguage(language)

        if (props.user) {
            setIsSignedIn(true)
        }
    }, [props.user])

    return (
        isSignedIn && props.message
            ?
            <div>
                <Dialog fullScreen open={props.open} onClose={handleClose} aria-labelledby="message-box-dialog" TransitionComponent={Transition}>
                    <AppBar sx={classes.appBar}>
                        <Toolbar>
                            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                                <CloseIcon />
                            </IconButton>
                        </Toolbar>
                    </AppBar>
                    <DialogContent>
                        <TextField
                            name="from"
                            label={strings.FROM}
                            fullWidth
                            autoComplete="none"
                            InputProps={{
                                readOnly: true,
                            }}
                            className="message-box-from"
                            value={props.message.from.fullName}
                            data-id={props.message.from._id}
                            onClick={handleFromClick}
                            onMouseDown={handleFromMouseDown}
                        />
                        <TextField
                            name="subject"
                            label={strings.MESSAGE_SUBJECT}
                            fullWidth
                            autoComplete="none"
                            InputProps={{
                                readOnly: true,
                            }}
                            className="message-box-subject"
                            value={props.message.subject}
                        />
                        <TextareaAutosize
                            name="body"
                            label={strings.MESSAGE_BODY}
                            className="message-box-body"
                            value={props.message.body}
                        />
                    </DialogContent>
                </Dialog>
            </div>
            :
            null
    )
}

export default MessageBox
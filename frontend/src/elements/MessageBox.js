import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { strings } from '../config/app.config';
import { getLanguage } from '../services/UserService';
import { TextField } from "@material-ui/core";
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';

const useStyles = makeStyles((theme) => ({
    appBar: {
        position: 'relative',
    },
    title: {
        marginLeft: theme.spacing(2),
        flex: 1,
    },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export const MessageBox = (props) => {
    const classes = useStyles();
    const [isSignedIn, setIsSignedIn] = useState(false);

    const handleClose = (e) => {
        if (props.onClose) {
            props.onClose(e);
        }
    };

    const handleFromClick = (event) => {
        const id = event.currentTarget.getAttribute('data-id');
        window.location.href = `/profile?u=${id}`;
    };

    const handleFromMouseDown = (event) => {
        if (event.button === 1) {
            const id = event.currentTarget.getAttribute('data-id');
            window.open(`/profile?u=${id}`, '_blank').focus();
        }
    }

    useEffect(() => {
        const language = getLanguage();
        strings.setLanguage(language);

        if (props.user) {
            setIsSignedIn(true);
        }
    }, [props.user]);

    return (
        isSignedIn && props.message
            ?
            <div>
                <Dialog fullScreen open={props.open} onClose={handleClose} aria-labelledby="message-box-dialog" TransitionComponent={Transition}>
                    <AppBar className={classes.appBar}>
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
    );
};

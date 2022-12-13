import React, { useState } from 'react';
import { strings } from '../config/app.config';
import { getLanguage } from '../services/UserService';
import { getMessages, markMessageAsRead, markMessageAsUnread, deleteMessage, getMessageCounter, getMessageId } from '../services/MessageService';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Backdrop from '../elements/SimpleBackdrop';
import Delete from '@mui/icons-material/Delete';
import { IconButton } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import UnreadIcon from '@mui/icons-material/Email';
import ReadIcon from '@mui/icons-material/Drafts';
import { MessageForm } from '../elements/MessageForm';
import { MessageBox } from '../elements/MessageBox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import { MESSAGES_TOP_OFFSET, PAGE_FETCH_OFFSET } from '../config/env.config';
import * as Helper from '../common/Helper';
import Master from '../elements/Master';

const Messages = () => {
    const [user, setUser] = useState();
    const [messages, setMessages] = useState([]);
    const [messagesCount, setMessagesCount] = useState();
    const [selectedMessage, setSelectedMessage] = useState();
    const [openMessageBox, setOpenMessageBox] = useState();
    const [messageId, setMessageId] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [fetch, setFetch] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);

    const handleMessageClick = (event, msgId) => {
        if (event) {
            event.preventDefault();
        }

        const messageId = msgId || event.currentTarget.getAttribute('data-id');
        const message = _messages.find(msg => msg._id === messageId);
        const _messages = [...messages]; // Make a shallow copy of messages
        if (!message.isRead) {
            markMessageAsRead(message._id)
                .then(status => {
                    if (status === 200) {
                        getMessageCounter(user._id)
                            .then(messageCounter => {
                                const index = findIndex(message._id);
                                // Make a shallow copy of the message to mutate
                                const msg = { ..._messages[index] };
                                // Update message
                                msg.isRead = true;
                                // Put it back into messages array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                _messages[index] = msg;
                                // Set the state to our new copy
                                setMessages(_messages);
                                setSelectedMessage(message);
                                setOpenMessageBox(true);
                                setMessagesCount(messageCounter.count);
                            })
                            .catch(err => {
                                Helper.error(err);
                            });
                    }
                })
                .catch(err => {
                    Helper.error(err);
                });
        } else {
            setSelectedMessage(message);
            setOpenMessageBox(true);
        }
    };

    const handleCloseMessageBox = (e) => {
        e.preventDefault();
        setOpenMessageBox(false);
        const messageId = getMessageId();
        if (messageId !== '') {
            window.history.pushState({}, null, '/messages');
        }
    };

    const findIndex = (messageId) => (
        messages.findIndex(msg => msg._id === messageId)
    );

    const handleDeleteMessage = (e) => {
        e.preventDefault();
        const messageId = e.currentTarget.getAttribute('data-id');
        setMessageId(messageId);
        setOpenDialog(true);
    };

    const handleDelete = (e) => {
        e.preventDefault();

        const _messages = [...messages]; // Make a shallow copy of messages
        deleteMessage(messageId)
            .then(status => {
                if (status === 200) {
                    const index = findIndex(messageId);
                    const message = _messages[index];
                    _messages.splice(index, 1);
                    setMessages(_messages);

                    if (!message.isRead) {
                        getMessageCounter(user._id)
                            .then(messageCounter => {
                                closeDialog();
                                setMessagesCount(messageCounter.count);
                            })
                            .catch(err => {
                                closeDialog();
                                Helper.error();
                            });
                    } else {
                        closeDialog();
                    }
                } else {
                    closeDialog();
                    Helper.error();
                }
            })
            .catch(err => {
                closeDialog();
                Helper.error(err);
            });
    };

    const closeDialog = () => {
        setOpenDialog(false);
    };

    const handleMarkAsRead = (e) => {
        e.preventDefault();

        const messageId = e.currentTarget.getAttribute('data-id');
        const _messages = [...messages]; // Make a shallow copy of messages

        markMessageAsRead(messageId)
            .then(status => {
                if (status === 200) {
                    getMessageCounter(user._id)
                        .then(messageCounter => {
                            const index = findIndex(messageId);
                            // Make a shallow copy of the message to mutate
                            const msg = { ..._messages[index] };
                            // Update message
                            msg.isRead = true;
                            // Put it back into messages array. N.B. we *are* mutating the array here, but that's why we made a copy first
                            _messages[index] = msg;
                            // Set the state to our new copy
                            setMessages(_messages);
                            setMessagesCount(messageCounter.count);
                        })
                        .catch(err => {
                            Helper.error();
                        });
                } else {
                    Helper.error();
                }
            })
            .catch(err => {
                Helper.error(err);
            });
    };

    const handleMarkAsUnread = (e) => {
        e.preventDefault();

        const messageId = e.currentTarget.getAttribute('data-id');
        const _messages = [...messages]; // Make a shallow copy of messages

        markMessageAsUnread(messageId)
            .then(status => {
                if (status === 200) {
                    getMessageCounter(user._id)
                        .then(messageCounter => {
                            const index = findIndex(messageId);
                            // Make a shallow copy of the message to mutate
                            const msg = { ..._messages[index] };
                            // Update message
                            msg.isRead = false;
                            // Put it back into messages array. N.B. we *are* mutating the array here, but that's why we made a copy first
                            _messages[index] = msg;
                            // Set the state to our new copy
                            setMessages(_messages);
                            setMessagesCount(messageCounter.count);
                        })
                        .catch(err => {
                            Helper.error(err);
                        });
                } else {
                    Helper.error();
                }
            })
            .catch(err => {
                Helper.error(err);
            });
    };

    const handleCancelDelete = (e) => {
        closeDialog();
    };

    const fetchMessages = (page, onFetch) => {
        setLoading(true);

        getMessages(user._id, page)
            .then(data => {
                const _messages = [...messages, ...data];
                setMessages(_messages);
                setFetch(data.length > 0);
                if (onFetch) {
                    onFetch();
                }
                setLoading(false);
            })
            .catch(err => {
                Helper.error(err);
            });
    };

    const onLoad = (user) => {
        const language = getLanguage();
        moment.locale(language);
        setUser(user);

        fetchMessages(page, () => {
            const messageId = getMessageId();
            if (messageId !== '') {
                handleMessageClick(null, messageId);
            }
            setFirstLoad(false);
        });

        const ul = document.querySelector('.message-items');
        if (ul) {
            ul.onscroll = (event) => {
                if (fetch && !loading && (((window.innerHeight - MESSAGES_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                    const _page = page + 1;
                    setPage(_page);
                    fetchMessages(_page);
                }
            };
        }
    };

    return (
        <Master onLoad={onLoad} messagesCount={messagesCount} strict>
            <div className="messages content">
                <div className="message-form-ctn">
                    <MessageForm user={user} hideButton={firstLoad} />
                </div>
                {(!loading && messages.length === 0) &&
                    <Card variant="outlined" className="no-message-ctn">
                        <CardContent>
                            <Typography color="textSecondary">
                                {strings.NO_MESSAGE}
                            </Typography>
                        </CardContent>
                    </Card>
                }
                <List className="message-items">
                    {
                        messages.map((message, i) =>
                        (
                            <ListItem key={message._id} className={"message-item " + (message.isRead ? "message-read" : "message-unread")} >
                                <ListItemAvatar>
                                    <Avatar>
                                        {message.isRead ? <ReadIcon /> : <UnreadIcon />}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={message.from.fullName}
                                    secondary={
                                        <span>
                                            <span>{message.subject}</span>
                                            <br />
                                            <span>{moment(message.createdAt).format(process.env.REACT_APP_WS_DATE_FORMAT)}</span>
                                        </span>
                                    }
                                    data-id={message._id}
                                    onClick={handleMessageClick}
                                >
                                </ListItemText>
                                {!message.isRead
                                    ?
                                    <Tooltip title={strings.MARK_AS_READ}>
                                        <IconButton
                                            color="default"
                                            data-id={message._id}
                                            onClick={handleMarkAsRead}
                                        >
                                            <ReadIcon />
                                        </IconButton>
                                    </Tooltip>
                                    :
                                    <Tooltip title={strings.MARK_AS_UNREAD}>
                                        <IconButton
                                            color="default"
                                            data-id={message._id}
                                            onClick={handleMarkAsUnread}
                                        >
                                            <UnreadIcon />
                                        </IconButton>
                                    </Tooltip>
                                }
                                <Tooltip title={strings.DELETE}>
                                    <IconButton
                                        color="secondary"
                                        data-id={message._id}
                                        onClick={handleDeleteMessage}
                                    >
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </ListItem>
                        ))
                    }
                </List>
            </div>
            <MessageBox user={user} message={selectedMessage} open={openMessageBox} onClose={handleCloseMessageBox} />
            <Dialog
                disableEscapeKeyDown
                maxWidth="xs"
                open={openDialog}
            >
                <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                <DialogContent>{strings.DELETE_MESSAGE_CONFIRM}</DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="default">{strings.CANCEL}</Button>
                    <Button onClick={handleDelete} color="secondary">{strings.DELETE}</Button>
                </DialogActions>
            </Dialog>
            {loading && <Backdrop text={strings.LOADING} />}
        </Master>
    );
}

export default Messages;
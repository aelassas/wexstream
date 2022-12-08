import React, { Component } from 'react';
import { strings } from '../config/app.config';
import Header from './Header';
import { toast } from 'react-toastify';
import { getLanguage, getUser, validateAccessToken, resendLink, getCurrentUser, signout, getQueryLanguage } from '../services/UserService';
import { getMessages, markMessageAsRead, markMessageAsUnread, deleteMessage, getMessageCounter, getMessageId } from '../services/MessageService';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Backdrop from './SimpleBackdrop';
import Delete from '@material-ui/icons/Delete';
import { IconButton } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import UnreadIcon from '@material-ui/icons/Email';
import ReadIcon from '@material-ui/icons/Drafts';
import { MessageForm } from './MessageForm';
import { MessageBox } from './MessageBox';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Tooltip from '@material-ui/core/Tooltip';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import { MESSAGES_TOP_OFFSET, PAGE_FETCH_OFFSET, LANGUAGES } from '../config/env.config';
import { renderReactDom } from '../common/helper';

class Messages extends Component {

    constructor(props) {
        super(props);

        this.state = {
            user: null,
            messages: [],
            messagesCount: undefined,
            selectedMessage: null,
            openMessageBox: false,
            isAuthenticating: true,
            isTokenValidated: false,
            isVerified: false,
            messageId: '',
            openDialog: false,
            isLoading: true,
            page: 1,
            fetch: false,
            firstLoad: true
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

    handleMessageClick = (event, msgId) => {
        if (event) {
            event.preventDefault();
        }

        const messageId = msgId || event.currentTarget.getAttribute('data-id');
        const { user } = this.state;
        const message = this.state.messages.find(msg => msg._id === messageId);
        const messages = [...this.state.messages]; // Make a shallow copy of messages
        if (!message.isRead) {
            markMessageAsRead(message._id)
                .then(status => {
                    if (status === 200) {
                        getMessageCounter(user._id)
                            .then(messageCounter => {
                                const index = this.findIndex(message._id);
                                // Make a shallow copy of the message to mutate
                                const msg = { ...messages[index] };
                                // Update message
                                msg.isRead = true;
                                // Put it back into messages array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                messages[index] = msg;
                                // Set the state to our new copy
                                this.setState({ messages, selectedMessage: message, openMessageBox: true, messagesCount: messageCounter.count });
                            })
                            .catch(err => {
                                toast(strings.GENERIC_ERROR, { type: 'error' });
                            });
                    }
                })
                .catch(err => {
                    toast(strings.GENERIC_ERROR, { type: 'error' });
                });
        } else {
            this.setState({ selectedMessage: message, openMessageBox: true });
        }
    };

    handleCloseMessageBox = (e) => {
        e.preventDefault();
        this.setState({ openMessageBox: false });
        const messageId = getMessageId();
        if (messageId !== '') {
            window.history.pushState({}, null, '/messages');
        }
    };

    findIndex = (messageId) => (this.state.messages.findIndex(msg => msg._id === messageId));

    openDialog = () => {
        this.setState({ openDialog: true });
    };

    handleDeleteMessage = (e) => {
        e.preventDefault();
        const messageId = e.currentTarget.getAttribute('data-id');
        this.setState({ messageId });
        this.openDialog();
    };

    handleDelete = (e) => {
        e.preventDefault();

        const { messageId } = this.state;
        const messages = [...this.state.messages]; // Make a shallow copy of messages
        deleteMessage(messageId)
            .then(status => {
                if (status === 200) {
                    const { user } = this.state;
                    const index = this.findIndex(messageId);
                    const message = messages[index];
                    messages.splice(index, 1);
                    this.setState({ messages });

                    if (!message.isRead) {
                        getMessageCounter(user._id)
                            .then(messageCounter => {
                                this.closeDialog();
                                this.setState({ messagesCount: messageCounter.count });
                            })
                            .catch(err => {
                                this.closeDialog();
                                toast(strings.GENERIC_ERROR, { type: 'error' });
                            });
                    } else {
                        this.closeDialog();
                    }
                } else {
                    this.closeDialog();
                    toast(strings.GENERIC_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                this.closeDialog();
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
    };

    closeDialog = () => {
        this.setState({ openDialog: false });
    };

    handleMarkAsRead = (e) => {
        e.preventDefault();

        const messageId = e.currentTarget.getAttribute('data-id');
        const messages = [...this.state.messages]; // Make a shallow copy of messages

        markMessageAsRead(messageId)
            .then(status => {
                if (status === 200) {
                    const { user } = this.state;

                    getMessageCounter(user._id)
                        .then(messageCounter => {
                            const index = this.findIndex(messageId);
                            // Make a shallow copy of the message to mutate
                            const msg = { ...messages[index] };
                            // Update message
                            msg.isRead = true;
                            // Put it back into messages array. N.B. we *are* mutating the array here, but that's why we made a copy first
                            messages[index] = msg;
                            // Set the state to our new copy
                            this.setState({ messages, messagesCount: messageCounter.count });
                        })
                        .catch(err => {
                            toast(strings.GENERIC_ERROR, { type: 'error' });
                        });
                } else {
                    toast(strings.GENERIC_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
    };

    handleMarkAsUnread = (e) => {
        e.preventDefault();

        const messageId = e.currentTarget.getAttribute('data-id');
        const messages = [...this.state.messages]; // Make a shallow copy of messages

        markMessageAsUnread(messageId)
            .then(status => {
                if (status === 200) {
                    const { user } = this.state;

                    getMessageCounter(user._id)
                        .then(messageCounter => {
                            const index = this.findIndex(messageId);
                            // Make a shallow copy of the message to mutate
                            const msg = { ...messages[index] };
                            // Update message
                            msg.isRead = false;
                            // Put it back into messages array. N.B. we *are* mutating the array here, but that's why we made a copy first
                            messages[index] = msg;
                            // Set the state to our new copy
                            this.setState({ messages });
                            this.setState({ messages, messagesCount: messageCounter.count });
                        })
                        .catch(err => {
                            toast(strings.GENERIC_ERROR, { type: 'error' });
                        });
                } else {
                    toast(strings.GENERIC_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
    };

    handleCancelDelete = (e) => {
        this.closeDialog();
    };

    fetchMessages = (onFetch) => {
        const { user, page } = this.state;
        this.setState({ isLoading: true });

        getMessages(user._id, page)
            .then(data => {
                const messages = [...this.state.messages, ...data];
                this.setState({ messages, isLoading: false, fetch: data.length > 0 });
                if (onFetch) {
                    onFetch();
                }
            })
            .catch(err => {
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
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

                        if (user.isBlacklisted) {
                            signout();
                            return;
                        }

                        moment.locale(language);
                        this.setState({ user, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated: status === 200 });
                        this.fetchMessages(() => {
                            const messageId = getMessageId();
                            if (messageId !== '') {
                                this.handleMessageClick(null, messageId);
                            }
                            this.setState({ firstLoad: false });
                        });

                        const ul = document.querySelector('.message-items');
                        if (ul) {
                            ul.onscroll = (event) => {
                                if (this.state.fetch && !this.state.isLoading && (((window.innerHeight - MESSAGES_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                                    this.setState({ page: this.state.page + 1 }, () => {
                                        this.fetchMessages();
                                    });
                                }
                            };
                        }
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
                const { isVerified, messages, messagesCount, selectedMessage, openMessageBox, openDialog, user, isLoading, firstLoad } = this.state;
                return renderReactDom(
                    <div>
                        <Header user={user} messagesCount={messagesCount} />
                        {isVerified ? (
                            <div className="messages content">
                                <div className="message-form-ctn">
                                    <MessageForm user={user} hideButton={firstLoad} />
                                </div>
                                {(!isLoading && messages.length === 0) &&
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
                                                    onClick={this.handleMessageClick}
                                                >
                                                </ListItemText>
                                                {!message.isRead
                                                    ?
                                                    <Tooltip title={strings.MARK_AS_READ}>
                                                        <IconButton
                                                            color="default"
                                                            data-id={message._id}
                                                            onClick={this.handleMarkAsRead}
                                                        >
                                                            <ReadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    :
                                                    <Tooltip title={strings.MARK_AS_UNREAD}>
                                                        <IconButton
                                                            color="default"
                                                            data-id={message._id}
                                                            onClick={this.handleMarkAsUnread}
                                                        >
                                                            <UnreadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                                <Tooltip title={strings.DELETE}>
                                                    <IconButton
                                                        color="secondary"
                                                        data-id={message._id}
                                                        onClick={this.handleDeleteMessage}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            </ListItem>
                                        ))
                                    }
                                </List>
                                <MessageBox user={user} message={selectedMessage} open={openMessageBox} onClose={this.handleCloseMessageBox} />
                                <Dialog
                                    disableEscapeKeyDown
                                    maxWidth="xs"
                                    open={openDialog}
                                >
                                    <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                                    <DialogContent>{strings.DELETE_MESSAGE_CONFIRM}</DialogContent>
                                    <DialogActions>
                                        <Button onClick={this.handleCancelDelete} color="default">{strings.CANCEL}</Button>
                                        <Button onClick={this.handleDelete} color="secondary">{strings.DELETE}</Button>
                                    </DialogActions>
                                </Dialog>
                                {isLoading && <Backdrop text={strings.LOADING} />}
                            </div>
                        ) :
                            <div className="validate-email">
                                <span>{strings.VALIDATE_EMAIL}</span>
                                <Button
                                    type="button"
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    className="btn-resend"
                                    onClick={this.handleResend}
                                >{strings.RESEND}</Button>
                            </div>
                        }
                    </div >
                );
            } else {
                signout();
                return null;
            }
        } else {
            return renderReactDom(<Backdrop text={strings.AUTHENTICATING} />);
        }
    }
}

export default Messages;
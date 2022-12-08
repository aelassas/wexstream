import React, { Component } from 'react';
import { strings } from '../config/app.config';
import Header from './Header';
import { toast } from 'react-toastify';
import { getLanguage, getUser, validateAccessToken, resendLink, getCurrentUser, signout, getQueryLanguage } from '../services/UserService';
import {
    notify, getNotifications, getNotificationCounter, deleteNotification, approve, decline,
    markAsRead, markAsUnread, markAllAsRead, deleteNotifications
} from '../services/NotificationService';
import { getConnectionById } from '../services/ConnectionService';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import Info from '@material-ui/icons/Info';
import Backdrop from './SimpleBackdrop';
import DeleteIcon from '@material-ui/icons/Delete';
import ReadIcon from '@material-ui/icons/Drafts';
import UnreadIcon from '@material-ui/icons/Email';
import { IconButton } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import Link from '@material-ui/core/Link';
import Tooltip from '@material-ui/core/Tooltip';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@material-ui/core';
import {
    ThumbUp,
    ThumbDown,
} from '@material-ui/icons';
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET, LANGUAGES } from '../config/env.config';
import { renderReactDom } from '../common/helper';

class Notifications extends Component {

    constructor(props) {
        super(props);

        this.state = {
            user: null,
            notifications: [],
            notificationsCount: undefined,
            isAuthenticating: true,
            isTokenValidated: false,
            isVerified: false,
            isLoading: false,
            openDeclineDialog: false,
            declineTarget: null,
            page: 1,
            fetch: false,
            openDeleteDialog: false
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

    findIndex = (notificationId) => (this.state.notifications.findIndex(n => n._id === notificationId));

    handleApprove = (e) => {
        const notificationId = e.currentTarget.getAttribute('data-id');
        const connId = e.currentTarget.getAttribute('data-conn-id');

        approve(notificationId)
            .then(status => {
                if (status === 200) {
                    getConnectionById(connId)
                        .then(conn => {
                            if (conn) {
                                const { user } = this.state;
                                const notification = {
                                    user: conn.user,
                                    isRequest: false,
                                    message: strings.CONNECTION_APPROVE_NOTIFICATION + ' ' + user.fullName + '.',
                                    isLink: true,
                                    senderUser: user._id,
                                    link: `${window.location.origin}/profile?u=${user._id}`
                                };
                                notify(notification)
                                    .then(notificationStatus => {
                                        if (notificationStatus === 200) {
                                            getNotificationCounter(user._id)
                                                .then(notificationCounter => {
                                                    const notifications = [...this.state.notifications];
                                                    const index = this.findIndex(notificationId);
                                                    const notification = { ...notifications[index] };
                                                    notification.isRead = true;
                                                    notification.isConnected = true;
                                                    notification.isDeclined = false;
                                                    notifications[index] = notification;

                                                    this.setState({ notifications, notificationsCount: notificationCounter.count });
                                                    toast(strings.CONNECTION_APPROVE, { type: 'info' });
                                                })
                                                .catch(err => {
                                                    toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                                                });
                                        } else {
                                            toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                                        }
                                    })
                                    .catch(err => {
                                        toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                                    });
                            }
                            else {
                                toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                            }
                        })
                        .catch(err => {
                            toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                        });
                } else {
                    toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
            });
    };

    handleCancelDecline = (e) => {
        this.setState({ openDeclineDialog: false });
    };

    handleDecline = (e) => {
        this.setState({ declineTarget: e.currentTarget, openDeclineDialog: true });
    };

    handleConfirmDecline = (e) => {
        const { declineTarget } = this.state;
        const notificationId = declineTarget.getAttribute('data-id');
        const connId = declineTarget.getAttribute('data-conn-id');

        getConnectionById(connId)
            .then(conn => {
                if (conn) {
                    decline(notificationId)
                        .then(status => {
                            if (status === 200) {
                                const { user } = this.state;
                                const notification = {
                                    user: conn.user,
                                    isRequest: false,
                                    message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                    isLink: true,
                                    senderUser: user._id,
                                    link: `${window.location.origin}/profile?u=${user._id}`
                                };
                                notify(notification)
                                    .then(notificationStatus => {
                                        if (notificationStatus === 200) {
                                            const notifications = [...this.state.notifications];
                                            const index = this.findIndex(notificationId);
                                            const notification = { ...notifications[index] };
                                            notification.isRead = true;
                                            notification.isConnected = false;
                                            notification.isDeclined = true;
                                            notifications[index] = notification;

                                            this.setState({ notifications, openDeclineDialog: false });

                                            getNotificationCounter(user._id)
                                                .then(notificationCounter => {
                                                    this.setState({ notificationsCount: notificationCounter.count });

                                                    toast(strings.CONNECTION_DECLINE, { type: 'info' });
                                                })
                                                .catch(err => {
                                                    toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
                                                });
                                        }
                                        else {
                                            toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
                                        }
                                    })
                                    .catch(err => {
                                        toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
                                    });
                            } else {
                                toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
                            }
                        })
                        .catch(err => {
                            toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
                        });

                } else {
                    toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
            });
    };

    handleMarkAsRead = (e) => {
        const notificationId = e.currentTarget.getAttribute('data-id');

        markAsRead(notificationId)
            .then(status => {
                if (status === 200) {
                    const { user } = this.state;
                    getNotificationCounter(user._id)
                        .then(notificationCounter => {
                            const notifications = [...this.state.notifications];
                            const index = this.findIndex(notificationId);
                            const notification = { ...notifications[index] };
                            notification.isRead = true;
                            notifications[index] = notification;
                            this.setState({ notifications, notificationsCount: notificationCounter.count });
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
        const notificationId = e.currentTarget.getAttribute('data-id');

        markAsUnread(notificationId)
            .then(status => {
                if (status === 200) {
                    const { user } = this.state;
                    getNotificationCounter(user._id)
                        .then(notificationCounter => {
                            const notifications = [...this.state.notifications];
                            const index = this.findIndex(notificationId);
                            const notification = { ...notifications[index] };
                            notification.isRead = false;
                            notifications[index] = notification;
                            this.setState({ notifications, notificationsCount: notificationCounter.count });
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

    handleDeleteNotification = (e) => {
        const notificationId = e.currentTarget.getAttribute('data-id');

        deleteNotification(notificationId)
            .then(status => {
                if (status === 200) {
                    const { user } = this.state;
                    getNotificationCounter(user._id)
                        .then(notificationCounter => {
                            const notifications = [...this.state.notifications];
                            const index = this.findIndex(notificationId);
                            notifications.splice(index, 1);
                            this.setState({ notifications, notificationsCount: notificationCounter.count });
                            toast(strings.NOTIFICATION_DELETE, { type: 'info' });
                        })
                        .catch(err => {
                            toast(strings.NOTIFICATION_DELETE_ERROR, { type: 'error' });
                        });
                } else {
                    toast(strings.NOTIFICATION_DELETE_ERROR, { type: 'error' });
                }
            })
            .catch(err => {
                toast(strings.NOTIFICATION_DELETE_ERROR, { type: 'error' });
            });

    };

    handleDeleteAllNotifications = () => {
        this.setState({ openDeleteDialog: true });
    };

    handleCancelDelete = () => {
        this.setState({ openDeleteDialog: false });
    };

    handleConfirmDelete = () => {
        deleteNotifications(this.state.user._id).then(status => {
            if (status === 200) {
                this.setState({ notifications: [], notificationsCount: 0, openDeleteDialog: false });
            } else {
                this.setState({ openDeleteDialog: false });
                toast(strings.GENERIC_ERROR, { type: 'error' });
            }
        });
    };

    handleMarkAllAsRead = () => {
        markAllAsRead(this.state.user._id).then(status => {
            if (status === 200) {
                const notifications = [...this.state.notifications];

                for (let i = 0; i < notifications.length; i++) {
                    const notification = notifications[i];
                    if (!notification.isRead) {
                        notification.isRead = true;
                    }
                }

                this.setState({ notifications, notificationsCount: 0 });
            } else {
                toast(strings.GENERIC_ERROR, { type: 'error' });
            }
        });
    };

    fetchNotifications = () => {
        const { user, page } = this.state;
        this.setState({ isLoading: true });

        getNotifications(user._id, page)
            .then(data => {
                const notifications = [...this.state.notifications, ...data];
                this.setState({ notifications, isLoading: false, fetch: data.length > 0 });
            })
            .catch(err => {
                this.setState({ isLoading: false });
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
    };

    componentDidMount() {
        let language = getQueryLanguage();

        if (!LANGUAGES.includes(language)) {
            language = getLanguage();
        }
        strings.setLanguage(language);
        this.setState({ isLoading: true });

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
                        this.fetchNotifications();

                        getNotificationCounter(user._id)
                            .then(notificationCounter => {
                                this.setState({ notificationsCount: notificationCounter.count });
                            })
                            .catch(err => {
                                toast(strings.GENERIC_ERROR, { type: 'error' });
                            });

                        const ul = document.querySelector('.notifications-list');
                        if (ul) {
                            ul.onscroll = (event) => {
                                if (this.state.fetch && !this.state.isLoading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                                    this.setState({ page: this.state.page + 1 }, () => {
                                        this.fetchNotifications();
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
    };

    render() {
        const { isAuthenticating } = this.state;
        if (!isAuthenticating) {
            const { isTokenValidated } = this.state;
            if (isTokenValidated) {
                const { isVerified, notifications, notificationsCount, user, isLoading, openDeclineDialog, openDeleteDialog } = this.state;
                const rtl = user.language === 'ar';

                return renderReactDom(
                    <div>
                        <Header user={user} notificationsCount={notificationsCount} />
                        {isVerified ?
                            <div className="notifications content">
                                {isLoading && <Backdrop text={strings.LOADING} />}
                                {!isLoading && notifications.length === 0 ?
                                    <Card variant="outlined" className="content-nc">
                                        <CardContent>
                                            <Typography color="textSecondary">
                                                {strings.NO_NOTIFICATION}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    :
                                    <div>
                                        <Card variant="outlined" className={`notifications-actions${rtl ? '-rtl' : ''}`} style={notifications.length === 0 ? { display: 'none' } : null}>
                                            <CardContent>
                                                <Tooltip title={strings.DELETE_ALL}>
                                                    <IconButton
                                                        color="secondary"
                                                        onClick={this.handleDeleteAllNotifications}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {notificationsCount > 0 && <Tooltip title={strings.MARK_ALL_AS_READ}>
                                                    <IconButton
                                                        color="default"
                                                        onClick={this.handleMarkAllAsRead}
                                                    >
                                                        <ReadIcon />
                                                    </IconButton>
                                                </Tooltip>}
                                            </CardContent>
                                        </Card>
                                        <List className="notifications-list">
                                            {
                                                notifications.map((notification, i) => (
                                                    <ListItem key={notification._id}>
                                                        <ListItemAvatar>
                                                            <Avatar>
                                                                <Info />
                                                            </Avatar>
                                                        </ListItemAvatar>
                                                        <ListItemText
                                                            disableTypography
                                                            primary={<Typography style={{ fontWeight: !notification.isRead ? 'bold' : 'normal', color: '#373737' }}>{moment(notification.notifiedAt).format(process.env.REACT_APP_WS_DATE_FORMAT)}</Typography>}
                                                            secondary={
                                                                <div>
                                                                    {
                                                                        notification.isLink ?
                                                                            <Link href={notification.link} style={{ wordBreak: 'break-all' }}>{notification.message}</Link>
                                                                            : <div style={{ wordBreak: 'break-all' }}>{notification.message}</div>
                                                                    }
                                                                    {isMobile() ?
                                                                        <div>
                                                                            {
                                                                                notification.isRequest && !notification.isConnected && !notification.isDeclined ?
                                                                                    <div style={{ display: 'inline-block' }}>
                                                                                        <Tooltip title={strings.APPROVE}>
                                                                                            <IconButton
                                                                                                color="primary"
                                                                                                data-id={notification._id}
                                                                                                data-conn-id={notification.senderConnection._id}
                                                                                                onClick={this.handleApprove}
                                                                                            >
                                                                                                <ThumbUp />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                        <Tooltip title={strings.DECLINE}>
                                                                                            <IconButton
                                                                                                color="secondary"
                                                                                                data-id={notification._id}
                                                                                                data-conn-id={notification.senderConnection._id}
                                                                                                onClick={this.handleDecline}
                                                                                            >
                                                                                                <ThumbDown />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </div>
                                                                                    : null
                                                                            }
                                                                            {!notification.isRead
                                                                                ?
                                                                                <Tooltip title={strings.MARK_AS_READ}>
                                                                                    <IconButton
                                                                                        color="default"
                                                                                        data-id={notification._id}
                                                                                        onClick={this.handleMarkAsRead}
                                                                                    >
                                                                                        <ReadIcon />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                                :
                                                                                <Tooltip title={strings.MARK_AS_UNREAD}>
                                                                                    <IconButton
                                                                                        color="default"
                                                                                        data-id={notification._id}
                                                                                        onClick={this.handleMarkAsUnread}
                                                                                    >
                                                                                        <UnreadIcon />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                            }
                                                                            <Tooltip title={strings.DELETE}>
                                                                                <IconButton
                                                                                    color="secondary"
                                                                                    data-id={notification._id}
                                                                                    onClick={this.handleDeleteNotification}
                                                                                >
                                                                                    <DeleteIcon />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </div>
                                                                        : null
                                                                    }
                                                                </div>
                                                            } />
                                                        {!isMobile() ?
                                                            <div>
                                                                {
                                                                    notification.isRequest && !notification.isConnected && !notification.isDeclined ?
                                                                        <div style={{ display: 'inline-block' }}>
                                                                            <Button
                                                                                variant="contained"
                                                                                color={notification.isConnected ? "secondary" : (notification.isConnectionPending && !notification.isApprover ? "default" : "primary")}
                                                                                size="small"
                                                                                data-id={notification._id}
                                                                                data-conn-id={notification.senderConnection._id}
                                                                                onClick={this.handleApprove}
                                                                            >
                                                                                {strings.APPROVE}
                                                                            </Button>
                                                                            <Button
                                                                                variant="contained"
                                                                                color="secondary"
                                                                                size="small"
                                                                                data-id={notification._id}
                                                                                data-conn-id={notification.senderConnection._id}
                                                                                onClick={this.handleDecline}
                                                                            >
                                                                                {strings.DECLINE}
                                                                            </Button>
                                                                        </div>
                                                                        : null
                                                                }
                                                                {!notification.isRead
                                                                    ?
                                                                    <Tooltip title={strings.MARK_AS_READ}>
                                                                        <IconButton
                                                                            color="default"
                                                                            data-id={notification._id}
                                                                            onClick={this.handleMarkAsRead}
                                                                        >
                                                                            <ReadIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    :
                                                                    <Tooltip title={strings.MARK_AS_UNREAD}>
                                                                        <IconButton
                                                                            color="default"
                                                                            data-id={notification._id}
                                                                            onClick={this.handleMarkAsUnread}
                                                                        >
                                                                            <UnreadIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                }
                                                                <Tooltip title={strings.DELETE}>
                                                                    <IconButton
                                                                        color="secondary"
                                                                        data-id={notification._id}
                                                                        onClick={this.handleDeleteNotification}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </div>
                                                            : null
                                                        }
                                                    </ListItem>
                                                )
                                                )}
                                        </List>
                                    </div>
                                }
                                <Dialog
                                    disableEscapeKeyDown
                                    maxWidth="xs"
                                    open={openDeclineDialog}
                                >
                                    <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                                    <DialogContent>{strings.DECLINE_CONFIRM}</DialogContent>
                                    <DialogActions>
                                        <Button onClick={this.handleCancelDecline} color="default">{strings.CANCEL}</Button>
                                        <Button onClick={this.handleConfirmDecline} color="secondary">{strings.DECLINE}</Button>
                                    </DialogActions>
                                </Dialog>
                                <Dialog
                                    disableEscapeKeyDown
                                    maxWidth="xs"
                                    open={openDeleteDialog}
                                >
                                    <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                                    <DialogContent>{strings.DELETE_ALL_NOTIFICATIONS}</DialogContent>
                                    <DialogActions>
                                        <Button onClick={this.handleCancelDelete} color="default">{strings.CANCEL}</Button>
                                        <Button onClick={this.handleConfirmDelete} color="secondary">{strings.DELETE}</Button>
                                    </DialogActions>
                                </Dialog>
                            </div>
                            :
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
                            </div>}
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

export default Notifications;
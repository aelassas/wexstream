import React, { Component } from 'react';
import { strings } from '../config/app.config';
import Header from './Header';
import { toast } from 'react-toastify';
import { getUser, getLanguage, validateAccessToken, resendLink, getCurrentUser, signout, getQueryLanguage } from '../services/user-service';
import { notify, getNotification, getNotificationCounter, deleteNotification, approve, decline } from '../services/notification-service';
import { getConnections, getConnectionIds, deleteConnection } from '../services/connection-service';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Backdrop from './SimpleBackdrop';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { MessageForm } from './MessageForm';
import { Avatar } from './Avatar';
import Link from '@material-ui/core/Link';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    IconButton
} from '@material-ui/core';
import {
    Mail,
    LinkOff,
    ThumbUp,
    ThumbDown,
    Cancel,
} from '@material-ui/icons';
import LinkIcon from '@material-ui/icons/Link';
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET, LANGUAGES } from '../config/env.config';
import { renderReactDom } from '../common/helper';

class Connections extends Component {

    constructor(props) {
        super(props);

        this.state = {
            user: null,
            connections: [],
            isAuthenticating: true,
            isTokenValidated: false,
            notificationsCount: undefined,
            isVerified: false,
            openMessageForm: false,
            to: null,
            isLoading: true,
            openDeclineDialog: false,
            declineTarget: null,
            openDisconnectDialog: false,
            disconnectTarget: null,
            isConnected: false,
            page: 1,
            fetch: false
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

    findIndex = (userId) => (this.state.connections.findIndex(c => c.user._id === userId));

    handleCancelDisconnect = (e) => {
        this.setState({ openDisconnectDialog: false });
    };

    handleConnect = (e) => {
        this.setState({ disconnectTarget: e.currentTarget });

        const isApprover = e.currentTarget.getAttribute('data-is-approver') === 'true';
        const isConnectionPending = e.currentTarget.getAttribute('data-is-connection-pending') === 'true';
        const isConnected = e.currentTarget.getAttribute('data-is-connected') === 'true';
        const connectionId = e.currentTarget.getAttribute('data-id');
        const { user } = this.state;
        const connections = [...this.state.connections]; // Make a shallow copy of connections

        if (isApprover && isConnectionPending && !isConnected) {
            getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId;
                        getNotification(user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {

                                if (notification) { // Connect
                                    approve(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: strings.CONNECTION_APPROVE_NOTIFICATION + ' ' + user.fullName + '.',
                                                    isLink: true,
                                                    senderUser: user._id,
                                                    link: `${window.location.origin}/profile?u=${user._id}`
                                                };

                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = this.findIndex(connectionId);
                                                            // Make a shallow copy of the user to mutate
                                                            const uconn = { ...connections[index] };
                                                            // Update user
                                                            uconn.isPending = false;
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            connections[index] = uconn;
                                                            // Set the state to our new copy
                                                            this.setState({ connections });

                                                            getNotificationCounter(user._id)
                                                                .then(notificationCounter => {
                                                                    this.setState({ notificationsCount: notificationCounter.count });
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
                    } else {
                        toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                    }
                })
                .catch(err => {
                    toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                });
        } else if (isApprover && (isConnectionPending || isConnected)) {
            this.setState({ isConnected, openDisconnectDialog: true });
        } else {
            if (isConnectionPending || isConnected) {
                this.setState({ isConnected, openDisconnectDialog: true });
            }
        }
    };

    handleConfirmDisconnect = (e) => {
        const { user, disconnectTarget } = this.state;
        const isApprover = disconnectTarget.getAttribute('data-is-approver') === 'true';
        const isConnectionPending = disconnectTarget.getAttribute('data-is-connection-pending') === 'true';
        const isConnected = disconnectTarget.getAttribute('data-is-connected') === 'true';
        const connectionId = disconnectTarget.getAttribute('data-id');
        const connections = [...this.state.connections]; // Make a shallow copy of connections

        if (isApprover && (isConnectionPending || isConnected)) {
            getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId;
                        getNotification(user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {

                                if (notification) { // Disconnect
                                    decline(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isLink: true,
                                                    senderUser: user._id,
                                                    link: `${window.location.origin}/profile?u=${user._id}`
                                                };
                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = this.findIndex(connectionId);
                                                            connections.splice(index, 1);
                                                            this.setState({ openDisconnectDialog: false, connections });

                                                            getNotificationCounter(user._id)
                                                                .then(notificationCounter => {
                                                                    this.setState({ notificationsCount: notificationCounter.count });
                                                                    toast(strings.CONNECTION_DELETED, { type: 'info' });
                                                                })
                                                                .catch(err => {
                                                                    toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                                });
                                                        } else {
                                                            toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                        }
                                                    })
                                                    .catch(err => {
                                                        toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                    });
                                            }
                                        })
                                        .catch(err => {
                                            toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                        });
                                } else { // Disconnect
                                    deleteConnection(user._id, connectionId)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isLink: true,
                                                    senderUser: user._id,
                                                    link: `${window.location.origin}/profile?u=${user._id}`
                                                };
                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = this.findIndex(connectionId);
                                                            connections.splice(index, 1);
                                                            this.setState({ openDisconnectDialog: false, connections });
                                                            toast(strings.CONNECTION_DELETED, { type: 'info' });
                                                        }
                                                        else {
                                                            toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                        }
                                                    })
                                                    .catch(err => {
                                                        toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                    });
                                            }
                                            else {
                                                toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                            }
                                        });
                                }
                            })
                            .catch(err => {
                                toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                            });
                    } else {
                        toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                    }
                })
                .catch(err => {
                    toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                });
        } else {
            if (isConnectionPending || isConnected) {
                getConnectionIds(user._id, connectionId)
                    .then(connectionIds => {
                        if (connectionIds) {
                            const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId;

                            getNotification(connectionId, _senderConnectionId, _approverConnectionId)
                                .then(notification => {
                                    if (notification) {
                                        deleteNotification(notification._id)
                                            .then(status => {
                                                if (status !== 200) {
                                                    toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                }
                                            })
                                            .catch(err => {
                                                toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                            });
                                    }
                                })
                                .catch(err => {
                                    toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                });

                            if (isConnected) { // Disconnect
                                deleteConnection(user._id, connectionId)
                                    .then(status => {
                                        if (status === 200) {
                                            const notification = {
                                                user: connectionId,
                                                isRequest: false,
                                                message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                isLink: true,
                                                senderUser: user._id,
                                                link: `${window.location.origin}/profile?u=${user._id}`
                                            };
                                            notify(notification)
                                                .then(notificationStatus => {
                                                    if (notificationStatus === 200) {
                                                        const index = this.findIndex(connectionId);
                                                        connections.splice(index, 1);
                                                        this.setState({ openDisconnectDialog: false, connections });
                                                        toast(strings.CONNECTION_DELETED, { type: 'info' });
                                                    }
                                                    else {
                                                        toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                    }
                                                })
                                                .catch(err => {
                                                    toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                                });
                                        }
                                        else {
                                            toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                        }
                                    })
                                    .catch(err => {
                                        toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                    });
                            } else { // Cancel request
                                deleteConnection(user._id, connectionId)
                                    .then(status => {
                                        if (status === 200) {
                                            const index = this.findIndex(connectionId);
                                            connections.splice(index, 1);
                                            this.setState({ openDisconnectDialog: false, connections });
                                            toast(strings.CONNECTION_CANCELED, { type: 'info' });
                                        } else {
                                            toast(strings.GENERIC_ERROR, { type: 'error' });
                                        }
                                    })
                                    .catch(err => {
                                        toast(strings.GENERIC_ERROR, { type: 'error' });
                                    });
                            }
                        } else {
                            toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                        }
                    })
                    .catch(err => {
                        toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                    });
            }
        }
    };

    handleCancelDecline = (e) => {
        this.setState({ openDeclineDialog: false });
    };

    handleDecline = (e) => {
        this.setState({ declineTarget: e.currentTarget, openDeclineDialog: true });
    };

    handleConfirmDecline = (e) => {
        const { user, declineTarget } = this.state;
        const isApprover = declineTarget.getAttribute('data-is-approver') === 'true';
        const isConnectionPending = declineTarget.getAttribute('data-is-connection-pending') === 'true';
        const isConnected = declineTarget.getAttribute('data-is-connected') === 'true';
        const connectionId = declineTarget.getAttribute('data-id');
        const connections = [...this.state.connections]; // Make a shallow copy of users

        if (isApprover && isConnectionPending && !isConnected) {
            getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId;
                        getNotification(user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) {
                                    decline(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isRequest: false,
                                                    senderConnection: connectionIds._senderConnectionId,
                                                    approverConnection: connectionIds._approverConnectionId,
                                                    isLink: true,
                                                    senderUser: user._id,
                                                    link: `${window.location.origin}/profile?u=${user._id}`
                                                };

                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = this.findIndex(connectionId);
                                                            connections.splice(index, 1);
                                                            this.setState({ connections, openDeclineDialog: false });

                                                            getNotificationCounter(user._id)
                                                                .then(notificationCounter => {
                                                                    this.setState({ notificationsCount: notificationCounter.count });
                                                                    toast(strings.CONNECTION_DECLINE, { type: 'info' });
                                                                })
                                                                .catch(err => {
                                                                    toast(strings.CONNECTION_DECLINE_ERROR, { type: 'error' });
                                                                });
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
    };

    handleSendMessage = (e) => {
        const to = e.currentTarget.getAttribute('data-id');
        this.setState({ openMessageForm: true, to });
    };

    handleMessageFormClose = (e) => {
        this.setState({ openMessageForm: false });
    };

    handleAvatarClick = (e) => {
        const userId = e.currentTarget.getAttribute('data-id');
        window.location = '/profile?u=' + userId;
    };

    fetchConnections = () => {
        const { user, page } = this.state;
        this.setState({ isLoading: true });

        getConnections(user._id, page)
            .then(data => {
                const connections = [...this.state.connections, ...data];
                this.setState({ connections, isLoading: false, fetch: data.length > 0 });
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
                        this.fetchConnections();

                        const div = document.querySelector('.content');
                        if (div) {
                            div.onscroll = (event) => {
                                if (this.state.fetch && !this.state.isLoading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                                    this.setState({ page: this.state.page + 1 }, () => {
                                        this.fetchConnections();
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
                const { notificationsCount, isVerified, connections, openMessageForm, to, user, isLoading, openDeclineDialog, openDisconnectDialog, isConnected } = this.state;
                const rtl = user.language === 'ar';
                return renderReactDom(
                    <div>
                        <Header user={user} notificationsCount={notificationsCount} />
                        {isVerified ?
                            <div className="connections content">
                                {!isLoading && connections.length === 0 ?
                                    <Card variant="outlined" className="content-nc">
                                        <CardContent>
                                            <Typography color="textSecondary">
                                                {strings.NO_CONNECTION}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    :
                                    <List className="content-list">
                                        {connections.map((connection, i) =>
                                        (
                                            <ListItem key={connection._id}>
                                                <ListItemAvatar data-id={connection.user._id} className={rtl ? 'list-item-avatar-rtl' : 'list-item-avatar'} onClick={this.handleAvatarClick}>
                                                    <Link href={`/profile?u=${connection.user._id}`}>
                                                        <Avatar loggedUser={user} user={connection.user} size="medium" isBuffer={false} color="disabled" />
                                                    </Link>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    disableTypography
                                                    data-id={connection.user._id}
                                                    primary={<Link href={`/profile?u=${connection.user._id}`}><Typography style={{ fontWeight: 500, color: '#373737' }}>{connection.user.fullName}</Typography></Link>}
                                                    secondary={!connection.isPending ? (strings.CONNECTED + ' ' + strings.AT + ' ' + moment(connection.connectedAt).format(process.env.REACT_APP_WS_DATE_FORMAT)) : (connection.isPending ? strings.CONNECTION_PENDING : null)}
                                                />

                                                {!isMobile() ?
                                                    (
                                                        <Button
                                                            variant="contained"
                                                            color={!connection.isPending ? "secondary" : (connection.isPending && connection.isApprover ? "default" : "primary")}
                                                            size="small"
                                                            data-id={connection.user._id}
                                                            data-is-approver={!connection.isApprover}
                                                            data-is-connected={!connection.isPending}
                                                            data-is-connection-pending={connection.isPending}
                                                            onClick={this.handleConnect}
                                                            style={{ minWidth: 'auto' }}
                                                        >
                                                            {!connection.isPending
                                                                ? strings.DISCONNECT
                                                                : (connection.isPending
                                                                    ? (!connection.isApprover
                                                                        ? strings.APPROVE
                                                                        : strings.CANCEL)
                                                                    : strings.CONNECT)
                                                            }
                                                        </Button>
                                                    )
                                                    :
                                                    (
                                                        !connection.isPending
                                                            ?
                                                            (
                                                                <Tooltip title={strings.DISCONNECT}>
                                                                    <IconButton
                                                                        color="secondary"
                                                                        size="small"
                                                                        data-id={connection.user._id}
                                                                        data-is-approver={!connection.isApprover}
                                                                        data-is-connected={!connection.isPending}
                                                                        data-is-connection-pending={connection.isPending}
                                                                        onClick={this.handleConnect}
                                                                    >
                                                                        <LinkOff />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )
                                                            : (connection.isPending ?
                                                                !connection.isApprover ?
                                                                    (
                                                                        <Tooltip title={strings.APPROVE}>
                                                                            <IconButton
                                                                                color="primary"
                                                                                size="small"
                                                                                data-id={connection.user._id}
                                                                                data-is-approver={!connection.isApprover}
                                                                                data-is-connected={!connection.isPending}
                                                                                data-is-connection-pending={connection.isPending}
                                                                                onClick={this.handleConnect}
                                                                            >
                                                                                <ThumbUp />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )
                                                                    :
                                                                    (
                                                                        <Tooltip title={strings.CANCEL}>
                                                                            <IconButton
                                                                                color="default"
                                                                                size="small"
                                                                                data-id={connection.user._id}
                                                                                data-is-approver={!connection.isApprover}
                                                                                data-is-connected={!connection.isPending}
                                                                                data-is-connection-pending={connection.isPending}
                                                                                onClick={this.handleConnect}
                                                                            >
                                                                                <Cancel />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )
                                                                :
                                                                (
                                                                    <Tooltip title={strings.CONNECT}>
                                                                        <IconButton
                                                                            color="primary"
                                                                            size="small"
                                                                            data-id={connection.user._id}
                                                                            data-is-approver={!connection.isApprover}
                                                                            data-is-connected={!connection.isPending}
                                                                            data-is-connection-pending={connection.isPending}
                                                                            onClick={this.handleConnect}
                                                                        >
                                                                            <LinkIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                ))
                                                    )
                                                }
                                                {connection.isPending && !connection.isApprover ?
                                                    !isMobile() ?
                                                        (
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                size="small"
                                                                data-id={connection.user._id}
                                                                data-is-approver={!connection.isApprover}
                                                                data-is-connected={!connection.isPending}
                                                                data-is-connection-pending={connection.isPending}
                                                                onClick={this.handleDecline}
                                                            >
                                                                {strings.DECLINE}
                                                            </Button>
                                                        )
                                                        :
                                                        (
                                                            < Tooltip title={strings.DECLINE}>
                                                                <IconButton
                                                                    color="secondary"
                                                                    size="small"
                                                                    data-id={connection.user._id}
                                                                    data-is-approver={!connection.isApprover}
                                                                    data-is-connected={!connection.isPending}
                                                                    data-is-connection-pending={connection.isPending}
                                                                    onClick={this.handleDecline}
                                                                >
                                                                    <ThumbDown />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )
                                                    : null}
                                                {connection.user.enablePrivateMessages || !connection.isPending ?
                                                    !isMobile() ?
                                                        (
                                                            <Button
                                                                variant="contained"
                                                                color="primary"
                                                                size="small"
                                                                data-id={connection.user._id}
                                                                onClick={this.handleSendMessage}
                                                            >
                                                                {strings.SEND_MESSAGE}
                                                            </Button>
                                                        )
                                                        :
                                                        (
                                                            <Tooltip title={strings.MESSAGE}>
                                                                <IconButton
                                                                    color="default"
                                                                    size="small"
                                                                    data-id={connection.user._id}
                                                                    onClick={this.handleSendMessage}
                                                                >
                                                                    <Mail />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )

                                                    : null
                                                }
                                            </ListItem>
                                        )
                                        )}
                                    </List>
                                }
                                <Dialog
                                    disableEscapeKeyDown
                                    maxWidth="xs"
                                    open={openDisconnectDialog}
                                >
                                    <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                                    <DialogContent>{isConnected ? strings.DISCONNECT_CONFIRM : strings.CANCEL_CONFIRM}</DialogContent>
                                    <DialogActions>
                                        <Button onClick={this.handleCancelDisconnect} color="default">{strings.CANCEL}</Button>
                                        <Button onClick={this.handleConfirmDisconnect} color="secondary">{strings.YES}</Button>
                                    </DialogActions>
                                </Dialog>
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
                                <MessageForm user={user} hideButton={true} open={openMessageForm} onClose={this.handleMessageFormClose} to={to} />
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
                        {isLoading && <Backdrop text={strings.LOADING} />}
                    </div>
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

export default Connections;
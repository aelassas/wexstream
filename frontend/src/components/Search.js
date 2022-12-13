import React, { Component } from 'react';
import { strings } from '../config/app.config';
import Header from './Header';
import { toast } from 'react-toastify';
import {
    getLanguage, getUser, validateAccessToken, resendLink, getCurrentUser, signout, getSearchKeyword, searchUsers,
    getQueryLanguage
} from '../services/UserService';
import { connect, getConnection, getConnectionIds, deleteConnection } from '../services/ConnectionService';
import { notify, getNotification, getNotificationCounter, deleteNotification, approve, decline } from '../services/NotificationService';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Backdrop from '../elements/SimpleBackdrop';
import { MessageForm } from '../elements/MessageForm';
import { Avatar } from '../elements/Avatar';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Mail,
    LinkOff,
    ThumbUp,
    ThumbDown,
    Cancel
} from '@mui/icons-material';
import LinkIcon from '@mui/icons-material/Link';
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET, LANGUAGES } from '../config/env.config';


class Search extends Component {

    constructor(props) {
        super(props);

        this.state = {
            searchKeyword: '',
            user: null,
            users: [],
            notificationsCount: undefined,
            isAuthenticating: true,
            isTokenValidated: false,
            verified: false,
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

    findIndex = (userId) => (this.state.users.findIndex(u => u._id === userId));

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
        const users = [...this.state.users]; // Make a shallow copy of users

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
                                                            getConnection(user._id, connectionId)
                                                                .then(
                                                                    conn => {
                                                                        if (conn) {
                                                                            const index = this.findIndex(connectionId);
                                                                            // Make a shallow copy of the user to mutate
                                                                            const uuser = { ...users[index] };
                                                                            // Update user
                                                                            uuser.connection = conn;
                                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                                            users[index] = uuser;
                                                                            // Set the state to our new copy
                                                                            this.setState({ users });
                                                                        }
                                                                    })
                                                                .catch(err => {
                                                                    toast(strings.GENERIC_ERROR, { type: 'error' });
                                                                });


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
                    } else {
                        toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                    }
                })
                .catch(err => {
                    toast(strings.CONNECTION_APPROVE_ERROR, { type: 'error' });
                });
        } else if (isApprover && (isConnectionPending || isConnected)) {
            this.setState({ openDisconnectDialog: true, isConnected });
        } else {
            if (isConnectionPending || isConnected) {
                this.setState({ openDisconnectDialog: true, isConnected });
            } else { // Send connection request
                const data = { _id: user._id, connectionId: connectionId };
                connect(data)
                    .then(connectionIds => {
                        if (connectionIds) {
                            const notification = {
                                user: connectionId,
                                message: user.fullName + ' ' + strings.CONNECTION_REQUEST_NOTIFICATION,
                                isRequest: true,
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
                                        // Make a shallow copy of users you want to mutate
                                        const uuser = { ...users[index] };
                                        // Update user
                                        uuser.connection = { isPending: true, isApprover: false };
                                        // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                        users[index] = uuser;
                                        // Set the state to our new copy
                                        this.setState({ users });
                                        toast(strings.CONNECTION_REQUEST_SENT, { type: 'info' });
                                    } else {
                                        toast(strings.CONNECTION_REQUEST_ERROR, { type: 'error' });
                                    }
                                })
                                .catch(err => {
                                    toast(strings.CONNECTION_REQUEST_ERROR, { type: 'error' });
                                });
                        } else {
                            toast(strings.CONNECTION_REQUEST_ERROR, { type: 'error' });
                        }
                    })
                    .catch(err => {
                        toast(strings.CONNECTION_REQUEST_ERROR, { type: 'error' });
                    });
            }
        }
    };

    handleConfirmDisconnect = (e) => {
        const { user, disconnectTarget } = this.state;
        const isApprover = disconnectTarget.getAttribute('data-is-approver') === 'true';
        const isConnectionPending = disconnectTarget.getAttribute('data-is-connection-pending') === 'true';
        const isConnected = disconnectTarget.getAttribute('data-is-connected') === 'true';
        const connectionId = disconnectTarget.getAttribute('data-id');
        const users = [...this.state.users]; // Make a shallow copy of users

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
                                                            // Make a shallow copy of the user to mutate
                                                            const uuser = { ...users[index] };
                                                            // Update user
                                                            uuser.connection = undefined;
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            users[index] = uuser;
                                                            // Set the state to our new copy
                                                            this.setState({ openDisconnectDialog: false, users });

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
                                            else {
                                                toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                            }
                                        })
                                        .catch(err => {
                                            toast(strings.CONNECTION_DELETE_ERROR, { type: 'error' });
                                        });
                                } else {
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
                                                            // Make a shallow copy of the user to mutate
                                                            const uuser = { ...users[index] };
                                                            // Update user
                                                            uuser.connection = undefined;
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            users[index] = uuser;
                                                            // Set the state to our new copy
                                                            this.setState({ openDisconnectDialog: false, users });
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
                                            });
                                    }
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
                                                        // Make a shallow copy of the user to mutate
                                                        const uuser = { ...users[index] };
                                                        // Update user
                                                        uuser.connection = undefined;
                                                        // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                        users[index] = uuser;
                                                        // Set the state to our new copy
                                                        this.setState({ openDisconnectDialog: false, users });
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
                                            // Make a shallow copy of the user to mutate
                                            const uuser = { ...users[index] };
                                            // Update user
                                            uuser.connection = undefined;
                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                            users[index] = uuser;
                                            // Set the state to our new copy
                                            this.setState({ openDisconnectDialog: false, users });
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

    handleConfirmDecline = (event) => {
        const { declineTarget } = this.state;
        const isApprover = declineTarget.getAttribute('data-is-approver') === 'true';
        const isConnectionPending = declineTarget.getAttribute('data-is-connection-pending') === 'true';
        const isConnected = declineTarget.getAttribute('data-is-connected') === 'true';
        const connectionId = declineTarget.getAttribute('data-id');

        const { user } = this.state;
        const users = [...this.state.users]; // Make a shallow copy of users
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
                                                            // Make a shallow copy of the user to mutate
                                                            const uuser = { ...users[index] };
                                                            // Update user
                                                            uuser.connection = undefined;
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            users[index] = uuser;
                                                            // Set the state to our new copy
                                                            this.setState({ users, openDeclineDialog: false });

                                                            getNotificationCounter(user._id)
                                                                .then(notificationCounter => {
                                                                    this.setState({ notificationsCount: notificationCounter.count });
                                                                    toast(strings.CONNECTION_DECLINE, { type: 'info' });
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

    fetchUsers = () => {
        const { user, page } = this.state;
        this.setState({ isLoading: true });

        searchUsers(user._id, this.state.searchKeyword, false, page)
            .then(data => {
                const users = [...this.state.users, ...data];
                this.setState({ users, isLoading: false, fetch: data.length > 0 });
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

                        if (user.blacklisted) {
                            signout();
                            return;
                        }

                        moment.locale(language);
                        this.setState({ user, searchKeyword: getSearchKeyword(), verified: user.verified, isAuthenticating: false, isTokenValidated: status === 200 });
                        this.fetchUsers();

                        const div = document.querySelector('.content');
                        if (div) {
                            div.onscroll = (event) => {
                                if (this.state.fetch && !this.state.isLoading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                                    this.setState({ page: this.state.page + 1 }, () => {
                                        this.fetchUsers();
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
                const { verified, users, notificationsCount, openMessageForm, to, user, isLoading, openDeclineDialog, openDisconnectDialog, isConnected } = this.state;
                const rtl = user.language === 'ar';
                return (
                    <div>
                        <Header user={user} notificationsCount={notificationsCount} />
                        {verified ?
                            <div className="search content">
                                {!isLoading && users.length === 0 ?
                                    <Card variant="outlined" className="content-nc">
                                        <CardContent>
                                            <Typography color="textSecondary">
                                                {strings.NO_RESULT}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                    :
                                    <List className="content-list">
                                        {users.map((_user, i) =>
                                        (
                                            <ListItem key={_user._id}>
                                                <ListItemAvatar className={rtl ? 'list-item-avatar-rtl' : 'list-item-avatar'}>
                                                    <Link href={`/profile?u=${_user._id}`}>
                                                        <Avatar loggedUser={user} user={_user} size="medium" color="disabled" isBuffer={false} />
                                                    </Link>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    disableTypography
                                                    data-id={_user._id}
                                                    primary={<Link href={`/profile?u=${_user._id}`}><Typography style={{ fontWeight: 500, color: '#373737' }}>{_user.fullName}</Typography></Link>}
                                                    secondary={_user.connection && !_user.connection.isPending ? (strings.CONNECTED + ' ' + strings.AT + ' ' + moment(_user.connection.connectedAt).format(process.env.REACT_APP_WS_DATE_FORMAT)) : (_user.connection && _user.connection.isPending ? strings.CONNECTION_PENDING : null)}
                                                >
                                                </ListItemText>
                                                {!isMobile() ?
                                                    (
                                                        <Button
                                                            variant="contained"
                                                            color={_user.connection && !_user.connection.isPending ? "secondary" : (_user.connection && _user.connection.isPending && !_user.connection.isApprover ? "default" : "primary")}
                                                            size="small"
                                                            data-id={_user._id}
                                                            data-is-approver={_user.connection && _user.connection.isApprover}
                                                            data-is-connected={_user.connection && !_user.connection.isPending}
                                                            data-is-connection-pending={_user.connection && _user.connection.isPending}
                                                            onClick={this.handleConnect}
                                                        >
                                                            {_user.connection && !_user.connection.isPending
                                                                ? strings.DISCONNECT
                                                                : (_user.connection && _user.connection.isPending
                                                                    ? (_user.connection && _user.connection.isApprover
                                                                        ? strings.APPROVE
                                                                        : strings.CANCEL)
                                                                    : strings.CONNECT)
                                                            }
                                                        </Button>
                                                    )
                                                    :
                                                    (
                                                        _user.connection && !_user.connection.isPending
                                                            ?
                                                            (
                                                                <Tooltip title={strings.DISCONNECT}>
                                                                    <IconButton
                                                                        color="secondary"
                                                                        size="small"
                                                                        data-id={_user._id}
                                                                        data-is-approver={_user.connection && _user.connection.isApprover}
                                                                        data-is-connected={_user.connection && !_user.connection.isPending}
                                                                        data-is-connection-pending={_user.connection && _user.connection.isPending}
                                                                        onClick={this.handleConnect}
                                                                    >
                                                                        <LinkOff />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )
                                                            : (_user.connection && _user.connection.isPending ?
                                                                _user.connection && _user.connection.isApprover ?
                                                                    (
                                                                        <Tooltip title={strings.APPROVE}>
                                                                            <IconButton
                                                                                color="primary"
                                                                                size="small"
                                                                                data-id={_user._id}
                                                                                data-is-approver={_user.connection && _user.connection.isApprover}
                                                                                data-is-connected={_user.connection && !_user.connection.isPending}
                                                                                data-is-connection-pending={_user.connection && _user.connection.isPending}
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
                                                                                data-id={_user._id}
                                                                                data-is-approver={_user.connection && _user.connection.isApprover}
                                                                                data-is-connected={_user.connection && !_user.connection.isPending}
                                                                                data-is-connection-pending={_user.connection && _user.connection.isPending}
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
                                                                            data-id={_user._id}
                                                                            data-is-approver={_user.connection && _user.connection.isApprover}
                                                                            data-is-connected={_user.connection && !_user.connection.isPending}
                                                                            data-is-connection-pending={_user.connection && _user.connection.isPending}
                                                                            onClick={this.handleConnect}
                                                                        >
                                                                            <LinkIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                ))
                                                    )
                                                }
                                                {_user.connection && _user.connection.isPending && _user.connection.isApprover ?
                                                    (
                                                        !isMobile() ?
                                                            (
                                                                <Button
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    size="small"
                                                                    data-id={_user._id}
                                                                    data-is-approver={_user.connection && _user.connection.isApprover}
                                                                    data-is-connected={_user.connection && !_user.connection.isPending}
                                                                    data-is-connection-pending={_user.connection && _user.connection.isPending}
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
                                                                        data-id={_user._id}
                                                                        data-is-approver={_user.connection && _user.connection.isApprover}
                                                                        data-is-connected={_user.connection && !_user.connection.isPending}
                                                                        data-is-connection-pending={_user.connection && _user.connection.isPending}
                                                                        onClick={this.handleDecline}
                                                                    >
                                                                        <ThumbDown />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )
                                                    )
                                                    : null}
                                                {(_user.enablePrivateMessages || (_user.connection && !_user.connection.isPending))
                                                    ?
                                                    (
                                                        !isMobile() ?
                                                            (
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    size="small"
                                                                    data-id={_user._id}
                                                                    onClick={this.handleSendMessage}
                                                                >
                                                                    {strings.MESSAGE}
                                                                </Button>
                                                            )
                                                            :
                                                            (
                                                                <Tooltip title={strings.MESSAGE}>
                                                                    <IconButton
                                                                        color="default"
                                                                        size="small"
                                                                        data-id={_user._id}
                                                                        onClick={this.handleSendMessage}
                                                                    >
                                                                        <Mail />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )
                                                    )
                                                    :
                                                    null
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
                            </div>
                        }
                        {isLoading && <Backdrop text={strings.LOADING} />}
                    </div >
                );
            } else {
                signout();
                return null;
            }
        } else {
            return (<Backdrop text={strings.AUTHENTICATING} />);
        }
    }
}

export default Search;
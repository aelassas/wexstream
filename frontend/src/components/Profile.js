import React, { Component } from 'react';
import { strings } from '../config/app.config';
import {
    getLanguage, getUser, getUserId, getUserById, validateAccessToken, resendLink,
    getCurrentUser, signout, checkBlockedUser, reportUser, blockUser, unblockUser, getQueryLanguage
} from '../services/UserService';
import { getConnection, getConnectionIds, deleteConnection, connect } from '../services/ConnectionService';
import { notify, getNotification, getNotificationCounter, deleteNotification, approve, decline } from '../services/NotificationService';
import { getConferences, deleteConference } from '../services/ConferenceService'
import { deleteSpeakerEntries } from '../services/TimelineService'
import Header from './Header';
import { toast } from 'react-toastify';
import Backdrop from './SimpleBackdrop';
import { Avatar } from './Avatar';
import {
    Typography,
    Card,
    CardContent,
    Link,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Input,
} from '@mui/material';
import {
    LocationOnOutlined,
    LinkOutlined,
    QueryBuilderOutlined,
    Videocam,
    Clear,
    MoreHoriz,
    Report,
    Block,
    LockOpen,
    Lock,
    Public,
    People
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import { MessageForm } from './MessageForm';
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET, LANGUAGES, DEFAULT_LANGUAGE } from '../config/env.config';
import { Members } from './Members';
import * as Helper from '../common/Helper';


class Profile extends Component {

    constructor(props) {
        super(props);
        this.state = {
            user: null,
            loggedUser: null,
            isConnected: false,
            isConnectionPending: false,
            isApprover: false,
            connectedAt: null,
            notificationsCount: undefined,
            openDisconnectDialog: false,
            openDeclineDialog: false,
            openMessageForm: false,
            userNotFound: false,
            openDialog: false,
            isAuthenticating: true,
            isTokenValidated: false,
            isVerified: false,
            conferences: [],
            currentTarget: null,
            isLoading: false,
            isLoadingAvatar: false,
            openDeleteDialog: false,
            page: 1,
            fetch: false,
            isPrivate: false,
            anchorEl: null,
            openActions: false,
            error: false,
            unauthorized: false,
            openReportDialog: false,
            openBlockDialog: false,
            reportMessage: '',
            isBlocked: false,
            openMembersDialog: false,
            conferenceId: '',
            language: DEFAULT_LANGUAGE
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

    onBeforeUpload = () => {
        this.setState({ isLoadingAvatar: true });
    };

    onAvatarChange = (user) => {
        this.setState({ isLoadingAvatar: false, user, loggedUser: user });
    };

    handleSendMessage = (e) => {
        this.setState({ openMessageForm: true, to: this.state.user._id });
    };

    handleMessageFormClose = (e) => {
        this.setState({ openMessageForm: false });
    };

    handleConfirmDisconnect = (e) => {
        const connectionId = this.state.user._id;
        const { isConnected, isConnectionPending, isApprover } = this.state;
        const user = this.state.loggedUser;

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
                                                            this.setState({ isConnected: false, isConnectionPending: false, isApprover: false, openDisconnectDialog: false });

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
                                                            this.setState({ isConnected: false, isConnectionPending: false, isApprover: false });
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
        } else if (isConnectionPending || isConnected) {
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
                                                    this.setState({ isConnected: false, isConnectionPending: false, isApprover: false, openDisconnectDialog: false });
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
                                        this.setState({ isConnected: false, isConnectionPending: false, isApprover: false, openDisconnectDialog: false });
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
    };

    handleCancelDisconnect = (e) => {
        this.setState({ openDisconnectDialog: false });
    };

    handleConnect = (e) => {
        const connectionId = this.state.user._id;
        const { isConnected, isConnectionPending, isApprover } = this.state;
        const user = this.state.loggedUser;

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
                                                            this.setState({ isConnected: true, isConnectionPending: false });

                                                            getConnection(user._id, connectionId)
                                                                .then(
                                                                    conn => {
                                                                        if (conn) {
                                                                            this.setState({ connectedAt: conn.connectedAt });
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
            this.setState({ openDisconnectDialog: true });
        } else {
            if (isConnectionPending || isConnected) {
                this.setState({ openDisconnectDialog: true });
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
                                        this.setState({ isConnected: false, isConnectionPending: true, isApprover: false });
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

    handleDecline = (e) => {
        this.setState({ openDeclineDialog: true });
    };

    handleCancelDecline = (e) => {
        this.setState({ openDeclineDialog: false });
    };

    handleConfirmDecline = (e) => {
        const { isApprover, isConnectionPending, isConnected } = this.state;
        const connectionId = this.state.user._id;
        const user = this.state.loggedUser;

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
                                                            this.setState({ isConnected: false, isConnectionPending: false, isApprover: false, openDeclineDialog: false });

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

    findIndex = (conferenceId) => (this.state.conferences.findIndex(u => u._id === conferenceId));

    handleDelete = (event) => {
        event.preventDefault();
        this.setState({ currentTarget: event.currentTarget, openDeleteDialog: true });
    };

    handleCancelDelete = (event) => {
        event.preventDefault();
        this.setState({ openDeleteDialog: false });
    };

    handleConfirmDelete = (event) => {
        event.preventDefault();
        const conferenceId = this.state.currentTarget.getAttribute('data-id');

        deleteConference(conferenceId)
            .then(status => {
                if (status === 200) {
                    const index = this.findIndex(conferenceId);
                    const conferences = [...this.state.conferences];
                    conferences.splice(index, 1);
                    this.setState({ conferences, openDeleteDialog: false });

                    const { loggedUser } = this.state;
                    deleteSpeakerEntries(loggedUser._id, conferenceId)
                        .then(status => {
                            if (status !== 200) {
                                toast(strings.GENERIC_ERROR, { type: 'error' });
                            }
                        })
                        .catch(err => {
                            toast(strings.GENERIC_ERROR, { type: 'error' });
                        });
                } else {
                    toast(strings.GENERIC_ERROR, { type: 'error' });
                    this.setState({ openDeleteDialog: false });
                }
            })
            .catch(err => {
                toast(strings.GENERIC_ERROR, { type: 'error' });
                this.setState({ openDeleteDialog: false });
            });
    };

    fetchConferences = () => {
        const { user, page, isPrivate } = this.state;
        this.setState({ isLoading: true });

        getConferences(user._id, isPrivate, page)
            .then(data => {
                const conferences = [...this.state.conferences, ...data];
                this.setState({ conferences, isLoading: false, fetch: data.length > 0 })
            })
            .catch(err => {
                this.setState({ isLoading: false });
                toast(strings.GENERIC_ERROR, { type: 'error' });
            });
    };

    handleActionsClick = (event) => {
        this.setState({ openActions: true, anchorEl: event.currentTarget });
    };

    handleActionsClose = () => {
        this.setState({ openActions: false, anchorEl: null });
    };

    handleReport = () => {
        this.setState({ openReportDialog: true });
        this.handleActionsClose();
    };

    handleReportMessageChange = (event) => {
        this.setState({ reportMessage: event.target.value });
    };

    handleCancelReport = () => {
        this.setState({ openReportDialog: false, reportMessage: '' });
    };

    handleConfirmReport = () => {
        const { loggedUser, user, reportMessage } = this.state;
        const data = {
            user: loggedUser._id,
            reportedUser: user._id,
            message: reportMessage
        };

        reportUser(data)
            .then(status => {
                if (status === 200) {
                    this.setState({ openReportDialog: false, reportMessage: '' });
                    toast(strings.REPORT_SUCCESS, { type: 'info' });
                } else {
                    toast(strings.GENERIC_ERROR, { type: 'error' })
                }
            })
            .catch(() => toast(strings.GENERIC_ERROR, { type: 'error' }));
    };

    handleBlock = () => {
        this.setState({ openBlockDialog: true });
        this.handleActionsClose();
    };

    handleCancelBlock = () => {
        this.setState({ openBlockDialog: false });
    };

    handleConfirmBlock = () => {
        const { user, loggedUser, isBlocked } = this.state;

        if (isBlocked) {
            unblockUser(loggedUser._id, user._id)
                .then(status => {
                    if (status === 200) {
                        this.setState({ openBlockDialog: false }, () => {
                            this.setState({ isBlocked: false });
                        });
                        toast(strings.UNBLOCK_SUCCESS, { type: 'info' });
                    } else {
                        toast(strings.GENERIC_ERROR, { type: 'error' })
                    }
                })
                .catch(() => toast(strings.GENERIC_ERROR, { type: 'error' }));
        } else {
            blockUser(loggedUser._id, user._id)
                .then(status => {
                    if (status === 200) {
                        this.setState({ openBlockDialog: false }, () => {
                            this.setState({ isBlocked: true });
                        });
                        toast(strings.BLOCK_SUCCESS, { type: 'info' });
                    } else {
                        toast(strings.GENERIC_ERROR, { type: 'error' })
                    }
                })
                .catch(() => toast(strings.GENERIC_ERROR, { type: 'error' }));
        }
    };

    handleMembers = event => {
        this.setState({ isLoading: true });
        const conferenceId = event.currentTarget.getAttribute('data-id');
        this.setState({ openMembersDialog: true, conferenceId });
    };

    handleCloseMembers = event => {
        this.setState({ openMembersDialog: false });
    };

    handleMembersFetched = event => {
        this.setState({ isLoading: false });
    };

    handleMembersError = () => {
        this.setState({ isLoading: false });
        toast(strings.GENERIC_ERROR, { type: 'error' });
    };

    infiniteScroll = () => {
        const { loggedUser, userNotFound, error } = this.state;
        const rtl = loggedUser.language === 'ar';
        if (!userNotFound && !error) {
            if (isMobile()) {
                const div = document.querySelector(`.profile-container${rtl ? '-rtl' : ''}`);

                if (div) {
                    const profileHeader = document.querySelector(`.profile-header${rtl ? '-rtl' : ''}`);
                    const profileHeaderHeight = profileHeader.clientHeight;
                    const profileHeaderOffset = 100;
                    div.onscroll = (event) => {
                        if (this.state.fetch && !this.state.isLoading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop + (profileHeaderHeight + profileHeaderOffset))) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                            this.setState({ page: this.state.page + 1 }, () => {
                                this.fetchConferences();
                            });
                        }
                    };
                }
            } else {
                const div = document.querySelector(`.profile-timeline${rtl ? '-rtl' : ''}`);
                if (div) {
                    div.onscroll = (event) => {
                        if (this.state.fetch && !this.state.isLoading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                            this.setState({ page: this.state.page + 1 }, () => {
                                this.fetchConferences();
                            });
                        }
                    };
                }
            }

        }
    };

    componentDidMount() {
        let language = getQueryLanguage();

        if (!LANGUAGES.includes(language)) {
            language = getLanguage();
        }
        strings.setLanguage(language);
        this.setState({ language, isLoading: true });

        const currentUser = getCurrentUser();
        if (currentUser) {
            validateAccessToken().then(status => {
                const isTokenValidated = status === 200;

                getUser(currentUser.id).then(user => {
                    if (user) {

                        if (user.isBlacklisted) {
                            signout();
                            return;
                        }

                        moment.locale(language);
                        let userId = getUserId();
                        if (userId === '') {
                            userId = user._id;
                        }
                        if (Helper.isObjectId(userId)) {
                            if (userId !== user._id) {

                                checkBlockedUser(userId, user._id)
                                    .then(userStatus => {
                                        if (userStatus === 200) {
                                            this.setState({ loggedUser: user, unauthorized: true, isLoading: false, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
                                        } else if (userStatus === 204) {
                                            getUserById(userId)
                                                .then(_user => {
                                                    if (_user) {

                                                        if (_user.isBlacklisted) {
                                                            this.setState({ loggedUser: user, user: null, unauthorized: true, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
                                                            return;
                                                        }

                                                        getConnection(user._id, _user._id)
                                                            .then(conn => {

                                                                const loadPage = () => {
                                                                    let isPrivate = false;
                                                                    if (conn && !conn.isPending) {
                                                                        isPrivate = true;
                                                                    }
                                                                    this.setState({ loggedUser: user, user: _user, isPrivate, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });

                                                                    this.fetchConferences();
                                                                    this.infiniteScroll();
                                                                };

                                                                if (conn) {
                                                                    this.setState({ isConnected: !conn.isPending, isConnectionPending: conn.isPending, isApprover: conn.isApprover, connectedAt: conn.connectedAt });

                                                                    checkBlockedUser(user._id, userId)
                                                                        .then(userStatus => {
                                                                            this.setState({ isBlocked: userStatus === 200 });
                                                                            loadPage();
                                                                        });
                                                                } else {
                                                                    loadPage();
                                                                }
                                                            })
                                                            .catch(err => {
                                                                toast(strings.GENERIC_ERROR, { type: 'error' });
                                                            });

                                                    } else {
                                                        this.setState({ loggedUser: user, user: null, userNotFound: true, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
                                                    }
                                                })
                                                .catch(err => {
                                                    this.setState({ loggedUser: user, user: null, error: true, isLoading: false, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
                                                });
                                        } else {
                                            this.setState({ loggedUser: user, error: true, isLoading: false, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
                                        }
                                    })
                                    .catch(err => {
                                        this.setState({ loggedUser: user, error: true, isLoading: false, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
                                    });

                            } else {
                                this.setState({ loggedUser: user, user, isPrivate: true, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
                                this.fetchConferences();
                                this.infiniteScroll();
                            }
                        } else {
                            this.setState({ loggedUser: user, user: null, userNotFound: true, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated });
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
                const { isVerified, language, loggedUser, user, userNotFound, isConnected, isConnectionPending, isApprover
                    , connectedAt, openDisconnectDialog, openDeclineDialog, notificationsCount, openMessageForm,
                    conferences, isLoading, openDeleteDialog, anchorEl, openActions, error, unauthorized,
                    openReportDialog, reportMessage, openBlockDialog, isBlocked, openMembersDialog, conferenceId, isLoadingAvatar } = this.state;
                const rtl = language === 'ar';
                const styles = {
                    infoIcon: {
                        width: 32,
                        marginBottom: -8,
                        marginRight: 5,
                        marginLeft: 5
                    }
                };
                const iconStyles = {
                    float: rtl ? 'right' : 'left',
                    height: 14,
                    marginTop: -1,
                    color: '#595959'
                };
                return (
                    <div>
                        <Header user={loggedUser} notificationsCount={notificationsCount} />
                        {isVerified ?
                            <div className={`${isMobile() ? `profile-content${rtl ? '-rtl' : ''}` : ((rtl ? 'profile-rtl' : 'profile') + ' content')}`}>
                                {userNotFound ?
                                    <Card variant="outlined" className={rtl ? 'profile-card-rtl' : 'profile-card'}>
                                        <CardContent>
                                            <Typography color="textSecondary">{strings.USER_NOT_FOUND}</Typography>
                                        </CardContent>
                                    </Card>
                                    :
                                    (unauthorized ?
                                        <Card variant="outlined" className={rtl ? 'profile-card-rtl' : 'profile-card'}>
                                            <CardContent>
                                                <Typography color="textSecondary">{strings.PROFILE_UNAUTHORIZED}</Typography>
                                            </CardContent>
                                        </Card> :
                                        (error ?
                                            <Card variant="outlined" className={rtl ? 'profile-card-rtl' : 'profile-card'}>
                                                <CardContent>
                                                    <Typography color="textSecondary">{strings.GENERIC_ERROR}</Typography>
                                                </CardContent>
                                            </Card>
                                            :
                                            <div className={isMobile() ? `profile-container${rtl ? '-rtl' : ''}` : null}>
                                                <div className={rtl ? 'profile-header-rtl' : 'profile-header'}>
                                                    <Avatar loggedUser={loggedUser}
                                                        user={user}
                                                        size="large"
                                                        onBeforeUpload={this.onBeforeUpload}
                                                        onChange={this.onAvatarChange}
                                                        readonly={user._id !== loggedUser._id}
                                                        color="disabled"
                                                        className={rtl ? 'profile-avatar-rtl' : 'profile-avatar'} />
                                                    <Typography variant="h4" className="profile-name" style={{ textAlign: 'center', fontWeight: 600, marginTop: 15 }}>{user.fullName}</Typography>
                                                    {user.bio && user.bio !== '' && <Typography variant="h6" style={{ textAlign: 'center', fontWeight: 400, marginTop: 10, color: '#676767' }}>{user.bio}</Typography>}
                                                    {user._id !== loggedUser._id &&
                                                        <div className="profile-actions">
                                                            <Button
                                                                variant="contained"
                                                                color={isConnected ? "secondary" : (isConnectionPending && !isApprover ? "default" : "primary")}
                                                                size="small"
                                                                onClick={this.handleConnect}
                                                            >
                                                                {isConnected
                                                                    ? strings.DISCONNECT
                                                                    : (isConnectionPending
                                                                        ? (isApprover
                                                                            ? strings.APPROVE
                                                                            : strings.CANCEL)
                                                                        : strings.CONNECT)
                                                                }
                                                            </Button>
                                                            {(isConnectionPending && isApprover)
                                                                &&
                                                                <Button
                                                                    variant="contained"
                                                                    color="secondary"
                                                                    size="small"
                                                                    onClick={this.handleDecline}
                                                                >
                                                                    {strings.DECLINE}
                                                                </Button>
                                                            }
                                                            {(isConnected || user.enablePrivateMessages)
                                                                &&
                                                                <Button
                                                                    variant="contained"
                                                                    color="primary"
                                                                    size="small"
                                                                    onClick={this.handleSendMessage}
                                                                >
                                                                    {strings.SEND_MESSAGE}
                                                                </Button>
                                                            }
                                                            <IconButton
                                                                aria-label="more"
                                                                aria-haspopup="true"
                                                                onClick={this.handleActionsClick}
                                                                style={{
                                                                    background: '#dddddd',
                                                                    color: '#1c1e21',
                                                                    borderRadius: 4,
                                                                    marginRight: 5,
                                                                    marginLeft: 5,
                                                                    paddingTop: 4,
                                                                    paddingRight: 10,
                                                                    paddingBottom: 4,
                                                                    paddingLeft: 10
                                                                }}
                                                            >
                                                                <MoreHoriz />
                                                            </IconButton>
                                                            <Menu
                                                                anchorEl={anchorEl}
                                                                keepMounted
                                                                open={openActions}
                                                                onClose={this.handleActionsClose}
                                                            >
                                                                <MenuItem key="report" onClick={this.handleReport}>
                                                                    <Report style={rtl ? { marginLeft: 10 } : { marginRight: 10 }} /> {strings.REPORT}
                                                                </MenuItem>
                                                                <MenuItem key="block" onClick={this.handleBlock}>
                                                                    {isBlocked ?
                                                                        <LockOpen style={rtl ? { marginLeft: 10 } : { marginRight: 10 }} />
                                                                        :
                                                                        <Block style={rtl ? { marginLeft: 10 } : { marginRight: 10 }} />
                                                                    }
                                                                    {isBlocked ? strings.UNBLOCK : strings.BLOCK}
                                                                </MenuItem>
                                                            </Menu>
                                                            {(isConnected || isConnectionPending)
                                                                &&
                                                                <Card variant="outlined" style={{ marginTop: 15 }}>
                                                                    <CardContent>
                                                                        {isConnected ? (strings.CONNECTED + ' ' + strings.AT + ' ' + moment(connectedAt).format(process.env.REACT_APP_WS_DATE_FORMAT)) : (isConnectionPending ? strings.CONNECTION_PENDING : null)}
                                                                    </CardContent>
                                                                </Card>
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
                                                            <Dialog
                                                                disableEscapeKeyDown
                                                                maxWidth="sm"
                                                                fullWidth
                                                                open={openReportDialog}
                                                            >
                                                                <DialogTitle style={{ textAlign: 'center' }}>{strings.REPORT}</DialogTitle>
                                                                <DialogContent>
                                                                    <FormControl fullWidth margin="dense">
                                                                        <InputLabel htmlFor="message">{strings.MESSAGE}</InputLabel>
                                                                        <Input
                                                                            id="title"
                                                                            type="text"
                                                                            name="title"
                                                                            autoComplete="off"
                                                                            onChange={this.handleReportMessageChange}
                                                                            multiline
                                                                            rows={10}
                                                                        />
                                                                    </FormControl>
                                                                </DialogContent>
                                                                <DialogActions className="buttons">
                                                                    <Button onClick={this.handleCancelReport} color="default" variant="contained">{strings.CANCEL}</Button>
                                                                    <Button onClick={this.handleConfirmReport} color="secondary" variant="contained" disabled={reportMessage.length === 0}>{strings.REPORT}</Button>
                                                                </DialogActions>
                                                            </Dialog>
                                                            <Dialog
                                                                disableEscapeKeyDown
                                                                maxWidth="xs"
                                                                open={openBlockDialog}
                                                            >
                                                                <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                                                                <DialogContent>{isBlocked ? strings.UNBLOCK_CONFIRM : strings.BLOCK_CONFIRM}</DialogContent>
                                                                <DialogActions>
                                                                    <Button onClick={this.handleCancelBlock} color="default">{strings.CANCEL}</Button>
                                                                    <Button onClick={this.handleConfirmBlock} color="secondary">{isBlocked ? strings.UNBLOCK : strings.BLOCK}</Button>
                                                                </DialogActions>
                                                            </Dialog>
                                                            <MessageForm user={loggedUser} hideButton={true} open={openMessageForm} onClose={this.handleMessageFormClose} to={user._id} />
                                                        </div>
                                                    }
                                                    <div className={rtl ? 'profile-info-rtl' : 'profile-info'}>
                                                        <Card variant="outlined" className="profile-info-card">
                                                            <CardContent>
                                                                {user.location && user.location !== '' && <div className={`profile-info-ln${rtl ? '-rtl' : ''}`}><Typography><LocationOnOutlined style={styles.infoIcon} />{user.location}</Typography></div>}
                                                                {user.website && user.website !== '' && <div className={`profile-info-ln${rtl ? '-rtl' : ''}`}><LinkOutlined style={styles.infoIcon} /><Link href={user.website.startsWith('http') ? user.website : ('https://' + user.website.replace(/^https?:\/\//, ''))}>{user.website.replace(/^https?:\/\//, '')}</Link></div>}
                                                                <div className={`profile-info-ln${rtl ? '-rtl' : ''}`}><Typography><QueryBuilderOutlined style={styles.infoIcon} />{strings.JOINED_AT + ' ' + moment(user.createdAt).format(process.env.REACT_APP_WS_DATE_FORMAT)}</Typography> </div>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </div>
                                                <div className={rtl ? 'profile-timeline-rtl' : 'profile-timeline'}>
                                                    {conferences.length === 0 && !isLoading ?
                                                        <Card variant="outlined" className={rtl ? 'profile-card-rtl' : 'profile-card'}>
                                                            <CardContent>
                                                                <Typography color="textSecondary">
                                                                    {strings.EMPTY_TIMELINE}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                        :
                                                        <List className={rtl ? 'conf-list-rtl' : 'conf-list'}>
                                                            {conferences.map((conference) =>
                                                            (
                                                                <ListItem key={conference._id} className="timeline-item">
                                                                    <ListItemText
                                                                        disableTypography
                                                                        primary={
                                                                            <div style={{ marginBottom: 5 }}>
                                                                                <Videocam color={conference.isLive ? 'secondary' : 'disabled'} className={`timeline-avatar${rtl ? '-rtl' : ''}`} />
                                                                                <div className="profile-timeline-item-title">
                                                                                    <Link href={`/conference?c=${conference._id}`}>
                                                                                        <Typography style={{ fontWeight: 'bold', color: '#373737' }}>{conference.title}</Typography>
                                                                                    </Link>
                                                                                    <div style={{ display: 'inline-block' }}>
                                                                                        <Typography className={`timeline-item-sub-title-float${rtl ? '-rtl' : ''}`}>
                                                                                            {conference.broadcastedAt ? moment(conference.broadcastedAt).format(process.env.REACT_APP_WS_DATE_FORMAT) : moment(conference.createdAt).format(process.env.REACT_APP_WS_DATE_FORMAT)}
                                                                                        </Typography>
                                                                                        {conference.isPrivate ?
                                                                                            <Tooltip title={strings.PRIVATE}>
                                                                                                <Lock style={iconStyles} />
                                                                                            </Tooltip>
                                                                                            :
                                                                                            <Tooltip title={strings.PUBLIC}>
                                                                                                <Public style={iconStyles} />
                                                                                            </Tooltip>
                                                                                        }
                                                                                    </div>
                                                                                    {!conference.isLive && conference.broadcastedAt && conference.finishedAt &&
                                                                                        <div>
                                                                                            <Typography className="timeline-item-sub-title">
                                                                                                {moment(Math.abs(new Date(conference.finishedAt).getTime() - new Date(conference.broadcastedAt).getTime())).format('HH:mm:ss')}
                                                                                            </Typography>
                                                                                        </div>
                                                                                    }

                                                                                </div>
                                                                                {(!conference.isLive && conference.finishedAt && loggedUser._id === user._id) &&
                                                                                    <Tooltip title={strings.DELETE}>
                                                                                        <IconButton
                                                                                            variant="contained"
                                                                                            size="small"
                                                                                            data-id={conference._id}
                                                                                            style={{ color: '#595959', margin: 0, float: rtl ? 'left' : 'right' }}
                                                                                            onClick={this.handleDelete}
                                                                                        >
                                                                                            <Clear style={{ width: 16, height: 16 }} />
                                                                                        </IconButton>
                                                                                    </Tooltip>
                                                                                }
                                                                                <Tooltip title={strings.MEMBERS}>
                                                                                    <IconButton
                                                                                        variant="contained"
                                                                                        color="default"
                                                                                        size="small"
                                                                                        data-id={conference._id}
                                                                                        style={{ margin: 0, float: rtl ? 'left' : 'right' }}
                                                                                        onClick={this.handleMembers}
                                                                                    >
                                                                                        <People style={{ width: 16, height: 16 }} />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                            </div>
                                                                        }
                                                                        secondary={
                                                                            <div className="timeline-secondary">
                                                                                {conference.isLive &&
                                                                                    <Typography style={{ marginTop: 10, fontWeight: 500, color: '#f50057' }}>
                                                                                        {strings.LIVE}
                                                                                    </Typography>
                                                                                }
                                                                                <Typography style={{ marginTop: 5 }}>
                                                                                    {conference.description}
                                                                                </Typography>
                                                                            </div>}
                                                                    >
                                                                    </ListItemText>
                                                                </ListItem>
                                                            )
                                                            )}
                                                        </List>
                                                    }
                                                </div>
                                                <Dialog
                                                    disableEscapeKeyDown
                                                    maxWidth="xs"
                                                    open={openDeleteDialog}
                                                >
                                                    <DialogTitle>{strings.CONFIRM_TITLE}</DialogTitle>
                                                    <DialogContent>{strings.DELETE_CONFERENCE_CONFIRM}</DialogContent>
                                                    <DialogActions>
                                                        <Button onClick={this.handleCancelDelete} color="default">{strings.CANCEL}</Button>
                                                        <Button onClick={this.handleConfirmDelete} color="secondary">{strings.DELETE}</Button>
                                                    </DialogActions>
                                                </Dialog>
                                                <Members
                                                    open={openMembersDialog}
                                                    conferenceId={conferenceId}
                                                    loggedUser={loggedUser}
                                                    onClose={this.handleCloseMembers}
                                                    onFetch={this.handleMembersFetched}
                                                    onError={this.handleMembersError} />
                                                {isLoading && <Backdrop text={strings.LOADING} />}
                                                {isLoadingAvatar && <Backdrop text={strings.PLEASE_WAIT} />}
                                            </div>
                                        )
                                    )}
                            </div>
                            :
                            (<div className="validate-email">
                                <span>{strings.VALIDATE_EMAIL}</span>
                                <Button
                                    type="button"
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    className="btn-resend"
                                    onClick={this.handleResend}
                                >{strings.RESEND}</Button>
                            </div>)
                        }
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

export default Profile;
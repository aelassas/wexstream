import React, { useEffect, useState } from 'react'
import { strings } from '../config/lang'
import {
    getUserId, getUserById, checkBlockedUser, reportUser, blockUser, unblockUser, getLanguage
} from '../services/UserService'
import { getConnection, getConnectionIds, deleteConnection, connect } from '../services/ConnectionService'
import { notify, getNotification, getNotificationCounter, deleteNotification, approve, decline } from '../services/NotificationService'
import { getConferences, deleteConference } from '../services/ConferenceService'
import { deleteSpeakerEntries } from '../services/TimelineService'
import Backdrop from '../elements/SimpleBackdrop'
import Avatar from '../elements/Avatar'
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
} from '@mui/material'
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
} from '@mui/icons-material'
import moment from 'moment'
import 'moment/locale/fr'
import 'moment/locale/ar'
import MessageForm from '../elements/MessageForm'
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET } from '../config/env'
import Members from '../elements/Members'
import * as Helper from '../common/Helper'
import Master from '../elements/Master'

const Profile = () => {
    const [user, setUser] = useState()
    const [loggedUser, setLoggedUser] = useState()
    const [isConnected, setIsConnected] = useState(false)
    const [isConnectionPending, setIsConnectionPending] = useState(false)
    const [isApprover, setIsApprover] = useState(false)
    const [connectedAt, setConnectedAt] = useState()
    const [notificationCount, setNotificationCount] = useState()
    const [openDisconnectDialog, setOpenDisconnectDialog] = useState(false)
    const [openDeclineDialog, setOpenDeclineDialog] = useState(false)
    const [openMessageForm, setOpenMessageForm] = useState(false)
    const [userNotFound, setUserNotFound] = useState(false)
    const [conferences, setConferences] = useState([])
    const [currentTarget, setCurrentTarget] = useState()
    const [loading, setLoading] = useState(false)
    const [loadingAvatar, setIsLoadingAvatar] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [page, setPage] = useState(1)
    const [fetch, setFetch] = useState(false)
    const [isPrivate, setIsPrivate] = useState(false)
    const [anchorEl, setAnchorEl] = useState()
    const [openActions, setOpenActions] = useState(false)
    const [error, setError] = useState(false)
    const [unauthorized, setUnauthorized] = useState(false)
    const [openReportDialog, setOpenReportDialog] = useState(false)
    const [openBlockDialog, setOpenBlockDialog] = useState(false)
    const [reportMessage, setReportMessage] = useState('')
    const [isBlocked, setIsBlocked] = useState(false)
    const [openMembersDialog, setOpenMembersDialog] = useState(false)
    const [conferenceId, setConferenceId] = useState('')

    const onBeforeUpload = () => {
        setIsLoadingAvatar(true)
    }

    const onAvatarChange = (user) => {
        const _user = Helper.clone(user);
        setIsLoadingAvatar(false)
        setUser(_user)
        setLoggedUser(_user)
    }

    const handleSendMessage = (e) => {
        setOpenMessageForm(true)
    }

    const handleMessageFormClose = (e) => {
        setOpenMessageForm(false)
    }

    const handleConfirmDisconnect = (e) => {
        const connectionId = user._id
        const _user = loggedUser

        if (isApprover && (isConnectionPending || isConnected)) {
            getConnectionIds(connectionId, _user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                        getNotification(_user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) { // Disconnect
                                    decline(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: _user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isLink: true,
                                                    senderUser: _user._id,
                                                    link: `${window.location.origin}/profile?u=${_user._id}`
                                                }
                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            setIsConnected(false)
                                                            setIsConnectionPending(false)
                                                            setIsApprover(false)
                                                            setOpenDisconnectDialog(false)

                                                            getNotificationCounter(_user._id)
                                                                .then(notificationCounter => {
                                                                    setNotificationCount(notificationCounter.count)
                                                                    Helper.info(strings.CONNECTION_DELETED)
                                                                })
                                                                .catch(err => {
                                                                    Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                                                                })
                                                        } else {
                                                            Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                                                    })
                                            }
                                            else {
                                                Helper.error(strings.CONNECTION_DELETE_ERROR)
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                                        })
                                } else {
                                    deleteConnection(_user._id, connectionId)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: _user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isLink: true,
                                                    senderUser: _user._id,
                                                    link: `${window.location.origin}/profile?u=${_user._id}`
                                                }
                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            setIsConnected(false)
                                                            setIsConnectionPending(false)
                                                            setIsApprover(false)

                                                            Helper.info(strings.CONNECTION_DELETED)
                                                        }
                                                        else {
                                                            Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                                                    })
                                            }
                                            else {
                                                Helper.error(strings.CONNECTION_DELETE_ERROR)
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                                        })
                                }
                            })
                            .catch(err => {
                                Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                            })
                    } else {
                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                    }
                })
                .catch(err => {
                    Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                })
        } else if (isConnectionPending || isConnected) {
            getConnectionIds(_user._id, connectionId)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                        getNotification(connectionId, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) {
                                    deleteNotification(notification._id)
                                        .then(status => {
                                            if (status !== 200) {
                                                Helper.error(strings.CONNECTION_DELETE_ERROR)
                                            }
                                        })
                                }
                            })

                        if (isConnected) { // Disconnect
                            deleteConnection(_user._id, connectionId)
                                .then(status => {

                                    if (status === 200) {
                                        const notification = {
                                            user: connectionId,
                                            isRequest: false,
                                            message: _user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                            isLink: true,
                                            senderUser: _user._id,
                                            link: `${window.location.origin}/profile?u=${_user._id}`
                                        }

                                        notify(notification)
                                            .then(notificationStatus => {
                                                if (notificationStatus === 200) {
                                                    setIsConnected(false)
                                                    setIsConnectionPending(false)
                                                    setIsApprover(false)
                                                    setOpenDisconnectDialog(false)

                                                    Helper.info(strings.CONNECTION_DELETED)
                                                }
                                                else {
                                                    Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                }
                                            })
                                            .catch(err => {
                                                Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                                            })
                                    }
                                    else {
                                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                                    }
                                })
                                .catch(err => {
                                    Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                                })

                        } else { // Cancel request
                            deleteConnection(_user._id, connectionId)
                                .then(status => {
                                    if (status === 200) {
                                        setIsConnected(false)
                                        setIsConnectionPending(false)
                                        setIsApprover(false)
                                        setOpenDisconnectDialog(false)

                                        Helper.info(strings.CONNECTION_CANCELED)
                                    } else {
                                        Helper.error()
                                    }
                                })
                                .catch(err => {
                                    Helper.error(null, err)
                                })
                        }
                    } else {
                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                    }
                })
                .catch(err => {
                    Helper.error(strings.CONNECTION_DELETE_ERROR, err)
                })
        }
    }

    const handleCancelDisconnect = (e) => {
        setOpenDisconnectDialog(false)
    }

    const handleConnect = (e) => {
        const connectionId = user._id
        const _user = loggedUser

        if (isApprover && isConnectionPending && !isConnected) {
            getConnectionIds(connectionId, _user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                        getNotification(_user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) { // Connect
                                    approve(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: strings.CONNECTION_APPROVE_NOTIFICATION + ' ' + _user.fullName + '.',
                                                    isLink: true,
                                                    senderUser: _user._id,
                                                    link: `${window.location.origin}/profile?u=${_user._id}`
                                                }
                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {

                                                            setIsConnected(true)
                                                            setIsConnectionPending(false)
                                                            getConnection(_user._id, connectionId)
                                                                .then(
                                                                    conn => {
                                                                        if (conn) {
                                                                            setConnectedAt(conn.connectedAt)
                                                                        }
                                                                    })
                                                                .catch(err => {
                                                                    Helper.error(null, err)
                                                                })

                                                            getNotificationCounter(_user._id)
                                                                .then(notificationCounter => {
                                                                    setNotificationCount(notificationCounter.count)
                                                                    Helper.info(strings.CONNECTION_APPROVE)
                                                                })
                                                                .catch(err => {
                                                                    Helper.error(strings.CONNECTION_APPROVE_ERROR, err)
                                                                })
                                                        } else {
                                                            Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_APPROVE_ERROR, err)
                                                    })
                                            }
                                            else {
                                                Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error(strings.CONNECTION_APPROVE_ERROR, err)
                                        })
                                } else {
                                    Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                }
                            })
                            .catch(err => {
                                Helper.error(strings.CONNECTION_APPROVE_ERROR, err)
                            })
                    } else {
                        Helper.error(strings.CONNECTION_APPROVE_ERROR)
                    }
                })
                .catch(err => {
                    Helper.error(strings.CONNECTION_APPROVE_ERROR, err)
                })
        } else if (isApprover && (isConnectionPending || isConnected)) {
            setOpenDisconnectDialog(true)
        } else {
            if (isConnectionPending || isConnected) {
                setOpenDisconnectDialog(true)
            } else { // Send connection request
                const data = { _id: _user._id, connectionId: connectionId }
                connect(data)
                    .then(connectionIds => {
                        if (connectionIds) {
                            const notification = {
                                user: connectionId,
                                message: _user.fullName + ' ' + strings.CONNECTION_REQUEST_NOTIFICATION,
                                isRequest: true,
                                senderConnection: connectionIds._senderConnectionId,
                                approverConnection: connectionIds._approverConnectionId,
                                isLink: true,
                                senderUser: _user._id,
                                link: `${window.location.origin}/profile?u=${_user._id}`
                            }

                            notify(notification)
                                .then(notificationStatus => {
                                    if (notificationStatus === 200) {
                                        setIsConnected(false)
                                        setIsConnectionPending(true)
                                        setIsApprover(false)
                                        Helper.info(strings.CONNECTION_REQUEST_SENT)
                                    } else {
                                        Helper.error(strings.CONNECTION_REQUEST_ERROR)
                                    }
                                })
                                .catch(err => {
                                    Helper.error(strings.CONNECTION_REQUEST_ERROR, err)
                                })
                        } else {
                            Helper.error(strings.CONNECTION_REQUEST_ERROR)
                        }
                    })
                    .catch(err => {
                        Helper.error(strings.CONNECTION_REQUEST_ERROR, err)
                    })
            }
        }
    }

    const handleDecline = (e) => {
        setOpenDeclineDialog(true)
    }

    const handleCancelDecline = (e) => {
        setOpenDeclineDialog(false)
    }

    const handleConfirmDecline = (e) => {
        const connectionId = user._id
        const _user = loggedUser

        if (isApprover && isConnectionPending && !isConnected) {
            getConnectionIds(connectionId, _user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                        getNotification(_user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) {
                                    decline(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    message: _user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isRequest: false,
                                                    senderConnection: connectionIds._senderConnectionId,
                                                    approverConnection: connectionIds._approverConnectionId,
                                                    isLink: true,
                                                    senderUser: _user._id,
                                                    link: `${window.location.origin}/profile?u=${_user._id}`
                                                }

                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            setIsConnected(false)
                                                            setIsConnectionPending(false)
                                                            setIsApprover(false)
                                                            setOpenDeclineDialog(false)

                                                            getNotificationCounter(_user._id)
                                                                .then(notificationCounter => {
                                                                    setNotificationCount(notificationCounter.count)
                                                                    Helper.info(strings.CONNECTION_DECLINE)
                                                                })
                                                                .catch(err => {
                                                                    Helper.error(strings.CONNECTION_DECLINE_ERROR, err)
                                                                })
                                                        } else {
                                                            Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_DECLINE_ERROR, err)
                                                    })
                                            } else {
                                                Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error(strings.CONNECTION_DECLINE_ERROR, err)
                                        })
                                } else {
                                    Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                }
                            })
                            .catch(err => {
                                Helper.error(strings.CONNECTION_DECLINE_ERROR, err)
                            })
                    } else {
                        Helper.error(strings.CONNECTION_DECLINE_ERROR)
                    }
                })
                .catch(err => {
                    Helper.error(strings.CONNECTION_DECLINE_ERROR, err)
                })
        } else {
            Helper.error(strings.CONNECTION_DECLINE_ERROR)
        }
    }

    const findIndex = (conferenceId) => conferences.findIndex(u => u._id === conferenceId)

    const handleDelete = (event) => {
        event.preventDefault()
        setCurrentTarget(event.currentTarget)
        setOpenDeleteDialog(true)
    }

    const handleCancelDelete = (event) => {
        event.preventDefault()
        setOpenDeleteDialog(false)
    }

    const handleConfirmDelete = (event) => {
        event.preventDefault()
        const conferenceId = currentTarget.getAttribute('data-id')

        deleteConference(conferenceId)
            .then(status => {
                if (status === 200) {
                    const index = findIndex(conferenceId)
                    const _conferences = [...conferences]
                    _conferences.splice(index, 1)
                    setConferences(_conferences)
                    setOpenDeleteDialog(false)

                    deleteSpeakerEntries(loggedUser._id, conferenceId)
                        .then(status => {
                            if (status !== 200) {
                                Helper.error()
                            }
                        })
                        .catch(err => {
                            Helper.error(null, err)
                        })
                } else {
                    Helper.error()
                    setOpenDeleteDialog(false)
                }
            })
            .catch(err => {
                Helper.error(null, err)
                setOpenDeleteDialog(false)
            })
    }

    const handleActionsClick = (event) => {
        setAnchorEl(event.currentTarget)
        setOpenActions(true)
    }

    const handleActionsClose = () => {
        setAnchorEl(null)
        setOpenActions(false)
    }

    const handleReport = () => {
        setOpenReportDialog(true)
        handleActionsClose()
    }

    const handleReportMessageChange = (event) => {
        setReportMessage(event.target.value)
    }

    const handleCancelReport = () => {
        setReportMessage('')
        setOpenReportDialog(false)
    }

    const handleConfirmReport = () => {
        const data = {
            user: loggedUser._id,
            reportedUser: user._id,
            message: reportMessage
        }

        reportUser(data)
            .then(status => {
                if (status === 200) {
                    setReportMessage('')
                    setOpenReportDialog(false)

                    Helper.info(strings.REPORT_SUCCESS)
                } else {
                    Helper.error()
                }
            })
            .catch((err) => {
                Helper.error(null, err)
            })
    }

    const handleBlock = () => {
        setOpenBlockDialog(true)
        handleActionsClose()
    }

    const handleCancelBlock = () => {
        setOpenBlockDialog(false)
    }

    const handleConfirmBlock = () => {

        if (isBlocked) {
            unblockUser(loggedUser._id, user._id)
                .then(status => {
                    if (status === 200) {
                        setOpenBlockDialog(false)
                        setIsBlocked(false)

                        Helper.info(strings.UNBLOCK_SUCCESS)
                    } else {
                        Helper.error()
                    }
                })
                .catch((err) => {
                    Helper.error(null, err)
                })
        } else {
            blockUser(loggedUser._id, user._id)
                .then(status => {
                    if (status === 200) {
                        setOpenBlockDialog(false)
                        setIsBlocked(true)

                        Helper.info(strings.BLOCK_SUCCESS)
                    } else {
                        Helper.error()
                    }
                })
                .catch((err) => {
                    Helper.error(null, err)
                })
        }
    }

    const handleMembers = event => {
        setLoading(true)
        const conferenceId = event.currentTarget.getAttribute('data-id')
        setConferenceId(conferenceId)
        setOpenMembersDialog(true)
    }

    const handleCloseMembers = event => {
        setOpenMembersDialog(false)
    }

    const handleMembersFetched = event => {
        setLoading(false)
    }

    const handleMembersError = () => {
        setLoading(false)
        Helper.error()
    }

    useEffect(() => {
        if (!userNotFound && !error) {
            if (isMobile()) {
                const div = document.querySelector('.profile-container')

                if (div) {
                    const profileHeader = document.querySelector('.profile-header')
                    const profileHeaderHeight = profileHeader.clientHeight
                    const profileHeaderOffset = 100
                    div.onscroll = (event) => {
                        if (fetch && !loading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop + (profileHeaderHeight + profileHeaderOffset))) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                            const _page = page + 1
                            setPage(_page)
                            fetchConferences(user, _page, isPrivate)
                        }
                    }
                }
            } else {
                const div = document.querySelector('.profile-timeline')
                if (div) {
                    div.onscroll = (event) => {
                        if (fetch && !loading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                            const _page = page + 1
                            setPage(_page)
                            fetchConferences(user, _page, isPrivate)
                        }
                    }
                }
            }

        }
    }, [userNotFound, error, fetch, loading, user, page, isPrivate])

    const fetchConferences = (user, page, isPrivate) => {
        if (user) {
            setLoading(true)

            getConferences(user._id, isPrivate, page)
                .then(data => {
                    const _conferences = [...conferences, ...data]

                    setConferences(_conferences)
                    setFetch(data.length > 0)
                    setLoading(false)
                })
                .catch(err => {
                    setLoading(false)
                    Helper.error(null, err)
                })
        }
    }

    const onLoad = (user) => {
        setLoading(true)

        const language = getLanguage()
        moment.locale(language)

        let userId = getUserId()
        if (userId === '') {
            userId = user._id
        }
        if (Helper.isObjectId(userId)) {
            if (userId !== user._id) {

                checkBlockedUser(userId, user._id)
                    .then(userStatus => {
                        if (userStatus === 200) {
                            setLoggedUser(user)
                            setUnauthorized(true)
                            setLoading(false)
                        } else if (userStatus === 204) {
                            getUserById(userId)
                                .then(_user => {
                                    if (_user) {

                                        if (_user.blacklisted) {
                                            setLoggedUser(user)
                                            setUser(null)
                                            setUnauthorized(true)
                                            return
                                        }

                                        getConnection(user._id, _user._id)
                                            .then(conn => {

                                                const loadPage = () => {
                                                    let isPrivate = false
                                                    if (conn && !conn.isPending) {
                                                        isPrivate = true
                                                    }

                                                    setLoggedUser(user)
                                                    setUser(_user)
                                                    setIsPrivate(isPrivate)

                                                    fetchConferences(user, page, isPrivate)
                                                    // infiniteScroll()
                                                }

                                                if (conn) {
                                                    setIsConnected(!conn.isPending)
                                                    setIsConnectionPending(conn.isPending)
                                                    setIsApprover(conn.isApprover)
                                                    setConnectedAt(conn.connectedAt)

                                                    checkBlockedUser(user._id, userId)
                                                        .then(userStatus => {
                                                            setIsBlocked(userStatus === 200)
                                                            loadPage()
                                                        })
                                                } else {
                                                    loadPage()
                                                }
                                            })
                                            .catch(err => {
                                                Helper.error(null, err)
                                            })

                                    } else {
                                        setLoggedUser(user)
                                        setUser(null)
                                        setUserNotFound(true)
                                    }
                                })
                                .catch(err => {
                                    setLoggedUser(user)
                                    setUser(null)
                                    setError(true)
                                    setLoading(false)
                                })
                        } else {
                            setLoggedUser(user)
                            setUser(null)
                            setError(true)
                            setLoading(false)
                        }
                    })
                    .catch(err => {
                        setLoggedUser(user)
                        setUser(null)
                        setError(true)
                        setLoading(false)
                    })

            } else {
                setLoggedUser(user)
                setUser(user)
                setIsPrivate(true)
                fetchConferences(user, page, true)
                // infiniteScroll()
            }
        } else {
            setLoggedUser(user)
            setUser(null)
            setUserNotFound(true)
        }
    }

    const rtl = false

    const styles = {
        infoIcon: {
            width: 32,
            marginBottom: -8,
            marginRight: 5,
            marginLeft: 5
        }
    }

    const iconStyles = {
        float: 'left',
        height: 14,
        marginTop: -1,
        color: '#595959'
    }

    return (
        <Master notificationCount={notificationCount} onLoad={onLoad} strict>
            {user &&
                <div className={`${isMobile() ? `profile-content` : ((rtl ? 'profile-rtl' : 'profile') + ' content')}`}>
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
                                <div className={isMobile() ? `profile-container` : null}>
                                    <div className={rtl ? 'profile-header-rtl' : 'profile-header'}>
                                        <Avatar loggedUser={loggedUser}
                                            user={user}
                                            size="large"
                                            onBeforeUpload={onBeforeUpload}
                                            onChange={onAvatarChange}
                                            readonly={user._id !== loggedUser._id}
                                            color="disabled"
                                            className={rtl ? 'profile-avatar-rtl' : 'profile-avatar'} />
                                        <Typography variant="h4" className="profile-name" style={{ textAlign: 'center', fontWeight: 600, marginTop: 15 }}>{user.fullName}</Typography>
                                        {user.bio && user.bio !== '' && <Typography variant="h6" style={{ textAlign: 'center', fontWeight: 400, marginTop: 10, color: '#676767' }}>{user.bio}</Typography>}
                                        {user._id !== loggedUser._id &&
                                            <div className="profile-actions">
                                                <Button
                                                    variant="contained"
                                                    color={isConnected ? "error" : (isConnectionPending && !isApprover ? "inherit" : "info")}
                                                    size="small"
                                                    onClick={handleConnect}
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
                                                        color="error"
                                                        size="small"
                                                        onClick={handleDecline}
                                                    >
                                                        {strings.DECLINE}
                                                    </Button>
                                                }
                                                {(isConnected || user.enablePrivateMessages)
                                                    &&
                                                    <Button
                                                        variant="contained"
                                                        color="info"
                                                        size="small"
                                                        onClick={handleSendMessage}
                                                    >
                                                        {strings.SEND_MESSAGE}
                                                    </Button>
                                                }
                                                <IconButton
                                                    aria-label="more"
                                                    aria-haspopup="true"
                                                    onClick={handleActionsClick}
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
                                                    onClose={handleActionsClose}
                                                >
                                                    <MenuItem key="report" onClick={handleReport}>
                                                        <Report style={rtl ? { marginLeft: 10 } : { marginRight: 10 }} /> {strings.REPORT}
                                                    </MenuItem>
                                                    <MenuItem key="block" onClick={handleBlock}>
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
                                                        <Button onClick={handleCancelDisconnect} color="inherit">{strings.CANCEL}</Button>
                                                        <Button onClick={handleConfirmDisconnect} color="info">{strings.YES}</Button>
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
                                                        <Button onClick={handleCancelDecline} color="inherit">{strings.CANCEL}</Button>
                                                        <Button onClick={handleConfirmDecline} color="error">{strings.DECLINE}</Button>
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
                                                                onChange={handleReportMessageChange}
                                                                multiline
                                                                rows={10}
                                                            />
                                                        </FormControl>
                                                    </DialogContent>
                                                    <DialogActions className="buttons">
                                                        <Button onClick={handleCancelReport} color="inherit" variant="contained">{strings.CANCEL}</Button>
                                                        <Button onClick={handleConfirmReport} color="info" variant="contained" disabled={reportMessage.length === 0}>{strings.REPORT}</Button>
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
                                                        <Button onClick={handleCancelBlock} color="inherit">{strings.CANCEL}</Button>
                                                        <Button onClick={handleConfirmBlock} color="info">{isBlocked ? strings.UNBLOCK : strings.BLOCK}</Button>
                                                    </DialogActions>
                                                </Dialog>
                                                <MessageForm user={loggedUser} hideButton={true} open={openMessageForm} onClose={handleMessageFormClose} to={user._id} />
                                            </div>
                                        }
                                        <div className={rtl ? 'profile-info-rtl' : 'profile-info'}>
                                            <Card variant="outlined" className="profile-info-card">
                                                <CardContent>
                                                    {user.location && user.location !== '' && <div className={`profile-info-ln`}><Typography><LocationOnOutlined style={styles.infoIcon} />{user.location}</Typography></div>}
                                                    {user.website && user.website !== '' && <div className={`profile-info-ln`}><LinkOutlined style={styles.infoIcon} /><Link href={user.website.startsWith('http') ? user.website : ('https://' + user.website.replace(/^https?:\/\//, ''))}>{user.website.replace(/^https?:\/\//, '')}</Link></div>}
                                                    <div className={`profile-info-ln`}><Typography><QueryBuilderOutlined style={styles.infoIcon} />{strings.JOINED_AT + ' ' + moment(user.createdAt).format(process.env.REACT_APP_WS_DATE_FORMAT)}</Typography> </div>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                    <div className={rtl ? 'profile-timeline-rtl' : 'profile-timeline'}>
                                        {conferences.length === 0 && !loading ?
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
                                                                    <Videocam color={conference.isLive ? 'errpr' : 'disabled'} className={`timeline-avatar`} />
                                                                    <div className="profile-timeline-item-title">
                                                                        <Link href={`/conference?c=${conference._id}`}>
                                                                            <Typography style={{ fontWeight: 'bold', color: '#373737' }}>{conference.title}</Typography>
                                                                        </Link>
                                                                        <div style={{ display: 'inline-block' }}>
                                                                            <Typography className={`timeline-item-sub-title-float`}>
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
                                                                                onClick={handleDelete}
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
                                                                            onClick={handleMembers}
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
                                            <Button onClick={handleCancelDelete} color="inherit">{strings.CANCEL}</Button>
                                            <Button onClick={handleConfirmDelete} color="error">{strings.DELETE}</Button>
                                        </DialogActions>
                                    </Dialog>
                                    <Members
                                        open={openMembersDialog}
                                        conferenceId={conferenceId}
                                        loggedUser={loggedUser}
                                        onClose={handleCloseMembers}
                                        onFetch={handleMembersFetched}
                                        onError={handleMembersError} />
                                    {loading && <Backdrop text={strings.LOADING} />}
                                    {loadingAvatar && <Backdrop text={strings.PLEASE_WAIT} />}
                                </div>
                            )
                        )}
                </div>
            }
        </Master>
    )
}

export default Profile
import React, { useState } from 'react'
import { strings } from '../config/app.config'
import * as UserService from '../services/UserService'
import * as ConnectionService from '../services/ConnectionService'
import * as NotificationService from '../services/NotificationService'
import Backdrop from '../elements/SimpleBackdrop'
import MessageForm from '../elements/MessageForm'
import Avatar from '../elements/Avatar'
import moment from 'moment'
import 'moment/locale/fr'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    IconButton,
    Tooltip,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Link,
    Typography
} from '@mui/material'
import {
    Mail,
    LinkOff,
    ThumbUp,
    ThumbDown,
    Cancel,
    LinkIcon
} from '@mui/icons-material'
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET } from '../config/env.config'
import Master from '../elements/Master'
import * as Helper from '../common/Helper'

const Search = () => {
    const [searchKeyword, setSearchKeyword] = useState('')
    const [user, setUser] = useState()
    const [users, setUsers] = useState([])
    const [notificationCount, setNotificationCount] = useState()
    const [openMessageForm, setOpenMessageForm] = useState(false)
    const [to, setTo] = useState()
    const [loading, setLoading] = useState(false)
    const [openDeclineDialog, setOpenDeclineDialog] = useState(false)
    const [openDisconnectDialog, setOpenDisconnectDialog] = useState(false)
    const [declineTarget, setDeclineTarget] = useState()
    const [disconnectTarget, setDisconnectTarget] = useState()
    const [connected, setConnected] = useState(false)
    const [page, setPage] = useState(1)
    const [fetch, setFetch] = useState(false)

    const findIndex = (userId) => (
        users.findIndex(u => u._id === userId)
    )

    const handleCancelDisconnect = (e) => {
        setOpenDisconnectDialog(false)

    }
    
    const handleConnect = (e) => {
        setDisconnectTarget(e.currentTarget)

        const isApprover = e.currentTarget.getAttribute('data-is-approver') === 'true'
        const isConnectionPending = e.currentTarget.getAttribute('data-is-connection-pending') === 'true'
        const connected = e.currentTarget.getAttribute('data-is-connected') === 'true'
        const connectionId = e.currentTarget.getAttribute('data-id')
        const _users = [...users] // Make a shallow copy of users

        if (isApprover && isConnectionPending && !connected) {
            ConnectionService.getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                        NotificationService.getNotification(user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) { // Connect
                                    NotificationService.approve(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: strings.CONNECTION_APPROVE_NOTIFICATION + ' ' + user.fullName + '.',
                                                    isLink: true,
                                                    senderUser: user._id,
                                                    link: `${window.location.origin}/profile?u=${user._id}`
                                                }
                                                NotificationService.notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            ConnectionService.getConnection(user._id, connectionId)
                                                                .then(
                                                                    conn => {
                                                                        if (conn) {
                                                                            const index = findIndex(connectionId)
                                                                            // Make a shallow copy of the user to mutate
                                                                            const uuser = { ..._users[index] }
                                                                            // Update user
                                                                            uuser.connection = conn
                                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                                            _users[index] = uuser
                                                                            // Set the state to our new copy
                                                                            setUsers(_users)
                                                                        }
                                                                    })
                                                                .catch(err => {
                                                                    Helper.error(null, err)
                                                                })

                                                            NotificationService.getNotificationCounter(user._id)
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
        } else if (isApprover && (isConnectionPending || connected)) {
            setConnected(connected)
            setOpenDisconnectDialog(true)
        } else {
            if (isConnectionPending || connected) {
                setConnected(connected)
                setOpenDisconnectDialog(true)
            } else { // Send connection request
                const data = { _id: user._id, connectionId: connectionId }
                ConnectionService.connect(data)
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
                            }

                            NotificationService.notify(notification)
                                .then(notificationStatus => {
                                    if (notificationStatus === 200) {
                                        const index = findIndex(connectionId)
                                        // Make a shallow copy of users you want to mutate
                                        const uuser = { ..._users[index] }
                                        // Update user
                                        uuser.connection = { isPending: true, isApprover: false }
                                        // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                        _users[index] = uuser
                                        // Set the state to our new copy
                                        setUsers(_users)
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

    const handleConfirmDisconnect = (e) => {
        const isApprover = disconnectTarget.getAttribute('data-is-approver') === 'true'
        const isConnectionPending = disconnectTarget.getAttribute('data-is-connection-pending') === 'true'
        const connected = disconnectTarget.getAttribute('data-is-connected') === 'true'
        const connectionId = disconnectTarget.getAttribute('data-id')
        const _users = [...users] // Make a shallow copy of users

        if (isApprover && (isConnectionPending || connected)) {
            ConnectionService.getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                        NotificationService.getNotification(user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) { // Disconnect
                                    NotificationService.decline(notification._id)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isLink: true,
                                                    senderUser: user._id,
                                                    link: `${window.location.origin}/profile?u=${user._id}`
                                                }
                                                NotificationService.notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = findIndex(connectionId)
                                                            // Make a shallow copy of the user to mutate
                                                            const uuser = { ..._users[index] }
                                                            // Update user
                                                            uuser.connection = undefined
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            _users[index] = uuser
                                                            // Set the state to our new copy
                                                            setUsers(_users)
                                                            setOpenDisconnectDialog(false)

                                                            NotificationService.getNotificationCounter(user._id)
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
                                    ConnectionService.deleteConnection(user._id, connectionId)
                                        .then(status => {
                                            if (status === 200) {
                                                const notification = {
                                                    user: connectionId,
                                                    isRequest: false,
                                                    message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                    isLink: true,
                                                    senderUser: user._id,
                                                    link: `${window.location.origin}/profile?u=${user._id}`
                                                }
                                                NotificationService.notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = findIndex(connectionId)
                                                            // Make a shallow copy of the user to mutate
                                                            const uuser = { ..._users[index] }
                                                            // Update user
                                                            uuser.connection = undefined
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            _users[index] = uuser
                                                            // Set the state to our new copy
                                                            setUsers(_users)
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
        } else {
            if (isConnectionPending || connected) {
                ConnectionService.getConnectionIds(user._id, connectionId)
                    .then(connectionIds => {
                        if (connectionIds) {
                            const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                            NotificationService.getNotification(connectionId, _senderConnectionId, _approverConnectionId)
                                .then(notification => {
                                    if (notification) {
                                        NotificationService.deleteNotification(notification._id)
                                            .then(status => {
                                                if (status !== 200) {
                                                    Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                }
                                            })
                                    }
                                })

                            if (connected) { // Disconnect
                                ConnectionService.deleteConnection(user._id, connectionId)
                                    .then(status => {

                                        if (status === 200) {
                                            const notification = {
                                                user: connectionId,
                                                isRequest: false,
                                                message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                                isLink: true,
                                                senderUser: user._id,
                                                link: `${window.location.origin}/profile?u=${user._id}`
                                            }

                                            NotificationService.notify(notification)
                                                .then(notificationStatus => {
                                                    if (notificationStatus === 200) {
                                                        const index = findIndex(connectionId)
                                                        // Make a shallow copy of the user to mutate
                                                        const uuser = { ..._users[index] }
                                                        // Update user
                                                        uuser.connection = undefined
                                                        // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                        _users[index] = uuser
                                                        // Set the state to our new copy
                                                        setUsers(_users)
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
                                ConnectionService.deleteConnection(user._id, connectionId)
                                    .then(status => {
                                        if (status === 200) {
                                            const index = findIndex(connectionId)
                                            // Make a shallow copy of the user to mutate
                                            const uuser = { ..._users[index] }
                                            // Update user
                                            uuser.connection = undefined
                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                            _users[index] = uuser
                                            // Set the state to our new copy
                                            setUsers(_users)
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
    }

    const handleCancelDecline = (e) => {
        setOpenDeclineDialog(false)
    }

    const handleDecline = (e) => {
        setDeclineTarget(e.currentTarget)
        setOpenDeclineDialog(true)
    }

    const handleConfirmDecline = () => {
        const isApprover = declineTarget.getAttribute('data-is-approver') === 'true'
        const isConnectionPending = declineTarget.getAttribute('data-is-connection-pending') === 'true'
        const connected = declineTarget.getAttribute('data-is-connected') === 'true'
        const connectionId = declineTarget.getAttribute('data-id')

        const _users = [...users] // Make a shallow copy of users
        if (isApprover && isConnectionPending && !connected) {
            ConnectionService.getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
                        NotificationService.getNotification(user._id, _senderConnectionId, _approverConnectionId)
                            .then(notification => {
                                if (notification) {
                                    NotificationService.decline(notification._id)
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
                                                }

                                                NotificationService.notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = findIndex(connectionId)
                                                            // Make a shallow copy of the user to mutate
                                                            const uuser = { ..._users[index] }
                                                            // Update user
                                                            uuser.connection = undefined
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            _users[index] = uuser
                                                            // Set the state to our new copy
                                                            setUsers(_users)
                                                            setOpenDeclineDialog(false)

                                                            NotificationService.getNotificationCounter(user._id)
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

    const handleSendMessage = (e) => {
        const to = e.currentTarget.getAttribute('data-id')
        setTo(to)
        setOpenMessageForm(true)
    }

    const handleMessageFormClose = (e) => {
        setOpenMessageForm(false)
    }

    const fetchUsers = (page) => {
        setLoading(true)

        UserService.searchUsers(user._id, searchKeyword, false, page)
            .then(data => {
                const _users = [...users, ...data]
                setUsers(_users)
                setFetch(data.length > 0)
                setLoading(false)
            })
            .catch(err => {
                Helper.error(null, err)
            })
    }

    const onLoad = (user) => {
        const language = UserService.getLanguage()
        moment.locale(language)
        setUser(user)
        setSearchKeyword(UserService.getSearchKeyword())

        const div = document.querySelector('.content')
        if (div) {
            div.onscroll = (event) => {
                if (fetch && !loading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                    const _page = page + 1
                    setPage(_page)
                    fetchUsers(_page)
                }
            }
        }
    }

    return (
        <Master onLoad={onLoad} notificationCount={notificationCount} strict>
            <div className="search content">
                {!loading && users.length === 0 ?
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
                                <ListItemAvatar className="list-item-avatar">
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
                                            onClick={handleConnect}
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
                                                        onClick={handleConnect}
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
                                                                onClick={handleConnect}
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
                                                                onClick={handleConnect}
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
                                                            onClick={handleConnect}
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
                                                    onClick={handleDecline}
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
                                                        onClick={handleDecline}
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
                                                    onClick={handleSendMessage}
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
                                                        onClick={handleSendMessage}
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
                    <DialogContent>{connected ? strings.DISCONNECT_CONFIRM : strings.CANCEL_CONFIRM}</DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelDisconnect} color="default">{strings.CANCEL}</Button>
                        <Button onClick={handleConfirmDisconnect} color="secondary">{strings.YES}</Button>
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
                        <Button onClick={handleCancelDecline} color="default">{strings.CANCEL}</Button>
                        <Button onClick={handleConfirmDecline} color="secondary">{strings.DECLINE}</Button>
                    </DialogActions>
                </Dialog>
                <MessageForm user={user} hideButton={true} open={openMessageForm} onClose={handleMessageFormClose} to={to} />
                {loading && <Backdrop text={strings.LOADING} />}
            </div>
        </Master>
    )
}

export default Search
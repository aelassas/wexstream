import React, { useState } from 'react'
import { strings } from '../config/app.config'
import { getLanguage } from '../services/UserService'
import { notify, getNotification, getNotificationCounter, deleteNotification, approve, decline } from '../services/NotificationService'
import { getConnections, getConnectionIds, deleteConnection } from '../services/ConnectionService'
import MessageForm from '../elements/MessageForm'
import Avatar from '../elements/Avatar'
import Backdrop from '../elements/SimpleBackdrop'
import moment from 'moment'
import 'moment/locale/fr'
import 'moment/locale/ar'
import {
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Card,
    CardContent,
    Typography,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    IconButton
} from '@mui/material'
import {
    Mail,
    LinkOff,
    ThumbUp,
    ThumbDown,
    Cancel,
    Link as LinkIcon
} from '@mui/icons-material'
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET } from '../config/env.config'
import Master from '../elements/Master'
import * as Helper from '../common/Helper'

const Connections = () => {
    const [user, setUser] = useState()
    const [connections, setConnections] = useState([])
    const [notificationCount, setNotificationCount] = useState()
    const [openMessageForm, setOpenMessageForm] = useState(false)
    const [to, setTo] = useState()
    const [loading, setLoading] = useState(false)
    const [openDeclineDialog, setOpenDeclineDialog] = useState(false)
    const [declineTarget, setDeclineTarget] = useState()
    const [openDisconnectDialog, setOpenDisconnectDialog] = useState(false)
    const [disconnectTarget, setDisconnectTarget] = useState()
    const [connected, setConnected] = useState(false)
    const [page, setPage] = useState(1)
    const [fetch, setFetch] = useState(false)

    findIndex = (userId) => (
        connections.findIndex(c => c.user._id === userId)
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
        const _connections = [...connections] // Make a shallow copy of connections

        if (isApprover && isConnectionPending && !connected) {
            getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
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
                                                }

                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = findIndex(connectionId)
                                                            // Make a shallow copy of the user to mutate
                                                            const uconn = { ..._connections[index] }
                                                            // Update user
                                                            uconn.isPending = false
                                                            // Put it back into users array. N.B. we *are* mutating the array here, but that's why we made a copy first
                                                            _connections[index] = uconn
                                                            // Set the state to our new copy
                                                            setConnections(_connections)

                                                            getNotificationCounter(user._id)
                                                                .then(notificationCounter => {
                                                                    setNotificationCount(notificationCounter.count)
                                                                    Helper.info(strings.CONNECTION_APPROVE)
                                                                })
                                                                .catch(err => {
                                                                    Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                                                })
                                                        } else {
                                                            Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                                    })
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                        })
                                } else {
                                    Helper.error(strings.CONNECTION_APPROVE_ERROR)
                                }
                            })
                            .catch(err => {
                                Helper.error(strings.CONNECTION_APPROVE_ERROR)
                            })
                    } else {
                        Helper.error(strings.CONNECTION_APPROVE_ERROR)
                    }
                })
                .catch(err => {
                    Helper.error(strings.CONNECTION_APPROVE_ERROR)
                })
        } else if (isApprover && (isConnectionPending || connected)) {
            setConnected(connected)
            setOpenDisconnectDialog(true)
        } else {
            if (isConnectionPending || connected) {
                setConnected(connected)
                setOpenDisconnectDialog(true)
            }
        }
    }

    const handleConfirmDisconnect = (e) => {
        const isApprover = disconnectTarget.getAttribute('data-is-approver') === 'true'
        const isConnectionPending = disconnectTarget.getAttribute('data-is-connection-pending') === 'true'
        const connected = disconnectTarget.getAttribute('data-is-connected') === 'true'
        const connectionId = disconnectTarget.getAttribute('data-id')
        const connections = [...connections] // Make a shallow copy of connections

        if (isApprover && (isConnectionPending || connected)) {
            getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
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
                                                }
                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = findIndex(connectionId)
                                                            connections.splice(index, 1)
                                                            setConnections(connections)
                                                            setOpenDisconnectDialog(false)

                                                            getNotificationCounter(user._id)
                                                                .then(notificationCounter => {
                                                                    setNotificationCount(notificationCounter.count)
                                                                    Helper.info(strings.CONNECTION_DELETED)
                                                                })
                                                                .catch(err => {
                                                                    Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                                })
                                                        } else {
                                                            Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                    })
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error(strings.CONNECTION_DELETE_ERROR)
                                        })
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
                                                }
                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = findIndex(connectionId)
                                                            connections.splice(index, 1)
                                                            setConnections(connections)
                                                            setOpenDisconnectDialog(false)
                                                            Helper.info(strings.CONNECTION_DELETED)
                                                        }
                                                        else {
                                                            Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                    })
                                            }
                                            else {
                                                Helper.error(strings.CONNECTION_DELETE_ERROR)
                                            }
                                        })
                                }
                            })
                            .catch(err => {
                                Helper.error(strings.CONNECTION_DELETE_ERROR)
                            })
                    } else {
                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                    }
                })
                .catch(err => {
                    Helper.error(strings.CONNECTION_DELETE_ERROR)
                })
        } else {
            if (isConnectionPending || connected) {
                getConnectionIds(user._id, connectionId)
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
                                            .catch(err => {
                                                Helper.error(strings.CONNECTION_DELETE_ERROR)
                                            })
                                    }
                                })
                                .catch(err => {
                                    Helper.error(strings.CONNECTION_DELETE_ERROR)
                                })

                            if (connected) { // Disconnect
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
                                            }
                                            notify(notification)
                                                .then(notificationStatus => {
                                                    if (notificationStatus === 200) {
                                                        const index = findIndex(connectionId)
                                                        connections.splice(index, 1)
                                                        setConnections(connections)
                                                        setOpenDisconnectDialog(false)
                                                        Helper.info(strings.CONNECTION_DELETED)
                                                    }
                                                    else {
                                                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                    }
                                                })
                                                .catch(err => {
                                                    Helper.error(strings.CONNECTION_DELETE_ERROR)
                                                })
                                        }
                                        else {
                                            Helper.error(strings.CONNECTION_DELETE_ERROR)
                                        }
                                    })
                                    .catch(err => {
                                        Helper.error(strings.CONNECTION_DELETE_ERROR)
                                    })
                            } else { // Cancel request
                                deleteConnection(user._id, connectionId)
                                    .then(status => {
                                        if (status === 200) {
                                            const index = findIndex(connectionId)
                                            connections.splice(index, 1)
                                            setConnections(connections)
                                            setOpenDisconnectDialog(false)
                                            Helper.info(strings.CONNECTION_CANCELED)
                                        } else {
                                            Helper.error()
                                        }
                                    })
                                    .catch(err => {
                                        Helper.error()
                                    })
                            }
                        } else {
                            Helper.error(strings.CONNECTION_DELETE_ERROR)
                        }
                    })
                    .catch(err => {
                        Helper.error(strings.CONNECTION_DELETE_ERROR)
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

    const handleConfirmDecline = (e) => {
        const isApprover = declineTarget.getAttribute('data-is-approver') === 'true'
        const isConnectionPending = declineTarget.getAttribute('data-is-connection-pending') === 'true'
        const connected = declineTarget.getAttribute('data-is-connected') === 'true'
        const connectionId = declineTarget.getAttribute('data-id')
        const connections = [...connections] // Make a shallow copy of users

        if (isApprover && isConnectionPending && !connected) {
            getConnectionIds(connectionId, user._id)
                .then(connectionIds => {
                    if (connectionIds) {
                        const _senderConnectionId = connectionIds._senderConnectionId, _approverConnectionId = connectionIds._approverConnectionId
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
                                                }

                                                notify(notification)
                                                    .then(notificationStatus => {
                                                        if (notificationStatus === 200) {
                                                            const index = findIndex(connectionId)
                                                            connections.splice(index, 1)
                                                            setConnections(connections)
                                                            setOpenDeclineDialog(false)

                                                            getNotificationCounter(user._id)
                                                                .then(notificationCounter => {
                                                                    setNotificationCount(notificationCounter.count)
                                                                    Helper.info(strings.CONNECTION_DECLINE)
                                                                })
                                                                .catch(err => {
                                                                    Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                                                })
                                                        }
                                                    })
                                                    .catch(err => {
                                                        Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                                    })
                                            } else {
                                                Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                        })
                                } else {
                                    Helper.error(strings.CONNECTION_DECLINE_ERROR)
                                }
                            })
                            .catch(err => {
                                Helper.error(strings.CONNECTION_DECLINE_ERROR)
                            })
                    } else {
                        Helper.error(strings.CONNECTION_DECLINE_ERROR)
                    }
                })
                .catch(err => {
                    Helper.error(strings.CONNECTION_DECLINE_ERROR)
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

    const handleAvatarClick = (e) => {
        const userId = e.currentTarget.getAttribute('data-id')
        window.location = '/profile?u=' + userId
    }

    const fetchConnections = (page) => {
        setLoading(true)

        getConnections(user._id, page)
            .then(data => {
                const _connections = [...connections, ...data]
                setConnections(_connections)
                setFetch(data.length > 0)
                setLoading(false)
            })
            .catch(err => {
                Helper.error()
            })
    }

    const onLoad = (user) => {
        const language = getLanguage()
        moment.locale(language)
        setUser(user)
        fetchConnections(1)

        const div = document.querySelector('.content')
        if (div) {
            div.onscroll = (event) => {
                if (fetch && !loading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                    const _page = page + 1
                    setPage(_page)
                    fetchConnections(_page)
                }
            }
        }
    }

    return (
        <Master onLoad={onLoad} notificationCount={notificationCount} strict>
            <div className="connections content">
                {!loading && connections.length === 0 ?
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
                                <ListItemAvatar data-id={connection.user._id} className="list-item-avatar" onClick={handleAvatarClick}>
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
                                            onClick={handleConnect}
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
                                                        onClick={handleConnect}
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
                                                                data-id={connection.user._id}
                                                                data-is-approver={!connection.isApprover}
                                                                data-is-connected={!connection.isPending}
                                                                data-is-connection-pending={connection.isPending}
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
                                                            data-id={connection.user._id}
                                                            data-is-approver={!connection.isApprover}
                                                            data-is-connected={!connection.isPending}
                                                            data-is-connection-pending={connection.isPending}
                                                            onClick={handleConnect}
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
                                                    data-id={connection.user._id}
                                                    data-is-approver={!connection.isApprover}
                                                    data-is-connected={!connection.isPending}
                                                    data-is-connection-pending={connection.isPending}
                                                    onClick={handleDecline}
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
                                                onClick={handleSendMessage}
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
                                                    onClick={handleSendMessage}
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
            </div>
            {loading && <Backdrop text={strings.LOADING} />}
        </Master>
    )
}

export default Connections
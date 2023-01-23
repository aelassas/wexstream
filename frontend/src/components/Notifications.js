import React, { useState } from 'react'
import { strings } from '../config/app.config'
import { getLanguage } from '../services/UserService'
import {
    notify, getNotifications, getNotificationCounter, deleteNotification, approve, decline,
    markAsRead, markAsUnread, markAllAsRead, deleteNotifications
} from '../services/NotificationService'
import { getConnectionById } from '../services/ConnectionService'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import Avatar from '@mui/material/Avatar'
import Info from '@mui/icons-material/Info'
import Backdrop from '../elements/SimpleBackdrop'
import DeleteIcon from '@mui/icons-material/Delete'
import ReadIcon from '@mui/icons-material/Drafts'
import UnreadIcon from '@mui/icons-material/Email'
import { IconButton } from '@mui/material'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Tooltip from '@mui/material/Tooltip'
import moment from 'moment'
import 'moment/locale/fr'
import 'moment/locale/ar'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material'
import {
    ThumbUp,
    ThumbDown
} from '@mui/icons-material'
import { isMobile, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET } from '../config/env.config'
import Master from '../elements/Master'
import * as Helper from '../common/Helper'

const Notifications = () => {
    const [user, setUser] = useState()
    const [notifications, setNotifications] = useState([])
    const [notificationCount, setNotificationCount] = useState()
    const [loading, setLoading] = useState(false)
    const [openDeclineDialog, setOpenDeclineDialog] = useState(false)
    const [declineTarget, setDeclineTarget] = useState(null)
    const [page, setPage] = useState(1)
    const [fetch, setFetch] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(null)

    const findIndex = (notificationId) => (
        notifications.findIndex(n => n._id === notificationId)
    )

    const handleApprove = (e) => {
        const notificationId = e.currentTarget.getAttribute('data-id')
        const connId = e.currentTarget.getAttribute('data-conn-id')

        approve(notificationId)
            .then(status => {
                if (status === 200) {
                    getConnectionById(connId)
                        .then(conn => {
                            if (conn) {
                                const notification = {
                                    user: conn.user,
                                    isRequest: false,
                                    message: strings.CONNECTION_APPROVE_NOTIFICATION + ' ' + user.fullName + '.',
                                    isLink: true,
                                    senderUser: user._id,
                                    link: `${window.location.origin}/profile?u=${user._id}`
                                }
                                notify(notification)
                                    .then(notificationStatus => {
                                        if (notificationStatus === 200) {
                                            getNotificationCounter(user._id)
                                                .then(notificationCounter => {
                                                    const _notifications = [...notifications]
                                                    const index = findIndex(notificationId)
                                                    const notification = { ..._notifications[index] }
                                                    notification.isRead = true
                                                    notification.isConnected = true
                                                    notification.isDeclined = false
                                                    _notifications[index] = notification

                                                    setNotifications(_notifications)
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
    }

    const handleCancelDecline = (e) => {
        setOpenDeclineDialog(false)
    }

    const handleDecline = (e) => {
        setDeclineTarget(e.currentTarget)
        setOpenDeclineDialog(true)
    }

    const handleConfirmDecline = (e) => {
        const notificationId = declineTarget.getAttribute('data-id')
        const connId = declineTarget.getAttribute('data-conn-id')

        getConnectionById(connId)
            .then(conn => {
                if (conn) {
                    decline(notificationId)
                        .then(status => {
                            if (status === 200) {
                                const notification = {
                                    user: conn.user,
                                    isRequest: false,
                                    message: user.fullName + ' ' + strings.CONNECTION_REJECT_NOTIFICATION,
                                    isLink: true,
                                    senderUser: user._id,
                                    link: `${window.location.origin}/profile?u=${user._id}`
                                }
                                notify(notification)
                                    .then(notificationStatus => {
                                        if (notificationStatus === 200) {
                                            const _notifications = [...notifications]
                                            const index = findIndex(notificationId)
                                            const notification = { ..._notifications[index] }
                                            notification.isRead = true
                                            notification.isConnected = false
                                            notification.isDeclined = true
                                            _notifications[index] = notification

                                            setNotifications(_notifications)
                                            setOpenDeclineDialog(false)

                                            getNotificationCounter(user._id)
                                                .then(notificationCounter => {
                                                    setNotificationCount(notificationCounter.count)
                                                    Helper.info(strings.CONNECTION_DECLINE)
                                                })
                                                .catch(err => {
                                                    Helper.error(strings.CONNECTION_DECLINE_ERROR, err)
                                                })
                                        }
                                        else {
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
    }

    const handleMarkAsRead = (e) => {
        const notificationId = e.currentTarget.getAttribute('data-id')

        markAsRead(notificationId)
            .then(status => {
                if (status === 200) {
                    getNotificationCounter(user._id)
                        .then(notificationCounter => {
                            const _notifications = [...notifications]
                            const index = findIndex(notificationId)
                            const notification = { ..._notifications[index] }
                            notification.isRead = true
                            _notifications[index] = notification
                            setNotifications(_notifications)
                            setNotificationCount(notificationCounter.count)
                        })
                        .catch(err => {
                            Helper.error(null, err)
                        })
                } else {
                    Helper.error()
                }
            })
            .catch(err => {
                Helper.error(null, err)
            })
    }

    const handleMarkAsUnread = (e) => {
        const notificationId = e.currentTarget.getAttribute('data-id')

        markAsUnread(notificationId)
            .then(status => {
                if (status === 200) {
                    getNotificationCounter(user._id)
                        .then(notificationCounter => {
                            const _notifications = [...notifications]
                            const index = findIndex(notificationId)
                            const notification = { ..._notifications[index] }
                            notification.isRead = false
                            _notifications[index] = notification
                            setNotifications(_notifications)
                            setNotificationCount(notificationCounter.count)
                        })
                        .catch(err => {
                            Helper.error(null, err)
                        })
                } else {
                    Helper.error()
                }
            })
            .catch(err => {
                Helper.error(null, err)
            })
    }

    const handleDeleteNotification = (e) => {
        const notificationId = e.currentTarget.getAttribute('data-id')

        deleteNotification(notificationId)
            .then(status => {
                if (status === 200) {
                    getNotificationCounter(user._id)
                        .then(notificationCounter => {
                            const _notifications = [...notifications]
                            const index = findIndex(notificationId)
                            _notifications.splice(index, 1)
                            setNotifications(_notifications)
                            setNotificationCount(notificationCounter.count)
                            Helper.info(strings.NOTIFICATION_DELETE)
                        })
                        .catch(err => {
                            Helper.error(strings.NOTIFICATION_DELETE_ERROR, err)
                        })
                } else {
                    Helper.error(strings.NOTIFICATION_DELETE_ERROR)
                }
            })
            .catch(err => {
                Helper.error(strings.NOTIFICATION_DELETE_ERROR, err)
            })

    }

    const handleDeleteAllNotifications = () => {
        setOpenDeleteDialog(true)
    }

    const handleCancelDelete = () => {
        setOpenDeleteDialog(false)
    }

    const handleConfirmDelete = () => {
        deleteNotifications(user._id).then(status => {
            if (status === 200) {
                setNotifications([])
                setNotificationCount(0)
                setOpenDeleteDialog(false)
            } else {
                setOpenDeleteDialog(false)
                Helper.error()
            }
        })
    }

    const handleMarkAllAsRead = () => {
        markAllAsRead(user._id).then(status => {
            if (status === 200) {
                const _notifications = [...notifications]

                for (let i = 0; i < _notifications.length; i++) {
                    const notification = _notifications[i]
                    if (!notification.isRead) {
                        notification.isRead = true
                    }
                }

                setNotifications(_notifications)
                setNotificationCount(0)
            } else {
                Helper.error()
            }
        })
    }

    const fetchNotifications = (page) => {
        setLoading(true)

        getNotifications(user._id, page)
            .then(data => {
                const _notifications = [...notifications, ...data]
                setNotifications(_notifications)
                setFetch(data.length > 0)
                setLoading(false)
            })
            .catch(err => {
                setLoading(false)
                Helper.error(null, err)
            })
    }

    const onLoad = (user) => {
        const language = getLanguage()
        moment.locale(language)
        setUser(user)

        fetchNotifications(page)

        getNotificationCounter(user._id)
            .then(notificationCounter => {
                setNotificationCount(notificationCounter.count)
            })
            .catch(err => {
                Helper.error(null, err)
            })

        const ul = document.querySelector('.notifications-list')
        if (ul) {
            ul.onscroll = (event) => {
                if (fetch && !loading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                    const _page = page + 1
                    setPage(_page)
                    fetchNotifications(_page)
                }
            }
        }
    }

    return (
        <Master onLoad={onLoad} notificationCount={notificationCount} strict>
            <div className="notifications content">
                {loading && <Backdrop text={strings.LOADING} />}
                {!loading && notifications.length === 0 ?
                    <Card variant="outlined" className="content-nc">
                        <CardContent>
                            <Typography color="textSecondary">
                                {strings.NO_NOTIFICATION}
                            </Typography>
                        </CardContent>
                    </Card>
                    :
                    <div>
                        <Card variant="outlined" className="notifications-actions" style={notifications.length === 0 ? { display: 'none' } : null}>
                            <CardContent>
                                <Tooltip title={strings.DELETE_ALL}>
                                    <IconButton
                                        color="secondary"
                                        onClick={handleDeleteAllNotifications}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Tooltip>
                                {notificationCount > 0 && <Tooltip title={strings.MARK_ALL_AS_READ}>
                                    <IconButton
                                        color="default"
                                        onClick={handleMarkAllAsRead}
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
                                                                                onClick={handleApprove}
                                                                            >
                                                                                <ThumbUp />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title={strings.DECLINE}>
                                                                            <IconButton
                                                                                color="secondary"
                                                                                data-id={notification._id}
                                                                                data-conn-id={notification.senderConnection._id}
                                                                                onClick={handleDecline}
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
                                                                        onClick={handleMarkAsRead}
                                                                    >
                                                                        <ReadIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                :
                                                                <Tooltip title={strings.MARK_AS_UNREAD}>
                                                                    <IconButton
                                                                        color="default"
                                                                        data-id={notification._id}
                                                                        onClick={handleMarkAsUnread}
                                                                    >
                                                                        <UnreadIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            }
                                                            <Tooltip title={strings.DELETE}>
                                                                <IconButton
                                                                    color="secondary"
                                                                    data-id={notification._id}
                                                                    onClick={handleDeleteNotification}
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
                                                                onClick={handleApprove}
                                                            >
                                                                {strings.APPROVE}
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                color="secondary"
                                                                size="small"
                                                                data-id={notification._id}
                                                                data-conn-id={notification.senderConnection._id}
                                                                onClick={handleDecline}
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
                                                            onClick={handleMarkAsRead}
                                                        >
                                                            <ReadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    :
                                                    <Tooltip title={strings.MARK_AS_UNREAD}>
                                                        <IconButton
                                                            color="default"
                                                            data-id={notification._id}
                                                            onClick={handleMarkAsUnread}
                                                        >
                                                            <UnreadIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                                <Tooltip title={strings.DELETE}>
                                                    <IconButton
                                                        color="secondary"
                                                        data-id={notification._id}
                                                        onClick={handleDeleteNotification}
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
                        <Button onClick={handleCancelDecline} color="default">{strings.CANCEL}</Button>
                        <Button onClick={handleConfirmDecline} color="secondary">{strings.DECLINE}</Button>
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
                        <Button onClick={handleCancelDelete} color="default">{strings.CANCEL}</Button>
                        <Button onClick={handleConfirmDelete} color="secondary">{strings.DELETE}</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </Master>
    )
}

export default Notifications
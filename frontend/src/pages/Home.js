import React, { useEffect, useState } from 'react'
import { strings } from '../config/lang'
import * as UserService from '../services/UserService'
import * as TimelineService from '../services/TimelineService'
import {
    Card,
    CardContent,
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
    Typography,
    Link
} from '@mui/material'
import {
    Videocam,
    Clear,
    Lock,
    Public,
    People
} from '@mui/icons-material'
import moment from 'moment'
import 'moment/locale/fr'
import 'moment/locale/ar'
import Avatar from '../components/Avatar'
import { PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET } from '../config/env'
import Members from '../components/Members'
import Master from '../components/Master'
import * as Helper from '../common/Helper'

const Home = () => {
    const [user, setUser] = useState()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(false)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [currentTarget, setCurrentTarget] = useState()
    const [page, setPage] = useState(1)
    const [fetch, setFetch] = useState(false)
    const [openMembersDialog, setOpenMembersDialog] = useState(false)
    const [conferenceId, setConferenceId] = useState('')

    const handleDelete = (event) => {
        event.preventDefault()
        setCurrentTarget(event.currentTarget)
        setOpenDeleteDialog(true)
    }

    const handleCancelDelete = (event) => {
        event.preventDefault()
        setOpenDeleteDialog(false)
    }

    const findIndex = (entryId) => entries.findIndex(e => e._id === entryId)

    const handleConfirmDelete = (event) => {
        event.preventDefault()
        const entryId = currentTarget.getAttribute('data-id')

        TimelineService.deleteSubscriberEntry(entryId)
            .then(status => {
                if (status === 200) {
                    const index = findIndex(entryId)
                    const _entries = [...entries]
                    _entries.splice(index, 1)
                    setEntries(_entries)
                    setOpenDeleteDialog(false)
                } else {
                    Helper.error()
                    setOpenDeleteDialog(false)
                }
            })
            .catch(err => {
                Helper.error()
                setOpenDeleteDialog(false)
            })
    }

    const fetchEntries = (user, page) => {
        if (user) {
            setLoading(true)

            TimelineService.getEntries(user._id, page)
                .then(data => {
                    const _entries = [...entries, ...data]
                    setEntries(_entries)
                    setFetch(data.length > 0)
                    setLoading(false)
                })
                .catch(() => {
                    Helper.error()
                })
        }
    }

    const handleMembers = (event) => {
        const conferenceId = event.currentTarget.getAttribute('data-id')
        setLoading(true)
        setConferenceId(conferenceId)
        setOpenMembersDialog(true)
    }

    const handleCloseMembers = () => {
        setOpenMembersDialog(false)
    }

    const handleMembersFetched = () => {
        setLoading(false)
    }

    const handleMembersError = () => {
        setLoading(false)
        Helper.error()
    }

    const onLoad = (user) => {
        const language = UserService.getLanguage()
        moment.locale(language)
        setUser(user)
        fetchEntries(user, page)
    }

    useEffect(() => {
        const div = document.querySelector('.home-timeline')
        if (div) {
            div.onscroll = (event) => {
                if (fetch && !loading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                    const _page = page + 1
                    setPage(_page)
                    fetchEntries(user, _page)
                }
            }
        }
    }, [fetch, loading, user, page]) // eslint-disable-line react-hooks/exhaustive-deps

    const iconStyles = {
        float: 'left',
        height: 14,
        marginTop: -1,
        color: '#595959'
    }

    return (
        <Master onLoad={onLoad} strict>
            <div className="home content">
                <div className="home-timeline">
                    {entries.length === 0 && !loading ?
                        <Card variant="outlined" className="timeline-card">
                            <CardContent>
                                <Typography color="textSecondary">
                                    {strings.EMPTY_TIMELINE}
                                </Typography>
                            </CardContent>
                        </Card>
                        :
                        <List className="timeline-list">
                            {entries.map((timelineEntry) =>
                            (
                                <ListItem key={timelineEntry._id} className="timeline-item">
                                    <ListItemText
                                        disableTypography
                                        primary={
                                            <div style={{ marginBottom: 5 }}>
                                                <Link href={`/profile?u=${timelineEntry.speaker._id}`} className="timeline-link">
                                                    <Avatar loggedUser={user} user={timelineEntry.speaker} size="small" color="disabled" className="timeline-avatar" isBuffer={false} />
                                                </Link>
                                                <div className="timeline-item-title">
                                                    <Link href={`/profile?u=${timelineEntry.speaker._id}`}>
                                                        <Typography style={{ fontWeight: 'bold', color: '#373737' }}>{timelineEntry.speaker.fullName}</Typography>
                                                    </Link>
                                                    <div style={{ display: 'inline-block' }}>
                                                        <Typography className="timeline-item-sub-title-float">
                                                            {timelineEntry.conference.broadcastedAt ? moment(timelineEntry.conference.broadcastedAt).format(process.env.REACT_APP_WS_DATE_FORMAT) : moment(timelineEntry.conference.createdAt).format(process.env.REACT_APP_WS_DATE_FORMAT)}
                                                        </Typography>
                                                        {timelineEntry.conference.isPrivate ?
                                                            <Tooltip title={strings.PRIVATE}>
                                                                <Lock style={iconStyles} />
                                                            </Tooltip>
                                                            :
                                                            <Tooltip title={strings.PUBLIC}>
                                                                <Public style={iconStyles} />
                                                            </Tooltip>
                                                        }
                                                    </div>
                                                </div>
                                                {!timelineEntry.conference.isLive && timelineEntry.conference.finishedAt &&
                                                    <Tooltip title={strings.DELETE}>
                                                        <IconButton
                                                            variant="contained"
                                                            size="small"
                                                            data-id={timelineEntry._id}
                                                            style={{ color: '#595959', margin: 0, float: 'right' }}
                                                            onClick={handleDelete}
                                                        >
                                                            <Clear style={{ width: 16, height: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                            </div>
                                        }
                                        secondary={
                                            <div className="timeline-item-content">
                                                <Tooltip title={strings.MEMBERS}>
                                                    <IconButton
                                                        variant="contained"
                                                        color="default"
                                                        size="small"
                                                        data-id={timelineEntry.conference._id}
                                                        style={{ margin: 0, float: 'right' }}
                                                        onClick={handleMembers}
                                                    >
                                                        <People style={{ width: 16, height: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Link href={`/conference?c=${timelineEntry.conference._id}`}>
                                                    <Typography style={{ fontWeight: 'bold', color: '#373737' }}>{timelineEntry.conference.title}</Typography>
                                                </Link>
                                                {!timelineEntry.conference.isLive && timelineEntry.conference.finishedAt &&
                                                    <Typography className="timeline-item-sub-title">
                                                        {moment(Math.abs(new Date(timelineEntry.conference.finishedAt).getTime() - new Date(timelineEntry.conference.broadcastedAt).getTime())).format('HH:mm:ss')}
                                                    </Typography>
                                                }
                                                {timelineEntry.conference.isLive &&
                                                    <Typography style={{ marginTop: 10, fontWeight: 500, color: '#f50057' }}>
                                                        <Videocam color="error" style={{ marginRight: 4, marginBottom: -6 }} />
                                                        {strings.LIVE}
                                                    </Typography>
                                                }
                                                <Typography style={{ marginTop: 5 }}>
                                                    {timelineEntry.conference.description}
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
                    <DialogContent>{strings.DELETE_ENTRY_CONFIRM}</DialogContent>
                    <DialogActions>
                        <Button onClick={handleCancelDelete} color="inherit">{strings.CANCEL}</Button>
                        <Button onClick={handleConfirmDelete} color="error">{strings.DELETE}</Button>
                    </DialogActions>
                </Dialog>
                <Members
                    open={openMembersDialog}
                    conferenceId={conferenceId}
                    loggedUser={user}
                    onClose={handleCloseMembers}
                    onFetch={handleMembersFetched}
                    onError={handleMembersError} />
            </div>
        </Master>

    )
}

export default Home
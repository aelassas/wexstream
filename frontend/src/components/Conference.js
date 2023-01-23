import React, { useState } from 'react'
import { strings } from '../config/app.config'
import { JITSI_API, JITSI_HOST, isMobile } from '../config/env.config'
import { getUsername } from '../services/UserService'
import { getConferenceId, getConference, updateConference, addMember, closeConference } from '../services/ConferenceService'
import { getConnection } from '../services/ConnectionService'
import { createTimelineEntries } from '../services/TimelineService'
import {
    IconButton,
    Tooltip,
    Card,
    CardContent,
    Typography
} from '@mui/material'
import {
    Share,
    FileCopyOutlined,
    Close,
    Fullscreen,
    FullscreenExit,
    VolumeOff,
    VolumeUp
} from '@mui/icons-material'
import {
    EmailShareButton,
    EmailIcon,
    FacebookShareButton,
    FacebookIcon,
    TwitterShareButton,
    TwitterIcon,
    WhatsappShareButton,
    WhatsappIcon
} from "react-share"
import Backdrop from '../elements/SimpleBackdrop'
import * as Helper from '../common/Helper'
import Master from '../elements/Master'

let domain = JITSI_HOST
let api = {}

const Conference = () => {
    const [user, setUser] = useState()
    const [conference, setConference] = useState()
    const [conferenceUrl, setConferenceUrl] = useState()
    const [userName, setUserName] = useState('')
    const [open, setOpen] = useState(false)
    const [error, setError] = useState(false)
    const [unAuthorized, setUnAuthorized] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [loading, setLoading] = useState(false)
    const [closed, setClosed] = useState(false)
    const [conferenceLeftCalledFirstTime, setConferenceLeftCalledFirstTime] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const [exit, setExit] = useState(false)
    const [externalApiError, setExternalApiError] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)
    const [mute, setMute] = useState(false)
    const [showButtons, setShowButtons] = useState(false)

    const startConference = (token) => {
        localStorage.removeItem('jitsiLocalStorage')
        localStorage.setItem('jitsiLocalStorage', JSON.stringify({ language: user.language }))

        const options = {
            roomName: conference._id,
            noSsl: false,
            width: '100%',
            height: '100%',
            configOverwrite: {
                prejoinPageEnabled: false,
                useHostPageLocalStorage: true,
                defaultLanguage: user.language,
                disableDeepLinking: true
            },
            interfaceConfigOverwrite: {
                // overwrite interface properties
            },
            parentNode: document.querySelector('#conf'),
            userInfo: {
                displayName: userName
            },
            jwt: token
        }
        api = new window.JitsiMeetExternalAPI(domain, options)

        api.addEventListeners({
            readyToClose: handleClose,
            videoConferenceJoined: handleVideoConferenceJoined,
            videoConferenceLeft: handleVideoConferenceLeft,
            eventLeft: handleParticipantLeft,
            eventJoined: handleParticipantJoined,
            eventKickedOut: handleParticipantKickedOut,
            eventRoleChanged: handleParticipantRoleChanged,
            audioMuteStatusChanged: handleMuteStatus,
            videoMuteStatusChanged: handleVideoStatus
        })

        window.onbeforeunload = (e) => {
            localStorage.removeItem('jitsiLocalStorage')
            setExit(true)
        }

        if (conference.isLive && conference.speaker._id === user._id) {
            createTimelineEntries(user._id, conference._id, true)
        }
    }

    const updateConf = (data, onSuccess) => {
        updateConference(conference._id, data)
            .then(status => {
                if (status === 200) {
                    if (data.isLive !== undefined) {
                        conference.isLive = data.isLive
                    }
                    if (data.broadcastedAt !== undefined) {
                        conference.broadcastedAt = data.broadcastedAt
                    }
                    if (data.finishedAt !== undefined) {
                        conference.broadcastedAt = data.finishedAt
                    }
                    setConference(conference)
                    if (onSuccess) {
                        onSuccess()
                    }
                }
                else {
                    setError(true)
                    setLoading(false)
                }
            })
            .catch(err => {
                if (err.message && !err.message.toLowerCase().includes('aborted')) {
                    setError(true)
                    setLoading(false)
                }
            })
    }

    const close = () => {
        setLeaving(true)
        localStorage.removeItem('jitsiLocalStorage')

        // const conference = await getConference(conference._id)
        // if (conference.isLive && (conference.speaker._id === user._id)) {
        //     await updateConf({ isLive: false, finishedAt: Date.now() })
        //     closeConference(user._id, conference._id).then(() => {
        //         window.location = '/home'
        //     })
        // } else {
        //     window.location = '/home'
        // }

        getConference(conference._id)
            .then(conference => {
                if (conference.isLive && (conference.speaker._id === user._id)) {
                    updateConf({ isLive: false, finishedAt: Date.now() }, () => {
                        closeConference(user._id, conference._id).then(() => {
                            window.location = '/home'
                        })
                    })
                } else {
                    window.location = '/home'
                }
            })
    }

    const handleClose = (event) => {
        close()
    }

    const addConfMember = () => {
        if (conference.speaker._id !== user._id) {
            addMember(conference._id, user._id)
                .then(status => {
                    if (status !== 200) {
                        Helper.error()
                    }
                })
                .catch(err => {
                    Helper.error(null, err)
                })
        }
    }

    const handleVideoConferenceJoined = (event) => {
        const participants = api.getParticipantsInfo()

        if (conference.speaker._id === user._id) {
            api.executeCommand('toggleLobby', true)
            setShowButtons(true)
        } else if (conference.speaker._id !== user._id && participants.length === 1) {
            api.dispose()
            setUnAuthorized(true)
            if (window.android && window.android.fullscreen) {
                window.android.fullscreen()
                setFullscreen(false)
            }
        } else {
            addConfMember()
            setShowButtons(true)
        }

        setLoading(false)
    }

    const handleVideoConferenceLeft = (event) => {
        if (conference.speaker._id === user._id && !exit && conferenceLeftCalledFirstTime) {
            close()
        } else if (!conferenceLeftCalledFirstTime) {
            setConferenceLeftCalledFirstTime(true)
        } else if (conferenceLeftCalledFirstTime) {
            window.location = '/home'
        }
    }

    const handleParticipantRoleChanged = (event) => {

        if (event.role === 'moderator') {
            api.executeCommand('toggleLobby', true)
        }
    }

    const handleParticipantLeft = (event) => {
    }

    const handleParticipantJoined = (event) => {
        addConfMember()
    }

    const handleParticipantKickedOut = (event) => {
    }

    const handleMuteStatus = (event) => {
        setLoading(false)
    }

    const handleVideoStatus = (event) => {
        setLoading(false)
    }

    const handleCopyClick = (e) => {
        e.preventDefault()

        if (window.android && window.android.copyToClipboard) {
            window.android.copyToClipboard(conferenceUrl)
        } else {
            navigator.clipboard.writeText(conferenceUrl)
        }

        Helper.info(strings.CONFERENCE_URL_COPIED)
    }

    const requestFullscreen = () => {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen()
        } else if (document.body.mozRequestFullscreen) {
            document.body.mozRequestFullscreen()
        } else if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullscreen()
        }
    }

    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen()
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
    }

    const handleFullscreenClick = (event) => {
        event.preventDefault()

        if (window.android && window.android.fullscreen) {
            const fullscreen = JSON.parse(window.android.fullscreen())
            setFullscreen(fullscreen)
        } else if (isMobile()) {

            if (fullscreen) {
                setFullscreen(false)
                exitFullscreen()
            } else {
                setFullscreen(true)
                requestFullscreen()
            }
        }
    }

    const handleMuteClick = (event) => {
        event.preventDefault()

        if (window.android && window.android.mute) {
            const mute = JSON.parse(window.android.mute())
            setMute(mute)
        }
    }

    const handleShareClick = () => {
        if (window.android && window.android.share) {
            const subject = strings.SUBJECT + conference.title
            const body = subject + ' ' + conferenceUrl
            window.android.share(subject, body)
        } else {
            setOpen(!open)
        }
    }

    const onLoad = (user) => {
        if (window.android) {
            setFullscreen(true)
        }

        if (isMobile()) {
            window.exitFullscreen = () => {
                setFullscreen(false)
            }
        }

        setLoading(true)
        setUser(user)

        if (user.verified) {
            const conferenceId = getConferenceId()
            if (conferenceId !== '') {
                if (Helper.isObjectId(conferenceId)) {
                    getConference(conferenceId)
                        .then(conference => {
                            let authorized
                            if (conference) {
                                if (!conference.isLive && conference.finishedAt) {
                                    setClosed(true)
                                    setFullscreen(false)
                                    setLoading(false)
                                    if (window.android && window.android.closeConference) {
                                        window.android.closeConference()
                                    }
                                    return
                                }

                                // if (user._id === conference.speaker._id) {
                                //     authorized = true
                                // } else if (conference.isPrivate === false) {
                                //     authorized = true
                                // } else {
                                //     let connection = null
                                //     try {
                                //         connection = await getConnection(conference.speaker._id, user._id)
                                //     } catch (err) {
                                //         Helper.error()
                                //     }
                                //     authorized = (connection && connection.isPending === false)
                                // }

                                let startConf = () => {
                                    setConference(conference)

                                    const script = document.createElement('script')
                                    script.src = JITSI_API
                                    script.id = 'external-api'
                                    script.setAttribute('defer', 'defer')
                                    document.body.appendChild(script)

                                    // External API is loaded
                                    const externalApi = document.getElementById('external-api')

                                    externalApi.addEventListener('load', () => {
                                        if (window.JitsiMeetExternalAPI) {
                                            if (!conference.isLive && (conference.speaker._id === user._id)) {
                                                updateConf({ isLive: true, broadcastedAt: Date.now() }, () => {
                                                    setUserName(getUsername())
                                                    setConferenceUrl(window.location.href)
                                                    startConference(user.accessToken)
                                                })
                                            } else {
                                                setUserName(getUsername())
                                                setConferenceUrl(window.location.href)
                                                startConference(user.accessToken)
                                            }
                                        } else {
                                            setLoading(false)
                                            setExternalApiError(true)
                                        }
                                    })

                                    externalApi.addEventListener('error', () => {
                                        setLoading(false)
                                        setExternalApiError(true)
                                    })
                                }

                                if (user._id === conference.speaker._id) {
                                    startConf()
                                } else if (conference.isPrivate === false) {
                                    startConf()
                                } else {
                                    getConnection(conference.speaker._id, user._id)
                                        .then(connection => {
                                            console.log(connection)
                                            authorized = (connection && connection.isPending === false)

                                            if (authorized) {
                                                startConf()
                                            } else {
                                                setUnAuthorized(true)
                                                setLoading(false)
                                            }
                                        })
                                        .catch(err => {
                                            Helper.error()
                                        })
                                }

                            } else {
                                setNotFound(true)
                                setLoading(false)
                            }
                        })
                        .catch(err => {
                            setError(true)
                            setLoading(false)
                        })
                } else {
                    setNotFound(true)
                    setLoading(false)
                }
            } else {
                window.location = '/home' + window.location.search
            }
        } else {
            setLoading(false)
        }
    }

    const subject = strings.SUBJECT + (conference ? conference.title : '')
    const body = subject
    const separator = ': '
    const url = conferenceUrl
    const size = 42, round = true

    return (
        <Master onLoad={onLoad} hidden={fullscreen} hideLiveButton={!error && !notFound && !unAuthorized && !closed && !externalApiError} strict>
            <div className={fullscreen ? "content-full-screen" : "content"} >
                <div className="conf">
                    {
                        (!error && !notFound && !unAuthorized && !closed && !externalApiError) ?
                            (
                                <div>
                                    <div id="conf" style={fullscreen ? { top: 0 } : null}></div>
                                    {(!loading && showButtons && window.android) && <IconButton
                                        className="conf-mute-btn"
                                        onClick={handleMuteClick}
                                    >
                                        {mute ? <VolumeUp style={{ fill: 'white' }} /> : <VolumeOff style={{ fill: 'white' }} />}
                                    </IconButton>}
                                    {(!loading && showButtons && isMobile()) && <IconButton
                                        className="conf-fullscreen-btn"
                                        onClick={handleFullscreenClick}
                                    >
                                        {fullscreen ? <FullscreenExit style={{ fill: 'white' }} /> : <Fullscreen style={{ fill: 'white' }} />}
                                    </IconButton>}
                                    {(!loading && showButtons) && <IconButton
                                        className="conf-share-btn"
                                        style={{ display: loading ? 'none' : 'block' }}
                                        onClick={handleShareClick}
                                    >
                                        {open ? <Close style={{ fill: 'white' }} /> : <Share style={{ fill: 'white' }} />}
                                    </IconButton>}
                                    <div className={'conf-actions ' + (open ? 'conf-actions-visible' : 'conf-actions-hidden')}>
                                        <Tooltip title={strings.COPY}>
                                            <div className="copy">
                                                <FileCopyOutlined className="copy-icon" style={{ fill: 'white' }} onClick={handleCopyClick} />
                                            </div>
                                        </Tooltip>
                                        {!isMobile() && <Tooltip title={strings.EMAIL_SHARE}>
                                            <div>
                                                <EmailShareButton subject={subject} body={body} url={url} separator={separator}>
                                                    <EmailIcon size={size} round={round} />
                                                </EmailShareButton>
                                            </div>
                                        </Tooltip>}
                                        <Tooltip title={strings.FACEBOOK}>
                                            <div>
                                                <FacebookShareButton url={url} quote={body}>
                                                    <FacebookIcon size={size} round={round} />
                                                </FacebookShareButton>
                                            </div>
                                        </Tooltip>
                                        <Tooltip title={strings.TWITTER}>
                                            <div>
                                                <TwitterShareButton url={url} title={subject}>
                                                    <TwitterIcon size={size} round={round} />
                                                </TwitterShareButton>
                                            </div>
                                        </Tooltip>
                                        {!isMobile() && <Tooltip title={strings.WHATSAPP}>
                                            <div>
                                                <WhatsappShareButton url={url} title={subject}>
                                                    <WhatsappIcon size={size} round={round} />
                                                </WhatsappShareButton>
                                            </div>
                                        </Tooltip>}
                                    </div>
                                </div>
                            )
                            :
                            (
                                error ?
                                    (
                                        <Card variant="outlined" className="conf-card">
                                            <CardContent>
                                                <Typography color="textSecondary">
                                                    {strings.GENERIC_ERROR}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    )
                                    :
                                    (
                                        notFound ?
                                            (
                                                <Card variant="outlined" className="conf-card">
                                                    <CardContent>
                                                        <Typography color="textSecondary">
                                                            {strings.CONFERENCE_NOT_FOUND}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            )
                                            :
                                            (
                                                unAuthorized ?
                                                    (
                                                        <Card variant="outlined" className="conf-card">
                                                            <CardContent>
                                                                <Typography color="textSecondary">
                                                                    {strings.CONFERENCE_UNAUTHORIZED}
                                                                </Typography>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                    :
                                                    (
                                                        closed ?
                                                            (
                                                                <Card variant="outlined" className="conf-card">
                                                                    <CardContent>
                                                                        <Typography color="textSecondary">
                                                                            {strings.CONFERENCE_CLOSED}
                                                                        </Typography>
                                                                    </CardContent>
                                                                </Card>
                                                            )
                                                            :
                                                            (
                                                                externalApiError ?
                                                                    (
                                                                        <Card variant="outlined" className="conf-card">
                                                                            <CardContent>
                                                                                <Typography color="textSecondary">
                                                                                    {strings.EXTERNAL_API_ERROR}
                                                                                </Typography>
                                                                            </CardContent>
                                                                        </Card>
                                                                    )
                                                                    :
                                                                    null
                                                            )

                                                    )
                                            )
                                    )

                            )
                    }
                </div>
                {loading && <Backdrop text={strings.LOADING} />}
                {leaving && <Backdrop text={strings.LEAVING} />}
            </div>
        </Master>
    )

}

export default Conference

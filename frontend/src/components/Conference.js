import React, { Component } from 'react'
import Header from './Header'
import { strings } from '../config/app.config'
import { JITSI_API, JITSI_HOST, LANGUAGES } from '../config/env.config'
import { getUser, validateAccessToken, resendLink, getCurrentUser, signout, getUsername, getQueryLanguage } from '../services/UserService'
import { getConferenceId, getConference, updateConference, addMember, closeConference } from '../services/ConferenceService'
import { getConnection } from '../services/ConnectionService'
import { createTimelineEntries } from '../services/TimelineService'
import { toast } from 'react-toastify'
import {
    IconButton,
    Button,
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
import { getLanguage } from '../services/UserService'
import * as Helper from '../common/Helper'
import { isMobile } from '../config/env.config'

class Conference extends Component {

    domain = JITSI_HOST
    api = {}

    constructor(props) {
        super(props)
        this.state = {
            user: null,
            conference: null,
            conferenceUrl: '',
            userName: '',
            isAudioMuted: false,
            isVideoMuted: false,
            isAuthenticating: true,
            isTokenValidated: false,
            email: '',
            verified: false,
            open: false,
            error: false,
            unAuthorized: false,
            notFound: false,
            isLoading: false,
            closed: false,
            conferenceLeftCalledFirstTime: false,
            isLeaving: false,
            exit: false,
            externalApiError: false,
            fullscreen: false,
            mute: false,
            showButtons: false
        }
    }

    startConference = (token) => {
        const { user, conference } = this.state
        localStorage.removeItem('jitsiLocalStorage')
        localStorage.setItem('jitsiLocalStorage', JSON.stringify({ language: user.language }))

        const options = {
            roomName: this.state.conference._id,
            noSsl: false,
            width: '100%',
            height: '100%',
            configOverwrite: {
                prejoinPageEnabled: false,
                useHostPageLocalStorage: true,
                defaultLanguage: this.state.language,
                disableDeepLinking: true
            },
            interfaceConfigOverwrite: {
                // overwrite interface properties
            },
            parentNode: document.querySelector('#conf'),
            userInfo: {
                displayName: this.state.userName
            },
            jwt: token
        }
        this.api = new window.JitsiMeetExternalAPI(this.domain, options)

        this.api.addEventListeners({
            readyToClose: this.handleClose,
            videoConferenceJoined: this.handleVideoConferenceJoined,
            videoConferenceLeft: this.handleVideoConferenceLeft,
            eventLeft: this.handleParticipantLeft,
            eventJoined: this.handleParticipantJoined,
            eventKickedOut: this.handleParticipantKickedOut,
            eventRoleChanged: this.handleParticipantRoleChanged,
            audioMuteStatusChanged: this.handleMuteStatus,
            videoMuteStatusChanged: this.handleVideoStatus
        })

        window.onbeforeunload = (e) => {
            localStorage.removeItem('jitsiLocalStorage')
            this.setState({ exit: true })
        }

        if (conference.isLive && conference.speaker._id === user._id) {
            createTimelineEntries(user._id, conference._id, true)
        }
    }

    updateConf = (data, onSuccess) => {
        const { conference } = this.state
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
                    this.setState({ conference })
                    if (onSuccess) {
                        onSuccess()
                    }
                }
                else {
                    this.setState({ error: true, isLoading: false })
                }
            })
            .catch(err => {
                if (err.message && !err.message.toLowerCase().includes('aborted')) {
                    this.setState({ error: true, isLoading: false })
                }
            })
    }

    close = () => {
        const { user } = this.state

        this.setState({ isLeaving: true })
        localStorage.removeItem('jitsiLocalStorage')

        // const conference = await getConference(this.state.conference._id)
        // if (conference.isLive && (conference.speaker._id === user._id)) {
        //     await this.updateConf({ isLive: false, finishedAt: Date.now() })
        //     closeConference(user._id, conference._id).then(() => {
        //         window.location = '/home'
        //     })
        // } else {
        //     window.location = '/home'
        // }

        getConference(this.state.conference._id)
            .then(conference => {
                if (conference.isLive && (conference.speaker._id === user._id)) {
                    this.updateConf({ isLive: false, finishedAt: Date.now() }, () => {
                        closeConference(user._id, conference._id).then(() => {
                            window.location = '/home'
                        })
                    })
                } else {
                    window.location = '/home'
                }
            })
    }

    handleClose = (event) => {
        this.close()
    }

    addConfMember = () => {
        const { user, conference } = this.state

        if (conference.speaker._id !== user._id) {
            addMember(conference._id, user._id)
                .then(status => {
                    if (status !== 200) {
                        toast(strings.GENERIC_ERROR, { type: 'error' })
                    }
                })
                .catch(err => {
                    toast(strings.GENERIC_ERROR, { type: 'error' })
                })
        }
    }

    handleVideoConferenceJoined = (event) => {
        const { user, conference } = this.state
        const participants = this.api.getParticipantsInfo()

        if (conference.speaker._id === user._id) {
            this.api.executeCommand('toggleLobby', true)
            this.setState({ showButtons: true })
        } else if (conference.speaker._id !== user._id && participants.length === 1) {
            this.api.dispose()
            this.setState({ unAuthorized: true })
            if (window.android && window.android.fullscreen) {
                window.android.fullscreen()
                this.setState({ fullscreen: false })
            }
        } else {
            this.addConfMember()
            this.setState({ showButtons: true })
        }

        this.setState({ isLoading: false })
    }

    handleVideoConferenceLeft = (event) => {
        const { user, conference, conferenceLeftCalledFirstTime, exit } = this.state

        if (conference.speaker._id === user._id && !exit && conferenceLeftCalledFirstTime) {
            this.close()
        } else if (!conferenceLeftCalledFirstTime) {
            this.setState({ conferenceLeftCalledFirstTime: true })
        } else if (conferenceLeftCalledFirstTime) {
            window.location = '/home'
        }
    }

    handleParticipantRoleChanged = (event) => {

        if (event.role === 'moderator') {
            this.api.executeCommand('toggleLobby', true)
        }
    }

    handleParticipantLeft = (event) => {
    }

    handleParticipantJoined = (event) => {
        this.addConfMember()
    }

    handleParticipantKickedOut = (event) => {
    }

    handleMuteStatus = (event) => {
        this.setState({ isLoading: false })
    }

    handleVideoStatus = (event) => {
        this.setState({ isLoading: false })
    }

    handleResend = (e) => {
        e.preventDefault()
        const data = { email: this.state.email }

        resendLink(data)
            .then(status => {
                if (status === 200) {
                    toast(strings.VALIDATION_EMAIL_SENT, { type: 'info' })
                } else {
                    toast(strings.VALIDATION_EMAIL_ERROR, { type: 'error' })
                }
            })
            .catch(err => {
                toast(strings.VALIDATION_EMAIL_ERROR, { type: 'error' })
            })
    }

    handleCopyClick = (e) => {
        e.preventDefault()

        if (window.android && window.android.copyToClipboard) {
            window.android.copyToClipboard(this.state.conferenceUrl)
        } else {
            navigator.clipboard.writeText(this.state.conferenceUrl)
        }

        toast(strings.CONFERENCE_URL_COPIED, { type: 'info' })
    }

    requestFullscreen = () => {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen()
        } else if (document.body.mozRequestFullscreen) {
            document.body.mozRequestFullscreen()
        } else if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullscreen()
        }
    }

    exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen()
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
    }

    handleFullscreenClick = (event) => {
        event.preventDefault()

        if (window.android && window.android.fullscreen) {
            const fullscreen = JSON.parse(window.android.fullscreen())
            this.setState({ fullscreen })
        } else if (isMobile()) {
            const { fullscreen } = this.state

            if (fullscreen) {
                this.setState({ fullscreen: false }, () => {
                    this.exitFullscreen()
                })
            } else {
                this.setState({ fullscreen: true }, () => {
                    this.requestFullscreen()
                })
            }
        }
    }

    handleMuteClick = (event) => {
        event.preventDefault()

        if (window.android && window.android.mute) {
            const mute = JSON.parse(window.android.mute())
            this.setState({ mute })
        }
    }

    handleShareClick = () => {
        if (window.android && window.android.share) {
            const subject = strings.SUBJECT + this.state.conference.title
            const body = subject + ' ' + this.state.conferenceUrl
            window.android.share(subject, body)
        } else {
            this.setState({ open: !this.state.open })
        }
    }

    componentDidMount() {
        let language = getQueryLanguage()

        if (!LANGUAGES.includes(language)) {
            language = getLanguage()
        }
        strings.setLanguage(language)
        this.setState({ isLoading: true })

        if (window.android) {
            this.setState({ fullscreen: true })
        }

        if (isMobile()) {
            window.exitFullscreen = () => {
                this.setState({ fullscreen: false })
            }
        }

        const currentUser = getCurrentUser()
        if (currentUser) {
            validateAccessToken().then(status => {
                getUser(currentUser.id).then(user => {
                    if (user) {

                        if (user.blacklisted) {
                            signout()
                            return
                        }

                        this.setState({ user, email: user.email, verified: user.verified, isAuthenticating: false, isTokenValidated: status === 200 })
                        if (user.verified) {
                            const conferenceId = getConferenceId()
                            if (conferenceId !== '') {
                                if (Helper.isObjectId(conferenceId)) {
                                    getConference(conferenceId)
                                        .then(conference => {
                                            let authorized
                                            if (conference) {
                                                if (!conference.isLive && conference.finishedAt) {
                                                    this.setState({ closed: true, isLoading: false, fullscreen: false })
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
                                                //         toast(strings.GENERIC_ERROR, { type: 'error' })
                                                //     }
                                                //     authorized = (connection && connection.isPending === false)
                                                // }

                                                let startConf = () => {
                                                    this.setState({ conference })

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
                                                                this.updateConf({ isLive: true, broadcastedAt: Date.now() }, () => {
                                                                    this.setState({
                                                                        userName: getUsername(),
                                                                        conferenceUrl: window.location.href
                                                                    }, () => {
                                                                        this.startConference(currentUser.accessToken)
                                                                    })
                                                                })
                                                            } else {
                                                                this.setState({
                                                                    userName: getUsername(),
                                                                    conferenceUrl: window.location.href
                                                                }, () => {
                                                                    this.startConference(currentUser.accessToken)
                                                                })
                                                            }
                                                        } else {
                                                            this.setState({ isLoading: false, externalApiError: true })
                                                        }
                                                    })

                                                    externalApi.addEventListener('error', () => {
                                                        this.setState({ isLoading: false, externalApiError: true })
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
                                                                this.setState({ unAuthorized: true, isLoading: false })
                                                            }
                                                        })
                                                        .catch(err => {
                                                            toast(strings.GENERIC_ERROR, { type: 'error' })
                                                        })
                                                }

                                            } else {
                                                this.setState({ notFound: true, isLoading: false })
                                            }
                                        })
                                        .catch(err => {
                                            this.setState({ error: true, isLoading: false })
                                        })
                                } else {
                                    this.setState({ notFound: true, isLoading: false })
                                }
                            } else {
                                window.location = '/home' + window.location.search
                            }
                        } else {
                            this.setState({ isLoading: false })
                        }
                    }
                    else {
                        signout()
                    }
                }).catch(err => {
                    signout()
                })
            }).catch(err => {
                signout()
            })
        } else {
            signout()
        }
    }

    render() {
        const { isAuthenticating } = this.state
        if (!isAuthenticating) {
            const { isTokenValidated, verified } = this.state
            if (isTokenValidated) {
                const { conference, conferenceUrl, user, open, error, notFound, unAuthorized,
                    isLoading, closed, isLeaving, externalApiError, fullscreen, mute, showButtons } = this.state
                const subject = strings.SUBJECT + (conference ? conference.title : '')
                const body = subject
                const separator = ': '
                const url = conferenceUrl
                const size = 42, round = true
                return (
                    <div>
                        <Header hidden={fullscreen} user={user} hideLiveButton={!error && !notFound && !unAuthorized && !closed && !externalApiError} />
                        <div className={fullscreen ? "content-full-screen" : "content"} >
                            {verified ?
                                (
                                    <div className="conf">
                                        {
                                            (!error && !notFound && !unAuthorized && !closed && !externalApiError) ?
                                                (
                                                    <div>
                                                        <div id="conf" style={fullscreen ? { top: 0 } : null}></div>
                                                        {(!isLoading && showButtons && window.android) && <IconButton
                                                            className="conf-mute-btn"
                                                            onClick={this.handleMuteClick}
                                                        >
                                                            {mute ? <VolumeUp style={{ fill: 'white' }} /> : <VolumeOff style={{ fill: 'white' }} />}
                                                        </IconButton>}
                                                        {(!isLoading && showButtons && isMobile()) && <IconButton
                                                            className="conf-fullscreen-btn"
                                                            onClick={this.handleFullscreenClick}
                                                        >
                                                            {fullscreen ? <FullscreenExit style={{ fill: 'white' }} /> : <Fullscreen style={{ fill: 'white' }} />}
                                                        </IconButton>}
                                                        {(!isLoading && showButtons) && <IconButton
                                                            className="conf-share-btn"
                                                            style={{ display: isLoading ? 'none' : 'block' }}
                                                            onClick={this.handleShareClick}
                                                        >
                                                            {open ? <Close style={{ fill: 'white' }} /> : <Share style={{ fill: 'white' }} />}
                                                        </IconButton>}
                                                        <div className={'conf-actions ' + (open ? 'conf-actions-visible' : 'conf-actions-hidden')}>
                                                            <Tooltip title={strings.COPY}>
                                                                <div className="copy">
                                                                    <FileCopyOutlined className="copy-icon" style={{ fill: 'white' }} onClick={this.handleCopyClick} />
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
                                )
                                : (<div className="validate-email-conf">
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
                            {isLoading && <Backdrop text={strings.LOADING} />}
                            {isLeaving && <Backdrop text={strings.LEAVING} />}
                        </div>
                    </div>
                )
            } else {
                signout()
                return null
            }
        } else {
            return (<Backdrop text={strings.AUTHENTICATING} />)
        }
    }
}

export default Conference

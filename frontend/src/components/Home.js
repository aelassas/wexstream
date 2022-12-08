import React, { Component } from 'react';
import { strings } from '../config/app.config';
import Header from './Header';
import {
    getLanguage, getUser, validateAccessToken, resendLink, getCurrentUser, signout,
    getQueryLanguage
} from '../services/UserService';
import { getEntries, deleteSubscriberEntry } from '../services/TimelineService';
import Backdrop from './SimpleBackdrop';
import { toast } from 'react-toastify';
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
} from '@material-ui/core';
import {
    Videocam,
    Clear,
    Lock,
    Public,
    People
} from '@material-ui/icons';
import moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/ar';
import { Avatar } from './Avatar';
import { LANGUAGES, PAGE_TOP_OFFSET, PAGE_FETCH_OFFSET } from '../config/env.config';
import { Members } from './Members';
import { renderReactDom } from '../common/helper';

class Home extends Component {

    constructor(props) {
        super(props);

        this.state = {
            user: null,
            entries: [],
            isAuthenticating: true,
            isTokenValidated: false,
            isVerified: false,
            isLoading: false,
            openDeleteDialog: false,
            currentTarget: null,
            page: 1,
            fetch: false,
            openMembersDialog: false,
            conferenceId: ''
        };
    }

    handleResend = (e) => {
        e.preventDefault();
        const data = { email: this.state.email };

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

    handleDelete = (event) => {
        event.preventDefault();
        this.setState({ currentTarget: event.currentTarget, openDeleteDialog: true });
    };

    handleCancelDelete = (event) => {
        event.preventDefault();
        this.setState({ openDeleteDialog: false });
    };

    findIndex = (entryId) => this.state.entries.findIndex(e => e._id === entryId);

    handleConfirmDelete = (event) => {
        event.preventDefault();
        const entryId = this.state.currentTarget.getAttribute('data-id');

        deleteSubscriberEntry(entryId)
            .then(status => {
                if (status === 200) {
                    const index = this.findIndex(entryId);
                    const entries = [...this.state.entries];
                    entries.splice(index, 1);
                    this.setState({ entries, openDeleteDialog: false });
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

    fetchEntries = () => {
        const { user, page } = this.state;
        this.setState({ isLoading: true });

        getEntries(user._id, page)
            .then(data => {
                const entries = [...this.state.entries, ...data]
                this.setState({ entries, isLoading: false, fetch: data.length > 0 });
            })
            .catch(() => toast(strings.GENERIC_ERROR, { type: 'error' }));
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

    componentDidMount() {
        this.setState({ isLoading: true });
        let language = getQueryLanguage();

        if (!LANGUAGES.includes(language)) {
            language = getLanguage();
        }
        strings.setLanguage(language);

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
                        this.setState({ user, email: user.email, isVerified: user.isVerified, isAuthenticating: false, isTokenValidated: status === 200 });
                        this.fetchEntries();

                        const rtl = user.language === 'ar';
                        const div = document.querySelector(`.home-timeline${rtl ? '-rtl' : ''}`);
                        if (div) {
                            div.onscroll = (event) => {
                                if (this.state.fetch && !this.state.isLoading && (((window.innerHeight - PAGE_TOP_OFFSET) + event.target.scrollTop)) >= (event.target.scrollHeight - PAGE_FETCH_OFFSET)) {
                                    this.setState({ page: this.state.page + 1 }, () => {
                                        this.fetchEntries();
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
                const { isVerified, user, isLoading, entries, openDeleteDialog, openMembersDialog, conferenceId } = this.state;
                const rtl = user.language === 'ar';
                const iconStyles = {
                    float: rtl ? 'right' : 'left',
                    height: 14,
                    marginTop: -1,
                    color: '#595959'
                };

                return renderReactDom(
                    <div>
                        <Header user={user} />
                        {isVerified ? (
                            <div className="home content">
                                <div className={rtl ? 'home-timeline-rtl' : 'home-timeline'}>
                                    {entries.length === 0 && !isLoading ?
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
                                                                        <Typography className={`timeline-item-sub-title-float${rtl ? '-rtl' : ''}`}>
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
                                                                            style={{ color: '#595959', margin: 0, float: rtl ? 'left' : 'right' }}
                                                                            onClick={this.handleDelete}
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
                                                                        style={{ margin: 0, float: rtl ? 'left' : 'right' }}
                                                                        onClick={this.handleMembers}
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
                                                                        <Videocam color="secondary" style={{ marginRight: 4, marginBottom: -6 }} />
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
                                        <Button onClick={this.handleCancelDelete} color="default">{strings.CANCEL}</Button>
                                        <Button onClick={this.handleConfirmDelete} color="secondary">{strings.DELETE}</Button>
                                    </DialogActions>
                                </Dialog>
                                <Members
                                    open={openMembersDialog}
                                    conferenceId={conferenceId}
                                    loggedUser={user}
                                    onClose={this.handleCloseMembers}
                                    onFetch={this.handleMembersFetched}
                                    onError={this.handleMembersError} />
                            </div>
                        ) :
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
                            </div>)}
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

export default Home;


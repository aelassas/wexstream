import React, { useState, useEffect } from 'react'
import { LANGUAGES, DEFAULT_LANGUAGE, isMobile } from '../config/env'
import { strings } from '../config/lang'
import { getSearchKeyword, getLanguage, updateLanguage, setLanguage, getCurrentUser, signout, getQueryLanguage } from '../services/UserService'
import { getNotificationCounter } from '../services/NotificationService'
import { getMessageCounter } from '../services/MessageService'
import { alpha } from '@mui/material/styles'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import InputBase from '@mui/material/InputBase'
import Badge from '@mui/material/Badge'
import MenuItem from '@mui/material/MenuItem'
import Menu from '@mui/material/Menu'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import MailIcon from '@mui/icons-material/Mail'
import NotificationsIcon from '@mui/icons-material/Notifications'
import MoreIcon from '@mui/icons-material/MoreVert'
import LanguageIcon from '@mui/icons-material/Language'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import HomeIcon from '@mui/icons-material/Home'
import AboutIcon from '@mui/icons-material/InfoTwoTone'
import TosIcon from '@mui/icons-material/DescriptionTwoTone'
import SettingsIcon from '@mui/icons-material/Settings'
import SignoutIcon from '@mui/icons-material/ExitToApp'
import NetworkIcon from '@mui/icons-material/WifiTethering'
import Videocam from '@mui/icons-material/Videocam'
import ConnectionsIcon from '@mui/icons-material/SettingsInputAntenna'
import { toast } from 'react-toastify'
import Avatar from './Avatar'
import { createConference } from '../services/ConferenceService'
import Backdrop from './SimpleBackdrop'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Input,
    FormHelperText,
    FormControlLabel,
    Switch,
    Typography,
    Box
} from '@mui/material'

const ListItemLink = (props) => (
    <ListItemButton component="a" {...props} />
)

const Header = (props) => {
    const [currentLanguage, setCurrentLanguage] = useState(null)
    const [lang, setLang] = useState(DEFAULT_LANGUAGE)
    const [anchorEl, setAnchorEl] = useState(null)
    const [langAnchorEl, setLangAnchorEl] = useState(null)
    const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null)
    const [sideAnchorEl, setSideAnchorEl] = useState(null)
    const [isSignedIn, setIsSignedIn] = useState(false)
    const [searchKeyword, setSearchKeyword] = useState('')
    const [notificationCount, setNotificationCount] = useState(0)
    const [messageCount, setMessageCount] = useState(0)
    const [init, setInit] = useState(false)
    const [openLiveDialog, setOpenLiveDialog] = useState(false)
    const [titleError, setTitleError] = useState(false)
    const [isTitleEmpty, setIsTitleEmpty] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [isPrivate, setIsPrivate] = useState(true)
    const [isPreparing, setIsPreparing] = useState(false)
    const [isLiveButtonVisible, setIsLiveButtonVisible] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoaded, setIsLoaded] = useState(false)

    const isMenuOpen = Boolean(anchorEl)
    const isMobileMenuOpen = Boolean(mobileMoreAnchorEl)
    const isLangMenuOpen = Boolean(langAnchorEl)
    const isSideMenuOpen = Boolean(sideAnchorEl)

    const classes = {
        list: {
            width: 250,
        },
        formControl: theme => ({
            margin: theme.spacing(1),
            minWidth: 120,
        }),
        selectEmpty: theme => ({
            marginTop: theme.spacing(2),
        }),
        grow: {
            flexGrow: 1
        },
        menuButton: theme => ({
            marginRight: theme.spacing(2),
        }),
        title: theme => ({
            display: 'none',
            [theme.breakpoints.up('sm')]: {
                display: 'block',
            },
        }),
        search: theme => ({
            position: 'relative',
            borderRadius: theme.shape.borderRadius,
            backgroundColor: alpha(theme.palette.common.white, 0.15),
            '&:hover': {
                backgroundColor: alpha(theme.palette.common.white, 0.25),
            },
            marginRight: theme.spacing(2),
            marginLeft: 0,
            [theme.breakpoints.up('sm')]: {
                marginLeft: theme.spacing(3),
                width: 'auto',
            },
            [theme.breakpoints.down('sm')]: {
                // marginLeft: -15,
                // marginRight: -15,
                width: 168,
            },
        }),
        searchIcon: theme => ({
            padding: theme.spacing(0, 2),
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }),
        inputRoot: {
            color: 'inherit',
        },
        inputInput: theme => ({
            // padding: theme.spacing(1, 1, 1, 0),
            // vertical padding + font size from searchIcon
            // paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
            paddingLeft: 6,
            transition: theme.transitions.create('width'),
            width: '100%',
            color: '#fff',
            [theme.breakpoints.up('md')]: {
                width: '25ch',
            },
        }),
        sectionDesktop: theme => ({
            display: 'none',
            [theme.breakpoints.up('md')]: {
                display: 'flex',
            },
        }),
        sectionMobile: theme => ({
            display: 'flex',
            // marginRight: -13,
            [theme.breakpoints.up('md')]: {
                display: 'none',
            },
        })
    }

    const handleAccountMenuOpen = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMobileMenuClose = () => {
        setMobileMoreAnchorEl(null)
    }

    const handleLangMenuOpen = (event) => {
        setLangAnchorEl(event.currentTarget)
    }

    const refreshPage = () => {
        let params = new URLSearchParams(window.location.search)

        if (params.has('l')) {
            params.delete('l')
            window.location.href = window.location.href.split('?')[0] + ([...params].length > 0 ? ('?' + params) : '')
        } else {
            window.location.reload()
        }
    }

    const handleLangMenuClose = async (event) => {
        setLangAnchorEl(null)
        setIsLiveButtonVisible(false)
        const { code } = event.currentTarget.dataset
        if (code) {
            setLang(code)
            const currentLang = getLanguage()
            if (isSignedIn) {
                // Update user language
                const data = {
                    id: props.user._id,
                    language: code
                }
                const status = await updateLanguage(data)
                if (status === 200) {
                    setLanguage(code)
                    if (code && code !== currentLang) {
                        // Refresh page
                        refreshPage()
                    }
                } else {
                    setIsLiveButtonVisible(true)
                    toast(strings.CHANGE_LANGUAGE_ERROR, { type: 'error' })
                }
            } else {
                setLanguage(code)
                if (code && code !== currentLang) {
                    // Refresh page
                    refreshPage()
                }
            }
        } else {
            setIsLiveButtonVisible(true)
        }
    }

    const getLang = (lang) => {
        switch (lang) {
            case 'en':
                return strings.LANGUAGE_EN
            case 'fr':
                return strings.LANGUAGE_FR
            default:
                return strings.LANGUAGE_EN
        }
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
        handleMobileMenuClose()
    }

    const handleOnProfileClick = () => {
        window.location.href = '/profile'
    }

    const handleOnSettingsClick = () => {
        window.location.href = '/settings'
    }

    const handleSignout = () => {
        signout()
    }

    const handleMobileMenuOpen = (event) => {
        setMobileMoreAnchorEl(event.currentTarget)
    }

    const handleSideMenuOpen = (event) => {
        setSideAnchorEl(event.currentTarget)
    }

    const handleSideMenuClose = () => {
        setSideAnchorEl(null)
    }

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            window.location.href = '/search?s=' + encodeURIComponent(e.currentTarget.value)
        } else {
            setSearchKeyword(e.target.value)
        }
    }

    const handleSearchChange = (e) => {
        setSearchKeyword(e.target.value)
    }

    const handleMessagesClick = (e) => {
        window.location.href = '/messages'
    }

    const handleNotificationsClick = (e) => {
        window.location.href = '/notifications'
    }

    const handleClickLive = (e) => {
        setOpenLiveDialog(true)
    }

    const handleOnTitleBlur = (e) => {
        e.preventDefault()
        setTitleError(e.target.value.length < 3)
        setIsTitleEmpty(e.target.value.length === 0)
    }

    const handleOnTitleChange = (e) => {
        e.preventDefault()
        setTitle(e.target.value)
    }

    const handleOnDescriptionChange = (e) => {
        e.preventDefault()
        setDescription(e.target.value)
    }

    const handlePrivateLiveChange = (e) => {
        setIsPrivate(e.target.checked)
    }

    const handleCancelLive = (e) => {
        e.preventDefault()
        setOpenLiveDialog(false)
    }

    const handleStartLive = (e) => {
        e.preventDefault()
        setOpenLiveDialog(false)
        setIsPreparing(true)

        const conference = {
            title,
            description,
            isPrivate,
            speaker: props.user._id
        }

        createConference(conference)
            .then(res => {
                if (res.status === 200) {
                    window.location = `/conference?c=${res.data._id}`
                } else {
                    this.setState({ isPreparing: false })
                    toast(strings.GENERIC_ERROR, { type: 'error' })
                }
            })
            .catch(err => {
                this.setState({ isLoading: false })
                toast(strings.GENERIC_ERROR, { type: 'error' })
            })
    }

    useEffect(() => {
        if (!props.hidden) {
            setIsLoading(true)

            let countUpdated = false
            if (init && (props.messageCount !== undefined)) {
                setMessageCount(props.messageCount)
                countUpdated = true
            }

            if (init && (props.notificationCount !== undefined)) {
                setNotificationCount(props.notificationCount)
                countUpdated = true
            }

            if (countUpdated) {
                setIsLoading(false)
                return
            }

            const queryLanguage = getQueryLanguage()

            if (LANGUAGES.includes(queryLanguage)) {
                setLang(queryLanguage)
                setCurrentLanguage(queryLanguage)
                strings.setLanguage(queryLanguage)
            } else {
                const language = getLanguage()
                setLang(language)
                setCurrentLanguage(language)
                strings.setLanguage(language)
            }

            if (!init && props.user) {
                getNotificationCounter(props.user._id)
                    .then(notificationCounter => {
                        getMessageCounter(props.user._id)
                            .then(messageCounter => {
                                setIsSignedIn(true)
                                setSearchKeyword(getSearchKeyword())
                                setNotificationCount(notificationCounter.count)
                                setMessageCount(messageCounter.count)
                                setIsLoading(false)
                                setIsLoaded(true)
                                setInit(true)
                            })
                    })
            } else {
                const currentUser = getCurrentUser()
                if (!currentUser || init) {
                    setIsLoading(false)
                }
            }

        }
    }, [props, init, currentLanguage])

    const menuId = 'primary-search-account-menu'
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={menuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={handleOnProfileClick}>
                {
                    <Avatar loggedUser={props.user} user={props.user} size="small" className={'profile-action'} readonly />
                }
                {strings.PROFILE_HEADING}
            </MenuItem>
            <MenuItem onClick={handleOnSettingsClick}>{<SettingsIcon className={'profile-action'} />} {strings.SETTINGS}</MenuItem>
            <MenuItem onClick={handleSignout}>{
                <SignoutIcon className={'profile-action'} />}
                <Typography>{strings.SIGN_OUT}</Typography>
            </MenuItem>
        </Menu>
    )

    const mobileMenuId = 'primary-search-account-menu-mobile'
    const renderMobileMenu = (
        <Menu
            anchorEl={mobileMoreAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={mobileMenuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isMobileMenuOpen}
            onClose={handleMobileMenuClose}
        >
            <MenuItem onClick={handleOnProfileClick}>
                <IconButton color="inherit">
                    <Avatar loggedUser={props.user} user={props.user} size="small" readonly />
                </IconButton>
                <p>{strings.PROFILE_HEADING}</p>
            </MenuItem>
            <MenuItem onClick={handleOnSettingsClick}>
                <IconButton color="inherit">
                    <SettingsIcon />
                </IconButton>
                <p>{strings.SETTINGS}</p>
            </MenuItem>
            <MenuItem onClick={handleLangMenuOpen}>
                <IconButton
                    aria-label="language of current user"
                    aria-controls="primary-search-account-menu"
                    aria-haspopup="true"
                    color="inherit"
                >
                    <LanguageIcon />
                </IconButton>
                <p>{strings.LANGUAGE}</p>
            </MenuItem>
            <MenuItem onClick={handleSignout}>
                <IconButton color="inherit">
                    <SignoutIcon />
                </IconButton>
                <Typography>{strings.SIGN_OUT}</Typography>
            </MenuItem>
        </Menu>
    )

    const languageMenuId = 'primary-search-language-menu'
    const renderLanguageMenu = (
        <Menu
            anchorEl={langAnchorEl}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            id={languageMenuId}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={isLangMenuOpen}
            onClose={handleLangMenuClose}
        >
            <MenuItem onClick={handleLangMenuClose} data-code="en">English</MenuItem>
            <MenuItem onClick={handleLangMenuClose} data-code="fr">Français</MenuItem>
        </Menu>
    )

    return (
        <Box sx={classes.grow} style={props.hidden ? { display: 'none' } : null}>
            <AppBar position="fixed">
                <Toolbar>
                    <IconButton
                        edge="start"
                        sx={classes.menuButton}
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleSideMenuOpen}
                    >
                        <MenuIcon />
                    </IconButton>
                    <React.Fragment>
                        <Drawer open={isSideMenuOpen} onClose={handleSideMenuClose}>
                            <List sx={classes.list}>
                                <ListItemLink href="/home">
                                    <ListItemIcon>{<HomeIcon />}</ListItemIcon>
                                    <ListItemText primary={strings.HOME} />
                                </ListItemLink>
                                {
                                    isSignedIn &&
                                    <ListItemLink href="/search">
                                        <ListItemIcon>{<NetworkIcon />}</ListItemIcon>
                                        <ListItemText primary={strings.NETWORK} />
                                    </ListItemLink>
                                }
                                {
                                    isSignedIn &&
                                    <ListItemLink href="/connections">
                                        <ListItemIcon>{<ConnectionsIcon />}</ListItemIcon>
                                        <ListItemText primary={strings.CONNECTIONS} />
                                    </ListItemLink>
                                }
                                <ListItemLink href="/about">
                                    <ListItemIcon>{<AboutIcon />}</ListItemIcon>
                                    <ListItemText primary={strings.ABOUT} />
                                </ListItemLink>
                                <ListItemLink href="/tos">
                                    <ListItemIcon>{<TosIcon />}</ListItemIcon>
                                    <ListItemText primary={strings.TOS} />
                                </ListItemLink>
                                <ListItemLink href="/contact">
                                    <ListItemIcon>{<MailIcon />}</ListItemIcon>
                                    <ListItemText primary={strings.CONTACT} />
                                </ListItemLink>
                            </List>
                        </Drawer>
                    </React.Fragment>
                    {(isSignedIn && !props.hideSearch) &&
                        <Box sx={classes.search}>
                            <Box sx={classes.searchIcon}>
                                <SearchIcon />
                            </Box>
                            <InputBase
                                placeholder={strings.SEARCH_PLACEHOLDER}
                                sx={classes.inputInput}
                                inputProps={{ 'aria-label': 'search' }}
                                onKeyDown={handleSearch}
                                onChange={handleSearchChange}
                                value={searchKeyword}
                            />
                        </Box>
                    }
                    {(isSignedIn && !isMobile() && !props.hideLiveButton && isLiveButtonVisible && props.user && props.user.verified && !isLoading) && <Button
                        variant="contained"
                        color="error"
                        startIcon={<Videocam />}
                        className={'live-btn'}
                        onClick={handleClickLive}
                    >
                        {strings.LIVE_STREAM}
                    </Button>}
                    <Box sx={classes.grow} />
                    <Box sx={classes.sectionDesktop}>
                        {isSignedIn && <IconButton aria-label="" color="inherit" onClick={handleMessagesClick}>
                            <Badge badgeContent={messageCount > 0 ? messageCount : null} color="secondary">
                                <MailIcon />
                            </Badge>
                        </IconButton>}
                        {isSignedIn && <IconButton aria-label="" color="inherit" onClick={handleNotificationsClick}>
                            <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="secondary">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>}
                        {((isLoaded || !init) && !isLoading) && <Button
                            variant="contained"
                            color="primary"
                            sx={classes.button}
                            startIcon={<LanguageIcon />}
                            onClick={handleLangMenuOpen}
                            disableElevation
                            fullWidth
                        >
                            {getLang(lang)}
                        </Button>}
                        {isSignedIn && <IconButton
                            edge="end"
                            aria-label="account"
                            aria-controls={menuId}
                            aria-haspopup="true"
                            onClick={handleAccountMenuOpen}
                            color="inherit"
                        >
                            <Avatar loggedUser={props.user} user={props.user} size="small" readonly />
                        </IconButton>}
                    </Box>
                    <Box sx={classes.sectionMobile}>
                        {(!isSignedIn && !isLoading && !init) && <Button
                            variant="contained"
                            color="primary"
                            sx={classes.button}
                            startIcon={<LanguageIcon />}
                            onClick={handleLangMenuOpen}
                            disableElevation
                            fullWidth
                        >
                            {getLang(lang)}
                        </Button>}
                        {isSignedIn && <IconButton color="inherit" onClick={handleMessagesClick}>
                            <Badge badgeContent={messageCount > 0 ? messageCount : null} color="secondary" >
                                <MailIcon />
                            </Badge>
                        </IconButton>}
                        {isSignedIn && <IconButton color="inherit" onClick={handleNotificationsClick}>
                            <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="secondary">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>}
                        {isSignedIn && <IconButton
                            aria-label="show more"
                            aria-controls={mobileMenuId}
                            aria-haspopup="true"
                            onClick={handleMobileMenuOpen}
                            color="inherit"
                        >
                            <MoreIcon />
                        </IconButton>}
                        {(isSignedIn && !props.hideLiveButton && isLiveButtonVisible && props.user && props.user.verified && !isLoading) && <IconButton
                            className={'live-btn-mobile'}
                            onClick={handleClickLive}
                        >
                            <Videocam style={{ fill: 'white' }} />
                        </IconButton>}
                    </Box>
                </Toolbar>
            </AppBar>
            <Dialog
                disableEscapeKeyDown
                maxWidth="sm"
                open={openLiveDialog}
            >
                <DialogTitle style={{ textAlign: 'center' }}>{strings.LIVE_STREAM}</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="dense">
                        <InputLabel htmlFor="title">{strings.TITLE}</InputLabel>
                        <Input
                            id="title"
                            type="text"
                            error={titleError}
                            name="title"
                            onBlur={handleOnTitleBlur}
                            onChange={handleOnTitleChange}
                            autoComplete="off"
                            required
                        />
                        <FormHelperText error={titleError}>
                            {titleError ? strings.INVALID_TITLE : ''}
                        </FormHelperText>
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                        <InputLabel htmlFor="description">{strings.DESCRIPTION}</InputLabel>
                        <Input
                            id="description"
                            type="text"
                            name="description"
                            onChange={handleOnDescriptionChange}
                            autoComplete="off"
                            multiline
                            rows={10}
                        />
                    </FormControl>
                    <FormControlLabel
                        control={<Switch checked={isPrivate} onChange={handlePrivateLiveChange} name="privateLive" color="info" />}
                        label={strings.PRIVATE_LIVE}
                    />
                </DialogContent>
                <DialogActions className="buttons">
                    <Button onClick={handleCancelLive} variant="contained" color="inherit" size="small">{strings.CANCEL}</Button>
                    <Button onClick={handleStartLive} variant="contained" color="info" size="small" disabled={titleError || isTitleEmpty}>{strings.START}</Button>
                </DialogActions>
            </Dialog>

            {isPreparing && <Backdrop text={strings.PRPARING_CONFERENCE} />}
            {renderMobileMenu}
            {renderMenu}
            {renderLanguageMenu}
        </Box >
    )
}

export default Header
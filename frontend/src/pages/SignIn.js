import React, { useEffect, useState } from 'react'
import { LANGUAGES, DEFAULT_LANGUAGE } from '../config/env'
import { strings } from '../config/lang'
import {
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Input,
  IconButton,
  Paper,
  Button
} from '@mui/material'
import {
  Videocam,
  Security,
  VerifiedUser,
  Close
} from '@mui/icons-material'
import Error from '../components/Error'
import Header from '../components/Header'
import * as UserService from '../services/UserService'
import * as MessageService from '../services/MessageService'
import * as ConferenceService from '../services/ConferenceService'
import { loadFacebookSdk, facebookLogin } from '../auth/facebook'
import { loadGoogleSdk, googleLogin } from '../auth/google'

const SignIn = () => {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [visible, setVisible] = useState(false)
  const [blacklisted, setBlacklisted] = useState(false)
  const [openEmailAuthDialog, setOpenEmailAuthDialog] = useState(false)
  const [emailAuthError, setEmailAuthError] = useState(false)
  const [isGoogleSdkLoaded, setIsGoogleSdkLoaded] = useState(false)
  const [isFacebookSdkLoaded, setIsFacebookSdkLoaded] = useState(false)

  const handleGoogleAuth = (event, _data) => {
    const auth = (data) => {
      UserService.googleAuth(data)
        .then(res => {
          if (res.status === 200) {
            if (res.data.blacklisted) {
              UserService.signout(false)
              setError(false)
              setBlacklisted(true)
            } else {
              const conferenceId = ConferenceService.getConferenceId()
              const messageId = MessageService.getMessageId()
              const userId = UserService.getUserId()

              setError(false)

              if (conferenceId !== '') {
                window.location.href = `/conference?c=${encodeURIComponent(conferenceId)}`
              } else if (messageId !== '') {
                window.location.href = `/messages?m=${encodeURIComponent(messageId)}`
              } else if (userId !== '') {
                window.location.href = `/profile?u=${encodeURIComponent(userId)}`
              } else {
                window.location = '/home' + window.location.search
              }
            }
          } else {
            setError(true)
            setBlacklisted(false)
          }
        })
        .catch(() => {
          setError(true)
          setBlacklisted(false)
        })
    }

    if (event) {
      googleLogin((data) => {
        data.language = UserService.getLanguage()
        auth(data)
      }, (err) => {
        if (err.error === 'popup_closed_by_user') {
          return
        }

        setError(true)
        setBlacklisted(false)
      })
    } else {
      const data = _data
      data.language = UserService.getLanguage()
      auth(data)
    }
  }

  const handleGoogleAuthFailure = () => {
    setError(true)
    setBlacklisted(false)
  }

  const handleFacebookAuth = (event, _data) => {
    const auth = (data) => {
      UserService.facebookAuth(data)
        .then(res => {
          if (res.status === 200) {
            if (res.data.blacklisted) {
              UserService.signout(false)
              setError(false)
              setBlacklisted(true)
            } else {
              const conferenceId = ConferenceService.getConferenceId()
              const messageId = MessageService.getMessageId()
              const userId = UserService.getUserId()

              setError(false)

              if (conferenceId !== '') {
                window.location.href = `/conference?c=${encodeURIComponent(conferenceId)}`
              } else if (messageId !== '') {
                window.location.href = `/messages?m=${encodeURIComponent(messageId)}`
              } else if (userId !== '') {
                window.location.href = `/profile?u=${encodeURIComponent(userId)}`
              } else {
                window.location = '/home' + window.location.search
              }
            }
          } else {
            setError(true)
            setBlacklisted(false)
          }
        })
        .catch(() => {
          setError(true)
          setBlacklisted(false)
        })
    }

    if (event) {
      facebookLogin((data) => {
        data.language = UserService.getLanguage()
        auth(data)
      })
    } else {
      const data = _data
      data.language = UserService.getLanguage()
      auth(data)
    }
  }

  const handleFacebookAuthFailure = () => {
    setError(true)
    setBlacklisted(false)
  }

  const handleEmailAuth = () => {
    setOpenEmailAuthDialog(true)
  }

  const handleEmailAuthClose = () => {
    setOpenEmailAuthDialog(false)
  }

  const handleOnChangeEmail = (e) => {
    setEmail(e.target.value)
  }

  const handleOnChangePassword = (e) => {
    setPassword(e.target.value)
  }

  const handleOnPasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (window.android && window.android.setAuthType) {
      window.android.setAuthType('email')
    }

    const data = { email, password }

    UserService.signin(data)
      .then(res => {
        if (res.status === 200) {
          if (res.data.blacklisted) {
            UserService.signout(false)
            setEmailAuthError(false)
            setBlacklisted(true)
          } else {
            const conferenceId = ConferenceService.getConferenceId()
            const messageId = MessageService.getMessageId()
            const userId = UserService.getUserId()

            setEmailAuthError(false)

            if (conferenceId !== '') {
              window.location.href = `/conference?c=${encodeURIComponent(conferenceId)}`
            } else if (messageId !== '') {
              window.location.href = `/messages?m=${encodeURIComponent(messageId)}`
            } else if (userId !== '') {
              window.location.href = `/profile?u=${encodeURIComponent(userId)}`
            } else {
              window.location = '/home' + window.location.search
            }
          }
        } else {
          setEmailAuthError(true)
          setBlacklisted(false)
        }
      })
      .catch(() => {
        setEmailAuthError(true)
        setBlacklisted(false)
      })
  }

  useEffect(() => {
    loadGoogleSdk(() => {
      setIsGoogleSdkLoaded(true)
    })

    loadFacebookSdk(() => {
      setIsFacebookSdkLoaded(true)
    })

    const queryLanguage = UserService.getQueryLanguage()

    if (LANGUAGES.includes(queryLanguage)) {
      strings.setLanguage(queryLanguage)
      setLanguage(queryLanguage)
    } else {
      const language = UserService.getLanguage()
      strings.setLanguage(language)
      setLanguage(language)
    }

    if (window.android) {
      window.androidGoogleAuthSuccess = (data) => {
        handleGoogleAuth(null, JSON.parse(data))
      }

      window.androidGoogleAuthFailure = () => {
        handleGoogleAuthFailure()
      }

      window.androidFacebookAuthSuccess = (data) => {
        handleFacebookAuth(null, JSON.parse(data))
      }

      window.androidFacebookAuthFailure = () => {
        handleFacebookAuthFailure()
      }
    }

    const currentUser = UserService.getCurrentUser()
    if (currentUser) {
      UserService.validateAccessToken()
        .then(status => {
          if (status === 200) {
            UserService.getUser(currentUser.id)
              .then(user => {
                if (user) {
                  window.location.href = '/home' + window.location.search
                } else {
                  UserService.signout()
                }
              })
              .catch(() => {
                UserService.signout()
              })
          }
        })
        .catch(() => {
          UserService.signout()
        })
    } else {
      setVisible(true)
    }
  }, [])

  const authBtnStyle = { width: language === 'fr' ? 240 : 190 }

  return (
    <div>
      <Header />
      <div className="signin-content" style={visible ? null : { display: 'none' }}>
        <div className="signin-header" >
          <Card variant="outlined" className="signin-card">
            <CardContent>
              <div className="signin-icon"><Videocam fontSize="large" color="primary" /></div>
              <Typography color="textSecondary" className="signin-cc">
                {strings.SIGNIN_VIDEO_CONFERENCING}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" className="signin-card">
            <CardContent>
              <div className="signin-icon"><Security fontSize="large" color="primary" /></div>
              <Typography color="textSecondary" className="signin-cc">
                {strings.SIGNIN_PRIVACY}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" className="signin-card">
            <CardContent>
              <div className="signin-icon"><VerifiedUser fontSize="large" color="primary" /></div>
              <Typography color="textSecondary" className="signin-cc">
                {strings.SIGNIN_PROTECTION}
              </Typography>
            </CardContent>
          </Card>
        </div>
        <Paper className="signin-form" elevation={0}>
          <div>
            <h1 className="signin-form-title">{strings.SIGN_IN_HEADING}</h1>
            <div className="auth" style={{ width: language === 'fr' ? 240 : 190 }}>
              <Button
                onClick={
                  (event) => {
                    if (window.android && window.android.googleSignin) {
                      window.android.googleSignin()
                    } else {
                      handleGoogleAuth(event)
                    }
                  }
                }
                variant="contained"
                color="error"
                size="small"
                disabled={!isGoogleSdkLoaded}
                style={authBtnStyle}
              >
                {strings.SIGN_IN_WITH_GOOGLE}
              </Button>
              <Button
                onClick={
                  (event) => {
                    if (window.android && window.android.facebookSignin) {
                      window.android.facebookSignin()
                    } else {
                      handleFacebookAuth(event)
                    }
                  }
                }
                variant="contained"
                color="info"
                size="small"
                disabled={!isFacebookSdkLoaded}
                style={authBtnStyle}
              >
                {strings.SIGN_IN_WITH_FACEBOOK}
              </Button>
              <Button
                onClick={handleEmailAuth}
                variant="contained"
                color="inherit"
                size="small"
                style={authBtnStyle}
              >
                {strings.SIGN_IN_WITH_EMAIL}
              </Button>
            </div>
            <div className="form-error">
              {error && <Error message={strings.ERROR_IN_SIGN_IN} />}
              {blacklisted && <Error message={strings.IS_BLACKLISTED} />}
            </div>
          </div>
        </Paper>
        <Dialog
          disableEscapeKeyDown
          maxWidth="xs"
          open={openEmailAuthDialog}
        >
          <DialogTitle>
            <div>
              <Typography variant="h5" className="email-auth-close-title">{strings.SIGN_IN_HEADING}</Typography>
              <IconButton aria-label="close" className="email-auth-close-btn" onClick={handleEmailAuthClose}>
                <Close />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="dense">
                <InputLabel htmlFor="email">{strings.EMAIL}</InputLabel>
                <Input
                  id="email"
                  type="text"
                  name="Email"
                  onChange={handleOnChangeEmail}
                  autoComplete="email"
                  required
                />
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel htmlFor="password">{strings.PASSWORD}</InputLabel>
                <Input
                  id="password"
                  name="Password"
                  onChange={handleOnChangePassword}
                  onKeyDown={handleOnPasswordKeyDown}
                  autoComplete="password"
                  type="password"
                  required
                />
              </FormControl>
              <div className="signin-buttons buttons">
                <Button
                  type="submit"
                  variant="contained"
                  color="info"
                  size="small"
                >
                  {strings.SIGN_IN}
                </Button>
                <Button
                  variant="contained"
                  color="inherit"
                  size="small"
                  href="/sign-up"
                >
                  {strings.SIGN_UP}
                </Button>
              </div>
              <div className="form-error">
                {emailAuthError && <Error message={strings.ERROR_IN_SIGN_IN} />}
                {blacklisted && <Error message={strings.IS_BLACKLISTED} />}
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div >
  )
}

export default SignIn
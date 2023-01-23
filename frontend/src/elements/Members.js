
import React, { useState, useEffect } from 'react'
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
    ListItemAvatar,
    ListItemText,
} from '@mui/material'
import Avatar from './Avatar'
import { getMembers } from '../services/ConferenceService'
import { strings } from '../config/app.config'

const Members = (props) => {
    const [members, setMembers] = useState([])
    const [openDialog, setOpenDialog] = useState(false)
    const [rtl, setRtl] = useState(false)

    const handlCloseMembers = () => {
        if (props.onClose) {
            props.onClose()
        }
    }

    useEffect(() => {
        setRtl(props.loggedUser.language === 'ar')

        if (props.open) {
            getMembers(props.conferenceId)
                .then(members => {
                    setMembers(members)
                    setOpenDialog(true)
                    if (props.onFetch) {
                        props.onFetch.call(this, members)
                    }
                })
                .catch(err => {
                    if (props.onError) {
                        props.onError.call(this, err)
                    }
                })
        } else {
            setOpenDialog(false)
            setMembers([])
        }
    }, [props.loggedUser, props.conferenceId, props.open, props.onFetch, props.onError])

    return (
        <Dialog
            disableEscapeKeyDown
            maxWidth="sm"
            fullWidth
            open={openDialog}
        >
            <DialogTitle style={{ textAlign: 'center' }}>{strings.MEMBERS}</DialogTitle>
            <DialogContent style={{ maxHeight: 350, margin: 3 }}>
                {members.length === 0 ?
                    <Card variant="outlined">
                        <CardContent>
                            <Typography color="textSecondary">{strings.NO_MEMBER}</Typography>
                        </CardContent>
                    </Card>
                    :
                    <List>
                        {members.map((_user, i) =>
                        (
                            <ListItem key={_user._id}>
                                <ListItemAvatar className={rtl ? 'list-item-avatar-rtl' : 'list-item-avatar'}>
                                    <Link href={`/profile?u=${_user._id}`}>
                                        <Avatar loggedUser={props.loggedUser} user={_user} size="medium" color="disabled" isBuffer={true} readonly />
                                    </Link>
                                </ListItemAvatar>
                                <ListItemText
                                    disableTypography
                                    data-id={_user._id}
                                    primary={<Link href={`/profile?u=${_user._id}`}><Typography style={{ fontWeight: 500, color: '#373737' }}>{_user.fullName}</Typography></Link>}
                                >
                                </ListItemText>
                            </ListItem>
                        )
                        )}
                    </List>
                }
            </DialogContent>
            <DialogActions>
                <Button onClick={handlCloseMembers} color="default">{strings.CLOSE}</Button>
            </DialogActions>
        </Dialog>
    )
}

export default Members
import React from 'react';
import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
        // background: 'rgba(0,0,0,0.7)'
    },
}));

export default function SimpleBackdrop(props) {
    const classes = useStyles();

    return (
        <div>
            <Backdrop className={classes.backdrop} open={true}>
                {props.text}
                {props.progress ? <CircularProgress color="inherit" /> : null}
            </Backdrop>
        </div>
    );
}
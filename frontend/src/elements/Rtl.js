import { create } from 'jss';
import rtl from 'jss-rtl';
import { StylesProvider, jssPreset } from '@mui/material/styles';

// Configure JSS
const jss = create({ plugins: [...jssPreset().plugins, rtl()] });

export default function Rtl(props) {
    return (
        <StylesProvider jss={jss}>
            {props.children}
        </StylesProvider>
    );
}
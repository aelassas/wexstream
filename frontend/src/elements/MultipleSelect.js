import React, { useState, useEffect, forwardRef, useRef, useImperativeHandle } from 'react'
import { makeStyles } from "@mui/material/styles"
import { Autocomplete, TextField } from "@mui/material"

const ListBox = forwardRef(
    function ListBoxBase(props, ref) {
        const { children, ...rest } = props;

        const innerRef = useRef(null);

        useImperativeHandle(ref, () => innerRef.current);

        return (
            // eslint-disable-next-line
            <ul {...rest} ref={innerRef} role='list-box'>{children}</ul>
        );
    },
)

const useStyles = makeStyles((theme) => ({
    root: {
        width: 325,
        "& > * + *": {
            marginTop: theme.spacing(3)
        }
    }
}))

const MultipleSelect = ({
    label,
    callbackFromMultipleSelect,
    reference,
    selectedUsers,
    userKey,
    required,
    options,
    ListboxProps,
    onFocus,
    onInputChange,
    onClear,
    loading
}) => {
    const classes = useStyles()
    const [values, setValues] = useState([])

    useEffect(() => {
        setValues(selectedUsers)
    }, [selectedUsers])

    return (
        <div className={classes.root}>
            <Autocomplete
                options={[...values, ...options]}
                filterOptions={() => options}
                value={values}
                getOptionLabel={(option) => option.fullName}
                getOptionSelected={(option, value) => option._id === value._id}
                onChange={(event, values) => {
                    setValues(values)
                    callbackFromMultipleSelect(values, userKey, reference)
                    if (values.length === 0 && onClear) {
                        onClear()
                    }
                }}
                clearOnBlur={false}
                clearOnEscape={false}
                loading={loading}
                multiple
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        variant="outlined"
                        required={required && values.length === 0}
                    />
                )}
                ListboxProps={ListboxProps || null}
                ListboxComponent={ListBox}
                onFocus={onFocus || null}
                onInputChange={onInputChange || null}
            />
        </div>
    )
}

export default MultipleSelect
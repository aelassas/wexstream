import React, { useState, useEffect, forwardRef, useRef, useImperativeHandle } from 'react'
import { Autocomplete, TextField, Box } from "@mui/material"

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

const classes = {
    root: theme => ({
        width: 325,
        "& > * + *": {
            marginTop: theme.spacing(3)
        }
    })
}

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
    const [values, setValues] = useState([])

    useEffect(() => {
        setValues(selectedUsers)
    }, [selectedUsers])

    return (
        <Box sx={classes.root}>
            <Autocomplete
                options={[...values, ...options]}
                filterOptions={() => options}
                value={values}
                getOptionLabel={(option) => option.fullName}
                isOptionEqualToValue={(option, value) => option._id === value._id}
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
                renderOption={(props, option) => (
                    <li {...props} key={option._id}>{option.fullName}</li>
                )}
                ListboxProps={ListboxProps || null}
                ListboxComponent={ListBox}
                onFocus={onFocus || null}
                onInputChange={onInputChange || null}
            />
        </Box>
    )
}

export default MultipleSelect
import React, { useState, useEffect } from 'react';
import Autocomplete from "@material-ui/lab/Autocomplete";
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";

const useStyles = makeStyles((theme) => ({
    root: {
        width: 325,
        "& > * + *": {
            marginTop: theme.spacing(3)
        }
    }
}));

export default function MultipleSelect({
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
}) {
    const classes = useStyles();
    const [values, setValues] = useState([]);

    useEffect(() => {
        setValues(selectedUsers);
    }, [selectedUsers]);

    return (
        <div className={classes.root}>
            <Autocomplete
                options={[...values, ...options]}
                filterOptions={() => options}
                value={values}
                getOptionLabel={(option) => option.fullName}
                getOptionSelected={(option, value) => option._id === value._id}
                onChange={(event, values) => {
                    setValues(values);
                    callbackFromMultipleSelect(values, userKey, reference);
                    if (values.length === 0 && onClear) {
                        onClear();
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
                onFocus={onFocus || null}
                onInputChange={onInputChange || null}
            />
        </div>
    );
}

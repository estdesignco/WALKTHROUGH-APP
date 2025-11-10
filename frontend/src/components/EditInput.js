// PROVEN FIX: Use uncontrolled inputs with refs
import React, { useRef, useEffect } from 'react';

const EditInput = ({ value, onChange, ...props }) => {
    const inputRef = useRef(null);
    
    useEffect(() => {
        if (inputRef.current && inputRef.current.value !== value) {
            inputRef.current.value = value || '';
        }
    }, [value]);
    
    return (
        <input
            ref={inputRef}
            defaultValue={value || ''}
            onChange={(e) => onChange(e.target.value)}
            {...props}
        />
    );
};

export default EditInput;

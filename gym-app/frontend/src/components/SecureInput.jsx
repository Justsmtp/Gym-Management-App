import React, { useState } from 'react';
import { sanitizeInput, detectSuspiciousInput } from '../utils/security';

const SecureInput = ({ 
  type = 'text', 
  value, 
  onChange, 
  maxLength = 255,
  pattern,
  ...props 
}) => {
  const [error, setError] = useState('');

  const handleChange = (e) => {
    let inputValue = e.target.value;
    
    // Check for suspicious patterns
    if (detectSuspiciousInput(inputValue)) {
      setError('Invalid characters detected');
      return;
    }
    
    // Enforce max length
    if (inputValue.length > maxLength) {
      inputValue = inputValue.substring(0, maxLength);
    }
    
    // Sanitize input
    const sanitized = sanitizeInput(inputValue);
    
    setError('');
    onChange({ ...e, target: { ...e.target, value: sanitized } });
  };

  return (
    <div>
      <input
        {...props}
        type={type}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        pattern={pattern}
        autoComplete={type === 'password' ? 'current-password' : 'off'}
      />
      {error && <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>}
    </div>
  );
};

export default SecureInput;

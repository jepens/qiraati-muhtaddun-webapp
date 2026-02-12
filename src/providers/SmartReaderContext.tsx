import React, { useState } from 'react';
import { SmartReaderContext } from './SmartReaderContextDefinition';

export const SmartReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSmartMode, setIsSmartMode] = useState(false);

    // Optional: Persist to localStorage if desired, but user didn't explicitly ask for persistent session storage, only nav.
    // We'll keep it simple for now, as context survives nav. 
    // If refresh happens, it resets. If user wants restart persistence, we can add localStorage later.

    return (
        <SmartReaderContext.Provider value={{ isSmartMode, setIsSmartMode }}>
            {children}
        </SmartReaderContext.Provider>
    );
};



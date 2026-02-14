import React, { useState } from 'react';
import { SmartReaderContext, type GestureType } from './SmartReaderContextDefinition';

export const SmartReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSmartMode, setIsSmartMode] = useState(false);
    const [gestureType, setGestureType] = useState<GestureType>('head');

    return (
        <SmartReaderContext.Provider value={{ isSmartMode, setIsSmartMode, gestureType, setGestureType }}>
            {children}
        </SmartReaderContext.Provider>
    );
};

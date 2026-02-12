import { createContext } from 'react';

export interface SmartReaderContextType {
    isSmartMode: boolean;
    setIsSmartMode: (value: boolean) => void;
}

export const SmartReaderContext = createContext<SmartReaderContextType | undefined>(undefined);

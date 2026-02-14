import { createContext } from 'react';

export type GestureType = 'head' | 'hand';

export interface SmartReaderContextType {
    isSmartMode: boolean;
    setIsSmartMode: (value: boolean) => void;
    gestureType: GestureType;
    setGestureType: (value: GestureType) => void;
}

export const SmartReaderContext = createContext<SmartReaderContextType | undefined>(undefined);

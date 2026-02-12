import { useContext } from 'react';
import { SmartReaderContext } from './SmartReaderContextDefinition';

export const useSmartReader = () => {
    const context = useContext(SmartReaderContext);
    if (context === undefined) {
        throw new Error('useSmartReader must be used within a SmartReaderProvider');
    }
    return context;
};

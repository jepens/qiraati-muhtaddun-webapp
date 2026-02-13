import { useMemo } from 'react';
import Fuse, { IFuseOptions } from 'fuse.js';

interface UseFuseSearchOptions<T> extends IFuseOptions<T> {
    // Add any custom options if needed
}

export function useFuseSearch<T>(data: T[], options: UseFuseSearchOptions<T>) {
    const fuse = useMemo(() => {
        return new Fuse(data, options);
    }, [data, options]);

    const search = (query: string) => {
        if (!query) {
            return data;
        }

        // Perform search
        const results = fuse.search(query);

        // Map back to original items
        return results.map(result => result.item);
    };

    return { search };
}

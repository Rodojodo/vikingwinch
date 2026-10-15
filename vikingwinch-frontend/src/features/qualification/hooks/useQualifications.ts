import { useCallback, useEffect, useState } from 'react';
import { getQualifications, refreshQualifications } from '../api/qualificationClient';
import type { OperatorQualificationsRead } from '../types';

export interface UseQualificationsResult {
    qualifications: OperatorQualificationsRead | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useQualifications(): UseQualificationsResult {
    const [qualifications, setQualifications] = useState<OperatorQualificationsRead | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await refreshQualifications();
            setQualifications(data);
        } catch {
            setError('Failed to refresh qualifications');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        getQualifications()
            .then(data => {
                if (isMounted) {
                    setQualifications(data);
                    setIsLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setError('Failed to load qualifications');
                    setIsLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    return { qualifications, isLoading, error, refresh };
}

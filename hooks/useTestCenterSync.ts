/**
 * useTestCenterSync — Hook for test center station coordination.
 * Handles: registration, heartbeat, admin command listening, proctoring events.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import {
    registerStation,
    updateStationHeartbeat,
    subscribeToAdminCommands,
    TestCenterStation,
} from '../services/examService';

interface TestCenterSyncState {
    station: TestCenterStation | null;
    isRegistered: boolean;
    adminCommand: { command: string; payload: any } | null;
    proctoringFlags: number;
}

interface UseTestCenterSyncOptions {
    centerId: string;
    stationNumber: number;
    userId: string;
    candidateName: string;
    enabled?: boolean;
}

export function useTestCenterSync({
    centerId,
    stationNumber,
    userId,
    candidateName,
    enabled = true,
}: UseTestCenterSyncOptions) {
    const [state, setState] = useState<TestCenterSyncState>({
        station: null,
        isRegistered: false,
        adminCommand: null,
        proctoringFlags: 0,
    });

    const heartbeatRef = useRef<any>(null);
    const stationRef = useRef<TestCenterStation | null>(null);

    // Register station on mount
    useEffect(() => {
        if (!enabled || !centerId || !stationNumber) return;

        const register = async () => {
            const station = await registerStation(centerId, stationNumber, userId, candidateName);
            if (station) {
                stationRef.current = station;
                setState(prev => ({ ...prev, station, isRegistered: true }));
            }
        };
        register();
    }, [centerId, stationNumber, userId, candidateName, enabled]);

    // Heartbeat every 30 seconds
    useEffect(() => {
        if (!enabled || !state.isRegistered || !stationRef.current) return;

        const sendHeartbeat = () => {
            if (stationRef.current) {
                updateStationHeartbeat(stationRef.current.id, stationRef.current.status as any);
            }
        };

        heartbeatRef.current = setInterval(sendHeartbeat, 30000);
        return () => clearInterval(heartbeatRef.current);
    }, [enabled, state.isRegistered]);

    // Listen for admin commands
    useEffect(() => {
        if (!enabled || !centerId) return;

        const unsubscribe = subscribeToAdminCommands(centerId, (command, payload) => {
            setState(prev => ({ ...prev, adminCommand: { command, payload } }));
        });

        return unsubscribe;
    }, [enabled, centerId]);

    // Proctoring: detect visibility changes and blur events
    useEffect(() => {
        if (!enabled || !state.isRegistered || !stationRef.current) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setState(prev => ({ ...prev, proctoringFlags: prev.proctoringFlags + 1 }));
                if (stationRef.current) {
                    updateStationHeartbeat(stationRef.current.id, 'ACTIVE', {
                        type: 'TAB_HIDDEN',
                        timestamp: new Date().toISOString(),
                    });
                }
            }
        };

        const handleBlur = () => {
            setState(prev => ({ ...prev, proctoringFlags: prev.proctoringFlags + 1 }));
            if (stationRef.current) {
                updateStationHeartbeat(stationRef.current.id, 'ACTIVE', {
                    type: 'WINDOW_BLUR',
                    timestamp: new Date().toISOString(),
                });
            }
        };

        // Prevent right-click context menu
        const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);

        // Request fullscreen
        try {
            document.documentElement.requestFullscreen?.();
        } catch { /* ignore if blocked */ }

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [enabled, state.isRegistered]);

    // Update station status
    const updateStatus = useCallback((status: TestCenterStation['status']) => {
        if (stationRef.current) {
            stationRef.current = { ...stationRef.current, status };
            setState(prev => ({ ...prev, station: stationRef.current }));
            updateStationHeartbeat(stationRef.current!.id, status);
        }
    }, []);

    // Clear the admin command after processing
    const clearCommand = useCallback(() => {
        setState(prev => ({ ...prev, adminCommand: null }));
    }, []);

    return {
        ...state,
        updateStatus,
        clearCommand,
    };
}

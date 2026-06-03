import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { MessagePackHubProtocol } from '@microsoft/signalr-protocol-msgpack';

export const TelemetryContext = createContext();

export const useTelemetry = () => {
    const context = useContext(TelemetryContext);
    if (!context) {
        throw new Error("useTelemetry must be used within a LeakFreeTelemetryProvider");
    }
    return context;
};

export const LeakFreeTelemetryProvider = ({ children }) => {
    const [latestTick, setLatestTick] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // High-frequency history is stored in a Ref to avoid triggering continuous array re-allocations
    const telemetryHistoryRef = useRef([]);
    const MAX_HISTORY = 100;

    useEffect(() => {
        let isCurrentMount = true;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl('/hubs/telemetry', {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets,
                withCredentials: true
            })
            .withHubProtocol(new MessagePackHubProtocol())
            .withAutomaticReconnect([0, 2000, 10000, 30000]) // Strict backoff control
            .configureLogging(signalR.LogLevel.Error) // Only log critical exceptions to protect browser logs
            .build();

        // Safe callback wrapper prevents closure state degradation
        const handleIncomingMetrics = (tick) => {
            if (!isCurrentMount) return;

            // 1. Maintain sliding window inside the mutable reference (Zero UI rendering cost)
            telemetryHistoryRef.current.unshift(tick); // prepend so newest is at 0
            if (telemetryHistoryRef.current.length > MAX_HISTORY) {
                telemetryHistoryRef.current.pop();
            }

            // 2. Only push individual atomic tick to state to safely alert visual components
            setLatestTick(tick);
        };

        connection.on("ReceiveTelemetryMetrics", handleIncomingMetrics);

        const startSocketConnection = async () => {
            try {
                if (connection.state === signalR.HubConnectionState.Disconnected) {
                    await connection.start();
                    if (isCurrentMount) setIsConnected(true);
                    console.log("Telemetry socket connected successfully.");
                }
            } catch (err) {
                console.error("Telemetry connection failed, scheduling isolated fallback retry...", err);
                if (isCurrentMount) setTimeout(startSocketConnection, 5000);
            }
        };

        startSocketConnection();

        // THE ULTIMATE CLEANUP STEP: Guarantees zero leftover dangling memory pointers
        return () => {
            isCurrentMount = false;
            connection.off("ReceiveTelemetryMetrics", handleIncomingMetrics); // 1. Detach callback explicitly
            connection.stop() // 2. Kill the underlying TCP layer cleanly
                .then(() => console.log("Socket connection closed safely."))
                .catch(err => console.error("Error disposing connection:", err));
        };
    }, []);

    // Provide the ref so components can read the full history on demand, 
    // and provide latestTick so they know exactly *when* to re-render.
    return (
        <TelemetryContext.Provider value={{ latestTick, isConnected, historyRef: telemetryHistoryRef }}>
            {children}
        </TelemetryContext.Provider>
    );
};

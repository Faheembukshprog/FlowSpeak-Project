import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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

function parseLowStockPayload(payload) {
    if (!payload) return null;
    if (typeof payload === 'string') {
        try {
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }
    if (typeof payload === 'object') return payload;
    return null;
}

function buildAlertFromTick(tick) {
    const payload = parseLowStockPayload(tick.payload);
    const id = payload?.productId != null
        ? String(payload.productId)
        : payload?.sku || tick.id;

    return {
        id,
        sku: payload?.sku || '',
        name: payload?.name || tick.entity || 'Unknown product',
        stockQuantity: payload?.stockQuantity ?? 0,
        status: tick.status || 'WARNING',
        message: payload?.message || `Low stock: ${payload?.name || tick.entity}`,
        timestamp: tick.timestamp,
    };
}

export const LeakFreeTelemetryProvider = ({ children }) => {
    const [latestTick, setLatestTick] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);

    const telemetryHistoryRef = useRef([]);
    const dismissedAlertIdsRef = useRef(new Set());
    const MAX_HISTORY = 100;

    const dismissLowStockAlert = useCallback((alertId) => {
        dismissedAlertIdsRef.current.add(alertId);
        setLowStockAlerts((current) => current.filter((a) => a.id !== alertId));
    }, []);

    const dismissAllLowStockAlerts = useCallback(() => {
        setLowStockAlerts((current) => {
            current.forEach((a) => dismissedAlertIdsRef.current.add(a.id));
            return [];
        });
    }, []);

    useEffect(() => {
        let isCurrentMount = true;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl('/hubs/telemetry', {
                skipNegotiation: false,
                transport: signalR.HttpTransportType.WebSockets,
                withCredentials: true
            })
            .withHubProtocol(new MessagePackHubProtocol())
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .configureLogging(signalR.LogLevel.Error)
            .build();

        const handleIncomingMetrics = (tick) => {
            if (!isCurrentMount) return;

            telemetryHistoryRef.current.unshift(tick);
            if (telemetryHistoryRef.current.length > MAX_HISTORY) {
                telemetryHistoryRef.current.pop();
            }

            if (tick.eventType === 'LOW_STOCK_ALERT') {
                const alert = buildAlertFromTick(tick);
                if (!dismissedAlertIdsRef.current.has(alert.id)) {
                    setLowStockAlerts((current) => {
                        const withoutDup = current.filter((a) => a.id !== alert.id);
                        return [alert, ...withoutDup].slice(0, 20);
                    });
                }
            }

            setLatestTick(tick);
        };

        connection.on("ReceiveTelemetryMetrics", handleIncomingMetrics);

        const startSocketConnection = async () => {
            try {
                if (connection.state === signalR.HubConnectionState.Disconnected) {
                    await connection.start();
                    if (isCurrentMount) setIsConnected(true);
                }
            } catch (err) {
                console.error("Telemetry connection failed, scheduling isolated fallback retry...", err);
                if (isCurrentMount) setTimeout(startSocketConnection, 5000);
            }
        };

        startSocketConnection();

        return () => {
            isCurrentMount = false;
            connection.off("ReceiveTelemetryMetrics", handleIncomingMetrics);
            connection.stop().catch(() => {});
        };
    }, []);

    return (
        <TelemetryContext.Provider value={{
            latestTick,
            isConnected,
            historyRef: telemetryHistoryRef,
            lowStockAlerts,
            dismissLowStockAlert,
            dismissAllLowStockAlerts,
        }}>
            {children}
        </TelemetryContext.Provider>
    );
};

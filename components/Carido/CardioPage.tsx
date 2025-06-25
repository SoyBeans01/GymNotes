import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogEntry {
    id: string;
    timeMillis: number;   // full ms for storage & pace calc
    distance: number;
    date: string;         // YYYY-MM-DD
}

const STORAGE_KEY = 'cardioLogs';

// Stopwatch formatting: mm:ss.SS (SS = centiseconds)
const formatStopwatch = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mm = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0');
    const ss = (totalSeconds % 60).toString().padStart(2, '0');
    const cs = Math.floor((millis % 1000) / 10)
        .toString()
        .padStart(2, '0');
    return `${mm}:${ss}.${cs}`;
};

// Input formatting: mm:ss only
const formatInputTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mm = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0');
    const ss = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
};

// Parse mm:ss into milliseconds
const parseInputTime = (str: string) => {
    const parts = str.split(':');
    if (parts.length !== 2) return NaN;
    const mm = parseInt(parts[0], 10);
    const ss = parseInt(parts[1], 10);
    if (isNaN(mm) || isNaN(ss)) return NaN;
    return mm * 60_000 + ss * 1000;
};

// Pace calculation (min per unit)
const calculatePace = (timeMillis: number, distance: number) => {
    if (!distance) return '--';
    const paceSec = (timeMillis / 1000) / distance;
    const m = Math.floor(paceSec / 60);
    const s = Math.floor(paceSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const CardioPage = () => {
    // Stopwatch
    const [isRunning, setIsRunning] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Laps (optional)
    const [laps, setLaps] = useState<number[]>([]);

    // Inputs
    const [timeInput, setTimeInput] = useState('00:00');
    const [distanceInput, setDistanceInput] = useState('');

    // Logs
    const [logs, setLogs] = useState<LogEntry[]>([]);

    // Start/Stop toggle
    const toggleTimer = () => {
        if (isRunning) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            // update input to mm:ss only
            setTimeInput(formatInputTime(elapsedMs));
        } else {
            const start = Date.now() - elapsedMs;
            intervalRef.current = setInterval(() => {
                setElapsedMs(Date.now() - start);
            }, 10);
            setIsRunning(true);
        }
    };

    // Reset everything
    const resetAll = () => {
        clearInterval(intervalRef.current!);
        setIsRunning(false);
        setElapsedMs(0);
        setLaps([]);
        setTimeInput('00:00');
    };

    // Lap
    const addLap = () => {
        if (isRunning) setLaps((prev) => [...prev, elapsedMs]);
    };

    // Copy stopwatch mm:ss to input
    const useCurrentTime = () => {
        setTimeInput(formatInputTime(elapsedMs));
    };

    // Save log
    const saveLog = async () => {
        const ms = parseInputTime(timeInput);
        const dist = parseFloat(distanceInput);
        if (isNaN(ms) || ms <= 0) {
            return Alert.alert('Invalid Time', 'Please enter time as mm:ss.');
        }
        if (isNaN(dist) || dist <= 0) {
            return Alert.alert('Invalid Distance', 'Enter a positive number.');
        }
        const entry: LogEntry = {
            id: Math.random().toString(36).substring(2),
            timeMillis: ms,
            distance: dist,
            date: new Date().toISOString().split('T')[0],
        };
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            const arr: LogEntry[] = raw ? JSON.parse(raw) : [];
            const updated = [entry, ...arr];
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            setLogs(updated);
            Alert.alert('Saved!', 'Your cardio log is saved.');
            resetAll();
            setDistanceInput('');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not save log.');
        }
    };

    // Load logs
    useEffect(() => {
        (async () => {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) setLogs(JSON.parse(raw));
        })();
    }, []);

    // Last 7 days
    const recent = logs.filter((l) => {
        const diff = Date.now() - new Date(l.date).getTime();
        return diff <= 7 * 24 * 3600 * 1000;
    });

    // Render log row
    const renderLog = ({ item }: { item: LogEntry }) => (
        <View style={styles.logRow}>
            <Text style={[styles.logCell, styles.colDate]}>{item.date}</Text>
            <Text style={[styles.logCell, styles.colTime]}>
                {formatInputTime(item.timeMillis)}
            </Text>
            <Text style={[styles.logCell, styles.colDist]}>
                {item.distance.toFixed(2)}
            </Text>
            <Text style={[styles.logCell, styles.colPace]}>
                {calculatePace(item.timeMillis, item.distance)}
            </Text>
        </View>
    );

    const onChangeTimeInput = (text: string) => {
        // strip out any non-digit
        const digits = text.replace(/\D/g, '').slice(0, 4);
        // insert colon after two digits
        let formatted = digits;
        if (digits.length > 2) {
            formatted = digits.slice(0, 2) + ':' + digits.slice(2);
        }
        setTimeInput(formatted);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
            {/* Stopwatch */}
            <Text style={styles.stopwatch}>{formatStopwatch(elapsedMs)}</Text>
            <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={toggleTimer}>
                    <Text style={styles.btnText}>{isRunning ? 'Stop' : 'Start'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, !isRunning && styles.disabled]}
                    onPress={addLap}
                    disabled={!isRunning}
                >
                    <Text style={styles.btnText}>Lap</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={resetAll}>
                    <Text style={styles.btnText}>Reset</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={useCurrentTime} style={styles.link}>
                <Text style={styles.linkText}>Use Current Time</Text>
            </TouchableOpacity>

            {/* LAPS CONTAINER */}
            <View style={styles.lapsContainer}>
                <Text style={styles.sectionTitle}>Laps</Text>
                {laps.length === 0 ? (
                    <Text style={styles.empty}>No laps recorded</Text>
                ) : (
                    <FlatList
                        data={laps.slice().reverse()} // newest first
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item, index }) => {
                            const rev = laps.slice().reverse();
                            const currentCum = rev[index];
                            const prevCum = rev[index + 1] ?? 0;
                            const prev2Cum = rev[index + 2] ?? 0;

                            const currentDur = currentCum - prevCum;
                            const previousDur = prevCum - prev2Cum;
                            const diff = currentDur - previousDur;

                            // Format durations to mm:ss.CS
                            const fmt = (ms: number) => {
                                const totalSec = Math.floor(ms / 1000);
                                const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
                                const ss = (totalSec % 60).toString().padStart(2, '0');
                                const cs = Math.floor((ms % 1000) / 10)
                                    .toString().padStart(2, '0');
                                return `${mm}:${ss}.${cs}`;
                            };

                            const sign = diff > 0 ? '+' : '−';
                            const diffText = `${sign}${fmt(Math.abs(diff))}`;
                            const color = diff > 0 ? styles.slower : styles.faster;

                            const lapNumber = laps.length - index;

                            return (
                                <View style={styles.lapRow}>
                                    <Text style={styles.lapNumber}>Lap {lapNumber}</Text>
                                    <View style={styles.lapTimeRow}>
                                        {index < rev.length - 1 && (
                                            <Text style={[styles.diffText, color]}>
                                                {diffText}
                                            </Text>
                                        )}
                                        <Text style={styles.lapTime}>{fmt(currentDur)}</Text>
                                    </View>
                                </View>
                            );
                        }}
                    />
                )}
            </View>

            {/* Inputs */}
            <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Time (mm:ss)</Text>
                    <TextInput
                        style={styles.input}
                        value={timeInput}
                        onChangeText={onChangeTimeInput}
                        keyboardType="number-pad"
                        placeholder="MM:SS"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Distance</Text>
                    <TextInput
                        style={styles.input}
                        value={distanceInput}
                        onChangeText={setDistanceInput}
                        keyboardType="decimal-pad"
                    />
                </View>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveLog}>
                <Text style={styles.saveText}>Save Log</Text>
            </TouchableOpacity>

            {/* Logs Header */}
            <View style={[styles.logRow, styles.headerRow]}>
                <Text style={[styles.logCell, styles.colDate, styles.headerText]}>
                    Date
                </Text>
                <Text style={[styles.logCell, styles.colTime, styles.headerText]}>
                    Time
                </Text>
                <Text style={[styles.logCell, styles.colDist, styles.headerText]}>
                    Distance
                </Text>
                <Text style={[styles.logCell, styles.colPace, styles.headerText]}>
                    Pace
                </Text>
            </View>

            {/* Logs List */}
            <FlatList
                data={recent}
                keyExtractor={(i) => i.id}
                renderItem={renderLog}
                ListEmptyComponent={
                    <Text style={styles.empty}>No logs in last 7 days</Text>
                }
                style={styles.logList}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111', padding: 16 },
    stopwatch: {
        fontSize: 64,
        color: '#00BFFF',
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
    },
    row: { flexDirection: 'row', justifyContent: 'space-around' },
    btn: {
        backgroundColor: '#00BFFF',
        padding: 12,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    disabled: { backgroundColor: '#555' },
    btnText: { color: '#fff', fontWeight: 'bold' },
    link: { alignSelf: 'center', marginVertical: 8 },
    linkText: { color: '#ccc', textDecorationLine: 'underline' },
    inputRow: { flexDirection: 'row', marginVertical: 12 },
    inputGroup: { flex: 1, marginHorizontal: 4 },
    label: { color: '#ccc', marginBottom: 4 },
    input: {
        backgroundColor: '#222',
        color: '#fff',
        padding: 8,
        borderRadius: 6,
        fontSize: 16,
    },
    saveBtn: {
        backgroundColor: '#00BFFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    saveText: { color: '#fff', fontWeight: 'bold' },
    logList: { flex: 1 },
    logRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        paddingVertical: 8,
        alignItems: 'center',
    },
    headerRow: { borderBottomColor: '#00BFFF', borderBottomWidth: 2 },
    logCell: { color: '#fff' },
    headerText: { fontWeight: 'bold' },
    colDate: { flex: 2 },
    colTime: { flex: 2, textAlign: 'center' },
    colDist: { flex: 2, textAlign: 'center' },
    colPace: { flex: 3, textAlign: 'center' },
    empty: { color: '#888', textAlign: 'center', marginTop: 20 },
    lapsContainer: {
        backgroundColor: '#222',
        borderRadius: 8,
        padding: 12,
        marginVertical: 12,
        maxHeight: 180,
    },
    sectionTitle: {
        color: '#00BFFF',
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 8,
        textAlign: 'center',
    },
    lapRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    lapNumber: {
        color: '#fff',
        fontSize: 16,
    },
    lapTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lapTime: {
        color: '#fff',
        fontSize: 16,
        fontVariant: ['tabular-nums'],
    },
    diffText: {
        fontSize: 14,
        marginRight: 8,
        fontWeight: 'bold',
    },
    faster: {
        color: '#2ecc40',  // green
    },
    slower: {
        color: '#ff4136', // red
    },
});

export default CardioPage;

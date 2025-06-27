// components/GrowthBarChart.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-gifted-charts';
import { Picker } from '@react-native-picker/picker';
import {
    loadExercises,
    loadWeights,
} from '../utils/Storage';
import { Exercise } from '../utils/types';

type Mode = 'weekly' | 'monthly' | 'overall';

interface GrowthPoint {
    label: string;
    value: number; // percent growth
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const chartPadding = 66;
const chartWidth = SCREEN_WIDTH - (chartPadding * 2);

const chartCommon = {
    width: chartWidth,
    height: 200,
    barWidth: 20,
    noOfSections: 4,
    spacing: 16,
    initialSpacing: 16,
    xAxisColor: '#888',
    yAxisColor: '#888',
    xAxisLabelTextStyle: { color: '#ccc', fontSize: 10 },
    yAxisTextStyle: { color: '#ccc' },
};

const GrowthBarChart: React.FC = () => {
    const [mode, setMode] = useState<Mode>('weekly');
    const [data, setData] = useState<GrowthPoint[]>([]);
    const [avgOverall, setAvgOverall] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // Load everything on focus or when mode changes
    useFocusEffect(
        useCallback(() => {
            let active = true;
            const load = async () => {
                setLoading(true);

                // 1) get raw weights: { weekKey: { exId: weight } }
                const raw = await AsyncStorage.getItem('exerciseWeights');
                const weightsByWeek: Record<string, Record<string, number>> = raw
                    ? JSON.parse(raw)
                    : {};

                // 2) get exercise list
                const exercises: Exercise[] = await loadExercises();

                // 3) sort week-keys ascending
                const weeks = Object.keys(weightsByWeek).sort((a, b) =>
                    a.localeCompare(b)
                );

                // helper to compute percent growth safely
                const pct = (oldW: number, newW: number) =>
                    oldW > 0 ? ((newW - oldW) / oldW) * 100 : 0;

                let points: GrowthPoint[] = [];

                if (mode === 'weekly') {
                    // need at least 2 weeks
                    if (weeks.length >= 2) {
                        const last = weeks[weeks.length - 1];
                        const prev = weeks[weeks.length - 2];
                        points = exercises.map((ex) => {
                            const oldW = weightsByWeek[prev]?.[ex.id] ?? 0;
                            const newW = weightsByWeek[last]?.[ex.id] ?? 0;
                            return {
                                label: ex.name,
                                value: pct(oldW, newW),
                            };
                        });
                    }
                } else if (mode === 'monthly') {
                    // group by monthKey = YYYY-MM, pick last two
                    const byMonth: Record<string, Record<string, number>> = {};
                    for (const wk of weeks) {
                        const month = wk.slice(0, 7);
                        byMonth[month] = weightsByWeek[wk] ?? {};
                    }
                    const months = Object.keys(byMonth).sort();
                    if (months.length >= 2) {
                        const m1 = months[months.length - 2];
                        const m2 = months[months.length - 1];
                        points = exercises.map((ex) => {
                            const oldW = byMonth[m1]?.[ex.id] ?? 0;
                            const newW = byMonth[m2]?.[ex.id] ?? 0;
                            return {
                                label: ex.name,
                                value: pct(oldW, newW),
                            };
                        });
                    }
                } else {
                    // overall: from first week to last week
                    if (weeks.length >= 1) {
                        const first = weeks[0];
                        const last = weeks[weeks.length - 1];
                        points = exercises.map((ex) => {
                            const oldW = weightsByWeek[first]?.[ex.id] ?? 0;
                            const newW = weightsByWeek[last]?.[ex.id] ?? 0;
                            return {
                                label: ex.name,
                                value: pct(oldW, newW),
                            };
                        });
                        // also compute avg overall
                        const avg =
                            points.reduce((sum, p) => sum + p.value, 0) /
                            (points.length || 1);
                        if (active) setAvgOverall(avg);
                    }
                }

                if (active) {
                    setData(points);
                    setLoading(false);
                }
            };
            load();
            return () => {
                active = false;
            };
        }, [mode])
    );

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator color="#00BFFF" />
            </View>
        );
    }

    // Prepare bar chart data: hide label too long?
    const chartData = data.map((pt) => ({
        label: pt.label.length > 6 ? pt.label.slice(0, 6) + '…' : pt.label,
        value: Number(pt.value.toFixed(1)),
        frontColor: '#00BFFF',
    }));

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.title}>Growth Chart</Text>
                <Picker
                    selectedValue={mode}
                    onValueChange={(v) => setMode(v as Mode)}
                    style={styles.picker}
                    dropdownIconColor="#fff"
                >
                    <Picker.Item label="Weekly" value="weekly" />
                    <Picker.Item label="Monthly" value="monthly" />
                    <Picker.Item label="Overall" value="overall" />
                </Picker>
            </View>

            <BarChart
                data={chartData}
                {...chartCommon}
            />

            {mode === 'overall' && avgOverall != null && (
                <Text style={styles.overallText}>
                    Avg since join: {avgOverall.toFixed(1)}%
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 8,
        margin: 16,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    picker: {
        color: '#fff',
        backgroundColor: '#222',
        width: 200,
        height: 36,
    },
    overallText: {
        marginTop: 12,
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default GrowthBarChart;

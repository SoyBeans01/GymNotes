// screens/Dashboard.tsx
import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { WeeklyCalendar } from './WeeklyCalendar';
import { GymStreakBar } from './GymStreakBar';
import { MusclePieChart } from './MusclePieChart';
import { WeeklySummary } from './WeeklySummary';
import { getLocalDateString } from '../utils/Date';

const STREAK_KEY = 'gymStreak';
const LAST_GYM_KEY = 'lastGymDate';
const DAYS_KEY = 'completedDays';

export default function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [lastGym, setLastGym] = useState('');
  const [completedDays, setCompletedDays] = useState<string[]>([]);

  // Week start: always Sunday, local time
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay()); // Sunday = 0
    sunday.setHours(0, 0, 0, 0); // clear time to midnight local
    return sunday;
  });

  const today = new Date(); // Date object (local)
  const todayStr = getLocalDateString(today); // local string: "YYYY-MM-DD"

  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return getLocalDateString(d);
  });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [s, l, d] = await Promise.all([
          AsyncStorage.getItem(STREAK_KEY),
          AsyncStorage.getItem(LAST_GYM_KEY),
          AsyncStorage.getItem(DAYS_KEY),
        ]);
        if (s) setStreak(parseInt(s, 10));
        if (l) setLastGym(l);
        if (d) setCompletedDays(JSON.parse(d));
      })();
    }, [])
  );

  const onPrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(weekStart.getDate() - 7);
    setWeekStart(prev);
  };

  const onNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + 7);
    setWeekStart(next);
  };

  const onStartGymDay = async () => {
    if (lastGym === todayStr) return;

    const nextStreak = streak + 1;
    const updatedDays = [...completedDays, todayStr];

    await AsyncStorage.multiSet([
      [STREAK_KEY, nextStreak.toString()],
      [LAST_GYM_KEY, todayStr],
      [DAYS_KEY, JSON.stringify(updatedDays)],
    ]);

    setStreak(nextStreak);
    setLastGym(todayStr);
    setCompletedDays(updatedDays);
  };

  // dummy data
  const pieData = [
    { label: 'Back', value: 40, color: '#00BFFF' },
    { label: 'Legs', value: 30, color: '#888' },
    { label: 'Chest', value: 30, color: '#555' },
  ];
  const favoriteExercise = 'Preacher Curls';
  const consistency = 85;
  const totalWeight = 15300;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.calendarRow}>
          <WeeklyCalendar
            weekDates={weekDates}
            completedDays={completedDays}
            today={todayStr}
            onPrevWeek={onPrevWeek}
            onNextWeek={onNextWeek}
          />
        </View>

        <GymStreakBar streak={streak} goal={5} />

        <View style={styles.row}>
          <Text style={styles.header}>Welcome back!</Text>
          <MusclePieChart data={pieData} />
        </View>

        <WeeklySummary
          favoriteExercise={favoriteExercise}
          consistency={consistency}
          totalWeight={totalWeight}
        />

        <TouchableOpacity style={styles.button} onPress={onStartGymDay}>
          <Text style={styles.buttonText}>Start Gym Day</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111',
  },
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 16,
  },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 24,
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  button: {
    backgroundColor: '#00BFFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

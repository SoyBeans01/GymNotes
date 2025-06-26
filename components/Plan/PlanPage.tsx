// components/Plan/PlanPage.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import PlanModal from './PlanModal';
import ScheduleModal from './ScheduleModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WorkoutPlan {
    isGymDay: boolean;
    workoutType: string;
    notes: string;
    exercises: { name: string; done: boolean }[];
}

const PlanPage = () => {
    const [selectedDate, setSelectedDate] = useState('');
    const [plans, setPlans] = useState<{ [date: string]: WorkoutPlan }>({});
    const [modalVisible, setModalVisible] = useState(false);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

    useEffect(() => {
        (async () => {
            const raw = await AsyncStorage.getItem('workoutPlans');
            if (raw) setPlans(JSON.parse(raw));
        })();
    }, []);

    const savePlan = async (updatedPlan: WorkoutPlan) => {
        const newPlans = { ...plans, [selectedDate]: updatedPlan };
        setPlans(newPlans);
        await AsyncStorage.setItem('workoutPlans', JSON.stringify(newPlans));
    };

    const handleDayPress = (day: DateData) => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;

        if (now - lastTap < DOUBLE_PRESS_DELAY) {
            setSelectedDate(day.dateString);
            setModalVisible(true);
        } else {
            setSelectedDate(day.dateString);
        }

        lastTap = now;
    };

    const getMarkedDates = () => {
        const marked: any = {};
        for (const date in plans) {
            if (plans[date]?.isGymDay) {
                marked[date] = {
                    marked: true,
                    dotColor: '#00BFFF',
                    selected: date === selectedDate,
                    selectedColor: '#003f5c',
                };
            }
        }
        if (selectedDate && !marked[selectedDate]) {
            marked[selectedDate] = {
                selected: true,
                selectedColor: '#333',
            };
        }
        return marked;
    };

    const selectedPlan = plans[selectedDate];

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Exercise Planner</Text>
            <Calendar
                onDayPress={handleDayPress}
                markedDates={getMarkedDates()}
                theme={{
                    calendarBackground: '#111',
                    dayTextColor: '#fff',
                    monthTextColor: '#00BFFF',
                    arrowColor: '#00BFFF',
                    todayTextColor: '#00BFFF',
                    textDisabledColor: '#444',
                }}
            />

            {selectedDate ? (
                <View style={{ marginTop: 16 }}>
                    <Text style={styles.dateInfo}>
                        {selectedPlan?.isGymDay ? '💪 Gym Day' : '🛌 Rest Day'} — {selectedDate}
                    </Text>
                    {selectedPlan?.workoutType ? (
                        <Text style={styles.dateInfo}>
                            Workout Type: {selectedPlan.workoutType}
                        </Text>
                    ) : null}
                </View>
            ) : (
                <Text style={styles.dateInfo}>Tap a date. Double-tap to plan it.</Text>
            )}

            {/* Plan Modal */}
            <PlanModal
                visible={modalVisible}
                date={selectedDate}
                plan={selectedPlan}
                onClose={() => setModalVisible(false)}
                onSave={savePlan}
            />

            {/* Schedule Modal */}
            <ScheduleModal
                visible={scheduleModalVisible}
                onClose={() => setScheduleModalVisible(false)}
            />

            <TouchableOpacity style={styles.scheduleBtn} onPress={() => setScheduleModalVisible(true)}>
                <Text style={styles.scheduleText}>Plan Schedule</Text>
            </TouchableOpacity>
        </View>
    );
};

let lastTap = 0;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        padding: 16,
    },
    title: {
        fontSize: 24,
        color: '#00BFFF',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    dateInfo: {
        color: '#ccc',
        textAlign: 'center',
        fontSize: 16,
    },
    scheduleBtn: {
        backgroundColor: '#00BFFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    scheduleText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default PlanPage;

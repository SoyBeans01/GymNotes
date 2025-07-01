// components/dashboard/GymStreakBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  streak: number;
  goal: number;
};

export const GymStreakBar: React.FC<Props> = ({ streak, goal }) => {
  const percentage = Math.min((streak / goal) * 100, 100);

  return (
    <View style={styles.container}>


      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>



      {/* 🔥 Streak underneath */}
      <View style={styles.streakBox}>
        <View style={styles.streakLeft}> 
        <Text style={styles.streakIcon}>🔥</Text>
        <Text style={styles.streakText}>{streak}-day streak!</Text>
        </View>
        <Text style={styles.label}>
          {streak} / {goal} days
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    color: '#ccc',
    marginBottom: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: 10,
    backgroundColor: '#00BFFF',
    borderRadius: 5,
  },
  streakBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  streakIcon: {
    fontSize: 16,
    marginRight: 4,
    color: '#FFD700',
  },
  streakText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  streakLeft: {
  flexDirection: 'row',
  alignItems: 'center',
},
});

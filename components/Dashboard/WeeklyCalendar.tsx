import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
  weekDates: string[];
  completedDays: string[];
  today: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
};

export const WeeklyCalendar: React.FC<Props> = ({
  weekDates,
  completedDays,
  today,
  onPrevWeek,
  onNextWeek,
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Left Arrow */}
      <Pressable onPress={onPrevWeek} style={styles.arrowContainer}>
        <Text style={styles.arrow}>‹</Text>
      </Pressable>

      {/* Calendar days */}
      <View style={styles.daysContainer}>
        {weekDates.map((date) => {
          const dateObj = new Date(date);
          const isToday = date === today;
          const isDone = completedDays.includes(date);
          const dayNum = dateObj.getDate(); // 1–31
          const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'short' }); // Sun, Mon...

          return (
            <View key={date} style={styles.day}>
              <Text style={[styles.dayNumber, isToday && styles.todayLabel]}>
                {dayNum}
              </Text>
              <View
                style={[
                  styles.dot,
                  isDone && styles.doneDot,
                  isToday && styles.todayDotBorder,
                ]}
              />
              <Text style={[styles.weekdayLabel, isToday && styles.todayLabel]}>
                {weekday}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Right Arrow */}
      <Pressable onPress={onNextWeek} style={styles.arrowContainer}>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  arrowContainer: {
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  arrow: {
    fontSize: 28,
    color: '#00BFFF',
  },
  daysContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },

  dayNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  weekdayLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  dayLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  todayLabel: {
    color: '#00BFFF',
    fontWeight: 'bold',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
  },
  doneDot: {
    backgroundColor: '#00BFFF',
  },
  todayDotBorder: {
    borderWidth: 1,
    borderColor: '#00BFFF',
  },
});

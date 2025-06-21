import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [unit, setUnit] = useState<'lbs' | 'kg'>('lbs');

  useEffect(() => {
    const loadUnit = async () => {
      const storedUnit = await AsyncStorage.getItem('unit');
      if (storedUnit === 'kg' || storedUnit === 'lbs') {
        setUnit(storedUnit);
      }
    };
    loadUnit();
  }, []);

  const toggleUnit = async () => {
    const newUnit = unit === 'lbs' ? 'kg' : 'lbs';
    setUnit(newUnit);
    try {
      await AsyncStorage.setItem('unit', newUnit);
    } catch (e) {
      console.error('Failed to save unit', e);
    }
  };

  const clearAsyncData = async () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete all data? This will reset all weight and diet logs to 0.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK', onPress: async () => {
            try {
              await AsyncStorage.clear();

              Alert.alert('Success', 'All data cleared and weight logs reset. May need to restart app to see effects.');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          }
        }
      ]
    );
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity style={styles.unitToggle} onPress={toggleUnit}>
        <Text style={styles.unitToggleText}>
          Toggle Unit: {unit.toUpperCase()}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.unitToggle, { marginTop: 20, backgroundColor: '#FF4444' }]}
        onPress={clearAsyncData}
      >
        <Text style={[styles.unitToggleText, { color: 'white' }]}>Delete All Data</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 28,
    marginBottom: 40,
  },
  unitToggle: {
    backgroundColor: '#00BFFF',
    padding: 15,
    borderRadius: 10,
  },
  unitToggleText: {
    color: '#111',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

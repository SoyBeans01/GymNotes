import { View, Text, FlatList, StyleSheet, ScrollView } from 'react-native'
import React from 'react'

type Exercise = {
    category: string,
    exerciseName: string, 
    measurement: number, 
    unitType: string,
}

const exercisesData:Exercise[] = [
    {category: 'arms', exerciseName: 'bicep curls', measurement: 20, unitType: 'LBS'},
    {category: 'arms', exerciseName: 'skull crushers', measurement: 30, unitType: 'LBS'},
]

const ExerciseList = () => {
  return (
    <View style={styles.container}>
      <Text>ExerciseList</Text>
    <FlatList
    
        data={exercisesData}
        keyExtractor={(item) => item.exerciseName}
        renderItem={ ({item}) => 
        <View style={styles.container}>
            <Text style={styles.text}>{item.category} {item.exerciseName} {item.measurement} {item.unitType}</Text>
        </View>
            
        }
    />
    </View>
  )
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: 'red',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: 'blue',
  },
  text: {
    flex: 1,
    backgroundColor: 'green',
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    marginHorizontal: 20,
    marginVertical: 5,
    paddingVertical: 20,
  }
});

export default ExerciseList
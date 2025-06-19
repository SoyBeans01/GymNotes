import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Exercise = {
    id: string;
    name: string;
};

type WeightsMap = {
    [key: string]: number;
};

const EXERCISES: Exercise[] = [
    { id: '1', name: 'Bench Press' },
    { id: '2', name: 'Squat' },
    { id: '3', name: 'Deadlift' },
    { id: '4', name: 'Shoulder Press' },
    { id: '5', name: 'Barbell Row' },
];

const STEP_VALUES = Array.from({ length: 81 }, (_, i) => i * 2.5); // 0 to 200

const ExerciseList: React.FC = () => {
    const [weights, setWeights] = useState<WeightsMap>({});

    useEffect(() => {
        const loadWeights = async () => {
            const stored = await AsyncStorage.getItem('exerciseWeights');
            if (stored) setWeights(JSON.parse(stored));
        };
        loadWeights();
    }, []);

    const handleSelect = async (id: string, value: number) => {
        const updated = { ...weights, [id]: value };
        setWeights(updated);
        await AsyncStorage.setItem('exerciseWeights', JSON.stringify(updated));
    };

    const renderStep = (exerciseId: string, value: number) => {
        const isSelected = weights[exerciseId] === value;
        return (
            <TouchableOpacity key={value} onPress={() => handleSelect(exerciseId, value)}>
                <View style={styles.wrapper}>
                    <Text style={[styles.stepText, isSelected && styles.selectedStep]}>
                        {isSelected ? `*${value}*` : value}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderExercise = ({ item }: { item: Exercise }) => (
        <View style={styles.exerciseContainer}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <FlatList
                data={STEP_VALUES}
                keyExtractor={(val) => val.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item: val }) => renderStep(item.id, val)}
                contentContainerStyle={styles.stepList}
            />
            <Text style={styles.weightDisplay}>{weights[item.id] ?? 0} LBS</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Gym Exercises</Text>
            <FlatList
                data={EXERCISES}
                renderItem={renderExercise}
                keyExtractor={(item) => item.id}
            />
        </View>
    );
};

export default ExerciseList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 10,
    },
    stepWrapper: {
        justifyContent: 'flex-end', // or 'center' if you prefer
        alignItems: 'center',
        height: 40, // same height for all steps to align vertically
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    exerciseContainer: {
        marginBottom: 30,
    },
    exerciseName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    stepList: {
        paddingHorizontal: 10,
    },
    stepText: {
        marginHorizontal: 6,
        fontSize: 24,
        color: '#444',
        lineHeight: 32,
    },
    selectedStep: {
        fontSize: 32,
        color: '#007bff',
        fontWeight: 'bold',
        lineHeight: 32,
    },
    weightDisplay: {
        alignSelf: 'flex-end',
        marginTop: 5,
        fontSize: 32,
        color: '#007bff',
        fontWeight: 'bold',
    },
});
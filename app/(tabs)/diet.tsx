import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

interface FoodEntry {
    id: string;
    name: string;
    amount: string;
    unit: string;
    calories: number;
    protein?: number;
    fat?: number;
    carbs?: number;
}

interface WeightEntry {
    date: string;
    weight: number;
}

const STORAGE_KEYS = {
    foodLog: 'diet_food_log',
    weightLog: 'diet_weight_log',
};

const DietPage = () => {
    // All your state hooks here...

    const [foodName, setFoodName] = useState('');
    const [amount, setAmount] = useState('');
    const [unit, setUnit] = useState('g');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [fat, setFat] = useState('');
    const [carbs, setCarbs] = useState('');
    const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
    const [bodyWeight, setBodyWeight] = useState('');
    const [weightLog, setWeightLog] = useState<WeightEntry[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const foodData = await AsyncStorage.getItem(STORAGE_KEYS.foodLog);
                const weightData = await AsyncStorage.getItem(STORAGE_KEYS.weightLog);
                if (foodData) setFoodLog(JSON.parse(foodData));
                if (weightData) setWeightLog(JSON.parse(weightData));
            } catch (e) {
                console.error('Failed to load data', e);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEYS.foodLog, JSON.stringify(foodLog));
    }, [foodLog]);

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEYS.weightLog, JSON.stringify(weightLog));
    }, [weightLog]);

    const safeParse = (value: string) => {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    };

    const handleAddOrUpdateFood = () => {
        const name = foodName.trim();
        const amt = amount.trim();
        const cal = safeParse(calories);
        if (!name || !amt || cal === undefined) return;

        const food: FoodEntry = {
            id: editingId || Date.now().toString(),
            name,
            amount: amt,
            unit: unit || 'g',
            calories: cal,
            protein: safeParse(protein),
            fat: safeParse(fat),
            carbs: safeParse(carbs),
        };

        if (editingId) {
            setFoodLog((prev) => prev.map((f) => (f.id === editingId ? food : f)));
            setEditingId(null);
        } else {
            setFoodLog([...foodLog, food]);
        }

        setFoodName('');
        setAmount('');
        setUnit('g');
        setCalories('');
        setProtein('');
        setFat('');
        setCarbs('');
    };

    const handleEditFood = (item: FoodEntry) => {
        setEditingId(item.id);
        setFoodName(item.name);
        setAmount(item.amount);
        setUnit(item.unit);
        setCalories(item.calories.toString());
        setProtein(item.protein?.toString() || '');
        setFat(item.fat?.toString() || '');
        setCarbs(item.carbs?.toString() || '');
    };

    const handleDeleteFood = (id: string) => {
        setFoodLog((prev) => prev.filter((item) => item.id !== id));
    };

    const handleAddWeight = () => {
        const w = parseFloat(bodyWeight.trim());
        if (!Number.isFinite(w)) return;

        const today = new Date().toISOString().split('T')[0];
        const existingIndex = weightLog.findIndex((entry) => entry.date === today);
        const newEntry: WeightEntry = { date: today, weight: w };

        if (existingIndex >= 0) {
            const updated = [...weightLog];
            updated[existingIndex] = newEntry;
            setWeightLog(updated);
        } else {
            setWeightLog([...weightLog, newEntry]);
        }

        setBodyWeight('');
    };

    const totalCalories = foodLog.reduce((acc, item) => acc + item.calories, 0);
    const totalProtein = foodLog.reduce((acc, item) => acc + (item.protein ?? 0), 0);
    const totalFat = foodLog.reduce((acc, item) => acc + (item.fat ?? 0), 0);
    const totalCarbs = foodLog.reduce((acc, item) => acc + (item.carbs ?? 0), 0);

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.container}>
                {/* Inputs */}
                <Text style={styles.header}>Diet Tracker</Text>

                <View style={styles.inputRow}>
                    <View style={styles.columnFlex2}>
                        <Text style={styles.label}>Food Name</Text>
                        <TextInput style={styles.input} value={foodName} onChangeText={setFoodName} />
                    </View>
                    <View style={styles.columnFlex1}>
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="default"
                        />
                    </View>
                    <View style={styles.columnFlex1}>
                        <Text style={styles.label}>Unit</Text>
                        <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholderTextColor={'#555'} placeholder="oz, cup, ..." />
                    </View>
                </View>

                <View style={styles.inputRow}>
                    <View style={styles.columnFlex1}>
                        <Text style={styles.label}>Calories</Text>
                        <TextInput style={styles.input} value={calories} onChangeText={setCalories} keyboardType="numeric" />
                    </View>
                    <View style={styles.columnFlex1}>
                        <Text style={styles.label}>Protein (g)</Text>
                        <TextInput style={styles.input} value={protein} onChangeText={setProtein} keyboardType="numeric" />
                    </View>
                    <View style={styles.columnFlex1}>
                        <Text style={styles.label}>Fat (g)</Text>
                        <TextInput style={styles.input} value={fat} onChangeText={setFat} keyboardType="numeric" />
                    </View>
                    <View style={styles.columnFlex1}>
                        <Text style={styles.label}>Carbs (g)</Text>
                        <TextInput style={styles.input} value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.button, { flex: 2 }]} onPress={handleAddOrUpdateFood}>
                        <Text style={styles.buttonText}>{editingId ? 'Update Food' : 'Add Food'}</Text>
                    </TouchableOpacity>
                    {editingId && (
                        <TouchableOpacity style={[styles.cancelButton, { flex: 1 }]} onPress={() => {
                            setEditingId(null);
                            setFoodName('');
                            setAmount('');
                            setUnit('g');
                            setCalories('');
                            setProtein('');
                            setFat('');
                            setCarbs('');
                        }}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {/* Food Log List */}
                <View style={[styles.foodLogContainer, { minHeight: foodLog.length * 40 + 70 }]}>
                    <FlatList
                        data={foodLog}
                        keyExtractor={(item) => item.id}
                        nestedScrollEnabled
                        renderItem={({ item }) => (
                            <View style={styles.foodLogItemRow}>
                                <TouchableOpacity onPress={() => handleEditFood(item)} style={{ flex: 1 }}>
                                    <Text style={styles.foodLogItem}>
                                        {item.name} - {item.amount}{item.unit} {'\n'}
                                        {item.calories} kcal | Protein: {item.protein ?? 0}g | Fat:{' '}
                                        {item.fat ?? 0}g | Carbs: {item.carbs ?? 0}g
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteFood(item.id)}>
                                    <Text style={styles.deleteButton}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    <View style={styles.totalTextContainer}>
                        <Text style={styles.totalText}>
                            Total {'\n'}{totalCalories} kcal | Protein: {totalProtein}g | Fat: {totalFat}g | Carbs: {totalCarbs}g
                        </Text>
                    </View>
                </View>

                {/* Weight Input */}
                <Text style={styles.label}>Body Weight (lbs)</Text>
                <TextInput style={styles.input} value={bodyWeight} onChangeText={setBodyWeight} keyboardType="numeric" />
                <TouchableOpacity style={styles.button} onPress={handleAddWeight}>
                    <Text style={styles.buttonText}>Add Weight</Text>
                </TouchableOpacity>

                {/* Weight Chart */}
                {weightLog.length > 0 && (
                    <LineChart
                        data={{
                            labels: weightLog.filter((w) => typeof w.date === 'string' && !!w.date).map((w) => w.date),
                            datasets: [{ data: weightLog.map((w) => Number(w.weight)).filter((w) => Number.isFinite(w)) }],
                        }}
                        width={Dimensions.get('window').width - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: '#000',
                            backgroundGradientFrom: '#1e1e1e',
                            backgroundGradientTo: '#3e3e3e',
                            color: () => `#00BFFF`,
                        }}
                        bezier
                        style={{ marginTop: 20, borderRadius: 10 }}
                    />
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scroll: {
        backgroundColor: '#111',
    },
    container: {
        padding: 20,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        color: '#ccc',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#333',
        padding: 8,
        borderRadius: 6,
        color: 'white',
        marginBottom: 10,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    columnFlex1: {
        flex: 1,
    },
    columnFlex2: {
        flex: 2,
    },
    button: {
        backgroundColor: '#00BFFF',
        padding: 12,
        borderRadius: 6,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: '#111',
        fontWeight: 'bold',
        fontSize: 16,
    },
    foodLogContainer: {
        backgroundColor: '#222',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        justifyContent: 'space-between',
    },
    foodLogItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    foodLogItem: {
        color: 'white',
        fontSize: 16,
    },
    deleteButton: {
        color: '#FF4444',
        fontSize: 18,
        paddingHorizontal: 10,
    },
    totalTextContainer: {
        marginTop: 'auto',
    },
    totalText: {
        color: '#00BFFF',
        fontWeight: 'bold',
        marginTop: 10,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
        gap: 10,
    },
    cancelButton: {
        backgroundColor: '#FF4444',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default DietPage;

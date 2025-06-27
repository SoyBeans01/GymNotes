// components/Plan/ScheduleModal.tsx
import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';


interface Props {
    visible: boolean;
    onClose: () => void;
}

const ScheduleModal = ({ visible, onClose }: Props) => {
    const [workoutsPerWeek, setWorkoutsPerWeek] = useState('5');
    const [split, setSplit] = useState('Push/Pull');

    const splitOptions = ['Push/Pull', 'Arnold Split', 'Full Body', 'Upper/Lower', 'Bro Split'];

    const handleSave = () => {
        console.log(`Scheduled: ${workoutsPerWeek}x/week, Split: ${split}`);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>Plan Your Schedule</Text>

                    <Text style={styles.label}>Workouts per Week (Recommended: 4-5)</Text>
                    <TextInput
                        style={styles.input}
                        value={workoutsPerWeek}
                        onChangeText={setWorkoutsPerWeek}
                        keyboardType="number-pad"
                        placeholder="e.g. 5"
                        placeholderTextColor="#888"
                    />

                    <Text style={styles.label}>Workout Split</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={split}
                            onValueChange={(itemValue: string) => setSplit(itemValue)}
                            style={styles.picker}
                        >
                            {splitOptions.map((opt) => (
                                <Picker.Item label={opt} value={opt} key={opt} />
                            ))}
                        </Picker>
                    </View>

                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Text style={styles.saveText}>Save Schedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <Text style={styles.closeText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 16,
    },
    modal: {
        backgroundColor: '#222',
        borderRadius: 10,
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00BFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    label: {
        color: '#ccc',
        marginBottom: 4,
    },
    input: {
        backgroundColor: '#333',
        color: '#fff',
        borderRadius: 6,
        padding: 8,
        marginBottom: 12,
    },
    pickerWrapper: {
        backgroundColor: '#333',
        borderRadius: 6,
        marginBottom: 16,
    },
    picker: {
        color: '#fff',
    },
    saveBtn: {
        backgroundColor: '#00BFFF',
        padding: 10,
        borderRadius: 6,
        marginBottom: 8,
    },
    saveText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    closeBtn: {
        padding: 10,
    },
    closeText: {
        color: '#ccc',
        textAlign: 'center',
    },
});

export default ScheduleModal;
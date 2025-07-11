import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { createAutoReorder } from '../services/autoReorderService';

const frequencies = [
  { label: 'Every 12 Hours', value: '12h' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Custom (days)', value: 'custom' },
];

interface AutoReorderModalProps {
  visible: boolean;
  onClose: () => void;
  orderTemplate: any; // Replace with your specific type if you have one!
}

const AutoReorderModal: React.FC<AutoReorderModalProps> = ({
  visible,
  onClose,
  orderTemplate,
}) => {
  const [frequency, setFrequency] = useState<string>('weekly');
  const [customInterval, setCustomInterval] = useState<string>('7');
  const [time, setTime] = useState<string>('08:00');

  const handleSubmit = async () => {
    try {
      await createAutoReorder({
        orderTemplate,
        frequency,
        customInterval:
          frequency === 'custom' ? Number(customInterval) : undefined,
        intervalHours: frequency === '12h' ? 12 : undefined, // <--- add this
        time,
      });
      Alert.alert('Success', 'Auto reorder scheduled!');
      onClose();
    } catch (err) {
      Alert.alert('Error', 'Could not schedule auto reorder.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Set up Auto Reorder</Text>

          {/* Frequency Picker */}
          <Text style={styles.label}>Frequency:</Text>
          <View style={styles.row}>
            {frequencies.map((f) => (
              <TouchableOpacity
                key={f.value}
                style={[
                  styles.freqBtn,
                  frequency === f.value && styles.freqBtnActive,
                ]}
                onPress={() => setFrequency(f.value)}
              >
                <Text
                  style={[
                    styles.freqBtnText,
                    frequency === f.value && styles.freqBtnTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom interval */}
          {frequency === 'custom' && (
            <View style={styles.inputRow}>
              <Text style={styles.label}>Interval (days):</Text>
              <TextInput
                style={styles.input}
                value={customInterval}
                onChangeText={setCustomInterval}
                keyboardType="numeric"
                placeholder="e.g. 5"
              />
            </View>
          )}

          {/* Time picker */}
          <View style={styles.inputRow}>
            <Text style={styles.label}>Time (24h):</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={setTime}
              placeholder="08:00"
              keyboardType={
                Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'
              }
            />
          </View>

          {/* Actions */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.saveBtn]}
              onPress={handleSubmit}
            >
              <Text style={[styles.btnText, { color: 'white' }]}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AutoReorderModal;

// ------- STYLES -------
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#0007',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 20,
    width: '90%',
    elevation: 6,
    shadowColor: '#222',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 7,
    padding: 8,
    minWidth: 70,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  inputRow: {
    marginVertical: 6,
  },
  freqBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 4,
  },
  freqBtnActive: {
    backgroundColor: '#27ae60',
    borderColor: '#27ae60',
  },
  freqBtnText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 15,
  },
  freqBtnTextActive: {
    color: '#FFF',
  },
  btn: {
    flex: 1,
    marginTop: 16,
    marginHorizontal: 5,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F1F1',
  },
  saveBtn: {
    backgroundColor: '#27ae60',
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
});

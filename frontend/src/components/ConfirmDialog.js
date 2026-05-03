import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

const ConfirmDialog = ({ visible, title, message, onConfirm, onCancel }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, styles.cancel]} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.confirm]} onPress={onConfirm}>
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  container: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a'
  },
  message: {
    marginTop: 12,
    fontSize: 15,
    color: '#475569'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginLeft: 12
  },
  cancel: {
    backgroundColor: '#e2e8f0'
  },
  confirm: {
    backgroundColor: '#2563eb'
  },
  cancelText: {
    color: '#0f172a',
    fontWeight: '600'
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default ConfirmDialog;

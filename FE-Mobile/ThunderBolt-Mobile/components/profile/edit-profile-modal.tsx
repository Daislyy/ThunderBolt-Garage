import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../../constants/colors';

interface EditProfileModalProps {
  visible: boolean;
  editName: string;
  editEmail: string;
  isSaving: boolean;
  onChangeName: (text: string) => void;
  onChangeEmail: (text: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function EditProfileModal({
  visible,
  editName,
  editEmail,
  isSaving,
  onChangeName,
  onChangeEmail,
  onClose,
  onSave,
}: EditProfileModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeModalBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Nama Lengkap</Text>
          <TextInput
            style={styles.textInput}
            value={editName}
            onChangeText={onChangeName}
            placeholder="Masukkan nama lengkap"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={[styles.textInput, styles.textInputDisabled]}
            value={editEmail}
            onChangeText={onChangeEmail}
            placeholder="Masukkan email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            editable={false}
          />

          <TouchableOpacity
            style={styles.saveBtn}
            activeOpacity={0.88}
            onPress={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  editModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.headingDark,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.headingDark,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.headingDark,
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  textInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  saveBtn: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});

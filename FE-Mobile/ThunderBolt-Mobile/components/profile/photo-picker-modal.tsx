import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Camera, Image as ImageIcon, X } from 'lucide-react-native';
import { colors } from '../../constants/colors';

interface PhotoPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

export function PhotoPickerModal({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}: PhotoPickerModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity style={styles.pickerSheet} activeOpacity={1}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Ubah Foto Profil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closePickerBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerOptionsRow}>
            <TouchableOpacity
              style={styles.pickerOptionCard}
              activeOpacity={0.8}
              onPress={onSelectCamera}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#FFF5F2' }]}>
                <Camera size={26} color={colors.primary} />
              </View>
              <Text style={styles.pickerOptionLabel}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerOptionCard}
              activeOpacity={0.8}
              onPress={onSelectGallery}
            >
              <View style={[styles.pickerIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <ImageIcon size={26} color="#3B82F6" />
              </View>
              <Text style={styles.pickerOptionLabel}>Galeri Foto</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.headingDark,
  },
  closePickerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerOptionCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pickerOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.headingDark,
  },
});

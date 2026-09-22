import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../hooks/useAppTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../constants/theme';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  icon?: string;
  iconColor?: string;
  type?: 'destructive' | 'primary' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  icon,
  iconColor,
  type = 'primary',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const theme = useAppTheme();

  if (!visible) return null;

  // Determine colors based on type
  const isDestructive = type === 'destructive';
  const isWarning = type === 'warning';
  const defaultIcon = isDestructive
    ? 'trash-can-outline'
    : isWarning
    ? 'alert-outline'
    : 'information-outline';
  const finalIcon = icon || defaultIcon;

  const defaultColor = isDestructive
    ? '#F43F5E'
    : isWarning
    ? '#F59E0B'
    : theme.primary;
  const finalColor = iconColor || defaultColor;

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else {
      onConfirm();
    }
  };

  const isSingleButton = !cancelText;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Icon badge */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: finalColor + '18' },
                ]}
              >
                <MaterialCommunityIcons
                  name={finalIcon as any}
                  size={32}
                  color={finalColor}
                />
              </View>

              {/* Title & Message */}
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {title}
              </Text>
              <Text style={[styles.message, { color: theme.textSecondary }]}>
                {message}
              </Text>

              {/* Action Buttons */}
              <View style={[styles.buttonRow, isSingleButton && { justifyContent: 'center' }]}>
                {!isSingleButton && onCancel && (
                  <TouchableOpacity
                    style={[
                      styles.btn,
                      styles.cancelBtn,
                      {
                        backgroundColor: theme.surfaceVariant,
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={onCancel}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.cancelBtnText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.btn,
                    styles.confirmBtn,
                    {
                      backgroundColor: finalColor,
                      flex: isSingleButton ? 0 : 1,
                      minWidth: isSingleButton ? 140 : undefined,
                    },
                  ]}
                  onPress={onConfirm}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    ...TYPOGRAPHY.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
  },
  btn: {
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

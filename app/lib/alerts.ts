import { Alert, Platform } from 'react-native';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

function isWeb(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined';
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (isWeb()) {
    if (!buttons || buttons.length === 0) {
      window.alert(`${title}${message ? `\n\n${message}` : ''}`);
      return;
    }
    const primary = buttons[buttons.length - 1];
    if (buttons.length === 1) {
      window.alert(`${title}${message ? `\n\n${message}` : ''}`);
      primary.onPress?.();
      return;
    }
    const confirmed = window.confirm(`${title}${message ? `\n\n${message}` : ''}`);
    if (confirmed) {
      primary.onPress?.();
    } else {
      const cancelBtn = buttons.find((b) => b.style === 'cancel') || buttons[0];
      cancelBtn.onPress?.();
    }
    return;
  }
  Alert.alert(title, message, buttons as any);
}

export function confirmAsync(
  title: string,
  message?: string,
  options?: { confirmText?: string; cancelText?: string; destructive?: boolean }
): Promise<boolean> {
  const confirmText = options?.confirmText ?? 'Yes';
  const cancelText = options?.cancelText ?? 'Cancel';

  if (isWeb()) {
    const confirmed = window.confirm(`${title}${message ? `\n\n${message}` : ''}`);
    return Promise.resolve(confirmed);
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmText,
          style: options?.destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}

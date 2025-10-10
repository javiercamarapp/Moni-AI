import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

// Interfaces tipadas para evitar errores de importación
interface CheckBiometryResult {
  isAvailable: boolean;
  biometryType: number;
}

interface AuthenticateOptions {
  reason: string;
  cancelTitle?: string;
  allowDeviceCredential?: boolean;
  iosFallbackTitle?: string;
  androidTitle?: string;
  androidSubtitle?: string;
  androidConfirmationRequired?: boolean;
}

// Importación dinámica de BiometricAuth solo en plataformas nativas
let BiometricAuth: any = null;

if (Capacitor.isNativePlatform()) {
  import('@aparajita/capacitor-biometric-auth').then((module) => {
    BiometricAuth = module.BiometricAuth;
  }).catch(() => {
    console.log('BiometricAuth no disponible');
  });
}

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('');
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    // Solo funciona en dispositivos nativos (iOS/Android)
    if (!Capacitor.isNativePlatform()) {
      setIsNative(false);
      return;
    }

    setIsNative(true);

    try {
      if (!BiometricAuth) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (!BiometricAuth) {
        setIsAvailable(false);
        return;
      }

      const result: CheckBiometryResult = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      
      // Determinar el tipo de biometría
      if (result.biometryType === 1) {
        setBiometryType('Touch ID');
      } else if (result.biometryType === 2) {
        setBiometryType('Face ID');
      } else if (result.biometryType === 3) {
        setBiometryType('Biometría');
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const authenticate = async (reason: string = 'Autenticarse'): Promise<boolean> => {
    if (!isAvailable || !isNative || !BiometricAuth) {
      return false;
    }

    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Usar contraseña',
        androidTitle: 'Autenticación biométrica',
        androidSubtitle: 'Verifica tu identidad',
        androidConfirmationRequired: false,
      });
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  };

  return {
    isAvailable,
    biometryType,
    isNative,
    authenticate,
  };
};

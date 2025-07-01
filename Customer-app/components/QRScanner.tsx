import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { X, Flashlight, FlashlightOff, RotateCcw } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  interpolate,
  Easing
} from 'react-native-reanimated';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export const QRScanner = ({ onScan, onClose, isVisible }: QRScannerProps) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashlight, setFlashlight] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Animation values
  const scanLinePosition = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      overlayOpacity.value = withTiming(1, { duration: 300 });
      // Start scan line animation
      scanLinePosition.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.linear }),
        -1,
        true
      );
    } else {
      overlayOpacity.value = withTiming(0, { duration: 300 });
      scanLinePosition.value = 0;
    }
  }, [isVisible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(scanLinePosition.value, [0, 1], [0, 200])
      }
    ],
  }));

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      onScan(data);
      
      // Haptic feedback for mobile
      if (Platform.OS !== 'web') {
        // Would use Haptics.impactAsync() here on mobile
      }
      
      // Reset scanned state after a delay
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const toggleFlashlight = () => {
    setFlashlight(!flashlight);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.container, overlayStyle]}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scanning Area */}
        <View style={styles.scanningArea}>
          <View style={styles.scanFrame}>
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Animated scan line */}
            <Animated.View style={[styles.scanLine, scanLineStyle]} />
          </View>
          
          <Text style={styles.instructionText}>
            Position the QR code within the frame
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlashlight}>
            {flashlight ? (
              <FlashlightOff size={24} color="#ffffff" />
            ) : (
              <Flashlight size={24} color="#ffffff" />
            )}
            <Text style={styles.controlText}>Flash</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <RotateCcw size={24} color="#ffffff" />
            <Text style={styles.controlText}>Flip</Text>
          </TouchableOpacity>
        </View>

        {/* Scanned indicator */}
        {scanned && (
          <View style={styles.scannedIndicator}>
            <Text style={styles.scannedText}>✓ QR Code Scanned!</Text>
          </View>
        )}
      </CameraView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  permissionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  permissionButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scanningArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    marginBottom: 40,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#16A34A',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
    paddingBottom: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlButton: {
    alignItems: 'center',
    padding: 16,
  },
  controlText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  scannedIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannedText: {
    color: '#16A34A',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
});
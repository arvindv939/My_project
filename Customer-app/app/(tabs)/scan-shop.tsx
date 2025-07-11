import { useState } from 'react';
import { View, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { QRScanner } from '@/components/QRScanner';

export default function ScanShop() {
  const [isScanning, setIsScanning] = useState(false);
  const router = useRouter();

  const handleScan = (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'shop' && parsed.shopId) {
        setIsScanning(false);
        router.push(`/shop/${parsed.shopId}`);
      } else if (parsed.type === 'product' && parsed.productId) {
        setIsScanning(false);
        router.push(`/product/${parsed.productId}`);
      } else {
        alert(
          'Invalid QR Code\nThis QR code is not recognised as a shop or product code.'
        );
      }
    } catch (e) {
      alert(
        'Invalid QR Code\nThis QR code is not recognised as a shop or product code.'
      );
    }
  };

  return (
    <View>
      <Button title="Scan QR" onPress={() => setIsScanning(true)} />
      <QRScanner
        isVisible={isScanning}
        onScan={handleScan}
        onClose={() => setIsScanning(false)}
      />
    </View>
  );
}

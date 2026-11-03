import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string | number;
  image_url: string | null;
  seller_name: string;
}

export default function ProductDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);

  useEffect(() => {
    apiRequest<{ product: Product }>(`/market/${id}`)
      .then((response) => setProduct(response.product))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load product'));
  }, [id]);

  async function order() {
    if (!product) return;
    setWorking(true);
    setMessage('');
    try {
      await apiRequest(`/market/${product.id}/orders`, { method: 'POST', body: JSON.stringify({ quantity: 1 }) });
      setMessage('Order request placed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to place order');
    } finally {
      setWorking(false);
    }
  }

  return (
    <AppScreen title={product?.name ?? 'Product'} subtitle={product?.category}>
      {product ? (
        <View style={styles.content}>
          {product.image_url ? <Image source={{ uri: product.image_url }} contentFit="cover" style={styles.image} /> : null}
          <ThemedText type="subtitle" style={styles.price}>${Number(product.price).toFixed(2)}</ThemedText>
          <ThemedText>{product.description || 'No description provided.'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Listed by {product.seller_name}</ThemedText>
          <PrimaryButton onPress={order} disabled={working}>{working ? 'Placing order…' : 'Request product'}</PrimaryButton>
        </View>
      ) : <ThemedText themeColor="textSecondary">Loading product…</ThemedText>}
      {message ? <ThemedText style={{ color: theme.primary }}>{message}</ThemedText> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three },
  image: { width: '100%', aspectRatio: 1.5, borderRadius: 18 },
  price: { fontSize: 28, lineHeight: 34 },
});

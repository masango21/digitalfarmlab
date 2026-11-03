import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
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

export default function MarketScreen() {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/market')
      .then((response) => setProducts(response.products))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Unable to load marketplace'));
  }, []);

  const categories = useMemo(() => ['All', ...new Set(products.map((product) => product.category))], [products]);
  const filteredProducts = category === 'All' ? products : products.filter((product) => product.category === category);

  return (
    <AppScreen title="Marketplace" subtitle="Find useful supplies from the community.">
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      <View style={styles.categories}>
        {categories.map((item) => (
          <Pressable
            key={item}
            onPress={() => setCategory(item)}
            style={[styles.category, { backgroundColor: category === item ? theme.primary : theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={category === item ? styles.selectedLabel : undefined}>{item}</ThemedText>
          </Pressable>
        ))}
      </View>
      {!products.length && !error ? <ThemedText themeColor="textSecondary">No products available yet.</ThemedText> : null}
      <View style={styles.grid}>
        {filteredProducts.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => router.push({ pathname: '/(app)/market/[id]', params: { id: product.id } })}
            style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {product.image_url ? (
              <Image source={{ uri: product.image_url }} contentFit="cover" style={styles.image} />
            ) : (
              <View style={[styles.placeholder, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={styles.productMark}>✦</ThemedText>
              </View>
            )}
            <View style={styles.cardCopy}>
              <ThemedText type="smallBold" numberOfLines={1}>{product.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">{product.category}</ThemedText>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>${Number(product.price).toFixed(2)}</ThemedText>
            </View>
          </Pressable>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  category: { borderWidth: 1, borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  selectedLabel: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: { width: '48%', borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1.3 },
  placeholder: { width: '100%', aspectRatio: 1.3, alignItems: 'center', justifyContent: 'center' },
  productMark: { fontSize: 36 },
  cardCopy: { padding: Spacing.two, gap: Spacing.one },
  error: { color: '#B3261E' },
});

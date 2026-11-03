import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  farms: { ios: 'leaf.fill', android: 'eco', web: 'eco' },
  simulate: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  market: { ios: 'basket.fill', android: 'storefront', web: 'storefront' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
} as const;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.backgroundElement, borderTopColor: colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <SymbolView name={icons.home} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen
        name="farm/index"
        options={{ title: 'Farms', tabBarIcon: ({ color }) => <SymbolView name={icons.farms} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen
        name="simulate/index"
        options={{ title: 'Simulate', tabBarIcon: ({ color }) => <SymbolView name={icons.simulate} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen
        name="market/index"
        options={{ title: 'Market', tabBarIcon: ({ color }) => <SymbolView name={icons.market} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <SymbolView name={icons.profile} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen name="farm/[id]" options={{ href: null }} />
      <Tabs.Screen name="farm/create" options={{ href: null }} />
      <Tabs.Screen name="field/[id]/crops" options={{ href: null }} />
      <Tabs.Screen name="field/[id]/soil" options={{ href: null }} />
      <Tabs.Screen name="field/[id]/inspections" options={{ href: null }} />
      <Tabs.Screen name="simulate/results" options={{ href: null }} />
      <Tabs.Screen name="simulate/runs" options={{ href: null }} />
      <Tabs.Screen name="market/[id]" options={{ href: null }} />
      <Tabs.Screen name="community/index" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="cohorts" options={{ href: null }} />
    </Tabs>
  );
}

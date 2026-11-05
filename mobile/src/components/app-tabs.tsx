import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  scenarios: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  farm: { ios: 'leaf.fill', android: 'eco', web: 'eco' },
  results: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
} as const;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: scheme === 'dark' ? colors.accent : colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: { backgroundColor: colors.backgroundSecondary, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <SymbolView name={icons.home} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen
        name="simulate/index"
        options={{ title: 'Scenarios', tabBarIcon: ({ color }) => <SymbolView name={icons.scenarios} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen
        name="farm/index"
        options={{ title: 'Farm', tabBarIcon: ({ color }) => <SymbolView name={icons.farm} tintColor={color} size={22} /> }}
      />
      <Tabs.Screen
        name="simulate/runs"
        options={{ title: 'Results', tabBarIcon: ({ color }) => <SymbolView name={icons.results} tintColor={color} size={22} /> }}
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
      <Tabs.Screen name="crop-library/index" options={{ href: null }} />
      <Tabs.Screen name="crop-library/[id]" options={{ href: null }} />
      <Tabs.Screen name="simulate/results" options={{ href: null }} />
      <Tabs.Screen name="market/index" options={{ href: null }} />
      <Tabs.Screen name="market/[id]" options={{ href: null }} />
      <Tabs.Screen name="community/index" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="map" options={{ href: null }} />
      <Tabs.Screen name="labs" options={{ href: null }} />
      <Tabs.Screen name="scenario-library" options={{ href: null }} />
      <Tabs.Screen name="ai-advisor" options={{ href: null }} />
      <Tabs.Screen name="gamification" options={{ href: null }} />
      <Tabs.Screen name="leaderboard" options={{ href: null }} />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="offline" options={{ href: null }} />
      <Tabs.Screen name="cohorts" options={{ href: null }} />
    </Tabs>
  );
}

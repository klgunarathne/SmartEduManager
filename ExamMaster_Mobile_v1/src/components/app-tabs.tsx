import { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Home, User } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/use-auth';

export default function AppTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  const tabs = [
    { name: 'dashboard', label: 'Exams', icon: Home },
    { name: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(`/${tab.name}`);
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.name}
            style={styles.tabItem}
            onPress={() => router.push(`/${tab.name}`)}>
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
              <Icon size={22} color={isActive ? Colors.light.primary : Colors.light.textSecondary} />
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundElement,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    gap: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: Colors.light.primary + '15',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  tabLabelActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});

import { usePathname, useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { Home, User } from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/theme';
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

const styles = {
  tabBar: {
    display: 'flex' as const,
    flexDirection: 'row' as const,
    backgroundColor: Colors.light.surface,
    borderTop: `1px solid ${Colors.light.backgroundElement}`,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.two,
    gap: 4,
    textDecoration: 'none' as const,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  iconContainerActive: {
    backgroundColor: Colors.light.primary + '15',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
  },
  tabLabelActive: {
    color: Colors.light.primary,
    fontWeight: '600' as const,
  },
};

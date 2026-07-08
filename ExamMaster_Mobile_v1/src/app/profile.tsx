import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, BookOpen, UserCheck, LogOut } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { studentService } from '@/services/student.service';
import { AttendanceSummary } from '@/models/student.models';
import { Colors, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!user?.studentId) return;
      try {
        const data = await studentService.getAttendance(user.studentId);
        setAttendance(data.summary);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttendance();
  }, [user?.studentId]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.light.text} />
          </Pressable>
          <ThemedText type="subtitle">My Profile</ThemedText>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarTextLarge}>
              {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
            </Text>
          </View>
          <ThemedText type="subtitle" style={styles.profileName}>
            {user?.fullName || 'Student'}
          </ThemedText>
          <ThemedText style={styles.profileEmail}>{user?.email}</ThemedText>
        </View>

        <View style={styles.infoCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Personal Information</ThemedText>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>MIS Number</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.misNo || '-'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>NIC Number</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.nicNo || '-'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Gender</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.gender || '-'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Batch Code</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.batchCode || '-'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.telephone || '-'}</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Address</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.address || '-'}</ThemedText>
          </View>
        </View>

        <View style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <UserCheck size={24} color={Colors.light.primary} />
            <ThemedText type="subtitle" style={styles.attendanceTitle}>Attendance Summary</ThemedText>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.light.primary} style={styles.attendanceLoader} />
          ) : (
            <View style={styles.attendanceStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.light.primary }]}>{attendance?.percentage ?? 0}%</Text>
                <ThemedText style={styles.statLabel}>Present</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{attendance?.presentDays ?? 0}/{attendance?.totalDays ?? 0}</Text>
                <ThemedText style={styles.statLabel}>Days</ThemedText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.light.danger }]}>{attendance?.absentDays ?? 0}</Text>
                <ThemedText style={styles.statLabel}>Absent</ThemedText>
              </View>
            </View>
          )}
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  backBtn: {
    padding: Spacing.two,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    marginBottom: Spacing.four,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  avatarTextLarge: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    marginBottom: Spacing.one,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    marginBottom: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundElement,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  attendanceCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    marginBottom: Spacing.four,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  attendanceLoader: {
    marginVertical: Spacing.three,
  },
  attendanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.light.backgroundElement,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.danger,
    paddingVertical: Spacing.four,
    borderRadius: 12,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

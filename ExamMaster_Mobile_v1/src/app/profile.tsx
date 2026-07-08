import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, BookOpen, UserCheck, LogOut, AlertTriangle } from 'lucide-react-native';
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
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

        <Pressable style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
          <LogOut size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </ScrollView>

      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowLogoutModal(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <AlertTriangle size={26} color={Colors.light.danger} />
            </View>
            <ThemedText type="subtitle" style={styles.modalTitle}>
              Log out?
            </ThemedText>
            <ThemedText style={styles.modalMessage}>
              Are you sure you want to log out of your account?
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={confirmLogout}>
                <Text style={styles.modalBtnConfirmText}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    zIndex: 1,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    marginBottom: Spacing.two,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.five,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.light.backgroundElement,
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalBtnConfirm: {
    backgroundColor: Colors.light.danger,
  },
  modalBtnConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

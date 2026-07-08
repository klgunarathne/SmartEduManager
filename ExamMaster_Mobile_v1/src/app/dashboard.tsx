import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { CheckCircle2, Clock, Calendar, LogOut, BookOpen, UserCheck } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/hooks/use-auth';
import { examService } from '@/services/exam.service';
import { studentService } from '@/services/student.service';
import { ExamDto, ExamAvailability } from '@/models/exam.models';
import { AttendanceSummary } from '@/models/student.models';
import { Colors, Spacing } from '@/constants/theme';

type ExamCardStatus = 'available' | 'scheduled' | 'draft' | 'expired';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.studentId) return;
    try {
      setError(null);
      const [examsData, attendanceData] = await Promise.all([
        examService.getAvailableExams(),
        studentService.getAttendance(user.studentId),
      ]);
      setExams(examsData);
      setAttendance(attendanceData.summary);
    } catch (err) {
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.studentId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/login'); } },
    ]);
  };

  const getExamStatus = (exam: ExamDto): { status: ExamCardStatus; label: string; color: string } => {
    const availability = examService.checkAvailability(exam);
    const map: Record<string, { status: ExamCardStatus; label: string; color: string }> = {
      available: { status: 'available', label: 'Available Now', color: Colors.light.success },
      scheduled: { status: 'scheduled', label: availability.message || 'Scheduled', color: Colors.light.warning },
      draft: { status: 'draft', label: 'Draft', color: Colors.light.textSecondary },
      expired: { status: 'expired', label: 'Not Available', color: Colors.light.danger },
      not_available: { status: 'expired', label: 'Not Available', color: Colors.light.danger },
    };
    return map[availability.status] || map.not_available;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
        }
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <ThemedText type="subtitle">{user?.fullName || 'Student'}</ThemedText>
              <ThemedText style={styles.profileDetail}>MIS: {user?.misNo || '-'}</ThemedText>
              <ThemedText style={styles.profileDetail}>Batch: {user?.batchCode || '-'}</ThemedText>
            </View>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color={Colors.light.danger} />
            </Pressable>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
          </View>
        )}

        <View style={styles.attendanceCard}>
          <View style={styles.attendanceHeader}>
            <View style={styles.attendanceIconContainer}>
              <UserCheck size={24} color={Colors.light.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.attendanceTitle}>Attendance</ThemedText>
          </View>
          <View style={styles.attendanceStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendance?.percentage ?? 0}%</Text>
              <ThemedText style={styles.statLabel}>Present</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{attendance?.presentDays ?? 0}/{attendance?.totalDays ?? 0}</Text>
              <ThemedText style={styles.statLabel}>Days</ThemedText>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.light.danger }]}>
                {attendance?.absentDays ?? 0}
              </Text>
              <ThemedText style={styles.statLabel}>Absent</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <BookOpen size={20} color={Colors.light.primary} />
          <ThemedText type="subtitle" style={styles.sectionTitle}>Available Exams</ThemedText>
        </View>

        {exams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <ThemedText style={styles.emptyText}>No exams available right now</ThemedText>
            <ThemedText style={styles.emptySubtext}>Check back later for upcoming exams</ThemedText>
          </View>
        ) : (
          exams.map((exam) => {
            const statusInfo = getExamStatus(exam);
            const canStart = examService.checkAvailability(exam).canStart;
            return (
              <Pressable
                key={exam.examId}
                style={styles.examCard}
                onPress={() => {
                  if (canStart) {
                    router.push(`/exam/${exam.examId}`);
                  }
                }}
                disabled={!canStart}>
                <View style={styles.examCardHeader}>
                  <View style={styles.examTitleRow}>
                    <BookOpen size={18} color={Colors.light.primary} />
                    <ThemedText type="subtitle" style={styles.examTitle}>
                      {exam.title}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {exam.description && (
                  <ThemedText style={styles.examDescription} numberOfLines={2}>
                    {exam.description}
                  </ThemedText>
                )}

                <View style={styles.examMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.metaText}>{formatDuration(exam.duration)}</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <CheckCircle2 size={14} color={Colors.light.textSecondary} />
                    <ThemedText style={styles.metaText}>{exam.questionCount} Questions</ThemedText>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaText}>{exam.totalMarks} Marks</Text>
                  </View>
                </View>

                {exam.categoryName && (
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{exam.categoryName}</Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.three,
    color: Colors.light.textSecondary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  header: {
    paddingVertical: Spacing.four,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileDetail: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  logoutButton: {
    padding: Spacing.two,
  },
  errorBanner: {
    backgroundColor: Colors.light.danger + '20',
    borderRadius: 8,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  errorBannerText: {
    color: Colors.light.danger,
    fontSize: 14,
  },
  attendanceCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  attendanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    color: Colors.light.primary,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    marginLeft: Spacing.two,
    fontSize: 16,
    fontWeight: '600',
  },
  examCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  examTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.two,
  },
  examTitle: {
    marginLeft: Spacing.two,
    fontSize: 15,
    fontWeight: '600',
  },
  examDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.three,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  examMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: Spacing.three,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.three,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.one,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});

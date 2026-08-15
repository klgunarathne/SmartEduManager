import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Clock,
  LogOut,
  UserCheck,
  GraduationCap,
  CalendarClock,
  ChevronRight,
  FileText,
  Award,
  AlertTriangle,
} from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/use-auth';
import { examService } from '@/services/exam.service';
import { studentService } from '@/services/student.service';
import { ExamDto } from '@/models/exam.models';
import { AttendanceSummary } from '@/models/student.models';
import { Colors, Spacing } from '@/constants/theme';
import AppTabs from '@/components/app-tabs';

type ExamCardStatus = 'available' | 'scheduled' | 'draft' | 'expired';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [exams, setExams] = useState<ExamDto[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const getExamStatus = (exam: ExamDto): { status: ExamCardStatus; label: string; color: string } => {
    const availability = examService.checkAvailability(exam);
    const map: Record<string, { status: ExamCardStatus; label: string; color: string }> = {
      available: { status: 'available', label: 'Available now', color: Colors.light.success },
      scheduled: { status: 'scheduled', label: availability.message || 'Scheduled', color: Colors.light.warning },
      draft: { status: 'draft', label: 'Draft', color: Colors.light.textSecondary },
      expired: { status: 'expired', label: 'Not available', color: Colors.light.danger },
      not_available: { status: 'expired', label: 'Not available', color: Colors.light.danger },
    };
    return map[availability.status] || map.not_available;
  };

  const getAttemptLabel = (exam: ExamDto): string => {
    if (exam.maxAttempts === 0) {
      return `Attempted ${exam.attemptsUsed} time${exam.attemptsUsed !== 1 ? 's' : ''}`;
    }
    const remaining = exam.maxAttempts - exam.attemptsUsed;
    return `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`;
  };

  const isAttemptExhausted = (exam: ExamDto): boolean => {
    return exam.maxAttempts > 0 && exam.attemptsUsed >= exam.maxAttempts;
  };

  const { availableExams, scheduledExams, closedExams } = useMemo(() => {
    const result = { availableExams: 0, scheduledExams: 0, closedExams: 0 };
    exams.forEach((exam) => {
      const status = getExamStatus(exam).status;
      if (status === 'available') result.availableExams += 1;
      else if (status === 'scheduled') result.scheduledExams += 1;
      else result.closedExams += 1;
    });
    return result;
  }, [exams]);

  const initial = (user?.fullName || user?.firstName || 'S').charAt(0).toUpperCase();
  const greeting = getGreeting();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading your dashboard...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const attendancePct = attendance?.percentage ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} />
          }
          contentContainerStyle={styles.scrollContent}>
          {/* Hero greeting card */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroGreeting}>{greeting},</Text>
                <Text style={styles.heroName} numberOfLines={1}>
                  {user?.fullName || user?.firstName || 'Student'}
                </Text>
              </View>
              <View style={styles.heroActions}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <Pressable style={styles.logoutButton} onPress={() => setShowLogoutModal(true)} hitSlop={8}>
                  <LogOut size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
            <View style={styles.heroChips}>
              <View style={styles.chip}>
                <GraduationCap size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.chipText}>{user?.batchCode || 'No batch'}</Text>
              </View>
              <View style={styles.chip}>
                <FileText size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.chipText}>MIS: {user?.misNo || '-'}</Text>
              </View>
            </View>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <ThemedText style={styles.errorBannerText}>{error}</ThemedText>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, styles.attendanceCard]}>
              <View style={styles.statCardHeader}>
                <View style={styles.iconBadge}>
                  <UserCheck size={18} color={Colors.light.primary} />
                </View>
                <Text style={styles.statCardTitle}>Attendance</Text>
              </View>
              <View style={styles.attendanceBody}>
                <Text style={styles.attendancePct}>{attendancePct}%</Text>
                <Text style={styles.attendanceSub}>
                  {attendance?.presentDays ?? 0} of {attendance?.totalDays ?? 0} days present
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${attendancePct}%` }]} />
              </View>
              <View style={styles.attendanceFooter}>
                <Text style={styles.absentText}>
                  {attendance?.absentDays ?? 0} absent
                </Text>
              </View>
            </View>

            <View style={[styles.statCard, styles.examStatCard]}>
              <View style={styles.statCardHeader}>
                <View style={[styles.iconBadge, styles.iconBadgeAccent]}>
                  <CalendarClock size={18} color={Colors.light.success} />
                </View>
                <Text style={styles.statCardTitle}>Exams</Text>
              </View>
              <Text style={styles.bigNumber}>{availableExams}</Text>
              <Text style={styles.statCardSub}>available now</Text>
              <View style={styles.examStatRow}>
                <Text style={styles.miniStat}>
                  <Text style={{ color: Colors.light.warning, fontWeight: '700' }}>{scheduledExams}</Text> scheduled
                </Text>
              </View>
              <View style={styles.examStatRow}>
                <Text style={styles.miniStat}>
                  <Text style={{ color: Colors.light.textSecondary, fontWeight: '700' }}>{closedExams}</Text> closed
                </Text>
              </View>
            </View>
          </View>

          {/* Available exams section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>Available Exams</Text>
              <Text style={styles.sectionCount}>{exams.length} total</Text>
            </View>
            <Award size={20} color={Colors.light.primary} />
          </View>

          {exams.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <FileText size={32} color={Colors.light.textSecondary} />
              </View>
              <ThemedText style={styles.emptyTitle}>No exams right now</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Check back later for upcoming exams and assessments.
              </ThemedText>
            </View>
          ) : (
            exams.map((exam) => {
              const statusInfo = getExamStatus(exam);
              const availability = examService.checkAvailability(exam);
              const canStart = availability.canStart && !isAttemptExhausted(exam);
              const isAvailable = statusInfo.status === 'available' && !isAttemptExhausted(exam);
              const exhausted = isAttemptExhausted(exam);
              return (
                <Pressable
                  key={exam.examId}
                  style={({ pressed }) => [
                    styles.examCard,
                    pressed && styles.examCardPressed,
                    !isAvailable && styles.examCardDisabled,
                    exhausted && styles.examCardExhausted,
                  ]}
                  onPress={() => {
                    if (canStart) router.push(`/exam/${exam.examId}`);
                  }}
                  disabled={!canStart}>
                  <View style={styles.examCardTop}>
                    <View style={styles.examTitleWrap}>
                      <Text style={styles.examTitle} numberOfLines={2}>
                        {exam.title}
                      </Text>
                      {exam.categoryName && (
                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryText}>{exam.categoryName}</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '1A' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {exhausted ? 'Attempts exhausted' : statusInfo.label}
                      </Text>
                    </View>
                  </View>

                  {exam.description && (
                    <Text style={styles.examDescription} numberOfLines={2}>
                      {exam.description}
                    </Text>
                  )}

                  <View style={styles.examMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.metaText}>{formatDuration(exam.duration)}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <FileText size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.metaText}>{exam.questionCount} Q</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Award size={14} color={Colors.light.textSecondary} />
                      <Text style={styles.metaText}>{exam.totalMarks} pts</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={[styles.metaItem, exhausted && styles.metaItemExhausted]}>
                      <Text style={[styles.metaText, exhausted && styles.metaTextExhausted]}>
                        {getAttemptLabel(exam)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.examFooter}>
                    {isAvailable ? (
                      <View style={styles.startButton}>
                        <Text style={styles.startButtonText}>Start Exam</Text>
                        <ChevronRight size={16} color="#fff" />
                      </View>
                    ) : (
                      <View style={[styles.lockedFooter, exhausted && styles.lockedFooterExhausted]}>
                        <CalendarClock size={14} color={exhausted ? Colors.light.danger : statusInfo.color} />
                        <Text style={[styles.lockedText, { color: exhausted ? Colors.light.danger : statusInfo.color }]}>
                          {exhausted ? 'Attempts exhausted' : statusInfo.label}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
        <AppTabs />
      </View>

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
  container: {
    flex: 1,
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
    paddingBottom: Spacing.six + 80,
  },
  // Hero
  hero: {
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    padding: Spacing.four,
    marginTop: Spacing.three,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTextWrap: {
    flex: 1,
    marginRight: Spacing.three,
  },
  heroGreeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '500',
  },
  heroName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroChips: {
    flexDirection: 'row',
    marginTop: Spacing.four,
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 999,
    gap: 6,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Error
  errorBanner: {
    backgroundColor: Colors.light.danger + '15',
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  errorBannerText: {
    color: Colors.light.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.light.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBadgeAccent: {
    backgroundColor: Colors.light.success + '18',
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  attendanceBody: {
    marginBottom: Spacing.two,
  },
  attendancePct: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.light.primary,
    lineHeight: 34,
  },
  attendanceSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.backgroundElement,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.light.success,
  },
  attendanceFooter: {
    marginTop: Spacing.two,
  },
  absentText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  examStatCard: {
    justifyContent: 'flex-start',
  },
  bigNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.light.success,
    lineHeight: 44,
  },
  statCardSub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.three,
  },
  examStatRow: {
    marginTop: Spacing.one,
  },
  miniStat: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.five,
    marginBottom: Spacing.three,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  // Exam cards
  examCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
  },
  examCardPressed: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.background,
  },
  examCardDisabled: {
    opacity: 0.85,
  },
  examCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  examTitleWrap: {
    flex: 1,
    gap: Spacing.two,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 21,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  examDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: Spacing.two,
    lineHeight: 18,
  },
  examMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.light.backgroundElement,
    marginHorizontal: Spacing.three,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  examFooter: {
    marginTop: Spacing.three,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: Spacing.three,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  lockedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 12,
    paddingVertical: Spacing.three,
  },
  lockedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  examCardExhausted: {
    opacity: 0.75,
  },
  lockedFooterExhausted: {
    backgroundColor: Colors.light.danger + '18',
  },
  metaItemExhausted: {},
  metaTextExhausted: {
    color: Colors.light.danger,
    fontWeight: '700',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.one,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
    lineHeight: 18,
  },
  // Logout modal
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

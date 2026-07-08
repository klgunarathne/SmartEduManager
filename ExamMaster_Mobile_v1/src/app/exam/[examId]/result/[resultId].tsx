import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Award, CheckCircle2, XCircle } from 'lucide-react-native';
import { examService } from '@/services/exam.service';
import { ExamResultDto } from '@/models/exam.models';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export default function ExamResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ examId: string; resultId: string }>();
  const resultId = params.resultId;

  const [result, setResult] = useState<ExamResultDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        const data = await examService.getResult(resultId);
        setResult(data);
      } catch {
        setError('Failed to load result. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadResult();
  }, [resultId]);

  const getGradeColor = (percentage: number): string => {
    if (percentage >= 80) return Colors.light.success;
    if (percentage >= 60) return Colors.light.primaryLight;
    if (percentage >= 40) return Colors.light.warning;
    return Colors.light.danger;
  };

  const getGradeLabel = (percentage: number): string => {
    if (percentage >= 80) return 'Excellent';
    if (percentage >= 60) return 'Good';
    if (percentage >= 40) return 'Pass';
    return 'Needs Improvement';
  };

  const getFeedback = (percentage: number): string => {
    if (percentage >= 80) return 'Outstanding performance! Keep up the great work.';
    if (percentage >= 60) return 'Good job! You have a solid understanding of the material.';
    if (percentage >= 40) return 'You passed, but there is room for improvement. Review the material.';
    return 'You did not pass this time. Review the material and try again.';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading results...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>{error || 'Failed to load result'}</ThemedText>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
  const correctCount = result.answers?.filter((a) => a.isCorrect).length || 0;
  const wrongCount = (result.answers?.length || 0) - correctCount;
  const gradeColor = getGradeColor(percentage);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.replace('/dashboard')}>
            <ChevronLeft size={24} color={Colors.light.text} />
          </Pressable>
          <ThemedText type="subtitle">Exam Results</ThemedText>
        </View>

        <View style={styles.scoreCard}>
          <View style={styles.scoreCircleContainer}>
            <View style={[styles.scoreCircle, { borderColor: gradeColor }]}>
              <Award size={48} color={gradeColor} />
              <Text style={[styles.scorePercentage, { color: gradeColor }]}>
                {percentage}%
              </Text>
            </View>
          </View>

          <View style={styles.gradeContainer}>
            <Text style={[styles.gradeLabel, { color: gradeColor }]}>
              {getGradeLabel(percentage)}
            </Text>
            <ThemedText style={styles.feedbackText}>{getFeedback(percentage)}</ThemedText>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.light.primary }]}>
                {result.score}/{result.totalMarks}
              </Text>
              <ThemedText style={styles.statLabel}>Score</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.light.success }]}>
                {correctCount}
              </Text>
              <ThemedText style={styles.statLabel}>Correct</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: Colors.light.danger }]}>
                {wrongCount}
              </Text>
              <ThemedText style={styles.statLabel}>Wrong</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.reviewHeader}>
          <ThemedText type="subtitle" style={styles.reviewTitle}>Answer Review</ThemedText>
        </View>

        {result.answers?.map((answer, idx) => (
          <View key={answer.questionId} style={styles.reviewCard}>
            <View style={styles.reviewHeaderRow}>
              <Text style={styles.reviewQuestionNumber}>Q{idx + 1}</Text>
              <View style={[styles.resultBadge, { backgroundColor: answer.isCorrect ? Colors.light.success + '20' : Colors.light.danger + '20' }]}>
                {answer.isCorrect ? (
                  <CheckCircle2 size={16} color={Colors.light.success} />
                ) : (
                  <XCircle size={16} color={Colors.light.danger} />
                )}
                <Text style={[styles.resultBadgeText, { color: answer.isCorrect ? Colors.light.success : Colors.light.danger }]}>
                  {answer.isCorrect ? 'Correct' : 'Incorrect'}
                </Text>
              </View>
            </View>

            <ThemedText style={styles.reviewQuestion}>{answer.questionContent}</ThemedText>

            <View style={styles.reviewAnswerRow}>
              <Text style={styles.reviewLabel}>Your Answer:</Text>
              <Text style={[styles.reviewAnswer, { color: answer.isCorrect ? Colors.light.success : Colors.light.danger }]}>
                {answer.selectedAnswer || 'Not answered'}
              </Text>
            </View>

            {!answer.isCorrect && answer.correctAnswer && (
              <View style={styles.reviewAnswerRow}>
                <Text style={styles.reviewLabel}>Correct Answer:</Text>
                <Text style={[styles.reviewAnswer, { color: Colors.light.success }]}>
                  {answer.correctAnswer}
                </Text>
              </View>
            )}

            <View style={styles.marksRow}>
              <Text style={styles.marksText}>
                Marks: {answer.marksObtained}/{answer.totalMarks}
              </Text>
            </View>
          </View>
        ))}

        <Pressable
          style={styles.dashboardButton}
          onPress={() => router.replace('/dashboard')}>
          <ChevronLeft size={18} color="#fff" />
          <Text style={styles.dashboardButtonText}>Back to Dashboard</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.three,
    color: Colors.light.textSecondary,
  },
  errorText: {
    color: Colors.light.danger,
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  backButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
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
  scoreCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    marginBottom: Spacing.five,
  },
  scoreCircleContainer: {
    marginBottom: Spacing.four,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  gradeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  gradeLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  reviewHeader: {
    marginBottom: Spacing.three,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  reviewQuestionNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewQuestion: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: Spacing.three,
  },
  reviewAnswerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.two,
  },
  reviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    width: 100,
  },
  reviewAnswer: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  marksRow: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundElement,
  },
  marksText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.four,
    borderRadius: 12,
    marginTop: Spacing.four,
    gap: Spacing.two,
  },
  dashboardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

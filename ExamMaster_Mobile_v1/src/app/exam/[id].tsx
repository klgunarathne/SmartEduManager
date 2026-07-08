import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Send, Clock, CheckCircle2, XCircle, Grid3x3, AlertTriangle } from 'lucide-react-native';
import { examService } from '@/services/exam.service';
import { useAuth } from '@/hooks/use-auth';
import { ExamDto, ExamAttemptDto, ExamAnswerSubmission, ExamAnswerResultDto } from '@/models/exam.models';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type AnswerMap = Record<string, string>;

export default function ExamTakingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const examId = params.id;
  const { user } = useAuth();

  const [exam, setExam] = useState<ExamDto | null>(null);
  const [attempt, setAttempt] = useState<ExamAttemptDto | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalQuestions = exam?.questions?.length || 0;
  const currentQuestion = exam?.questions?.[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const startExam = useCallback(async () => {
    try {
      const attemptData = await examService.startExam({ examId });
      setAttempt(attemptData);
      const duration = exam?.duration || 60;
      setTimeLeft(duration * 60);
    } catch (err) {
      setError('Failed to start exam. Please try again.');
      setIsLoading(false);
    }
  }, [examId, exam?.duration]);

  useEffect(() => {
    const loadExam = async () => {
      try {
        const examData = await examService.getExamById(examId);
        setExam(examData);
        await startExam();
      } catch (err) {
        setError('Failed to load exam. Please try again.');
        setIsLoading(false);
      }
    };
    loadExam();
  }, [examId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const handleAutoSubmit = async () => {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      const answersArray: ExamAnswerSubmission[] = Object.entries(answers).map(
        ([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })
      );
      await examService.submitExam({
        examAttemptId: attempt.examAttemptId,
        answers: answersArray,
      });
      router.replace(`/exam/${examId}/result/${attempt.examAttemptId}`);
    } catch {
      Alert.alert('Error', 'Failed to auto-submit exam. Please submit manually.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      const answersArray: ExamAnswerSubmission[] = Object.entries(answers).map(
        ([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })
      );
      await examService.submitExam({
        examAttemptId: attempt.examAttemptId,
        answers: answersArray,
      });
      router.replace(`/exam/${examId}/result/${attempt.examAttemptId}`);
    } catch {
      Alert.alert('Error', 'Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  const updateAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.questionId]: value,
    }));
  };

  const getOptions = (): string[] => {
    if (!currentQuestion?.options) return [];
    return currentQuestion.options.split('|').filter(Boolean);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;
    const options = getOptions();
    const currentAnswer = answers[currentQuestion.questionId];

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <View style={styles.optionsContainer}>
            {options.map((option, idx) => (
              <Pressable
                key={idx}
                style={[styles.optionButton, currentAnswer === option && styles.optionButtonSelected]}
                onPress={() => updateAnswer(option)}>
                <View style={[styles.radio, currentAnswer === option && styles.radioSelected]}>
                  {currentAnswer === option && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, currentAnswer === option && styles.optionTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        );

      case 'checkbox':
        const selectedOptions = currentAnswer ? currentAnswer.split(',') : [];
        const toggleOption = (option: string) => {
          const current = selectedOptions;
          if (current.includes(option)) {
            updateAnswer(current.filter((o) => o !== option).join(','));
          } else {
            updateAnswer([...current, option].join(','));
          }
        };
        return (
          <View style={styles.optionsContainer}>
            {options.map((option, idx) => {
              const isSelected = selectedOptions.includes(option);
              return (
                <Pressable
                  key={idx}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => toggleOption(option)}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );

      case 'dropdown':
        return (
          <View style={styles.optionsContainer}>
            {options.map((option, idx) => (
              <Pressable
                key={idx}
                style={[styles.optionButton, currentAnswer === option && styles.optionButtonSelected]}
                onPress={() => updateAnswer(option)}>
                <Text style={[styles.optionText, currentAnswer === option && styles.optionTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        );

      case 'true-false':
        return (
          <View style={styles.optionsContainer}>
            {['True', 'False'].map((option) => (
              <Pressable
                key={option}
                style={[styles.optionButton, currentAnswer === option && styles.optionButtonSelected]}
                onPress={() => updateAnswer(option)}>
                <View style={[styles.radio, currentAnswer === option && styles.radioSelected]}>
                  {currentAnswer === option && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, currentAnswer === option && styles.optionTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        );

      case 'short-answer':
      case 'essay':
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="Type your answer here..."
            placeholderTextColor={Colors.light.textSecondary}
            value={currentAnswer || ''}
            onChangeText={updateAnswer}
            multiline
            numberOfLines={currentQuestion.type === 'essay' ? 8 : 4}
            textAlignVertical="top"
          />
        );

      case 'date':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.light.textSecondary}
            value={currentAnswer || ''}
            onChangeText={updateAnswer}
          />
        );

      case 'time':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="HH:MM"
            placeholderTextColor={Colors.light.textSecondary}
            value={currentAnswer || ''}
            onChangeText={updateAnswer}
          />
        );

      case 'linear-scale':
      case 'rating': {
        const scaleValue = currentAnswer ? parseInt(currentAnswer, 10) : 0;
        return (
          <View style={styles.scaleContainer}>
            {[1, 2, 3, 4, 5].map((val) => (
              <Pressable
                key={val}
                style={[styles.scaleButton, scaleValue === val && styles.scaleButtonSelected]}
                onPress={() => updateAnswer(String(val))}>
                <Text style={[styles.scaleText, scaleValue === val && styles.scaleTextSelected]}>
                  {val}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      }

      default:
        return (
          <TextInput
            style={styles.textInput}
            placeholder="Type your answer..."
            placeholderTextColor={Colors.light.textSecondary}
            value={currentAnswer || ''}
            onChangeText={updateAnswer}
            multiline
            textAlignVertical="top"
          />
        );
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeLeft !== null && timeLeft < 300;
  const isTimeCritical = timeLeft !== null && timeLeft < 60;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading exam...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !exam || !attempt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ThemedText style={styles.errorText}>{error || 'Failed to load exam'}</ThemedText>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={Colors.light.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText type="subtitle" numberOfLines={1}>{exam.title}</ThemedText>
        </View>
        <Pressable style={styles.gridButton} onPress={() => setShowGrid(true)}>
          <Grid3x3 size={20} color={Colors.light.primary} />
        </Pressable>
      </View>

      <View style={[styles.timerBar, isTimeCritical && styles.timerCritical, isTimeLow && styles.timerLow]}>
        <Clock size={18} color={isTimeCritical ? '#fff' : isTimeLow ? Colors.light.warning : Colors.light.primary} />
        <Text style={[styles.timerText, isTimeCritical && styles.timerTextCritical]}>
          {formatTime(timeLeft || 0)}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }]} />
          </View>
          <ThemedText style={styles.progressText}>
            {answeredCount}/{totalQuestions} answered
          </ThemedText>
        </View>

        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <ThemedText style={styles.questionNumber}>
              Question {currentIndex + 1} of {totalQuestions}
            </ThemedText>
            <View style={styles.marksBadge}>
              <Text style={styles.marksText}>{currentQuestion?.marks || 0} marks</Text>
            </View>
          </View>

          <ThemedText style={styles.questionText}>{currentQuestion?.content}</ThemedText>

          {currentQuestion?.explanation && (
            <ThemedText style={styles.explanationText}>{currentQuestion.explanation}</ThemedText>
          )}

          <View style={styles.answerSection}>
            <ThemedText style={styles.answerLabel}>Your Answer</ThemedText>
            {renderQuestion()}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}>
          <ChevronLeft size={20} color={Colors.light.text} />
          <Text style={styles.navButtonText}>Previous</Text>
        </Pressable>

        <Pressable
          style={[styles.navButton, currentIndex === totalQuestions - 1 && styles.navButtonDisabled]}
          onPress={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
          disabled={currentIndex === totalQuestions - 1}>
          <Text style={styles.navButtonText}>Next</Text>
          <ChevronRight size={20} color={Colors.light.text} />
        </Pressable>

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={() => setShowConfirm(true)}
          disabled={isSubmitting}>
          <Send size={18} color="#fff" />
          <Text style={styles.submitButtonText}>Submit</Text>
        </Pressable>
      </View>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconContainer}>
              <AlertTriangle size={48} color={Colors.light.warning} />
            </View>
            <ThemedText type="subtitle" style={styles.modalTitle}>Submit Exam?</ThemedText>
            <ThemedText style={styles.modalText}>
              You have answered {answeredCount} out of {totalQuestions} questions.
            </ThemedText>
            {totalQuestions - answeredCount > 0 && (
              <ThemedText style={styles.modalWarning}>
                {totalQuestions - answeredCount} question(s) unanswered. Unanswered questions will be marked as incorrect.
              </ThemedText>
            )}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setShowConfirm(false)}>
                <ThemedText style={styles.modalCancelText}>Continue Exam</ThemedText>
              </Pressable>
              <Pressable style={styles.modalSubmitButton} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.modalSubmitText}>Submit</ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showGrid} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.gridModalCard}>
            <View style={styles.gridHeader}>
              <ThemedText type="subtitle">Question Navigatorator</ThemedText>
              <Pressable onPress={() => setShowGrid(false)}>
                <ThemedText style={styles.closeGridText}>Close</ThemedText>
              </Pressable>
            </View>
            <View style={styles.gridContainer}>
              {exam.questions?.map((q, idx) => {
                const isAnswered = answers[q.questionId] !== undefined;
                const isCurrent = idx === currentIndex;
                return (
                  <Pressable
                    key={q.questionId}
                    style={[
                      styles.gridItem,
                      isCurrent && styles.gridItemCurrent,
                      isAnswered && styles.gridItemAnswered,
                    ]}
                    onPress={() => {
                      setCurrentIndex(idx);
                      setShowGrid(false);
                    }}>
                    <Text style={[
                      styles.gridItemText,
                      isCurrent && styles.gridItemTextCurrent,
                      isAnswered && styles.gridItemTextAnswered,
                    ]}>
                      {idx + 1}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.gridLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.primary }]} />
                <ThemedText style={styles.legendText}>Current</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.success }]} />
                <ThemedText style={styles.legendText}>Answered</ThemedText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.backgroundElement }]} />
                <ThemedText style={styles.legendText}>Pending</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundElement,
  },
  backBtn: {
    padding: Spacing.two,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.three,
  },
  gridButton: {
    padding: Spacing.two,
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    backgroundColor: Colors.light.primary + '10',
    gap: Spacing.two,
  },
  timerLow: {
    backgroundColor: Colors.light.warning + '20',
  },
  timerCritical: {
    backgroundColor: Colors.light.danger + '20',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
    fontVariant: ['tabular-nums'],
  },
  timerTextCritical: {
    color: Colors.light.danger,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  progressContainer: {
    marginBottom: Spacing.four,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  questionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  marksBadge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 6,
  },
  marksText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.light.text,
    marginBottom: Spacing.four,
  },
  explanationText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.four,
    padding: Spacing.three,
    backgroundColor: Colors.light.backgroundElement + '50',
    borderRadius: 8,
  },
  answerSection: {
    marginTop: Spacing.two,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.three,
    color: Colors.light.text,
  },
  optionsContainer: {
    gap: Spacing.two,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    backgroundColor: Colors.light.surface,
  },
  optionButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.light.backgroundElement,
    marginRight: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.light.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.backgroundElement,
    marginRight: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 15,
    color: Colors.light.text,
  },
  optionTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 80,
  },
  scaleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  scaleButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    alignItems: 'center',
  },
  scaleButtonSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  scaleText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  scaleTextSelected: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundElement,
    gap: Spacing.two,
    alignItems: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundElement,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  submitButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 8,
    gap: Spacing.one,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: Spacing.five,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    marginBottom: Spacing.three,
  },
  modalTitle: {
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  modalWarning: {
    fontSize: 13,
    color: Colors.light.warning,
    textAlign: 'center',
    marginBottom: Spacing.four,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: 10,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  gridModalCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 400,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  closeGridText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    justifyContent: 'center',
  },
  gridItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemCurrent: {
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  gridItemAnswered: {
    backgroundColor: Colors.light.success + '30',
  },
  gridItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  gridItemTextCurrent: {
    color: Colors.light.primary,
  },
  gridItemTextAnswered: {
    color: Colors.light.success,
  },
  gridLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.four,
    marginTop: Spacing.four,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

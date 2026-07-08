import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, AlertCircle, GraduationCap, Lock, User } from 'lucide-react-native';
import { useAuth } from '@/hooks/use-auth';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

// Sri Lankan NIC: 9 digits + V/X (old) or 12 digits (new).
const nicRegex = /^(?:\d{9}[VXvx]|\d{12})$/;

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'NIC number is required')
    .refine((val) => nicRegex.test(val), 'Enter a valid NIC number (e.g. 123456789V)'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [rememberDevice, setRememberDevice] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password, rememberDevice);
      router.replace('/dashboard');
    } catch (error) {
      setServerError('Invalid NIC number or password. Please try again.');
    }
  };

  const canSubmit = isValid && !isLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <GraduationCap size={30} color={Colors.light.primary} />
            </View>
            <Text style={styles.brandName}>ExamMaster</Text>
            <Text style={styles.brandTag}>Student Portal</Text>
          </View>

          {/* Heading */}
          <View style={styles.heading}>
            <ThemedText style={styles.welcome}>Welcome back</ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in with your NIC number to continue
            </ThemedText>
          </View>

          {serverError && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={Colors.light.danger} />
              <Text style={styles.errorBannerText}>{serverError}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>NIC Number</ThemedText>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrap,
                      focusedField === 'email' && styles.inputWrapFocused,
                      errors.email && styles.inputWrapError,
                    ]}>
                    <User size={18} color={Colors.light.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 123456789V"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={value}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      testID="login-nic-input"
                    />
                  </View>
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputWrap,
                      focusedField === 'password' && styles.inputWrapFocused,
                      errors.password && styles.inputWrapError,
                    ]}>
                    <Lock size={18} color={Colors.light.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your password"
                      placeholderTextColor={Colors.light.textSecondary}
                      value={value}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => {
                        setFocusedField(null);
                        onBlur();
                      }}
                      onChangeText={onChange}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      testID="login-password-input"
                    />
                  </View>
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            <Pressable
              style={styles.rememberRow}
              onPress={() => setRememberDevice((prev) => !prev)}>
              <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
                {rememberDevice && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <ThemedText style={styles.rememberText}>Remember this device</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.loginButton, !canSubmit && styles.loginButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={!canSubmit}
              testID="login-button">
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.loginButtonInner}>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <ArrowRight size={18} color="#fff" />
                </View>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>
              SmartEduManager · Access exams, results &amp; attendance
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.four,
    justifyContent: 'flex-start',
  },
  // Brand
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.light.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 0.2,
  },
  brandTag: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Heading
  heading: {
    marginBottom: Spacing.four,
  },
  welcome: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: Spacing.two,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.danger + '15',
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  errorBannerText: {
    color: Colors.light.danger,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // Form
  form: {
    gap: Spacing.four,
  },
  inputGroup: {
    gap: Spacing.two,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderWidth: 1.5,
    borderColor: Colors.light.backgroundElement,
    borderRadius: 14,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  inputWrapFocused: {
    borderColor: Colors.light.primary,
  },
  inputWrapError: {
    borderColor: Colors.light.danger,
  },
  inputIcon: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 12,
    marginLeft: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.light.backgroundElement,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 14,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

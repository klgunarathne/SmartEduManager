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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Colors, Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>EM</Text>
              </View>
            </View>
            <ThemedText type="title" style={styles.title}>
              ExamMaster
            </ThemedText>
            <ThemedText style={styles.subtitle}>Student Portal</ThemedText>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.label}>NIC Number</ThemedText>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="e.g. 123456789V"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    testID="login-nic-input"
                  />
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
                  <TextInput
                    style={[styles.input, errors.password && styles.inputError]}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.light.textSecondary}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="login-password-input"
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            {serverError && <Text style={styles.serverError}>{serverError}</Text>}

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
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.footerText}>SmartEduManager Student Portal</ThemedText>
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
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.six,
  },
  logoContainer: {
    marginBottom: Spacing.four,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: Spacing.two,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.two,
    color: Colors.light.text,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.backgroundElement,
    borderRadius: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 16,
    color: Colors.light.text,
  },
  inputError: {
    borderColor: Colors.light.danger,
  },
  errorText: {
    color: Colors.light.danger,
    fontSize: 12,
    marginTop: Spacing.one,
  },
  serverError: {
    color: Colors.light.danger,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
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
    borderRadius: 12,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.five,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

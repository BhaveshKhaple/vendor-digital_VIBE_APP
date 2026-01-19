/**
 * VoiceInputButton - Large mic button for voice-to-record
 * Uses native device STT for speech recognition
 */

import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Pressable, Modal, Platform, Alert } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    cancelAnimation,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { parseVoiceInput, generateConfirmationText, type ParsedVoiceInput } from '@/lib/voice-parser';
import { CURRENCY_SYMBOL } from '@/lib/currency';
import type { Product } from '@/lib/repositories/types';

interface VoiceInputButtonProps {
    products: Product[];
    isExpenseMode: boolean;
    onConfirm: (parsed: ParsedVoiceInput) => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'confirming' | 'error';

// Mock STT for web/testing - in production, use expo-speech or native APIs
async function startSpeechRecognition(): Promise<string> {
    // On web/simulator, we'll simulate with a prompt
    // In production, this would use:
    // - expo-speech for TTS
    // - @react-native-voice/voice for STT
    // - Or Sarvam AI API for Indian languages

    return new Promise((resolve) => {
        // Simulate listening for 2 seconds
        setTimeout(() => {
            // Return a sample phrase for testing
            const samplePhrases = [
                'Dus rupaye ka chai',
                'Coffee 20 rupees',
                'Samosa bees rupaye',
                '15 rupees tea',
                'Bread pachaas rupaye',
            ];
            const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
            resolve(randomPhrase);
        }, 2000);
    });
}

// Text-to-Speech function
async function speak(text: string): Promise<void> {
    // In production, use expo-speech
    // import * as Speech from 'expo-speech';
    // await Speech.speak(text, { language: 'hi-IN' });
    console.log('TTS:', text);
    return Promise.resolve();
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function VoiceInputButton({ products, isExpenseMode, onConfirm }: VoiceInputButtonProps) {
    const { theme } = useTheme();
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [parsedInput, setParsedInput] = useState<ParsedVoiceInput | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const pulseScale = useSharedValue(1);
    const micScale = useSharedValue(1);

    const activeColor = isExpenseMode ? theme.expense : theme.primary;

    // Pulse animation for listening state
    useEffect(() => {
        if (voiceState === 'listening') {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.3, { duration: 500 }),
                    withTiming(1, { duration: 500 })
                ),
                -1,
                false
            );
        } else {
            cancelAnimation(pulseScale);
            pulseScale.value = withTiming(1, { duration: 200 });
        }
    }, [voiceState, pulseScale]);

    const handleMicPress = useCallback(async () => {
        if (voiceState === 'listening' || voiceState === 'processing') {
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setVoiceState('listening');

        try {
            // Start speech recognition
            const spokenText = await startSpeechRecognition();

            setVoiceState('processing');

            // Parse the spoken text
            const parsed = parseVoiceInput(spokenText, products, isExpenseMode);
            setParsedInput(parsed);

            if (parsed.confidence < 0.3) {
                // Low confidence - show error
                setVoiceState('error');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                setTimeout(() => {
                    setVoiceState('idle');
                }, 2000);
                return;
            }

            // Speak confirmation
            const confirmText = generateConfirmationText(parsed);
            await speak(confirmText);

            setVoiceState('confirming');
            setShowConfirmModal(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error) {
            console.error('Voice recognition error:', error);
            setVoiceState('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

            setTimeout(() => {
                setVoiceState('idle');
            }, 2000);
        }
    }, [voiceState, products, isExpenseMode]);

    const handleConfirm = useCallback(() => {
        if (parsedInput) {
            onConfirm(parsedInput);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setShowConfirmModal(false);
        setVoiceState('idle');
        setParsedInput(null);
    }, [parsedInput, onConfirm]);

    const handleCancel = useCallback(() => {
        setShowConfirmModal(false);
        setVoiceState('idle');
        setParsedInput(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const pulseAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: 0.3,
    }));

    const getStatusText = () => {
        switch (voiceState) {
            case 'listening':
                return 'Listening...';
            case 'processing':
                return 'Processing...';
            case 'error':
                return 'Try Again';
            default:
                return 'Tap to speak';
        }
    };

    const getStatusIcon = (): keyof typeof Feather.glyphMap => {
        switch (voiceState) {
            case 'listening':
                return 'mic';
            case 'processing':
                return 'loader';
            case 'error':
                return 'alert-circle';
            default:
                return 'mic';
        }
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.micWrapper}>
                    {/* Pulse ring animation */}
                    {voiceState === 'listening' && (
                        <Animated.View
                            style={[
                                styles.pulseRing,
                                { backgroundColor: activeColor },
                                pulseAnimatedStyle,
                            ]}
                        />
                    )}

                    {/* Main mic button */}
                    <Pressable
                        onPress={handleMicPress}
                        style={[
                            styles.micButton,
                            {
                                backgroundColor: voiceState === 'error' ? theme.expense : activeColor,
                            },
                        ]}
                        testID="voice-input-button"
                    >
                        <Feather
                            name={getStatusIcon()}
                            size={32}
                            color="#FFFFFF"
                        />
                    </Pressable>
                </View>

                <ThemedText
                    style={[
                        styles.statusText,
                        { color: voiceState === 'error' ? theme.expense : theme.textSecondary },
                    ]}
                >
                    {getStatusText()}
                </ThemedText>
            </View>

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent
                animationType="fade"
                onRequestClose={handleCancel}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
                        <ThemedText style={styles.modalTitle}>
                            Confirm Transaction
                        </ThemedText>

                        {parsedInput && (
                            <View style={styles.parsedInfo}>
                                <View style={styles.infoRow}>
                                    <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                                        Amount:
                                    </ThemedText>
                                    <ThemedText style={[styles.infoValue, { color: activeColor }]}>
                                        {parsedInput.amount ? `${CURRENCY_SYMBOL}${parsedInput.amount}` : 'Not detected'}
                                    </ThemedText>
                                </View>

                                <View style={styles.infoRow}>
                                    <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                                        Item:
                                    </ThemedText>
                                    <ThemedText style={styles.infoValue}>
                                        {parsedInput.productName || 'Unknown'}
                                    </ThemedText>
                                </View>

                                <View style={styles.infoRow}>
                                    <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>
                                        Type:
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            styles.infoValue,
                                            { color: parsedInput.transactionType === 'IN' ? theme.income : theme.expense }
                                        ]}
                                    >
                                        {parsedInput.transactionType === 'IN' ? 'Sale (Income)' : 'Expense'}
                                    </ThemedText>
                                </View>

                                {parsedInput.rawText && (
                                    <View style={[styles.rawTextContainer, { backgroundColor: theme.backgroundSecondary }]}>
                                        <ThemedText style={[styles.rawTextLabel, { color: theme.textSecondary }]}>
                                            You said:
                                        </ThemedText>
                                        <ThemedText style={styles.rawText}>
                                            "{parsedInput.rawText}"
                                        </ThemedText>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <Pressable
                                onPress={handleCancel}
                                style={[styles.modalButton, { backgroundColor: theme.backgroundSecondary }]}
                            >
                                <Feather name="x" size={24} color={theme.text} />
                                <ThemedText style={styles.modalButtonText}>Cancel</ThemedText>
                            </Pressable>

                            <Pressable
                                onPress={handleConfirm}
                                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme.income }]}
                            >
                                <Feather name="check" size={24} color="#FFFFFF" />
                                <ThemedText style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                                    Confirm
                                </ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    micWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    pulseRing: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    micButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    parsedInfo: {
        marginBottom: Spacing.xl,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    rawTextContainer: {
        marginTop: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.sm,
    },
    rawTextLabel: {
        fontSize: 12,
        marginBottom: Spacing.xs,
    },
    rawText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    modalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    confirmButton: {
        flex: 1.5,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

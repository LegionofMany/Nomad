/**
 * First-run flow for phones: welcome -> password -> time key -> backup phrase -> confirm -> open wallet.
 * Also covers "I already have a wallet" (import a recovery phrase).
 *
 * The recovery phrase lives only in this screen's memory. It is never saved or logged.
 * Every message appears right next to the button that caused it.
 */
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAppState } from '../state/appState';
import * as walletService from '../services/walletService';
import { validateMnemonic } from '../../src/wallet-core/seed';
import { C, NomadBrandMark } from '../ui/NomadShell';

type Step = 'welcome' | 'import' | 'password' | 'timekey' | 'creating' | 'backup' | 'confirm' | 'done';
type Mode = 'create' | 'import';

const pad2 = (n: number) => String(n).padStart(2, '0');
const normalizePhrase = (s: string) => s.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');

function pickQuiz(count: number): number[] {
  const picked = new Set<number>();
  while (picked.size < 3) picked.add(Math.floor(Math.random() * count));
  return [...picked].sort((a, b) => a - b);
}

function ErrorBox({ error }: { error: string }) {
  return error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null;
}

function Primary({ label, onPress, disabled, busy }: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={onPress} style={[s.primary, (disabled || busy) && s.primaryOff]}>
      <Text style={s.primaryText}>{label}</Text>
    </Pressable>
  );
}
export default function OnboardingScreen() {
  const { unlockWithClock, refresh } = useAppState();
  const now = useMemo(() => new Date(), []);

  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<Mode>('create');
  const [phraseInput, setPhraseInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [hour, setHour] = useState(pad2(now.getHours()));
  const [minute, setMinute] = useState(pad2(now.getMinutes()));
  const [second, setSecond] = useState(pad2(now.getSeconds()));
  const [words, setWords] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [quiz, setQuiz] = useState<number[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const clockTime = () => ({ hour: Number(hour), minute: Number(minute), second: Number(second) });

  const start = (next: Mode) => {
    setMode(next);
    setError('');
    setStep(next === 'import' ? 'import' : 'password');
  };

  const submitPhrase = () => {
    const phrase = normalizePhrase(phraseInput);
    if (!validateMnemonic(phrase)) {
      setError('That recovery phrase is not valid. Check the words and their order, then try again.');
      return;
    }
    setError('');
    setStep('password');
  };

  const submitPassword = () => {
    if (password.length < 12) return setError('Your password needs at least 12 characters.');
    if (password !== confirmPw) return setError('The two passwords do not match.');
    setError('');
    setStep('timekey');
  };

  const submitTime = async () => {
    const valid = /^\d{1,2}$/.test(hour) && /^\d{1,2}$/.test(minute) && /^\d{1,2}$/.test(second)
      && Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59;
    if (!valid) return setError('Enter a real 24-hour time: hour 0-23, minute 0-59, second 0-59.');
    Keyboard.dismiss();
    setError('');
    setBusy(true);
    setStage('Starting…');
    setElapsed(0);
    setStep('creating');
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    await new Promise((resolve) => setTimeout(resolve, 250)); // let the progress screen draw before the heavy work
    try {
      if (mode === 'create') {
        const res = await walletService.createWallet(password, clockTime(), setStage);
        const list = res.mnemonic.trim().split(/\s+/);
        setWords(list);
        setQuiz(pickQuiz(list.length));
        setAnswers(['', '', '']);
        setRevealed(false);
        setStep('backup');
      } else {
        await walletService.restoreWallet(normalizePhrase(phraseInput), password, clockTime());
        setPhraseInput('');
        setStep('done');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while creating the wallet.');
      setStep('timekey');
    } finally {
      clearInterval(timer);
      setBusy(false);
    }
  };

  const submitConfirm = () => {
    const ok = quiz.every((index, i) => answers[i].trim().toLowerCase() === words[index]);
    if (!ok) return setError('One or more words do not match. Go back and check your phrase.');
    setError('');
    setWords([]);
    setRevealed(false);
    setStep('done');
  };

  const openWallet = async () => {
    setBusy(true);
    setError('');
    try {
      const result: any = await unlockWithClock(clockTime(), password);
      if (!result?.ok) {
        setError('Your wallet is ready, but it could not open right now. Continue to the unlock screen.');
        await refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the wallet.');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setError('');
    if (step === 'import') setStep('welcome');
    else if (step === 'password') setStep(mode === 'import' ? 'import' : 'welcome');
    else if (step === 'timekey') setStep('password');
    else if (step === 'confirm') setStep('backup');
  };

  const showBack = step === 'import' || step === 'password' || step === 'timekey' || step === 'confirm';
  const stepNumber = { welcome: 0, import: 1, password: 1, timekey: 2, creating: 2, backup: 3, confirm: 4, done: 5 }[step];
  const totalSteps = mode === 'create' ? 5 : 3;

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.topBar}>
        {showBack ? <Pressable onPress={back} hitSlop={12}><Text style={s.backText}>‹ Back</Text></Pressable> : <View />}
        {step !== 'welcome' && step !== 'done' ? <Text style={s.stepText}>Step {Math.min(stepNumber, totalSteps)} of {totalSteps}</Text> : <View />}
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {step === 'welcome' && (
          <View style={s.center}>
            <NomadBrandMark size={84} />
            <Text style={s.brand}>Nomad</Text>
            <Text style={s.lead}>Your keys. Your money. A secure wallet for travel.</Text>
            <View style={s.testnetPill}><Text style={s.testnetText}>TESTNET BUILD · test coins only</Text></View>
            <View style={s.stack}>
              <Primary busy={busy} label="Create a new wallet" onPress={() => start('create')} />
              <Pressable accessibilityRole="button" onPress={() => start('import')} style={s.secondary}>
                <Text style={s.secondaryText}>I already have a wallet</Text>
              </Pressable>
            </View>
            <Text style={s.fine}>Nomad is non-custodial. Only you hold the keys, and nobody can recover them for you.</Text>
          </View>
        )}

        {step === 'import' && (
          <View>
            <Text style={s.title}>Import your wallet</Text>
            <Text style={s.help}>Type or paste your Secret Recovery Phrase, with a space between each word.</Text>
            <TextInput
              accessibilityLabel="Secret Recovery Phrase"
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              secureTextEntry={false}
              value={phraseInput}
              onChangeText={setPhraseInput}
              placeholder="word1 word2 word3 …"
              placeholderTextColor={C.muted2}
              style={[s.input, s.phraseInput]}
            />
            <ErrorBox error={error} />
            <Primary busy={busy} label="Continue" onPress={submitPhrase} disabled={!phraseInput.trim()} />
          </View>
        )}

        {step === 'password' && (
          <View>
            <Text style={s.title}>Create a password</Text>
            <Text style={s.help}>This password protects the wallet on this phone. Nomad cannot reset it for you.</Text>
            <TextInput accessibilityLabel="New wallet password" autoCapitalize="none" autoCorrect={false} secureTextEntry={!showPw}
              value={password} onChangeText={setPassword} placeholder="New password (12+ characters)" placeholderTextColor={C.muted2} style={s.input} />
            <TextInput accessibilityLabel="Confirm wallet password" autoCapitalize="none" autoCorrect={false} secureTextEntry={!showPw}
              value={confirmPw} onChangeText={setConfirmPw} placeholder="Confirm password" placeholderTextColor={C.muted2} style={s.input} />
            <Pressable onPress={() => setShowPw(!showPw)} hitSlop={8}><Text style={s.link}>{showPw ? 'Hide password' : 'Show password'}</Text></Pressable>
            <Text style={[s.check, password.length >= 12 && s.checkOk]}>{password.length >= 12 ? '✓' : '○'} At least 12 characters</Text>
            <Text style={[s.check, password.length > 0 && password === confirmPw && s.checkOk]}>{password.length > 0 && password === confirmPw ? '✓' : '○'} Passwords match</Text>
            <ErrorBox error={error} />
            <Primary busy={busy} label="Continue" onPress={submitPassword} />
          </View>
        )}

        {step === 'timekey' && (
          <View>
            <Text style={s.title}>Choose your Time Key</Text>
            <Text style={s.help}>
              Nomad adds a second lock. You open the wallet with your password plus this time of day (24-hour). It starts with the current time so you can open the wallet right away. Pick a time you will remember.
            </Text>
            <View style={s.timeRow}>
              {([['HOUR', hour, setHour], ['MIN', minute, setMinute], ['SEC', second, setSecond]] as const).map(([label, value, set], i) => (
                <React.Fragment key={label}>
                  {i > 0 ? <Text style={s.colon}>:</Text> : null}
                  <View style={s.timeCell}>
                    <Text style={s.timeLabel}>{label}</Text>
                    <TextInput accessibilityLabel={`Time key ${label}`} keyboardType="number-pad" maxLength={2} value={value}
                      onChangeText={(t) => set(t.replace(/[^0-9]/g, '').slice(0, 2))} style={s.timeInput} />
                  </View>
                </React.Fragment>
              ))}
            </View>
            <ErrorBox error={error} />
            <Primary busy={busy} label={mode === 'create' ? 'Create wallet' : 'Import wallet'} onPress={() => void submitTime()} />
          </View>
        )}

        {step === 'creating' && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={C.green} />
            <Text style={s.title}>{mode === 'create' ? 'Creating your wallet…' : 'Importing your wallet…'}</Text>
            <Text style={s.help}>Securing your keys on this phone. This can take a little while. Please keep the app open.</Text>
            {mode === 'create' ? <Text style={s.stage}>{stage}</Text> : null}
            <Text style={s.timer}>{elapsed}s</Text>
            <Text style={s.fine}>If the step number stays the same for more than 3 minutes, take a photo of this screen and send it to your developer.</Text>
          </View>
        )}

        {step === 'backup' && (
          <View>
            <Text style={s.title}>Your Secret Recovery Phrase</Text>
            <Text style={s.help}>Write these {words.length} words down, in order, on paper. Anyone with them can take your funds, and if you lose them nobody can help you get your wallet back. Never share or photograph them.</Text>
            <View style={s.grid}>
              {words.map((w, i) => (
                <View key={i} style={s.wordCell}><Text style={s.wordNum}>{i + 1}</Text><Text style={s.word}>{revealed ? w : '••••••'}</Text></View>
              ))}
            </View>
            <Pressable onPress={() => setRevealed(!revealed)} style={s.secondary}><Text style={s.secondaryText}>{revealed ? 'Hide phrase' : 'Tap to reveal phrase'}</Text></Pressable>
            <View style={{ height: 12 }} />
            <Primary busy={busy} label="I have written it down" onPress={() => { setRevealed(false); setStep('confirm'); }} disabled={!revealed && words.length === 0} />
          </View>
        )}

        {step === 'confirm' && (
          <View>
            <Text style={s.title}>Confirm your phrase</Text>
            <Text style={s.help}>Type the words below to prove you saved them. Use “Back” if you need another look.</Text>
            {quiz.map((index, i) => (
              <TextInput key={index} accessibilityLabel={`Word number ${index + 1}`} autoCapitalize="none" autoCorrect={false}
                value={answers[i]} onChangeText={(t) => setAnswers(answers.map((a, j) => (j === i ? t : a)))}
                placeholder={`Word #${index + 1}`} placeholderTextColor={C.muted2} style={s.input} />
            ))}
            <ErrorBox error={error} />
            <Primary busy={busy} label="Confirm" onPress={submitConfirm} />
          </View>
        )}

        {step === 'done' && (
          <View style={s.center}>
            <Text style={s.bigCheck}>✓</Text>
            <Text style={s.title}>Your wallet is ready</Text>
            <Text style={s.help}>{mode === 'create' ? 'Your phrase is confirmed. ' : ''}You are on the Bitcoin testnet, so everything here uses free test coins.</Text>
            <ErrorBox error={error} />
            <Primary busy={busy} label={busy ? 'Opening…' : 'Open my wallet'} onPress={() => void openWallet()} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 14, minHeight: 44 },
  backText: { color: C.blue, fontSize: 16, fontWeight: '700' },
  stepText: { color: C.muted2, fontSize: 12 },
  body: { flexGrow: 1, padding: 22, paddingBottom: 48 },
  center: { alignItems: 'center', paddingTop: 24 },
  brand: { color: '#fff', fontSize: 40, fontWeight: '900', marginTop: 14 },
  lead: { color: C.muted, fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 23 },
  testnetPill: { marginTop: 18, borderWidth: 1, borderColor: C.orange, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  testnetText: { color: C.orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  stack: { alignSelf: 'stretch', marginTop: 36, gap: 12 },
  fine: { color: C.muted2, fontSize: 12, textAlign: 'center', marginTop: 26, lineHeight: 18 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 12, marginBottom: 8, textAlign: 'left' },
  help: { color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 18 },
  input: { minHeight: 52, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.panel2, color: '#fff', paddingHorizontal: 14, fontSize: 16, marginBottom: 12 },
  phraseInput: { minHeight: 130, paddingTop: 14, textAlignVertical: 'top' },
  link: { color: C.blue, fontSize: 14, marginBottom: 14 },
  check: { color: C.muted2, fontSize: 14, marginBottom: 6 },
  checkOk: { color: C.green },
  primary: { minHeight: 54, borderRadius: 999, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryOff: { opacity: 0.45 },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secondary: { minHeight: 54, borderRadius: 999, borderWidth: 1.5, borderColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: C.blue, fontSize: 16, fontWeight: '800' },
  errorBox: { borderWidth: 1, borderColor: C.red, backgroundColor: 'rgba(255,75,75,.12)', borderRadius: 12, padding: 12, marginTop: 6 },
  errorText: { color: '#ff9a9a', fontSize: 14, lineHeight: 20 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  timeCell: { flex: 1 },
  timeLabel: { color: C.muted2, fontSize: 11, textAlign: 'center', marginBottom: 6 },
  timeInput: { minHeight: 64, borderWidth: 1.5, borderColor: C.green, borderRadius: 12, backgroundColor: C.panel2, color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  colon: { color: '#fff', fontSize: 28, marginHorizontal: 8, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  wordCell: { width: '31%', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.borderSoft, backgroundColor: C.panel2, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10 },
  wordNum: { color: C.muted2, fontSize: 12, width: 20 },
  word: { color: '#fff', fontSize: 15, fontWeight: '700' },
  stage: { color: C.green, fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  timer: { color: C.muted2, fontSize: 14, marginTop: 8 },
  bigCheck: { color: C.green, fontSize: 64, fontWeight: '900' },
});

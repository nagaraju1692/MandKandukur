import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import BottomNav from './BottomNav';
import MobileHeader from './MobileHeader';
import { useLanguage } from '../context/LanguageContext';
import { useSubmittedListings } from '../context/SubmittedListingsContext';
import FocusTextInput from '../ui/FocusTextInput';

export default function Profile({ navigation }: any) {
  const { user, isLoggedIn, favorites, login, logout } = useAuth();
  const { listings } = useSubmittedListings();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ name?: string; phone?: string }>({});
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activityRows = useMemo(() => [
    { id: 'reviews', icon: '★', label: t('My reviews', 'నా సమీక్షలు'), count: '0' },
    { id: 'favorites', icon: '♥', label: t('My favorites', 'నా ఇష్టమైనవి'), count: String(favorites.length) },
    { id: 'recent', icon: '⌖', label: t('Recently viewed', 'ఇటీవల చూసినవి'), count: '' },
  ], [favorites.length, t]);

  const handleLogin = async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    const nextErrors: { name?: string; phone?: string } = {};
    if (!/^[6-9]\d{9}$/.test(trimmedPhone.replace(/\D/g, ''))) nextErrors.phone = t('Enter a valid 10-digit mobile number.', 'చెల్లుబాటు అయ్యే 10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి.');
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setLoginError('');
    try {
      await login({ name: trimmedName, phone: trimmedPhone.replace(/\D/g, '') });
      setName('');
      setPhone('');
    } catch (error) {
      const message = error instanceof Error && error.message.includes('400')
        ? t('Enter your name to create a new profile.', 'కొత్త ప్రొఫైల్ సృష్టించడానికి మీ పేరు నమోదు చేయండి.')
        : t('Unable to sign in. Check your connection and try again.', 'సైన్ ఇన్ చేయడం సాధ్యపడలేదు. కనెక్షన్‌ని తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.')
      setLoginError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert(t('Logged out', 'లాగ్ అవుట్ అయ్యారు'), t('You have logged out successfully.', 'మీరు విజయవంతంగా లాగ్ అవుట్ అయ్యారు.'));
    } catch {
      Alert.alert(t('Logout failed', 'లాగ్ అవుట్ విఫలమైంది'), t('Unable to log out right now. Please try again.', 'ప్రస్తుతం లాగ్ అవుట్ చేయలేకపోయాం. దయచేసి మళ్లీ ప్రయత్నించండి.'));
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.screen}>
        <MobileHeader navigation={navigation} />
        <View style={styles.pageHeader}>
          <View style={styles.pageHeaderLeft}>
            <Pressable style={styles.pageBack} onPress={() => navigation.goBack()}><Text style={styles.pageBackText}>←</Text></Pressable>
            <View>
              <Text style={styles.pageKicker}>{t('ACCOUNT', 'ఖాతా')}</Text>
              <Text style={styles.pageTitle}>{t('Profile', 'ప్రొఫైల్')}</Text>
            </View>
          </View>
          <Pressable style={styles.settings} onPress={() => Alert.alert(t('Profile settings', 'ప్రొఫైల్ సెట్టింగ్స్'), t('Profile settings will be available soon.', 'ప్రొఫైల్ సెట్టింగ్స్ త్వరలో అందుబాటులో ఉంటాయి.'))}><Text style={styles.settingsText}>⚙</Text></Pressable>
        </View>

        <View style={styles.guestCard}>
          <View style={styles.loginEmblem}><Text style={styles.loginEmblemText}>MK</Text></View>
          <Text style={styles.guestTitle}>Mana Kandukur</Text>
          <Text style={styles.guestCopy}>{t('Discover everything local', 'స్థానిక సమాచారం అంతా తెలుసుకోండి')}</Text>

          <Text style={styles.fieldLabel}>{t('Your name (new users only)', 'మీ పేరు (కొత్త వినియోగదారులకు మాత్రమే)')}</Text>
          <FocusTextInput
            style={[styles.input, loginErrors.name && styles.inputError]}
            placeholder={t('Your name', 'మీ పేరు')}
            value={name}
            onChangeText={(value) => { setName(value); setLoginError(''); }}
            autoCapitalize="words"
          />
          {loginErrors.name && <Text style={styles.errorText}>{loginErrors.name}</Text>}
          <Text style={styles.fieldLabel}>{t('Mobile number', 'మొబైల్ నంబర్')} *</Text>
          <FocusTextInput
            style={[styles.input, loginErrors.phone && styles.inputError]}
            placeholder={t('Mobile number', 'మొబైల్ నంబర్')}
            value={phone}
            onChangeText={(value) => { setPhone(value); if (loginErrors.phone) setLoginErrors((current) => ({ ...current, phone: undefined })); }}
            keyboardType="phone-pad"
          />
          {loginErrors.phone && <Text style={styles.errorText}>{loginErrors.phone}</Text>}
          {loginError && <Text style={styles.errorText}>{loginError}</Text>}

          <Pressable style={[styles.primaryButton, isSubmitting && styles.disabledButton]} disabled={isSubmitting} onPress={handleLogin}>
            <Text style={styles.primaryButtonText}>{isSubmitting ? t('Signing in...', 'సైన్ ఇన్ అవుతోంది...') : t('Continue', 'కొనసాగించండి')}</Text>
          </Pressable>
          <Text style={styles.terms}>{t('By continuing, you agree to our Terms & Privacy Policy.', 'కొనసాగించడం ద్వారా నిబంధనలు మరియు గోప్యతా విధానాన్ని అంగీకరిస్తున్నారు.')}</Text>
        </View>
        <BottomNav navigation={navigation} active="Profile" />
      </View>
    );
  }

  const displayName = user?.name || 'Guest user';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <MobileHeader navigation={navigation} />
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderLeft}>
          <Pressable style={styles.pageBack} onPress={() => navigation.goBack()}><Text style={styles.pageBackText}>←</Text></Pressable>
          <View>
            <Text style={styles.pageKicker}>{t('ACCOUNT', 'ఖాతా')}</Text>
            <Text style={styles.pageTitle}>{t('Profile', 'ప్రొఫైల్')}</Text>
          </View>
        </View>
        <Pressable style={styles.settings} onPress={() => Alert.alert(t('Profile settings', 'ప్రొఫైల్ సెట్టింగ్స్'), t('Profile settings will be available soon.', 'ప్రొఫైల్ సెట్టింగ్స్ త్వరలో అందుబాటులో ఉంటాయి.'))}><Text style={styles.settingsText}>⚙</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
      <View style={styles.identity}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={styles.identityText}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <Text style={styles.location}>⌖ {t('Kandukur, Andhra Pradesh', 'కందుకూరు, ఆంధ్రప్రదేశ్')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('My activity', 'నా కార్యకలాపాలు')}</Text>
        <View style={styles.list}>
          {activityRows.map((row) => (
            <Pressable key={row.id} style={styles.row} onPress={() => navigation.navigate(row.id === 'favorites' ? 'Favorites' : 'Categories')}>
              <Text style={styles.rowIcon}>{row.icon}</Text>
              <Text style={styles.rowText}>{row.label}</Text>
              {row.count ? <Text style={styles.rowCount}>{row.count}</Text> : null}
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('More', 'మరిన్ని')}</Text>
        <View style={styles.list}>
          {[
            { label: t('Submit a business', 'వ్యాపారాన్ని సమర్పించండి'), icon: '＋', action: () => navigation.navigate('SubmitBusiness') },
            { label: t('About Mana Kandukur', 'మనా కందుకూరు గురించి'), icon: 'i', action: () => navigation.navigate('About') },
            { label: t('Feedback & complaints', 'అభిప్రాయం మరియు ఫిర్యాదులు'), icon: '?', action: () => navigation.navigate('Feedback') },
            { label: t('Logout', 'లాగ్ అవుట్'), icon: '↪', action: handleLogout, danger: true },
          ].map((item) => (
            <Pressable
              key={item.label}
              style={[styles.row, item.danger && styles.dangerRow]}
              onPress={item.action}
            >
              <Text style={[styles.rowIcon, item.danger && styles.dangerIcon]}>{item.icon}</Text>
              <Text style={[styles.rowText, item.danger && styles.dangerText]}>{item.label}</Text>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </View>
      </ScrollView>
      <BottomNav navigation={navigation} active="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 88,
    backgroundColor: '#EAEAF9',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    backgroundColor: '#4A4AD5',
  },
  pageHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#EFEAFE' },
  pageHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  pageBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 18, backgroundColor: '#E1D9FF' },
  pageBackText: { color: '#4A4AD5', fontSize: 22, lineHeight: 24, textAlign: 'center' },
  pageKicker: { marginBottom: 3, color: '#5B52D1', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  pageTitle: { color: '#2F2F43', fontSize: 22, fontWeight: '800', lineHeight: 25 },
  settings: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 0, borderRadius: 18, backgroundColor: '#E1D9FF' },
  settingsText: { color: '#4A4AD5', fontSize: 17, lineHeight: 20 },
  kicker: {
    color: '#D8D7FF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    marginTop: 4,
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  guestCard: {
    marginHorizontal: 16,
    marginTop: 22,
    padding: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6E8F5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#4A4AD5',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  loginEmblem: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12, borderRadius: 16, backgroundColor: '#514BD5' },
  loginEmblemText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  guestTitle: {
    color: '#1F2235',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  guestCopy: {
    marginTop: 8,
    color: '#656D85',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  fieldLabel: { marginTop: 16, marginBottom: -8, color: '#47506A', fontSize: 11, fontWeight: '800' },
  input: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E7F3',
    backgroundColor: '#F8F9FF',
    fontSize: 14,
    color: '#1F2235',
  },
  inputError: { borderColor: '#D65360', backgroundColor: '#FFF7F7' },
  errorText: { marginTop: 4, color: '#C7414F', fontSize: 11, lineHeight: 15 },
  primaryButton: {
    marginTop: 18,
    minWidth: 120,
    minHeight: 36,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCCFE0',
    backgroundColor: '#1A061D',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  disabledButton: { opacity: 0.55 },
  terms: { marginTop: 12, color: '#7A8195', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E8F2',
  },
  profileContent: {
    paddingBottom: 110,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A43D8',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
  identityText: {
    marginLeft: 13,
    flex: 1,
  },
  name: {
    color: '#1F2235',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  phone: {
    marginTop: 2,
    color: '#5F6881',
    fontSize: 12,
    fontWeight: '600',
  },
  location: {
    marginTop: 4,
    color: '#6F778A',
    fontSize: 11,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#1F2235',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 6,
  },
  list: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E5F1',
    backgroundColor: '#FFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  rowIcon: {
    width: 24,
    marginRight: 12,
    color: '#5A53D7',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
    color: '#1F2235',
    fontSize: 16,
    fontWeight: '700',
  },
  rowCount: {
    color: '#5A53D7',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 10,
  },
  arrow: {
    color: '#A7A9B6',
    fontSize: 24,
    fontWeight: '400',
    textAlign: 'right',
  },
  dangerRow: {
    backgroundColor: '#FFF',
  },
  dangerText: {
    color: '#D85A65',
  },
  dangerIcon: {
    color: '#D85A65',
  },
  submissionCopy: { flex: 1 },
  submissionStatus: { marginTop: 3, color: '#C95E49', fontSize: 11, fontWeight: '700' },
});
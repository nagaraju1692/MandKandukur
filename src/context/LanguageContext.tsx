import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

type Language = 'en' | 'te'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (english: string, telugu: string) => string
  category: (name: string) => string
  businessName: (name: string, nameTe?: string) => string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const categoryTranslations: Record<string, string> = {
  Education: 'విద్య', 'Education & Institutions': 'విద్యా సంస్థలు', Health: 'ఆరోగ్యం', Hospitals: 'ఆసుపత్రులు', 'Hospitals & Clinics': 'ఆసుపత్రులు మరియు క్లినిక్‌లు', 'Medical shops': 'మెడికల్ షాపులు', 'Medical Shops': 'మెడికల్ షాపులు', 'Diagnostic Lab Centers': 'డయాగ్నస్టిక్ ల్యాబ్ కేంద్రాలు', 'Radiology Scan Centers': 'రేడియాలజీ స్కాన్ కేంద్రాలు', Restaurants: 'రెస్టారెంట్‌లు', 'Restaurants & Hotels': 'రెస్టారెంట్‌లు & హోటళ్లు',
  Lodges: 'లాడ్జీలు', 'Bus stand': 'బస్ స్టాండ్', 'Police station': 'పోలీస్ స్టేషన్', 'Police Station': 'పోలీస్ స్టేషన్', '108 Emergency': '108 అత్యవసర సేవ', 'Fire Station': 'అగ్నిమాపక కేంద్రం', Emergency: 'అత్యవసర సేవలు', Temples: 'దేవాలయాలు',
  Banks: 'బ్యాంకులు', 'Beauty clinics': 'బ్యూటీ క్లినిక్స్', 'Movie Theaters': 'సినిమా థియేటర్లు',
  'Shopping clothes': 'బట్టల షాపులు', 'Retail marts': 'రిటైల్ మార్ట్స్', 'Wine shops': 'వైన్ షాపులు',
  'Jewellery shops': 'జువెలరీ షాపులు', RealEstate: 'రియల్ ఎస్టేట్', 'ATM machines': 'ఏటీఎం కేంద్రాలు',
  'Agricultural info': 'వ్యవసాయ సమాచారం', 'Engineering colleges': 'ఇంజనీరింగ్ కాలేజీలు', 'Degree colleges': 'డిగ్రీ కాలేజీలు',
  'Training Institutions': 'శిక్షణా సంస్థలు', 'Computer Training': 'కంప్యూటర్ శిక్షణ', 'Spoken English': 'స్పోకెన్ ఇంగ్లీష్', 'Driving Schools': 'డ్రైవింగ్ పాఠశాలలు', 'Skill Development': 'నైపుణ్య అభివృద్ధి',
  Intermediate: 'ఇంటర్మీడియట్', 'Polytechnic colleges': 'పాలిటెక్నిక్ కాలేజీలు', Schools: 'పాఠశాలలు',
  'Real Estate': 'రియల్ ఎస్టేట్', Agriculture: 'వ్యవసాయం', 'Food & Meat Markets': 'ఆహార మరియు మాంసం మార్కెట్లు', 'Rental Transport': 'అద్దె రవాణా', 'Rental Houses': 'అద్దె ఇళ్లు', 'Construction Materials': 'నిర్మాణ సామగ్రి',
  'Plot for Sale': 'అమ్మకానికి ప్లాట్', 'House or Apartment for Sale': 'అమ్మకానికి ఇల్లు లేదా అపార్ట్‌మెంట్', 'Land for Sale': 'అమ్మకానికి భూమి',
  'Fish Markets': 'చేపల మార్కెట్లు', 'Fruit Markets': 'పండ్ల మార్కెట్లు', 'Tobacco Boards': 'పొగాకు బోర్డులు', 'Vegetable Markets': 'కూరగాయల మార్కెట్లు',
  'Cars for Rent': 'అద్దె కార్లు', 'Autos for Rent': 'అద్దె ఆటోలు', 'Lorries for Rent': 'అద్దె లారీలు', 'Tractors for Rent': 'అద్దె ట్రాక్టర్లు', 'JCBs for Rent': 'అద్దె జేసీబీలు',
  'Common Utilities': 'సాధారణ సౌకర్యాలు', 'ATM Centers': 'ఏటీఎం కేంద్రాలు', 'Petrol Pumps': 'పెట్రోల్ బంకులు', 'Gas Centers': 'గ్యాస్ కేంద్రాలు', 'EV Charging Stations': 'ఈవీ ఛార్జింగ్ కేంద్రాలు', 'Public Toilets': 'ప్రజా మరుగుదొడ్లు',
  'Buy & Sell': 'కొనుగోలు మరియు అమ్మకం', 'Cars for Sale': 'అమ్మకానికి కార్లు', 'Bikes for Sale': 'అమ్మకానికి బైకులు', 'Tractors for Sale': 'అమ్మకానికి ట్రాక్టర్లు', 'Other Items for Sale': 'అమ్మకానికి ఇతర వస్తువులు',
  'Government Offices': 'ప్రభుత్వ కార్యాలయాలు', 'Manpower Services': 'మ్యాన్‌పవర్ సేవలు', 'Show Rooms': 'షోరూమ్‌లు', 'Bike & Car Mechanics': 'బైక్ మరియు కార్ మెకానిక్స్', 'Tourist Places': 'పర్యాటక ప్రదేశాలు', 'Cold Storages': 'కోల్డ్ స్టోరేజీలు',
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  useEffect(() => {
    AsyncStorage.getItem('mana-kandukur-mobile-language').then((saved) => {
      if (saved === 'en' || saved === 'te') setLanguage(saved)
    }).catch(() => undefined)
  }, [])
  useEffect(() => {
    AsyncStorage.setItem('mana-kandukur-mobile-language', language).catch(() => undefined)
  }, [language])
  const value = useMemo(() => ({ language, setLanguage, t: (english: string, telugu: string) => language === 'te' ? telugu : english, category: (name: string) => {
    const displayName = ({
      Education: 'Education & Institutions',
      'Education & Training': 'Education & Sports Training Centers',
      Hospitals: 'Hospitals & Clinics',
      'Medical shops': 'Medical Shops',
      Restaurants: 'Restaurants & Hotels',
      'Restarent & Hotals': 'Restaurants & Hotels',
      'Restaurants & Hotals': 'Restaurants & Hotels',
      'Hospitals & clincs': 'Hospitals & Clinics',
      'Hospitals & Clincs': 'Hospitals & Clinics',
      'Bus stand': 'APSRTC Bus Stand',
    } as Record<string, string>)[name] || name
    return language === 'te' ? categoryTranslations[displayName] || displayName : displayName
  }, businessName: (name: string, nameTe?: string) => language === 'te' && nameTe ? nameTe : name }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

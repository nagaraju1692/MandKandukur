export type Announcement = {
  id: string
  type: 'movie' | 'shop'
  title: string
  titleTe: string
  date: string
  dateTe: string
  location: string
  locationTe: string
  summary: string
  details: string
  detailsTe: string
  image: string
}

export const announcements: Announcement[] = [
  {
    id: 'movie-raghava-premiere',
    type: 'movie',
    title: 'New movie at Raghava Multiplex',
    titleTe: 'రాఘవ మల్టీప్లెక్స్‌లో కొత్త సినిమా',
    date: 'Opening this Friday',
    dateTe: 'ఈ శుక్రవారం ప్రారంభం',
    location: 'Raghava Multiplex, Kandukur',
    locationTe: 'రాఘవ మల్టీప్లెక్స్, కందుకూరు',
    summary: 'The latest Telugu release is coming to Kandukur screens.',
    details: 'Book your seats for the new Telugu movie releasing this Friday at Raghava Multiplex. Show timings and ticket availability will be updated by the theatre.',
    detailsTe: 'ఈ శుక్రవారం రాఘవ మల్టీప్లెక్స్‌లో విడుదల కానున్న కొత్త తెలుగు సినిమాకు సీట్లు బుక్ చేసుకోండి. షో సమయాలు మరియు టికెట్ లభ్యతను థియేటర్ అప్‌డేట్ చేస్తుంది.',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'movie-yuvaraj-show',
    type: 'movie',
    title: 'New show at Yuvaraj Theatre',
    titleTe: 'యువరాజ్ థియేటర్‌లో కొత్త షో',
    date: 'Coming soon',
    dateTe: 'త్వరలో రాబోతోంది',
    location: 'Pedda Bazar, Kandukur',
    locationTe: 'పెద్ద బజార్, కందుకూరు',
    summary: 'A new movie screening is coming to Yuvaraj Theatre.',
    details: 'Yuvaraj Theatre in Pedda Bazar is preparing a new movie screening. Check the theatre listing for showtimes and ticket details before you travel.',
    detailsTe: 'పెద్ద బజార్‌లోని యువరాజ్ థియేటర్‌లో కొత్త సినిమా ప్రదర్శనకు సిద్ధమవుతోంది. ప్రయాణానికి ముందు షో సమయాలు మరియు టికెట్ వివరాలను పరిశీలించండి.',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'shop-fresh-mart',
    type: 'shop',
    title: 'Fresh Mart opening soon',
    titleTe: 'ఫ్రెష్ మార్ట్ త్వరలో ప్రారంభం',
    date: 'Opening next week',
    dateTe: 'వచ్చే వారం ప్రారంభం',
    location: 'Market Road, Kandukur',
    locationTe: 'మార్కెట్ రోడ్, కందుకూరు',
    summary: 'A new grocery and daily-needs shop is opening locally.',
    details: 'Fresh Mart is opening on Market Road with groceries, household supplies, and everyday essentials for nearby families.',
    detailsTe: 'మార్కెట్ రోడ్‌లో ఫ్రెష్ మార్ట్ ప్రారంభం కానుంది. ఇక్కడ కిరాణా, గృహోపకరణాలు మరియు రోజువారీ అవసరాలు లభిస్తాయి.',
    image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'shop-style-studio',
    type: 'shop',
    title: 'New Style Studio opening',
    titleTe: 'కొత్త స్టైల్ స్టూడియో ప్రారంభం',
    date: 'Opening this month',
    dateTe: 'ఈ నెలలో ప్రారంభం',
    location: 'Pamuru Road, Kandukur',
    locationTe: 'పామూరు రోడ్, కందుకూరు',
    summary: 'A new fashion and accessories shop is coming to Pamuru Road.',
    details: 'Style Studio will offer clothing, accessories, and seasonal collections from its new Pamuru Road location in Kandukur.',
    detailsTe: 'కందుకూరులోని కొత్త పామూరు రోడ్ ప్రదేశంలో స్టైల్ స్టూడియో దుస్తులు, యాక్సెసరీలు మరియు సీజనల్ కలెక్షన్లను అందిస్తుంది.',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80',
  },
]

import kvKandukurGallery from '../images/kv-kandukur-gallery.jpeg'
import narayanaOlympiadSchool from '../images/narayana-olympiad-school.jpg'
import pecCampus from '../images/pec-campus.jpg'
import gayatriDegreeCampus from '../images/gayatri-campus-candidate.jpg'
import sriGouthamHighSchool from '../images/sri-goutham-high-school.jpg'
import sriSamskrutiSchool from '../images/sri-samskruti-school.jpg'
import trrGdcCampus1 from '../images/TRR_GDC_campus1.jpg'
import trrGdcCampus2 from '../images/TRR_GDC_campus2.jpg'
import trrGdcGallery from '../images/trr-gdc-gallery.jpg'

export const categories = [
 { id: '1', name: 'Education', parentId: null },
  { id: 'edu-1', name: 'Engineering colleges', parentId: '1' },
  { id: 'edu-2', name: 'Degree colleges', parentId: '1' },
  { id: 'edu-3', name: 'Intermediate', parentId: '1' },
  { id: 'edu-4', name: 'Polytechnic colleges', parentId: '1' },
  { id: 'edu-5', name: 'Schools', parentId: '1' },
  { id: '2', name: 'Hospitals', parentId: null },
  { id: '3', name: 'Medical shops', parentId: null },
  { id: '4', name: 'Restaurants', parentId: null },
  { id: '6', name: 'Lodges', parentId: null },
  { id: '7', name: 'Bus stand', parentId: null },
  { id: '8', name: 'Police station', parentId: null },
  // { id: '9', name: 'Theaters', parentId: null }, -- removed, merged into 'Movie Theaters'
  { id: '10', name: 'Temples', parentId: null },
  { id: '11', name: 'Banks', parentId: null },
  { id: '12', name: 'Beauty clinics', parentId: null },
  { id: '13', name: 'Movie Theaters', parentId: null },
  { id: '14', name: 'Shopping clothes', parentId: null },
  { id: '15', name: 'Retail marts', parentId: null },
  { id: '16', name: 'Wine shops', parentId: null },
  { id: '17', name: 'Jewellery shops', parentId: null },
]

export const businesses = [
  {
    id: 'c1',
    name: 'TRR Government Degree College, Kandukur',
    categoryId: 'edu-2',
    categoryName: 'Degree colleges',
    address: 'Janardhan Colony, Kandukur, Andhra Pradesh - 523105',
    phone: '081061 99173',
    website: 'https://www.gdckandukur.ac.in',
    source: 'https://www.google.com/maps/search/?api=1&query=TRR+Government+Degree+College+Kandukur',
    description: 'Government degree college established in 1966, with arts, science, commerce and computer science departments.',
    image: trrGdcGallery,
    gallery: [
      trrGdcGallery,
      trrGdcCampus1,
      trrGdcCampus2
    ]
  },
  {
    id: 'c2',
    name: 'Sri Gayatri Vidya Parishad Junior & Degree Colleges',
    categoryId: 'edu-3',
    categoryName: 'Intermediate',
    address: 'Gayatri Degree College, 2-3-22, OV Road, Kandukur, Andhra Pradesh - 523105',
    phone: '098483 96271',
    website: '',
    source: 'https://www.google.com/maps/search/?api=1&query=Sri+Gayatri+Vidya+Parishad+Junior+Degree+Colleges+Kandukur',
    description: 'Junior and degree college listed on OV Road in Kandukur.',
  },
  {
    id: 'c3',
    name: 'Prakasam Engineering College, Kandukur',
    categoryId: 'edu-1',
    categoryName: 'Engineering colleges',
    address: '6VHF+2RF, Kanigiri Road, Kandukur, Andhra Pradesh – 523109',
    phone: '08598 222288',
    website: 'https://www.prakasamec.com/',
    source: 'https://www.google.com/maps/search/?api=1&query=Prakasam+Engineering+College+Kandukur',
    description: 'Established in 2001. The official site lists engineering programs, MBA and MCA; it is approved by AICTE and permanently affiliated to JNTUK.',
    image: pecCampus,
    gallery: [
      pecCampus,
      'https://www.prakasamec.com/_next/image?url=%2Fassets%2Fimg%2Flife%2F01.jpg&w=640&q=75',
      'https://www.prakasamec.com/_next/image?url=%2Fassets%2Fimg%2Flife%2F02.jpg&w=640&q=75'
    ]
  },
  {
    id: 'c4',
    name: 'Government Polytechnic College, Kandukur',
    categoryId: 'edu-4',
    categoryName: 'Polytechnic colleges',
    address: 'Beside TRR Degree & Junior Colleges, Uppucheruvu Road, Kandukur, SPSR Nellore District – 523105',
    phone: '08598-222245',
    website: 'https://govtpolykandukur.ac.in/',
    source: 'https://www.google.com/maps/search/?api=1&query=Government+Polytechnic+College+Kandukur',
    description: 'Government diploma college affiliated to the State Board of Technical Education and Training, AP. The official site lists Civil Engineering and Electrical & Electronics Engineering departments.',
  },
  {
    id: 'c5',
    name: 'Narayana Olympiad School, Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: 'Kovuru Road, near Bus Stand, Balaramaiah Thota, Kandukur, Andhra Pradesh - 523105',
    phone: '081798 80340',
    website: '',
    source: 'https://www.google.com/maps/search/?api=1&query=Narayana+Olympiad+School+Kandukur',
    description: 'School listed near the Kandukur bus stand on Kovuru Road.',
    image: narayanaOlympiadSchool,
    gallery: [narayanaOlympiadSchool],
  },
  {
    id: 'c6',
    name: 'Vignan Vihar EM School, Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: 'Balaramaiah Thota, Sai Nagar, Kandukur, Andhra Pradesh - 523105',
    phone: '083097 11321',
    website: '',
    source: 'https://www.google.com/maps/search/?api=1&query=Vignan+Vihar+EM+School+Kandukur',
    description: 'English-medium school listed in Sai Nagar, Kandukur.',
  },
  {
    id: 'c7',
    name: 'Kendriya Vidyalaya Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: 'Chuttugunta Road, Kandukur, Andhra Pradesh - 523105',
    phone: '',
    website: 'https://kandukurtown.kvs.ac.in/',
    source: 'https://www.google.com/maps/search/?api=1&query=Kendriya+Vidyalaya+Kandukur',
    description: 'Kendriya Vidyalaya school in Kandukur with an official school website.',
    image: kvKandukurGallery,
    gallery: [kvKandukurGallery],
  },
  {
    id: 'h3',
    name: 'Dr. Kota Reddy Multi Speciality Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '6-2/4C, Kandukur, Prakasam District',
    phone: '08594-223344',
    website: 'https://www.kotareddymultispeciality.com',
    description: 'A multi-specialty hospital with emergency care, diagnostics and specialist consultations for families and travellers.',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h4',
    name: 'Sarada Nursing Home',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Front garden, Kandukur',
    phone: '08594-332211',
    website: 'https://www.saradanursinghome.com',
    description: 'Long-standing nursing home and care center focused on maternal support, treatment, and community patient care.',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h5',
    name: 'Pranavi Children\'s Hospital & Eye Care',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Kovur Road, Kandukur',
    phone: '08594-556677',
    website: 'https://www.pranavihospital.com',
    description: 'Child-friendly care center and eye treatment facility serving local families with pediatric and eye care services.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h6',
    name: 'Sakthi Children\'s Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Opposite Municipal Office, Kandukur',
    phone: '08594-667788',
    website: 'https://www.sakthihospital.in',
    description: 'Pediatric hospital offering compassionate and affordable care for children, newborns and family wellness checks.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h7',
    name: 'Harish ENT Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Rural Police Station Area, Kandukur',
    phone: '072078 83551',
    website: 'https://www.harishenthospital.com',
    description: 'Specialist ENT care and hearing treatment center serving local families with trusted clinical support and consultation.',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h8',
    name: 'Sultan Mohiuddin Nursing Home',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'OV Rd, beside ZPHS Boys High School, Kandukur',
    phone: '08594-556677',
    website: 'https://www.sultanmohiuddinnursinghome.com',
    description: 'Care-focused nursing home offering patient support, nursing assistance and community health services for families.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h9',
    name: 'Muppa Roshaiah Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '6W83+H2W, Unnamed Road, Kandukur',
    phone: '08594-102030',
    website: 'https://www.mupparoshaiahhospital.com',
    description: 'General hospital providing regular checkups, emergency care and basic treatment for patients in and around Kandukur.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h10',
    name: 'Babu Dental Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Pamuru Rd, beside Rajmahal theatre, Kandukur',
    phone: '097042 29777',
    website: 'https://www.babudentalhospital.com',
    description: 'Dental care and oral health clinic with restorative, hygiene, and family dental services for everyday care needs.',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h11',
    name: 'Royal Multispeciality Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Ongole, Andhra Pradesh',
    phone: '08594-334455',
    website: 'https://www.royalmultispeciality.com',
    description: 'Multi-specialty hospital offering specialist consultations, diagnostics, and full-time treatment services for local and regional patients.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h12',
    name: 'Jaya bharath multispeciality hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Kandukur, Andhra Pradesh',
    phone: '098661 16121',
    website: 'https://www.jayabharathhospital.com',
    description: 'Multi-specialty healthcare center offering emergency support, diagnostic services, and quality treatment for families in and around Kandukur.',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h13',
    name: 'Harini hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '523105, 523105, Kandukur',
    phone: '098996 04693',
    website: 'https://www.harinihospital.com',
    description: 'Local hospital providing essential treatment, consultation, and family support services with a caring approach to patient health.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h14',
    name: 'Saahithi Multispeciality Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '6W73+W37, Kandukur',
    phone: '08594-98765',
    website: 'https://www.saahithihospital.com',
    description: 'Comprehensive multi-speciality treatment center delivering diagnosis, specialist care, and supportive recovery services.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h15',
    name: 'Venkiah naidu child hospital and vaccination',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'Kandukur - Gudluru Rd, Kandukur',
    phone: '08594-99876',
    website: 'https://www.venkaiahnaiduhospital.com',
    description: 'Child-focused healthcare and vaccination center devoted to pediatric wellness, immunization, and family care support.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h16',
    name: 'Dr Dhanyasi Malakondaiah Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '6W62+9P6, Kandukur',
    phone: '085982 22706',
    website: 'https://www.drdhanyasihospital.com',
    description: 'Primary healthcare and treatment center with routine care, diagnostics, and patient support for the local community.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h17',
    name: 'Mother hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'old LIC building, near government hospital, Kandukur',
    phone: '08594-112233',
    website: 'https://www.motherhospital.com',
    description: 'Community care hospital focused on general treatment, maternity support, and accessible healthcare for families.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h18',
    name: 'New Life Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '6V8X+W9Q, Kandukur',
    phone: '08594-778899',
    website: 'https://www.newlifehospital.in',
    description: 'Patient-centered clinic offering general checkups, care services, and a dependable healthcare experience for the local community.',
    image: 'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h19',
    name: 'SANKALPA HOSPITAL',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '10-2-72, 10-2-72, Kandukur',
    phone: '085982 95522',
    website: 'https://www.sankalpathospital.com',
    description: 'General and maternity healthcare service with compassionate doctors, emergency support, and focused family care.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h20',
    name: 'Suraksha Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: 'OV Rd, opposite Town Church, Kandukur',
    phone: '08594-99881',
    website: 'https://www.surakshahospital.in',
    description: 'Caring hospital with patient-focused treatment, medical consultations, and reliable support for emergency and family care.',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h21',
    name: 'Ajmal Hospital',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '6W65+C7C, hospital road, Kandukur',
    phone: '085982 3250',
    website: 'https://www.ajmalhospital.com',
    description: 'Family healthcare and hospital service known for attentive treatment, basic emergency support, and consistent patient care.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'h22',
    name: 'District Government Hospital Kandukur',
    categoryId: '2',
    categoryName: 'Hospitals',
    address: '6W72+7HX, Kandukur',
    phone: '08594-224466',
    website: 'https://www.dghkandukur.com',
    description: 'Government healthcare center providing accessible public care, emergency support, and regular patient treatment services.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm1',
    name: 'Keerthi Medical Stores',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Kandukur, Andhra Pradesh',
    phone: '094939 43418',
    website: 'https://www.keerthimedicalstores.com',
    description: 'A trusted medical supply store offering medicines, health essentials, and dependable local service for everyday needs.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm2',
    name: 'MedPlus Ramalayam Street Kandukur',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Ramalayam Street, Kandukur',
    phone: '098765 43210',
    website: 'https://www.medplus.in',
    description: 'Pharmacy and health store with a broad range of medicines, personal care products, and fast in-store assistance.',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm3',
    name: 'Kandukur Medicals General Pharmacy',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Shop No 158, Near Bus Stand, Kandukur',
    phone: '090000 69622',
    website: 'https://www.kandukurmedicals.com',
    description: 'General pharmacy serving the community with essential medicines, healthcare products, and personalized assistance.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm4',
    name: 'Sai Rekha Generic Medicals Kandukur',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'D, 20-4-98, Kandukur',
    phone: '088866 67713',
    website: 'https://www.sairekhageneric.com',
    description: 'Affordable generic medicines and daily health essentials with a focus on accessible and trusted care.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm5',
    name: 'RANGA MEDICAL STORES',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Kandukur, Andhra Pradesh',
    phone: '09800 345 1500',
    website: 'https://www.rangamedicalstores.com',
    description: 'Local medical retail outlet offering medicines and healthcare essentials with convenient community access.',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm6',
    name: 'Gouse Medical Shop',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Opp. Masjid Street, Kandukur',
    phone: '098842 73105',
    website: 'https://www.gousemedicalshop.com',
    description: 'Reliable neighborhood medical store with pharmacy essentials and prescribed medicines for family healthcare needs.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm7',
    name: 'Apollo Pharmacy Kandukur',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Guptas Plaza, No. 20/2/27, Kandukur',
    phone: '08594-998877',
    website: 'https://www.apollopharmacy.in',
    description: 'Pharmacy store offering branded medicines, health supplements, and daily wellness products in a convenient setup.',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm8',
    name: 'Sri Shirdi Sai Medical Shop',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Old Bank St, Kandukur',
    phone: '090108 63963',
    website: 'https://www.srishirdisaimedicalshop.com',
    description: 'Medical store known for dependable availability of medicines, wellness products, and quick local support.',
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm9',
    name: 'JAYABHARATH PHARMACY',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Pamuru Rd, Kandukur',
    phone: '08594-112233',
    website: 'https://www.jayabharathpharmacy.com',
    description: 'A reliable neighborhood pharmacy serving families with essential medicines and regular health supplies.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm10',
    name: 'DV MEDICAL AGENCIES',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Kanikirri Rd, opp. Corporation ATM, Kandukur',
    phone: '099949 007676',
    website: 'https://www.dvmedicalagencies.com',
    description: 'Medical agency and supply point known for dependable medicines and prompt service for local customers.',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm11',
    name: 'SREE RAMA MEDICAL AND FANCY',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: '6W73+J6J, Pamuru Rd, Kandukur',
    phone: '08594-887799',
    website: 'https://www.sreeramamedicalandfancy.com',
    description: 'Medical and fancy store serving the community with regular pharmaceutical needs and household essentials.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm12',
    name: 'MedPlus Lvpai Kandukur',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'S.V. No. 787, LVPai, Kandukur',
    phone: '08594-889900',
    website: 'https://www.medplus.in',
    description: 'Convenient local pharmacy with a range of medicines, healthcare items, and family wellness support.',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm13',
    name: 'Venkata Ravi Medical & General Stores',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: '6W86+VM2, Kandukur',
    phone: '099121 26156',
    website: 'https://www.venkataravimedical.com',
    description: 'General stores and medical supply outlet providing daily healthcare essentials and trusted assistance.',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm14',
    name: 'Ravi medical shop',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: '12-5-1, Kandukur',
    phone: '08594-223344',
    website: 'https://www.ravimedicalshop.com',
    description: 'Local pharmacy outlet offering quality medicines, healthcare items, and prompt neighborhood availability.',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm15',
    name: 'Somisetty Venkateswarulu medicals',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Old Bank St, Kandukur',
    phone: '098487 50271',
    website: 'https://www.somisettyvenkateswarulumedicals.com',
    description: 'Trusted pharmacy store with a wide range of Ayurvedic and general medicines for family care and routine treatment.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm16',
    name: 'Sri sai srinivasa medical and fancy',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: '6W62+VQG, Kandukur',
    phone: '08594-887766',
    website: 'https://www.srisaisrinivasamedical.com',
    description: 'Community pharmacy offering medical essentials, supplementary items, and dependable service in the local area.',
    image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm17',
    name: 'SARADA MEDICALS',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: '12-5-40/1, Old Bank St, Kandukur',
    phone: '098491 23646',
    website: 'https://www.saradamedicals.com',
    description: 'Medical retail shop known for regular pharmacy supplies, quick service, and experienced community support.',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm18',
    name: 'RANGA MEDICALS',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Shop 8, OV Rd, Kandukur',
    phone: '099492 35545',
    website: 'https://www.rangamedicals.com',
    description: 'Focused medical store serving local households with everyday medications and trusted health care products.',
    image: 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'm19',
    name: 'Anand Medical Shop',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Palukur, Andhra Pradesh',
    phone: '08594-778899',
    website: 'https://www.anandmedicalshop.com',
    description: 'Dependable medical sales outlet with a steady range of medicines and essential healthcare supplies.',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'ms1',
    name: 'Sri Lakshmi Medicals',
    categoryId: '3',
    categoryName: 'Medical shops',
    address: 'Kandukur Market Road',
    phone: '08594-250112',
    website: 'https://www.srilakshmimedicines.com',
    description: 'Reliable local pharmacy stocking prescription medicines, wellness products and everyday health essentials for the community.',
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1551190822-a9333d879b1f?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 't1',
    name: 'Lord Venkateswara Temple',
    categoryId: '10',
    categoryName: 'Temples',
    address: 'Temple Road, Kandukur',
    phone: '08594-250880',
    website: 'https://www.templesofandhra.com',
    description: 'A vibrant temple devoted to Lord Venkateswara with daily prayers, spiritual gatherings and major festival celebrations.',
    image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r1',
    name: 'Sai Sagar Grand Family Dining',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'New Bus Stand Road, Kandukur',
    phone: '08594-250333',
    website: 'https://www.saisagarrestaurant.in',
    description: 'A family-friendly restaurant serving Andhra meals, biryani, South Indian favourites and fresh vegetarian specialties.',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r2',
    name: 'V Grand Andhra Spice House',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Kandukur, Andhra Pradesh',
    phone: '08594-251111',
    website: 'https://www.vgrandrestaurant.in',
    description: 'Family-friendly restaurant serving authentic meals, biryani, and South Indian comfort food for local dining.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r3',
    name: 'Woodland Premium Family Kitchen',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'NH 167B, Kandukur',
    phone: '08594-256789',
    website: 'https://www.gottipatiskitchen.in',
    description: 'Popular kitchen known for Indian meals, quick bites and a relaxed family dining experience.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r4',
    name: 'Aha family restaurant kandukur Ac',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Prakasam colony, Kandukur',
    phone: '08594-252525',
    website: 'https://www.ahafamilyrestaurant.com',
    description: 'A casual dining spot serving family meals, vegetarian favorites, and affordable regional cuisine.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r5',
    name: 'Quality Food Court-Fish Andhra',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: '6W52+CF, Kandukur',
    phone: '08594-266666',
    website: 'https://www.qualityfoodcourt.com',
    description: 'Popular food court serving coastal Andhra-style fish dishes, family meals and quick snacks.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r6',
    name: 'Hotel Naidu grand family restaurant(A/C)',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Beside S. Petters English Medium High School, OV Rd',
    phone: '08594-288999',
    website: 'https://www.hotelnaidugrand.com',
    description: 'A/C family restaurant offering elegant dining, regular meals, and comfort food in a relaxed setting.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r7',
    name: 'Surya Bar and Restaurant A/C',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: '6W83+P26, Kandukur',
    phone: '08594-299111',
    website: 'https://www.suryabaranrestaurant.com',
    description: 'Comfortable dine-in restaurant with family seating, grilled specials and a relaxed evening atmosphere.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r8',
    name: 'Hotel Aditya Grand',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Pamuru Rd, Kandukur',
    phone: '08594-312345',
    website: 'https://www.hoteladityagrand.com',
    description: 'Modern hotel-style dining venue with spacious seating, meals, and a welcoming family-friendly environment.',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r9',
    name: 'Hangout cafe',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Divi Vari St, near narayana school, Kandukur',
    phone: '08594-345678',
    website: 'https://www.hangoutcafe.in',
    description: 'Casual cafe with snacks, beverages, and relaxed seating for family and student gatherings.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r10',
    name: 'Village Kitchen - Sari Sampradaaya Ruc...',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Kandukur, Telangana',
    phone: '08594-311222',
    website: 'https://www.villagekitchen.in',
    description: 'Traditional kitchen and restaurant focused on regional flavours and hearty family meals.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r11',
    name: 'Tasty food court',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Kandukur, Andhra Pradesh',
    phone: '08594-398888',
    website: 'https://www.tastyfoodcourt.in',
    description: 'Busy food court with quick bites, family meals, and casual dining with varied menu choices.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r12',
    name: 'Sri Laxmi Fastfoods & Meals',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: '2/72, Kovuru Rd, Kandukur',
    phone: '08594-377777',
    website: 'https://www.srilaxmifastfoods.com',
    description: 'Fastfood and meal stop offering convenient dining, snacks and daily specials for families and travellers.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r13',
    name: 'New WoodLand',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: '6V8X+WXW, Kandukur',
    phone: '08594-355599',
    website: 'https://www.newwoodland.in',
    description: 'Comfortable restaurant serving home-style meals and family dining in a simple and welcoming environment.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r14',
    name: 'Hotel Sarayu Grand',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Beside Government Hospital, near NTR Statue',
    phone: '08594-334455',
    website: 'https://www.hotelsarayugrand.com',
    description: 'Hotel-style food service offering breakfast, family meals and casual dining with a comfortable atmosphere.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r15',
    name: 'Swadist Family Restaurant & Dhaba',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Kandukur, Telangana',
    phone: '08594-321321',
    website: 'https://www.swadistfamilyrestaurant.com',
    description: 'Popular dining spot for family meals, dhaba-style recipes and comforting, affordable regional food.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r16',
    name: 'Hotel Sriram',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: '17-1-75, Kandukur - Gudluru Rd',
    phone: '08594-333333',
    website: 'https://www.hotelsriram.com',
    description: 'Well-known food hotel for travellers and families seeking affordable vegetarian meals and quick service.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r17',
    name: 'MRR Grand Restaurant',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Mohammadnagar, Telangana',
    phone: '08594-344444',
    website: 'https://www.mrrgrandrestaurant.com',
    description: 'Dining destination serving family meals, casual bites, and a pleasant atmosphere for everyday eating.',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r18',
    name: 'Five Star Chicken Kandukur',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'FiveStar Chicken Beside Raghava Multiplex, Kandukur',
    phone: '08594-366666',
    website: 'https://www.fivestarchicken.in',
    description: 'Fast-moving chicken restaurant serving crispy favourites, combo meals, and family quick bites.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r19',
    name: 'RGS Family Restaurant',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Kandukuru, Andhra Pradesh',
    phone: '08594-377778',
    website: 'https://www.rgsfamilyrestaurant.com',
    description: 'Family restaurant offering variety meals, local delicacies and a welcoming dining experience.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r20',
    name: 'A. S Kitchen',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Gudoor, Telangana',
    phone: '08594-388889',
    website: 'https://www.askitchen.in',
    description: 'Simple, inviting restaurant for casual meals, snacks and family favourites with daily comfort food.',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'r21',
    name: 'Udupi Hotel sri raghavendra bhavan',
    categoryId: '4',
    categoryName: 'Restaurants',
    address: 'Kandukur, Telangana',
    phone: '08594-399900',
    website: 'https://www.udupihotel.in',
    description: 'Popular hotel dining place for Indian meals, breakfast and value-for-money homestyle food.',
    image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'j1',
    name: 'Sree Lakshmi Gold Palace',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Main Market Road, Kandukur',
    phone: '08594-285000',
    website: 'https://www.sreelakshmigoldpalace.in',
    description: 'Trusted jewellery destination offering gold, silver and bridal collections with family-friendly service.',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'j2',
    name: 'Srinivasa Jewellers',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Opposite Bus Stand, Kandukur',
    phone: '08594-289999',
    website: 'https://www.srinivasajewellers.in',
    description: 'Popular jewellery shop with modern designs, gold ornaments and reliable making charges.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'j3',
    name: 'Sri Venkateswara Jewellers',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Main Road, Kandukur',
    phone: '08594-289111',
    website: 'https://www.srivekatiswarajewellers.in',
    description: 'Family-run jewellers offering traditional gold jewellery, silver pieces and gemstone collections.',
    image: 'https://images.unsplash.com/photo-1531973968078-9bb02785f13d?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1531973968078-9bb02785f13d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'j4',
    name: 'Kalyan Jewellers, Kandukur',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Vinayaka Nagar, Kandukur',
    phone: '08594-288222',
    website: 'https://www.kalyanjewellers.com',
    description: 'A well-known jeweller offering a wide range of gold, diamond and silver jewellery with assured quality.',
    image: 'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'j5',
    name: 'Sri Vani Jewellers',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Market Road, Kandukur',
    phone: '08594-289555',
    website: 'https://www.srivanijewellers.in',
    description: 'Neighborhood jewellers specializing in gold bracelets, necklaces and attractive wedding collections.',
    image: 'https://images.unsplash.com/photo-1524706895408-c8bc3a0d4d0e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1524706895408-c8bc3a0d4d0e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1541781774459-8ce70d4b6b14?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1506619216599-9b1c2e1b3a0a?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'j6',
    name: 'Gayatri Jewellers',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Opp Union Bank / Potti Sriramulu St, Pedda Bazar, Kandukur',
    phone: '08598-223274',
    website: null,
    description: 'Local family-run jewellers offering gold and silver ornaments.',
    image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=80'
    ]
  },
  {
    id: 'j7',
    name: 'VPG JEWELLERS',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Kota Reddy Nagar, Kandukur',
    phone: '08179880628',
    website: null,
    description: 'Neighbourhood jewellers (listing found on maps).',
    image: 'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j8',
    name: 'SKH Jewellary Shop',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Post office centre, Pamuru Rd, Kandukur',
    phone: null,
    website: null,
    description: 'Local jewellery retailer near the post office.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j9',
    name: 'Suresh Jewellers',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Mulla palem, Kandukur',
    phone: null,
    website: null,
    description: 'Trusted local shop selling traditional jewellery.',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j10',
    name: 'LALITHADEVI JEWELRY',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Beside Potti Sriramulu statue, Kandukur',
    phone: null,
    website: null,
    description: 'Small jewellery shop serving local customers.',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j11',
    name: "Shirdi Sai Jewellery's",
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Sai Nagar, Kanigiri Road, Santhosh Nagar, Kandukur',
    phone: null,
    website: null,
    description: 'Local jewellery and ornaments retailer.',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j12',
    name: 'Khasim Jewellery',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Kanigiri Road, Kota Reddy Nagar, Kandukur',
    phone: null,
    website: null,
    description: 'Map/listing shows shop on Kanigiri Road.',
    image: 'https://images.unsplash.com/photo-1524706895408-c8bc3a0d4d0e?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j13',
    name: 'Teja Jewellers',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Near Kanigiri Road, Kandukur',
    phone: null,
    website: null,
    description: 'Local jewellers with street-level shop.',
    image: 'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j14',
    name: 'Kly Ladies Collections',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Nallamala Vari Thota, Santhosh Nagar, Kandukur',
    phone: null,
    website: null,
    description: 'Retail shop listing that includes jewellery and ladies collections.',
    image: 'https://images.unsplash.com/photo-1524706895408-c8bc3a0d4d0e?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j15',
    name: 'Rk Jewellerys',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'DV Nagar, Pamuru Road, Kandukur',
    phone: null,
    website: null,
    description: 'Local jewellery retailer on Pamuru Road.',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j16',
    name: 'Basha Jewellery Works',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Beside ICICI Bank, Pamoor Road / Kanigiri Road, Kandukur',
    phone: null,
    website: null,
    description: 'Jewellery works and shop for local customers.',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j17',
    name: "M.S. Jeweller's And Works",
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Pamuru Road, Kota Reddy Nagar, Kandukur',
    phone: null,
    website: null,
    description: 'Local jewellers and workshop.',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j18',
    name: 'Sri Balaji Jewellers',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Near Big Bazar, Kanigiri Road, Kandukur',
    phone: null,
    website: null,
    description: 'Family-run jewellery store in the market area.',
    image: 'https://images.unsplash.com/photo-1524706895408-c8bc3a0d4d0e?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'j19',
    name: 'Srinivasa Silver Palace',
    categoryId: '17',
    categoryName: 'Jewellery shops',
    address: 'Pedda Bazar, Kandukur',
    phone: null,
    website: null,
    description: 'Silver and trinket specialist in the Pedda Bazar area.',
    image: 'https://images.unsplash.com/photo-1541781774459-8ce70d4b6b14?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext3',
    name: 'SRI KRISHNA GUEST ROOMS',
    categoryId: '6',
    categoryName: 'Lodges',
    address: 'Kandukur',
    phone: null,
    website: null,
    description: 'Guest rooms and lodge in central Kandukur.',
    image: 'https://images.unsplash.com/photo-1505691723518-36a5b7d1a4d5?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext4',
    name: 'APSRTC BUS STAND, KANDUKUR',
    categoryId: '7',
    categoryName: 'Bus stand',
    address: 'Kanigiri Rd / Bus Stand area, Kandukur',
    phone: '0866 257 0005',
    website: 'https://www.apsrtconline.in/',
    description: 'Main regional bus stand serving Kandukur and surrounding towns.',
    image: 'https://images.unsplash.com/photo-1508182311509-8f64d6bf8b9b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext5',
    name: 'Kandukur 1 Town police station',
    categoryId: '8',
    categoryName: 'Police station',
    address: 'Subedar Street, Kandukur',
    phone: '09121102203',
    website: null,
    description: 'Town police station serving Kandukur.',
    image: 'https://images.unsplash.com/photo-1526481280698-9e25f9dbea8b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext6',
    name: 'Sri Koteswara Cinemas',
    categoryId: '13',
    categoryName: 'Movie Theaters',
    address: 'Pedda Bazar, Kandukur',
    phone: null,
    website: null,
    description: 'Local movie theatre in Pedda Bazar.',
    source: 'https://www.google.com/maps/search/Sri+Koteswara+Cinemas+Kandukur',
    image: 'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext7',
    name: 'Axis Bank - Kandukur',
    categoryId: '11',
    categoryName: 'Banks',
    address: 'OV Rd, Kandukur',
    phone: '1860 500 5555',
    website: 'https://branch.axisbank.com/',
    description: 'Axis Bank branch in Kandukur.',
    image: 'https://images.unsplash.com/photo-1522204502412-6f0f0a8d2d3b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext8',
    name: 'Veenas Beauty clinic',
    categoryId: '12',
    categoryName: 'Beauty clinics',
    address: 'Kandukur',
    phone: null,
    website: null,
    description: 'Local beauty and skin clinic.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext9',
    name: 'PRASANTHI Theatre',
    categoryId: '13',
    categoryName: 'Movie Theaters',
    address: 'Pedda Bazar area, Kandukur',
    phone: null,
    website: null,
    description: 'Local cinema/movie theatre.',
    image: 'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext10',
    name: 'Rajesh Fashion World',
    categoryId: '14',
    categoryName: 'Shopping clothes',
    address: 'Kandukur',
    phone: null,
    website: null,
    description: 'Clothing and fashion retailer in Kandukur.',
    image: 'https://images.unsplash.com/photo-1520975912126-9ba1e9a0b7f1?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext11',
    name: 'More Supermarket - Kandukuru',
    categoryId: '15',
    categoryName: 'Retail marts',
    address: 'Kandukur',
    phone: null,
    website: null,
    description: 'Retail supermarket in Kandukur.',
    image: 'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ext12',
    name: 'Rajadhani Wines',
    categoryId: '16',
    categoryName: 'Wine shops',
    address: 'Kovuru Rd, Kandukur',
    phone: null,
    website: null,
    description: 'Local wine/liquor shop listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1547592166-4b6f2b7c0d8b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  }
  ,
  {
    id: 'bank1',
    name: 'State Bank of India - Kandukur',
    categoryId: '11',
    categoryName: 'Banks',
    address: 'O.V Road, Kandukur, Prakasam District',
    phone: '18001234',
    website: 'https://www.sbi.co.in/',
    description: 'State Bank of India branch in Kandukur (listed on Google Maps).',
    source: 'https://www.google.com/maps/search/State+Bank+of+India+Kandukur',
    image: 'https://images.unsplash.com/photo-1522204502412-6f0f0a8d2d3b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'bank2',
    name: 'Canara Bank - Kandukur',
    categoryId: '11',
    categoryName: 'Banks',
    address: 'Central Kandukur area, Prakasam District',
    phone: null,
    website: null,
    description: 'Canara Bank branch listed on Google Maps for Kandukur.',
    source: 'https://www.google.com/maps/search/Canara+Bank+Kandukur',
    image: 'https://images.unsplash.com/photo-1522204502412-6f0f0a8d2d3b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'bank3',
    name: 'HDFC Bank - Kandukur',
    categoryId: '11',
    categoryName: 'Banks',
    address: 'Pamur Road / Government Hospital Road area, Kandukur',
    phone: '18001601',
    website: 'https://www.hdfc.bank.in/',
    description: 'HDFC Bank branch referenced from branch locator and Google Maps.',
    source: 'https://www.hdfcbank.com/branch-locator',
    image: 'https://images.unsplash.com/photo-1522204502412-6f0f0a8d2d3b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'bank4',
    name: 'Bank of India - Kandukur',
    categoryId: '11',
    categoryName: 'Banks',
    address: 'Kandukur town center, Prakasam District',
    phone: null,
    website: null,
    description: 'Bank of India branch listing visible on Google Maps.',
    source: 'https://www.google.com/maps/search/Bank+of+India+Kandukur',
    image: 'https://images.unsplash.com/photo-1522204502412-6f0f0a8d2d3b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'bank5',
    name: 'Andhra Pragathi Grameena Bank - Kandukur',
    categoryId: '11',
    categoryName: 'Banks',
    address: 'Kandukur, Prakasam District',
    phone: null,
    website: null,
    description: 'Regional rural bank listing (APGB) visible on Google Maps for Kandukur.',
    source: 'https://www.google.com/maps/search/Andhra+Pragathi+Grameena+Bank+Kandukur',
    image: 'https://images.unsplash.com/photo-1522204502412-6f0f0a8d2d3b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'mov1',
    name: 'Yuvaraj Theatre',
    categoryId: '13',
    categoryName: 'Movie Theaters',
    address: 'Pedda Bazar, Kandukur, Prakasam District',
    phone: null,
    website: null,
    description: 'Local theatre in Pedda Bazar listed on Google Maps.',
    source: 'https://www.google.com/maps/search/Yuvaraj+Theatre+Kandukur',
    image: 'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'mov2',
    name: 'Cinema Theatre Kandukur',
    categoryId: '13',
    categoryName: 'Movie Theaters',
    address: 'Central Kandukur, Prakasam District',
    phone: null,
    website: null,
    description: 'Cinema theatre listed on Google Maps for Kandukur.',
    source: 'https://www.google.com/maps/search/Cinema+Theatre+Kandukur',
    image: 'https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  }
  ,
  {
    id: 'lodge1',
    name: 'SRI KRISHNA GUEST ROOMS',
    categoryId: '6',
    categoryName: 'Lodges',
    address: 'Kandukur, Prakasam, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=SRI%20KRISHNA%20GUEST%20ROOMS%20Kandukur',
    description: 'Guest rooms / lodge listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1505691723518-36a5b7d1a4d5?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'lodge2',
    name: 'Swarna Palace A/C',
    categoryId: '6',
    categoryName: 'Lodges',
    address: 'Kota Reddy Nagar, Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Swarna%20Palace%20Kandukur',
    description: 'Small lodge/hotel listed in Kandukur.',
    image: 'https://images.unsplash.com/photo-1505691723518-36a5b7d1a4d5?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'lodge3',
    name: 'Hotel Aditya Grand',
    categoryId: '6',
    categoryName: 'Lodges',
    address: 'Kandukur, Prakasam, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Hotel%20Aditya%20Grand%20Kandukur',
    description: 'Hotel listing found on Google Maps for Kandukur.',
    image: 'https://images.unsplash.com/photo-1505691723518-36a5b7d1a4d5?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'ps1',
    name: 'Kandukur 1 Town police station',
    categoryId: '8',
    categoryName: 'Police station',
    address: 'Subedar Street, Kandukur',
    phone: '09121102203',
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Kandukur%201%20Town%20police%20station%20Subedar%20Street%20Kandukur',
    description: 'Town police station serving Kandukur.',
    image: 'https://images.unsplash.com/photo-1526481280698-9e25f9dbea8b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'wine1',
    name: 'Rajadhani Wines',
    categoryId: '16',
    categoryName: 'Wine shops',
    address: 'Kovuru Rd, Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Rajadhani%20Wines%20Kovuru%20Rd%20Kandukur',
    description: 'Local wine/liquor shop listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1547592166-4b6f2b7c0d8b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  }
  ,
  {
    id: 'wine2',
    name: 'GAYATHRI WINE SHOP',
    categoryId: '16',
    categoryName: 'Wine shops',
    address: 'Kovuru Rd, Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=GAYATHRI%20WINE%20SHOP%20Kandukur',
    description: 'Local liquor shop listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1547592166-4b6f2b7c0d8b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'wine3',
    name: 'SRI MALLI KARJUNA WINES',
    categoryId: '16',
    categoryName: 'Wine shops',
    address: 'Kandukur, Prakasam District',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=SRI%20MALLI%20KARJUNA%20WINES%20Kandukur',
    description: 'Wine shop found in Google Maps results.',
    image: 'https://images.unsplash.com/photo-1547592166-4b6f2b7c0d8b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'wine4',
    name: 'Surya Bar and Restaurant A/C',
    categoryId: '16',
    categoryName: 'Wine shops',
    address: 'Opposite HP Petrol Pump, Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Surya%20Bar%20and%20Restaurant%20Kandukur',
    description: 'Bar/restaurant appearing in wine shops searches.',
    image: 'https://images.unsplash.com/photo-1547592166-4b6f2b7c0d8b?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'retail1',
    name: 'Reliance SMART Bazaar',
    categoryId: '15',
    categoryName: 'Retail marts',
    address: 'Kandukur, Prakasam District',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Reliance%20SMART%20Bazaar%20Kandukur',
    description: 'Hypermarket listing found on Google Maps.',
    image: 'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'retail2',
    name: 'More Supermarket - Kandukuru',
    categoryId: '15',
    categoryName: 'Retail marts',
    address: 'Pamuru Rd, near Raj Theatre, Kandukur',
    phone: '18008910001',
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=More%20Supermarket%20Kandukur',
    description: 'Local branch of More Supermarket (phone shown on Maps).',
    image: 'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'retail3',
    name: 'Raithu Bazar',
    categoryId: '15',
    categoryName: 'Retail marts',
    address: 'Raithu Bazar, Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Raithu%20Bazar%20Kandukur',
    description: 'Farmers market / retail market area in Kandukur.',
    image: 'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'retail4',
    name: 'Lakshmi Home Needs',
    categoryId: '15',
    categoryName: 'Retail marts',
    address: 'Beside State Bank of India, OV Rd, Kandukur',
    phone: '09705046611',
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Lakshmi%20Home%20Needs%20Kandukur',
    description: 'Local grocery / home needs shop (phone listed on Maps).',
    image: 'https://images.unsplash.com/photo-1542831371-d531d36971e6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'clothes1',
    name: 'Rajesh Fashion World',
    categoryId: '14',
    categoryName: 'Shopping clothes',
    address: 'Kandukur, Prakasam District',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Rajesh%20Fashion%20World%20Kandukur',
    description: 'Clothing retailer in Kandukur.',
    image: 'https://images.unsplash.com/photo-1520975912126-9ba1e9a0b7f1?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'clothes2',
    name: 'MOON DRESSES',
    categoryId: '14',
    categoryName: 'Shopping clothes',
    address: 'Pamuru Rd, Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=MOON%20DRESSES%20Kandukur',
    description: 'Local dress & clothing store.',
    image: 'https://images.unsplash.com/photo-1520975912126-9ba1e9a0b7f1?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'clothes3',
    name: 'Sridevi Sarees Collection',
    categoryId: '14',
    categoryName: 'Shopping clothes',
    address: 'Venkata Narayana Bazar, Kandukur',
    phone: '07013274556',
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Sridevi%20Sarees%20Collection%20Kandukur',
    description: 'Saree and traditional clothing retailer (phone on Maps).',
    image: 'https://images.unsplash.com/photo-1520975912126-9ba1e9a0b7f1?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'clothes4',
    name: 'UPDATE FASHIONS',
    categoryId: '14',
    categoryName: 'Shopping clothes',
    address: 'Kovuru Road, Kandukur',
    phone: '09849837338',
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=UPDATE%20FASHIONS%20Kandukur',
    description: 'Clothing shop listed on Google Maps (phone shown).',
    image: 'https://images.unsplash.com/photo-1520975912126-9ba1e9a0b7f1?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'clothes5',
    name: 'SRI MALLIKA FASHIONS',
    categoryId: '14',
    categoryName: 'Shopping clothes',
    address: 'Pamuru Rd, near PDCC Bank, Kandukur',
    phone: '09848672073',
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=SRI%20MALLIKA%20FASHIONS%20Kandukur',
    description: 'Men and womens clothing store with phone listed on Maps.',
    image: 'https://images.unsplash.com/photo-1520975912126-9ba1e9a0b7f1?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  }
  ,
  {
    id: 'beauty1',
    name: 'Veenas Beauty clinic',
    categoryId: '12',
    categoryName: 'Beauty clinics',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Veenas%20Beauty%20clinic%20Kandukur',
    description: 'Local beauty clinic listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'beauty2',
    name: 'Chaitanya Skin Prime Clinic',
    categoryId: '12',
    categoryName: 'Beauty clinics',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Chaitanya%20Skin%20Prime%20Clinic%20Kandukur',
    description: 'Skin & beauty clinic listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'beauty3',
    name: 'Style & Smile Beauty Parlour (Santhi)',
    categoryId: '12',
    categoryName: 'Beauty clinics',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Style%20%26%20Smile%20Beauty%20Parlour%20Kandukur',
    description: 'Beauty parlour listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'beauty4',
    name: 'Qbs Salon - Kandukur',
    categoryId: '12',
    categoryName: 'Beauty clinics',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Qbs%20salon%20Kandukur',
    description: 'Local salon listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'beauty5',
    name: 'Charmi Beauty Parlor',
    categoryId: '12',
    categoryName: 'Beauty clinics',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=CHARMI%20BEAUTY%20PARLOR%20Kandukur',
    description: 'Local ladies beauty parlour listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'beauty6',
    name: 'Beauty Parlour (Old Fish Market)',
    categoryId: '12',
    categoryName: 'Beauty clinics',
    address: 'Old Fish Market, Raavichettu Line, Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Beauty%20Parlour%20Old%20Fish%20Market%20Kandukur',
    description: 'Salon listed in Google Maps search snippets.',
    image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'temple1',
    name: 'Skandapuri Sree Someshwaraswami Temple',
    categoryId: '10',
    categoryName: 'Temples',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Skandapuri%20Sree%20Someshwaraswami%20Temple%20Kandukur',
    description: 'Local temple listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'temple2',
    name: 'Ankamma Thalli Temple',
    categoryId: '10',
    categoryName: 'Temples',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Ankamma%20Thalli%20Temple%20Kandukur',
    description: 'Older local temple in Kandukur town.',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'temple3',
    name: 'Janardhan Swamy Temple',
    categoryId: '10',
    categoryName: 'Temples',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Janardhan%20Swamy%20Temple%20Kandukur',
    description: 'Temple listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'temple4',
    name: 'Pothuraju Swamy Temple',
    categoryId: '10',
    categoryName: 'Temples',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Pothuraju%20Swamy%20Temple%20Kandukur',
    description: 'Local temple listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'temple5',
    name: 'Ayyappa Swamy Temple',
    categoryId: '10',
    categoryName: 'Temples',
    address: 'Kandukur, Prakasam District, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Ayyappa%20Swamy%20Temple%20Kandukur',
    description: 'Local temple listed on Google Maps.',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  }
  ,
  {
    id: 'jc1',
    name: 'Narayana Junior College, Kandukur',
    categoryId: 'edu-3',
    categoryName: 'Intermediate',
    address: 'Kandukur, Prakasam District',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Narayana+Junior+College+Kandukur',
    description: 'Well-known coaching & junior college branch in Kandukur (listing on Maps/education portals).',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 'jc2',
    name: 'Sri Viveka / Sri Vidya Junior College, Kandukur',
    categoryId: 'edu-3',
    categoryName: 'Intermediate',
    address: 'Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Sri+Viveka+Junior+College+Kandukur',
    description: 'Local junior college (multiple listings found; please verify phone/website).',
    image: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80',
    gallery: []
  },
  {
    id: 's3',
    name: 'Sri Chaitanya High School, Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: 'Kandukur / Singarayakonda area (verify exact branch)',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Sri+Chaitanya+High+School+Kandukur',
    description: 'Sri Chaitanya group school listing (verify branch/location).',
    gallery: []
  },
  {
    id: 's4',
    name: 'Saibaba Central School, Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: 'Kandukur',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Saibaba+Central+School+Kandukur',
    description: 'Private school listed on education directories and Maps.',
    gallery: []
  },
  {
    id: 's5',
    name: 'Siddardha Group Of Schools, Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: 'Kandukur area',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/?api=1&query=Siddardha+Group+Of+Schools+Kandukur',
    description: 'Local school group (listed on regional directories).',
    gallery: []
  },
  {
    id: 'edu-google-school-samskruti',
    name: 'Sri Samskruti High School, Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: '6WF2+R52, Gurramvari Palem, Kandukur, Andhra Pradesh',
    phone: '070704 49999',
    website: 'https://www.srisamskruti.com/',
    source: 'https://www.google.com/maps/search/Sri+Samskruti+High+School+Kandukur',
    description: 'Private educational institution listed on Google Maps.',
    image: sriSamskrutiSchool,
    gallery: [sriSamskrutiSchool]
  },
  {
    id: 'edu-google-school-goutham',
    name: 'Sri Goutham High School, Kandukur',
    categoryId: 'edu-5',
    categoryName: 'Schools',
    address: '6V6X+HQF, Kandukur, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/Sri+goutham+high+school+Kandukur',
    description: 'Higher secondary school listing in Kandukur.',
    image: sriGouthamHighSchool,
    gallery: [sriGouthamHighSchool]
  },
  {
    id: 'edu-google-gayatri-degree',
    name: 'Gayatri Degree College, Kandukur',
    categoryId: 'edu-2',
    categoryName: 'Degree colleges',
    address: '2-3-22, O.V. Road, Kandukur, Andhra Pradesh',
    phone: '098483 96271',
    website: null,
    source: 'https://www.google.com/maps/search/Gayatri+Degree+College+Kandukur',
    description: 'Degree college listing near O.V. Road, Kandukur.',
    image: gayatriDegreeCampus,
    gallery: [gayatriDegreeCampus]
  },
  {
    id: 'edu-google-pratibha-girls',
    name: 'Sri Pratibha Junior College for Girls',
    categoryId: 'edu-3',
    categoryName: 'Intermediate',
    address: 'Kandukur, Andhra Pradesh',
    phone: null,
    website: null,
    source: 'https://www.google.com/maps/search/Sri+Pratibha+Junior+College+for+Girls+Kandukur',
    description: 'Girls junior college listing in Kandukur.',
    gallery: []
  },
  {
    id: 'edu-google-br-oxford',
    name: 'BR Oxford Junior College, Kandukur',
    categoryId: 'edu-3',
    categoryName: 'Intermediate',
    address: '6W42+H73, Machavaram Road, Kandukur, Andhra Pradesh',
    phone: '063014 22230',
    website: null,
    source: 'https://www.google.com/maps/search/BR+OXFORD+JUNIOR+COLLEGE+Kandukur',
    description: 'Higher secondary education institution listed in Kandukur.',
    gallery: []
  }
]

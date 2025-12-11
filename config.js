/* js/config.js — central config with corrected donors & dummies */
window.RedLinkConfig = {
  APP_KEY: 'redlink_demo_v3',
  TOKEN_KEY: 'redlink_token_v3',
  AUTO_SEED_IF_EMPTY: true,
  INITIAL_INVENTORY: { 'A+':5,'A-':2,'B+':6,'B-':1,'O+':8,'O-':2,'AB+':3,'AB-':1 },
  DEMO_USERS: [
    { name: 'Its Amol', email: 'itsamol', password: 'amolsgt', role: 'admin' },
    { name: 'Ellina Lias', email: 'ellinaig', password: 'ellinaig', role: 'user' }
  ],
  SAMPLE_DONORS: [
  { id:'d_amol',   name:'Amol Kumar',    blood:'B+',  city:'Hauz Khas, Delhi',    phone:'9898009890', visible:true },
  { id:'d_ellina', name:'Ellina Lias',   blood:'AB+', city:'Chapra, Jharkhand',    phone:'696009896',  visible:true },
  { id:'d_saloni', name:'Saloni',        blood:'AB+', city:'Sadar New Delhi',      phone:'8989009909', visible:true },

  /* extra dummies */
  { id:'d_aditya', name:'Aditya Raj',    blood:'A+',  city:'Connaught Place, Delhi', phone:'9001010101', visible:true },
  { id:'d_anupama',name:'Anupama Shah',  blood:'B-',  city:'Vasant Kunj, Delhi',     phone:'9002020202', visible:true },
  { id:'d_akshara',name:'Akshara Singhania', blood:'O+', city:'Gurgaon',             phone:'9003030303', visible:true },
  { id:'d_naira',  name:'Naira Goenka',  blood:'AB+', city:'Bengaluru',            phone:'9004040404', visible:true },
  { id:'d_jannat', name:'Jannat Zubair', blood:'A-',  city:'Lucknow',              phone:'9005050505', visible:true },
  { id:'d_shivangi',name:'Shivangi Joshi',blood:'B+', city:'Jaipur',               phone:'9006060606', visible:true },
  { id:'d_abhishek',name:'Abhishek Rajput',blood:'O-', city:'Mumbai',              phone:'9007070707', visible:true },
  { id:'d_rahul',  name:'Rahul Sharma',  blood:'A+',  city:'Pune',                 phone:'9008080808', visible:true }
],

  QUOTES: [
    'Donate blood, save a life.',
    'Small act, big impact.',
    'Share life — give blood.',
    'One donation can save a life.'
  ],
  GOOGLE_MAPS_API_KEY: '' // optional - not required
};

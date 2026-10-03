/**
 * Comprehensive Indian Cities, Districts & Towns Directory
 * Covers all major regions of India for hyperlocal artisan discovery.
 */

export const INDIAN_CITIES = [
  // Delhi NCR
  { id: 'delhi', nameEn: 'Delhi (NCR)', nameHi: 'दिल्ली (एनसीआर)', stateEn: 'Delhi NCR', stateHi: 'दिल्ली', lat: 28.6139, lng: 77.2090, pincode: '110001' },
  { id: 'noida', nameEn: 'Noida', nameHi: 'नोएडा', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 28.5355, lng: 77.3910, pincode: '201301' },
  { id: 'greater-noida', nameEn: 'Greater Noida', nameHi: 'ग्रेटर नोएडा', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 28.4744, lng: 77.5040, pincode: '201310' },
  { id: 'ghaziabad', nameEn: 'Ghaziabad', nameHi: 'गाजियाबाद', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 28.6692, lng: 77.4538, pincode: '201001' },
  { id: 'gurgaon', nameEn: 'Gurugram (Gurgaon)', nameHi: 'गुरुग्राम (गुड़गांव)', stateEn: 'Haryana', stateHi: 'हरियाणा', lat: 28.4595, lng: 77.0266, pincode: '122001' },
  { id: 'faridabad', nameEn: 'Faridabad', nameHi: 'फरीदाबाद', stateEn: 'Haryana', stateHi: 'हरियाणा', lat: 28.4089, lng: 77.3178, pincode: '121001' },

  // Uttar Pradesh
  { id: 'lucknow', nameEn: 'Lucknow', nameHi: 'लखनऊ', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 26.8467, lng: 80.9462, pincode: '226001' },
  { id: 'kanpur', nameEn: 'Kanpur', nameHi: 'कानपुर', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 26.4499, lng: 80.3319, pincode: '208001' },
  { id: 'varanasi', nameEn: 'Varanasi (Kashi)', nameHi: 'वाराणसी (काशी)', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 25.3176, lng: 82.9739, pincode: '221001' },
  { id: 'prayagraj', nameEn: 'Prayagraj (Allahabad)', nameHi: 'प्रयागराज (इलाहाबाद)', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 25.4358, lng: 81.8463, pincode: '211001' },
  { id: 'agra', nameEn: 'Agra', nameHi: 'आगरा', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 27.1767, lng: 78.0081, pincode: '282001' },
  { id: 'meerut', nameEn: 'Meerut', nameHi: 'मेरठ', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 28.9845, lng: 77.7064, pincode: '250001' },
  { id: 'bareilly', nameEn: 'Bareilly', nameHi: 'बरेली', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 28.3670, lng: 79.4304, pincode: '243001' },
  { id: 'aligarh', nameEn: 'Aligarh', nameHi: 'अलीगढ़', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 27.8974, lng: 78.0880, pincode: '202001' },
  { id: 'gorakhpur', nameEn: 'Gorakhpur', nameHi: 'गोरखपुर', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 26.7606, lng: 83.3732, pincode: '273001' },
  { id: 'mathura', nameEn: 'Mathura & Vrindavan', nameHi: 'मथुरा व वृन्दावन', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 27.4924, lng: 77.6737, pincode: '281001' },
  { id: 'ayodhya', nameEn: 'Ayodhya', nameHi: 'अयोध्या', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 26.7922, lng: 82.1998, pincode: '224123' },
  { id: 'jhansi', nameEn: 'Jhansi', nameHi: 'झांसी', stateEn: 'Uttar Pradesh', stateHi: 'उत्तर प्रदेश', lat: 25.4484, lng: 78.5685, pincode: '284001' },

  // Maharashtra
  { id: 'mumbai', nameEn: 'Mumbai', nameHi: 'मुंबई', stateEn: 'Maharashtra', stateHi: 'महाराष्ट्र', lat: 19.0760, lng: 72.8777, pincode: '400001' },
  { id: 'pune', nameEn: 'Pune', nameHi: 'पुणे', stateEn: 'Maharashtra', stateHi: 'महाराष्ट्र', lat: 18.5204, lng: 73.8567, pincode: '411001' },
  { id: 'nagpur', nameEn: 'Nagpur', nameHi: 'नागपुर', stateEn: 'Maharashtra', stateHi: 'महाराष्ट्र', lat: 21.1458, lng: 79.0882, pincode: '440001' },
  { id: 'nashik', nameEn: 'Nashik', nameHi: 'नाशिक', stateEn: 'Maharashtra', stateHi: 'महाराष्ट्र', lat: 19.9975, lng: 73.7898, pincode: '422001' },
  { id: 'thane', nameEn: 'Thane', nameHi: 'ठाणे', stateEn: 'Maharashtra', stateHi: 'महाराष्ट्र', lat: 19.2183, lng: 72.9781, pincode: '400601' },
  { id: 'aurangabad', nameEn: 'Chhatrapati Sambhaji Nagar (Aurangabad)', nameHi: 'छत्रपति संभाजी नगर (औरंगाबाद)', stateEn: 'Maharashtra', stateHi: 'महाराष्ट्र', lat: 19.8762, lng: 75.3433, pincode: '431001' },

  // Bihar & Jharkhand
  { id: 'patna', nameEn: 'Patna', nameHi: 'पटना', stateEn: 'Bihar', stateHi: 'बिहार', lat: 25.5941, lng: 85.1376, pincode: '800001' },
  { id: 'gaya', nameEn: 'Gaya', nameHi: 'गया', stateEn: 'Bihar', stateHi: 'बिहार', lat: 24.7914, lng: 85.0002, pincode: '823001' },
  { id: 'muzaffarpur', nameEn: 'Muzaffarpur', nameHi: 'मुजफ्फरपुर', stateEn: 'Bihar', stateHi: 'बिहार', lat: 26.1209, lng: 85.3647, pincode: '842001' },
  { id: 'bhagalpur', nameEn: 'Bhagalpur', nameHi: 'भागलपुर', stateEn: 'Bihar', stateHi: 'बिहार', lat: 25.2425, lng: 86.9842, pincode: '812001' },
  { id: 'darbhanga', nameEn: 'Darbhanga', nameHi: 'दरभंगा', stateEn: 'Bihar', stateHi: 'बिहार', lat: 26.1542, lng: 85.8918, pincode: '846004' },
  { id: 'ranchi', nameEn: 'Ranchi', nameHi: 'राँची', stateEn: 'Jharkhand', stateHi: 'झारखंड', lat: 23.3441, lng: 85.3096, pincode: '834001' },
  { id: 'jamshedpur', nameEn: 'Jamshedpur', nameHi: 'जमशेदपुर', stateEn: 'Jharkhand', stateHi: 'झारखंड', lat: 22.8046, lng: 86.2029, pincode: '831001' },
  { id: 'dhanbad', nameEn: 'Dhanbad', nameHi: 'धनबाद', stateEn: 'Jharkhand', stateHi: 'झारखंड', lat: 23.7957, lng: 86.4304, pincode: '826001' },

  // Madhya Pradesh & Chhattisgarh
  { id: 'indore', nameEn: 'Indore', nameHi: 'इंदौर', stateEn: 'Madhya Pradesh', stateHi: 'मध्य प्रदेश', lat: 22.7196, lng: 75.8577, pincode: '452001' },
  { id: 'bhopal', nameEn: 'Bhopal', nameHi: 'भोपाल', stateEn: 'Madhya Pradesh', stateHi: 'मध्य प्रदेश', lat: 23.2599, lng: 77.4126, pincode: '462001' },
  { id: 'gwalior', nameEn: 'Gwalior', nameHi: 'ग्वालियर', stateEn: 'Madhya Pradesh', stateHi: 'मध्य प्रदेश', lat: 26.2183, lng: 78.1828, pincode: '474001' },
  { id: 'jabalpur', nameEn: 'Jabalpur', nameHi: 'जबलपुर', stateEn: 'Madhya Pradesh', stateHi: 'मध्य प्रदेश', lat: 23.1815, lng: 79.9864, pincode: '482001' },
  { id: 'ujjain', nameEn: 'Ujjain', nameHi: 'उज्जैन', stateEn: 'Madhya Pradesh', stateHi: 'मध्य प्रदेश', lat: 23.1765, lng: 75.7885, pincode: '456001' },
  { id: 'raipur', nameEn: 'Raipur', nameHi: 'रायपुर', stateEn: 'Chhattisgarh', stateHi: 'छत्तीसगढ़', lat: 21.2514, lng: 81.6296, pincode: '492001' },

  // Rajasthan
  { id: 'jaipur', nameEn: 'Jaipur', nameHi: 'जयपुर', stateEn: 'Rajasthan', stateHi: 'राजस्थान', lat: 26.9124, lng: 75.7873, pincode: '302001' },
  { id: 'jodhpur', nameEn: 'Jodhpur', nameHi: 'जोधपुर', stateEn: 'Rajasthan', stateHi: 'राजस्थान', lat: 26.2389, lng: 73.0243, pincode: '342001' },
  { id: 'kota', nameEn: 'Kota', nameHi: 'कोटा', stateEn: 'Rajasthan', stateHi: 'राजस्थान', lat: 25.2138, lng: 75.8648, pincode: '324001' },
  { id: 'udaipur', nameEn: 'Udaipur', nameHi: 'उदयपुर', stateEn: 'Rajasthan', stateHi: 'राजस्थान', lat: 24.5854, lng: 73.7125, pincode: '313001' },
  { id: 'bikaner', nameEn: 'Bikaner', nameHi: 'बीकानेर', stateEn: 'Rajasthan', stateHi: 'राजस्थान', lat: 28.0229, lng: 73.3119, pincode: '334001' },
  { id: 'ajmer', nameEn: 'Ajmer', nameHi: 'अजमेर', stateEn: 'Rajasthan', stateHi: 'राजस्थान', lat: 26.4499, lng: 74.6399, pincode: '305001' },

  // Gujarat
  { id: 'ahmedabad', nameEn: 'Ahmedabad', nameHi: 'अहमदाबाद', stateEn: 'Gujarat', stateHi: 'गुजरात', lat: 23.0225, lng: 72.5714, pincode: '380001' },
  { id: 'surat', nameEn: 'Surat', nameHi: 'सूरत', stateEn: 'Gujarat', stateHi: 'गुजरात', lat: 21.1702, lng: 72.8311, pincode: '395001' },
  { id: 'vadodara', nameEn: 'Vadodara (Baroda)', nameHi: 'वडोदरा (बड़ौदा)', stateEn: 'Gujarat', stateHi: 'गुजरात', lat: 22.3072, lng: 73.1812, pincode: '390001' },
  { id: 'rajkot', nameEn: 'Rajkot', nameHi: 'राजकोट', stateEn: 'Gujarat', stateHi: 'गुजरात', lat: 22.3039, lng: 70.8022, pincode: '360001' },

  // Punjab, Haryana & Chandigarh
  { id: 'chandigarh', nameEn: 'Chandigarh', nameHi: 'चंडीगढ़', stateEn: 'Chandigarh', stateHi: 'चंडीगढ़', lat: 30.7333, lng: 76.7794, pincode: '160017' },
  { id: 'ludhiana', nameEn: 'Ludhiana', nameHi: 'लुधियाना', stateEn: 'Punjab', stateHi: 'पंजाब', lat: 30.9010, lng: 75.8573, pincode: '141001' },
  { id: 'amritsar', nameEn: 'Amritsar', nameHi: 'अमृतसर', stateEn: 'Punjab', stateHi: 'पंजाब', lat: 31.6340, lng: 74.8723, pincode: '143001' },
  { id: 'jalandhar', nameEn: 'Jalandhar', nameHi: 'जालंधर', stateEn: 'Punjab', stateHi: 'पंजाब', lat: 31.3260, lng: 75.5762, pincode: '144001' },
  { id: 'panipat', nameEn: 'Panipat', nameHi: 'पानीपत', stateEn: 'Haryana', stateHi: 'हरियाणा', lat: 29.3909, lng: 76.9635, pincode: '132103' },
  { id: 'karnal', nameEn: 'Karnal', nameHi: 'करनाल', stateEn: 'Haryana', stateHi: 'हरियाणा', lat: 29.6857, lng: 76.9905, pincode: '132001' },
  { id: 'rohtak', nameEn: 'Rohtak', nameHi: 'रोहतक', stateEn: 'Haryana', stateHi: 'हरियाणा', lat: 28.8955, lng: 76.6066, pincode: '124001' },

  // Uttarakhand & Himachal
  { id: 'dehradun', nameEn: 'Dehradun', nameHi: 'देहरादून', stateEn: 'Uttarakhand', stateHi: 'उत्तराखंड', lat: 30.3165, lng: 78.0322, pincode: '248001' },
  { id: 'haridwar', nameEn: 'Haridwar & Rishikesh', nameHi: 'हरिद्वार व ऋषिकेश', stateEn: 'Uttarakhand', stateHi: 'उत्तराखंड', lat: 29.9457, lng: 78.1642, pincode: '249401' },
  { id: 'shimla', nameEn: 'Shimla', nameHi: 'शिमला', stateEn: 'Himachal Pradesh', stateHi: 'हिमाचल प्रदेश', lat: 31.1048, lng: 77.1734, pincode: '171001' },

  // South India
  { id: 'bengaluru', nameEn: 'Bengaluru (Bangalore)', nameHi: 'बेंगलुरु (बैंगलोर)', stateEn: 'Karnataka', stateHi: 'कर्नाटक', lat: 12.9716, lng: 77.5946, pincode: '560001' },
  { id: 'hyderabad', nameEn: 'Hyderabad', nameHi: 'हैदराबाद', stateEn: 'Telangana', stateHi: 'तेलंगाना', lat: 17.3850, lng: 78.4867, pincode: '500001' },
  { id: 'chennai', nameEn: 'Chennai', nameHi: 'चेन्नई', stateEn: 'Tamil Nadu', stateHi: 'तमिलनाडु', lat: 13.0827, lng: 80.2707, pincode: '600001' },
  { id: 'kochi', nameEn: 'Kochi (Cochin)', nameHi: 'कोच्चि', stateEn: 'Kerala', stateHi: 'केरल', lat: 9.9312, lng: 76.2673, pincode: '682001' },
  { id: 'coimbatore', nameEn: 'Coimbatore', nameHi: 'कोयंबटूर', stateEn: 'Tamil Nadu', stateHi: 'तमिलनाडु', lat: 11.0168, lng: 76.9558, pincode: '641001' },
  { id: 'visakhapatnam', nameEn: 'Visakhapatnam (Vizag)', nameHi: 'विशाखापट्टनम', stateEn: 'Andhra Pradesh', stateHi: 'आंध्र प्रदेश', lat: 17.6868, lng: 83.2185, pincode: '530001' },
  { id: 'vijayawada', nameEn: 'Vijayawada', nameHi: 'विजयवाड़ा', stateEn: 'Andhra Pradesh', stateHi: 'आंध्र प्रदेश', lat: 16.5062, lng: 80.6480, pincode: '520001' },
  { id: 'mysuru', nameEn: 'Mysuru (Mysore)', nameHi: 'मैसूरु', stateEn: 'Karnataka', stateHi: 'कर्नाटक', lat: 12.2958, lng: 76.6394, pincode: '570001' },

  // Eastern & North-Eastern India
  { id: 'kolkata', nameEn: 'Kolkata', nameHi: 'कोलकाता', stateEn: 'West Bengal', stateHi: 'पश्चिम बंगाल', lat: 22.5726, lng: 88.3639, pincode: '700001' },
  { id: 'howrah', nameEn: 'Howrah', nameHi: 'हावड़ा', stateEn: 'West Bengal', stateHi: 'पश्चिम बंगाल', lat: 22.5958, lng: 88.2636, pincode: '711101' },
  { id: 'bhubaneswar', nameEn: 'Bhubaneswar', nameHi: 'भुवनेश्वर', stateEn: 'Odisha', stateHi: 'ओडिशा', lat: 20.2961, lng: 85.8245, pincode: '751001' },
  { id: 'cuttack', nameEn: 'Cuttack', nameHi: 'कटक', stateEn: 'Odisha', stateHi: 'ओडिशा', lat: 20.4625, lng: 85.8828, pincode: '753001' },
  { id: 'guwahati', nameEn: 'Guwahati', nameHi: 'गुवाहाटी', stateEn: 'Assam', stateHi: 'असम', lat: 26.1445, lng: 91.7362, pincode: '781001' },
];

/**
 * Calculate distance in km between two geo points
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the closest Indian city from coordinates
 */
export function findNearestCity(lat, lng) {
  if (!lat || !lng) return INDIAN_CITIES[0];
  let minDistance = Infinity;
  let nearest = INDIAN_CITIES[0];

  for (const city of INDIAN_CITIES) {
    const dist = getDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = city;
    }
  }

  return { ...nearest, distanceKm: Math.round(minDistance) };
}

/**
 * Search Indian cities by text query (Hindi or English or PIN code)
 */
export function searchIndianCities(query) {
  if (!query || !query.trim()) return INDIAN_CITIES.slice(0, 15);
  const clean = query.trim().toLowerCase();

  return INDIAN_CITIES.filter((c) => {
    return (
      c.nameEn.toLowerCase().includes(clean) ||
      c.nameHi.includes(clean) ||
      c.stateEn.toLowerCase().includes(clean) ||
      c.stateHi.includes(clean) ||
      (c.pincode && c.pincode.startsWith(clean))
    );
  });
}

/**
 * Reverse geocode via OpenStreetMap Nominatim for Indian addresses
 */
export async function reverseGeocodeCoords(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });
    if (!res.ok) throw new Error('OSM request failed');
    const data = await res.json();
    if (!data || !data.address) throw new Error('No address');

    const addr = data.address;
    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.residential ||
      addr.city_district ||
      addr.town ||
      addr.village ||
      addr.city ||
      addr.state_district ||
      '';

    const city = addr.city || addr.town || addr.state_district || addr.state || '';
    const formatted = [locality, city].filter(Boolean).join(', ');

    return {
      displayName: formatted || data.display_name,
      locality,
      city: city || locality || 'My Area',
      postalCode: addr.postcode || '',
      state: addr.state || '',
      lat,
      lng,
    };
  } catch (e) {
    // Fallback to nearest known Indian city
    const nearest = findNearestCity(lat, lng);
    return {
      displayName: `${nearest.nameHi} / ${nearest.nameEn}`,
      locality: nearest.nameEn,
      city: nearest.nameEn,
      postalCode: nearest.pincode,
      state: nearest.stateEn,
      lat,
      lng,
    };
  }
}

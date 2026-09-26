export interface StateData {
  name: string;
  cities: string[];
}

export interface CountryData {
  name: string;
  code: string; // Dial code e.g., "+91"
  flag?: string;
  states: StateData[];
}

export const LOCATION_DATA: CountryData[] = [
  {
    name: 'India',
    code: '+91',
    states: [
      {
        name: 'Maharashtra',
        cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Chhatrapati Sambhajinagar', 'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai', 'Sangli', 'Jalgaon', 'Nanded', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ratnagiri']
      },
      {
        name: 'Gujarat',
        cities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Bharuch', 'Porbandar', 'Vapi', 'Bhuj', 'Mehsana', 'Patan']
      },
      {
        name: 'Delhi NCR',
        cities: ['New Delhi', 'Delhi', 'Noida', 'Greater Noida', 'Gurugram', 'Faridabad', 'Ghaziabad']
      },
      {
        name: 'Karnataka',
        cities: ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi', 'Gulbarga', 'Davanagere', 'Bellary', 'Shivamogga', 'Tumakuru', 'Udupi']
      },
      {
        name: 'Telangana',
        cities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar', 'Nalgonda']
      },
      {
        name: 'Tamil Nadu',
        cities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Tirunelveli', 'Thanjavur', 'Kanchipuram']
      },
      {
        name: 'Uttar Pradesh',
        cities: ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura']
      },
      {
        name: 'West Bengal',
        cities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Kharagpur', 'Haldia', 'Malda']
      },
      {
        name: 'Rajasthan',
        cities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Sikar', 'Sri Ganganagar']
      },
      {
        name: 'Madhya Pradesh',
        cities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam']
      },
      {
        name: 'Kerala',
        cities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur', 'Kannur', 'Alappuzha', 'Kottayam', 'Palakkad']
      },
      {
        name: 'Bihar',
        cities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai']
      },
      {
        name: 'Punjab',
        cities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur']
      },
      {
        name: 'Haryana',
        cities: ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat']
      },
      {
        name: 'Jharkhand',
        cities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Hazaribagh', 'Deoghar']
      },
      {
        name: 'Odisha',
        cities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore']
      },
      {
        name: 'Assam',
        cities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia']
      },
      {
        name: 'Jammu and Kashmir',
        cities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur']
      },
      {
        name: 'Goa',
        cities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa']
      }
    ]
  },
  {
    name: 'United Arab Emirates',
    code: '+971',
    states: [
      {
        name: 'Dubai',
        cities: ['Dubai', 'Deira', 'Bur Dubai', 'Downtown Dubai', 'Jumeirah', 'Dubai Marina', 'Business Bay', 'Al Barsha']
      },
      {
        name: 'Abu Dhabi',
        cities: ['Abu Dhabi City', 'Al Ain', 'Ruwais', 'Al Dhafra']
      },
      {
        name: 'Sharjah',
        cities: ['Sharjah City', 'Khor Fakkan', 'Kalba', 'Al Dhaid']
      },
      {
        name: 'Ajman',
        cities: ['Ajman City', 'Masfout', 'Manama']
      },
      {
        name: 'Ras Al Khaimah',
        cities: ['Ras Al Khaimah City', 'Al Jazirah Al Hamra', 'Al Rams']
      },
      {
        name: 'Fujairah',
        cities: ['Fujairah City', 'Dibba Al-Fujairah']
      },
      {
        name: 'Umm Al Quwain',
        cities: ['Umm Al Quwain City', 'Falaj Al Mualla']
      }
    ]
  },
  {
    name: 'Saudi Arabia',
    code: '+966',
    states: [
      {
        name: 'Riyadh Region',
        cities: ['Riyadh', 'Al Kharj', 'Al Majma\'ah', 'Al Diriyah', 'Dawadmi']
      },
      {
        name: 'Makkah Region',
        cities: ['Jeddah', 'Makkah', 'Taif', 'Rabigh', 'Al Qunfudhah']
      },
      {
        name: 'Madinah Region',
        cities: ['Madinah', 'Yanbu', 'Badr', 'Al Ula']
      },
      {
        name: 'Eastern Province',
        cities: ['Dammam', 'Khobar', 'Dhahran', 'Jubail', 'Al Ahsa', 'Qatif', 'Hafar Al Batin']
      },
      {
        name: 'Asir Region',
        cities: ['Abha', 'Khamis Mushait', 'Bisha']
      },
      {
        name: 'Tabuk Region',
        cities: ['Tabuk', 'Neom', 'Dubba', 'Sharma']
      },
      {
        name: 'Qassim Region',
        cities: ['Buraidah', 'Unaizah', 'Al Rass']
      }
    ]
  },
  {
    name: 'United States',
    code: '+1',
    states: [
      {
        name: 'California',
        cities: ['Los Angeles', 'San Francisco', 'San Jose', 'San Diego', 'Sacramento', 'Fremont', 'Irvine', 'Santa Clara', 'Oakland', 'Palo Alto']
      },
      {
        name: 'New York',
        cities: ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany', 'Yonkers']
      },
      {
        name: 'Texas',
        cities: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Plano']
      },
      {
        name: 'Illinois',
        cities: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford']
      },
      {
        name: 'Washington',
        cities: ['Seattle', 'Bellevue', 'Redmond', 'Spokane', 'Tacoma']
      },
      {
        name: 'New Jersey',
        cities: ['Jersey City', 'Newark', 'Edison', 'Princeton', 'Hoboken', 'Paterson']
      },
      {
        name: 'Florida',
        cities: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale']
      },
      {
        name: 'Massachusetts',
        cities: ['Boston', 'Cambridge', 'Worcester', 'Springfield', 'Lowell']
      }
    ]
  },
  {
    name: 'United Kingdom',
    code: '+44',
    states: [
      {
        name: 'England',
        cities: ['London', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool', 'Bristol', 'Newcastle', 'Sheffield', 'Leicester', 'Nottingham', 'Oxford', 'Cambridge']
      },
      {
        name: 'Scotland',
        cities: ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness']
      },
      {
        name: 'Wales',
        cities: ['Cardiff', 'Swansea', 'Newport', 'Wrexham']
      },
      {
        name: 'Northern Ireland',
        cities: ['Belfast', 'Derry', 'Lisburn', 'Newry']
      }
    ]
  },
  {
    name: 'Canada',
    code: '+1',
    states: [
      {
        name: 'Ontario',
        cities: ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Waterloo', 'Windsor']
      },
      {
        name: 'British Columbia',
        cities: ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Victoria', 'Kelowna']
      },
      {
        name: 'Alberta',
        cities: ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge']
      },
      {
        name: 'Quebec',
        cities: ['Montreal', 'Quebec City', 'Laval', 'Gatineau']
      }
    ]
  },
  {
    name: 'Australia',
    code: '+61',
    states: [
      {
        name: 'New South Wales',
        cities: ['Sydney', 'Newcastle', 'Wollongong', 'Parramatta', 'Central Coast']
      },
      {
        name: 'Victoria',
        cities: ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo']
      },
      {
        name: 'Queensland',
        cities: ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns']
      },
      {
        name: 'Western Australia',
        cities: ['Perth', 'Fremantle', 'Mandurah', 'Bunbury']
      }
    ]
  },
  {
    name: 'Singapore',
    code: '+65',
    states: [
      {
        name: 'Singapore',
        cities: ['Central Region', 'Jurong', 'Woodlands', 'Tampines', 'Bedok', 'Ang Mo Kio', 'Punggol', 'Yishun']
      }
    ]
  },
  {
    name: 'Qatar',
    code: '+974',
    states: [
      {
        name: 'Ad Dawhah',
        cities: ['Doha', 'West Bay', 'The Pearl-Qatar', 'Lusail']
      },
      {
        name: 'Al Rayyan',
        cities: ['Al Rayyan', 'Education City', 'Al Wajbah']
      },
      {
        name: 'Al Wakrah',
        cities: ['Al Wakrah', 'Mesaieed']
      },
      {
        name: 'Al Khor',
        cities: ['Al Khor', 'Ras Laffan']
      }
    ]
  },
  {
    name: 'Oman',
    code: '+968',
    states: [
      {
        name: 'Muscat Governorate',
        cities: ['Muscat', 'Ruwi', 'Matrah', 'Seeb', 'Bawshar', 'Amerat']
      },
      {
        name: 'Dhofar Governorate',
        cities: ['Salalah', 'Mirbat', 'Taqah']
      },
      {
        name: 'Al Batinah',
        cities: ['Sohar', 'Suwaiq', 'Barka', 'Rustaq']
      }
    ]
  },
  {
    name: 'Kuwait',
    code: '+965',
    states: [
      {
        name: 'Capital Governorate',
        cities: ['Kuwait City', 'Sharq', 'Mirgab', 'Dasman']
      },
      {
        name: 'Hawalli Governorate',
        cities: ['Hawalli', 'Salmiya', 'Salwa', 'Jabriya']
      },
      {
        name: 'Farwaniya Governorate',
        cities: ['Farwaniya', 'Khaitan', 'Jleeb Al-Shuyoukh']
      },
      {
        name: 'Ahmadi Governorate',
        cities: ['Ahmadi', 'Fahaheel', 'Mangaf', 'Mahboula']
      }
    ]
  },
  {
    name: 'Bahrain',
    code: '+973',
    states: [
      {
        name: 'Capital Governorate',
        cities: ['Manama', 'Juffair', 'Seef', 'Diplomatic Area']
      },
      {
        name: 'Muharraq Governorate',
        cities: ['Muharraq', 'Amwaj Islands', 'Busaiteen']
      },
      {
        name: 'Northern Governorate',
        cities: ['Budaiya', 'Saar', 'Hamad Town']
      },
      {
        name: 'Southern Governorate',
        cities: ['Riffa', 'Isa Town', 'Zallaq']
      }
    ]
  },
  {
    name: 'Germany',
    code: '+49',
    states: [
      {
        name: 'Bavaria',
        cities: ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg']
      },
      {
        name: 'North Rhine-Westphalia',
        cities: ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Bonn']
      },
      {
        name: 'Berlin',
        cities: ['Berlin']
      },
      {
        name: 'Hesse',
        cities: ['Frankfurt', 'Wiesbaden', 'Kassel', 'Darmstadt']
      }
    ]
  },
  {
    name: 'France',
    code: '+33',
    states: [
      {
        name: 'Île-de-France',
        cities: ['Paris', 'Boulogne-Billancourt', 'Versailles', 'Saint-Denis']
      },
      {
        name: 'Auvergne-Rhône-Alpes',
        cities: ['Lyon', 'Grenoble', 'Saint-Étienne']
      },
      {
        name: 'Provence-Alpes-Côte d\'Azur',
        cities: ['Marseille', 'Nice', 'Cannes', 'Toulon']
      }
    ]
  },
  {
    name: 'Malaysia',
    code: '+60',
    states: [
      {
        name: 'Kuala Lumpur',
        cities: ['Kuala Lumpur', 'Bukit Bintang', 'Cheras', 'Mont Kiara']
      },
      {
        name: 'Selangor',
        cities: ['Petaling Jaya', 'Shah Alam', 'Subang Jaya', 'Klang', 'Cyberjaya']
      },
      {
        name: 'Penang',
        cities: ['George Town', 'Bayan Lepas', 'Butterworth']
      },
      {
        name: 'Johor',
        cities: ['Johor Bahru', 'Iskandar Puteri', 'Batu Pahat']
      }
    ]
  },
  {
    name: 'Turkey',
    code: '+90',
    states: [
      {
        name: 'Istanbul Province',
        cities: ['Istanbul', 'Kadikoy', 'Besiktas', 'Uskudar', 'Beyoglu']
      },
      {
        name: 'Ankara Province',
        cities: ['Ankara', 'Cankaya', 'Kecioren']
      },
      {
        name: 'Izmir Province',
        cities: ['Izmir', 'Karsiyaka', 'Bornova']
      }
    ]
  },
  {
    name: 'Pakistan',
    code: '+92',
    states: [
      {
        name: 'Sindh',
        cities: ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana']
      },
      {
        name: 'Punjab',
        cities: ['Lahore', 'Rawalpindi', 'Faisalabad', 'Multan', 'Gujranwala', 'Sialkot']
      },
      {
        name: 'Khyber Pakhtunkhwa',
        cities: ['Peshawar', 'Mardan', 'Abbottabad']
      },
      {
        name: 'Islamabad Capital Territory',
        cities: ['Islamabad']
      }
    ]
  },
  {
    name: 'Bangladesh',
    code: '+880',
    states: [
      {
        name: 'Dhaka Division',
        cities: ['Dhaka', 'Gazipur', 'Narayanganj']
      },
      {
        name: 'Chittagong Division',
        cities: ['Chittagong', 'Cox\'s Bazar', 'Comilla']
      },
      {
        name: 'Sylhet Division',
        cities: ['Sylhet', 'Moulvibazar']
      }
    ]
  },
  {
    name: 'Sri Lanka',
    code: '+94',
    states: [
      {
        name: 'Western Province',
        cities: ['Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Negombo', 'Sri Jayawardenepura Kotte']
      },
      {
        name: 'Central Province',
        cities: ['Kandy', 'Matale', 'Nuwara Eliya']
      }
    ]
  }
];

// Helper functions for dropdown population
export function getCountryList(): { name: string; code: string }[] {
  return LOCATION_DATA.map(country => ({ name: country.name, code: country.code }));
}

export function getCountryCodeList(): { label: string; value: string }[] {
  // Returns unique dial codes with primary country labels
  const seen = new Set<string>();
  const list: { label: string; value: string }[] = [];
  LOCATION_DATA.forEach(c => {
    list.push({ label: `${c.code} (${c.name})`, value: c.code });
  });
  return list;
}

export function getStatesByCountry(countryName: string): string[] {
  if (!countryName) return [];
  const found = LOCATION_DATA.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  return found ? found.states.map(s => s.name) : [];
}

export function getCitiesByState(countryName: string, stateName: string): string[] {
  if (!countryName || !stateName) return [];
  const foundCountry = LOCATION_DATA.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  if (!foundCountry) return [];
  const foundState = foundCountry.states.find(s => s.name.toLowerCase() === stateName.toLowerCase());
  return foundState ? foundState.cities : [];
}

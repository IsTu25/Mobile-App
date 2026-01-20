const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_EMAIL = 'isfakiqbal@iut-dhaka.edu';
const DEFAULT_PHONE = '01837121760';

// List of all districts in Bangladesh with their approximate center coordinates (lat, lon) and division
const districts = [
    // Dhaka Division
    { name: 'Dhaka', lat: 23.8103, lon: 90.4125, division: 'Dhaka', stations: ['Ramna', 'Motijheel', 'Gulshan', 'Dhanmondi', 'Mirpur', 'Pallabi', 'Uttara', 'Cantonment', 'Tejgaon', 'Badda', 'Khilgaon', 'Shahbagh', 'Lalbagh', 'Kotwali', 'Sutrapur', 'Demra', 'Jatrabari', 'Kadamtali', 'Shyampur', 'Sabujbagh', 'Mohammadpur', 'Adabor', 'Sher-e-Bangla Nagar', 'Hazaribagh', 'New Market', 'Chawkbazar', 'Bangshal', 'Gendaria', 'Wari', 'Kamrangirchar', 'Turag', 'Kafrul', 'Shah Ali', 'Dakshinkhan', 'Uttarkhan', 'Bhatara', 'Khilkhet', 'Vatara', 'Banani', 'Rampura', 'Hatirjheel', 'Mugda', 'Rupnagar', 'Bhashantek', 'Darussalam', 'Gandaria', 'Hazaribagh', 'Kalabagan', 'Paltan', 'Shahjahanpur', 'Vatara'] },
    { name: 'Gazipur', lat: 24.002286, lon: 90.426428, division: 'Dhaka', stations: ['Gazipur Sadar', 'Tongi', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj', 'Joydebpur', 'Gacha', 'Bason', 'Konabari', 'Kashimpur', 'Pubail'] },
    { name: 'Narayanganj', lat: 23.63366, lon: 90.496482, division: 'Dhaka', stations: ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj', 'Bandar', 'Rupganj', 'Araihazar', 'Sonargaon'] },
    { name: 'Tangail', lat: 24.263614, lon: 89.917948, division: 'Dhaka', stations: ['Tangail Sadar', 'Sakhipur', 'Basail', 'Madhupur', 'Ghatail', 'Kalihati', 'Nagarpur', 'Mirzapur', 'Gopalpur', 'Delduar', 'Bhuapur', 'Dhanbari'] },
    { name: 'Narsingdi', lat: 23.932233, lon: 90.71541, division: 'Dhaka', stations: ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur'] },
    { name: 'Manikganj', lat: 23.8644, lon: 90.0047, division: 'Dhaka', stations: ['Manikganj Sadar', 'Singair', 'Shibalaya', 'Saturia', 'Harirampur', 'Ghior', 'Daulatpur'] },
    { name: 'Munshiganj', lat: 23.5422, lon: 90.5305, division: 'Dhaka', stations: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Louhajang', 'Gajaria', 'Tongibari'] },
    { name: 'Faridpur', lat: 23.607082, lon: 89.8429406, division: 'Dhaka', stations: ['Faridpur Sadar', 'Boalmari', 'Alfadanga', 'Madhukhali', 'Bhanga', 'Nagarkanda', 'Charbhadrasan', 'Sadarpur', 'Saltha'] },
    { name: 'Gopalganj', lat: 23.005086, lon: 89.826605, division: 'Dhaka', stations: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'] },
    { name: 'Madaripur', lat: 23.164102, lon: 90.1896805, division: 'Dhaka', stations: ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar'] },
    { name: 'Rajbari', lat: 23.7574305, lon: 89.6444665, division: 'Dhaka', stations: ['Rajbari Sadar', 'Goalanda', 'Pangsha', 'Baliakandi', 'Kalukhali'] },
    { name: 'Shariatpur', lat: 23.2423, lon: 90.4348, division: 'Dhaka', stations: ['Shariatpur Sadar', 'Naria', 'Zajira', 'Gosairhat', 'Bhedarganj', 'Damudya'] },
    { name: 'Kishoreganj', lat: 24.444937, lon: 90.776575, division: 'Dhaka', stations: ['Kishoreganj Sadar', 'Hossainpur', 'Pakundia', 'Katiadi', 'Karimganj', 'Tarail', 'Itna', 'Mithamain', 'Austagram', 'Nikli', 'Bajitpur', 'Kuliarchar', 'Bhairab'] },

    // Chattogram Division
    { name: 'Chattogram', lat: 22.3569, lon: 91.7832, division: 'Chattogram', stations: ['Kotwali', 'Panchlaish', 'Double Mooring', 'Pahartali', 'Khulshi', 'Patenga', 'Halishahar', 'Bandar', 'Chandgaon', 'Karnaphuli', 'Bakalia', 'Akbarshah', 'Bayazid Bostami', 'EPZ', 'Sadarghat', 'Raozan', 'Rangunia', 'Fatikchhari', 'Hathazari', 'Mirsharai', 'Sitakunda', 'Lohagara', 'Satkania', 'Boalkhali', 'Anwara', 'Banshkhali', 'Patiya', 'Sandwip', 'Bhujpur', 'Jorarganj'] },
    { name: 'Cox\'s Bazar', lat: 21.4272, lon: 92.0058, division: 'Chattogram', stations: ['Cox\'s Bazar Sadar', 'Chakaria', 'Maheshkhali', 'Teknaf', 'Ramu', 'Kutubdia', 'Ukhiya', 'Pekua'] },
    { name: 'Cumilla', lat: 23.4607, lon: 91.1809, division: 'Chattogram', stations: ['Cumilla Sadar', 'Laksam', 'Debidwar', 'Muradnagar', 'Daudkandi', 'Chauddagram', 'Brahmanpara', 'Burichang', 'Chandina', 'Barura', 'Monohargonj', 'Homna', 'Titas', 'Meghna', 'Nangalkot', 'Sadar South'] },
    { name: 'Brahmanbaria', lat: 23.9570, lon: 91.1119, division: 'Chattogram', stations: ['Brahmanbaria Sadar', 'Ashuganj', 'Nasirnagar', 'Nabinagar', 'Sarail', 'Shahbazpur', 'Kasba', 'Akhaura', 'Bancharampur', 'Bijoynagar'] },
    { name: 'Chandpur', lat: 23.2333, lon: 90.6667, division: 'Chattogram', stations: ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab North', 'Matlab South', 'Shahrasti'] },
    { name: 'Feni', lat: 23.0186, lon: 91.3966, division: 'Chattogram', stations: ['Feni Sadar', 'Daganbhuiyan', 'Sonagazi', 'Chhagalnaiya', 'Parshuram', 'Fulgazi'] },
    { name: 'Noakhali', lat: 22.8696, lon: 91.0993, division: 'Chattogram', stations: ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Senbagh', 'Sonaimuri', 'Subarnachar', 'Kabirhat'] },
    { name: 'Lakshmipur', lat: 22.9424, lon: 90.8411, division: 'Chattogram', stations: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar'] },
    { name: 'Khagrachhari', lat: 23.1192, lon: 91.9841, division: 'Chattogram', stations: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Laxmichhari', 'Mahalchhari', 'Manikchhari', 'Ramgarh', 'Matiranga', 'Guimara'] },
    { name: 'Rangamati', lat: 22.6533, lon: 92.1789, division: 'Chattogram', stations: ['Rangamati Sadar', 'Belaichhari', 'Bagaichhari', 'Barkal', 'Juraichhari', 'Rajasthali', 'Kaptai', 'Langadu', 'Naniarchar', 'Kaukhali'] },
    { name: 'Bandarban', lat: 22.1953, lon: 92.2184, division: 'Chattogram', stations: ['Bandarban Sadar', 'Thanchi', 'Lama', 'Naikhongchhari', 'Ali Kadam', 'Rowangchhari', 'Ruma'] },

    // Rajshahi Division
    { name: 'Rajshahi', lat: 24.3636, lon: 88.6241, division: 'Rajshahi', stations: ['Boalia', 'Rajpara', 'Motihar', 'Shah Makhdum', 'Chandrima', 'Katakhali', 'Belpukur', 'Airport', 'Kashiadanga', 'Kornohar', 'Damkura', 'Paba', 'Durgapur', 'Mohonpur', 'Charghat', 'Puthia', 'Bagha', 'Godagari', 'Tanore', 'Bagmara'] },
    { name: 'Bogura', lat: 24.8481, lon: 89.3730, division: 'Rajshahi', stations: ['Bogura Sadar', 'Shajahanpur', 'Sherpur', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Sonatala', 'Shibganj', 'Adamdighi'] },
    { name: 'Pabna', lat: 24.0063, lon: 89.2493, division: 'Rajshahi', stations: ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sujanagar'] },
    { name: 'Sirajganj', lat: 24.3141, lon: 89.5700, division: 'Rajshahi', stations: ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara'] },
    { name: 'Naogaon', lat: 24.8105, lon: 88.9439, division: 'Rajshahi', stations: ['Naogaon Sadar', 'Mohadevpur', 'Manda', 'Niamatpur', 'Porsha', 'Sapahar', 'Patnitala', 'Dhamoirhat', 'Badalgachhi', 'Raninagar', 'Atrai'] },
    { name: 'Natore', lat: 24.4102, lon: 89.0076, division: 'Rajshahi', stations: ['Natore Sadar', 'Baraigram', 'Bagatipara', 'Lalpur', 'Naldanga', 'Singra', 'Gurudaspur'] },
    { name: 'Chapainawabganj', lat: 24.5902, lon: 88.2774, division: 'Rajshahi', stations: ['Chapainawabganj Sadar', 'Gomastapur', 'Nachole', 'Bholahat', 'Shibganj'] },
    { name: 'Joypurhat', lat: 25.0968, lon: 89.0227, division: 'Rajshahi', stations: ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'] },

    // Khulna Division
    { name: 'Khulna', lat: 22.8456, lon: 89.5403, division: 'Khulna', stations: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Aranghata', 'Harintana', 'Labanchara', 'Koyra', 'Dumuria', 'Terokhada', 'Rupsha', 'Paikgachha', 'Phultala', 'Batiaghata', 'Dacope', 'Dighalia'] },
    { name: 'Jashore', lat: 23.1634, lon: 89.2182, division: 'Khulna', stations: ['Kotwali', 'Jhikargachha', 'Sharsha', 'Benapole Port', 'Chaugachha', 'Abhaynagar', 'Manirampur', 'Bagherpara', 'Keshabpur'] },
    { name: 'Satkhira', lat: 22.7234, lon: 89.0552, division: 'Khulna', stations: ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala', 'Patkelghata'] },
    { name: 'Bagerhat', lat: 22.6515, lon: 89.7859, division: 'Khulna', stations: ['Bagerhat Sadar', 'Chitalmari', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'] },
    { name: 'Chuadanga', lat: 23.6402, lon: 88.8418, division: 'Khulna', stations: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar', 'Darshana'] },
    { name: 'Kushtia', lat: 23.9013, lon: 89.1204, division: 'Khulna', stations: ['Kushtia Sadar', 'Kumarkhali', 'Khoksa', 'Mirpur', 'Daulatpur', 'Bheramara', 'Islami University'] },
    { name: 'Magura', lat: 23.4873, lon: 89.4199, division: 'Khulna', stations: ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'] },
    { name: 'Meherpur', lat: 23.7622, lon: 88.6318, division: 'Khulna', stations: ['Meherpur Sadar', 'Gangni', 'Mujibnagar'] },
    { name: 'Narail', lat: 23.1725, lon: 89.5127, division: 'Khulna', stations: ['Narail Sadar', 'Lohagara', 'Kalia', 'Naragati'] },
    { name: 'Jhenaidah', lat: 23.5450, lon: 89.1726, division: 'Khulna', stations: ['Jhenaidah Sadar', 'Shailkupa', 'Harinakunda', 'Kaliganj', 'Kotchandpur', 'Maheshpur'] },

    // Barishal Division
    { name: 'Barishal', lat: 22.7010, lon: 90.3535, division: 'Barishal', stations: ['Kotwali', 'Kawnia', 'Airport', 'Bandar', 'Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'] },
    { name: 'Patuakhali', lat: 22.3596, lon: 90.3299, division: 'Barishal', stations: ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Galachipa', 'Kalapara', 'Mirzaganj', 'Rangabali', 'Dumki', 'Mohipur'] },
    { name: 'Bhola', lat: 22.6859, lon: 90.6482, division: 'Barishal', stations: ['Bhola Sadar', 'Burhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin', 'Sashibhusan', 'South Aicha'] },
    { name: 'Pirojpur', lat: 22.5841, lon: 89.9720, division: 'Barishal', stations: ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad', 'Indurkani'] },
    { name: 'Barguna', lat: 22.1573, lon: 90.1224, division: 'Barishal', stations: ['Barguna Sadar', 'Amtali', 'Bamna', 'Betagi', 'Patharghata', 'Taltali'] },
    { name: 'Jhalokati', lat: 22.6406, lon: 90.1987, division: 'Barishal', stations: ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'] },

    // Sylhet Division
    { name: 'Sylhet', lat: 24.8949, lon: 91.8687, division: 'Sylhet', stations: ['Kotwali', 'Jalalabad', 'Airport', 'Moglabazar', 'South Surma', 'Shahparan', 'Balaganj', 'Beanibazar', 'Bishwanath', 'Companiganj', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar', 'Zakiganj'] },
    { name: 'Moulvibazar', lat: 24.4829, lon: 91.7774, division: 'Sylhet', stations: ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kamalganj', 'Kulaura', 'Rajnagar', 'Sreemangal', 'Sherpur'] },
    { name: 'Habiganj', lat: 24.3749, lon: 91.4155, division: 'Sylhet', stations: ['Habiganj Sadar', 'Ajmiriganj', 'Bahubal', 'Baniyachong', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Shayestaganj'] },
    { name: 'Sunamganj', lat: 25.0658, lon: 91.3956, division: 'Sylhet', stations: ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dharamapasha', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Tahirpur', 'South Sunamganj', 'Madhyanagar'] },

    // Rangpur Division
    { name: 'Rangpur', lat: 25.7439, lon: 89.2752, division: 'Rangpur', stations: ['Kotwali', 'Tajhat', 'Mahiganj', 'Haragach', 'Parsuram', 'Hazirhat', 'Badarganj', 'Gangachara', 'Kaunia', 'Rangpur Sadar', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Taraganj'] },
    { name: 'Dinajpur', lat: 25.6217, lon: 88.6355, division: 'Rangpur', stations: ['Kotwali', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khansama', 'Nawabganj', 'Parbatipur'] },
    { name: 'Gaibandha', lat: 25.3288, lon: 89.5281, division: 'Rangpur', stations: ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Saghata', 'Sundarganj'] },
    { name: 'Kurigram', lat: 25.8054, lon: 89.6362, division: 'Rangpur', stations: ['Kurigram Sadar', 'Nageshwari', 'Bhurungamari', 'Fulbari', 'Rajarhat', 'Ulipur', 'Chilmari', 'Rowmari', 'Char Rajibpur', 'Kachakata'] },
    { name: 'Lalmonirhat', lat: 25.9165, lon: 89.4532, division: 'Rangpur', stations: ['Lalmonirhat Sadar', 'Aditmari', 'Kaliganj', 'Hatibandha', 'Patgram'] },
    { name: 'Nilphamari', lat: 25.9318, lon: 88.8561, division: 'Rangpur', stations: ['Nilphamari Sadar', 'Saidpur', 'Jaldhaka', 'Kishoreganj', 'Domar', 'Dimla'] },
    { name: 'Panchagarh', lat: 26.3411, lon: 88.5542, division: 'Rangpur', stations: ['Panchagarh Sadar', 'Boda', 'Debiganj', 'Atwari', 'Tetulia'] },
    { name: 'Thakurgaon', lat: 26.0337, lon: 88.4617, division: 'Rangpur', stations: ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranishankail'] },

    // Mymensingh Division
    { name: 'Mymensingh', lat: 24.7471, lon: 90.4203, division: 'Mymensingh', stations: ['Kotwali', 'Muktagachha', 'Fulbaria', 'Trishal', 'Bhaluka', 'Gaffargaon', 'Nandail', 'Ishwarganj', 'Gouripur', 'Phulpur', 'Haluaghat', 'Dhobaura', 'Tara Khanda', 'Pagla'] },
    { name: 'Jamalpur', lat: 24.9375, lon: 89.9378, division: 'Mymensingh', stations: ['Jamalpur Sadar', 'Melandah', 'Islampur', 'Dewanganj', 'Sarishabari', 'Madarganj', 'Bakshiganj'] },
    { name: 'Netrokona', lat: 24.8709, lon: 90.7279, division: 'Mymensingh', stations: ['Netrokona Sadar', 'Barhatta', 'Durgapur', 'Khaliajuri', 'Kalmakanda', 'Kendua', 'Madan', 'Mohanganj', 'Purbadhala', 'Atpara'] },
    { name: 'Sherpur', lat: 25.0205, lon: 90.0153, division: 'Mymensingh', stations: ['Sherpur Sadar', 'Nakatla', 'Nalitabari', 'Sreebardi', 'Jhenaigati'] },
];

// Helper to generate a somewhat random but clustered coordinate offset
// This distributes stations around the district center (approx 5-15km radius)
function getOffset() {
    return (Math.random() - 0.5) * 0.15;
}

// Generate the CSV content
let csvContent = `name,district,division,latitude,longitude,email,phone\n`;
let totalStations = 0;

districts.forEach(district => {
    district.stations.forEach((stationName, index) => {
        // Construct full station name
        const fullName = stationName.toLowerCase().includes('station') || stationName.toLowerCase().includes('thana')
            ? stationName
            : `${stationName} Police Station`;

        // Generate coordinates
        // The first station (usually Sadar/Kotwali) gets the exact district coordinates
        // Others get slight offsets to simulate being spread out in the district
        let lat = district.lat;
        let lon = district.lon;

        if (index > 0) {
            lat += getOffset();
            lon += getOffset();
        }

        // Add to CSV
        csvContent += `"${fullName}","${district.name}","${district.division}",${lat.toFixed(4)},${lon.toFixed(4)},${DEFAULT_EMAIL},${DEFAULT_PHONE}\n`;
        totalStations++;
    });
});

// Write to file
const outputPath = path.join(__dirname, 'data/police_stations.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`✅ generated ${totalStations} police stations in CSV.`);
console.log(`📂 Saved to: ${outputPath}`);

import { useState } from 'react';
import { PlusCircle, Search, ArrowLeft, Info, AlertTriangle, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';

// Comprehensive Database of 100 Common Medications
const pillDatabase = [
    // Analgesics & Antipyretics (Pain & Fever)
    { id: 1, name: "Paracetamol", brand: "Napa / Ace", use: "Fever, Mild Pain", dosage: "500mg - 1000mg every 6-8 hours", warning: "Do not exceed 4000mg per day. High doses can cause liver damage." },
    { id: 2, name: "Paracetamol + Caffeine", brand: "Napa Extra / Ace Plus", use: "Headache, Fever, Body Ache", dosage: "1-2 tablets every 6 hours", warning: "Avoid excessive caffeine intake (coffee/tea) while taking this." },
    { id: 3, name: "Paracetamol ER", brand: "Napa Extend", use: "Persistent Fever, Joint Pain", dosage: "665mg every 8 hours", warning: "Swallow whole, do not crush or chew." },
    { id: 4, name: "Ibuprofen", brand: "Profen / Reumafen", use: "Inflammation, Muscle Pain", dosage: "200mg - 400mg every 8 hours", warning: "Take after meals to avoid stomach ulcers." },
    { id: 5, name: "Naproxen", brand: "Naprosyn / Xenapro", use: "Migraine, Arthritis Pain", dosage: "250mg - 500mg twice daily", warning: "May increase risk of heart issues if used long-term." },
    { id: 6, name: "Ketorolac", brand: "Rolac / Torax", use: "Severe Acute Pain, Post-surgery", dosage: "10mg every 4-6 hours", warning: "Do not use for more than 5 days. High risk of bleeding." },
    { id: 7, name: "Diclofenac", brand: "Voltalin / Clofenac", use: "Joint Pain, Swelling", dosage: "50mg twice or thrice daily", warning: "Take strictly after meals. Avoid in severe asthma." },
    { id: 8, name: "Aceclofenac", brand: "Flexi / Reservix", use: "Osteoarthritis, Rheumatoid Arthritis", dosage: "100mg twice daily", warning: "Not recommended during pregnancy." },
    { id: 9, name: "Tramadol", brand: "Anadol / Trada", use: "Moderate to Severe Pain", dosage: "50mg - 100mg every 4-6 hours", warning: "Rx ONLY. Can cause dizziness and dependency." },
    { id: 10, name: "Aspirin", brand: "Ecosprin / Disprin", use: "Blood Thinning, Chest Pain", dosage: "75mg - 150mg once daily", warning: "Do not give to children under 16 (Reye's syndrome risk)." },

    // Anti-Ulcerants & Antacids (Gastric)
    { id: 11, name: "Omeprazole", brand: "Seclo / Losectil", use: "Acidity, Gastric Ulcer", dosage: "20mg once daily before meal", warning: "Long-term use may reduce calcium and vitamin B12 absorption." },
    { id: 12, name: "Esomeprazole", brand: "Maxpro / Sergel", use: "Severe Acidity, GERD", dosage: "20mg - 40mg once daily before meal", warning: "Consult doctor if taking for more than 14 days." },
    { id: 13, name: "Pantoprazole", brand: "Pantodac / Trupan", use: "Heartburn, Acid Reflux", dosage: "40mg once daily before breakfast", warning: "May interact with certain antifungal medications." },
    { id: 14, name: "Rabeprazole", brand: "Finix / Rabeca", use: "Stomach Ulcers", dosage: "20mg once daily", warning: "Can cause mild headache or diarrhea initially." },
    { id: 15, name: "Dexlansoprazole", brand: "Dexlan / Dexpro", use: "Erosive Esophagitis", dosage: "30mg - 60mg once daily", warning: "Can be taken with or without food." },
    { id: 16, name: "Famotidine", brand: "Neoceptin / Famotack", use: "Mild Heartburn, Indigestion", dosage: "20mg - 40mg twice daily", warning: "Reduce dose in patients with kidney problems." },
    { id: 17, name: "Domperidone", brand: "Motigut / Omidon", use: "Nausea, Vomiting, Bloating", dosage: "10mg 15-30 mins before meals", warning: "Do not use if you have irregular heartbeats." },
    { id: 18, name: "Mebeverine", brand: "Irin / Mebec", use: "IBS, Stomach Cramps", dosage: "135mg three times daily 20 mins before food", warning: "May cause rare allergic skin reactions." },
    { id: 19, name: "Hyoscine Butylbromide", brand: "Butapan / Hyospan", use: "Abdominal Spasm, Menstrual Cramps", dosage: "10mg - 20mg up to 4 times daily", warning: "Can cause dry mouth and blurred vision." },
    { id: 20, name: "Sodium Alginate + Antacid", brand: "Gavisol / Asynta", use: "Instant Heartburn Relief", dosage: "10-20ml after meals and at bedtime", warning: "Leave a 2-hour gap between this and other oral medicines." },

    // Antihistamines & Allergy
    { id: 21, name: "Cetirizine", brand: "Alatrol / Atrizin", use: "Allergies, Runny Nose", dosage: "10mg once daily at night", warning: "May cause mild to moderate drowsiness. Avoid driving." },
    { id: 22, name: "Levocetirizine", brand: "Alcuf / Curin", use: "Chronic Allergies, Hives", dosage: "5mg once daily", warning: "Less drowsy than Cetirizine, but caution still advised." },
    { id: 23, name: "Fexofenadine", brand: "Fexo / Telfast", use: "Daytime Allergies, Sneezing", dosage: "120mg - 180mg once daily", warning: "Non-drowsy. Do not take with fruit juices (apple/orange)." },
    { id: 24, name: "Loratadine", brand: "Oradin / Loratin", use: "Seasonal Allergies", dosage: "10mg once daily", warning: "Safe for most adults; rarely causes fatigue." },
    { id: 25, name: "Desloratadine", brand: "Neoclor / Deslor", use: "Itchy Skin, Allergic Rhinitis", dosage: "5mg once daily", warning: "Can be taken with or without food." },
    { id: 26, name: "Rupatadine", brand: "Rupatrol / Rupan", use: "Severe Allergic Rhinitis", dosage: "10mg once daily", warning: "Avoid grapefruit juice while on this medication." },
    { id: 27, name: "Bilastine", brand: "Bilaxten / Bilash", use: "Hives, Eye Allergies", dosage: "20mg once daily", warning: "Must be taken 1 hour before or 2 hours after food." },
    { id: 28, name: "Chlorpheniramine", brand: "Histacin / Piriton", use: "Acute Allergic Reactions", dosage: "4mg every 4-6 hours", warning: "Highly sedating. Often used in cold syrups." },
    { id: 29, name: "Promethazine", brand: "Phenergan / Prometh", use: "Severe Nausea, Motion Sickness", dosage: "25mg at night or before travel", warning: "Strong sedative effect. Do not mix with alcohol." },
    { id: 30, name: "Montelukast", brand: "Monas / Odmon", use: "Asthma Prevention, Dust Allergy", dosage: "10mg once daily in the evening", warning: "Not for instant asthma relief. Can rarely cause mood changes." },

    // Antibiotics (Prescription Strictly Required)
    { id: 31, name: "Amoxicillin", brand: "Moxacil / Tycil", use: "Bacterial Infections, Tonsillitis", dosage: "500mg every 8 hours for 5-7 days", warning: "Rx ONLY. Finish the full course. Avoid if allergic to Penicillin." },
    { id: 32, name: "Co-amoxiclav", brand: "Fimoxyl / Augmentin", use: "Severe Respiratory Infections", dosage: "625mg twice daily", warning: "Rx ONLY. Can cause diarrhea. Take with food." },
    { id: 33, name: "Cefixime", brand: "Cef-3 / Denvar", use: "Typhoid, Urinary Tract Infections", dosage: "200mg - 400mg daily for 7-14 days", warning: "Rx ONLY. May cause mild stomach upset." },
    { id: 34, name: "Cefuroxime", brand: "Furotil / Cefur", use: "Skin, Ear, and Throat Infections", dosage: "250mg - 500mg twice daily", warning: "Rx ONLY. Take after food for better absorption." },
    { id: 35, name: "Azithromycin", brand: "Zimax / Tridosil", use: "Throat, Lung & Sinus Infections", dosage: "500mg once daily for 3-5 days", warning: "Rx ONLY. Take 1 hour before or 2 hours after meals." },
    { id: 36, name: "Erythromycin", brand: "Eromycin / Erythro", use: "Alternative for Penicillin Allergy", dosage: "250mg - 500mg every 6 hours", warning: "Rx ONLY. Often causes severe nausea if taken empty stomach." },
    { id: 37, name: "Ciprofloxacin", brand: "Ciprocin / Neofloxin", use: "Severe UTI, Stomach Infections", dosage: "500mg twice daily", warning: "Rx ONLY. Avoid taking with dairy products or antacids." },
    { id: 38, name: "Levofloxacin", brand: "Levo / Treox", use: "Pneumonia, Bronchitis", dosage: "500mg once daily", warning: "Rx ONLY. May cause tendon pain or weakness." },
    { id: 39, name: "Doxycycline", brand: "Doxiva / Doxcin", use: "Acne, Cholera, Syphilis", dosage: "100mg once or twice daily", warning: "Rx ONLY. Avoid sun exposure. Do not lie down for 30 mins after taking." },
    { id: 40, name: "Flucloxacillin", brand: "Phylopen / Flubex", use: "Skin Infections, Wounds", dosage: "500mg four times a day", warning: "Rx ONLY. Must be taken on an empty stomach." },
    { id: 41, name: "Metronidazole", brand: "Amodis / Flagyl", use: "Amoebic Dysentery, Dental Infections", dosage: "400mg three times daily", warning: "Rx ONLY. STRICTLY avoid alcohol; causes severe vomiting." },
    { id: 42, name: "Secnidazole", brand: "Secnil / Seczol", use: "Intestinal Parasites", dosage: "2g as a single dose", warning: "Rx ONLY. Often leaves a metallic taste in the mouth." },
    { id: 43, name: "Nitrofurantoin", brand: "Nintoin / Uro-care", use: "Urinary Tract Infections (UTI)", dosage: "100mg twice daily", warning: "Rx ONLY. Will turn urine dark yellow or brown." },

    // Antifungals & Antivirals & Anti-parasitic
    { id: 44, name: "Fluconazole", brand: "Flugal / Lucan-R", use: "Fungal Infections, Yeast Infection", dosage: "150mg single dose or as prescribed", warning: "Interacts with many liver-processed medications." },
    { id: 45, name: "Itraconazole", brand: "Itra / Sporal", use: "Severe Ringworm, Nail Fungi", dosage: "100mg - 200mg daily", warning: "Take immediately after a full meal for absorption." },
    { id: 46, name: "Terbinafine", brand: "Terbex / Xfin", use: "Nail and Skin Fungal Infections", dosage: "250mg once daily", warning: "Requires liver function tests if used for months." },
    { id: 47, name: "Acyclovir", brand: "Virux / Zovirax", use: "Chickenpox, Herpes, Shingles", dosage: "400mg - 800mg up to 5 times daily", warning: "Drink plenty of water to protect kidneys." },
    { id: 48, name: "Albendazole", brand: "Almex / Alben", use: "Worm Infections (De-worming)", dosage: "400mg single dose", warning: "Chew the tablet well before swallowing. Avoid in pregnancy." },
    { id: 49, name: "Mebendazole", brand: "Meben / Vermox", use: "Threadworms, Hookworms", dosage: "100mg twice daily for 3 days", warning: "Can be taken with or without food." },
    { id: 50, name: "Ivermectin", brand: "Ivera / Scabo", use: "Scabies, Lice, Parasites", dosage: "Based on body weight (single dose)", warning: "Take on an empty stomach with water." },

    // Cardiovascular (Blood Pressure & Cholesterol) - Strictly Rx
    { id: 51, name: "Losartan", brand: "Angilock / Osartil", use: "High Blood Pressure", dosage: "50mg once daily", warning: "Rx ONLY. Can cause dizziness when standing up quickly." },
    { id: 52, name: "Valsartan", brand: "Diovan / Valz", use: "High Blood Pressure, Heart Failure", dosage: "80mg - 160mg once daily", warning: "Rx ONLY. Regular kidney function checks required." },
    { id: 53, name: "Olmesartan", brand: "Olmetec / Olmesan", use: "Severe Hypertension", dosage: "20mg - 40mg once daily", warning: "Rx ONLY. Avoid potassium supplements unless advised." },
    { id: 54, name: "Amlodipine", brand: "Camlosart / Amlocal", use: "High Blood Pressure, Angina", dosage: "5mg - 10mg once daily", warning: "Rx ONLY. May cause swelling in the ankles." },
    { id: 55, name: "Nifedipine", brand: "Nifecap / Adalat", use: "Rapid BP Control", dosage: "10mg - 20mg twice daily", warning: "Rx ONLY. Often causes flushing and headache." },
    { id: 56, name: "Atenolol", brand: "Tenoloc / Betaloc", use: "Heart Rate Control, BP", dosage: "50mg once daily", warning: "Rx ONLY. Do not stop abruptly; must be tapered." },
    { id: 57, name: "Bisoprolol", brand: "Bisoloc / Concor", use: "Heart Failure, Fast Heart Rate", dosage: "2.5mg - 5mg once daily", warning: "Rx ONLY. May cause cold hands and feet." },
    { id: 58, name: "Rosuvastatin", brand: "Rova / Rostatin", use: "High Cholesterol", dosage: "10mg - 20mg once daily at night", warning: "Rx ONLY. Report any unexplained muscle pain to your doctor." },
    { id: 59, name: "Atorvastatin", brand: "Lipicon / Atova", use: "Cholesterol & Triglycerides", dosage: "10mg - 40mg once daily", warning: "Rx ONLY. Avoid grapefruit juice." },
    { id: 60, name: "Clopidogrel", brand: "Plagrin / Clopid", use: "Blood Thinner (Post-Stent/Heart Attack)", dosage: "75mg once daily", warning: "Rx ONLY. High risk of prolonged bleeding from minor cuts." },
    { id: 61, name: "Nitroglycerin", brand: "Nidocard / Nitromint", use: "Sudden Chest Pain (Angina)", dosage: "2.6mg spray or sublingual tablet", warning: "Rx ONLY. Keep strictly under the tongue. Causes severe headache." },

    // Anti-Diabetics (Blood Sugar) - Strictly Rx
    { id: 62, name: "Metformin", brand: "Comet / Normet", use: "Type 2 Diabetes (First-line)", dosage: "500mg - 850mg twice daily with meals", warning: "Rx ONLY. Can cause stomach upset and metallic taste." },
    { id: 63, name: "Sitagliptin", brand: "Sitox / Januvia", use: "Type 2 Diabetes Control", dosage: "50mg - 100mg once daily", warning: "Rx ONLY. Report any severe abdominal pain (pancreatitis risk)." },
    { id: 64, name: "Linagliptin", brand: "Linamac / Trajenta", use: "Diabetes (Safe for Kidneys)", dosage: "5mg once daily", warning: "Rx ONLY. No dose adjustment needed for kidney patients." },
    { id: 65, name: "Empagliflozin", brand: "Jardiance / Empa", use: "Diabetes & Heart Protection", dosage: "10mg - 25mg once daily", warning: "Rx ONLY. Increases urination; high risk of urinary infections." },
    { id: 66, name: "Dapagliflozin", brand: "Dapamac / Forxiga", use: "Diabetes & Weight Loss", dosage: "10mg once daily", warning: "Rx ONLY. Stay well hydrated while taking this." },
    { id: 67, name: "Glimepiride", brand: "Secrin / Amaryl", use: "Fast Blood Sugar Reduction", dosage: "1mg - 2mg before breakfast", warning: "Rx ONLY. High risk of hypoglycemia (dangerously low sugar)." },
    { id: 68, name: "Gliclazide", brand: "Diamicron / Comprid", use: "Type 2 Diabetes", dosage: "40mg - 80mg daily", warning: "Rx ONLY. Always carry sugar/candy in case of sudden drops." },

    // Vitamins, Minerals & Supplements
    { id: 69, name: "Calcium + Vitamin D3", brand: "Calbo-D / Aristocal-D", use: "Bone Health, Osteoporosis", dosage: "1 tablet daily after food", warning: "Take with a large glass of water to prevent kidney stones." },
    { id: 70, name: "Iron + Folic Acid + Zinc", brand: "Ipec-Plus / Zif-CI", use: "Anemia, Pregnancy Support", dosage: "1 capsule daily", warning: "May cause dark stools and constipation." },
    { id: 71, name: "Vitamin B Complex", brand: "Aristovit-B / B-50 Forte", use: "Nerve Health, Mouth Ulcers", dosage: "1-2 capsules daily", warning: "May turn urine a bright yellow color (harmless)." },
    { id: 72, name: "Vitamin C", brand: "Ceevit / Ascobex", use: "Immunity, Scurvy, Skin Health", dosage: "250mg - 500mg chewable daily", warning: "Excessive doses can cause diarrhea." },
    { id: 73, name: "Zinc Sulfate", brand: "Xinc / Zis", use: "Hair loss, Diarrhea recovery", dosage: "20mg daily", warning: "Take 1 hour before or 2 hours after meals." },
    { id: 74, name: "Magnesium", brand: "Magmax / Magnox", use: "Muscle Cramps, Sleep Support", dosage: "1 tablet daily", warning: "Can have a mild laxative effect." },
    { id: 75, name: "Multivitamin & Mineral", brand: "Bextram Gold / Filwel Gold", use: "General Weakness, Daily Nutrition", dosage: "1 tablet daily after breakfast", warning: "Do not take on an empty stomach to avoid nausea." },
    { id: 76, name: "Vitamin E", brand: "E-Cap / Evit", use: "Skin Health, Antioxidant", dosage: "200 IU - 400 IU daily", warning: "High doses over long periods can interfere with blood clotting." },
    { id: 77, name: "Folic Acid", brand: "Folson / Folat", use: "Pregnancy Planning, Anemia", dosage: "5mg daily", warning: "Crucial during the first trimester of pregnancy." },
    { id: 78, name: "Vitamin D3 (Cholecalciferol)", brand: "D-Cap / D-Rise", use: "Severe Vitamin D Deficiency", dosage: "40,000 IU once a week", warning: "Do not take daily. Toxic if over-consumed." },

    // Central Nervous System (Psychiatric & Nerve Pain) - Strictly Rx
    { id: 79, name: "Clonazepam", brand: "Rivotril / Epitrax", use: "Severe Anxiety, Seizures", dosage: "0.5mg - 2mg at night", warning: "Rx ONLY. Highly addictive. Do not mix with alcohol." },
    { id: 80, name: "Diazepam", brand: "Sedil / Valium", use: "Muscle Spasms, Panic Attacks", dosage: "5mg as needed", warning: "Rx ONLY. Causes severe drowsiness." },
    { id: 81, name: "Escitalopram", brand: "Lexapil / Nexito", use: "Depression, Generalized Anxiety", dosage: "10mg once daily", warning: "Rx ONLY. Takes 2-4 weeks to show full effect." },
    { id: 82, name: "Sertraline", brand: "Seren / Zoloft", use: "OCD, Depression, PTSD", dosage: "50mg once daily", warning: "Rx ONLY. Do not stop taking abruptly." },
    { id: 83, name: "Amitriptyline", brand: "Tryptin / Sarotena", use: "Migraine Prevention, Nerve Pain", dosage: "10mg - 25mg at night", warning: "Rx ONLY. Causes dry mouth and morning grogginess." },
    { id: 84, name: "Pregabalin", brand: "Nervalin / Neugaba", use: "Diabetic Nerve Pain", dosage: "50mg - 75mg twice daily", warning: "Rx ONLY. May cause weight gain and swelling in feet." },
    { id: 85, name: "Gabapentin", brand: "Gabrol / Neurontin", use: "Shingles Pain, Neuropathy", dosage: "300mg at night", warning: "Rx ONLY. Causes dizziness; be careful on stairs." },

    // Gastrointestinal & Anti-Emetics (Vomiting/Diarrhea)
    { id: 86, name: "Ondansetron", brand: "Emistat / Onser", use: "Severe Vomiting, Chemo Nausea", dosage: "8mg as needed", warning: "Can cause severe constipation and headache." },
    { id: 87, name: "Prochlorperazine", brand: "Stemitil / Vertina", use: "Vertigo, Dizziness, Nausea", dosage: "5mg three times daily", warning: "May cause drowsiness and muscle stiffness." },
    { id: 88, name: "Palonosetron", brand: "Palon / Aloxi", use: "Post-surgery Nausea", dosage: "0.5mg capsule", warning: "Usually given for specific clinical nausea." },
    { id: 89, name: "Loperamide", brand: "Imotil / Imodium", use: "Acute Diarrhea (Loose Motion)", dosage: "2mg after every loose stool", warning: "Do not use if there is blood in stool or high fever." },
    { id: 90, name: "Oral Rehydration Salts (ORS)", brand: "Saline / SMC ORS", use: "Dehydration, Diarrhea", dosage: "Mix 1 packet in exactly 500ml pure water", warning: "Do not mix with hot water or milk. Discard after 12 hours." },
    { id: 91, name: "Bisacodyl", brand: "Dulcolax / Laxyl", use: "Constipation Relief", dosage: "5mg - 10mg at bedtime", warning: "Do not take within 1 hour of drinking milk or antacids." },
    { id: 92, name: "Lactulose", brand: "Avolac / Tulac", use: "Chronic Constipation, Liver issues", dosage: "15ml twice daily", warning: "Safe for long-term use; takes 24-48 hours to work." },

    // Steroids, Hormones & Others (Strictly Rx)
    { id: 93, name: "Prednisolone", brand: "Deltasone / Cortan", use: "Severe Allergies, Asthma, Arthritis", dosage: "5mg - 20mg daily as prescribed", warning: "Rx ONLY. Never stop suddenly. Long-term use lowers immunity." },
    { id: 94, name: "Dexamethasone", brand: "Oradexon / Dexa", use: "Severe Inflammation", dosage: "0.5mg as prescribed", warning: "Rx ONLY. Can cause rapid weight gain and mood swings." },
    { id: 95, name: "Deflazacort", brand: "Xacort / Defla", use: "Autoimmune Disorders", dosage: "6mg - 30mg daily", warning: "Rx ONLY. Less bone depletion than older steroids." },
    { id: 96, name: "Levothyroxine", brand: "Thyrox / Thyrin", use: "Hypothyroidism (Thyroid issues)", dosage: "25mcg - 100mcg daily", warning: "Rx ONLY. Must be taken empty stomach, 1 hour before breakfast." },
    { id: 97, name: "Allopurinol", brand: "Zyloric / Purinol", use: "Gout Prevention (High Uric Acid)", dosage: "100mg - 300mg daily", warning: "Rx ONLY. Drink at least 2-3 liters of water daily." },
    { id: 98, name: "Febuxostat", brand: "Febux / Uric", use: "Severe Gout", dosage: "40mg - 80mg daily", warning: "Rx ONLY. May cause mild liver enzyme elevation." },
    { id: 99, name: "Colchicine", brand: "Colchic / Goutnil", use: "Acute Gout Attack Pain", dosage: "0.5mg every 12 hours during attack", warning: "Rx ONLY. High toxicity risk; follow dosage exactly." },
    { id: 100, name: "Tranexamic Acid", brand: "Anxamic / Tracid", use: "Heavy Menstrual Bleeding", dosage: "500mg three times daily during period", warning: "Rx ONLY. Do not use if you have a history of blood clots." }
];

export default function PillDirectory() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLetter, setSelectedLetter] = useState('All');
    const [expandedPills, setExpandedPills] = useState([]); // State for expanded cards

    // Generate A-Z Array
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    // Filter Logic
    const filteredPills = pillDatabase.filter(pill => {
        const matchesSearch =
            pill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pill.use.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pill.brand.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLetter =
            selectedLetter === 'All' ||
            pill.name.toUpperCase().startsWith(selectedLetter);

        return matchesSearch && matchesLetter;
    });

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    // Toggle expand function
    const toggleExpand = (id) => {
        setExpandedPills(prev => 
            prev.includes(id) 
                ? prev.filter(pillId => pillId !== id) 
                : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative">

            <button
                onClick={scrollToBottom}
                className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 hover:scale-110 hover:shadow-blue-500/50 transition-all z-50 group border-2 border-white"
                aria-label="Scroll to bottom"
                title="Go to Next Steps"
            >
                <ArrowDown className="w-6 h-6 group-hover:animate-bounce" />
            </button>

            <div className="max-w-5xl mx-auto">
                <Link to={localStorage.getItem('role') === 'patient' ? '/patient' : localStorage.getItem('role') === 'doctor' ? '/doctor' : '/'}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" /> {localStorage.getItem('token') ? 'Back to Dashboard' : 'Back to Home'}
                </Link>

                {/* --- Medical Disclaimer Banner --- */}
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm mb-8 flex items-start">
                    <AlertTriangle className="w-6 h-6 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-amber-800 font-bold text-sm">Medical Disclaimer</h3>
                        <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                            This directory is for informational purposes only and does not substitute professional medical advice.
                            Medications marked as <strong>"Rx ONLY"</strong> strictly require a doctor's prescription. Always consult with a registered physician before starting or stopping any medication.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Pill Directory</h1>
                            <p className="text-slate-500">Database of {pillDatabase.length} common medications & guidelines.</p>
                        </div>
                    </div>
                </div>

                {/* --- Search Bar --- */}
                <div className="relative mb-6 sticky top-4 z-20">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by medicine name (e.g., Paracetamol), brand (e.g., Napa), or symptom (e.g., Fever)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-700"
                    />
                </div>

                {/* --- A-Z Alphabet Navigation --- */}
                <div className="mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto whitespace-nowrap hide-scrollbar">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSelectedLetter('All')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${selectedLetter === 'All' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            All
                        </button>
                        <div className="w-px h-6 bg-slate-300 mx-2"></div>
                        {alphabet.map(letter => (
                            <button
                                key={letter}
                                onClick={() => setSelectedLetter(letter)}
                                className={`min-w-[36px] h-8 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${selectedLetter === letter ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'}`}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- Grid Layout (Expandable) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-16">
                    {filteredPills.length > 0 ? (
                        filteredPills.map(pill => {
                            const isExpanded = expandedPills.includes(pill.id);

                            return (
                                <div key={pill.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                                    
                                    {/* Clickable Header */}
                                    <div 
                                        onClick={() => toggleExpand(pill.id)} 
                                        className="p-6 cursor-pointer bg-white hover:bg-slate-50 transition-colors flex justify-between items-start"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <h2 className="text-lg font-bold text-blue-700 leading-tight">
                                                    {pill.name}
                                                </h2>
                                                <span className="ml-3 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded tracking-wider uppercase border border-slate-200 shrink-0">
                                                    {pill.brand}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 font-medium text-sm pr-4">{pill.use}</p>
                                        </div>
                                        <div className="mt-1 shrink-0 ml-2">
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                        </div>
                                    </div>

                                    {/* Expandable Content Area */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 animate-in slide-in-from-top-2 fade-in duration-200 border-t border-slate-100 mt-2 pt-4">
                                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Standard Dosage</span>
                                                <span className="text-sm font-semibold text-slate-800">{pill.dosage}</span>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 flex items-start">
                                                <Info className={`w-4 h-4 mr-2 flex-shrink-0 mt-0.5 ${pill.warning.includes('Rx ONLY') ? 'text-red-500' : 'text-amber-500'}`} />
                                                <p className={`text-xs ${pill.warning.includes('Rx ONLY') ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                                                    {pill.warning}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-1 lg:col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium text-lg">No medications found for {selectedLetter !== 'All' ? `Letter "${selectedLetter}"` : `"${searchTerm}"`}</p>
                            <button
                                onClick={() => { setSearchTerm(''); setSelectedLetter('All'); }}
                                className="mt-4 text-sm text-blue-600 font-semibold hover:underline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>

                {/* --- Next Steps / Navigation CTA --- */}
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Need more guidance?</h3>
                    <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
                        If you are unsure which medication to look for, use our Self-Diagnosis tool to check your symptoms, or browse Common Prescriptions for everyday ailments.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link to="/self-diagnosis" className="flex items-center justify-center p-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold transition-colors">
                            <Activity className="w-5 h-5 mr-2" /> Self-Diagnosis Assistant
                        </Link>
                        <Link to="/common-prescriptions" className="flex items-center justify-center p-4 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold transition-colors">
                            <FileText className="w-5 h-5 mr-2" /> Common Prescriptions
                        </Link>
                        <Link to="/doctors" className="flex items-center justify-center p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold transition-colors shadow-md">
                            <UserPlus className="w-5 h-5 mr-2" /> Book a Doctor
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
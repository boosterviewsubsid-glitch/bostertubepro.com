export const API_EXHAUSTED_MESSAGES = {
 id: 'Kesabaran adalah kunci; hal baik datang pada waktu yang tepat. 🌱',
 ms: 'Kesabaran adalah kunci; perkara baik datang pada masa yang tepat. 🌱',
 en: 'Patience is the key; good things come at the right time. 🌱',
 'id-en': 'Kesabaran adalah kunci; hal baik datang pada waktu yang tepat. 🌱 / Patience is the key; good things come at the right time.'
};
export const normalizeLanguage = value => Object.hasOwn(API_EXHAUSTED_MESSAGES, value) ? value : 'id';
// Shown instead of a technical error when the AI fails or its quota runs out.
export const WISE_WORDS = [
 'Kesabaran adalah kunci; hal baik datang pada waktu yang tepat. 🌱',
 'Setiap channel besar dimulai dari satu video kecil yang konsisten. ✨',
 'Istirahat sejenak bukan berarti menyerah; tarik napas, lalu lanjutkan. 🍃',
 'Konsistensi mengalahkan kesempurnaan. Teruslah berkarya. 💪',
 'Pelangi selalu datang setelah hujan. Coba lagi sebentar ya. 🌈',
 'Proses tidak akan mengkhianati hasil. 🌟',
];
export const wiseWords = () => WISE_WORDS[Math.floor(Math.random() * WISE_WORDS.length)];

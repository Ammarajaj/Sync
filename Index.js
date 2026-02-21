const { GoogleSpreadsheet } = require('google-spreadsheet');
const admin = require('firebase-admin');
const creds = require('./credentials.json');

const SPREADSHEET_ID = '1xFz9shufMlOoTlk9sssYfI6fowtSKGtBQJXTLArSpYQ';
const SHEET_NAME = 'Users';
const FIREBASE_URL = 'https://final-f4138-default-rtdb.firebaseio.com/';
const FIREBASE_PATH = 'users';

async function syncData() {
    try {
        console.log('🚀 بدء عملية المزامنة...');

        // --- المصادقة والاتصال بـ Firebase ---
        console.log('🔥 جارٍ الاتصال بـ Firebase...');
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(creds),
                databaseURL: FIREBASE_URL
            });
        }
        const db = admin.database();
        console.log('✅ تم الاتصال بـ Firebase بنجاح.');

        // --- المصادقة والاتصال بـ Google Sheets ---
        console.log('📗 جارٍ الاتصال بـ Google Sheets...');
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
        await doc.useServiceAccountAuth({
            client_email: creds.client_email,
            private_key: creds.private_key.replace(/\\n/g, '\n'),
        });
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[SHEET_NAME];
        console.log(`✅ تم فتح الشيت '${SHEET_NAME}' بنجاح.`);

        // --- قراءة البيانات وتحويلها ---
        console.log('📊 جارٍ قراءة البيانات...');
        const rows = await sheet.getRows();
        const firebaseData = {};
        for (const row of rows) {
            const idColumnName = sheet.headerValues[0];
            const key = row.get(idColumnName);
            if (key) {
                firebaseData[key] = row.toObject();
            }
        }
        console.log(`✅ تم تجهيز ${Object.keys(firebaseData).length} سجل للمزامنة.`);

        // --- مزامنة البيانات إلى Firebase ---
        console.log(`🔄 جارٍ مزامنة البيانات إلى المسار '${FIREBASE_PATH}'...`);
        const ref = db.ref(FIREBASE_PATH);
        await ref.set(firebaseData);
        console.log('🎉 تمت مزامنة البيانات بنجاح!');

    } catch (error) {
        console.error('❌ حدث خطأ غير متوقع:');
        console.error(error);
    }
}

syncData();

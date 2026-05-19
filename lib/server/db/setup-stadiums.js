/**
 * Manual script to link stadiums to baladias in Firebase
 * Run with: node lib/server/db/setup-stadiums.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../../../service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://play-square-pwa-default-rtdb.firebaseio.com' // Adjust if needed
});

const db = admin.firestore();

async function linkStadiumsToBaladias() {
  try {
    console.log('Starting to link stadiums to baladias...');

    // First, ensure baladia exists
    const baladiaRef = db.collection('baladias').doc('baladia_tissemsilt');
    const baladiaDoc = await baladiaRef.get();

    if (!baladiaDoc.exists) {
      console.log('Creating baladia_tissemsilt...');
      await baladiaRef.set({
        name: 'تيسمسيلت',
        code: 'TSM',
        wilayaId: 'wilaya_tissemsilt',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    } else {
      console.log('Baladia already exists, updating if needed...');
      await baladiaRef.update({
        code: 'TSM',
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }

    // Now link stadiums
    const stadiums = [
      {
        id: 'stadium_320_skn',
        name: '320 سكن',
        code: '320SKN',
        wilayaId: 'wilaya_tissemsilt',
        baladiaId: 'baladia_tissemsilt',
      },
      {
        id: 'stadium_119_skn',
        name: '119 سكن',
        code: '119SKN',
        wilayaId: 'wilaya_tissemsilt',
        baladiaId: 'baladia_tissemsilt',
      },
    ];

    for (const stadium of stadiums) {
      const stadiumRef = db.collection('stadiums').doc(stadium.id);
      const stadiumDoc = await stadiumRef.get();

      if (!stadiumDoc.exists) {
        console.log(`Creating stadium ${stadium.name}...`);
        await stadiumRef.set({
          ...stadium,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
      } else {
        console.log(`Stadium ${stadium.name} already exists, updating...`);
        await stadiumRef.update({
          code: stadium.code,
          baladiaId: stadium.baladiaId,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      }
    }

    console.log('Successfully linked stadiums to baladia!');
    console.log('Stadiums are now linked to baladia_tissemsilt (تيسمسيلت)');

  } catch (error) {
    console.error('Error linking stadiums:', error);
  } finally {
    admin.app().delete();
  }
}

// Run the function
linkStadiumsToBaladias();
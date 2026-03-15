const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'video-platform.db');
const db = new sqlite3.Database(dbPath);

async function updateAdmin() {
    console.log('Updating admin credentials...');
    const newEmail = 'PEATALLEN23@GMAIL.COM';
    const newPassword = '123qweasE@ADMIN';
    const hash = await bcrypt.hash(newPassword, 10);
    
    db.get('SELECT _id FROM admins', (err, row) => {
        if (err) {
            console.error('Error fetching admin:', err);
            db.close();
            return;
        }
        if (row) {
            db.run('UPDATE admins SET email = ?, password = ? WHERE _id = ?', [newEmail, hash, row._id], (err) => {
                if(err) console.error('Error updating admin:', err);
                else console.log('✓ Admin successfully updated in database to ' + newEmail);
                db.close();
            });
        } else {
            console.log('No admin found to update.');
            db.close();
        }
    });
}
updateAdmin();

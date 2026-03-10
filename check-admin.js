const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'video-platform.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    
    console.log('✓ Connected to database');
    
    // Query admins table
    db.all('SELECT _id, name, email, permissions, createdAt FROM admins', (err, rows) => {
        if (err) {
            console.error('Error querying admins:', err);
        } else {
            if (rows && rows.length > 0) {
                console.log('\n✓ Admin Records Found:\n');
                rows.forEach((row, index) => {
                    console.log(`Admin ${index + 1}:`);
                    console.log(`  ID: ${row._id}`);
                    console.log(`  Name: ${row.name}`);
                    console.log(`  Email: ${row.email}`);
                    console.log(`  Permissions: ${row.permissions}`);
                    console.log(`  Created: ${row.createdAt}\n`);
                });
            } else {
                console.log('⚠ No admin records found in database');
            }
        }
        
        db.close();
        process.exit(0);
    });
});

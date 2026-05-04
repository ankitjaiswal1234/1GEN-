const { Sequelize } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

async function manuallyFixSchema() {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    
    const dbPath = path.resolve(__dirname, '..', 'data', '1gen-chat-by-ai.db');
    console.log('Targeting database:', dbPath);
    
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });

    try {
        await sequelize.authenticate();
        
        const addColumn = async (col, type, def = '') => {
            try {
                let query = `ALTER TABLE Admins ADD COLUMN ${col} ${type}`;
                if (def) query += ` DEFAULT ${def}`;
                await sequelize.query(query);
                console.log(`Added ${col} column.`);
            } catch (e) {
                console.log(`${col} column check: ${e.message}`);
            }
        };

        await addColumn('role', 'VARCHAR', "'admin'");
        await addColumn('permissions', 'TEXT');
        await addColumn('updatedAt', 'DATETIME');
        await addColumn('lastLogin', 'DATETIME');
        await addColumn('createdAt', 'DATETIME', 'CURRENT_TIMESTAMP');

        const hash = await bcrypt.hash('123qweasE@ADMIN', 10);
        const email = 'admin@1gen.chat';
        
        const [existing] = await sequelize.query(`SELECT * FROM Admins WHERE email = ?`, {
            replacements: [email]
        });
        
        if (existing.length > 0) {
            await sequelize.query(`UPDATE Admins SET password = ?, role = 'admin', updatedAt = datetime('now') WHERE email = ?`, {
                replacements: [hash, email]
            });
            console.log('Updated existing admin password.');
        } else {
            const id = 'admin_' + Date.now();
            await sequelize.query(`INSERT INTO Admins (_id, name, email, password, role, permissions, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`, {
                replacements: [id, 'System Admin', email, hash, 'admin', '["view-users","view-sessions","manage-users"]']
            });
            console.log('Inserted new admin account.');
        }

        console.log('Success.');
        process.exit(0);
    } catch (err) {
        console.error('Failed:', err);
        process.exit(1);
    }
}

manuallyFixSchema();

const { Sequelize } = require('sequelize');
const path = require('path');

async function fixUsersSchema() {
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
        
        const addColumn = async (table, col, type, def = '') => {
            try {
                let query = `ALTER TABLE ${table} ADD COLUMN ${col} ${type}`;
                if (def !== '') query += ` DEFAULT ${def}`;
                await sequelize.query(query);
                console.log(`✅ Added ${col} to ${table}.`);
            } catch (e) {
                console.log(`ℹ️ ${col} in ${table} check: ${e.message}`);
            }
        };

        // Fix Users table
        await addColumn('Users', 'avatar', 'TEXT');
        await addColumn('Users', 'isVerified', 'INTEGER', '0');
        await addColumn('Users', 'resetToken', 'TEXT');
        await addColumn('Users', 'resetTokenExpiry', 'DATETIME');
        await addColumn('Users', 'updatedAt', 'DATETIME');

        // Fix Admins table (just in case)
        await addColumn('Admins', 'avatar', 'TEXT');
        await addColumn('Admins', 'isActive', 'INTEGER', '1');

        console.log('🚀 User schema fix completed.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed to fix schema:', err);
        process.exit(1);
    }
}

fixUsersSchema();

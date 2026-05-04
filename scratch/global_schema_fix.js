const { Sequelize } = require('sequelize');
const path = require('path');

async function globalSchemaFix() {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    const dbPath = path.resolve(__dirname, '..', 'data', '1gen-chat-by-ai.db');
    const sequelize = new Sequelize({ dialect: 'sqlite', storage: dbPath, logging: false });

    try {
        await sequelize.authenticate();
        const tables = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'", { type: Sequelize.QueryTypes.SELECT });
        
        for (let t of tables) {
            const tableName = t.name;
            if (tableName === 'sqlite_sequence') continue;
            
            console.log(`Checking table: ${tableName}`);
            try {
                await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN updatedAt DATETIME`);
                console.log(`  Added updatedAt to ${tableName}`);
            } catch(e) {}
            
            try {
                await sequelize.query(`ALTER TABLE ${tableName} ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP`);
                console.log(`  Added createdAt to ${tableName}`);
            } catch(e) {}
        }
        
        // Specific fixes for OTPs
        try {
            await sequelize.query("ALTER TABLE OTPs ADD COLUMN emailVerified INTEGER DEFAULT 0");
        } catch(e) {}

        console.log('Global schema fix done.');
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
globalSchemaFix();

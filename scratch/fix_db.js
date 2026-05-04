const { Sequelize } = require('sequelize');
const path = require('path');
async function fixDB() {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, 'data', '1gen-chat-by-ai.db'),
        logging: false
    });
    try {
        await sequelize.query("ALTER TABLE Admins ADD COLUMN role VARCHAR DEFAULT 'admin'");
        console.log('Added role column');
    } catch(e) {
        console.log(e.message);
    }
    process.exit(0);
}
fixDB();

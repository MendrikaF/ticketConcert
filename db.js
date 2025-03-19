const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'ticket_db',
    port: 3307
});

db.connect((err) => {
    if (err) {
        console.error("Erreur de connexion à MySQL :", err);
    } else {
        console.log("✅ Connexion réussie à MySQL !");
    }
});

module.exports = db;

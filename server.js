require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session'); // Importer express-session

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Connexion à MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'ticket_db',
    port: 3307
});

db.connect(err => {
    if (err) throw err;
    console.log('🚀 MySQL connecté');
});

// 📌 Configuration de stockage des images
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nom unique
    }
});
const upload = multer({ storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Configuration des sessions
app.use(session({
    secret: 'secret_key', // Utilise une clé secrète pour signer le cookie de session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using HTTPS
}));


// Routes de base
app.get('/', (req, res) => {
    res.render('index'); // Accueil
});

app.get('/concerts', (req, res) => {
    db.query('SELECT * FROM concert', (err, results) => {
        if (err) throw err;
        res.render('concerts', { concerts: results });
    });
});

app.get('/reserver/:idconcert', (req, res) => {
    const idconcert = req.params.idconcert;
    db.query('INSERT INTO ticket (idconcert, iduser) VALUES (?, ?)', [idconcert, 1], (err) => {
        if (err) throw err;
        res.send('<h2>Ticket réservé avec succès !</h2> <a href="/">Retour</a>');
    });
});

// 📌 Route pour afficher le formulaire d'ajout de concert
app.get('/add-concert', (req, res) => {
    res.render('add-concert');
});

// 📌 Route pour ajouter un concert avec image
app.post('/add-concert', upload.single('image'), (req, res) => {
    const { type, idlieu } = req.body;
    if (!req.file) return res.status(400).send("Aucune image envoyée !");

    const imagePath = 'uploads/' + req.file.filename; // Chemin de l'image
    const sql = 'INSERT INTO concert (type, idlieu, image) VALUES (?, ?, ?)';
    
    db.query(sql, [type, idlieu, imagePath], (err) => {
        if (err) throw err;
        res.redirect('/concerts'); // Redirection après ajout
    });
});

// Page login
app.get('/login', (req, res) => {
    res.render('login'); // Affiche la page de connexion
});

// Page logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/'); // Rediriger vers la page d'accueil après la déconnexion
    });
});

// Processus de connexion (login)
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Vérifier l'utilisateur dans la base de données
    db.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        
        if (results.length === 0) {
            return res.send('Utilisateur non trouvé');
        }

        const user = results[0];

        // Comparer le mot de passe
        bcrypt.compare(password, user.mdp, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
                // Connexion réussie, créer une session
                req.session.userId = user.iduser;
                req.session.userEmail = user.email;
                res.redirect('/'); // Redirige vers la page d'accueil après la connexion
            } else {
                res.send('Mot de passe incorrect');
            }
        });
    });
});

// Page pour s'enregistrer (register) ou autre
app.get('/register', (req, res) => {
    res.render('register'); // Affiche la page d'inscription
});

// Processus d'inscription (register)
app.post('/register', (req, res) => {
    const { email, password, pseudo } = req.body;
    
    // Hachage du mot de passe avant de le sauvegarder
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;

        // Insérer l'utilisateur dans la base de données
        db.query('INSERT INTO user (email, mdp, pseudo) VALUES (?, ?, ?)', [email, hashedPassword, pseudo], (err, results) => {
            if (err) throw err;
            res.send('Utilisateur enregistré avec succès!');
        });
    });
});

// Lancer le serveur
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`));

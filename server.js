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

// Configuration des sessions
app.use(session({
    secret: 'secret_key', // Utilise une clé secrète pour signer le cookie de session
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // set to true if using HTTPS
}));

app.get('/', (req, res) => {
    res.render('index', { user: req.session.userEmail }); // Passing userEmail to the view
});


app.get('/concerts', (req, res) => {
    db.query('SELECT * FROM concert', (err, results) => {
        if (err) throw err;
        res.render('concerts', { concerts: results });
    });
});

app.get('/reserver/:idconcert', (req, res) => {
    const idconcert = req.params.idconcert;
    if (!req.session.userId) {
        return res.send('<h2>Veuillez vous connecter pour réserver un ticket.</h2>');
    }
    db.query('INSERT INTO ticket (idconcert, iduser) VALUES (?, ?)', [idconcert, req.session.userId], (err) => {
        if (err) throw err;
        res.redirect('/page3');
    });
});

app.get('/concert-details/:idconcert', (req, res) => {
    const idconcert = req.params.idconcert;
    
    // Requête SQL avec jointure pour récupérer les détails du concert et le nom du lieu
    db.query(`
        SELECT concert.*, lieu.nom AS lieu_nom
        FROM concert
        JOIN lieu ON concert.idlieu = lieu.idlieu
        WHERE concert.idconcert = ?`, [idconcert], (err, results) => {
        if (err) throw err;
        
        if (results.length === 0) {
            return res.send('Concert non trouvé');
        }
        
        const concert = results[0];
        res.render('concert-details', { concert }); // Passer les détails du concert à la vue
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
                res.redirect('/concerts'); // Redirige vers la page d'accueil après la connexion
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
            res.redirect('/');
        });
    });
});

app.get('/page3', (req, res) => {
    res.render('page3'); // Affiche la page 3 avec le compte à rebours et le numéro de ticket
});

app.get('/page4', (req, res) => {
    res.render('page4'); // Affiche la page 4 pour choisir le nombre de places
});

// app.get('/concert-details', (req, res) => {
//     res.render('concert-details'); // Affiche la page 4 pour choisir le nombre de places
// });

app.post('/confirm-seats', (req, res) => {
    const { seats } = req.body;
    // Traitez ici la réservation des places (par exemple, stockez le nombre de places dans la base de données)
    res.render('page5', { seats }); // Redirige vers la page 5 avec les détails de la réservation
});

app.post('/payment', (req, res) => {
    // Traitez ici le paiement
    res.redirect('/thank-you');
});

app.get('/thank-you', (req, res) => {
    res.send('<h1>Merci pour votre réservation !</h1> </br> <a href="/concerts">voir autre concert</a>');
});


// Lancer le serveur
const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`));

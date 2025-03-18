CREATE DATABASE ticket_db;
USE ticket_db;

CREATE TABLE concert (
    idconcert INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    idlieu INT NOT NULL
);

CREATE TABLE lieu (
    idlieu INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    date DATETIME NOT NULL,
    datefin DATETIME NOT NULL
);

CREATE TABLE user (
    iduser INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    mdp VARCHAR(255) NOT NULL,
    pseudo VARCHAR(255) NOT NULL
);

CREATE TABLE ticket (
    idticket INT AUTO_INCREMENT PRIMARY KEY,
    idconcert INT NOT NULL,
    iduser INT NOT NULL,
    FOREIGN KEY (idconcert) REFERENCES concert(idconcert),
    FOREIGN KEY (iduser) REFERENCES user(iduser)
);

ALTER TABLE concert ADD COLUMN image VARCHAR(255) NOT NULL;


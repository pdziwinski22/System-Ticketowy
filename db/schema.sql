-- users
CREATE TABLE IF NOT EXISTS users (
id INT AUTO_INCREMENT PRIMARY KEY,
first_name VARCHAR(100) NOT NULL,
last_name VARCHAR(100) NOT NULL,
email VARCHAR(255) NOT NULL UNIQUE,
phone VARCHAR(50),
password VARCHAR(255) NOT NULL,
department VARCHAR(50),
role VARCHAR(20) DEFAULT 'user',
is_blocked TINYINT(1) DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- tickets
CREATE TABLE IF NOT EXISTS tickets (
id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT NOT NULL,
title VARCHAR(200) NOT NULL,
description TEXT NOT NULL,
department VARCHAR(50) NOT NULL,
priority ENUM('low','high','urgent') NOT NULL DEFAULT 'low',
status ENUM('nowy','realizowany','zamknięty') NOT NULL DEFAULT 'nowy',
attachment VARCHAR(255),
assigned_to INT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;


CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_department ON tickets(department);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);


-- ticket_messages
CREATE TABLE IF NOT EXISTS ticket_messages (
id INT AUTO_INCREMENT PRIMARY KEY,
ticket_id INT NOT NULL,
author_id INT NOT NULL,
author_name VARCHAR(200) NOT NULL,
body TEXT NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_tm_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
CONSTRAINT fk_tm_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;


CREATE INDEX idx_tm_ticket_created ON ticket_messages(ticket_id, created_at);


-- ticket_history
CREATE TABLE IF NOT EXISTS ticket_history (
id INT AUTO_INCREMENT PRIMARY KEY,
ticket_id INT NOT NULL,
status ENUM('nowy','realizowany','zamknięty') NOT NULL,
note VARCHAR(500),
changed_by_id INT,
changed_by VARCHAR(200),
changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT fk_th_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id)
) ENGINE=InnoDB;


CREATE INDEX idx_th_ticket_changed ON ticket_history(ticket_id, changed_at);

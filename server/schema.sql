-- PostgreSQL Schema for CarbonWise Platform

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    monthly_goal INTEGER DEFAULT 150,
    diet_preference VARCHAR(50) DEFAULT 'omnivore',
    vehicle_type VARCHAR(50) DEFAULT 'petrol',
    notifications_weekly_report BOOLEAN DEFAULT TRUE,
    notifications_goal_alerts BOOLEAN DEFAULT TRUE,
    notifications_eco_tips BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS carbon_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(50) NOT NULL,
    total_co2 DOUBLE PRECISION NOT NULL,
    details JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS completed_tips (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    tip_id VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, tip_id)
);

CREATE TABLE IF NOT EXISTS password_resets (
    email VARCHAR(255) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

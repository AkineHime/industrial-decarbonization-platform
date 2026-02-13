import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { pool } from './db/index.js'; // Added .js extension
import { createTablesQuery } from './db/schema.js'; // Added .js extension

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Initialize DB
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/init-db', async (req, res) => {
    if (!process.env.DATABASE_URL) {
        return res.status(503).json({ error: 'DATABASE_URL not set' });
    }
    try {
        await pool.query(createTablesQuery);
        // Seed mines if empty
        const mines = await pool.query('SELECT * FROM mines');
        if (mines.rows.length === 0) {
            await pool.query(`
                INSERT INTO mines (name, location) VALUES 
                ('Korba Coal Field', 'Chhattisgarh'),
                ('Jharia Mines', 'Jharkhand'),
                ('Singrauli Unit 1', 'Madhya Pradesh'),
                ('Talcher Coalfield', 'Odisha')
            `);
        }
        res.json({ message: 'Database initialized & seeded successfully' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Mock Data Endpoint - RETURN MOCK MINES IF NO DB
app.get('/api/mines', async (req, res) => {
    // Return mock mines if no DB URL is set
    if (!process.env.DATABASE_URL) {
        return res.json([
            { id: 'mock-1', name: 'Korba Coal Field', location: 'Chhattisgarh' },
            { id: 'mock-2', name: 'Jharia Mines', location: 'Jharkhand' },
            { id: 'mock-3', name: 'Singrauli Unit 1', location: 'Madhya Pradesh' }
        ]);
    }

    try {
        const result = await pool.query('SELECT * FROM mines');
        res.json(result.rows);
    } catch (err) {
        console.log('DB Connection failed, returning mock');
        res.json([
            { id: 'mock-1', name: 'Korba Coal Field', location: 'Chhattisgarh' },
            { id: 'mock-2', name: 'Jharia Mines', location: 'Jharkhand' }
        ]);
    }
});

app.post('/api/mines', async (req, res) => {
    const { name, location, annual_capacity_tons } = req.body;
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({ id: `mock-${Date.now()}`, name, location, annual_capacity_tons });
        }
        const queryText = 'INSERT INTO mines (name, location, annual_capacity_tons) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(queryText, [name, location, annual_capacity_tons || 0]);
        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Emission Factors (kg CO2e per unit)
const EMISSION_FACTORS = {
    diesel: 2.68, // kg per Liter
    grid_electricity: 0.82, // kg per kWh (India avg)
    explosives: 0.19, // kg per kg (ANFO)
};

// Start Helper for calculating emissions
const calculateEmission = (activity_type: string, amount: number) => {
    let co2e_tons = 0;
    let factor = 0;

    if (activity_type === 'diesel_combustion') {
        factor = EMISSION_FACTORS.diesel;
        co2e_tons = (amount * factor) / 1000;
    } else if (activity_type === 'grid_electricity') {
        factor = EMISSION_FACTORS.grid_electricity;
        co2e_tons = (amount * factor) / 1000;
    } else if (activity_type === 'explosives') {
        factor = EMISSION_FACTORS.explosives;
        co2e_tons = (amount * factor) / 1000;
    }
    return co2e_tons;
};
// End Helper

// Submit Emission Entry
app.post('/api/emissions', async (req, res) => {
    const { mine_id, activity_type, date, amount, unit } = req.body;

    if (!mine_id || !activity_type || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const co2e_tons = calculateEmission(activity_type, parseFloat(amount));

    try {
        const query = `
            INSERT INTO emission_entries (mine_id, activity_type, scope, date, amount, unit, co2e_tons)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        // Determine scope based on activity
        const scope = activity_type === 'grid_electricity' ? 'scope2' : 'scope1';

        const values = [mine_id, activity_type, scope, date || new Date(), amount, unit, co2e_tons];

        if (process.env.DATABASE_URL) {
            const result = await pool.query(query, values);
            res.json(result.rows[0]);
        } else {
            // Return mock response if no DB
            console.log('Mock saving emission:', values);
            res.json({
                id: 'mock-id-' + Date.now(),
                mine_id,
                activity_type,
                scope,
                date,
                amount,
                unit,
                co2e_tons
            });
        }
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Bulk Emission Upload
app.post('/api/emissions/bulk', async (req, res) => {
    const { entries } = req.body; // Expects array of { mine_id, activity_type, date, amount, unit }

    if (!entries || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'Invalid input, expected entries array' });
    }

    // Process entries
    const processedEntries = entries.map((entry: any) => {
        const co2e_tons = calculateEmission(entry.activity_type, parseFloat(entry.amount));
        const scope = entry.activity_type === 'grid_electricity' ? 'scope2' : 'scope1';
        return {
            ...entry,
            scope,
            co2e_tons,
            date: entry.date || new Date().toISOString()
        };
    });

    if (!process.env.DATABASE_URL) {
        return res.json({ message: 'Mock bulk upload successful', count: processedEntries.length });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = `
            INSERT INTO emission_entries (mine_id, activity_type, scope, date, amount, unit, co2e_tons)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        for (const entry of processedEntries) {
            await client.query(queryText, [
                entry.mine_id,
                entry.activity_type,
                entry.scope,
                entry.date,
                entry.amount,
                entry.unit,
                entry.co2e_tons
            ]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Bulk upload successful', count: processedEntries.length });
    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Get Emissions Summary
app.get('/api/analytics/summary', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({ total_co2e: 0 });
        }

        const result = await pool.query('SELECT SUM(co2e_tons) as total_co2e FROM emission_entries');
        const total = result.rows[0].total_co2e || 0;
        res.json({ total_co2e: parseFloat(total) });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Get Scenarios
app.get('/api/scenarios', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) return res.json([]);
        const result = await pool.query('SELECT * FROM scenarios ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Create Scenario
app.post('/api/scenarios', async (req, res) => {
    const { mine_id, name, description, target_year, interventions } = req.body;
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({ id: `mock-${Date.now()}`, name, target_year, interventions });
        }
        const query = `
            INSERT INTO scenarios (mine_id, name, description, target_year, interventions)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [mine_id, name, description, target_year, JSON.stringify(interventions)];
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

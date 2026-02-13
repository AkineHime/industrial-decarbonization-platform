import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pool } from './db/index.js';
import { createTablesQuery } from './db/schema.js';

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
    grid_electricity: 0.82, // kg per kWh
    explosives: 0.19, // kg per kg
    coal_power: 0.95, // kg per kWh (Captive coal)
    transport: 0.15, // kg per ton-km (General rail/road)
    default: 0.5     // Fallback
};

// Start Helper for calculating emissions
const calculateEmission = (activity_type: string, amount: number) => {
    let co2e_tons = 0;
    let factor = EMISSION_FACTORS.default;
    const activity = activity_type.toLowerCase();

    if (activity.includes('diesel') || activity.includes('fuel')) {
        factor = EMISSION_FACTORS.diesel;
    } else if (activity.includes('electricity') || activity.includes('grid')) {
        factor = EMISSION_FACTORS.grid_electricity;
    } else if (activity.includes('coal') || activity.includes('power')) {
        factor = EMISSION_FACTORS.coal_power;
    } else if (activity.includes('explosive') || activity.includes('blasting')) {
        factor = EMISSION_FACTORS.explosives;
    } else if (activity.includes('transport') || activity.includes('rail')) {
        factor = EMISSION_FACTORS.transport;
    }

    co2e_tons = (amount * factor) / 1000;
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

// Detailed Analytics Breakdown
app.get('/api/analytics/detailed', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({
                byActivity: [],
                byScope: [],
                byMine: [],
                monthlyTrend: []
            });
        }

        // 1. By Activity
        const activityResult = await pool.query(`
            SELECT activity_type as name, SUM(co2e_tons) as value 
            FROM emission_entries 
            GROUP BY activity_type
        `);
        const colors: any = {
            diesel: '#f59e0b',
            grid_electricity: '#3b82f6',
            explosives: '#ef4444'
        };
        const byActivity = activityResult.rows.map(r => ({
            name: r.name.charAt(0).toUpperCase() + r.name.slice(1).replace('_', ' '),
            value: parseFloat(r.value),
            color: colors[r.name] || '#6366f1'
        }));

        // 2. By Scope
        const scopeResult = await pool.query(`
            SELECT scope as name, SUM(co2e_tons) as value 
            FROM emission_entries 
            GROUP BY scope
        `);
        const scopeColors: any = {
            scope1: '#10b981',
            scope2: '#6366f1',
            scope3: '#a855f7'
        };
        const byScope = scopeResult.rows.map(r => ({
            name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
            value: parseFloat(r.value),
            color: scopeColors[r.name] || '#94a3b8'
        }));

        // 3. By Mine
        const mineResult = await pool.query(`
            SELECT m.name, SUM(e.co2e_tons) as value 
            FROM emission_entries e
            JOIN mines m ON e.mine_id = m.id
            GROUP BY m.name
            ORDER BY value DESC
        `);
        const byMine = mineResult.rows.map(r => ({
            name: r.name,
            value: parseFloat(r.value)
        }));

        // 4. Monthly Trend
        const trendResult = await pool.query(`
            SELECT 
                TO_CHAR(date, 'Mon') as name, 
                SUM(co2e_tons) as emissions,
                MIN(date) as sort_date
            FROM emission_entries 
            GROUP BY TO_CHAR(date, 'Mon')
            ORDER BY MIN(date)
        `);
        const monthlyTrend = trendResult.rows.map(r => ({
            name: r.name,
            emissions: parseFloat(r.emissions)
        }));

        res.json({ byActivity, byScope, byMine, monthlyTrend });
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
        const values = [mine_id || null, name, description, target_year, JSON.stringify(interventions)];
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update Scenario
app.put('/api/scenarios/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, target_year, interventions, mine_id } = req.body;
    try {
        if (!process.env.DATABASE_URL) return res.json({ success: true });
        const query = `
            UPDATE scenarios 
            SET name = $1, description = $2, target_year = $3, interventions = $4, mine_id = $5
            WHERE id = $6
            RETURNING *
        `;
        const values = [name, description, target_year, JSON.stringify(interventions), mine_id, id];
        const result = await pool.query(query, values);
        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Delete Scenario
app.delete('/api/scenarios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        if (!process.env.DATABASE_URL) return res.json({ success: true });
        await pool.query('DELETE FROM scenarios WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Export Emissions Data (CSV)
app.get('/api/emissions/export', async (req, res) => {
    try {
        if (!process.env.DATABASE_URL) return res.json([]);
        const result = await pool.query(`
            SELECT m.name as mine_name, e.activity_type, e.scope, e.date, e.amount, e.unit, e.co2e_tons 
            FROM emission_entries e
            LEFT JOIN mines m ON e.mine_id = m.id
            ORDER BY e.date DESC
        `);
        res.json(result.rows);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Generate AI Report
app.post('/api/reports/generate', async (req, res) => {
    try {
        const { topic } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        console.log(`[AI Report] Request for topic: "${topic}"`);

        if (!apiKey) {
            console.error('[AI Report] Missing GEMINI_API_KEY');
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
        }

        // 1. Gather Context Data
        let contextData: any = {};

        if (process.env.DATABASE_URL) {
            try {
                // Get Summary Stats
                const totalRes = await pool.query('SELECT SUM(co2e_tons) as total FROM emission_entries');
                contextData.totalEmissions = parseFloat(totalRes.rows[0].total || 0).toFixed(2);

                // Get Top Emitters
                const topRes = await pool.query(`
                    SELECT activity_type, SUM(co2e_tons) as total 
                    FROM emission_entries 
                    GROUP BY activity_type 
                    ORDER BY total DESC 
                    LIMIT 3
                `);
                contextData.topSources = topRes.rows;

                // Get Scenarios
                const scenRes = await pool.query('SELECT name, target_year, description FROM scenarios LIMIT 3');
                contextData.scenarios = scenRes.rows;
            } catch (dbErr) {
                console.error('[AI Report] DB Context Error:', dbErr);
            }
        }

        // 2. Construct Prompt
        const prompt = `
            You are an expert environmental consultant for an industrial mining company.
            Generate a detailed strategic analysis section for a report on: "${topic || 'General Decarbonization Strategy'}".
            
            Current Operational Data:
            - Total Annual Emissions (Scope 1 & 2): ${contextData.totalEmissions || '0'} Metric Tons CO2e
            - Top Emission Sources: ${JSON.stringify(contextData.topSources || [])}
            - Active Planning Scenarios: ${JSON.stringify(contextData.scenarios || [])}

            Please provide the following sections in Markdown format:
            ## Analysis of Current State
            (Analyze the provided data, identifying key hotspots and inefficiencies)

            ## Strategic Recommendations
            (Propose 3-4 specific, actionable high-impact interventions suited for mining operations, e.g., renewable adoption, fleet electrification)

            ## Projected Impact
            (Estimate the potential reduction percentages and long-term benefits of these interventions)

            Keep the tone professional, data-driven, and concise. Do not include a title or executive summary, just the analysis sections.
        `;

        // 3. Call Gemini
        console.log('[AI Report] Sending prompt to Gemini (model: gemini-2.0-flash)...');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('[AI Report] Success.');
        res.json({ report: text });

    } catch (err: any) {
        console.error('[AI Report] Generation Error:', err);
        const msg = err.message || JSON.stringify(err);
        res.status(500).json({ error: 'Failed to generate report: ' + msg });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

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

        // Migration: Add columns if they don't exist
        await pool.query(`
            ALTER TABLE mines ADD COLUMN IF NOT EXISTS state VARCHAR(100);
            ALTER TABLE mines ADD COLUMN IF NOT EXISTS grid_region VARCHAR(50);
            ALTER TABLE mines ADD COLUMN IF NOT EXISTS climate_zone VARCHAR(50);
        `);

        // Initialized with empty tables
        res.json({ message: 'Database initialized with core schema.' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/clear-db', async (req, res) => {
    if (!process.env.DATABASE_URL) {
        return res.status(503).json({ error: 'DATABASE_URL not set' });
    }
    try {
        await pool.query('DELETE FROM budget_items');
        await pool.query('DELETE FROM renewable_energy');
        await pool.query('DELETE FROM scope3_entries');
        await pool.query('DELETE FROM emissions');
        await pool.query('DELETE FROM scenarios');
        await pool.query('DELETE FROM carbon_credits');
        await pool.query('DELETE FROM mines');
        res.json({ message: 'Database cleared successfully. All records have been removed.' });
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
    const { name, location, state, grid_region, climate_zone, annual_capacity_tons } = req.body;
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({ id: `mock-${Date.now()}`, name, location, state, grid_region, climate_zone, annual_capacity_tons });
        }
        const queryText = 'INSERT INTO mines (name, location, state, grid_region, climate_zone, annual_capacity_tons) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const result = await pool.query(queryText, [name, location, state, grid_region, climate_zone, annual_capacity_tons || 0]);
        res.json(result.rows[0]);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Delete Mine and all related data
app.delete('/api/mines/:id', async (req, res) => {
    const { id } = req.params;
    let client;
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({ message: 'Mock delete successful' });
        }

        client = await pool.connect();
        await client.query('BEGIN');

        // Delete dependencies
        await client.query('DELETE FROM emissions WHERE mine_id = $1', [id]);
        await client.query('DELETE FROM scenarios WHERE mine_id = $1', [id]);
        await client.query('DELETE FROM scope3_entries WHERE mine_id = $1', [id]);

        // Delete renewable assets and generation
        await client.query(`
            DELETE FROM renewable_generation 
            WHERE asset_id IN (SELECT id FROM renewable_assets WHERE mine_id = $1)
        `, [id]);
        await client.query('DELETE FROM renewable_assets WHERE mine_id = $1', [id]);

        // Delete mine
        const result = await client.query('DELETE FROM mines WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Mine not found' });
        }

        await client.query('COMMIT');
        res.json({ message: 'Mine deleted successfully' });
    } catch (e: any) {
        if (client) await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        if (client) client.release();
    }
});

// Export Endpoint - Combined Scope 1, 2, & 3
app.get('/api/emissions/export', async (req, res) => {
    try {
        // Fetch Scope 1 & 2
        const s1s2 = await pool.query(`
            SELECT 
                e.id, 
                e.activity_type as name, 
                e.amount, 
                e.unit, 
                e.co2e_tons, 
                e.date, 
                m.name as mine_name,
                CASE 
                    WHEN e.activity_type IN ('grid_electricity', 'coal_power') THEN 'scope2' 
                    ELSE 'scope1' 
                END as scope
            FROM emissions e
            LEFT JOIN mines m ON e.mine_id = m.id
        `);

        // Fetch Scope 3
        const s3 = await pool.query(`
            SELECT 
                s.id, 
                s.category as name, 
                s.amount, 
                s.unit, 
                s.co2e_tons, 
                s.date, 
                m.name as mine_name,
                'scope3' as scope
            FROM scope3_entries s
            LEFT JOIN mines m ON s.mine_id = m.id
        `);

        // Combine
        const combined = [...s1s2.rows, ...s3.rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(combined);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk Mine Creation
app.post('/api/mines/bulk', async (req, res) => {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'Invalid input, expected entries array' });
    }

    if (!process.env.DATABASE_URL) {
        return res.json({ message: 'Mock bulk upload successful', count: entries.length });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const queryText = `
            INSERT INTO mines (name, location, state, grid_region, climate_zone, annual_capacity_tons)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        `;

        for (const entry of entries) {
            await client.query(queryText, [
                entry.name,
                entry.location,
                entry.state,
                entry.grid_region,
                entry.climate_zone,
                entry.annual_capacity_tons || 0
            ]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Bulk upload successful', count: entries.length });
    } catch (e: any) {
        await client.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Indian Grid Emission Factors (kg CO2e per kWh) - CEA Baseline 2023
const GRID_FACTORS: any = {
    'Northern': 0.82,
    'Eastern': 0.85,
    'Western': 0.84,
    'Southern': 0.72,
    'North-Eastern': 0.65,
    'default': 0.81
};

// Climate-based Energy Efficiency Adjustments (CAF)
const CLIMATE_ADJUSTMENT: any = {
    'Arid': 1.08,        // High cooling load
    'Hot & Dry': 1.06,   // High cooling load
    'Tropical': 1.04,    // Medium cooling/dehumidification
    'Warm & Humid': 1.05,
    'Composite': 1.03,
    'Montane': 0.97,     // Natural cooling benefits
    'default': 1.0
};

const EMISSION_FACTORS = {
    diesel: 2.68,
    explosives: 0.19,
    coal_power: 0.95,
    transport_plain: 0.15,
    transport_hilly: 0.22,
    purchased_goods: 0.35,  // kg CO2e per USD/equivalent
    freight_transport: 0.12, // kg per ton-km
    business_travel: 0.18,   // kg per km
    employee_commuting: 0.15, // kg per km
    waste_disposal: 0.45,    // kg per kg
    default: 0.5
};

// Updated Helper for calculating emissions with Geo context
const calculateEmission = (activity_type: string, amount: number, context: any = {}) => {
    let co2e_tons = 0;
    const activity = activity_type.toLowerCase();
    const grid = context.grid_region || 'default';
    const climate = context.climate_zone || 'default';

    let factor = EMISSION_FACTORS.default;
    let caf = CLIMATE_ADJUSTMENT[climate] || CLIMATE_ADJUSTMENT.default;

    if (activity.includes('diesel') || activity.includes('fuel')) {
        factor = EMISSION_FACTORS.diesel;
    } else if (activity.includes('electricity') || activity.includes('grid')) {
        factor = GRID_FACTORS[grid] || GRID_FACTORS.default;
        // Electricity is heavily impacted by climate-driven cooling loads
        amount = amount * caf;
    } else if (activity.includes('coal') || activity.includes('power')) {
        factor = EMISSION_FACTORS.coal_power;
    } else if (activity.includes('explosive') || activity.includes('blasting')) {
        factor = EMISSION_FACTORS.explosives;
    } else if (activity.includes('transport')) {
        factor = climate === 'Montane' ? EMISSION_FACTORS.transport_hilly : EMISSION_FACTORS.transport_plain;
    }

    co2e_tons = (amount * factor) / 1000;
    return co2e_tons;
};
// End Helper

// Submit Emission Entry
app.post('/api/emissions', async (req, res) => {
    const { mine_id, activity_type, date, amount, unit } = req.body;

    // Fetch mine context for geography-aware calculation
    let context = { grid_region: 'default', climate_zone: 'default' };
    try {
        if (process.env.DATABASE_URL) {
            const mineRes = await pool.query('SELECT grid_region, climate_zone FROM mines WHERE id = $1', [mine_id]);
            if (mineRes.rows.length === 0) {
                return res.status(400).json({ error: `Mine ID '${mine_id}' not found. Please register the unit first.` });
            }
            context = mineRes.rows[0];
        }
    } catch (e) {
        console.error('Context fetch failed');
        return res.status(400).json({ error: 'Invalid Mine ID format or database error.' });
    }

    const co2e_tons = calculateEmission(activity_type, parseFloat(amount), context);

    try {
        const query = `
            INSERT INTO emissions (mine_id, activity_type, scope, date, amount, unit, co2e_tons)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        // Determine scope based on activity
        const scope = (activity_type.includes('electricity') || activity_type.includes('grid')) ? 'scope2' : 'scope1';

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
            INSERT INTO emissions (mine_id, activity_type, scope, date, amount, unit, co2e_tons)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        for (const entry of processedEntries) {
            if (!entry.mine_id) {
                throw new Error('One or more entries are missing a "mine_id". Check your file headers.');
            }
            // Check if mine exists
            const mineCheck = await client.query('SELECT id FROM mines WHERE id = $1', [entry.mine_id]);
            if (mineCheck.rows.length === 0) {
                throw new Error(`Mine ID '${entry.mine_id}' does not exist in the database.`);
            }

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
        res.status(400).json({ error: e.message });
    } finally {
        client.release();
    }
});

app.get('/api/emissions', async (req, res) => {
    try {
        const query = `
            SELECT e.*, m.name as mine_name 
            FROM emissions e
            JOIN mines m ON e.mine_id = m.id
            ORDER BY e.date DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Get Emissions Summary
app.get('/api/analytics/summary', async (req, res) => {
    const { mine_id } = req.query;
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({ total_co2e: 0 });
        }

        let query = 'SELECT SUM(co2e_tons) as total_co2e FROM emissions';
        let values: any[] = [];

        if (mine_id) {
            query += ' WHERE mine_id = $1';
            values.push(mine_id);
        }

        const result = await pool.query(query, values);
        const total = result.rows[0].total_co2e || 0;
        res.json({ total_co2e: parseFloat(total) });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Detailed Analytics Breakdown
app.get('/api/analytics/detailed', async (req, res) => {
    const { mine_id } = req.query;
    try {
        if (!process.env.DATABASE_URL) {
            return res.json({
                byActivity: [],
                byScope: [],
                byMine: [],
                byState: [],
                byGrid: [],
                monthlyTrend: []
            });
        }

        const filter = mine_id ? ' WHERE mine_id = $1' : '';
        const joinFilter = mine_id ? ' WHERE e.mine_id = $1' : '';
        const values = mine_id ? [mine_id] : [];

        // 1. By Activity
        const activityResult = await pool.query(`
            SELECT activity_type as name, SUM(co2e_tons) as value 
            FROM emissions ${filter}
            GROUP BY activity_type
        `, values);
        const totalActivities = activityResult.rows.length;
        const brandColors: any = {
            diesel: '#f59e0b',
            diesel_combustion: '#f59e0b',
            grid_electricity: '#3b82f6',
            explosives: '#ef4444',
            explosives_anfo: '#ef4444',
            coal_power: '#8b5cf6',
            captive_coal_power: '#8b5cf6',
        };

        const byActivity = activityResult.rows.map((r, idx) => {
            const normalized = r.name.toLowerCase().replace(/ /g, '_');
            let color = brandColors[normalized];
            if (!color) {
                const hue = (idx * (360 / Math.max(totalActivities, 1))) % 360;
                color = `hsl(${hue}, 70%, 60%)`;
            }
            return {
                name: r.name.charAt(0).toUpperCase() + r.name.slice(1).replace(/_/g, ' '),
                value: parseFloat(r.value),
                color: color
            };
        });

        // 2. By Scope
        const scopeResult = await pool.query(`
            SELECT scope as name, SUM(co2e_tons) as value 
            FROM emissions ${filter}
            GROUP BY scope
        `, values);
        const scopeColors: any = {
            scope1: '#10b981',
            scope2: '#6366f1',
            scope3: '#a855f7'
        };
        const byScope = scopeResult.rows.map(r => ({
            name: r.name.charAt(0).toUpperCase() + r.name.slice(1, 5) + ' ' + r.name.slice(5),
            value: parseFloat(r.value),
            color: scopeColors[r.name] || '#94a3b8'
        }));

        // 3. By Mine
        const mineResult = await pool.query(`
            SELECT m.name, SUM(e.co2e_tons) as value 
            FROM emissions e
            JOIN mines m ON e.mine_id = m.id
            ${joinFilter}
            GROUP BY m.name
            ORDER BY value DESC
        `, values);
        const byMine = mineResult.rows.map(r => ({
            name: r.name,
            value: parseFloat(r.value)
        }));

        // 5. By State
        const stateResult = await pool.query(`
            SELECT m.state as name, SUM(e.co2e_tons) as value 
            FROM emissions e
            JOIN mines m ON e.mine_id = m.id
            ${joinFilter}
            GROUP BY m.state
            ORDER BY value DESC
        `, values);
        const byState = stateResult.rows.map(r => ({
            name: r.name || 'Unknown',
            value: parseFloat(r.value)
        }));

        // 6. By Grid Region
        const gridResult = await pool.query(`
            SELECT m.grid_region as name, SUM(e.co2e_tons) as value 
            FROM emissions e
            JOIN mines m ON e.mine_id = m.id
            ${joinFilter}
            GROUP BY m.grid_region
            ORDER BY value DESC
        `, values);
        const gridColors: any = {
            'Northern': '#3b82f6',
            'Southern': '#10b981',
            'Eastern': '#f59e0b',
            'Western': '#8b5cf6',
            'North-Eastern': '#ec4899'
        };
        const byGrid = gridResult.rows.map(r => ({
            name: r.name ? `${r.name} Grid` : 'Unknown',
            value: parseFloat(r.value),
            color: gridColors[r.name] || '#94a3b8'
        }));

        // 7. Monthly Trend
        const trendResult = await pool.query(`
            SELECT 
                TO_CHAR(date, 'Mon') as name, 
                SUM(co2e_tons) as emissions,
                MIN(date) as sort_date
            FROM emissions 
            ${filter}
            GROUP BY TO_CHAR(date, 'Mon')
            ORDER BY MIN(date)
        `, values);
        const monthlyTrend = trendResult.rows.map(r => ({
            name: r.name,
            emissions: parseFloat(r.emissions)
        }));

        res.json({ byActivity, byScope, byMine, byState, byGrid, monthlyTrend });
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
            FROM emissions e
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
                const totalRes = await pool.query('SELECT SUM(co2e_tons) as total FROM emissions');
                contextData.totalEmissions = parseFloat(totalRes.rows[0].total || 0).toFixed(2);

                // Get Top Emitters
                const topRes = await pool.query(`
                    SELECT activity_type, SUM(co2e_tons) as total 
                    FROM emissions 
                    GROUP BY activity_type 
                    ORDER BY total DESC 
                    LIMIT 3
                `);
                contextData.topSources = topRes.rows;

                // Get Scenarios
                const scenRes = await pool.query('SELECT name, target_year, description FROM scenarios LIMIT 3');
                contextData.scenarios = scenRes.rows;

                // Get Regional Context
                const geoRes = await pool.query(`
                    SELECT state, grid_region, climate_zone, COUNT(*) as units
                    FROM mines 
                    GROUP BY state, grid_region, climate_zone
                `);
                contextData.regionalContext = geoRes.rows;
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
            - Geographical Presence (India): ${JSON.stringify(contextData.regionalContext || [])}

            Consider the following Indian regional factors in your analysis:
            - Grid Intensity: North/East grids are coal-heavy; Southern grid has more renewables.
            - Climate: Tropical/Arid regions have higher cooling loads; Montane regions have efficiency benefits.
            - Policy: Consider state-specific renewable policies (Open Access, Net Metering).

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

// --- Scope 3 Endpoints ---
app.get('/api/scope3', async (req, res) => {
    const { mine_id } = req.query;
    try {
        const filter = mine_id ? ' WHERE mine_id = $1' : '';
        const values = mine_id ? [mine_id] : [];
        const result = await pool.query(`SELECT * FROM scope3_entries ${filter} ORDER BY date DESC`, values);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/scope3', async (req, res) => {
    const { mine_id, category, sub_category, vendor_name, date, amount, unit } = req.body;
    let factor = EMISSION_FACTORS.default;
    if (category.includes('Goods')) factor = EMISSION_FACTORS.purchased_goods;
    if (category.includes('Transport')) factor = EMISSION_FACTORS.freight_transport;
    if (category.includes('Travel')) factor = EMISSION_FACTORS.business_travel;
    if (category.includes('Commuting')) factor = EMISSION_FACTORS.employee_commuting;
    if (category.includes('Waste')) factor = EMISSION_FACTORS.waste_disposal;

    const co2e_tons = (parseFloat(amount) * factor) / 1000;

    try {
        const query = `
            INSERT INTO scope3_entries (mine_id, category, sub_category, vendor_name, date, amount, unit, co2e_tons)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
        `;
        const result = await pool.query(query, [mine_id, category, sub_category, vendor_name, date || new Date(), amount, unit, co2e_tons]);
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk Scope 3
app.post('/api/scope3/bulk', async (req, res) => {
    const { entries } = req.body;
    if (!entries || !Array.isArray(entries)) {
        return res.status(400).json({ error: 'Invalid input, expected entries array' });
    }

    if (!process.env.DATABASE_URL) {
        return res.json({ message: 'Mock bulk upload successful', count: entries.length });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const query = `
            INSERT INTO scope3_entries (mine_id, category, sub_category, vendor_name, date, amount, unit, co2e_tons)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;

        for (const entry of entries) {
            let co2e = entry.co2e_tons;
            if (!co2e) {
                let factor = EMISSION_FACTORS.default;
                const cat = entry.category || '';
                if (cat.includes('Goods')) factor = EMISSION_FACTORS.purchased_goods;
                if (cat.includes('Transport')) factor = EMISSION_FACTORS.freight_transport;
                if (cat.includes('Travel')) factor = EMISSION_FACTORS.business_travel;
                if (cat.includes('Commuting')) factor = EMISSION_FACTORS.employee_commuting;
                if (cat.includes('Waste')) factor = EMISSION_FACTORS.waste_disposal;
                co2e = (parseFloat(entry.amount) * factor) / 1000;
            }

            // Verify Mine ID exists
            const mineCheck = await client.query('SELECT id FROM mines WHERE id = $1', [entry.mine_id]);
            if (mineCheck.rows.length === 0) {
                // Skip or error? Let's error to be safe
                throw new Error(`Mine ID '${entry.mine_id}' not found for Scope 3 entry.`);
            }

            await client.query(query, [
                entry.mine_id,
                entry.category,
                entry.sub_category,
                entry.vendor_name,
                entry.date || new Date(),
                entry.amount,
                entry.unit,
                co2e
            ]);
        }
        await client.query('COMMIT');
        res.json({ message: 'Bulk upload successful', count: entries.length });
    } catch (err: any) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// --- Renewables Endpoints ---
app.get('/api/renewables/assets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM renewable_assets');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/renewables/assets', async (req, res) => {
    const { mine_id, name, type, capacity_kw, commissioning_date, storage_capacity_kwh, annual_degradation_rate, technical_details, match_with_load_profile } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO renewable_assets (mine_id, name, type, capacity_kw, commissioning_date, storage_capacity_kwh, annual_degradation_rate, technical_details, match_with_load_profile) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
            [mine_id, name, type, capacity_kw, commissioning_date, storage_capacity_kwh || 0, annual_degradation_rate || 0.5, technical_details || {}, match_with_load_profile || false]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/renewables/generation', async (req, res) => {
    const { asset_id } = req.query;
    try {
        const filter = asset_id ? ' WHERE asset_id = $1' : '';
        const values = asset_id ? [asset_id] : [];
        const result = await pool.query(`SELECT * FROM renewable_generation ${filter} ORDER BY date DESC`, values);
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- Carbon Credits Endpoints ---
app.get('/api/carbon-credits', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM carbon_credits');
        res.json(result.rows);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/carbon-credits', async (req, res) => {
    const { project_name, type, vintage, quantity_tco2e, cost_per_unit, verification_standard } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO carbon_credits (project_name, type, vintage, quantity_tco2e, available_tco2e, cost_per_unit, verification_standard) VALUES ($1, $2, $3, $4, $4, $5, $6) RETURNING *',
            [project_name, type, vintage, quantity_tco2e, cost_per_unit, verification_standard]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/carbon-credits/retire', async (req, res) => {
    const { credit_id, quantity } = req.body;
    try {
        const credit = await pool.query('SELECT * FROM carbon_credits WHERE id = $1', [credit_id]);
        if (credit.rows.length === 0) return res.status(404).json({ error: 'Credit not found' });

        const currentAvailable = parseFloat(credit.rows[0].available_tco2e);
        if (currentAvailable < quantity) return res.status(400).json({ error: 'Insufficient credits available' });

        const result = await pool.query(
            'UPDATE carbon_credits SET available_tco2e = available_tco2e - $1, retired_tco2e = retired_tco2e + $1, status = CASE WHEN available_tco2e - $1 <= 0 THEN \'retired\' ELSE \'available\' END WHERE id = $2 RETURNING *',
            [quantity, credit_id]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

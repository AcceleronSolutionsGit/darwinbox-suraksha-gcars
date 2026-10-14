require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// Bypass corporate proxy SSL verification issues
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'darwinbox_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Create tables if they don't exist
async function initDB() {
    try {
        const connection = await pool.getConnection();
        
        // Ensure database exists
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'darwinbox_db'}\``);
        await connection.query(`USE \`${process.env.DB_NAME || 'darwinbox_db'}\``);
        
        await connection.query(`
            CREATE TABLE IF NOT EXISTS locations (
                work_area_code VARCHAR(255) PRIMARY KEY,
                loc_code VARCHAR(255),
                plant VARCHAR(255),
                location VARCHAR(255),
                updated_on VARCHAR(255)
            )
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                emp_no VARCHAR(255),
                compcode VARCHAR(255),
                name VARCHAR(255),
                grade VARCHAR(255),
                desg VARCHAR(255),
                sbu VARCHAR(255),
                b_func VARCHAR(255),
                j_func VARCHAR(255),
                role VARCHAR(255),
                industry VARCHAR(255),
                rpt_code VARCHAR(255),
                rpt_to VARCHAR(255),
                sap_ter VARCHAR(255),
                teritorry VARCHAR(255),
                loc_code VARCHAR(255),
                location VARCHAR(255),
                plant VARCHAR(255),
                plant_name VARCHAR(255),
                dobc VARCHAR(255),
                dojc VARCHAR(255),
                retresdt VARCHAR(255),
                email VARCHAR(255),
                tphn_no1 VARCHAR(255),
                ret_res_tg VARCHAR(255),
                cat VARCHAR(255),
                actual_loc VARCHAR(255),
                aloc VARCHAR(255),
                state VARCHAR(255),
                work_area_code VARCHAR(255),
                source VARCHAR(50),
                PRIMARY KEY(emp_no, source)
            )
        `);
        
        try {
            // Upgrade existing schema to use composite primary key (emp_no, source)
            await connection.query(`ALTER TABLE employees DROP PRIMARY KEY, ADD PRIMARY KEY(emp_no, source)`);
            console.log("Database schema upgraded: Added composite primary key.");
        } catch (e) {
            // It will throw an error if the primary key is already composite, which is fine
        }
        connection.release();
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Failed to initialize database:", error.message);
    }
}
initDB();

const getAuthHeader = (user, pass) => {
    return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
};

app.post('/api/sync/suraksha', async (req, res) => {
    console.log(`\n[API] POST /api/sync/suraksha - Sync started...`);
    try {
        const payload = {
            api_key: process.env.SURAKSHA_API_KEY,
            datasetKey: process.env.SURAKSHA_DATASET_KEY
        };
        const response = await axios.post('https://onegainwellonehr.darwinbox.in/masterapi/employee', payload, {
            headers: {
                'Authorization': getAuthHeader(process.env.SURAKSHA_USER, process.env.SURAKSHA_PASS)
            }
        });
        
        if (response.data && response.data.employee_data) {
            const employees = response.data.employee_data;
            console.log(`[API] Suraksha API returned ${employees.length} records. Updating database...`);
            for (const emp of employees) {
                await pool.query(`
                    INSERT INTO employees (
                        emp_no, compcode, name, grade, desg, sbu, j_func, role, industry, rpt_code, rpt_to,
                        sap_ter, dobc, dojc, retresdt, email, tphn_no1, ret_res_tg, cat, actual_loc, aloc, state, work_area_code, source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        compcode=VALUES(compcode), name=VALUES(name), grade=VALUES(grade), desg=VALUES(desg),
                        sbu=VALUES(sbu), j_func=VALUES(j_func), role=VALUES(role), industry=VALUES(industry),
                        rpt_code=VALUES(rpt_code), rpt_to=VALUES(rpt_to), sap_ter=VALUES(sap_ter),
                        dobc=VALUES(dobc), dojc=VALUES(dojc), retresdt=VALUES(retresdt), email=VALUES(email),
                        tphn_no1=VALUES(tphn_no1), ret_res_tg=VALUES(ret_res_tg), cat=VALUES(cat), actual_loc=VALUES(actual_loc),
                        aloc=VALUES(aloc), state=VALUES(state), work_area_code=VALUES(work_area_code), source=VALUES(source)
                `, [
                    emp.employee_id, emp.group_company_code, emp.full_name, emp.job_level, emp.designation_title, emp.sap_sbu,
                    emp.function_name, emp.role_name, emp.sap_inddiv, emp.direct_manager_employee_id, emp.direct_manager_name,
                    emp.sap_ter, emp.date_of_birth, emp.date_of_joining, emp.retirement_date, emp.company_email_id,
                    emp.personal_mobile_no, emp.date_of_exit, emp.employee_type, emp.office_location, emp.office_area, emp.office_state, emp.work_area_code, 'Suraksha'
                ]);
            }
            console.log(`[API] Suraksha database update completed successfully.`);
            res.json({ success: true, count: employees.length, message: "Suraksha synced successfully." });
        } else {
            res.status(400).json({ success: false, message: "Invalid API response" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/sync/gcars', async (req, res) => {
    console.log(`\n[API] POST /api/sync/gcars - Sync started...`);
    try {
        const payload = {
            api_key: process.env.GCARS_API_KEY,
            datasetKey: process.env.GCARS_DATASET_KEY
        };
        const response = await axios.post('https://onegainwellonehr.darwinbox.in/masterapi/employee', payload, {
            headers: {
                'Authorization': getAuthHeader(process.env.GCARS_USER, process.env.GCARS_PASS)
            }
        });
        
        if (response.data && response.data.employee_data) {
            const employees = response.data.employee_data;
            console.log(`[API] GCARS API returned ${employees.length} records. Updating database...`);
            for (const emp of employees) {
                await pool.query(`
                    INSERT INTO employees (
                        emp_no, compcode, name, grade, desg, sbu, j_func, rpt_code, rpt_to,
                        sap_ter, dojc, retresdt, email, tphn_no1, ret_res_tg, cat, actual_loc, work_area_code, source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        compcode=VALUES(compcode), name=VALUES(name), grade=VALUES(grade), desg=VALUES(desg),
                        sbu=VALUES(sbu), j_func=VALUES(j_func),
                        rpt_code=VALUES(rpt_code), rpt_to=VALUES(rpt_to), sap_ter=VALUES(sap_ter),
                        dojc=VALUES(dojc), retresdt=VALUES(retresdt), email=VALUES(email),
                        tphn_no1=VALUES(tphn_no1), ret_res_tg=VALUES(ret_res_tg), cat=VALUES(cat), actual_loc=VALUES(actual_loc),
                        work_area_code=VALUES(work_area_code), source=VALUES(source)
                `, [
                    emp.employee_id, emp.group_company_code, emp.full_name, emp.job_level, emp.designation_title, emp.sap_sbu,
                    emp.function_name, emp.direct_manager_employee_id, emp.direct_manager_name,
                    emp.sap_ter, emp.date_of_joining, emp.retirement_date, emp.company_email_id,
                    emp.personal_mobile_no, emp.date_of_exit, emp.employee_type, emp.office_location, emp.work_area_code, 'GCARS'
                ]);
            }
            console.log(`[API] GCARS database update completed successfully.`);
            res.json({ success: true, count: employees.length, message: "GCARS synced successfully." });
        } else {
            res.status(400).json({ success: false, message: "Invalid API response" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/sync/location', async (req, res) => {
    console.log(`\n[API] POST /api/sync/location - Sync started...`);
    try {
        const payload = {
            api_key: process.env.LOCATION_API_KEY,
            report_id: process.env.LOCATION_REPORT_ID,
            get_latest_report: "1"
        };
        const response = await axios.post('https://onegainwellonehr.darwinbox.in/reportsbuilderapi/reportdatav2', payload, {
            headers: {
                'Authorization': getAuthHeader(process.env.LOCATION_USER, process.env.LOCATION_PASS)
            }
        });
        
        if (response.data && response.data.response && response.data.response.data) {
            const locations = response.data.response.data;
            console.log(`[API] Location API returned ${locations.length} records. Updating database...`);
            for (const loc of locations) {
                const workAreaCode = loc["Work Area Code"];
                if (!workAreaCode) continue;
                
                await pool.query(`
                    INSERT INTO locations (
                        work_area_code, loc_code, plant, location, updated_on
                    ) VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        loc_code=VALUES(loc_code), plant=VALUES(plant), location=VALUES(location), updated_on=VALUES(updated_on)
                `, [
                    workAreaCode, loc["Location Code (Custom)"], loc["Plant Code (Custom)"], loc["Location"], loc["Updated On"]
                ]);
                
                // Update corresponding employees
                await pool.query(`
                    UPDATE employees 
                    SET loc_code = ?, plant = ?, location = ?
                    WHERE work_area_code = ?
                `, [
                    loc["Location Code (Custom)"], loc["Plant Code (Custom)"], loc["Location"], workAreaCode
                ]);
            }
            console.log(`[API] Location database update completed successfully.`);
            res.json({ success: true, count: locations.length, message: "Location data synced successfully." });
        } else {
            res.status(400).json({ success: false, message: "Invalid API response" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/custom-query', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || !query.toLowerCase().trim().startsWith("select")) {
            return res.status(400).json({ success: false, message: "Only SELECT queries are allowed for safety." });
        }
        const [rows] = await pool.query(query);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/employees', async (req, res) => {
    try {
        console.log(`[API] GET /api/employees - Fetching overview data`);
        const [rows] = await pool.query('SELECT * FROM employees');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/format-data', async (req, res) => {
    try {
        const source = req.query.source;
        console.log(`[API] GET /api/format-data?source=${source || 'ALL'} - Generating consolidated format`);
        let query = `
            SELECT 
                compcode, emp_no, name, grade, desg, sbu, b_func, j_func, role, industry, 
                rpt_code, rpt_to, sap_ter, teritorry, loc_code, location, plant, plant_name, 
                dobc, dojc, retresdt, email, tphn_no1, ret_res_tg, cat, actual_loc, aloc, state
            FROM employees
        `;
        const params = [];
        if (source) {
            query += " WHERE source = ?";
            params.push(source);
        }
        const [rows] = await pool.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/locations', async (req, res) => {
    try {
        console.log(`[API] GET /api/locations - Fetching overview data`);
        const [rows] = await pool.query('SELECT * FROM locations');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Schedule sync every 24 hours (Runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
    console.log(`\n[CRON] Running scheduled 24-hour data sync...`);
    try {
        await axios.post(`http://localhost:${PORT}/api/sync/suraksha`);
        await axios.post(`http://localhost:${PORT}/api/sync/gcars`);
        await axios.post(`http://localhost:${PORT}/api/sync/location`);
        console.log(`[CRON] Scheduled 24-hour sync completed successfully.`);
    } catch (error) {
        console.error(`[CRON] Scheduled sync failed:`, error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

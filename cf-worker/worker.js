// Cloudflare Worker for Mega to GoFile Admin Panel
// Environment Variables:
// - API_KEY: Secure API key (set in Cloudflare dashboard)
// - KV_NAMESPACE: KV namespace binding (set in Cloudflare dashboard)

// Initialize KV namespace
const KV_NAMESPACE = ENV.KV_NAMESPACE || 'admin_panel_data';

// API Key for security
const API_KEY = ENV.API_KEY || 'your_secure_api_key_here';

// Default admin ID (will be replaced by INITIAL_ADMIN from Telegram bot)
const DEFAULT_ADMIN_ID = ENV.INITIAL_ADMIN || '';

// HTML template for the admin panel
const ADMIN_PANEL_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>Admin Panel - Mega to GoFile Converter</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
               background-color: #f5f7fa; 
               color: #333; 
               line-height: 1.6; }
        .container { width: 95%; 
                    max-width: 1400px; 
                    margin: 0 auto; 
                    padding: 20px; }
        header { background: #2c3e50; 
                 color: white; 
                 padding: 15px 0; 
                 border-radius: 8px; 
                 margin-bottom: 25px; 
                 box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        header h1 { text-align: center; font-size: 28px; }
        .stats-grid { display: grid; 
                     grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
                     gap: 20px; 
                     margin-bottom: 25px; }
        .stat-card { background: white; 
                    border-radius: 10px; 
                    padding: 20px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08); 
                    transition: transform 0.3s; }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-card h3 { color: #7f8c8d; 
                       font-size: 16px; 
                       margin-bottom: 10px; 
                       display: flex; 
                       align-items: center; }
        .stat-card h3 i { margin-right: 10px; 
                         font-size: 20px; }
        .stat-value { font-size: 32px; 
                     font-weight: bold; 
                     color: #2c3e50; }
        .charts-container { display: grid; 
                           grid-template-columns: 1fr 1fr; 
                           gap: 20px; 
                           margin-bottom: 25px; }
        @media (max-width: 900px) { 
            .charts-container { grid-template-columns: 1fr; } 
        }
        .chart-box { background: white; 
                    border-radius: 10px; 
                    padding: 20px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
        .chart-box h2 { margin-bottom: 15px; 
                       color: #2c3e50; 
                       font-size: 20px; }
        .admin-section { background: white; 
                        border-radius: 10px; 
                        padding: 25px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.08); 
                        margin-bottom: 25px; }
        .admin-section h2 { margin-bottom: 20px; 
                           color: #2c3e50; 
                           display: flex; 
                           align-items: center; }
        .admin-section h2 i { margin-right: 10px; }
        table { width: 100%; 
               border-collapse: collapse; }
        th, td { padding: 15px; 
                text-align: left; 
                border-bottom: 1px solid #eee; }
        th { background-color: #f8f9fa; 
            font-weight: 600; 
            color: #2c3e50; }
        tr:hover { background-color: #f8f9fa; }
        .actions { display: flex; 
                  gap: 10px; }
        .btn { padding: 8px 15px; 
              border: none; 
              border-radius: 5px; 
              cursor: pointer; 
              font-weight: 500; 
              transition: all 0.3s; }
        .btn-add { background: #27ae60; 
                  color: white; }
        .btn-remove { background: #e74c3c; 
                     color: white; }
        .btn:hover { opacity: 0.9; 
                    transform: translateY(-2px); }
        .add-admin-form { display: flex; 
                         gap: 10px; 
                         margin-top: 15px; }
        .add-admin-form input { padding: 10px; 
                               border: 1px solid #ddd; 
                               border-radius: 5px; 
                               flex: 1; }
        .add-admin-form button { background: #3498db; 
                                color: white; 
                                border: none; 
                                padding: 10px 15px; 
                                border-radius: 5px; 
                                cursor: pointer; }
        footer { text-align: center; 
                padding: 20px 0; 
                color: #7f8c8d; 
                font-size: 14px; 
                margin-top: 20px; }
        .status-badge { display: inline-block; 
                       padding: 5px 10px; 
                       border-radius: 20px; 
                       font-size: 12px; 
                       font-weight: bold; }
        .status-active { background: #d4edda; 
                        color: #155724; }
        .status-inactive { background: #f8d7da; 
                          color: #721c24; }
        .login-container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 0 20px rgba(0,0,0,0.1); 
            width: 100%; 
            max-width: 400px; 
            margin: 50px auto; 
        }
        .login-container h2 { 
            text-align: center; 
            color: #2c3e50; 
            margin-bottom: 25px; 
        }
        .form-group { 
            margin-bottom: 20px; 
        }
        .form-group label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600; 
            color: #34495e; 
        }
        .form-group input { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid #ddd; 
            border-radius: 5px; 
            font-size: 16px; 
            box-sizing: border-box; 
        }
        button { 
            background: #3498db; 
            color: white; 
            border: none; 
            padding: 12px; 
            width: 100%; 
            border-radius: 5px; 
            font-size: 16px; 
            cursor: pointer; 
            transition: background 0.3s; 
        }
        button:hover { 
            background: #2980b9; 
        }
        .error { 
            color: #e74c3c; 
            text-align: center; 
            margin-top: 15px; 
            font-weight: 500; 
        }
    </style>
</head>
<body>
    <div id="app">
        <!-- Content will be loaded dynamically -->
    </div>

    <script>
        // Global variables
        const API_URL = '/';
        const API_KEY = localStorage.getItem('admin_panel_api_key') || '';
        
        // Initialize the app
        document.addEventListener('DOMContentLoaded', () => {
            if (window.location.pathname === '/login') {
                showLoginPage();
            } else if (API_KEY) {
                loadDashboard();
            } else {
                window.location.href = '/login';
            }
        });

        // Show login page
        function showLoginPage() {
            document.getElementById('app').innerHTML = `
                <div class="login-container">
                    <h2>Admin Panel Login</h2>
                    <div id="error-message" class="error" style="display: none;"></div>
                    <form id="login-form">
                        <div class="form-group">
                            <label for="api-key">API Key</label>
                            <input type="password" id="api-key" name="api-key" required>
                        </div>
                        <button type="submit">Login</button>
                    </form>
                </div>
            `;
            
            document.getElementById('login-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const apiKey = document.getElementById('api-key').value;
                
                // Test the API key
                fetch(API_URL + 'stats', {
                    method: 'GET',
                    headers: {
                        'X-API-Key': apiKey
                    }
                })
                .then(response => {
                    if (response.ok) {
                        localStorage.setItem('admin_panel_api_key', apiKey);
                        window.location.href = '/';
                    } else {
                        document.getElementById('error-message').style.display = 'block';
                        document.getElementById('error-message').textContent = 'Invalid API key';
                    }
                })
                .catch(error => {
                    document.getElementById('error-message').style.display = 'block';
                    document.getElementById('error-message').textContent = 'Connection error';
                });
            });
        }

        // Load dashboard
        function loadDashboard() {
            document.getElementById('app').innerHTML = `
                <div class="container">
                    <header>
                        <h1>Admin Panel - Mega to GoFile Converter</h1>
                    </header>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>🔄 Total Conversions</h3>
                            <div id="total-conversions" class="stat-value">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>✅ Successful</h3>
                            <div id="successful-conversions" class="stat-value">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>❌ Failed</h3>
                            <div id="failed-conversions" class="stat-value">0</div>
                        </div>
                        <div class="stat-card">
                            <h3>⏱️ Bot Uptime</h3>
                            <div id="uptime" class="stat-value">0s</div>
                        </div>
                    </div>
                    
                    <div class="charts-container">
                        <div class="chart-box">
                            <h2>Conversion Status</h2>
                            <canvas id="statusChart" height="250"></canvas>
                        </div>
                        <div class="chart-box">
                            <h2>Recent Activity</h2>
                            <canvas id="activityChart" height="250"></canvas>
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h2>👥 Admin Management</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Admin ID</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="admin-list">
                                <!-- Admins will be loaded here -->
                            </tbody>
                        </table>
                        
                        <div class="add-admin-form">
                            <input type="number" id="new-admin-id" placeholder="Enter Telegram User ID" required>
                            <button id="add-admin-btn" class="btn btn-add">Add Admin</button>
                        </div>
                    </div>
                    
                    <footer>
                        <p>Bot Panel v1.0 | Secure Admin Interface | Last updated: <span id="current-time"></span></p>
                    </footer>
                </div>
            `;
            
            // Update current time
            function updateCurrentTime() {
                const now = new Date();
                document.getElementById('current-time').textContent = 
                    now.getFullYear() + '-' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                    String(now.getDate()).padStart(2, '0') + ' ' + 
                    String(now.getHours()).padStart(2, '0') + ':' + 
                    String(now.getMinutes()).padStart(2, '0') + ':' + 
                    String(now.getSeconds()).padStart(2, '0');
            }
            
            setInterval(updateCurrentTime, 1000);
            updateCurrentTime();
            
            // Load stats
            loadStats();
            
            // Add admin button
            document.getElementById('add-admin-btn').addEventListener('click', addAdmin);
        }

        // Load stats from API
        function loadStats() {
            fetch(API_URL + 'stats', {
                method: 'GET',
                headers: {
                    'X-API-Key': API_KEY
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    if (data.error === 'Unauthorized') {
                        localStorage.removeItem('admin_panel_api_key');
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error(data.error);
                }
                
                // Update stats
                document.getElementById('total-conversions').textContent = data.total_conversions;
                document.getElementById('successful-conversions').textContent = data.successful_conversions;
                document.getElementById('failed-conversions').textContent = data.failed_conversions;
                document.getElementById('uptime').textContent = formatUptime(data.uptime);
                
                // Update admin list
                updateAdminList(data.admin_ids);
                
                // Update charts
                updateCharts(data);
            })
            .catch(error => {
                console.error('Error loading stats:', error);
                document.getElementById('error-message').style.display = 'block';
                document.getElementById('error-message').textContent = 'Error loading data';
            });
        }

        // Format uptime
        function formatUptime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) {
                return \`\${days}d \${hours % 24}h\`;
            } else if (hours > 0) {
                return \`\${hours}h \${minutes % 60}m\`;
            } else if (minutes > 0) {
                return \`\${minutes}m \${seconds % 60}s\`;
            } else {
                return \`\${seconds}s\`;
            }
        }

        // Update admin list
        function updateAdminList(adminIds) {
            const adminList = document.getElementById('admin-list');
            adminList.innerHTML = '';
            
            if (!adminIds || adminIds.length === 0) {
                adminList.innerHTML = '<tr><td colspan="2">No admins configured</td></tr>';
                return;
            }
            
            adminIds.forEach(adminId => {
                const row = document.createElement('tr');
                row.innerHTML = \`
                    <td>\${adminId}</td>
                    <td class="actions">
                        <button data-admin-id="\${adminId}" class="btn btn-remove">Remove</button>
                    </td>
                \`;
                adminList.appendChild(row);
                
                // Add event listener to remove button
                row.querySelector('.btn-remove').addEventListener('click', () => {
                    removeAdmin(adminId);
                });
            });
        }

        // Update charts
        function updateCharts(data) {
            // Status Chart
            const statusCtx = document.getElementById('statusChart').getContext('2d');
            new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Successful', 'Failed'],
                    datasets: [{
                        data: [data.successful_conversions, data.failed_conversions],
                        backgroundColor: ['#27ae60', '#e74c3c'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Activity Chart (simplified for demo)
            const activityCtx = document.getElementById('activityChart').getContext('2d');
            
            // Generate last 24 hours data
            const hours = [];
            const counts = [];
            const now = new Date();
            
            for (let i = 23; i >= 0; i--) {
                const hour = new Date(now);
                hour.setHours(hour.getHours() - i);
                hours.push(hour.getHours() + ":00");
                counts.push(Math.min(5, Math.floor(data.total_conversions / 24)));
            }
            
            new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Conversions per Hour',
                        data: counts,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        }

        // Add admin
        function addAdmin() {
            const adminId = document.getElementById('new-admin-id').value;
            if (!adminId) return;
            
            fetch(API_URL + 'admin/add/' + adminId, {
                method: 'POST',
                headers: {
                    'X-API-Key': API_KEY
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('new-admin-id').value = '';
                    loadStats();
                } else {
                    alert('Error: ' + (data.error || 'Failed to add admin'));
                }
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
        }

        // Remove admin
        function removeAdmin(adminId) {
            if (!confirm('Are you sure you want to remove this admin?')) return;
            
            fetch(API_URL + 'admin/remove/' + adminId, {
                method: 'POST',
                headers: {
                    'X-API-Key': API_KEY
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    loadStats();
                } else {
                    alert('Error: ' + (data.error || 'Failed to remove admin'));
                }
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
        }
    </script>
</body>
</html>`;

// KV data structure:
// - stats: { total: number, success: number, failed: number, uptime: number, last: string }
// - admins: [number]

async function getStats(kvs) {
    try {
        let stats = await kvs.get('stats', 'json');
        if (!stats) {
            stats = {
                total_conversions: 0,
                successful_conversions: 0,
                failed_conversions: 0,
                bot_uptime: Date.now(),
                last_conversion: null
            };
            await kvs.put('stats', JSON.stringify(stats));
        }
        return stats;
    } catch (e) {
        console.error('Error getting stats:', e);
        return {
            total_conversions: 0,
            successful_conversions: 0,
            failed_conversions: 0,
            bot_uptime: Date.now(),
            last_conversion: null
        };
    }
}

async function updateStats(kvs, success) {
    const stats = await getStats(kvs);
    
    stats.total_conversions += 1;
    if (success) {
        stats.successful_conversions += 1;
    } else {
        stats.failed_conversions += 1;
    }
    stats.last_conversion = Date.now();
    
    await kvs.put('stats', JSON.stringify(stats));
    return stats;
}

async function getAdmins(kvs) {
    try {
        let admins = await kvs.get('admins', 'json');
        if (!admins) {
            // Initialize with default admin if provided
            admins = DEFAULT_ADMIN_ID ? [parseInt(DEFAULT_ADMIN_ID)] : [];
            await kvs.put('admins', JSON.stringify(admins));
        }
        return admins;
    } catch (e) {
        console.error('Error getting admins:', e);
        return DEFAULT_ADMIN_ID ? [parseInt(DEFAULT_ADMIN_ID)] : [];
    }
}

async function addAdmin(kvs, adminId) {
    const admins = await getAdmins(kvs);
    adminId = parseInt(adminId);
    
    if (isNaN(adminId)) {
        return { success: false, error: 'Invalid admin ID' };
    }
    
    if (admins.includes(adminId)) {
        return { success: false, error: 'Admin already exists' };
    }
    
    admins.push(adminId);
    await kvs.put('admins', JSON.stringify(admins));
    
    return { success: true, message: `Admin ${adminId} added successfully` };
}

async function removeAdmin(kvs, adminId) {
    const admins = await getAdmins(kvs);
    adminId = parseInt(adminId);
    
    if (isNaN(adminId)) {
        return { success: false, error: 'Invalid admin ID' };
    }
    
    const index = admins.indexOf(adminId);
    if (index === -1) {
        return { success: false, error: 'Admin not found' };
    }
    
    admins.splice(index, 1);
    await kvs.put('admins', JSON.stringify(admins));
    
    return { success: true, message: `Admin ${adminId} removed successfully` };
}

async function getUptime(stats) {
    const uptime = Date.now() - stats.bot_uptime;
    return Math.floor(uptime / 1000); // Return in seconds
}

async function handleRequest(request, env) {
    const url = new URL(request.url);
    const kvs = env.KV_NAMESPACE;
    const apiKey = request.headers.get('X-API-Key');
    
    // Check API key
    if (apiKey !== API_KEY && url.pathname !== '/login' && url.pathname !== '/') {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        if (url.pathname === '/' || url.pathname === '/dashboard') {
            return new Response(ADMIN_PANEL_HTML, {
                headers: { 'Content-Type': 'text/html' }
            });
        } else if (url.pathname === '/login') {
            return new Response(ADMIN_PANEL_HTML.replace('<div id="app">', '<div id="app"><script>window.location.pathname = "/login";</script>'), {
                headers: { 'Content-Type': 'text/html' }
            });
        } else if (url.pathname === '/stats') {
            const stats = await getStats(kvs);
            const uptime = await getUptime(stats);
            const admins = await getAdmins(kvs);
            
            return new Response(JSON.stringify({
                total_conversions: stats.total_conversions,
                successful_conversions: stats.successful_conversions,
                failed_conversions: stats.failed_conversions,
                last_conversion: stats.last_conversion,
                uptime: uptime,
                active_users: 0, // Not tracked in this implementation
                admin_ids: admins
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (url.pathname.startsWith('/admin/add/')) {
            const adminId = url.pathname.split('/').pop();
            return new Response(JSON.stringify(await addAdmin(kvs, adminId)), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (url.pathname.startsWith('/admin/remove/')) {
            const adminId = url.pathname.split('/').pop();
            return new Response(JSON.stringify(await removeAdmin(kvs, adminId)), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (url.pathname === '/api/update_stats') {
            const { success } = await request.json();
            const stats = await updateStats(kvs, success);
            const uptime = await getUptime(stats);
            const admins = await getAdmins(kvs);
            
            return new Response(JSON.stringify({
                total_conversions: stats.total_conversions,
                successful_conversions: stats.successful_conversions,
                failed_conversions: stats.failed_conversions,
                uptime: uptime,
                admin_ids: admins
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response('Not Found', { status: 404 });
    } catch (e) {
        console.error('Error handling request:', e);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle incoming requests
export default {
    async fetch(request, env) {
        return handleRequest(request, env);
    }
};

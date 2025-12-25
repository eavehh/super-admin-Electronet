// PM2 ecosystem configuration for Super-admin
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'super-admin',
    script: 'node',
    args: '.next/standalone/server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0',
      // API URL через nginx (порт 80) - замените YOUR_SERVER_IP на IP вашего сервера
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://YOUR_SERVER_IP/api',
      // Base path для работы через nginx (если используете /super-admin путь)
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || ''
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://YOUR_SERVER_IP/api',
      NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH || ''
    },
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Advanced settings
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Graceful shutdown
    kill_timeout: 5000
  }]
};

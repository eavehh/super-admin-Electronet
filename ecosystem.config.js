// PM2 ecosystem configuration for Super-admin
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'super-admin',
    script: 'npm',
    args: 'run start',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0',
      NEXT_PUBLIC_API_URL: 'http://176.88.248.139/api'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '0.0.0.0',
      NEXT_PUBLIC_API_URL: 'http://176.88.248.139/api'
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

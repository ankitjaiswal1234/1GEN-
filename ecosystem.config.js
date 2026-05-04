{
  "apps": [
    {
      "name": "1gen-chat-by-ai",
      "script": "./server.js",
      "instances": 1,
      "exec_mode": "fork",
      "watch": false,
      "ignore_watch": ["node_modules", "logs", "data"],
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production"
      },
      "error_file": "./logs/error.log",
      "out_file": "./logs/out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "autorestart": true,
      "max_restarts": 10,
      "min_uptime": "10s",
      "listen_timeout": 3000,
      "kill_timeout": 5000
    }
  ]
}

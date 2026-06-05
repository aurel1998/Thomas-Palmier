// Configuration PM2 pour le VPS IONOS.
// cwd = répertoire du projet (fonctionne quel que soit le chemin de clone).
const path = require("path");

module.exports = {
  apps: [
    {
      name: "sport-journal",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: path.resolve(__dirname),
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};

import pm2 from'pm2'

const appData = [
   {
      name: 'telegram-bot',
      script: './dist/main.js',
      node_args: '-r dotenv/config --es-module-specifier-resolution=node',
   },
   {
      name: 'checker',
      script: './checker.js',
      node_args: '-r dotenv/config --es-module-specifier-resolution=node',
      cron_restart: '*/5 * * * *',
      autorestart: false
   }
]

pm2.connect((err) => {
  if (err) {
    console.error(err)
    process.exit(2)
  }
  pm2.start(appData, (err, apps) => {
    if (err) {
      console.error(err)
      return pm2.disconnect()
    }
    pm2.disconnect()
  })
})
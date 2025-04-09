module.exports = {
  apps: [
    {
      name: 'hett-cms',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
    },
  ],
}

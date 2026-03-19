const version = process.env.VERSION || 'unknown';
const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;
console.log(`App v${version} running in ${env} mode on port ${port}`);

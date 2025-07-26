module.exports = {
  type: 'sqlite',
  database: process.env.DATABASE_PATH || 'database.sqlite',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  cli: {
    migrationsDir: 'src/database/migrations',
  },
};
import knex from 'knex'
import { config } from 'dotenv'
config()

export const testDbClient = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['content', 'identity', 'public'],
})

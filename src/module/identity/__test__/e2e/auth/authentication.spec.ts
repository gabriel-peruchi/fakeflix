import { INestApplication } from '@nestjs/common'
import { TestingModule } from '@nestjs/testing'
import { UserManagementService } from '@identityModule/core/service/user-management.service'
import request from 'supertest'
import { IdentityModule } from '@identityModule/identity.module'
import { createNestApp } from '@testInfra/test-e2e.setup'
import { testDbClient } from '@testInfra/knex.database'
import { Tables } from '@testInfra/enum/table.enum'
import { planFactory } from '@testInfra/factory/identity/plan.test-factory'
import { subscriptionFactory } from '@testInfra/factory/identity/subscription.test-factory'

describe('AuthResolver (e2e)', () => {
  let app: INestApplication
  let userManagementService: UserManagementService
  let module: TestingModule

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([IdentityModule])
    app = nestTestSetup.app
    module = nestTestSetup.module

    userManagementService = module.get<UserManagementService>(
      UserManagementService,
    )
  })

  beforeEach(async () => {
    await testDbClient(Tables.User).del()
    await testDbClient(Tables.Subscription).del()
    await testDbClient(Tables.Plan).del()
  })

  afterAll(async () => {
    await testDbClient(Tables.User).del()
    await testDbClient(Tables.Subscription).del()
    await testDbClient(Tables.Plan).del()
    await module.close()
  })

  describe('signIn mutation', () => {
    it('returns accessToken for valid credentials', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      }
      const createdUser = await userManagementService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
        password: signInInput.password,
      })
      const plan = planFactory.build()
      const subscription = subscriptionFactory.build({
        userId: createdUser.id,
        planId: plan.id,
        status: 'ACTIVE' as any,
      })
      await testDbClient(Tables.Plan).insert(plan)
      await testDbClient(Tables.Subscription).insert(subscription)

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200)

      expect(response.body.data.signIn.accessToken).toBeDefined()
    })

    it('returns unauthorized if the user does not exist', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      }

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200)

      expect(response.body.errors[0].message).toEqual(
        'Cannot authorize user: johndoe@example.com',
      )
    })

    it('returns unauthorized if the subscription is not active', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      }

      const createdUser = await userManagementService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
        password: signInInput.password,
      })
      const plan = planFactory.build()
      const subscription = subscriptionFactory.build({
        userId: createdUser.id,
        planId: plan.id,
        status: 'INACTIVE' as any,
      })
      await testDbClient(Tables.Plan).insert(plan)
      await testDbClient(Tables.Subscription).insert(subscription)

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
        .expect(200)

      expect(response.body.errors[0].message).toEqual(
        'User subscription is not active: johndoe@example.com',
      )
    })
  })

  describe('getProfile query', () => {
    it('returns the authenticated user', async () => {
      const signInInput = {
        email: 'johndoe@example.com',
        password: 'password123',
      }
      const createdUser = await userManagementService.create({
        firstName: 'John',
        lastName: 'Doe',
        email: signInInput.email,
        password: signInInput.password,
      })
      const plan = planFactory.build()
      const subscription = subscriptionFactory.build({
        userId: createdUser.id,
        planId: plan.id,
        status: 'ACTIVE' as any,
      })
      await testDbClient(Tables.Plan).insert(plan)
      await testDbClient(Tables.Subscription).insert(subscription)

      const acessTokenResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              signIn(SignInInput: {
                email: "${signInInput.email}",
                password: "${signInInput.password}"
              }) {
                accessToken
              }
            }
          `,
        })
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set(
          'Authorization',
          `Bearer ${acessTokenResponse.body.data.signIn.accessToken}`,
        )
        .send({
          query: `
            query {
              getProfile {
                email
              }
            }
          `,
        })

      const { email } = response.body.data.getProfile

      expect(email).toEqual(signInInput.email)
    })

    it('returns unauthorized for invalid tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer fake-token`)
        .send({
          query: `
            query {
              getProfile {
                email
              }
            }
          `,
        })

      expect(response.body.errors[0].message).toEqual('Unauthorized')
    })
  })
})

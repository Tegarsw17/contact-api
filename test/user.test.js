import supertest from 'supertest'
import { web } from '../src/application/web.js'
import { prismaClient } from '../src/application/database.js'
import { logger } from '../src/application/logging.js'
import { createTestUser, getTestUser, removeTestUser } from './test-util.js'
import bcrypt from 'bcrypt'

describe('POST /api/users', function () {
  afterEach(async () => {
    await removeTestUser()
  })

  it('should can register new user', async () => {
    const result = await supertest(web).post('/api/users').send({
      username: 'test',
      password: 'rahasia',
      name: 'Tegar Satriya test',
    })

    expect(result.status).toBe(200)
    expect(result.body.data.username).toBe('test')
    expect(result.body.data.name).toBe('Tegar Satriya test')
    expect(result.body.data.password).toBeUndefined()
  })

  it('should reject if request is invalid', async () => {
    const result = await supertest(web).post('/api/users').send({
      username: '',
      password: '',
      name: '',
    })

    // logger.info(result.body)

    expect(result.status).toBe(400)
    expect(result.body.errors).toBeDefined()
  })

  it('should reject if duplicate username', async () => {
    let result = await supertest(web).post('/api/users').send({
      username: 'test',
      password: 'rahasia',
      name: 'Tegar Satriya test',
    })

    // logger.info(result.body)

    expect(result.status).toBe(200)
    expect(result.body.data.username).toBe('test')
    expect(result.body.data.name).toBe('Tegar Satriya test')
    expect(result.body.data.password).toBeUndefined()

    result = await supertest(web).post('/api/users').send({
      username: 'test',
      password: 'rahasia',
      name: 'Tegar Satriya test',
    })

    logger.info(result.body)

    expect(result.status).toBe(400)
    expect(result.body.errors).toBeDefined()
  })
})

describe('POST /api/users/login', function () {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await removeTestUser()
  })

  it('should can login', async () => {
    const result = await supertest(web).post('/api/users/login').send({
      username: 'test',
      password: 'rahasia',
    })

    // logger.info(result.body)

    expect(result.status).toBe(200)
    expect(result.body.data.token).toBeDefined()
    expect(result.body.data.token).not.toBe('test')
  })

  it('should reject login if request is invalid', async () => {
    const result = await supertest(web).post('/api/users/login').send({
      username: '',
      password: '',
    })

    // logger.info(result.body)

    expect(result.status).toBe(400)
    expect(result.body.errors).toBeDefined()
  })

  it('should reject login if password is wrong', async () => {
    const result = await supertest(web).post('/api/users/login').send({
      username: 'test',
      password: 'salah password',
    })

    // logger.info(result.body)

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })

  it('should reject login if username is wrong', async () => {
    const result = await supertest(web).post('/api/users/login').send({
      username: 'salah',
      password: 'salah password',
    })

    // logger.info(result.body)

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })
})

describe('GET /api/users/current', function () {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await removeTestUser()
  })

  it('should can get current user', async () => {
    const result = await supertest(web)
      .get('/api/users/current')
      .set('Authorization', 'test')

    // logger.info(result.body)

    expect(result.status).toBe(200)
    expect(result.body.data.username).toBe('test')
    expect(result.body.data.name).toBe('test')
  })

  it('should reject if token is invalid', async () => {
    const result = await supertest(web)
      .get('/api/users/current')
      .set('Authorization', 'salah')

    // logger.info(result.body)

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })
})

describe('PATCH /api/users/current', function () {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await removeTestUser()
  })

  it('should can update user', async () => {
    const result = await supertest(web)
      .patch('/api/users/current')
      .set('Authorization', 'test')
      .send({
        name: 'yudi test',
        password: 'rahasiadong',
      })
    expect(result.status).toBe(200)
    expect(result.body.data.username).toBe('test')
    expect(result.body.data.name).toBe('yudi test')

    const user = await getTestUser()

    expect(await bcrypt.compare('rahasiadong', user.password)).toBe(true)
  })

  it('should can update user name', async () => {
    const result = await supertest(web)
      .patch('/api/users/current')
      .set('Authorization', 'test')
      .send({
        name: 'yudi test',
      })
    expect(result.status).toBe(200)
    expect(result.body.data.username).toBe('test')
    expect(result.body.data.name).toBe('yudi test')
  })

  it('should can update user password', async () => {
    const result = await supertest(web)
      .patch('/api/users/current')
      .set('Authorization', 'test')
      .send({
        password: 'rahasiadong',
      })
    expect(result.status).toBe(200)
    expect(result.body.data.username).toBe('test')
    expect(result.body.data.name).toBe('test')

    const user = await getTestUser()

    expect(await bcrypt.compare('rahasiadong', user.password)).toBe(true)
  })

  it('should reject update user', async () => {
    const result = await supertest(web)
      .patch('/api/users/current')
      .set('Authorization', 'salah')
      .send({})

    expect(result.status).toBe(401)
    expect(result.body.errors).toBeDefined()
  })
})

describe('DELETE /api/users/logout', function () {
  beforeEach(async () => {
    await createTestUser()
  })

  afterEach(async () => {
    await removeTestUser()
  })

  it('should can logout', async () => {
    const result = await supertest(web)
      .delete('/api/users/logout')
      .set('Authorization', 'test')

    expect(result.status).toBe(200)
    expect(result.body.data).toBe('OK')

    const user = await getTestUser()

    expect(user.token).toBeNull()
  })

  it('should reject logout if token is invalid', async () => {
    const result = await supertest(web)
      .delete('/api/users/logout')
      .set('Authorization', 'salah')

    expect(result.status).toBe(401)
  })
})

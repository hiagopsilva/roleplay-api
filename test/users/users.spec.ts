import { UserFactory } from './../../database/factories/index'
import test from 'japa'
import supertest from 'supertest'
import Database from '@ioc:Adonis/Lucid/Database'
import Hash from '@ioc:Adonis/Core/Hash'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
let token = ''

test.group('User', (group) => {
  test('it should create an user', async (assert) => {
    const userPayload = {
      email: 'hiago@gmail.com',
      username: 'hiago',
      password: '1234',
    }

    const { body } = await supertest(BASE_URL).post('/users').send(userPayload).expect(201)

    assert.exists(body.user, 'User undefined')
    assert.exists(body.user.id, 'ID undefined')
    assert.equal(body.user.email, userPayload.email)
    assert.equal(body.user.username, userPayload.username)
    assert.notExists(body.user.password, 'Password defined')
  })

  test('it should return 409 when email is already in use', async (assert) => {
    const { email } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email,
        username: 'teste',
        password: 'teste',
      })
      .expect(409)

    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 409 when username is already in use', async (assert) => {
    const { username } = await UserFactory.create()

    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'hiago@gmail.com',
        username,
        password: 'teste',
      })
      .expect(409)

    assert.include(body.message, 'username')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 422 when required data is not provided', async (assert) => {
    const { body } = await supertest(BASE_URL).post('/users').send({}).expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required an invalid email', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'teste@',
        password: 'teste',
        username: 'teste',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required an invalid password', async (assert) => {
    const { body } = await supertest(BASE_URL)
      .post('/users')
      .send({
        email: 'teste@gmail.com',
        password: '123',
        username: '123321',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should updated an user', async (assert) => {
    const { id, password } = await UserFactory.create()

    const email = 'test@teste.com'
    const avatar = 'http://github.com/hiagopsilva.png'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email, avatar, password })
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.exists(body.user.email, email)
    assert.exists(body.user.avatar, avatar)
    assert.exists(body.user.id, String(id))
  })

  test('it should update the password of the user', async (assert) => {
    const user = await UserFactory.create()

    const password = 'test'

    const { body } = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .send({ email: user.email, avatar: user.avatar, password })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.exists(body.user.id, String(user.id))

    await user.refresh()
    assert.isTrue(await Hash.verify(user.password, password))
  })

  test('it should return 422 when required data is not provided', async (assert) => {
    const { id } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({})
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid email', async (assert) => {
    const { id, password, avatar } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ password, avatar, email: 'test@' })
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid password', async (assert) => {
    const { id, email, avatar } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email, avatar, password: '123' })
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when providing an invalid avatar', async (assert) => {
    const { id, email, password } = await UserFactory.create()
    const { body } = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ email, password, avatar: 'test' })
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  group.before(async () => {
    const { email } = await UserFactory.merge({ password: 'test' }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email, password: 'test' })
      .expect(201)

    token = body.token.token
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})

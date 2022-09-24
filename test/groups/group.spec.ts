import Database from '@ioc:Adonis/Lucid/Database'
import { UserFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Group', async (group) => {
  test.only('it should create a group', async (assert) => {
    const user = await UserFactory.create()

    const groupPayload = {
      name: 'Group 1',
      description: 'Group 1 description',
      schedule: 'Group 1 schedule',
      location: 'Group 1 location',
      chronic: 'Group 1 chronic',
      master: user.id,
    }
    const { body } = await supertest(BASE_URL).post('/groups').send(groupPayload).expect(200)

    assert.exists(body.group, 'Group undefined')
    assert.equal(body.group.name, groupPayload.name)
    assert.equal(body.group.description, groupPayload.description)
    assert.equal(body.group.schedule, groupPayload.schedule)
    assert.equal(body.group.location, groupPayload.location)
    assert.equal(body.group.chronic, groupPayload.chronic)
    assert.equal(body.group.master, groupPayload.master)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })
  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})

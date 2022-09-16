import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import BadRequest from 'App/Exceptions/BadRequestException'
import CreateUser from 'App/Validators/CreateUserValidator'

export default class UsersController {
  public async store({ request, response }: HttpContextContract) {
    const userPayload = await request.validate(CreateUser)

    const userByEmail = await User.findBy('email', userPayload.email)
    const userByUsername = await User.findBy('username', userPayload.username)

    if (userByEmail) throw new BadRequest('email already in use', 409)
    if (userByUsername) throw new BadRequest('username already in use', 409)

    const user = await User.create(userPayload)

    return response.status(201).created({ user })
  }

  public async update({ request, response, auth }: HttpContextContract) {
    const { email, password, avatar } = request.only(['email', 'avatar', 'password'])
    const id = request.param('id')

    const user = await User.findOrFail(id)

    user.email = email
    user.password = password
    if (avatar) user.avatar = avatar

    await user.save()

    return response.ok({ user })
  }
}

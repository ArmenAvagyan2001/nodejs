const User = require("../models/user-model")
const bcrypt = require("bcrypt")
const uuid = require("uuid")
const MailService = require("../services/MailService")
const TokenService = require("../services/TokenService")
const UserDto = require("../dtos/user-dtos")

class UserService {
    async registration (email, password) {
        const candidate = await User.findOne({email})
        if (candidate) {
            throw new Error("Пользователь с почтовым адресом " + email + " уже сушествует")
        }

        const hashPassword = await bcrypt.hash(password, 3)
        const activationLink = uuid.v4()
        const user = await User.create({email, password: hashPassword, activationLink})
        await MailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);

        const userDto = new UserDto(user)
        const tokens = TokenService.generateToken({...userDto})
        await TokenService.saveToken(userDto.id, tokens.refreshToken)

        return {...tokens, user: userDto}
    }

    async activate (activationLink) {
        const user = await User.findOne({activationLink})
        if (!user) {
            throw new Error("Ошибка!")
        }

        user.isActivated = true
        await user.save()
    }
}

module.exports = new UserService()
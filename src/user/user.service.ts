import { Injectable } from '@nestjs/common';
import { User } from './user.model';
// import { CreateUserDto } from './create-user.dto';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class UserService {
   @InjectModel(User)
   private userRepository: typeof User

   async createUser(tgId, name) {
      const user = await this.userRepository.findOrCreate({
         where: { tgId: tgId },
         defaults: { name: name }
      })
      return user[0]
   }
   async findAll() {
      return this.userRepository.findAll()
   }
   async findAllUsers() {
      return this.userRepository.findAll({
         where: { admin: null }
      })
   }
   async isUserAdmin(id) {
      const user =  await this.userRepository.findOne({
         where: { tgId: id }
      })
      return (user.admin ? true : false)
   }
   async findById(id) {
      return this.userRepository.findOne({
         where: { tgId: id }
      })
   }
   async deleteUser(id) {
      return this.userRepository.destroy({
         where: { tgId: id }
      })
   }
}

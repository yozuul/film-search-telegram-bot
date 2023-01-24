import { Ctx, Hears, InjectBot, Message, On, Start, Update } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';
import * as cheerio from 'cheerio';

import { Context } from './context.interface';
import { UserService } from './user/user.service';

@Update()
export class AppService {
   constructor(
      @InjectBot()
      private readonly bot: Telegraf<Context>,
      private userService: UserService
   ) {}

   @Start()
      async startCommand(ctx: Context) {
         const sender = ctx.message.from
         const user = await this.userService.createUser(sender.id, sender.first_name)
         if(user.admin) {
            await ctx.reply('Вы зашли как админ',
            Markup.keyboard([
               Markup.button.callback('✉️ Рассылка', 'mail'),
               Markup.button.callback('🙂 Пользователи', 'users'),
               Markup.button.callback('🔎 Поиск', 'search'),
            ], { columns: 2 }).resize())
         } else {
            await ctx.reply('🎥')
            await ctx.reply('Телеграм-бот поисковик фильмов\nОтправьте в чат строку поиска:')
         }
   }

   @Hears('✉️ Рассылка')
   async editProducts(ctx: Context) {
      if(!await this.checkUser(ctx)) return
      ctx.session.path = 'sender'
      await ctx.reply('✉️')
      await ctx.reply('Отправьте сообщение в чат')
   }
   @Hears('🙂 Пользователи')
   async usersList(ctx: Context) {
      if(!await this.checkUser(ctx)) return
      ctx.session.path = 'users'
      await ctx.reply('🙂')
      const users = await this.userService.findAllUsers()
      await ctx.reply(`Всего пользователей: ${users.length}`)
   }
   @Hears('🔎 Поиск')
   async search(ctx: Context) {
      if(await this.checkUser(ctx)) await this.sendGratMsg(ctx)
   }

   @On('message')
      async testMessage(@Message('text') text: string, @Ctx() ctx: Context) {
         if(ctx.session.path === 'sender' && text) {
            ctx.reply(text, { reply_markup: {
                  inline_keyboard: [[
                     { text: `✅ Подтвердить`, callback_data: `confirm`},
                     { text: `❌ Отменить`, callback_data: `cancel` },
                  ]]
               }
            })
            return
         }
         if(!text) {
            await this.sendGratMsg(ctx)
         } else {
         const response = await fetch(`https://w140.zona.plus/search/${text}`)
         const data = await response.text()
         const $ = cheerio.load(data, null, false)
         const itemsData = $('.results-item-wrap a.results-item')
         let msg = ''
         for (let url of itemsData) {
            const fullUrl = 'https://w140.zona.plus/' + url.attribs.href
            msg += `${fullUrl}\n`
         }
         if(msg) {
            await ctx.reply(msg, {
               parse_mode: 'HTML', disable_web_page_preview: true
            })
         } else {
            await ctx.reply('По вашему запросу ничего не найдено', {
               parse_mode: 'HTML', disable_web_page_preview: true
            })
         }
      }
   }

   @On('callback_query')
   async sendAllMessages(@Ctx() ctx: Context) {
      const query = ctx.update['callback_query']
      if(query.data === 'confirm') {
         this.send(ctx, query.message.text)
      }
      if(query.data === 'cancel') {
         this.sendGratMsg(ctx)
      }
   }

   async send(ctx, text) {
      const users = await this.userService.findAllUsers()
      console.log(users)
      if(users.length === 0) {
         ctx.session.path = 'home'
         await ctx.reply('Пользователей не найдено')
         await this.sendGratMsg(ctx)
         return
      }
      for (let user of users) {
         try {
            await this.bot.telegram.sendMessage(user.tgId, text)
         } catch (error) {
            await this.userService.deleteUser(user.tgId)
            return
         }
      }
      ctx.session.path = 'home'
      return
   }

   async sendGratMsg(ctx) {
      ctx.session.path = 'home'
      ctx.reply('Отправьте в чат фразу для поиска')
   }
   async checkUser(ctx) {
      const user = ctx.message.from
      if(!await this.userService.isUserAdmin(user.id)) {
         ctx.reply('Отправьте в чат строку поиска:')
         return false
      }
      return user
   }
}
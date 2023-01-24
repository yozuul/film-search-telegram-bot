import { Context as ContextTelegraf } from 'telegraf';

export interface Context extends ContextTelegraf {
   session: {
      path?: 'home' | 'sender' | 'users',
   };
}

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ListService } from '../list/list.service';

@Injectable()
export class AuthorizeMiddleware implements NestMiddleware {
  constructor(private readonly listService: ListService) {}
  async use(req: any, res: any, next: () => void) {
    const email = req.cookies['username'];

    if (!email) {
      throw new UnauthorizedException('Email cookie not found');
    }

    const user = await this.listService.fetchUser(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    req['username'] = user; // Attach user information to the request object
    next();
  }
}

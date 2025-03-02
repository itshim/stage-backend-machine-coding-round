import { AuthorizeMiddleware } from './authorize.middleware';
import { ListService } from '../list/list.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthorizeMiddleware;
  let usersService: ListService;

  beforeEach(() => {
    // Create a mock UsersService
    usersService = {
      fetchUser: jest.fn(),
    } as any;

    // Instantiate AuthMiddleware with the mock UsersService
    authMiddleware = new AuthorizeMiddleware(usersService);
  });

  it('should call next() if user is authenticated', async () => {
    const req = {
      cookies: { username: 'test@example.com' },
    } as any;
    const res = {} as any;
    const next = jest.fn();

    // Mock findByEmail to return a user object
    (usersService.fetchUser as jest.Mock).mockResolvedValue('test@example.com');

    await authMiddleware.use(req, res, next);

    expect(usersService.fetchUser).toHaveBeenCalledWith('test@example.com');
    expect(req.username).toEqual('test@example.com');
    expect(next).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if email cookie is missing', async () => {
    const req = {
      cookies: {},
    } as any;
    const res = {} as any;
    const next = jest.fn();

    await expect(authMiddleware.use(req, res, next)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usersService.fetchUser).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if user is not found', async () => {
    const req = {
      cookies: { username: 'test@example.com' },
    } as any;
    const res = {} as any;
    const next = jest.fn();

    // Mock findByEmail to return null
    (usersService.fetchUser as jest.Mock).mockResolvedValue(null);

    await expect(authMiddleware.use(req, res, next)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usersService.fetchUser).toHaveBeenCalledWith('test@example.com');
    expect(next).not.toHaveBeenCalled();
  });
});

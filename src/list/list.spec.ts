import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ListService } from './list.service';
import { User } from '../models/user.schema';
import { Movie } from '../models/movie.schema';
import { TVShow } from '../models/tvshow.schema';
import mockingoose from 'mockingoose';
import { MyListDto } from './dto/create-users.dto';

// Need to have this hack because there is type mismatch between typescript of mockingoose and the actual implementation
interface TMockingoose {
  // eslint-disable-next-line @typescript-eslint/ban-types
  toReturn: Function;
  // eslint-disable-next-line @typescript-eslint/ban-types
  reset: Function;
  // eslint-disable-next-line @typescript-eslint/ban-types
  toJson: Function;
}

async function mockUserList() {
  return Promise.resolve({
    myList: [
      {
        contentId: '1',
        contentType: 'Movie',
      },
      {
        contentId: '2',
        contentType: 'TVShow',
      },
    ],
  });
}

const mockMovieData = [{ _id: '1', title: 'Test Movie' }];
const mockTvShowData = [{ _id: '2', title: 'Test TV Show' }];

describe('ListService', () => {
  let service: ListService;
  let userModel: any;

  const mocking = mockingoose as unknown as TMockingoose;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              exec: mockUserList,
            }),
            updateOne: jest.fn(),
          },
        },
        {
          provide: getModelToken(Movie.name),
          useValue: { find: jest.fn().mockReturnValue(mockMovieData) },
        },
        {
          provide: getModelToken(TVShow.name),
          useValue: { find: jest.fn().mockReturnValue(mockTvShowData) },
        },
      ],
    }).compile();

    service = module.get<ListService>(ListService);
    userModel = module.get(getModelToken(User.name));

    mocking.reset();
    mocking.reset();
    mocking.reset();
  });

  describe('fetchMyList', () => {
    it('should return user myList', async () => {
      const email = 'test@example.com';
      const myList = [
        { contentId: '1', contentType: 'Movie' },
        { contentId: '2', contentType: 'TVShow' },
      ];
      mocking.toReturn({ myList }, 'findOne');

      const result = await service.fetchMyList(email);
      expect(result).toEqual(myList);
    });
  });

  describe('addToList', () => {
    it('should add item to myList', async () => {
      const email = 'user1@example.com';
      const newItem = { contentId: '3', contentType: 'TVShow' };
      const myList = [
        { contentId: '1', contentType: 'Movie' },
        { contentId: '2', contentType: 'TVShow' },
      ];
      mocking.toReturn({ myList }, 'findOne');

      await service.addToList(email, newItem as MyListDto);
      expect(userModel.updateOne).toHaveBeenCalledWith(
        { email },
        { myList: [...myList, newItem] },
      );
    });

    it('should throw conflict exception if item already exists', async () => {
      const email = 'test@example.com';
      const newItem = { contentId: '1', contentType: 'Movie' };
      const myList = [newItem];
      mocking.toReturn({ myList }, 'findOne');

      await expect(
        service.addToList(email, newItem as MyListDto),
      ).rejects.toThrow('Conflict');
    });
  });

  describe('removeFromList', () => {
    it('should remove item from myList', async () => {
      const email = 'test@example.com';
      const contentId = '1';
      const myList = [{ contentId, contentType: 'Movie' }];
      mocking.toReturn({ myList }, 'findOne');

      const result = await service.removeFromList(email, contentId);
      expect(result).toEqual({ contentId, contentType: 'Movie' });
      expect(userModel.updateOne).toHaveBeenCalledWith(
        { email },
        { myList: [{ contentId: '2', contentType: 'TVShow' }] },
      );
    });

    it('should throw not found exception if item does not exist', async () => {
      const email = 'test@example.com';
      const contentId = '3';
      const myList = [{ contentId: '1', contentType: 'Movie' }];
      mocking.toReturn({ myList }, 'findOne');

      await expect(service.removeFromList(email, contentId)).rejects.toThrow(
        'Not Found',
      );
    });
  });

  describe('listMyItems', () => {
    it('should return paginated and searched items', async () => {
      const email = 'test@example.com';
      const pageNo = 1;
      const offset = 2;
      const search = 'test';
      const myList = [
        { contentId: '1', contentType: 'Movie' },
        { contentId: '2', contentType: 'TVShow' },
      ];
      const moviesData = [{ _id: '1', title: 'Test Movie' }];
      const tvShowData = [{ _id: '2', title: 'Test TV Show' }];

      mocking.toReturn({ myList }, 'findOne');
      mocking.toReturn(moviesData, 'find');
      mocking.toReturn(tvShowData, 'find');

      const result = await service.listMyItems({
        email,
        pageNo,
        offset,
        search,
      });
      expect(result).toEqual([...moviesData, ...tvShowData]);
    });
  });
});

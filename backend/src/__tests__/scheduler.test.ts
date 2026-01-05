import { SchedulerService } from '../services/scheduler';
import cron from 'node-cron';
import { ScraperService } from '../services/scraper';
import { TrafficService } from '../services/traffic';

jest.mock('node-cron');
jest.mock('../services/scraper');
jest.mock('../services/traffic');

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(() => {
    service = new SchedulerService();
  });

  it('should schedule tasks on start', () => {
    service.start();
    expect(cron.schedule).toHaveBeenCalledTimes(2);
  });
});

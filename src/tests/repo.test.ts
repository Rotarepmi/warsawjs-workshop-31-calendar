import 'reflect-metadata';
import { EventsRepo, DayEvent } from "../Main";

test('repo', async () => {
  const repo = new EventsRepo();
  await repo.Init();
  await repo.Add(new DayEvent('098', '2019-04-08', 'test event'));
  const events = await repo.EventsByDate('2019-04-08');
  expect(events.length).toBe(1);
})
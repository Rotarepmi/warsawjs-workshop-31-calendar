import 'reflect-metadata';
import axios from 'axios';
import { DayEvent } from '../Main';
import { MongoClient } from 'mongodb';

test('API should respond for ping req', async () => {
  const res = await axios.get('http://localhost:5000/ping');

  expect(res.status).toBe(200);
  expect(res.data).toBe('pong');
});

// test('/api/calendar should return some data 2019-04', async () => {
//   const res = await axios.get('http://localhost:5000/api/calendar?date=2019-04-07');

//   expect(res.data).toEqual({
//     data: [
//       {
//         date: '2019-04-07',
//         events: [
//           {
//             id: '123',
//             title: 'event1'
//           }
//         ]
//       }
//     ]
//   });
// });

describe('api/calendar', () => {
  beforeEach(async () => {
    const mongoClient = new MongoClient('mongodb://localhost:27017');
    await mongoClient.connect();
    const db = await mongoClient.db('calendar');
    await db.collection('events').drop();
    const events = [
      new DayEvent('123', '2019-04-07', 'event1'),
      new DayEvent('456', '2019-05-07', 'event2'),
      new DayEvent('789', '2019-05-07', 'event3')
    ];
    await db.collection('events').insertMany(events);
    const c = await db.collection('events').find().count();
    expect(c).toBe(3);
  })

  it('/api/calendar should return some data 2019-05', async () => {
    const res = await axios.get('http://localhost:5000/api/calendar?date=2019-05-07');
  
    expect(res.data.length).toEqual(2);
  });
  
  async function GetEventByDate(date: string) {
    const res = await axios.get(`http://localhost:5000/api/calendar?date=${date}`)
  
    return res.data[0];
  }
  
  it('POST /api/calendar should add event', async () => {
    const res = await axios.post('http://localhost:5000/api/calendar', new DayEvent('1', '2019-08-08', 'event5'));
  
    expect(res.status).toBe(200);
  
    const event = await GetEventByDate('2019-08-08');
  
    expect(event.id).toBe('1');
  });

})
import { injectable, inject } from 'inversify';
import { Types } from './IoC/Types';
import * as express from 'express';
import * as http from 'http';
import * as socketIo from 'socket.io';
import * as path from 'path';
import { IStartupArgs } from './Services/Environment/IStartupArgs';
import { Repeater } from './Services/Repeater/Repeater';
import { Calculator, Logger } from './Services/Calculator';
import * as bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';

export type guid = string;

export class DayEvent {
    constructor(
        public id: guid,
        public date: string,
        public title: string
    ) { }
}

export class DayEvents {
    constructor(
        public date: string,
        public events: DayEvent[]
    ) { }
}

export class DayEventsRes {
    constructor(public data: DayEvents[]) { }
}

// @injectable()
// export class EventsRepo {
//     db = [
//         new DayEvent('123', '2019-04-07', 'event1'),
//         new DayEvent('456', '2019-05-07', 'event2'),
//         new DayEvent('789', '2019-05-07', 'event3')
//     ];

//     public async EventsByDate(date: string): Promise<DayEvent[]> {
//         return this.db.filter(day => day.date === date)
//     }

//     public async Add(event: DayEvent): Promise<void> {
//         this.db.push(event)
//     }
// }

@injectable()
export class EventsRepo {
    private db;

    public async Init() {
        const mongoClient = new MongoClient('mongodb://localhost:27017');
        await mongoClient.connect();
        this.db = await mongoClient.db('calendar');
    }

    public async EventsByDate(date: string): Promise<DayEvent[]> {
        const cursor = await this.db.collection('events').find({ date });
        return await cursor.toArray();
    }

    public async Add(event: DayEvent): Promise<void> {
        await this.db.collection('events').insertOne(event);
    }
}

@injectable()
export class Main {
    constructor(private _eventsRepo: EventsRepo) { }

    public async Start() {
        const server = express();
        const httpServer = http.createServer(server);

        server.use(bodyParser.json());
        server.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header(
                "Access-Control-Allow-Headers",
                "Origin, X-Requested-With, Content-Type, Accept"
            );
            next();
        });

        this._eventsRepo.Init();

        server.get('/ping', (req, res) => res.send('pong'));

        server.get('/api/calendar', async (req, res) => {
            const { date } = req.query;

            // const mapedDB = db.map(day => {
            //     return new DayEvent
            // })

            // const response = new DayEventsRes(
            //     new DayEvents(date, db.filter(day => day.date === date))
            // )

            // console.log(response)

            const response = await this._eventsRepo.EventsByDate(date)
            res.send(response)
        })

        server.post('/api/calendar', async (req, res) => {
            const data = req.body;

            if (data) await this._eventsRepo.Add(data)

            res.sendStatus(200);
        })

        httpServer.listen(5000, () => console.log('Server started at 5000!'));
    }


    // constructor(
    //     @inject(Types.IStartupArgs) private _args: IStartupArgs) { }

    // private get ClientDir(): string {
    //     const s = __dirname.split(path.sep); // __dirname returns '/home/tb/projects/EventsManager/bin'. We don't wanna 'bin'...
    //     return s.slice(0, s.length - 1).join(path.sep) + '/client';
    // }

    // public async Start(): Promise<void> {
    //     const server = express();
    //     server.use(function (req, res, next) {
    //         res.header("Access-Control-Allow-Origin", "*");
    //         res.header(
    //             "Access-Control-Allow-Headers",
    //             "Origin, X-Requested-With, Content-Type, Accept"
    //         );
    //         next();
    //     });
    //     const httpServer = http.createServer(server);
    //     const socket = socketIo(httpServer);

    //     server.get('/favicon.ico', (req, res) => res.status(204));

    //     server.get('/ping', (req, res) => res.send('pong'));

    //     server.use(express.static(this.ClientDir));


    //     socket.on('connection', (socket: socketIo.Socket) => {
    //         console.log('CLIENT CONNECTED', socket.id);

    //         Repeater.EverySecond((counter) => {
    //             socket.emit('data', { foo: counter });
    //         });
    //     });

    //     const port = 5000;
    //     httpServer.listen(port, () => console.log('SERVER STARTED @ ' + port));

    //     process.on('SIGINT', () => {
    //         httpServer.close(() => console.log('SERVER CLOSED'));
    //     });
    // }
}

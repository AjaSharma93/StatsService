import * as express from 'express';
import http from 'http';
import mysql from 'mysql2/promise';
import { agent as request } from "supertest";
import { v4 as uuidv4 } from 'uuid';
import messages from '../config/messages';
import IntegrationHelpers from './helpers/Integration-helpers';

/* API tests for fetching stats for a session */
describe('Testing API endpoint GET /courses/:courseId/sessions/:sessionId', () => {
    let app: http.Server;
    let server: express.Express;
    let spyPool: any;
    beforeAll(async () => {
        spyPool = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.resolve({
            getConnection: () => Promise.resolve({
                query: (query: string, params: any[]) => {
                    if (params.includes("9d24033c-b6f7-11ec-9aad-8c1645e00e9e")) {
                        // mock no sessions existing for course
                        return Promise.resolve([[], null])
                    } else {
                        //mock a success scenario
                        return Promise.resolve([[{
                            "sessionId":uuidv4(),
                            "totalModulesStudied": 30,
                            "averageScore": 92,
                            "timeStudied": 1000
                        }], null])
                    }
                }
            })
        })) as jest.Mock);
        const helper = new IntegrationHelpers();
        await helper.initApp();
        app = helper.appInstance;
        server = helper.appServer;
    })

    it('fetches course stats successfully', async () => {
        const res = await request(server)
            .get(`/courses/${uuidv4()}/sessions/${uuidv4()}`)
            .set("X-User-Id", uuidv4())
            .send();
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("sessionId");
        expect(res.body).toHaveProperty("totalModulesStudied");
        expect(res.body).toHaveProperty("averageScore");
        expect(res.body).toHaveProperty("timeStudied");
    });

    it('fails to fetch session stats for a session not found', async () => {
        const res = await request(server)
            .get(`/courses/${uuidv4()}/sessions/9d24033c-b6f7-11ec-9aad-8c1645e00e9e`)
            .set("X-User-Id", uuidv4())
            .send();
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty("errors");
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain( messages.session_not_found);
    });

    it('fails to fetch session stats because of user id not defined', async () => {
        const res = await request(server)
            .get(`/courses/${uuidv4()}/sessions/${uuidv4()}`)
            .send();
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain(messages.user_id_invalid)
    });

    afterAll(async () => {
        await app.close();
        spyPool.mockRestore();
    })
});
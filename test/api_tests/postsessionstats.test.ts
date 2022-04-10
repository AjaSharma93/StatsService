import * as express from 'express';
import http from 'http';
import mysql from 'mysql2/promise';
import { agent as request } from "supertest";
import { v4 as uuidv4 } from 'uuid';
import messages from '../../config/messages';
import { queries } from '../../config/queries';
import IntegrationHelpers from '../helpers/Integration-helpers';

/* API tests for creating session stats */
describe('Testing API endpoint POST /courses/:courseId', () => {
    let app: http.Server;
    let server: express.Express;
    let spyPool: any;
    beforeAll(async () => {
        spyPool = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.resolve({
            getConnection: () => Promise.resolve({
                query: (query: string, 
                    params: any[]) => {
                    if(query === queries.upsert_session &&  params.includes("259bdaed-cfe4-4af9-a1c2-47e3128aa319")){
                        // mock sessions table not found
                        return Promise.reject({
                            code:"ER_NO_SUCH_TABLE",
                            message:"Table 'senecastats.sessions' doesn't exist"
                        })
                    }else if(query === queries.upsert_stats &&  params.includes("5e07c076-62ab-4d8e-8902-4d99d8d49579")){
                        // mock session_stats table not found
                        return Promise.reject({
                            code:"ER_NO_SUCH_TABLE",
                            message:"Table 'senecastats.session_stats' doesn't exist"
                        })
                    }
                    // mock a success scenario
                    return Promise.resolve({});
                },
                beginTransaction: () => Promise.resolve({}),
                commit: () => Promise.resolve({}),
                rollback:() => Promise.resolve({})
            })
        })) as jest.Mock);

        const helper = new IntegrationHelpers();
        await helper.initApp();
        app = helper.appInstance;
        server = helper.appServer;
    })

    it('can successfully create session and session stats', async () => {
        const res = await request(server)
            .post(`/courses/${uuidv4()}`)
            .set("X-User-Id", uuidv4())
            .send({
                "sessionId": uuidv4(),
                "totalModulesStudied": 30,
                "averageScore": 92.01,
                "timeStudied": 1000
            });
        expect(res.statusCode).toEqual(201);
    });

    it('fails create session and session stats because of invalid uuids', async () => {
        const res = await request(server)
            .post(`/courses/abc`)
            .set("X-User-Id", "abc")
            .send({
                "sessionId": "abc",
                "totalModulesStudied": 30,
                "averageScore": 92.01,
                "timeStudied": 1000
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain(messages.course_id_invalid)
        expect(res.body.errors).toContain(messages.session_id_invalid)
        expect(res.body.errors).toContain(messages.user_id_invalid)
    });

    it('fails create session and session stats because of stats not defined', async () => {
        const res = await request(server)
            .post(`/courses/${uuidv4()}`)
            .set("X-User-Id", uuidv4())
            .send({
                "sessionId": uuidv4(),
                "totalModulesStudied": "abc",
                "averageScore": "abc",
                "timeStudied": "abc"
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain(messages.modules_invalid)
        expect(res.body.errors).toContain(messages.average_score_invalid)
        expect(res.body.errors).toContain(messages.time_studied_invalid)
    });

    it('fails create session and session stats because of stats not defined', async () => {
        const res = await request(server)
            .post(`/courses/${uuidv4()}`)
            .set("X-User-Id", uuidv4())
            .send({
                "sessionId": uuidv4()
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain(messages.modules_not_defined)
        expect(res.body.errors).toContain(messages.average_score_not_defined)
        expect(res.body.errors).toContain(messages.time_studied_not_defined)
    });

    it('fails create session and session stats because of user id and session id not defined', async () => {
        const res = await request(server)
            .post(`/courses/${uuidv4()}`)
            .send({
                "totalModulesStudied": 30,
                "averageScore": 92.01,
                "timeStudied": 1000
            });
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain(messages.user_id_not_defined)
        expect(res.body.errors).toContain(messages.session_id_not_defined)
    });

    it('fails to create session stats because sessions table does not exist', async () => {
        const res = await request(server)
            .post(`/courses/${uuidv4()}`)
            .set("X-User-Id", uuidv4())
            .send({
                "sessionId": "259bdaed-cfe4-4af9-a1c2-47e3128aa319",
                "totalModulesStudied": 30,
                "averageScore": 92.01,
                "timeStudied": 1000
            });
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body).toHaveProperty('error_code');
        expect(res.body.error_code).toContain("ER_NO_SUCH_TABLE")
        expect(res.body.errors).toContain("Table 'senecastats.sessions' doesn't exist")
    });

    it('fails to create session stats because session stats table does not exist', async () => {
        const res = await request(server)
            .post(`/courses/${uuidv4()}`)
            .set("X-User-Id", uuidv4())
            .send({
                "sessionId": "5e07c076-62ab-4d8e-8902-4d99d8d49579",
                "totalModulesStudied": 30,
                "averageScore": 92.01,
                "timeStudied": 1000
            });
        expect(res.statusCode).toEqual(500);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body).toHaveProperty('error_code');
        expect(res.body.error_code).toContain("ER_NO_SUCH_TABLE")
        expect(res.body.errors).toContain("Table 'senecastats.session_stats' doesn't exist")
    });

    afterAll(async () => {
        await app.close();
        spyPool.mockRestore();
    })
});
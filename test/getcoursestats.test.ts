import * as express from 'express';
import http from 'http';
import mysql from 'mysql2/promise';
import { agent as request } from "supertest";
import { v4 as uuidv4 } from 'uuid';
import messages from '../config/messages';
import IntegrationHelpers from './helpers/Integration-helpers';

/* API tests for fetching stats for a course */
describe('Testing API endpoint GET /courses/:courseId', () => {
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
                    } else if(params.includes("8a8641be-b196-4e42-8f4b-cd33c790915e")){
                        // mock no sessions existing for course
                        return Promise.reject({
                            code:"ER_NO_SUCH_TABLE",
                            message:"Table 'senecastats.session_stats' doesn't exist"
                        })
                    }else {
                        // mock a success scenario
                        return Promise.resolve([[{
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
            .get(`/courses/${uuidv4()}`)
            .set("X-User-Id", uuidv4())
            .send();
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("totalModulesStudied");
        expect(res.body).toHaveProperty("averageScore");
        expect(res.body).toHaveProperty("timeStudied");
    });

    it('fails to fetch course stats for a course with no sessions', async () => {
        const res = await request(server)
            .get(`/courses/9d24033c-b6f7-11ec-9aad-8c1645e00e9e`)
            .set("X-User-Id", uuidv4())
            .send();
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty("errors");
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain(messages.session_not_found_course);
    });

    it('fails to fetch course stats because of user id not defined with an invalid course id', async () => {
        const res = await request(server)
            .get(`/courses/abc`)
            .send();
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('errors');
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors).toContain(messages.user_id_invalid)
        expect(res.body.errors).toContain(messages.course_id_invalid)
    });

    it('fails to fetch course stats because session stats table does not exist', async () => {
        const res = await request(server)
            .get(`/courses/8a8641be-b196-4e42-8f4b-cd33c790915e`)
            .set("X-User-Id", uuidv4())
            .send();
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
import * as express from 'express';
import { agent as request } from "supertest";
import http from 'http';
import IntegrationHelpers from './helpers/Integration-helpers';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import messages from '../config/messages';

/* API tests for creating session stats */
describe('Testing API endpoint POST /courses/:courseId', () => {
    let app: http.Server;
    let server: express.Express;
    let spyPool: any;
    beforeAll(async () => {
      spyPool = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.resolve({
        getConnection: () => Promise.resolve({
          query: (query: string, params: any[]) => Promise.resolve({}),
          beginTransaction: () => Promise.resolve({}),
          commit: () => Promise.resolve({})
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

    afterAll(async () => {
      await app.close();
      spyPool.mockRestore();
    })
  });
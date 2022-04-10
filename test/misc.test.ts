import mysql from 'mysql2/promise';
import { agent as request } from "supertest";
import messages from '../config/messages';
import IntegrationHelpers from './helpers/Integration-helpers';

/* Miscellaneous tests */
describe('Test the typecast functionality for sql queries', () => {
    const runServer = async () => {
        const helper = new IntegrationHelpers();
        await helper.initApp();
        const app = helper.appInstance;
        await app.close();
    }

    it('successfully converts a string to float', async () => {
        const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(({ typeCast }) => {
            const field = {
                type: "NEWDECIMAL",
                string: () => "12.04"
            }
            typeCast(field, () => { })
            return Promise.resolve({
                getConnection: () => Promise.resolve({})
            })
        }) as jest.Mock);
        await runServer();
        spy.mockRestore();
    });

    it('successfully skips other values', async () => {
        const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(({ typeCast }) => {
            const field = {
                type: "NUMBER",
                string: () => 1
            }
            typeCast(field, () => { })
            return Promise.resolve({
                getConnection: () => Promise.resolve({})
            })
        }) as jest.Mock);
        await runServer();
        spy.mockRestore();
    });

    it('does not convert null values', async () => {
        const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(({ typeCast }) => {
            const field = {
                type: "NEWDECIMAL",
                string: (): any => null
            }
            typeCast(field, () => { })
            return Promise.resolve({
                getConnection: () => Promise.resolve({})
            })
        }) as jest.Mock);
        await runServer();
        spy.mockRestore();
    });

});

/* Test API calls to invalid routes */
describe('Test invalid route', () => {
    it('successfully responds to invalid routes', async () => {
        const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.resolve({
            getConnection: () => Promise.resolve({})
          })) as jest.Mock);
        const helper = new IntegrationHelpers();
        await helper.initApp();
        const app = helper.appInstance;
        const server = helper.appServer;

        const res = await request(server)
            .get(`/abcd`)
            .send();
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty("error");
        expect(res.body.error).toBe(messages.route_not_found);

        await app.close();
        spy.mockRestore();
    });
});
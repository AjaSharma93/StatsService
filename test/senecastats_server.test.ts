import * as express from 'express';
import http from 'http';
import mysql from 'mysql2/promise';
import IntegrationHelpers from './helpers/Integration-helpers';

describe('Server Tests', () => {
  let app: http.Server;
  let server: express.Express;

  const runServer = async () => {
    const helper = new IntegrationHelpers();
    await helper.initApp();
    const app = helper.appInstance;
    await app.close();
  }

  it('starts the server successfully', async () => {
    const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.resolve({
      getConnection: () => Promise.resolve({})
    })) as jest.Mock);
    await runServer();
    spy.mockRestore();
  });

  it("fails to start the server because database doesn't exist", async () => {
    const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.reject({
      code: "ER_BAD_DB_ERROR",
      message: "Unknown database 'senecastats'"
    })) as jest.Mock);
    await runServer();
    spy.mockRestore();
  });

});
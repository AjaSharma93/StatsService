import * as express from 'express';
import { agent as request } from "supertest";
import http from 'http';
import IntegrationHelpers from './helpers/Integration-helpers';
import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import messages from '../config/messages';

describe('Server Tests', () => {
  let app: http.Server;
  let server: express.Express;

  it('starts the server successfully', async () => {
    const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.resolve({
      getConnection:()=>Promise.resolve({})
    })) as jest.Mock);
    const helper = new IntegrationHelpers();
    await helper.initApp();
    app = helper.appInstance;
    server = helper.appServer;
    await app.close();
    spy.mockRestore();
  });

  it("fails to start the server because database doesn't exist", async () => {
    const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(() => Promise.reject({
      code:"ER_BAD_DB_ERROR",
      message:"Unknown database 'senecastats'"
    })) as jest.Mock);
    const helper = new IntegrationHelpers();
    await helper.initApp();
    app = helper.appInstance;
    server = helper.appServer;
    await app.close();
    spy.mockRestore();
  });

});
import * as express from 'express';
import http from 'http';
import mysql from 'mysql2/promise';
import IntegrationHelpers from './helpers/Integration-helpers';

describe('Test the typecast functionality for sql queries', () => {
    const runServer = async ()=>{
        const helper = new IntegrationHelpers();
        await helper.initApp();
        const app = helper.appInstance;
        await app.close();
    }

    it('successfully converts a string to float', async () => {
        const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(({ typeCast }) => {
            let field = {
                type:"NEWDECIMAL",
                string:()=>"12.04"
            }
            typeCast(field,()=>{})
            return Promise.resolve({
                getConnection: () => Promise.resolve({})
            })
        }) as jest.Mock);
        await runServer();
        spy.mockRestore();
    });

    it('successfully skips other values', async () => {
        const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(({ typeCast }) => {
            let field = {
                type:"NUMBER",
                string:()=>1
            }
            typeCast(field,()=>{})
            return Promise.resolve({
                getConnection: () => Promise.resolve({})
            })
        }) as jest.Mock);
        await runServer();
        spy.mockRestore();
    });

    it('does not convert null values', async () => {
        const spy = jest.spyOn(mysql, "createPool").mockImplementation(jest.fn(({ typeCast }) => {
            let field = {
                type:"NEWDECIMAL",
                string:():any=>null
            }
            typeCast(field,()=>{})
            return Promise.resolve({
                getConnection: () => Promise.resolve({})
            })
        }) as jest.Mock);
        await runServer();
        spy.mockRestore();
    });

});
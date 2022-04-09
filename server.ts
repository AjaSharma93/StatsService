import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from "express";
import morgan from "morgan";
import path from 'path';
import { logger, LoggerStream } from "./config/winston";
import { CourseHandler, CourseDetails, CourseValidationError, CourseInsertSuccess, CourseFetchSuccess, SessionFetchSuccess } from "./models/CourseHandler";
import { DatabaseHelper, DBError } from './services/DBService';

// Load up env variables
dotenv.config({ path: path.join(__dirname, "..", '.env') });

const app: any = express();

// Enable server logs
app.use(morgan("combined", { stream: new LoggerStream() }));

app.use(bodyParser.json())

// Setup server port.
const SERVER_PORT = process.env.SERVER_PORT;
const courseHandler = new CourseHandler();

// API to insert a course
app.post('/courses/:courseId', async (req: express.Request, res: express.Response) => {
    const courseId = req.params.courseId;
    const userId = req.get("X-User-Id");
    const courseDetails: CourseDetails = req.body;
    const { status, ...responseData }: CourseInsertSuccess | CourseValidationError | DBError = await courseHandler.upsertCourseDetails(userId, courseId, courseDetails);
    res.status(status);
    res.send(responseData)
})

// API to fetch the lifetime stats of a course
app.get('/courses/:courseId', async (req: express.Request, res: express.Response) => {
    const courseId = req.params.courseId;
    const userId = req.get("X-User-Id");
    const {status, ...responseData}: CourseFetchSuccess | CourseValidationError | DBError = await courseHandler.getCourseDetailsForUser(userId,courseId);
    res.status(status);
    res.send(responseData)
})

// API to fetch the stats of a single session
app.get('/courses/:courseId/sessions/:sessionId', async (req: express.Request, res: express.Response) => {
    const sessionId = req.params.sessionId;
    const courseId = req.params.courseId;
    const userId = req.get("X-User-Id");
    const {status, ...responseData}: SessionFetchSuccess | CourseValidationError | DBError = await courseHandler.getCourseDetailsForSession(userId, courseId, sessionId);
    res.status(status);
    res.send(responseData)
})

export const init = async function appInit() {
    try {
        await DatabaseHelper.initialiseDBConnection();
    }catch(err){
        return logger.error(`Failed to initialise: ${err.code} ${err.message}`);
    }
    return Promise.resolve(app.listen(SERVER_PORT, () => {
        console.log(`Server successfully started on ${SERVER_PORT}`);
    }));
}

export const server = app;
if (!(process.env.NODE_ENV === "test")) {
    init()
}
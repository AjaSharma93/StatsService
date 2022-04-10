import { logger } from '../config/winston';
import messages from '../config/messages';
import { DatabaseHelper, DBError } from '../services/DBService';
import { RowDataPacket } from 'mysql2';
import { queries } from '../config/queries';
export type CourseInsertSuccess = {
    status: number
}

export type CourseValidationError = {
    status: number,
    errors: string[]
}

export type CourseDetails = {
    "sessionId": string,
    "totalModulesStudied": number,
    "averageScore": number,
    "timeStudied": number
}

export type CourseFetchSuccess = {
    "status":number,
    "totalModulesStudied": number,
    "averageScore": number,
    "timeStudied": number
}

export type SessionFetchSuccess = {
    "status":number,
    "sessionId": string,
    "totalModulesStudied": number,
    "averageScore": number,
    "timeStudied": number
}

const UUID_PATTERN = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'i');

/* Class to handle inserting, updating and fetching courses */
export class CourseHandler {
    async upsertCourseDetails(userId: string,
        courseId: string,
        courseDetails: CourseDetails): Promise<CourseInsertSuccess | CourseValidationError | DBError> {
        const errors = this.checkCourseDetails(userId, courseId, courseDetails);

        if (errors.length > 0) return {
            status: 400,
            errors
        }

        const db = await DatabaseHelper.db.getConnection();

        await db.beginTransaction()

        const upsertSessionQuery = queries.upsert_session;

        try {
            await db.query(upsertSessionQuery, [
                userId,
                courseId,
                courseDetails.sessionId,
                userId,
                courseId,
                courseDetails.sessionId
            ]);
        } catch (err) {
            await db.rollback();
            return {
                status: 500,
                errors: [err.message],
                error_code: err.code
            }
        }

        const upsertStatsQuery = queries.upsert_stats;
        try {
            await db.query(upsertStatsQuery, [
                courseDetails.sessionId,
                courseDetails.totalModulesStudied,
                courseDetails.averageScore,
                courseDetails.timeStudied,
                courseDetails.sessionId,
                courseDetails.totalModulesStudied,
                courseDetails.averageScore,
                courseDetails.timeStudied
            ]);
            await db.commit();
        } catch (err) {
            await db.rollback();
            logger.error(`Error inserting record for course ${courseId}, session ${courseDetails.sessionId} and user ${userId} with error ${err.code} | ${err.message}`);
            return {
                status: 500,
                errors: [err.message],
                error_code: err.code
            };
        }
        return {
            status: 201
        };
    }

    async getCourseDetailsForUser(userId: string, courseId: string): Promise<CourseFetchSuccess | CourseValidationError | DBError> {
        const errors = [];
        if (!UUID_PATTERN.test(courseId)) errors.push(messages.course_id_invalid);
        if (!UUID_PATTERN.test(userId)) errors.push(messages.user_id_invalid);

        if (errors.length > 0) return {
            status: 400,
            errors
        }

        const db = await DatabaseHelper.db.getConnection();

        const selectStatsQuery = queries.select_stats;

        try {
            const [rows] = await db.query(selectStatsQuery, [courseId, userId]);

            const data = (rows as RowDataPacket)?.[0];
            return (data)?{
                status:200,
                ...data
            }:{
                status:400,
                errors:[
                    messages.session_not_found_course
                ]
            }
        } catch (err) {
            logger.error(`Error fetching record for course ${courseId} and user ${userId} with error ${err.code} | ${err.message}`);
            return {
                status: 500,
                errors: [err.message],
                error_code: err.code
            };
        }
    }

    async getCourseDetailsForSession(userId: string, courseId: string, sessionId:string): Promise<SessionFetchSuccess | CourseValidationError | DBError> {
        const errors = [];
        if (!UUID_PATTERN.test(courseId)) errors.push(messages.course_id_invalid);
        if (!UUID_PATTERN.test(userId)) errors.push(messages.user_id_invalid);
        if (!UUID_PATTERN.test(sessionId)) errors.push(messages.user_id_invalid);

        if (errors.length > 0) return {
            status: 400,
            errors
        }

        const db = await DatabaseHelper.db.getConnection();

        const selectStatsQuery = queries.select_stats_session;

        try {
            const [rows] = await db.query(selectStatsQuery, [courseId, userId, sessionId]);
            const details = (rows as RowDataPacket)?.[0];
            return (details)?{
                status:200,
                ...details
            }:{
                status:400,
                errors:[
                    messages.session_not_found
                ]
            }
        } catch (err) {
            logger.error(`Error fetching record for course ${courseId} and user ${userId} with error ${err.code} | ${err.message}`);
            return {
                status: 500,
                errors: [err.message],
                error_code: err.code
            };
        }
    }

    private checkCourseDetails(userId: string,
        courseId: string,
        courseDetails: CourseDetails): string[] {
        const errors: string[] = [];

        if (!courseId) errors.push(messages.course_id_not_defined);
        else if (!UUID_PATTERN.test(courseId)) errors.push(messages.course_id_invalid);

        if (!userId) errors.push(messages.user_id_not_defined);
        else if (!UUID_PATTERN.test(userId)) errors.push(messages.user_id_invalid);

        if (!courseDetails.sessionId) errors.push(messages.session_id_not_defined);
        else if (!UUID_PATTERN.test(courseDetails.sessionId)) errors.push(messages.session_id_invalid);

        if (courseDetails.totalModulesStudied === undefined) errors.push(messages.modules_not_defined);
        else if (!Number.isInteger(courseDetails.totalModulesStudied)) errors.push(messages.modules_invalid);

        if (courseDetails.averageScore === undefined) errors.push(messages.average_score_not_defined);
        else if (!this.isFloat(courseDetails.averageScore)) errors.push(messages.average_score_invalid);

        if (courseDetails.timeStudied === undefined) errors.push(messages.time_studied_not_defined);
        else if (!Number.isInteger(courseDetails.timeStudied)) errors.push(messages.time_studied_invalid);

        return errors;
    }

    private isFloat(n: number){
        return Number(n) === n;
    }
}
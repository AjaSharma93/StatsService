# StatsService

Assumptions:
* One student per session.
* It is assumed that session data can be modified. Hence, upsert sql commands were used.
* It is also assumed that session data isn't pre-existent in the database. Hence the implementation includes the creation of sessions relatied to courses and users if they don't exist in the DB at the time of stats submission. Subsequently, the stats of that particular session is upserted. This uses a transaction based query. 
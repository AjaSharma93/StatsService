FROM mysql
ADD ./config/setup.sql /docker-entrypoint-initdb.d
import mysql from 'mysql2/promise';
export declare function getConnection(): Promise<mysql.Connection>;

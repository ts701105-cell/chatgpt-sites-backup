import {sqliteTable,text,integer,real} from 'drizzle-orm/sqlite-core';
export const employees=sqliteTable('employees',{number:text().primaryKey(),name:text().notNull(),hire:text().notNull(),hash:text().notNull(),salt:text().notNull(),role:text().notNull().default('employee'),mustChange:integer().notNull().default(1)});
export const sessions=sqliteTable('sessions',{token:text().primaryKey(),number:text().notNull(),expires:integer().notNull()});
export const attempts=sqliteTable('attempts',{key:text().primaryKey(),count:integer().notNull(),expires:integer().notNull()});
export const requests=sqliteTable('requests',{id:text().primaryKey(),number:text().notNull(),date:text().notNull(),slot:text().notNull(),units:real().notNull(),type:text().notNull(),reason:text().notNull(),status:text().notNull(),note:text(),created:text().notNull(),reviewed:text()});
export const documents=sqliteTable('documents',{id:text().primaryKey(),requestId:text().notNull(),objectKey:text().notNull(),mime:text().notNull(),size:integer().notNull(),originalType:text().notNull(),newType:text().notNull(),uploadedBy:text().notNull(),created:text().notNull()});

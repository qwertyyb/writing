/*
  Warnings:

  - The primary key for the `Attribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Attribute` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attribute" (
    "docId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    PRIMARY KEY ("docId", "key"),
    CONSTRAINT "Attribute_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attribute" ("docId", "key", "value") SELECT "docId", "key", "value" FROM "Attribute";
DROP TABLE "Attribute";
ALTER TABLE "new_Attribute" RENAME TO "Attribute";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

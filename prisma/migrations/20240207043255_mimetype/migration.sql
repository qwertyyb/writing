/*
  Warnings:

  - Added the required column `mimetype` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "name" TEXT NOT NULL,
    "content" BLOB NOT NULL,
    "mimetype" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL
);
INSERT INTO "new_File" ("content", "createdAt", "name") SELECT "content", "createdAt", "name" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_name_key" ON "File"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

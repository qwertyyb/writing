-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "name" TEXT NOT NULL,
    "content" BLOB NOT NULL,
    "mimetype" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);
INSERT INTO "new_File" ("content", "createdAt", "mimetype", "name") SELECT "content", "createdAt", "mimetype", "name" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
CREATE UNIQUE INDEX "File_name_key" ON "File"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

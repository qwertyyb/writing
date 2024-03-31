-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attribute" (
    "docId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,

    PRIMARY KEY ("docId", "key"),
    CONSTRAINT "Attribute_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Attribute" ("docId", "key", "value") SELECT "docId", "key", "value" FROM "Attribute";
DROP TABLE "Attribute";
ALTER TABLE "new_Attribute" RENAME TO "Attribute";
CREATE TABLE "new_Config" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "comment" TEXT
);
INSERT INTO "new_Config" ("comment", "createdAt", "id", "key", "updatedAt", "value") SELECT "comment", "createdAt", "id", "key", "updatedAt", "value" FROM "Config";
DROP TABLE "Config";
ALTER TABLE "new_Config" RENAME TO "Config";
CREATE UNIQUE INDEX "Config_key_key" ON "Config"("key");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

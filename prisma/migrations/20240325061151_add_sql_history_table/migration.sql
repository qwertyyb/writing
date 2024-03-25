-- CreateTable
CREATE TABLE "SQLHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sql" TEXT NOT NULL,
    "params" TEXT,
    "checksum" TEXT,
    "comment" TEXT
);

-- CreateTable
CREATE TABLE "Attribute" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "docId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "Attribute_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

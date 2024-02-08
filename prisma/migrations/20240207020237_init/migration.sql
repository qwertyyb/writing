-- CreateTable
CREATE TABLE "File" (
    "name" TEXT NOT NULL,
    "content" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "File_name_key" ON "File"("name");

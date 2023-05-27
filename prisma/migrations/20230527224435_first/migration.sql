-- CreateTable
CREATE TABLE "RankRecord" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rankDateId" INTEGER NOT NULL,

    CONSTRAINT "RankRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankDate" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RankRecord_noteId_key" ON "RankRecord"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "RankDate_date_key" ON "RankDate"("date");

-- AddForeignKey
ALTER TABLE "RankRecord" ADD CONSTRAINT "RankRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankRecord" ADD CONSTRAINT "RankRecord_rankDateId_fkey" FOREIGN KEY ("rankDateId") REFERENCES "RankDate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpVerified" BOOLEAN NOT NULL DEFAULT false;

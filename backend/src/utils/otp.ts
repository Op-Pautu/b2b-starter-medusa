import crypto from "crypto"

// Function to generate a random 4-digit OTP
export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Function to hash the OTP using SHA-256
export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

// Function to verify if the provided OTP matches the stored hash
export function verifyOTP(otp: string, hash: string): boolean {
  return hashOTP(otp) === hash
}

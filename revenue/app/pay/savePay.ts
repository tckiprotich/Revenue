"use server";

import { eq, not, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";


// save user transaction
export const saveTransaction = async (transaction: any) => {
  try {
    await db.insert(users).values(transaction).execute();
    revalidatePath("/api/pay");
  } catch (error) {
    console.error(error);
  }
};

// get all records from users table
export const getAllTransactions = async () => {
  try {
    const data = await db.select().from(users);
    return data;
  } catch (error) {
    console.error(error);
  }
};

// Get total revenue
export const getTotalRevenue = async () => {
  try {
    const data = await db.select({ total: sum(users.amount) }).from(users);
    return data[0].total;
  } catch (error) {
    console.error("Error fetching total revenue:", error);
    return null;
  }
};


// Total number of transactions
export const getTotalTransactions = async () => {
  try {
    const count = await db.$count(users);
    return count;
  } catch (error) {
    console.error("Error fetching total transactions:", error);
    return null;
  }
};

import mongoose from 'mongoose';
import { UserModel, IUser } from '@/backend/models/User';
import { GroupModel, IGroup } from '@/backend/models/Group';
import { PaymentModel } from '@/backend/models/Payment';
import { WithdrawalModel } from '@/backend/models/Withdrawal';
import { hashPassword } from '@/lib/auth';

export async function seedDatabase() {
  console.log('Checking if seeding is required...');

  // Check if the admin user already exists. If so, we assume the DB is seeded.
  const adminExists = await UserModel.findOne({ email: 'admin@chitfund.com' });
  if (adminExists) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  console.log('Seeding database...');

  try {
    // Clear existing data (optional, but good for clean slate)
    await UserModel.deleteMany({});
    await GroupModel.deleteMany({});
    await PaymentModel.deleteMany({});
    await WithdrawalModel.deleteMany({});
    console.log('Cleared existing collections.');

    // --- Foreman (Admin) ---
    const hashedPassword = await hashPassword('password123');
    const adminUser = await new UserModel({
        name: "Foreman",
        email: "admin@chitfund.com",
        password: hashedPassword,
        role: "admin",
        phone: "9999999999",
        groups: [],
    }).save();
    console.log('Admin user created.');

    // --- Sample Groups ---
    const groupOne = await new GroupModel({
        name: "Friends & Family Chit",
        amountPerCycle: 5000,
        totalMembers: 20,
        cyclePeriod: "monthly",
        currentCycle: 1,
        ownerId: adminUser._id,
        members: [],
    }).save();

    const groupTwo = await new GroupModel({
        name: "Office Colleagues Fund",
        amountPerCycle: 10000,
        totalMembers: 10,
        cyclePeriod: "monthly",
        currentCycle: 1,
        ownerId: adminUser._id,
        members: [],
    }).save();
    console.log('Sample groups created.');
    
    adminUser.groups.push(groupOne._id, groupTwo._id);
    await adminUser.save();


    // --- Sample Members (as Users with 'user' role) ---
    const membersData: Partial<IUser>[] = [
        { name: "Arun Kumar", phone: "9876543210", telegramId: "arun_k", groups: [groupOne._id] },
        { name: "Bhavna Patel", phone: "9876543211", telegramId: "bhavna_p", groups: [groupOne._id] },
        { name: "Chetan Reddy", phone: "9876543212", groups: [groupOne._id, groupTwo._id] },
        { name: "Divya Sharma", phone: "9876543213", telegramId: "divya_s", groups: [groupTwo._id] },
        { name: "Eshan Singh", phone: "9876543214", groups: [groupTwo._id] }
    ];

    const createdMembers = await UserModel.insertMany(membersData);
    const memberIds = createdMembers.map(m => m._id);
    console.log('Sample members created.');

    // --- Update Groups with Members ---
    await GroupModel.findByIdAndUpdate(groupOne._id, { $set: { members: [memberIds[0], memberIds[1], memberIds[2]] } });
    await GroupModel.findByIdAndUpdate(groupTwo._id, { $set: { members: [memberIds[2], memberIds[3], memberIds[4]] } });
    console.log('Groups updated with members.');

    // --- Sample Payments ---
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();

    await new PaymentModel({
        groupId: groupOne._id,
        memberId: memberIds[0],
        amount: 5000,
        date: new Date(),
        month: currentMonth,
        year: currentYear,
        status: "paid"
    }).save();

    await new PaymentModel({
        groupId: groupOne._id,
        memberId: memberIds[1],
        amount: 5000,
        date: new Date(),
        month: currentMonth,
        year: currentYear,
        status: "paid"
    }).save();
    console.log('Sample payments created.');


    console.log('-------------------------------------------');
    console.log("✅ Database seeding complete!");
    console.log("👤 Admin Login: admin@chitfund.com / password123");
    console.log('-------------------------------------------');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

    
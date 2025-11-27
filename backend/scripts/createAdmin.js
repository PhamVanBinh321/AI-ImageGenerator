import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../db.js';

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();
        
        const email = process.argv[2] || 'admin@example.com';
        const password = process.argv[3] || 'admin123';
        
        // Kiểm tra xem admin đã tồn tại chưa
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            if (existingAdmin.role === 'admin') {
                console.log('Admin user already exists:', email);
                process.exit(0);
            } else {
                // Nếu user tồn tại nhưng chưa phải admin, update role
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('User updated to admin:', email);
                process.exit(0);
            }
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Tạo admin user
        const admin = new User({
            email,
            password: hashedPassword,
            role: 'admin',
            credits: 999999, // Admin có credits không giới hạn
        });
        
        await admin.save();
        
        console.log('✅ Admin user created successfully!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Role: admin');
        console.log('\n⚠️  Please change the password after first login!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();



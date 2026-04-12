import jwt from 'jsonwebtoken';

const secret = "your-super-secret-jwt-key-change-in-production";
const user = {
  id: "1b9c002a-886c-4967-9560-0f9928fd792d",
  email: "demo@example.com",
  role: "admin"
};

const token = jwt.sign(user, secret, { expiresIn: '7d' });
console.log(token);

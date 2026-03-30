import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'admin',
    },
  });

  // Create demo channel
  const channel = await prisma.channel.upsert({
    where: { youtubeId: 'UC_demo_channel' },
    update: {},
    create: {
      youtubeId: 'UC_demo_channel',
      name: 'Demo Gaming Channel',
      description: 'A demo YouTube channel for testing',
      thumbnailUrl: 'https://via.placeholder.com/240x240',
      subscriberCount: 15000,
      viewCount: 500000,
      userId: user.id,
    },
  });

  // Create demo schedules
  const now = new Date();
  const schedules = [
    {
      title: 'Gaming Session - New Release',
      description: 'Playing the latest AAA game release with commentary',
      scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // tomorrow
      duration: 120,
      timezone: 'Asia/Jakarta',
      category: 'Gaming',
      tags: 'gaming,livestream,newgame',
      privacy: 'public',
    },
    {
      title: 'Weekly Q&A with Viewers',
      description: 'Answering viewer questions and community interaction',
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      duration: 90,
      timezone: 'Asia/Jakarta',
      category: 'Entertainment',
      tags: 'qa,community,interactive',
      privacy: 'public',
    },
    {
      title: 'Tutorial: Advanced Streaming Setup',
      description: 'Learn how to setup OBS for professional streaming',
      scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      duration: 60,
      timezone: 'Asia/Jakarta',
      category: 'Education',
      tags: 'tutorial,obs,streaming',
      privacy: 'public',
    },
  ];

  for (const schedule of schedules) {
    await prisma.streamSchedule.create({
      data: {
        ...schedule,
        userId: user.id,
        channelId: channel.id,
      },
    });
  }

  // Create demo metadata
  await prisma.metadata.create({
    data: {
      title: 'Gaming Session Template',
      description: 'Standard description template for gaming sessions\n\n🎮 Playing: [Game Name]\n📅 Schedule: [Time]\n💬 Chat rules: Be respectful!',
      tags: 'gaming,livestream,community',
      categoryId: '20',
      defaultLanguage: 'en',
      privacyStatus: 'public',
      channelId: channel.id,
    },
  });

  // Create demo stream key
  await prisma.streamKey.create({
    data: {
      name: 'OBS Studio Key',
      keyValue: 'xxxx-xxxx-xxxx-xxxx-xxxx',
      serverUrl: 'rtmp://a.rtmp.youtube.com/live2',
      bitrate: 4500,
      resolution: '1920x1080',
      framerate: 60,
      codec: 'h264',
      userId: user.id,
      channelId: channel.id,
    },
  });

  console.log('✅ Database seeded successfully');
  console.log('📧 Demo user: demo@example.com');
  console.log('🔑 Demo password: demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

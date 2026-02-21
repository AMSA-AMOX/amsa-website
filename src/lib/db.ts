import "server-only";
import { Sequelize as SequelizeClass, DataTypes } from "sequelize";

type DbInstance = ReturnType<typeof createDb>;

declare global {
  // eslint-disable-next-line no-var
  var __db: DbInstance | undefined;
}

function createDb() {
  const sequelize = new SequelizeClass(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
      host: process.env.DB_HOST || "127.0.0.1",
      port: Number(process.env.DB_PORT || 3306),
      dialect: "mysql",
      logging: false,
    }
  );

  const User = sequelize.define(
    "User",
    {
      eduEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        field: "email",
      },
      password: { type: DataTypes.STRING, allowNull: false },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.STRING, allowNull: false, defaultValue: "member" },
    },
    { tableName: "Users" }
  );

  const Blog = sequelize.define(
    "Blog",
    {
      title: { type: DataTypes.STRING, allowNull: false },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      content: { type: DataTypes.TEXT, allowNull: false },
      coverImageUrl: DataTypes.STRING,
      authorId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "Blogs" }
  );

  const Announcement = sequelize.define(
    "Announcement",
    {
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      publishedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      authorId: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "Announcements" }
  );

  // Associations
  User.hasMany(Blog, { foreignKey: "authorId" });
  Blog.belongsTo(User, { foreignKey: "authorId" });

  User.hasMany(Announcement, { foreignKey: "authorId" });
  Announcement.belongsTo(User, { foreignKey: "authorId" });

  return { sequelize, Sequelize: SequelizeClass, User, Blog, Announcement };
}

const db: DbInstance =
  global.__db ?? (global.__db = createDb());

let synced = false;

export async function getDb() {
  if (!synced) {
    const syncOptions =
      process.env.NODE_ENV === "production" ? {} : { alter: true };
    await db.sequelize.sync(syncOptions);
    synced = true;
  }
  return db;
}

export const { User, Blog, Announcement } = db;
export default db;

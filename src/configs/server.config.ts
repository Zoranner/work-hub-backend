export const ServerConfig = {
  session: {
    secretKey: `${process.env.BUSINESS_SESSION_SECRET}`,
    expireTime: '72h',
  },
};

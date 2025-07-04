import jwt from 'jsonwebtoken'

export const generateAdminAccessToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      name: admin.name
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  )
}

export const generateAdminRefreshToken = (admin) => {
  return jwt.sign(
    {
      id: admin.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  )
}


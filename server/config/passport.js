import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

// Serialize/deserialize are used only for the transient OAuth handshake session.
// All API authentication uses stateless JWTs.
passport.serializeUser((user, done) => done(null, user._id.toString()));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err);
  }
});

const serverOrigin = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 8080}`;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || `${serverOrigin}/api/auth/google/callback`;

console.log(`[oauth] Google callback URL: ${callbackURL}`);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(new Error('No email returned from Google. Ensure your Google account has a verified email.'), null);
        }

        let user = await User.findOne({ email });

        if (user) {
          // Google has verified this email — mark it verified if not already
          if (!user.isEmailVerified) {
            user.isEmailVerified = true;
            await user.save({ validateBeforeSave: false });
          }
          return done(null, user);
        }

        // New user — assign a random unguessable password so the account cannot
        // be accessed via the regular password login path.
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        user = await User.create({
          name: profile.displayName || email.split('@')[0],
          email,
          password: hashedPassword,
          avatar: profile.photos?.[0]?.value || '',
          isEmailVerified: true,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;

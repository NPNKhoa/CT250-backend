import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
dotenv.config({ path: `${process.cwd()}/.env` });

import { User, UserRole } from '../models/user.model.js';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      try {
        let user = await User.findOne({ googleId: profile.id });

        const customerRole = await UserRole.findOne({ role: 'customer' });

        if (!user) {
          user = new User({
            googleId: profile.id,
            fullname: profile.displayName,
            email: profile.emails && profile.emails.length > 0 ? profile.emails[0].value : '',
            phone: '',
            gender: 'male', // fix this later
            role: customerRole._id,
            avatarImagePath: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          });

          await user.save();
        }

        done(null, user);
      } catch (error) {
        console.log(error);
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate('role');
    done(null, user);
  } catch (error) {
    console.log(error);
    done(error, null);
  }
});

export default passport;

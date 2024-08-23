import mongoose from 'mongoose';

export const isValidObjectId = (id) => {
  return mongoose.isValidObjectId(id);
};

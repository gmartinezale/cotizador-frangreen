import * as bcrypt from "bcryptjs";
import { Document, Schema, model } from "mongoose";

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  name: string;
  validatePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    id: String,
    email: String,
    password: String,
    name: String,
  },
  { timestamps: true },
);

UserSchema.pre<IUser>("save", async function (next) {
  const thisUser = this as IUser;
  if (!thisUser.isModified("password") || !thisUser.password) return next();
  const salt = await bcrypt.genSalt(12); // Incrementado de 5 a 12 para mayor seguridad
  const hash = await bcrypt.hash(thisUser.password, salt);
  thisUser.password = hash;
  next();
});

UserSchema.methods.validatePassword = async function (pass: string) {
  const thisEmployee = this as IUser;
  if (!thisEmployee.password) return false;
  return bcrypt.compare(pass, thisEmployee.password);
};

let User: any;
try {
  User = model("User");
} catch (error) {
  User = model<IUser>("User", UserSchema);
}
export default User;

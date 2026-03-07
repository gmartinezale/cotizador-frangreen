export type Category = {
  _id?: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CategoryDoc = {
  _id: string;
  name: string;
};
